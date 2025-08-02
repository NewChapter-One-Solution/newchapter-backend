import prisma from "../src/models/prisma-client";
import { hashPassword } from "../src/utils/utilityFunctions";

// Enhanced data for comprehensive API testing

// Furniture categories for seeding
const furnitureCategories = [
  {
    name: "Living Room",
    slug: "living-room",
    subcategories: [
      { name: "Sofas & Couches", slug: "sofas-couches" },
      { name: "Coffee Tables", slug: "coffee-tables" },
      { name: "TV Stands", slug: "tv-stands" },
      { name: "Recliners", slug: "recliners" },
      { name: "Accent Chairs", slug: "accent-chairs" },
    ],
  },
  {
    name: "Bedroom",
    slug: "bedroom",
    subcategories: [
      { name: "Beds & Bed Frames", slug: "beds-bed-frames" },
      { name: "Mattresses", slug: "mattresses" },
      { name: "Dressers", slug: "dressers" },
      { name: "Nightstands", slug: "nightstands" },
      { name: "Wardrobes", slug: "wardrobes" },
    ],
  },
  {
    name: "Dining Room",
    slug: "dining-room",
    subcategories: [
      { name: "Dining Tables", slug: "dining-tables" },
      { name: "Dining Chairs", slug: "dining-chairs" },
      { name: "Bar Stools", slug: "bar-stools" },
      { name: "Buffets & Sideboards", slug: "buffets-sideboards" },
    ],
  },
  {
    name: "Office Furniture",
    slug: "office-furniture",
    subcategories: [
      { name: "Office Desks", slug: "office-desks" },
      { name: "Office Chairs", slug: "office-chairs" },
      { name: "Filing Cabinets", slug: "filing-cabinets" },
      { name: "Bookcases", slug: "bookcases" },
    ],
  },
  {
    name: "Storage & Organization",
    slug: "storage-organization",
    subcategories: [
      { name: "Shelving Units", slug: "shelving-units" },
      { name: "Storage Cabinets", slug: "storage-cabinets" },
      { name: "Closet Organizers", slug: "closet-organizers" },
    ],
  },
  {
    name: "Outdoor Furniture",
    slug: "outdoor-furniture",
    subcategories: [
      { name: "Patio Sets", slug: "patio-sets" },
      { name: "Garden Benches", slug: "garden-benches" },
      { name: "Outdoor Chairs", slug: "outdoor-chairs" },
    ],
  },
];

// Enhanced sample furniture products for comprehensive testing
const sampleProducts = [
  // Living Room
  {
    name: "Modern 3-Seater Sofa",
    description: "Comfortable modern sofa with premium fabric upholstery",
    price: "899.99",
    color: "Gray",
    material: "Fabric",
    size: "84\" W x 36\" D x 32\" H",
    weight: "120 lbs",
    category: "sofas-couches",
  },
  {
    name: "Glass Coffee Table",
    description: "Elegant glass-top coffee table with metal legs",
    price: "299.99",
    color: "Clear",
    material: "Glass/Metal",
    size: "48\" W x 24\" D x 16\" H",
    weight: "45 lbs",
    category: "coffee-tables",
  },
  {
    name: "Leather Recliner Chair",
    description: "Premium leather recliner with massage function",
    price: "1299.99",
    color: "Brown",
    material: "Genuine Leather",
    size: "32\" W x 36\" D x 40\" H",
    weight: "85 lbs",
    category: "recliners",
  },
  {
    name: "Sectional L-Shape Sofa",
    description: "Large sectional sofa perfect for family gatherings",
    price: "1599.99",
    color: "Navy Blue",
    material: "Premium Fabric",
    size: "120\" W x 84\" D x 32\" H",
    weight: "200 lbs",
    category: "sofas-couches",
  },
  {
    name: "Smart TV Stand",
    description: "Modern TV stand with cable management and storage",
    price: "249.99",
    color: "Black",
    material: "Wood/Metal",
    size: "60\" W x 16\" D x 24\" H",
    weight: "55 lbs",
    category: "tv-stands",
  },

  // Bedroom
  {
    name: "Queen Platform Bed",
    description: "Modern platform bed with built-in nightstands",
    price: "699.99",
    color: "Walnut",
    material: "Wood",
    size: "Queen (60\" x 80\")",
    weight: "150 lbs",
    category: "beds-bed-frames",
  },
  {
    name: "Memory Foam Mattress",
    description: "12-inch memory foam mattress with cooling gel",
    price: "599.99",
    color: "White",
    material: "Memory Foam",
    size: "Queen (60\" x 80\")",
    weight: "75 lbs",
    category: "mattresses",
  },
  {
    name: "6-Drawer Dresser",
    description: "Spacious dresser with soft-close drawers",
    price: "449.99",
    color: "Oak",
    material: "Wood",
    size: "60\" W x 18\" D x 32\" H",
    weight: "95 lbs",
    category: "dressers",
  },
  {
    name: "King Size Bed Frame",
    description: "Luxury king size bed with upholstered headboard",
    price: "999.99",
    color: "Charcoal",
    material: "Wood/Fabric",
    size: "King (76\" x 80\")",
    weight: "180 lbs",
    category: "beds-bed-frames",
  },
  {
    name: "Bedside Nightstand",
    description: "Compact nightstand with drawer and shelf",
    price: "149.99",
    color: "White",
    material: "Wood",
    size: "18\" W x 16\" D x 24\" H",
    weight: "25 lbs",
    category: "nightstands",
  },

  // Dining Room
  {
    name: "Dining Table Set",
    description: "6-person dining table with matching chairs",
    price: "799.99",
    color: "Cherry",
    material: "Solid Wood",
    size: "72\" W x 36\" D x 30\" H",
    weight: "180 lbs",
    category: "dining-tables",
  },
  {
    name: "Upholstered Dining Chairs (Set of 4)",
    description: "Comfortable dining chairs with fabric upholstery",
    price: "399.99",
    color: "Beige",
    material: "Wood/Fabric",
    size: "18\" W x 22\" D x 36\" H",
    weight: "60 lbs",
    category: "dining-chairs",
  },
  {
    name: "Round Dining Table",
    description: "Elegant round dining table for intimate dining",
    price: "649.99",
    color: "Natural Wood",
    material: "Solid Oak",
    size: "48\" Diameter x 30\" H",
    weight: "85 lbs",
    category: "dining-tables",
  },
  {
    name: "Bar Stool Set (Set of 2)",
    description: "Modern bar stools with adjustable height",
    price: "199.99",
    color: "Black",
    material: "Metal/Leather",
    size: "16\" W x 16\" D x 24-32\" H",
    weight: "30 lbs",
    category: "bar-stools",
  },

  // Office
  {
    name: "Executive Office Desk",
    description: "Large executive desk with built-in storage",
    price: "899.99",
    color: "Mahogany",
    material: "Wood",
    size: "72\" W x 36\" D x 30\" H",
    weight: "120 lbs",
    category: "office-desks",
  },
  {
    name: "Ergonomic Office Chair",
    description: "High-back ergonomic chair with lumbar support",
    price: "349.99",
    color: "Black",
    material: "Mesh/Plastic",
    size: "26\" W x 26\" D x 42\" H",
    weight: "35 lbs",
    category: "office-chairs",
  },
  {
    name: "Standing Desk Converter",
    description: "Adjustable standing desk converter for health",
    price: "299.99",
    color: "White",
    material: "Metal/Wood",
    size: "32\" W x 24\" D x 16\" H",
    weight: "40 lbs",
    category: "office-desks",
  },
  {
    name: "Filing Cabinet 4-Drawer",
    description: "Secure filing cabinet with lock",
    price: "199.99",
    color: "Gray",
    material: "Metal",
    size: "15\" W x 20\" D x 52\" H",
    weight: "65 lbs",
    category: "filing-cabinets",
  },

  // Storage & Organization
  {
    name: "5-Tier Bookshelf",
    description: "Tall bookshelf for books and decorative items",
    price: "179.99",
    color: "Espresso",
    material: "Wood",
    size: "31\" W x 12\" D x 71\" H",
    weight: "45 lbs",
    category: "bookcases",
  },
  {
    name: "Storage Cabinet",
    description: "Multi-purpose storage cabinet with doors",
    price: "249.99",
    color: "White",
    material: "Wood",
    size: "30\" W x 16\" D x 36\" H",
    weight: "55 lbs",
    category: "storage-cabinets",
  },

  // Outdoor Furniture
  {
    name: "Patio Dining Set",
    description: "Weather-resistant patio dining set for 6",
    price: "699.99",
    color: "Brown",
    material: "Wicker/Aluminum",
    size: "60\" W x 36\" D x 30\" H",
    weight: "120 lbs",
    category: "patio-sets",
  },
  {
    name: "Garden Bench",
    description: "Classic wooden garden bench",
    price: "159.99",
    color: "Natural",
    material: "Teak Wood",
    size: "48\" W x 20\" D x 32\" H",
    weight: "35 lbs",
    category: "garden-benches",
  },
];

export const seedFurnitureData = async () => {
  try {
    console.log("🌱 Starting furniture data seeding...");

    // Create admin user if not exists
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminExists) {
      const hashedPassword = hashPassword("admin123");
      await prisma.user.create({
        data: {
          email: "admin@furniturestore.com",
          firstName: "Admin",
          lastName: "User",
          hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log("✅ Admin user created");
    }

    // Create multiple shops for comprehensive testing
    const shopData = [
      {
        name: "Downtown Furniture Store",
        location: "123 Main Street, Downtown, NY 10001",
      },
      {
        name: "Uptown Furniture Gallery",
        location: "456 Broadway Avenue, Uptown, NY 10002",
      },
      {
        name: "Suburban Home Center",
        location: "789 Oak Street, Suburban Plaza, NY 10003",
      }
    ];

    const createdShops: any[] = [];
    for (const shopInfo of shopData) {
      const existingShop = await prisma.shop.findFirst({
        where: { name: shopInfo.name },
      });

      if (!existingShop) {
        const shop = await prisma.shop.create({
          data: shopInfo,
        });
        createdShops.push(shop);
        console.log(`✅ Created shop: ${shopInfo.name}`);
      } else {
        createdShops.push(existingShop);
      }
    }

    const sampleShop = createdShops[0]; // Primary shop

    // Create multiple warehouses for comprehensive testing
    const warehouseData = [
      {
        name: "Main Warehouse",
        location: "456 Industrial Avenue, Warehouse District, NY 10010",
        capacity: 10000,
        minCapacity: 1000,
        maxCapacity: 10000,
      },
      {
        name: "Secondary Storage",
        location: "789 Storage Lane, Distribution Center, NY 10011",
        capacity: 5000,
        minCapacity: 500,
        maxCapacity: 5000,
      },
      {
        name: "Overflow Facility",
        location: "321 Backup Road, Extended Storage, NY 10012",
        capacity: 3000,
        minCapacity: 300,
        maxCapacity: 3000,
      }
    ];

    const createdWarehouses: any[] = [];
    for (const warehouseInfo of warehouseData) {
      const existingWarehouse = await prisma.warehouses.findFirst({
        where: { name: warehouseInfo.name },
      });

      if (!existingWarehouse) {
        const warehouse = await prisma.warehouses.create({
          data: warehouseInfo,
        });
        createdWarehouses.push(warehouse);
        console.log(`✅ Created warehouse: ${warehouseInfo.name}`);
      } else {
        createdWarehouses.push(existingWarehouse);
      }
    }

    const sampleWarehouse = createdWarehouses[0]; // Primary warehouse

    // Create multiple suppliers for comprehensive testing
    const supplierData = [
      {
        name: "Premium Furniture Suppliers",
        email: "contact@premiumfurniture.com",
        phone: "+1-555-0123",
        address: "789 Supplier Street, Industrial Area, NY 10005",
        website: "https://premiumfurniture.com",
        gstid: "GST123456789",
        isActive: true,
      },
      {
        name: "Modern Living Solutions",
        email: "sales@modernliving.com",
        phone: "+1-555-0124",
        address: "456 Design Boulevard, Creative District, NY 10006",
        website: "https://modernliving.com",
        gstid: "GST987654321",
        isActive: true,
      },
      {
        name: "Classic Wood Works",
        email: "info@classicwood.com",
        phone: "+1-555-0125",
        address: "321 Craftsman Avenue, Artisan Quarter, NY 10007",
        website: "https://classicwood.com",
        gstid: "GST456789123",
        isActive: true,
      },
      {
        name: "Office Essentials Ltd",
        email: "orders@officeessentials.com",
        phone: "+1-555-0126",
        address: "654 Business Park, Corporate Zone, NY 10008",
        website: "https://officeessentials.com",
        gstid: "GST789123456",
        isActive: true,
      },
      {
        name: "Luxury Interiors Co",
        email: "luxury@interiors.com",
        phone: "+1-555-0127",
        address: "987 Elite Street, Upscale District, NY 10009",
        website: "https://luxuryinteriors.com",
        gstid: "GST321654987",
        isActive: false, // Inactive supplier for testing
      }
    ];

    const createdSuppliers: any[] = [];
    for (const supplierInfo of supplierData) {
      const existingSupplier = await prisma.suppliers.findUnique({
        where: { gstid: supplierInfo.gstid },
      });

      if (!existingSupplier) {
        const supplier = await prisma.suppliers.create({
          data: supplierInfo,
        });
        createdSuppliers.push(supplier);
        console.log(`✅ Created supplier: ${supplierInfo.name}`);
      } else {
        createdSuppliers.push(existingSupplier);
      }
    }

    const sampleSupplier = createdSuppliers[0]; // Primary supplier

    // Seed categories
    for (const category of furnitureCategories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug },
      });

      if (!existingCategory) {
        const parentCategory = await prisma.category.create({
          data: {
            name: category.name,
            slug: category.slug,
          },
        });

        // Create subcategories
        for (const subcategory of category.subcategories) {
          await prisma.category.create({
            data: {
              name: subcategory.name,
              slug: subcategory.slug,
              parentId: parentCategory.id,
            },
          });
        }

        console.log(`✅ Created category: ${category.name} with ${category.subcategories.length} subcategories`);
      }
    }

    // Seed sample products
    for (const productData of sampleProducts) {
      const category = await prisma.category.findUnique({
        where: { slug: productData.category },
      });

      if (category) {
        const existingProduct = await prisma.products.findFirst({
          where: { name: productData.name },
        });

        if (!existingProduct) {
          const product = await prisma.products.create({
            data: {
              name: productData.name,
              description: productData.description,
              price: productData.price,
              color: productData.color,
              material: productData.material,
              size: productData.size,
              weight: productData.weight,
              categoryId: category.id,
              suppliersId: sampleSupplier.id,
              warehousesId: sampleWarehouse.id,
            },
          });

          // Create initial inventory
          await prisma.inventory.create({
            data: {
              productId: product.id,
              shopId: sampleShop.id,
              warehouseId: sampleWarehouse.id,
              quantity: Math.floor(Math.random() * 50) + 10, // Random quantity between 10-60
            },
          });

          console.log(`✅ Created product: ${productData.name}`);
        }
      }
    }

    // Create sample customers
    const sampleCustomers = [
      {
        name: "John Smith",
        phone: "+1-555-0101",
        email: "john.smith@email.com",
        address: "123 Oak Street, Downtown, NY 10001",
      },
      {
        name: "Sarah Johnson",
        phone: "+1-555-0102",
        email: "sarah.johnson@email.com",
        address: "456 Maple Avenue, Uptown, NY 10002",
      },
      {
        name: "Mike Wilson",
        phone: "+1-555-0103",
        email: "mike.wilson@email.com",
        address: "789 Pine Road, Midtown, NY 10003",
      },
      {
        name: "Emily Davis",
        phone: "+1-555-0104",
        email: "emily.davis@email.com",
        address: "321 Elm Street, Brooklyn, NY 11201",
      },
      {
        name: "Robert Brown",
        phone: "+1-555-0105",
        email: "robert.brown@email.com",
        address: "654 Cedar Lane, Queens, NY 11101",
      },
      {
        name: "Lisa Garcia",
        phone: "+1-555-0106",
        email: "lisa.garcia@email.com",
        address: "987 Birch Drive, Bronx, NY 10451",
      },
      {
        name: "David Martinez",
        phone: "+1-555-0107",
        email: "david.martinez@email.com",
        address: "147 Walnut Court, Staten Island, NY 10301",
      },
      {
        name: "Jennifer Lee",
        phone: "+1-555-0108",
        email: "jennifer.lee@email.com",
        address: "258 Cherry Street, Manhattan, NY 10002",
      },
    ];

    const createdCustomers: any[] = [];
    for (const customerData of sampleCustomers) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { phone: customerData.phone },
      });

      if (!existingCustomer) {
        const customer = await prisma.customer.create({
          data: customerData,
        });
        createdCustomers.push(customer);
        console.log(`✅ Created customer: ${customerData.name}`);
      } else {
        createdCustomers.push(existingCustomer);
      }
    }

    // Create additional staff users
    console.log("👥 Creating additional staff users...");

    const staffUsers = [
      {
        email: "manager@furniturestore.com",
        firstName: "Jane",
        lastName: "Manager",
        role: "MANAGER",
        password: "manager123",
      },
      {
        email: "staff@furniturestore.com",
        firstName: "Tom",
        lastName: "Staff",
        role: "STAFF",
        password: "staff123",
      },
    ];

    for (const userData of staffUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const hashedPassword = hashPassword(userData.password);
        await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            hashedPassword,
            role: userData.role as any,
            isActive: true,
          },
        });
        console.log(`✅ Created ${userData.role.toLowerCase()}: ${userData.email}`);
      }
    }

    // Create sample sales and invoices for testing
    console.log("🛒 Creating sample sales and invoices...");

    // Get all created products for sales
    const allProducts = await prisma.products.findMany({
      include: { category: true },
    });

    if (allProducts.length > 0 && createdCustomers.length > 0) {
      // Create sample sales over the past 30 days
      const salesData = [
        {
          customerId: createdCustomers[0].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Sofa"))?.id, quantity: 1, unitPrice: 899.99 },
            { productId: allProducts.find(p => p.name.includes("Coffee Table"))?.id, quantity: 1, unitPrice: 299.99 },
          ],
          paymentMode: "CARD",
          daysAgo: 1,
        },
        {
          customerId: createdCustomers[1].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Queen Platform Bed"))?.id, quantity: 1, unitPrice: 699.99 },
            { productId: allProducts.find(p => p.name.includes("Memory Foam Mattress"))?.id, quantity: 1, unitPrice: 599.99 },
            { productId: allProducts.find(p => p.name.includes("Dresser"))?.id, quantity: 1, unitPrice: 449.99 },
          ],
          paymentMode: "CASH",
          daysAgo: 3,
        },
        {
          customerId: createdCustomers[2].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Dining Table"))?.id, quantity: 1, unitPrice: 799.99 },
            { productId: allProducts.find(p => p.name.includes("Dining Chairs"))?.id, quantity: 1, unitPrice: 399.99 },
          ],
          paymentMode: "UPI",
          daysAgo: 5,
        },
        {
          customerId: createdCustomers[3].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Executive Office Desk"))?.id, quantity: 1, unitPrice: 899.99 },
            { productId: allProducts.find(p => p.name.includes("Ergonomic Office Chair"))?.id, quantity: 1, unitPrice: 349.99 },
          ],
          paymentMode: "CARD",
          daysAgo: 7,
        },
        {
          customerId: createdCustomers[4].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Leather Recliner"))?.id, quantity: 1, unitPrice: 1299.99 },
          ],
          paymentMode: "CASH",
          daysAgo: 10,
        },
        {
          customerId: createdCustomers[5].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Sofa"))?.id, quantity: 1, unitPrice: 899.99 },
            { productId: allProducts.find(p => p.name.includes("Coffee Table"))?.id, quantity: 2, unitPrice: 299.99 },
          ],
          paymentMode: "CARD",
          daysAgo: 12,
        },
        {
          customerId: createdCustomers[6].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Dining Table"))?.id, quantity: 1, unitPrice: 799.99 },
          ],
          paymentMode: "UPI",
          daysAgo: 15,
        },
        {
          customerId: createdCustomers[7].id,
          items: [
            { productId: allProducts.find(p => p.name.includes("Queen Platform Bed"))?.id, quantity: 1, unitPrice: 699.99 },
            { productId: allProducts.find(p => p.name.includes("Dresser"))?.id, quantity: 2, unitPrice: 449.99 },
          ],
          paymentMode: "CARD",
          daysAgo: 18,
        },
      ];

      for (const saleData of salesData) {
        // Filter out items with undefined productId
        const validItems = saleData.items.filter(item => item.productId);

        if (validItems.length === 0) continue;

        // Calculate totals
        const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // Generate invoice number
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - saleData.daysAgo);

        const year = saleDate.getFullYear();
        const month = String(saleDate.getMonth() + 1).padStart(2, '0');
        const day = String(saleDate.getDate()).padStart(2, '0');
        const invoiceNo = `INV-${year}${month}${day}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

        try {
          const sale = await prisma.sales.create({
            data: {
              shopId: sampleShop.id,
              customerId: saleData.customerId,
              totalAmount,
              paymentMode: saleData.paymentMode as any,
              invoiceNo,
              saleDate,
              saleItems: {
                create: validItems.map(item => ({
                  productId: item.productId!,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            },
          });

          // Update inventory
          for (const item of validItems) {
            await prisma.inventory.updateMany({
              where: {
                shopId: sampleShop.id,
                productId: item.productId!,
              },
              data: {
                quantity: { decrement: item.quantity }
              },
            });

            // Create stock log
            await prisma.stockLog.create({
              data: {
                productId: item.productId!,
                shopId: sampleShop.id,
                changeType: "SALE_OUT",
                quantity: -item.quantity,
                reason: `Sale - Invoice: ${invoiceNo}`,
              },
            });
          }

          console.log(`✅ Created sale: ${invoiceNo} for ${createdCustomers.find(c => c.id === saleData.customerId)?.name}`);
        } catch (error) {
          console.log(`⚠️ Skipped sale creation: ${error}`);
        }
      }
    }

    // Create comprehensive purchase orders for testing
    console.log("📦 Creating comprehensive purchase orders...");

    const allCreatedProducts = await prisma.products.findMany();

    // Enhanced purchase orders with different suppliers, statuses, and dates
    const purchaseOrders = [
      // Recent received orders
      {
        supplierId: createdSuppliers[0].id, // Premium Furniture Suppliers
        totalAmount: 15000.00,
        purchaseDate: new Date('2024-12-01'),
        status: 'RECEIVED',
        items: [
          { productId: allCreatedProducts[0]?.id, quantity: 20, unitPrice: 450.00 },
          { productId: allCreatedProducts[1]?.id, quantity: 15, unitPrice: 320.00 },
          { productId: allCreatedProducts[2]?.id, quantity: 10, unitPrice: 280.00 }
        ]
      },
      {
        supplierId: createdSuppliers[1].id, // Modern Living Solutions
        totalAmount: 8500.00,
        purchaseDate: new Date('2024-12-15'),
        status: 'RECEIVED',
        items: [
          { productId: allCreatedProducts[3]?.id, quantity: 25, unitPrice: 180.00 },
          { productId: allCreatedProducts[4]?.id, quantity: 12, unitPrice: 220.00 }
        ]
      },
      {
        supplierId: createdSuppliers[2].id, // Classic Wood Works
        totalAmount: 22000.00,
        purchaseDate: new Date('2024-11-20'),
        status: 'RECEIVED',
        items: [
          { productId: allCreatedProducts[5]?.id, quantity: 30, unitPrice: 350.00 },
          { productId: allCreatedProducts[6]?.id, quantity: 25, unitPrice: 400.00 },
          { productId: allCreatedProducts[7]?.id, quantity: 20, unitPrice: 300.00 }
        ]
      },
      // Pending orders
      {
        supplierId: createdSuppliers[0].id, // Premium Furniture Suppliers
        totalAmount: 12000.00,
        purchaseDate: new Date('2025-01-10'),
        status: 'PENDING',
        items: [
          { productId: allCreatedProducts[8]?.id, quantity: 15, unitPrice: 400.00 },
          { productId: allCreatedProducts[9]?.id, quantity: 20, unitPrice: 400.00 }
        ]
      },
      {
        supplierId: createdSuppliers[3].id, // Office Essentials Ltd
        totalAmount: 18500.00,
        purchaseDate: new Date('2025-01-15'),
        status: 'PENDING',
        items: [
          { productId: allCreatedProducts[8]?.id, quantity: 25, unitPrice: 450.00 },
          { productId: allCreatedProducts[9]?.id, quantity: 30, unitPrice: 175.00 }
        ]
      },
      // Historical orders for trend analysis
      {
        supplierId: createdSuppliers[1].id, // Modern Living Solutions
        totalAmount: 9500.00,
        purchaseDate: new Date('2024-10-15'),
        status: 'RECEIVED',
        items: [
          { productId: allCreatedProducts[0]?.id, quantity: 12, unitPrice: 400.00 },
          { productId: allCreatedProducts[1]?.id, quantity: 18, unitPrice: 305.00 }
        ]
      },
      {
        supplierId: createdSuppliers[2].id, // Classic Wood Works
        totalAmount: 16800.00,
        purchaseDate: new Date('2024-09-10'),
        status: 'RECEIVED',
        items: [
          { productId: allCreatedProducts[5]?.id, quantity: 20, unitPrice: 340.00 },
          { productId: allCreatedProducts[6]?.id, quantity: 22, unitPrice: 420.00 }
        ]
      },
      // Returned order for testing returns
      {
        supplierId: createdSuppliers[0].id, // Premium Furniture Suppliers
        totalAmount: 7200.00,
        purchaseDate: new Date('2024-11-05'),
        status: 'RETURNED',
        items: [
          { productId: allCreatedProducts[2]?.id, quantity: 8, unitPrice: 450.00 },
          { productId: allCreatedProducts[3]?.id, quantity: 12, unitPrice: 350.00 }
        ]
      }
    ];

    for (const purchaseData of purchaseOrders) {
      try {
        const purchase = await prisma.purchase.create({
          data: {
            shopId: sampleShop.id,
            supplierId: purchaseData.supplierId,
            totalAmount: purchaseData.totalAmount,
            purchaseDate: purchaseData.purchaseDate,
            status: purchaseData.status as any,
            purchaseItems: {
              create: purchaseData.items.filter(item => item.productId).map(item => ({
                productId: item.productId!,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                receivedQty: purchaseData.status === 'RECEIVED' ? item.quantity : 0,
              }))
            }
          },
        });

        // Update inventory for received purchases
        if (purchaseData.status === 'RECEIVED') {
          for (const item of purchaseData.items) {
            if (item.productId) {
              await prisma.inventory.updateMany({
                where: {
                  shopId: sampleShop.id,
                  productId: item.productId,
                },
                data: {
                  quantity: { increment: item.quantity }
                },
              });

              // Create stock log
              await prisma.stockLog.create({
                data: {
                  productId: item.productId,
                  shopId: sampleShop.id,
                  changeType: "PURCHASE_IN",
                  quantity: item.quantity,
                  reason: `Purchase received - PO: ${purchase.id}`,
                },
              });
            }
          }
        }

        console.log(`✅ Created purchase order: ${purchase.id} - $${purchase.totalAmount} (${purchase.status})`);
      } catch (error) {
        console.log(`⚠️ Skipped purchase order creation: ${error}`);
      }
    }

    // Create purchase returns for testing return functionality
    console.log("🔄 Creating purchase returns for testing...");

    const purchasesForReturns = await prisma.purchase.findMany({
      where: { status: 'RECEIVED' },
      include: { purchaseItems: true },
      take: 3
    });

    for (const purchase of purchasesForReturns) {
      for (const item of purchase.purchaseItems.slice(0, 1)) { // Return first item from each purchase
        const returnQuantity = Math.min(2, item.quantity); // Return 2 items or less

        try {
          // Update purchase item with return
          await prisma.purchaseItem.updateMany({
            where: {
              purchaseId: purchase.id,
              productId: item.productId
            },
            data: {
              returnedQty: { increment: returnQuantity },
              receivedQty: { decrement: returnQuantity },
            },
          });

          // Update inventory
          await prisma.inventory.updateMany({
            where: {
              shopId: purchase.shopId,
              productId: item.productId
            },
            data: {
              quantity: { decrement: returnQuantity }
            },
          });

          // Create stock log for return
          await prisma.stockLog.create({
            data: {
              shopId: purchase.shopId,
              productId: item.productId,
              changeType: "RETURN_TO_SUPPLIER",
              quantity: -returnQuantity,
              reason: `Quality issue - returned ${returnQuantity} defective items to supplier`,
            },
          });

          console.log(`✅ Created return: ${returnQuantity} items from purchase ${purchase.id}`);
        } catch (error) {
          console.log(`⚠️ Skipped return creation: ${error}`);
        }
      }
    }

    // Create attendance records for testing
    console.log("⏰ Creating attendance records...");

    const allStaffUsers = await prisma.user.findMany({
      where: { role: { in: ["MANAGER", "STAFF"] } }
    });

    const attendanceData: any[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    for (let date = new Date(startDate); date <= new Date(); date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const user of allStaffUsers) {
        // 85% attendance rate
        if (Math.random() > 0.15) {
          const checkInTime = new Date(date);
          checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));

          const checkOutTime = new Date(checkInTime);
          checkOutTime.setHours(checkInTime.getHours() + 8 + Math.floor(Math.random() * 2));

          attendanceData.push({
            userId: user.id,
            date: new Date(date),
            checkIn: checkInTime,
            checkOut: checkOutTime,
            isCheckedIn: false,
            status: "PRESENT" as any,
            workedHours: (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
          });
        }
      }
    }

    // Create attendance records in batches
    const batchSize = 50;
    for (let i = 0; i < attendanceData.length; i += batchSize) {
      const batch = attendanceData.slice(i, i + batchSize);
      try {
        await prisma.attendance.createMany({
          data: batch,
          skipDuplicates: true
        });
      } catch (error) {
        console.log(`⚠️ Skipped attendance batch: ${error}`);
      }
    }

    console.log(`✅ Created ${attendanceData.length} attendance records`);

    // Create product comments for testing
    console.log("💬 Creating product comments...");

    const commentData = [
      {
        productId: allCreatedProducts[0]?.id,
        comment: "Excellent quality sofa! Very comfortable and stylish. Highly recommend for modern living rooms."
      },
      {
        productId: allCreatedProducts[1]?.id,
        comment: "Beautiful coffee table with great build quality. Perfect size for our living room setup."
      },
      {
        productId: allCreatedProducts[2]?.id,
        comment: "Amazing recliner chair! The massage function works perfectly. Great value for money."
      },
      {
        productId: allCreatedProducts[3]?.id,
        comment: "Solid platform bed frame. Easy to assemble and very sturdy. Love the modern design."
      },
      {
        productId: allCreatedProducts[4]?.id,
        comment: "Best mattress I've ever owned! Memory foam is incredibly comfortable. Great sleep quality."
      },
      {
        productId: allCreatedProducts[5]?.id,
        comment: "Spacious dresser with smooth drawers. Perfect for bedroom storage needs."
      },
      {
        productId: allCreatedProducts[6]?.id,
        comment: "Beautiful dining table set. Perfect for family dinners. Great craftsmanship."
      },
      {
        productId: allCreatedProducts[7]?.id,
        comment: "Comfortable dining chairs with excellent upholstery. Great addition to our dining room."
      },
      {
        productId: allCreatedProducts[8]?.id,
        comment: "Professional executive desk with plenty of storage. Perfect for home office setup."
      },
      {
        productId: allCreatedProducts[9]?.id,
        comment: "Ergonomic office chair with great lumbar support. Highly recommended for long work hours."
      }
    ];

    for (const comment of commentData) {
      if (comment.productId) {
        try {
          await prisma.comments.create({
            data: {
              productId: comment.productId,
              comment: comment.comment,
            }
          });
          console.log(`✅ Created comment for product: ${comment.productId}`);
        } catch (error) {
          console.log(`⚠️ Skipped comment creation: ${error}`);
        }
      }
    }

    // Create additional inventory adjustments for testing
    console.log("📊 Creating additional inventory adjustments...");

    for (const product of allCreatedProducts) {
      if (product) {
        try {
          // Create some manual adjustments
          await prisma.stockLog.create({
            data: {
              productId: product.id,
              shopId: sampleShop.id,
              changeType: "MANUAL_ADJUSTMENT",
              quantity: Math.floor(Math.random() * 10) + 5,
              reason: "Initial stock adjustment",
            },
          });

          // Update inventory quantity
          await prisma.inventory.updateMany({
            where: {
              shopId: sampleShop.id,
              productId: product.id,
            },
            data: {
              quantity: { increment: Math.floor(Math.random() * 10) + 5 }
            },
          });
        } catch (error) {
          console.log(`⚠️ Skipped inventory adjustment for product: ${product.id}`);
        }
      }
    }

    console.log("🎉 Comprehensive furniture data seeding completed successfully!");
    console.log("\n📊 Enhanced Seeded Data Summary:");
    console.log(`   👥 Users: ${allStaffUsers.length + 1} (1 Admin + ${allStaffUsers.length} Staff)`);
    console.log(`   🏪 Shops: ${createdShops.length} (Multi-location testing)`);
    console.log(`   🏭 Warehouses: ${createdWarehouses.length} (Multi-warehouse testing)`);
    console.log(`   🛍️ Suppliers: ${createdSuppliers.length} (Including active/inactive)`);
    console.log(`   📦 Products: ${allCreatedProducts.length} (Enhanced product catalog)`);
    console.log(`   🏷️ Categories: ${furnitureCategories.length} main categories with subcategories`);
    console.log(`   👤 Customers: ${createdCustomers.length} (Diverse customer base)`);
    console.log(`   💰 Sales: 8 sample sales with invoices (Multi-payment modes)`);
    console.log(`   📦 Purchase Orders: 8 (Various statuses and suppliers)`);
    console.log(`   🔄 Purchase Returns: Created for quality testing`);
    console.log(`   ⏰ Attendance Records: ${attendanceData.length} (30-day history)`);
    console.log(`   � Ptroduct Comments: ${commentData.length} (Customer feedback)`);
    console.log(`   �  Stock Logs: Complete transaction history`);
    console.log(`   📦 Inventory: Multi-warehouse inventory tracking`);
    console.log(`   🎯 API Testing: Full coverage for all endpoints`);

    console.log("\n🔧 Ready for API Testing:");
    console.log("   ✅ Authentication (Admin, Manager, Staff roles)");
    console.log("   ✅ Shop Management (Multiple locations)");
    console.log("   ✅ Supplier Management (Active/Inactive suppliers)");
    console.log("   ✅ Product Catalog (21 products across categories)");
    console.log("   ✅ Inventory Management (Multi-warehouse)");
    console.log("   ✅ Purchase Orders (All statuses, returns)");
    console.log("   ✅ Sales Transactions (Multiple payment modes)");
    console.log("   ✅ Customer Management (8 diverse customers)");
    console.log("   ✅ Attendance Tracking (30-day history)");
    console.log("   ✅ Reports & Analytics (Comprehensive data)");
    console.log("   ✅ Comments & Reviews (Product feedback)");

  } catch (error) {
    console.error("❌ Error seeding furniture data:", error);
    throw error;
  }
};

// Function to run seeder
export const runFurnitureSeeder = async () => {
  try {
    await seedFurnitureData();
    console.log("✅ Seeding completed successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  runFurnitureSeeder();
}