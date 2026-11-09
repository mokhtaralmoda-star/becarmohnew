importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAPC7qtYhJJdlLeiChl82RmWGf5wb5U_mc",
  authDomain: "becaremoh.firebaseapp.com",
  projectId: "becaremoh",
  storageBucket: "becaremoh.firebasestorage.app",
  messagingSenderId: "524319660438",
  appId: "1:524319660438:web:c5e0cd6a0ec6edeeafe5b7",
  measurementId: "G-YNZGFC0527"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages via Firebase SDK.
// Note: when the payload contains a "notification" object together with
// "webpush.notification", the browser may auto-display it. To avoid a
// duplicate notification, we DO NOT call showNotification here when the
// payload already carries a notification object. We only show it manually
// for data-only payloads.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // If the payload already has a notification object, the browser/SDK will
  // display it automatically (from webpush.notification). Skip to avoid dupes.
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.data?.body || 'لديك إشعار جديد في لوحة التحكم',
    icon: '/admin/favicon.ico',
    badge: '/admin/favicon.ico',
    data: payload.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/admin/');
      }
    })
  );
});
