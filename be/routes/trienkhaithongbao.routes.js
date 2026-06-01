const express = require('express');
const router = express.Router();
const trienkhaithongbaoController = require('../controllers/trienkhaithongbao.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/export/word', trienkhaithongbaoController.exportWord);

router.use(verifyToken);

router.get('/', trienkhaithongbaoController.getAll);
router.get('/lop/:lopId', trienkhaithongbaoController.getByLop);
router.post('/', checkRole([0, 1]), trienkhaithongbaoController.create);
router.put('/:id', checkRole([0, 1]), trienkhaithongbaoController.update);
router.delete('/:id', checkRole([0, 1]), trienkhaithongbaoController.delete);

module.exports = router;
