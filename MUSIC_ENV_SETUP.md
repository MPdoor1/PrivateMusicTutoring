# 🎵 Environment Setup Guide - Music Tutoring

## Required Environment Variables

Create a `.env` file in your project root with these values:

```bash
# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key

# SendGrid Configuration (for email notifications)  
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# Email Configuration
BUSINESS_EMAIL=mpdoor1@gmail.com
FROM_EMAIL=mpdoor1@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=production
```

## 🔑 How to Get Your API Keys:

### 1. Stripe Secret Key
1. Login to [stripe.com](https://dashboard.stripe.com)
2. Go to Developers → API Keys
3. Copy your **Secret key** (starts with `sk_live_`)

### 2. SendGrid API Key  
1. Login to [sendgrid.com](https://app.sendgrid.com)
2. Go to Settings → API Keys
3. Create new key with "Full Access"
4. Copy the key (starts with `SG.`)

## 🚀 Test Your Setup:

1. **Start server**: `npm start`
2. **Visit**: http://localhost:3000
3. **Make test booking** to verify emails work
4. **Check your inbox** for confirmation emails

Your music lesson booking system is ready! 🎼 