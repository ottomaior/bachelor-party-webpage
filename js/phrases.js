// Czech phrasebook — click to copy.
(function () {
    'use strict';

    function copyPhrase(phrase) {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(phrase).then(() => {
            if (window.toast) window.toast.success(`"${phrase}" másolva!`, { icon: '📋' });
        }).catch(() => {
            if (window.toast) window.toast.error('Nem sikerült másolni', { icon: '❌' });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.phrase-card[data-phrase]').forEach(card => {
            card.addEventListener('click', () => copyPhrase(card.dataset.phrase));
        });
    });

    window.copyPhrase = copyPhrase;
})();
