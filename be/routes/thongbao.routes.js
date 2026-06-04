const express = require('express');
const router = express.Router();
const thongbaoController = require('../controllers/thongbao.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Fix UTF-8 issue with multer originalname
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext).replace(/\s+/g, '-');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, name + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

router.use(verifyToken);

router.get('/', thongbaoController.getAll);
router.post('/copy-month', thongbaoController.copyFromMonth);
router.get('/deployed/lop/:lopId', thongbaoController.getDeployedByLop);
router.post('/deployed/mark', thongbaoController.markAsDeployed);
router.post('/deployed/unmark', thongbaoController.unmarkAsDeployed);
router.get('/:id', thongbaoController.getById);
router.post('/', upload.array('files', 10), thongbaoController.create);
router.put('/:id', upload.array('files', 10), thongbaoController.update);
router.delete('/:id', thongbaoController.delete);

module.exports = router;
