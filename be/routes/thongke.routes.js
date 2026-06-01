const express = require('express');
const router = express.Router();
const thongkeController = require('../controllers/thongke.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/', thongkeController.getOverview);

module.exports = router;
