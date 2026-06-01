const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chi_tiet_ren_luyen');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getByDiemRenLuyen = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chi_tiet_ren_luyen WHERE diemRenLuyenId = ?', [req.params.drlId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa } = req.body;
        const [result] = await db.query(
            'INSERT INTO chi_tiet_ren_luyen (diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa) VALUES (?, ?, ?, ?, ?)',
            [diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa]
        );
        res.status(201).json({ message: 'Tạo chi tiết rèn luyện thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa } = req.body;
        const [result] = await db.query(
            'UPDATE chi_tiet_ren_luyen SET diemRenLuyenId=?, tieuChi=?, noiDung=?, diem=?, diemToiDa=? WHERE id=?',
            [diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy chi tiết rèn luyện' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM chi_tiet_ren_luyen WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy chi tiết rèn luyện' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
