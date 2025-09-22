# 🎨 Frontend Integration Guide - Subscription System

## Overview

This guide explains how to integrate the furniture shop SaaS subscription system from a frontend perspective, including user flows, API calls, and implementation examples.

## 🚀 User Journey & API Flow

### 1. **User Registration & Authentication**

#### Step 1: User Registration

```javascript
// POST /api/v1/auth/register
const registerUser = async (userData) => {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
    }),
  });

  return response.json();
};
```

#### Step 2: User Login

```javascript
// POST /api/v1/auth/login
const loginUser = async (credentials) => {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const data = await response.json();

  if (data.success) {
    // Store JWT token
    localStorage.setItem("authToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
  }

  return data;
};
```

### 2. **Subscription Plan Selection**

#### Step 1: Fetch Available Plans

```javascript
// GET /api/v1/subscriptions/plans
const getSubscriptionPlans = async () => {
  const response = await fetch("/api/v1/subscriptions/plans");
  const data = await response.json();

  return data.data; // Array of subscription plans
};

// Example Response:
/*
[
  {
    "id": "plan-uuid-1",
    "planType": "BASIC",
    "name": "Basic Plan",
    "description": "Perfect for small furniture shops",
    "price": 29.99,
    "currency": "USD",
    "billingCycle": "monthly",
    "maxShops": 1,
    "maxEmployees": 5,
    "maxProducts": 100,
    "maxStorage": "5GB",
    "features": [
      "Basic inventory management",
      "Sales tracking",
      "Customer management"
    ]
  }
]
*/
```

#### Step 2: Display Plans in UI

```jsx
// React Component Example
const PricingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    };

    fetchPlans();
  }, []);

  return (
    <div className="pricing-plans">
      {plans.map((plan) => (
        <div key={plan.id} className="plan-card">
          <h3>{plan.name}</h3>
          <p className="price">
            ${plan.price}/{plan.billingCycle}
          </p>
          <p>{plan.description}</p>

          <div className="limits">
            <p>
              🏪 {plan.maxShops} Shop{plan.maxShops > 1 ? "s" : ""}
            </p>
            <p>👥 {plan.maxEmployees} Employees</p>
            <p>📦 {plan.maxProducts} Products</p>
            <p>💾 {plan.maxStorage} Storage</p>
          </div>

          <ul className="features">
            {plan.features.map((feature, index) => (
              <li key={index}>✅ {feature}</li>
            ))}
          </ul>

          <button
            onClick={() => setSelectedPlan(plan)}
            className="select-plan-btn"
          >
            Select Plan
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. **Subscription Creation & Payment**

#### Step 1: Create Subscription

```javascript
// POST /api/v1/subscriptions
const createSubscription = async (planId, billingCycle = "monthly") => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/v1/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      planId: planId,
      paymentGateway: "STRIPE",
      billingCycle: billingCycle,
    }),
  });

  return response.json();
};

// Example Response:
/*
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "sub-uuid",
      "status": "PENDING",
      "isTrialActive": true,
      "trialEndsAt": "2024-02-15T00:00:00Z"
    },
    "clientSecret": "pi_xxx_secret_xxx" // For Stripe payment
  }
}
*/
```

#### Step 2: Handle Stripe Payment (if not trial)

```javascript
// Frontend Stripe Integration
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_your_publishable_key");

const PaymentForm = ({ clientSecret, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Customer Name",
            email: "customer@email.com",
          },
        },
      }
    );

    setProcessing(false);

    if (error) {
      console.error("Payment failed:", error);
    } else if (paymentIntent.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>
        {processing ? "Processing..." : "Subscribe Now"}
      </button>
    </form>
  );
};
```

### 4. **Dashboard & Subscription Management**

#### Step 1: Check Current Subscription

```javascript
// GET /api/v1/subscriptions/current
const getCurrentSubscription = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/v1/subscriptions/current", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

// Example Response:
/*
{
  "success": true,
  "data": {
    "id": "sub-uuid",
    "status": "ACTIVE",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-02-01T00:00:00Z",
    "isTrialActive": false,
    "plan": {
      "name": "Professional Plan",
      "price": 79.99,
      "maxShops": 5,
      "maxEmployees": 25
    }
  }
}
*/
```

#### Step 2: Get Usage Statistics

```javascript
// GET /api/v1/subscriptions/usage
const getSubscriptionUsage = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/v1/subscriptions/usage", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

// Example Response:
/*
{
  "success": true,
  "data": {
    "currentShops": 2,
    "currentEmployees": 8,
    "currentProducts": 150,
    "storageUsed": "2.5GB",
    "planLimits": {
      "maxShops": 5,
      "maxEmployees": 25,
      "maxProducts": 1000,
      "maxStorage": "50GB"
    },
    "usagePercentage": {
      "shops": 40,
      "employees": 32,
      "products": 15
    }
  }
}
*/
```

#### Step 3: Dashboard Component

```jsx
const SubscriptionDashboard = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [subData, usageData] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionUsage(),
      ]);

      setSubscription(subData.data);
      setUsage(usageData.data);
    };

    fetchData();
  }, []);

  if (!subscription) return <div>Loading...</div>;

  return (
    <div className="subscription-dashboard">
      <div className="subscription-info">
        <h2>Current Plan: {subscription.plan.name}</h2>
        <p>Status: {subscription.status}</p>
        <p>
          Next Billing: {new Date(subscription.endDate).toLocaleDateString()}
        </p>

        {subscription.isTrialActive && (
          <div className="trial-banner">
            🎉 Trial Active until{" "}
            {new Date(subscription.trialEndsAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {usage && (
        <div className="usage-stats">
          <h3>Usage Statistics</h3>

          <div className="usage-item">
            <span>
              Shops: {usage.currentShops}/{usage.planLimits.maxShops}
            </span>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${usage.usagePercentage.shops}%` }}
              />
            </div>
          </div>

          <div className="usage-item">
            <span>
              Employees: {usage.currentEmployees}/
              {usage.planLimits.maxEmployees}
            </span>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${usage.usagePercentage.employees}%` }}
              />
            </div>
          </div>

          <div className="usage-item">
            <span>
              Products: {usage.currentProducts}/{usage.planLimits.maxProducts}
            </span>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${usage.usagePercentage.products}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 5. **Feature Access Control**

#### Step 1: Check Feature Availability

```javascript
// Utility function to check if feature is available
const hasFeature = (subscription, featureName) => {
  if (!subscription || !subscription.plan) return false;
  return subscription.plan.features.includes(featureName);
};

// Usage in components
const AdvancedReports = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    getCurrentSubscription().then((data) => setSubscription(data.data));
  }, []);

  if (!hasFeature(subscription, "Advanced reporting & analytics")) {
    return (
      <div className="feature-locked">
        <h3>🔒 Advanced Reports</h3>
        <p>This feature is available in Professional and Enterprise plans.</p>
        <button onClick={() => (window.location.href = "/pricing")}>
          Upgrade Plan
        </button>
      </div>
    );
  }

  return <div>Advanced reports content...</div>;
};
```

#### Step 2: Handle Limit Exceeded Errors

```javascript
// Error handling for API calls
const createShop = async (shopData) => {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch("/api/v1/shops", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shopData),
    });

    const data = await response.json();

    if (!data.success && response.status === 403) {
      // Handle limit exceeded
      if (data.message.includes("Shop limit reached")) {
        showUpgradeModal(
          "You've reached your shop limit. Upgrade to add more shops."
        );
        return;
      }
    }

    return data;
  } catch (error) {
    console.error("Error creating shop:", error);
  }
};

const showUpgradeModal = (message) => {
  // Show modal with upgrade options
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div class="upgrade-modal">
      <h3>Upgrade Required</h3>
      <p>${message}</p>
      <button onclick="window.location.href='/pricing'">View Plans</button>
      <button onclick="this.parentElement.parentElement.remove()">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
};
```

### 6. **Payment History & Billing**

#### Step 1: Get Payment History

```javascript
// GET /api/v1/subscriptions/payments
const getPaymentHistory = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/v1/subscriptions/payments", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
```

#### Step 2: Billing History Component

```jsx
const BillingHistory = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getPaymentHistory().then((data) => setPayments(data.data));
  }, []);

  return (
    <div className="billing-history">
      <h3>Billing History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
              <td>
                ${payment.amount} {payment.currency}
              </td>
              <td>
                <span className={`status ${payment.status.toLowerCase()}`}>
                  {payment.status}
                </span>
              </td>
              <td>
                {new Date(payment.billingPeriodStart).toLocaleDateString()} -
                {new Date(payment.billingPeriodEnd).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 7. **Subscription Cancellation**

#### Step 1: Cancel Subscription

```javascript
// POST /api/v1/subscriptions/cancel
const cancelSubscription = async (reason) => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/v1/subscriptions/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  return response.json();
};
```

#### Step 2: Cancellation Component

```jsx
const CancelSubscription = () => {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleCancel = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    try {
      await cancelSubscription(reason);
      alert("Subscription cancelled successfully");
      window.location.reload();
    } catch (error) {
      alert("Error cancelling subscription");
    }
  };

  return (
    <div className="cancel-subscription">
      <h3>Cancel Subscription</h3>

      {!confirming ? (
        <button onClick={handleCancel} className="cancel-btn">
          Cancel Subscription
        </button>
      ) : (
        <div>
          <p>Are you sure you want to cancel your subscription?</p>
          <textarea
            placeholder="Reason for cancellation (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button onClick={handleCancel} className="confirm-cancel">
            Confirm Cancellation
          </button>
          <button onClick={() => setConfirming(false)}>
            Keep Subscription
          </button>
        </div>
      )}
    </div>
  );
};
```

## 🔄 Complete User Flow Example

### React App Structure

```jsx
// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_your_publishable_key");

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/subscribe" element={<SubscriptionFlow />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<BillingHistory />} />
        </Routes>
      </Router>
    </Elements>
  );
}
```

### Authentication Context

```jsx
// AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Verify token and get user data
      getCurrentUser().then(setUser);
      getCurrentSubscription().then((data) => setSubscription(data.data));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, subscription, setUser, setSubscription }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

## 🛡️ Error Handling Patterns

### API Error Handler

```javascript
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("authToken");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem("authToken");
        window.location.href = "/login";
        return;
      }

      if (response.status === 403 && data.message.includes("subscription")) {
        // Subscription required or limit exceeded
        showSubscriptionModal(data.message);
        return;
      }

      throw new Error(data.message || "API call failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
```

## 📱 Mobile Considerations

### Responsive Design

```css
/* Mobile-first subscription plans */
.pricing-plans {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .pricing-plans {
    grid-template-columns: repeat(3, 1fr);
  }
}

.plan-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.plan-card.recommended {
  border-color: #007bff;
  transform: scale(1.05);
}
```

### Touch-Friendly Interactions

```jsx
const MobilePricingCard = ({ plan, onSelect }) => {
  return (
    <div
      className="mobile-plan-card"
      onClick={() => onSelect(plan)}
      role="button"
      tabIndex={0}
    >
      <h3>{plan.name}</h3>
      <div className="price-display">
        <span className="currency">$</span>
        <span className="amount">{plan.price}</span>
        <span className="period">/{plan.billingCycle}</span>
      </div>

      <div className="features-summary">
        <div className="feature-item">
          <span className="icon">🏪</span>
          <span>
            {plan.maxShops} Shop{plan.maxShops > 1 ? "s" : ""}
          </span>
        </div>
        <div className="feature-item">
          <span className="icon">👥</span>
          <span>{plan.maxEmployees} Employees</span>
        </div>
      </div>

      <button className="select-btn">Choose Plan</button>
    </div>
  );
};
```

This comprehensive guide shows how the frontend integrates with your subscription system, providing a complete user experience from registration to subscription management. The API calls are structured to handle all the business logic while the frontend focuses on user experience and presentation.
