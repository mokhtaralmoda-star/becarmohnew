const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin
let isFirebaseInitialized = false;
let messaging = null;
try {
  let serviceAccount = null;

  // Prefer credentials from environment variable (secure, not committed to Git)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("Loaded Firebase service account from environment variable.");
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON:", e.message);
    }
  }

  // Fallback to local file (for local development only)
  if (!serviceAccount) {
    const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      console.log("Loaded Firebase service account from local file.");
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    messaging = getMessaging();
    isFirebaseInitialized = true;
    console.log("Firebase Admin initialized successfully. Key ID: " + (serviceAccount.private_key_id ? serviceAccount.private_key_id.substring(0, 8) : "unknown"));
  } else {
    console.log("No Firebase service account found (env or file). Push notifications disabled.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Store FCM tokens with durable persistence on disk (survives Railway redeploys via /data volume).
const fcmTokens = new Set();

// Persistent token file. Prefer the Railway persistent volume regardless of NODE_ENV.
// Railway exposes the volume mount path via RAILWAY_VOLUME_MOUNT_PATH (e.g. "/data").
// We also fall back to "/data" if it exists and is writable, otherwise to the app dir.
function resolvePersistentDir() {
  const candidates = [];
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) candidates.push(process.env.RAILWAY_VOLUME_MOUNT_PATH);
  candidates.push('/data');
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) continue;
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (e) { /* not writable, try next */ }
  }
  return __dirname;
}

const TOKENS_DIR = resolvePersistentDir();
const TOKENS_FILE = path.join(TOKENS_DIR, 'fcm-tokens.json');
console.log('[fcm] Using persistent tokens directory:', TOKENS_DIR);

function loadTokensFromDisk() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(t => { if (t) fcmTokens.add(t); });
        console.log(`[fcm] Loaded ${fcmTokens.size} FCM tokens from disk (${TOKENS_FILE}).`);
      }
    }
  } catch (e) {
    console.error('[fcm] Failed to load tokens from disk:', e && e.message ? e.message : e);
  }
}

function saveTokensToDisk() {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(Array.from(fcmTokens)), 'utf8');
  } catch (e) {
    console.error('[fcm] Failed to save tokens to disk:', e && e.message ? e.message : e);
  }
}

// Load any previously stored tokens immediately at startup.
loadTokensFromDisk();

// Function to initialize tokens from index.js
function setTokens(tokens) {
  if (Array.isArray(tokens)) {
    tokens.forEach(token => fcmTokens.add(token));
    saveTokensToDisk();
    console.log(`Loaded ${fcmTokens.size} FCM tokens from main data`);
  }
}

// Function to get current tokens for saving in index.js
function getTokens() {
  return Array.from(fcmTokens);
}

function addToken(token) {
  if (token && !fcmTokens.has(token)) {
    fcmTokens.add(token);
    saveTokensToDisk();
    console.log(`Added new FCM token. Total: ${fcmTokens.size}`);
  }
}

function removeToken(token) {
  if (fcmTokens.has(token)) {
    fcmTokens.delete(token);
    saveTokensToDisk();
    console.log(`Removed FCM token. Total: ${fcmTokens.size}`);
  }
}

async function sendNotification(title, body, data = {}) {
  if (!isFirebaseInitialized || fcmTokens.size === 0) return;

  // Convert all data values to strings (FCM requirement)
  const stringData = {};
  Object.keys(data).forEach(k => {
    stringData[k] = String(data[k]);
  });

  // Send combined notification + data with high priority for reliable background delivery
  const message = {
    notification: {
      title: String(title),
      body: String(body)
    },
    data: {
      ...stringData,
      title: String(title),
      body: String(body),
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "86400"
      },
      notification: {
        title: String(title),
        body: String(body),
        icon: "/admin/favicon.ico",
        badge: "/admin/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200]
      },
      fcmOptions: {
        link: "/admin/"
      }
    },
    android: {
      priority: "high"
    },
    tokens: Array.from(fcmTokens)
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} messages; failed ${response.failureCount}`);

    // Remove ONLY permanently-invalid tokens. Transient errors (unavailable, internal,
    // quota, etc.) must NOT delete a token, otherwise iOS devices that are merely asleep
    // would lose notifications permanently after a temporary delivery failure.
    if (response.failureCount > 0) {
      const PERMANENT_ERRORS = [
        'messaging/registration-token-not-registered',
        'messaging/invalid-registration-token',
        'messaging/invalid-argument'
      ];
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error && resp.error.code ? resp.error.code : 'unknown';
          if (PERMANENT_ERRORS.includes(code)) {
            failedTokens.push(message.tokens[idx]);
            console.log(`[fcm] Token permanently invalid (${code}), will remove.`);
          } else {
            console.warn(`[fcm] Transient send failure (${code}); keeping token.`);
          }
        }
      });
      failedTokens.forEach(token => removeToken(token));
    }
  } catch (error) {
    console.error("Error sending FCM message:", error);
  }
}

// Diagnostic: send a test notification and return detailed result
async function sendTestNotification() {
  if (!isFirebaseInitialized) {
    return { ok: false, reason: "Firebase not initialized" };
  }
  if (fcmTokens.size === 0) {
    return { ok: false, reason: "No FCM tokens stored", tokenCount: 0 };
  }
  const title = "إشعار تجريبي";
  const body = "هذا إشعار تجريبي للتأكد من عمل الإشعارات في الخلفية";
  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      title: title,
      body: body,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "86400"
      },
      notification: {
        title: title,
        body: body,
        icon: "/admin/favicon.ico",
        badge: "/admin/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200]
      },
      fcmOptions: {
        link: "/admin/"
      }
    },
    android: {
      priority: "high"
    },
    tokens: Array.from(fcmTokens)
  };
  try {
    const response = await messaging.sendEachForMulticast(message);
    const details = response.responses.map((r, i) => ({
      success: r.success,
      error: r.error ? (r.error.code + ": " + r.error.message) : null
    }));
    return {
      ok: true,
      tokenCount: fcmTokens.size,
      successCount: response.successCount,
      failureCount: response.failureCount,
      details
    };
  } catch (error) {
    return { ok: false, reason: error.message, code: error.code };
  }
}

// Diagnostic: report current state
function getStatus() {
  return {
    firebaseInitialized: isFirebaseInitialized,
    tokenCount: fcmTokens.size,
    tokenSamples: Array.from(fcmTokens).map(t => t.substring(0, 12) + "...")
  };
}

module.exports = {
  addToken,
  removeToken,
  sendNotification,
  sendTestNotification,
  setTokens,
  getTokens,
  getStatus
};
