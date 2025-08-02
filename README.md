# 🛋️ Furniture Shop Management System

A comprehensive, production-ready backend system for managing furniture shop operations including inventory, sales, customers, suppliers, and staff management with advanced reporting and analytics.

## ✨ Features

### 🔐 **Authentication & Authorization**

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, Staff)
- Secure password hashing with bcrypt
- Passport.js integration

### 📦 **Product & Inventory Management**

- Hierarchical product categories
- Detailed product specifications (color, size, material, weight)
- Multi-warehouse inventory tracking
- Stock level monitoring and alerts
- Barcode generation for products

### 🏪 **Multi-Shop Operations**

- Multiple shop locations support
- Shop-specific inventory management
- Cross-shop reporting and analytics

### 💰 **Sales & Customer Management**

- Complete sales transaction processing
- Invoice generation with PDF support
- Customer profiles and purchase history
- Multiple payment modes (Cash, Card, UPI, Other)

### 🚚 **Supplier & Purchase Management**

- Supplier relationship management
- Purchase order processing
- Purchase status tracking (Pending, Received, Returned)
- Return to supplier functionality

### 👥 **Employee Management**

- Employee profiles with department assignment
- Attendance tracking with check-in/check-out
- Working hours calculation
- Automated attendance cron jobs

### 📊 **Advanced Reporting & Analytics**

- Business dashboard with key metrics
- Sales reports with time-based grouping
- Inventory reports with low stock alerts
- Product performance analytics
- Supplier performance tracking
- Customer analytics and retention metrics
- Purchase analytics and trends

### 🔧 **Additional Features**

- File upload with Cloudinary integration
- Email notifications with Nodemailer
- Comprehensive logging with Winston
- Data validation with Zod
- API rate limiting and security headers
- Database seeding with sample data

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM 6.x
- **Authentication**: JWT with Passport.js
- **Security**: Helmet, CORS, Rate limiting, bcryptjs
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: Zod
- **Barcode**: bwip-js
- **Development**: Nodemon, ts-node

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** (v8 or higher)
- **Git**

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/furniture-shop-backend.git
cd furniture-shop-backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/furniture_shop"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=8001
NODE_ENV="development"

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

4. **Set up the database:**

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed sample furniture data
npm run seed:furniture
```

5. **Build and start the server:**

```bash
# Development mode with hot reload
npm run dev

# Production build and start
npm run build
npm start
```

The server will start on `http://localhost:8001`

### 🔍 **Verify Installation**

```bash
# Check health endpoint
curl http://localhost:8001/api/v1/health

# Check system info
curl http://localhost:8001/api/v1/info
```

## 📡 API Endpoints

### 🔐 **Authentication**

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### 👥 **User Management**

- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `POST /api/v1/users` - Create new user (Admin only)

### 🏪 **Shop Management**

- `GET /api/v1/shops` - Get all shops
- `GET /api/v1/shops/:id` - Get shop by ID
- `POST /api/v1/shops` - Create new shop
- `PUT /api/v1/shops/:id` - Update shop

### 📦 **Product Management**

- `GET /api/v1/products` - Get all products (with pagination)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `GET /api/v1/products/barcode/:id` - Generate product barcode

### 🗂️ **Category Management**

- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### 👤 **Customer Management**

- `GET /api/v1/customers` - Get all customers (with pagination)
- `GET /api/v1/customers/:id` - Get customer by ID
- `POST /api/v1/customers` - Create new customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### 🚚 **Supplier Management**

- `GET /api/v1/suppliers` - Get all suppliers
- `GET /api/v1/suppliers/:id` - Get supplier by ID
- `POST /api/v1/suppliers` - Create new supplier
- `PUT /api/v1/suppliers/:id` - Update supplier
- `DELETE /api/v1/suppliers/:id` - Delete supplier

### 💰 **Sales Management**

- `GET /api/v1/sales` - Get all sales (with pagination)
- `GET /api/v1/sales/:id` - Get sale by ID
- `POST /api/v1/sales` - Create new sale
- `PUT /api/v1/sales/:id` - Update sale
- `DELETE /api/v1/sales/:id` - Delete sale

### 🛒 **Purchase Management**

- `GET /api/v1/purchases` - Get all purchases
- `GET /api/v1/purchases/:id` - Get purchase by ID
- `POST /api/v1/purchases` - Create new purchase
- `PUT /api/v1/purchases/:id` - Update purchase
- `DELETE /api/v1/purchases/:id` - Delete purchase

### 📊 **Inventory Management**

- `GET /api/v1/inventory` - Get inventory status
- `GET /api/v1/inventory/:id` - Get inventory by ID
- `PUT /api/v1/inventory/:id` - Update inventory
- `GET /api/v1/inventory/low-stock` - Get low stock items

### 🏢 **Warehouse Management**

- `GET /api/v1/warehouses` - Get all warehouses
- `GET /api/v1/warehouses/:id` - Get warehouse by ID
- `POST /api/v1/warehouses` - Create new warehouse
- `PUT /api/v1/warehouses/:id` - Update warehouse

### 📈 **Reports & Analytics**

- `GET /api/v1/reports/dashboard` - Business dashboard
- `GET /api/v1/reports/sales` - Sales reports
- `GET /api/v1/reports/inventory` - Inventory reports
- `GET /api/v1/reports/products` - Product performance
- `GET /api/v1/reports/customers` - Customer analytics
- `GET /api/v1/reports/suppliers` - Supplier performance
- `GET /api/v1/reports/purchases` - Purchase analytics

### 🕐 **Attendance Management**

- `GET /api/v1/attendance` - Get attendance records
- `POST /api/v1/attendance/checkin` - Check in
- `POST /api/v1/attendance/checkout` - Check out
- `GET /api/v1/attendance/my` - Get my attendance

### 🧾 **Invoice Management**

- `GET /api/v1/invoices/:saleId` - Get invoice by sale ID
- `GET /api/v1/invoices/:saleId/pdf` - Download invoice PDF

### 💬 **Comments**

- `GET /api/v1/comments` - Get all comments
- `POST /api/v1/comments` - Create new comment

### 🏥 **System Health**

- `GET /api/v1/health` - Health check
- `GET /api/v1/info` - System information

## Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: System users with role-based access
- **Shops**: Physical store locations
- **Warehouses**: Storage facilities
- **Categories**: Product categorization
- **Products**: Furniture items with specifications
- **Suppliers**: Vendor management
- **Customers**: Customer information
- **Sales**: Sales transactions
- **Inventory**: Stock management
- **Attendance**: Employee time tracking

## 📜 Available Scripts

| Script                        | Description                              |
| ----------------------------- | ---------------------------------------- |
| `npm start`                   | Start production server (builds first)   |
| `npm run dev`                 | Start development server with hot reload |
| `npm run build`               | Build TypeScript to JavaScript           |
| `npm run prisma:generate`     | Generate Prisma client                   |
| `npm run prisma:migrate`      | Run database migrations (dev)            |
| `npm run prisma:migrate:prod` | Deploy migrations (production)           |
| `npm run seed:furniture`      | Seed database with sample furniture data |
| `npx prisma studio`           | Open Prisma database browser             |
| `npx prisma db push`          | Push schema changes to database          |
| `npx prisma db pull`          | Pull database schema to Prisma           |

## 📁 Project Structure

```
furniture-shop-backend/
├── src/
│   ├── controllers/           # Route handlers (18 controllers)
│   │   ├── authController.ts         # Authentication logic
│   │   ├── productsController.ts     # Product management
│   │   ├── salesController.ts        # Sales processing
│   │   ├── reportsController.ts      # Analytics & reporting
│   │   ├── inventoryController.ts    # Inventory management
│   │   ├── customerController.ts     # Customer management
│   │   ├── supplierController.ts     # Supplier management
│   │   ├── attendenceController.ts   # Attendance tracking
│   │   └── ...
│   ├── routes/                # Express route definitions (20 routes)
│   │   ├── index.ts                  # Main router
│   │   ├── auth.ts                   # Auth routes
│   │   ├── products.ts               # Product routes
│   │   ├── reports.ts                # Reporting routes
│   │   └── ...
│   ├── middleware/            # Express middleware (4 files)
│   │   ├── jwtMiddleware.ts          # JWT authentication
│   │   ├── rbacMiddleware.ts         # Role-based access control
│   │   ├── errorMiddleware.ts        # Error handling
│   │   └── multer.ts                 # File upload handling
│   ├── models/                # Database models
│   │   └── prisma-client.ts          # Prisma client instance
│   ├── config/                # Configuration files (4 files)
│   │   ├── secrets.ts                # Environment variables
│   │   ├── cloudinary.ts             # Cloudinary config
│   │   ├── nodemailer.ts             # Email config
│   │   └── passport-Jwt-Statergy.ts  # Passport JWT strategy
│   ├── utils/                 # Helper functions (8 files)
│   │   ├── logger.ts                 # Winston logger setup
│   │   ├── asyncHandler.ts           # Async error handler
│   │   ├── CustomError.ts            # Custom error class
│   │   ├── utilityFunctions.ts       # Common utilities
│   │   ├── generateBarcode.ts        # Barcode generation
│   │   ├── invoiceUtils.ts           # Invoice utilities
│   │   ├── paginatedResponse.ts      # Pagination helper
│   │   └── startup.ts                # System initialization
│   ├── validators/            # Request validation
│   │   ├── validator.ts              # Main validator
│   │   └── schemas/                  # Validation schemas
│   ├── interfaces/            # TypeScript interfaces (5 files)
│   │   ├── authInterface.ts          # Auth-related interfaces
│   │   ├── productsInterface.ts      # Product interfaces
│   │   └── ...
│   ├── types/                 # TypeScript type definitions (2 files)
│   │   ├── app-request.d.ts          # Extended request types
│   │   └── jwtInterface.ts           # JWT payload types
│   ├── jobs/                  # Background tasks
│   │   └── attendenceCron.ts         # Attendance cron job
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Application entry point
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma                 # Database schema
│   ├── seed.ts                       # Database seeder
│   └── migrations/                   # Database migrations
├── logs/                      # Application logs
├── uploads/                   # File uploads directory
├── dist/                      # Compiled JavaScript (generated)
├── generated/                 # Prisma generated files
├── .env.example               # Environment variables template
├── AWS_DEPLOYMENT_GUIDE.md    # AWS deployment instructions
├── API_DOCUMENTATION.md       # API documentation
├── POSTMAN_TESTING_GUIDE.md   # Postman testing guide
├── Furniture_Shop_*.json      # Postman collections
├── tsconfig.json              # TypeScript configuration
├── nodemon.json               # Nodemon configuration
└── package.json               # Project dependencies
```

## 🔧 Environment Variables

### Required Variables

| Variable             | Description                  | Example                                                |
| -------------------- | ---------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/furniture_shop` |
| `JWT_SECRET`         | JWT signing secret           | `your-super-secure-jwt-secret-key`                     |
| `JWT_REFRESH_SECRET` | JWT refresh token secret     | `your-super-secure-refresh-secret-key`                 |

### Optional Variables

| Variable                  | Description              | Default       |
| ------------------------- | ------------------------ | ------------- |
| `PORT`                    | Server port              | `8001`        |
| `NODE_ENV`                | Environment mode         | `development` |
| `JWT_EXPIRES_IN`          | JWT expiration time      | `7d`          |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token expiration | `30d`         |
| `CORS_ORIGIN`             | CORS allowed origins     | `*`           |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window        | `900000`      |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window  | `100`         |

### Email Configuration (Optional)

| Variable    | Description                 | Example                |
| ----------- | --------------------------- | ---------------------- |
| `MAIL_HOST` | SMTP host                   | `smtp.gmail.com`       |
| `MAIL_PORT` | SMTP port                   | `587`                  |
| `MAIL_USER` | Email username              | `your-email@gmail.com` |
| `MAIL_PASS` | Email password/app password | `your-app-password`    |

### Cloudinary Configuration (Optional)

| Variable                | Description           |
| ----------------------- | --------------------- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`    | Cloudinary API key    |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## 👤 Default Users

After running `npm run seed:furniture`, you can login with these demo accounts:

| Role        | Email                      | Password   | Permissions              |
| ----------- | -------------------------- | ---------- | ------------------------ |
| **Admin**   | admin@furniturestore.com   | admin123   | Full system access       |
| **Manager** | manager@furniturestore.com | manager123 | Shop management, reports |
| **Staff**   | staff@furniturestore.com   | staff123   | Basic operations         |

## 🚀 Deployment

### AWS Free Tier Deployment

This project includes a comprehensive AWS deployment guide:

```bash
# Check the deployment guide
cat AWS_DEPLOYMENT_GUIDE.md
```

**Features:**

- ✅ **100% FREE** AWS deployment
- ✅ EC2 t2.micro + RDS db.t3.micro
- ✅ Production-ready setup with Nginx
- ✅ SSL certificate with Let's Encrypt
- ✅ Automated deployment scripts

### Local Production Setup

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📚 Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)** - Step-by-step AWS deployment
- **[Postman Testing Guide](POSTMAN_TESTING_GUIDE.md)** - API testing with Postman

## 🧪 Testing

### Postman Collections

Import the provided Postman collections for comprehensive API testing:

- `Furniture_Shop_Complete_API.postman_collection.json` - All endpoints
- `Furniture_Shop_Complete_Environment.postman_environment.json` - Environment variables

### Manual Testing

```bash
# Health check
curl http://localhost:8001/api/v1/health

# System info
curl http://localhost:8001/api/v1/info

# Login test
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@furniturestore.com","password":"admin123"}'
```

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

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Authentication with [Passport.js](http://www.passportjs.org/)
- File uploads with [Cloudinary](https://cloudinary.com/)

## 📧 Automated Low Stock Notifications

The system includes intelligent inventory monitoring with email alerts:

- **🕘 Daily Monitoring**: Automatic checks at 9:00 AM
- **📊 Smart Thresholds**: Alerts when inventory ≤ 10 items  
- **👥 Role-Based Notifications**: Managers and owners get relevant alerts
- **📧 Professional Emails**: Rich HTML templates with detailed stock information
- **🏪 Multi-Shop Support**: Shop-specific notifications for managers

**Quick Setup:**
1. Add email configuration to `.env` file
2. Restart server to activate cron job
3. Test with: `POST /api/v1/admin/trigger-low-stock-check`

See **[Low Stock Notification Guide](LOW_STOCK_NOTIFICATION_GUIDE.md)** for complete setup instructions.

---

**Happy coding! 🛋️💼**
