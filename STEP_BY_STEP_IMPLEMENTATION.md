# Step-by-Step Implementation Guide

## Phase 1: Database Setup

### Step 1: Apply Schema Changes

```bash
# Navigate to your project directory
cd your-furniture-shop-project

# Apply the new schema
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Restart your application
npm run dev
```

### Step 2: Verify Database Changes

Check that new tables were created:

- `ProductItem` table
- `ProductItemHistory` table
- New enum types: `ItemStatus`, `ItemCondition`

---

## Phase 2: Testing Individual Item Tracking

### Step 3: Test Product Creation (Existing)

```http
POST http://localhost:8001/api/v1/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

name: "Test Wooden Chair"
description: "Test chair for individual tracking"
price: "299.99"
categoryId: "YOUR_CATEGORY_ID"
color: "Brown"
size: "18\" W x 20\" D x 32\" H"
material: "Wood"
weight: "15kg"
suppliersId: "YOUR_SUPPLIER_ID"
```

**Expected Result:** Product created successfully
**Note:** This creates the template, no individual items yet

### Step 4: Test Purchase Creation (Existing)

```http
POST http://localhost:8001/api/v1/purchases
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "shopId": "YOUR_SHOP_ID",
  "supplierId": "YOUR_SUPPLIER_ID",
  "items": [
    {
      "productId": "PRODUCT_ID_FROM_STEP_3",
      "quantity": 3,
      "unitPrice": 200.00,
      "warehouseId": "YOUR_WAREHOUSE_ID"
    }
  ]
}
```

**Expected Result:** Purchase created, inventory updated (+3 chairs)
**Note:** Still no individual items - this is the old way

### Step 5: Test Enhanced Purchase Receiving (NEW)

```http
POST http://localhost:8001/api/v1/product-items/purchase/PURCHASE_ID_FROM_STEP_4/receive
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "purchaseItemId": "PURCHASE_ITEM_ID_FROM_STEP_4",
      "receivedQty": 3,
      "serialNumbers": ["CHAIR-001", "CHAIR-002", "CHAIR-003"]
    }
  ]
}
```

**Expected Result:** 3 individual ProductItem records created
**What to Check:**

- Each item has unique ID
- Serial numbers assigned correctly
- Status = "AVAILABLE"
- Condition = "NEW"
- Purchase details recorded

### Step 6: Test Viewing Individual Items (NEW)

```http
GET http://localhost:8001/api/v1/product-items/product/PRODUCT_ID_FROM_STEP_3/items
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Result:** List of 3 individual chairs
**What to Check:**

- All 3 items shown
- Each has unique serial number
- All have status "AVAILABLE"
- Product details included

### Step 7: Test Individual Item Details (NEW)

```http
GET http://localhost:8001/api/v1/product-items/ITEM_ID_FROM_STEP_6
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Result:** Detailed item info with history
**What to Check:**

- Item details complete
- History shows "RECEIVED" event
- Purchase information included

### Step 8: Test Item Movement (NEW)

```http
PATCH http://localhost:8001/api/v1/product-items/ITEM_ID_FROM_STEP_6/move
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "toShopId": "DIFFERENT_SHOP_ID",
  "reason": "Move to showroom for display"
}
```

**Expected Result:** Item location updated
**What to Check:**

- Item shopId changed
- History record created for movement
- Reason recorded

### Step 9: Test Enhanced Sales (NEW)

```http
POST http://localhost:8001/api/v1/product-items/sales/process
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "saleData": {
    "shopId": "YOUR_SHOP_ID",
    "customerId": "YOUR_CUSTOMER_ID",
    "paymentMode": "CASH",
    "items": [
      {
        "productId": "PRODUCT_ID_FROM_STEP_3",
        "quantity": 1,
        "unitPrice": 299.99,
        "specificItemIds": ["SPECIFIC_ITEM_ID"]
      }
    ]
  }
}
```

**Expected Result:** Sale created with specific item tracking
**What to Check:**

- Sale record created
- Specific item marked as "SOLD"
- Item linked to sale
- History record created
- Inventory quantity decreased

### Step 10: Test Auto-Selection Sales (NEW)

```http
POST http://localhost:8001/api/v1/product-items/sales/process
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "saleData": {
    "shopId": "YOUR_SHOP_ID",
    "customerId": "YOUR_CUSTOMER_ID",
    "paymentMode": "CARD",
    "items": [
      {
        "productId": "PRODUCT_ID_FROM_STEP_3",
        "quantity": 1,
        "unitPrice": 299.99
      }
    ]
  }
}
```

**Expected Result:** Sale created with system-selected item (FIFO)
**What to Check:**

- System automatically selected oldest available item
- Item marked as "SOLD"
- No need to specify which item

### Step 11: Test Status Update (NEW)

```http
PATCH http://localhost:8001/api/v1/product-items/SOLD_ITEM_ID/status
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "status": "RETURNED",
  "condition": "DAMAGED",
  "reason": "Customer return - leg broken during delivery"
}
```

**Expected Result:** Item status updated
**What to Check:**

- Status changed to "RETURNED"
- Condition changed to "DAMAGED"
- History record created with reason

### Step 12: Test Complete History (NEW)

```http
GET http://localhost:8001/api/v1/product-items/ITEM_ID_FROM_STEP_11
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Result:** Complete item lifecycle
**What to Check:**

- Multiple history entries
- RECEIVED → SOLD → RETURNED progression
- All actions timestamped
- Reasons recorded

### Step 13: Verify Backward Compatibility

```http
POST http://localhost:8001/api/v1/sales
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "shopId": "YOUR_SHOP_ID",
  "customerId": "YOUR_CUSTOMER_ID",
  "paymentMode": "CASH",
  "items": [
    {
      "productId": "PRODUCT_ID_FROM_STEP_3",
      "quantity": 1,
      "unitPrice": 299.99
    }
  ]
}
```

**Expected Result:** Traditional sale still works
**What to Check:**

- Sale created successfully
- Inventory decreased
- No individual item tracking (as expected)

---

## Phase 3: Integration Testing

### Step 14: Check Inventory Consistency

```http
GET http://localhost:8001/api/v1/inventory/YOUR_SHOP_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

**What to Verify:**

- Inventory quantities match individual item counts
- Available items = items with status "AVAILABLE"
- Sold items not counted in available inventory

### Step 15: Test Permission System

Try accessing endpoints with different user roles:

**Staff User:**

- ✅ Should access: GET endpoints (view items)
- ✅ Should access: POST sales (create sales)
- ❌ Should NOT access: PATCH move/status (manager only)

**Manager User:**

- ✅ Should access: All endpoints
- ✅ Should access: Move items, update status
- ✅ Should access: Receive purchases

### Step 16: Performance Testing

Create multiple items and test:

- Pagination works correctly
- Filtering by status/location works
- Large item lists load efficiently

---

## Phase 4: Production Deployment

### Step 17: Backup Database

```bash
# Create backup before applying changes
pg_dump your_database > backup_before_individual_tracking.sql
```

### Step 18: Apply Changes to Production

```bash
# In production environment
npx prisma db push
npx prisma generate
```

### Step 19: Monitor and Validate

- Check application logs for errors
- Verify all existing functionality works
- Test new endpoints in production
- Monitor database performance

---

## Troubleshooting Common Issues

### Issue 1: Permission Denied

**Problem:** Getting 403 errors on new endpoints
**Solution:** Check user role and permissions in JWT token

### Issue 2: Item Not Found

**Problem:** Cannot find ProductItem records
**Solution:** Ensure you're using enhanced purchase receiving to create items

### Issue 3: Inventory Mismatch

**Problem:** Inventory quantity doesn't match individual items
**Solution:** Use both traditional and enhanced flows consistently

### Issue 4: Database Errors

**Problem:** Prisma client errors
**Solution:** Regenerate client after schema changes

---

## Success Criteria

✅ **Database Setup Complete**

- New tables created successfully
- Prisma client regenerated
- Application starts without errors

✅ **Individual Item Tracking Works**

- Can create individual items from purchases
- Can view and filter items
- Can move items between locations
- Can update item status

✅ **Enhanced Sales Work**

- Can sell specific items
- Can use auto-selection (FIFO)
- History tracking works correctly

✅ **Backward Compatibility Maintained**

- Existing sales API still works
- Existing inventory API still works
- Existing reports still function

✅ **Security Properly Configured**

- Permissions work correctly
- Different roles have appropriate access
- JWT authentication required

When all these criteria are met, your individual item tracking system is successfully implemented and ready for production use!
