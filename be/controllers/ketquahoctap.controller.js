const db = require('../config/db');
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

        let query = 'SELECT kq.*, m.tenMon, m.soTinChi FROM ket_qua_hoc_tap kq JOIN mon_hoc m ON kq.monHocId = m.id';
        let countQuery = 'SELECT COUNT(kq.id) as total FROM ket_qua_hoc_tap kq';
        const queryParams = [];
        const countParams = [];

        if (lopId) {
            query += ' JOIN lop_sinhvien ls ON kq.sinhVienId = ls.sinhvien_id';
            countQuery += ' JOIN lop_sinhvien ls ON kq.sinhVienId = ls.sinhvien_id';
        }

        query += ' WHERE 1=1';
        countQuery += ' WHERE 1=1';

        if (sinhVienId) {
            query += ' AND kq.sinhVienId = ?';
            countQuery += ' AND kq.sinhVienId = ?';
            queryParams.push(sinhVienId);
            countParams.push(sinhVienId);
        }
        if (hocKy) {
            query += ' AND kq.hocKy = ?';
            countQuery += ' AND kq.hocKy = ?';
            queryParams.push(hocKy);
            countParams.push(hocKy);
        }
        if (namHoc) {
            query += ' AND kq.namHoc = ?';
            countQuery += ' AND kq.namHoc = ?';
            queryParams.push(namHoc);
            countParams.push(namHoc);
        }
        if (lopId) {
            query += ' AND ls.lop_id = ?';
            countQuery += ' AND ls.lop_id = ?';
            queryParams.push(lopId);
            countParams.push(lopId);
        }

        query += ' ORDER BY kq.id DESC LIMIT ? OFFSET ?';
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

exports.getBySinhVienId = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ket_qua_hoc_tap WHERE sinhVienId = ?', [req.params.svId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai } = req.body;
        const [result] = await db.query(
            'INSERT INTO ket_qua_hoc_tap (sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai]
        );
        res.status(201).json({ message: 'Thêm kết quả học tập thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai } = req.body;
        const [result] = await db.query(
            'UPDATE ket_qua_hoc_tap SET sinhVienId=?, monHocId=?, diem10=?, diemChu=?, hocKy=?, namHoc=?, hocLai=? WHERE id=?',
            [sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy KQHT' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM ket_qua_hoc_tap WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy KQHT' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.deleteByLopId = async (req, res) => {
    try {
        const lopId = req.params.lopId;
        const [result] = await db.query(
            `DELETE kq FROM ket_qua_hoc_tap kq 
             JOIN lop_sinhvien ls ON kq.sinhVienId = ls.sinhvien_id 
             WHERE ls.lop_id = ?`,
            [lopId]
        );
        res.status(200).json({ message: `Đã xóa thành công ${result.affectedRows} bản ghi điểm của lớp này` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const xlsx = require('xlsx');

exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file được tải lên' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (data.length < 6) {
            return res.status(400).json({ message: 'File không đúng định dạng' });
        }

        const hocKy = data[2][4] || '1';
        const namHoc = req.body.namHoc || '2025-2026';
        const lopId = req.body.lopId;

        if (!lopId) {
            return res.status(400).json({ message: 'Vui lòng chọn lớp để import' });
        }
        const row3 = data[3]; 
        const row4 = data[4]; 
        const row5 = data[5]; 

        const subjects = [];
        for (let i = 4; i < row3.length; i++) {
            if (row3[i] && typeof row3[i] === 'string' && row3[i] !== '') {
                const tenMon = row3[i];
                const soTinChi = parseInt(row4[i]) || 0;
                
                let j = i + 1;
                while (j < row5.length && (!row3[j] || row3[j] === '') && row5[j] !== 'TBCHT H4') {
                    j++;
                }
                
                let h10Idx = -1;
                let chuIdx = -1;
                for (let k = i; k < j; k++) {
                    if (row5[k] === 'H10') h10Idx = k;
                    if (row5[k] === 'Chữ') chuIdx = k;
                }
                
                subjects.push({ tenMon, soTinChi, h10Idx, chuIdx });
            }
        }

        // Process subjects into DB
        for (let subj of subjects) {
            // Trích xuất mã môn (6 chữ số đầu)
            const match = subj.tenMon.match(/^(\d{6})/);
            let monId = null;
            let finalTenMon = subj.tenMon;

            if (match) {
                monId = parseInt(match[1]);
                // Loại bỏ mã số khỏi tên môn để lưu tên sạch hơn (tùy chọn)
                finalTenMon = subj.tenMon.substring(6).trim();
                if (finalTenMon.startsWith('-') || finalTenMon.startsWith(':')) {
                    finalTenMon = finalTenMon.substring(1).trim();
                }
            }

            if (monId) {
                const [mon] = await db.query('SELECT id FROM mon_hoc WHERE id = ?', [monId]);
                if (mon.length > 0) {
                    subj.monHocId = mon[0].id;
                    // Cập nhật tên môn nếu cần
                    await db.query('UPDATE mon_hoc SET tenMon = ?, soTinChi = ? WHERE id = ?', [finalTenMon, subj.soTinChi, monId]);
                } else {
                    await db.query('INSERT INTO mon_hoc (id, tenMon, soTinChi) VALUES (?, ?, ?)', [monId, finalTenMon, subj.soTinChi]);
                    subj.monHocId = monId;
                }
            } else {
                // Fallback nếu không có mã 6 số
                const [mon] = await db.query('SELECT id FROM mon_hoc WHERE tenMon = ?', [subj.tenMon]);
                if (mon.length > 0) {
                    subj.monHocId = mon[0].id;
                } else {
                    const [result] = await db.query('INSERT INTO mon_hoc (tenMon, soTinChi) VALUES (?, ?)', [subj.tenMon, subj.soTinChi]);
                    subj.monHocId = result.insertId;
                }
            }
        }

        // Process grades
        let importedCount = 0;
        for (let i = 6; i < data.length; i++) {
            const row = data[i];
            const maSV = row[0];
            if (!maSV) continue;

            const [svResult] = await db.query(
                `SELECT sv.id FROM sinh_vien sv 
                 JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id 
                 WHERE sv.maSV = ? AND ls.lop_id = ?`, 
                [maSV, lopId]
            );
            if (svResult.length === 0) continue; // Skip unknown student or student not in this class
            const sinhVienId = svResult[0].id;

            for (let subj of subjects) {
                if (subj.h10Idx !== -1 && row[subj.h10Idx] !== undefined) {
                    let diem10 = parseFloat(row[subj.h10Idx]);
                    let diemChu = row[subj.chuIdx] ? String(row[subj.chuIdx]) : null;
                    if (isNaN(diem10)) diem10 = null;

                    // Delete old record if exists
                    await db.query('DELETE FROM ket_qua_hoc_tap WHERE sinhVienId = ? AND monHocId = ? AND hocKy = ?', [sinhVienId, subj.monHocId, hocKy]);
                    
                    // Insert new record
                    await db.query(
                        'INSERT INTO ket_qua_hoc_tap (sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [sinhVienId, subj.monHocId, diem10, diemChu, hocKy, namHoc, false]
                    );
                    importedCount++;
                }
            }
        }

        res.status(200).json({ message: `Import thành công ${importedCount} điểm`, importedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    } finally {
        // Xóa file tạm sau khi xử lý xong
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Lỗi khi xóa file tạm:', err);
            });
        }
    }
};
