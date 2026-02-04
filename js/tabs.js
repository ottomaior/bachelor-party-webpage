// Tabs system functionality

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const tabIndicator = document.getElementById('tabIndicator');
const tabsContainer = document.getElementById('tabs');

function setActiveTab(button) {
    const targetTab = button.getAttribute('data-tab');
    
    // Update buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Update content
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('data-tab') === targetTab) {
            content.classList.add('active');
        }
    });
    
    // Move indicator
    updateTabIndicator(button);
}

function updateTabIndicator(button) {
    const buttonRect = button.getBoundingClientRect();
    const containerRect = tabsContainer.getBoundingClientRect();
    const left = buttonRect.left - containerRect.left + tabsContainer.scrollLeft;
    
    tabIndicator.style.width = buttonRect.width + 'px';
    tabIndicator.style.transform = `translateX(${left}px)`;
}

// Add click listeners to tab buttons
tabButtons.forEach(button => {
    button.addEventListener('click', () => setActiveTab(button));
});

// Initialize indicator position on load
window.addEventListener('load', () => {
    const activeButton = document.querySelector('.tab-button.active');
    if (activeButton) {
        setActiveTab(activeButton);
    }
});

// Update indicator on window resize
window.addEventListener('resize', () => {
    const activeButton = document.querySelector('.tab-button.active');
    if (activeButton) {
        updateTabIndicator(activeButton);
    }
});
