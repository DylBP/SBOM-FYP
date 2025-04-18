const path = require('path');
const { generateFromArchive, generateFromDockerImage } = require('../services/generatorService');

async function handleSBOMGeneration(req, res) {
  try {
    const inputType = req.body.inputType || 'archive'; // e.g., 'archive', 'docker'
    let result;

    if (inputType === 'archive') {
      const zipPath = path.join(__dirname, '../temp', req.file.filename);
      result = await generateFromArchive(zipPath);
    } else if (inputType === 'docker') {
      const imageName = req.body.image;
      if (!imageName) return res.status(400).json({ error: 'Image name required' });
      result = await generateFromDockerImage(imageName);
    } else {
      return res.status(400).json({ error: 'Unsupported input type' });
    }

    res.download(result.sbomPath, 'sbom.json', () => {
      result.cleanup(); // ✅ Clean up everything after download
    });

  } catch (err) {
    console.error('❌ SBOM generation failed:', err.message);
    res.status(500).json({ error: 'Failed to generate SBOM', details: err.message });
  }
}

module.exports = {
  handleSBOMGeneration,
};
