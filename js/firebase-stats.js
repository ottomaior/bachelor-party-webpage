// Firebase Statistics & Real-time Updates

let statsListener = null;

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, waiting for Firebase...');
    setTimeout(initializeStats, 1000);
});

function initializeStats() {
    if (typeof db === 'undefined') {
        console.error('Firebase db not found, retrying...');
        setTimeout(initializeStats, 1000);
        return;
    }
    
    console.log('Firebase stats module loaded');
    console.log('Setting up real-time listener...');
    
    // Setup real-time listener
    statsListener = db.collection('rsvps').onSnapshot(
        function(snapshot) {
            console.log('📊 Received', snapshot.size, 'RSVPs');
            updateStatistics(snapshot);
            updateAttendeesList(snapshot);
            updateTransportBreakdown(snapshot);
            updateCarPooling(snapshot);
        },
        function(error) {
            console.error('❌ Listener error:', error);
        }
    );
}

function updateStatistics(snapshot) {
    let totalYes = 0;
    let totalMaybe = 0;
    let totalCarDrivers = 0;
    let totalCarPassengers = 0;
    let totalTrainUsers = 0;
    let availableSeats = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.attending === 'yes') totalYes++;
        if (data.attending === 'maybe') totalMaybe++;
        
        if (data.transportMethod === 'car-driver') {
            totalCarDrivers++;
            availableSeats += parseInt(data.carSeats || 0);
        }
        if (data.transportMethod === 'car-passenger') totalCarPassengers++;
        if (data.transportMethod === 'train') totalTrainUsers++;
    });

    // Update stat boxes
    const totalAttendingEl = document.getElementById('totalAttending');
    const totalMaybeEl = document.getElementById('totalMaybe');
    const totalTrainEl = document.getElementById('totalTrain');
    const totalCarEl = document.getElementById('totalCar');

    if (totalAttendingEl) totalAttendingEl.textContent = totalYes;
    if (totalMaybeEl) totalMaybeEl.textContent = totalMaybe;
    if (totalTrainEl) totalTrainEl.textContent = totalTrainUsers;
    if (totalCarEl) totalCarEl.textContent = totalCarDrivers + totalCarPassengers;
    
    console.log('✅ Stats updated:', { 
        yes: totalYes, 
        maybe: totalMaybe, 
        carDrivers: totalCarDrivers,
        availableSeats: availableSeats,
        carPassengers: totalCarPassengers
    });
}

function updateAttendeesList(snapshot) {
    const container = document.getElementById('attendeesList');
    if (!container) return;
    
    if (snapshot.empty) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1/-1;">
                <p>Még senki nem jelentkezett... legyél te az első! 🎉</p>
            </div>
        `;
        return;
    }

    let html = '';
    let count = 0;
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.attending === 'yes' || data.attending === 'maybe') {
            count++;
            const avatar = getAvatarEmoji(data.name || 'User');
            const statusClass = data.attending === 'maybe' ? 'maybe' : '';
            const statusText = data.attending === 'yes' ? 'Jön! 🎉' : 'Talán 🤔';
            
            // Transport details
            let transportInfo = '';
            if (data.transportMethod === 'car-driver') {
                transportInfo = `
                    <div style="background: rgba(0,212,255,0.15); padding: 15px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--accent-blue);">
                        <div style="font-weight: 600; color: var(--accent-blue); margin-bottom: 10px;">
                            🚗 Sofőr - ${data.carSeats || '?'} szabad hely
                        </div>
                        ${data.startLocation ? `<div style="font-size: 0.9rem; margin: 5px 0;">📍 Indul: <strong>${getLocationName(data.startLocation, data.startLocationOther)}</strong></div>` : ''}
                        ${data.carRoute ? `<div style="font-size: 0.9rem; margin: 5px 0; color: var(--text-muted);">🗺️ ${data.carRoute}</div>` : ''}
                        ${data.carCostShare ? `<div style="font-size: 0.85rem; margin-top: 8px; color: var(--accent-gold);">💰 Megosztja a benzin költséget</div>` : ''}
                        ${data.phone ? `<div style="font-size: 0.9rem; margin-top: 8px;">📞 ${data.phone}</div>` : ''}
                    </div>
                `;
            } else if (data.transportMethod === 'car-passenger') {
                transportInfo = `
                    <div style="background: rgba(255,215,0,0.15); padding: 15px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--accent-gold);">
                        <div style="font-weight: 600; color: var(--accent-gold); margin-bottom: 10px;">
                            🚗 Utas - Autóstársat keres
                        </div>
                        ${data.startLocation ? `<div style="font-size: 0.9rem; margin: 5px 0;">📍 Indul: <strong>${getLocationName(data.startLocation, data.startLocationOther)}</strong></div>` : ''}
                        ${data.preferredPickup ? `<div style="font-size: 0.9rem; margin: 5px 0;">🔄 Csatlakozás: ${data.preferredPickup}</div>` : ''}
                        ${data.flexiblePickup ? `<div style="font-size: 0.85rem; margin-top: 8px; color: var(--accent-blue);">✅ Rugalmas a csatlakozási ponttal</div>` : ''}
                        ${data.phone ? `<div style="font-size: 0.9rem; margin-top: 8px;">📞 ${data.phone}</div>` : ''}
                    </div>
                `;
            } else if (data.transportMethod === 'mixed') {
                transportInfo = `
                    <div style="background: rgba(255,0,110,0.15); padding: 15px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--accent-pink);">
                        <div style="font-weight: 600; color: var(--accent-pink); margin-bottom: 10px;">
                            🔀 Kombinált utazás
                        </div>
                        ${data.startLocation ? `<div style="font-size: 0.9rem; margin: 5px 0;">📍 Indul: <strong>${getLocationName(data.startLocation, data.startLocationOther)}</strong></div>` : ''}
                        ${data.mixedRoute ? `<div style="font-size: 0.9rem; margin: 10px 0; white-space: pre-line; color: var(--text-muted);">${data.mixedRoute}</div>` : ''}
                        ${data.phone ? `<div style="font-size: 0.9rem; margin-top: 8px;">📞 ${data.phone}</div>` : ''}
                    </div>
                `;
            } else if (data.transportMethod === 'train') {
                transportInfo = `
                    <div style="background: rgba(102,126,234,0.15); padding: 15px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--accent-purple);">
                        <div style="font-weight: 600; color: var(--accent-purple); margin-bottom: 10px;">
                            🚆 Vonattal utazik
                        </div>
                        ${data.startLocation ? `<div style="font-size: 0.9rem; margin: 5px 0;">📍 Indul: <strong>${getLocationName(data.startLocation, data.startLocationOther)}</strong></div>` : ''}
                    </div>
                `;
            } else if (data.transportMethod) {
                transportInfo = `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-top: 15px;">
                        <div style="font-size: 0.9rem;">🚀 ${getTransportMethodName(data.transportMethod)}</div>
                        ${data.startLocation ? `<div style="font-size: 0.9rem; margin: 5px 0;">📍 ${getLocationName(data.startLocation, data.startLocationOther)}</div>` : ''}
                    </div>
                `;
            }
            
            // Timing info
            let timingInfo = '';
            if (data.arrivalDay || data.departureDay) {
                timingInfo = `
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        ${data.arrivalDay ? `<div style="font-size: 0.85rem; margin: 3px 0;">📅 Érkezés: ${getTimingName(data.arrivalDay)}</div>` : ''}
                        ${data.departureDay ? `<div style="font-size: 0.85rem; margin: 3px 0;">📅 Távozás: ${getTimingName(data.departureDay)}</div>` : ''}
                    </div>
                `;
            }
            
            html += `
                <div class="attendee-card ${statusClass}">
                    <div class="attendee-header">
                        <div class="attendee-avatar">${avatar}</div>
                        <div class="attendee-info">
                            <h4>${data.name || 'Névtelen'}</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin: 5px 0 0 0;">
                                ${statusText}
                            </p>
                        </div>
                    </div>
                    
                    ${transportInfo}
                    ${timingInfo}
                    
                    <div class="attendee-meta" style="margin-top: 15px;">
                        ${data.phone ? `<span class="meta-tag">📞 ${data.phone}</span>` : ''}
                        ${data.dietary ? `<span class="meta-tag">🍽️ ${data.dietary}</span>` : ''}
                    </div>
                    
                    ${data.message ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="font-style: italic; color: var(--text-muted); font-size: 0.9rem;">
                                💬 "${data.message}"
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    });

    if (html === '') {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1/-1;">
                <p>Még senki nem jelentkezett... legyél te az első! 🎉</p>
            </div>
        `;
    } else {
        container.innerHTML = html;
    }
    
    console.log('✅ Attendees list updated:', count, 'people');
}

function updateTransportBreakdown(snapshot) {
    const container = document.getElementById('transportBreakdown');
    if (!container) return;
    
    const stats = {
        'car-driver': 0,
        'car-passenger': 0,
        'train': 0,
        'plane': 0,
        'mixed': 0,
        'undecided': 0
    };

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attending === 'yes' && data.transportMethod) {
            stats[data.transportMethod] = (stats[data.transportMethod] || 0) + 1;
        }
    });

    let html = '';
    
    if (stats['car-driver'] > 0) {
        html += `
            <div class="transport-card">
                <div class="transport-icon">🚗👨‍✈️</div>
                <div class="transport-count">${stats['car-driver']}</div>
                <div class="transport-label">Sofőrök</div>
            </div>
        `;
    }
    
    if (stats['car-passenger'] > 0) {
        html += `
            <div class="transport-card">
                <div class="transport-icon">🚗👤</div>
                <div class="transport-count">${stats['car-passenger']}</div>
                <div class="transport-label">Utasok</div>
            </div>
        `;
    }
    
    if (stats['train'] > 0) {
        html += `
            <div class="transport-card">
                <div class="transport-icon">🚆</div>
                <div class="transport-count">${stats['train']}</div>
                <div class="transport-label">Vonattal</div>
            </div>
        `;
    }
    
    if (stats['mixed'] > 0) {
        html += `
            <div class="transport-card">
                <div class="transport-icon">🔀</div>
                <div class="transport-count">${stats['mixed']}</div>
                <div class="transport-label">Kombinált</div>
            </div>
        `;
    }

    if (html === '') {
        html = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1/-1;">
                <p>Még nincs utazási preferencia megadva</p>
            </div>
        `;
    }

    container.innerHTML = html;
    console.log('✅ Transport breakdown updated');
}

function updateCarPooling(snapshot) {
    // Check if carpooling section exists
    let carpoolSection = document.getElementById('carpoolSection');
    
    if (!carpoolSection) {
        // Create it before transport breakdown
        const statsSection = document.getElementById('stats-dashboard');
        if (!statsSection) return;
        
        const transportDiv = statsSection.querySelector('#transportBreakdown').parentElement;
        
        carpoolSection = document.createElement('div');
        carpoolSection.id = 'carpoolSection';
        carpoolSection.style.marginTop = '60px';
        carpoolSection.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 30px;">🚗 Autómegosztás / Carpooling</h3>
            <div id="carpoolList"></div>
        `;
        
        transportDiv.parentNode.insertBefore(carpoolSection, transportDiv);
    }
    
    const container = document.getElementById('carpoolList');
    if (!container) return;
    
    let drivers = [];
    let passengers = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attending === 'yes') {
            if (data.transportMethod === 'car-driver' && data.carSeats) {
                drivers.push(data);
            } else if (data.transportMethod === 'car-passenger') {
                passengers.push(data);
            }
        }
    });
    
    if (drivers.length === 0 && passengers.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <p>Még nincs autós koordináció</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid-2">';
    
    // Drivers column
    html += '<div>';
    html += '<h4 style="color: var(--accent-blue); margin-bottom: 20px;">👨‍✈️ Sofőrök (szabad helyek)</h4>';
    
    if (drivers.length > 0) {
        drivers.forEach(driver => {
            html += `
                <div style="background: rgba(0,212,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 2px solid rgba(0,212,255,0.3);">
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">${driver.name}</div>
                    <div style="font-size: 1.5rem; color: var(--accent-blue); margin: 10px 0;">
                        ${driver.carSeats} 🪑 szabad hely
                    </div>
                    ${driver.startLocation ? `<div style="margin: 8px 0;">📍 <strong>${getLocationName(driver.startLocation, driver.startLocationOther)}</strong></div>` : ''}
                    ${driver.carRoute ? `<div style="margin: 8px 0; font-size: 0.9rem; color: var(--text-muted);">🗺️ ${driver.carRoute}</div>` : ''}
                    ${driver.carCostShare ? `<div style="margin: 8px 0; color: var(--accent-gold); font-size: 0.9rem;">💰 Megosztja a költséget</div>` : ''}
                    ${driver.phone ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">📞 <a href="tel:${driver.phone}" style="color: var(--accent-blue);">${driver.phone}</a></div>` : ''}
                </div>
            `;
        });
    } else {
        html += '<div style="padding: 20px; color: var(--text-muted);">Még nincs sofőr</div>';
    }
    
    html += '</div>';
    
    // Passengers column
    html += '<div>';
    html += '<h4 style="color: var(--accent-gold); margin-bottom: 20px;">👤 Utasok (helyet keresnek)</h4>';
    
    if (passengers.length > 0) {
        passengers.forEach(passenger => {
            html += `
                <div style="background: rgba(255,215,0,0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 2px solid rgba(255,215,0,0.3);">
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">${passenger.name}</div>
                    ${passenger.startLocation ? `<div style="margin: 8px 0;">📍 <strong>${getLocationName(passenger.startLocation, passenger.startLocationOther)}</strong></div>` : ''}
                    ${passenger.preferredPickup ? `<div style="margin: 8px 0; font-size: 0.9rem;">🔄 Csatlakozás: ${passenger.preferredPickup}</div>` : ''}
                    ${passenger.flexiblePickup ? `<div style="margin: 8px 0; color: var(--accent-blue); font-size: 0.9rem;">✅ Rugalmas</div>` : ''}
                    ${passenger.phone ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">📞 <a href="tel:${passenger.phone}" style="color: var(--accent-gold);">${passenger.phone}</a></div>` : ''}
                </div>
            `;
        });
    } else {
        html += '<div style="padding: 20px; color: var(--text-muted);">Még nincs utas</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
    console.log('✅ Carpooling updated:', drivers.length, 'drivers,', passengers.length, 'passengers');
}

// Helper functions
function getAvatarEmoji(name) {
    const emojis = ['👨', '👦', '🧑', '👱', '🧔', '👨‍🦱', '👨‍🦰', '🧑‍🦱', '🕺', '🤵'];
    const index = (name || '').length % emojis.length;
    return emojis[index];
}

function getLocationName(location, other) {
    const names = {
        'debrecen': 'Debrecen',
        'gyergyo': 'Gyergyó',
        'brasso': 'Brassó',
        'bukarest': 'Bukarest',
        'other': other || 'Egyéb'
    };
    return names[location] || location;
}

function getTransportMethodName(method) {
    const names = {
        'car-driver': 'Autó (sofőr)',
        'car-passenger': 'Autó (utas)',
        'train': 'Vonat',
        'plane': 'Repülő',
        'mixed': 'Kombinált',
        'undecided': 'Még nem döntött'
    };
    return names[method] || method;
}

function getTimingName(timing) {
    const names = {
        'may5': 'Máj. 5. (korán)',
        'may6-morning': 'Máj. 6. délelőtt',
        'may6-afternoon': 'Máj. 6. délután',
        'may6-evening': 'Máj. 6. este',
        'may7': 'Máj. 7.',
        'may8': 'Máj. 8.',
        'may9-morning': 'Máj. 9. délelőtt',
        'may9-afternoon': 'Máj. 9. délután',
        'may9-evening': 'Máj. 9. este',
        'may10': 'Máj. 10.',
        'undecided': 'Még nem tudja'
    };
    return names[timing] || timing;
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (statsListener) {
        statsListener();
        console.log('Listener cleaned up');
    }
});
