const express = require('express');
const router = express.Router();
const sinhvienController = require('../controllers/sinhvien.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', sinhvienController.getAll);
router.get('/:id', sinhvienController.getById);
router.post('/', checkRole([0, 1]), sinhvienController.create);
router.put('/:id', checkRole([0, 1]), sinhvienController.update);
router.delete('/:id', checkRole([0, 1]), sinhvienController.delete);
router.delete('/lop/:lopId', checkRole([0, 1]), sinhvienController.deleteAllByLop);

module.exports = router;
