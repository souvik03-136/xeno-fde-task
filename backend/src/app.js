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
    // Your main Vercel domain
    process.env.FRONTEND_URL,
    // Additional Vercel deployment patterns
    'https://xenofrontend-nu.vercel.app',
    'https://xenofrontend-git-main-souvik03-136s-projects.vercel.app',
    // Pattern to match all Vercel preview deployments
    /^https:\/\/xenofrontend-.*\.vercel\.app$/,
    /^https:\/\/xenofrontend-.*-souvik03-136s-projects\.vercel\.app$/,
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  // Add these to handle preflight requests properly
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-tenant-id',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ]
};

app.use(cors(corsOptions));

// Add explicit preflight handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, Accept, Origin, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

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

// Basic auth endpoint for immediate testing (will be overridden by real auth routes)
app.post('/api/auth/login', (req, res) => {
  console.log('Basic auth endpoint hit - Login attempt received:', req.body);
  res.status(501).json({
    error: 'Auth system is still loading. Please try again in a few moments.',
    message: 'Routes are being initialized',
    timestamp: new Date().toISOString()
  });
});

// Basic auth register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Basic auth endpoint hit - Register attempt received:', req.body);
  res.status(501).json({
    error: 'Auth system is still loading. Please try again in a few moments.',
    message: 'Routes are being initialized',
    timestamp: new Date().toISOString()
  });
});

// Initialize server with Prisma setup
async function startServer() {
  const PORT = process.env.PORT || 3001;
  
  // Start server first
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: ${process.env.BASE_URL || `http://localhost:${PORT}`}/health`);
    console.log('CORS origins configured:', corsOptions.origin);
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
  }).catch(error => {
    console.error('Error during Prisma initialization:', error);
    setupBasicRoutes();
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
    
    // Setup routes - these will override the basic auth endpoints
    app.use('/api/auth', authRoutes);
    app.use('/api/tenant', tenantRoutes);
    app.use('/api/shopify', shopifyRoutes);
    app.use('/api/insights', insightsRoutes);
    app.use('/api/webhook', webhookRoutes);
    
    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    // Error handling middleware
    app.use((error, req, res, next) => {
      if (error.status === 400 && error.message === 'Invalid JSON') {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      console.error('Server error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // Setup scheduler
    if (process.env.NODE_ENV === 'production') {
      setupScheduler();
    }
    
    console.log('All routes loaded successfully');
  } catch (error) {
    console.error('Error loading routes:', error.message);
    console.error('Stack trace:', error.stack);
    setupBasicRoutes();
  }
}

// Setup basic routes if full setup fails
function setupBasicRoutes() {
  try {
    const securityMiddleware = require('./middleware/security');
    securityMiddleware(app);
    console.log('Security middleware applied');
  } catch (error) {
    console.warn('Security middleware not available:', error.message);
  }
  
  // Mark routes as failed to load
  routesLoaded = false;
  
  app.get('/api/status', (req, res) => {
    res.json({ 
      message: 'Backend is running but some features may be unavailable',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      routesLoaded: false
    });
  });
  
  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      message: 'This endpoint is not available or still loading'
    });
  });
  
  // Basic error handling
  app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('Basic routes loaded');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});