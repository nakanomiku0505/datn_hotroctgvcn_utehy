const db = require('../config/db');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sinhVienId = req.query.sinhVienId || '';
        const hocKy = req.query.hocKy || '';
        const namHoc = req.query.namHoc || '';
        const lopId = req.query.lopId || '';

        let query = 'SELECT drl.* FROM diem_ren_luyen drl';
        let countQuery = 'SELECT COUNT(drl.id) as total FROM diem_ren_luyen drl';
        const queryParams = [];
        const countParams = [];

        if (lopId) {
            query += ' JOIN lop_sinhvien ls ON drl.sinhVienId = ls.sinhvien_id';
            countQuery += ' JOIN lop_sinhvien ls ON drl.sinhVienId = ls.sinhvien_id';
        }

        query += ' WHERE 1=1';
        countQuery += ' WHERE 1=1';

        if (sinhVienId) {
            query += ' AND drl.sinhVienId = ?';
            countQuery += ' AND drl.sinhVienId = ?';
            queryParams.push(sinhVienId);
            countParams.push(sinhVienId);
        }
        if (hocKy) {
            query += ' AND drl.hocKy = ?';
            countQuery += ' AND drl.hocKy = ?';
            queryParams.push(hocKy);
            countParams.push(hocKy);
        }
        if (namHoc) {
            query += ' AND drl.namHoc = ?';
            countQuery += ' AND drl.namHoc = ?';
            queryParams.push(namHoc);
            countParams.push(namHoc);
        }
        if (lopId) {
            query += ' AND ls.lop_id = ?';
            countQuery += ' AND ls.lop_id = ?';
            queryParams.push(lopId);
            countParams.push(lopId);
        }

        query += ' ORDER BY drl.id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        if (rows.length > 0) {
            const drlIds = rows.map(r => r.id);
            const [details] = await db.query(`SELECT * FROM chi_tiet_ren_luyen WHERE diemRenLuyenId IN (?)`, [drlIds]);
            rows.forEach(r => {
                r.chiTiet = details.filter(d => d.diemRenLuyenId === r.id);
            });
        }

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

exports.getBySinhVien = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM diem_ren_luyen WHERE sinhVienId = ?', [req.params.svId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { sinhVienId, hocKy, namHoc, tongDiem, xepLoai } = req.body;
        const [result] = await db.query(
            'INSERT INTO diem_ren_luyen (sinhVienId, hocKy, namHoc, tongDiem, xepLoai) VALUES (?, ?, ?, ?, ?)',
            [sinhVienId, hocKy, namHoc, tongDiem, xepLoai]
        );
        res.status(201).json({ message: 'Tạo điểm rèn luyện thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { sinhVienId, hocKy, namHoc, tongDiem, xepLoai } = req.body;
        const [result] = await db.query(
            'UPDATE diem_ren_luyen SET sinhVienId=?, hocKy=?, namHoc=?, tongDiem=?, xepLoai=? WHERE id=?',
            [sinhVienId, hocKy, namHoc, tongDiem, xepLoai, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy điểm rèn luyện' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM diem_ren_luyen WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy điểm rèn luyện' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.deleteByLopId = async (req, res) => {
    try {
        const lopId = req.params.lopId;
        await db.query(
            `DELETE ctrl FROM chi_tiet_ren_luyen ctrl
             JOIN diem_ren_luyen drl ON ctrl.diemRenLuyenId = drl.id
             JOIN lop_sinhvien ls ON drl.sinhVienId = ls.sinhvien_id
             WHERE ls.lop_id = ?`, [lopId]
        );
        const [result] = await db.query(
            `DELETE drl FROM diem_ren_luyen drl 
             JOIN lop_sinhvien ls ON drl.sinhVienId = ls.sinhvien_id 
             WHERE ls.lop_id = ?`,
            [lopId]
        );
        res.status(200).json({ message: `Đã xóa thành công ${result.affectedRows} bản ghi điểm rèn luyện của lớp này` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.saveBatch = async (req, res) => {
    try {
        const { lopId, hocKy, namHoc, data } = req.body;
        // data is array of { sinhVienId, tc1, tc2, tc3, tc4, tc5, tongDiem, xepLoai }

        if (!lopId || !data || !Array.isArray(data)) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }

        let savedCount = 0;
        for (let item of data) {
            const { sinhVienId, tc, tongDiem, xepLoai } = item;
            // tc is an object containing tc1_1, tc1_2, ... tc5_2

            // Delete old record if exists
            const [oldDrl] = await db.query('SELECT id FROM diem_ren_luyen WHERE sinhVienId = ? AND hocKy = ? AND namHoc = ?', [sinhVienId, hocKy, namHoc]);
            if (oldDrl.length > 0) {
                await db.query('DELETE FROM chi_tiet_ren_luyen WHERE diemRenLuyenId = ?', [oldDrl[0].id]);
                await db.query('DELETE FROM diem_ren_luyen WHERE id = ?', [oldDrl[0].id]);
            }

            // Insert new record
            const [result] = await db.query(
                'INSERT INTO diem_ren_luyen (sinhVienId, hocKy, namHoc, tongDiem, xepLoai) VALUES (?, ?, ?, ?, ?)',
                [sinhVienId, hocKy, namHoc, tongDiem, xepLoai]
            );
            const drlId = result.insertId;

            // Insert 19 sub-details
            const detailsToInsert = [
                ['TC1.1', 'Ý thức và thái độ trong học tập', tc.tc1_1, 5],
                ['TC1.2', 'Tham gia CLB học thuật, NCKH', tc.tc1_2, 3],
                ['TC1.3', 'Tham gia các kỳ thi, cuộc thi', tc.tc1_3, 2],
                ['TC1.4', 'Tinh thần vượt khó, vươn lên', tc.tc1_4, 4],
                ['TC1.5', 'Kết quả học tập', tc.tc1_5, 6],

                ['TC2.1', 'Ý thức chấp hành văn bản, chỉ đạo của nhà trường', tc.tc2_1, 3],
                ['TC2.2', 'Ý thức thực hiện quy chế thi, kiểm tra', tc.tc2_2, 4],
                ['TC2.3', 'Nghĩa vụ của SV (học phí, BH)', tc.tc2_3, 6],
                ['TC2.4', 'Quy chế nội trú, ngoại trú', tc.tc2_4, 4],
                ['TC2.5', 'Vệ sinh môi trường, nơi ở', tc.tc2_5, 4],
                ['TC2.6', 'Trau dồi kỹ năng sống', tc.tc2_6, 4],

                ['TC3.1', 'Tham gia sinh hoạt tuần công dân...', tc.tc3_1, 10],
                ['TC3.2', 'Hoạt động công ích, tình nguyện', tc.tc3_2, 5],
                ['TC3.3', 'Tham gia tuyên truyền', tc.tc3_3, 5],

                ['TC4.1', 'Ý thức chấp hành chủ trương của Đảng', tc.tc4_1, 10],
                ['TC4.2', 'Hoạt động xã hội', tc.tc4_2, 7],
                ['TC4.3', 'Công tác từ thiện', tc.tc4_3, 8],

                ['TC5.1', 'Cán bộ lớp, đoàn', tc.tc5_1, 10],
                ['TC5.2', 'SV đạt thành tích đặc biệt', tc.tc5_2, 10]
            ];

            for (let d of detailsToInsert) {
                await db.query('INSERT INTO chi_tiet_ren_luyen (diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa) VALUES (?, ?, ?, ?, ?)', [drlId, d[0], d[1], d[2] || 0, d[3]]);
            }

            savedCount++;
        }

        res.status(200).json({ message: `Đã lưu thành công ${savedCount} điểm rèn luyện`, savedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.exportTemplate = async (req, res) => {
    try {
        const { lopId, hocKy, namHoc } = req.query;
        if (!lopId) return res.status(400).json({ message: 'Thiếu lopId' });

        const [lopRows] = await db.query('SELECT tenLop FROM lop WHERE id = ?', [lopId]);
        if (lopRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy lớp' });
        const tenLop = lopRows[0].tenLop;

        const [svRows] = await db.query(
            `SELECT sv.id, sv.maSV, sv.hoTen, DATE_FORMAT(sv.ngaySinh, '%d/%m/%Y') as ngaySinh 
             FROM sinh_vien sv 
             JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id 
             WHERE ls.lop_id = ?
             ORDER BY sv.hoTen ASC`, 
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

        const [drlRows] = await db.query(
            `SELECT 
                drl.sinhVienId, 
                drl.tongDiem, 
                drl.xepLoai,
                SUM(CASE WHEN ctrl.tieuChi LIKE 'TC1.%' THEN ctrl.diem ELSE 0 END) as TC1,
                SUM(CASE WHEN ctrl.tieuChi LIKE 'TC2.%' THEN ctrl.diem ELSE 0 END) as TC2,
                SUM(CASE WHEN ctrl.tieuChi LIKE 'TC3.%' THEN ctrl.diem ELSE 0 END) as TC3,
                SUM(CASE WHEN ctrl.tieuChi LIKE 'TC4.%' THEN ctrl.diem ELSE 0 END) as TC4,
                SUM(CASE WHEN ctrl.tieuChi LIKE 'TC5.%' THEN ctrl.diem ELSE 0 END) as TC5
            FROM diem_ren_luyen drl
            LEFT JOIN chi_tiet_ren_luyen ctrl ON drl.id = ctrl.diemRenLuyenId
            WHERE drl.hocKy = ? AND drl.namHoc = ? 
            GROUP BY drl.id`,
            [hocKy || 1, namHoc || '2025-2026']
        );

        const drlMap = {};
        drlRows.forEach(r => { drlMap[r.sinhVienId] = r; });

        const svIds = svRows.map(sv => sv.id);
        const [allCtrlRows] = await db.query(
            `SELECT drl.sinhVienId, ctrl.tieuChi, ctrl.diem 
             FROM diem_ren_luyen drl
             JOIN chi_tiet_ren_luyen ctrl ON drl.id = ctrl.diemRenLuyenId
             WHERE drl.hocKy = ? AND drl.namHoc = ? AND drl.sinhVienId IN (?)`,
            [hocKy || 1, namHoc || '2025-2026', svIds.length > 0 ? svIds : [0]]
        );
        
        const pointMap = {};
        allCtrlRows.forEach(r => {
            if (!pointMap[r.sinhVienId]) pointMap[r.sinhVienId] = {};
            const code = r.tieuChi.replace('.', '_').toLowerCase(); 
            pointMap[r.sinhVienId][code] = r.diem;
        });

        const [kqRows] = await db.query(
            `SELECT kq.sinhVienId, kq.diem10, kq.diemChu, mh.soTinChi 
             FROM ket_qua_hoc_tap kq
             JOIN mon_hoc mh ON kq.monHocId = mh.id
             JOIN lop_sinhvien ls ON kq.sinhVienId = ls.sinhvien_id
             WHERE ls.lop_id = ? AND kq.hocKy = ?`,
            [lopId, hocKy || 1]
        );
        
        const gpaMap = {};
        kqRows.forEach(k => {
            if (!gpaMap[k.sinhVienId]) {
                gpaMap[k.sinhVienId] = { sumDiem: 0, tongTC: 0, tcNo: 0 };
            }
            const sg = gpaMap[k.sinhVienId];
            const tc = parseInt(k.soTinChi) || 0;
            const d10 = parseFloat(k.diem10);

            sg.tongTC += tc;
            if (!isNaN(d10)) {
                sg.sumDiem += d10 * tc;
                if (d10 < 4.0 || k.diemChu === 'F') {
                    sg.tcNo += tc;
                }
            } else if (k.diemChu === 'F') {
                sg.tcNo += tc;
            }
        });
        
        Object.keys(gpaMap).forEach(svId => {
            const sg = gpaMap[svId];
            sg.diemTB = sg.tongTC > 0 ? parseFloat((sg.sumDiem / sg.tongTC).toFixed(2)) : 0;
        });

        const templatePath = path.join(__dirname, '../assets/Tong hop KQRL_mau NH2025-2026 (chuan).xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // Remove DTB sheet
        const dtbSheet = workbook.getWorksheet('DTB');
        if (dtbSheet) workbook.removeWorksheet(dtbSheet.id);

        // Fill TC1 to TC5
        const fillTC = (sheetName, startRow, tcCols) => {
            const sheet = workbook.getWorksheet(sheetName);
            if (!sheet) return;
            
            const templateRow = sheet.getRow(startRow);
            
            svRows.forEach((sv, idx) => {
                const r = sheet.getRow(startRow + idx);
                r.height = templateRow.height;
                
                // Copy styles for new rows
                if (idx > 0) {
                    templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const newCell = r.getCell(colNumber);
                        if (!newCell.style || Object.keys(newCell.style).length === 0) {
                            newCell.style = cell.style;
                        }
                    });
                }

                r.getCell(1).value = idx + 1;
                r.getCell(2).value = sv.maSV;
                r.getCell(3).value = sv.hoTen;
                
                const pts = pointMap[sv.id] || {};
                const drl = drlMap[sv.id] || {};
                
                tcCols.forEach(tc => {
                    if (tc.key === 'tong') {
                         r.getCell(tc.col).value = Number(drl[tc.drlKey]) || 0;
                    } else if (tc.key === 'tc1_diemtb') {
                         r.getCell(tc.col).value = gpaMap[sv.id] ? gpaMap[sv.id].diemTB : 0;
                    } else if (tc.key === 'tc1_tcno') {
                         const tcNo = gpaMap[sv.id] ? gpaMap[sv.id].tcNo : 0;
                         r.getCell(tc.col).value = tcNo === 0 ? '' : tcNo;
                    } else if (tc.key === 'tc1_phan_tram') {
                         const sg = gpaMap[sv.id];
                         if (sg && sg.tcNo > 0 && sg.tongTC > 0) {
                             r.getCell(tc.col).value = `${((sg.tcNo / sg.tongTC) * 100).toFixed(1)}%`;
                         } else {
                             r.getCell(tc.col).value = '';
                         }
                    } else if (tc.key) {
                         r.getCell(tc.col).value = Number(pts[tc.key]) || 0;
                    }
                });
                
                r.commit();
            });
        };

        fillTC('Điểm TC 1', 3, [
            { col: 4, key: 'tc1_diemtb' },
            { col: 5, key: 'tc1_tcno' },
            { col: 6, key: 'tc1_phan_tram' },
            { col: 7, key: 'tc1_1' },
            { col: 8, key: 'tc1_2' },
            { col: 9, key: 'tc1_3' },
            { col: 10, key: 'tc1_4' },
            { col: 11, key: 'tc1_5' },
            { col: 12, key: 'tong', drlKey: 'TC1' }
        ]);

        fillTC('Điểm TC 2', 3, [
            { col: 4, key: 'tc2_1' },
            { col: 5, key: 'tc2_2' },
            { col: 6, key: 'tc2_3' },
            { col: 7, key: 'tc2_4' },
            { col: 8, key: 'tc2_5' },
            { col: 9, key: 'tc2_6' },
            { col: 10, key: 'tong', drlKey: 'TC2' }
        ]);

        fillTC('Điểm TC 3', 3, [
            { col: 4, key: 'tc3_1' },
            { col: 5, key: 'tc3_2' },
            { col: 6, key: 'tc3_3' },
            { col: 7, key: 'tong', drlKey: 'TC3' }
        ]);

        fillTC('Điểm TC 4', 3, [
            { col: 4, key: 'tc1_diemtb' },
            { col: 5, key: 'tc4_1' },
            { col: 6, key: 'tc4_2' },
            { col: 7, key: 'tc4_3' },
            { col: 8, key: 'tong', drlKey: 'TC4' }
        ]);

        fillTC('Điểm TC 5', 3, [
            { col: 4, key: 'tc1_diemtb' },
            { col: 5, key: 'tc5_1' },
            { col: 6, key: 'tc5_2' },
            { col: 7, key: 'tong', drlKey: 'TC5' }
        ]);

        // 3. Fill Mau THKQRL
        const sheet = workbook.getWorksheet('Mau THKQRL');

        sheet.getCell('B5').value = lopId;
        sheet.getCell('C5').value = `Tên lớp: ${tenLop}`;
        if (hocKy) sheet.getCell('E5').value = `Học kỳ: ${hocKy}`;
        if (namHoc) sheet.getCell('G5').value = `Năm học: ${namHoc}`;

        const rowsNeeded = svRows.length;
        if (rowsNeeded > 32) {
            const insertCount = rowsNeeded - 32;
            sheet.spliceRows(39, 0, ...Array.from({length: insertCount}, () => []));
            for (let i = 0; i < insertCount; i++) {
                const newRow = sheet.getRow(39 + i);
                const templateRow = sheet.getRow(7);
                newRow.height = templateRow.height;
                templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);
                    newCell.style = cell.style;
                });
            }
        } else if (rowsNeeded < 32) {
            const removeCount = 32 - rowsNeeded;
            sheet.spliceRows(39 - removeCount, removeCount);
        }

        const newEndRow = 6 + rowsNeeded;
        const summaryStart = rowsNeeded > 32 ? 39 + (rowsNeeded - 32) : 39 - (32 - rowsNeeded);
        
        for (let i = summaryStart; i <= summaryStart + 15; i++) {
            sheet.getRow(i).eachCell({ includeEmpty: true }, (cell) => {
                if (cell.formula) {
                    const newFormula = cell.formula.replace(/\$38/g, `$${newEndRow}`);
                    cell.value = { formula: newFormula, result: undefined };
                }
            });
        }

        const startRow = 7;
        svRows.forEach((sv, idx) => {
            const r = sheet.getRow(startRow + idx);
            r.getCell(1).value = idx + 1; // STT
            r.getCell(2).value = sv.maSV;
            r.getCell(3).value = sv.hoTen;
            r.getCell(4).value = sv.ngaySinh;

            const drl = drlMap[sv.id];
            if (drl) {
                r.getCell(5).value = Number(drl.TC1);
                r.getCell(6).value = Number(drl.TC2);
                r.getCell(7).value = Number(drl.TC3);
                r.getCell(8).value = Number(drl.TC4);
                r.getCell(9).value = Number(drl.TC5);
                r.getCell(10).value = Number(drl.tongDiem);
                r.getCell(11).value = drl.xepLoai;
            } else {
                r.getCell(5).value = null;
                r.getCell(6).value = null;
                r.getCell(7).value = null;
                r.getCell(8).value = null;
                r.getCell(9).value = null;
                r.getCell(10).value = null;
                r.getCell(11).value = null;
            }
            r.commit();
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Bang_THKQRL_${tenLop}_HK${hocKy}_${namHoc}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Excel Error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
