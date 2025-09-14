# Xeno FDE Backend - Multi-tenant Shopify Data Ingestion & Insights Service

## 🎯 Overview

The Xeno FDE Backend is a multi-tenant Shopify data ingestion and insights service that enables enterprise retailers to onboard, integrate, and analyze their customer data. Built with Node.js, Express, Prisma, and PostgreSQL, it provides comprehensive API endpoints for authentication, tenant management, data synchronization, and business insights.

### Key Features
- **Multi-tenant Architecture**: Isolated data storage and processing per tenant
- **Real-time Data Sync**: Webhook-based and scheduled Shopify data ingestion  
- **Comprehensive Analytics**: Customer insights, revenue tracking, and business metrics
- **RESTful APIs**: Well-documented endpoints for all functionalities
- **Secure Authentication**: JWT-based auth with role-based access control
- **Scalable Design**: Production-ready with proper error handling and logging

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Dashboard]
        MOB[Mobile App]
    end
    
    subgraph "API Gateway Layer"
        LB[Load Balancer]
        CORS[CORS Middleware]
        SEC[Security Middleware]
        RATE[Rate Limiter]
    end
    
    subgraph "Application Layer"
        AUTH[Auth Service]
        TENANT[Tenant Service]
        SHOPIFY[Shopify Service]
        INSIGHTS[Insights Service]
        WEBHOOK[Webhook Handler]
        SCHEDULER[Task Scheduler]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    subgraph "External Services"
        SHOPIFY_API[Shopify API]
        EMAIL[Email Service]
    end
    
    subgraph "Infrastructure"
        DOCKER[Docker Containers]
        MONITOR[Monitoring/Logging]
        BACKUP[Database Backup]
    end
    
    UI --> LB
    MOB --> LB
    LB --> CORS
    CORS --> SEC
    SEC --> RATE
    
    RATE --> AUTH
    RATE --> TENANT
    RATE --> SHOPIFY
    RATE --> INSIGHTS
    RATE --> WEBHOOK
    
    AUTH --> POSTGRES
    TENANT --> POSTGRES
    SHOPIFY --> POSTGRES
    INSIGHTS --> POSTGRES
    WEBHOOK --> POSTGRES
    
    SHOPIFY --> SHOPIFY_API
    SCHEDULER --> SHOPIFY
    SHOPIFY_API --> WEBHOOK
    
    POSTGRES --> REDIS
    
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef app fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef external fill:#fce4ec
    classDef infra fill:#f1f8e9
    
    class UI,MOB frontend
    class LB,CORS,SEC,RATE api
    class AUTH,TENANT,SHOPIFY,INSIGHTS,WEBHOOK,SCHEDULER app
    class POSTGRES,REDIS data
    class SHOPIFY_API,EMAIL external
    class DOCKER,MONITOR,BACKUP infra
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Shopify
    
    User->>Frontend: Login Request
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Validate User
    Database-->>Backend: User Data
    Backend-->>Frontend: JWT Token
    Frontend-->>User: Dashboard Access
    
    User->>Frontend: Create Tenant
    Frontend->>Backend: POST /api/tenant
    Backend->>Database: Create Tenant Record
    Database-->>Backend: Tenant Created
    Backend-->>Frontend: Tenant Data
    
    User->>Frontend: Sync Shopify Data
    Frontend->>Backend: POST /api/shopify/sync
    Backend->>Shopify: Fetch Products/Customers/Orders
    Shopify-->>Backend: Data Response
    Backend->>Database: Store Data
    Database-->>Backend: Success
    Backend-->>Frontend: Sync Complete
    
    Shopify->>Backend: Webhook (New Order)
    Backend->>Database: Update Records
    Database-->>Backend: Updated
    Backend-->>Frontend: Real-time Update
```

### Multi-tenant Data Isolation

```mermaid
graph LR
    subgraph "Tenant A"
        TA_USERS[Users]
        TA_CUSTOMERS[Customers]
        TA_ORDERS[Orders]
        TA_PRODUCTS[Products]
    end
    
    subgraph "Tenant B"
        TB_USERS[Users]
        TB_CUSTOMERS[Customers]
        TB_ORDERS[Orders]
        TB_PRODUCTS[Products]
    end
    
    subgraph "Shared Database"
        TENANT_TABLE[Tenants Table]
        USER_TABLE[Users Table]
        CUSTOMER_TABLE[Customers Table]
        ORDER_TABLE[Orders Table]
        PRODUCT_TABLE[Products Table]
    end
    
    TA_USERS --> USER_TABLE
    TA_CUSTOMERS --> CUSTOMER_TABLE
    TA_ORDERS --> ORDER_TABLE
    TA_PRODUCTS --> PRODUCT_TABLE
    
    TB_USERS --> USER_TABLE
    TB_CUSTOMERS --> CUSTOMER_TABLE
    TB_ORDERS --> ORDER_TABLE
    TB_PRODUCTS --> PRODUCT_TABLE
    
    TENANT_TABLE --> USER_TABLE
    TENANT_TABLE --> CUSTOMER_TABLE
    TENANT_TABLE --> ORDER_TABLE
    TENANT_TABLE --> PRODUCT_TABLE
    
    classDef tenantA fill:#e3f2fd
    classDef tenantB fill:#e8f5e8
    classDef shared fill:#fff3e0
    
    class TA_USERS,TA_CUSTOMERS,TA_ORDERS,TA_PRODUCTS tenantA
    class TB_USERS,TB_CUSTOMERS,TB_ORDERS,TB_PRODUCTS tenantB
    class TENANT_TABLE,USER_TABLE,CUSTOMER_TABLE,ORDER_TABLE,PRODUCT_TABLE shared
```

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/souvik03-136/xeno-fde-task.git
cd xeno-fde-task
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file in the backend root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>"

# JWT Configuration
JWT_SECRET="<generated_jwt_secret_64_chars>"

# Server Configuration
PORT=3001
NODE_ENV=development
BASE_URL="http://localhost:3001"

# Frontend Configuration
FRONTEND_URL="http://localhost:3000"

# Shopify Webhook Security
SHOPIFY_WEBHOOK_SECRET="<your_shopify_webhook_secret>"

# Shopify API Credentials (for OAuth flows)
SHOPIFY_API_KEY="<your_shopify_api_key>"
SHOPIFY_API_SECRET="<your_shopify_api_secret>"

# Shopify Private App Credentials (for direct API access)
SHOPIFY_PRIVATE_API_KEY="<your_shopify_private_api_key>"
SHOPIFY_PRIVATE_API_SECRET="<your_shopify_private_api_secret>"
SHOPIFY_ACCESS_TOKEN="<your_shopify_access_token>"
SHOPIFY_DOMAIN="<your_shopify_domain>.myshopify.com"
```

### Environment-Specific Configurations

#### Development
```bash
NODE_ENV=development
BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

#### Production
```bash
NODE_ENV=production
BASE_URL="https://your-backend-domain.com"
FRONTEND_URL="https://your-frontend-domain.com"
```

## 💾 Database Setup

### Schema Overview

```mermaid
erDiagram
    User ||--o{ Tenant : "owns"
    Tenant ||--o{ Customer : "has"
    Tenant ||--o{ Product : "has"
    Tenant ||--o{ Order : "has"
    Tenant ||--o{ Webhook : "has"
    Tenant ||--o{ Event : "has"
    Customer ||--o{ Order : "places"
    Customer ||--o{ Event : "triggers"
    Order ||--o{ OrderItem : "contains"
    Product ||--o{ OrderItem : "featured_in"
    
    User {
        string id PK
        string email UK
        string password
        datetime createdAt
        datetime updatedAt
    }
    
    Tenant {
        string id PK
        string name
        string shopifyDomain UK
        string shopifyToken
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Customer {
        string id PK
        string shopifyId
        string email
        string firstName
        string lastName
        float totalSpent
        int ordersCount
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Product {
        string id PK
        string shopifyId
        string title
        float price
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Order {
        string id PK
        string shopifyId
        string orderNumber
        float totalPrice
        string customerId FK
        string tenantId FK
        datetime orderDate
        datetime createdAt
        datetime updatedAt
    }
    
    OrderItem {
        string id PK
        int quantity
        float price
        string orderId FK
        string productId FK
    }
    
    Webhook {
        string id PK
        string topic
        string address
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Event {
        string id PK
        string type
        string customerId FK
        string tenantId FK
        json data
        datetime createdAt
    }
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Reset database (development only)
npx prisma db push --force-reset --accept-data-loss

# View database in Prisma Studio
npx prisma studio

# Create migration (when ready for production)
npx prisma migrate dev --name init
```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

### Authentication

All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints Overview

```mermaid
graph LR
    subgraph "Public Endpoints"
        AUTH_LOGIN[POST /auth/login]
        AUTH_REGISTER[POST /auth/register]
        HEALTH[GET /health]
        STATUS[GET /status]
    end
    
    subgraph "Protected Endpoints"
        TENANT_CREATE[POST /tenant]
        TENANT_LIST[GET /tenant]
        SHOPIFY_SYNC[POST /shopify/sync]
        SHOPIFY_WEBHOOKS[POST /shopify/webhooks/register]
        INSIGHTS_DASHBOARD[GET /insights/dashboard]
        INSIGHTS_CARTS[GET /insights/abandoned-carts]
    end
    
    subgraph "Webhook Endpoints"
        WEBHOOK_HANDLER[POST /webhook/:tenantId]
    end
    
    classDef public fill:#e8f5e8
    classDef protected fill:#e3f2fd
    classDef webhook fill:#fff3e0
    
    class AUTH_LOGIN,AUTH_REGISTER,HEALTH,STATUS public
    class TENANT_CREATE,TENANT_LIST,SHOPIFY_SYNC,SHOPIFY_WEBHOOKS,INSIGHTS_DASHBOARD,INSIGHTS_CARTS protected
    class WEBHOOK_HANDLER webhook
```

### Authentication Routes

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com", 
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

### Tenant Management Routes

#### POST `/api/tenant`
Create a new tenant (Shopify store).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "My Store",
  "shopifyDomain": "mystore.myshopify.com",
  "shopifyToken": "shopify_access_token"
}
```

**Response:**
```json
{
  "id": "tenant_id",
  "name": "My Store",
  "shopifyDomain": "mystore.myshopify.com",
  "userId": "user_id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/api/tenant`
List all tenants for authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "tenant_id",
    "name": "My Store",
    "shopifyDomain": "mystore.myshopify.com",
    "userId": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Shopify Integration Routes

#### POST `/api/shopify/sync`
Sync data from Shopify store.

**Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
```

**Response:**
```json
{
  "message": "Data sync completed"
}
```

#### POST `/api/shopify/webhooks/register`
Register webhooks with Shopify.

**Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
```

**Response:**
```json
{
  "message": "Webhooks registered successfully"
}
```

#### GET `/api/shopify/:resource`
Get Shopify data (products, customers, orders).

**Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
```

**Parameters:**
- `resource`: products | customers | orders

**Response:**
```json
{
  "data": [...], // Shopify API response
  "count": 100
}
```

### Insights & Analytics Routes

#### GET `/api/insights/dashboard`
Get dashboard statistics and metrics.

**Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
```

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response:**
```json
{
  "totalCustomers": 150,
  "totalOrders": 300,
  "totalRevenue": 15000.50,
  "ordersByDate": [
    {
      "date": "2024-01-01",
      "orders": 5,
      "revenue": 250.00
    }
  ],
  "topCustomers": [
    {
      "firstName": "John",
      "lastName": "Doe", 
      "email": "john@example.com",
      "totalSpent": 500.00,
      "ordersCount": 3
    }
  ],
  "revenueByProduct": [
    {
      "product": "Product Name",
      "revenue": 1000.00,
      "quantity": 10
    }
  ],
  "abandonedCarts": 25
}
```

#### GET `/api/insights/abandoned-carts`
Get abandoned cart events.

**Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
```

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response:**
```json
[
  {
    "id": "event_id",
    "type": "cart_abandoned",
    "customer": {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "data": {
      "cart": {...},
      "abandonedAt": "2024-01-01T10:30:00.000Z"
    },
    "createdAt": "2024-01-01T10:30:00.000Z"
  }
]
```

### Webhook Routes

#### POST `/api/webhook/:tenantId`
Handle incoming Shopify webhooks.

**Parameters:**
- `tenantId`: Tenant identifier

**Headers:**
```
x-shopify-topic: orders/create
x-shopify-hmac-sha256: <webhook_signature>
```

**Supported Webhook Topics:**
- `orders/create`
- `orders/updated`
- `customers/create`
- `customers/update`
- `carts/update`
- `checkouts/create`
- `checkouts/update`

**Response:**
```json
{
  "received": true
}
```

### Health Check Routes

#### GET `/health`
Basic health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

#### GET `/status`
Service status endpoint.

**Response:**
```json
{
  "service": "xeno-backend",
  "version": "1.0.0", 
  "status": "running"
}
```

## 🔗 Shopify Integration

### Integration Flow

```mermaid
sequenceDiagram
    participant Admin as Store Admin
    participant Backend as Xeno Backend
    participant Shopify as Shopify API
    participant Webhook as Shopify Webhooks
    
    Admin->>Backend: Create Tenant with Shopify Token
    Backend->>Shopify: Test API Connection
    Shopify-->>Backend: Connection Success
    
    Admin->>Backend: Trigger Initial Sync
    Backend->>Shopify: Fetch Customers
    Backend->>Shopify: Fetch Products
    Backend->>Shopify: Fetch Orders
    Shopify-->>Backend: Data Responses
    Backend->>Backend: Store in Database
    
    Backend->>Shopify: Register Webhooks
    Shopify-->>Backend: Webhook URLs Registered
    
    Note over Webhook: Real-time Updates
    Webhook->>Backend: New Order Created
    Backend->>Backend: Update Database
    
    Note over Backend: Scheduled Sync
    Backend->>Shopify: Daily Data Sync
    Shopify-->>Backend: Latest Data
```

### Supported Shopify Resources

#### Products
- **Fields**: id, title, price, variants
- **Sync Frequency**: Daily + real-time webhooks
- **Endpoints**: `/admin/api/2023-10/products.json`

#### Customers  
- **Fields**: id, email, first_name, last_name, total_spent, orders_count
- **Sync Frequency**: Daily + real-time webhooks
- **Endpoints**: `/admin/api/2023-10/customers.json`

#### Orders
- **Fields**: id, order_number, total_price, customer, line_items, created_at
- **Sync Frequency**: Daily + real-time webhooks  
- **Endpoints**: `/admin/api/2023-10/orders.json`

### Webhook Configuration

The system automatically registers these webhooks with Shopify:

```javascript
const webhooksToRegister = [
  'orders/create',      // New order placed
  'orders/updated',     // Order modified
  'customers/create',   // New customer registered  
  'customers/update',   // Customer info updated
  'checkouts/create',   // Checkout started
  'checkouts/update'    // Checkout modified (cart abandonment)
];
```

### API Rate Limiting

Shopify enforces API rate limits:
- **REST API**: 2 requests per second per app
- **GraphQL**: 1000 points per minute per app

The system implements:
- Request throttling with 500ms delays
- Exponential backoff on rate limit errors
- Pagination for large data sets (50 items per page)

## 🏢 Multi-tenancy

### Tenant Isolation Strategy

The system uses **row-level security** with tenant identifiers to ensure complete data isolation:

```sql
-- Every tenant-specific table includes tenantId
-- All queries automatically filter by tenant
SELECT * FROM customers WHERE tenantId = 'tenant_123';
SELECT * FROM orders WHERE tenantId = 'tenant_123';
```

### Middleware Chain

```mermaid
graph LR
    REQUEST[HTTP Request] --> AUTH[Auth Middleware]
    AUTH --> TENANT[Tenant Middleware]
    TENANT --> CONTROLLER[Route Controller]
    CONTROLLER --> DATABASE[Database Query]
    
    AUTH -->|Invalid Token| ERROR401[401 Unauthorized]
    TENANT -->|Invalid Tenant| ERROR403[403 Forbidden]
    
    classDef middleware fill:#e3f2fd
    classDef error fill:#ffebee
    
    class AUTH,TENANT middleware
    class ERROR401,ERROR403 error
```

### Tenant Context

Every protected request must include:
1. **JWT Token**: Identifies the authenticated user
2. **Tenant ID Header**: Specifies which tenant's data to access

```javascript
// Tenant middleware validates access
const tenant = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  const tenantData = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      userId: req.user.id  // Ensures user owns this tenant
    }
  });
  req.tenant = tenantData;
  next();
};
```

## 🔒 Security

### Security Measures Implemented

#### Authentication & Authorization
- **JWT Tokens**: 7-day expiration with secure signing
- **Password Hashing**: bcryptjs with salt rounds = 12
- **Role-based Access**: User → Tenant ownership validation

#### API Security
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries

#### Webhook Security
- **HMAC Signature Verification**: Validates Shopify webhook authenticity
- **Raw Body Parsing**: Prevents tampering with webhook data

#### Infrastructure Security
- **Helmet.js**: Sets security headers
- **Environment Variables**: Sensitive data not in code
- **HTTPS Only**: Production traffic encrypted
- **Database Connections**: SSL/TLS encrypted

### Security Headers

```javascript
// Helmet.js automatically sets these headers:
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000"
}
```

## 🚀 Deployment

### Production Deployment Guide

#### 1. Database Setup

**PostgreSQL on Railway/Heroku:**
```bash
# Set DATABASE_URL in environment
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

#### 2. Environment Variables

Set these in your production environment:
```bash
NODE_ENV=production
DATABASE_URL=<production_database_url>
JWT_SECRET=<secure_64_char_string>
BASE_URL=<your_backend_domain>
FRONTEND_URL=<your_frontend_domain>
SHOPIFY_WEBHOOK_SECRET=<shopify_webhook_secret>
# ... other Shopify credentials
```

#### 3. Deployment Platforms

**Render Deployment:**
```yaml
# render.yaml
services:
  - type: web
    name: xeno-backend
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: xeno-db
          property: connectionString
```

**Vercel Deployment:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js"
    }
  ]
}
```

**Docker Deployment:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
```

#### 4. Database Migration

```bash
# Production database setup
npx prisma db push
# Or for versioned migrations:
npx prisma migrate deploy
```

#### 5. Health Checks

Configure health check endpoints:
- **Readiness**: `GET /health`
- **Liveness**: `GET /status`

## 💻 Development

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push

# Start development server
npm run dev
```

### Available Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "sync:test": "node test-sync.js"
  }
}
```

### Development Tools

#### Testing Shopify Sync
```bash
node test-sync.js
```

#### Database Management
```bash
# View data in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset --accept-data-loss
```

#### Debugging

Set environment variable for detailed logging:
```bash
DEBUG=xeno:* npm run dev
```

### Code Structure

```
src/
├── app.js                 # Main application setup
├── controllers/           # Route handlers
│   ├── auth.js           # Authentication logic
│   ├── insights.js       # Analytics & insights
│   ├── shopify.js        # Shopify integration
│   ├── tenant.js         # Tenant management
│   └── webhookHandler.js # Webhook processing
├── middleware/            # Express middleware
│   ├── auth.js           # JWT authentication
│   ├── security.js       # Security headers
│   ├── tenant.js         # Tenant context
│   ├── validation.js     # Input validation
│   └── verifyWebhook.js  # Webhook verification
├── models/               # Database models
│   └── index.js         # Prisma client
├── routes/               # Route definitions  
│   ├── auth.js          # Auth routes
│   ├── insights.js      # Insights routes
│   ├── shopify.js       # Shopify routes
│   ├── tenant.js        # Tenant routes
│   └── webhook.js       # Webhook routes
└── services/             # Business logic
    ├── scheduler.js      # Cron jobs
    └── shopify.js        # Shopify API service
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: `P1001: Can't connect to database server`

**Solution**:
```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:password@host:port/database"

# Test connection
npx prisma db push
```

#### 2. Shopify API Authentication

**Problem**: `401 Unauthorized` from Shopify API

**Solution**:
```bash
# Verify credentials in .env
SHOPIFY_ACCESS_TOKEN=<valid_token>
SHOPIFY_DOMAIN=<store>.myshopify.com

# Test connection
node test-sync.js
```

#### 3. Webhook Signature Verification Failed

**Problem**: `Invalid webhook signature`

**Solution**:
```bash
# Ensure correct webhook secret
SHOPIFY_WEBHOOK_SECRET=<exact_secret_from_shopify>

# Check webhook endpoint is publicly accessible
# Localhost URLs won't work for Shopify webhooks
```

#### 4. CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
```javascript
// Update CORS origins in app.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com'
  ]
};
```

#### 5. JWT Token Issues

**Problem**: `Invalid token` errors

**Solution**:
```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update JWT_SECRET in .env
JWT_SECRET=<new_secret>
```

### Debugging Tips

#### Enable Detailed Logging
```javascript
// Add to app.js
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

#### Database Query Logging
```javascript
// In models/index.js
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

#### API Response Logging
```javascript
// Log all API responses
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`Response ${res.statusCode}:`, data);
    return originalJson.call(this, data);
  };
  next();
});
```

### Testing Commands

#### 1. Test Database Connection
```bash
npx prisma db push --preview-feature
```

#### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### 3. Test Shopify Integration
```bash
# Test sync functionality
node test-sync.js

# Check sync results
npx prisma studio
```

#### 4. Test Scheduler
The scheduler runs daily at 2 AM. To test immediately, run:
```bash
node -e "require('./src/services/scheduler').syncAllTenants()"
```

#### 5. Test Shopify API Connection
Run the test sync script:
```bash
node test-sync.js
```

## 📊 Production Considerations

### Performance Optimization

#### Database Indexing
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_customers_tenant_id ON customers(tenantId);
CREATE INDEX idx_orders_tenant_id ON orders(tenantId);  
CREATE INDEX idx_orders_customer_id ON orders(customerId);
CREATE INDEX idx_orders_date ON orders(orderDate);
CREATE INDEX idx_events_tenant_type ON events(tenantId, type);
```

#### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Cache dashboard stats for 5 minutes
const cacheKey = `dashboard:${tenantId}`;
const cachedData = await client.get(cacheKey);
if (cachedData) {
  return JSON.parse(cachedData);
}
// ... generate fresh data
await client.setex(cacheKey, 300, JSON.stringify(data));
```

#### Connection Pooling
```javascript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=60'
    }
  }
});
```

### Monitoring & Observability

#### Health Monitoring
```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const checks = {
    database: false,
    shopify: false,
    redis: false
  };
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    
    // Redis check (if using)
    if (redisClient) {
      await redisClient.ping();
      checks.redis = true;
    }
    
    // External API check
    checks.shopify = await testShopifyConnection();
    
    const isHealthy = Object.values(checks).every(Boolean);
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### Error Tracking
```javascript
// Centralized error handling
app.use((error, req, res, next) => {
  // Log error details
  console.error(`Error ${error.status || 500}:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  // Send appropriate response
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});
```

### Scalability Considerations

#### Horizontal Scaling
```yaml
# Docker Compose for multiple instances
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001-3003:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

#### Load Balancing Configuration
```nginx
# nginx.conf
upstream backend {
    server app:3001;
    server app:3002;
    server app:3003;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Queue System for Heavy Operations
```javascript
// Using Bull Queue for background jobs
const Queue = require('bull');
const syncQueue = new Queue('sync queue');

// Add sync job to queue
syncQueue.add('shopify-sync', { tenantId }, {
  attempts: 3,
  backoff: 'exponential',
  delay: 2000
});

// Process sync jobs
syncQueue.process('shopify-sync', async (job) => {
  const { tenantId } = job.data;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  await syncShopifyData(tenant);
});
```

### Security Hardening

#### API Rate Limiting by User
```javascript
// User-specific rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (windowMs, max) => rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs,
  max,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Too many requests from this user'
});

// Different limits for different endpoints
app.use('/api/auth', createRateLimiter(15 * 60 * 1000, 5)); // 5 auth attempts per 15min
app.use('/api/shopify/sync', createRateLimiter(60 * 1000, 1)); // 1 sync per minute
app.use('/api', createRateLimiter(15 * 60 * 1000, 100)); // 100 requests per 15min
```

#### Input Sanitization
```javascript
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Prevent NoSQL injection
app.use(mongoSanitize());

// XSS protection
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
};

app.use(sanitizeInput);
```

### Backup & Recovery

#### Database Backup Strategy
```bash
# Automated daily backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/
rm $BACKUP_FILE

# Keep last 30 days of backups
aws s3 ls s3://your-backup-bucket/ | awk '$1 < "'$(date -d '30 days ago' '+%Y-%m-%d')'" {print $4}' | xargs -I {} aws s3 rm s3://your-backup-bucket/{}
```

#### Disaster Recovery Plan
1. **Database Recovery**: Restore from latest backup
2. **Application Recovery**: Deploy from Git repository
3. **Configuration Recovery**: Restore environment variables
4. **Data Validation**: Verify data integrity post-recovery
5. **Service Testing**: Run full integration tests

## 📈 Metrics & Analytics

### Key Performance Indicators

#### System Metrics
- **Response Time**: Average API response time < 200ms
- **Throughput**: Requests per second capacity
- **Error Rate**: < 1% error rate target
- **Availability**: 99.9% uptime target

#### Business Metrics
- **Data Sync Success Rate**: % of successful Shopify syncs
- **Webhook Processing**: Real-time event processing rate
- **Multi-tenant Performance**: Per-tenant resource usage
- **API Usage**: Endpoint usage patterns

#### Monitoring Implementation
```javascript
// Prometheus metrics
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
      
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        npx prisma generate
        npx prisma db push
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        JWT_SECRET: test-secret-key
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Render
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
```

## 🌟 Advanced Features

### Real-time Updates with WebSockets
```javascript
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Authenticate socket connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Join tenant-specific rooms
io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant-${tenantId}`);
  });
});

// Emit real-time updates
const notifyTenantUpdate = (tenantId, event, data) => {
  io.to(`tenant-${tenantId}`).emit(event, data);
};
```

### API Versioning Strategy
```javascript
// Version-specific routes
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));

// Default to latest version
app.use('/api', require('./routes/v2'));

// Version deprecation middleware
const deprecationWarning = (version) => (req, res, next) => {
  res.header('X-API-Version', version);
  if (version === 'v1') {
    res.header('X-API-Deprecation-Warning', 'API v1 will be deprecated on 2024-12-31');
  }
  next();
};
```

### GraphQL API (Optional)
```javascript
const { ApolloServer } = require('apollo-server-express');
const { buildSchema } = require('type-graphql');

const schema = await buildSchema({
  resolvers: [UserResolver, TenantResolver, OrderResolver],
  authChecker: ({ context: { user } }) => !!user
});

const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => ({
    user: req.user,
    tenant: req.tenant,
    prisma
  })
});

await apolloServer.start();
apolloServer.applyMiddleware({ app, path: '/graphql' });
```

## 📞 Support & Maintenance

### Log Management
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Maintenance Windows
```javascript
// Maintenance mode middleware
const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'System maintenance in progress',
      retryAfter: '3600' // 1 hour
    });
  }
  next();
};

app.use(maintenanceMode);
```

## 📚 Additional Resources

### Useful Commands Reference
```bash
# Development
npm run dev                    # Start development server
npm run test                   # Run tests
npm run test:watch            # Run tests in watch mode

# Database
npx prisma studio             # Open database GUI
npx prisma generate           # Generate Prisma client
npx prisma db push           # Push schema changes
npx prisma db pull           # Pull schema from database
npx prisma migrate dev       # Create and apply migration

# Production
npm start                     # Start production server
npm run build                # Build for production (if applicable)

# Utilities
node test-sync.js            # Test Shopify synchronization
node -e "require('./src/services/scheduler').syncAllTenants()" # Test scheduler
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" # Generate JWT secret
```

### Environment Variables Reference
```bash
# Required
DATABASE_URL=               # PostgreSQL connection string
JWT_SECRET=                 # 64-character random string
NODE_ENV=                   # development | production
PORT=                       # Server port (default: 3001)
BASE_URL=                   # Your backend domain
FRONTEND_URL=               # Your frontend domain

# Shopify Integration
SHOPIFY_DOMAIN=             # your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=       # Private app access token
SHOPIFY_WEBHOOK_SECRET=     # Webhook verification secret
SHOPIFY_API_KEY=           # Public app API key
SHOPIFY_API_SECRET=        # Public app secret

# Optional
REDIS_URL=                  # Redis connection (for caching)
LOG_LEVEL=                  # debug | info | warn | error
MAINTENANCE_MODE=           # true | false
```

### API Testing with Postman
Import this collection for comprehensive API testing:
```json
{
  "info": { "name": "Xeno FDE API", "version": "1.0.0" },
  "auth": { "type": "bearer" },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}" },
            "url": "{{base_url}}/api/auth/register"
          }
        },
        {
          "name": "Login", 
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}" },
            "url": "{{base_url}}/api/auth/login"
          }
        }
      ]
    }
  ]
}
```

---

## 🏆 Conclusion

This backend service provides a robust, scalable foundation for multi-tenant Shopify data ingestion and analytics. It demonstrates enterprise-grade architecture patterns, security best practices, and production-ready deployment strategies.

The system successfully handles the core requirements of the Xeno FDE assignment while providing extensible architecture for future enhancements. The comprehensive documentation, testing utilities, and deployment guides ensure smooth development and operations workflows.

For questions or support, refer to the troubleshooting section or review the detailed API documentation above.