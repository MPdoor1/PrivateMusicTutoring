// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
const { google } = require('googleapis');
// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables. Payments will fail.');
} else if (!stripeSecretKey.startsWith('sk_')) {
  console.warn('⚠️  STRIPE_SECRET_KEY does not start with "sk_" - this may cause payment processing to fail.');
} else {
  console.log('✅ Stripe API key configured successfully');
}
const stripe = require('stripe')(stripeSecretKey);
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Jacksonville, FL timezone handling - Fixed timezone conversion
// Simple, reliable timezone formatting functions for Jacksonville, FL (Eastern Time)
const formatDateTimeForJacksonville = (dateString, timeString) => {
  try {
    const formattedDate = formatDateForJacksonville(dateString);
    const formattedTime = formatTimeForJacksonville(timeString);
    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return `${dateString} at ${timeString} ET`;
  }
};

const formatDateForJacksonville = (dateString) => {
  try {
    let year, month, day;
    
    if (dateString.includes(',')) {
      // Handle "Thursday, July 17, 2025" format
      const tempDate = new Date(dateString + ' 12:00:00 GMT-0500'); // Force EST interpretation
      year = tempDate.getUTCFullYear();
      month = tempDate.getUTCMonth() + 1;
      day = tempDate.getUTCDate();
    } else {
      // Handle "YYYY-MM-DD" format
      [year, month, day] = dateString.split('-').map(Number);
    }
    
    // Create a date and format it
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const formatTimeForJacksonville = (timeString) => {
  try {
    // Parse time (input should already be in Eastern Time)
    const [time, period] = timeString.includes('M') ? timeString.split(' ') : [timeString, null];
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    // Convert to 12-hour format
    let displayHour = hour24;
    let displayPeriod = 'AM';
    
    if (hour24 === 0) {
      displayHour = 12;
      displayPeriod = 'AM';
    } else if (hour24 === 12) {
      displayHour = 12;
      displayPeriod = 'PM';
    } else if (hour24 > 12) {
      displayHour = hour24 - 12;
      displayPeriod = 'PM';
    } else {
      displayHour = hour24;
      displayPeriod = 'AM';
    }
    
    const formattedMinutes = (minutes || 0).toString().padStart(2, '0');
    
    // Determine EST vs EDT based on current date
    // This is a simple approximation - DST typically runs March-November
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const isLikelyDST = (currentMonth >= 3 && currentMonth <= 11);
    const timeZoneAbbr = isLikelyDST ? 'EDT' : 'EST';
    
    return `${displayHour}:${formattedMinutes} ${displayPeriod} ${timeZoneAbbr}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString + ' ET';
  }
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) {
  console.warn('⚠️  SENDGRID_API_KEY not found in environment variables. Email notifications will fail.');
} else if (!sendGridApiKey.startsWith('SG.')) {
  console.warn('⚠️  SENDGRID_API_KEY does not start with "SG." - this may cause email sending to fail.');
} else {
  console.log('✅ SendGrid API key configured successfully');
}
sgMail.setApiKey(sendGridApiKey);

// Proof API configuration
const PROOF_API_BASE_URL = 'https://api.proof.com/v1';
const proofApiKey = process.env.PROOF_API_KEY;
if (!proofApiKey) {
  console.warn('⚠️  PROOF_API_KEY not found in environment variables. Proof.com integration will use fallback links.');
} else {
  console.log('✅ Proof API key configured successfully');
}
const PROOF_API_HEADERS = {
  'ApiKey': proofApiKey,
  'Content-Type': 'application/json'
};

// Google Calendar configuration
const googleCalendarClientId = process.env.GOOGLE_CLIENT_ID;
const googleCalendarClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCalendarRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const googleCalendarEmail = 'mpdoor1@gmail.com';

if (!googleCalendarClientId || !googleCalendarClientSecret || !googleCalendarRefreshToken) {
  console.warn('⚠️  Google Calendar credentials not found. Calendar integration will be disabled.');
} else {
  console.log('✅ Google Calendar integration configured successfully');
}

// Google Calendar helper functions
const addToGoogleCalendar = async (bookingData) => {
  if (!googleCalendarClientId || !googleCalendarClientSecret || !googleCalendarRefreshToken) {
    console.log('Google Calendar credentials not available, skipping calendar event creation');
    return null;
  }

  try {
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      googleCalendarClientId,
      googleCalendarClientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: googleCalendarRefreshToken
    });

    // Create calendar instance
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse appointment date and time - Handle EST timezone correctly
    let appointmentDateTime;
    
    if (bookingData.appointment_date.includes(',')) {
      // Handle "Thursday, July 17, 2025" format
      appointmentDateTime = new Date(bookingData.appointment_date);
    } else {
      // Handle "YYYY-MM-DD" format
      const [year, month, day] = bookingData.appointment_date.split('-').map(Number);
      appointmentDateTime = new Date(year, month - 1, day);
    }
    
    const [time, period] = bookingData.appointment_time.includes('M') ? 
      bookingData.appointment_time.split(' ') : [bookingData.appointment_time, null];
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    // Set time on the date - ensure it's interpreted as EST
    appointmentDateTime.setHours(hour24, minutes || 0, 0, 0);
    
    // Create a proper EST date by formatting the date/time in EST and then parsing it
    const estDateString = appointmentDateTime.toLocaleDateString('en-CA', {timeZone: 'America/New_York'});
    const estTimeString = appointmentDateTime.toLocaleTimeString('en-GB', {timeZone: 'America/New_York', hour12: false});
    const estISOString = `${estDateString}T${estTimeString}`;
    
    // Create the final EST datetime
    const estDateTime = new Date(estISOString);
    const endDateTime = new Date(estDateTime.getTime() + (60 * 60 * 1000)); // 1 hour duration

    // Create event
    const event = {
      summary: `${bookingData.service_name} - ${bookingData.client_name}`,
      description: `Music Lesson Appointment
      
Client: ${bookingData.client_name}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Service: ${bookingData.service_name}
Booking ID: ${bookingData.booking_id}
Special Requests: ${bookingData.special_requests || 'None'}

This is a music lesson conducted online or in-person.`,
      start: {
        dateTime: estDateTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York'
      },
      attendees: [
        {
          email: googleCalendarEmail,
          responseStatus: 'accepted'
        },
        {
          email: bookingData.email,
          responseStatus: 'needsAction'
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    console.log('📅 Calendar event created:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create calendar event:', error.message);
    return null;
  }
};

// Proof API helper functions
// Function to parse multiple email addresses
const parseEmailAddresses = (emailString) => {
  return emailString
    .split(/[,\n]/)
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

const createProofMusicLesson = async (bookingData) => {
  try {
    console.log('Creating Proof transaction with API key:', process.env.PROOF_API_KEY ? 'API key present' : 'NO API KEY');
    
    // Split the client name into first and last name
    const nameParts = bookingData.client_name.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    
    // Parse multiple email addresses
    const emails = parseEmailAddresses(bookingData.email);
    console.log('Parsed email addresses:', emails);
    
    // Parse the appointment date and time to create ISO date for activation
    // Handle EST timezone correctly without double conversion
    let appointmentDateTime;
    
    if (bookingData.appointment_date.includes(',')) {
      // Handle "Thursday, July 17, 2025" format
      appointmentDateTime = new Date(bookingData.appointment_date);
    } else {
      // Handle "YYYY-MM-DD" format
      const [year, month, day] = bookingData.appointment_date.split('-').map(Number);
      appointmentDateTime = new Date(year, month - 1, day);
    }
    
    const [time, period] = bookingData.appointment_time.includes('M') ? 
      bookingData.appointment_time.split(' ') : [bookingData.appointment_time, null];
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    // Set time on the date - ensure proper EST timezone handling
    appointmentDateTime.setHours(hour24, minutes || 0, 0, 0);
    
    // Create a proper EST date by formatting the date/time in EST and then parsing it
    const estDateString = appointmentDateTime.toLocaleDateString('en-CA', {timeZone: 'America/New_York'});
    const estTimeString = appointmentDateTime.toLocaleTimeString('en-GB', {timeZone: 'America/New_York', hour12: false});
    const estISOString = `${estDateString}T${estTimeString}`;
    
    // Create the final EST datetime
    const estDateTime = new Date(estISOString);
    const activationTime = estDateTime.toISOString();
    
    // Set expiration to 2 hours after appointment time
    const expirationDateTime = new Date(estDateTime.getTime() + (2 * 60 * 60 * 1000));
    const expirationTime = expirationDateTime.toISOString();

    // Create signers for each email address
    const signers = emails.map((email, index) => ({
      email: email,
      first_name: index === 0 ? firstName : `${firstName} (${index + 1})`,
      last_name: lastName
    }));

    const transactionData = {
      signers: signers,
      documents: [
        {
          resource: "https://static.notarize.com/Example.pdf",
          requirement: "musiclesson"
        }
      ],
      transaction_name: `${bookingData.service_name} - ${bookingData.booking_id}`,
      external_id: bookingData.booking_id,
      require_secondary_photo_id: false, // Not required for music lessons
      activation_time: activationTime, // When the meeting becomes available
      expiration_time: expirationTime, // When the meeting expires
      suppress_email: false, // Allow Proof to send document upload email to client
      draft: false, // Create as active - client will upload their own documents to replace placeholder
      message_to_signer: `Your live notary appointment is scheduled for ${bookingData.appointment_date} at ${bookingData.appointment_time}. 

IMPORTANT: You must upload your documents before the meeting. Use the link provided to upload the documents you need notarized.

You will meet with a licensed notary via video call. Please have your valid government-issued photo ID ready. The meeting link will become active 15 minutes before your scheduled time.

For technical support, contact mpdoor1@gmail.com`,
      message_signature: "Music Tutoring FL - Professional Music Lessons"
    };

    console.log('Proof transaction data:', JSON.stringify(transactionData, null, 2));
    console.log('Proof API URL:', `${PROOF_API_BASE_URL}/transactions`);
    console.log('Proof API Headers:', PROOF_API_HEADERS);

    const response = await axios.post(`${PROOF_API_BASE_URL}/transactions`, transactionData, {
      headers: PROOF_API_HEADERS
    });

    console.log('Proof API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating Proof transaction:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    throw error;
  }
};

const getProofMeetingLink = async (transactionId) => {
  try {
    const response = await axios.get(`${PROOF_API_BASE_URL}/transactions/${transactionId}`, {
      headers: PROOF_API_HEADERS
    });

    // Extract meeting link from transaction data
    const transaction = response.data;
    console.log('Transaction response:', JSON.stringify(transaction, null, 2));
    
    // Check for transaction access link in signer_info
    const meetingLink = transaction.signer_info?.transaction_access_link || 
                       transaction.signing_url || 
                       transaction.notarization_url ||
                       `https://app.proof.com/transaction/${transactionId}`;

    console.log('Extracted meeting link:', meetingLink);
    return meetingLink;
  } catch (error) {
    console.error('Error getting Proof meeting link:', error.response?.data || error.message);
    throw error;
  }
};

// Email templates

const createBusinessNotificationEmail = (bookingData, meetingLink = null) => {
  // Format the appointment date and time for Jacksonville, FL timezone
  const formattedDateTime = formatDateTimeForJacksonville(bookingData.appointment_date, bookingData.appointment_time);
  const formattedDate = formatDateForJacksonville(bookingData.appointment_date);
  const formattedTime = formatTimeForJacksonville(bookingData.appointment_time);
  const cleanDateTime = `${formattedDate} at ${formattedTime}`;
  
  return {
            to: 'mpdoor1@gmail.com', // Send to Gmail only (single email)
    from: 'mpdoor1@gmail.com',
    replyTo: 'mpdoor1@gmail.com',
    subject: `🎵 NEW MUSIC LESSON BOOKING - ${bookingData.client_name} - ${bookingData.booking_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #C56C3A; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0;">🎵 NEW MUSIC LESSON BOOKING!</h2>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Someone just scheduled a music lesson with you</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #C56C3A; margin-top: 0;">📋 LESSON DETAILS</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin: 10px 0;"><strong>🎓 Student:</strong> ${bookingData.client_name}</li>
              <li style="margin: 10px 0;"><strong>📧 Email:</strong> ${bookingData.email}</li>
              <li style="margin: 10px 0;"><strong>📞 Phone:</strong> ${bookingData.phone || 'Not provided'}</li>
              <li style="margin: 10px 0;"><strong>📅 Date & Time:</strong> ${cleanDateTime}</li>
              <li style="margin: 10px 0;"><strong>🎵 Lesson Type:</strong> ${bookingData.service_name}</li>
              <li style="margin: 10px 0;"><strong>💰 Price:</strong> $${bookingData.price} (PAID)</li>
              <li style="margin: 10px 0;"><strong>📍 Location/Instrument:</strong> ${bookingData.special_requests || 'Not specified'}</li>
              <li style="margin: 10px 0;"><strong>🆔 Booking ID:</strong> ${bookingData.booking_id}</li>
            </ul>
          </div>
          
          ${bookingData.special_requests ? `
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800;">
            <h4 style="color: #f57c00; margin: 0 0 10px 0;">📝 Special Requests:</h4>
            <p style="margin: 0; font-style: italic;">${bookingData.special_requests}</p>
          </div>
          ` : ''}
          
          ${meetingLink ? `
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
            <h4 style="color: #2e7d32; margin: 0 0 10px 0;">🎥 Meeting Link Ready NOW!</h4>
            <a href="${meetingLink}" style="display: inline-block; background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Meeting</a>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0;">⏰ Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Student will receive their confirmation email automatically</li>
              <li>For online lessons: Use WhatsApp video call (904-607-3835)</li>
              <li>For travelling lessons: Go to student's location</li>
              <li>Have your teaching materials ready</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #6c757d; font-size: 14px;">
              Booking confirmed at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `
  };
};

const createBookingConfirmationEmail = (bookingData, meetingLink = null, isBusinessCopy = false) => {
  // Format the appointment date and time for Jacksonville, FL timezone
  const formattedDateTime = formatDateTimeForJacksonville(bookingData.appointment_date, bookingData.appointment_time);
  const formattedDate = formatDateForJacksonville(bookingData.appointment_date);
  const formattedTime = formatTimeForJacksonville(bookingData.appointment_time);
  
  // Create a cleaner time display for emails
  const cleanDateTime = `${formattedDate} at ${formattedTime}`;
  
  console.log('Email formatting:', {
    original_date: bookingData.appointment_date,
    original_time: bookingData.appointment_time,
    formatted_date: formattedDate,
    formatted_time: formattedTime,
    clean_datetime: cleanDateTime
  });
  
  // Music lessons don't need meeting links like notary services
  const contactSection = `
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #C56C3A; margin-top: 0;">📞 CONTACT INFORMATION</h3>
          <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #C56C3A;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #C56C3A;">📅 Your lesson is scheduled for ${cleanDateTime}</p>
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
              <strong>📞 Call/Text:</strong> (904) 607-3835<br>
              <strong>📧 Email:</strong> mpdoor1@gmail.com<br>
              <strong>📱 WhatsApp Video:</strong> For online lessons
            </p>
          </div>
        </div>
  `;

  const recipient = bookingData.email; // Always send to student
  
  return {
    to: recipient,
    from: 'mpdoor1@gmail.com',
    replyTo: 'mpdoor1@gmail.com',
    subject: `🎵 Music Lesson Confirmed - ${bookingData.service_name} - ${bookingData.booking_id}`,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    },
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C56C3A;">🎵 Music Lesson Confirmed!</h2>
        
        <p>Dear ${bookingData.client_name},</p>
        
        <p>Your ${bookingData.service_name.toLowerCase()} has been successfully scheduled and paid for!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #C56C3A; margin-top: 0;">📅 LESSON DETAILS</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Date & Time:</strong> ${cleanDateTime}</li>
            <li><strong>Lesson Type:</strong> ${bookingData.service_name}</li>
            <li><strong>Price:</strong> $${bookingData.price} (PAID)</li>
            <li><strong>Location/Instrument:</strong> ${bookingData.special_requests || 'Not specified'}</li>
            <li><strong>Booking ID:</strong> ${bookingData.booking_id}</li>
          </ul>
        </div>
        
        ${contactSection}
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C56C3A;">
          <h3 style="color: #C56C3A; margin-top: 0;">🎼 LESSON PREPARATION</h3>
          <p><strong>Please prepare for your music lesson:</strong></p>
          <ul>
            <li><strong>Have your instrument ready</strong> (tuned and accessible)</li>
            <li><strong>Prepare practice space</strong> with good lighting and minimal distractions</li>
            <li><strong>For online lessons:</strong> Ensure stable internet and WhatsApp access</li>
            <li><strong>For travelling lessons:</strong> Have your address/location ready to share</li>
            <li><strong>Bring any music books</strong> or materials you'd like to work on</li>
          </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">📋 NEXT STEPS</h3>
          <ul>
            <li>✅ <strong>Payment of $${bookingData.price} has been processed successfully</strong></li>
            <li>🎵 <strong>Your 30-minute private music lesson is confirmed</strong></li>
            <li>📞 <strong>I will contact you via phone/WhatsApp before your lesson</strong></li>
            <li>⏰ <strong>Please be ready 5 minutes before your scheduled time</strong></li>
            <li>🎼 <strong>Have your instrument and any music materials ready</strong></li>
            <li>📱 <strong>For online lessons: WhatsApp video call at (904) 607-3835</strong></li>
          </ul>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>📞 YOUR CONTACT INFO:</strong></p>
          <p>Phone: ${bookingData.phone || 'Not provided'}<br>
          ${bookingData.special_requests ? `Location/Instrument: ${bookingData.special_requests}` : ''}</p>
        </div>
        
        <p>If you need to reschedule or have questions, please call/text me at (904) 607-3835 or email mpdoor1@gmail.com.</p>
        
        <p>Looking forward to making music with you!<br>
        <strong>Private Music Tutoring Services</strong><br>
        Jacksonville, FL</p>
      </div>
    `
  };
};

const createMeetingLinkEmail = (bookingData, meetingLink) => {
  // Format the appointment date and time for Jacksonville, FL timezone
  const formattedDateTime = formatDateTimeForJacksonville(bookingData.appointment_date, bookingData.appointment_time);
  const formattedDate = formatDateForJacksonville(bookingData.appointment_date);
  const formattedTime = formatTimeForJacksonville(bookingData.appointment_time);
  const cleanDateTime = `${formattedDate} at ${formattedTime}`;
  
  return {
            to: [bookingData.email, 'mpdoor1@gmail.com'], // Send to client and Gmail only
    from: 'musictutoringfl@musictutoringfl.com',
    subject: `🔗 Your Music Lesson Meeting Link - ${bookingData.booking_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Your Meeting Link is Ready!</h2>
        
        <p>Dear ${bookingData.client_name},</p>
        
        <p>Your music lesson is coming up! Here's your secure meeting link:</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #2e7d32; margin-top: 0;">🔗 MEETING LINK</h3>
          <a href="${meetingLink}" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Meeting</a>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Or copy this link: <br>
            <code style="background: #f5f5f5; padding: 5px; border-radius: 3px;">${meetingLink}</code>
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">📅 APPOINTMENT DETAILS</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Date & Time:</strong> ${cleanDateTime}</li>
            <li><strong>Document Type:</strong> ${bookingData.document_type}</li>
          </ul>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f57c00; margin-top: 0;">✅ FINAL CHECKLIST</h3>
          <ul>
            <li>✓ Valid photo ID ready</li>
            <li>✓ Documents printed and available</li>
            <li>✓ Camera and microphone tested</li>
            <li>✓ Stable internet connection confirmed</li>
          </ul>
        </div>
        
        <p><strong>⏰ Please join the meeting 5 minutes early.</strong></p>
        
        <p>See you tomorrow!</p>
        
        <p>Best regards,<br>
        <strong>Music Tutoring Services Team</strong></p>
      </div>
    `
  };
};

// Email sending endpoints
app.post('/send-booking-confirmation', async (req, res) => {
  try {
    const bookingData = req.body;
    const emailData = createBookingConfirmationEmail(bookingData);
    
    let emailSuccessCount = 0;
    let emailErrors = [];
    
    // Send client confirmation email
    try {
      await sgMail.send(emailData);
      console.log('Client confirmation email sent successfully');
      emailSuccessCount++;
    } catch (clientEmailError) {
      console.error('Failed to send client confirmation email:', clientEmailError.message);
      emailErrors.push(`Failed to send client email: ${clientEmailError.message}`);
    }
    
    // Send business notification email
    try {
      const businessNotificationData = createBusinessNotificationEmail(bookingData);
      await sgMail.send(businessNotificationData);
      console.log('Business notification email sent to remotenotaryfl@gmail.com');
      emailSuccessCount++;
    } catch (businessEmailError) {
      console.error('Failed to send business notification email:', businessEmailError.message);
      emailErrors.push(`Failed to send business notification: ${businessEmailError.message}`);
    }
    
    // Return success if at least one email was sent, or partial success message
    if (emailSuccessCount > 0) {
      let message = `${emailSuccessCount} email(s) sent successfully`;
      if (emailErrors.length > 0) {
        message += `, but ${emailErrors.length} email(s) failed`;
      }
      
      res.json({ 
        success: true, 
        message: message,
        email_status: {
          success_count: emailSuccessCount,
          errors: emailErrors
        }
      });
    } else {
      // All emails failed
      res.status(500).json({ 
        success: false, 
        message: 'All emails failed to send',
        email_status: {
          success_count: 0,
          errors: emailErrors
        }
      });
    }
  } catch (error) {
    console.error('Error in booking confirmation endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process booking confirmation',
      error: error.message 
    });
  }
});

app.post('/send-meeting-link', async (req, res) => {
  try {
    const { bookingData, transactionId } = req.body;
    
    // Get the meeting link from Proof API
    let meetingLink = 'https://proof.com/meeting-placeholder'; // Default fallback
    if (transactionId) {
      try {
        meetingLink = await getProofMeetingLink(transactionId);
      } catch (proofError) {
        console.error('Failed to get Proof meeting link:', proofError);
        // Use fallback link if Proof API fails
      }
    }
    
    const emailData = createMeetingLinkEmail(bookingData, meetingLink);
    await sgMail.send(emailData);
    
    res.json({ 
      success: true, 
      message: 'Meeting link email sent successfully',
      meeting_link: meetingLink
    });
  } catch (error) {
    console.error('Error sending meeting link email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send meeting link email',
      error: error.message 
    });
  }
});

// Stripe payment endpoints
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', booking_id, product_id, service_name, promo_code, discount_percent } = req.body;
    
    // Create payment intent with optional promo code
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: booking_id,
        product_id: product_id,
        service_name: service_name,
        promo_code: promo_code || 'none',
        discount_percent: discount_percent || '0'
      }
    };
    
    // Add promotion code if provided  
    if (promo_code && promo_code.toLowerCase() !== 'none') {
      try {
        // For your specific promo code, we'll use the Stripe promotion code
        // Note: promotion_code is used with Checkout, not Payment Intents
        // We'll handle the discount on the frontend and track it in metadata
        console.log(`✅ Processing payment with promo code: ${promo_code} (${discount_percent}% off)`);
        console.log(`💳 Charging discounted amount: $${amount} (${discount_percent}% discount already applied)`);
        console.log(`📊 Stripe will charge: $${Math.round(amount * 100)} cents`);
      } catch (promoError) {
        console.error('Error applying promo code:', promoError);
        // Continue without promo code if there's an error
      }
    } else {
      console.log(`💳 Processing payment without promo code: $${amount}`);
      console.log(`📊 Stripe will charge: $${Math.round(amount * 100)} cents`);
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

app.post('/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, booking_data } = req.body;
    
    // Retrieve the payment intent to confirm it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status === 'succeeded') {
      // Payment successful - create Proof transaction and get meeting link
      let proofTransaction = null;
      let meetingLink = null;
      
      try {
        proofTransaction = await createProofMusicLesson(booking_data);
        console.log('Proof transaction created:', proofTransaction);
        
        // Get meeting link immediately
        if (proofTransaction && proofTransaction.id) {
          try {
            meetingLink = await getProofMeetingLink(proofTransaction.id);
            console.log('Meeting link obtained:', meetingLink);
          } catch (linkError) {
            console.error('Failed to get meeting link:', linkError);
            // Use fallback link if Proof API fails
            meetingLink = `https://app.proof.com/transaction/${proofTransaction.id}`;
          }
        }
      } catch (proofError) {
        console.error('Failed to create Proof transaction:', proofError);
        console.error('This might be because:');
        console.error('1. Proof API key is invalid or missing');
        console.error('2. Proof account needs to be activated');
        console.error('3. API endpoint or format has changed');
        console.error('4. Account permissions are insufficient');
        
        // Create fallback meeting link
        meetingLink = `https://app.proof.com/booking/${booking_data.booking_id}`;
        console.log('Using fallback meeting link:', meetingLink);
      }
      
      // Add to Google Calendar
      let calendarEvent = null;
      try {
        calendarEvent = await addToGoogleCalendar(booking_data);
        if (calendarEvent) {
          console.log('✅ Event added to Google Calendar successfully');
        }
      } catch (calendarError) {
        console.error('❌ Failed to add to Google Calendar:', calendarError.message);
        // Don't fail the entire booking if calendar fails
      }
      
      // Send booking confirmation to primary client email only
      const emails = parseEmailAddresses(booking_data.email);
      const primaryEmail = emails[0]; // Get first/primary email only
      
      let emailSuccessCount = 0;
      let emailErrors = [];
      
      // Send single confirmation email to primary client
      try {
        const clientEmailData = createBookingConfirmationEmail(booking_data, meetingLink, false);
        await sgMail.send(clientEmailData);
        console.log(`Confirmation email sent to: ${primaryEmail}`);
        emailSuccessCount++;
      } catch (emailError) {
        console.error(`Failed to send confirmation email to ${primaryEmail}:`, emailError.message);
        emailErrors.push(`Failed to send email to ${primaryEmail}: ${emailError.message}`);
      }
      
      // Send business notification email
      try {
        const businessNotificationData = createBusinessNotificationEmail(booking_data, meetingLink);
        await sgMail.send(businessNotificationData);
        console.log('Business notification email sent to mpdoor1@gmail.com');
      } catch (businessEmailError) {
        console.error('Failed to send business notification email:', businessEmailError.message);
        emailErrors.push(`Failed to send business notification: ${businessEmailError.message}`);
      }
      
      // Create response message based on email success/failure
      let responseMessage = 'Payment confirmed and booking created successfully';
      if (emailSuccessCount > 0) {
        responseMessage += `, ${emailSuccessCount} confirmation email(s) sent`;
      }
      if (emailErrors.length > 0) {
        responseMessage += `, but ${emailErrors.length} email(s) failed to send`;
      }
      
      res.json({
        success: true,
        message: responseMessage,
        payment_intent: paymentIntent,
        proof_transaction: proofTransaction,
        meeting_link: meetingLink,
        calendar_event: calendarEvent,
        email_status: {
          success_count: emailSuccessCount,
          errors: emailErrors
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment was not successful',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// Document upload completion endpoint - removed automatic test document upload
app.post('/documents-uploaded', async (req, res) => {
  try {
    const { transaction_id, booking_id } = req.body;
    
    // Get updated transaction info after client uploads their documents
    const transactionResponse = await axios.get(`${PROOF_API_BASE_URL}/transactions/${transaction_id}`, {
      headers: PROOF_API_HEADERS
    });
    
    const meetingLink = transactionResponse.data.signer_info?.transaction_access_link || 
                       `https://app.proof.com/transaction/${transaction_id}`;
    
    // Send final confirmation email with meeting link
    const bookingData = req.body.booking_data;
    const clientEmailData = createBookingConfirmationEmail(bookingData, meetingLink, false);
    await sgMail.send(clientEmailData);
    
    res.json({
      success: true,
      message: 'Documents uploaded and transaction ready',
      meeting_link: meetingLink
    });
  } catch (error) {
    console.error('Error processing document upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document upload',
      error: error.message
    });
  }
});



// Proof API endpoints
app.post('/create-musiclesson', async (req, res) => {
  try {
    const bookingData = req.body;
    const proofTransaction = await createProofMusicLesson(bookingData);
    
    res.json({
      success: true,
              message: 'Music lesson session created successfully',
      transaction: proofTransaction
    });
  } catch (error) {
    console.error('Error creating music lesson session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create music lesson session',
      error: error.message
    });
  }
});

app.get('/get-meeting-link/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const meetingLink = await getProofMeetingLink(transactionId);
    
    res.json({
      success: true,
      meeting_link: meetingLink
    });
  } catch (error) {
    console.error('Error getting meeting link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meeting link',
      error: error.message
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 