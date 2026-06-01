const db = require('../config/db');

exports.getDeployedByLop = async (req, res) => {
    try {
        const { lopId } = req.params;
        const [rows] = await db.query('SELECT thongBaoId, ngayTrienKhai FROM thong_bao_da_trien_khai WHERE lopId = ?', [lopId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.markAsDeployed = async (req, res) => {
    try {
        const { thongBaoId, lopId, gvcnId } = req.body;
        if (!thongBaoId || !lopId || !gvcnId) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }
        
        await db.query(
            'INSERT IGNORE INTO thong_bao_da_trien_khai (gvcnId, lopId, thongBaoId) VALUES (?, ?, ?)',
            [gvcnId, lopId, thongBaoId]
        );
        
        res.status(201).json({ message: 'Đã đánh dấu triển khai' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.unmarkAsDeployed = async (req, res) => {
    try {
        const { thongBaoId, lopId } = req.body;
        if (!thongBaoId || !lopId) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }
        
        await db.query(
            'DELETE FROM thong_bao_da_trien_khai WHERE thongBaoId = ? AND lopId = ?',
            [thongBaoId, lopId]
        );
        
        res.status(200).json({ message: 'Đã hủy đánh dấu triển khai' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
