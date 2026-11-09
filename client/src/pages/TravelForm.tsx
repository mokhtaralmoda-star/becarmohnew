import { useState, useEffect } from "react";
import { Link } from "wouter";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";

interface TravelerInfo {
  nationalId: string;
  fullName: string;
}

export default function TravelForm() {
  useEffect(() => { updatePage("تفاصيل تأمين السفر"); }, []);

  const [nationalId] = useState(() => localStorage.getItem('nationalId') || '');
  const [fullName, setFullName] = useState('');
  const [destination, setDestination] = useState('');
  const [travelersCount, setTravelersCount] = useState('1');
  const [additionalTravelers, setAdditionalTravelers] = useState<TravelerInfo[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const validSaudiPrefixes = ["050", "053", "054", "055", "056", "057", "058", "059"];

  useEffect(() => {
    socket.value.on("whatsapp:update", (n: string) => setWhatsappNumber(n));
    socket.value.emit("whatsapp:get");
    return () => { socket.value.off("whatsapp:update"); };
  }, []);

  // Update additional travelers array when count changes
  useEffect(() => {
    const count = parseInt(travelersCount) || 1;
    if (count > 1) {
      const needed = count - 1; // minus the main traveler
      setAdditionalTravelers(prev => {
        if (prev.length === needed) return prev;
        if (prev.length < needed) {
          return [...prev, ...Array(needed - prev.length).fill(null).map(() => ({ nationalId: '', fullName: '' }))];
        }
        return prev.slice(0, needed);
      });
    } else {
      setAdditionalTravelers([]);
    }
  }, [travelersCount]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== '' && !/^\d+$/.test(value)) { setPhoneError('يجب إدخال أرقام إنجليزية فقط'); return; }
    if (value.length > 10) return;
    setPhoneNumber(value);
    if (formErrors.phoneNumber) { const ne = { ...formErrors }; delete ne.phoneNumber; setFormErrors(ne); }
    if (value.length >= 3) {
      const prefix = value.substring(0, 3);
      setPhoneError(!validSaudiPrefixes.includes(prefix) ? 'رقم الجوال يجب أن يبدأ بـ 050-059' : '');
    } else { setPhoneError(''); }
  };

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    setAdditionalTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear error for this field
    const errorKey = `traveler_${index}_${field}`;
    if (formErrors[errorKey]) {
      const ne = { ...formErrors };
      delete ne[errorKey];
      setFormErrors(ne);
    }
  };

  const destinations = [
    'دول الخليج', 'الدول العربية', 'أوروبا', 'أمريكا الشمالية', 'أمريكا الجنوبية',
    'شرق آسيا', 'جنوب شرق آسيا', 'أفريقيا', 'أستراليا ونيوزيلندا', 'جميع دول العالم'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "هذا الحقل مطلوب";
    if (!destination) errors.destination = "هذا الحقل مطلوب";
    if (!startDate) errors.startDate = "هذا الحقل مطلوب";
    else if (startDate < todayStr) errors.startDate = "لا يمكن اختيار تاريخ سابق";
    if (!endDate) errors.endDate = "هذا الحقل مطلوب";
    else if (endDate <= startDate) errors.endDate = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    if (!phoneNumber) errors.phoneNumber = "رقم الجوال مطلوب";
    else if (phoneNumber.length !== 10) errors.phoneNumber = "رقم الجوال يجب أن يكون 10 أرقام";
    else if (!validSaudiPrefixes.some(p => phoneNumber.startsWith(p))) errors.phoneNumber = "رقم الجوال غير صحيح";

    // Validate additional travelers
    additionalTravelers.forEach((traveler, index) => {
      if (!traveler.nationalId.trim()) errors[`traveler_${index}_nationalId`] = "رقم الهوية مطلوب";
      else if (traveler.nationalId.length !== 10) errors[`traveler_${index}_nationalId`] = "رقم الهوية يجب أن يكون 10 أرقام";
      if (!traveler.fullName.trim()) errors[`traveler_${index}_fullName`] = "الاسم الكامل مطلوب";
    });

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    setIsSearching(true);
    const data: Record<string, string> = {
      'نوع التأمين': 'تأمين سفر',
      'رقم الهوية / الإقامة': nationalId,
      'الاسم الكامل': fullName,
      'الوجهة': destination,
      'عدد المسافرين': travelersCount,
      'تاريخ بداية التغطية': startDate,
      'تاريخ نهاية التغطية': endDate,
      'رقم الجوال': phoneNumber,
    };

    // Add additional travelers data
    additionalTravelers.forEach((traveler, index) => {
      data[`مسافر ${index + 2} - رقم الهوية`] = traveler.nationalId;
      data[`مسافر ${index + 2} - الاسم الكامل`] = traveler.fullName;
    });

    submitData(data);
    localStorage.setItem('insuranceCategory', 'travel');
    localStorage.setItem('customerName', fullName);
    localStorage.setItem('phoneNumber', phoneNumber);
    localStorage.setItem('destination', destination);
    localStorage.setItem('travelers', travelersCount);
    localStorage.setItem('duration', startDate + ' إلى ' + endDate);
    setTimeout(() => { setIsSearching(false); clientNavigate("/travel-offers"); }, 2000);
  };

  const primaryBlue = "#146494";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <header className="bg-white py-3 md:py-4 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer"><img src="/images/a1/l1.svg" alt="بي كير" className="h-8 md:h-10" /></Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: primaryBlue, color: primaryBlue }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
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
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg" style={{ backgroundColor: '#1a5276' }}>2</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#1a5276' }}>تفاصيل تأمين السفر</span>
          </div>
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#d1d5db', marginBottom: '18px' }}></div>
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg" style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>3</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#9ca3af' }}>الشركات والعروض</span>
          </div>
          <div className="flex-1 h-0.5 md:h-1 mx-0.5 md:mx-1" style={{ backgroundColor: '#d1d5db', marginBottom: '18px' }}></div>
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg" style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>4</div>
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#9ca3af' }}>الملخص والدفع</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-3 md:px-16 lg:px-28 pt-4 pb-14 md:pb-20">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-6" style={{ color: '#1a5276' }}>تفاصيل تأمين السفر</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>رقم الهوية / الإقامة</label>
              <input type="text" value={nationalId} readOnly className="w-full p-3 border-2 rounded-lg bg-gray-100 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>الاسم الكامل <span className="text-red-500">*</span></label>
              <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); if (formErrors.fullName) { const ne = { ...formErrors }; delete ne.fullName; setFormErrors(ne); } }} placeholder="أدخل الاسم الكامل" className={`w-full p-3 border-2 rounded-lg ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
              {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>الوجهة <span className="text-red-500">*</span></label>
              <select value={destination} onChange={e => { setDestination(e.target.value); if (formErrors.destination) { const ne = { ...formErrors }; delete ne.destination; setFormErrors(ne); } }} className={`w-full p-3 border-2 rounded-lg ${formErrors.destination ? 'border-red-500' : 'border-gray-300'} focus:outline-none bg-white`}>
                <option value="">اختر الوجهة</option>
                {destinations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.destination && <p className="text-red-500 text-xs mt-1">{formErrors.destination}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>عدد المسافرين</label>
              <select value={travelersCount} onChange={e => setTravelersCount(e.target.value)} className="w-full p-3 border-2 rounded-lg border-gray-300 focus:outline-none bg-white">
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{n}</option>)}
              </select>
            </div>

            {/* Additional Travelers Fields */}
            {additionalTravelers.length > 0 && (
              <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50/30 space-y-4">
                <h3 className="text-sm font-bold mb-2" style={{ color: '#1a5276' }}>بيانات المسافرين الإضافيين</h3>
                {additionalTravelers.map((traveler, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 space-y-3">
                    <p className="text-sm font-bold" style={{ color: '#f5a623' }}>المسافر {index + 2}</p>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: '#1a5276' }}>رقم الهوية / الإقامة <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={traveler.nationalId}
                        onChange={e => {
                          const val = e.target.value;
                          if (val !== '' && !/^\d+$/.test(val)) return;
                          if (val.length > 10) return;
                          updateTraveler(index, 'nationalId', val);
                        }}
                        placeholder="أدخل رقم الهوية / الإقامة"
                        className={`w-full p-3 border-2 rounded-lg ${formErrors[`traveler_${index}_nationalId`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none`}
                        dir="ltr"
                        style={{ textAlign: 'right' }}
                      />
                      {formErrors[`traveler_${index}_nationalId`] && <p className="text-red-500 text-xs mt-1">{formErrors[`traveler_${index}_nationalId`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: '#1a5276' }}>الاسم الكامل <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={traveler.fullName}
                        onChange={e => updateTraveler(index, 'fullName', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                        className={`w-full p-3 border-2 rounded-lg ${formErrors[`traveler_${index}_fullName`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none`}
                      />
                      {formErrors[`traveler_${index}_fullName`] && <p className="text-red-500 text-xs mt-1">{formErrors[`traveler_${index}_fullName`]}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>تاريخ بداية التغطية <span className="text-red-500">*</span></label>
                <input type="date" value={startDate} min={todayStr} onChange={e => { setStartDate(e.target.value); if (formErrors.startDate) { const ne = { ...formErrors }; delete ne.startDate; setFormErrors(ne); } }} className={`w-full p-3 border-2 rounded-lg ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
                {formErrors.startDate && <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>تاريخ نهاية التغطية <span className="text-red-500">*</span></label>
                <input type="date" value={endDate} min={startDate || todayStr} onChange={e => { setEndDate(e.target.value); if (formErrors.endDate) { const ne = { ...formErrors }; delete ne.endDate; setFormErrors(ne); } }} className={`w-full p-3 border-2 rounded-lg ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
                {formErrors.endDate && <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>رقم الجوال <span className="text-red-500">*</span></label>
              <input type="tel" value={phoneNumber} onChange={handlePhoneChange} placeholder="05XXXXXXXX" className={`w-full p-3 border-2 rounded-lg ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} dir="ltr" style={{ textAlign: 'right' }} />
              {(phoneError || formErrors.phoneNumber) && <p className="text-red-500 text-xs mt-1">{phoneError || formErrors.phoneNumber}</p>}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={isSearching} className="w-full mt-6 py-4 text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50" style={{ backgroundColor: '#f5a623' }}>
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                جاري البحث عن العروض...
              </div>
            ) : 'إظهار العروض'}
          </button>
        </div>
      </div>

      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </div>
  );
}
