import { User, Clock, Monitor, Languages, HelpCircle, ExternalLink, MapPin, Phone, Mail } from "lucide-react";

export default function ServiceInfo() {
  return (
    <div className="space-y-8 hidden lg:block text-right">
      {/* Target Audience - Part 1 */}
      <div className="flex items-start justify-start gap-4 text-right">
        <User className="w-6 h-6 text-[#006C35] mt-1 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col items-start">
          <p className="text-sm md:text-base text-gray-900 font-medium mb-1">أفراد , مؤسسات</p>
          <h3 className="text-gray-500 text-xs md:text-sm">الجمهور المستهدف</h3>
        </div>
      </div>

      {/* Target Audience - Part 2 */}
      <div className="flex items-start justify-start gap-4 text-right">
        <User className="w-6 h-6 text-[#006C35] mt-1 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col items-start">
          <p className="text-sm md:text-base text-gray-900 font-medium mb-1 leading-relaxed">جميع مالكي المركبات</p>
          <h3 className="text-gray-500 text-xs md:text-sm">صفة المستخدم</h3>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-start justify-start gap-4 text-right">
        <Clock className="w-6 h-6 text-[#006C35] mt-1 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col items-start">
          <p className="text-sm md:text-base text-gray-900 font-medium mb-1">فوري</p>
          <h3 className="text-gray-500 text-xs md:text-sm">مدة الخدمة</h3>
        </div>
      </div>

      {/* Channels */}
      <div className="flex items-start justify-start gap-4 text-right">
        <Monitor className="w-6 h-6 text-[#006C35] mt-1 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col items-start">
          <p className="text-sm md:text-base text-gray-900 font-medium mb-1">بوابة إلكترونية</p>
          <h3 className="text-gray-500 text-xs md:text-sm">قنوات تقديم الخدمة</h3>
        </div>
      </div>

      {/* Language */}
      <div className="flex items-start justify-start gap-4 text-right">
        <Languages className="w-6 h-6 text-[#006C35] mt-1 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col items-start">
          <p className="text-sm md:text-base text-gray-900 font-medium mb-1">عربي</p>
          <h3 className="text-gray-500 text-xs md:text-sm">الخدمة مقدمة باللغة</h3>
        </div>
      </div>

      {/* Cost */}
      <div className="flex items-start justify-start gap-4 text-right">
        <div className="w-6 h-6 flex items-center justify-center mt-1 shrink-0">
          <span className="text-[#006C35] font-bold text-xl">﷼</span>
        </div>
        <div className="flex flex-col items-start">
          <p className="text-base md:text-lg font-bold text-gray-900 mb-1">125 <span className="text-sm font-normal text-[#006C35]">ر.س</span></p>
          <h3 className="text-gray-500 text-xs md:text-sm">تكلفة الخدمة</h3>
        </div>
      </div>

      {/* Payment Channels */}
      <div className="flex flex-col items-start gap-2 mt-4 w-full">
        <h3 className="text-gray-900 font-bold text-sm md:text-base mb-2">قنوات الدفع</h3>
        <div className="w-full flex justify-start">
          <img src="/images/payment-methods.png" alt="قنوات الدفع: مدى، سداد، البطاقة الائتمانية" className="max-w-full h-auto object-contain" />
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-6 pt-8 mt-4 border-t border-gray-100 w-full">
        {/* FAQ */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-start gap-2 text-right">
            <HelpCircle className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">الأسئلة الشائعة</span>
          </div>
          <div className="flex items-center justify-start gap-2 text-right group cursor-pointer pr-7">
            <ExternalLink className="w-4 h-4 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm font-bold text-[#006C35] underline">الاطلاع على الأسئلة الشائعة</span>
          </div>
        </div>

        {/* Branches */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-start gap-2 text-right">
            <MapPin className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">مراكز الفحص</span>
          </div>
          <div className="flex items-center justify-start gap-2 text-right group cursor-pointer pr-7">
            <ExternalLink className="w-4 h-4 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm font-bold text-[#006C35] underline">الاطلاع على مراكز الفحص</span>
          </div>
        </div>

        {/* Working Hours */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-start gap-2 text-right">
            <Clock className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">أوقات العمل</span>
          </div>
          <div className="text-right pr-7">
            <p className="text-sm text-gray-500">8 صباحا - 5 مساء (من الأحد إلى الخميس)</p>
          </div>
        </div>
        
        {/* Phone */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-start gap-2 text-right">
            <Phone className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">الهاتف</span>
          </div>
          <div className="text-right pr-7">
            <p className="text-base font-bold text-[#006C35]" dir="ltr">920020983</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-start gap-2 text-right">
            <Mail className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">البريد الإلكتروني</span>
          </div>
          <div className="text-right pr-7">
            <p className="text-sm text-[#006C35]">info@vsc.sa</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col items-start gap-1 relative">
          <div className="flex items-center justify-start gap-2 text-right">
            <MapPin className="w-5 h-5 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm md:text-base font-bold text-gray-900">الموقع الجغرافي</span>
          </div>
          <div className="flex items-center justify-start gap-2 text-right group cursor-pointer pr-7">
            <ExternalLink className="w-4 h-4 text-[#006C35]" strokeWidth={1.5} />
            <span className="text-sm font-bold text-[#006C35] underline">الاطلاع على الموقع</span>
          </div>
        </div>

        {/* Related Apps */}
        <div className="flex flex-col items-start gap-2 w-full">
          <div className="w-full flex justify-start">
             <img src="/images/related-apps.png" alt="" className="w-full max-w-[200px] object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
