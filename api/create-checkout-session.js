import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// In-memory store (for demo - use database in production)
const subscriptions = new Map();

// Product IDs from env
const PRODUCT_IDS = {
    pro: process.env.STRIPE_PRO_PRODUCT_ID,
    premium: process.env.STRIPE_PREMIUM_PRODUCT_ID
};

// Cache for price IDs
let PRICE_IDS = {};

async function initializePrices() {
    if (Object.keys(PRICE_IDS).length > 0) return;

    for (const [plan, productId] of Object.entries(PRODUCT_IDS)) {
        if (productId) {
            try {
                const prices = await stripe.prices.list({
                    product: productId,
                    active: true,
                    limit: 1
                });
                if (prices.data.length > 0) {
                    PRICE_IDS[plan] = prices.data[0].id;
                }
            } catch (error) {
                console.error(`Error fetching price for ${plan}:`, error.message);
            }
        }
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await initializePrices();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { plan, userId, userEmail, userName } = req.body;

        if (!plan || !userId) {
            return res.status(400).json({ error: 'Plan and userId are required' });
        }

        if (!PRICE_IDS[plan]) {
            return res.status(400).json({ error: 'Invalid plan or price not found' });
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

        // Use production URL for Stripe redirects (not VERCEL_URL which changes per deployment)
        const baseUrl = process.env.PRODUCTION_URL || 'https://habit-flow-gray.vercel.app';

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
            mode: 'subscription',
            success_url: `${baseUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/subscription?canceled=true`,
            metadata: { userId, plan },
            subscription_data: { metadata: { userId, plan } }
        });

        // Store subscription reference
        subscriptions.set(userId, {
            customerId: customer.id,
            plan: plan,
            status: 'pending'
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
}
