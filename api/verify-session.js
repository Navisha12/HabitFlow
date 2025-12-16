import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    try {
        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription']
        });

        if (session.payment_status === 'paid') {
            const plan = session.metadata?.plan || 'pro';

            return res.json({
                success: true,
                plan: plan,
                customerId: session.customer,
                subscriptionId: session.subscription?.id || session.subscription,
                status: 'active'
            });
        } else {
            return res.json({
                success: false,
                plan: 'free',
                status: session.payment_status
            });
        }
    } catch (error) {
        console.error('Error retrieving session:', error);
        return res.status(500).json({ error: error.message });
    }
}
