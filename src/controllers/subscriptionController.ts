import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { subscriptionService } from '../services/subscriptionService';
import { paymentService } from '../services/paymentService';
import { CreateSubscriptionRequest, CreateSubscriptionPlanRequest, UpdateSubscriptionPlanRequest } from '../interfaces/subscriptionInterface';
import { PrismaClient } from '@prisma/client';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Get all subscription plans
export const getSubscriptionPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const plans = await subscriptionService.getAllPlans();

  res.status(200).json({
    success: true,
    message: 'Subscription plans fetched successfully',
    data: plans
  });
});

// Get subscription plan by ID
export const getSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.params;
  const plan = await subscriptionService.getPlanById(planId);

  res.status(200).json({
    success: true,
    message: 'Subscription plan fetched successfully',
    data: plan
  });
});

// Create subscription plan (Admin only)
export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const planData: CreateSubscriptionPlanRequest = req.body;

  const plan = await prisma.subscriptionPlanDetails.create({
    data: {
      planType: planData.planType,
      name: planData.name,
      description: planData.description,
      price: planData.price,
      currency: planData.currency || 'USD',
      billingCycle: planData.billingCycle || 'monthly',
      maxShops: planData.maxShops,
      maxEmployees: planData.maxEmployees,
      maxProducts: planData.maxProducts,
      maxStorage: planData.maxStorage,
      features: planData.features
    }
  });

  res.status(201).json({
    success: true,
    message: 'Subscription plan created successfully',
    data: plan
  });
});

// Update subscription plan (Admin only)
export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.params;
  const updateData: UpdateSubscriptionPlanRequest = req.body;

  const plan = await prisma.subscriptionPlanDetails.update({
    where: { id: planId },
    data: updateData
  });

  res.status(200).json({
    success: true,
    message: 'Subscription plan updated successfully',
    data: plan
  });
});

// Create subscription
export const createSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const subscriptionData: CreateSubscriptionRequest = req.body;
  const result = await subscriptionService.createSubscription(userId, subscriptionData);

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscription: result.subscription,
      clientSecret: result.clientSecret
    }
  });
});

// Get current user subscription
export const getCurrentSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const subscription = await subscriptionService.getUserSubscription(userId);

  if (!subscription) {
    res.status(200).json({
      success: true,
      message: 'No active subscription found',
      data: null
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Subscription fetched successfully',
    data: subscription
  });
});

// Cancel subscription
export const cancelSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const { reason } = req.body;
  const subscription = await subscriptionService.cancelSubscription(userId, reason);

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: subscription
  });
});

// Get subscription usage
export const getSubscriptionUsage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const usage = await subscriptionService.getSubscriptionUsage(userId);

  res.status(200).json({
    success: true,
    message: 'Subscription usage fetched successfully',
    data: usage
  });
});

// Get payment history
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription) {
    throw new CustomError('No active subscription found', 404);
  }

  const payments = await paymentService.getPaymentHistory(subscription.id);

  res.status(200).json({
    success: true,
    message: 'Payment history fetched successfully',
    data: payments
  });
});

// Create payment intent for manual payment
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  const { amount, currency } = req.body;

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription) {
    throw new CustomError('No active subscription found', 404);
  }

  const paymentIntent = await paymentService.createPaymentIntent(subscription.id, amount, currency);

  res.status(200).json({
    success: true,
    message: 'Payment intent created successfully',
    data: paymentIntent
  });
});

// Get subscription analytics (Admin only)
export const getSubscriptionAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const analytics = await subscriptionService.getSubscriptionAnalytics();

  res.status(200).json({
    success: true,
    message: 'Subscription analytics fetched successfully',
    data: analytics
  });
});

// Get all subscriptions (Admin only)
export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, status, planType } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (status) where.status = status;
  if (planType) where.plan = { planType };

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.subscription.count({ where })
  ]);

  res.status(200).json({
    success: true,
    message: 'Subscriptions fetched successfully',
    data: {
      subscriptions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / take),
        totalItems: total,
        itemsPerPage: take
      }
    }
  });
});

// Update subscription status (Admin only)
export const updateSubscriptionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;
  const { status, reason } = req.body;

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status,
      cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
      cancellationReason: status === 'CANCELLED' ? reason : undefined
    },
    include: {
      user: true,
      plan: true
    }
  });

  // Update user subscription status
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isSubscriptionActive: false,
        currentSubscriptionId: null
      }
    });
  } else if (status === 'ACTIVE') {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isSubscriptionActive: true,
        currentSubscriptionId: subscription.id,
        subscriptionExpiresAt: subscription.endDate
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Subscription status updated successfully',
    data: subscription
  });
});