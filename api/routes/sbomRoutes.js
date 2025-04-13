const express = require('express');
const upload = require('../middlewares/multerMiddleware');
const { processSBOM, getMySBOMs, deleteMySBOM } = require('../controllers/sbomController');

const router = express.Router();

router.post('/uploadSBOM', upload.single('file'), processSBOM);
router.get('/my-sboms', getMySBOMs);
router.delete('/my-sboms/:sbomId', deleteMySBOM);

module.exports = router;
