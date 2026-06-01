const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const nganh = req.query.nganh || '';
        const trangThai = req.query.trangThai || '';

        const lopId = req.query.lopId || '';

        let query = 'SELECT DISTINCT sv.* FROM sinh_vien sv';
        let countQuery = 'SELECT COUNT(DISTINCT sv.id) as total FROM sinh_vien sv';
        const queryParams = [];
        const countParams = [];

        let needsJoin = [1, 4].includes(req.userRole) || lopId;

        if (needsJoin) {
            query += ' JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id JOIN lop l ON l.id = ls.lop_id WHERE 1=1';
            countQuery += ' JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id JOIN lop l ON l.id = ls.lop_id WHERE 1=1';
            
            if (req.userRole === 1) {
                query += ' AND l.gvcNId = ?';
                countQuery += ' AND l.gvcNId = ?';
                queryParams.push(req.userId);
                countParams.push(req.userId);
            } else if (req.userRole === 4) {
                // Lớp trưởng chỉ thấy sinh viên trong lớp mình quản lý
                const [sv] = await db.query('SELECT id FROM sinh_vien WHERE user_id = ?', [req.userId]);
                if (sv.length > 0) {
                    query += ' AND l.lopTruongId = ?';
                    countQuery += ' AND l.lopTruongId = ?';
                    queryParams.push(sv[0].id);
                    countParams.push(sv[0].id);
                } else {
                    query += ' AND 1=0';
                    countQuery += ' AND 1=0';
                }
            }

            if (lopId) {
                query += ' AND l.id = ?';
                countQuery += ' AND l.id = ?';
                queryParams.push(lopId);
                countParams.push(lopId);
            }
        } else {
            query += ' WHERE 1=1';
            countQuery += ' WHERE 1=1';
        }

        if (search) {
            query += ' AND (sv.hoTen LIKE ? OR sv.maSV LIKE ?)';
            countQuery += ' AND (sv.hoTen LIKE ? OR sv.maSV LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (nganh) {
            query += ' AND sv.nganh = ?';
            countQuery += ' AND sv.nganh = ?';
            queryParams.push(nganh);
            countParams.push(nganh);
        }
        
        if (trangThai) {
            query += ' AND sv.trangThai = ?';
            countQuery += ' AND sv.trangThai = ?';
            queryParams.push(trangThai);
            countParams.push(trangThai);
        }

        // Xếp danh sách theo id tăng dần (cũ nhất lên đầu / hoặc theo MSSV)
        query += ' ORDER BY sv.id ASC LIMIT ? OFFSET ?';
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
        const [rows] = await db.query('SELECT * FROM sinh_vien WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    let connection;
    try {
        const sv = req.body;
        connection = await db.getConnection();
        await connection.beginTransaction();

        const query = `INSERT INTO sinh_vien (
            maSV, hoTen, ngaySinh, trangThai, dienThoaiCaNhan, email, noiSinh, 
            gioiTinh, danToc, nganh, chuyenNganh, queQuan, tonGiao, 
            diaChiThuongTru, diaChiBaoTin, hoTenBo, dienThoaiBo, hoTenMe, 
            dienThoaiMe, soTaiKhoan, tenKhoa, khoa, tinhThuongTru, 
            dienThoaiNR, ghiChu, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const formattedNgaySinh = sv.ngaySinh ? (sv.ngaySinh.includes('T') ? sv.ngaySinh.split('T')[0] : sv.ngaySinh) : null;

        const values = [
            sv.maSV || '', sv.hoTen || '', formattedNgaySinh, sv.trangThai || 'Đang học', sv.dienThoaiCaNhan || null, sv.email || null, sv.noiSinh || null,
            sv.gioiTinh || null, sv.danToc || null, sv.nganh || null, sv.chuyenNganh || null, sv.queQuan || null, sv.tonGiao || null,
            sv.diaChiThuongTru || null, sv.diaChiBaoTin || null, sv.hoTenBo || null, sv.dienThoaiBo || null, sv.hoTenMe || null,
            sv.dienThoaiMe || null, sv.soTaiKhoan || null, sv.tenKhoa || null, sv.khoa || null, sv.tinhThuongTru || null,
            sv.dienThoaiNR || null, sv.ghiChu || null, sv.user_id || null
        ];

        const [result] = await connection.query(query, values);
        
        if (sv.lopId) {
            await connection.query('INSERT INTO lop_sinhvien (lop_id, sinhvien_id) VALUES (?, ?)', [sv.lopId, result.insertId]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Thêm sinh viên thành công', id: result.insertId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.update = async (req, res) => {
    try {
        const sv = req.body;
        const query = `UPDATE sinh_vien SET 
            maSV = ?, hoTen = ?, ngaySinh = ?, trangThai = ?, dienThoaiCaNhan = ?, email = ?, noiSinh = ?, 
            gioiTinh = ?, danToc = ?, nganh = ?, chuyenNganh = ?, queQuan = ?, tonGiao = ?, 
            diaChiThuongTru = ?, diaChiBaoTin = ?, hoTenBo = ?, dienThoaiBo = ?, hoTenMe = ?, 
            dienThoaiMe = ?, soTaiKhoan = ?, tenKhoa = ?, khoa = ?, tinhThuongTru = ?, 
            dienThoaiNR = ?, ghiChu = ?, user_id = ?
            WHERE id = ?`;
        
        const formattedNgaySinh = sv.ngaySinh ? (sv.ngaySinh.includes('T') ? sv.ngaySinh.split('T')[0] : sv.ngaySinh) : null;

        const values = [
            sv.maSV || '', sv.hoTen || '', formattedNgaySinh, sv.trangThai || 'Đang học', sv.dienThoaiCaNhan || null, sv.email || null, sv.noiSinh || null,
            sv.gioiTinh || null, sv.danToc || null, sv.nganh || null, sv.chuyenNganh || null, sv.queQuan || null, sv.tonGiao || null,
            sv.diaChiThuongTru || null, sv.diaChiBaoTin || null, sv.hoTenBo || null, sv.dienThoaiBo || null, sv.hoTenMe || null,
            sv.dienThoaiMe || null, sv.soTaiKhoan || null, sv.tenKhoa || null, sv.khoa || null, sv.tinhThuongTru || null,
            sv.dienThoaiNR || null, sv.ghiChu || null, sv.user_id || null, req.params.id
        ];

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên để cập nhật' });
        }
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const svId = req.params.id;

        // 1. Lấy thông tin sinh viên để biết user_id
        const [svData] = await connection.query('SELECT user_id FROM sinh_vien WHERE id = ?', [svId]);
        if (svData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
        }

        // 2. Xóa các dữ liệu liên quan
        // - Kết quả học tập
        await connection.query('DELETE FROM ket_qua_hoc_tap WHERE sinhVienId = ?', [svId]);
        
        // - Điểm danh
        await connection.query('DELETE FROM diem_danh WHERE sinhVienId = ?', [svId]);

        // - Điểm rèn luyện (PHẢI xóa chi tiết trước)
        await connection.query('DELETE FROM chi_tiet_ren_luyen WHERE diemRenLuyenId IN (SELECT id FROM diem_ren_luyen WHERE sinhVienId = ?)', [svId]);
        await connection.query('DELETE FROM diem_ren_luyen WHERE sinhVienId = ?', [svId]);

        // - Liên kết lớp
        await connection.query('DELETE FROM lop_sinhvien WHERE sinhvien_id = ?', [svId]);

        // 3. Xóa sinh viên
        const [result] = await connection.query('DELETE FROM sinh_vien WHERE id = ?', [svId]);
        
        // 4. Xóa tài khoản user
        if (svData[0].user_id) {
            await connection.query('DELETE FROM users WHERE id = ?', [svData[0].user_id]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Xóa sinh viên và toàn bộ dữ liệu liên quan thành công' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa sinh viên', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteAllByLop = async (req, res) => {
    let connection;
    try {
        const lopId = req.params.lopId;
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Lấy danh sách ID sinh viên trong lớp
        const [svList] = await connection.query('SELECT sinhvien_id FROM lop_sinhvien WHERE lop_id = ?', [lopId]);
        if (svList.length === 0) {
            await connection.rollback();
            return res.status(200).json({ message: 'Lớp này chưa có sinh viên nào để xóa.' });
        }

        const svIds = svList.map(item => item.sinhvien_id);

        // 2. Lấy danh sách user_id để xóa tài khoản sau
        const [userData] = await connection.query('SELECT user_id FROM sinh_vien WHERE id IN (?)', [svIds]);
        const userIds = userData.map(u => u.user_id).filter(id => id !== null);

        // 3. Xóa các dữ liệu liên quan cho tất cả sinh viên này
        await connection.query('DELETE FROM ket_qua_hoc_tap WHERE sinhVienId IN (?)', [svIds]);
        await connection.query('DELETE FROM diem_danh WHERE sinhVienId IN (?)', [svIds]);
        
        // - Điểm rèn luyện
        await connection.query('DELETE FROM chi_tiet_ren_luyen WHERE diemRenLuyenId IN (SELECT id FROM diem_ren_luyen WHERE sinhVienId IN (?))', [svIds]);
        await connection.query('DELETE FROM diem_ren_luyen WHERE sinhVienId IN (?)', [svIds]);

        // - Liên kết lớp
        await connection.query('DELETE FROM lop_sinhvien WHERE sinhvien_id IN (?)', [svIds]);

        // 4. Xóa sinh viên
        await connection.query('DELETE FROM sinh_vien WHERE id IN (?)', [svIds]);
        
        // 5. Xóa tài khoản user
        if (userIds.length > 0) {
            await connection.query('DELETE FROM users WHERE id IN (?)', [userIds]);
        }

        await connection.commit();
        res.status(200).json({ message: `Đã xóa thành công toàn bộ ${svIds.length} sinh viên của lớp này.` });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Delete all students in class error:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa toàn bộ sinh viên', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

