// Music playlist — song suggestions.
(function () {
    'use strict';

    function suggestSong() {
        const input = document.getElementById('songSuggestion');
        if (!input) return;
        const song = input.value.trim();
        if (song) {
            if (window.toast) window.toast.success(`"${song}" javasolva!`, { icon: '🎵' });
            input.value = '';
        } else if (window.toast) {
            window.toast.error('Írd be a dal címét!', { icon: '❌' });
        }
    }

    function suggestSongQuick(song) {
        if (window.toast) window.toast.success(`"${song}" hozzáadva!`, { icon: '🎵' });
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-song-quick]').forEach(btn => {
            btn.addEventListener('click', () => suggestSongQuick(btn.dataset.songQuick));
        });
    });

    window.suggestSong = suggestSong;
    window.suggestSongQuick = suggestSongQuick;
})();
