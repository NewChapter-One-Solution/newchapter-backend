import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { STRIPE_WEBHOOK_SECRET } from '../config/stripe';
import { paymentService } from '../services/paymentService';
import logger from '../utils/logger';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    logger.error('Missing Stripe signature');
    return res.status(400).send('Missing Stripe signature');
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    logger.error('Missing Stripe webhook secret');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    await paymentService.handleStripeWebhook(event);

    logger.info(`Successfully processed webhook event: ${event.type}`);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing webhook event ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};