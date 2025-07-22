// Configuration for GitHub Pages deployment
// Since GitHub Pages doesn't support server-side functionality, we'll use external services

const CONFIG = {
    // For production, you'll need to set up these services:
    
    // Stripe Configuration (your live publishable key)
    STRIPE_PUBLISHABLE_KEY: 'pk_live_51RknYjGpt03TMvPV64qnnRVkH5GHluzHm6JINV4wFsdWkC5ur0ccsBN37JVA7LkLfmBOPe1Ts43mxxQ66VXxEwLY004cVijecC', // Your live key
    
    // EmailJS Configuration for contact forms (replace with your EmailJS credentials)
    EMAILJS: {
        PUBLIC_KEY: 'your_emailjs_public_key',
        SERVICE_ID: 'service_music_tutoring',
        TEMPLATE_ID: 'template_booking_confirmation'
    },
    
    // FormSubmit Configuration - Multiple options for reliability
    FORM_ACTION: 'https://formsubmit.co/mpdoor1@gmail.com', // Primary form handler
    FORM_BACKUP: 'https://getform.io/f/your-form-id', // Backup option (sign up at getform.io)
    
    // FormSubmit Hidden Fields for better functionality
    FORM_CONFIG: {
        '_subject': '🎵 New Music Lesson Booking Request',
        '_captcha': 'false',
        '_template': 'table',
        '_next': 'https://mpdoor1.github.io/PrivateMusicTutoring#booking-success',
        '_cc': 'mpdoor1@gmail.com', // CC to ensure you get a copy
        '_autoresponse': 'Thank you for your music lesson booking request! We will contact you within 2 hours to confirm your lesson and send payment details.'
    },
    
    // Alternative Services (if you want to switch later)
    ALTERNATIVES: {
        // Netlify Forms (if you deploy to Netlify instead)
        netlify: 'Built-in form handling',
        
        // Zapier Email (webhook approach)
        zapier: 'https://hooks.zapier.com/hooks/catch/your-webhook-id',
        
        // EmailJS (client-side email sending)
        emailjs_service: 'service_music_tutoring'
    },
    
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