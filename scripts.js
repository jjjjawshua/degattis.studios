// Navigation functionality
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links and pages
        navLinks.forEach(l => l.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Show corresponding page
        const pageId = link.getAttribute('data-page');
        document.getElementById(pageId).classList.add('active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});


// Clock functionality
let currentTimezone = 'America/New_York';
const clockElement = document.getElementById('clock');
const cityButtons = document.querySelectorAll('.city-btn');

function updateClock() {
    const now = new Date();
    const options = {
        timeZone: currentTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    clockElement.textContent = now.toLocaleTimeString('en-US', options);
}

cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        cityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimezone = btn.getAttribute('data-timezone');
        updateClock();
    });
});

updateClock();
setInterval(updateClock, 1000);

// Contact form submission
const contactForm = document.getElementById('contact-form');
const thankYouMessage = document.getElementById('thank-you-message');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'sending...';
    submitButton.disabled = true;

    fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            contactForm.style.display = 'none';
            thankYouMessage.style.display = 'block';
            contactForm.reset();
        } else {
            throw new Error('Form submission failed');
        }
    })
    .catch(error => {
        alert('There was an error sending your message. Please try again.');
    })
    .finally(() => {
        submitButton.textContent = 'send message';
        submitButton.disabled = false;
    });
});

function resetContactForm() {
    contactForm.style.display = 'block';
    thankYouMessage.style.display = 'none';
}
