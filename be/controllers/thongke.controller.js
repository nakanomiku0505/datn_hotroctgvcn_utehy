const db = require('../config/db');

exports.getOverview = async (req, res) => {
    try {
        const userRole = req.userRole;
        const userId = req.userId;

        let totalClasses = 0;
        let totalStudents = 0;
        let totalMissingReports = 0;

        if (userRole === 0 || userRole === 2) {
            // Admin or Truong Bo Mon
            const [classes] = await db.query('SELECT COUNT(*) as count FROM lop' + (userRole === 2 ? ' WHERE gvcNId = ?' : ''), userRole === 2 ? [userId] : []);
            totalClasses = classes[0].count;

            const [students] = await db.query('SELECT COUNT(*) as count FROM sinh_vien');
            totalStudents = students[0].count;

        } else if (userRole === 1) {
            // GVCN
            const [classes] = await db.query('SELECT COUNT(*) as count FROM lop WHERE gvcNId = ?', [userId]);
            totalClasses = classes[0].count;

            const [students] = await db.query('SELECT COUNT(DISTINCT ls.sinhvien_id) as count FROM lop_sinhvien ls JOIN lop l ON l.id = ls.lop_id WHERE l.gvcNId = ?', [userId]);
            totalStudents = students[0].count;
        }

        // Lớp nghỉ học nhiều
        // Chỉ lấy những sinh viên vắng mặt
        const absentQuery = `
            SELECT l.tenLop, COUNT(d.id) as total_absences 
            FROM diem_danh d
            JOIN sinh_vien sv ON d.sinhVienId = sv.id
            JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id
            JOIN lop l ON ls.lop_id = l.id
            WHERE d.trangThai = 'Vắng mặt' ${userRole === 1 ? 'AND l.gvcNId = ?' : ''}
            GROUP BY l.id, l.tenLop
            ORDER BY total_absences DESC
            LIMIT 5
        `;
        const [absentClasses] = await db.query(absentQuery, userRole === 1 ? [userId] : []);

        // Sinh viên nghỉ nhiều
        const absentStudentsQuery = `
            SELECT sv.maSV, sv.hoTen, l.tenLop, COUNT(d.id) as total_absences 
            FROM diem_danh d
            JOIN sinh_vien sv ON d.sinhVienId = sv.id
            JOIN lop_sinhvien ls ON sv.id = ls.sinhvien_id
            JOIN lop l ON ls.lop_id = l.id
            WHERE d.trangThai = 'Vắng mặt' ${userRole === 1 ? 'AND l.gvcNId = ?' : ''}
            GROUP BY sv.id, sv.maSV, sv.hoTen, l.tenLop
            ORDER BY total_absences DESC
            LIMIT 5
        `;
        const [absentStudents] = await db.query(absentStudentsQuery, userRole === 1 ? [userId] : []);

        res.status(200).json({
            totalClasses,
            totalStudents,
            absentClasses,
            absentStudents
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
