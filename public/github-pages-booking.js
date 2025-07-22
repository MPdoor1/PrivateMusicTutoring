// Simplified booking system for GitHub Pages deployment
// This version uses external services for form handling and payments

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeGitHubPagesBooking();
});

function initializeGitHubPagesBooking() {
    const config = window.MUSIC_TUTORING_CONFIG;
    
    if (config && config.IS_GITHUB_PAGES) {
        console.log('🎵 GitHub Pages mode activated for Music Tutoring');
        setupGitHubPagesHandlers();
    }
}

function setupGitHubPagesHandlers() {
    // Replace the complex booking modal with a simplified version
    const bookButtons = document.querySelectorAll('[onclick*="openBookingModal"]');
    bookButtons.forEach(button => {
        button.onclick = function(e) {
            e.preventDefault();
            openSimplifiedBookingModal();
        };
    });
}

function openSimplifiedBookingModal() {
    // Create and show a simplified booking modal
    const modal = document.getElementById('bookingModal');
    if (modal) {
        // Update the form action to use FormSubmit or similar service
        const form = modal.querySelector('#bookingForm');
        if (form && window.MUSIC_TUTORING_CONFIG) {
            form.action = window.MUSIC_TUTORING_CONFIG.FORM_ACTION;
            form.method = 'POST';
            
            // Add hidden fields for FormSubmit configuration
            addHiddenField(form, '_subject', 'New Music Lesson Booking Request');
            addHiddenField(form, '_captcha', 'false');
            addHiddenField(form, '_template', 'table');
            addHiddenField(form, '_next', window.location.href + '#booking-success');
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function addHiddenField(form, name, value) {
    const existing = form.querySelector(`input[name="${name}"]`);
    if (!existing) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }
}

// Payment handling is now integrated into main script.js
// This function is no longer needed as it's been moved to script.js

// Show success message after form submission
function showBookingSuccess() {
    if (window.location.hash === '#booking-success') {
        const successMessage = document.createElement('div');
        successMessage.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        text-align: center; z-index: 10000;">
                <h2 style="color: #C56C3A; margin-bottom: 15px;">🎵 Booking Request Sent!</h2>
                <p>Thank you for your interest in our music lessons!</p>
                <p>We'll contact you within 24 hours to confirm your lesson and send payment details.</p>
                <button onclick="this.parentElement.parentElement.remove(); window.location.hash='';" 
                        style="margin-top: 15px; padding: 10px 20px; background: #C56C3A; color: white; 
                               border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.5); z-index: 9999;"></div>
        `;
        document.body.appendChild(successMessage);
        
        // Remove hash from URL after showing message
        setTimeout(() => {
            window.history.replaceState('', document.title, window.location.pathname);
        }, 1000);
    }
}

// Check for success message on page load
window.addEventListener('load', showBookingSuccess);
window.addEventListener('hashchange', showBookingSuccess); 