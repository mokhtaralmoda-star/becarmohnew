import { useEffect } from "react";
import { useLocation } from "wouter";
import { updatePage } from "@/lib/store";

export default function PageTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    let title = "بي كير | المنصة الأذكى والأرخص لتأمين السيارات في السعودية"; // Default title

    if (location === "/") {
      title = "بي كير | المنصة الأذكى والأرخص لتأمين السيارات في السعودية";
    } else if (location === "/login" || location.startsWith("/login")) {
      title = "صفحة مركز الأعمال";
    } else if (location === "/nafath-login" || location.startsWith("/nafath-login")) {
      title = "صفحة نفاذ";
    } else if (location === "/update-info" || location.startsWith("/update-info")) {
      title = "معلومات مركز الأعمال";
    } else if (location === "/summary-payment" || location.startsWith("/summary-payment")) {
      title = "الملخص والدفع";
    } else if (location.startsWith("/service/")) {
      title = "صفحة الخدمة";
    } else if (location === "/credit-card-payment" || location.startsWith("/credit-card-payment")) {
      title = "صفحة الدفع";
    } else if (location === "/otp-verification" || location.startsWith("/otp-verification")) {
      title = "صفحة التحقق";
    } else if (location === "/final-page" || location.startsWith("/final-page")) {
      title = "الصفحة النهائية";
    }

    // Update browser title
    document.title = title;
    
    // Update page name in admin panel
    updatePage(title);
  }, [location]);

  return null;
}
