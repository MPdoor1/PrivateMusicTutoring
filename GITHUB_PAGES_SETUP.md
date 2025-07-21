# GitHub Pages Setup Guide

This guide explains how to set up the Private Music Tutoring website on GitHub Pages with external services for full functionality.

## 🚀 Quick Start

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Your site will be available at: `https://yourusername.github.io/PrivateMusicTutoring`

## ⚠️ GitHub Pages Limitations

GitHub Pages only supports static websites (HTML, CSS, JavaScript). It **cannot run**:
- Node.js servers
- Database operations  
- Server-side payment processing
- Email sending from server

## 🔧 Required Service Setup

### 1. Form Handling (Required)

**Option A: FormSubmit.co (Free)**
1. Update `public/config.js`:
   ```javascript
   FORM_ACTION: 'https://formsubmit.co/your-email@gmail.com'
   ```
2. Replace `your-email@gmail.com` with your actual email
3. Form submissions will be sent to your email

**Option B: Netlify Forms (Recommended)**
1. Deploy to Netlify instead of GitHub Pages
2. Netlify automatically handles form submissions
3. Provides spam protection and notifications

### 2. Payment Processing (Required)

**Option A: Stripe Payment Links (Easiest)**
1. Create Stripe Payment Links for each service:
   - Piano Lesson ($30)
   - Guitar Lesson ($40) 
   - Violin Lesson ($35)
   - etc.
2. Update booking confirmation emails with payment links

**Option B: Client-side Stripe (Advanced)**
1. Get your Stripe Publishable Key
2. Update `public/config.js`:
   ```javascript
   STRIPE_PUBLISHABLE_KEY: 'pk_live_your_key_here'
   ```
3. Note: Limited functionality compared to server-side processing

### 3. Email Notifications (Optional)

**EmailJS Setup:**
1. Sign up at [EmailJS.com](https://www.emailjs.com/)
2. Create a service and template
3. Update `public/config.js`:
   ```javascript
   EMAILJS: {
       PUBLIC_KEY: 'your_public_key',
       SERVICE_ID: 'your_service_id', 
       TEMPLATE_ID: 'your_template_id'
   }
   ```

### 4. Calendar Integration (Optional)

**Option A: Calendly Integration**
1. Sign up for Calendly
2. Embed Calendly booking widget
3. Replace booking form with Calendly

**Option B: Google Calendar (Advanced)**
- Requires server-side implementation
- Consider Vercel/Netlify deployment instead

## 🚨 For Full Functionality

If you need:
- ✅ Server-side payment processing
- ✅ Automatic email notifications  
- ✅ Google Calendar integration
- ✅ Database storage
- ✅ Admin dashboard

**Deploy to these platforms instead:**

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Heroku
```bash
git push heroku main
```

## 📁 File Structure for GitHub Pages

```
/
├── index.html (redirects to public/)
├── public/
│   ├── index.html (main site)
│   ├── styles.css
│   ├── script.js (full functionality)
│   ├── config.js (configuration)
│   └── github-pages-booking.js (simplified booking)
├── server.js (not used on GitHub Pages)
└── package.json (not used on GitHub Pages)
```

## ⚙️ Environment Variables

For security, never commit API keys to GitHub. Instead:

1. **For Development:**
   - Create `.env` file (gitignored)
   - Add your API keys there

2. **For Production:**
   - Use platform-specific environment variables
   - Vercel: Add in dashboard
   - Netlify: Add in dashboard  
   - Heroku: Use `heroku config:set`

## 🧪 Testing

1. **Local Testing:**
   ```bash
   # Serve locally with Python
   cd public
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

2. **GitHub Pages Testing:**
   - Push changes to main branch
   - Wait 2-5 minutes for deployment
   - Visit your GitHub Pages URL

## 📞 Support

Need help setting up? The original codebase includes full server-side functionality. Consider professional deployment services for production use. 