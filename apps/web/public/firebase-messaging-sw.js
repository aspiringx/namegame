// Firebase messaging service worker
// This file handles background notifications for Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCdLvrkhIn_fTQvovGlXVUn3S67seq330",
  authDomain: "namegame-d5341.firebaseapp.com",
  projectId: "namegame-d5341",
  storageBucket: "namegame-d5341.firebasestorage.app",
  messagingSenderId: "951901886749",
  appId: "1:951901886749:web:a58d9a9e60b8cd42d5e9f4"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
