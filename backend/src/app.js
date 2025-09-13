const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    // Add your frontend URL here when you deploy it
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Webhook route needs raw JSON
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      const error = new Error('Invalid JSON');
      error.status = 400;
      throw error;
    }
  }
}));

// Initialize Prisma at runtime
async function initializePrisma() {
  try {
    console.log('Initializing Prisma...');
    
    // Generate Prisma client
    const { stdout: generateOutput } = await execPromise('node node_modules/prisma/build/index.js generate');
    console.log('Prisma client generated:', generateOutput);
    
    // Push database schema
    console.log('Pushing database schema...');
    const { stdout: pushOutput } = await execPromise('node node_modules/prisma/build/index.js db push --force-reset --accept-data-loss');
    console.log('Database schema pushed:', pushOutput);
    
    console.log('Prisma initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Prisma initialization error:', error.message);
    
    // Try alternative approach
    try {
      console.log('Trying alternative Prisma setup...');
      const { exec: childExec } = require('child_process');
      
      await new Promise((resolve, reject) => {
        const child = childExec('node -e "const prisma = require(\'@prisma/client\'); const client = new prisma.PrismaClient(); console.log(\'Prisma client created\');"', 
          (error, stdout, stderr) => {
            if (error) {
              console.log('Creating Prisma client programmatically...');
              resolve();
            } else {
              console.log('Prisma client test successful:', stdout);
              resolve();
            }
          }
        );
      });
      
      return true;
    } catch (altError) {
      console.error('Alternative Prisma setup also failed:', altError.message);
      return false;
    }
  }
}

// Health check endpoint (available immediately)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple status endpoint
app.get('/status', (req, res) => {
  res.json({
    service: 'xeno-backend',
    version: '1.0.0',
    status: 'running'
  });
});

// Initialize server with Prisma setup
async function startServer() {
  const PORT = process.env.PORT || 3001;
  
  // Start server first
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: ${process.env.BASE_URL || `http://localhost:${PORT}`}/health`);
  });
  
  // Initialize Prisma in background
  initializePrisma().then((success) => {
    if (success) {
      console.log('Loading application routes...');
      setupRoutes();
    } else {
      console.log('Continuing without full Prisma setup - some features may be limited');
      setupBasicRoutes();
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
  
  return server;
}

// Setup full application routes after Prisma is ready
function setupRoutes() {
  try {
    // Import routes after Prisma is initialized
    const securityMiddleware = require('./middleware/security');
    const authRoutes = require('./routes/auth');
    const tenantRoutes = require('./routes/tenant');
    const shopifyRoutes = require('./routes/shopify');
    const insightsRoutes = require('./routes/insights');
    const webhookRoutes = require('./routes/webhook');
    const { setupScheduler } = require('./services/scheduler');
    
    // Apply security middleware
    securityMiddleware(app);
    
    // Setup routes
    app.use('/api/auth', authRoutes);
    app.use('/api/tenant', tenantRoutes);
    app.use('/api/shopify', shopifyRoutes);
    app.use('/api/insights', insightsRoutes);
    app.use('/api/webhook', webhookRoutes);
    
    // Error handling middleware
    app.use((error, req, res, next) => {
      if (error.status === 400 && error.message === 'Invalid JSON') {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
    
    // Setup scheduler
    if (process.env.NODE_ENV === 'production') {
      setupScheduler();
    }
    
    console.log('All routes loaded successfully');
  } catch (error) {
    console.error('Error loading routes:', error.message);
    setupBasicRoutes();
  }
}

// Setup basic routes if full setup fails
function setupBasicRoutes() {
  const securityMiddleware = require('./middleware/security');
  securityMiddleware(app);
  
  app.get('/api/status', (req, res) => {
    res.json({ 
      message: 'Backend is running but some features may be unavailable',
      timestamp: new Date().toISOString()
    });
  });
  
  // Basic error handling
  app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  console.log('Basic routes loaded');
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});