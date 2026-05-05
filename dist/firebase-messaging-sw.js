importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    projectId: "amaru-app-gym",
    appId: "1:19152982385:web:ac0116e361c9d97b41a6d0",
    storageBucket: "amaru-app-gym.firebasestorage.app",
    apiKey: "AIzaSyDI4-vgRMs3dKAvrQnSXTA0O3DYLaCTW_Q",
    authDomain: "amaru-app-gym.firebaseapp.com",
    messagingSenderId: "19152982385"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/images/icon-192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
