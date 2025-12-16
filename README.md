# HabitFlow - Habit & Task Tracker

A modern, feature-rich web application for tracking habits and tasks with user authentication and Stripe subscription management.

![HabitFlow](https://via.placeholder.com/800x400/1a1a25/6366f1?text=HabitFlow)

## Features

- ✅ **User Authentication** - Sign up, sign in, and session management
- 📊 **Habit Tracking** - Create habits, track daily completions, streak counting
- ✏️ **Task Management** - Create tasks with priorities and due dates
- 💳 **Stripe Subscriptions** - Real payment processing with checkout and billing portal
- 🌙 **Premium Dark UI** - Modern, responsive design with animations
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM
- **Styling**: Custom CSS with design tokens
- **Payments**: Stripe Checkout + Customer Portal
- **Backend**: Express.js
- **Icons**: Lucide React

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Stripe

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Create two subscription products/prices:
   - **Pro Plan**: $9/month
   - **Premium Plan**: $19/month

### 3. Configure Environment Variables

Copy the example env file and add your Stripe keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual keys:

```env
# Frontend (safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend (keep secret!)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Price IDs from Stripe Dashboard
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxx

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 4. Set Up Stripe Webhook (for local development)

Install the Stripe CLI and forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3001/api/webhook
```

Copy the webhook signing secret and add it to your `.env` file.

### 5. Run the Application

Start both frontend and backend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

### 6. Open the App

Navigate to [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/create-checkout-session` | Create Stripe checkout session |
| POST | `/api/create-portal-session` | Open Stripe billing portal |
| GET | `/api/subscription/:userId` | Get subscription status |
| POST | `/api/cancel-subscription` | Cancel subscription |
| POST | `/api/webhook` | Stripe webhook handler |
| GET | `/api/health` | Health check |

## Subscription Tiers

| Feature | Free | Pro ($9/mo) | Premium ($19/mo) |
|---------|------|-------------|------------------|
| Habits | 5 | 20 | Unlimited |
| Tasks | 10 | 50 | Unlimited |
| Streaks | ✓ | ✓ | ✓ |
| Priority Tags | ✗ | ✓ | ✓ |
| Analytics | ✗ | Basic | Advanced |
| Data Export | ✗ | ✗ | ✓ |

## Project Structure

```
├── server/
│   └── index.js          # Express backend with Stripe
├── src/
│   ├── components/
│   │   └── Layout.jsx    # App layout with navigation
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── HabitContext.jsx
│   │   └── TaskContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Habits.jsx
│   │   ├── Tasks.jsx
│   │   └── Subscription.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── package.json
└── vite.config.js
```

## Production Deployment

1. Build the frontend: `npm run build`
2. Deploy the Express server with environment variables
3. Set up Stripe webhooks pointing to your production URL
4. Use a real database (PostgreSQL, MongoDB) instead of in-memory storage

## License

MIT
