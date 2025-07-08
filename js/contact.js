/**
 * Damka Swimwear - Contact Page JavaScript
 * 
 * This file contains functionality specific to the contact page,
 * including form handling, validation, and FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', function() {
    initContactForm();
    initFaqAccordion();
});

/**
 * Initialize Contact Form
 */
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    
    if (!contactForm || !formMessage) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm(contactForm)) {
            return;
        }
        
        // Show loading message
        formMessage.innerHTML = '<div class="loading-message"><div class="spinner-small"></div> שולח הודעה...</div>';
        formMessage.style.display = 'block';
        
        // Get form data
        const formData = {
            name: contactForm.elements['name'].value,
            email: contactForm.elements['email'].value,
            phone: contactForm.elements['phone'].value || '',
            subject: contactForm.elements['subject'].value,
            message: contactForm.elements['message'].value,
            newsletter: contactForm.elements['newsletter'].checked,
            timestamp: new Date().toISOString(),
            status: 'new'
        };
        
        // Send to Firebase
        db.collection('contact_messages').add(formData)
            .then(() => {
                // Success message
                formMessage.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> תודה! ההודעה נשלחה בהצלחה. ניצור איתך קשר בהקדם.</div>';
                
                // Reset form
                contactForm.reset();
                
                // Add to newsletter if requested
                if (formData.newsletter) {
                    subscribeToNewsletter(formData.email)
                        .catch(error => console.error('Error subscribing to newsletter:', error));
                }
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            })
            .catch(error => {
                // Error message
                console.error('Error sending message:', error);
                formMessage.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> אירעה שגיאה בשליחת ההודעה. נסי שוב מאוחר יותר או צרי קשר באחת מהדרכים האחרות.</div>';
            });
    });
    
    // Input validation on change
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
        
        input.addEventListener('input', function() {
            // Remove error if input has value
            if (this.value.trim() !== '') {
                this.classList.remove('invalid');
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        });
    });
}

/**
 * Validate Contact Form
 * @param {HTMLFormElement} form - The form to validate
 * @return {boolean} - Whether the form is valid
 */
function validateForm(form) {
    let isValid = true;
    
    // Reset previous errors
    const previousErrors = form.querySelectorAll('.error-message');
    previousErrors.forEach(error => error.remove());
    
    const requiredInputs = form.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Check email format if provided
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && emailInput.value.trim() !== '') {
        if (!validateEmail(emailInput.value.trim())) {
            displayError(emailInput, 'אנא הזיני כתובת אימייל תקינה');
            isValid = false;
        }
    }
    
    return isValid;
}

/**
 * Validate a single input field
 * @param {HTMLElement} input - The input element to validate
 * @return {boolean} - Whether the input is valid
 */
function validateInput(input) {
    // Skip non-required inputs with no value
    if (!input.hasAttribute('required') && input.value.trim() === '') {
        return true;
    }
    
    // Check if required input is empty
    if (input.hasAttribute('required') && input.value.trim() === '') {
        displayError(input, 'שדה זה הוא שדה חובה');
        return false;
    }
    
    // Check email format
    if (input.type === 'email') {
        if (!validateEmail(input.value.trim())) {
            displayError(input, 'אנא הזיני כתובת אימייל תקינה');
            return false;
        }
    }
    
    // Check phone format if provided
    if (input.type === 'tel' && input.value.trim() !== '') {
        if (!validatePhone(input.value.trim())) {
            displayError(input, 'אנא הזיני מספר טלפון תקין');
            return false;
        }
    }
    
    return true;
}

/**
 * Display error message for an input
 * @param {HTMLElement} input - The input element
 * @param {string} message - The error message
 */
function displayError(input, message) {
    // Remove any existing error for this input
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error class to input
    input.classList.add('invalid');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Insert after input or its label
    input.parentElement.appendChild(errorElement);
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @return {boolean} - Whether the email is valid
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @return {boolean} - Whether the phone number is valid
 */
function validatePhone(phone) {
    // Allow international format or Israeli format
    const phoneRegex = /^(\+\d{1,3}\s?)?\(?\d{2,3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    return phoneRegex.test(phone);
}

/**
 * Initialize FAQ Accordion
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) return;
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', function() {
                // Toggle current item
                item.classList.toggle('active');
                
                // Update icon
                const icon = this.querySelector('.faq-icon i');
                if (item.classList.contains('active')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
                
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        
                        // Update other icons
                        const otherIcon = otherItem.querySelector('.faq-icon i');
                        if (otherIcon) {
                            otherIcon.classList.remove('fa-chevron-up');
                            otherIcon.classList.add('fa-chevron-down');
                        }
                    }
                });
            });
        }
    });
}

/**
 * Add custom styles for form validation
 */
(function() {
    // Create style element
    const style = document.createElement('style');
    style.textContent = `
        .form-group input.invalid,
        .form-group select.invalid,
        .form-group textarea.invalid {
            border-color: #e53935;
            box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.2);
        }
        
        .form-group .error-message {
            color: #e53935;
            font-size: 13px;
            margin-top: 5px;
        }
    `;
    document.head.appendChild(style);
})();

/**
 * Send "Contact Form Viewed" event to analytics
 */
function sendContactFormViewedEvent() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': 'Contact Page',
            'page_location': window.location.href,
            'page_path': window.location.pathname,
            'event_category': 'engagement'
        });
    }
}

// Send contact form viewed event when page loads
document.addEventListener('DOMContentLoaded', sendContactFormViewedEvent);