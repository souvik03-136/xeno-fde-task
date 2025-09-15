# Xeno FDE Task - Multi-tenant Shopify Analytics Platform

A full-stack multi-tenant Shopify analytics platform built with Node.js, Express, Next.js, and PostgreSQL. This application enables enterprise retailers to onboard multiple Shopify stores, synchronize customer data, and gain comprehensive business insights through interactive dashboards.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Features](#features)
- [Documentation](#documentation)
- [Known Limitations](#known-limitations)
- [License](#license)

## Overview

The Xeno FDE platform consists of two main components:

**Backend Service**
- Technology: Node.js, Express.js, Prisma ORM, PostgreSQL
- Features: Multi-tenant data isolation, Shopify API integration, webhook handling, JWT authentication
- Port: 3001

**Frontend Dashboard**
- Technology: Next.js, React, NextAuth.js, Recharts
- Features: Interactive analytics, multi-store management, real-time data synchronization
- Port: 3000

**Key Capabilities**
- Multi-tenant architecture with complete data isolation
- Real-time Shopify data synchronization via webhooks
- Comprehensive analytics including customer insights, revenue tracking, and abandoned cart analysis
- RESTful API with JWT-based authentication
- Interactive dashboard with responsive charts and visualizations

## Architecture

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
    
    class WEB,MOB client
    class NEXT,AUTH,COMP frontend
    class LB,CORS,RATE gateway
    class EXPRESS,JWT,TENANT backend
    class AUTH_CTRL,TENANT_CTRL,SHOPIFY_CTRL,INSIGHTS_CTRL,WEBHOOK_CTRL business
    class PRISMA,POSTGRES,REDIS data
    class SHOPIFY_API,WEBHOOK_SVC external
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

The platform implements multi-tenant architecture using a shared database with tenant-aware queries:

**Isolation Strategy:**
- Every data model includes a `tenantId` field for row-level isolation
- Middleware automatically filters all queries by the authenticated user's tenant
- API endpoints validate tenant access permissions before data operations
- Database indexes optimize tenant-specific queries for performance

**Data Segregation:**
```
Tenant A (Store Alpha) ──┐
                         ├──► Shared PostgreSQL Database
Tenant B (Store Beta) ───┘    (Row-level tenant filtering)

Each tenant's data:
├── Users (tenant owners)
├── Customers (tenant-specific)
├── Products (tenant-specific)
├── Orders (tenant-specific)
├── Webhooks (tenant-specific)
└── Events (tenant-specific)
```

**Security Measures:**
- JWT tokens include tenant context
- API middleware validates tenant ownership
- Database queries automatically include tenant filters
- Cross-tenant data access is impossible at the application level

## Quick Start

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
npm install
cp .env.example .env

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

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
cd frontend
npm install
cp .env.local.example .env.local

# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

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

## API Endpoints

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

## Database Schema

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

### Key Database Features

**Multi-Tenant Isolation**
- Every tenant-specific table includes `tenantId` foreign key
- All queries automatically filter by tenant for complete data isolation
- Row-level security ensures no cross-tenant data leakage

**Indexing Strategy**
```sql
CREATE INDEX idx_customers_tenant_id ON Customer(tenantId);
CREATE INDEX idx_orders_tenant_id ON Order(tenantId);
CREATE INDEX idx_orders_customer_id ON Order(customerId);
CREATE INDEX idx_orders_date ON Order(orderDate);
CREATE INDEX idx_events_tenant_type ON Event(tenantId, type);
CREATE INDEX idx_products_tenant_id ON Product(tenantId);
```

**Data Relationships**
- One-to-Many: User → Tenants, Tenant → Customers/Products/Orders
- Many-to-Many: Orders ↔ Products (via OrderItem junction table)
- Event Tracking: Customer activities stored in Events table

## Features

### Core Features

**Multi-Tenant Architecture**
- Complete data isolation between different Shopify stores
- User can manage multiple stores under single account
- Tenant-aware API endpoints with automatic filtering

**Shopify Integration**
- Real-time Sync: Webhook-based data updates
- Bulk Import: Manual synchronization of products, customers, and orders
- API Coverage: Comprehensive Shopify REST API integration
- Webhook Support: Handles order creation, customer updates, cart abandonment

**Analytics Dashboard**
- Overview Metrics: Total customers, orders, revenue
- Time-series Charts: Orders and revenue trends over time
- Customer Insights: Top customers by spend and order frequency
- Product Analysis: Revenue breakdown by product
- Abandoned Carts: Cart abandonment tracking and analytics

**Authentication & Security**
- JWT-based authentication with secure token management
- NextAuth.js integration for seamless session handling
- CORS protection and rate limiting
- Input validation and SQL injection prevention

### Advanced Features

**Real-time Updates**
- WebSocket support for live dashboard updates
- Webhook processing for immediate data synchronization
- Auto-refresh capabilities for time-sensitive data

**Data Visualization**
- Interactive charts using Recharts library
- Responsive design for mobile and desktop
- Customizable date range filtering
- Export capabilities for reports

**API Architecture**
- RESTful API design with consistent response formats
- Comprehensive error handling and logging
- API versioning support for future enhancements
- Rate limiting and request throttling

## Documentation

Detailed documentation is available in the following locations:

### Component Documentation
- **Backend API**: [`backend/README.md`](backend/README.md) - Complete backend setup, API documentation, and deployment guide
- **Frontend Dashboard**: [`frontend/README.md`](frontend/README.md) - Frontend setup, component architecture, and development guide
- **Technical Documentation**: [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) - Comprehensive technical documentation and API reference

### Documentation Contents

**Backend Documentation (`backend/README.md`)**
- Environment configuration and setup
- Database schema and migrations
- API endpoint specifications with examples
- Shopify integration guide
- Webhook configuration
- Security implementation details
- Deployment instructions for various platforms
- Troubleshooting guide

**Frontend Documentation (`frontend/README.md`)**
- Next.js setup and configuration
- Component architecture overview
- Authentication flow with NextAuth.js
- Multi-tenant management implementation
- Chart integration and data visualization
- Development guidelines and best practices
- Performance optimization techniques

**Technical Documentation (`docs/DOCUMENTATION.md`)**
- System architecture deep dive
- Database design patterns
- API design principles
- Security considerations
- Scalability strategies
- Integration patterns
- Testing methodologies
- Production deployment strategies

## Known Limitations

### Technical Limitations

**Shopify API Constraints**
- Rate Limits: Shopify enforces 2 requests/second for REST API
- Impact: Bulk data synchronization may take time for large stores
- Mitigation: Implemented request throttling and pagination

**Webhook Reliability**
- Shopify webhooks can occasionally fail or be delayed
- Impact: Real-time updates might have minor delays
- Mitigation: Daily scheduled sync as backup mechanism

**Database Performance**
- Large Dataset Queries: Analytics queries can be slow with >10K orders
- Impact: Dashboard loading times may increase with data volume
- Mitigation: Implemented database indexing and query optimization

**Authentication**
- Session Persistence: JWT tokens expire after 7 days
- Impact: Users need to re-login weekly
- Mitigation: Configurable token expiration, refresh token implementation planned

### Functional Limitations

**Multi-Store Management**
- Store Switching: Requires manual tenant selection for each session
- Impact: No automatic store detection based on context
- Mitigation: Last selected store remembered in localStorage

**Data Synchronization**
- Historical Data: Initial sync limited to Shopify's API pagination (250 items/request)
- Impact: Very large stores may require multiple sync sessions
- Mitigation: Incremental sync based on timestamps

**Analytics Features**
- Real-time Analytics: Some metrics calculated on-demand rather than pre-aggregated
- Impact: Dashboard loading can be slow for large datasets
- Mitigation: Caching strategy for frequently accessed metrics

**Mobile Experience**
- Touch Interactions: Chart interactions optimized primarily for desktop
- Impact: Limited chart interaction on mobile devices
- Mitigation: Responsive design with mobile-friendly chart alternatives

### Infrastructure Limitations

**Scalability**
- Single Database: All tenants share single PostgreSQL instance
- Impact: Potential performance bottleneck with many concurrent tenants
- Mitigation: Database connection pooling and query optimization

**File Storage**
- No persistent file storage for uploaded assets
- Impact: Product images and attachments not stored locally
- Mitigation: References to Shopify-hosted assets

**Deployment**
- Environment Dependencies: Requires specific Node.js and PostgreSQL versions
- Impact: Deployment complexity on different environments
- Mitigation: Docker containerization available

### Assumptions Made

**Business Logic Assumptions**
- Single Currency: Analytics assume single currency per store
- Order Status: All orders treated equally regardless of fulfillment status  
- Customer Identification: Customers identified primarily by email address
- Product Variants: Product variants treated as separate products in analytics

**Technical Assumptions**
- Network Reliability: Assumes stable internet connection for Shopify API calls
- Data Consistency: Assumes Shopify data remains consistent between sync operations
- Browser Compatibility: Optimized for modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript Enabled: Frontend requires JavaScript for full functionality

### Future Enhancements

**Planned Features**
- Advanced filtering and segmentation for customers
- Email marketing integration for abandoned cart recovery
- Multi-currency support for international stores
- Advanced user role management and permissions
- Data export functionality (CSV, PDF reports)
- Integration with additional e-commerce platforms

**Performance Improvements**
- Redis caching for frequently accessed data
- Database sharding for improved multi-tenant performance
- CDN integration for static asset delivery
- Background job processing for heavy operations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.