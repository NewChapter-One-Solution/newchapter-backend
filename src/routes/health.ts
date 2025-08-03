import { Router } from 'express';
import prisma from '../models/prisma-client';
import logger from '../utils/logger';

const healthRouter = Router();

// Basic health check
healthRouter.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    logger.info('Health check passed', healthData);
    res.json(healthData);
  } catch (error) {
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    logger.error('Health check failed', errorData);
    res.status(503).json(errorData);
  }
});

// System info endpoint
healthRouter.get('/info', async (req, res) => {
  try {
    const [userCount, productCount, categoryCount, shopCount, customerCount, salesCount] = await Promise.all([
      prisma.user.count(),
      prisma.products.count(),
      prisma.category.count(),
      prisma.shop.count(),
      prisma.customer.count(),
      prisma.sales.count()
    ]);

    const systemInfo = {
      application: {
        name: 'Furniture Shop Management System',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      database: {
        status: 'connected',
        counts: {
          users: userCount,
          products: productCount,
          categories: categoryCount,
          shops: shopCount,
          customers: customerCount,
          sales: salesCount
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
        }
      }
    };

    logger.info('System info requested', { ip: req.ip });
    res.json(systemInfo);
  } catch (error) {
    logger.error('System info request failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      error: 'Failed to retrieve system information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default healthRouter;