# Detailed Flow Examples: Individual Item Tracking

## Overview

This document explains each flow with real-world examples showing how Products (templates) and Individual Items (physical units) work together.

## Core Concept

- **Products**: Templates like "Wooden Chair - Brown Leather"
- **ProductItems**: Individual physical chairs with unique IDs, serial numbers, locations

Let's walk through each flow step by step.

---

## Flow 1: Product Creation (Existing - No Changes)

### Example: Creating a Product Template

**API Call:**

```http
POST /api/v1/products
Content-Type: multipart/form-data

name: "Premium Leather Sofa"
description: "3-seater premium leather sofa with wooden frame"
price: "2499.99"
categoryId: "living-room-category-uuid"
color: "Brown"
size: "84\" W x 36\" D x 32\" H"
material: "Genuine Leather"
weight: "85kg"
suppliersId: "premium-furniture-supplier-uuid"
image: [sofa-image.jpg]
```

**Result:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "product-sofa-001",
    "name": "Premium Leather Sofa",
    "price": "2499.99",
    "slug": "premium-leather-sofa",
    "category": { "name": "Living Room" }
  }
}
```

**What Happens:**

- Creates a product template in the system
- No individual items created yet
- This is just the "blueprint" for the sofa

---

## Flow 2: Purchase Order Creation (Existing - No Changes)

### Example: Ordering Sofas from Supplier

**API Call:**

```http
POST /api/v1/purchases
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "shopId": "main-store-uuid",
  "supplierId": "premium-furniture-supplier-uuid",
  "items": [
    {
      "productId": "product-sofa-001",
      "quantity": 5,
      "unitPrice": 1800.00,
      "warehouseId": "main-warehouse-uuid"
    }
  ]
}
```

**Result:**

```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "id": "purchase-001",
    "totalAmount": 9000.0,
    "status": "RECEIVED",
    "purchaseItems": [
      {
        "id": "purchase-item-001",
        "productId": "product-sofa-001",
        "quantity": 5,
        "unitPrice": 1800.0,
        "receivedQty": 5
      }
    ]
  }
}
```

**What Happens:**

- Creates purchase order for 5 sofas
- Updates inventory quantity: +5 sofas
- Creates stock log entry
- **No individual items created yet** (this is the old way)

---

## Flow 3: Enhanced Purchase Receiving (NEW - Creates Individual Items)

### Example: Receiving Sofas and Creating Individual Items

**API Call:**

```http
POST /api/v1/product-items/purchase/purchase-001/receive
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "items": [
    {
      "purchaseItemId": "purchase-item-001",
      "receivedQty": 5,
      "serialNumbers": ["SOFA-2025-001", "SOFA-2025-002", "SOFA-2025-003", "SOFA-2025-004", "SOFA-2025-005"]
    }
  ]
}
```

**Result:**

```json
{
  "success": true,
  "message": "Purchase received and individual items created",
  "data": {
    "createdItemsCount": 5,
    "items": [
      {
        "id": "item-sofa-001",
        "productId": "product-sofa-001",
        "serialNumber": "SOFA-2025-001",
        "barcode": "product-sofa-001-1737900000000-0",
        "status": "AVAILABLE",
        "condition": "NEW",
        "purchasePrice": 1800.0,
        "shopId": "main-store-uuid"
      }
      // ... 4 more individual sofas
    ]
  }
}
```

**What Happens:**

1. **Creates 5 individual ProductItem records** - one for each physical sofa
2. **Assigns serial numbers** from the supplier
3. **Generates barcodes** automatically
4. **Sets status** to "AVAILABLE"
5. **Records purchase details** (price, date, purchase ID)
6. **Updates inventory** (+5 to maintain backward compatibility)
7. **Creates history records** for each item

---

## Flow 4: Viewing Individual Items

### Example: Checking Available Sofas

**API Call:**

```http
GET /api/v1/product-items/product/product-sofa-001/items?status=AVAILABLE&shopId=main-store-uuid
Authorization: Bearer <staff-token>
```

**Result:**

```json
{
  "success": true,
  "message": "Product items retrieved successfully",
  "data": {
    "items": [
      {
        "id": "item-sofa-001",
        "serialNumber": "SOFA-2025-001",
        "barcode": "product-sofa-001-1737900000000-0",
        "status": "AVAILABLE",
        "condition": "NEW",
        "product": {
          "name": "Premium Leather Sofa",
          "price": "2499.99"
        },
        "shop": {
          "name": "Main Store",
          "location": "Downtown"
        },
        "createdAt": "2025-01-26T10:00:00Z"
      }
      // ... 4 more available sofas
    ],
    "meta": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "itemsPerPage": 10
    }
  }
}
```

**What This Shows:**

- All 5 individual sofas are available
- Each has unique serial number and barcode
- All are in "NEW" condition at "Main Store"
- Staff can see which specific sofas are available

---

## Flow 5: Traditional Sales (Existing - Still Works)

### Example: Selling Sofa the Old Way (Quantity-Based)

**API Call:**

```http
POST /api/v1/sales
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "shopId": "main-store-uuid",
  "customerId": "customer-john-doe",
  "paymentMode": "CARD",
  "items": [
    {
      "productId": "product-sofa-001",
      "quantity": 1,
      "unitPrice": 2499.99
    }
  ]
}
```

**Result:**

```json
{
  "success": true,
  "message": "Sale created successfully and invoice generated",
  "data": {
    "id": "sale-001",
    "invoiceNo": "INV-2025-001",
    "totalAmount": 2499.99,
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**What Happens:**

- Creates sale record
- Reduces inventory quantity: -1 sofa
- Creates stock log entry
- Generates invoice
- **Doesn't track which specific sofa was sold**

---

## Flow 6: Enhanced Sales with Individual Item Tracking (NEW)

### Example: Selling Specific Sofa with Full Tracking

**API Call:**

```http
POST /api/v1/product-items/sales/process
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "saleData": {
    "shopId": "main-store-uuid",
    "customerId": "customer-jane-smith",
    "paymentMode": "CASH",
    "items": [
      {
        "productId": "product-sofa-001",
        "quantity": 1,
        "unitPrice": 2499.99,
        "specificItemIds": ["item-sofa-002"]
      }
    ]
  }
}
```

**Result:**

```json
{
  "success": true,
  "message": "Sale processed with individual item tracking",
  "data": {
    "sale": {
      "id": "sale-002",
      "invoiceNo": "INV-2025-002",
      "totalAmount": 2499.99
    },
    "soldItemsCount": 1,
    "soldItems": [
      {
        "id": "item-sofa-002",
        "serialNumber": "SOFA-2025-002",
        "status": "SOLD",
        "salePrice": 2499.99,
        "saleDate": "2025-01-26T14:30:00Z"
      }
    ]
  }
}
```

**What Happens:**

1. **Marks specific sofa as SOLD** (item-sofa-002)
2. **Records sale details** on the individual item
3. **Updates inventory** (-1 for backward compatibility)
4. **Creates history record** showing this sofa was sold
5. **Links item to sale** for future reference
6. **Generates invoice** with specific item details

---

## Flow 7: Auto-Selection Sales (NEW - FIFO)

### Example: Let System Choose Which Sofa to Sell

**API Call:**

```http
POST /api/v1/product-items/sales/process
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "saleData": {
    "shopId": "main-store-uuid",
    "customerId": "customer-mike-wilson",
    "paymentMode": "UPI",
    "items": [
      {
        "productId": "product-sofa-001",
        "quantity": 2,
        "unitPrice": 2499.99
      }
    ]
  }
}
```

**Result:**

```json
{
  "success": true,
  "message": "Sale processed with individual item tracking",
  "data": {
    "sale": {
      "id": "sale-003",
      "invoiceNo": "INV-2025-003",
      "totalAmount": 4999.98
    },
    "soldItemsCount": 2,
    "soldItems": [
      {
        "id": "item-sofa-001",
        "serialNumber": "SOFA-2025-001",
        "status": "SOLD"
      },
      {
        "id": "item-sofa-003",
        "serialNumber": "SOFA-2025-003",
        "status": "SOLD"
      }
    ]
  }
}
```

**What Happens:**

1. **System automatically selects** oldest available sofas (FIFO)
2. **Marks 2 sofas as SOLD** (item-sofa-001 and item-sofa-003)
3. **Updates inventory** (-2 sofas)
4. **Creates history records** for both items
5. **No need to specify which sofas** - system handles it

---

## Flow 8: Item Movement Between Locations

### Example: Moving Sofa from Warehouse to Showroom

**API Call:**

```http
PATCH /api/v1/product-items/item-sofa-004/move
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "toShopId": "showroom-store-uuid",
  "reason": "Move to showroom for display"
}
```

**Result:**

```json
{
  "success": true,
  "message": "Item moved successfully",
  "data": {
    "id": "item-sofa-004",
    "shopId": "showroom-store-uuid",
    "updatedAt": "2025-01-26T15:00:00Z"
  }
}
```

**What Happens:**

1. **Updates item location** from main store to showroom
2. **Creates history record** showing the movement
3. **Records who moved it** and why
4. **Maintains inventory counts** per location

---

## Flow 9: Handling Damaged Items

### Example: Customer Returns Damaged Sofa

**API Call:**

```http
PATCH /api/v1/product-items/item-sofa-002/status
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "status": "RETURNED",
  "condition": "DAMAGED",
  "reason": "Customer return - scratched during delivery"
}
```

**Result:**

```json
{
  "success": true,
  "message": "Item status updated successfully",
  "data": {
    "id": "item-sofa-002",
    "status": "RETURNED",
    "condition": "DAMAGED"
  }
}
```

**What Happens:**

1. **Changes status** from "SOLD" to "RETURNED"
2. **Updates condition** to "DAMAGED"
3. **Records reason** for the return
4. **Creates history entry** with full details
5. **Item is now tracked as damaged** and not available for sale

---

## Flow 10: Viewing Item History and Audit Trail

### Example: Checking Complete History of a Sofa

**API Call:**

```http
GET /api/v1/product-items/item-sofa-002
Authorization: Bearer <staff-token>
```

**Result:**

```json
{
  "success": true,
  "data": {
    "id": "item-sofa-002",
    "serialNumber": "SOFA-2025-002",
    "status": "RETURNED",
    "condition": "DAMAGED",
    "purchasePrice": 1800.0,
    "salePrice": 2499.99,
    "product": {
      "name": "Premium Leather Sofa"
    },
    "itemHistory": [
      {
        "action": "STATUS_UPDATED",
        "fromStatus": "SOLD",
        "toStatus": "RETURNED",
        "reason": "Customer return - scratched during delivery",
        "createdAt": "2025-01-26T16:00:00Z"
      },
      {
        "action": "SOLD",
        "fromStatus": "AVAILABLE",
        "toStatus": "SOLD",
        "reason": "Sold in invoice INV-2025-002",
        "createdAt": "2025-01-26T14:30:00Z"
      },
      {
        "action": "RECEIVED",
        "toStatus": "AVAILABLE",
        "reason": "Received from purchase purchase-001",
        "createdAt": "2025-01-20T09:15:00Z"
      }
    ]
  }
}
```

**What This Shows:**

- **Complete lifecycle** of this specific sofa
- **When it was received** from supplier
- **When it was sold** and to which customer
- **When it was returned** and why
- **Full audit trail** for compliance and analysis

---

## Flow 11: Mixed Approach - Bulk Items vs Individual Items

### Example: Different Tracking for Different Products

**Scenario:** You have both expensive sofas (individual tracking) and cheap cushions (quantity tracking)

#### For Expensive Sofas (Individual Tracking):

```http
POST /api/v1/product-items/sales/process
{
  "saleData": {
    "items": [
      {
        "productId": "premium-sofa-001",
        "quantity": 1,
        "unitPrice": 2499.99,
        "specificItemIds": ["sofa-item-001"]
      }
    ]
  }
}
```

#### For Cheap Cushions (Quantity Tracking):

```http
POST /api/v1/sales
{
  "items": [
    {
      "productId": "cushion-001",
      "quantity": 10,
      "unitPrice": 29.99
    }
  ]
}
```

**Benefits:**

- **High-value items**: Full individual tracking with serial numbers
- **Low-value items**: Simple quantity tracking
- **Flexible approach**: Use what makes sense for each product type

---

## Flow 12: Inventory Status Overview

### Example: Current Inventory State After All Operations

**Traditional Inventory View:**

```http
GET /api/v1/inventory/main-store-uuid
```

**Result:**

```json
{
  "success": true,
  "data": {
    "inventories": [
      {
        "productId": "product-sofa-001",
        "quantity": 2,
        "product": {
          "name": "Premium Leather Sofa"
        }
      }
    ]
  }
}
```

**Individual Items View:**

```http
GET /api/v1/product-items/product/product-sofa-001/items
```

**Result:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-sofa-004",
        "serialNumber": "SOFA-2025-004",
        "status": "AVAILABLE",
        "condition": "NEW",
        "shop": { "name": "Showroom Store" }
      },
      {
        "id": "item-sofa-005",
        "serialNumber": "SOFA-2025-005",
        "status": "AVAILABLE",
        "condition": "NEW",
        "shop": { "name": "Main Store" }
      },
      {
        "id": "item-sofa-002",
        "serialNumber": "SOFA-2025-002",
        "status": "RETURNED",
        "condition": "DAMAGED",
        "shop": { "name": "Main Store" }
      }
    ]
  }
}
```

**Summary of Current State:**

- **Total quantity**: 2 available + 1 damaged = 3 total items
- **Available for sale**: 2 sofas (item-004 and item-005)
- **Not available**: 1 damaged sofa (item-002)
- **Locations**: 1 in showroom, 2 in main store
- **Sold items**: 2 sofas (item-001 and item-003)

---

## Key Benefits Demonstrated

### 1. **Complete Traceability**

- Know exactly which sofa was sold to which customer
- Track warranty periods per individual item
- Handle returns with specific item identification

### 2. **Better Inventory Management**

- See exact location of each item
- Track condition changes over time
- Identify patterns in damaged items

### 3. **Enhanced Customer Service**

- Quick lookup of customer's specific item
- Detailed history for warranty claims
- Precise return processing

### 4. **Business Intelligence**

- Which items sell faster (FIFO analysis)
- Damage patterns by supplier or batch
- Location-based performance metrics

### 5. **Compliance & Audit**

- Complete audit trail for each item
- Regulatory compliance for tracked items
- Insurance claims with specific details

---

## Implementation Strategy

### Start Small

1. **Begin with high-value items** (sofas, dining sets)
2. **Keep using quantity tracking** for low-value items (cushions, accessories)
3. **Gradually expand** individual tracking as needed

### Training Staff

1. **Show both approaches** - staff can choose based on situation
2. **Demonstrate benefits** with real examples
3. **Provide fallback** - existing system still works

### Customer Benefits

1. **Better service** - "Your sofa with serial SOFA-2025-002 is ready"
2. **Warranty tracking** - "This item is still under warranty until..."
3. **Return processing** - "We found your specific item in our system"

This dual approach gives you the flexibility to use the right tracking method for each product type while maintaining full backward compatibility with your existing system.
