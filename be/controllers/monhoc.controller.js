const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = 'SELECT * FROM mon_hoc WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM mon_hoc WHERE 1=1';
        const queryParams = [];
        const countParams = [];

        if (search) {
            query += ' AND tenMon LIKE ?';
            countQuery += ' AND tenMon LIKE ?';
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
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

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mon_hoc WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy môn học' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { tenMon, soTinChi } = req.body;
        const [result] = await db.query(
            'INSERT INTO mon_hoc (tenMon, soTinChi) VALUES (?, ?)',
            [tenMon, soTinChi]
        );
        res.status(201).json({ message: 'Tạo môn học thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { tenMon, soTinChi } = req.body;
        const [result] = await db.query(
            'UPDATE mon_hoc SET tenMon = ?, soTinChi = ? WHERE id = ?',
            [tenMon, soTinChi, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy môn học' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM mon_hoc WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy môn học' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
