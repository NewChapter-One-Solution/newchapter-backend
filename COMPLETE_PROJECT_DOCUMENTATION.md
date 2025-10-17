# 🛋️ Complete Project Documentation - Furniture Shop Management System

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Core Features](#core-features)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Business Logic Flow](#business-logic-flow)
10. [File Structure](#file-structure)
11. [Configuration & Environment](#configuration--environment)
12. [Deployment Guide](#deployment-guide)
13. [Testing & Development](#testing--development)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

The **Furniture Shop Management System** is a comprehensive, production-ready backend API designed to manage all aspects of a furniture retail business. It provides a complete solution for inventory management, sales processing, customer relationship management, supplier coordination, and business analytics.

### Key Business Objectives

- **Inventory Management**: Real-time stock tracking across multiple warehouses and shops
- **Sales Processing**: Complete sales workflow from order to invoice generation
- **Multi-Shop Operations**: Support for multiple retail locations with centralized management
- **Business Intelligence**: Comprehensive reporting and analytics for data-driven decisions
- **Staff Management**: Employee attendance tracking and role-based access control
- **Supplier Relations**: Purchase order management and supplier performance tracking

### Target Users

- **Shop Owners**: Business overview, performance metrics, and strategic insights
- **Managers**: Operational control, inventory management, and staff coordination
- **Sales Staff**: Customer service, sales processing, and basic inventory operations
- **Administrators**: System configuration, user management, and technical oversight

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  External APIs  │
                    │  - Cloudinary   │
                    │  - Email SMTP   │
                    └─────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express.js Application                  │
├─────────────────────────────────────────────────────────────┤
│  Security Layer (Helmet, CORS, Rate Limiting)              │
├─────────────────────────────────────────────────────────────┤
│  Authentication (JWT + Passport.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Authorization (Role-Based Access Control)                 │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Controllers │ │ Middleware  │ │ Validators  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer (Prisma ORM)                           │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (PostgreSQL)                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request → Security Middleware → Authentication → Authorization →
Controller → Business Logic → Database → Response → Client
```

---

## 💻 Technology Stack

### Backend Core

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL 13+
- **ORM**: Prisma 6.x

### Security & Authentication

- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: Passport.js with JWT Strategy
- **Password Hashing**: bcryptjs
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware

### File Management & Communication

- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Email Service**: Nodemailer
- **Barcode Generation**: bwip-js

### Development & Monitoring

- **Logging**: Winston
- **Process Management**: PM2 (production)
- **Development**: Nodemon, ts-node
- **Validation**: Zod
- **Compression**: compression middleware

---

## 🗄️ Database Design

### Entity Relationship Overview

```
Users ──┐
        ├── Shops ──── Inventory ──── Products ──── Categories
        │              │              │
        └── Attendance │              └── Suppliers
                       │
                    Sales ──── Customers
                       │
                    SaleItems
                       │
                 PurchaseItems ──── Purchases
```

### Core Entities

#### 1. **User Management**

```sql
Users {
  id: UUID (PK)
  email: String (Unique)
  firstName: String
  lastName: String
  hashedPassword: String
  role: Enum (ADMIN, MANAGER, STAFF)
  isActive: Boolean
  shopId: UUID (FK)
  department: Enum
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 2. **Shop & Warehouse Management**

```sql
Shops {
  id: UUID (PK)
  name: String
  location: String
  ownerId: UUID (FK)
  createdAt: DateTime
  updatedAt: DateTime
}

Warehouses {
  id: UUID (PK)
  name: String (Unique)
  location: String
  capacity: Integer
  minCapacity: Integer
  maxCapacity: Integer
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 3. **Product Catalog**

```sql
Categories {
  id: UUID (PK)
  name: String
  slug: String (Unique)
  parentId: UUID (FK, Self-Reference)
  createdAt: DateTime
  updatedAt: DateTime
}

Products {
  id: UUID (PK)
  name: String
  description: Text
  slug: String (Unique)
  price: Decimal
  categoryId: UUID (FK)
  suppliersId: UUID (FK)
  imageDetails: JSON
  color: String
  size: String
  material: String
  weight: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 4. **Inventory Management**

```sql
Inventory {
  id: UUID (PK)
  productId: UUID (FK)
  shopId: UUID (FK)
  warehouseId: UUID (FK)
  quantity: Integer
  createdAt: DateTime
  updatedAt: DateTime
  UNIQUE(shopId, productId)
}

StockLog {
  id: UUID (PK)
  productId: UUID (FK)
  shopId: UUID (FK)
  changeType: Enum (PURCHASE_IN, SALE_OUT, RETURN_TO_SUPPLIER, MANUAL_ADJUSTMENT)
  quantity: Integer
  reason: String
  createdAt: DateTime
}
```

#### 5. **Sales & Customer Management**

```sql
Customers {
  id: UUID (PK)
  name: String
  phone: String
  email: String
  address: Text
  createdAt: DateTime
  updatedAt: DateTime
}

Sales {
  id: UUID (PK)
  shopId: UUID (FK)
  customerId: UUID (FK)
  saleDate: DateTime
  totalAmount: Decimal
  paymentMode: Enum (CASH, CARD, UPI, OTHER)
  invoiceNo: String (Unique)
}

SaleItems {
  id: UUID (PK)
  saleId: UUID (FK)
  productId: UUID (FK)
  quantity: Integer
  unitPrice: Decimal
}
```

#### 6. **Purchase Management**

```sql
Suppliers {
  id: UUID (PK)
  name: String
  email: String
  phone: String
  address: Text
  website: String
  gstid: String (Unique)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

Purchases {
  id: UUID (PK)
  shopId: UUID (FK)
  supplierId: UUID (FK)
  purchaseDate: DateTime
  totalAmount: Decimal
  status: Enum (PENDING, RECEIVED, RETURNED)
  createdAt: DateTime
  updatedAt: DateTime
}

PurchaseItems {
  id: UUID (PK)
  purchaseId: UUID (FK)
  productId: UUID (FK)
  quantity: Integer
  unitPrice: Decimal
  receivedQty: Integer
  returnedQty: Integer
  UNIQUE(purchaseId, productId)
}
```

#### 7. **Employee Management**

```sql
Attendance {
  id: UUID (PK)
  userId: UUID (FK)
  date: DateTime
  checkIn: DateTime
  checkOut: DateTime
  isCheckedIn: Boolean
  status: Enum (PRESENT, ABSENT, LATE, ON_LEAVE, HALF_DAY)
  workedHours: Float
  createdAt: DateTime
  updatedAt: DateTime
  UNIQUE(userId, date)
}
```

---

## 🔐 Authentication & Authorization

### JWT Token System

The system uses a dual-token approach for enhanced security:

#### Access Token

- **Purpose**: API authentication
- **Lifetime**: 1 hour
- **Storage**: Client memory/localStorage
- **Usage**: Bearer token in Authorization header

#### Refresh Token

- **Purpose**: Access token renewal
- **Lifetime**: 5 days
- **Storage**: Secure HTTP-only cookie + Database
- **Security**: Hashed before database storage

### Token Flow

```
1. Login → Generate Access + Refresh Tokens
2. API Request → Validate Access Token
3. Token Expired → Use Refresh Token to get new Access Token
4. Refresh Expired → Require re-login
5. Logout → Invalidate both tokens
```

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```
ADMIN (Level 3)
  ├── Full system access
  ├── User management
  ├── System configuration
  └── All MANAGER permissions

MANAGER (Level 2)
  ├── Shop operations
  ├── Inventory management
  ├── Purchase management
  ├── Reports access
  └── All STAFF permissions

STAFF (Level 1)
  ├── Sales processing
  ├── Customer management
  ├── Basic inventory view
  └── Personal attendance
```

#### Permission Matrix

| Feature              | STAFF | MANAGER | ADMIN |
| -------------------- | ----- | ------- | ----- |
| View Products        | ✅    | ✅      | ✅    |
| Create/Edit Products | ❌    | ✅      | ✅    |
| Delete Products      | ❌    | ❌      | ✅    |
| Process Sales        | ✅    | ✅      | ✅    |
| Manage Inventory     | ❌    | ✅      | ✅    |
| View Reports         | ❌    | ✅      | ✅    |
| User Management      | ❌    | ❌      | ✅    |
| System Config        | ❌    | ❌      | ✅    |

---

## 🚀 Core Features

### 1. **Multi-Shop Operations**

The system supports multiple retail locations with centralized management:

- **Shop Management**: Create and manage multiple shop locations
- **Centralized Inventory**: Track inventory across all locations
- **Shop-Specific Reports**: Generate reports for individual shops
- **Cross-Shop Analytics**: Compare performance across locations

### 2. **Advanced Inventory Management**

Comprehensive inventory tracking with real-time updates:

- **Multi-Warehouse Support**: Distribute inventory across warehouses
- **Real-Time Stock Updates**: Automatic inventory adjustments on sales/purchases
- **Low Stock Alerts**: Automated email notifications for low inventory
- **Stock Movement Tracking**: Complete audit trail of inventory changes
- **Barcode Generation**: Generate barcodes for products

### 3. **Complete Sales Workflow**

End-to-end sales processing with invoice generation:

- **Customer Management**: Maintain customer profiles and purchase history
- **Sales Processing**: Create sales with multiple items and payment modes
- **Invoice Generation**: Automatic invoice creation with unique numbers
- **Email Integration**: Send invoices via email automatically
- **Payment Tracking**: Support for multiple payment methods

### 4. **Purchase Management**

Streamlined supplier and purchase order management:

- **Supplier Profiles**: Maintain detailed supplier information
- **Purchase Orders**: Create and track purchase orders
- **Receiving Management**: Track received vs ordered quantities
- **Return Processing**: Handle returns to suppliers
- **Cost Analysis**: Track purchase costs and supplier performance

### 5. **Employee Management**

Comprehensive staff management with attendance tracking:

- **User Roles**: Role-based access control system
- **Attendance Tracking**: Check-in/check-out with automatic calculations
- **Working Hours**: Calculate daily and monthly working hours
- **Department Management**: Organize staff by departments
- **Automated Cron Jobs**: Daily attendance processing

### 6. **Business Intelligence & Reporting**

Advanced analytics and reporting capabilities:

- **Business Dashboard**: Key performance indicators and metrics
- **Sales Reports**: Detailed sales analysis with time-based grouping
- **Inventory Reports**: Stock levels, low stock alerts, and valuation
- **Customer Analytics**: Customer behavior and retention metrics
- **Supplier Performance**: Supplier reliability and cost analysis
- **Financial Reports**: Revenue, profit, and expense tracking

### 7. **Security & Compliance**

Enterprise-grade security features:

- **Data Encryption**: Password hashing with bcrypt
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Zod schema validation
- **Audit Logging**: Comprehensive logging with Winston
- **CORS Protection**: Configurable CORS policies

---

## 📡 API Architecture

### RESTful Design Principles

The API follows REST conventions with consistent patterns:

- **Resource-Based URLs**: `/api/v1/products`, `/api/v1/sales`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: Proper HTTP status codes for all responses
- **JSON Format**: Consistent JSON request/response format

### API Response Format

All API responses follow a consistent structure:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "meta": {
    "pagination": object,
    "timestamp": string
  }
}
```

### Error Handling

Standardized error responses with detailed information:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "status": 400,
  "timestamp": "2025-01-26T12:00:00.000Z"
}
```

### Pagination

List endpoints support pagination with metadata:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 🔗 API Endpoints Reference

### Base URL

```
Development: http://localhost:8001/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication Endpoints

#### POST `/auth/login`

Authenticate user and receive JWT tokens.

**Request:**

```json
{
  "email": "admin@furniturestore.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@furniturestore.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    }
  }
}
```

#### POST `/auth/refresh-token`

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/auth/logout`

Logout user and invalidate tokens.

**Headers:**

```
Authorization: Bearer <access_token>
```

### Product Management

#### GET `/products`

Retrieve paginated list of products.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `categoryId`: Filter by category

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Modern Leather Sofa",
        "price": "1299.99",
        "category": {
          "name": "Living Room"
        },
        "imageDetails": {
          "url": "https://cloudinary.com/image.jpg"
        }
      }
    ],
    "meta": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

#### POST `/products`

Create new product with image upload.

**Content-Type:** `multipart/form-data`

**Form Data:**

```
name: "Modern Leather Sofa"
description: "Premium 3-seater leather sofa"
price: "1299.99"
categoryId: "category-uuid"
color: "Brown"
size: "84\" W x 36\" D x 32\" H"
material: "Genuine Leather"
weight: "85kg"
suppliersId: "supplier-uuid"
image: [file]
```

#### PUT `/products/:id`

Update existing product.

#### DELETE `/products/:id`

Delete product (Admin only).

### Sales Management

#### POST `/sales`

Create new sale transaction.

**Request:**

```json
{
  "shopId": "shop-uuid",
  "customerId": "customer-uuid",
  "paymentMode": "CASH",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1,
      "unitPrice": 1299.99
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": "sale-uuid",
    "invoiceNo": "INV-2025-001",
    "totalAmount": 1299.99,
    "saleDate": "2025-01-26T10:30:00.000Z",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### GET `/sales`

Retrieve sales with pagination and filtering.

**Query Parameters:**

- `page`, `limit`: Pagination
- `shopId`: Filter by shop
- `startDate`, `endDate`: Date range
- `paymentMode`: Filter by payment method

### Inventory Management

#### GET `/inventory/:shopId`

Get inventory for specific shop.

#### POST `/inventory`

Create or update inventory.

**Request:**

```json
{
  "productId": "product-uuid",
  "shopId": "shop-uuid",
  "warehouseId": "warehouse-uuid",
  "quantity": 100
}
```

#### POST `/inventory/adjust`

Adjust inventory quantity.

**Request:**

```json
{
  "productId": "product-uuid",
  "shopId": "shop-uuid",
  "adjustment": -5,
  "reason": "Sale"
}
```

### Customer Management

#### POST `/customers`

Create new customer.

**Request:**

```json
{
  "name": "John Doe",
  "phone": "+1-555-0123",
  "email": "john@example.com",
  "address": "123 Main St, City, State"
}
```

#### GET `/customers`

Get customers with search and pagination.

### Supplier Management

#### POST `/suppliers`

Create new supplier.

**Request:**

```json
{
  "name": "Premium Furniture Suppliers Inc.",
  "email": "orders@premiumfurniture.com",
  "phone": "+1-800-FURNITURE",
  "address": "1200 Industrial Blvd",
  "website": "https://premiumfurnituresuppliers.com",
  "gstid": "GST27ABCDE1234F1Z5"
}
```

### Purchase Management

#### POST `/purchases`

Create purchase order.

**Request:**

```json
{
  "shopId": "shop-uuid",
  "supplierId": "supplier-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 20,
      "unitPrice": 850.0
    }
  ]
}
```

### Reports & Analytics

#### GET `/reports/dashboard`

Business dashboard with KPIs.

**Query Parameters:**

- `shopId`: Filter by shop
- `period`: day, week, month, year

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 50000.00,
      "totalSales": 150,
      "totalCustomers": 75,
      "averageOrderValue": 333.33
    },
    "topSellingProducts": [...],
    "recentSales": [...],
    "lowStockProducts": [...]
  }
}
```

#### GET `/reports/sales`

Detailed sales reports.

#### GET `/reports/inventory`

Inventory status and valuation.

### Attendance Management

#### POST `/attendance/checkin`

Employee check-in.

**Request:**

```json
{
  "userId": "user-uuid"
}
```

#### POST `/attendance/checkout`

Employee check-out.

### Admin Panel

#### GET `/admin/dashboard/stats`

System-wide statistics (Admin only).

#### PATCH `/admin/users/:userId/status`

Activate/deactivate user (Admin only).

#### PATCH `/admin/users/:userId/role`

Update user role (Admin only).

---

## 🔄 Business Logic Flow

### Sales Processing Flow

```
1. Customer Selection/Creation
   ↓
2. Product Selection & Quantity
   ↓
3. Price Calculation & Validation
   ↓
4. Inventory Check & Reservation
   ↓
5. Payment Processing
   ↓
6. Sale Record Creation
   ↓
7. Inventory Update
   ↓
8. Invoice Generation
   ↓
9. Email Notification (if email available)
   ↓
10. Stock Log Entry
```

### Purchase Order Flow

```
1. Supplier Selection
   ↓
2. Product & Quantity Selection
   ↓
3. Price Negotiation & Entry
   ↓
4. Purchase Order Creation
   ↓
5. Order Status: PENDING
   ↓
6. Goods Receipt
   ↓
7. Quantity Verification
   ↓
8. Inventory Update
   ↓
9. Status Update: RECEIVED
   ↓
10. Stock Log Entry
```

### Inventory Management Flow

```
Stock Changes Trigger:
├── Sales (Decrease)
├── Purchases (Increase)
├── Returns (Decrease/Increase)
└── Manual Adjustments

Each Change:
1. Validate Operation
2. Update Inventory Table
3. Create Stock Log Entry
4. Check Low Stock Thresholds
5. Trigger Alerts if Necessary
```

### Low Stock Alert Flow

```
Daily Cron Job (10 PM):
1. Query All Inventory
2. Identify Low Stock Items
3. Group by Shop/Owner
4. Generate Email Alerts
5. Send to Shop Owners
6. Send Summary to Admins
7. Log Results
```

---

## 📁 File Structure

```
furniture-shop-backend/
├── src/
│   ├── controllers/           # Business logic handlers
│   │   ├── authController.ts         # Authentication
│   │   ├── productsController.ts     # Product management
│   │   ├── salesController.ts        # Sales processing
│   │   ├── inventoryController.ts    # Inventory management
│   │   ├── reportsController.ts      # Analytics & reporting
│   │   ├── customerController.ts     # Customer management
│   │   ├── supplierController.ts     # Supplier management
│   │   ├── purchaseController.ts     # Purchase orders
│   │   ├── attendenceController.ts   # Attendance tracking
│   │   ├── adminController.ts        # Admin operations
│   │   ├── userController.ts         # User management
│   │   ├── shopController.ts         # Shop management
│   │   ├── warehouseController.ts    # Warehouse management
│   │   ├── categoriesController.ts   # Category management
│   │   ├── commentsController.ts     # Comments system
│   │   ├── employeeController.ts     # Employee management
│   │   └── invoiceController.ts      # Invoice generation
│   │
│   ├── routes/                # Express route definitions
│   │   ├── index.ts                  # Main router
│   │   ├── auth.ts                   # Authentication routes
│   │   ├── products.ts               # Product routes
│   │   ├── sales.ts                  # Sales routes
│   │   ├── inventory.ts              # Inventory routes
│   │   ├── reports.ts                # Reporting routes
│   │   ├── customers.ts              # Customer routes
│   │   ├── suppliers.ts              # Supplier routes
│   │   ├── purchases.ts              # Purchase routes
│   │   ├── attendence.ts             # Attendance routes
│   │   ├── admin.ts                  # Admin routes
│   │   ├── user.ts                   # User routes
│   │   ├── shops.ts                  # Shop routes
│   │   ├── warehouse.ts              # Warehouse routes
│   │   ├── categories.ts             # Category routes
│   │   ├── comments.ts               # Comments routes
│   │   ├── employees.ts              # Employee routes
│   │   ├── invoices.ts               # Invoice routes
│   │   └── health.ts                 # Health check routes
│   │
│   ├── middleware/            # Express middleware
│   │   ├── jwtMiddleware.ts          # JWT authentication
│   │   ├── rbacMiddleware.ts         # Role-based access control
│   │   ├── errorMiddleware.ts        # Error handling
│   │   └── multer.ts                 # File upload handling
│   │
│   ├── models/                # Database models
│   │   └── prisma-client.ts          # Prisma client instance
│   │
│   ├── config/                # Configuration files
│   │   ├── secrets.ts                # Environment variables
│   │   ├── cloudinary.ts             # Cloudinary configuration
│   │   ├── nodemailer.ts             # Email configuration
│   │   └── passport-Jwt-Statergy.ts  # Passport JWT strategy
│   │
│   ├── utils/                 # Helper functions
│   │   ├── logger.ts                 # Winston logger setup
│   │   ├── asyncHandler.ts           # Async error handler
│   │   ├── CustomError.ts            # Custom error class
│   │   ├── helperFunctions.ts        # Authentication helpers
│   │   ├── generateBarcode.ts        # Barcode generation
│   │   ├── invoiceUtils.ts           # Invoice utilities
│   │   ├── paginatedResponse.ts      # Pagination helper
│   │   └── startup.ts                # System initialization
│   │
│   ├── validators/            # Request validation
│   │   ├── validator.ts              # Main validator
│   │   └── schemas/                  # Zod validation schemas
│   │
│   ├── interfaces/            # TypeScript interfaces
│   │   ├── authInterface.ts          # Authentication interfaces
│   │   ├── productsInterface.ts      # Product interfaces
│   │   ├── salesInterface.ts         # Sales interfaces
│   │   ├── inventoryInterface.ts     # Inventory interfaces
│   │   └── reportsInterface.ts       # Reports interfaces
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── app-request.d.ts          # Extended request types
│   │   └── jwtInterface.ts           # JWT payload types
│   │
│   ├── jobs/                  # Background tasks
│   │   ├── attendenceCron.ts         # Attendance cron job
│   │   └── lowStockCron.ts           # Low stock alert cron
│   │
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Application entry point
│
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma                 # Database schema definition
│   ├── seed.ts                       # Database seeder
│   └── migrations/                   # Database migrations
│
├── logs/                      # Application logs
├── uploads/                   # File uploads directory
├── dist/                      # Compiled JavaScript (generated)
├── docs/                      # Additional documentation
│
├── .env.example               # Environment variables template
├── .env                       # Environment variables (local)
├── .env.production            # Production environment variables
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── nodemon.json               # Nodemon configuration
├── Procfile                   # Heroku deployment configuration
│
├── API_DOCUMENTATION.md       # Detailed API documentation
├── AWS_DEPLOYMENT_GUIDE.md    # AWS deployment instructions
├── INVOICE_EMAIL_SYSTEM.md    # Invoice email system docs
├── LOW_STOCK_ALERT_SYSTEM.md  # Low stock alert system docs
├── README.md                  # Project overview and setup
│
└── Postman Collections/       # API testing collections
    ├── Furniture_Shop_Complete_API.postman_collection.json
    └── Furniture_Shop_Complete_Environment.postman_environment.json
```

---

## ⚙️ Configuration & Environment

### Environment Variables

#### Required Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/furniture_shop"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="5d"

# Server Configuration
PORT=8001
NODE_ENV="development"
HOST="localhost"
```

#### Optional Variables

```env
# CORS Configuration
CORS_ORIGIN="*"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password"

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Database Configuration

#### Prisma Configuration

```javascript
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Connection Pool Settings

```env
DATABASE_URL="postgresql://username:password@localhost:5432/furniture_shop?schema=public&pool_timeout=20&connection_limit=5"
```

### Security Configuration

#### JWT Strategy

```typescript
// Passport JWT Strategy Configuration
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    },
    async (payload: UserPayload, done) => {
      // User validation logic
    }
  )
);
```

#### Rate Limiting Configuration

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
});
```

---

## 🚀 Deployment Guide

### Local Development Setup

1. **Prerequisites**

```bash
# Required software
Node.js 18+
PostgreSQL 13+
Git
npm or yarn
```

2. **Installation**

```bash
# Clone repository
git clone <repository-url>
cd furniture-shop-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run seed:furniture

# Start development server
npm run dev
```

### Production Deployment

#### AWS Free Tier Deployment

**Architecture:**

```
Internet → Elastic IP → EC2 (t2.micro) → RDS PostgreSQL (db.t3.micro)
                              ↓
                           S3 (File Storage)
```

**Steps:**

1. **Create RDS PostgreSQL Instance**

   - Instance: db.t3.micro (Free Tier)
   - Storage: 20GB (Free Tier)
   - Multi-AZ: Disabled (to stay free)

2. **Create EC2 Instance**

   - Instance: t2.micro (Free Tier)
   - OS: Amazon Linux 2023
   - Security Groups: HTTP (80), HTTPS (443), SSH (22)

3. **Server Setup**

```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-elastic-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git postgresql15

# Install PM2
sudo npm install -g pm2 typescript

# Clone and setup application
git clone <your-repo>
cd furniture-shop-backend
npm install
npm run build

# Setup environment
cp .env.example .env.production
# Edit with production values

# Setup database
npm run prisma:generate
npm run prisma:migrate:prod
npm run seed:furniture

# Start with PM2
pm2 start dist/src/server.js --name furniture-shop
pm2 startup
pm2 save
```

4. **Nginx Configuration**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8001

CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/furniture_shop
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=furniture_shop
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧪 Testing & Development

### Development Scripts

```json
{
  "scripts": {
    "start": "node dist/src/server.js",
    "start:dev": "nodemon",
    "build": "tsc",
    "postbuild": "npm run prisma:generate",
    "prestart": "npm run build",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "seed:furniture": "ts-node prisma/seed.ts"
  }
}
```

### API Testing with Postman

The project includes comprehensive Postman collections:

1. **Import Collections**

   - `Furniture_Shop_Complete_API.postman_collection.json`
   - `Furniture_Shop_Complete_Environment.postman_environment.json`

2. **Environment Setup**

```json
{
  "baseUrl": "http://localhost:8001/api/v1",
  "accessToken": "{{accessToken}}",
  "refreshToken": "{{refreshToken}}"
}
```

3. **Test Scenarios**
   - Authentication flow
   - CRUD operations for all entities
   - Business workflows (sales, purchases)
   - Error handling
   - Permission testing

### Manual Testing Commands

```bash
# Health check
curl http://localhost:8001/api/v1/health

# System info
curl http://localhost:8001/api/v1/info

# Login test
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@furniturestore.com","password":"admin123"}'

# Protected endpoint test
curl -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/v1/products
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed database
npm run seed:furniture
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem:** `Error: Can't reach database server`

**Solutions:**

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

#### 2. JWT Token Issues

**Problem:** `Invalid token` or `Token expired`

**Solutions:**

- Check JWT_SECRET in environment
- Verify token format in Authorization header
- Use refresh token to get new access token
- Check token expiration settings

#### 3. File Upload Issues

**Problem:** File uploads failing

**Solutions:**

```bash
# Check uploads directory permissions
ls -la uploads/

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Check Cloudinary configuration
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
```

#### 4. Email System Issues

**Problem:** Emails not sending

**Solutions:**

- Verify SMTP configuration
- Check email credentials
- Test with Gmail app passwords
- Check firewall/network restrictions

#### 5. Performance Issues

**Problem:** Slow API responses

**Solutions:**

```bash
# Check database indexes
# Monitor with Prisma Studio
npx prisma studio

# Check server resources
htop
df -h

# Optimize queries
# Add database indexes for frequently queried fields
```

### Logging and Monitoring

#### Winston Logger Configuration

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

#### Log Locations

```
logs/
├── error.log      # Error logs only
├── combined.log   # All logs
└── access.log     # HTTP access logs
```

### Health Monitoring

#### Health Check Endpoint

```bash
GET /api/v1/health

Response:
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-26T12:00:00.000Z",
    "uptime": 86400,
    "memory": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 15728640
    }
  }
}
```

#### System Info Endpoint

```bash
GET /api/v1/info

Response:
{
  "success": true,
  "data": {
    "name": "Furniture Shop Management API",
    "version": "1.0.0",
    "environment": "development",
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  }
}
```

---

## 📚 Additional Resources

### Documentation Files

- `README.md` - Project overview and quick start
- `API_DOCUMENTATION.md` - Complete API reference
- `AWS_DEPLOYMENT_GUIDE.md` - AWS deployment instructions
- `INVOICE_EMAIL_SYSTEM.md` - Email system documentation
- `LOW_STOCK_ALERT_SYSTEM.md` - Alert system documentation

### Default Test Accounts

After running the seed script, use these accounts for testing:

| Role    | Email                      | Password   | Access Level       |
| ------- | -------------------------- | ---------- | ------------------ |
| Admin   | admin@furniturestore.com   | admin123   | Full system access |
| Manager | manager@furniturestore.com | manager123 | Shop management    |
| Staff   | staff@furniturestore.com   | staff123   | Basic operations   |

### Key Features Summary

✅ **Complete Business Solution**

- Multi-shop operations
- Inventory management
- Sales processing
- Purchase management
- Customer relationship management
- Employee management
- Business analytics

✅ **Production Ready**

- JWT authentication
- Role-based access control
- Rate limiting
- Error handling
- Logging
- Security headers

✅ **Developer Friendly**

- TypeScript
- Comprehensive documentation
- Postman collections
- Docker support
- AWS deployment guide

✅ **Scalable Architecture**

- RESTful API design
- Database optimization
- Caching strategies
- Background jobs
- Email notifications

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prisma for database operations
- Implement proper error handling
- Add JSDoc comments for functions
- Follow the existing code structure
- Write tests for new features

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Happy coding! 🛋️💼**

_This documentation provides a complete overview of the Furniture Shop Management System. For specific implementation details, refer to the individual documentation files and source code._
