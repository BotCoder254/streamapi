/**
 * Contact Page JavaScript
 * Handles form submission, validation, and animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get form element
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        // Add submission handler
        contactForm.addEventListener('submit', function(e) {
            // Form is handled by server-side processing
            // This is just for additional client-side validation and UX enhancements
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const messageInput = document.getElementById('message');
            
            let isValid = true;
            
            // Basic validation
            if (!nameInput.value.trim()) {
                highlightInvalidField(nameInput);
                isValid = false;
            } else {
                resetInvalidField(nameInput);
            }
            
            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                highlightInvalidField(emailInput);
                isValid = false;
            } else {
                resetInvalidField(emailInput);
            }
            
            if (!subjectInput.value.trim()) {
                highlightInvalidField(subjectInput);
                isValid = false;
            } else {
                resetInvalidField(subjectInput);
            }
            
            if (!messageInput.value.trim()) {
                highlightInvalidField(messageInput);
                isValid = false;
            } else {
                resetInvalidField(messageInput);
            }
            
            if (!isValid) {
                e.preventDefault();
                showFormError('Please fill in all required fields correctly.');
            } else {
                // Add loading state
                const submitButton = contactForm.querySelector('button[type="submit"]');
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
                submitButton.disabled = true;
            }
        });
    }
    
    // Setup FAQ functionality
    setupFAQ();
});

/**
 * Validates email format
 */
function isValidEmail(email) {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
}

/**
 * Highlights an invalid form field
 */
function highlightInvalidField(element) {
    element.classList.add('border-red-500');
    element.classList.add('animate__animated', 'animate__shakeX');
    
    // Remove animation class after it completes
    setTimeout(() => {
        element.classList.remove('animate__animated', 'animate__shakeX');
    }, 1000);
}

/**
 * Resets a form field from invalid state
 */
function resetInvalidField(element) {
    element.classList.remove('border-red-500');
}

/**
 * Shows a form error message
 */
function showFormError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'bg-red-600 text-white p-4 rounded-lg mb-6 animate__animated animate__fadeIn';
    errorContainer.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-2xl mr-2"></i>
            <div>
                <h3 class="font-bold">Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    // Find the form
    const form = document.getElementById('contact-form');
    
    // Check if an error message already exists
    const existingError = form.parentNode.querySelector('.bg-red-600');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert error before the form
    form.parentNode.insertBefore(errorContainer, form);
    
    // Scroll to error message
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Setup FAQ toggle functionality
 */
function setupFAQ() {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            content.classList.toggle('hidden');
            icon.classList.toggle('transform');
            icon.classList.toggle('rotate-180');
            
            // Close other FAQ items
            faqToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    const otherContent = otherToggle.nextElementSibling;
                    const otherIcon = otherToggle.querySelector('i');
                    
                    if (!otherContent.classList.contains('hidden')) {
                        otherContent.classList.add('hidden');
                        otherIcon.classList.remove('rotate-180');
                    }
                }
            });
        });
    });
} 