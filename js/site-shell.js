/**
 * Site shell injector.
 * Injects shared header + footer markup into pages.
 *
 * Usage:
 *   <header data-shell="header"></header>
 *   ...
 *   <footer data-shell="footer"></footer>
 *
 * The current page is auto-detected from `<body data-page="home">` (etc.)
 * to highlight the active nav link.
 */
(function () {
    'use strict';

    /* Same-folder relative URLs so nav works from subfolders, Live Preview, and file:// */
    const NAV_ITEMS = [
        { id: 'home',     label: 'Kezdőlap', href: 'index.html' },
        { id: 'program',  label: 'Program',  href: 'program.html' },
        { id: 'praga',    label: 'Prága',    href: 'praga.html' },
        { id: 'banda',    label: 'Banda',    href: 'banda.html' },
        { id: 'galeria',  label: 'Galéria',  href: 'galeria.html' },
        { id: 'expenses', label: 'Költségek', href: 'expenses.html' }
    ];

    function getActivePage() {
        const fromBody = document.body && document.body.dataset && document.body.dataset.page;
        if (fromBody) return fromBody;
        const path = window.location.pathname.replace(/\/$/, '');
        if (path === '' || path === '/index.html' || path.endsWith('/index.html')) return 'home';
        const m = path.match(/\/([a-z0-9-]+)\.html$/i);
        return m ? m[1] : 'home';
    }

    function escape(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function buildHeader(activeId) {
        const links = NAV_ITEMS.map(item => `
            <li>
                <a class="shell-nav-link${item.id === activeId ? ' is-active' : ''}"
                   href="${escape(item.href)}"
                   ${item.id === activeId ? 'aria-current="page"' : ''}>
                    ${escape(item.label)}
                </a>
            </li>
        `).join('');

        return `
            <a href="#main-content" class="skip-link">Ugrás a tartalomhoz</a>
            <div class="shell-container">
                <nav class="shell-nav" aria-label="Fő navigáció">
                    <div class="shell-nav-top">
                        <a href="index.html" class="shell-logo" aria-label="Kezdőlap">
                            <span class="shell-logo-mark" aria-hidden="true">O</span>
                            <span class="shell-logo-text">
                                Otto Legénybúcsúja
                                <span class="shell-logo-sub">Prága · 2026 máj 7–10</span>
                            </span>
                        </a>
                        <div class="shell-nav-actions">
                            <a href="praga.html#map"
                               class="shell-nav-icon-btn"
                               aria-label="Interaktív térkép"
                               title="Térkép">🗺️</a>
                            <a href="expenses.html" class="shell-nav-cta">
                                💰 Költség
                            </a>
                        </div>
                    </div>
                    <ul class="shell-nav-links">${links}</ul>
                </nav>
            </div>
        `;
    }

    function buildFooter() {
        return `
            <div class="shell-footer-skyline" aria-hidden="true">
                ${pragueSkylineSvg()}
            </div>
            <div class="shell-container">
                <div class="shell-footer-inner">
                    <div class="shell-footer-brand">
                        <h3>Ott találkozunk! 🔥</h3>
                        <p>Last Ride in Prague — három nap, egy banda, sok sör. Készülj fel.</p>
                    </div>
                    <div class="shell-footer-col">
                        <h4>Hova mész?</h4>
                        <ul class="shell-footer-list">
                            <li><a href="index.html">Kezdőlap</a></li>
                            <li><a href="program.html">Program</a></li>
                            <li><a href="praga.html">Prága Túlélőkalauz</a></li>
                            <li><a href="banda.html">A Banda</a></li>
                        </ul>
                    </div>
                    <div class="shell-footer-col">
                        <h4>Praktikus</h4>
                        <ul class="shell-footer-list">
                            <li><a href="galeria.html">Galéria & Kihívások</a></li>
                            <li><a href="expenses.html">Költségek</a></li>
                            <li><a href="banda.html#rsvp">Jelentkezés</a></li>
                        </ul>
                    </div>
                </div>
                <div class="shell-footer-bottom">
                    <span>🍺 Prága vár · Last Ride · 2026 🍺</span>
                    <div class="shell-footer-share" role="group" aria-label="Megosztás">
                        <button type="button" data-share="whatsapp" title="WhatsApp">💬</button>
                        <button type="button" data-share="copy" title="Link másolása">🔗</button>
                        <button type="button" data-share="facebook" title="Facebook">📘</button>
                    </div>
                </div>
            </div>
        `;
    }

    function pragueSkylineSvg() {
        return `
            <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="rgba(212, 163, 90, 0.55)" d="M0 80 L0 60 L40 60 L40 50 L60 50 L60 38 L70 38 L75 30 L80 38 L80 50 L100 50 L100 55 L130 55 L130 45 L150 45 L150 35 L160 35 L165 28 L170 35 L170 45 L195 45 L195 60 L230 60 L230 50 L250 50 L255 42 L260 50 L290 50 L290 40 L310 40 L312 30 L320 22 L328 30 L330 40 L355 40 L355 55 L390 55 L390 45 L410 45 L412 36 L418 36 L418 28 L426 22 L434 28 L434 36 L440 36 L442 45 L470 45 L470 60 L510 60 L510 50 L535 50 L538 42 L545 36 L552 42 L555 50 L585 50 L585 38 L605 38 L608 30 L612 22 L618 14 L624 22 L628 30 L630 38 L660 38 L660 55 L700 55 L700 45 L730 45 L735 36 L745 28 L755 36 L760 45 L795 45 L795 60 L830 60 L830 50 L860 50 L862 42 L868 36 L876 30 L884 36 L890 42 L890 50 L920 50 L920 38 L945 38 L948 30 L955 22 L962 30 L965 38 L995 38 L995 55 L1030 55 L1030 45 L1058 45 L1062 36 L1068 28 L1076 36 L1080 45 L1112 45 L1112 60 L1150 60 L1150 50 L1180 50 L1180 60 L1200 60 L1200 80 Z"/>
            </svg>
        `;
    }

    function bindHeaderBehavior(headerEl) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 8) headerEl.classList.add('is-scrolled');
            else headerEl.classList.remove('is-scrolled');
        }, { passive: true });
    }

    function bindFooterShare(footerEl) {
        const url = window.location.href;
        const title = document.title || 'Otto Legénybúcsúja';
        footerEl.querySelectorAll('[data-share]').forEach(btn => {
            btn.addEventListener('click', () => {
                const kind = btn.dataset.share;
                if (kind === 'whatsapp') {
                    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
                } else if (kind === 'facebook') {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                } else if (kind === 'copy') {
                    navigator.clipboard?.writeText(url).then(() => {
                        if (window.toast && typeof window.toast.success === 'function') {
                            window.toast.success('Link másolva!');
                        } else {
                            btn.textContent = '✅';
                            setTimeout(() => (btn.textContent = '🔗'), 1500);
                        }
                    });
                }
            });
        });
    }

    function init() {
        const activeId = getActivePage();

        const headerHost = document.querySelector('[data-shell="header"]');
        if (headerHost) {
            headerHost.classList.add('shell-header');
            headerHost.setAttribute('role', 'banner');
            headerHost.innerHTML = buildHeader(activeId);
            bindHeaderBehavior(headerHost);
        }

        const footerHost = document.querySelector('[data-shell="footer"]');
        if (footerHost) {
            footerHost.classList.add('shell-footer');
            footerHost.setAttribute('role', 'contentinfo');
            footerHost.innerHTML = buildFooter();
            bindFooterShare(footerHost);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
