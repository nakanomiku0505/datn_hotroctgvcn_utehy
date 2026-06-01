const express = require('express');
const router = express.Router();
const lopsinhvienController = require('../controllers/lopsinhvien.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', lopsinhvienController.getAll);
router.get('/lop/:lopId', lopsinhvienController.getSinhVienByLop);
router.post('/', lopsinhvienController.create);
router.delete('/:lop_id/:sinhvien_id', lopsinhvienController.delete);

module.exports = router;
