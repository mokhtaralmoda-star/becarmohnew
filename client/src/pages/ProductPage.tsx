import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const TABLET_BELOW = 960;
const PHONE_BELOW = 600;
const LOGO = "/ref/assets/bcare.com.sa/assets/images/Bcare-logo.svg";

const PRODUCT_PAGES: Record<string, string> = {
  "/": "home",
  "/motor-insurance": "home",
  "/travel-insurance": "landing-travel",
  "/domestic-workers": "landing-helpers",
  "/medical-insurance": "landing-medical",
  "/medical-malpractice": "landing-mm",
};

const REQUEST_PAGES: Record<string, string> = {
  "/motor-insurance-request": "motor",
  "/travel-insurance-request": "travel",
  "/domestic-workers-request": "helpers",
  "/medical-insurance-request": "medical",
  "/medical-malpractice-request": "mm",
};

const FORM_ROUTES: Record<string, string> = {
  "/motor-insurance-request": "/new-appointment",
  "/travel-insurance-request": "/travel-form",
  "/domestic-workers-request": "/domestic-form",
  "/medical-insurance-request": "/medical-form",
  "/medical-malpractice-request": "/malpractice-form",
};

function drawCaptcha(el: HTMLIFrameElement): string | null {
  const doc = el.contentDocument;
  const host = doc?.querySelector("bcare-presentation-captcha-input");
  const img = host?.querySelector('img[src^="data:image"]') as HTMLImageElement | null;
  const input = host?.querySelector("input") as HTMLInputElement | null;
  if (!doc || !host || !img) return null;

  const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
  const canvas = doc.createElement("canvas");
  canvas.width = 110;
  canvas.height = 46;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 110, 46);
  const colors = ["#8b1a1a", "#1a3a8b", "#5a1a8b", "#c26a00", "#111111"];
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(16 + i * 24, 33);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.font = `${i % 2 ? "italic " : "bold "}26px serif`;
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = "rgba(20,99,148,0.35)";
    ctx.beginPath();
    ctx.moveTo(Math.random() * 110, Math.random() * 46);
    ctx.lineTo(Math.random() * 110, Math.random() * 46);
    ctx.stroke();
  }

  img.src = canvas.toDataURL();
  if (input) {
    input.value = "";
    input.style.borderColor = "";
  }
  const err = host.querySelector(".ref-captcha-err") as HTMLElement | null;
  if (err) err.hidden = true;
  return code;
}

function showCaptchaError(el: HTMLIFrameElement) {
  const doc = el.contentDocument;
  const host = doc?.querySelector("bcare-presentation-captcha-input") as HTMLElement | null;
  if (!doc || !host) return;
  const input = host.querySelector("input") as HTMLInputElement | null;
  if (input) input.style.borderColor = "#c82333";
  let err = host.querySelector(".ref-captcha-err") as HTMLElement | null;
  if (!err) {
    err = doc.createElement("p");
    err.className = "ref-captcha-err";
    err.textContent = "رمز التحقق غير صحيح";
    err.style.cssText =
      "background:#fde8e8;color:#c82333;font-size:12px;line-height:1.6;padding:4px 8px;margin:4px 0 0;text-align:start;border-radius:4px";
    host.appendChild(err);
  }
  err.hidden = false;
}

export default function ProductPage() {
  const [location, setLocation] = useLocation();
  const path = location.split("?")[0];
  const name = PRODUCT_PAGES[path] ?? REQUEST_PAGES[path] ?? "home";

  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [variant, setVariant] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const code = useRef("");

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setVariant(w < PHONE_BELOW ? "-m" : w < TABLET_BELOW ? "-t" : "");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setBusy(true);
    setShowOverlay(false);
  }, [name, lang, variant]);

  useEffect(() => {
    if (!busy) {
      setShowOverlay(false);
      return;
    }
    const show = setTimeout(() => setShowOverlay(true), 120);
    const guard = setTimeout(() => {
      setBusy(false);
      setShowOverlay(false);
    }, 8000);
    return () => {
      clearTimeout(show);
      clearTimeout(guard);
    };
  }, [busy]);

  useEffect(() => {
    const v = variant ?? "";
    const names = new Set([...Object.values(PRODUCT_PAGES), ...Object.values(REQUEST_PAGES)]);
    const links: HTMLLinkElement[] = [];
    names.forEach((n) => {
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.as = "document";
      l.href = `/ref/${n}-${lang}${v}.html`;
      document.head.appendChild(l);
      links.push(l);
    });
    return () => links.forEach((l) => l.remove());
  }, [lang, variant]);

  // كابتشا جديدة لكل تحميل ولكل نقرة على التحديث
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const setup = () => {
      const doc = el.contentDocument;
      const host = doc?.querySelector("bcare-presentation-captcha-input");
      if (!doc || !host) return;
      code.current = drawCaptcha(el) ?? "";
      const input = host.querySelector("input") as HTMLInputElement | null;
      input?.addEventListener("input", () => {
        const err = host.querySelector(".ref-captcha-err") as HTMLElement | null;
        if (err) err.hidden = true;
        input.style.borderColor = "";
      });
      host.addEventListener(
        "click",
        (ev) => {
          if (!(ev.target as HTMLElement).closest("mat-icon")) return;
          ev.preventDefault();
          setTimeout(() => {
            code.current = drawCaptcha(el) ?? "";
          }, 0);
        },
        true,
      );
    };
    setup();
    el.addEventListener("load", setup);
    return () => el.removeEventListener("load", setup);
  }, [name, lang, variant]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; to?: string; lang?: string };
      if (data?.type !== "ref-nav" || typeof data.to !== "string") return;
      if (data.lang === "en" || data.lang === "ar") setLang(data.lang);
      const to = data.to.split("?")[0];
      const here = window.location.pathname.split("?")[0];
      if (to === "/motor-insurance" || to === "/motor-insurance-request") {
        if (here === "/motor-insurance-request") { setLocation("/new-appointment"); return; }
        setLocation("/motor-insurance-request");
        return;
      }
      if (REQUEST_PAGES[to]) { setLocation(to); return; }
      if (PRODUCT_PAGES[to]) setLocation(to);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setLocation]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  // زر «إظهار العروض» مع التحقق من الكابتشا
  useEffect(() => {
    const el = frame.current;
    const form = FORM_ROUTES[path];
    if (!el || !form) return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const btn = target?.closest("button");
      if (!btn) return;
      const label = (btn.textContent || "").replace(/\s+/g, " ").trim();
      if (label !== "إظهار العروض" && label !== "Show Offers") return;

      const input = el.contentDocument?.querySelector(
        'bcare-presentation-captcha-input input',
      ) as HTMLInputElement | null;
      if (input && code.current && input.value.trim() !== code.current) {
        ev.preventDefault();
        ev.stopPropagation();
        showCaptchaError(el);
        return;
      }

      ev.preventDefault();
      setLocation(form);
    };
    const attach = () => el.contentDocument?.addEventListener("click", onClick, true);
    attach();
    el.addEventListener("load", attach);
    return () => {
      el.removeEventListener("load", attach);
      el.contentDocument?.removeEventListener("click", onClick, true);
    };
  }, [path, variant, lang, setLocation]);

  if (variant === null) return <div className="fixed inset-0 bg-white" />;

  return (
    <>
      <iframe
        ref={frame}
        key={`${name}-${lang}${variant}`}
        src={`/ref/${name}-${lang}${variant}.html`}
        title="بي كير"
        onLoad={() => setBusy(false)}
        className="fixed inset-0 h-dvh w-full border-0 bg-[#f7f7f7]"
      />

      {showOverlay && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white"
        >
          <img src={LOGO} alt="بي كير" className="h-12 md:h-14" />
          <div
            className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#dbe6ee]"
            style={{ borderTopColor: "#146394" }}
          />
          <p className="text-sm font-bold" style={{ color: "#146394" }}>
            جارٍ التحميل...
          </p>
        </div>
      )}
    </>
  );
}