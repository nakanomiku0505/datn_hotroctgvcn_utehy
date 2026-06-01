const express = require('express');
const router = express.Router();
const diemdanhController = require('../controllers/diemdanh.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', diemdanhController.getAll);
router.get('/export-excel', diemdanhController.exportExcel);
router.get('/absence-summary', diemdanhController.getAbsenceSummary);
router.get('/lop/:lopId', diemdanhController.getByLop);
router.get('/sinhvien/:svId', diemdanhController.getBySinhVien);
router.post('/', diemdanhController.create);
router.put('/:id', diemdanhController.update);
router.delete('/:id', diemdanhController.delete);

module.exports = router;
