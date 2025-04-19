const express = require('express');
const projectController = require('../controllers/projectController');
const router = express.Router();

router.post('/', projectController.createProject);
router.get('/', projectController.getMyProjects);
router.get('/:projectId', projectController.getProjectById);
router.get('/:projectId/sboms', projectController.listSBOMsForProject);
router.put('/:projectId', projectController.updateProjectById);
router.delete('/:projectId', projectController.deleteProjectById);

module.exports = router;