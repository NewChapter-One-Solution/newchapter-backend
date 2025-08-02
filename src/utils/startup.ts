import prisma from "../models/prisma-client";
import logger from "./logger";

export const initializeSystem = async () => {
  try {
    logger.info("🚀 Initializing NewChapter: Furniture Shop Management...");

    // Check if system is already initialized
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();

    if (userCount === 0 || categoryCount === 0) {
      logger.info("🌱 System not initialized. Please run: npm run seed:furniture");
    } else {
      logger.info("✅ System already initialized");
    }

    // Display system stats
    const [users, products, categories, shops, customers] = await Promise.all([
      prisma.user.count(),
      prisma.products.count(),
      prisma.category.count(),
      prisma.shop.count(),
      prisma.customer.count(),
    ]);

    const systemStats = { users, products, categories, shops, customers };
    logger.info("📊 System Statistics:", systemStats);

    if (process.env.NODE_ENV !== "production") {
      console.log("\n📊 System Statistics:");
      console.log(`   Users: ${users}`);
      console.log(`   Products: ${products}`);
      console.log(`   Categories: ${categories}`);
      console.log(`   Shops: ${shops}`);
      console.log(`   Customers: ${customers}`);
      console.log("\n🎉 NewChapter: Furniture Shop Management System is ready!");
    }

    logger.info("🎉 System initialization completed", {
      environment: process.env.NODE_ENV || "development",
      stats: systemStats,
    });

  } catch (error) {
    logger.error("❌ System initialization failed:", error);
    throw error;
  }
};

// Auto-initialize on server start (skipped during test runs)
export const autoInitialize = async () => {
  if (process.env.NODE_ENV !== "test") {
    await initializeSystem();
  }
};
