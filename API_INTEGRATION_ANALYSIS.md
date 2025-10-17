# API Integration Analysis: Individual Item Tracking

## Current System Overview

Your furniture shop management system currently has:

### Existing API Structure

```
/api/v1/
├── auth/                 # Authentication
├── products/             # Product templates management
├── inventory/            # Quantity-based inventory
├── sales/                # Sales processing
├── purchases/            # Purchase orders
├── customers/            # Customer management
├── suppliers/            # Supplier management
├── shops/                # Shop management
├── warehouses/           # Warehouse management
├── reports/              # Analytics & reporting
└── admin/                # Admin operations
```

### New Addition

```
/api/v1/product-items/    # Individual item tracking (NEW)
```

## Integration Points

### 1. **Backward Compatibility**

✅ **Maintained**: All existing APIs continue to work

- Existing inventory system remains functional
- Current sales/purchase flows unchanged
- Reports continue to work with quantity-based data

### 2. **Enhanced Functionality**

#### **Sales Processing**

```typescript
// EXISTING: Quantity-based sales
POST /api/v1/sales
{
  "shopId": "shop-uuid",
  "customerId": "customer-uuid",
  "paymentMode": "CASH",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 1299.99
    }
  ]
}

// NEW: Individual item tracking sales
POST /api/v1/product-items/sales/process
{
  "saleData": {
    "shopId": "shop-uuid",
    "customerId": "customer-uuid",
    "paymentMode": "CASH",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 2,
        "unitPrice": 1299.99,
        "specificItemIds": ["item-1", "item-2"] // Optional: sell specific items
      }
    ]
  }
}
```

#### **Purchase Processing**

```typescript
// EXISTING: Quantity-based purchases
POST /api/v1/purchases
{
  "shopId": "shop-uuid",
  "supplierId": "supplier-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 10,
      "unitPrice": 850.00,
      "warehouseId": "warehouse-uuid"
    }
  ]
}

// NEW: Individual item creation on receipt
POST /api/v1/product-items/purchase/{purchaseId}/receive
{
  "items": [
    {
      "purchaseItemId": "purchase-item-uuid",
      "receivedQty": 10,
      "serialNumbers": ["SN001", "SN002", ...] // Optional
    }
  ]
}
```

## New API Endpoints

### **Individual Item Management**

#### 1. Get Items for Product

```http
GET /api/v1/product-items/product/{productId}/items
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: AVAILABLE|RESERVED|SOLD|DAMAGED|RETURNED|DISPOSED
- shopId: string
- warehouseId: string

Response:
{
  "success": true,
  "message": "Product items retrieved successfully",
  "data": {
    "items": [
      {
        "id": "item-uuid",
        "serialNumber": "SN001",
        "barcode": "BC001",
        "status": "AVAILABLE",
        "condition": "NEW",
        "product": { "name": "Wooden Chair", "price": "299.99" },
        "shop": { "name": "Main Store", "location": "Downtown" },
        "createdAt": "2025-01-26T10:00:00Z"
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

#### 2. Get Item Details with History

```http
GET /api/v1/product-items/{itemId}

Response:
{
  "success": true,
  "data": {
    "id": "item-uuid",
    "serialNumber": "SN001",
    "status": "SOLD",
    "condition": "NEW",
    "purchasePrice": 850.00,
    "salePrice": 1299.99,
    "product": { "name": "Wooden Chair" },
    "itemHistory": [
      {
        "action": "SOLD",
        "fromStatus": "AVAILABLE",
        "toStatus": "SOLD",
        "reason": "Sold in invoice INV-2025-001",
        "createdAt": "2025-01-26T14:30:00Z"
      },
      {
        "action": "RECEIVED",
        "toStatus": "AVAILABLE",
        "reason": "Received from purchase PO-001",
        "createdAt": "2025-01-20T09:15:00Z"
      }
    ]
  }
}
```

#### 3. Move Item Between Locations

```http
PATCH /api/v1/product-items/{itemId}/move
Authorization: Bearer <token>
Permissions: INVENTORY_UPDATE (Manager/Admin)

Body:
{
  "toShopId": "shop-uuid",      // OR
  "toWarehouseId": "warehouse-uuid",
  "reason": "Transfer to main store"
}

Response:
{
  "success": true,
  "message": "Item moved successfully",
  "data": {
    "id": "item-uuid",
    "shopId": "new-shop-uuid",
    "updatedAt": "2025-01-26T15:00:00Z"
  }
}
```

#### 4. Update Item Status

```http
PATCH /api/v1/product-items/{itemId}/status
Authorization: Bearer <token>
Permissions: INVENTORY_UPDATE (Manager/Admin)

Body:
{
  "status": "DAMAGED",
  "condition": "POOR",
  "reason": "Customer return - damaged during delivery"
}

Response:
{
  "success": true,
  "message": "Item status updated successfully",
  "data": {
    "id": "item-uuid",
    "status": "DAMAGED",
    "condition": "POOR"
  }
}
```

## Permission Matrix

| Endpoint         | Staff | Manager | Admin | Permission Required |
| ---------------- | ----- | ------- | ----- | ------------------- |
| GET items        | ✅    | ✅      | ✅    | INVENTORY_READ      |
| GET item details | ✅    | ✅      | ✅    | INVENTORY_READ      |
| Move item        | ❌    | ✅      | ✅    | INVENTORY_UPDATE    |
| Update status    | ❌    | ✅      | ✅    | INVENTORY_UPDATE    |
| Receive purchase | ❌    | ✅      | ✅    | PURCHASE_UPDATE     |
| Process sale     | ✅    | ✅      | ✅    | SALES_CREATE        |

## Database Changes Summary

### New Models Added:

1. **ProductItem** - Individual item tracking
2. **ProductItemHistory** - Audit trail for items

### New Enums Added:

1. **ItemStatus** - AVAILABLE, RESERVED, SOLD, DAMAGED, RETURNED, DISPOSED
2. **ItemCondition** - NEW, EXCELLENT, GOOD, FAIR, POOR, DAMAGED

### Relations Added:

- Products ↔ ProductItem (1:many)
- Shop ↔ ProductItem (1:many)
- Warehouses ↔ ProductItem (1:many)
- Purchase ↔ ProductItem (1:many)
- Sales ↔ ProductItem (1:many)

## Migration Strategy

### Phase 1: Database Setup

```bash
# 1. Apply schema changes
npx prisma db push

# 2. Regenerate Prisma client
npx prisma generate
```

### Phase 2: Optional Data Migration

```typescript
// Create individual items for existing inventory
// Run this script if you want to convert existing quantity-based inventory
// to individual items (optional)
```

### Phase 3: Frontend Integration

1. **Product Management**: Show both quantity and individual item count
2. **Sales Interface**: Option to select specific items or auto-select (FIFO)
3. **Inventory Dashboard**: Enhanced view with individual item tracking
4. **Reports**: New reports showing individual item analytics

## Benefits Achieved

### 1. **Enhanced Tracking**

- ✅ Serial number support
- ✅ Barcode generation and tracking
- ✅ Complete item lifecycle history
- ✅ Location tracking (shop/warehouse)
- ✅ Status and condition management

### 2. **Improved Operations**

- ✅ Better return management (track specific returned items)
- ✅ Warranty tracking per individual item
- ✅ Asset management for high-value items
- ✅ Theft/loss tracking with specific item IDs

### 3. **Advanced Analytics**

- ✅ Item-level sales performance
- ✅ Inventory turnover by individual items
- ✅ Damage/return patterns analysis
- ✅ Location-based item performance

### 4. **Compliance & Audit**

- ✅ Complete audit trail for each item
- ✅ Regulatory compliance for tracked items
- ✅ Insurance claims with specific item details
- ✅ Quality control tracking

## Testing Recommendations

### 1. **API Testing**

```bash
# Test individual item creation
POST /api/v1/product-items/purchase/{purchaseId}/receive

# Test item movement
PATCH /api/v1/product-items/{itemId}/move

# Test sales with specific items
POST /api/v1/product-items/sales/process
```

### 2. **Integration Testing**

- Verify existing sales API still works
- Confirm inventory quantities update correctly
- Test backward compatibility with existing reports

### 3. **Performance Testing**

- Test with large numbers of individual items
- Verify pagination performance
- Check database query optimization

## Conclusion

The individual item tracking system has been successfully integrated into your existing furniture shop management system with:

✅ **Full backward compatibility** - existing APIs continue to work  
✅ **Enhanced functionality** - new individual item tracking capabilities  
✅ **Proper security** - RBAC integration with appropriate permissions  
✅ **Scalable design** - efficient database schema and API design  
✅ **Comprehensive audit** - complete item lifecycle tracking

Your system now supports both traditional quantity-based inventory management AND advanced individual item tracking, giving you the flexibility to use either approach based on your business needs.
