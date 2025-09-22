# 💳 Subscription System Documentation

## Overview

This document describes the comprehensive subscription and payment system implemented for the Furniture Shop SaaS platform. The system supports multiple subscription plans with Stripe payment gateway integration.

## 🎯 Features

### Subscription Plans

- **3 Tier System**: Basic, Professional, Enterprise
- **Flexible Billing**: Monthly and Yearly options
- **Feature-based Access Control**
- **Usage Limits**: Shops, Employees, Products, Storage
- **Trial Period**: 14-day free trial for new users

### Payment Integration

- **Stripe Integration**: Secure payment processing
- **Webhook Support**: Real-time payment status updates
- **Multiple Payment Methods**: Cards, digital wallets
- **Automatic Billing**: Recurring subscription charges
- **Invoice Generation**: Automated billing receipts

### Access Control

- **Middleware Protection**: Route-level subscription checks
- **Feature Gates**: Plan-based feature access
- **Usage Monitoring**: Real-time limit tracking
- **Graceful Degradation**: Clear upgrade prompts

## 📋 Subscription Plans

### Basic Plan - $29.99/month

Perfect for small furniture shops getting started

- **1 Shop Location**
- **5 Employees**
- **100 Products**
- **5GB Storage**
- **Features:**
  - Basic inventory management
  - Sales tracking
  - Customer management
  - Basic reporting
  - Email support
  - Mobile app access

### Professional Plan - $79.99/month

Ideal for growing furniture businesses

- **5 Shop Locations**
- **25 Employees**
- **1,000 Products**
- **50GB Storage**
- **Features:**
  - Everything in Basic
  - Multi-shop management
  - Advanced reporting & analytics
  - Employee attendance tracking
  - Supplier management
  - Purchase order management
  - Barcode generation
  - Email & phone support
  - API access
  - Custom branding

### Enterprise Plan - $199.99/month

Complete solution for large furniture retail chains

- **Unlimited Shops**
- **Unlimited Employees**
- **Unlimited Products**
- **Unlimited Storage**
- **Features:**
  - Everything in Professional
  - Advanced analytics & insights
  - Custom integrations
  - Dedicated account manager
  - Priority support (24/7)
  - Custom training
  - White-label solution
  - Advanced security features
  - Data export & backup
  - Custom reporting
  - Multi-currency support

## 🔧 API Endpoints

### Public Endpoints

#### Get All Subscription Plans

```http
GET /api/v1/subscriptions/plans
```

#### Get Specific Plan

```http
GET /api/v1/subscriptions/plans/:planId
```

### Protected Endpoints (Require Authentication)

#### Create Subscription

```http
POST /api/v1/subscriptions
Content-Type: application/json

{
  "planId": "uuid",
  "paymentGateway": "STRIPE",
  "billingCycle": "monthly"
}
```

#### Get Current Subscription

```http
GET /api/v1/subscriptions/current
```

#### Cancel Subscription

```http
POST /api/v1/subscriptions/cancel
Content-Type: application/json

{
  "reason": "Optional cancellation reason"
}
```

#### Get Subscription Usage

```http
GET /api/v1/subscriptions/usage
```

#### Get Payment History

```http
GET /api/v1/subscriptions/payments
```

#### Create Payment Intent

```http
POST /api/v1/subscriptions/payment-intent
Content-Type: application/json

{
  "amount": 29.99,
  "currency": "USD"
}
```

### Admin Endpoints (Admin Role Required)

#### Create Subscription Plan

```http
POST /api/v1/subscriptions/plans
Content-Type: application/json

{
  "planType": "BASIC",
  "name": "Basic Plan",
  "description": "Perfect for small shops",
  "price": 29.99,
  "currency": "USD",
  "billingCycle": "monthly",
  "maxShops": 1,
  "maxEmployees": 5,
  "maxProducts": 100,
  "maxStorage": "5GB",
  "features": ["Basic inventory", "Sales tracking"]
}
```

#### Update Subscription Plan

```http
PUT /api/v1/subscriptions/plans/:planId
Content-Type: application/json

{
  "price": 34.99,
  "isActive": true
}
```

#### Get All Subscriptions

```http
GET /api/v1/subscriptions/all?page=1&limit=10&status=ACTIVE&planType=BASIC
```

#### Update Subscription Status

```http
PUT /api/v1/subscriptions/:subscriptionId/status
Content-Type: application/json

{
  "status": "CANCELLED",
  "reason": "Admin cancellation"
}
```

#### Get Subscription Analytics

```http
GET /api/v1/subscriptions/analytics
```

### Webhook Endpoint

#### Stripe Webhook

```http
POST /api/v1/subscriptions/webhook/stripe
Content-Type: application/json
Stripe-Signature: webhook_signature

{
  "type": "invoice.payment_succeeded",
  "data": { ... }
}
```

## 🛡️ Middleware Protection

### Subscription Middleware

#### Require Active Subscription

```typescript
import { requireActiveSubscription } from "../middleware/subscriptionMiddleware";

router.get("/protected-route", requireActiveSubscription, controller);
```

#### Check Shop Limit

```typescript
import { checkShopLimit } from "../middleware/subscriptionMiddleware";

router.post("/shops", checkShopLimit, createShop);
```

#### Check Employee Limit

```typescript
import { checkEmployeeLimit } from "../middleware/subscriptionMiddleware";

router.post("/employees", checkEmployeeLimit, createEmployee);
```

#### Check Product Limit

```typescript
import { checkProductLimit } from "../middleware/subscriptionMiddleware";

router.post("/products", checkProductLimit, createProduct);
```

#### Check Feature Access

```typescript
import { checkFeatureAccess } from "../middleware/subscriptionMiddleware";

router.get(
  "/advanced-reports",
  checkFeatureAccess("advanced-reporting"),
  getReports
);
```

## 🔄 Subscription Lifecycle

### 1. Plan Selection

- User browses available plans
- Compares features and pricing
- Selects preferred billing cycle

### 2. Subscription Creation

- User creates subscription
- Stripe customer created/retrieved
- Trial period activated (if eligible)
- Database records created

### 3. Payment Processing

- Stripe handles payment collection
- Webhooks update subscription status
- User gains access to features
- Limits are enforced

### 4. Usage Monitoring

- Real-time usage tracking
- Limit enforcement
- Upgrade prompts when limits approached
- Usage analytics for admin

### 5. Renewal/Cancellation

- Automatic renewal (if enabled)
- Cancellation with reason tracking
- Grace period handling
- Data retention policies

## 💾 Database Schema

### SubscriptionPlanDetails

```sql
- id: UUID (Primary Key)
- planType: ENUM (BASIC, PROFESSIONAL, ENTERPRISE)
- name: String
- description: String (Optional)
- price: Float
- currency: String (Default: USD)
- billingCycle: String (monthly/yearly)
- maxShops: Integer
- maxEmployees: Integer
- maxProducts: Integer
- maxStorage: String
- features: JSON Array
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### Subscription

```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- planId: UUID (Foreign Key)
- status: ENUM (ACTIVE, INACTIVE, CANCELLED, EXPIRED, PENDING)
- startDate: DateTime
- endDate: DateTime
- autoRenew: Boolean
- trialEndsAt: DateTime (Optional)
- isTrialActive: Boolean
- cancelledAt: DateTime (Optional)
- cancellationReason: String (Optional)
- gatewaySubscriptionId: String (Optional)
- gatewayCustomerId: String (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### Payment

```sql
- id: UUID (Primary Key)
- subscriptionId: UUID (Foreign Key)
- amount: Float
- currency: String
- status: ENUM (PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED)
- gateway: ENUM (STRIPE, RAZORPAY, PAYPAL)
- gatewayTransactionId: String (Optional)
- gatewayPaymentId: String (Optional)
- gatewayOrderId: String (Optional)
- paymentMethod: String (Optional)
- failureReason: String (Optional)
- refundAmount: Float (Optional)
- refundedAt: DateTime (Optional)
- billingPeriodStart: DateTime
- billingPeriodEnd: DateTime
- createdAt: DateTime
- updatedAt: DateTime
```

## 🔐 Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (Optional - for predefined prices)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_basic_monthly
STRIPE_BASIC_YEARLY_PRICE_ID=price_basic_yearly
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_professional_monthly
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_professional_yearly
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe @types/stripe
```

### 2. Database Migration

```bash
npm run prisma:migrate
```

### 3. Seed Subscription Plans

```bash
npm run seed:furniture
```

### 4. Configure Stripe

1. Create Stripe account
2. Get API keys from dashboard
3. Set up webhook endpoint
4. Configure environment variables

### 5. Test Webhooks (Development)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8001/api/v1/subscriptions/webhook/stripe
```

## 🧪 Testing

### Test Cards (Stripe)

```
# Successful payment
4242424242424242

# Declined payment
4000000000000002

# Requires authentication
4000002500003155
```

### Test Scenarios

1. **Plan Creation**: Create all three plans
2. **Subscription Flow**: Complete subscription process
3. **Payment Success**: Test successful payment webhook
4. **Payment Failure**: Test failed payment handling
5. **Cancellation**: Test subscription cancellation
6. **Limit Enforcement**: Test usage limits
7. **Feature Access**: Test feature-based access control

## 📊 Analytics & Monitoring

### Subscription Metrics

- Total subscriptions
- Active subscriptions
- Trial conversions
- Churn rate
- Monthly/Yearly revenue
- Plan distribution

### Usage Metrics

- Shop utilization
- Employee utilization
- Product utilization
- Storage usage
- Feature adoption

### Payment Metrics

- Payment success rate
- Failed payment recovery
- Refund rates
- Revenue trends

## 🔧 Customization

### Adding New Plans

1. Update `SubscriptionPlan` enum in schema
2. Create plan via admin API
3. Update frontend plan selection
4. Configure Stripe products/prices

### Adding New Features

1. Add feature to plan features array
2. Implement feature gate middleware
3. Update plan comparison
4. Test access control

### Payment Gateway Integration

1. Implement gateway service
2. Add webhook handlers
3. Update payment models
4. Test integration

## 🚨 Error Handling

### Common Errors

- **401**: User not authenticated
- **403**: Subscription required/expired
- **403**: Feature not available in plan
- **403**: Usage limit exceeded
- **404**: Subscription/Plan not found
- **500**: Payment gateway error

### Error Responses

```json
{
  "success": false,
  "message": "Shop limit reached. Your plan allows 1 shops. Please upgrade your plan.",
  "code": "LIMIT_EXCEEDED",
  "upgradeUrl": "/subscriptions/plans"
}
```

## 🔒 Security Considerations

### Webhook Security

- Verify Stripe signatures
- Use HTTPS endpoints
- Implement idempotency
- Log all webhook events

### Payment Security

- Never store card details
- Use Stripe's secure tokenization
- Implement proper error handling
- Monitor for suspicious activity

### Access Control

- Validate subscription status
- Check feature permissions
- Enforce usage limits
- Audit access attempts

## 📈 Performance Optimization

### Caching Strategy

- Cache subscription status
- Cache plan details
- Cache usage counts
- Invalidate on updates

### Database Optimization

- Index subscription queries
- Optimize usage calculations
- Batch limit checks
- Archive old payments

## 🎯 Future Enhancements

### Planned Features

- **Multi-currency Support**: Support for different currencies
- **Proration**: Handle mid-cycle plan changes
- **Add-ons**: Additional features as add-ons
- **Team Management**: Sub-user management
- **Usage-based Billing**: Pay-per-use features
- **Enterprise SSO**: Single sign-on integration
- **Advanced Analytics**: Detailed usage insights
- **API Rate Limiting**: Plan-based API limits

### Integration Opportunities

- **CRM Integration**: Customer relationship management
- **Accounting Software**: Automated bookkeeping
- **Business Intelligence**: Advanced reporting
- **Mobile Apps**: Native mobile applications
- **Third-party Tools**: Integration marketplace

This subscription system provides a solid foundation for monetizing your furniture shop SaaS platform while maintaining flexibility for future growth and customization.
