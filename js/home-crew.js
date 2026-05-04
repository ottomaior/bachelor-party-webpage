// Home page — small "Crew so far" strip pulled from Firestore.
(function () {
    'use strict';

    function initials(name) {
        if (!name) return '?';
        return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }

    function render(snapshot) {
        const list = document.getElementById('home-crew-list');
        const counter = document.getElementById('home-crew-counter');
        if (!list) return;

        const yes = [];
        const maybe = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.name) return;
            if (data.attending === 'yes') yes.push(data);
            else if (data.attending === 'maybe') maybe.push(data);
        });

        if (counter) {
            counter.textContent = `${yes.length} biztos · ${maybe.length} talán`;
        }

        const display = [...yes, ...maybe].slice(0, 8);
        if (!display.length) {
            list.innerHTML = '<p class="home-crew-empty">Még senki nem jelentkezett. Legyél te az első! 🍻</p>';
            return;
        }

        list.innerHTML = display.map(p => `
            <span class="home-crew-chip">
                <span class="avatar">${initials(p.name)}</span>
                ${p.name.split(/\s+/)[0]}${p.attending === 'maybe' ? ' <em style="color:var(--color-amber-deep);">?</em>' : ''}
            </span>
        `).join('');
    }

    function init() {
        if (typeof window.db === 'undefined') {
            setTimeout(init, 800);
            return;
        }
        try {
            window.db.collection('rsvps').onSnapshot(render, err => {
                console.warn('Home crew listener error:', err);
            });
        } catch (e) {
            console.warn('Home crew init failed:', e);
        }
    }

    window.addEventListener('load', () => setTimeout(init, 600));
})();
