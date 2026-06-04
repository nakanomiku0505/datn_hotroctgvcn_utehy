const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, email, full_name, phone, role } = req.body;

        // Kiểm tra user đã tồn tại chưa
        const [users] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email || '']);
        if (users.length > 0) {
            return res.status(400).json({ message: 'Username hoặc Email đã tồn tại' });
        }

        // Tạm thời dùng plaintext thay vì bcrypt
        const hashedPassword = password;

        const [result] = await db.query(
            'INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email || null, full_name || null, phone || null, role || 0]
        );

        res.status(201).json({ message: 'Đăng ký thành công', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User không tồn tại' });
        }

        const user = users[0];
        // Tạm thời so sánh plaintext
        const passwordIsValid = (password === user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Sai mật khẩu' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '72h' }
        );

        // Đếm số lượng lớp quản lý (nếu là GVCN hoặc Lớp trưởng)
        let managedClassCount = 0;
        if (user.role === 1 || user.role === 2) {
            const [classes] = await db.query('SELECT COUNT(*) as count FROM lop WHERE gvcNId = ?', [user.id]);
            managedClassCount = classes[0].count;
        } else if (user.role === 4) {
            const [sv] = await db.query('SELECT id FROM sinh_vien WHERE user_id = ?', [user.id]);
            if (sv.length > 0) {
                const [classes] = await db.query('SELECT COUNT(*) as count FROM lop WHERE lopTruongId = ?', [sv[0].id]);
                managedClassCount = classes[0].count;
            }
        } else if (user.role === 0) {
            managedClassCount = 999; // Admin thấy tất cả
        }

        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role,
            managedClassCount,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
