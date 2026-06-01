const express = require('express');
const router = express.Router();
const chitietrenluyenController = require('../controllers/chitietrenluyen.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', chitietrenluyenController.getAll);
router.get('/diem-ren-luyen/:drlId', chitietrenluyenController.getByDiemRenLuyen);
router.post('/', chitietrenluyenController.create);
router.put('/:id', chitietrenluyenController.update);
router.delete('/:id', chitietrenluyenController.delete);

module.exports = router;
