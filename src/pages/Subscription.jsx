import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Check, X, Sparkles, Zap, Crown, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Use relative URL for Vercel, or localhost for development
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        period: '/forever',
        description: 'Perfect for getting started',
        features: [
            { text: 'Up to 5 habits', included: true },
            { text: 'Up to 10 active tasks', included: true },
            { text: 'Streak tracking', included: true },
            { text: 'Dark mode', included: true },
            { text: 'Priority tags', included: false },
            { text: 'Analytics dashboard', included: false },
            { text: 'Export data', included: false }
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$9',
        period: '/month',
        description: 'For productivity enthusiasts',
        featured: true,
        features: [
            { text: 'Up to 20 habits', included: true },
            { text: 'Up to 50 active tasks', included: true },
            { text: 'Streak tracking', included: true },
            { text: 'Dark mode', included: true },
            { text: 'Priority tags', included: true },
            { text: 'Basic analytics', included: true },
            { text: 'Export data', included: false }
        ]
    },
    {
        id: 'premium',
        name: 'Premium',
        price: '$19',
        period: '/month',
        description: 'Unlimited power user access',
        features: [
            { text: 'Unlimited habits', included: true },
            { text: 'Unlimited tasks', included: true },
            { text: 'Streak tracking', included: true },
            { text: 'Dark mode', included: true },
            { text: 'Priority tags', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'Export data', included: true }
        ]
    }
];

export default function Subscription() {
    const { user, updatePlan } = useAuth();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [message, setMessage] = useState(null);

    // Check for success/cancel from Stripe redirect
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setMessage({ type: 'success', text: 'Payment successful! Your subscription is now active.' });
            // Refresh subscription status
            fetchSubscription();
        } else if (searchParams.get('canceled') === 'true') {
            setMessage({ type: 'error', text: 'Payment was canceled. You can try again anytime.' });
        }
    }, [searchParams]);

    // Fetch current subscription status
    const fetchSubscription = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_URL}/api/subscription/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
                if (data.plan && data.plan !== user.plan) {
                    updatePlan(data.plan);
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [user?.id]);

    const handleSubscribe = async (planId) => {
        if (planId === 'free' || planId === user?.plan) return;

        setLoadingPlan(planId);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: planId,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name
                })
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/create-portal-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to open billing portal');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (planId) => {
        switch (planId) {
            case 'premium': return <Crown size={32} />;
            case 'pro': return <Zap size={32} />;
            default: return <Sparkles size={32} />;
        }
    };

    const currentPlan = subscription?.plan || user?.plan || 'free';

    return (
        <div className="fade-in">
            <div className="page-header" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
                <h1 className="page-title">Choose Your Plan</h1>
                <p className="page-subtitle">
                    Unlock more features to supercharge your productivity
                </p>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '16px 24px',
                    background: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                    borderRadius: 'var(--radius-lg)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                    marginBottom: '32px',
                    maxWidth: '600px',
                    margin: '0 auto 32px'
                }}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="pricing-grid">
                {PLANS.map(plan => (
                    <div
                        key={plan.id}
                        className={`pricing-card ${plan.featured ? 'featured' : ''}`}
                    >
                        {plan.featured && (
                            <div className="pricing-badge">Most Popular</div>
                        )}

                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-lg)',
                            background: plan.featured ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: plan.featured ? 'white' : 'var(--accent-primary)'
                        }}>
                            {getIcon(plan.id)}
                        </div>

                        <h3 className="pricing-plan">{plan.name}</h3>
                        <div className="pricing-price">
                            {plan.price}
                            <span>{plan.period}</span>
                        </div>
                        <p className="pricing-description">{plan.description}</p>

                        <ul className="pricing-features">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className={feature.included ? '' : 'disabled'}>
                                    {feature.included ? (
                                        <Check size={18} />
                                    ) : (
                                        <X size={18} />
                                    )}
                                    {feature.text}
                                </li>
                            ))}
                        </ul>

                        {currentPlan === plan.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="current-plan-badge">
                                    <Check size={16} /> Current Plan
                                </div>
                                {plan.id !== 'free' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleManageSubscription}
                                        disabled={loading}
                                        style={{ width: '100%' }}
                                    >
                                        {loading ? (
                                            <><Loader2 size={16} className="spin" /> Loading...</>
                                        ) : (
                                            <><ExternalLink size={16} /> Manage Subscription</>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : plan.id === 'free' ? (
                            <button
                                className="btn btn-secondary btn-lg"
                                style={{ width: '100%' }}
                                disabled
                            >
                                Free Forever
                            </button>
                        ) : (
                            <button
                                className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                                style={{ width: '100%' }}
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loadingPlan === plan.id}
                            >
                                {loadingPlan === plan.id ? (
                                    <><Loader2 size={16} className="spin" /> Processing...</>
                                ) : (
                                    <>Upgrade to {plan.name}</>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Payment Security Info */}
            <div style={{
                textAlign: 'center',
                marginTop: '48px',
                padding: '24px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '600px',
                margin: '48px auto 0'
            }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                    🔒 Secure payments powered by Stripe
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Your payment information is encrypted and never stored on our servers.
                    <br />Cancel anytime from your billing portal.
                </p>
            </div>

            <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
