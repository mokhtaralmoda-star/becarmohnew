import { useLocation } from "wouter";

export default function RajhiPaymentError() {
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    setLocation("/alrajhi-login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6" dir="rtl">
      {/* شعار الراجحي */}
      <div className="absolute top-6 right-6">
        <img 
          src="/images/banks/al-rajhi-banking-and-investment-corporation-l3.png" 
          alt="مصرف الراجحي" 
          className="h-16"
        />
      </div>

      {/* أيقونة التحذير */}
      <div className="mb-6">
        <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center">
          <span className="text-red-500 text-5xl font-bold">!</span>
        </div>
      </div>

      {/* العنوان */}
      <h1 className="text-3xl font-bold text-red-600 mb-6">خطأ في الدفع</h1>

      {/* النص */}
      <p className="text-xl text-gray-700 text-center leading-relaxed max-w-2xl mb-8">
        عزيزي العميل، تم إيقاف الدفع مؤقتًا عن طريق مصرف الراجحي. يرجى متابعة السداد عبر صفحة الدفع البديلة.
      </p>

      {/* زر المتابعة */}
      <button
        onClick={handleContinue}
        className="px-16 py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
      >
        متابعة
      </button>
    </div>
  );
}
