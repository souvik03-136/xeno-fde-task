# Xeno FDE Task - Multi-tenant Shopify Analytics Platform

A full-stack multi-tenant Shopify analytics platform built with Node.js, Express, Next.js, and PostgreSQL. This application enables enterprise retailers to onboard multiple Shopify stores, synchronize customer data, and gain comprehensive business insights through interactive dashboards.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Features](#-features)
- [Documentation](#-documentation)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)

## 🎯 Overview

The Xeno FDE platform consists of two main components:

### Backend Service
- **Technology**: Node.js, Express.js, Prisma ORM, PostgreSQL
- **Features**: Multi-tenant data isolation, Shopify API integration, webhook handling, JWT authentication
- **Port**: 3001

### Frontend Dashboard
- **Technology**: Next.js, React, NextAuth.js, Recharts
- **Features**: Interactive analytics, multi-store management, real-time data synchronization
- **Port**: 3000

### Key Capabilities
- Multi-tenant architecture with complete data isolation
- Real-time Shopify data synchronization via webhooks
- Comprehensive analytics including customer insights, revenue tracking, and abandoned cart analysis
- RESTful API with JWT-based authentication
- Interactive dashboard with responsive charts and visualizations

## 🏗 Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[🌐 Web Browser]
        MOB[📱 Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        NEXT[⚡ Next.js App<br/>Port 3000]
        AUTH[🔐 NextAuth.js]
        COMP[🧩 React Components]
    end
    
    subgraph "API Gateway"
        LB[⚖️ Load Balancer]
        CORS[🔒 CORS Middleware]
        RATE[🚦 Rate Limiter]
    end
    
    subgraph "Backend Layer"
        EXPRESS[🖥️ Express Server<br/>Port 3001]
        JWT[🎫 JWT Auth]
        TENANT[🏢 Tenant Middleware]
    end
    
    subgraph "Business Logic"
        AUTH_CTRL[🔑 Auth Controller]
        TENANT_CTRL[🏪 Tenant Controller]
        SHOPIFY_CTRL[🛍️ Shopify Controller]
        INSIGHTS_CTRL[📊 Insights Controller]
        WEBHOOK_CTRL[🪝 Webhook Controller]
    end
    
    subgraph "Data Layer"
        PRISMA[🔧 Prisma ORM]
        POSTGRES[(🗄️ PostgreSQL)]
        REDIS[(📋 Redis Cache)]
    end
    
    subgraph "External Services"
        SHOPIFY_API[🛍️ Shopify API]
        WEBHOOK_SVC[🪝 Shopify Webhooks]
    end
    
    subgraph "Infrastructure"
        DOCKER[🐳 Docker]
        MONITORING[📈 Monitoring]
        BACKUP[💾 Backup Service]
    end
    
    WEB --> NEXT
    MOB --> NEXT
    NEXT --> AUTH
    NEXT --> COMP
    
    NEXT --> LB
    LB --> CORS
    CORS --> RATE
    RATE --> EXPRESS
    
    EXPRESS --> JWT
    JWT --> TENANT
    
    TENANT --> AUTH_CTRL
    TENANT --> TENANT_CTRL
    TENANT --> SHOPIFY_CTRL
    TENANT --> INSIGHTS_CTRL
    TENANT --> WEBHOOK_CTRL
    
    AUTH_CTRL --> PRISMA
    TENANT_CTRL --> PRISMA
    SHOPIFY_CTRL --> PRISMA
    INSIGHTS_CTRL --> PRISMA
    WEBHOOK_CTRL --> PRISMA
    
    PRISMA --> POSTGRES
    PRISMA --> REDIS
    
    SHOPIFY_CTRL --> SHOPIFY_API
    WEBHOOK_SVC --> WEBHOOK_CTRL
    
    classDef client fill:#e3f2fd
    classDef frontend fill:#e8f5e8
    classDef gateway fill:#fff3e0
    classDef backend fill:#f3e5f5
    classDef business fill:#e1f5fe
    classDef data fill:#fff8e1
    classDef external fill:#fce4ec
    classDef infra fill:#f1f8e9
    
    class WEB,MOB client
    class NEXT,AUTH,COMP frontend
    class LB,CORS,RATE gateway
    class EXPRESS,JWT,TENANT backend
    class AUTH_CTRL,TENANT_CTRL,SHOPIFY_CTRL,INSIGHTS_CTRL,WEBHOOK_CTRL business
    class PRISMA,POSTGRES,REDIS data
    class SHOPIFY_API,WEBHOOK_SVC external
    class DOCKER,MONITORING,BACKUP infra
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant S as Shopify API
    participant W as Webhooks
    
    Note over U,W: Authentication Flow
    U->>F: Login Request
    F->>B: POST /api/auth/login
    B->>D: Validate Credentials
    D-->>B: User Data
    B-->>F: JWT Token
    F-->>U: Dashboard Access
    
    Note over U,W: Tenant Management
    U->>F: Create Store
    F->>B: POST /api/tenant
    B->>D: Store Tenant Data
    B->>S: Validate Shopify Access
    S-->>B: Store Validation
    B-->>F: Tenant Created
    
    Note over U,W: Data Synchronization
    U->>F: Trigger Sync
    F->>B: POST /api/shopify/sync
    B->>S: Fetch Products/Customers/Orders
    S-->>B: Shopify Data
    B->>D: Store Synchronized Data
    B-->>F: Sync Complete
    
    Note over U,W: Real-time Updates
    S->>W: Webhook Event (New Order)
    W->>B: POST /webhook/:tenantId
    B->>D: Update Records
    B-->>F: Real-time Notification
    F-->>U: Dashboard Update
    
    Note over U,W: Analytics Generation
    U->>F: View Dashboard
    F->>B: GET /api/insights/dashboard
    B->>D: Query Analytics Data
    D-->>B: Aggregated Metrics
    B-->>F: Dashboard Data
    F-->>U: Interactive Charts
```

### Multi-Tenant Data Isolation

```mermaid
graph LR
    subgraph "Tenant A - Store Alpha"
        TA_USER[👤 Users]
        TA_CUST[🛒 Customers]
        TA_PROD[📦 Products]
        TA_ORDER[📋 Orders]
    end
    
    subgraph "Tenant B - Store Beta"
        TB_USER[👤 Users]
        TB_CUST[🛒 Customers]
        TB_PROD[📦 Products]
        TB_ORDER[📋 Orders]
    end
    
    subgraph "Shared Database with Row-Level Security"
        TENANT_TBL[(🏢 Tenants)]
        USER_TBL[(👤 Users)]
        CUSTOMER_TBL[(🛒 Customers)]
        PRODUCT_TBL[(📦 Products)]
        ORDER_TBL[(📋 Orders)]
        WEBHOOK_TBL[(🪝 Webhooks)]
        EVENT_TBL[(📊 Events)]
    end
    
    TA_USER -.->|tenantId filtering| USER_TBL
    TA_CUST -.->|tenantId filtering| CUSTOMER_TBL
    TA_PROD -.->|tenantId filtering| PRODUCT_TBL
    TA_ORDER -.->|tenantId filtering| ORDER_TBL
    
    TB_USER -.->|tenantId filtering| USER_TBL
    TB_CUST -.->|tenantId filtering| CUSTOMER_TBL
    TB_PROD -.->|tenantId filtering| PRODUCT_TBL
    TB_ORDER -.->|tenantId filtering| ORDER_TBL
    
    TENANT_TBL --> USER_TBL
    TENANT_TBL --> CUSTOMER_TBL
    TENANT_TBL --> PRODUCT_TBL
    TENANT_TBL --> ORDER_TBL
    TENANT_TBL --> WEBHOOK_TBL
    TENANT_TBL --> EVENT_TBL
    
    classDef tenantA fill:#e3f2fd
    classDef tenantB fill:#e8f5e8
    classDef shared fill:#fff3e0
    
    class TA_USER,TA_CUST,TA_PROD,TA_ORDER tenantA
    class TB_USER,TB_CUST,TB_PROD,TB_ORDER tenantB
    class TENANT_TBL,USER_TBL,CUSTOMER_TBL,PRODUCT_TBL,ORDER_TBL,WEBHOOK_TBL,EVENT_TBL shared
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- npm 8.x or higher
- Git

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/souvik03-136/xeno-fde-task.git
cd xeno-fde-task
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy the output to JWT_SECRET in .env

# Configure your database URL in .env
# DATABASE_URL="postgresql://username:password@localhost:5432/xeno_fde"

# Initialize database
npx prisma generate
npx prisma db push

# Start backend server
npm run dev
```

Backend will run on http://localhost:3001

#### 3. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy the output to NEXTAUTH_SECRET in .env.local

# Configure .env.local:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your_generated_secret
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start frontend server
npm run dev
```

Frontend will run on http://localhost:3000

#### 4. Verify Installation

1. Visit http://localhost:3000
2. Register a new account
3. Create a tenant (Shopify store)
4. Sync data from your Shopify store
5. View analytics in the dashboard

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | ❌ |
| POST | `/api/auth/login` | Authenticate user | ❌ |

### Tenant Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tenant` | List user's tenants | ✅ |
| POST | `/api/tenant` | Create new tenant | ✅ |

### Shopify Integration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/shopify/sync` | Sync data from Shopify | ✅ |
| POST | `/api/shopify/webhooks/register` | Register Shopify webhooks | ✅ |
| GET | `/api/shopify/products` | Get Shopify products | ✅ |
| GET | `/api/shopify/customers` | Get Shopify customers | ✅ |
| GET | `/api/shopify/orders` | Get Shopify orders | ✅ |

### Analytics & Insights

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/insights/dashboard` | Get dashboard analytics | ✅ |
| GET | `/api/insights/abandoned-carts` | Get abandoned cart events | ✅ |

### Webhook Handlers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/webhook/:tenantId` | Handle Shopify webhooks | ❌ (HMAC verified) |

### Health Checks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic health check | ❌ |
| GET | `/status` | Service status | ❌ |

### Request Headers

**Authentication Required Endpoints:**
```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id>
Content-Type: application/json
```

**Webhook Endpoints:**
```
x-shopify-topic: <webhook_topic>
x-shopify-hmac-sha256: <webhook_signature>
```

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ Tenant : "owns"
    Tenant ||--o{ Customer : "has"
    Tenant ||--o{ Product : "has"
    Tenant ||--o{ Order : "has"
    Tenant ||--o{ Webhook : "has"
    Tenant ||--o{ Event : "tracks"
    Customer ||--o{ Order : "places"
    Customer ||--o{ Event : "triggers"
    Order ||--o{ OrderItem : "contains"
    Product ||--o{ OrderItem : "featured_in"
    
    User {
        string id PK "Primary Key"
        string email UK "Unique email address"
        string password "Hashed password"
        datetime createdAt "Account creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    Tenant {
        string id PK "Primary Key"
        string name "Store display name"
        string shopifyDomain UK "Store domain (unique)"
        string shopifyToken "Shopify access token"
        string userId FK "Owner user reference"
        datetime createdAt "Tenant creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    Customer {
        string id PK "Primary Key"
        string shopifyId "Shopify customer ID"
        string email "Customer email"
        string firstName "Customer first name"
        string lastName "Customer last name"
        float totalSpent "Total amount spent"
        int ordersCount "Number of orders placed"
        string tenantId FK "Tenant reference"
        datetime createdAt "Customer creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    Product {
        string id PK "Primary Key"
        string shopifyId "Shopify product ID"
        string title "Product title"
        float price "Product price"
        string tenantId FK "Tenant reference"
        datetime createdAt "Product creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    Order {
        string id PK "Primary Key"
        string shopifyId "Shopify order ID"
        string orderNumber "Order number"
        float totalPrice "Total order value"
        string customerId FK "Customer reference"
        string tenantId FK "Tenant reference"
        datetime orderDate "Order placement date"
        datetime createdAt "Order creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    OrderItem {
        string id PK "Primary Key"
        int quantity "Item quantity"
        float price "Item price"
        string orderId FK "Order reference"
        string productId FK "Product reference"
    }
    
    Webhook {
        string id PK "Primary Key"
        string topic "Webhook topic"
        string address "Webhook URL"
        string tenantId FK "Tenant reference"
        datetime createdAt "Webhook creation timestamp"
        datetime updatedAt "Last update timestamp"
    }
    
    Event {
        string id PK "Primary Key"
        string type "Event type (cart_abandoned, etc.)"
        string customerId FK "Customer reference"
        string tenantId FK "Tenant reference"
        json data "Event metadata"
        datetime createdAt "Event timestamp"
    }
```

### Key Database Features

#### Multi-Tenant Isolation
- Every tenant-specific table includes `tenantId` foreign key
- All queries automatically filter by tenant for complete data isolation
- Row-level security ensures no cross-tenant data leakage

#### Indexing Strategy
```sql
-- Performance optimization indexes
CREATE INDEX idx_customers_tenant_id ON Customer(tenantId);
CREATE INDEX idx_orders_tenant_id ON Order(tenantId);
CREATE INDEX idx_orders_customer_id ON Order(customerId);
CREATE INDEX idx_orders_date ON Order(orderDate);
CREATE INDEX idx_events_tenant_type ON Event(tenantId, type);
CREATE INDEX idx_products_tenant_id ON Product(tenantId);
```

#### Data Relationships
- **One-to-Many**: User → Tenants, Tenant → Customers/Products/Orders
- **Many-to-Many**: Orders ↔ Products (via OrderItem junction table)
- **Event Tracking**: Customer activities stored in Events table

## ✨ Features

### Core Features

#### Multi-Tenant Architecture
- Complete data isolation between different Shopify stores
- User can manage multiple stores under single account
- Tenant-aware API endpoints with automatic filtering

#### Shopify Integration
- **Real-time Sync**: Webhook-based data updates
- **Bulk Import**: Manual synchronization of products, customers, and orders
- **API Coverage**: Comprehensive Shopify REST API integration
- **Webhook Support**: Handles order creation, customer updates, cart abandonment

#### Analytics Dashboard
- **Overview Metrics**: Total customers, orders, revenue
- **Time-series Charts**: Orders and revenue trends over time
- **Customer Insights**: Top customers by spend and order frequency
- **Product Analysis**: Revenue breakdown by product
- **Abandoned Carts**: Cart abandonment tracking and analytics

#### Authentication & Security
- JWT-based authentication with secure token management
- NextAuth.js integration for seamless session handling
- CORS protection and rate limiting
- Input validation and SQL injection prevention

### Advanced Features

#### Real-time Updates
- WebSocket support for live dashboard updates
- Webhook processing for immediate data synchronization
- Auto-refresh capabilities for time-sensitive data

#### Data Visualization
- Interactive charts using Recharts library
- Responsive design for mobile and desktop
- Customizable date range filtering
- Export capabilities for reports

#### API Architecture
- RESTful API design with consistent response formats
- Comprehensive error handling and logging
- API versioning support for future enhancements
- Rate limiting and request throttling

## 📚 Documentation

Detailed documentation is available in the following locations:

### Component Documentation
- **Backend API**: [`backend/README.md`](backend/README.md) - Complete backend setup, API documentation, and deployment guide
- **Frontend Dashboard**: [`frontend/README.md`](frontend/README.md) - Frontend setup, component architecture, and development guide
- **Technical Documentation**: [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) - Comprehensive technical documentation and API reference

### Documentation Contents

#### Backend Documentation (`backend/README.md`)
- Environment configuration and setup
- Database schema and migrations
- API endpoint specifications with examples
- Shopify integration guide
- Webhook configuration
- Security implementation details
- Deployment instructions for various platforms
- Troubleshooting guide

#### Frontend Documentation (`frontend/README.md`)
- Next.js setup and configuration
- Component architecture overview
- Authentication flow with NextAuth.js
- Multi-tenant management implementation
- Chart integration and data visualization
- Development guidelines and best practices
- Performance optimization techniques

#### Technical Documentation (`docs/DOCUMENTATION.md`)
- System architecture deep dive
- Database design patterns
- API design principles
- Security considerations
- Scalability strategies
- Integration patterns
- Testing methodologies
- Production deployment strategies

## ⚠️ Known Limitations

### Technical Limitations

#### Shopify API Constraints
- **Rate Limits**: Shopify enforces 2 requests/second for REST API
  - *Impact*: Bulk data synchronization may take time for large stores
  - *Mitigation*: Implemented request throttling and pagination

- **Webhook Reliability**: Shopify webhooks can occasionally fail or be delayed
  - *Impact*: Real-time updates might have minor delays
  - *Mitigation*: Daily scheduled sync as backup mechanism

#### Database Performance
- **Large Dataset Queries**: Analytics queries can be slow with >10K orders
  - *Impact*: Dashboard loading times may increase with data volume
  - *Mitigation*: Implemented database indexing and query optimization

#### Authentication
- **Session Persistence**: JWT tokens expire after 7 days
  - *Impact*: Users need to re-login weekly
  - *Mitigation*: Configurable token expiration, refresh token implementation planned

### Functional Limitations

#### Multi-Store Management
- **Store Switching**: Requires manual tenant selection for each session
  - *Impact*: No automatic store detection based on context
  - *Mitigation*: Last selected store remembered in localStorage

#### Data Synchronization
- **Historical Data**: Initial sync limited to Shopify's API pagination (250 items/request)
  - *Impact*: Very large stores may require multiple sync sessions
  - *Mitigation*: Incremental sync based on timestamps

#### Analytics Features
- **Real-time Analytics**: Some metrics calculated on-demand rather than pre-aggregated
  - *Impact*: Dashboard loading can be slow for large datasets
  - *Mitigation*: Caching strategy for frequently accessed metrics

#### Mobile Experience
- **Touch Interactions**: Chart interactions optimized primarily for desktop
  - *Impact*: Limited chart interaction on mobile devices
  - *Mitigation*: Responsive design with mobile-friendly chart alternatives

### Infrastructure Limitations

#### Scalability
- **Single Database**: All tenants share single PostgreSQL instance
  - *Impact*: Potential performance bottleneck with many concurrent tenants
  - *Mitigation*: Database connection pooling and query optimization

- **File Storage**: No persistent file storage for uploaded assets
  - *Impact*: Product images and attachments not stored locally
  - *Mitigation*: References to Shopify-hosted assets

#### Deployment
- **Environment Dependencies**: Requires specific Node.js and PostgreSQL versions
  - *Impact*: Deployment complexity on different environments
  - *Mitigation*: Docker containerization available

### Assumptions Made

#### Business Logic Assumptions
- **Single Currency**: Analytics assume single currency per store
- **Order Status**: All orders treated equally regardless of fulfillment status  
- **Customer Identification**: Customers identified primarily by email address
- **Product Variants**: Product variants treated as separate products in analytics

#### Technical Assumptions
- **Network Reliability**: Assumes stable internet connection for Shopify API calls
- **Data Consistency**: Assumes Shopify data remains consistent between sync operations
- **Browser Compatibility**: Optimized for modern browsers (Chrome, Firefox, Safari, Edge)
- **JavaScript Enabled**: Frontend requires JavaScript for full functionality

### Future Enhancements

#### Planned Features
- Advanced filtering and segmentation for customers
- Email marketing integration for abandoned cart recovery
- Multi-currency support for international stores
- Advanced user role management and permissions
- Data export functionality (CSV, PDF reports)
- Integration with additional e-commerce platforms

#### Performance Improvements
- Redis caching for frequently accessed data
- Database sharding for improved multi-tenant performance
- CDN integration for static asset delivery
- Background job processing for heavy operations


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


