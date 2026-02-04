// Navigation functionality

const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');

// Scroll effect for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Update active nav link based on scroll position
    updateActiveNavLink();
});

// Update active navigation link
function updateActiveNavLink() {
    let current = '';
    
    // Get all sections with IDs
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 150 && window.scrollY < sectionTop + sectionHeight - 150) {
            current = section.getAttribute('id');
        }
    });

    // Update nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.slice(1) === current) {
            link.classList.add('active');
        }
    });
}

// Hamburger menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
});

// Handle navigation clicks - support both sections and tabs
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // If it's an external link (like expenses.html), let it navigate normally
        if (href && (href.includes('.html') || href.startsWith('http'))) {
            return; // Don't prevent default, let the link work!
        }
        
        // Only prevent default for internal anchors (like #program, #banda)
        e.preventDefault();
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
        
        const targetId = href.slice(1);
        const tabName = link.getAttribute('data-tab');
        
        // Check if this nav link should activate a tab
        if (tabName) {
            // It's a tab navigation - scroll to tabs and activate the tab
            const tabsContainer = document.querySelector('.tabs-container');
            if (tabsContainer) {
                tabsContainer.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Wait for scroll, then activate tab
            setTimeout(() => {
                const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
                if (tabButton) {
                    tabButton.click();
                }
            }, 500);
        } else {
            // It's a regular section - just scroll to it
            scrollToSection(targetId);
        }
    });
});
