const express = require('express');
const router = express.Router();
const diemrenluyenController = require('../controllers/diemrenluyen.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', diemrenluyenController.getAll);
router.get('/export-excel', diemrenluyenController.exportTemplate);
router.get('/sinhvien/:svId', diemrenluyenController.getBySinhVien);
router.post('/batch', diemrenluyenController.saveBatch);
router.post('/', diemrenluyenController.create);
router.put('/:id', diemrenluyenController.update);
router.delete('/lop/:lopId', diemrenluyenController.deleteByLopId);
router.delete('/:id', diemrenluyenController.delete);

module.exports = router;
