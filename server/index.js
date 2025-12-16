import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Product IDs from Stripe Dashboard
const PRODUCT_IDS = {
    pro: process.env.STRIPE_PRO_PRODUCT_ID,
    premium: process.env.STRIPE_PREMIUM_PRODUCT_ID
};

// Cache for price IDs (fetched from products)
let PRICE_IDS = {};

// Function to fetch price IDs from product IDs
async function initializePrices() {
    try {
        for (const [plan, productId] of Object.entries(PRODUCT_IDS)) {
            if (productId) {
                const prices = await stripe.prices.list({
                    product: productId,
                    active: true,
                    limit: 1
                });
                if (prices.data.length > 0) {
                    PRICE_IDS[plan] = prices.data[0].id;
                    console.log(`✅ Found price for ${plan}: ${PRICE_IDS[plan]}`);
                } else {
                    console.log(`⚠️  No active price found for ${plan} (${productId})`);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching prices:', error.message);
    }
}

// In-memory store for subscriptions (replace with database in production)
const subscriptions = new Map();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Webhook endpoint needs raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const plan = session.metadata.plan;

            // Store subscription info
            subscriptions.set(userId, {
                customerId: session.customer,
                subscriptionId: session.subscription,
                plan: plan,
                status: 'active',
                updatedAt: new Date().toISOString()
            });

            console.log(`✅ Subscription activated for user ${userId}: ${plan}`);
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            // Find user by customer ID and update their status
            for (const [userId, sub] of subscriptions.entries()) {
                if (sub.customerId === subscription.customer) {
                    sub.status = subscription.status;
                    sub.updatedAt = new Date().toISOString();
                    console.log(`📝 Subscription updated for user ${userId}: ${subscription.status}`);
                }
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            // Find user by customer ID and downgrade to free
            for (const [userId, sub] of subscriptions.entries()) {
                if (sub.customerId === subscription.customer) {
                    sub.plan = 'free';
                    sub.status = 'canceled';
                    sub.updatedAt = new Date().toISOString();
                    console.log(`❌ Subscription canceled for user ${userId}`);
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.log(`⚠️ Payment failed for customer ${invoice.customer}`);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// Regular JSON parsing for other routes
app.use(express.json());

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { plan, userId, userEmail, userName } = req.body;

        if (!plan || !userId) {
            return res.status(400).json({ error: 'Plan and userId are required' });
        }

        if (!PRICE_IDS[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Create or retrieve customer
        let customer;
        const existingSub = subscriptions.get(userId);

        if (existingSub?.customerId) {
            customer = await stripe.customers.retrieve(existingSub.customerId);
        } else {
            customer = await stripe.customers.create({
                email: userEmail,
                name: userName,
                metadata: { userId }
            });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICE_IDS[plan],
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription?canceled=true`,
            metadata: {
                userId,
                plan
            },
            subscription_data: {
                metadata: {
                    userId,
                    plan
                }
            }
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Customer Portal Session (for managing subscriptions)
app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { userId } = req.body;

        const sub = subscriptions.get(userId);
        if (!sub?.customerId) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: sub.customerId,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription`
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription status
app.get('/api/subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const sub = subscriptions.get(userId);

        if (!sub) {
            return res.json({ plan: 'free', status: null });
        }

        // Verify with Stripe if we have a subscription ID
        if (sub.subscriptionId) {
            try {
                const stripeSub = await stripe.subscriptions.retrieve(sub.subscriptionId);
                sub.status = stripeSub.status;

                // If subscription is not active, return free plan
                if (stripeSub.status !== 'active') {
                    return res.json({ plan: 'free', status: stripeSub.status });
                }
            } catch (err) {
                // Subscription doesn't exist anymore
                return res.json({ plan: 'free', status: 'none' });
            }
        }

        res.json({
            plan: sub.plan,
            status: sub.status,
            customerId: sub.customerId
        });
    } catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel subscription
app.post('/api/cancel-subscription', async (req, res) => {
    try {
        const { userId } = req.body;
        const sub = subscriptions.get(userId);

        if (!sub?.subscriptionId) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        // Cancel at period end (gives user time until billing cycle ends)
        const canceled = await stripe.subscriptions.update(sub.subscriptionId, {
            cancel_at_period_end: true
        });

        res.json({
            success: true,
            message: 'Subscription will be canceled at the end of the billing period',
            cancelAt: canceled.cancel_at
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        stripe: !!process.env.STRIPE_SECRET_KEY,
        prices: PRICE_IDS,
        timestamp: new Date().toISOString()
    });
});

// Start server
async function startServer() {
    // Initialize prices from product IDs
    await initializePrices();

    app.listen(PORT, () => {
        console.log(`
🚀 HabitFlow API Server running on http://localhost:${PORT}

📋 Available endpoints:
   POST /api/create-checkout-session - Create Stripe checkout
   POST /api/create-portal-session   - Open billing portal
   GET  /api/subscription/:userId    - Get subscription status
   POST /api/cancel-subscription     - Cancel subscription
   POST /api/webhook                 - Stripe webhook handler
   GET  /api/health                  - Server health check

${process.env.STRIPE_SECRET_KEY ? '✅ Stripe configured' : '⚠️  STRIPE_SECRET_KEY not set - payments will fail'}
${Object.keys(PRICE_IDS).length > 0 ? '✅ Prices loaded: ' + Object.keys(PRICE_IDS).join(', ') : '⚠️  No prices loaded - check product IDs'}
    `);
    });
}

startServer();
