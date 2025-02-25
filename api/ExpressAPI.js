const express = require('express');
const { PORT } = require('./config/env');
const sbomRoutes = require('./routes/sbomRoutes');
const { createSBOMBucket, deleteSBOMBucket } = require('./services/s3Service');
const { createSBOMTable, deleteSBOMTable } = require('./services/dynamoService');

const app = express();
app.use(express.json());

// ================================
// Initialize Resources (Create Bucket and Table)
// ================================
createSBOMBucket();
createSBOMTable();

// ================================
// Graceful Shutdown Function
// ================================
async function gracefulShutdown() {
  console.log('🔔 Shutting down gracefully...');

  // Clean up S3 bucket
  await deleteSBOMBucket();

  // Clean up DynamoDB table
  await deleteSBOMTable();

  // Perform any other cleanup tasks if needed

  console.log('✅ Cleanup complete. Server shutting down...');
  process.exit(0); // Exit the process after cleanup
}

// ================================
// Handle Termination Signals
// ================================
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ================================
// Server Setup
// ================================
app.get('/', (req, res) => res.send('✅ SBOM API Running!'));
app.use('/api', sbomRoutes);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// To allow graceful shutdown
module.exports = server;
