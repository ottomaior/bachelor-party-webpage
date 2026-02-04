// Interactive features: dares, RSVP, share

// ===== DARE GENERATOR - MAGYAR =====
const dares = [
    "Játszol te faszoddal, köcsög",
    "Játszol te faszoddal, köcsög",
    "Játszol te faszoddal, köcsög",
    "Játszol te faszoddal, köcsög"
];

function generateDare() {
    const randomDare = dares[Math.floor(Math.random() * dares.length)];
    const dareText = document.getElementById('dareText');
    
    if (dareText) {
        dareText.style.opacity = '0';
        setTimeout(() => {
            dareText.textContent = `"${randomDare}"`;
            dareText.style.opacity = '1';
        }, 200);
    }
    
    triggerConfetti();
}

// ===== RSVP FORM - Firebase verzió =====
function handleRSVP(event) {
    event.preventDefault();
    
    console.log('📝 Form submitted!');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📋 Form data:', data);
    
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not defined!');
        alert('Firebase nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        return;
    }
    
    if (typeof db === 'undefined') {
        console.error('❌ Firestore db not defined!');
        alert('Firestore nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Küldés...';
    submitBtn.disabled = true;
    
    console.log('🚀 Sending to Firebase...');
    
    // Prepare data object with all fields
    const rsvpData = {
        // Basic info
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        attending: data.attending || '',
        
        // Travel details
        startLocation: data.startLocation || '',
        startLocationOther: data.startLocationOther || '',
        transportMethod: data.transportMethod || '',
        
        // Car driver specific
        carSeats: data.carSeats || '',
        carRoute: data.carRoute || '',
        carCostShare: data.carCostShare || '',
        
        // Car passenger specific
        preferredPickup: data.preferredPickup || '',
        flexiblePickup: data.flexiblePickup || '',
        
        // Mixed transport
        mixedRoute: data.mixedRoute || '',
        
        // Timing
        arrivalDay: data.arrivalDay || '',
        departureDay: data.departureDay || '',
        
        // Other
        dietary: data.dietary || '',
        message: data.message || '',
        
        // Metadata
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
    };
    
    console.log('📦 RSVP data to save:', rsvpData);
    
    // Add to Firestore
    db.collection('rsvps').add(rsvpData)
    .then((docRef) => {
        console.log('✅ Document written with ID:', docRef.id);
        
        // Success!
        const formEl = document.getElementById('rsvpForm');
        const confirmEl = document.getElementById('rsvpConfirmation');
        
        if (formEl) formEl.style.display = 'none';
        if (confirmEl) confirmEl.style.display = 'block';
        
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
        
        // Scroll to stats to see their entry
        setTimeout(() => {
            const statsSection = document.getElementById('stats-dashboard');
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 2000);
    })
    .catch((error) => {
        console.error('❌ Error adding document:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        alert('Hiba történt a küldés közben:\n' + error.message + '\n\nPróbáld újra vagy írj WhatsAppon!');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// ===== SHARE FUNCTIONS =====
function shareOnWhatsApp() {
    const text = encodeURIComponent("Meghívlak Otto legénybúcsújára! 🎉 Nézd meg a részleteket:");
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function copyLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('🔗 Link másolva!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopyTextToClipboard(window.location.href);
        });
    } else {
        fallbackCopyTextToClipboard(window.location.href);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('🔗 Link másolva!');
    } catch (err) {
        console.error('Fallback: Could not copy text', err);
        alert('Link másolása sikertelen. Másold ki manuálisan: ' + text);
    }
    
    document.body.removeChild(textarea);
}

// ===== TRAVEL SECTION TOGGLE =====
function toggleTravelSection() {
    const attending = document.getElementById('attending').value;
    const travelSection = document.getElementById('travelSection');
    
    console.log('toggleTravelSection called, value:', attending);
    
    if (attending === 'yes') {
        travelSection.style.display = 'block';
    } else {
        travelSection.style.display = 'none';
    }
}

// ===== UPDATE TRAVEL OPTIONS =====
function updateTravelOptions() {
    const location = document.getElementById('startLocation').value;
    const otherGroup = document.getElementById('otherLocationGroup');
    
    if (location === 'other') {
        otherGroup.style.display = 'block';
    } else {
        otherGroup.style.display = 'none';
    }
}

// ===== TOGGLE TRANSPORT DETAILS =====
function toggleTransportDetails() {
    const method = document.getElementById('transportMethod').value;
    
    console.log('toggleTransportDetails called, method:', method);
    
    // Hide all
    document.getElementById('carDriverDetails').style.display = 'none';
    document.getElementById('carPassengerDetails').style.display = 'none';
    document.getElementById('mixedTransportDetails').style.display = 'none';
    
    // Show relevant
    if (method === 'car-driver') {
        document.getElementById('carDriverDetails').style.display = 'block';
    } else if (method === 'car-passenger') {
        document.getElementById('carPassengerDetails').style.display = 'block';
    } else if (method === 'mixed') {
        document.getElementById('mixedTransportDetails').style.display = 'block';
    }
}
