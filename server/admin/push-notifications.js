import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPC7qtYhJJdlLeiChl82RmWGf5wb5U_mc",
  authDomain: "becaremoh.firebaseapp.com",
  projectId: "becaremoh",
  storageBucket: "becaremoh.firebasestorage.app",
  messagingSenderId: "524319660438",
  appId: "1:524319660438:web:c5e0cd6a0ec6edeeafe5b7",
  measurementId: "G-YNZGFC0527"
};

const VAPID_KEY = "BGSoG4ye_zYuEHhwXbpFQGmsUCNmRI-HFRHIxcqlomTAaSQgRPtPGgW8QTwvpBx4EdGJEj8lY0mKyPWEGM1VG9k";

// Lazily/safely initialized Firebase app + messaging.
// IMPORTANT: never throw at module load time, otherwise the whole admin
// panel can break (white screen) on browsers that don't support FCM (e.g. iOS Safari).
let app = null;
let messaging = null;
let messagingSupported = null; // null = unknown yet
let swRegistration = null; // keep Service Worker registration for token refresh
let refreshTimer = null;    // periodic heartbeat timer
let refreshListenersAttached = false;

async function ensureMessaging() {
  if (messaging) return messaging;
  try {
    if (messagingSupported === null) {
      messagingSupported = await isSupported();
    }
    if (!messagingSupported) {
      console.warn('[push] Firebase Messaging is NOT supported in this browser.');
      return null;
    }
    if (!app) app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    // Foreground message handler (only when supported)
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      try {
        const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
        const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(title, { body: body, icon: '/admin/favicon.ico' });
        }
      } catch (e) {
        console.error('Error showing foreground notification:', e);
      }
    });

    return messaging;
  } catch (err) {
    console.warn('[push] Could not initialize Firebase Messaging:', err && err.message ? err.message : err);
    return null;
  }
}

export async function requestNotificationPermission() {
  try {
    // Guard: browsers without the Notification API (older iOS Safari, etc.)
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[push] Notifications/Service Worker not available in this browser. Skipping.');
      return false;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('[push] Push messaging unsupported here. On iPhone, open the panel from the Home Screen icon (Add to Home Screen) on iOS 16.4+.');
      return false;
    }

    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Unable to get permission to notify.');
      return false;
    }

    console.log('Notification permission granted.');

    const m = await ensureMessaging();
    if (!m) return false;

    let registration;
    try {
      registration = await navigator.serviceWorker.register('/admin/firebase-messaging-sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
      return false;
    }

    let currentToken;
    try {
      currentToken = await getToken(m, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
    } catch (err) {
      console.error('getToken failed:', err);
      return false;
    }

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      swRegistration = registration;
      await sendTokenToServer(currentToken);
      // بدء آلية التجديد الدوري للتوكن لمنع توقف الإشعارات بعد فترة
      startTokenRefreshCycle();
      return true;
    }

    console.log('No registration token available.');
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// إعادة جلب التوكن الحالي وإرساله للسيرفر (iOS قد يُبطل أو يُجدّد التوكن دورياً)
async function refreshToken() {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const m = await ensureMessaging();
    if (!m) return;
    if (!swRegistration) {
      try {
        swRegistration = await navigator.serviceWorker.getRegistration('/admin/firebase-messaging-sw.js')
          || await navigator.serviceWorker.register('/admin/firebase-messaging-sw.js');
      } catch (e) {
        console.warn('[push] refreshToken: SW registration unavailable:', e && e.message ? e.message : e);
        return;
      }
    }
    const token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });
    if (token) {
      console.log('[push] refreshToken: re-registering current token.');
      await sendTokenToServer(token);
    }
  } catch (err) {
    console.warn('[push] refreshToken failed:', err && err.message ? err.message : err);
  }
}

// تشغيل دورة التجديد: عند عودة التطبيق للواجهة + كل فترة (heartbeat)
function startTokenRefreshCycle() {
  if (!refreshListenersAttached) {
    refreshListenersAttached = true;
    // عند عودة الصفحة للواجهة (فتح التطبيق من جديد)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshToken();
      }
    });
    // عند استعادة الاتصال/التركيز
    window.addEventListener('focus', () => { refreshToken(); });
    window.addEventListener('online', () => { refreshToken(); });
  }
  // heartbeat: إعادة التسجيل كل 6 ساعات طالما اللوحة مفتوحة
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => { refreshToken(); }, 6 * 60 * 60 * 1000);
}

async function sendTokenToServer(token) {
  try {
    const response = await fetch('/admin/fcm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    console.log('Token sent to server:', await response.json());
  } catch (error) {
    console.error('Error sending token to server:', error);
  }
}
