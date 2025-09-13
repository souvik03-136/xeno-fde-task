import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Import your modules
import securityMiddleware from './middleware/security.js';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';
import shopifyRoutes from './routes/shopify.js';
import insightsRoutes from './routes/insights.js';
import webhookRoutes from './routes/webhook.js';
import { setupScheduler } from './services/scheduler.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

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

// Database setup function
async function setupDatabase() {
  try {
    // Test database connection
    await prisma.$executeRaw`SELECT 1`;
    console.log('Database connection successful');
    
    // Check if tables exist by trying to query a basic table
    try {
      await prisma.user.findFirst();
      console.log('Database schema appears to be intact');
    } catch (schemaError) {
      console.log('Database schema may need updating, attempting to push schema...');
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('Database schema pushed successfully');
      } catch (pushError) {
        console.error('Failed to push database schema:', pushError.message);
      }
    }
  } catch (connectionError) {
    console.error('Database connection failed:', connectionError.message);
    
    // Attempt to push schema if connection fails (might be due to missing tables)
    console.log('Attempting to push database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('Database schema pushed successfully');
    } catch (pushError) {
      console.error('Failed to push database schema:', pushError.message);
    }
  }
}

// Start the application
async function startServer() {
  try {
    // Setup database first
    await setupDatabase();
    
    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      setupScheduler();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Health check: http://localhost:${PORT}/health`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();