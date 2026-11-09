import { useState, useEffect } from "react";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";
import { Link } from "wouter";
import { offerData } from "@/lib/offer-data";

// Set page title
if (typeof document !== 'undefined') {
  document.title = 'الشركات والعروض';
}

export default function CompareOffers() {
  useEffect(() => {
    updatePage("الشركات والعروض");
  }, []);

  const primaryBlue = "#146494";

  // Pre-select all free features (price=0) for all offers
  const getDefaultFeatures = () => {
    const defaults: Record<string, string[]> = {};
    offerData.forEach((offer) => {
      const freeFeatures = offer.extra_features
        .filter((f) => f.price === 0)
        .map((f) => f.id);
      if (freeFeatures.length > 0) {
        defaults[offer.id] = freeFeatures;
      }
    });
    return defaults;
  };

  // Form fields
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, string[]>>(getDefaultFeatures);
  const [offersTab, setOffersTab] = useState<"comprehensive" | "against-others">(
    localStorage.getItem('insuranceType') === 'شامل' ? 'comprehensive' : 'against-others'
  );
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Vehicle details from previous page
  const [vehicleDetails, setVehicleDetails] = useState<Record<string, string>>({
    'ماركة ونوع المركبة': '',
    'سنة صنع المركبة': '',
    'القيمة التقديرية للمركبة': '',
    'الغرض من استخدام المركبة': '',
    'مكان اصلاح المركبة': '',
  });

  useEffect(() => {
    // Read vehicle details from localStorage
    const saved = localStorage.getItem('vehicleDetails');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVehicleDetails(prev => ({
          ...prev,
          ...parsed,
        }));
      } catch (e) {
        console.error('Error parsing vehicleDetails from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    socket.value.on("whatsapp:update", (number: string) => {
      setWhatsappNumber(number);
    });
    socket.value.emit("whatsapp:get");
    return () => {
      socket.value.off("whatsapp:update");
    };
  }, []);

  const toggleFeature = (offerId: string, featureId: string) => {
    setSelectedFeatures((prev) => {
      const current = prev[offerId] || [];
      if (current.includes(featureId)) {
        return { ...prev, [offerId]: current.filter((id) => id !== featureId) };
      } else {
        return { ...prev, [offerId]: [...current, featureId] };
      }
    });
  };

  const calculateOfferTotal = (offer: (typeof offerData)[0], selectedFeats: string[] = []) => {
    const mainPrice = Number.parseFloat(offer.main_price);
    const featuresPrice = offer.extra_features
      .filter((f) => selectedFeats.includes(f.id))
      .reduce((sum, f) => sum + f.price, 0);
    return mainPrice + featuresPrice;
  };

  const filteredOffers = offerData.filter((offer) => offer.type === offersTab);

  const handleSelectOffer = (offer: (typeof offerData)[0]) => {
    const selectedOfferFeatures = selectedFeatures[offer.id] || [];
    const totalPrice = calculateOfferTotal(offer, selectedOfferFeatures);
    const finalPrice = Number.parseFloat(totalPrice.toFixed(2));

    // Save selected offer data
    const selectedFeats = offer.extra_features.filter((f) => selectedOfferFeatures.includes(f.id));
    const paidFeats = selectedFeats.filter((f) => f.price > 0);
    const data: Record<string, string> = {
      'العرض المختار': offer.company.name,
      'نوع التأمين المختار': offer.type === "against-others" ? "ضد الغير" : "شامل",
      'السعر الأساسي': offer.main_price + ' ريال',
    };
    if (paidFeats.length > 0) {
      data['المزايا الإضافية المختارة'] = paidFeats.map((f) => f.name + ' (' + f.price + ' ريال)').join(' | ');
    }
    data['السعر الإجمالي (بدون ضريبة)'] = finalPrice + ' ريال';
    const vat = Number.parseFloat((finalPrice * 0.15).toFixed(2));
    data['ضريبة القيمة المضافة (15%)'] = vat + ' ريال';
    data['الإجمالي مع الضريبة'] = Number.parseFloat((finalPrice + vat).toFixed(2)) + ' ريال';

    // Save to localStorage for next page
    localStorage.setItem('selectedOffer', JSON.stringify({
      name: offer.company.name,
      imageUrl: offer.company.image_url,
      type: offer.type,
      totalPrice: finalPrice,
    }));

    submitData(data);
    clientNavigate("/summary-payment");
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Header */}
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

      {/* Stepper - RTL: 1 on right, 4 on left */}
      <div className="px-2 md:px-16 lg:px-28 pt-4 md:pt-8" dir="rtl">
        <div className="flex items-center justify-center mb-2">
          {/* Step 1 - completed (orange) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#f5a623' }}>1</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#f5a623' }}>البيانات الرئيسية</span>
          </div>
          {/* Line 1-2 (orange - completed) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#f5a623', marginBottom: '18px' }}></div>
          {/* Step 2 - completed (orange) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#f5a623' }}>2</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#f5a623' }}>تفاصيل وثيقة التأمين</span>
          </div>
          {/* Line 2-3 (orange - completed) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#f5a623', marginBottom: '18px' }}></div>
          {/* Step 3 - current (blue circle, blue text) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#1a5276' }}>3</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#1a5276' }}>الشركات والعروض</span>
          </div>
          {/* Line 3-4 (grey - future) */}
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#d1d5db', marginBottom: '18px' }}></div>
          {/* Step 4 - future (grey) */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg" style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>4</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#9ca3af' }}>الملخص والدفع</span>
          </div>
        </div>
      </div>

      {/* Vehicle Details Summary */}
      <div className="px-3 md:px-16 lg:px-28 pt-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-5" dir="rtl">
          <h3 className="text-base md:text-lg font-bold mb-3" style={{ color: '#1a5276' }}>العروض المتاحة حسب تفاصيل مركبتك</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">ماركة ونوع المركبة</p>
              <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{vehicleDetails['ماركة ونوع المركبة'] || '---'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">سنة صنع المركبة</p>
              <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{vehicleDetails['سنة صنع المركبة'] || '---'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">القيمة التقديرية</p>
              <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{vehicleDetails['القيمة التقديرية للمركبة'] || '---'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">الغرض من الاستخدام</p>
              <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{vehicleDetails['الغرض من استخدام المركبة'] || '---'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">مكان إصلاح المركبة</p>
              <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{vehicleDetails['مكان اصلاح المركبة'] || '---'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Notice */}
      <div className="px-3 md:px-16 lg:px-28 pt-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 md:p-4 shadow-sm" dir="rtl">
          <p className="text-blue-900 text-xs md:text-sm leading-relaxed text-center">
            بموجب تعليمات البنك المركزي السعودي، يحق لحامل الوثيقة إلغاء الوثيقة واسترداد كامل المبلغ المدفوع خلال
            15 يوماً من تاريخ الشراء، بشرط عدم حدوث أي مطالبات خلال هذه الفترة.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 md:px-16 lg:px-28 pt-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-2 text-center" dir="rtl">
            <button
              onClick={() => setOffersTab("against-others")}
              className={`py-3 md:py-4 font-bold text-sm md:text-base lg:text-lg transition-all ${
                offersTab === "against-others"
                  ? "text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              style={offersTab === "against-others" ? { backgroundColor: '#1a5276' } : { color: '#1a5276' }}
            >
              تأمين ضد الغير
            </button>
            <button
              onClick={() => setOffersTab("comprehensive")}
              className={`py-3 md:py-4 font-bold text-sm md:text-base lg:text-lg transition-all ${
                offersTab === "comprehensive"
                  ? "text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              style={offersTab === "comprehensive" ? { backgroundColor: '#1a5276' } : { color: '#1a5276' }}
            >
              تأمين شامل
            </button>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="px-3 md:px-16 lg:px-28 pt-4 pb-14 md:pb-20">
        <div className="space-y-3 md:space-y-4">
          {filteredOffers.map((offer) => {
            const offerSelectedFeatures = selectedFeatures[offer.id] || [];
            const totalPrice = calculateOfferTotal(offer, offerSelectedFeatures);

            return (
              <div
                key={offer.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-5 lg:p-6"
                dir="rtl"
              >
                <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{ color: '#1a5276' }}>{offer.company.name}</h3>
                    <p className="font-semibold text-base md:text-lg mb-3" style={{ color: '#f5a623' }}>
                      التأمين {offer.type === "against-others" ? "ضد الغير" : "شامل"}
                    </p>
                    <hr className="border-gray-200 mb-3 md:mb-4" />

                    <div className="space-y-2 mb-3 md:mb-4">
                      {offer.extra_features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`${offer.id}-${feature.id}`}
                            checked={offerSelectedFeatures.includes(feature.id)}
                            onChange={() => toggleFeature(offer.id, feature.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: '#1a5276' }}
                          />
                          <label
                            htmlFor={`${offer.id}-${feature.id}`}
                            className="flex-1 text-gray-700 text-xs md:text-sm cursor-pointer"
                          >
                            {feature.content}
                            {feature.price > 0 && (
                              <span className="font-semibold mr-1" style={{ color: '#1a5276' }}>(+{feature.price} ﷼)</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>

                    {offer.extra_expenses.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-600 font-semibold mb-1">رسوم إضافية:</p>
                        {offer.extra_expenses.map((expense) => (
                          <div key={expense.id} className="flex justify-between text-xs text-gray-600">
                            <span>{expense.reason}</span>
                            <span>{expense.price} ﷼</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 md:gap-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                      <img
                        src={offer.company.image_url || "/placeholder.svg"}
                        alt={offer.company.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: '#1a5276' }}>{totalPrice.toFixed(2)}</div>
                      <div className="text-xs md:text-sm text-gray-600">﷼ / سنة</div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const hasMandatoryFeature = offer.extra_features.some(
                    f => f.content.includes('المسؤولية المدنية تجاه الغير بحد أقصى 10,000,000 ريال') && offerSelectedFeatures.includes(f.id)
                  );
                  const mandatoryExists = offer.extra_features.some(
                    f => f.content.includes('المسؤولية المدنية تجاه الغير بحد أقصى 10,000,000 ريال')
                  );
                  const isDisabled = mandatoryExists && !hasMandatoryFeature;
                  return (
                    <button
                      onClick={() => !isDisabled && handleSelectOffer(offer)}
                      disabled={isDisabled}
                      className={`w-full py-3 md:py-4 text-white font-bold text-sm md:text-base rounded-lg shadow-md transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                      style={{ backgroundColor: isDisabled ? '#9ca3af' : '#1a5276' }}
                    >
                      اختر هذا العرض
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white pt-8 md:pt-12 pb-6" style={{ backgroundColor: '#146494' }}>
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
