import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const TABLET_BELOW = 960;
const PHONE_BELOW = 600;

// التبويبات تفتح صفحة المنتج (landing)
const PRODUCT_PAGES: Record<string, string> = {
  "/": "home",
  "/motor-insurance": "home",
  "/travel-insurance": "landing-travel",
  "/domestic-workers": "landing-helpers",
  "/medical-insurance": "landing-medical",
  "/medical-malpractice": "landing-mm",
};

// زر «طلب العروض» يفتح صفحة طلب العروض
const REQUEST_PAGES: Record<string, string> = {
  "/motor-insurance-request": "motor",
  "/travel-insurance-request": "travel",
  "/domestic-workers-request": "helpers",
  "/medical-insurance-request": "medical",
  "/medical-malpractice-request": "mm",
};

// زر «إظهار العروض» داخل صفحة الطلب يكمّل لنموذج المشروع
const FORM_ROUTES: Record<string, string> = {
  "/motor-insurance-request": "/new-appointment",
  "/travel-insurance-request": "/travel-form",
  "/domestic-workers-request": "/domestic-form",
  "/medical-insurance-request": "/medical-form",
  "/medical-malpractice-request": "/malpractice-form",
};

export default function ProductPage() {
  const [location, setLocation] = useLocation();
  const path = location.split("?")[0];
  const name = PRODUCT_PAGES[path] ?? REQUEST_PAGES[path] ?? "home";

  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [variant, setVariant] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

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

  // زر «إظهار العروض» داخل صفحة الطلب يكمّل لنموذج المشروع
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
    <iframe
      ref={frame}
      key={`${name}-${lang}${variant}`}
      src={`/ref/${name}-${lang}${variant}.html`}
      title="بي كير"
      className="fixed inset-0 h-dvh w-full border-0 bg-white"
    />
  );
}