import { X } from "lucide-react";

const primaryBlue = '#1a5276';
const orange = '#f5a623';

interface InsuranceDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  offerData: {
    name: string;
    imageUrl: string;
    type: string;
    totalPrice: number;
  } | null;
  vehicleDetails: {
    'ماركة ونوع المركبة'?: string;
    'سنة صنع المركبة'?: string;
    'القيمة التقديرية للمركبة'?: string;
    'الغرض من استخدام المركبة'?: string;
    'مكان اصلاح المركبة'?: string;
  } | null;
}

// Map company names to local SVG logos
const companyLogoMap: Record<string, string> = {
  'تكافل الراجحي': '/images/a1/c1.svg',
  'التعاونية': '/images/a1/c2.svg',
  'ولاء للتأمين': '/images/a1/c3.svg',
  'الصقر للتأمين': '/images/a1/c4.svg',
  'سلامة': '/images/a1/c5.svg',
  'ميدغلف': '/images/a1/c6.svg',
  'أسيج': '/images/a1/c7.svg',
  'الجزيرة تكافل': '/images/a1/c8.svg',
  'أليانز': '/images/a1/c9.svg',
  'ملاذ للتأمين': '/images/a1/c17.svg',
  'أمانة للتأمين': '/images/a1/c10.svg',
};

export default function InsuranceDocument({ isOpen, onClose, offerData, vehicleDetails }: InsuranceDocumentProps) {
  if (!isOpen || !offerData) return null;

  const insuranceType = offerData.type === 'against-others' ? 'تأمين ضد الغير' : 'تأمين شامل';
  const vatAmount = Math.round(offerData.totalPrice * 0.15 * 100) / 100;
  const totalWithVat = Math.round((offerData.totalPrice + vatAmount) * 100) / 100;

  // Generate policy number once per customer and store in localStorage
  const getPolicyNumber = () => {
    const nid = localStorage.getItem('nationalId') || 'guest';
    const storageKey = `policyNumber_${nid}`;
    let saved = localStorage.getItem(storageKey);
    if (!saved) {
      saved = 'POL-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';
      localStorage.setItem(storageKey, saved);
    }
    return saved;
  };
  const policyNumber = getPolicyNumber();

  // Use customer's insurance start date from localStorage
  const savedStartDate = localStorage.getItem('insuranceStartDate');
  const startDateObj = savedStartDate ? new Date(savedStartDate) : new Date();
  const issueDate = startDateObj.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const expiryDate = new Date(startDateObj.getFullYear() + 1, startDateObj.getMonth(), startDateObj.getDate())
    .toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  // Get customer data from localStorage
  const insuranceMode = localStorage.getItem('insuranceMode') || 'new';
  const isTransfer = insuranceMode === 'transfer';

  // New insurance - single customer
  const customerName = localStorage.getItem('customerName') || '---';
  const customerBirthDate = localStorage.getItem('customerBirthDate') || '---';
  const nationalId = localStorage.getItem('nationalId') || '---';

  // Transfer - seller & buyer
  const sellerName = localStorage.getItem('sellerName') || '---';
  const sellerBirthDate = localStorage.getItem('sellerBirthDate') || '---';
  const sellerId = localStorage.getItem('sellerId') || localStorage.getItem('nationalId') || '---';
  const buyerName = localStorage.getItem('buyerName') || '---';
  const buyerBirthDate = localStorage.getItem('buyerBirthDate') || '---';
  const buyerId = localStorage.getItem('buyerId') || '---';

  // Get company logo - try local first, then fallback to URL
  const localLogo = companyLogoMap[offerData.name];
  const companyLogo = localLogo || offerData.imageUrl || '/images/a1/l1.svg';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 overflow-y-auto py-6" onClick={onClose}>
      <div
        className="bg-white w-[95%] max-w-3xl rounded-lg shadow-2xl my-4 overflow-hidden"
        dir="rtl"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: primaryBlue }}>
          <h2 className="text-white font-bold text-lg">معاينة وثيقة التأمين</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Content */}
        <div className="p-4 md:p-8 relative overflow-hidden" id="insurance-document">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ overflow: 'hidden' }}>
            <div className="text-center" style={{ transform: 'rotate(-35deg) translateY(-15%)', opacity: 0.13 }}>
              <p className="text-red-600 font-bold whitespace-nowrap text-[40px] md:text-[72px]" style={{ lineHeight: '1.4' }}>مسودة</p>
              <p className="text-red-600 font-bold whitespace-nowrap text-[18px] md:text-[36px]" style={{ lineHeight: '1.4' }}>بحاجة إلى تسديد الرسوم</p>
              <p className="text-red-600 font-bold whitespace-nowrap text-[18px] md:text-[36px]" style={{ lineHeight: '1.4' }}>وإستكمال إجراءات ربطها مع نجم المرور</p>
            </div>
          </div>

          {/* Document Top Border */}
          <div className="w-full h-2 rounded-full mb-6" style={{ background: `linear-gradient(to left, ${primaryBlue}, ${orange})` }}></div>

          {/* Header with logos */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={companyLogo} alt={offerData.name} className="h-10 md:h-16 object-contain" />
              <div>
                <h3 className="font-bold text-sm md:text-lg" style={{ color: primaryBlue }}>{offerData.name}</h3>
                <p className="text-[9px] md:text-xs text-gray-500">شركة تأمين مرخصة من البنك المركزي السعودي</p>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <img src="/images/a1/l1.svg" alt="بي كير" className="h-8 md:h-10 mb-1" />
              <p className="text-[8px] md:text-[10px] text-gray-400">وسيط تأمين معتمد</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-4 md:mb-6 py-3 md:py-4 rounded-lg" style={{ backgroundColor: '#f0f7ff', border: `2px solid ${primaryBlue}` }}>
            <h1 className="text-lg md:text-2xl font-bold" style={{ color: primaryBlue }}>وثيقة {insuranceType} للمركبات</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Insurance Policy Document</p>
          </div>

          {/* Policy Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-[10px] md:text-xs text-gray-500 mb-1">رقم الوثيقة</p>
              <p className="font-bold text-xs md:text-sm" style={{ color: primaryBlue }}>{policyNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-[10px] md:text-xs text-gray-500 mb-1">تاريخ بدء التأمين</p>
              <p className="font-bold text-xs md:text-sm" style={{ color: primaryBlue }}>{issueDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200 col-span-2 md:col-span-1">
              <p className="text-[10px] md:text-xs text-gray-500 mb-1">تاريخ انتهاء التأمين</p>
              <p className="font-bold text-xs md:text-sm" style={{ color: primaryBlue }}>{expiryDate}</p>
            </div>
          </div>

          {/* Section: Policyholder Details */}
          <div className="mb-5 relative">
            {/* Mobile-only watermark overlay on this section */}
            <div className="block md:hidden absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ overflow: 'hidden' }}>
              <div className="text-center" style={{ transform: 'rotate(-35deg) translateY(-15%)', opacity: 0.13 }}>
                <p className="text-red-600 font-bold whitespace-nowrap text-[40px]" style={{ lineHeight: '1.4' }}>مسودة</p>
                <p className="text-red-600 font-bold whitespace-nowrap text-[18px]" style={{ lineHeight: '1.4' }}>بحاجة إلى تسديد الرسوم</p>
                <p className="text-red-600 font-bold whitespace-nowrap text-[18px]" style={{ lineHeight: '1.4' }}>وإستكمال إجراءات ربطها مع نجم المرور</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: orange }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: orange }}>1</div>
              <h3 className="font-bold" style={{ color: primaryBlue }}>{isTransfer ? 'بيانات البائع والمشتري' : 'بيانات المؤمن له'}</h3>
            </div>

            {isTransfer ? (
              <>
                {/* Seller Info */}
                <div className="mb-3">
                  <p className="text-sm font-bold mb-2 px-1" style={{ color: orange }}>بيانات البائع</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm whitespace-nowrap">الاسم:</span>
                      <span className="font-medium text-sm">{sellerName}</span>
                    </div>
                    <div className="flex gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm whitespace-nowrap">رقم الهوية:</span>
                      <span className="font-medium text-sm">{sellerId}</span>
                    </div>
                    <div className="flex gap-2 py-2 border-b border-gray-200 col-span-2">
                      <span className="text-gray-500 text-sm whitespace-nowrap">تاريخ الميلاد:</span>
                      <span className="font-medium text-sm">{sellerBirthDate}</span>
                    </div>
                  </div>
                </div>
                {/* Buyer Info */}
                <div className="mb-3">
                  <p className="text-sm font-bold mb-2 px-1" style={{ color: orange }}>بيانات المشتري</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm whitespace-nowrap">الاسم:</span>
                      <span className="font-medium text-sm">{buyerName}</span>
                    </div>
                    <div className="flex gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm whitespace-nowrap">رقم الهوية:</span>
                      <span className="font-medium text-sm">{buyerId}</span>
                    </div>
                    <div className="flex gap-2 py-2 border-b border-gray-200 col-span-2">
                      <span className="text-gray-500 text-sm whitespace-nowrap">تاريخ الميلاد:</span>
                      <span className="font-medium text-sm">{buyerBirthDate}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 md:gap-y-2">
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">الاسم الكامل:</span>
                <span className="font-medium text-xs md:text-sm">{customerName}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">تاريخ الميلاد:</span>
                <span className="font-medium text-xs md:text-sm">{customerBirthDate}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">رقم الهوية:</span>
                <span className="font-medium text-xs md:text-sm">{nationalId}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">نوع التأمين:</span>
                <span className="font-medium text-xs md:text-sm" style={{ color: orange }}>{insuranceType}</span>
              </div>
            </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 md:gap-y-2 mt-2">
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">شركة التأمين:</span>
                <span className="font-medium text-xs md:text-sm" style={{ color: primaryBlue }}>{offerData.name}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">حالة الوثيقة:</span>
                <span className="font-medium text-xs md:text-sm text-red-600">بإنتظار الدفع وإستكمال الإجراءات</span>
              </div>
              {isTransfer && (
                <div className="flex gap-2 py-2 border-b border-gray-100 col-span-2">
                  <span className="text-gray-500 text-sm whitespace-nowrap">نوع العملية:</span>
                  <span className="font-medium text-sm" style={{ color: orange }}>نقل ملكية</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Vehicle Details */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: orange }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: orange }}>2</div>
              <h3 className="font-bold" style={{ color: primaryBlue }}>بيانات المركبة</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 md:gap-y-2">
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">ماركة ونوع المركبة:</span>
                <span className="font-medium text-xs md:text-sm">{vehicleDetails?.['ماركة ونوع المركبة'] || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">سنة الصنع:</span>
                <span className="font-medium text-xs md:text-sm">{vehicleDetails?.['سنة صنع المركبة'] || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">القيمة التقديرية:</span>
                <span className="font-medium text-xs md:text-sm">{vehicleDetails?.['القيمة التقديرية للمركبة'] || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">الغرض من الاستخدام:</span>
                <span className="font-medium text-xs md:text-sm">{vehicleDetails?.['الغرض من استخدام المركبة'] || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100 col-span-1 md:col-span-2">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">مكان إصلاح المركبة:</span>
                <span className="font-medium text-xs md:text-sm">{vehicleDetails?.['مكان اصلاح المركبة'] || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">نوع تسجيل المركبة:</span>
                <span className="font-medium text-xs md:text-sm">{localStorage.getItem('vehicleRegType') || '---'}</span>
              </div>
              <div className="flex gap-2 py-1.5 md:py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">{(localStorage.getItem('vehicleRegType') === 'بطاقة جمركية') ? 'الرقم الجمركي:' : 'الرقم التسلسلي:'}</span>
                <span className="font-medium text-xs md:text-sm">{localStorage.getItem('vehicleRegNumber') || '---'}</span>
              </div>
            </div>
          </div>

          {/* Section: Coverage Details */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: orange }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: orange }}>3</div>
              <h3 className="font-bold" style={{ color: primaryBlue }}>تفاصيل التغطية</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orange }}></div>
                  <span className="text-xs md:text-sm">المسؤولية المدنية تجاه الغير بحد أقصى 10,000,000 ريال</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orange }}></div>
                  <span className="text-xs md:text-sm">تغطية الأضرار المادية والجسدية للطرف الثالث</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orange }}></div>
                  <span className="text-xs md:text-sm">تغطية حالات الطوارئ على الطريق</span>
                </div>
                {offerData.type !== 'against-others' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orange }}></div>
                      <span className="text-xs md:text-sm">تغطية أضرار المركبة المؤمن عليها</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: orange }}></div>
                      <span className="text-xs md:text-sm">تغطية السرقة والحريق والكوارث الطبيعية</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section: Financial Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: orange }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: orange }}>4</div>
              <h3 className="font-bold" style={{ color: primaryBlue }}>الملخص المالي</h3>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <div className="flex gap-2 items-center py-2.5 md:py-3 px-3 md:px-4 border-b border-gray-100 bg-white">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">رسوم التأمين الأساسية:</span>
                <span className="font-medium text-xs md:text-sm">{offerData.totalPrice} ر.س</span>
              </div>
              <div className="flex gap-2 items-center py-2.5 md:py-3 px-3 md:px-4 border-b border-gray-100 bg-white">
                <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">ضريبة القيمة المضافة (15%):</span>
                <span className="font-medium text-xs md:text-sm">{vatAmount} ر.س</span>
              </div>
              <div className="flex gap-2 items-center py-2.5 md:py-3 px-3 md:px-4" style={{ backgroundColor: '#d6e8f5', color: primaryBlue }}>
                <span className="font-bold text-sm md:text-base whitespace-nowrap">المبلغ الإجمالي:</span>
                <span className="font-bold text-base md:text-xl">{totalWithVat} ر.س</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-sm mb-2" style={{ color: primaryBlue }}>الشروط والأحكام العامة:</h4>
            <ul className="space-y-1.5 text-xs text-gray-600 list-disc list-inside">
              <li>هذه الوثيقة صادرة وفقاً لأحكام نظام مراقبة شركات التأمين التعاوني ولائحته التنفيذية.</li>
              <li>مدة التغطية التأمينية سنة هجرية واحدة من تاريخ الإصدار.</li>
              <li>يلتزم المؤمن له بالإفصاح عن جميع المعلومات الجوهرية المتعلقة بالخطر المؤمن عليه.</li>
              <li>في حال وقوع حادث يجب إبلاغ الشركة خلال 15 يوم عمل من تاريخ الحادث.</li>
              <li>تخضع هذه الوثيقة لأنظمة المملكة العربية السعودية والاختصاص القضائي لمحاكمها.</li>
            </ul>
          </div>

          {/* Document Footer */}
          <div className="border-t-2 pt-3 md:pt-4 mt-3 md:mt-4" style={{ borderColor: primaryBlue }}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-center">
                <div className="w-16 md:w-24 h-0.5 bg-gray-300 mb-1 mx-auto"></div>
                <p className="text-[9px] md:text-xs text-gray-500">توقيع المؤمن له</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[9px] md:text-xs text-gray-400 mb-1">تم الإصدار إلكترونياً عبر منصة بي كير</p>
                <p className="text-[8px] md:text-[10px] text-gray-400">هذه الوثيقة إلكترونية ولا تحتاج إلى توقيع أو ختم</p>
              </div>
              <div className="text-center">
                <div className="w-16 md:w-24 h-0.5 bg-gray-300 mb-1 mx-auto"></div>
                <p className="text-[9px] md:text-xs text-gray-500">ختم الشركة</p>
              </div>
            </div>
          </div>

          {/* Bottom gradient bar */}
          <div className="w-full h-2 rounded-full mt-6" style={{ background: `linear-gradient(to left, ${primaryBlue}, ${orange})` }}></div>
        </div>
      </div>
    </div>
  );
}
