// Live polls — selection state is in-memory for now (can be wired to Firestore later).
(function () {
    'use strict';

    function votePoll(option) {
        const card = option.closest('.poll-card');
        if (!card) return;
        card.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        if (window.toast) window.toast.success('Szavazat rögzítve!', { icon: '🗳️' });
    }

    function createQuickPoll(question) {
        if (window.toast) {
            window.toast.info(`"${question}" — Aktiváld a WhatsApp csoportban!`, { icon: '📊' });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.poll-option').forEach(opt => {
            opt.addEventListener('click', () => votePoll(opt));
        });
    });

    window.votePoll = votePoll;
    window.createQuickPoll = createQuickPoll;
})();
