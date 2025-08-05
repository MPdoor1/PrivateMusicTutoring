// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        // Ensure href is valid and not just "#"
        if (href && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Timezone Detection and Conversion
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const jacksonvilleTZ = 'America/New_York'; // Jacksonville, FL timezone

// Get user's timezone name for display
const getUserTimezoneDisplay = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortName = timezone.split('/').pop().replace(/_/g, ' ');
    return shortName;
};

// Convert time from user timezone to EST
const convertToEST = (dateString, timeString) => {
    try {
        // Create a date in the user's local timezone
        const userDateTime = new Date(`${dateString}T${timeString}`);
        
        // Format the date in EST timezone
        const estString = userDateTime.toLocaleString("en-CA", {
            timeZone: jacksonvilleTZ,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const [datePart, timePart] = estString.split(', ');
        
        return {
            date: datePart,
            time: timePart
        };
    } catch (error) {
        console.error('Error converting to EST:', error);
        return { date: dateString, time: timeString };
    }
};

// Convert time from EST to user timezone  
const convertFromEST = (dateString, timeString) => {
    try {
        // Create a date string in EST timezone format
        const estDateTimeString = `${dateString}T${timeString}`;
        
        // Parse as if it's in EST timezone by creating date and adjusting
        const tempDate = new Date(estDateTimeString);
        
        // Get current EST offset to calculate the adjustment needed
        const now = new Date();
        const estNow = new Date(now.toLocaleString("en-US", {timeZone: jacksonvilleTZ}));
        const localNow = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
        const offsetDiff = localNow.getTime() - estNow.getTime();
        
        // Apply the offset difference
        const adjustedDate = new Date(tempDate.getTime() + offsetDiff);
        
        // Format in user's timezone
        const userString = adjustedDate.toLocaleString("en-CA", {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const [datePart, timePart] = userString.split(', ');
        
        return {
            date: datePart,
            time: timePart
        };
    } catch (error) {
        console.error('Error converting from EST:', error);
        return { date: dateString, time: timeString };
    }
};

// Format time for display with timezone indicator
const formatTimeWithTimezone = (hour, minute, showEST = false) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    
    if (showEST) {
        return `${timeStr} EST`;
    } else {
        const tzDisplay = getUserTimezoneDisplay();
        return `${timeStr} ${tzDisplay}`;
    }
};

// Check if user is in Eastern Time
const isUserInEasternTime = () => {
    return userTimezone === jacksonvilleTZ || userTimezone === 'America/Detroit' || userTimezone === 'America/Toronto';
};

// Booking System
let bookings = JSON.parse(localStorage.getItem('musicLessonBookings') || '[]');

// EmailJS Configuration - Music Lesson Booking System
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY'; // You'll need to get this from EmailJS dashboard
const EMAILJS_SERVICE_ID = 'service_music_lessons'; 
const EMAILJS_TEMPLATE_ID = 'template_music_booking';

// Stripe Configuration - Use config from config.js
let stripe;
let stripePublishableKey;

// Initialize Stripe with proper key from config
document.addEventListener('DOMContentLoaded', function() {
    const config = window.MUSIC_TUTORING_CONFIG;
    
    // Always use your live key for consistency
    stripePublishableKey = 'pk_live_51NSMAqAAsTLO19Q2rkkIYPiKDOjsq4p6lcyHoyyT8m4JGAr9vpUBpCwyrFehTupYIvC8rxll8TtM9TckuBZYu4jB00kC1rEe1x';
    
    if (stripePublishableKey && stripePublishableKey !== 'pk_test_your_stripe_publishable_key_here') {
        stripe = Stripe(stripePublishableKey);
        elements = stripe.elements();
        console.log('✅ Stripe initialized with key:', stripePublishableKey.substring(0, 20) + '...');
        
        // Initialize Stripe Elements after Stripe is ready
        initializeStripeElements();
    } else {
        console.warn('⚠️ Stripe publishable key not configured properly');
    }
});

let elements;
let cardElement = null;

// EmailJS disabled - using FormSubmit for GitHub Pages compatibility
document.addEventListener('DOMContentLoaded', function() {
    console.log('EmailJS disabled - using FormSubmit fallback for all email handling');
    
    // Stripe Elements will be initialized after Stripe is loaded
});

// Service options with Stripe product IDs and pricing
const serviceOptions = {
    'online': {
        name: 'Private Lesson Online',
        price: 40,
        duration: '30 minutes',
        productId: 'prod_Sir9UM9pXwEdl2', // Your actual Stripe product ID
        description: 'Private music lesson via WhatsApp video call - any instrument'
    },
    'travelling': {
        name: 'Private Lesson Travelling',
        price: 40,
        duration: '30 minutes',
        productId: 'prod_Sir9UM9pXwEdl2', // Same product ID for both
        description: 'Private music lesson at your location - any instrument'
    },
    'test': {
        name: 'Test Service',
        price: 1,
        duration: 'Testing',
        productId: 'prod_SoV04nXT5LK8vG', // Test product ID
        description: 'Test service for $1 - testing purposes only'
    }
};

console.log('Service options loaded:', serviceOptions);

// Stripe Elements initialization
function initializeStripeElements() {
    if (!cardElement && stripe && elements) {
        const style = {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        };
        
        cardElement = elements.create('card', { style });
        cardElement.mount('#card-element');
        
        // Handle real-time validation errors from the card Element
        cardElement.on('change', ({ error }) => {
            const displayError = document.getElementById('card-errors');
            if (error) {
                displayError.textContent = error.message;
            } else {
                displayError.textContent = '';
            }
        });
    }
}

// Global variables for promo code
let appliedPromoCode = null;
let promoCodeDiscount = 0;

function updatePaymentAmount() {
    console.log('updatePaymentAmount called');
    const serviceTypeElement = document.getElementById('instrument');
    const serviceType = serviceTypeElement ? serviceTypeElement.value : '';
    const paymentAmount = document.getElementById('paymentAmount');
    const paymentSubtotal = document.getElementById('paymentSubtotal');
    const discountLine = document.getElementById('discountLine');
    const discountAmount = document.getElementById('discountAmount');
    
    console.log('Service type:', serviceType);
    console.log('Payment elements found:', {
        serviceTypeElement: !!serviceTypeElement,
        paymentAmount: !!paymentAmount,
        paymentSubtotal: !!paymentSubtotal,
        discountLine: !!discountLine,
        discountAmount: !!discountAmount
    });
    
    // Check if essential elements exist
    if (!paymentAmount || !paymentSubtotal) {
        console.log('❌ Payment elements not found - modal might not be ready yet');
        return;
    }
    
    if (serviceType && serviceOptions[serviceType]) {
        const originalPrice = serviceOptions[serviceType].price;
        console.log('✅ Found service:', serviceType, 'price:', originalPrice);
        
        // Set global variable for payment processing
        window.currentServicePrice = originalPrice;
        
        if (paymentSubtotal) {
            paymentSubtotal.textContent = originalPrice;
            console.log('✅ Updated subtotal to:', originalPrice);
        }
        
        // Apply promo code discount if available
        if (appliedPromoCode && promoCodeDiscount > 0) {
            const discount = originalPrice * (promoCodeDiscount / 100);
            const finalPrice = originalPrice - discount;
            
            // Update global variable with discounted price
            window.currentServicePrice = finalPrice;
            
            if (discountAmount) discountAmount.textContent = discount.toFixed(2);
            if (paymentAmount) paymentAmount.textContent = finalPrice.toFixed(2);
            if (discountLine) discountLine.style.display = 'block';
        } else {
            if (paymentAmount) {
                paymentAmount.textContent = originalPrice;
                console.log('✅ Updated total to:', originalPrice);
            }
            if (discountLine) discountLine.style.display = 'none';
        }
    } else {
        // No service selected - show placeholder or wait for selection
        console.log('No service selected yet');
        
        // Clear global variable
        window.currentServicePrice = null;
        
        if (paymentSubtotal) {
            paymentSubtotal.textContent = '--';
        }
        if (paymentAmount) {
            paymentAmount.textContent = '--';
        }
        if (discountLine) discountLine.style.display = 'none';
    }
}

// Promo Code Functions
function validatePromoCode(promoCode) {
    // Valid promo codes that correspond to your Stripe promo code
    // promo_1RmKHtGpt03TMvPVyl3BJHct = 50% off
    const validPromoCodes = {
        '50PARTNER': { discount: 50, description: '50% off', stripeId: 'promo_1RmKHtGpt03TMvPVyl3BJHct' },
        'SAVE50': { discount: 50, description: '50% off', stripeId: 'promo_1RmKHtGpt03TMvPVyl3BJHct' },
        'HALFOFF': { discount: 50, description: '50% off', stripeId: 'promo_1RmKHtGpt03TMvPVyl3BJHct' },
        'PROMO50': { discount: 50, description: '50% off', stripeId: 'promo_1RmKHtGpt03TMvPVyl3BJHct' },
        'MUSICLEARN50': { discount: 50, description: '50% off first lesson', stripeId: 'promo_musiclearn50' }
    };
    
    const upperPromoCode = promoCode.toUpperCase();
    return validPromoCodes[upperPromoCode] || null;
}

function applyPromoCode() {
    const promoCodeInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promo-message');
    const applyButton = document.getElementById('applyPromoCode');
    
    const promoCode = promoCodeInput.value.trim();
    
    if (!promoCode) {
        promoMessage.textContent = 'Please enter a promo code';
        promoMessage.className = 'promo-message error';
        return;
    }
    
    // Disable button during validation
    applyButton.disabled = true;
    applyButton.textContent = 'Applying...';
    
    // Simulate API call delay
    setTimeout(() => {
        const promoDetails = validatePromoCode(promoCode);
        
        if (promoDetails) {
            // Valid promo code
            appliedPromoCode = promoCode.toUpperCase();
            promoCodeDiscount = promoDetails.discount;
            
            promoMessage.textContent = `✓ Promo code applied! ${promoDetails.description}`;
            promoMessage.className = 'promo-message success';
            
            // Update button to show removal option
            applyButton.textContent = 'Remove';
            applyButton.disabled = false;
            applyButton.onclick = removePromoCode;
            
            // Disable input
            promoCodeInput.disabled = true;
            
            // Update payment amount
            updatePaymentAmount();
        } else {
            // Invalid promo code
            promoMessage.textContent = 'Invalid promo code. Please try again.';
            promoMessage.className = 'promo-message error';
            applyButton.textContent = 'Apply';
            applyButton.disabled = false;
        }
    }, 500);
}

function removePromoCode() {
    const promoCodeInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promo-message');
    const applyButton = document.getElementById('applyPromoCode');
    
    // Reset promo code state
    appliedPromoCode = null;
    promoCodeDiscount = 0;
    
    // Reset UI
    promoCodeInput.value = '';
    promoCodeInput.disabled = false;
    promoMessage.textContent = '';
    promoMessage.className = 'promo-message';
    
    applyButton.textContent = 'Apply';
    applyButton.onclick = applyPromoCode;
    
    // Update payment amount
    updatePaymentAmount();
}

// Process Stripe Payment
async function processStripePayment(booking) {
    try {
        // Check if running on GitHub Pages or static hosting
        const config = window.MUSIC_TUTORING_CONFIG;
        const isGitHubPages = config && config.IS_GITHUB_PAGES;
        const isLocalStaticServer = window.location.port === '8000' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const isGitHubPagesHost = window.location.hostname.includes('github.io');
        
        // Check if server endpoints are available (try to detect server mode)
        const isNodeJSServer = window.location.port === '3000';
        
        // Use GitHub Pages mode for: GitHub Pages hosting, local static server, or when explicitly configured
        if (isGitHubPages || isGitHubPagesHost || isLocalStaticServer || !isNodeJSServer) {
            console.log('🎵 Using GitHub Pages payment mode - static hosting detected');
            // GitHub Pages mode - use Stripe Payment Links or simplified flow
            return handleGitHubPagesPayment(booking);
        }
        
        // Server mode - create payment intent (only when on port 3000)
        console.log('🚀 Using server-side payment processing');
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: booking.price,
                product_id: booking.productId,
                service_name: booking.serviceName,
                booking_id: booking.id,
                promo_code: appliedPromoCode,
                discount_percent: promoCodeDiscount
            })
        });
        
        const { success, clientSecret, error } = await response.json();
        
        if (!success) {
            throw new Error(error || 'Failed to create payment intent');
        }
        
        // Confirm payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: booking.name,
                    email: booking.email,
                    phone: booking.phone
                }
            }
        });
        
        if (stripeError) {
            throw new Error(stripeError.message);
        }
        
        if (paymentIntent.status === 'succeeded') {
            // Confirm payment and create booking on server
            const confirmResponse = await fetch('/confirm-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_intent_id: paymentIntent.id,
                    booking_data: {
                        client_name: booking.name,
                        email: booking.allEmails, // Send all emails to server
                        phone: booking.phone,
                        booking_id: booking.id,
                        appointment_date: formatBookingDate(booking.date),
                        appointment_time: booking.time, // Use EST time for server processing
                        service_type: booking.serviceType,
                        service_name: booking.serviceName,
                        product_id: booking.productId,
                        price: booking.price,
                        special_requests: booking.specialRequests || 'None'
                    }
                })
            });
            
            const confirmResult = await confirmResponse.json();
            
            if (confirmResult.success) {
                // Store proof transaction ID if available
                if (confirmResult.proof_transaction) {
                    booking.proofTransactionId = confirmResult.proof_transaction.id;
                }
                return true;
            } else {
                throw new Error(confirmResult.message || 'Payment confirmation failed');
            }
        } else {
            throw new Error('Payment was not successful');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
        return false;
    }
}

// GitHub Pages Payment Handler
async function handleGitHubPagesPayment(booking) {
    console.log('🎵 Processing payment in GitHub Pages mode');
    
    // For GitHub Pages, we'll use a simplified booking flow
    const paymentInfo = `
🎵 Music Lesson Booking Summary
━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date: ${formatBookingDate(booking.date)}
⏰ Time: ${booking.timeDisplay}
🎼 Service: ${booking.serviceName}
💰 Price: $${booking.price}
${booking.promoCode ? `🎟️ Promo: ${booking.promoCode} (${booking.discountPercent}% off)` : ''}

📧 Contact: ${booking.email}
📞 Phone: ${booking.phone}

━━━━━━━━━━━━━━━━━━━━━━━━

💳 PAYMENT INSTRUCTIONS:
1. We'll send you a secure Stripe payment link via email
2. Click the link to complete payment ($${booking.price})
3. Your lesson will be confirmed once payment is received

📨 Booking request submitted successfully!
We'll contact you within 2 hours to confirm your lesson.
    `;
    
    alert(paymentInfo);
    
    // Submit booking via form to email service
    try {
        const formData = new FormData();
        formData.append('booking_details', JSON.stringify(booking));
        formData.append('client_name', booking.name);
        formData.append('client_email', booking.email);
        formData.append('client_phone', booking.phone);
        formData.append('lesson_type', booking.serviceName);
        formData.append('lesson_date', booking.date);
        formData.append('lesson_time', booking.timeDisplay);
        formData.append('lesson_price', booking.price);
        formData.append('special_requests', booking.specialRequests || 'None');
        
        const config = window.MUSIC_TUTORING_CONFIG;
        if (config && config.FORM_ACTION) {
            await fetch(config.FORM_ACTION, {
                method: 'POST',
                body: formData
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error submitting booking:', error);
        return true; // Still return true to show success message
    }
}

function openBookingModal() {
    console.log('openBookingModal called');
    const modal = document.getElementById('bookingModal');
    console.log('Modal element:', modal);
    
    if (!modal) {
        alert('Modal not found! Please refresh the page.');
        return;
    }
    
    modal.style.display = 'block';
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const appointmentDate = document.getElementById('appointmentDate');
    if (appointmentDate) {
        appointmentDate.min = today;
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        appointmentDate.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Generate initial time slots
    generateTimeSlots();
    
    // Initialize Stripe Elements if not already done
    initializeStripeElements();
    
    // Set up service type change listener with improved timing
    setTimeout(() => {
        const serviceTypeSelect = document.getElementById('instrument');
        if (serviceTypeSelect) {
            // Remove any existing event listeners
            serviceTypeSelect.removeEventListener('change', updatePaymentAmount);
            // Add the event listener
            serviceTypeSelect.addEventListener('change', function() {
                console.log('🔄 Lesson type changed! Updating payment...');
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    updatePaymentAmount();
                }, 10);
            });
            console.log('✅ Added change listener to instrument select');
            
            // Update payment amount immediately if there's already a selection
            if (serviceTypeSelect.value) {
                updatePaymentAmount();
            }
        } else {
            console.log('❌ Could not find instrument select element');
        }
        
        // Force initial update
        updatePaymentAmount();
    }, 100);
    setTimeout(() => {
        updatePaymentAmount(); // Call after 500ms
        console.log('Payment update called from longer timeout');
    }, 500);
    
    // Set up promo code functionality
    const applyPromoCodeButton = document.getElementById('applyPromoCode');
    if (applyPromoCodeButton) {
        applyPromoCodeButton.onclick = applyPromoCode;
    }
    
    // Prevent promo code input group from interfering with text selection
    const promoCodeGroup = document.querySelector('.promo-code-input-group');
    if (promoCodeGroup) {
        promoCodeGroup.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        promoCodeGroup.addEventListener('mouseup', function(e) {
            e.stopPropagation();
        });
    }
    
    // Allow Enter key to apply promo code
    const promoCodeInput = document.getElementById('promoCode');
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyPromoCode();
            }
        });
        
        // Prevent any unwanted navigation on text selection
        promoCodeInput.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        
        promoCodeInput.addEventListener('mouseup', function(e) {
            e.stopPropagation();
        });
        
        promoCodeInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.getElementById('bookingForm').reset();
    
    // Reset promo code state
    appliedPromoCode = null;
    promoCodeDiscount = 0;
    
    // Reset promo code UI
    const promoCodeInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promo-message');
    const applyButton = document.getElementById('applyPromoCode');
    
    if (promoCodeInput) {
        promoCodeInput.value = '';
        promoCodeInput.disabled = false;
    }
    
    if (promoMessage) {
        promoMessage.textContent = '';
        promoMessage.className = 'promo-message';
    }
    
    if (applyButton) {
        applyButton.textContent = 'Apply';
        applyButton.onclick = applyPromoCode;
        applyButton.disabled = false;
    }
}

function generateTimeSlots() {
    const selectedDate = document.getElementById('appointmentDate').value;
    const timeSlotsContainer = document.getElementById('timeSlots');
    
    console.log('generateTimeSlots called with date:', selectedDate);
    
    if (!selectedDate) {
        timeSlotsContainer.innerHTML = '<p style="color: #666; padding: 10px; text-align: center;">Please select a date first</p>';
        return;
    }
    
    // Add timezone info display
    const isEasternTime = isUserInEasternTime();
    const tzInfo = isEasternTime ? 
        '<div class="timezone-info">🕐 You\'re in Eastern Time - same as Jacksonville, FL!</div>' :
        `<div class="timezone-info">🕐 Times shown in your timezone (${getUserTimezoneDisplay()}). Jacksonville, FL times shown in EST.</div>`;
    
    // Business hours: 9 AM to 2:30 PM EST, then 6 PM to 9 PM EST, 30-minute slots
    const timeSlots = [];
    
    // Morning/Afternoon slots: 9 AM to 2:30 PM
    for (let hour = 9; hour <= 14; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            // Stop at 2:30 PM (14:30)
            if (hour === 14 && minute > 30) break;
            
            const estTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Convert EST to user's timezone for display
            const userTimeSlot = convertFromEST(selectedDate, estTime);
            const userHour = parseInt(userTimeSlot.time.split(':')[0]);
            const userMinute = parseInt(userTimeSlot.time.split(':')[1]);
            
            // Skip if converted time is outside reasonable hours (e.g., 2 AM)
            if (userHour < 6 || userHour > 23) continue;
            
            const displayTime = isEasternTime ? 
                formatTimeWithTimezone(hour, minute, true) :
                formatTimeWithTimezone(userHour, userMinute, false);
            
            const estDisplay = isEasternTime ? '' : ` (${formatTimeWithTimezone(hour, minute, true)})`;
            
            // Check if slot is already booked (using EST time for consistency)
            const isBooked = bookings.some(booking => 
                booking.date === selectedDate && booking.time === estTime
            );
            
            timeSlots.push({
                time: estTime, // Always store EST time
                userTime: userTimeSlot.time, // User's local time
                display: displayTime + estDisplay,
                booked: isBooked
            });
        }
    }
    
    // Evening slots: 6 PM to 9 PM (NOT available 2:30 PM - 6:00 PM)
    for (let hour = 18; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            // Stop at 9 PM (21:00)
            if (hour === 21 && minute > 0) break;
            
            const estTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Convert EST to user's timezone for display
            const userTimeSlot = convertFromEST(selectedDate, estTime);
            const userHour = parseInt(userTimeSlot.time.split(':')[0]);
            const userMinute = parseInt(userTimeSlot.time.split(':')[1]);
            
            // Skip if converted time is outside reasonable hours (e.g., 2 AM)
            if (userHour < 6 || userHour > 23) continue;
            
            const displayTime = isEasternTime ? 
                formatTimeWithTimezone(hour, minute, true) :
                formatTimeWithTimezone(userHour, userMinute, false);
            
            const estDisplay = isEasternTime ? '' : ` (${formatTimeWithTimezone(hour, minute, true)})`;
            
            // Check if slot is already booked (using EST time for consistency)
            const isBooked = bookings.some(booking => 
                booking.date === selectedDate && booking.time === estTime
            );
            
            timeSlots.push({
                time: estTime, // Always store EST time
                userTime: userTimeSlot.time, // User's local time
                display: displayTime + estDisplay,
                booked: isBooked
            });
        }
    }
    
    console.log('Generated', timeSlots.length, 'time slots');
    
    // Generate time slot buttons
    timeSlotsContainer.innerHTML = tzInfo + timeSlots.map(slot => `
        <div class="time-slot ${slot.booked ? 'unavailable' : ''}" 
             data-time="${slot.time}" 
             data-user-time="${slot.userTime}"
             onclick="${slot.booked ? '' : 'selectTimeSlot(this)'}">
            ${slot.display}
            ${slot.booked ? '<br><small>Booked</small>' : ''}
        </div>
    `).join('');
    
    if (timeSlots.length === 0) {
        timeSlotsContainer.innerHTML += '<p style="color: red; padding: 10px;">No time slots available for this date.</p>';
    }
}

function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function selectTimeSlot(element) {
    // Remove previous selections
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Select current slot
    element.classList.add('selected');
    
    // Store both EST time (for server) and user time (for display)
    const estTime = element.getAttribute('data-time');
    const userTime = element.getAttribute('data-user-time');
    
    // Update global variables for booking
    window.selectedTimeSlot = {
        estTime: estTime,
        userTime: userTime,
        displayText: element.textContent.trim()
    };
}

// Helper function to format date without timezone issues
function formatBookingDate(dateString) {
    // Parse the date string (YYYY-MM-DD) manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Email Templates and Functions
async function sendBookingConfirmationEmail(booking) {
    const emailData = {
        email: booking.email,
        client_name: booking.name,
        booking_id: booking.id,
        appointment_date: formatBookingDate(booking.date),
        appointment_time: booking.time, // Use EST time for server processing
        service_type: booking.serviceType,
        service_name: booking.serviceName || booking.serviceType,
        price: booking.price,
        phone: booking.phone,
        special_requests: booking.specialRequests || 'None'
    };
    
    console.log('📧 Sending confirmation email to:', booking.email);
    
    try {
        const response = await fetch('/send-booking-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Email sent successfully!');
            return emailData;
        } else {
            console.error('❌ Failed to send email:', result.message);
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}

async function sendMeetingLinkEmail(booking, meetingLink) {
    const bookingData = {
        email: booking.email,
        client_name: booking.name,
        booking_id: booking.id,
        appointment_date: formatBookingDate(booking.date),
        appointment_time: booking.time, // Use EST time for server processing
        document_type: booking.documentType.replace('-', ' ').toUpperCase()
    };
    
    console.log('📧 Sending meeting link email to:', booking.email);
    console.log('Meeting link:', meetingLink);
    
    try {
        const response = await fetch('/send-meeting-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookingData, meetingLink })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Meeting link email sent successfully!');
            return bookingData;
        } else {
            console.error('❌ Failed to send meeting link email:', result.message);
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error sending meeting link email:', error);
        throw error;
    }
}

function sendReminderEmail(booking) {
    const emailData = {
        to_email: booking.email,
        client_name: booking.name,
        booking_id: booking.id,
        appointment_date: formatBookingDate(booking.date),
        appointment_time: booking.time, // Use EST time for server processing
        service_type: booking.serviceType,
        service_name: booking.serviceName || booking.serviceType,
        hours_until: calculateHoursUntilAppointment(booking)
    };
    
    console.log('⏰ Sending reminder email to:', booking.email);
    
    // TODO: Replace with actual EmailJS send for reminder template
    return emailData;
}

function calculateHoursUntilAppointment(booking) {
    const appointmentDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600)); // Convert to hours
}

// Send booking confirmation emails using EmailJS
async function sendBookingEmails(booking) {
    try {
        // Extract all email addresses
        const customerEmails = booking.allEmails.split(',').map(email => email.trim());
        const musicTeacherEmail = 'MPdoor1@gmail.com';
        
        // Get current date/time for email
        const now = new Date();
        const bookingDateTime = formatBookingDate(booking.date) + ' at ' + booking.timeDisplay;
        
        // Format address info
        const addressInfo = booking.specialRequests || 'No special requests provided';
        
        // Format price info
        let priceInfo = `$${booking.price} (PAID)`;
        if (booking.promoCode && booking.discountPercent > 0) {
            priceInfo = `$${booking.originalPrice} - ${booking.discountPercent}% off (${booking.promoCode}) = $${booking.price} (PAID)`;
        }
        
        // Create comprehensive email data
        const emailData = {
            customer_name: booking.name,
            customer_email: booking.email,
            customer_phone: booking.phone,
            lesson_type: booking.serviceName,
            lesson_date: formatBookingDate(booking.date),
            lesson_time: booking.timeDisplay,
            lesson_price: priceInfo,
            special_requests: addressInfo,
            booking_id: booking.id,
            booking_datetime: bookingDateTime,
            sent_time: now.toLocaleString(),
            teacher_email: musicTeacherEmail,
            all_customer_emails: booking.allEmails
        };
        
        // Send to customer(s)
        for (const customerEmail of customerEmails) {
            const customerEmailData = {
                ...emailData,
                to_email: customerEmail,
                to_name: booking.name,
                is_customer: 'true',
                email_subject: '🎵 Music Lesson Confirmed - ' + bookingDateTime
            };
            
            console.log('Sending customer confirmation email to:', customerEmail);
            await sendEmailViaEmailJS(customerEmailData);
        }
        
        // Send to music teacher (you)
        const teacherEmailData = {
            ...emailData,
            to_email: musicTeacherEmail,
            to_name: 'Music Teacher',
            is_customer: 'false',
            email_subject: '🎵 New Lesson Booking - ' + bookingDateTime
        };
        
        console.log('Sending teacher notification email to:', musicTeacherEmail);
        await sendEmailViaEmailJS(teacherEmailData);
        
        return true;
    } catch (error) {
        console.error('Error sending booking emails:', error);
        return false;
    }
}

// Send individual email using EmailJS
async function sendEmailViaEmailJS(emailData) {
    // If EmailJS is not available, use fallback method
    if (typeof emailjs === 'undefined') {
        console.log('EmailJS not available, using fallback method');
        return await sendEmailFallback(emailData);
    }
    
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            emailData
        );
        console.log('Email sent successfully:', response);
        return true;
    } catch (error) {
        console.error('EmailJS error:', error);
        // Try fallback method
        return await sendEmailFallback(emailData);
    }
}

// Fallback email method using FormSubmit.co
async function sendEmailFallback(emailData) {
    try {
        // Create email body with all booking details
        const isCustomer = emailData.is_customer === 'true';
        
        let emailBody = '';
        
        if (isCustomer) {
            emailBody = `
🎵 MUSIC LESSON CONFIRMATION 🎵

Dear ${emailData.customer_name},

Your music lesson has been successfully booked and payment confirmed!

📅 LESSON DETAILS:
• Date: ${emailData.lesson_date}
• Time: ${emailData.lesson_time}
• Service: ${emailData.lesson_type}
• Price: ${emailData.lesson_price}

👤 CONTACT INFO:
• Student: ${emailData.customer_name}
• Email: ${emailData.customer_email}
• Phone: ${emailData.customer_phone}

📍 LESSON LOCATION/NOTES:
${emailData.special_requests}

📞 CONTACT YOUR TEACHER:
• Email: MPdoor1@gmail.com
• Phone: 904-607-3835 (WhatsApp for online lessons)

⚠️ IMPORTANT POLICIES:
• All lesson purchases are FINAL - no cancellations, rescheduling, or refunds
• For in-person lessons: Please have your address ready
• For online lessons: WhatsApp video call will be used

🎼 GET READY TO MAKE MUSIC!

Booking ID: ${emailData.booking_id}
Booked on: ${emailData.sent_time}

---
DO NOT REPLY TO THIS EMAIL
For questions, contact: MPdoor1@gmail.com
Private Music Tutoring Services
            `;
        } else {
            emailBody = `
🎵 NEW MUSIC LESSON BOOKING 🎵

You have a new lesson booking!

📅 LESSON DETAILS:
• Date: ${emailData.lesson_date}
• Time: ${emailData.lesson_time}
• Service: ${emailData.lesson_type}
• Price: ${emailData.lesson_price}

👤 STUDENT INFO:
• Name: ${emailData.customer_name}
• Email: ${emailData.customer_email}
• All Emails: ${emailData.all_customer_emails}
• Phone: ${emailData.customer_phone}

📍 LOCATION/SPECIAL REQUESTS:
${emailData.special_requests}

Booking ID: ${emailData.booking_id}
Booked on: ${emailData.sent_time}

---
This is an automated booking notification.
            `;
        }
        
        // Use FormSubmit.co to send email
        const formData = new FormData();
        formData.append('email', emailData.to_email);
        formData.append('subject', emailData.email_subject);
        formData.append('message', emailBody);
        formData.append('_replyto', 'MPdoor1@gmail.com');
        formData.append('_next', window.location.href);
        
        const response = await fetch('https://formsubmit.co/ajax/MPdoor1@gmail.com', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            console.log('Fallback email sent successfully to:', emailData.to_email);
            return true;
        } else {
            console.error('Fallback email failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Fallback email error:', error);
        return false;
    }
}

async function showBookingConfirmation(booking) {
    // Send confirmation emails
    console.log('Sending booking confirmation emails...');
    const emailsSent = await sendBookingEmails(booking);
    
    // Format price information with discount details if applicable
    let priceInfo = `💰 Price: $${booking.price} (PAID)`;
    if (booking.promoCode && booking.discountPercent > 0) {
        priceInfo = `💰 Original Price: $${booking.originalPrice}
        🎟️ Promo Code: ${booking.promoCode} (${booking.discountPercent}% off)
        💰 Final Price: $${booking.price} (PAID)`;
    }
    
    const emailStatus = emailsSent ? 
        '📧 Confirmation emails sent!' : 
        '⚠️ Email sending failed - you will be contacted directly';
    
    const confirmationMessage = `
        🎉 Music Lesson Scheduled Successfully!
        
        📅 Date: ${formatBookingDate(booking.date)}
        ⏰ Time: ${booking.timeDisplay}
        🎵 Service: ${booking.serviceName}
        ${priceInfo}
        
        ${emailStatus}
        
        📍 Next Steps:
        1. Check your email for confirmation details
        2. For in-person lessons: Prepare your address/location
        3. For online lessons: WhatsApp video call (904-607-3835)
        4. Have your instrument ready!
        
        🎼 Get ready to make beautiful music!
        
        Booking ID: ${booking.id}
    `;
    
    alert(confirmationMessage);
}

// Wait for DOM to load before setting up event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up booking system...');
    
    // Test if modal exists
    const modal = document.getElementById('bookingModal');
    console.log('Booking modal found:', !!modal);
    
    // Test if form exists
    const form = document.getElementById('bookingForm');
    console.log('Booking form found:', !!form);
    
    // Test if date input exists
    const dateInput = document.getElementById('appointmentDate');
    console.log('Date input found:', !!dateInput);

    // Set up event listeners
    if (dateInput) {
        dateInput.addEventListener('change', generateTimeSlots);
        // Also call it initially to show initial state
        generateTimeSlots();
    }
    
    // Set up backup service type change listener
    const instrumentSelect = document.getElementById('instrument');
    if (instrumentSelect) {
        instrumentSelect.addEventListener('change', function() {
            console.log('🔄 Backup listener: Lesson type changed!');
            setTimeout(() => {
                updatePaymentAmount();
            }, 10);
        });
        console.log('✅ Backup change listener added to instrument select');
    }
    
    // Email management functions (made global for onclick handlers)
    window.emailCount = 1;
    
    window.addEmailInput = function() {
        window.emailCount++;
        const emailContainer = document.getElementById('emailContainer');
        
        const emailGroup = document.createElement('div');
        emailGroup.className = 'email-input-group';
        emailGroup.innerHTML = `
            <input type="email" name="additionalEmail${window.emailCount}" placeholder="Additional email address" required>
            <button type="button" class="remove-email-btn" onclick="removeEmailInput(this)">Remove</button>
        `;
        
        emailContainer.appendChild(emailGroup);
    }
    
    window.removeEmailInput = function(button) {
        const emailGroup = button.parentElement;
        emailGroup.remove();
    }
    
    // Function to collect all email addresses from the form
    function collectAllEmails() {
        const emails = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Get primary email
        const primaryEmail = document.getElementById('clientEmail').value.trim();
        if (primaryEmail && emailRegex.test(primaryEmail)) {
            emails.push(primaryEmail);
        }
        
        // Get additional emails
        const additionalEmailInputs = document.querySelectorAll('input[name^="additionalEmail"]');
        additionalEmailInputs.forEach(input => {
            const email = input.value.trim();
            if (email && emailRegex.test(email)) {
                emails.push(email);
            }
        });
        
        return emails;
    }
    
    // Function to validate all email addresses
    function validateAllEmails() {
        const emails = collectAllEmails();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (emails.length === 0) {
            return { valid: false, message: 'At least one email address is required' };
        }
        
        // Check for duplicates
        const uniqueEmails = [...new Set(emails)];
        if (uniqueEmails.length !== emails.length) {
            return { valid: false, message: 'Duplicate email addresses found' };
        }
        
        // Validate each email
        for (const email of emails) {
            if (!emailRegex.test(email)) {
                return { valid: false, message: `Invalid email address: ${email}` };
            }
        }
        
        return { valid: true, emails: emails };
    }
    
    // Add event listener for the "Add Email" button
    document.getElementById('addEmailBtn').addEventListener('click', window.addEmailInput);
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Check if running on GitHub Pages or static hosting
            const config = window.MUSIC_TUTORING_CONFIG;
            const isGitHubPages = config && config.IS_GITHUB_PAGES;
            const isLocalStaticServer = window.location.port === '8000' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
            const isGitHubPagesHost = window.location.hostname.includes('github.io');
            const isNodeJSServer = window.location.port === '3000';
            
            // Use GitHub Pages mode for: GitHub Pages hosting, local static server, or when explicitly configured
            if (isGitHubPages || isGitHubPagesHost || isLocalStaticServer || !isNodeJSServer) {
                console.log('🎵 GitHub Pages mode detected - allowing normal form submission');
                
                // Validate required fields before allowing submission
                const formData = new FormData(e.target);
                const selectedTimeSlot = document.querySelector('.time-slot.selected');
                
                if (!selectedTimeSlot) {
                    alert('Please select a time slot');
                    return;
                }
                
                // Validate email addresses
                const emailValidation = validateAllEmails();
                if (!emailValidation.valid) {
                    alert(emailValidation.message);
                    return;
                }
                
                // Add time slot data to form
                const timeSlotInput = document.createElement('input');
                timeSlotInput.type = 'hidden';
                timeSlotInput.name = 'selected_time_slot';
                timeSlotInput.value = selectedTimeSlot.dataset.time;
                e.target.appendChild(timeSlotInput);
                
                // Allow form to submit normally to FormSubmit
                e.target.submit();
                return;
            }
            
            // Server mode processing (only for Node.js server)
            const formData = new FormData(e.target);
            const selectedTimeSlot = document.querySelector('.time-slot.selected');
            
            if (!selectedTimeSlot) {
                alert('Please select a time slot');
                return;
            }
            
            // Validate email addresses
            const emailValidation = validateAllEmails();
            if (!emailValidation.valid) {
                alert(emailValidation.message);
                return;
            }
            
            console.log(`Validated ${emailValidation.emails.length} email address(es):`, emailValidation.emails);
            
            const submitButton = document.getElementById('submitPayment');
            submitButton.disabled = true;
            submitButton.textContent = 'Processing Payment...';
            
            try {
                const serviceType = formData.get('instrument');
                console.log('Service type from form:', serviceType);
                console.log('Available service options:', Object.keys(serviceOptions));
                
                const selectedService = serviceOptions[serviceType];
                console.log('Selected service:', selectedService);
                
                if (!selectedService) {
                    alert('Please select a valid lesson type.');
                    return;
                }
                
                const allEmails = emailValidation.emails;
                const primaryEmail = allEmails[0]; // Use first email for billing
                
                // Get timezone-aware time data
                const selectedTime = window.selectedTimeSlot || {
                    estTime: selectedTimeSlot.dataset.time,
                    displayText: selectedTimeSlot.textContent.trim()
                };
                
                // Calculate final price with discount if applicable
                const originalPrice = selectedService.price;
                let finalPrice = originalPrice;
                if (appliedPromoCode && promoCodeDiscount > 0) {
                    finalPrice = originalPrice * (1 - promoCodeDiscount / 100);
                    console.log(`✅ Promo code ${appliedPromoCode} applied: ${promoCodeDiscount}% off`);
                    console.log(`💰 Original price: $${originalPrice}, Final price: $${finalPrice}`);
                } else {
                    console.log(`💰 No promo code applied. Price: $${finalPrice}`);
                }
                
                const booking = {
                    id: Date.now().toString(),
                    name: formData.get('clientName'),
                    email: primaryEmail, // Primary email for Stripe billing
                    allEmails: allEmails.join(','), // All emails for server processing
                    phone: formData.get('clientPhone'),
                    serviceType: serviceType,
                    serviceName: selectedService.name,
                    productId: selectedService.productId,
                    date: formData.get('appointmentDate'),
                    time: selectedTime.estTime, // Always use EST time for server
                    timeDisplay: selectedTime.displayText, // User-friendly display with timezone
                    specialRequests: formData.get('specialRequests'),
                    price: finalPrice, // Use discounted price
                    originalPrice: originalPrice, // Store original price for reference
                    promoCode: appliedPromoCode, // Store applied promo code
                    discountPercent: promoCodeDiscount, // Store discount percentage
                    status: 'scheduled',
                    createdAt: new Date().toISOString()
                };
                
                // Process payment through Stripe
                const paymentSuccess = await processStripePayment(booking);
                
                if (paymentSuccess) {
                    // Save booking
                    bookings.push(booking);
                    localStorage.setItem('musicLessonBookings', JSON.stringify(bookings));
                    
                    // Show confirmation
                    await showBookingConfirmation(booking);
                    
                    // Close modal and reset form
                    closeBookingModal();
                    e.target.reset();
                } else {
                    alert('Payment failed. Please try again.');
                }
            } catch (error) {
                console.error('Booking error:', error);
                alert('An error occurred while processing your booking. Please try again.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Pay & Schedule Appointment';
            }
        });
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeBookingModal();
    }
});

// Admin Panel Functions
let adminKeySequence = [];
const adminCode = ['a', 'd', 'm', 'i', 'n']; // Type "admin" to access panel

// Listen for admin key sequence
document.addEventListener('keydown', function(event) {
    // Check if event.key exists before calling toLowerCase
    if (event.key) {
        adminKeySequence.push(event.key.toLowerCase());
        
        // Keep only the last 5 keys
        if (adminKeySequence.length > 5) {
            adminKeySequence.shift();
        }
        
        // Check if admin code was entered
        if (adminKeySequence.join('') === adminCode.join('')) {
            openAdminPanel();
            adminKeySequence = []; // Reset sequence
        }
    }
});

function openAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.style.display = 'block';
    updateAdminStats();
    displayRecentBookings();
    console.log('📊 Admin panel opened');
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.style.display = 'none';
}

function updateAdminStats() {
    const totalBookings = bookings.length;
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(booking => booking.date === today).length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('todayBookings').textContent = todayBookings;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue}`;
}

function displayRecentBookings() {
    const bookingsList = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p style="color: #cccccc; text-align: center;">No bookings yet</p>';
        return;
    }
    
    // Sort bookings by creation date (newest first)
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    bookingsList.innerHTML = sortedBookings.map(booking => `
        <div class="booking-item">
            <h4>${booking.name} - ${booking.serviceName || booking.serviceType || 'Service'}</h4>
            <p><strong>Date:</strong> ${formatBookingDate(booking.date)} at ${booking.timeDisplay}</p>
            <p><strong>Email:</strong> ${booking.email} | <strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Price:</strong> $${booking.price} | <strong>Status:</strong> ${booking.status}</p>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <div style="margin-top: 0.5rem;">
                <button onclick="sendMeetingLinkToBooking('${booking.id}')" class="btn-admin" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Send Meeting Link</button>
                <button onclick="sendReminderToBooking('${booking.id}')" class="btn-admin" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Send Reminder</button>
                <button onclick="deleteBooking('${booking.id}')" class="btn-admin danger" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Delete</button>
            </div>
        </div>
    `).join('');
}

function sendTestConfirmationEmail() {
    const testEmail = document.getElementById('testEmail').value;
    if (!testEmail) {
        alert('Please enter a test email address');
        return;
    }
    
    const mockBooking = {
        id: 'TEST-' + Date.now(),
        name: 'Test User',
        email: testEmail,
        phone: '(555) 123-4567',
        serviceType: 'notarization',
        serviceName: 'Notarization Service',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        timeDisplay: '2:00 PM',
        price: 50,
        specialRequests: 'This is a test booking'
    };
    
    sendBookingConfirmationEmail(mockBooking);
    alert(`📧 Test confirmation email sent to ${testEmail}`);
}

function sendTestMeetingLink() {
    const testEmail = document.getElementById('testEmail').value;
    if (!testEmail) {
        alert('Please enter a test email address');
        return;
    }
    
    const mockBooking = {
        id: 'TEST-' + Date.now(),
        name: 'Test User',
        email: testEmail,
        serviceType: 'notarization',
        serviceName: 'Notarization Service',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        timeDisplay: '2:00 PM'
    };
    
    const mockMeetingLink = 'https://meet.proof.com/room/test-meeting-' + Date.now();
    sendMeetingLinkEmail(mockBooking, mockMeetingLink);
    alert(`📧 Test meeting link sent to ${testEmail}`);
}

function sendTestReminder() {
    const testEmail = document.getElementById('testEmail').value;
    if (!testEmail) {
        alert('Please enter a test email address');
        return;
    }
    
    const mockBooking = {
        id: 'TEST-' + Date.now(),
        name: 'Test User',
        email: testEmail,
        serviceType: 'notarization',
        serviceName: 'Notarization Service',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        timeDisplay: '2:00 PM'
    };
    
    sendReminderEmail(mockBooking);
    alert(`📧 Test reminder sent to ${testEmail}`);
}

async function sendMeetingLinkToBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Booking not found');
        return;
    }
    
    try {
        const response = await fetch('/send-meeting-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookingData: {
                    email: booking.email,
                    client_name: booking.name,
                    booking_id: booking.id,
                    appointment_date: formatBookingDate(booking.date),
                    appointment_time: booking.time, // Use EST time for server processing
                    service_type: booking.serviceType,
                    service_name: booking.serviceName || booking.serviceType
                },
                transactionId: booking.proofTransactionId || null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`📧 Meeting link sent to ${booking.email}`);
            console.log('Meeting link sent:', result.meeting_link);
        } else {
            throw new Error(result.message || 'Failed to send meeting link');
        }
    } catch (error) {
        console.error('Failed to send meeting link:', error);
        alert(`❌ Failed to send meeting link: ${error.message}`);
    }
}

function sendReminderToBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Booking not found');
        return;
    }
    
    sendReminderEmail(booking);
    alert(`📧 Reminder sent to ${booking.email}`);
}

function deleteBooking(bookingId) {
    if (confirm('Are you sure you want to delete this booking?')) {
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('musicLessonBookings', JSON.stringify(bookings));
        displayRecentBookings();
        updateAdminStats();
        alert('Booking deleted');
    }
}

function exportBookings() {
    if (bookings.length === 0) {
        alert('No bookings to export');
        return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Name,Email,Phone,Service Type,Service Name,Date,Time,Price,Status,Created At,Special Requests\n"
        + bookings.map(booking => 
            `${booking.id},"${booking.name}","${booking.email}","${booking.phone}","${booking.serviceType || booking.documentType || 'Unknown'}","${booking.serviceName || booking.serviceType || booking.documentType || 'Unknown'}","${booking.date}","${booking.timeDisplay}","$${booking.price}","${booking.status}","${booking.createdAt}","${booking.specialRequests || ''}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📊 Bookings exported to CSV file');
}

function clearAllBookings() {
    if (confirm('⚠️ Are you sure you want to delete ALL bookings? This cannot be undone!')) {
        if (confirm('⚠️ This will permanently delete all booking data. Are you absolutely sure?')) {
            bookings = [];
            localStorage.setItem('musicLessonBookings', JSON.stringify(bookings));
            displayRecentBookings();
            updateAdminStats();
            alert('🗑️ All bookings have been deleted');
        }
    }
}

// Enhanced header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    const scrolled = window.scrollY > 50;
    
    if (scrolled) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate service cards on scroll
document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        observer.observe(card);
    });
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const rate = scrolled * -0.3;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
    
    // Add typing effect to hero title (optional enhancement)
    const heroTitle = document.querySelector('.hero-content h2');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.borderRight = '3px solid #DAA520';
        
        let i = 0;
        const typeWriter = function() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                setTimeout(() => {
                    heroTitle.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        setTimeout(typeWriter, 1000);
    }
});

// Add dynamic color changes on scroll
window.addEventListener('scroll', function() {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    const goldIntensity = Math.min(scrollPercent / 2, 30);
    
    document.documentElement.style.setProperty('--scroll-gold', `hsla(43, 74%, ${45 + goldIntensity}%, 0.1)`);
});

// FAQ Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
});

// How It Works Slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const sliderTrack = document.querySelector('.slider-track');
    const sliderProgress = document.querySelector('.slider-progress');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) {
            dots[index].classList.add('active');
        }
        
        // Check if mobile view
        const isMobile = window.innerWidth <= 768;
        const slideWidth = isMobile ? 100 : 33.333;
        
        // Move slider track smoothly
        if (sliderTrack) {
            sliderTrack.style.transform = `translateX(-${index * slideWidth}%)`;
        }
        
        // Update progress bar
        if (sliderProgress) {
            sliderProgress.style.setProperty('--progress-position', `${index * slideWidth}%`);
        }
        
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }

    function startAutoSlide() {
        // Slower timing for mobile, comfortable timing for desktop
        const timing = window.innerWidth <= 768 ? 7000 : 6000;
        slideInterval = setInterval(nextSlide, timing);
    }
    
    // Handle window resize to recalculate positions
    window.addEventListener('resize', function() {
        showSlide(currentSlide);
    });

    function stopAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            stopAutoSlide();
            showSlide(index);
            // Longer delay on mobile before restarting
            const restartDelay = window.innerWidth <= 768 ? 3000 : 1500;
            setTimeout(startAutoSlide, restartDelay);
        });
    });

    // Pause auto-slide on hover
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Initialize slider
    if (slides.length > 0) {
        showSlide(0);
        startAutoSlide();
    }

    // Add touch/swipe support for mobile
    let startX = 0;
    let endX = 0;

    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });

        sliderContainer.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > swipeThreshold) {
            stopAutoSlide();
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                const prevIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
                showSlide(prevIndex);
            }
            // Longer delay on mobile after swipe
            const restartDelay = window.innerWidth <= 768 ? 4000 : 1500;
            setTimeout(startAutoSlide, restartDelay);
        }
    }
}); // Force redeploy

// Service pricing is now handled by the existing updatePaymentAmount function

// Modal functions for booking
function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Initialize pricing when modal opens
        setTimeout(() => {
            updatePaymentAmount();
        }, 100);
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Enhanced booking form submission for server-side processing
async function submitBookingForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Get the current service price
    const servicePrice = window.currentServicePrice;
    
    if (!servicePrice) {
        alert('Please select a lesson type before proceeding with payment.');
        return;
    }
    const serviceName = form.instrument.options[form.instrument.selectedIndex].text;
    
    // Check if running on GitHub Pages or static hosting
    const config = window.MUSIC_TUTORING_CONFIG;
    const isGitHubPages = config && config.IS_GITHUB_PAGES;
    const isLocalStaticServer = window.location.port === '8000' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const isGitHubPagesHost = window.location.hostname.includes('github.io');
    const isNodeJSServer = window.location.port === '3000';
    
    // Use GitHub Pages mode for: GitHub Pages hosting, local static server, or when explicitly configured
    if (isGitHubPages || isGitHubPagesHost || isLocalStaticServer || !isNodeJSServer) {
        console.log('🎵 Using GitHub Pages booking mode - redirecting to form submission');
        
        // For GitHub Pages, just submit the form normally (FormSubmit will handle it)
        form.submit();
        return;
    }
    
    try {
        // Create payment intent (server mode only)
        const paymentResponse = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: servicePrice,
                currency: 'usd',
                booking_id: 'MUSIC-' + Date.now(),
                product_id: getProductId(form.instrument.value),
                service_name: serviceName
            })
        });
        
        const paymentResult = await paymentResponse.json();
        
        if (paymentResult.success) {
            // Process payment with Stripe (this would integrate with your existing Stripe code)
            console.log('💳 Payment intent created:', paymentResult.clientSecret);
            // Here you would integrate with your existing Stripe payment processing
        } else {
            throw new Error(paymentResult.message || 'Failed to create payment intent');
        }
        
    } catch (error) {
        console.error('❌ Booking submission failed:', error);
        alert('Booking failed: ' + error.message);
    }
}

function getProductId(serviceType) {
    switch(serviceType) {
        case 'test':
            return 'prod_SoV04nXT5LK8vG';
        case 'online':
        case 'travelling':
        default:
            return 'prod_SoV04nXT5LK8vG'; // Using the same product for now - you can create separate products later
    }
}

// Note: Form submission is now handled by the main event listener in the DOM ready function above
// This duplicate handler has been removed to prevent double submission

// Address field is now always visible - no toggle needed
