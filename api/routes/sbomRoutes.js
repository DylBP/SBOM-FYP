const express = require('express');
const upload = require('../middlewares/multerMiddleware');
const { processSBOM, getSBOMById, getMySBOMs, deleteMySBOM, getParsedSbomWithVulns } = require('../controllers/sbomController');
const { handleSBOMGeneration } = require('../controllers/generatorController');

const router = express.Router();

router.post('/uploadSBOM', upload.single('file'), processSBOM);
router.post('/generator/generateSBOM', upload.single('artifact'), handleSBOMGeneration)
router.get('/my-sboms', getMySBOMs);
router.get('/my-sboms/:sbomId', getSBOMById);
router.delete('/my-sboms/:sbomId', deleteMySBOM);
router.get('/:id/parsed', getParsedSbomWithVulns);

module.exports = router;
