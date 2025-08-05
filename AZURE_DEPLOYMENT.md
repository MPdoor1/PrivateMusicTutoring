# 🚀 Azure Deployment Guide

## Quick Deploy Your Music Tutoring Server

Your server is ready to deploy to Azure! Here's how:

## 1. Prerequisites

- Azure CLI installed
- Azure account with active subscription
- Your Stripe secret key ready

## 2. One-Command Deployment

```bash
# Login to Azure
az login

# Create everything at once
az group create --name music-tutoring-rg --location "East US" && \
az appservice plan create --name music-tutoring-plan --resource-group music-tutoring-rg --sku B1 --is-linux && \
az webapp create --resource-group music-tutoring-rg --plan music-tutoring-plan --name music-tutoring-payments --runtime "NODE|18-lts" && \
az webapp config appsettings set --resource-group music-tutoring-rg --name music-tutoring-payments --settings \
  STRIPE_SECRET_KEY="your_stripe_secret_key_here" \
  SENDGRID_API_KEY="your_sendgrid_key_if_you_have_one" \
  BUSINESS_EMAIL="mpdoor1@gmail.com" \
  FROM_EMAIL="mpdoor1@gmail.com" \
  NODE_ENV="production"
```

## 3. Deploy Your Code

```bash
# Set up Git deployment
az webapp deployment source config-local-git --name music-tutoring-payments --resource-group music-tutoring-rg

# Get deployment URL and credentials
az webapp deployment list-publishing-credentials --name music-tutoring-payments --resource-group music-tutoring-rg

# Add Azure as remote and push
git remote add azure https://$(az webapp deployment list-publishing-credentials --name music-tutoring-payments --resource-group music-tutoring-rg --query publishingUserName -o tsv)@music-tutoring-payments.scm.azurewebsites.net/music-tutoring-payments.git

git push azure main
```

## 4. Test Your Server

Visit: `https://music-tutoring-payments.azurewebsites.net`

You should see your website with full payment processing!

## 5. What You Get

✅ **Full Stripe Payment Processing** - Real card payments
✅ **Test Service at $1** - Perfect for testing
✅ **All Promo Codes Working** - 50% off codes active
✅ **Email Confirmations** - If SendGrid is configured
✅ **CORS Enabled** - Works with GitHub Pages frontend

## 🎯 Your Website Will Have:

1. **GitHub Pages Frontend** - Fast, free hosting
2. **Azure Backend** - Secure payment processing
3. **Stripe Integration** - Professional payment handling
4. **Email Notifications** - Customer and business confirmations

## 💡 Cost Estimate

- **Azure App Service B1**: ~$13/month
- **Stripe Processing**: 2.9% + 30¢ per transaction
- **SendGrid**: Free for 100 emails/day

## 🔧 Troubleshooting

### Server Won't Start
- Check Azure logs in portal
- Verify Stripe key is set correctly

### Payments Fail
- Ensure Stripe key starts with `sk_live_`
- Check Stripe dashboard for errors

### No Emails
- Add your SendGrid API key
- Verify sender email in SendGrid

## 🎉 You're Done!

Your music tutoring website now has:
- Professional payment processing
- Real-time booking confirmations  
- Test service for $1 (perfect for testing)
- All existing promo codes working

Students can book and pay in one seamless experience! 🎵 