import { ArrowUp, Eye, ZoomIn, ZoomOut, Ear } from "lucide-react";
import { useEffect, useState } from "react";
import { socket } from "@/lib/store";

export default function Footer() {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");

  useEffect(() => {
    // Listen for whatsapp number updates
    socket.value.on("whatsapp:update", (number: string) => {
      setWhatsappNumber(number);
    });

    // Request current whatsapp number
    socket.value.emit("whatsapp:get");

    return () => {
      socket.value.off("whatsapp:update");
    };
  }, []);

  const openWhatsapp = () => {
    if (whatsappNumber) {
      // Remove any non-numeric characters and open whatsapp
      const cleanNumber = whatsappNumber.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  return (
    <footer className="bg-[#004d30] text-white font-sans pt-12 pb-6 relative">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-right">
          
          {/* Column 1: Overview */}
          <div>
            <h3 className="font-bold text-lg mb-6">نظرة عامة</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:underline">عن المملكة العربية السعودية</a></li>
              <li><a href="#" className="hover:underline">عن المنصة الوطنية</a></li>
              <li><a href="#" className="hover:underline">زائر جديد</a></li>
              <li><a href="#" className="hover:underline">الأخبار</a></li>
              <li><a href="#" className="hover:underline">الفعاليات</a></li>
              <li><a href="#" className="hover:underline">الملف الوطني</a></li>
              <li><a href="#" className="hover:underline">تطبيقات الجوال الحكومية</a></li>
              <li><a href="#" className="hover:underline">المشاركة الإلكترونية</a></li>
              <li><a href="#" className="hover:underline">اتفاقية مستوى الخدمة</a></li>
              <li><a href="#" className="hover:underline">ميثاق المستخدمين</a></li>
              <li><a href="#" className="hover:underline">تحديث محتوى المنصة الوطنية</a></li>
            </ul>
          </div>

          {/* Column 2: Important Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">روابط مهمة</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:underline">التقارير والبيانات</a></li>
              <li><a href="#" className="hover:underline">إحصائيات ومؤشرات المنصة</a></li>
              <li><a href="#" className="hover:underline">البيانات المفتوحة</a></li>
              <li><a href="#" className="hover:underline">التنمية المستدامة</a></li>
              <li><a href="#" className="hover:underline">منصات الحكومات الإلكترونية الخليجية</a></li>
              <li><a href="#" className="hover:underline">الخصوصية وحماية البيانات</a></li>
              <li><a href="#" className="hover:underline">الاستراتيجية الوطنية للبيانات والذكاء الاصطناعي</a></li>
              <li><a href="#" className="hover:underline">حق الحصول على المعلومة</a></li>
              <li><a href="#" className="hover:underline">الأمن السيبراني في المملكة</a></li>
              <li><a href="#" className="hover:underline">ميزانية الدولة</a></li>
              <li><a href="#" className="hover:underline">استبيان المشاركة في فعاليات الجهات الحكومية</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="font-bold text-lg mb-6">الدعم والمساعدة</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:underline">الدعم والمساعدة</a></li>
              <li><a href="#" className="hover:underline">تواصل معنا</a></li>
              <li><a href="#" className="hover:underline">مركز تفاعل المستفيدين آمر</a></li>
              <li><a href="#" className="hover:underline">بلاغ رقمي</a></li>
              <li><a href="#" className="hover:underline">قنوات تقديم الخدمة</a></li>
              <li><a href="#" className="hover:underline">الإبلاغ عن فساد</a></li>
              <li><a href="#" className="hover:underline">الإبلاغ عن أخبار كاذبة</a></li>
              <li><a href="#" className="hover:underline">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:underline">سهولة الوصول</a></li>
              <li><a href="#" className="hover:underline">اشترك معنا</a></li>
            </ul>
          </div>

          {/* Column 4: Contact & Tools */}
          <div>
            <h3 className="font-bold text-lg mb-6">تواصل معنا</h3>
            <div className="flex justify-start mb-6 gap-2 items-center">
              {whatsappNumber && (
                <button 
                  onClick={openWhatsapp}
                  className="flex items-center gap-2 px-3 py-2 bg-[#25D366] rounded hover:bg-[#20bd5a] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-white text-sm font-bold" dir="ltr">{whatsappNumber}</span>
                </button>
              )}
              <a href="#" className="w-10 h-10 bg-[#2d7a58] rounded flex items-center justify-center hover:bg-[#3d8a68]">
                <span className="font-bold text-xl">𝕏</span>
              </a>
            </div>

            <h3 className="font-bold text-lg mb-4">أدوات الاتاحة والوصول</h3>
            <div className="flex justify-start gap-2 mb-8">
              <button className="w-10 h-10 bg-[#2d7a58] rounded flex items-center justify-center hover:bg-[#3d8a68]" title="High Contrast">
                <Eye className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-[#2d7a58] rounded flex items-center justify-center hover:bg-[#3d8a68]" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-[#2d7a58] rounded flex items-center justify-center hover:bg-[#3d8a68]" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-3 h-10 bg-[#2d7a58] rounded hover:bg-[#3d8a68]">
                <span className="text-xs font-bold">دعم لغة الاشارة الحية</span>
                <Ear className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-bold text-lg mb-4">تطبيقاتنا</h3>
            <div className="flex justify-start gap-2">
              <img src="/images/app-store-badges.png" alt="Download on App Store and Google Play" className="h-14 object-contain" />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#2d7a58] pt-8 mt-8">
          
          {/* Right: Copyright & Links */}
          <div className="text-right mt-6 md:mt-0 order-1 md:order-1 w-full md:w-auto">
            <div className="flex justify-start gap-4 text-sm font-bold mb-2 underline">
              <a href="#">سياسة الخصوصية</a>
              <a href="#">شروط الاستخدام</a>
              <a href="#">خريطة الموقع</a>
            </div>
            <p className="text-xs mb-1">2026 © جميع الحقوق محفوظة لمنصة GOV.SA (المنصة الحكومية السعودية)</p>
            <p className="text-xs opacity-80">تطوير وتشغيل هيئة الحكومة الرقمية</p>
          </div>

          {/* Left: Logos */}
          <div className="flex items-center justify-end order-2 md:order-2 gap-6 mt-6 md:mt-0">

            <div className="flex items-center h-16">
               <img src="/images/footer-l3.png" alt="SDAIA Logo" className="h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-4 z-50">
        <button className="w-12 h-12 bg-[#2d7a58] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#3d8a68]" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>
    </footer>
  );
}
