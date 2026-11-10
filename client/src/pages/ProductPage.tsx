import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { socket } from "@/lib/store";

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

  const w = 100;
  const h = 46;
  const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");

  const canvas = doc.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const kind = Math.floor(Math.random() * 5);
  const lineColors = ["#bcd3e6", "#8f9de0", "#7fa8d4", "#9ad19a", "#e8b0b0"];
  const lineColor = lineColors[kind];
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;

  if (kind === 0) {
    for (let x = 0; x <= w; x += 5) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  } else if (kind === 1) {
    for (let i = -h; i < w; i += 5) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
  } else if (kind === 2) {
    for (let x = 0; x <= w; x += 5) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  } else if (kind === 3) {
    ctx.fillStyle = lineColor;
    for (let x = 2; x < w; x += 5) {
      for (let y = 2; y < h; y += 5) {
        ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else {
    for (let y = 0; y <= h; y += 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  const colors = ["#e8620c", "#c62828", "#1a3a8b", "#5a1a8b", "#111111", "#8b1a1a", "#0d6b3f"];
  for (let i = 0; i < 4; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 24 + Math.floor(Math.random() * 7);
    const italic = Math.random() < 0.4 ? "italic " : "";
    const weight = Math.random() < 0.5 ? "bold " : "";
    ctx.save();
    ctx.translate(12 + i * 22, 32);
    ctx.rotate((Math.random() - 0.5) * 0.28);
    ctx.fillStyle = color;
    ctx.font = `${italic}${weight}${size}px Georgia, serif`;
    ctx.fillText(code[i], 0, 0);
    if (Math.random() < 0.45) {
      const tw = ctx.measureText(code[i]).width;
      ctx.fillRect(-1, 4, tw + 2, 2);
    }
    ctx.restore();
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
  const [variant, setVariant] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.innerWidth < PHONE_BELOW
        ? "-m"
        : window.innerWidth < TABLET_BELOW
          ? "-t"
          : "",
  );
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

      const data = e.data as { type?: string; to?: string; lang?: string; id?: string; text?: string };
      const reply = (id: string, ok: boolean, reason?: string) => {
        frame.current?.contentWindow?.postMessage(
          { type: "ref-chat-result", id, ok, reason },
          window.location.origin,
        );
      };
      if (data?.type === "ref-chat-ack") {
        console.log("[chat] iframe ack, button found:", (data as unknown as { found?: boolean }).found);
        return;
      }
      if (data?.type === "ref-chat-send") {
        const id = data.id ?? "";
        const text = (data.text ?? "").trim();
        if (!text) return reply(id, false);
        if (!socket.value.connected) return reply(id, false, "offline");
        socket.value.emit("chat:fromVisitor", { message: text, timestamp: Date.now() });
        reply(id, true);
        return;
      }
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
    return () => window.removeEventListener("message", onMessage);  }, [setLocation]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const s = socket.value;
    const onAdmin = (p: { message?: string } | string) => {
      const text = typeof p === "string" ? p : p?.message ?? "";
      console.log("[chat] admin -> visitor:", text);
      if (!text) return;
      frame.current?.contentWindow?.postMessage(
        { type: "ref-chat-incoming", text },
        window.location.origin,
      );
    };
    s.on("chat:fromAdmin", onAdmin);
    return () => { s.off("chat:fromAdmin", onAdmin); };
  }, []);

  useEffect(() => {
    const el = frame.current;
    const form = FORM_ROUTES[path];
    if (!el || !form) return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const btn = target?.closest("button");
      if (!btn) return;
      const isSubmit =
        btn.matches('button[type="submit"]') || btn.classList.contains("bg-newYellow");
      if (!isSubmit) return;

      const input = el.contentDocument?.querySelector(
        "bcare-presentation-captcha-input input",
      ) as HTMLInputElement | null;
      if (input && code.current && input.value.trim() !== code.current) {
        ev.preventDefault();
        ev.stopPropagation();
        showCaptchaError(el);
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();
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
        className="fixed inset-0 w-full border-0 bg-[#f7f7f7]" style={{ height: "100vh" }}
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