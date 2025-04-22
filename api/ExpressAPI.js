require('dotenv').config();

const express = require('express');
const sbomRoutes = require('./routes/sbomRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const {authenticateToken } = require('./middlewares/authMiddleware');

const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

// Start the server
async function startServer() {
  try {
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
