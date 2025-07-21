// Configuration for GitHub Pages deployment
// Since GitHub Pages doesn't support server-side functionality, we'll use external services

const CONFIG = {
    // For production, you'll need to set up these services:
    
    // Stripe Configuration (use your publishable key)
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_publishable_key_here', // Replace with your actual publishable key
    
    // EmailJS Configuration for contact forms (replace with your EmailJS credentials)
    EMAILJS: {
        PUBLIC_KEY: 'your_emailjs_public_key',
        SERVICE_ID: 'service_music_tutoring',
        TEMPLATE_ID: 'template_booking_confirmation'
    },
    
    // Netlify Forms or FormSubmit.co for form handling (alternative to server-side processing)
    FORM_ACTION: 'https://formsubmit.co/musictutoringfl@gmail.com', // Replace with your email
    
    // For advanced booking functionality, consider using:
    // - Calendly API for scheduling
    // - Stripe Payment Links for simplified payments
    // - Zapier for automation
    
    // GitHub Pages deployment note:
    // This is a client-side only version. For full functionality including:
    // - Server-side payment processing
    // - Google Calendar integration  
    // - Email automation
    // Consider deploying to Vercel, Netlify, or Heroku instead
    
    IS_GITHUB_PAGES: true
};

// Make config globally available
window.MUSIC_TUTORING_CONFIG = CONFIG; 