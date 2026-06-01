const express = require('express');
const router = express.Router();
const lopController = require('../controllers/lop.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', lopController.getAll);
router.get('/:id', lopController.getById);
router.post('/', checkRole([0, 1, 2]), lopController.create);
router.post('/import-classes', checkRole([0, 2]), lopController.importClasses);
router.post('/import-all', checkRole([0, 2]), lopController.importClassesWithStudents);
router.post('/:id/import', checkRole([0, 1, 2]), lopController.importStudents);
router.put('/:id', checkRole([0, 1, 2]), lopController.update);
router.delete('/:id', checkRole([0, 1, 2]), lopController.delete);

module.exports = router;
