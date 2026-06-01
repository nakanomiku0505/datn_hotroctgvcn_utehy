const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const lopRoutes = require('./lop.routes');
const sinhvienRoutes = require('./sinhvien.routes');
const lopsinhvienRoutes = require('./lopsinhvien.routes');
const monhocRoutes = require('./monhoc.routes');
const ketquahoctapRoutes = require('./ketquahoctap.routes');
const diemdanhRoutes = require('./diemdanh.routes');
const diemrenluyenRoutes = require('./diemrenluyen.routes');
const chitietrenluyenRoutes = require('./chitietrenluyen.routes');
const thongbaoRoutes = require('./thongbao.routes');
const trienkhaithongbaoRoutes = require('./trienkhaithongbao.routes');
const thongkeRoutes = require('./thongke.routes');
const thongBaoDaTrienKhaiRoutes = require('./thongbaodatrienkhai.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/lop', lopRoutes);
router.use('/sinhvien', sinhvienRoutes);
router.use('/lop-sinhvien', lopsinhvienRoutes);
router.use('/mon-hoc', monhocRoutes);
router.use('/ket-qua-hoc-tap', ketquahoctapRoutes);
router.use('/diem-danh', diemdanhRoutes);
router.use('/diem-ren-luyen', diemrenluyenRoutes);
router.use('/chi-tiet-ren-luyen', chitietrenluyenRoutes);
router.use('/thong-bao', thongbaoRoutes);
router.use('/trien-khai-thong-bao', trienkhaithongbaoRoutes);
router.use('/thong-ke', thongkeRoutes);
router.use('/thong-bao-da-trien-khai', thongBaoDaTrienKhaiRoutes);

module.exports = router;
