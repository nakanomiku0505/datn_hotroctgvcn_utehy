const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM lop_sinhvien');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getSinhVienByLop = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sv.* FROM sinh_vien sv
            JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id
            WHERE ls.lop_id = ?
        `, [req.params.lopId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { lop_id, sinhvien_id } = req.body;
        await db.query(
            'INSERT INTO lop_sinhvien (lop_id, sinhvien_id) VALUES (?, ?)',
            [lop_id, sinhvien_id]
        );
        res.status(201).json({ message: 'Thêm sinh viên vào lớp thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { lop_id, sinhvien_id } = req.params;
        const [result] = await db.query('DELETE FROM lop_sinhvien WHERE lop_id = ? AND sinhvien_id = ?', [lop_id, sinhvien_id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        res.status(200).json({ message: 'Xóa sinh viên khỏi lớp thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
