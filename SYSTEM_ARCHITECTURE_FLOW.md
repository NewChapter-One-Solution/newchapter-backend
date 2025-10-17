# Complete System Architecture & Data Flow

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FURNITURE SHOP MANAGEMENT SYSTEM                         │
│                              Complete Architecture                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ADMIN PANEL   │    │  MANAGER PANEL  │    │  STAFF PANEL    │    │ CUSTOMER PORTAL │
│                 │    │                 │    │                 │    │                 │
│ • User Mgmt     │    │ • Inventory     │    │ • Sales         │    │ • Order Status  │
│ • System Config │    │ • Purchases     │    │ • Customers     │    │ • Invoices      │
│ • Reports       │    │ • Reports       │    │ • Attendance    │    │ • Returns       │
│ • Alerts        │    │ • Staff Mgmt    │    │ • Basic Reports │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌────────────▼───────────────────────▼────────────┐
                    │              API GATEWAY                        │
                    │         JWT Authentication                      │
                    │         Role-Based Access Control              │
                    └────────────────────┬───────────────────────────┘
                                         │
                    ┌────────────────────▼───────────────────────────┐
                    │              BUSINESS LOGIC LAYER              │
                    └────────────────────┬───────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
┌────────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
│ TRADITIONAL     │            │ ENHANCED        │            │ REPORTING &     │
│ OPERATIONS      │            │ OPERATIONS      │            │ ANALYTICS       │
│                 │            │                 │            │                 │
│ • Products      │            │ • ProductItems  │            │ • Dashboards    │
│ • Inventory     │            │ • Item History  │            │ • Sales Reports │
│ • Sales         │            │ • Item Movement │            │ • Inventory     │
│ • Purchases     │            │ • Status Mgmt   │            │ • Performance   │
│ • Customers     │            │ • Serial Track  │            │ • Alerts        │
└─────────────────┘            └─────────────────┘            └─────────────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                    ┌────────────────────▼───────────────────────────┐
                    │              DATABASE LAYER                    │
                    │                PostgreSQL                      │
                    └────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. BUSINESS SETUP FLOW
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │   Admin     │───►│ Warehouses  │───►│   Shops     │───►│ Categories  │
   │   Setup     │    │   Setup     │    │   Setup     │    │   Setup     │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
           │                   │                   │                   │
           └───────────────────┼───────────────────┼───────────────────┘
                               │                   │
                    ┌─────────▼─────────┐ ┌───────▼───────┐
                    │    Suppliers      │ │     Users     │
                    │     Setup         │ │    Setup      │
                    └───────────────────┘ └───────────────┘

2. PRODUCT MANAGEMENT FLOW
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Products   │───►│  Purchase   │───►│ Individual  │
   │ (Templates) │    │   Orders    │    │   Items     │
   └─────────────┘    └─────────────┘    └─────────────┘
           │                   │                   │
           │                   │                   ▼
           │                   │         ┌─────────────┐
           │                   │         │  Inventory  │
           │                   │         │   Update    │
           │                   │         └─────────────┘
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │ Stock Logs  │               │
           │         │   Created   │               │
           │         └─────────────┘               │
           │                                       │
           └───────────────────────────────────────┘

3. SALES PROCESSING FLOW
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Customer   │───►│    Sales    │───►│   Invoice   │
   │ Selection   │    │ Processing  │    │ Generation  │
   └─────────────┘    └─────────────┘    └─────────────┘
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │ Item Status │               │
           │         │   Update    │               │
           │         └─────────────┘               │
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │  Inventory  │               │
           │         │   Update    │               │
           │         └─────────────┘               │
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │   History   │               │
           │         │   Record    │               │
           │         └─────────────┘               │
           │                                       │
           └───────────────────────────────────────┘

4. REPORTING & ANALYTICS FLOW
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │    Sales    │───►│ Inventory   │───►│ Business    │
   │    Data     │    │    Data     │    │ Intelligence│
   └─────────────┘    └─────────────┘    └─────────────┘
           │                   │                   │
           │                   │                   ▼
           │                   │         ┌─────────────┐
           │                   │         │ Dashboards │
           │                   │         │ & Reports   │
           │                   │         └─────────────┘
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │   Stock     │               │
           │         │   Alerts    │               │
           │         └─────────────┘               │
           │                   │                   │
           │                   ▼                   │
           │         ┌─────────────┐               │
           │         │   Email     │               │
           │         │ Notifications│               │
           │         └─────────────┘               │
           │                                       │
           └───────────────────────────────────────┘
```

## Database Relationship Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE RELATIONSHIPS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

Core Entities:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │    Shops    │    │ Warehouses  │    │ Categories  │
│             │    │             │    │             │    │             │
│ • Admin     │───►│ • Downtown  │───►│ • Main WH   │    │ • Living    │
│ • Manager   │    │ • Showroom  │    │ • Storage   │    │ • Dining    │
│ • Staff     │    │             │    │             │    │ • Bedroom   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │         ┌─────────────┐
       │                   │                   │         │  Products   │
       │                   │                   │         │             │
       │                   │                   │         │ • Sofa Set  │
       │                   │                   │         │ • Dining    │
       │                   │                   │         │   Table     │
       │                   │                   │         └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │         ┌─────────────┐
       │                   │                   └────────►│ Inventory   │
       │                   │                             │             │
       │                   │                             │ • Quantities│
       │                   │                             │ • Locations │
       │                   │                             └─────────────┘
       │                   │                                       │
       │                   │                                       ▼
       │                   │                             ┌─────────────┐
       │                   │                             │ProductItems │
       │                   │                             │             │
       │                   │                             │ • Individual│
       │                   │                             │ • Serial #s │
       │                   │                             │ • Status    │
       │                   │                             └─────────────┘
       │                   │                                       │
       │                   │                                       ▼
       │                   │                             ┌─────────────┐
       │                   │                             │   History   │
       │                   │                             │             │
       │                   │                             │ • Actions   │
       │                   │                             │ • Timestamps│
       │                   │                             │ • Reasons   │
       │                   │                             └─────────────┘
       │                   │
       │                   ▼
       │         ┌─────────────┐
       │         │ Attendance  │
       │         │             │
       │         │ • Check-in  │
       │         │ • Check-out │
       │         │ • Hours     │
       │         └─────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Sales     │───►│ SaleItems   │    │ Customers   │    │ Suppliers   │
│             │    │             │    │             │    │             │
│ • Invoices  │    │ • Products  │    │ • Contact   │    │ • Contact   │
│ • Totals    │    │ • Quantities│    │ • History   │    │ • GST Info  │
│ • Payment   │    │ • Prices    │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │         ┌─────────────┐
       │                   │                   │         │ Purchases   │
       │                   │                   │         │             │
       │                   │                   │         │ • Orders    │
       │                   │                   │         │ • Receiving │
       │                   │                   │         │ • Status    │
       │                   │                   │         └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │         ┌─────────────┐
       │                   │                   │         │PurchaseItems│
       │                   │                   │         │             │
       │                   │                   │         │ • Products  │
       │                   │                   │         │ • Quantities│
       │                   │                   │         │ • Prices    │
       │                   │                   │         └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                 ┌─────────────┐
                 │ Stock Logs  │
                 │             │
                 │ • Changes   │
                 │ • Reasons   │
                 │ • Timestamps│
                 └─────────────┘
```
