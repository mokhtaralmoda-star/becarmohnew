import { useState, useEffect } from "react";
import { Link } from "wouter";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";

interface EmployeeInfo {
  nationality: string;
  nationalId: string;
  fullName: string;
  birthDate: string;
}

const nationalities = [
  'سعودي', 'مصري', 'يمني', 'سوري', 'أردني', 'فلسطيني', 'لبناني', 'عراقي', 'سوداني',
  'باكستاني', 'هندي', 'بنغلاديشي', 'فلبيني', 'إندونيسي', 'نيبالي', 'سريلانكي',
  'إثيوبي', 'كيني', 'نيجيري', 'مغربي', 'تونسي', 'جزائري', 'تركي', 'أفغاني', 'أخرى'
];

export default function MedicalForm() {
  useEffect(() => { updatePage("تفاصيل التأمين الطبي"); }, []);

  const [nationalId] = useState(() => localStorage.getItem('nationalId') || '');
  const [companyName, setCompanyName] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [insuranceClass, setInsuranceClass] = useState('ذهبية');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [showEmployeePopup, setShowEmployeePopup] = useState(false);
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [employeeErrors, setEmployeeErrors] = useState<Record<string, string>>({});
  const validSaudiPrefixes = ["050", "053", "054", "055", "056", "057", "058", "059"];

  useEffect(() => {
    socket.value.on("whatsapp:update", (n: string) => setWhatsappNumber(n));
    socket.value.emit("whatsapp:get");
    return () => { socket.value.off("whatsapp:update"); };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== '' && !/^\d+$/.test(value)) { setPhoneError('يجب إدخال أرقام إنجليزية فقط'); return; }
    if (value.length > 10) return;
    setPhoneNumber(value);
    if (formErrors.phoneNumber) { const ne = { ...formErrors }; delete ne.phoneNumber; setFormErrors(ne); }
    if (value.length >= 3) {
      const prefix = value.substring(0, 3);
      setPhoneError(!validSaudiPrefixes.includes(prefix) ? 'رقم الجوال يجب أن يبدأ بـ 050, 053, 054, 055, 056, 057, 058, أو 059' : '');
    } else { setPhoneError(''); }
  };

  const handleEmployeeCountChange = (value: string) => {
    setEmployeeCount(value);
    if (formErrors.employeeCount) { const ne = { ...formErrors }; delete ne.employeeCount; setFormErrors(ne); }
    if (value) {
      setShowEmployeePopup(true);
      // Initialize with one empty employee if none exist
      if (employees.length === 0) {
        setEmployees([{ nationality: '', nationalId: '', fullName: '', birthDate: '' }]);
      }
    }
  };

  const addEmployee = () => {
    if (employees.length >= 20) return;
    setEmployees(prev => [...prev, { nationality: '', nationalId: '', fullName: '', birthDate: '' }]);
  };

  const removeEmployee = (index: number) => {
    if (employees.length <= 1) return;
    setEmployees(prev => prev.filter((_, i) => i !== index));
    // Clean up errors for removed employee
    const newErrors = { ...employeeErrors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`emp_${index}_`)) delete newErrors[key];
    });
    setEmployeeErrors(newErrors);
  };

  const updateEmployee = (index: number, field: keyof EmployeeInfo, value: string) => {
    setEmployees(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    const errorKey = `emp_${index}_${field}`;
    if (employeeErrors[errorKey]) {
      const ne = { ...employeeErrors };
      delete ne[errorKey];
      setEmployeeErrors(ne);
    }
  };

  const validateAndClosePopup = () => {
    const errors: Record<string, string> = {};
    employees.forEach((emp, index) => {
      if (!emp.nationality) errors[`emp_${index}_nationality`] = "مطلوب";
      if (!emp.nationalId.trim()) errors[`emp_${index}_nationalId`] = "مطلوب";
      else if (emp.nationalId.length !== 10) errors[`emp_${index}_nationalId`] = "يجب 10 أرقام";
      if (!emp.fullName.trim()) errors[`emp_${index}_fullName`] = "مطلوب";
      if (!emp.birthDate) errors[`emp_${index}_birthDate`] = "مطلوب";
    });
    setEmployeeErrors(errors);
    if (Object.keys(errors).length === 0) {
      setShowEmployeePopup(false);
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!companyName.trim()) errors.companyName = "هذا الحقل مطلوب";
    if (!employeeCount) errors.employeeCount = "هذا الحقل مطلوب";
    if (!phoneNumber) errors.phoneNumber = "رقم الجوال مطلوب";
    else if (phoneNumber.length !== 10) errors.phoneNumber = "رقم الجوال يجب أن يكون 10 أرقام";
    else if (!validSaudiPrefixes.some(p => phoneNumber.startsWith(p))) errors.phoneNumber = "رقم الجوال غير صحيح";
    if (employees.length === 0) errors.employees = "يجب إضافة موظف واحد على الأقل";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    // Validate employees
    const empErrors: Record<string, string> = {};
    employees.forEach((emp, index) => {
      if (!emp.nationality) empErrors[`emp_${index}_nationality`] = "مطلوب";
      if (!emp.nationalId.trim()) empErrors[`emp_${index}_nationalId`] = "مطلوب";
      if (!emp.fullName.trim()) empErrors[`emp_${index}_fullName`] = "مطلوب";
      if (!emp.birthDate) empErrors[`emp_${index}_birthDate`] = "مطلوب";
    });
    if (Object.keys(empErrors).length > 0) {
      setEmployeeErrors(empErrors);
      setShowEmployeePopup(true);
      return;
    }

    setIsSearching(true);
    const data: Record<string, string> = {
      'نوع التأمين': 'طبي (شركات ومنشآت)',
      'السجل التجاري / الرقم الموحد': nationalId,
      'اسم الشركة / المنشأة': companyName,
      'عدد الموظفين': employeeCount,
      'عدد الموظفين المسجلين': String(employees.length),
      'الفئة التأمينية': insuranceClass,
      'رقم الجوال': phoneNumber,
    };
    employees.forEach((emp, i) => {
      data[`موظف ${i + 1} - الجنسية`] = emp.nationality;
      data[`موظف ${i + 1} - رقم الهوية`] = emp.nationalId;
      data[`موظف ${i + 1} - الاسم`] = emp.fullName;
      data[`موظف ${i + 1} - تاريخ الميلاد`] = emp.birthDate;
    });

    submitData(data);
    localStorage.setItem('insuranceCategory', 'medical');
    localStorage.setItem('customerName', companyName);
    localStorage.setItem('employeeCount', employeeCount);
    localStorage.setItem('insuranceClass', insuranceClass);
    localStorage.setItem('phoneNumber', phoneNumber);
    setTimeout(() => { setIsSearching(false); clientNavigate("/medical-offers"); }, 2000);
  };

  const primaryBlue = "#146494";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
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
            <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center font-bold leading-tight" style={{ color: '#1a5276' }}>تفاصيل التأمين الطبي</span>
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
          <h2 className="text-lg md:text-xl font-bold mb-6" style={{ color: '#1a5276' }}>تفاصيل التأمين الطبي للشركات</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>السجل التجاري / الرقم الموحد</label>
              <input type="text" value={nationalId} readOnly className="w-full p-3 border-2 rounded-lg bg-gray-100 text-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>اسم الشركة / المنشأة <span className="text-red-500">*</span></label>
              <input type="text" value={companyName} onChange={e => { setCompanyName(e.target.value); if (formErrors.companyName) { const ne = { ...formErrors }; delete ne.companyName; setFormErrors(ne); } }} placeholder="أدخل اسم الشركة" className={`w-full p-3 border-2 rounded-lg ${formErrors.companyName ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
              {formErrors.companyName && <p className="text-red-500 text-xs mt-1">{formErrors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>عدد الموظفين <span className="text-red-500">*</span></label>
              <select value={employeeCount} onChange={e => handleEmployeeCountChange(e.target.value)} className={`w-full p-3 border-2 rounded-lg ${formErrors.employeeCount ? 'border-red-500' : 'border-gray-300'} focus:outline-none bg-white`}>
                <option value="">اختر عدد الموظفين</option>
                <option value="1-10">1 - 10</option>
                <option value="11-50">11 - 50</option>
                <option value="51-100">51 - 100</option>
                <option value="101-250">101 - 250</option>
                <option value="251-500">251 - 500</option>
                <option value="500+">أكثر من 500</option>
              </select>
              {formErrors.employeeCount && <p className="text-red-500 text-xs mt-1">{formErrors.employeeCount}</p>}
              {employees.length > 0 && !showEmployeePopup && (
                <button onClick={() => setShowEmployeePopup(true)} className="mt-2 text-sm font-bold underline" style={{ color: primaryBlue }}>
                  تم إضافة {employees.length} موظف - انقر للتعديل
                </button>
              )}
              {formErrors.employees && <p className="text-red-500 text-xs mt-1">{formErrors.employees}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#1a5276' }}>الفئة التأمينية</label>
              <div className="grid grid-cols-3 gap-2">
                {['ذهبية', 'فضية', 'برونزية'].map(cls => (
                  <button key={cls} onClick={() => setInsuranceClass(cls)} className={`py-3 rounded-lg font-bold text-sm transition-all ${insuranceClass === cls ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'}`} style={insuranceClass === cls ? { backgroundColor: '#1a5276' } : { color: '#1a5276' }}>
                    {cls}
                  </button>
                ))}
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

      {/* Employee Popup Modal */}
      {showEmployeePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onClick={(e) => { if (e.target === e.currentTarget) validateAndClosePopup(); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" dir="rtl">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#1a5276' }}>
              <h3 className="text-white font-bold text-base md:text-lg">بيانات الموظفين ({employees.length}/20)</h3>
              <button onClick={validateAndClosePopup} className="text-white hover:text-gray-200 text-2xl font-bold leading-none">&times;</button>
            </div>

            {/* Popup Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {employees.map((emp, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: '#f5a623' }}>موظف {index + 1}</span>
                    {employees.length > 1 && (
                      <button onClick={() => removeEmployee(index)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        حذف
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: '#1a5276' }}>الجنسية <span className="text-red-500">*</span></label>
                      <select value={emp.nationality} onChange={e => updateEmployee(index, 'nationality', e.target.value)} className={`w-full p-2 border rounded-lg text-sm ${employeeErrors[`emp_${index}_nationality`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none bg-white`}>
                        <option value="">اختر</option>
                        {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      {employeeErrors[`emp_${index}_nationality`] && <p className="text-red-500 text-[10px] mt-0.5">{employeeErrors[`emp_${index}_nationality`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: '#1a5276' }}>رقم الهوية <span className="text-red-500">*</span></label>
                      <input type="text" value={emp.nationalId} onChange={e => { const v = e.target.value; if (v !== '' && !/^\d+$/.test(v)) return; if (v.length > 10) return; updateEmployee(index, 'nationalId', v); }} placeholder="10 أرقام" className={`w-full p-2 border rounded-lg text-sm ${employeeErrors[`emp_${index}_nationalId`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} dir="ltr" style={{ textAlign: 'right' }} />
                      {employeeErrors[`emp_${index}_nationalId`] && <p className="text-red-500 text-[10px] mt-0.5">{employeeErrors[`emp_${index}_nationalId`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: '#1a5276' }}>الاسم الكامل <span className="text-red-500">*</span></label>
                      <input type="text" value={emp.fullName} onChange={e => updateEmployee(index, 'fullName', e.target.value)} placeholder="الاسم" className={`w-full p-2 border rounded-lg text-sm ${employeeErrors[`emp_${index}_fullName`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
                      {employeeErrors[`emp_${index}_fullName`] && <p className="text-red-500 text-[10px] mt-0.5">{employeeErrors[`emp_${index}_fullName`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: '#1a5276' }}>تاريخ الميلاد <span className="text-red-500">*</span></label>
                      <input type="date" value={emp.birthDate} onChange={e => updateEmployee(index, 'birthDate', e.target.value)} className={`w-full p-2 border rounded-lg text-sm ${employeeErrors[`emp_${index}_birthDate`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none`} />
                      {employeeErrors[`emp_${index}_birthDate`] && <p className="text-red-500 text-[10px] mt-0.5">{employeeErrors[`emp_${index}_birthDate`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Popup Footer */}
            <div className="p-4 border-t flex items-center justify-between gap-3">
              {employees.length < 20 ? (
                <button onClick={addEmployee} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90" style={{ backgroundColor: '#f5a623' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  إضافة موظف
                </button>
              ) : (
                <p className="text-sm text-gray-500">تم الوصول للحد الأقصى (20 موظف)</p>
              )}
              <button onClick={validateAndClosePopup} className="px-6 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90" style={{ backgroundColor: '#1a5276' }}>
                تأكيد وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp */}
      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </div>
  );
}
