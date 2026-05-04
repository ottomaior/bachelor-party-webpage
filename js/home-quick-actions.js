/**
 * Home page — "Mai program" tile auto-targeting.
 * Rewrites the [data-quick="today"] anchor's href to program.html#day-N
 * and updates the meta label based on the current date.
 */
(function () {
    'use strict';

    const TRIP_DAYS = [
        { id: 'day-7',  date: '2026-05-07', label: 'Csütörtök · érkezés' },
        { id: 'day-8',  date: '2026-05-08', label: 'Péntek · fő nap' },
        { id: 'day-9',  date: '2026-05-09', label: 'Szombat · lassítás' },
        { id: 'day-10', date: '2026-05-10', label: 'Vasárnap · hazaút' }
    ];

    function ymd(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function pickTarget(today) {
        const todayKey = ymd(today);

        const onTrip = TRIP_DAYS.find(d => d.date === todayKey);
        if (onTrip) return { day: onTrip, prefix: 'Ma' };

        const upcoming = TRIP_DAYS.find(d => d.date > todayKey);
        if (upcoming) {
            const tomorrowKey = ymd(new Date(today.getTime() + 24 * 60 * 60 * 1000));
            const prefix = upcoming.date === tomorrowKey ? 'Holnap' : 'Hamarosan';
            return { day: upcoming, prefix };
        }

        return { day: TRIP_DAYS[TRIP_DAYS.length - 1], prefix: 'Vége' };
    }

    function init() {
        const tile = document.querySelector('[data-quick="today"]');
        if (!tile) return;

        const target = pickTarget(new Date());
        if (!target) return;

        tile.setAttribute('href', `program.html#${target.day.id}`);

        const metaEl = tile.querySelector('[data-quick-meta]');
        if (metaEl) {
            metaEl.textContent = `${target.prefix} · ${target.day.label}`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
