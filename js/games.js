// Drinking games — expand/collapse rules.
(function () {
    'use strict';

    function toggleGameRules(card) {
        if (card) card.classList.toggle('expanded');
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => toggleGameRules(card));
        });
    });

    window.toggleGameRules = toggleGameRules;
})();
