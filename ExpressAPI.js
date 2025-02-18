const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Directory for stored files
const FILES_DIR = path.join(__dirname, "files");

// Serve static files
app.use("/files", express.static(FILES_DIR));

// API to download a file
app.get("/download/:filename", (req, res) => {
    const filePath = path.join(FILES_DIR, req.params.filename);
    res.download(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: "File not found" });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`File API running on port ${port}`);
});
