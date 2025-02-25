const multer = require('multer');
const path = require('path');

const FILES_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
const fs = require('fs');
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({ storage });

module.exports = upload;
