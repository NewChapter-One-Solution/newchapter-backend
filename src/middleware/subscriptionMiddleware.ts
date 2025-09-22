import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { subscriptionService } from '../services/subscriptionService';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Check if user has active subscription
export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const subscription = await subscriptionService.getUserSubscription(userId);

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new CustomError('Active subscription required', 403);
    }

    // Check if subscription is expired
    if (new Date() > subscription.endDate) {
      throw new CustomError('Subscription has expired', 403);
    }

    // Attach subscription to request for use in controllers
    req.subscription = subscription;
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error checking subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check shop creation limit
export const checkShopLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const subscription = req.subscription || await subscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new CustomError('Active subscription required', 403);
    }

    const currentShops = await prisma.shop.count({
      where: { ownerId: userId }
    });

    if (currentShops >= subscription.plan.maxShops) {
      throw new CustomError(`Shop limit reached. Your plan allows ${subscription.plan.maxShops} shops. Please upgrade your plan.`, 403);
    }

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error checking shop limit:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check employee limit
export const checkEmployeeLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const subscription = req.subscription || await subscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new CustomError('Active subscription required', 403);
    }

    // Get user's shops
    const userShops = await prisma.shop.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });

    const shopIds = userShops.map(shop => shop.id);

    const currentEmployees = await prisma.user.count({
      where: { shopId: { in: shopIds } }
    });

    if (currentEmployees >= subscription.plan.maxEmployees) {
      throw new CustomError(`Employee limit reached. Your plan allows ${subscription.plan.maxEmployees} employees. Please upgrade your plan.`, 403);
    }

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error checking employee limit:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check product limit
export const checkProductLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const subscription = req.subscription || await subscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new CustomError('Active subscription required', 403);
    }

    const currentProducts = await prisma.products.count({
      where: { createdBy: userId }
    });

    if (currentProducts >= subscription.plan.maxProducts) {
      throw new CustomError(`Product limit reached. Your plan allows ${subscription.plan.maxProducts} products. Please upgrade your plan.`, 403);
    }

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error checking product limit:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check feature access
export const checkFeatureAccess = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const subscription = req.subscription || await subscriptionService.getUserSubscription(userId);

      if (!subscription) {
        throw new CustomError('Active subscription required', 403);
      }

      const features = subscription.plan.features as string[];

      if (!features.includes(feature)) {
        throw new CustomError(`Feature '${feature}' is not available in your current plan. Please upgrade your plan.`, 403);
      }

      next();
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      logger.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

export default {
  requireActiveSubscription,
  checkShopLimit,
  checkEmployeeLimit,
  checkProductLimit,
  checkFeatureAccess
};