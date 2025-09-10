const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');
const shopifyRoutes = require('./routes/shopify');
const insightsRoutes = require('./routes/insights');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/insights', insightsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});