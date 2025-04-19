require('dotenv').config();

const express = require('express');
const sbomRoutes = require('./routes/sbomRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const {authenticateToken } = require('./middlewares/authMiddleware');

const { createSBOMBucket } = require('./services/s3Service');
const { createSBOMTable, createProjectsTable } = require('./services/dynamoService');
const { deleteSBOMBucket, deleteTables } = require('./services/cleanupService');

const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

// Initialize resources (S3, DynamoDB)
async function initializeResources() {
  try {
    await createSBOMBucket();
    await createSBOMTable();
    await createProjectsTable();
    console.log(`✔️ SBOM Bucket and Table created successfully!`);
  } catch (error) {
    console.error('❌ Error initializing resources:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('🔔 Shutting down gracefully...');
  await deleteSBOMBucket();
  await deleteTables();
  console.log('✅ Cleanup complete. Server shutting down...');
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
async function startServer() {
  try {
    await initializeResources();
    const server = app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
    });
    module.exports = server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Define routes
app.get('/', (req, res) => res.send('✅ SBOM API Running!'));

// Public routes (no authentication required)
app.use('/auth', authRoutes); // Public (signup/login/confirm)

// Protected routes (authentication required)
app.use('/api', authenticateToken, sbomRoutes);

// Project routes (authentication required)
app.use('/api/projects', authenticateToken, projectRoutes);
