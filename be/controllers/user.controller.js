const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, full_name, phone, role, created_at FROM users');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy user' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { username, password, email, full_name, phone, role } = req.body;
        
        // Kiểm tra user đã tồn tại chưa
        const [users] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email || '']);
        if (users.length > 0) {
            return res.status(400).json({ message: 'Username hoặc Email đã tồn tại' });
        }

        // Tạm thời dùng plaintext theo chuẩn cũ
        const hashedPassword = password || '123456';

        const [result] = await db.query(
            'INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email || null, full_name || null, phone || null, role !== undefined ? role : 1]
        );

        res.status(201).json({ message: 'Thêm người dùng thành công', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, full_name, phone, role, password } = req.body;

        let query = 'UPDATE users SET email = ?, full_name = ?, phone = ?, role = ?';
        let values = [email || null, full_name || null, phone || null, role !== undefined ? role : 1];

        if (password) {
            query += ', password = ?';
            values.push(password);
        }

        query += ' WHERE id = ?';
        values.push(id);

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng để cập nhật' });
        }

        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng để xóa' });
        }

        res.status(200).json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
