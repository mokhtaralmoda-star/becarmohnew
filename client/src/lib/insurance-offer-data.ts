// Insurance offer data for medical, malpractice, travel, and domestic worker insurance

export interface InsuranceOffer {
  id: string;
  companyName: string;
  companyLogo: string;
  type: string; // insurance category
  planName: string;
  category?: string; // ذهبية | فضية | برونزية
  mainPrice: string;
  features: { id: string; content: string; price: number; included: boolean }[];
  expenses: { id: string; reason: string; price: number }[];
}

// ==================== MEDICAL INSURANCE (طبي) ====================
export const medicalOfferData: InsuranceOffer[] = [
  {
    id: "med-001",
    companyName: "التعاونية",
    companyLogo: "/images/a1/c2.svg",
    type: "medical",
    planName: "الفئة الذهبية",
    category: "ذهبية",
    mainPrice: "3400.00",
    features: [
      { id: "med-f1-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f1-2", content: "تغطية الأسنان حتى 3,000 ريال", price: 280, included: false },
      { id: "med-f1-3", content: "تغطية النظارات حتى 500 ريال", price: 120, included: false },
      { id: "med-f1-4", content: "تغطية الأمومة والولادة", price: 640, included: false },
      { id: "med-f1-5", content: "شبكة مستشفيات واسعة (أكثر من 500 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e1-1", reason: "ضريبة القيمة المضافة (15%)", price: 510.0 },
    ],
  },
  {
    id: "med-002",
    companyName: "تكافل الراجحي",
    companyLogo: "/images/a1/c1.svg",
    type: "medical",
    planName: "الفئة الفضية",
    category: "فضية",
    mainPrice: "2944.00",
    features: [
      { id: "med-f2-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f2-2", content: "تغطية الأسنان حتى 2,500 ريال", price: 240, included: false },
      { id: "med-f2-3", content: "تغطية النظارات حتى 400 ريال", price: 96, included: false },
      { id: "med-f2-4", content: "تغطية الأمومة والولادة", price: 600, included: false },
      { id: "med-f2-5", content: "شبكة مستشفيات (أكثر من 400 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e2-1", reason: "ضريبة القيمة المضافة (15%)", price: 441.6 },
    ],
  },
  {
    id: "med-003",
    companyName: "ميدغلف",
    companyLogo: "/images/a1/c6.svg",
    type: "medical",
    planName: "الفئة البرونزية",
    category: "برونزية",
    mainPrice: "2360.00",
    features: [
      { id: "med-f3-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f3-2", content: "تغطية الأسنان حتى 2,000 ريال", price: 200, included: false },
      { id: "med-f3-3", content: "تغطية الأمومة والولادة", price: 480, included: false },
      { id: "med-f3-4", content: "شبكة مستشفيات (أكثر من 350 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e3-1", reason: "ضريبة القيمة المضافة (15%)", price: 354.0 },
    ],
  },
  {
    id: "med-004",
    companyName: "بروج",
    companyLogo: "/images/a1/c20.png",
    type: "medical",
    planName: "الفئة الذهبية",
    category: "ذهبية",
    mainPrice: "3280.00",
    features: [
      { id: "med-f4-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f4-2", content: "تغطية الأسنان حتى 3,500 ريال", price: 320, included: false },
      { id: "med-f4-3", content: "تغطية النظارات حتى 600 ريال", price: 144, included: false },
      { id: "med-f4-4", content: "تغطية الأمومة والولادة", price: 680, included: false },
      { id: "med-f4-5", content: "شبكة مستشفيات واسعة (أكثر من 450 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e4-1", reason: "ضريبة القيمة المضافة (15%)", price: 492.0 },
    ],
  },
  {
    id: "med-005",
    companyName: "سلامة",
    companyLogo: "/images/a1/c5.svg",
    type: "medical",
    planName: "الفئة الفضية",
    category: "فضية",
    mainPrice: "2760.00",
    features: [
      { id: "med-f5-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f5-2", content: "تغطية الأسنان حتى 2,000 ريال", price: 224, included: false },
      { id: "med-f5-3", content: "تغطية الأمومة والولادة", price: 560, included: false },
      { id: "med-f5-4", content: "شبكة مستشفيات (أكثر من 380 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e5-1", reason: "ضريبة القيمة المضافة (15%)", price: 414.0 },
    ],
  },
  {
    id: "med-006",
    companyName: "ليفا للتأمين",
    companyLogo: "/images/a1/c21.png",
    type: "medical",
    planName: "الفئة البرونزية",
    category: "برونزية",
    mainPrice: "2224.00",
    features: [
      { id: "med-f6-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f6-2", content: "تغطية الأسنان حتى 1,500 ريال", price: 160, included: false },
      { id: "med-f6-3", content: "شبكة مستشفيات (أكثر من 300 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e6-1", reason: "ضريبة القيمة المضافة (15%)", price: 333.6 },
    ],
  },
  {
    id: "med-007",
    companyName: "جي آي جي",
    companyLogo: "/images/a1/c16.svg",
    type: "medical",
    planName: "الفئة الذهبية",
    category: "ذهبية",
    mainPrice: "3600.00",
    features: [
      { id: "med-f7-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f7-2", content: "تغطية الأسنان حتى 4,000 ريال", price: 360, included: false },
      { id: "med-f7-3", content: "تغطية النظارات حتى 700 ريال", price: 160, included: false },
      { id: "med-f7-4", content: "تغطية الأمومة والولادة", price: 720, included: false },
      { id: "med-f7-5", content: "شبكة مستشفيات واسعة (أكثر من 550 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e7-1", reason: "ضريبة القيمة المضافة (15%)", price: 540.0 },
    ],
  },
  {
    id: "med-008",
    companyName: "أمانة",
    companyLogo: "/images/a1/c10.svg",
    type: "medical",
    planName: "الفئة الفضية",
    category: "فضية",
    mainPrice: "2560.00",
    features: [
      { id: "med-f8-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "med-f8-2", content: "تغطية الأسنان حتى 2,000 ريال", price: 208, included: false },
      { id: "med-f8-3", content: "تغطية الأمومة والولادة", price: 520, included: false },
      { id: "med-f8-4", content: "شبكة مستشفيات (أكثر من 320 مستشفى)", price: 0, included: true },
    ],
    expenses: [
      { id: "med-e8-1", reason: "ضريبة القيمة المضافة (15%)", price: 384.0 },
    ],
  },
];

// ==================== MALPRACTICE INSURANCE (أخطاء طبية) ====================
export const malpracticeOfferData: InsuranceOffer[] = [
  {
    id: "mal-001",
    companyName: "التعاونية",
    companyLogo: "/images/a1/c2.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "960.00",
    features: [
      { id: "mal-f1-1", content: "تغطية المسؤولية المهنية حتى 500,000 ريال", price: 0, included: true },
      { id: "mal-f1-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f1-3", content: "تغطية التعويضات المالية للمرضى", price: 160, included: false },
      { id: "mal-f1-4", content: "تغطية فقدان الدخل أثناء التحقيق", price: 280, included: false },
    ],
    expenses: [
      { id: "mal-e1-1", reason: "ضريبة القيمة المضافة (15%)", price: 144.0 },
    ],
  },
  {
    id: "mal-002",
    companyName: "تكافل الراجحي",
    companyLogo: "/images/a1/c1.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "784.00",
    features: [
      { id: "mal-f2-1", content: "تغطية المسؤولية المهنية حتى 400,000 ريال", price: 0, included: true },
      { id: "mal-f2-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f2-3", content: "تغطية التعويضات المالية للمرضى", price: 144, included: false },
    ],
    expenses: [
      { id: "mal-e2-1", reason: "ضريبة القيمة المضافة (15%)", price: 117.6 },
    ],
  },
  {
    id: "mal-003",
    companyName: "ميدغلف",
    companyLogo: "/images/a1/c6.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "680.00",
    features: [
      { id: "mal-f3-1", content: "تغطية المسؤولية المهنية حتى 350,000 ريال", price: 0, included: true },
      { id: "mal-f3-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f3-3", content: "تغطية فقدان الدخل أثناء التحقيق", price: 240, included: false },
    ],
    expenses: [
      { id: "mal-e3-1", reason: "ضريبة القيمة المضافة (15%)", price: 102.0 },
    ],
  },
  {
    id: "mal-004",
    companyName: "سلامة",
    companyLogo: "/images/a1/c5.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "840.00",
    features: [
      { id: "mal-f4-1", content: "تغطية المسؤولية المهنية حتى 450,000 ريال", price: 0, included: true },
      { id: "mal-f4-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f4-3", content: "تغطية التعويضات المالية للمرضى", price: 176, included: false },
      { id: "mal-f4-4", content: "تغطية فقدان الدخل أثناء التحقيق", price: 256, included: false },
    ],
    expenses: [
      { id: "mal-e4-1", reason: "ضريبة القيمة المضافة (15%)", price: 126.0 },
    ],
  },
  {
    id: "mal-005",
    companyName: "جي آي جي",
    companyLogo: "/images/a1/c16.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "1080.00",
    features: [
      { id: "mal-f5-1", content: "تغطية المسؤولية المهنية حتى 600,000 ريال", price: 0, included: true },
      { id: "mal-f5-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f5-3", content: "تغطية التعويضات المالية للمرضى", price: 200, included: false },
      { id: "mal-f5-4", content: "تغطية فقدان الدخل أثناء التحقيق", price: 320, included: false },
    ],
    expenses: [
      { id: "mal-e5-1", reason: "ضريبة القيمة المضافة (15%)", price: 162.0 },
    ],
  },
  {
    id: "mal-006",
    companyName: "بروج",
    companyLogo: "/images/a1/c20.png",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "736.00",
    features: [
      { id: "mal-f6-1", content: "تغطية المسؤولية المهنية حتى 400,000 ريال", price: 0, included: true },
      { id: "mal-f6-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f6-3", content: "تغطية التعويضات المالية للمرضى", price: 152, included: false },
    ],
    expenses: [
      { id: "mal-e6-1", reason: "ضريبة القيمة المضافة (15%)", price: 110.4 },
    ],
  },
  {
    id: "mal-007",
    companyName: "الاتحاد الخليجي",
    companyLogo: "/images/a1/c18.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "624.00",
    features: [
      { id: "mal-f7-1", content: "تغطية المسؤولية المهنية حتى 300,000 ريال", price: 0, included: true },
      { id: "mal-f7-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
    ],
    expenses: [
      { id: "mal-e7-1", reason: "ضريبة القيمة المضافة (15%)", price: 93.6 },
    ],
  },
  {
    id: "mal-008",
    companyName: "أمانة",
    companyLogo: "/images/a1/c10.svg",
    type: "malpractice",
    planName: "تأمين أخطاء طبية",
    mainPrice: "880.00",
    features: [
      { id: "mal-f8-1", content: "تغطية المسؤولية المهنية حتى 500,000 ريال", price: 0, included: true },
      { id: "mal-f8-2", content: "تغطية المصاريف القانونية", price: 0, included: true },
      { id: "mal-f8-3", content: "تغطية التعويضات المالية للمرضى", price: 168, included: false },
      { id: "mal-f8-4", content: "تغطية فقدان الدخل أثناء التحقيق", price: 264, included: false },
    ],
    expenses: [
      { id: "mal-e8-1", reason: "ضريبة القيمة المضافة (15%)", price: 132.0 },
    ],
  },
];

// ==================== TRAVEL INSURANCE (سفر) ====================
export const travelOfferData: InsuranceOffer[] = [
  {
    id: "trv-001",
    companyName: "التعاونية",
    companyLogo: "/images/a1/c2.svg",
    type: "travel",
    planName: "تأمين سفر شامل",
    mainPrice: "148.00",
    features: [
      { id: "trv-f1-1", content: "تغطية الطوارئ الطبية حتى 500,000 ريال", price: 0, included: true },
      { id: "trv-f1-2", content: "تغطية إلغاء الرحلة", price: 36, included: false },
      { id: "trv-f1-3", content: "تغطية فقدان الأمتعة حتى 5,000 ريال", price: 24, included: false },
      { id: "trv-f1-4", content: "تغطية تأخير الرحلة", price: 20, included: false },
      { id: "trv-f1-5", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e1-1", reason: "ضريبة القيمة المضافة (15%)", price: 22.2 },
    ],
  },
  {
    id: "trv-002",
    companyName: "تكافل الراجحي",
    companyLogo: "/images/a1/c1.svg",
    type: "travel",
    planName: "تأمين سفر أساسي",
    mainPrice: "96.00",
    features: [
      { id: "trv-f2-1", content: "تغطية الطوارئ الطبية حتى 300,000 ريال", price: 0, included: true },
      { id: "trv-f2-2", content: "تغطية إلغاء الرحلة", price: 28, included: false },
      { id: "trv-f2-3", content: "تغطية فقدان الأمتعة حتى 3,000 ريال", price: 20, included: false },
      { id: "trv-f2-4", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e2-1", reason: "ضريبة القيمة المضافة (15%)", price: 14.4 },
    ],
  },
  {
    id: "trv-003",
    companyName: "ميدغلف",
    companyLogo: "/images/a1/c6.svg",
    type: "travel",
    planName: "تأمين سفر شامل",
    mainPrice: "168.00",
    features: [
      { id: "trv-f3-1", content: "تغطية الطوارئ الطبية حتى 600,000 ريال", price: 0, included: true },
      { id: "trv-f3-2", content: "تغطية إلغاء الرحلة", price: 40, included: false },
      { id: "trv-f3-3", content: "تغطية فقدان الأمتعة حتى 6,000 ريال", price: 28, included: false },
      { id: "trv-f3-4", content: "تغطية تأخير الرحلة", price: 24, included: false },
      { id: "trv-f3-5", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
      { id: "trv-f3-6", content: "تغطية الإخلاء الطبي الطارئ", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e3-1", reason: "ضريبة القيمة المضافة (15%)", price: 25.2 },
    ],
  },
  {
    id: "trv-004",
    companyName: "سلامة",
    companyLogo: "/images/a1/c5.svg",
    type: "travel",
    planName: "تأمين سفر أساسي",
    mainPrice: "76.00",
    features: [
      { id: "trv-f4-1", content: "تغطية الطوارئ الطبية حتى 250,000 ريال", price: 0, included: true },
      { id: "trv-f4-2", content: "تغطية فقدان الأمتعة حتى 2,500 ريال", price: 16, included: false },
      { id: "trv-f4-3", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e4-1", reason: "ضريبة القيمة المضافة (15%)", price: 11.4 },
    ],
  },
  {
    id: "trv-005",
    companyName: "جي آي جي",
    companyLogo: "/images/a1/c16.svg",
    type: "travel",
    planName: "تأمين سفر بلاتيني",
    mainPrice: "224.00",
    features: [
      { id: "trv-f5-1", content: "تغطية الطوارئ الطبية حتى 1,000,000 ريال", price: 0, included: true },
      { id: "trv-f5-2", content: "تغطية إلغاء الرحلة", price: 48, included: false },
      { id: "trv-f5-3", content: "تغطية فقدان الأمتعة حتى 8,000 ريال", price: 32, included: false },
      { id: "trv-f5-4", content: "تغطية تأخير الرحلة", price: 28, included: false },
      { id: "trv-f5-5", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
      { id: "trv-f5-6", content: "تغطية الإخلاء الطبي الطارئ", price: 0, included: true },
      { id: "trv-f5-7", content: "تغطية المسؤولية الشخصية", price: 40, included: false },
    ],
    expenses: [
      { id: "trv-e5-1", reason: "ضريبة القيمة المضافة (15%)", price: 33.6 },
    ],
  },
  {
    id: "trv-006",
    companyName: "بروج",
    companyLogo: "/images/a1/c20.png",
    type: "travel",
    planName: "تأمين سفر شامل",
    mainPrice: "132.00",
    features: [
      { id: "trv-f6-1", content: "تغطية الطوارئ الطبية حتى 400,000 ريال", price: 0, included: true },
      { id: "trv-f6-2", content: "تغطية إلغاء الرحلة", price: 32, included: false },
      { id: "trv-f6-3", content: "تغطية فقدان الأمتعة حتى 4,000 ريال", price: 22.4, included: false },
      { id: "trv-f6-4", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e6-1", reason: "ضريبة القيمة المضافة (15%)", price: 19.8 },
    ],
  },
  {
    id: "trv-007",
    companyName: "الاتحاد الخليجي",
    companyLogo: "/images/a1/c18.svg",
    type: "travel",
    planName: "تأمين سفر أساسي",
    mainPrice: "68.00",
    features: [
      { id: "trv-f7-1", content: "تغطية الطوارئ الطبية حتى 200,000 ريال", price: 0, included: true },
      { id: "trv-f7-2", content: "تغطية فقدان الأمتعة حتى 2,000 ريال", price: 14.4, included: false },
      { id: "trv-f7-3", content: "المساعدة على الطريق في الخارج", price: 0, included: true },
    ],
    expenses: [
      { id: "trv-e7-1", reason: "ضريبة القيمة المضافة (15%)", price: 10.2 },
    ],
  },
];

// ==================== DOMESTIC WORKER INSURANCE (العمالة المنزلية) ====================
export const domesticOfferData: InsuranceOffer[] = [
  {
    id: "dom-001",
    companyName: "التعاونية",
    companyLogo: "/images/a1/c2.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة أ",
    mainPrice: "443.20",
    features: [
      { id: "dom-f1-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f1-2", content: "تغطية الأسنان حتى 1,500 ريال", price: 160, included: false },
      { id: "dom-f1-3", content: "تغطية النظارات حتى 300 ريال", price: 80, included: false },
      { id: "dom-f1-4", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e1-1", reason: "ضريبة القيمة المضافة (15%)", price: 66.48 },
    ],
  },
  {
    id: "dom-002",
    companyName: "تكافل الراجحي",
    companyLogo: "/images/a1/c1.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة ب",
    mainPrice: "336.00",
    features: [
      { id: "dom-f2-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f2-2", content: "تغطية الأسنان حتى 1,000 ريال", price: 120, included: false },
      { id: "dom-f2-3", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e2-1", reason: "ضريبة القيمة المضافة (15%)", price: 50.4 },
    ],
  },
  {
    id: "dom-003",
    companyName: "ميدغلف",
    companyLogo: "/images/a1/c6.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة أ",
    mainPrice: "408.00",
    features: [
      { id: "dom-f3-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f3-2", content: "تغطية الأسنان حتى 1,200 ريال", price: 144, included: false },
      { id: "dom-f3-3", content: "تغطية النظارات حتى 250 ريال", price: 64, included: false },
      { id: "dom-f3-4", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e3-1", reason: "ضريبة القيمة المضافة (15%)", price: 61.2 },
    ],
  },
  {
    id: "dom-004",
    companyName: "سلامة",
    companyLogo: "/images/a1/c5.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة ب",
    mainPrice: "304.00",
    features: [
      { id: "dom-f4-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f4-2", content: "تغطية الأسنان حتى 800 ريال", price: 96, included: false },
      { id: "dom-f4-3", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e4-1", reason: "ضريبة القيمة المضافة (15%)", price: 45.6 },
    ],
  },
  {
    id: "dom-005",
    companyName: "جي آي جي",
    companyLogo: "/images/a1/c16.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة أ+",
    mainPrice: "544.00",
    features: [
      { id: "dom-f5-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f5-2", content: "تغطية الأسنان حتى 2,000 ريال", price: 200, included: false },
      { id: "dom-f5-3", content: "تغطية النظارات حتى 400 ريال", price: 96, included: false },
      { id: "dom-f5-4", content: "تغطية الأمومة والولادة", price: 400, included: false },
      { id: "dom-f5-5", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e5-1", reason: "ضريبة القيمة المضافة (15%)", price: 81.6 },
    ],
  },
  {
    id: "dom-006",
    companyName: "بروج",
    companyLogo: "/images/a1/c20.png",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة ب",
    mainPrice: "292.00",
    features: [
      { id: "dom-f6-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f6-2", content: "تغطية الأسنان حتى 800 ريال", price: 104, included: false },
      { id: "dom-f6-3", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e6-1", reason: "ضريبة القيمة المضافة (15%)", price: 43.8 },
    ],
  },
  {
    id: "dom-007",
    companyName: "أمانة",
    companyLogo: "/images/a1/c10.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة أ",
    mainPrice: "392.00",
    features: [
      { id: "dom-f7-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f7-2", content: "تغطية الأسنان حتى 1,000 ريال", price: 128, included: false },
      { id: "dom-f7-3", content: "تغطية النظارات حتى 300 ريال", price: 72, included: false },
      { id: "dom-f7-4", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e7-1", reason: "ضريبة القيمة المضافة (15%)", price: 58.8 },
    ],
  },
  {
    id: "dom-008",
    companyName: "الاتحاد الخليجي",
    companyLogo: "/images/a1/c18.svg",
    type: "domestic",
    planName: "تأمين العمالة المنزلية - الفئة ب",
    mainPrice: "265.60",
    features: [
      { id: "dom-f8-1", content: "تغطية العلاج الداخلي والخارجي", price: 0, included: true },
      { id: "dom-f8-2", content: "تغطية الأسنان حتى 700 ريال", price: 88, included: false },
      { id: "dom-f8-3", content: "شبكة مستشفيات واسعة", price: 0, included: true },
    ],
    expenses: [
      { id: "dom-e8-1", reason: "ضريبة القيمة المضافة (15%)", price: 39.84 },
    ],
  },
];
