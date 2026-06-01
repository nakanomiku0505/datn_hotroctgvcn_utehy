const express = require('express');
const router = express.Router();
const ketquahoctapController = require('../controllers/ketquahoctap.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(verifyToken);

router.get('/', ketquahoctapController.getAll);
router.get('/sinhvien/:svId', ketquahoctapController.getBySinhVienId);
router.post('/upload', upload.single('file'), ketquahoctapController.uploadExcel);
router.post('/', ketquahoctapController.create);
router.put('/:id', ketquahoctapController.update);
router.delete('/lop/:lopId', ketquahoctapController.deleteByLopId);
router.delete('/:id', ketquahoctapController.delete);

module.exports = router;
