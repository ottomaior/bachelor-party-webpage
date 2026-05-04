// Tiny inline-SVG icon set for the pub-warm design.
//
// Usage:
//   <span data-icon="beer"></span>
//   <span data-icon="bridge" data-icon-size="32"></span>
//
// The script swaps `[data-icon]` elements with the inline SVG markup on
// DOMContentLoaded. Useful when you don't want to manually paste long SVGs
// throughout the markup.

(function () {
    'use strict';

    const ICONS = {
        beer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h10v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z"/><path d="M15 8h2a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2"/><path d="M8 9v6M11 9v6"/></svg>',
        bridge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h20"/><path d="M2 18c0-5 4-9 10-9s10 4 10 9"/><path d="M6 18V11"/><path d="M18 18V11"/><path d="M12 9V4"/><path d="M10 4h4"/></svg>',
        castle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l3 1V5l3 1V3l3 2 3-2v3l3-1v4l3-1v13z"/><path d="M10 21v-5a2 2 0 1 1 4 0v5"/></svg>',
        train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/><path d="M7 21l3-3M17 21l-3-3"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>',
        coaster: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 2"/></svg>',
        cheers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4l3 11a3 3 0 0 0 6 0l-3-11"/><path d="M9 4h6"/><path d="M19 4l-3 11a3 3 0 0 1-3 2"/></svg>',
        camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l1.5-2h5L16 6"/><circle cx="12" cy="13" r="4"/></svg>',
        bottle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4v3l-1 2v2a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8a4 4 0 0 1 4-4V7l-1-2z"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>',
        // Larger silhouette: Prague skyline. ViewBox 1200x80, no stroke.
        skyline: '<svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 80 L0 60 L40 60 L40 50 L60 50 L60 38 L70 38 L75 30 L80 38 L80 50 L100 50 L100 55 L130 55 L130 45 L150 45 L150 35 L160 35 L165 28 L170 35 L170 45 L195 45 L195 60 L230 60 L230 50 L250 50 L255 42 L260 50 L290 50 L290 40 L310 40 L312 30 L320 22 L328 30 L330 40 L355 40 L355 55 L390 55 L390 45 L410 45 L412 36 L418 36 L418 28 L426 22 L434 28 L434 36 L440 36 L442 45 L470 45 L470 60 L510 60 L510 50 L535 50 L538 42 L545 36 L552 42 L555 50 L585 50 L585 38 L605 38 L608 30 L612 22 L618 14 L624 22 L628 30 L630 38 L660 38 L660 55 L700 55 L700 45 L730 45 L735 36 L745 28 L755 36 L760 45 L795 45 L795 60 L830 60 L830 50 L860 50 L862 42 L868 36 L876 30 L884 36 L890 42 L890 50 L920 50 L920 38 L945 38 L948 30 L955 22 L962 30 L965 38 L995 38 L995 55 L1030 55 L1030 45 L1058 45 L1062 36 L1068 28 L1076 36 L1080 45 L1112 45 L1112 60 L1150 60 L1150 50 L1180 50 L1180 60 L1200 60 L1200 80 Z"/></svg>'
    };

    function renderIcon(name, size) {
        const svg = ICONS[name];
        if (!svg) return '';
        return `<span class="icon-${name}" style="display:inline-block;width:${size}px;height:${size}px;color:inherit;line-height:0;">${svg}</span>`;
    }

    function inflate() {
        document.querySelectorAll('[data-icon]').forEach(el => {
            const name = el.dataset.icon;
            const size = parseInt(el.dataset.iconSize || '24', 10);
            const html = renderIcon(name, size);
            if (html) el.innerHTML = html;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inflate);
    } else {
        inflate();
    }

    window.bpIcons = {
        get: (name, size = 24) => renderIcon(name, size),
        list: () => Object.keys(ICONS),
        raw: ICONS
    };
})();
