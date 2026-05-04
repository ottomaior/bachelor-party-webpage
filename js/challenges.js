// Photo challenges — completed state stored in localStorage.
(function () {
    'use strict';

    const CHALLENGES_KEY = 'otto-challenges';
    let completedChallenges = [];
    try {
        completedChallenges = JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '[]');
    } catch (_) {
        completedChallenges = [];
    }

    function markChallenge(card) {
        const challengeId = card.dataset.challenge;
        if (!challengeId) return;

        if (completedChallenges.includes(challengeId)) {
            if (window.toast) window.toast.info('Már teljesítetted ezt a kihívást!', { icon: '✅' });
            return;
        }

        completedChallenges.push(challengeId);
        localStorage.setItem(CHALLENGES_KEY, JSON.stringify(completedChallenges));
        card.classList.add('completed');

        const points = card.querySelector('.challenge-points')?.textContent || '';
        if (window.toast) window.toast.success(`Kihívás teljesítve! ${points}`, { icon: '🏆' });

        updateLeaderboard();
    }

    function updateLeaderboard() {
        const total = completedChallenges.length * 10;
        const leaderboard = document.getElementById('challengeLeaderboard');
        if (leaderboard && completedChallenges.length > 0) {
            leaderboard.innerHTML = `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank gold">1</div>
                    <div class="leaderboard-name">
                        <div class="title">Te</div>
                        <div class="meta">${completedChallenges.length} kihívás</div>
                    </div>
                    <div class="leaderboard-points">~${total} pont</div>
                </div>
            `;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.challenge-card').forEach(card => {
            if (completedChallenges.includes(card.dataset.challenge)) {
                card.classList.add('completed');
            }
            card.addEventListener('click', () => markChallenge(card));
        });
        updateLeaderboard();
    });

    window.markChallenge = markChallenge;
})();
