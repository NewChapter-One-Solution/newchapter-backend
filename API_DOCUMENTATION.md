# 📚 API Documentation - Furniture Shop Management System

## 🌐 Base URL

**Local Development:**
```
http://localhost:8001/api/v1
```

**Production (AWS):**
```
http://[YOUR-ELASTIC-IP]/api/v1
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Types:
- **Access Token**: Short-lived (1 hour) for API requests
- **Refresh Token**: Long-lived (5 days) for token renewal

### Rate Limiting:
- **Login**: 10 requests per 15 minutes
- **Register**: 5 requests per 15 minutes  
- **Refresh Token**: 20 requests per 15 minutes
- **General API**: 100 requests per 15 minutes

---

## 🔐 Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Creates a new user account.

**Request Body:**

```json
{
  "email": "sarah.wilson@furniturestore.com",
  "password": "furniture123",
  "firstName": "Sarah",
  "lastName": "Wilson",
  "role": "STAFF"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### 2. Login

**POST** `/auth/login`

Authenticates a user and returns JWT tokens.

**Request Body:**

```json
{
  "email": "admin@furniturestore.com",
  "password": "admin123"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExp": 1643723400,
    "refreshTokenExp": 1644155400,
    "user": {
      "id": "uuid-here",
      "email": "admin@furniturestore.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "shopId": "shop-uuid",
      "department": "MANAGEMENT"
    }
  }
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### 3. Logout

**POST** `/auth/logout`
**Requires:** Authentication

Logs out the current user.

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

---

### 4. Refresh Access Token

**POST** `/auth/refresh-token`

Refreshes the access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExp": 1643723400
  }
}
```

**Rate Limit:** 20 requests per 15 minutes

---

### 5. Get Current User

**GET** `/auth/me`
**Requires:** Authentication

Gets the current authenticated user's information.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Current user data retrieved successfully",
  "data": {
    "id": "uuid-here",
    "email": "admin@furniturestore.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "shopId": "shop-uuid",
    "department": "MANAGEMENT",
    "isActive": true,
    "createdAt": "2025-01-26T10:30:00.000Z",
    "updatedAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 6. Get User Permissions

**GET** `/auth/permissions`
**Requires:** Authentication

Gets the current user's role and permissions.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "userId": "uuid-here",
    "role": "MANAGER",
    "permissions": [
      "product:read",
      "product:create",
      "product:update",
      "inventory:read",
      "inventory:create",
      "inventory:update",
      "purchase:create",
      "purchase:read",
      "purchase:update",
      "sales:create",
      "sales:read",
      "sales:update",
      "reports:view"
    ]
  }
}
```

---

## 👥 User Management Endpoints

### 7. Get All Users

**GET** `/users`
**Requires:** Authentication + MANAGER+ role

Gets a list of all users with filtering options.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role (ADMIN, MANAGER, STAFF)
- `isActive` (optional): Filter by status (true/false)
- `search` (optional): Search by name or email

**Example Request:**

```
GET /users?page=1&limit=10&role=STAFF&isActive=true&search=john
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid-here",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "STAFF",
        "isActive": true,
        "department": "SALES",
        "shopId": "shop-uuid",
        "createdAt": "2025-01-26T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 8. Update User Role

**POST** `/users/update-role`
**Requires:** Authentication + ADMIN role

Updates a user's role.

**Request Body:**

```json
{
  "userId": "uuid-here",
  "role": "MANAGER"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "isActive": true
  }
}
```

---

### 9. Change Password

**POST** `/users/change-password`
**Requires:** Authentication

Changes the current user's password.

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🏪 Shop Management Endpoints

### 10. Create Shop

**POST** `/shops`
**Requires:** Authentication + ADMIN role

Creates a new shop.

**Request Body:**

```json
{
  "name": "Elite Furniture Downtown",
  "location": "456 Furniture Ave, Downtown, NY 10001",
  "ownerId": "owner-uuid"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Shop created successfully",
  "data": {
    "id": "shop-uuid",
    "name": "Elite Furniture Downtown",
    "location": "456 Furniture Ave, Downtown, NY 10001",
    "ownerId": "owner-uuid",
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 11. Get All Shops

**GET** `/shops`
**Requires:** Authentication + STAFF+ role

Gets a list of all shops.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Shops retrieved successfully",
  "data": [
    {
      "id": "shop-uuid",
      "name": "Downtown Store",
      "location": "123 Main St, City, State",
      "ownerId": "owner-uuid",
      "createdAt": "2025-01-26T10:30:00.000Z"
    }
  ]
}
```

---

### 12. Get Shop by ID

**GET** `/shops/:id`
**Requires:** Authentication + STAFF+ role

Gets a specific shop by ID.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Shop retrieved successfully",
  "data": {
    "id": "shop-uuid",
    "name": "Downtown Store",
    "location": "123 Main St, City, State",
    "ownerId": "owner-uuid",
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 13. Update Shop

**PUT** `/shops/:id`
**Requires:** Authentication + MANAGER+ role

Updates a shop's information.

**Request Body:**

```json
{
  "name": "Updated Store Name",
  "location": "456 New St, City, State"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Shop updated successfully",
  "data": {
    "id": "shop-uuid",
    "name": "Updated Store Name",
    "location": "456 New St, City, State",
    "ownerId": "owner-uuid",
    "updatedAt": "2025-01-26T11:30:00.000Z"
  }
}
```

---

### 14. Delete Shop

**DELETE** `/shops/:id`
**Requires:** Authentication + ADMIN role

Deletes a shop.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Shop deleted successfully"
}
```

---

## 📦 Product Management Endpoints

### 15. Create Product

**POST** `/products`
**Requires:** Authentication + MANAGER+ role

Creates a new product with optional image upload.

**Request Body (multipart/form-data):**

```
name: "Modern Leather Sofa"
categoryId: "category-uuid"
description: "Premium 3-seater leather sofa with wooden frame"
price: "1299.99"
color: "Brown"
size: "84\" W x 36\" D x 32\" H"
material: "Genuine Leather"
weight: "85kg"
suppliersId: "supplier-uuid"
image: [file upload]
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "product-uuid",
    "name": "Modern Leather Sofa",
    "description": "Premium 3-seater leather sofa with wooden frame",
    "price": "1299.99",
    "color": "Brown",
    "size": "84\" W x 36\" D x 32\" H",
    "material": "Genuine Leather",
    "weight": "85kg",
    "categoryId": "category-uuid",
    "suppliersId": "supplier-uuid",
    "imageDetails": {
      "publicId": "furniture/modern-leather-sofa",
      "url": "https://res.cloudinary.com/furniture-shop/image/upload/v1/furniture/modern-leather-sofa.jpg"
    },
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 16. Get All Products

**GET** `/products`
**Requires:** Authentication + STAFF+ role

Gets a paginated list of products.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**

```
GET /products?page=1&limit=5
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "id": "product-uuid",
        "name": "Modern Leather Sofa",
        "description": "Premium 3-seater leather sofa with wooden frame",
        "price": "1299.99",
        "color": "Brown",
        "categoryId": "category-uuid",
        "imageDetails": {
          "url": "https://res.cloudinary.com/furniture-shop/image/upload/v1/furniture/modern-leather-sofa.jpg"
        }
      }
    ],
    "meta": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 50,
      "itemsPerPage": 5
    }
  }
}
```

---

### 17. Get Product by ID

**GET** `/products/:id`
**Requires:** Authentication + STAFF+ role

Gets a specific product by ID.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": "product-uuid",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones",
    "price": "99.99",
    "color": "Black",
    "size": "Medium",
    "material": "Plastic",
    "weight": "200g",
    "categoryId": "category-uuid",
    "suppliersId": "supplier-uuid",
    "imageDetails": {
      "publicId": "cloudinary-public-id",
      "url": "https://cloudinary.com/image-url"
    },
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 18. Update Product

**PUT** `/products/:id`
**Requires:** Authentication + MANAGER+ role

Updates a product with optional image upload.

**Request Body (multipart/form-data):**

```
name: "Updated Wireless Headphones"
price: "89.99"
color: "White"
image: [new file upload - optional]
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "Updated Wireless Headphones",
    "price": "89.99",
    "color": "White",
    "imageDetails": {
      "publicId": "new-cloudinary-public-id",
      "url": "https://cloudinary.com/new-image-url"
    },
    "updatedAt": "2025-01-26T11:30:00.000Z"
  }
}
```

---

### 19. Delete Product

**DELETE** `/products/:id`
**Requires:** Authentication + ADMIN role

Deletes a product.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 📊 Inventory Management Endpoints

### 20. Create Inventory

**POST** `/inventory`
**Requires:** Authentication + MANAGER+ role

Creates or updates inventory for a product in a shop.

**Request Body:**

```json
{
  "productId": "product-uuid",
  "shopId": "shop-uuid",
  "warehouseId": "warehouse-uuid",
  "quantity": 100
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Inventory created successfully",
  "data": {
    "id": "inventory-uuid",
    "productId": "product-uuid",
    "shopId": "shop-uuid",
    "warehouseId": "warehouse-uuid",
    "quantity": 100,
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 21. Adjust Inventory

**POST** `/inventory/adjust`
**Requires:** Authentication + MANAGER+ role

Adjusts inventory quantity (increase or decrease).

**Request Body:**

```json
{
  "productId": "product-uuid",
  "shopId": "shop-uuid",
  "adjustment": -5,
  "reason": "Sale"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Inventory adjusted successfully",
  "data": {
    "id": "inventory-uuid",
    "productId": "product-uuid",
    "shopId": "shop-uuid",
    "quantity": 95,
    "updatedAt": "2025-01-26T11:30:00.000Z"
  }
}
```

---

### 22. Get Inventory by Shop

**GET** `/inventory/:shopId`
**Requires:** Authentication + STAFF+ role

Gets all inventory items for a specific shop.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Inventory retrieved successfully",
  "data": [
    {
      "id": "inventory-uuid",
      "productId": "product-uuid",
      "shopId": "shop-uuid",
      "warehouseId": "warehouse-uuid",
      "quantity": 95,
      "product": {
        "name": "Wireless Headphones",
        "price": "99.99"
      },
      "warehouse": {
        "name": "Main Warehouse"
      }
    }
  ]
}
```

---

## 🛒 Purchase Management Endpoints

### 23. Create Purchase

**POST** `/purchases`
**Requires:** Authentication + MANAGER+ role

Creates a new purchase order.

**Request Body:**

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

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "id": "purchase-uuid",
    "shopId": "shop-uuid",
    "supplierId": "supplier-uuid",
    "totalAmount": 17000.0,
    "status": "PENDING",
    "purchaseDate": "2025-01-26T10:30:00.000Z",
    "purchaseItems": [
      {
        "productId": "product-uuid",
        "quantity": 20,
        "unitPrice": 850.0,
        "receivedQty": 0,
        "returnedQty": 0
      }
    ]
  }
}
```

---

## 👨‍💼 Admin Panel Endpoints

### 24. Get Dashboard Stats

**GET** `/admin/dashboard/stats`
**Requires:** Authentication + ADMIN role

Gets dashboard statistics for admin panel.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalUsers": 150,
    "totalProducts": 500,
    "totalShops": 10,
    "totalPurchases": 200,
    "totalSales": 1500,
    "activeUsers": 140,
    "inactiveUsers": 10,
    "recentUsers": [
      {
        "id": "user-uuid",
        "email": "recent@example.com",
        "firstName": "Recent",
        "lastName": "User",
        "role": "STAFF",
        "createdAt": "2025-01-26T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 25. Get System Health

**GET** `/admin/system/health`
**Requires:** Authentication + ADMIN role

Gets system health status.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "System health check completed",
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-26T12:00:00.000Z",
    "services": {
      "database": "healthy",
      "redis": "not configured"
    },
    "metrics": {
      "totalUsers": 150,
      "totalProducts": 500,
      "uptime": 86400,
      "memory": {
        "rss": 45678592,
        "heapTotal": 20971520,
        "heapUsed": 15728640
      }
    }
  }
}
```

---

### 26. Get All Users (Admin)

**GET** `/admin/users`
**Requires:** Authentication + ADMIN role

Gets all users with advanced filtering (admin version).

**Query Parameters:**

- `page`, `limit`, `role`, `isActive`, `search` (same as regular user endpoint)

**Response:** Same format as regular users endpoint but with more detailed information.

---

### 27. Update User Status

**PATCH** `/admin/users/:userId/status`
**Requires:** Authentication + ADMIN role

Activates or deactivates a user account.

**Request Body:**

```json
{
  "isActive": false
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF",
    "isActive": false
  }
}
```

---

### 28. Update User Role (Admin)

**PATCH** `/admin/users/:userId/role`
**Requires:** Authentication + ADMIN role

Updates any user's role (admin version).

**Request Body:**

```json
{
  "role": "MANAGER"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "isActive": true
  }
}
```

---

### 29. Get User Activities

**GET** `/admin/users/:userId/activities`
**Requires:** Authentication + ADMIN role

Gets activity logs for a specific user.

**Query Parameters:**

- `limit` (optional): Number of activities to return (default: 50)

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "User activities retrieved successfully",
  "data": []
}
```

_Note: Currently returns empty array as activity logging is console-based._

---

## 🔒 Role-Based Access Control

### Role Hierarchy:

1. **STAFF** (Level 1) - Basic operations
2. **MANAGER** (Level 2) - Management operations
3. **ADMIN** (Level 3) - Full system access

### Permission Examples:

- **STAFF**: Can read products, create sales, manage own attendance
- **MANAGER**: All STAFF permissions + create/update products, manage inventory
- **ADMIN**: All permissions + user management, system administration

---

## 🚨 Error Responses

### Common Error Formats:

**401 Unauthorized:**

```json
{
  "success": false,
  "status": 401,
  "message": "Unauthorized access",
  "error": "Invalid or missing token"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["product:create"],
  "userRole": "STAFF"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Product not found"
}
```

**429 Rate Limited:**

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

**500 Server Error:**

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 📝 Notes

1. **Authentication**: Most endpoints require a valid JWT token
2. **Rate Limiting**: Authentication endpoints have rate limiting
3. **File Uploads**: Product endpoints support image uploads via multipart/form-data
4. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
5. **Filtering**: Many endpoints support filtering and search parameters
6. **Role Checking**: Permissions are checked in real-time for each request

---

## 🗂️ Category Management Endpoints

### 30. Create Category

**POST** `/categories`
**Requires:** Authentication + MANAGER+ role

Creates a new product category.

**Request Body:**

```json
{
  "name": "Living Room Furniture",
  "slug": "living-room-furniture",
  "parentId": null
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "category-uuid",
    "name": "Living Room Furniture",
    "slug": "living-room-furniture",
    "parentId": null,
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 31. Get All Categories

**GET** `/categories`
**Requires:** Authentication + STAFF+ role

Gets all categories with hierarchical structure.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-uuid",
      "name": "Living Room Furniture",
      "slug": "living-room-furniture",
      "parentId": null,
      "children": [
        {
          "id": "subcategory-uuid",
          "name": "Sofas",
          "slug": "sofas",
          "parentId": "category-uuid"
        }
      ]
    }
  ]
}
```

---

## 👤 Customer Management Endpoints

### 32. Create Customer

**POST** `/customers`
**Requires:** Authentication + STAFF+ role

Creates a new customer.

**Request Body:**

```json
{
  "name": "Michael Johnson",
  "phone": "+1-555-0123",
  "email": "michael.johnson@email.com",
  "address": "789 Oak Street, Springfield, IL 62701"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "customer-uuid",
    "name": "Michael Johnson",
    "phone": "+1-555-0123",
    "email": "michael.johnson@email.com",
    "address": "789 Oak Street, Springfield, IL 62701",
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

### 33. Get All Customers

**GET** `/customers`
**Requires:** Authentication + STAFF+ role

Gets paginated list of customers.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name, phone, or email

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "id": "customer-uuid",
        "name": "John Smith",
        "phone": "+1234567890",
        "email": "john.smith@email.com",
        "address": "123 Customer St, City, State"
      }
    ],
    "meta": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

---

## 🚚 Supplier Management Endpoints

### 34. Create Supplier

**POST** `/suppliers`
**Requires:** Authentication + MANAGER+ role

Creates a new supplier.

**Request Body:**

```json
{
  "name": "Premium Furniture Suppliers Inc.",
  "email": "orders@premiumfurniture.com",
  "phone": "+1-800-FURNITURE",
  "address": "1200 Industrial Blvd, Furniture District, NC 28001",
  "website": "https://premiumfurnituresuppliers.com",
  "gstid": "GST27ABCDE1234F1Z5"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": "supplier-uuid",
    "name": "Premium Furniture Suppliers Inc.",
    "email": "orders@premiumfurniture.com",
    "phone": "+1-800-FURNITURE",
    "address": "1200 Industrial Blvd, Furniture District, NC 28001",
    "website": "https://premiumfurnituresuppliers.com",
    "gstid": "GST27ABCDE1234F1Z5",
    "isActive": true,
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

## 💰 Sales Management Endpoints

### 35. Create Sale

**POST** `/sales`
**Requires:** Authentication + STAFF+ role

Creates a new sale transaction.

**Request Body:**

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

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": "sale-uuid",
    "shopId": "shop-uuid",
    "customerId": "customer-uuid",
    "saleDate": "2025-01-26T10:30:00.000Z",
    "totalAmount": 1299.99,
    "paymentMode": "CASH",
    "invoiceNo": "INV-2025-001",
    "saleItems": [
      {
        "productId": "product-uuid",
        "quantity": 1,
        "unitPrice": 1299.99
      }
    ]
  }
}
```

---

## 🏢 Warehouse Management Endpoints

### 36. Create Warehouse

**POST** `/warehouses`
**Requires:** Authentication + ADMIN role

Creates a new warehouse.

**Request Body:**

```json
{
  "name": "Central Furniture Warehouse",
  "location": "2500 Storage Drive, Warehouse District, TX 75001",
  "capacity": 50000,
  "minCapacity": 5000,
  "maxCapacity": 75000
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Warehouse created successfully",
  "data": {
    "id": "warehouse-uuid",
    "name": "Central Furniture Warehouse",
    "location": "2500 Storage Drive, Warehouse District, TX 75001",
    "capacity": 50000,
    "minCapacity": 5000,
    "maxCapacity": 75000,
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

## 🕐 Attendance Management Endpoints

### 37. Check In

**POST** `/attendance/checkin`
**Requires:** Authentication + STAFF+ role

Records employee check-in.

**Request Body:**

```json
{
  "userId": "user-uuid"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Checked in successfully",
  "data": {
    "id": "attendance-uuid",
    "userId": "user-uuid",
    "date": "2025-01-26T00:00:00.000Z",
    "checkIn": "2025-01-26T09:00:00.000Z",
    "isCheckedIn": true,
    "status": "PRESENT"
  }
}
```

---

### 38. Check Out

**POST** `/attendance/checkout`
**Requires:** Authentication + STAFF+ role

Records employee check-out.

**Request Body:**

```json
{
  "userId": "user-uuid"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Checked out successfully",
  "data": {
    "id": "attendance-uuid",
    "userId": "user-uuid",
    "date": "2025-01-26T00:00:00.000Z",
    "checkIn": "2025-01-26T09:00:00.000Z",
    "checkOut": "2025-01-26T17:00:00.000Z",
    "isCheckedIn": false,
    "status": "PRESENT",
    "workedHours": 8.0
  }
}
```

---

## 📊 Reports & Analytics Endpoints

### 39. Business Dashboard

**GET** `/reports/dashboard`
**Requires:** Authentication + MANAGER+ role

Gets comprehensive business dashboard data.

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `period` (optional): day, week, month, year (default: month)

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Business dashboard retrieved successfully",
  "data": {
    "summary": {
      "totalRevenue": 50000.00,
      "totalSales": 150,
      "totalCustomers": 75,
      "averageOrderValue": 333.33
    },
    "topSellingProducts": [
      {
        "product": {
          "name": "Modern Leather Sofa",
          "price": "1299.99"
        },
        "quantitySold": 8,
        "revenue": 10399.92
      }
    ],
    "recentSales": [],
    "lowStockProducts": [],
    "categoryPerformance": [],
    "period": "month"
  }
}
```

---

### 40. Sales Report

**GET** `/reports/sales`
**Requires:** Authentication + MANAGER+ role

Gets detailed sales reports.

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `groupBy` (optional): day, week, month (default: day)
- `paymentMode` (optional): Filter by payment method

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Sales report retrieved successfully",
  "data": {
    "summary": {
      "totalRevenue": 25000.00,
      "totalSales": 75,
      "averageOrderValue": 333.33,
      "paymentModeBreakdown": {
        "CASH": 30,
        "CARD": 25,
        "UPI": 20
      }
    },
    "salesByPeriod": [],
    "detailedSales": []
  }
}
```

---

### 41. Inventory Report

**GET** `/reports/inventory`
**Requires:** Authentication + MANAGER+ role

Gets inventory status report.

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `categoryId` (optional): Filter by category
- `lowStock` (optional): true/false - show only low stock items

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Inventory report retrieved successfully",
  "data": {
    "summary": {
      "totalProducts": 500,
      "totalValue": 125000.00,
      "lowStockCount": 25,
      "outOfStockCount": 5
    },
    "inventory": []
  }
}
```

---

### 42. Product Performance Report

**GET** `/reports/products`
**Requires:** Authentication + MANAGER+ role

Gets product performance analytics.

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `categoryId` (optional): Filter by category
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `limit` (optional): Number of products (default: 20)

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Product performance report retrieved successfully",
  "data": [
    {
      "product": {
        "id": "product-uuid",
        "name": "Modern Leather Sofa",
        "price": "1299.99",
        "category": "Living Room"
      },
      "metrics": {
        "quantitySold": 8,
        "totalRevenue": 10399.92,
        "numberOfSales": 8,
        "averageQuantityPerSale": 1.0
      }
    }
  ]
}
```

---

### 43. Customer Analytics

**GET** `/reports/customers`
**Requires:** Authentication + MANAGER+ role

Gets customer analytics and insights.

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `period` (optional): month, year (default: month)

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Customer analytics retrieved successfully",
  "data": {
    "summary": {
      "totalCustomers": 150,
      "newCustomers": 25,
      "repeatCustomers": 75,
      "customerRetentionRate": 50.0
    },
    "topCustomers": [
      {
        "customer": {
          "name": "Michael Johnson",
          "phone": "+1-555-0123",
          "email": "michael.johnson@email.com"
        },
        "totalSpent": 5200.00,
        "totalPurchases": 4,
        "averageOrderValue": 1300.00
      }
    ],
    "period": "month"
  }
}
```

---

## 🧾 Invoice Management Endpoints

### 44. Get Invoice

**GET** `/invoices/:saleId`
**Requires:** Authentication + STAFF+ role

Gets invoice details for a sale.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "invoiceNo": "INV-2025-001",
    "saleId": "sale-uuid",
    "saleDate": "2025-01-26T10:30:00.000Z",
    "customer": {
      "name": "Michael Johnson",
      "phone": "+1-555-0123",
      "address": "789 Oak Street, Springfield, IL 62701"
    },
    "shop": {
      "name": "Elite Furniture Downtown",
      "location": "456 Furniture Ave, Downtown, NY 10001"
    },
    "items": [
      {
        "productName": "Modern Leather Sofa",
        "quantity": 1,
        "unitPrice": 1299.99,
        "total": 1299.99
      }
    ],
    "totalAmount": 1299.99,
    "paymentMode": "CASH"
  }
}
```

---

### 45. Download Invoice PDF

**GET** `/invoices/:saleId/pdf`
**Requires:** Authentication + STAFF+ role

Downloads invoice as PDF file.

**Response:** PDF file download

---

## 💬 Comments Management Endpoints

### 46. Get Comments

**GET** `/comments`
**Requires:** Authentication + STAFF+ role

Gets all comments.

**Query Parameters:**
- `productId` (optional): Filter by product

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "comment-uuid",
      "productId": "product-uuid",
      "comment": "Excellent sofa quality, very comfortable and durable",
      "createdAt": "2025-01-26T10:30:00.000Z"
    }
  ]
}
```

---

### 47. Create Comment

**POST** `/comments`
**Requires:** Authentication + STAFF+ role

Creates a new comment.

**Request Body:**

```json
{
  "productId": "product-uuid",
  "comment": "Beautiful craftsmanship on this dining table, customers love it"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "comment-uuid",
    "productId": "product-uuid",
    "comment": "Beautiful craftsmanship on this dining table, customers love it",
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

---

## 🏥 System Health Endpoints

### 48. Health Check

**GET** `/health`
**No Authentication Required**

Basic health check endpoint.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-26T12:00:00.000Z",
  "uptime": 86400
}
```

---

### 49. System Information

**GET** `/info`
**No Authentication Required**

Gets system information and statistics.

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "System information retrieved successfully",
  "data": {
    "name": "Furniture Shop Management System",
    "version": "1.0.0",
    "environment": "development",
    "database": "connected",
    "uptime": 86400,
    "timestamp": "2025-01-26T12:00:00.000Z",
    "stats": {
      "totalUsers": 150,
      "totalProducts": 500,
      "totalShops": 10,
      "totalSales": 1500
    }
  }
}
```

---

## 📋 Additional Features

### Barcode Generation

Products automatically get barcode generation capabilities:

**GET** `/products/:id/barcode`
**Requires:** Authentication + STAFF+ role

Generates and returns barcode for a product.

### File Upload Support

- **Products**: Support image upload via multipart/form-data
- **Cloudinary Integration**: Automatic image optimization and CDN delivery
- **File Validation**: Supports common image formats (JPG, PNG, GIF)

### Pagination

Most list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Search & Filtering

Many endpoints support search and filtering:
- `search`: Text search across relevant fields
- `categoryId`: Filter by category
- `shopId`: Filter by shop
- `isActive`: Filter by status

---

This API provides a complete furniture shop management system with robust authentication, authorization, role-based access control, comprehensive reporting, and production-ready features.
