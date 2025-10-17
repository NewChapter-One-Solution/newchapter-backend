# Visual Flow Diagram: Individual Item Tracking

## Complete Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FURNITURE SHOP ITEM LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────────────────┘

1. PRODUCT CREATION (Template)
   ┌─────────────────┐
   │ Create Product  │ ──► "Premium Leather Sofa" (Template)
   │ Template        │     - Name, Price, Description
   └─────────────────┘     - Category, Supplier Info

2. PURCHASE ORDER
   ┌─────────────────┐
   │ Create Purchase │ ──► Order 5 Sofas from Supplier
   │ Order           │     - Quantity: 5
   └─────────────────┘     - Unit Price: $1800

3. RECEIVING GOODS (NEW ENHANCED FLOW)
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Receive Items   │ ──► │ Creates 5 Individual ProductItems:     │
   │ with Tracking   │     │ • item-sofa-001 (SN: SOFA-2025-001)   │
   └─────────────────┘     │ • item-sofa-002 (SN: SOFA-2025-002)   │
                           │ • item-sofa-003 (SN: SOFA-2025-003)   │
                           │ • item-sofa-004 (SN: SOFA-2025-004)   │
                           │ • item-sofa-005 (SN: SOFA-2025-005)   │
                           │ Status: AVAILABLE, Condition: NEW      │
                           └─────────────────────────────────────────┘

4. INVENTORY STATUS
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Current Stock   │ ──► │ Traditional View: 5 Sofas Available    │
   │                 │     │ Individual View: 5 Specific Items      │
   └─────────────────┘     │ • Each with unique ID & serial number  │
                           └─────────────────────────────────────────┘

5. SALES PROCESSING (Two Options)

   Option A: Traditional Sales (Still Works)
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Quantity-Based  │ ──► │ Sell 1 Sofa                           │
   │ Sale            │     │ • Reduces quantity: 5 → 4             │
   └─────────────────┘     │ • No specific item tracking            │
                           └─────────────────────────────────────────┘

   Option B: Individual Item Sales (NEW)
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Item-Specific   │ ──► │ Sell Specific Sofa: item-sofa-002      │
   │ Sale            │     │ • Marks item-sofa-002 as SOLD         │
   └─────────────────┘     │ • Links to customer & invoice          │
                           │ • Creates history record               │
                           └─────────────────────────────────────────┘

6. ITEM MOVEMENT
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Move Item       │ ──► │ Move item-sofa-004 to Showroom         │
   │ Between Stores  │     │ • Updates location                     │
   └─────────────────┘     │ • Records movement history             │
                           └─────────────────────────────────────────┘

7. RETURNS & DAMAGES
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Handle Return   │ ──► │ Customer returns item-sofa-002         │
   │                 │     │ • Status: SOLD → RETURNED              │
   └─────────────────┘     │ • Condition: NEW → DAMAGED             │
                           │ • Reason: "Scratched during delivery"  │
                           └─────────────────────────────────────────┘

8. AUDIT TRAIL
   ┌─────────────────┐     ┌─────────────────────────────────────────┐
   │ Complete        │ ──► │ item-sofa-002 History:                 │
   │ History         │     │ 1. RECEIVED (Jan 20, 9:15 AM)         │
   └─────────────────┘     │ 2. SOLD (Jan 26, 2:30 PM)             │
                           │ 3. RETURNED (Jan 26, 4:00 PM)         │
                           │ 4. DAMAGED (Jan 26, 4:00 PM)          │
                           └─────────────────────────────────────────┘
```

## Data Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA RELATIONSHIPS                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Products (Templates)                    ProductItems (Individual Units)
┌─────────────────┐                    ┌─────────────────────────────────┐
│ product-sofa-001│ ──────────────────► │ item-sofa-001 (SN: SOFA-2025-001) │
│ "Premium Sofa"  │                    │ item-sofa-002 (SN: SOFA-2025-002) │
│ Price: $2499.99 │                    │ item-sofa-003 (SN: SOFA-2025-003) │
│ Category: Living│                    │ item-sofa-004 (SN: SOFA-2025-004) │
└─────────────────┘                    │ item-sofa-005 (SN: SOFA-2025-005) │
                                       └─────────────────────────────────┘
                                                        │
                                                        ▼
                                       ┌─────────────────────────────────┐
                                       │ ProductItemHistory              │
                                       │ • RECEIVED events               │
                                       │ • MOVED events                  │
                                       │ • SOLD events                   │
                                       │ • STATUS_UPDATED events         │
                                       └─────────────────────────────────┘

Inventory (Quantities)                 Sales (Transactions)
┌─────────────────┐                    ┌─────────────────────────────────┐
│ Shop: Main Store│ ◄──────────────────┤ sale-001: item-sofa-001 SOLD    │
│ Product: Sofa   │                    │ sale-002: item-sofa-002 SOLD    │
│ Quantity: 3     │                    │ sale-003: item-sofa-003 SOLD    │
└─────────────────┘                    └─────────────────────────────────┘
```

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ITEM STATUS FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

Item Creation
     │
     ▼
┌─────────────┐    Purchase Received    ┌─────────────┐
│   CREATED   │ ─────────────────────► │  AVAILABLE  │
└─────────────┘                        └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Multiple Paths: │
                                    └─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │    SOLD     │           │  RESERVED   │           │   DAMAGED   │
            └─────────────┘           └─────────────┘           └─────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │  RETURNED   │           │  AVAILABLE  │           │  DISPOSED   │
            └─────────────┘           └─────────────┘           └─────────────┘

Status Transitions:
• AVAILABLE → RESERVED (Customer holds item)
• RESERVED → AVAILABLE (Customer cancels)
• AVAILABLE → SOLD (Item purchased)
• SOLD → RETURNED (Customer returns)
• ANY → DAMAGED (Item gets damaged)
• DAMAGED → DISPOSED (Item written off)
```
