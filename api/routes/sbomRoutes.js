const express = require('express');
const upload = require('../middlewares/multerMiddleware');
const { processSBOM } = require('../controllers/sbomController');

const router = express.Router();

router.post('/uploadSBOM', upload.single('file'), processSBOM);

module.exports = router;
