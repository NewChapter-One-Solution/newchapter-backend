# Individual Item Tracking Enhancement

## Problem

Currently, the system tracks products as templates and inventory as quantities, but doesn't support tracking individual physical items with unique identifiers (like serial numbers, barcodes, or asset tags).

## Solution: Add ProductItem Model

### 1. New Model: ProductItem

```prisma
model ProductItem {
  id          String   @id @default(uuid())
  productId   String   // Reference to the product template
  serialNumber String? @unique // Optional serial number
  barcode     String?  @unique // Optional barcode
  assetTag    String?  @unique // Optional asset tag

  // Location tracking
  shopId      String?
  warehouseId String?

  // Status tracking
  status      ItemStatus @default(AVAILABLE)
  condition   ItemCondition @default(NEW)

  // Purchase tracking
  purchaseId     String?
  purchaseItemId String?
  purchasePrice  Float?
  purchaseDate   DateTime?

  // Sale tracking
  saleId     String?
  saleItemId String?
  salePrice  Float?
  saleDate   DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  product     Products      @relation(fields: [productId], references: [id])
  shop        Shop?         @relation(fields: [shopId], references: [id])
  warehouse   Warehouses?   @relation(fields: [warehouseId], references: [id])
  purchase    Purchase?     @relation(fields: [purchaseId], references: [id])
  purchaseItem PurchaseItem? @relation(fields: [purchaseItemId], references: [id])
  sale        Sales?        @relation(fields: [saleId], references: [id])
  saleItem    SaleItem?     @relation(fields: [saleItemId], references: [id])

  // History tracking
  itemHistory ProductItemHistory[]
}

enum ItemStatus {
  AVAILABLE     // Available for sale
  RESERVED      // Reserved for a customer
  SOLD          // Sold to customer
  DAMAGED       // Damaged, needs repair
  RETURNED      // Returned by customer
  DISPOSED      // Disposed/written off
}

enum ItemCondition {
  NEW           // Brand new item
  EXCELLENT     // Excellent condition
  GOOD          // Good condition
  FAIR          // Fair condition, minor wear
  POOR          // Poor condition, significant wear
  DAMAGED       // Damaged condition
}

model ProductItemHistory {
  id            String   @id @default(uuid())
  productItemId String
  action        String   // CREATED, MOVED, SOLD, RETURNED, etc.
  fromLocation  String?  // Previous location
  toLocation    String?  // New location
  fromStatus    ItemStatus?
  toStatus      ItemStatus?
  reason        String?
  performedBy   String?  // User ID who performed the action
  createdAt     DateTime @default(now())

  productItem ProductItem @relation(fields: [productItemId], references: [id])
}
```

### 2. Update Existing Models

```prisma
// Add relation to Products
model Products {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to Shop
model Shop {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to Warehouses
model Warehouses {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to Purchase
model Purchase {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to PurchaseItem
model PurchaseItem {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to Sales
model Sales {
  // ... existing fields
  productItems ProductItem[]
}

// Add relation to SaleItem
model SaleItem {
  // ... existing fields
  productItems ProductItem[]
}
```

## Implementation Strategy

### Phase 1: Backward Compatible Implementation

1. Add new models without breaking existing functionality
2. Keep existing inventory system working
3. Gradually migrate to individual item tracking

### Phase 2: Enhanced Features

1. Individual item tracking in purchases
2. Individual item tracking in sales
3. Item history and audit trail
4. Advanced reporting per individual item

## Business Logic Changes

### Purchase Flow Enhancement

```typescript
// When receiving a purchase
async function receivePurchase(purchaseId: string, items: ReceiveItem[]) {
  for (const item of items) {
    // Create individual items for each received quantity
    for (let i = 0; i < item.receivedQty; i++) {
      await prisma.productItem.create({
        data: {
          productId: item.productId,
          purchaseId: purchaseId,
          purchaseItemId: item.id,
          purchasePrice: item.unitPrice,
          purchaseDate: new Date(),
          shopId: purchase.shopId,
          status: "AVAILABLE",
          condition: "NEW",
          serialNumber: generateSerialNumber(), // Optional
          barcode: generateBarcode(), // Optional
        },
      });
    }

    // Update existing inventory (for backward compatibility)
    await updateInventoryQuantity(
      item.productId,
      purchase.shopId,
      item.receivedQty
    );
  }
}
```

### Sales Flow Enhancement

```typescript
// When processing a sale
async function processSale(saleData: SaleData) {
  for (const item of saleData.items) {
    // Find available individual items
    const availableItems = await prisma.productItem.findMany({
      where: {
        productId: item.productId,
        shopId: saleData.shopId,
        status: "AVAILABLE",
      },
      take: item.quantity,
    });

    if (availableItems.length < item.quantity) {
      throw new Error("Insufficient stock");
    }

    // Mark individual items as sold
    for (const productItem of availableItems) {
      await prisma.productItem.update({
        where: { id: productItem.id },
        data: {
          status: "SOLD",
          saleId: sale.id,
          saleItemId: saleItem.id,
          salePrice: item.unitPrice,
          saleDate: new Date(),
        },
      });

      // Create history record
      await prisma.productItemHistory.create({
        data: {
          productItemId: productItem.id,
          action: "SOLD",
          fromStatus: "AVAILABLE",
          toStatus: "SOLD",
          reason: `Sold in invoice ${sale.invoiceNo}`,
          performedBy: userId,
        },
      });
    }

    // Update existing inventory (for backward compatibility)
    await updateInventoryQuantity(
      item.productId,
      saleData.shopId,
      -item.quantity
    );
  }
}
```

## Benefits

1. **Individual Tracking**: Track each physical item throughout its lifecycle
2. **Serial Numbers**: Support for unique identifiers
3. **History Audit**: Complete audit trail for each item
4. **Warranty Tracking**: Track warranty periods per individual item
5. **Return Management**: Easy handling of returns with specific items
6. **Asset Management**: Better asset tracking for high-value items
7. **Backward Compatibility**: Existing quantity-based system continues to work

## Migration Strategy

1. **Add new models** to schema
2. **Run migration** to create new tables
3. **Update controllers** to optionally use individual tracking
4. **Gradually migrate** existing inventory to individual items
5. **Phase out** quantity-based tracking (optional)

## API Enhancements

### New Endpoints

- `GET /api/v1/product-items` - List individual items
- `GET /api/v1/product-items/:id` - Get specific item details
- `GET /api/v1/product-items/:id/history` - Get item history
- `POST /api/v1/product-items/:id/move` - Move item between locations
- `PATCH /api/v1/product-items/:id/status` - Update item status

### Enhanced Existing Endpoints

- Sales endpoints can now specify individual items to sell
- Purchase endpoints can create individual items upon receipt
- Inventory endpoints show both quantity and individual item details
