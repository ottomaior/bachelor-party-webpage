// Firebase init — shared across all pages that need RSVP/stats.
(function () {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyD7STy9Pyx6jBOtagEtQBQ3xM77cdlRIU8",
        authDomain: "otto-bachelor-party.firebaseapp.com",
        projectId: "otto-bachelor-party",
        storageBucket: "otto-bachelor-party.firebasestorage.app",
        messagingSenderId: "918048100825",
        appId: "1:918048100825:web:13069d341370085ba689c8"
    };

    if (typeof firebase === 'undefined') {
        console.warn('Firebase compat SDK not loaded yet.');
        return;
    }

    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    window.db = firebase.firestore();
    console.log('🔥 Firebase initialized.');
})();
