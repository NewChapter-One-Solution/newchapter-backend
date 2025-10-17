# Migration Guide: Adding Individual Item Tracking

## Step 1: Database Migration

1. **Generate and run the migration:**

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-individual-item-tracking
```

2. **Regenerate Prisma client:**

```bash
npx prisma generate
```

## Step 2: Optional Data Migration

If you want to create individual items for existing inventory, run this script:

```typescript
// scripts/migrateExistingInventory.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateExistingInventory() {
  console.log("Starting inventory migration...");

  const inventoryItems = await prisma.inventory.findMany({
    include: {
      product: true,
      shop: true,
    },
  });

  for (const inventory of inventoryItems) {
    console.log(
      `Migrating ${inventory.quantity} items of ${inventory.product.name}`
    );

    // Create individual items for existing inventory
    for (let i = 0; i < inventory.quantity; i++) {
      await prisma.productItem.create({
        data: {
          productId: inventory.productId,
          shopId: inventory.shopId,
          warehouseId: inventory.warehouseId,
          status: "AVAILABLE",
          condition: "NEW",
          barcode: `MIGRATED-${inventory.productId}-${Date.now()}-${i}`,
        },
      });
    }
  }

  console.log("Migration completed!");
}

migrateExistingInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Step 3: Update Your Application

1. **Install the new routes** (already done above)
2. **Update your frontend** to use the new endpoints
3. **Test the new functionality**

## Step 4: API Usage Examples

### 1. Get Individual Items for a Product

```bash
GET /api/v1/product-items/product/{productId}/items?page=1&limit=10&status=AVAILABLE
```

### 2. Get Item Details with History

```bash
GET /api/v1/product-items/{itemId}
```

### 3. Move Item Between Locations

```bash
PATCH /api/v1/product-items/{itemId}/move
Content-Type: application/json

{
  "toShopId": "shop-uuid",
  "reason": "Transfer to main store"
}
```

### 4. Enhanced Purchase Receiving

```bash
POST /api/v1/product-items/purchase/{purchaseId}/receive
Content-Type: application/json

{
  "items": [
    {
      "purchaseItemId": "purchase-item-uuid",
      "receivedQty": 5,
      "serialNumbers": ["SN001", "SN002", "SN003", "SN004", "SN005"]
    }
  ]
}
```

### 5. Enhanced Sales Processing

```bash
POST /api/v1/product-items/sales/process
Content-Type: application/json

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
        "specificItemIds": ["item-uuid-1", "item-uuid-2"]
      }
    ]
  }
}
```

## Benefits of This Approach

1. **Backward Compatibility**: Your existing inventory system continues to work
2. **Gradual Migration**: You can migrate products one by one
3. **Enhanced Tracking**: Full lifecycle tracking of individual items
4. **Flexible Sales**: Sell specific items or let the system choose (FIFO)
5. **Audit Trail**: Complete history of each item's movements and status changes
6. **Serial Number Support**: Track items with unique identifiers
7. **Return Management**: Easy handling of returns with specific item tracking

## Frontend Integration Tips

1. **Product List**: Show both total quantity and individual item count
2. **Sales Interface**: Allow staff to select specific items or use auto-selection
3. **Inventory Management**: Show individual items with their status and location
4. **Reports**: Enhanced reporting with individual item analytics
5. **Barcode Scanning**: Integrate barcode scanning for quick item identification

## Performance Considerations

1. **Indexing**: The schema includes proper indexes for performance
2. **Pagination**: All list endpoints support pagination
3. **Selective Loading**: Use Prisma's `include` and `select` for optimal queries
4. **Caching**: Consider caching frequently accessed item data
5. **Batch Operations**: Process multiple items in batches for better performance
