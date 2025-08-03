import dotenv from "dotenv";
dotenv.config();

import { port, host } from "./config/secrets";
import app from "./app";
import prisma from "./models/prisma-client";
import { autoInitialize } from "./utils/startup";
import logger from "./utils/logger";

const startServer = async () => {
  try {
    logger.info("🔄 Connecting to database...");
    await prisma.$connect();
    logger.info("✅ Connected to database");

    // Initialize system with furniture data
    await autoInitialize();

    app.listen(port, host, () => {
      logger.info(`🌐 Server running on http://${host}:${port}`);
      logger.info(`🏥 Health Check: http://${host}:${port}/api/v1/health`);
      logger.info(`📊 System Info: http://${host}:${port}/api/v1/info`);

      logger.info("🚀 System startup completed", {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
        }
      });
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error instanceof Error ? error.stack : error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  try {
    logger.info(`🔄 Received ${signal}, shutting down gracefully...`);
    await prisma.$disconnect();
    logger.info("✅ Database disconnected");
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error during ${signal} shutdown:`, error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();
