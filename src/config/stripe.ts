import Stripe from 'stripe';
import { stripeSecretKey, stripeWebhookSecret } from './secrets';

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;

// Stripe price IDs for different plans (these should be created in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
  BASIC_YEARLY: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
  PROFESSIONAL_MONTHLY: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
  PROFESSIONAL_YEARLY: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
};

export default stripe;