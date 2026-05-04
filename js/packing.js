// Packing list — checkbox state stored in localStorage.
(function () {
    'use strict';

    const PACKING_STORAGE_KEY = 'otto-packing-list';

    function loadPackingState() {
        const items = document.querySelectorAll('.packing-item');
        if (!items.length) return;
        const saved = localStorage.getItem(PACKING_STORAGE_KEY);
        if (saved) {
            const checkedItems = JSON.parse(saved);
            items.forEach((item, index) => {
                const checkbox = item.querySelector('.packing-checkbox');
                if (checkbox && checkedItems.includes(index)) {
                    checkbox.checked = true;
                    item.classList.add('checked');
                }
            });
        }
        updatePackingProgress();
    }

    function savePackingState() {
        const checkedItems = [];
        document.querySelectorAll('.packing-item').forEach((item, index) => {
            const cb = item.querySelector('.packing-checkbox');
            if (cb && cb.checked) checkedItems.push(index);
        });
        localStorage.setItem(PACKING_STORAGE_KEY, JSON.stringify(checkedItems));
    }

    function togglePackingItem(element) {
        const checkbox = element.querySelector('.packing-checkbox');
        if (!checkbox) return;
        checkbox.checked = !checkbox.checked;
        element.classList.toggle('checked', checkbox.checked);
        savePackingState();
        updatePackingProgress();
    }

    function updatePackingProgress() {
        const total = document.querySelectorAll('.packing-item').length;
        if (!total) return;
        const checked = document.querySelectorAll('.packing-item.checked').length;
        const percentage = (checked / total) * 100;

        const progressBar = document.getElementById('packingProgress');
        const stats = document.getElementById('packingStats');

        if (progressBar) progressBar.style.width = percentage + '%';
        if (stats) stats.textContent = `${checked} / ${total} kész`;

        if (checked === total && checked > 0 && window.triggerConfetti) {
            window.triggerConfetti();
            if (window.toast) window.toast.success('Minden bepakolva! Készen állsz! 🎉', { icon: '🎒' });
        }
    }

    function resetPackingList() {
        document.querySelectorAll('.packing-item').forEach(item => {
            const cb = item.querySelector('.packing-checkbox');
            item.classList.remove('checked');
            if (cb) cb.checked = false;
        });
        localStorage.removeItem(PACKING_STORAGE_KEY);
        updatePackingProgress();
        if (window.toast) window.toast.info('Lista visszaállítva', { icon: '🔄' });
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadPackingState();
        document.querySelectorAll('.packing-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('packing-checkbox')) return;
                togglePackingItem(item);
            });
        });
        document.querySelectorAll('.packing-checkbox').forEach(cb => {
            cb.addEventListener('change', function () {
                this.closest('.packing-item').classList.toggle('checked', this.checked);
                savePackingState();
                updatePackingProgress();
            });
        });
    });

    window.togglePackingItem = togglePackingItem;
    window.resetPackingList = resetPackingList;
    window.updatePackingProgress = updatePackingProgress;
})();
