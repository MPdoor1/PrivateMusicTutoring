# 🚀 Azure Deployment Guide

## Quick Deploy Your Music Tutoring Server

Your server is ready to deploy to Azure! Here's how:

## 1. Prerequisites

- Azure CLI installed
- Azure account with active subscription
- Your Stripe secret key ready
- SendGrid API key ready

## 2. One-Command Deployment

```bash
# Login to Azure
az login

# Create everything at once
az group create --name music-tutoring-rg --location "East US" && \
az appservice plan create --name music-tutoring-plan --resource-group music-tutoring-rg --sku B1 --is-linux && \
az webapp create --resource-group music-tutoring-rg --plan music-tutoring-plan --name music-tutoring-payments-free --runtime "NODE|18-lts" && \
az webapp config appsettings set --resource-group music-tutoring-rg --name music-tutoring-payments-free --settings \
  STRIPE_SECRET_KEY="your_stripe_secret_key_here" \
  SENDGRID_API_KEY="your_sendgrid_api_key_here" \
  SENDGRID_FROM_EMAIL="mpdoor1@gmail.com" \
  BUSINESS_EMAIL="mpdoor1@gmail.com" \
  FROM_EMAIL="mpdoor1@gmail.com" \
  NODE_ENV="production"
```

## 3. Setup GitHub Actions for Automatic Deployment

### Get Azure Publish Profile
```bash
# Get the publish profile for GitHub Actions
az webapp deployment list-publishing-profiles --name music-tutoring-payments-free --resource-group music-tutoring-rg --xml
```

### Add GitHub Secret
1. Copy the entire XML output from the command above
2. Go to your GitHub repository → Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the XML content
6. Click "Add secret"

### Test Automatic Deployment
```bash
# Make a small change and push to trigger deployment
git add .
git commit -m "Test automatic deployment to Azure"
git push origin main
```

## 4. Manual Git Deployment (Alternative)

```bash
# Set up Git deployment
az webapp deployment source config-local-git --name music-tutoring-payments-free --resource-group music-tutoring-rg

# Get deployment URL and credentials
az webapp deployment list-publishing-credentials --name music-tutoring-payments-free --resource-group music-tutoring-rg

# Add Azure as remote and push
git remote add azure https://$(az webapp deployment list-publishing-credentials --name music-tutoring-payments-free --resource-group music-tutoring-rg --query publishingUserName -o tsv)@music-tutoring-payments-free.scm.azurewebsites.net/music-tutoring-payments-free.git

git push azure main
```

## 5. Test Your Server

Visit: `https://music-tutoring-payments-free.azurewebsites.net`

You should see your website with full payment processing!

## 6. What You Get

✅ **Full Stripe Payment Processing** - Real card payments
✅ **Test Service at $1** - Perfect for testing
✅ **All Promo Codes Working** - 50% off codes active
✅ **Email Confirmations** - SendGrid integration
✅ **CORS Enabled** - Works with GitHub Pages frontend
✅ **Automatic Deployment** - GitHub Actions integration

## 🎯 Your Website Architecture:

1. **GitHub Pages Frontend** - Fast, free hosting at https://mpdoor1.github.io/PrivateMusicTutoring
2. **Azure Backend** - Secure payment processing at https://music-tutoring-payments-free.azurewebsites.net
3. **Stripe Integration** - Professional payment handling
4. **SendGrid Email** - Automated notifications
5. **GitHub Actions** - Automatic deployment on push

## 💡 Cost Estimate

- **Azure App Service B1**: ~$13/month
- **Stripe Processing**: 2.9% + 30¢ per transaction
- **SendGrid**: Free for 100 emails/day
- **GitHub Actions**: Free for public repositories

## 🔧 Troubleshooting

### Server Won't Start
- Check Azure logs in portal
- Verify Stripe key is set correctly
- Ensure Node.js version is 18+

### Payments Fail
- Ensure Stripe key starts with `sk_live_` or `sk_test_`
- Check Stripe dashboard for errors
- Verify CORS settings allow your domain

### No Emails
- Add your SendGrid API key to Azure app settings
- Verify sender email in SendGrid
- Check SendGrid activity logs

### GitHub Actions Fail
- Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret is set correctly
- Check that the app name matches in the workflow file
- Ensure Azure resource group and app service exist

## 🎉 You're Done!

Your music tutoring website now has:
- Professional payment processing
- Real-time booking confirmations  
- Test service for $1 (perfect for testing)
- All existing promo codes working
- Automatic deployment from GitHub

Students can book and pay in one seamless experience! 🎵 