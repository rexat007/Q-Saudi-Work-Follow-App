import fs from 'fs';
import path from 'path';

export interface TranslationDef {
  en: string;
  ur: string;
  rationale: string;
}

// Complete vetted dictionary of 100 Category B + 50 Category C translations for Block 62
export const block62VettedTranslations: Record<string, TranslationDef> = {
  // === CATEGORY B: Trips Domain (44 entries) ===
  "trips.labels.txt_29b5f9": {
    en: "SITE_RECEIVER (Site Inspector & Receiver)",
    ur: "SITE_RECEIVER (سائٹ انسپکٹر اور وصول کنندہ)",
    rationale: "Cleaned role designation while preserving technical code."
  },
  "trips.labels.txt_2ae109": {
    en: "Central State Machine (Centralized Trip State Machine)",
    ur: "مرکزی ٹرپ اسٹیٹ مشین (Centralized Trip State Machine)",
    rationale: "Standardized state machine architectural title."
  },
  "trips.labels.txt_2e23b2": {
    en: "SCALE_OPERATOR (Origin Weighbridge Clerk)",
    ur: "SCALE_OPERATOR (ماخذ کا وزنی پل کلرک)",
    rationale: "Cleaned scale clerk role label."
  },
  "trips.labels.txt_2e7926": {
    en: "CANCELLED (Cancelled)",
    ur: "CANCELLED (منسوخ شدہ)",
    rationale: "Cleaned status tag with preserved CANCELLED code."
  },
  "trips.labels.txt_2f47a4": {
    en: "Tare + Gross",
    ur: "خالی + مجموعی وزن",
    rationale: "Standardized dual scale weight terms."
  },
  "trips.labels.txt_304e68": {
    en: "Approved Pricing",
    ur: "منظور شدہ قیمت",
    rationale: "Professional financial status."
  },
  "trips.labels.txt_333d61": {
    en: "Authorized carrier (Almajdouie), matching truck and driver, approved aggregate material, and active per-ton pricing.",
    ur: "مجاز کیریئر (المجدوعی)، مماثل ٹرک اور ڈرائیور، منظور شدہ مجموعی مواد، اور فی ٹن فعال قیمت۔",
    rationale: "Cleaned operational trip manifest description; preserved ton."
  },
  "trips.labels.txt_34781c": {
    en: "Strict Server-Side Calculation",
    ur: "سخت سرور سائیڈ حساب کتاب",
    rationale: "Professional technical validation term."
  },
  "trips.labels.txt_3740a7": {
    en: "Cancelled (CANCELLED)",
    ur: "منسوخ شدہ (CANCELLED)",
    rationale: "Preserved CANCELLED protected token."
  },
  "trips.labels.txt_3969ce": {
    en: "[Rule 1 & 5: Carrier Affiliation]",
    ur: "[اصول 1 اور 5: کیریئر کی وابستگی]",
    rationale: "Standardized governance rule header."
  },
  "trips.labels.txt_3ac325": {
    en: "Operational Lifecycle Stages, Governance Gates, Exception Branches, Returns, and Cancellations:",
    ur: "آپریشنل لائف سائیکل کے مراحل، گورننس گیٹس، استثنائی شاخیں، واپسی اور منسوخیاں:",
    rationale: "Comprehensive workflow description."
  },
  "trips.labels.txt_3cbe5a": {
    en: "Fully Received and Discharged",
    ur: "مکمل وصول شدہ اور ان لوڈ شدہ",
    rationale: "Professional trip completion state."
  },
  "trips.labels.txt_3da9ae": {
    en: "Origin Weighbridge Scale Weights (Origin Scale)",
    ur: "ماخذ کے وزنی پل کے پیمانے کے اوزان (Origin Scale)",
    rationale: "Standardized origin weighbridge terminology."
  },
  "trips.labels.txt_414461": {
    en: "Origin Weights (KG)",
    ur: "ماخذ کے اوزان (KG)",
    rationale: "Preserved KG unit token."
  },
  "trips.labels.txt_46a3cb": {
    en: "Immutable Audit Trail",
    ur: "ناقابل ترمیم آڈٹ ٹریل (Immutable Audit Trail)",
    rationale: "Preserved architectural audit term."
  },
  "trips.labels.txt_4d1719": {
    en: "Truck Bed Inspection",
    ur: "ٹرک کے بیڈ کا معائنہ",
    rationale: "Physical inspection term."
  },
  "trips.labels.txt_4fd2e9": {
    en: "Central Lifecycle Controller (State Machine)",
    ur: "مرکزی لائف سائیکل کنٹرولر (State Machine)",
    rationale: "Preserved State Machine technical term."
  },
  "trips.labels.txt_50e5d7": {
    en: "1. Identifiers and Operational Data",
    ur: "1. شناخت کنندگان اور آپریشنل ڈیٹا",
    rationale: "Section header."
  },
  "trips.labels.txt_54360d": {
    en: "Current Operator Role:",
    ur: "موجودہ آپریٹر کا کردار:",
    rationale: "Role label with colon."
  },
  "trips.labels.txt_584eb0": {
    en: "No audit log currently available for this trip.",
    ur: "اس ٹرپ کے لیے فی الحال کوئی آڈٹ لاگ دستیاب نہیں ہے۔",
    rationale: "Empty state message."
  },
  "trips.labels.txt_58f744": {
    en: "Click any test scenario below to verify that the State Machine strictly rejects any governance rule violations:",
    ur: "یہ تصدیق کرنے کے لیے نیچے دیے گئے کسی بھی امتحانی منظر نامے پر کلک کریں کہ اسٹیٹ مشین گورننس کے سخت اصولوں کی خلاف ورزی کو مسترد کرتی ہے:",
    rationale: "QA test guidance."
  },
  "trips.labels.txt_5980b8": {
    en: "Version:",
    ur: "ورژن:",
    rationale: "Version label."
  },
  "trips.labels.txt_599f05": {
    en: "Strict Server-Side Calculations (Server-Side)",
    ur: "سخت سرور سائیڈ حسابات (Server-Side)",
    rationale: "Preserved Server-Side technical identifier."
  },
  "trips.labels.txt_5d1540": {
    en: "Transition Reason or Note (Recorded in Event & Audit Log):",
    ur: "تبدیلی کی وجہ یا نوٹ (ایونٹ اور آڈٹ لاگ میں محفوظ کیا جائے گا):",
    rationale: "Form field label for state transition."
  },
  "trips.labels.txt_5eb20e": {
    en: "Compliant with all 6 rules",
    ur: "تمام 6 اصولوں کے مطابق",
    rationale: "Compliance verification message."
  },
  "trips.labels.txt_5ed1a7": {
    en: "Real-time 6-Rule Verification Status",
    ur: "ریئل ٹائم 6 اصولوں کی توثیق کی حیثیت",
    rationale: "Rule check header."
  },
  "trips.labels.txt_61ff0a": {
    en: "Receiving Gate",
    ur: "وصولی گیٹ",
    rationale: "Facility gate designation."
  },
  "trips.labels.txt_6615b4": {
    en: "Validation Rule Violation",
    ur: "توثیق کے اصول کی خلاف ورزی",
    rationale: "Security validation error."
  },
  "trips.labels.txt_7064be": {
    en: "Six Reference Database Rules",
    ur: "چھ حوالہ جاتی ڈیٹا بیس کے اصول",
    rationale: "Reference rules designation."
  },
  "trips.labels.txt_74ca11": {
    en: "Receiving Notes",
    ur: "وصولی کے نوٹس",
    rationale: "Operational notes field."
  },
  "trips.labels.txt_7517d4": {
    en: "DRIVER (Driver)",
    ur: "DRIVER (ڈرائیور)",
    rationale: "Cleaned DRIVER role tag."
  },
  "trips.labels.txt_762e97": {
    en: "Binladin Carrier, matching truck and driver, sand material, fixed lump-sum price of 1,400 SAR per single trip.",
    ur: "بن لادن کیریئر، مماثل ٹرک اور ڈرائیور، ریت کا مواد، فی ٹرپ 1,400 SAR کی مقررہ یکمشت قیمت۔",
    rationale: "Preserved SAR currency token."
  },
  "trips.labels.txt_7b64c0": {
    en: "null (Not Received)",
    ur: "null (وصول نہیں ہوا)",
    rationale: "Preserved null technical identifier."
  },
  "trips.labels.txt_934de7": {
    en: "Unloading Station (Unloading)",
    ur: "ان لوڈنگ اسٹیشن (Unloading)",
    rationale: "Preserved Unloading term."
  },
  "trips.labels.txt_99c9e5": {
    en: "Rule 6 ✗",
    ur: "اصول 6 ✗",
    rationale: "Standardized rule indicator."
  },
  "trips.labels.txt_99cda6": {
    en: "Rule 5 ✗",
    ur: "اصول 5 ✗",
    rationale: "Standardized rule indicator."
  },
  "trips.labels.txt_99d167": {
    en: "Rule 4 ✗",
    ur: "اصول 4 ✗",
    rationale: "Standardized rule indicator."
  },
  "trips.labels.txt_99d528": {
    en: "Rule 3 ✗",
    ur: "اصول 3 ✗",
    rationale: "Standardized rule indicator."
  },
  "trips.labels.txt_a636ce": {
    en: "Control Panel & Transition Hub",
    ur: "کنٹرول پینل اور ٹرانزیشن ہب",
    rationale: "Dashboard interface label."
  },
  "trips.labels.txt_ca71d3": {
    en: "Origin Net Weight (netWeight)",
    ur: "ماخذ کا خالص وزن (netWeight)",
    rationale: "Preserved netWeight technical identifier."
  },
  "trips.labels.txt_e1f245": {
    en: "Successful ✓",
    ur: "کامیاب ✓",
    rationale: "Success status check."
  },
  "trips.labels.txt_f4327d": {
    en: "DISPATCHER (Dispatcher)",
    ur: "DISPATCHER (ڈسپیچر)",
    rationale: "Cleaned DISPATCHER role tag."
  },
  "trips.labels.viewDetailsTrip": {
    en: "View Trip Details & State Snapshot",
    ur: "ٹرپ کی تفصیلات اور اسٹیٹ اسنیپ شاٹ دیکھیں",
    rationale: "Action button label."
  },
  "trips.messages.trips": {
    en: "Default demonstration trips restored successfully",
    ur: "ڈیفالٹ ڈیمو ٹرپس کامیابی سے بحال کر دیے گئے",
    rationale: "System notification message."
  },

  // === CATEGORY B: Loading Domain (34 entries) ===
  "loading.labels.driver": {
    en: "Driver:",
    ur: "ڈرائیور:",
    rationale: "Form field label with colon."
  },
  "loading.labels.material_2": {
    en: "Material:",
    ur: "مواد:",
    rationale: "Form field label with colon."
  },
  "loading.labels.truck": {
    en: "Truck:",
    ur: "ٹرک:",
    rationale: "Form field label with colon."
  },
  "loading.labels.trucks": {
    en: "Available Trucks for Selected Carrier",
    ur: "منتخب کیریئر کے لیے دستیاب ٹرک",
    rationale: "Selector dropdown header."
  },
  "loading.labels.txt_177f70": {
    en: "Origin Entry Scale Reading (Scale In) in Kilograms",
    ur: "ماخذ پر انٹری اسکیل ریڈنگ (Scale In) کلوگرام میں",
    rationale: "Preserved Scale In term."
  },
  "loading.labels.txt_17a514": {
    en: "Per Ton: 37.4 × 8.5 = 317.90 SAR",
    ur: "فی ٹن: 37.4 × 8.5 = 317.90 SAR",
    rationale: "Preserved SAR currency token."
  },
  "loading.labels.txt_1a9224": {
    en: ": Record SCALE_WEIGHT_CONFIRMED Event and Audit Log",
    ur: ": SCALE_WEIGHT_CONFIRMED ایونٹ اور آڈٹ لاگ کا اندراج",
    rationale: "Preserved SCALE_WEIGHT_CONFIRMED event token."
  },
  "loading.labels.txt_1f364f": {
    en: "49,800 KG (Net 35.6 TON)",
    ur: "49,800 KG (خالص 35.6 TON)",
    rationale: "Preserved KG and TON protected tokens."
  },
  "loading.labels.txt_258b75": {
    en: "Detailed Prompt Specification Verification Matrix:",
    ur: "تفصیلی پرامپٹ کی ضروریات کا توثیقی میٹرکس:",
    rationale: "Verification matrix title."
  },
  "loading.labels.txt_285ec5": {
    en: "Preview Screen Components (Preview Displays):",
    ur: "پیش منظر اسکرین کے اجزاء (Preview دکھاتا ہے):",
    rationale: "UI component title."
  },
  "loading.labels.txt_2dbe14": {
    en: "15,000 KG (Tractor & Trailer)",
    ur: "15,000 KG (ٹریکٹر اور ٹریلر)",
    rationale: "Preserved KG token."
  },
  "loading.labels.txt_2f5b25": {
    en: "Complete Workflow Stepper implemented with entity permissions and project isolation validation.",
    ur: "مکمل ورک فلو اسٹیپر نافذ کیا گیا بمعہ اداروں کے اختیارات اور پروجیکٹ تنہائی کی توثیق۔",
    rationale: "Architecture implementation status."
  },
  "loading.labels.txt_3400c3": {
    en: "Verification and Strict Prompt Compliance Report",
    ur: "توثیق اور سخت پرامپٹ تعمیل کی رپورٹ",
    rationale: "Compliance report title."
  },
  "loading.labels.txt_3668a3": {
    en: "42,000 KG (Net 28 TON)",
    ur: "42,000 KG (خالص 28 TON)",
    rationale: "Preserved KG and TON tokens."
  },
  "loading.labels.txt_4116bc": {
    en: "14,200 KG (Heavy Tipper)",
    ur: "14,200 KG (ہیوی ٹپر)",
    rationale: "Preserved KG token."
  },
  "loading.labels.txt_419290": {
    en: "8,200 KG (Light Trailer)",
    ur: "8,200 KG (ہلکی ٹریلر)",
    rationale: "Preserved KG token."
  },
  "loading.labels.txt_458dbb": {
    en: "Regulatory Warnings and Pre-dispatch Checks (Warnings):",
    ur: "ریگولیٹری انتباہات اور روانگی سے پہلے کی جانچ (Warnings):",
    rationale: "Pre-dispatch warning label."
  },
  "loading.labels.txt_49a8b5": {
    en: "Example PER_TRIP:",
    ur: "PER_TRIP کی مثال:",
    rationale: "Preserved PER_TRIP protected token."
  },
  "loading.labels.txt_4c9019": {
    en: "Master Data:",
    ur: "بنیادی ڈیٹا:",
    rationale: "Form section label with colon."
  },
  "loading.labels.txt_4d6846": {
    en: "45,600 KG (Net 37.4 TON)",
    ur: "45,600 KG (خالص 37.4 TON)",
    rationale: "Preserved KG and TON tokens."
  },
  "loading.labels.txt_545437": {
    en: "Authorized Transport Carriers",
    ur: "مجاز ٹرانسپورٹ کیریئرز",
    rationale: "Master list title."
  },
  "loading.labels.txt_6555e1": {
    en: "Approved Work Project",
    ur: "منظور شدہ ورک پروجیکٹ",
    rationale: "Project designation."
  },
  "loading.labels.txt_6765dc": {
    en: "Payload Net Weight (Net):",
    ur: "خالص بوجھ کا وزن (Net):",
    rationale: "Preserved Net tag."
  },
  "loading.labels.txt_67b2a1": {
    en: "Active and Contractually Documented",
    ur: "فعال اور معاہدے کے تحت دستاویز شدہ",
    rationale: "Contract validity term."
  },
  "loading.labels.txt_6d4e47": {
    en: "Direct Examples:",
    ur: "براہ راست مثالیں:",
    rationale: "Examples section header."
  },
  "loading.labels.txt_732b41": {
    en: "Direct Automated Software Suite Verification Results (Automated Suite):",
    ur: "براہ راست خودکار سافٹ ویئر سوٹ کی جانچ کے نتائج (Automated Suite):",
    rationale: "Test suite header."
  },
  "loading.labels.txt_7339fe": {
    en: "Programmatic verification and matching of all prompt specifications",
    ur: "پرامپٹ کے تمام تقاضوں کی پروگرامنگ کے ذریعے توثیق اور جانچ",
    rationale: "Audit description."
  },
  "loading.labels.txt_73aefc": {
    en: "Return to Interface",
    ur: "انٹرفیس پر واپس جائیں",
    rationale: "Navigation button."
  },
  "loading.labels.txt_74acad": {
    en: "Standard Gross Scale Weights:",
    ur: "معیاری مجموعی اوزان:",
    rationale: "Scale weights header."
  },
  "loading.labels.txt_754551": {
    en: "Valid Periodic Inspection",
    ur: "درست اور فعال میعادی معائنہ",
    rationale: "Vehicle compliance state."
  },
  "loading.labels.txt_78af8a": {
    en: "By Lump Sum: 120 SAR",
    ur: "یک مشت رقم: 120 SAR",
    rationale: "Preserved SAR currency token."
  },
  "loading.labels.txt_797eb0": {
    en: "Example PER_TON:",
    ur: "PER_TON کی مثال:",
    rationale: "Preserved TON and PER_TON tokens."
  },
  "loading.labels.txt_a2ced3": {
    en: "Net: 45,600 KG (Gross) - 8,200 KG (Tare) = 37,400 KG = 37.4 TON",
    ur: "خالص: 45,600 KG (Gross) - 8,200 KG (Tare) = 37,400 KG = 37.4 TON",
    rationale: "Preserved KG, TON, Gross, and Tare technical terms."
  },
  "loading.labels.viewDetailsTrip": {
    en: "View Trip Details",
    ur: "ٹرپ کی تفصیلات دیکھیں",
    rationale: "Action button label."
  },

  // === CATEGORY B: Unloading Domain (18 entries) ===
  "unloading.labels.txt_173722": {
    en: "Approved Pricing Rate",
    ur: "منظور شدہ نرخ نامہ",
    rationale: "Financial rate term."
  },
  "unloading.labels.txt_23937a": {
    en: "Compliance Verification Result",
    ur: "تعمیل کی توثیق کا نتیجہ",
    rationale: "Quality verification result."
  },
  "unloading.labels.txt_23ed64": {
    en: "All strict prompt rules programmatically verified",
    ur: "پرامپٹ کے تمام سخت اصول پروگرام کے ذریعے جانچے گئے",
    rationale: "Verification statement."
  },
  "unloading.labels.txt_34f055": {
    en: "Normal Match (-150 KG)",
    ur: "عام مماثلت (-150 KG)",
    rationale: "Preserved KG unit token."
  },
  "unloading.labels.txt_3aa019": {
    en: "Search Sequence: Primary",
    ur: "تلاش کا تسلسل: بنیادی",
    rationale: "Lookup sequence header."
  },
  "unloading.labels.txt_3af241": {
    en: "Pre-calculated at Origin",
    ur: "ماخذ پر پہلے سے حساب شدہ",
    rationale: "Weight status description."
  },
  "unloading.labels.txt_4db372": {
    en: "Within Permitted Tolerance",
    ur: "مجاز رواداری کی حد کے اندر",
    rationale: "Weight variance status."
  },
  "unloading.labels.txt_4f7379": {
    en: "Reporting Official:",
    ur: "رپورٹ کرنے والا افسر:",
    rationale: "Audit role label with colon."
  },
  "unloading.labels.txt_53c5e6": {
    en: ". Unloading station pathway activated below.",
    ur: "۔ ان لوڈنگ اسٹیشن کا راستہ نیچے چالو کر دیا گیا ہے۔",
    rationale: "System status message."
  },
  "unloading.labels.txt_576fc8": {
    en: "Unloading Station Entry",
    ur: "ان لوڈنگ اسٹیشن کا داخلہ",
    rationale: "Facility entry point."
  },
  "unloading.labels.txt_57f705": {
    en: "In compliance with requirement:",
    ur: "شرط کی تعمیل میں:",
    rationale: "Regulatory reference."
  },
  "unloading.labels.txt_5adc67": {
    en: "Approved Tolerance Threshold:",
    ur: "منظور شدہ رواداری کی حد:",
    rationale: "Tolerance setting label with colon."
  },
  "unloading.labels.txt_5bfe91": {
    en: "Outcome Rules:",
    ur: "نتائج کے اصول:",
    rationale: "Rule section label."
  },
  "unloading.labels.txt_67076e": {
    en: "✓ Exception administratively approved",
    ur: "✓ استثنا انتظامی طور پر منظور کر لیا گیا",
    rationale: "Exception approval confirmation."
  },
  "unloading.labels.txt_70c619": {
    en: "Major Deficit (-2,500 KG ➔ Exception)",
    ur: "بڑا خسارہ (-2,500 KG ➔ Exception)",
    rationale: "Preserved KG and Exception tokens."
  },
  "unloading.labels.txt_9a2a40": {
    en: "Strict Server-Side Formula:",
    ur: "سخت سرور سائیڈ فارمولا:",
    rationale: "Formula designation."
  },
  "unloading.labels.txt_e43d44": {
    en: "100% Successful",
    ur: "100% کامیاب",
    rationale: "Audit success percentage."
  },
  "unloading.labels.user": {
    en: "User ID:",
    ur: "صارف کی شناخت:",
    rationale: "User identity label with colon."
  },

  // === CATEGORY B: Weighbridge Domain (4 entries) ===
  "weighbridge.labels.material": {
    en: "Material:",
    ur: "مواد:",
    rationale: "Form label with colon."
  },
  "weighbridge.labels.txt_2837b3": {
    en: "Standalone Weight Engine",
    ur: "خود مختار وزن کا انجن (Standalone Weight Engine)",
    rationale: "Preserved architectural engine title."
  },
  "weighbridge.labels.txt_2fc5ef": {
    en: "Accept Origin Net Weight",
    ur: "ماخذ کا خالص وزن قبول کریں",
    rationale: "Weight acceptance command."
  },
  "weighbridge.labels.txt_3142f6": {
    en: "Programmatic Verification Report for Weight Engine Requirements (13 Automated Checks)",
    ur: "ویٹ انجن کے تقاضوں کی پروگرامنگ توثیقی رپورٹ (13 خودکار جانچ)",
    rationale: "Quality report header."
  },

  // === CATEGORY C: Trips Domain (24 entries) ===
  "trips.labels.txt_3da066": {
    en: "Scenario 3: Unauthorized Carrier",
    ur: "منظر نامہ 3: غیر مجاز کیریئر",
    rationale: "Converted Arabic fallback to standardized QA scenario title."
  },
  "trips.labels.txt_40f0a8": {
    en: "varianceWeight calculated successfully",
    ur: "varianceWeight کا کامیابی سے حساب لگایا گیا",
    rationale: "Preserved varianceWeight technical identifier."
  },
  "trips.labels.txt_411e2d": {
    en: "[Rule 4: Authorized for Project]",
    ur: "[اصول 4: پروجیکٹ کے لیے مجاز]",
    rationale: "Standardized governance rule header."
  },
  "trips.labels.txt_41dcd5": {
    en: 'Simulating untrusted netWeight payload from client to test regulatory protection: "Do not accept netWeight from client"',
    ur: 'ریگولیٹری تحفظ کی جانچ کے لیے کلائنٹ سے غیر معتبر netWeight بھیجنے کی جانچ: "کلائنٹ سے netWeight قبول نہ کریں"',
    rationale: "Preserved netWeight and client technical identifiers."
  },
  "trips.labels.txt_429ecc": {
    en: "In-Transit (In-Transit)",
    ur: "راستے میں (In-Transit)",
    rationale: "Preserved In-Transit status tag."
  },
  "trips.labels.txt_45a060": {
    en: "Return Requested (RETURN_REQUESTED)",
    ur: "واپسی کی درخواست (RETURN_REQUESTED)",
    rationale: "Preserved RETURN_REQUESTED technical state code."
  },
  "trips.labels.txt_499473": {
    en: "In Transit (IN_TRANSIT)",
    ur: "راستے میں (IN_TRANSIT)",
    rationale: "Preserved IN_TRANSIT protected token."
  },
  "trips.labels.txt_4c39d7": {
    en: "Change Documentation, Differential Comparison (Diff), and Optimistic Versioning Tracking:",
    ur: "تبدیلیوں کی دستاویزات، تفریقی موازنہ (Diff)، اور آپٹیمسٹک ورژننگ ٹریکنگ:",
    rationale: "Preserved Diff and Optimistic Versioning technical concepts."
  },
  "trips.labels.txt_4cc4c6": {
    en: "PRJ-REDSEA-002 (Red Sea Project - For Conflict Testing ✗)",
    ur: "PRJ-REDSEA-002 (بحیرہ احمر پروجیکٹ - تنازع کی جانچ کے لیے ✗)",
    rationale: "Preserved project code."
  },
  "trips.labels.txt_4e4194": {
    en: "EXCEPTION (Exception / Breakdown)",
    ur: "EXCEPTION (استثنا / خرابی)",
    rationale: "Preserved EXCEPTION technical state code."
  },
  "trips.labels.txt_4fb822": {
    en: "Registered Exception (EXCEPTION)",
    ur: "درج شدہ استثنا (EXCEPTION)",
    rationale: "Preserved EXCEPTION technical code."
  },
  "trips.labels.txt_566fcf": {
    en: "Destination Net Weight (destNetWeight)",
    ur: "منزل کا خالص وزن (destNetWeight)",
    rationale: "Preserved destNetWeight technical identifier."
  },
  "trips.labels.txt_5bcf4e": {
    en: "Practical Test Scenario Matrix for Architectural Rules",
    ur: "آرکیٹیکچرل اصولوں کے لیے عملی ٹیسٹ منظر ناموں کا میٹرکس",
    rationale: "QA matrix title."
  },
  "trips.labels.txt_625185": {
    en: "Documented Variances (Field-level Diff):",
    ur: "دستاویز شدہ اختلافات (Field-level Diff):",
    rationale: "Preserved Field-level Diff technical identifier."
  },
  "trips.labels.txt_66dfa3": {
    en: "Return Requested (RETURN_REQ)",
    ur: "واپسی کی درخواست (RETURN_REQ)",
    rationale: "Preserved RETURN_REQ state abbreviation."
  },
  "trips.labels.txt_68729b": {
    en: "10-State Lifecycle Topology Diagram",
    ur: "10 ریاستی لائف سائیکل کا خاکہ (Diagram)",
    rationale: "Architectural diagram label."
  },
  "trips.labels.txt_6ae7c3": {
    en: "Strict Server-Side Calculation (Server-Side)",
    ur: "سخت سرور سائیڈ حساب کتاب (Server-Side)",
    rationale: "Preserved Server-Side technical term."
  },
  "trips.labels.txt_6ff1cd": {
    en: "Scenario 4: Unauthorized Material",
    ur: "منظر نامہ 4: غیر مجاز مواد",
    rationale: "QA scenario title."
  },
  "trips.labels.txt_72e74a": {
    en: "All States (10 States)",
    ur: "تمام ریاستیں (10 ریاستیں)",
    rationale: "Lifecycle states filter label."
  },
  "trips.labels.txt_77937d": {
    en: "NEOM - Logistics Sector 4",
    ur: "نیوم - لاجسٹکس سیکٹر 4",
    rationale: "Location identifier."
  },
  "trips.labels.txt_7a972e": {
    en: "10-State Lifecycle Topology (10-State Lifecycle Topology)",
    ur: "10 ریاستی لائف سائیکل کا ہیکلی خاکہ (10-State Lifecycle Topology)",
    rationale: "Preserved architectural topology header."
  },
  "trips.labels.txt_7ccbe0": {
    en: "AUDITOR (Financial Auditor & Quality Inspector)",
    ur: "AUDITOR (مالیاتی آڈیٹر اور کوالٹی انسپکٹر)",
    rationale: "Preserved AUDITOR role code."
  },
  "trips.labels.txt_7f5953": {
    en: "null (Awaiting Receipt)",
    ur: "null (وصولی کا انتظار)",
    rationale: "Preserved null technical identifier."
  },
  "trips.labels.txt_f45a43": {
    en: "Actual Discharge Time (unloadTime)",
    ur: "ان لوڈنگ کا اصل وقت (unloadTime)",
    rationale: "Preserved unloadTime technical identifier."
  },

  // === CATEGORY C: Loading Domain (7 entries) ===
  "loading.labels.txt_56bb7e": {
    en: "Applied Mathematical Formula:",
    ur: "لاگو شدہ ریاضیاتی فارمولا:",
    rationale: "Calculation section header."
  },
  "loading.labels.txt_604b70": {
    en: "Standard Tare Weights (Weighbridge Simulation):",
    ur: "معیاری خالی اوزان (وزنی پل کی جانچ):",
    rationale: "Simulation tare weights label."
  },
  "loading.labels.txt_68840f": {
    en: "Operational Workflow Stepper (Workflow):",
    ur: "آپریشنل ورک فلو کے مراحل (Workflow):",
    rationale: "Preserved Workflow tag."
  },
  "loading.labels.txt_6e3072": {
    en: "Instantaneously Calculated Net Weight (Net Weight):",
    ur: "فوری طور پر حساب شدہ خالص وزن (Net Weight):",
    rationale: "Preserved Net Weight term."
  },
  "loading.labels.txt_72a483": {
    en: "Origin Exit Scale Reading after Loading Complete (Scale Out) in Kilograms",
    ur: "لوڈنگ مکمل ہونے کے بعد ماخذ کے اخراج کے اسکیل کی ریڈنگ (Scale Out) کلوگرام میں",
    rationale: "Preserved Scale Out term."
  },
  "loading.labels.txt_79f87c": {
    en: ": Record Scale Weight Documentation Event.",
    ur: ": وزنی پل پر اوزان کے اندراج کے ایونٹ کا ریکارڈ۔",
    rationale: "Event documentation description."
  },
  "loading.labels.txt_a9fcb1": {
    en: "120 SAR (Fixed Lump Sum per Trip)",
    ur: "120 SAR (فی ٹرپ مقررہ یکمشت رقم)",
    rationale: "Preserved SAR currency token."
  },

  // === CATEGORY C: Unloading Domain (8 entries) ===
  "unloading.labels.txt_48bcec": {
    en: "All server-side tests comply with standard architectural specifications.",
    ur: "تمام سرور سائیڈ ٹیسٹ معیاری تکنیکی تصریحات کے مطابق ہیں۔",
    rationale: "Validation test summary."
  },
  "unloading.labels.txt_540518": {
    en: "Quick Weight Examples for Testing:",
    ur: "جانچ کے لیے فوری اوزان کی مثالیں:",
    rationale: "QA test weights header."
  },
  "unloading.labels.txt_58bc1a": {
    en: "Strict Server-Side Variance Calculation",
    ur: "سخت سرور سائیڈ تفاوتی وزن کا حساب کتاب",
    rationale: "Weight engine calculation term."
  },
  "unloading.labels.txt_714754": {
    en: "2️⃣ Ticket ticketId (1 ➔ CONTINUE)",
    ur: "2️⃣ ٹکٹ ticketId (1 ➔ CONTINUE)",
    rationale: "Preserved ticketId and CONTINUE tokens."
  },
  "unloading.labels.txt_753b7a": {
    en: "Start Unloading (ARRIVED ➔ UNLOADING)",
    ur: "ان لوڈنگ شروع کریں (ARRIVED ➔ UNLOADING)",
    rationale: "Preserved ARRIVED and UNLOADING tokens."
  },
  "unloading.labels.txt_7dbd48": {
    en: "Official Exceptions Log (Created Official Exception Entity)",
    ur: "سرکاری استثنیات کا لاگ (Created Official Exception Entity)",
    rationale: "Preserved Created Official Exception Entity term."
  },
  "unloading.labels.txt_ab913c": {
    en: "1️⃣ Primary tripSerial (1 ➔ CONTINUE)",
    ur: "1️⃣ بنیادی tripSerial (1 ➔ CONTINUE)",
    rationale: "Preserved tripSerial and CONTINUE tokens."
  },
  "unloading.labels.txt_e24ccf": {
    en: "5️⃣ Not Found (0 ➔ NOT_FOUND)",
    ur: "5️⃣ نہیں ملا (0 ➔ NOT_FOUND)",
    rationale: "Preserved NOT_FOUND token."
  },

  // === CATEGORY C: Weighbridge Domain (11 entries) ===
  "weighbridge.labels.txt_446bca": {
    en: "Variance calculation requiring net > 0 and received > 0",
    ur: "تفاوتی حساب جس کے لیے net > 0 اور received > 0 ہونا لازمی ہے",
    rationale: "Preserved mathematical condition."
  },
  "weighbridge.labels.txt_47e373": {
    en: "Financial Calculation Formula:",
    ur: "مالیاتی حساب کا فارمولا:",
    rationale: "Formula header with colon."
  },
  "weighbridge.labels.txt_4851db": {
    en: "Missing net (➔ strict null without substituting 0)",
    ur: "خالص وزن غائب ہے (➔ بغیر 0 کے بدلے قطعی طور پر null)",
    rationale: "Preserved net and null technical concepts."
  },
  "weighbridge.labels.txt_53ce46": {
    en: "Tolerance Rules (Tolerance Rules)",
    ur: "رواداری کے اصول (Tolerance Rules)",
    rationale: "Preserved Tolerance Rules architectural term."
  },
  "weighbridge.labels.txt_574ba6": {
    en: "Valid Weighbridge Ticket Sample (4 Rows)",
    ur: "درست وزنی پل کے ٹکٹوں کا نمونہ (4 قطاریں)",
    rationale: "QA ticket sample title."
  },
  "weighbridge.labels.txt_57ac4b": {
    en: "Directly Test the Three Output Conditions:",
    ur: "تینوں نتائج کے حالات کا براہ راست ٹیسٹ کریں:",
    rationale: "QA test instruction."
  },
  "weighbridge.labels.txt_5ace0a": {
    en: "Processing Unified Pathway (10 Stages)...",
    ur: "متحدہ پاتھ وے کی پروسیسنگ جاری ہے (10 مراحل)...",
    rationale: "Processing notification."
  },
  "weighbridge.labels.txt_614e8f": {
    en: "Requires explicit acknowledgement without blocking",
    ur: "بغیر روکے واضح اقرار نامہ درکار ہے",
    rationale: "Operational tolerance rule."
  },
  "weighbridge.labels.txt_63b3fb": {
    en: "Sample containing weighbridge violations and scale errors",
    ur: "نمونہ جس میں وزنی پل کی خلاف ورزیاں اور اسکیل کی غلطیاں شامل ہیں",
    rationale: "QA error sample title."
  },
  "weighbridge.labels.txt_69b595": {
    en: "Final Amount Due:",
    ur: "حتمی واجب الادا رقم:",
    rationale: "Settlement amount label."
  },
  "weighbridge.labels.txt_69dab8": {
    en: "Valid (44,700 - 14,200)",
    ur: "درست (44,700 - 14,200)",
    rationale: "Weight subtraction formula validation."
  }
};

export function executeBlock62() {
  console.log('Starting BLOCK 62 execution...');

  const selB = JSON.parse(fs.readFileSync('reports/block62-selected-b.json', 'utf8'));
  const selC = JSON.parse(fs.readFileSync('reports/block62-selected-c.json', 'utf8'));

  const selectedEntries = [...selB, ...selC];
  console.log(`Loaded ${selB.length} Category B and ${selC.length} Category C entries (total: ${selectedEntries.length}).`);

  if (selectedEntries.length !== 150) {
    throw new Error(`Expected exactly 150 entries, found ${selectedEntries.length}`);
  }

  const enPath = path.resolve(process.cwd(), 'src/locales/en/index.ts');
  const urPath = path.resolve(process.cwd(), 'src/locales/ur/index.ts');

  let enContent = fs.readFileSync(enPath, 'utf8');
  let urContent = fs.readFileSync(urPath, 'utf8');

  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
  const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
  const protectedTokens = [
    'SAR', 'KG', 'TON', 'CSV', 'Excel', 'PWA', 'JSON', 'RBAC', 'API',
    'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'PENDING', 'LOADED', 'ACTIVE',
    'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
    'operationId', 'pricingType', 'settlementBase', 'sourceType',
    'PER_TRIP', 'PER_TON'
  ];

  let enReplaced = 0;
  let urReplaced = 0;

  const repairedEntriesForReport: any[] = [];

  for (let idx = 0; idx < selectedEntries.length; idx++) {
    const entry = selectedEntries[idx];
    const vetted = block62VettedTranslations[entry.key];
    if (!vetted) {
      throw new Error(`Missing vetted translation for key: ${entry.key}`);
    }

    const newEn = vetted.en;
    const newUr = vetted.ur;

    // Quality gate: EN contains 0 Arabic
    if (arabicRegex.test(newEn)) {
      throw new Error(`Arabic character found in EN for key "${entry.key}": "${newEn}"`);
    }

    // Quality gate: zero hybrid morphology
    if (hybridSuffixRegex.test(newEn)) {
      throw new Error(`Hybrid morphology found in EN for key "${entry.key}": "${newEn}"`);
    }
    if (hybridSuffixRegex.test(newUr)) {
      throw new Error(`Hybrid morphology found in UR for key "${entry.key}": "${newUr}"`);
    }

    // Quality gate: non-empty
    if (!newEn.trim() || !newUr.trim()) {
      throw new Error(`Empty translation for key "${entry.key}"`);
    }

    // Quality gate: interpolation parity
    const arParams = (entry.ar.match(paramRegex) || []).sort();
    const enParams = (newEn.match(paramRegex) || []).sort();
    const urParams = (newUr.match(paramRegex) || []).sort();

    if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
      throw new Error(`Interpolation mismatch in EN for key "${entry.key}": AR=${arParams}, EN=${enParams}`);
    }
    if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
      throw new Error(`Interpolation mismatch in UR for key "${entry.key}": AR=${arParams}, UR=${urParams}`);
    }

    // Quality gate: protected tokens
    for (const token of protectedTokens) {
      if (entry.ar.includes(token)) {
        if (!newEn.includes(token)) {
          throw new Error(`Protected token "${token}" missing in EN for key "${entry.key}"`);
        }
        if (!newUr.includes(token)) {
          throw new Error(`Protected token "${token}" missing in UR for key "${entry.key}"`);
        }
      }
    }

    // Replace in EN
    const escapedKey = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const enMatches = [...enContent.matchAll(enKeyRegex)];
    if (enMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in EN index.ts`);
    }
    const safeNewEn = newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    enContent = enContent.replace(enKeyRegex, `$1'${safeNewEn}'$4`);
    enReplaced += enMatches.length;

    // Replace in UR
    const urKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const urMatches = [...urContent.matchAll(urKeyRegex)];
    if (urMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in UR index.ts`);
    }
    const safeNewUr = newUr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    urContent = urContent.replace(urKeyRegex, `$1'${safeNewUr}'$4`);
    urReplaced += urMatches.length;

    repairedEntriesForReport.push({
      index: idx + 1,
      key: entry.key,
      priority: entry.priority,
      domain: entry.domain,
      category: entry.category,
      problemType: entry.problemType,
      reviewStatus: 'REVIEW_REQUIRED',
      ar: entry.ar,
      oldEn: entry.currentEn,
      newEn,
      oldUr: entry.currentUr,
      newUr,
      rationale: vetted.rationale
    });
  }

  console.log(`Replaced ${enReplaced} keys in EN, ${urReplaced} keys in UR.`);
  if (enReplaced !== 150 || urReplaced !== 150) {
    throw new Error(`Expected exactly 150 replacements in each locale! EN: ${enReplaced}, UR: ${urReplaced}`);
  }

  // Write files
  fs.writeFileSync(enPath, enContent, 'utf8');
  fs.writeFileSync(urPath, urContent, 'utf8');
  console.log('Saved updated src/locales/en/index.ts and src/locales/ur/index.ts');

  // Baseline metrics
  const bBefore = 452;
  const cBefore = 200;
  const bRepaired = 100;
  const cRepaired = 50;
  const bRemaining = bBefore - bRepaired;
  const cRemaining = cBefore - cRepaired;

  const skippedEntries = [
    {
      key: 'navigation.labels.trips',
      category: 'B',
      priority: 'P1',
      reason: 'Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01) as required detection fixture'
    },
    {
      key: 'navigation.labels.import',
      category: 'B',
      priority: 'P1',
      reason: 'Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01/02) as required detection fixture'
    },
    {
      key: 'trips.labels.status_6',
      category: 'B',
      priority: 'P1',
      reason: "Embedded Arabic in interpolation parameter expression (\${rule.allowedFrom.join(', ') || 'لا يوجد'}) violates zero-Arabic EN requirement"
    }
  ];

  const plan = JSON.parse(fs.readFileSync('reports/i18n-block60-quality-plan.json', 'utf8'));
  const remainingHrKeys = plan.humanReviewQueue;

  // Domain breakdown
  const domainDist: Record<string, { b: number; c: number; total: number }> = {};
  for (const e of repairedEntriesForReport) {
    if (!domainDist[e.domain]) {
      domainDist[e.domain] = { b: 0, c: 0, total: 0 };
    }
    if (e.category === 'B') domainDist[e.domain].b++;
    if (e.category === 'C') domainDist[e.domain].c++;
    domainDist[e.domain].total++;
  }

  // Generate JSON report
  const reportJson = {
    metadata: {
      block: 'BLOCK-62',
      title: 'P1/P2 Professional Translation Expansion',
      timestamp: new Date().toISOString(),
      status: 'COMPLETE',
      targetQuota: {
        total: 150,
        categoryB: 100,
        categoryC: 50
      },
      executionMetrics: {
        categoryBBefore: bBefore,
        categoryCBefore: cBefore,
        categoryBRepaired: bRepaired,
        categoryCRepaired: cRepaired,
        categoryBRemaining: bRemaining,
        categoryCRemaining: cRemaining,
        categoryDRemaining: 0,
        totalAuthoritativeRemaining: bRemaining + cRemaining,
        remainingHumanReviewCount: remainingHrKeys.length
      }
    },
    domainDistribution: domainDist,
    skippedEntries,
    repairedEntries: repairedEntriesForReport
  };

  const jsonReportPath = path.resolve(process.cwd(), 'reports/i18n-block62-quality-expansion.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportJson, null, 2), 'utf8');
  console.log('Saved reports/i18n-block62-quality-expansion.json');

  // Generate Markdown report
  let md = `# BLOCK 62 — P1/P2 Professional Translation Expansion Report\n\n`;
  md += `**Execution Date:** ${reportJson.metadata.timestamp}\n`;
  md += `**Status:** COMPLETE ✅\n`;
  md += `**Target:** Exactly 150 translation defects repaired (100 Category B + 50 Category C)\n\n`;

  md += `## 1. Executive Summary & Defect Reductions\n\n`;
  md += `| Metric | Before Block 62 | Repaired in Block 62 | Remaining After Block 62 | Status |\n`;
  md += `|---|:---:|:---:|:---:|:---:|\n`;
  md += `| **Category B (Mixed Arabic in Target)** | ${bBefore} | **${bRepaired}** | **${bRemaining}** | Active Defect Reduction |\n`;
  md += `| **Category C (Untranslated Fallback)** | ${cBefore} | **${cRepaired}** | **${cRemaining}** | Active Defect Reduction |\n`;
  md += `| **Category D (Hybrid Morphology)** | 0 | **0** | **0** | **100% Eliminated in Block 57** |\n`;
  md += `| **Human Review Entries (Untouched)** | 33 | **0** | **33** | Strict Governance Preservation |\n`;
  md += `| **Total Authoritative Catalog** | 652 | **150** | **${bRemaining + cRemaining}** | Active Quality Pipeline |\n\n`;

  md += `## 2. Execution Discipline & Domain Distribution\n\n`;
  md += `| Domain | Category B Repaired | Category C Repaired | Total Repaired |\n`;
  md += `|---|:---:|:---:|:---:|\n`;
  Object.entries(domainDist).forEach(([dom, counts]) => {
    md += `| \`${dom}\` | ${counts.b} | ${counts.c} | **${counts.total}** |\n`;
  });
  md += `\n`;

  md += `## 3. Skipped Keys & Deterministic Justifications\n\n`;
  md += `| # | Key | Cat | Pri | Skip Reason |\n`;
  md += `|---|---|:---:|:---:|---|\n`;
  skippedEntries.forEach((s, i) => {
    md += `| ${i + 1} | \`${s.key}\` | ${s.category} | ${s.priority} | ${s.reason} |\n`;
  });
  md += `\n`;

  md += `## 4. Repaired Entries Audit Matrix (150 Keys)\n\n`;
  md += `| # | Key | Domain | Cat | Problem Type | Arabic Source (Unchanged) | Repaired English (newEn) | Repaired Urdu (newUr) | Review Status |\n`;
  md += `|---|---|---|:---:|---|---|---|---|:---:|\n`;
  repairedEntriesForReport.forEach((e, i) => {
    const cleanAr = e.ar.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    const cleanEn = e.newEn.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    const cleanUr = e.newUr.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    md += `| ${i + 1} | \`${e.key}\` | \`${e.domain}\` | **${e.category}** | ${e.problemType} | ${cleanAr} | ${cleanEn} | ${cleanUr} | \`${e.reviewStatus}\` |\n`;
  });
  md += `\n`;

  const mdReportPath = path.resolve(process.cwd(), 'reports/i18n-block62-quality-expansion.md');
  fs.writeFileSync(mdReportPath, md, 'utf8');
  console.log('Saved reports/i18n-block62-quality-expansion.md');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('execute-block62-translation')) {
  executeBlock62();
}
