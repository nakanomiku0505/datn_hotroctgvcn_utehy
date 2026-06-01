const express = require('express');
const router = express.Router();
const monhocController = require('../controllers/monhoc.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', monhocController.getAll);
router.get('/:id', monhocController.getById);
router.post('/', monhocController.create);
router.put('/:id', monhocController.update);
router.delete('/:id', monhocController.delete);

module.exports = router;
