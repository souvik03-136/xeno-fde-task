const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

require('dotenv').config();

const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');
const shopifyRoutes = require('./routes/shopify');
const insightsRoutes = require('./routes/insights');
const webhookRoutes = require('./routes/webhook');
const { setupScheduler } = require('./services/scheduler');

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use('/api/webhook', express.raw({ type: 'application/json' }));

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

securityMiddleware(app);

app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/webhook', webhookRoutes);

app.use((error, req, res, next) => {
  if (error.status === 400 && error.message === 'Invalid JSON') {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(error);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Initialize Prisma client and start server
async function startServer() {
  try {
    console.log('Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('Prisma client generated successfully');
    
    // Push database schema if in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Pushing database schema...');
      await execAsync('npx prisma db push');
      console.log('Database schema updated');
    }
  } catch (error) {
    console.log('Prisma setup warning:', error.message);
    console.log('Continuing with existing Prisma client...');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    setupScheduler();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Health check: http://localhost:${PORT}/health`);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();