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
    "/medical-malpractice-request": "mm"
  };

  function norm() { return (location.pathname || "/").replace(/\/+$/, "") || "/"; }
  if (!MAP[norm()]) return;

  var host = document.getElementById("shell");
  if (!host) return;

  var v = window.innerWidth < 960 ? "-m" : "-t";

  var st = document.createElement("style");
  st.textContent = "@keyframes shspin{to{transform:rotate(360deg)}}";
  document.head.appendChild(st);

  var overlay = document.createElement("div");
  overlay.setAttribute("dir", "rtl");
  overlay.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#fff";
  overlay.innerHTML = '<img src="/ref/assets/bcare.com.sa/assets/images/Bcare-logo.svg" alt="" style="height:46px">'
    + '<div style="width:38px;height:38px;border:3px solid #dbe6ee;border-top-color:#146394;border-radius:50%;animation:shspin 1s linear infinite"></div>'
    + '<p style="color:#146394;font-size:13px;font-weight:700;margin:0">جارٍ التحميل...</p>';
  host.appendChild(overlay);

  var frame = document.createElement("iframe");
  frame.title = "بي كير";
  frame.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;background:#f7f7f7";
  host.appendChild(frame);
  window.__shellFrame = frame;

  var current = "";
  function apply() {
    var p = norm();
    if (!MAP[p]) { host.style.display = "none"; return; }
    host.style.display = "";
    var src = "/ref/" + MAP[p] + "-ar" + v + ".html";
    if (src !== current) { current = src; frame.src = src; }
  }

  frame.onload = function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); };
  setTimeout(function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 9000);

  apply();
  setInterval(apply, 150);
})();