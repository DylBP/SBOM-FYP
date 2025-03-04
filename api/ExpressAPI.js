const express = require('express');
const { PORT } = require('./config/env');
const sbomRoutes = require('./routes/sbomRoutes');
const authRoutes = require('./routes/authRoutes'); // Import the auth routes
const { createSBOMBucket } = require('./services/s3Service');
const { createSBOMTable } = require('./services/dynamoService');
const { createUserPool, createUserPoolClient } = require('./services/cognitoService');
const { deleteCognitoResources, deleteSBOMBucket, deleteSBOMTable } = require('./services/cleanupService');

const app = express();
app.use(express.json());

// ================================
// Initialize Resources (Create Bucket, Table, and Cognito Pool)
// ================================
async function initializeResources() {
  try {
    // Create S3 Bucket and DynamoDB Table
    await createSBOMBucket();
    await createSBOMTable();

    console.log(`✔️ SBOM Bucket and Table created successfully!`);
  } catch (error) {
    console.error('❌ Error initializing resources:', error);
    process.exit(1);
  }
}

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
async function startServer() {
  try {
    // Initialize resources
    await initializeResources();

    // Start the Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // To allow graceful shutdown
    module.exports = server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Exit if server fails to start
  }
}

startServer();

// Route Setup
app.get('/', (req, res) => res.send('✅ SBOM API Running!'));
app.use('/api', sbomRoutes);  // SBOM routes
app.use('/auth', authRoutes);  // Authentication routes (signup/signin)
