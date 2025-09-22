import { PrismaClient, SubscriptionPlan, SubscriptionStatus, PaymentStatus, PaymentGateway } from '@prisma/client';
import { stripe } from '../config/stripe';
import {
  CreateSubscriptionRequest,
  SubscriptionResponse,
  SubscriptionUsage,
  SubscriptionAnalytics
} from '../interfaces/subscriptionInterface';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const subscriptionService = {
  // Get all subscription plans
  async getAllPlans() {
    try {
      const plans = await prisma.subscriptionPlanDetails.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });
      return plans;
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      throw new CustomError('Failed to fetch subscription plans', 500);
    }
  },

  // Get plan by ID
  async getPlanById(planId: string) {
    try {
      const plan = await prisma.subscriptionPlanDetails.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new CustomError('Subscription plan not found', 404);
      }

      return plan;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      logger.error('Error fetching subscription plan:', error);
      throw new CustomError('Failed to fetch subscription plan', 500);
    }
  },

  // Create subscription
  async createSubscription(userId: string, data: CreateSubscriptionRequest) {
    try {
      const plan = await this.getPlanById(data.planId);

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PENDING'] }
        }
      });

      if (existingSubscription) {
        throw new CustomError('User already has an active subscription', 400);
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Create Stripe customer if doesn't exist
      let stripeCustomer;
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });

        if (customers.data.length > 0) {
          stripeCustomer = customers.data[0];
        } else {
          stripeCustomer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            metadata: {
              userId: user.id
            }
          });
        }
      } catch (stripeError) {
        logger.error('Stripe customer creation failed:', stripeError);
        throw new CustomError('Payment gateway error', 500);
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      const billingCycle = data.billingCycle || plan.billingCycle;

      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: data.planId,
          status: SubscriptionStatus.PENDING,
          startDate,
          endDate,
          gatewayCustomerId: stripeCustomer.id,
          isTrialActive: !user.trialUsed,
          trialEndsAt: !user.trialUsed ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null // 14 days trial
        },
        include: {
          plan: true
        }
      });

      // Create Stripe subscription
      try {
        const stripeSubscription = await stripe.subscriptions.create({
          customer: stripeCustomer.id,
          items: [{
            price_data: {
              currency: plan.currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description || undefined
              },
              unit_amount: Math.round(plan.price * 100), // Convert to cents
              recurring: {
                interval: billingCycle === 'yearly' ? 'year' : 'month'
              }
            }
          }],
          trial_period_days: !user.trialUsed ? 14 : undefined,
          metadata: {
            subscriptionId: subscription.id,
            userId: user.id
          }
        });

        // Update subscription with Stripe ID
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            gatewaySubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING
          }
        });

        // Update user trial status
        if (!user.trialUsed) {
          await prisma.user.update({
            where: { id: userId },
            data: { trialUsed: true }
          });
        }

        return {
          subscription,
          clientSecret: stripeSubscription.latest_invoice
            ? await this.getPaymentIntentClientSecret(stripeSubscription.latest_invoice as string)
            : null
        };

      } catch (stripeError) {
        // Rollback database subscription if Stripe fails
        await prisma.subscription.delete({
          where: { id: subscription.id }
        });

        logger.error('Stripe subscription creation failed:', stripeError);
        throw new CustomError('Payment gateway error', 500);
      }

    } catch (error) {
      if (error instanceof CustomError) throw error;
      logger.error('Error creating subscription:', error);
      throw new CustomError('Failed to create subscription', 500);
    }
  },

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<SubscriptionResponse | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PENDING'] }
        },
        include: {
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        isTrialActive: subscription.isTrialActive,
        trialEndsAt: subscription.trialEndsAt,
        plan: {
          planType: subscription.plan.planType,
          name: subscription.plan.name,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
          billingCycle: subscription.plan.billingCycle,
          maxShops: subscription.plan.maxShops,
          maxEmployees: subscription.plan.maxEmployees,
          maxProducts: subscription.plan.maxProducts,
          maxStorage: subscription.plan.maxStorage,
          features: subscription.plan.features as string[]
        }
      };
    } catch (error) {
      logger.error('Error fetching user subscription:', error);
      throw new CustomError('Failed to fetch subscription', 500);
    }
  },

  // Cancel subscription
  async cancelSubscription(userId: string, reason?: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      });

      if (!subscription) {
        throw new CustomError('No active subscription found', 404);
      }

      // Cancel in Stripe
      if (subscription.gatewaySubscriptionId) {
        try {
          await stripe.subscriptions.update(subscription.gatewaySubscriptionId, {
            cancel_at_period_end: true
          });
        } catch (stripeError) {
          logger.error('Stripe cancellation failed:', stripeError);
          // Continue with database update even if Stripe fails
        }
      }

      // Update subscription in database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          autoRenew: false
        },
        include: {
          plan: true
        }
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscriptionActive: false,
          currentSubscriptionId: null
        }
      });

      return updatedSubscription;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      logger.error('Error cancelling subscription:', error);
      throw new CustomError('Failed to cancel subscription', 500);
    }
  },

  // Get subscription usage
  async getSubscriptionUsage(userId: string): Promise<SubscriptionUsage> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        throw new CustomError('No active subscription found', 404);
      }

      // Get current usage counts
      const [shopsCount, employeesCount, productsCount] = await Promise.all([
        prisma.shop.count({ where: { ownerId: userId } }),
        prisma.user.count({ where: { shopId: { in: await prisma.shop.findMany({ where: { ownerId: userId }, select: { id: true } }).then(shops => shops.map(s => s.id)) } } }),
        prisma.products.count({ where: { createdBy: userId } })
      ]);

      // Calculate usage percentages
      const shopUsage = (shopsCount / subscription.plan.maxShops) * 100;
      const employeeUsage = (employeesCount / subscription.plan.maxEmployees) * 100;
      const productUsage = (productsCount / subscription.plan.maxProducts) * 100;

      return {
        currentShops: shopsCount,
        currentEmployees: employeesCount,
        currentProducts: productsCount,
        storageUsed: "0GB", // This would need to be calculated based on actual file storage
        planLimits: {
          maxShops: subscription.plan.maxShops,
          maxEmployees: subscription.plan.maxEmployees,
          maxProducts: subscription.plan.maxProducts,
          maxStorage: subscription.plan.maxStorage
        },
        usagePercentage: {
          shops: Math.min(shopUsage, 100),
          employees: Math.min(employeeUsage, 100),
          products: Math.min(productUsage, 100)
        }
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      logger.error('Error fetching subscription usage:', error);
      throw new CustomError('Failed to fetch subscription usage', 500);
    }
  },

  // Helper method to get payment intent client secret
  async getPaymentIntentClientSecret(invoiceId: string): Promise<string | null> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
        return paymentIntent.client_secret;
      }
      return null;
    } catch (error) {
      logger.error('Error getting payment intent client secret:', error);
      return null;
    }
  },

  // Get subscription analytics (admin only)
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        planDistribution,
        monthlyPayments,
        yearlyPayments
      ] = await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { isTrialActive: true } }),
        prisma.subscription.count({ where: { status: 'CANCELLED' } }),
        prisma.subscription.groupBy({
          by: ['planId'],
          _count: { planId: true },
          include: { plan: { select: { planType: true } } }
        }),
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), 0, 1)
            }
          },
          _sum: { amount: true }
        })
      ]);

      // Calculate churn rate (simplified)
      const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;

      return {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        monthlyRevenue: monthlyPayments._sum.amount || 0,
        yearlyRevenue: yearlyPayments._sum.amount || 0,
        planDistribution: {
          BASIC: 0,
          PROFESSIONAL: 0,
          ENTERPRISE: 0
        },
        churnRate: Math.round(churnRate * 100) / 100
      };
    } catch (error) {
      logger.error('Error fetching subscription analytics:', error);
      throw new CustomError('Failed to fetch subscription analytics', 500);
    }
  }
};

export default subscriptionService;