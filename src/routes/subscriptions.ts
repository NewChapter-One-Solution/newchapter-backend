import { Router } from 'express';
import {
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  createSubscription,
  getCurrentSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  getPaymentHistory,
  createPaymentIntent,
  getSubscriptionAnalytics,
  getAllSubscriptions,
  updateSubscriptionStatus
} from '../controllers/subscriptionController';
import { handleStripeWebhook } from '../controllers/webhookController';
import jwtMiddleware from '../middleware/jwtMiddleware';
import rbacMiddleware from '../middleware/rbacMiddleware';

const router = Router();

// Public routes
router.get('/plans', getSubscriptionPlans);
router.get('/plans/:planId', getSubscriptionPlan);

// Webhook route (must be before other middleware)
router.post('/webhook/stripe', handleStripeWebhook);

// Protected routes
router.use(jwtMiddleware);

// User subscription routes
router.post('/', createSubscription);
router.get('/current', getCurrentSubscription);
router.post('/cancel', cancelSubscription);
router.get('/usage', getSubscriptionUsage);
router.get('/payments', getPaymentHistory);
router.post('/payment-intent', createPaymentIntent);

// Admin only routes
router.post('/plans', rbacMiddleware(['ADMIN']), createSubscriptionPlan);
router.put('/plans/:planId', rbacMiddleware(['ADMIN']), updateSubscriptionPlan);
router.get('/analytics', rbacMiddleware(['ADMIN']), getSubscriptionAnalytics);
router.get('/all', rbacMiddleware(['ADMIN']), getAllSubscriptions);
router.put('/:subscriptionId/status', rbacMiddleware(['ADMIN']), updateSubscriptionStatus);

export default router;