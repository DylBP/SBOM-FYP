const path = require('path');
const { generateFromArchive, generateFromDockerImage, generateFromOCIArchive } = require('../services/generatorService');

async function handleSBOMGeneration(req, res) {
    const inputType = req.body.inputType || 'archive';
    let result;
  
    try {
      if (inputType === 'archive') {
        const zipPath = path.join(__dirname, '../temp', req.file.filename);
        result = await generateFromArchive(zipPath);
  
      } else if (inputType === 'docker') {
        const imageName = req.body.image;
        if (!imageName) return res.status(400).json({ error: 'Missing image name' });
        result = await generateFromDockerImage(imageName);
  
      } else if (inputType === 'oci-archive') {
        const tarPath = path.join(__dirname, '../temp', req.file.filename);
        result = await generateFromOCIArchive(tarPath);
  
      } else {
        return res.status(400).json({ error: 'Unsupported input type' });
      }
  
      res.download(result.sbomPath, 'sbom.json', () => {
        result.cleanup();
      });
  
    } catch (err) {
      console.error('❌ SBOM generation failed:', err.message);
      res.status(500).json({ error: 'Failed to generate SBOM', details: err.message });
    }
}

module.exports = {
  handleSBOMGeneration,
};
