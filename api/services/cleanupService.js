const fs = require('fs');

/**
 * Deletes a file after processing.
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file: ${error.message}`);
  }
}

/**
 * Recursively deletes a directory and its contents.
 */
function cleanupDirectory(directoryPath) {
  try {
    if (fs.existsSync(directoryPath)) {
      fs.rmSync(directoryPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted directory: ${directoryPath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting directory: ${error.message}`);
  }
}

module.exports = {
  cleanupFile,
  cleanupDirectory
};
