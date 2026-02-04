// Countdown timer functionality

// Prága trip - Május 6, 2026, 12:00
const partyDate = new Date(2026, 4, 6, 12, 0, 0).getTime(); // Month is 0-indexed (4 = May)

function updateCountdown() {
    const now = new Date().getTime();
    const distance = partyDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update countdown display
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

    // Update stats
    const daysUntilEl = document.getElementById('daysUntil');
    if (daysUntilEl) {
        daysUntilEl.textContent = days;
    }

    // Handle countdown expiry
    if (distance < 0) {
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.innerHTML = '<h2 style="color: var(--accent-gold);">🎉 PRÁGA IDŐ! 🎉</h2>';
        }
    }
}

// Update every second
setInterval(updateCountdown, 1000);
updateCountdown();