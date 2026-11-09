import { useRoute } from "wouter";

const defaultSteps = [
  {
    title: "الدخول على المنصة:",
    description: "عبر الموقع الإلكتروني لمركز سلامة المركبات."
  },
  {
    title: "تعبئة البيانات الشخصية:",
    description: "إدخال الاسم ورقم الهوية / الإقامة والجنسية ورقم الجوال والبريد الإلكتروني."
  },
  {
    title: "إدخال بيانات المركبة:",
    description: "اختيار نوع الوثيقة (رخصة سير أو بطاقة جمركية) وإدخال رقم اللوحة أو رقم البطاقة الجمركية."
  },
  {
    title: "اختيار نوع التسجيل:",
    description: "تحديد نوع التسجيل المناسب للمركبة."
  },
  {
    title: "تحديد الموعد:",
    description: "اختيار المنطقة ومركز الفحص وتاريخ ووقت الفحص المناسب."
  },
  {
    title: "مراجعة وتأكيد الطلب:",
    description: "مراجعة ملخص الطلب والدفع لإتمام الحجز."
  }
];

export default function ServiceSteps() {
  const [match, params] = useRoute("/service/:id?");
  const serviceId = match ? params?.id : null;

  let steps = defaultSteps;
  
  let videoId = 'uMDpYAV1oFA';
  let videoTitle = 'شرح خدمة الفحص الفني الدوري';

  const showVideo = true;

  return (
    <div className="py-4">
      {/* YouTube Video Section */}
      {showVideo && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <div className="relative pb-[56.25%] h-0 bg-black">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={videoTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-800 mb-6 text-right">
        خطوات التقديم على الخدمة
      </h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#006C35] text-white flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1 text-right">
              <h4 className="font-bold text-gray-800 text-sm">{step.title}</h4>
              {step.description && (
                <p className="text-gray-600 text-sm mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
