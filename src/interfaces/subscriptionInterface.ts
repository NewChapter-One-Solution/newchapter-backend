import { SubscriptionPlan, SubscriptionStatus, PaymentStatus, PaymentGateway } from "@prisma/client";

export interface CreateSubscriptionPlanRequest {
  planType: SubscriptionPlan;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle?: string;
  maxShops: number;
  maxEmployees: number;
  maxProducts: number;
  maxStorage: string;
  features: string[];
}

export interface UpdateSubscriptionPlanRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  maxShops?: number;
  maxEmployees?: number;
  maxProducts?: number;
  maxStorage?: string;
  features?: string[];
  isActive?: boolean;
}

export interface CreateSubscriptionRequest {
  planId: string;
  paymentGateway: PaymentGateway;
  paymentMethodId?: string;
  billingCycle?: string;
}

export interface SubscriptionResponse {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  isTrialActive: boolean;
  trialEndsAt?: Date;
  plan: {
    planType: SubscriptionPlan;
    name: string;
    price: number;
    currency: string;
    billingCycle: string;
    maxShops: number;
    maxEmployees: number;
    maxProducts: number;
    maxStorage: string;
    features: string[];
  };
}

export interface PaymentResponse {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  paymentMethod?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  createdAt: Date;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface SubscriptionUsage {
  currentShops: number;
  currentEmployees: number;
  currentProducts: number;
  storageUsed: string;
  planLimits: {
    maxShops: number;
    maxEmployees: number;
    maxProducts: number;
    maxStorage: string;
  };
  usagePercentage: {
    shops: number;
    employees: number;
    products: number;
  };
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  planDistribution: {
    [key in SubscriptionPlan]: number;
  };
  churnRate: number;
}