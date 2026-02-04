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
