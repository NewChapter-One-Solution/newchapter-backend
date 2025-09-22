import { z } from 'zod';
import { SubscriptionPlan, PaymentGateway } from '@prisma/client';

export const createSubscriptionPlanSchema = z.object({
  body: z.object({
    planType: z.nativeEnum(SubscriptionPlan),
    name: z.string().min(1, 'Plan name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
    maxShops: z.number().positive('Max shops must be positive'),
    maxEmployees: z.number().positive('Max employees must be positive'),
    maxProducts: z.number().positive('Max products must be positive'),
    maxStorage: z.string().min(1, 'Max storage is required'),
    features: z.array(z.string()).min(1, 'At least one feature is required')
  })
});

export const updateSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
    maxShops: z.number().positive().optional(),
    maxEmployees: z.number().positive().optional(),
    maxProducts: z.number().positive().optional(),
    maxStorage: z.string().min(1).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().uuid('Invalid plan ID'),
    paymentGateway: z.nativeEnum(PaymentGateway),
    paymentMethodId: z.string().optional(),
    billingCycle: z.enum(['monthly', 'yearly']).optional()
  })
});

export const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().optional()
  })
});

export const createPaymentIntentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').optional()
  })
});

export const updateSubscriptionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING']),
    reason: z.string().optional()
  }),
  params: z.object({
    subscriptionId: z.string().uuid('Invalid subscription ID')
  })
});

export const getAllSubscriptionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING']).optional(),
    planType: z.nativeEnum(SubscriptionPlan).optional()
  })
});