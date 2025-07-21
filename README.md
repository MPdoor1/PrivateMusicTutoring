# Private Music Tutoring Services

Professional music tutoring services with integrated online booking and payment system.

## Features

• Responsive web design for all devices
• Professional UI/UX focused on music education
• Integrated Stripe payment processing
• Online booking system for music lessons
• Calendar integration for lesson scheduling
• Email notifications for students and instructors
• Support for multiple instruments and lesson types
• GitHub Pages deployment ready

## Services Offered

- Piano Lessons
- Guitar Lessons  
- Violin Lessons
- Drum Lessons
- Music Theory
- Performance Coaching
- Music History
- Music Technology
- Music Business

## Getting Started

### Prerequisites

• Node.js 18.0.0 or higher
• npm or yarn
• Stripe account for payment processing
• SendGrid account for email notifications
• Google Calendar API for scheduling

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MPdoor1/PrivateMusicTutoring.git
   cd PrivateMusicTutoring
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with the following variables:
   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   ```

4. Start the development server
   ```bash
   npm start
   ```

## Deployment

This application is configured for deployment on GitHub Pages with backend API functionality.

## License

This project is licensed under the ISC License. 