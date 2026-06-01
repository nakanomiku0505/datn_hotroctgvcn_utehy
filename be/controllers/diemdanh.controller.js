const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sinhVienId = req.query.sinhVienId || '';
        const lopId = req.query.lopId || '';
        const ngay = req.query.ngay || '';

        let query = 'SELECT * FROM diem_danh WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM diem_danh WHERE 1=1';
        const queryParams = [];
        const countParams = [];

        if (sinhVienId) {
            query += ' AND sinhVienId = ?';
            countQuery += ' AND sinhVienId = ?';
            queryParams.push(sinhVienId);
            countParams.push(sinhVienId);
        }
        if (lopId) {
            query += ' AND lopId = ?';
            countQuery += ' AND lopId = ?';
            queryParams.push(lopId);
            countParams.push(lopId);
        }
        if (ngay) {
            query += ' AND ngay = ?';
            countQuery += ' AND ngay = ?';
            queryParams.push(ngay);
            countParams.push(ngay);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getByLop = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM diem_danh WHERE lopId = ?', [req.params.lopId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getBySinhVien = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM diem_danh WHERE sinhVienId = ?', [req.params.svId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { sinhVienId, lopId, ngay, thu, buoi, trangThai } = req.body;

        // --- Kiểm tra quyền hạn ---
        if (req.userRole === 2) {
            return res.status(403).json({ message: 'Trưởng bộ môn/khoa không có quyền thực hiện điểm danh' });
        }

        if (req.userRole === 1) {
            const [lop] = await db.query('SELECT gvcNId FROM lop WHERE id = ?', [lopId]);
            if (lop.length === 0 || lop[0].gvcNId !== req.userId) {
                return res.status(403).json({ message: 'Bạn không có quyền điểm danh cho lớp này' });
            }
        }

        if (req.userRole === 4) {
            const [sv] = await db.query('SELECT id FROM sinh_vien WHERE user_id = ?', [req.userId]);
            const [lop] = await db.query('SELECT lopTruongId FROM lop WHERE id = ?', [lopId]);
            if (lop.length === 0 || sv.length === 0 || lop[0].lopTruongId !== sv[0].id) {
                return res.status(403).json({ message: 'Bạn không có quyền điểm danh cho lớp này' });
            }
        }
        // --- Kết thúc kiểm tra ---

        const [result] = await db.query(
            'INSERT INTO diem_danh (sinhVienId, lopId, ngay, thu, buoi, trangThai) VALUES (?, ?, ?, ?, ?, ?)',
            [sinhVienId, lopId, ngay, thu, buoi, trangThai]
        );
        res.status(201).json({ message: 'Điểm danh thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { sinhVienId, lopId, ngay, thu, buoi, trangThai } = req.body;

        // --- Kiểm tra quyền hạn ---
        if (req.userRole === 2) {
            return res.status(403).json({ message: 'Trưởng bộ môn/khoa không có quyền thực hiện điểm danh' });
        }

        if (req.userRole === 1) {
            const [lop] = await db.query('SELECT gvcNId FROM lop WHERE id = ?', [lopId]);
            if (lop.length === 0 || lop[0].gvcNId !== req.userId) {
                return res.status(403).json({ message: 'Bạn không có quyền cập nhật điểm danh cho lớp này' });
            }
        }

        if (req.userRole === 4) {
            const [sv] = await db.query('SELECT id FROM sinh_vien WHERE user_id = ?', [req.userId]);
            const [lop] = await db.query('SELECT lopTruongId FROM lop WHERE id = ?', [lopId]);
            if (lop.length === 0 || sv.length === 0 || lop[0].lopTruongId !== sv[0].id) {
                return res.status(403).json({ message: 'Bạn không có quyền cập nhật điểm danh cho lớp này' });
            }
        }
        // --- Kết thúc kiểm tra ---

        const [result] = await db.query(
            'UPDATE diem_danh SET sinhVienId=?, lopId=?, ngay=?, thu=?, buoi=?, trangThai=? WHERE id=?',
            [sinhVienId, lopId, ngay, thu, buoi, trangThai, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM diem_danh WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Thống kê nghỉ học: trả về số buổi nghỉ của mỗi sinh viên trong lớp, kèm SĐT phụ huynh
exports.getAbsenceSummary = async (req, res) => {
    try {
        const { lopId, tuNgay, denNgay } = req.query;
        if (!lopId) return res.status(400).json({ message: 'Thiếu lopId' });

        const params = [lopId, lopId];
        let dateFilter = '';
        if (tuNgay) {
            dateFilter += ' AND dd.ngay >= ?';
            params.push(tuNgay);
        }
        if (denNgay) {
            dateFilter += ' AND dd.ngay <= ?';
            params.push(denNgay);
        }

        const [rows] = await db.query(`
            SELECT 
                sv.id, sv.maSV, sv.hoTen, sv.dienThoaiCaNhan, sv.dienThoaiNR,
                sv.hoTenBo, sv.dienThoaiBo,
                sv.hoTenMe, sv.dienThoaiMe,
                SUM(CASE WHEN dd.trangThai IN ('Nghỉ không phép', 'Nghỉ phép', 'Đi muộn') THEN 1 ELSE 0 END) as tongNghi,
                SUM(CASE WHEN dd.trangThai = 'Nghỉ không phép' THEN 1 ELSE 0 END) as nghiKhongPhep,
                SUM(CASE WHEN dd.trangThai = 'Nghỉ phép' THEN 1 ELSE 0 END) as nghiPhep,
                SUM(CASE WHEN dd.trangThai = 'Đi muộn' THEN 1 ELSE 0 END) as diMuon,
                SUM(CASE WHEN dd.trangThai = 'Có mặt' THEN 1 ELSE 0 END) as coMat
            FROM sinh_vien sv
            INNER JOIN lop_sinhvien lsv ON lsv.sinhvien_id = sv.id AND lsv.lop_id = ?
            LEFT JOIN diem_danh dd ON dd.sinhVienId = sv.id AND dd.lopId = ? 
                ${dateFilter}
            GROUP BY sv.id
            ORDER BY tongNghi DESC, nghiKhongPhep DESC
        `, params);

        res.status(200).json({ data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const ExcelJS = require('exceljs');
exports.exportExcel = async (req, res) => {
    try {
        const { lopId, thang } = req.query; // thang=8
        
        if (!lopId) {
            return res.status(400).json({ message: 'Vui lòng chọn lớp để xuất Excel' });
        }

        const [lopRows] = await db.query('SELECT tenLop FROM lop WHERE id = ?', [lopId]);
        if (lopRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lớp' });
        }
        const tenLop = lopRows[0].tenLop;

        const [svRows] = await db.query(
            `SELECT sv.id, sv.maSV, sv.hoTen 
             FROM sinh_vien sv
             JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id
             WHERE ls.lop_id = ?`,
            [lopId]
        );
        
        svRows.sort((a, b) => {
            const getNameParts = (name) => {
                const parts = (name || '').trim().split(' ');
                const last = parts.pop();
                const rest = parts.join(' ');
                return { last, rest };
            };
            const nameA = getNameParts(a.hoTen);
            const nameB = getNameParts(b.hoTen);
            const cmp = nameA.last.localeCompare(nameB.last, 'vi');
            if (cmp !== 0) return cmp;
            return nameA.rest.localeCompare(nameB.rest, 'vi');
        });

        const svIds = svRows.map(s => s.id);
        const [ddRows] = await db.query(
            `SELECT sinhVienId, ngay, thu, buoi, trangThai 
             FROM diem_danh 
             WHERE lopId = ? AND sinhVienId IN (?)`,
            [lopId, svIds.length > 0 ? svIds : [0]]
        );
        const thangVal = parseInt(thang || 8);
        const nam = req.query.nam ? parseInt(req.query.nam) : 2026; // Lấy từ query hoặc mặc định 2026

        // Lọc điểm danh đúng tháng và tạo danh sách các buổi học duy nhất
        const recordsThisMonth = [];
        const distinctSessionsMap = {};
        
        ddRows.forEach(r => {
            const dateObj = new Date(r.ngay);
            // Sửa lỗi timezone
            const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
            if (localDate.getMonth() + 1 === thangVal && localDate.getFullYear() === nam) {
                recordsThisMonth.push(r);
                
                const dateStr = localDate.toISOString().split('T')[0];
                const key = `${dateStr}_${r.buoi}`;
                if (!distinctSessionsMap[key]) {
                    const dayOfMonth = localDate.getDate();
                    const weekNum = Math.ceil(dayOfMonth / 7);
                    distinctSessionsMap[key] = { dateStr, thu: r.thu, buoi: r.buoi, dayOfMonth, weekNum };
                }
            }
        });

        const buoiOrder = { 'Sáng': 1, 'Chiều': 2, 'Tối': 3, 'Cả ngày': 4 };
        let distinctSessions = Object.values(distinctSessionsMap).sort((a, b) => {
            if (a.dateStr === b.dateStr) {
                const orderA = buoiOrder[a.buoi] || 99;
                const orderB = buoiOrder[b.buoi] || 99;
                return orderA - orderB;
            }
            return a.dateStr.localeCompare(b.dateStr);
        });

        // Fallback if no records exist: Generate a generic 5-week T2-T7 template
        if (distinctSessions.length === 0) {
            const defaultDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            for (let w = 1; w <= 5; w++) {
                defaultDays.forEach((d, i) => {
                    distinctSessions.push({
                        dateStr: `fallback_w${w}_d${i}`,
                        thu: d,
                        buoi: 'Cả ngày',
                        dayOfMonth: w * 7,
                        weekNum: w
                    });
                });
            }
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`Tháng ${thangVal}`);

        const totalCols = 3 + distinctSessions.length;
        const maxCol = totalCols < 7 ? 7 : totalCols;
        
        sheet.mergeCells(1, 1, 1, maxCol);
        const title = sheet.getCell(1, 1);
        title.value = `ĐIỂM DANH THÁNG ${thangVal} - LỚP ${tenLop}`;
        title.font = { name: 'Times New Roman', size: 20, bold: true };
        title.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;

        sheet.mergeCells('A4:A5'); sheet.getCell('A4').value = 'STT';
        sheet.mergeCells('B4:B5'); sheet.getCell('B4').value = 'Họ Tên';
        sheet.mergeCells('C4:C5'); sheet.getCell('C4').value = 'Mã Sinh Viên';

        let colIndex = 4;
        distinctSessions.forEach(s => {
            // Row 4: Ngày/Tháng (bỏ Tuần)
            const parts = s.dateStr.split('-');
            sheet.getCell(4, colIndex).value = `${parts[2]}/${parts[1]}`;
            
            // Row 5: Thứ (Buổi)
            const headerText = s.buoi && s.buoi !== 'Cả ngày' ? `${s.thu}(${s.buoi})` : s.thu;
            sheet.getCell(5, colIndex).value = headerText;
            
            s.colIndex = colIndex;
            colIndex++;
        });

        for(let r=4; r<=5; r++) {
            sheet.getRow(r).eachCell(c => {
                c.font = { name: 'Times New Roman', size: 12, bold: true };
                c.alignment = { horizontal: 'center', vertical: 'middle' };
                c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            });
        }

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 25;
        sheet.getColumn(3).width = 15;
        for(let c=4; c<colIndex; c++) sheet.getColumn(c).width = 15;

        const startRow = 6;
        svRows.forEach((sv, idx) => {
            const r = sheet.getRow(startRow + idx);
            r.getCell(1).value = idx + 1;
            r.getCell(2).value = sv.hoTen;
            r.getCell(3).value = sv.maSV;

            const svRecords = recordsThisMonth.filter(d => d.sinhVienId === sv.id);
            svRecords.forEach(rec => {
                const dateObj = new Date(rec.ngay);
                const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
                const dateStr = localDate.toISOString().split('T')[0];
                
                const session = distinctSessions.find(s => s.dateStr === dateStr && s.buoi === rec.buoi);
                if (session) {
                    let mark = '';
                    if (rec.trangThai === 'Có mặt') mark = 'H';
                    else if (rec.trangThai === 'Nghỉ không phép') mark = 'K';
                    else if (rec.trangThai === 'Đi muộn') mark = 'M';
                    else if (rec.trangThai === 'Nghỉ phép') mark = 'CP';
                    r.getCell(session.colIndex).value = mark;
                }
            });
            
            r.eachCell({ includeEmpty: true }, (c, colNum) => {
                if(colNum < Math.max(colIndex, 4)) {
                    c.font = { name: 'Times New Roman', size: 12 };
                    c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    if (colNum >= 4) c.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        });

        const sumRow = startRow + svRows.length + 2;
        sheet.mergeCells(`A${sumRow}:C${sumRow+1}`);
        sheet.getCell(`A${sumRow}`).value = `Tổng kết tháng ${thangVal}`;
        sheet.getCell(`A${sumRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getCell(`A${sumRow}`).font = { name: 'Times New Roman', size: 14, bold: true };
        sheet.getCell(`A${sumRow}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        
        const sumHeaders = ['Có mặt (H)', 'Nghỉ không phép (K)', 'Đi muộn (M)', 'Nghỉ phép (CP)'];
        sumHeaders.forEach((h, i) => {
            const c = sheet.getCell(sumRow, 4 + i);
            c.value = h;
            c.font = { name: 'Times New Roman', size: 12, bold: true };
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            
            const c2 = sheet.getCell(sumRow+1, 4 + i);
            c2.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            sheet.mergeCells(sumRow, 4+i, sumRow+1, 4+i);
        });

        const endDataCol = colIndex - 1;
        const endDataColLetter = endDataCol >= 4 ? sheet.getColumn(endDataCol).letter : 'D';

        svRows.forEach((sv, idx) => {
            const rowIdx = sumRow + 2 + idx;
            const rSum = sheet.getRow(rowIdx);
            
            rSum.getCell(1).value = idx + 1;
            rSum.getCell(2).value = sv.hoTen;
            rSum.getCell(3).value = sv.maSV;
            
            if (endDataCol >= 4) {
                rSum.getCell(4).value = { formula: `COUNTIF(D${6+idx}:${endDataColLetter}${6+idx}, "H")` };
                rSum.getCell(5).value = { formula: `COUNTIF(D${6+idx}:${endDataColLetter}${6+idx}, "K")` };
                rSum.getCell(6).value = { formula: `COUNTIF(D${6+idx}:${endDataColLetter}${6+idx}, "M")` };
                rSum.getCell(7).value = { formula: `COUNTIF(D${6+idx}:${endDataColLetter}${6+idx}, "CP")` };
            } else {
                rSum.getCell(4).value = 0;
                rSum.getCell(5).value = 0;
                rSum.getCell(6).value = 0;
                rSum.getCell(7).value = 0;
            }

            for(let c=1; c<=7; c++) {
                rSum.getCell(c).font = { name: 'Times New Roman', size: 12 };
                rSum.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                if(c===1 || c>=4) rSum.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
            }
        });
        // Bảng chú thích (Legend) đặt cạnh bảng tổng kết (Cột I - index 9)
        const legendStartCol = 9;
        sheet.getCell(sumRow, legendStartCol).value = 'Ghi chú (Chú thích):';
        sheet.getCell(sumRow, legendStartCol).font = { name: 'Times New Roman', size: 12, bold: true, italic: true };

        const legends = [
            'H: Có mặt',
            'K: Nghỉ không phép',
            'M: Đi muộn',
            'CP: Nghỉ phép'
        ];

        legends.forEach((text, i) => {
            const cell = sheet.getCell(sumRow + 1 + i, legendStartCol);
            cell.value = text;
            cell.font = { name: 'Times New Roman', size: 12, italic: true };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Diem_Danh_${tenLop}_Thang_${thangVal}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xuất Excel', error: error.message });
    }
};
