const express = require('express');
const router = express.Router();
const controller = require('../controllers/thongbaodatrienkhai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/lop/:lopId', controller.getDeployedByLop);
router.post('/mark', controller.markAsDeployed);
router.post('/unmark', controller.unmarkAsDeployed);

module.exports = router;
