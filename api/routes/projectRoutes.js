const express = require('express');
const { handleCreateProject } = require('../controllers/projectController');

const router = express.Router();

router.post('/', handleCreateProject);

module.exports = router;