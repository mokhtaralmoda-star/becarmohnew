import { useState, useEffect } from "react";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";
import { Link } from "wouter";
import {
  InsuranceOffer,
  medicalOfferData,
  malpracticeOfferData,
  travelOfferData,
  domesticOfferData,
} from "@/lib/insurance-offer-data";

interface InsuranceOffersProps {
  category: "medical" | "malpractice" | "travel" | "domestic";
}

const categoryConfig = {
  medical: {
    title: "عروض التأمين الطبي",
    pageName: "عروض التأمين الطبي",
    stepTitle: "تفاصيل التأمين الطبي",
    data: medicalOfferData,
    priceLabel: "﷼ / سنة / موظف",
    summaryTitle: "العروض المتاحة حسب بيانات شركتك",
    summaryFields: [
      { key: "companyName", label: "اسم الشركة" },
      { key: "employeeCount", label: "عدد الموظفين" },
      { key: "insuranceClass", label: "الفئة التأمينية" },
    ],
    hasCategoryTabs: true,
  },
  malpractice: {
    title: "عروض تأمين الأخطاء الطبية",
    pageName: "عروض تأمين الأخطاء الطبية",
    stepTitle: "تفاصيل تأمين الأخطاء الطبية",
    data: malpracticeOfferData,
    priceLabel: "﷼ / سنة",
    summaryTitle: "العروض المتاحة حسب بياناتك",
    summaryFields: [
      { key: "fullName", label: "الاسم" },
      { key: "insuranceStartDate", label: "تاريخ بداية التأمين" },
    ],
    hasCategoryTabs: false,
  },
  travel: {
    title: "عروض تأمين السفر",
    pageName: "عروض تأمين السفر",
    stepTitle: "تفاصيل تأمين السفر",
    data: travelOfferData,
    priceLabel: "﷼ / رحلة",
    summaryTitle: "العروض المتاحة حسب تفاصيل رحلتك",
    summaryFields: [
      { key: "destination", label: "الوجهة" },
      { key: "travelers", label: "عدد المسافرين" },
      { key: "duration", label: "مدة الرحلة" },
    ],
    hasCategoryTabs: false,
  },
  domestic: {
    title: "عروض تأمين العمالة المنزلية",
    pageName: "عروض تأمين العمالة المنزلية",
    stepTitle: "تفاصيل تأمين العمالة المنزلية",
    data: domesticOfferData,
    priceLabel: "﷼ / سنة",
    summaryTitle: "العروض المتاحة حسب بياناتك",
    summaryFields: [
      { key: "fullName", label: "الاسم" },
      { key: "workerNationality", label: "جنسية العامل" },
      { key: "workerType", label: "نوع العمل" },
    ],
    hasCategoryTabs: false,
  },
};

const localStorageKeyMap: Record<string, string> = {
  companyName: "customerName",
  employeeCount: "employeeCount",
  insuranceClass: "insuranceClass",
  fullName: "customerName",
  insuranceStartDate: "insuranceStartDate",
  destination: "destination",
  travelers: "travelers",
  duration: "duration",
  workerNationality: "workerNationality",
  workerType: "workerType",
};

const categoryTabs = [
  { key: "ذهبية", label: "ذهبية" },
  { key: "فضية", label: "فضية" },
  { key: "برونزية", label: "برونزية" },
];

export default function InsuranceOffers({ category }: InsuranceOffersProps) {
  const config = categoryConfig[category];
  const allOffers = config.data;

  useEffect(() => {
    updatePage(config.pageName);
  }, [config.pageName]);

  const primaryBlue = "#146494";

  // Get the selected insurance class from localStorage (default to ذهبية)
  const [activeTab, setActiveTab] = useState(() => {
    if (config.hasCategoryTabs) {
      return localStorage.getItem("insuranceClass") || "ذهبية";
    }
    return "";
  });

  // Filter offers based on active tab (only for medical)
  const offers = config.hasCategoryTabs
    ? allOffers.filter((offer) => offer.category === activeTab)
    : allOffers;

  const getDefaultFeatures = () => {
    const defaults: Record<string, string[]> = {};
    offers.forEach((offer) => {
      const freeFeatures = offer.features
        .filter((f) => f.price === 0 && f.included)
        .map((f) => f.id);
      if (freeFeatures.length > 0) {
        defaults[offer.id] = freeFeatures;
      }
    });
    return defaults;
  };

  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, string[]>>(getDefaultFeatures);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [summaryData, setSummaryData] = useState<Record<string, string>>({});

  // Recalculate default features when tab changes
  useEffect(() => {
    const defaults: Record<string, string[]> = {};
    offers.forEach((offer) => {
      const freeFeatures = offer.features
        .filter((f) => f.price === 0 && f.included)
        .map((f) => f.id);
      if (freeFeatures.length > 0) {
        defaults[offer.id] = freeFeatures;
      }
    });
    setSelectedFeatures((prev) => ({ ...prev, ...defaults }));
  }, [activeTab]);

  useEffect(() => {
    const data: Record<string, string> = {};
    config.summaryFields.forEach((field) => {
      const lsKey = localStorageKeyMap[field.key] || field.key;
      data[field.key] = localStorage.getItem(lsKey) || "---";
    });
    setSummaryData(data);
  }, []);

  // Update summary when tab changes
  useEffect(() => {
    if (config.hasCategoryTabs) {
      setSummaryData((prev) => ({ ...prev, insuranceClass: activeTab }));
    }
  }, [activeTab]);

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

  // Get travelers count for travel insurance
  const travelersCount = category === 'travel' ? parseInt(localStorage.getItem('travelers') || '1') || 1 : 1;

  const calculateOfferTotal = (offer: InsuranceOffer, selectedFeats: string[] = []) => {
    const mainPrice = Number.parseFloat(offer.mainPrice);
    const featuresPrice = offer.features
      .filter((f) => selectedFeats.includes(f.id) && f.price > 0)
      .reduce((sum, f) => sum + f.price, 0);
    const perPersonPrice = mainPrice + featuresPrice;
    // Multiply by travelers count for travel insurance
    return category === 'travel' ? perPersonPrice * travelersCount : perPersonPrice;
  };

  const handleSelectOffer = (offer: InsuranceOffer) => {
    const selectedOfferFeatures = selectedFeatures[offer.id] || [];
    const totalPrice = calculateOfferTotal(offer, selectedOfferFeatures);
    const finalPrice = Number.parseFloat(totalPrice.toFixed(2));

    const selectedFeats = offer.features.filter((f) => selectedOfferFeatures.includes(f.id));
    const paidFeats = selectedFeats.filter((f) => f.price > 0);
    const data: Record<string, string> = {
      'نوع التأمين': config.title,
      'العرض المختار': offer.companyName + ' - ' + offer.planName,
      'السعر الأساسي': offer.mainPrice + ' ريال',
    };
    if (paidFeats.length > 0) {
      data['المزايا الإضافية المختارة'] = paidFeats.map((f) => f.content + ' (' + f.price + ' ريال)').join(' | ');
    }
    data['السعر الإجمالي (بدون ضريبة)'] = finalPrice + ' ريال';
    const vat = Number.parseFloat((finalPrice * 0.15).toFixed(2));
    data['ضريبة القيمة المضافة (15%)'] = vat + ' ريال';
    data['الإجمالي مع الضريبة'] = Number.parseFloat((finalPrice + vat).toFixed(2)) + ' ريال';

    localStorage.setItem('selectedOffer', JSON.stringify({
      name: offer.companyName,
      imageUrl: offer.companyLogo,
      type: category,
      planName: offer.planName,
      totalPrice: finalPrice,
    }));

    submitData(data);
    clientNavigate("/summary-payment");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("insuranceClass", tab);
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

      {/* Stepper */}
      <div className="px-2 md:px-16 lg:px-28 pt-4 md:pt-8" dir="rtl">
        <div className="flex items-center justify-center mb-2">
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#f5a623' }}>1</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#f5a623' }}>البيانات الرئيسية</span>
          </div>
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#f5a623', marginBottom: '18px' }}></div>
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#f5a623' }}>2</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#f5a623' }}>{config.stepTitle}</span>
          </div>
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#f5a623', marginBottom: '18px' }}></div>
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#1a5276' }}>3</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#1a5276' }}>الشركات والعروض</span>
          </div>
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#d1d5db', marginBottom: '18px' }}></div>
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg" style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>4</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#9ca3af' }}>الملخص والدفع</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-3 md:px-16 lg:px-28 pt-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-5" dir="rtl">
          <h3 className="text-base md:text-lg font-bold mb-3" style={{ color: '#1a5276' }}>{config.summaryTitle}</h3>
          <div className={`grid grid-cols-2 md:grid-cols-${config.summaryFields.length} gap-3 md:gap-4`}>
            {config.summaryFields.map((field) => (
              <div key={field.key} className="text-center">
                <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                <p className="text-sm font-bold" style={{ color: '#1a5276' }}>{summaryData[field.key] || '---'}</p>
              </div>
            ))}
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

      {/* Category Tabs - Only for Medical */}
      {config.hasCategoryTabs && (
        <div className="px-3 md:px-16 lg:px-28 pt-4">
          <div className="grid grid-cols-3 gap-0 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-3 md:py-4 font-bold text-sm md:text-base transition-all ${
                  activeTab === tab.key
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                style={activeTab === tab.key ? { backgroundColor: '#1a5276' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="px-3 md:px-16 lg:px-28 pt-4 pb-14 md:pb-20">
        <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: '#1a5276' }}>
          {config.hasCategoryTabs ? `${config.title} - الفئة ال${activeTab}` : config.title}
        </h3>
        <div className="space-y-3 md:space-y-4">
          {offers.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">لا توجد عروض متاحة لهذه الفئة حالياً</p>
            </div>
          )}
          {offers.map((offer) => {
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
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{ color: '#1a5276' }}>{offer.companyName}</h3>
                    <p className="font-semibold text-base md:text-lg mb-3" style={{ color: '#f5a623' }}>
                      {offer.planName}
                    </p>
                    <hr className="border-gray-200 mb-3 md:mb-4" />

                    <div className="space-y-2 mb-3 md:mb-4">
                      {offer.features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`${offer.id}-${feature.id}`}
                            checked={offerSelectedFeatures.includes(feature.id)}
                            onChange={() => toggleFeature(offer.id, feature.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: '#1a5276' }}
                            disabled={feature.price === 0 && feature.included}
                          />
                          <label
                            htmlFor={`${offer.id}-${feature.id}`}
                            className="flex-1 text-gray-700 text-xs md:text-sm cursor-pointer"
                          >
                            {feature.content}
                            {feature.price > 0 && (
                              <span className="font-semibold mr-1" style={{ color: '#1a5276' }}>(+{feature.price} ﷼)</span>
                            )}
                            {feature.price === 0 && feature.included && (
                              <span className="text-green-600 mr-1 text-xs">(مشمول)</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>

                    {offer.expenses.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-600 font-semibold mb-1">رسوم إضافية:</p>
                        {offer.expenses.map((expense) => (
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
                        src={offer.companyLogo || "/placeholder.svg"}
                        alt={offer.companyName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: '#1a5276' }}>{totalPrice.toFixed(2)}</div>
                      <div className="text-xs md:text-sm text-gray-600">{config.priceLabel}</div>
                      {category === 'travel' && travelersCount > 1 && (
                        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                          ({(totalPrice / travelersCount).toFixed(2)} × {travelersCount} مسافرين)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectOffer(offer)}
                  className="w-full py-3 md:py-4 text-white font-bold text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: '#1a5276' }}
                >
                  اختر هذا العرض
                </button>
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
            <p className="text-[10px] md:text-sm text-white/80 text-center md:text-right mb-0">
              2026 © جميع الحقوق محفوظة، شركة عناية الوسيط لوساطة التأمين
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </div>
  );
}
