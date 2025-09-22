import { PrismaClient, PaymentStatus, PaymentGateway } from '@prisma/client';
import { stripe } from '../config/stripe';
import { PaymentResponse } from '../interfaces/subscriptionInterface';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const paymentService = {
  // Process webhook from Stripe
  async handleStripeWebhook(event: any) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      throw error;
    }
  },

  // Handle successful payment
  async handlePaymentSucceeded(invoice: any) {
    try {
      const subscriptionId = invoice.subscription_details?.metadata?.subscriptionId;

      if (!subscriptionId) {
        logger.warn('No subscription ID found in invoice metadata');
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });

      if (!subscription) {
        logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Create payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: PaymentStatus.COMPLETED,
          gateway: PaymentGateway.STRIPE,
          gatewayTransactionId: invoice.payment_intent,
          gatewayPaymentId: invoice.id,
          paymentMethod: invoice.payment_method_types?.[0] || 'unknown',
          billingPeriodStart: new Date(invoice.period_start * 1000),
          billingPeriodEnd: new Date(invoice.period_end * 1000)
        }
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          endDate: new Date(invoice.period_end * 1000)
        }
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          isSubscriptionActive: true,
          currentSubscriptionId: subscription.id,
          subscriptionExpiresAt: new Date(invoice.period_end * 1000)
        }
      });

      logger.info(`Payment succeeded for subscription: ${subscriptionId}`);
    } catch (error) {
      logger.error('Error handling payment succeeded:', error);
      throw error;
    }
  },

  // Handle failed payment
  async handlePaymentFailed(invoice: any) {
    try {
      const subscriptionId = invoice.subscription_details?.metadata?.subscriptionId;

      if (!subscriptionId) {
        logger.warn('No subscription ID found in invoice metadata');
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Create failed payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          status: PaymentStatus.FAILED,
          gateway: PaymentGateway.STRIPE,
          gatewayPaymentId: invoice.id,
          failureReason: 'Payment failed',
          billingPeriodStart: new Date(invoice.period_start * 1000),
          billingPeriodEnd: new Date(invoice.period_end * 1000)
        }
      });

      logger.info(`Payment failed for subscription: ${subscriptionId}`);
    } catch (error) {
      logger.error('Error handling payment failed:', error);
      throw error;
    }
  },

  // Handle subscription updated
  async handleSubscriptionUpdated(stripeSubscription: any) {
    try {
      const subscriptionId = stripeSubscription.metadata?.subscriptionId;

      if (!subscriptionId) {
        logger.warn('No subscription ID found in Stripe subscription metadata');
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Update subscription status based on Stripe status
      let status = subscription.status;
      switch (stripeSubscription.status) {
        case 'active':
          status = 'ACTIVE';
          break;
        case 'canceled':
          status = 'CANCELLED';
          break;
        case 'past_due':
        case 'unpaid':
          status = 'INACTIVE';
          break;
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: status as any,
          endDate: new Date(stripeSubscription.current_period_end * 1000),
          cancelledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
        }
      });

      logger.info(`Subscription updated: ${subscriptionId}, status: ${status}`);
    } catch (error) {
      logger.error('Error handling subscription updated:', error);
      throw error;
    }
  },

  // Handle subscription deleted
  async handleSubscriptionDeleted(stripeSubscription: any) {
    try {
      const subscriptionId = stripeSubscription.metadata?.subscriptionId;

      if (!subscriptionId) {
        logger.warn('No subscription ID found in Stripe subscription metadata');
        return;
      }

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      // Update user subscription status
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (subscription) {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            isSubscriptionActive: false,
            currentSubscriptionId: null
          }
        });
      }

      logger.info(`Subscription deleted: ${subscriptionId}`);
    } catch (error) {
      logger.error('Error handling subscription deleted:', error);
      throw error;
    }
  },

  // Get payment history for a subscription
  async getPaymentHistory(subscriptionId: string): Promise<PaymentResponse[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: { subscriptionId },
        orderBy: { createdAt: 'desc' }
      });

      return payments.map(payment => ({
        id: payment.id,
        subscriptionId: payment.subscriptionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway,
        gatewayTransactionId: payment.gatewayTransactionId,
        paymentMethod: payment.paymentMethod,
        billingPeriodStart: payment.billingPeriodStart,
        billingPeriodEnd: payment.billingPeriodEnd,
        createdAt: payment.createdAt
      }));
    } catch (error) {
      logger.error('Error fetching payment history:', error);
      throw new CustomError('Failed to fetch payment history', 500);
    }
  },

  // Create payment intent for manual payment
  async createPaymentIntent(subscriptionId: string, amount: number, currency: string = 'usd') {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { user: true }
      });

      if (!subscription) {
        throw new CustomError('Subscription not found', 404);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: subscription.gatewayCustomerId || undefined,
        metadata: {
          subscriptionId: subscription.id,
          userId: subscription.userId
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      logger.error('Error creating payment intent:', error);
      throw new CustomError('Failed to create payment intent', 500);
    }
  }
};

export default paymentService;