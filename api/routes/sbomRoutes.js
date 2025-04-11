const express = require('express');
const upload = require('../middlewares/multerMiddleware');
const { processSBOM, getMySBOMs } = require('../controllers/sbomController');

const router = express.Router();

router.post('/uploadSBOM', upload.single('file'), processSBOM);

router.get('/my-sboms', getMySBOMs);

module.exports = router;
