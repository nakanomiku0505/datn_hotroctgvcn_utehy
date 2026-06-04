const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const loai = req.query.loai || '';
        const nam = req.query.nam || '';
        const thang = req.query.thang || '';
        const search = req.query.search || '';

        let query = 'SELECT * FROM thong_bao WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM thong_bao WHERE 1=1';
        const queryParams = [];
        const countParams = [];

        if (loai) {
            query += ' AND loai = ?';
            countQuery += ' AND loai = ?';
            queryParams.push(loai);
            countParams.push(loai);
        }

        if (nam) {
            query += ' AND nam = ?';
            countQuery += ' AND nam = ?';
            queryParams.push(nam);
            countParams.push(nam);
        }

        if (thang) {
            query += ' AND thang = ?';
            countQuery += ' AND thang = ?';
            queryParams.push(thang);
            countParams.push(thang);
        }

        if (search) {
            query += ' AND noiDung LIKE ?';
            countQuery += ' AND noiDung LIKE ?';
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
        const [rows] = await db.query('SELECT * FROM thong_bao WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        let fileUrls = [];
        let fileNames = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(f => {
                fileUrls.push(`/uploads/${f.filename}`);
                const originalName = Buffer.from(f.originalname, 'latin1').toString('utf8');
                fileNames.push(originalName);
            });
        }
        const fileUrlStr = fileUrls.length > 0 ? JSON.stringify(fileUrls) : null;
        const fileNameStr = fileNames.length > 0 ? JSON.stringify(fileNames) : null;

        const [result] = await db.query(
            'INSERT INTO thong_bao (noiDung, loai, khoaApDung, nam, thang, fileUrl, fileName) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [noiDung || '', loai, khoaApDung, nam, thang, fileUrlStr, fileNameStr]
        );
        res.status(201).json({ message: 'Tạo thông báo thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { noiDung, loai, khoaApDung, nam, thang } = req.body;
        let query = 'UPDATE thong_bao SET noiDung=?, loai=?, khoaApDung=?, nam=?, thang=?';
        const values = [noiDung || '', loai, khoaApDung, nam, thang];

        if (req.files && req.files.length > 0) {
            let fileUrls = [];
            let fileNames = [];
            req.files.forEach(f => {
                fileUrls.push(`/uploads/${f.filename}`);
                const originalName = Buffer.from(f.originalname, 'latin1').toString('utf8');
                fileNames.push(originalName);
            });
            query += ', fileUrl=?, fileName=?';
            values.push(JSON.stringify(fileUrls), JSON.stringify(fileNames));
        }

        query += ' WHERE id=?';
        values.push(req.params.id);

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM thong_bao WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.copyFromMonth = async (req, res) => {
    try {
        const { fromMonth, fromYear, toMonth, toYear } = req.body;
        
        // Fetch source records
        const [rows] = await db.query('SELECT noiDung, loai, khoaApDung, fileUrl, fileName FROM thong_bao WHERE thang = ? AND nam = ?', [fromMonth, fromYear]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không có thông báo nào trong tháng nguồn để copy' });
        }
        
        // Insert copied records
        let savedCount = 0;
        for (let row of rows) {
            await db.query(
                'INSERT INTO thong_bao (noiDung, loai, khoaApDung, thang, nam, fileUrl, fileName) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [row.noiDung, row.loai, row.khoaApDung, toMonth, toYear, row.fileUrl, row.fileName]
            );
            savedCount++;
        }
        
        res.status(200).json({ message: `Đã copy thành công ${savedCount} thông báo`, savedCount });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
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
