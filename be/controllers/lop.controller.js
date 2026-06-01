const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const khoa = req.query.khoa || '';
        const nganh = req.query.nganh || '';

        let query = 'SELECT * FROM lop WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM lop WHERE 1=1';
        const queryParams = [];
        const countParams = [];

        // Logic: GVCN (role === 1) thì chỉ thấy lớp của mình. Lớp trưởng (role === 4) chỉ thấy lớp mình quản lý. Admin (role === 0) thấy tất cả.
        if (req.userRole === 1) {
            query += ' AND gvcNId = ?';
            countQuery += ' AND gvcNId = ?';
            queryParams.push(req.userId);
            countParams.push(req.userId);
        } else if (req.userRole === 4) {
            // Tìm sinhVienId của user hiện tại
            const [sv] = await db.query('SELECT id FROM sinh_vien WHERE user_id = ?', [req.userId]);
            if (sv.length > 0) {
                query += ' AND lopTruongId = ?';
                countQuery += ' AND lopTruongId = ?';
                queryParams.push(sv[0].id);
                countParams.push(sv[0].id);
            } else {
                query += ' AND 1=0';
                countQuery += ' AND 1=0';
            }
        }

        if (search) {
            query += ' AND tenLop LIKE ?';
            countQuery += ' AND tenLop LIKE ?';
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }
        
        if (khoa) {
            query += ' AND khoa = ?';
            countQuery += ' AND khoa = ?';
            queryParams.push(khoa);
            countParams.push(khoa);
        }
        
        if (nganh) {
            query += ' AND nganh = ?';
            countQuery += ' AND nganh = ?';
            queryParams.push(nganh);
            countParams.push(nganh);
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
        const [rows] = await db.query('SELECT * FROM lop WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lớp' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { tenLop, khoa, nganh, trangThai, gvcNId, lopTruongId } = req.body;
        const [result] = await db.query(
            'INSERT INTO lop (tenLop, khoa, nganh, trangThai, gvcNId, lopTruongId) VALUES (?, ?, ?, ?, ?, ?)',
            [tenLop, khoa, nganh, trangThai, gvcNId || null, lopTruongId || null]
        );
        res.status(201).json({ message: 'Tạo lớp thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { tenLop, khoa, nganh, trangThai, gvcNId, lopTruongId } = req.body;
        
        // Kiểm tra lớp trưởng cũ
        const [oldLop] = await db.query('SELECT lopTruongId FROM lop WHERE id = ?', [req.params.id]);
        if (oldLop.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lớp để cập nhật' });
        }
        const oldLopTruongId = oldLop[0].lopTruongId;
        
        // Security check for GVCN role
        if (req.userRole === 1) {
            if (oldLop[0].gvcNId !== req.userId) {
                return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lớp này' });
            }
        }
        // Nếu có sự thay đổi lớp trưởng
        if (oldLopTruongId != lopTruongId) {
            // Xóa tài khoản của lớp trưởng cũ
            if (oldLopTruongId) {
                const [oldSV] = await db.query('SELECT user_id FROM sinh_vien WHERE id = ?', [oldLopTruongId]);
                if (oldSV.length > 0 && oldSV[0].user_id) {
                    await db.query('UPDATE sinh_vien SET user_id = NULL WHERE id = ?', [oldLopTruongId]);
                    await db.query('DELETE FROM users WHERE id = ?', [oldSV[0].user_id]);
                }
            }
            
            // Tạo tài khoản cho lớp trưởng mới
            if (lopTruongId) {
                const [newSV] = await db.query('SELECT maSV, hoTen, dienThoaiCaNhan FROM sinh_vien WHERE id = ?', [lopTruongId]);
                if (newSV.length > 0) {
                    const maSV = newSV[0].maSV;
                    const hoTen = newSV[0].hoTen;
                    const phone = newSV[0].dienThoaiCaNhan;
                    const defaultPassword = `sv@${maSV}`;
                    
                    // Tạo user mới với role = 4 (Lớp trưởng)
                    const [userResult] = await db.query(
                        'INSERT INTO users (username, password, full_name, phone, role) VALUES (?, ?, ?, ?, 4)',
                        [maSV, defaultPassword, hoTen, phone]
                    );
                    
                    // Gắn user_id vào sinh viên
                    await db.query('UPDATE sinh_vien SET user_id = ? WHERE id = ?', [userResult.insertId, lopTruongId]);
                }
            }
        }

        const [result] = await db.query(
            'UPDATE lop SET tenLop = ?, khoa = ?, nganh = ?, trangThai = ?, gvcNId = ?, lopTruongId = ? WHERE id = ?',
            [tenLop, khoa, nganh, trangThai, gvcNId || null, lopTruongId || null, req.params.id]
        );
        
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.delete = async (req, res) => {
    let connection;
    try {
        if (req.userRole === 1) {
            return res.status(403).json({ message: 'GVCN không có quyền xóa lớp' });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        const lopId = req.params.id;

        // 1. Xóa điểm danh liên quan đến lớp
        await connection.query('DELETE FROM diem_danh WHERE lopId = ?', [lopId]);

        // 2. Xóa triển khai thông báo liên quan đến lớp
        await connection.query('DELETE FROM trien_khai_thong_bao WHERE lopId = ?', [lopId]);

        // 3. Lấy danh sách sinh viên trong lớp để xóa các dữ liệu liên quan
        const [students] = await connection.query('SELECT sinhvien_id FROM lop_sinhvien WHERE lop_id = ?', [lopId]);
        
        for (const sv of students) {
            const svId = sv.sinhvien_id;
            
            // Xóa kết quả học tập
            await connection.query('DELETE FROM ket_qua_hoc_tap WHERE sinhVienId = ?', [svId]);

            // PHẢI xóa chi tiết rèn luyện TRƯỚC khi xóa điểm rèn luyện
            await connection.query('DELETE FROM chi_tiet_ren_luyen WHERE diemRenLuyenId IN (SELECT id FROM diem_ren_luyen WHERE sinhVienId = ?)', [svId]);
            await connection.query('DELETE FROM diem_ren_luyen WHERE sinhVienId = ?', [svId]);
            
            // Lấy user_id để xóa tài khoản
            const [userData] = await connection.query('SELECT user_id FROM sinh_vien WHERE id = ?', [svId]);
            
            // Xóa liên kết lớp-sinh viên
            await connection.query('DELETE FROM lop_sinhvien WHERE sinhvien_id = ?', [svId]);
            
            // Xóa sinh viên
            await connection.query('DELETE FROM sinh_vien WHERE id = ?', [svId]);
            
            // Xóa tài khoản user
            if (userData.length > 0 && userData[0].user_id) {
                await connection.query('DELETE FROM users WHERE id = ?', [userData[0].user_id]);
            }
        }

        // 4. Cập nhật lopTruongId về NULL (nếu còn)
        await connection.query('UPDATE lop SET lopTruongId = NULL WHERE id = ?', [lopId]);

        // 5. Cuối cùng mới xóa lớp
        const [result] = await connection.query('DELETE FROM lop WHERE id = ?', [lopId]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy lớp để xóa' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Xóa lớp và toàn bộ dữ liệu liên quan thành công' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi xóa lớp', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.importClasses = async (req, res) => {
    try {
        const { classes } = req.body;
        if (!classes || !Array.isArray(classes)) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }

        let importedCount = 0;
        let skippedCount = 0;

        for (const c of classes) {
            // Kiểm tra xem lớp đã tồn tại chưa
            const [existing] = await db.query('SELECT id FROM lop WHERE tenLop = ?', [c.tenLop]);
            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO lop (tenLop, khoa, nganh, trangThai) VALUES (?, ?, ?, ?)',
                    [c.tenLop, c.khoa || '', c.nganh || '', 'Đang học']
                );
                importedCount++;
            } else {
                skippedCount++;
            }
        }

        res.status(200).json({ 
            message: `Import hoàn tất. Thêm mới: ${importedCount}, Bỏ qua (đã tồn tại): ${skippedCount}`,
            importedCount,
            skippedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.importClassesWithStudents = async (req, res) => {
    let connection;
    try {
        const { data } = req.body; // data: array of { class: { tenLop, khoa, nganh }, students: [...] }
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        let classCount = 0;
        let studentCount = 0;

        for (const item of data) {
            const { class: classInfo, students } = item;
            
            // 1. Check or create class
            let [existing] = await connection.query('SELECT id FROM lop WHERE tenLop = ?', [classInfo.tenLop]);
            let classId;
            if (existing.length === 0) {
                const [result] = await connection.query(
                    'INSERT INTO lop (tenLop, khoa, nganh, trangThai) VALUES (?, ?, ?, ?)',
                    [classInfo.tenLop, classInfo.khoa || '', classInfo.nganh || '', 'Đang học']
                );
                classId = result.insertId;
                classCount++;
            } else {
                classId = existing[0].id;
            }

            // 2. Import students for this class
            if (students && Array.isArray(students)) {
                for (const sv of students) {
                    // Check if student exists
                    const [existingSV] = await connection.query('SELECT id FROM sinh_vien WHERE maSV = ?', [sv.maSV]);
                    let sinhVienId;
                    
                    if (existingSV.length === 0) {
                        const [svResult] = await connection.query(
                            `INSERT INTO sinh_vien (
                                maSV, hoTen, ngaySinh, trangThai, dienThoaiCaNhan, email, noiSinh, 
                                gioiTinh, danToc, nganh, chuyenNganh, queQuan, tonGiao, 
                                diaChiThuongTru, diaChiBaoTin, hoTenBo, dienThoaiBo, 
                                hoTenMe, dienThoaiMe, soTaiKhoan, tenKhoa, khoa, 
                                tinhThuongTru, dienThoaiNR
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                sv.maSV, sv.hoTen, sv.ngaySinh || null, sv.trangThai || 'Đang học', 
                                sv.dienThoaiCaNhan || '', sv.email || '', sv.noiSinh || '', 
                                sv.gioiTinh || '', sv.danToc || '', sv.nganh || '', 
                                sv.chuyenNganh || '', sv.queQuan || '', sv.tonGiao || '', 
                                sv.diaChiThuongTru || '', sv.diaChiBaoTin || '', sv.hoTenBo || '', 
                                sv.dienThoaiBo || '', sv.hoTenMe || '', sv.dienThoaiMe || '', 
                                sv.soTaiKhoan || '', sv.tenKhoa || '', sv.khoa || '', 
                                sv.tinhThuongTru || '', sv.dienThoaiNR || ''
                            ]
                        );
                        sinhVienId = svResult.insertId;
                        studentCount++;
                    } else {
                        sinhVienId = existingSV[0].id;
                    }

                    // Check if already in class
                    const [inClass] = await connection.query(
                        'SELECT * FROM lop_sinhvien WHERE lop_id = ? AND sinhvien_id = ?',
                        [classId, sinhVienId]
                    );
                    if (inClass.length === 0) {
                        await connection.query(
                            'INSERT INTO lop_sinhvien (lop_id, sinhvien_id) VALUES (?, ?)',
                            [classId, sinhVienId]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.status(200).json({ 
            message: `Import thành công. Thêm mới ${classCount} lớp và ${studentCount} sinh viên.`,
            classCount,
            studentCount
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.importStudents = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const lopId = req.params.id;
        const students = req.body.students;

        if (!students || students.length === 0) {
            return res.status(400).json({ message: 'Không có dữ liệu sinh viên' });
        }

        await connection.beginTransaction();

        let importedCount = 0;

        for (const sv of students) {
            if (!sv.maSV || !sv.hoTen) continue;

            const [existing] = await connection.query('SELECT id FROM sinh_vien WHERE maSV = ?', [sv.maSV]);
            let sinhvienId;

            if (existing.length > 0) {
                sinhvienId = existing[0].id;
                // Optional: update existing info if needed. We skip for performance or update it.
            } else {
                const [result] = await connection.query(`INSERT INTO sinh_vien (
                    maSV, hoTen, ngaySinh, trangThai, dienThoaiCaNhan, email, noiSinh, 
                    gioiTinh, danToc, nganh, chuyenNganh, queQuan, tonGiao, 
                    diaChiThuongTru, diaChiBaoTin, hoTenBo, dienThoaiBo, hoTenMe, 
                    dienThoaiMe, soTaiKhoan, tenKhoa, khoa, tinhThuongTru, 
                    dienThoaiNR, ghiChu
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sv.maSV, sv.hoTen, sv.ngaySinh, sv.trangThai || 'Đang học', sv.dienThoaiCaNhan, sv.email, sv.noiSinh,
                    sv.gioiTinh, sv.danToc, sv.nganh, sv.chuyenNganh, sv.queQuan, sv.tonGiao,
                    sv.diaChiThuongTru, sv.diaChiBaoTin, sv.hoTenBo, sv.dienThoaiBo, sv.hoTenMe,
                    sv.dienThoaiMe, sv.soTaiKhoan, sv.tenKhoa, sv.khoa, sv.tinhThuongTru,
                    sv.dienThoaiNR, sv.ghiChu
                ]);
                sinhvienId = result.insertId;
            }

            const [mapping] = await connection.query('SELECT * FROM lop_sinhvien WHERE lop_id = ? AND sinhvien_id = ?', [lopId, sinhvienId]);
            if (mapping.length === 0) {
                await connection.query('INSERT INTO lop_sinhvien (lop_id, sinhvien_id) VALUES (?, ?)', [lopId, sinhvienId]);
                importedCount++;
            }
        }

        await connection.commit();
        res.status(200).json({ message: `Đã import thành công ${importedCount} sinh viên vào lớp.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Import error:', error);
        res.status(500).json({ message: 'Lỗi server khi import', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};
