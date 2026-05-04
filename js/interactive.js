// Interactive features: dares, RSVP, share

// ===== DARE GENERATOR - MAGYAR =====
const dares = [
    "Vegyél egy kört az asztaltársaságnak! 🍻",
    "Énekelj el egy dalt karaoke stílusban! 🎤",
    "Csinálj 10 guggolást a bár közepén! 💪",
    "Kérj el egy idegentől egy szelfit! 📸",
    "Mondd el a kedvenc viccet hangosan! 😂",
    "Táncolj 30 másodpercig zene nélkül! 💃",
    "Hívd fel az anyukádat és mondd el mennyire szereted! ❤️",
    "Igyál egy feles szemkontaktus nélkül! 🥃",
    "Adj egy tósztot Ottóra a legjobb formában! 🥂",
    "Cserélj ruhát valakivel 5 percre! 👔",
    "Beszélj akcentussal a következő 10 percben! 🗣️",
    "Mesélj el egy kínos sztorit magadról! 😅",
    "Találj ki egy új becenevet Ottónak! 🏷️",
    "Csináld végig a Macarena táncot! 🕺",
    "Kérj egy autogramot a pincértől! ✍️",
    "Rendeld meg a következő italt csak kézjelekkel! 🤟",
    "Mondj 5 dolgot amit szeretsz Ottóban! 💝",
    "Fotózkodj le egy szoborral kreatívan! 🗿",
    "Tanítsd meg valakinek a kedvenc táncmozdulatod! 🎶",
    "Adj le 20 fekvőtámaszt most azonnal! 🏋️"
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
        if (window.toast) {
            window.toast.error('Firebase nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        } else {
            alert('Firebase nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        }
        return;
    }
    
    if (typeof db === 'undefined') {
        console.error('❌ Firestore db not defined!');
        if (window.toast) {
            window.toast.error('Firestore nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        } else {
            alert('Firestore nincs betöltve. Frissítsd az oldalt és próbáld újra!');
        }
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
        
        if (window.toast) {
            window.toast.error('Próbáld újra vagy írj WhatsAppon!', {
                title: 'Hiba történt a küldés közben',
                duration: 6000
            });
        } else {
            alert('Hiba történt a küldés közben:\n' + error.message + '\n\nPróbáld újra vagy írj WhatsAppon!');
        }
        
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
            if (window.toast) {
                window.toast.success('Link másolva a vágólapra!', { icon: '🔗' });
            } else {
                alert('🔗 Link másolva!');
            }
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
        if (window.toast) {
            window.toast.success('Link másolva a vágólapra!', { icon: '🔗' });
        } else {
            alert('🔗 Link másolva!');
        }
    } catch (err) {
        console.error('Fallback: Could not copy text', err);
        if (window.toast) {
            window.toast.error('Link másolása sikertelen. Másold ki manuálisan!');
        } else {
            alert('Link másolása sikertelen. Másold ki manuálisan: ' + text);
        }
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
    const select = document.getElementById('transportMethod');
    if (!select) return;
    const method = select.value;

    const carDriver = document.getElementById('carDriverDetails');
    const carPassenger = document.getElementById('carPassengerDetails');
    const mixed = document.getElementById('mixedTransportDetails');

    if (carDriver) carDriver.style.display = 'none';
    if (carPassenger) carPassenger.style.display = 'none';
    if (mixed) mixed.style.display = 'none';

    if (method === 'car-driver' && carDriver) {
        carDriver.style.display = 'block';
    } else if (method === 'car-passenger' && carPassenger) {
        carPassenger.style.display = 'block';
    } else if (method === 'mixed' && mixed) {
        mixed.style.display = 'block';
    }
}

// Wire up form-section toggles automatically
document.addEventListener('DOMContentLoaded', function () {
    const attendingSelect = document.getElementById('attending');
    const travelSection = document.getElementById('travelSection');
    if (attendingSelect && travelSection) {
        attendingSelect.addEventListener('change', function () {
            travelSection.style.display = (this.value === 'yes' || this.value === 'maybe') ? 'block' : 'none';
        });
    }

    const startLocationSelect = document.getElementById('startLocation');
    const otherLocationGroup = document.getElementById('otherLocationGroup');
    if (startLocationSelect && otherLocationGroup) {
        startLocationSelect.addEventListener('change', function () {
            otherLocationGroup.style.display = this.value === 'other' ? 'block' : 'none';
        });
    }

    const transportMethodSelect = document.getElementById('transportMethod');
    if (transportMethodSelect) {
        transportMethodSelect.addEventListener('change', toggleTransportDetails);
    }
});
