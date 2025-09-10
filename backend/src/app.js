const express = require('express');
const cors = require('cors');
require('dotenv').config();

const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');
const shopifyRoutes = require('./routes/shopify');
const insightsRoutes = require('./routes/insights');
const webhookRoutes = require('./routes/webhook');

const app = express();

securityMiddleware(app);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/webhook', webhookRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Health check: http://localhost:${PORT}/health`);
  }
});