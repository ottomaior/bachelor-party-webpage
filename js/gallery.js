// Photo gallery — uploads stored as data URLs in localStorage.
(function () {
    'use strict';

    let galleryPhotos = [];
    const GALLERY_STORAGE_KEY = 'otto-gallery-photos';

    function loadGalleryPhotos() {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;
        const saved = localStorage.getItem(GALLERY_STORAGE_KEY);
        if (saved) {
            try {
                galleryPhotos = JSON.parse(saved);
            } catch (_) {
                galleryPhotos = [];
            }
        }
        renderGallery();
    }

    function saveGalleryPhotos() {
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryPhotos.slice(0, 20)));
    }

    function handleGalleryUpload(event) {
        const files = event.target.files;
        if (!files || !files.length) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                galleryPhotos.unshift({
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    uploadedAt: new Date().toISOString()
                });
                saveGalleryPhotos();
                renderGallery();
                if (window.toast) window.toast.success('Fotó feltöltve!', { icon: '📸' });
            };
            reader.readAsDataURL(file);
        });

        event.target.value = '';
    }

    function renderGallery() {
        const grid = document.getElementById('gallery-grid');
        const emptyState = document.getElementById('gallery-empty');
        if (!grid) return;

        const uploadBtn = grid.querySelector('.gallery-upload');
        grid.innerHTML = '';
        if (uploadBtn) grid.appendChild(uploadBtn);

        galleryPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${photo.src}" alt="${photo.name || ''}" loading="lazy">`;
            item.addEventListener('click', () => openGalleryModal(index));
            grid.appendChild(item);
        });

        if (emptyState) {
            emptyState.style.display = galleryPhotos.length > 0 ? 'none' : 'block';
        }
    }

    function openGalleryModal(index) {
        const photo = galleryPhotos[index];
        if (!photo) return;

        const modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(18,13,10,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
        modal.innerHTML = `
            <div style="position:relative;max-width:90vw;max-height:90vh;">
                <img src="${photo.src}" alt="${photo.name || ''}" style="max-width:100%;max-height:90vh;border-radius:12px;">
                <button data-close style="position:absolute;top:-15px;right:-15px;width:40px;height:40px;border-radius:50%;background:#a8483a;border:none;color:#f4ecd8;font-size:1.5rem;cursor:pointer;">×</button>
                <button data-delete style="position:absolute;bottom:10px;right:10px;padding:10px 20px;background:#a8483a;border:none;color:#f4ecd8;border-radius:8px;cursor:pointer;font-weight:600;">🗑️ Törlés</button>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.dataset.close !== undefined) modal.remove();
            if (e.target.dataset.delete !== undefined) deleteGalleryPhoto(index);
        });
        document.body.appendChild(modal);
    }

    function deleteGalleryPhoto(index) {
        galleryPhotos.splice(index, 1);
        saveGalleryPhotos();
        renderGallery();
        document.getElementById('gallery-modal')?.remove();
        if (window.toast) window.toast.info('Fotó törölve', { icon: '🗑️' });
    }

    document.addEventListener('DOMContentLoaded', loadGalleryPhotos);

    window.handleGalleryUpload = handleGalleryUpload;
    window.openGalleryModal = openGalleryModal;
    window.deleteGalleryPhoto = deleteGalleryPhoto;
})();
