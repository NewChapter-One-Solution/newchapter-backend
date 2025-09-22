import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

export const seedSubscriptionPlans = async () => {
  try {
    logger.info('Seeding subscription plans...');

    // Check if plans already exist
    const existingPlans = await prisma.subscriptionPlanDetails.count();
    if (existingPlans > 0) {
      logger.info('Subscription plans already exist, skipping seed');
      return;
    }

    const plans = [
      {
        planType: SubscriptionPlan.BASIC,
        name: 'Basic Plan',
        description: 'Perfect for small furniture shops getting started',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxShops: 1,
        maxEmployees: 5,
        maxProducts: 100,
        maxStorage: '5GB',
        features: [
          'Basic inventory management',
          'Sales tracking',
          'Customer management',
          'Basic reporting',
          'Email support',
          'Mobile app access'
        ],
        isActive: true
      },
      {
        planType: SubscriptionPlan.PROFESSIONAL,
        name: 'Professional Plan',
        description: 'Ideal for growing furniture businesses with multiple locations',
        price: 79.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxShops: 5,
        maxEmployees: 25,
        maxProducts: 1000,
        maxStorage: '50GB',
        features: [
          'Advanced inventory management',
          'Multi-shop management',
          'Advanced reporting & analytics',
          'Employee attendance tracking',
          'Supplier management',
          'Purchase order management',
          'Barcode generation',
          'Email & phone support',
          'API access',
          'Custom branding'
        ],
        isActive: true
      },
      {
        planType: SubscriptionPlan.ENTERPRISE,
        name: 'Enterprise Plan',
        description: 'Complete solution for large furniture retail chains',
        price: 199.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxShops: 999, // Unlimited
        maxEmployees: 999, // Unlimited
        maxProducts: 99999, // Unlimited
        maxStorage: 'Unlimited',
        features: [
          'Everything in Professional',
          'Unlimited shops & employees',
          'Advanced analytics & insights',
          'Custom integrations',
          'Dedicated account manager',
          'Priority support (24/7)',
          'Custom training',
          'White-label solution',
          'Advanced security features',
          'Data export & backup',
          'Custom reporting',
          'Multi-currency support'
        ],
        isActive: true
      }
    ];

    // Create yearly versions of the plans with discount
    const yearlyPlans = plans.map(plan => ({
      ...plan,
      billingCycle: 'yearly',
      price: plan.price * 10, // 2 months free (10 months price for 12 months)
      name: plan.name.replace('Plan', 'Plan (Yearly)')
    }));

    // Insert all plans
    const allPlans = [...plans, ...yearlyPlans];

    for (const plan of allPlans) {
      await prisma.subscriptionPlanDetails.create({
        data: plan
      });
    }

    logger.info(`Successfully seeded ${allPlans.length} subscription plans`);
  } catch (error) {
    logger.error('Error seeding subscription plans:', error);
    throw error;
  }
};

export default seedSubscriptionPlans;