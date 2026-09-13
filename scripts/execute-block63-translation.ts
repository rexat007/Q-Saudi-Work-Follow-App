import fs from "fs";
import path from "path";
import { arTranslations } from "../src/locales/ar/index";
import { enTranslations } from "../src/locales/en/index";
import { urTranslations } from "../src/locales/ur/index";

export interface RepairedEntry {
  key: string;
  domain: string;
  category: "B" | "C";
  priority: string;
  ar: string;
  oldEn: string;
  newEn: string;
  oldUr: string;
  newUr: string;
  reviewStatus: "REVIEW_REQUIRED";
  rationale: string;
}

export const block63Translations: Record<string, { en: string; ur: string; rationale: string }> = {
  // 1-100: Category B
  "projects.labels.add": {
    en: "At least one material must be added to the project",
    ur: "پروجیکٹ میں کم از کم ایک مٹیریل شامل کرنا ضروری ہے",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "projects.labels.pricing_2": {
    en: "${ruleLabel}: Pricing type must be per trip (PER_TRIP) or per ton (PER_TON)",
    ur: "${ruleLabel}: قیمت کے تعین کی قسم فی چکر (PER_TRIP) یا فی ٹن (PER_TON) ہونی چاہیے",
    rationale: "Preserved parameter and PER_TRIP/PER_TON protected tokens."
  },
  "projects.labels.project": {
    en: "PRJ - Project Logistics Documents and Archive",
    ur: "PRJ - پروجیکٹ لاجسٹکس دستاویزات اور آرکائیو",
    rationale: "Preserved PRJ technical code."
  },
  "projects.labels.txt_2bed60": {
    en: "Review and Creation",
    ur: "جائزہ اور تخلیق",
    rationale: "Eliminated mixed Arabic/English fragments."
  },
  "projects.labels.txt_38ae35": {
    en: "Reset Wizard",
    ur: "وزرڈ ری سیٹ کریں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "projects.labels.txt_3ba0be": {
    en: "Transport Companies",
    ur: "ٹرانسپورٹ کمپنیاں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "projects.labels.txt_3d1068": {
    en: "Google Integration",
    ur: "Google انٹیگریشن",
    rationale: "Preserved Google protected token."
  },
  "projects.labels.txt_4b1fb1": {
    en: "Test Temporal Conflict Check",
    ur: "وقتی تنازع کی جانچ کا ٹیسٹ",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "projects.labels.txt_6e8506": {
    en: "Access Permissions",
    ur: "رسائی کے اختیارات",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.edit_2": {
    en: "VERSION_CONFLICT Concurrent Modification",
    ur: "VERSION_CONFLICT ہم وقت ترمیم",
    rationale: "Preserved VERSION_CONFLICT protected token."
  },
  "offline.labels.editMaterial": {
    en: "MASTER_DATA_CHANGED Material Deactivated or Modified",
    ur: "MASTER_DATA_CHANGED مٹیریل معطل یا تبدیل ہو گیا",
    rationale: "Preserved MASTER_DATA_CHANGED protected token."
  },
  "offline.labels.filter": {
    en: "Filter:",
    ur: "فلٹر:",
    rationale: "Eliminated corrupt hybrid Arabic-English prefixes."
  },
  "offline.labels.save": {
    en: "Preserve Both Commands:",
    ur: "دونوں احکامات کا تحفظ:",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "offline.labels.save_2": {
    en: "The local command is frozen, the server state is saved, and a documented conflict record is generated in IndexedDB.",
    ur: "مقامی کمانڈ منجمد کر دی جاتی ہے، سرور کی حالت محفوظ کی جاتی ہے، اور IndexedDB میں ایک دستاویزی تنازع کا ریکارڈ جاری کیا جاتا ہے۔",
    rationale: "Preserved IndexedDB protected token."
  },
  "offline.labels.save_3": {
    en: "Automated verification suite to validate all mandatory rules and constraints: 7 conflict types, Anti-LWW, both commands preserved, user notification, Offline pricing stability, and explicit resolution.",
    ur: "تمام لازمی قواعد اور شرائط کی تصدیق کے لیے پروگرامنگ جانچ: 7 اقسام، Anti-LWW، دونوں احکامات کا تحفظ، صارف کو اطلاع، Offline قیمت کا استحکام، اور واضح حل۔",
    rationale: "Preserved Anti-LWW and Offline protected tokens."
  },
  "offline.labels.trip_2": {
    en: "Ticket is reserved for a previous trip",
    ur: "ٹکٹ پچھلی ٹرپ کے لیے پہلے سے مخصوص ہے",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "offline.labels.txt_10b6c4": {
    en: "All operations are synchronized with the server. You can click any button in the simulator above to test the conflict resolution engine and pricing snapshot protection.",
    ur: "تمام آپریشنز سرور کے ساتھ ہم آہنگ ہیں۔ آپ تنازعات کے حل کے نظام اور قیمتوں کے اسنیپ شاٹ کے تحفظ کی جانچ کے لیے اوپر والے سمیلیٹر میں کسی بھی بٹن پر کلک کر سکتے ہیں۔",
    rationale: "Accurate translation of offline operations and pricing snapshot."
  },
  "offline.labels.txt_140117": {
    en: "Local IndexedDB State, Outbox Queue, and Server Synchronization Steps",
    ur: "مقامی IndexedDB کی حالت، Outbox کی قطار، اور سرور مطابقت پذیری کے مراحل",
    rationale: "Preserved IndexedDB and Outbox protected tokens."
  },
  "offline.labels.txt_32233e": {
    en: "5. Duplicate Ticket",
    ur: "5. ڈپلیکیٹ ٹکٹ",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_3bb240": {
    en: "SENDING in progress",
    ur: "بھیجا جا رہا ہے (SENDING)",
    rationale: "Preserved SENDING protected token."
  },
  "offline.labels.txt_4043c4": {
    en: "Clean Up Synchronized Operations",
    ur: "مطابقت پذیر آپریشنز کو صاف کریں",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "offline.labels.txt_41cc14": {
    en: "Ready for Offline Use",
    ur: "آف لائن استعمال کے لیے تیار",
    rationale: "Preserved Offline protected token in EN."
  },
  "offline.labels.txt_46be08": {
    en: "Explicit Conflict Resolution",
    ur: "واضح تنازع کا حل",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_4e058d": {
    en: "2. Version Conflict",
    ur: "2. ورژن کا تنازع",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_532950": {
    en: "Simulating...",
    ur: "نقالی جاری ہے...",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_539bb6": {
    en: "Verifying presence of all Master Data (Project, Carrier, Truck, Driver, Material) in IndexedDB.",
    ur: "IndexedDB میں تمام Master Data (پروجیکٹ، کیریئر، ٹرک، ڈرائیور، مٹیریل) کی موجودگی کی تصدیق کی جا رہی ہے۔",
    rationale: "Preserved Master Data and IndexedDB protected tokens."
  },
  "offline.labels.txt_5542eb": {
    en: "Offline Management and Synchronization (Offline-First PWA)",
    ur: "آف لائن انتظام اور مطابقت پذیری (Offline-First PWA)",
    rationale: "Preserved Offline-First and PWA protected tokens."
  },
  "offline.labels.txt_5753f6": {
    en: "Operational trip data is not replaced automatically; supervisor explicit resolution is required.",
    ur: "ٹرپس کا آپریشنل ڈیٹا خودکار طور پر تبدیل نہیں ہوتا، بلکہ سپروائزر پر واضح حل کو لازمی قرار دیا گیا ہے۔",
    rationale: "Accurate translation of supervisor explicit resolution."
  },
  "offline.labels.txt_6464df": {
    en: "Record Count:",
    ur: "ریکارڈز کی تعداد:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_6526c5": {
    en: "Attempts:",
    ur: "کوششیں:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_66cc97": {
    en: "Mandatory Rule:",
    ur: "لازمی قاعدہ:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_712649": {
    en: "Automated Conflict Test Suite Verification",
    ur: "تنازعات کے لیے خودکار تصدیقی ٹیسٹ سوٹ (Automated Conflict Test Suite)",
    rationale: "Preserved Automated Conflict Test Suite protected token."
  },
  "offline.labels.txt_731fc0": {
    en: "SYNCED",
    ur: "مطابقت پذیر (SYNCED)",
    rationale: "Preserved SYNCED protected token."
  },
  "offline.labels.txt_7490af": {
    en: "Timestamp:",
    ur: "ٹائم اسٹیمپ:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_751d01": {
    en: "Conflict (CONFLICT)",
    ur: "تنازع (CONFLICT)",
    rationale: "Preserved CONFLICT protected token."
  },
  "offline.labels.txt_759c62": {
    en: "7. Master Data Change",
    ur: "7. بنیادی ڈیٹا کی تبدیلی",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_7eabcf": {
    en: "PENDING",
    ur: "زیر التواء (PENDING)",
    rationale: "Preserved PENDING protected token."
  },
  "offline.labels.txt_8b427e": {
    en: "Clear Confirmed",
    ur: "تصدیق شدہ کو صاف کریں",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "offline.labels.txt_a748f4": {
    en: "Retry Check (Retry)",
    ur: "دوبارہ جانچ کریں (Retry)",
    rationale: "Preserved Retry token."
  },
  "offline.labels.txt_a9b605": {
    en: "Audit Justification:",
    ur: "آڈٹ کا جواز:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.messages.txt_2165a5": {
    en: "Operation reset to pending status (PENDING). It will sync upon connection.",
    ur: "آپریشن کو زیر التواء حالت (PENDING) پر دوبارہ ترتیب دیا گیا ہے۔ کنکشن بحال ہونے پر مطابقت پذیری ہوگی۔",
    rationale: "Preserved PENDING protected token."
  },
  "offline.messages.txt_36ec7e": {
    en: "Cannot start synchronization: application is in offline mode (Offline).",
    ur: "مطابقت پذیری شروع نہیں ہو سکتی: ایپلیکیشن آف لائن موڈ (Offline) میں ہے۔",
    rationale: "Preserved Offline protected token."
  },
  "offline.status.failed_2": {
    en: "Check failed: passed ${testSuiteResult.passedTests} and failed ${testSuiteResult.failedTests}",
    ur: "جانچ ناکام: ${testSuiteResult.passedTests} کامیاب اور ${testSuiteResult.failedTests} ناکام ہوئے",
    rationale: "Preserved interpolation parameters."
  },
  "offline.status.pending_2": {
    en: "Pending Pricing Resolution Alert:",
    ur: "زیر التواء قیمت کے حل کا الرٹ (Pending Pricing Resolution):",
    rationale: "Preserved Pending Pricing Resolution domain term."
  },
  "offline.status.success": {
    en: "All conflict tests passed (${res.passedTests}/${res.totalTests}) successfully according to mandatory criteria.",
    ur: "تمام تنازعات کے ٹیسٹ (${res.passedTests}/${res.totalTests}) لازمی معیارات کے مطابق مکمل کامیابی سے پاس ہو گئے۔",
    rationale: "Preserved interpolation parameters."
  },
  "offline.status.txt_177559": {
    en: "FAILED",
    ur: "ناکام ہو گیا (FAILED)",
    rationale: "Preserved FAILED protected token."
  },
  "weighbridge.labels.txt_355854": {
    en: "Approve Source Net Weight as Arrival Net Weight:",
    ur: "ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر منظور کریں:",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_3b5d97": {
    en: "Strictly Prevents Approval",
    ur: "منظوری کو قطعی طور پر روکتا ہے",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_405131": {
    en: "Percentage Tolerance (%)",
    ur: "فیصد رواداری (%)",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_44da4c": {
    en: "An independent module exclusively responsible for weight computations, loading variances, tolerance evaluations (absolute / percentage / both) with status outputs (NORMAL / WARNING / EXCEPTION), and financial settlements calculation under strict validation rules.",
    ur: "ایک خود مختار ماڈیول جو خصوصی طور پر وزن کے حسابات، لوڈنگ کے فرق، رواداری کی جانچ (مطلق / فیصد / دونوں) مع اسٹیٹس آؤٹ پٹ (NORMAL / WARNING / EXCEPTION)، اور سخت تصدیقی قواعد کے تحت مالی تصفیوں کے حساب کا ذمہ دار ہے۔",
    rationale: "Preserved NORMAL, WARNING, EXCEPTION protected status tokens."
  },
  "weighbridge.labels.txt_46d801": {
    en: "Gross Weight (KG)",
    ur: "مجموعی وزن (KG)",
    rationale: "Preserved KG protected token."
  },
  "weighbridge.labels.txt_487f8f": {
    en: "tare = 0 (rejected)",
    ur: "tare = 0 (مسترد)",
    rationale: "Preserved tare technical formula token."
  },
  "weighbridge.labels.txt_4c9996": {
    en: "Approving and generating trips...",
    ur: "منظوری اور ٹرپس کی تیاری جاری ہے...",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_4dce1b": {
    en: "Permitted Tolerance Type",
    ur: "مجاز رواداری کی قسم",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_4ee2df": {
    en: "I acknowledge and approve rows containing warnings (such as shipments without discharge data).",
    ur: "میں انتباہات پر مشتمل قطاروں کی منظوری تسلیم اور منظور کرتا ہوں (جیسے کہ ان لوڈنگ ڈیٹا کے بغیر ترسیلات)۔",
    rationale: "Eliminated mixed Arabic and hybrid words."
  },
  "weighbridge.labels.txt_504ae8": {
    en: "0.00 KG",
    ur: "0.00 KG",
    rationale: "Preserved KG protected unit."
  },
  "weighbridge.labels.txt_518cd3": {
    en: "Server-Side Computational Engine",
    ur: "سرور سائیڈ کمپیوٹیشنل انجن",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_577d5a": {
    en: "Significant Shortage (-2500 KG)",
    ur: "بڑی کمی (-2500 KG)",
    rationale: "Preserved KG protected unit."
  },
  "weighbridge.labels.txt_579085": {
    en: "Absolute Tolerance (KG)",
    ur: "مطلق رواداری (KG)",
    rationale: "Preserved KG protected unit."
  },
  "weighbridge.labels.txt_58cd17": {
    en: "Audit Status",
    ur: "آڈٹ کی حالت",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_5b4968": {
    en: "Missing",
    ur: "غائب",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_5c97fe": {
    en: "percentage (percentage only)",
    ur: "percentage (صرف فیصد)",
    rationale: "Preserved percentage token."
  },
  "weighbridge.labels.txt_5e145b": {
    en: "Regulatory Approval Granted",
    ur: "نگرانی کی منظوری مل گئی",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_600341": {
    en: "Recorded Operational Source:",
    ur: "درج شدہ آپریشنل ماخذ:",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_609ec2": {
    en: "Verifying weight matching, calculating net weight, validating mandatory fields, and applying decision to accept source net weight as arrival net weight.",
    ur: "وزن کی مطابقت کی جانچ، خالص وزن کا حساب، لازمی فیلڈز کی تصدیق، اور ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر قبول کرنے کے فیصلے کا اطلاق۔",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_60b8a5": {
    en: "Output Test: NORMAL (-120 KG)",
    ur: "آؤٹ پٹ ٹیسٹ: NORMAL (-120 KG)",
    rationale: "Preserved NORMAL status and KG protected token."
  },
  "weighbridge.labels.txt_641620": {
    en: "Output:",
    ur: "آؤٹ پٹ (Output):",
    rationale: "Eliminated mixed Arabic in EN."
  },
  "weighbridge.labels.txt_65ecd8": {
    en: "Approved Net Weight",
    ur: "منظور شدہ خالص وزن",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_68c5e6": {
    en: "— (Not available)",
    ur: "— (دستیاب نہیں)",
    rationale: "Replaced Arabic fallback in EN."
  },
  "weighbridge.labels.txt_6e04d1": {
    en: "Calculated (gross-tare)",
    ur: "حساب شدہ (gross-tare)",
    rationale: "Preserved gross-tare formula token."
  },
  "weighbridge.labels.txt_6e06f6": {
    en: "37,400 KG (37.4 TON)",
    ur: "37,400 KG (37.4 TON)",
    rationale: "Preserved KG and TON protected tokens."
  },
  "weighbridge.labels.txt_70030c": {
    en: "Operational Source: WEIGHBRIDGE",
    ur: "آپریشنل ماخذ: WEIGHBRIDGE",
    rationale: "Preserved WEIGHBRIDGE protected token."
  },
  "weighbridge.labels.txt_709573": {
    en: "Variance to Check (variance)",
    ur: "جانچ کے لیے مطلوبہ فرق (variance)",
    rationale: "Preserved variance token."
  },
  "weighbridge.labels.txt_70b26a": {
    en: "Without Discharge (Warning)",
    ur: "ان لوڈنگ کے بغیر (انتباہ)",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_722bae": {
    en: "absolute (absolute only)",
    ur: "absolute (صرف مطلق)",
    rationale: "Preserved absolute token."
  },
  "weighbridge.labels.txt_72ad0e": {
    en: "Processing strictly halts at the review stage (REVIEW) and does not create trips or write to the database until explicit approval (COMMIT).",
    ur: "پروسیسنگ لازمی طور پر جائزہ کے مرحلے (REVIEW) پر رک جاتی ہے اور واضح منظوری (COMMIT) تک نہ تو ٹرپس تخلیق کرتی ہے اور نہ ہی ڈیٹا بیس میں درج کرتی ہے۔",
    rationale: "Preserved REVIEW and COMMIT protected tokens."
  },
  "weighbridge.labels.txt_78dd06": {
    en: "Recheck Now",
    ur: "ابھی دوبارہ جانچ کریں",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "weighbridge.labels.txt_a59113": {
    en: "Tare Weight (KG)",
    ur: "خالی گاڑی کا وزن (KG)",
    rationale: "Preserved KG protected token."
  },
  "weighbridge.labels.txt_aced6f": {
    en: "loadedNet = 0 (rejected)",
    ur: "loadedNet = 0 (مسترد)",
    rationale: "Preserved loadedNet technical variable."
  },
  "weighbridge.labels.weighbridge": {
    en: "Weighbridge Location or Cabin",
    ur: "وزن کے پل کا مقام یا کیبن",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.weighbridge_4": {
    en: "Weighbridge Batch in Review Stage (Review Stage - Human Gate)",
    ur: "وزن کے پل کی کھیپ جائزہ کے مرحلے میں (Review Stage - Human Gate)",
    rationale: "Preserved Review Stage - Human Gate architectural token."
  },
  "weighbridge.labels.weighbridge_6": {
    en: "Finalize Weighbridge Batch Approval (COMMIT)",
    ur: "وزن کے پل کی کھیپ کی حتمی منظوری (COMMIT)",
    rationale: "Preserved COMMIT protected token."
  },
  "weighbridge.messages.txt_5d74e2": {
    en: "Idempotency cache has been reset for testing.",
    ur: "جانچ کے لیے آئیڈیمپوٹینسی کیشے دوبارہ ترتیب دے دی گئی ہے۔",
    rationale: "Preserved idempotency cache domain concept."
  },
  "offline.labels.pricing": {
    en: "Pricing Rules",
    ur: "قیمت کے قواعد (Pricing Rules)",
    rationale: "Preserved Pricing Rules token."
  },
  "materials.labels.deleteMaterial": {
    en: "Delete Material",
    ur: "مٹیریل حذف کریں",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "materials.labels.status_2": {
    en: "Status",
    ur: "حالت (Status)",
    rationale: "Eliminated duplicated Status (Status)."
  },
  "navigation.labels.project_7": {
    en: "Project Log (Google Sheets)",
    ur: "پروجیکٹ لاگ (Google Sheets)",
    rationale: "Preserved Google Sheets protected token."
  },
  "other.labels.carrier_3": {
    en: "Deactivate Carrier (Set to INACTIVE)",
    ur: "کیریئر کو معطل کریں (INACTIVE میں تبدیل کریں)",
    rationale: "Preserved INACTIVE protected token."
  },
  "other.labels.carrier_4": {
    en: "Activate Carrier (Set to ACTIVE)",
    ur: "کیریئر کو فعال کریں (ACTIVE میں تبدیل کریں)",
    rationale: "Preserved ACTIVE protected token."
  },
  "other.labels.carrier_7": {
    en: "Associated Carrier (Driver → Carrier):",
    ur: "منسلک کیریئر (Driver → Carrier):",
    rationale: "Preserved Driver → Carrier hierarchy token."
  },
  "other.labels.carrierProject_2": {
    en: "Toggle Carrier Authorization for this Project",
    ur: "اس پروجیکٹ کے لیے کیریئر کی اجازت تبدیل کریں",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.carriers_4": {
    en: "Registered Carriers",
    ur: "رجسٹرڈ کیریئرز",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.createProject": {
    en: "Create main project document at /projects/{projectId}",
    ur: "/projects/{projectId} پر مرکزی پروجیکٹ دستاویز بنائیں",
    rationale: "Preserved {projectId} parameter."
  },
  "other.labels.delete": {
    en: "You are attempting to delete the record:",
    ur: "آپ ریکارڈ حذف کرنے کی کوشش کر رہے ہیں:",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.delete_2": {
    en: "Delete",
    ur: "حذف کریں",
    rationale: "Eliminated corrupt language cross-over."
  },
  "other.labels.delete_3": {
    en: "Deleted",
    ur: "حذف کر دیا گیا",
    rationale: "Accurate past participle in EN and UR."
  },
  "other.labels.delete_5": {
    en: "Hard delete is prohibited in system architecture. Use ACTIVE/INACTIVE instead of hard delete.",
    ur: "سسٹم آرکیٹیکچر میں قطعی حذف (Hard Delete) ممنوع ہے۔ hard delete کے بجائے ACTIVE/INACTIVE استعمال کریں۔",
    rationale: "Preserved ACTIVE/INACTIVE and Hard Delete architectural tokens."
  },
  "other.labels.delete_6": {
    en: "Deletion Prohibited",
    ur: "حذف کرنا ممنوع ہے",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.driver_2": {
    en: "Deactivate Driver (Set to INACTIVE)",
    ur: "ڈرائیور کو معطل کریں (INACTIVE میں تبدیل کریں)",
    rationale: "Preserved INACTIVE protected token."
  },
  "other.labels.driver_3": {
    en: "Activate Driver (Set to ACTIVE)",
    ur: "ڈرائیور کو فعال کریں (ACTIVE میں تبدیل کریں)",
    rationale: "Preserved ACTIVE protected token."
  },

  // 101-150: Category C
  "projects.labels.txt_2d2a83": {
    en: "Restore NEOM Demo Template",
    ur: "نیوم ڈیمو ٹیمپلیٹ بحال کریں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_31f297": {
    en: "Internet Disconnection Simulation:",
    ur: "انٹرنیٹ منقطع ہونے کی نقالی:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_3f37a7": {
    en: "Network Status: Connected to Internet (Online)",
    ur: "نیٹ ورک کی حالت: انٹرنیٹ سے منسلک (Online)",
    rationale: "Preserved Online token."
  },
  "offline.labels.txt_44754a": {
    en: "Prevent \"Last-Write-Wins\" (No LWW):",
    ur: "\"آخری تحریر کی جیت\" کی روک تھام (No LWW):",
    rationale: "Preserved No LWW architectural token."
  },
  "offline.labels.txt_47ad3c": {
    en: "Conflict Resolution (Conflicts)",
    ur: "تنازعات کا حل (Conflicts)",
    rationale: "Preserved Conflicts token."
  },
  "offline.labels.txt_519208": {
    en: "Local Storage IndexedDB (Master Data)",
    ur: "مقامی اسٹوریج IndexedDB (Master Data)",
    rationale: "Preserved IndexedDB and Master Data protected tokens."
  },
  "offline.labels.txt_55319d": {
    en: "Operational Conflict Simulator (Interactive Conflict Simulator)",
    ur: "آپریشنل تنازعات کا سمیلیٹر (Interactive Conflict Simulator)",
    rationale: "Preserved Interactive Conflict Simulator token."
  },
  "offline.labels.txt_5cde42": {
    en: "Financial calculations and net weights are computed locally and queued in Outbox with PENDING status until connectivity is restored.",
    ur: "مالی حسابات اور خالص وزن کا حساب مقامی طور پر لگایا جاتا ہے اور کنکشن بحال ہونے تک PENDING حالت کے ساتھ Outbox میں شامل کیا جاتا ہے۔",
    rationale: "Preserved Outbox and PENDING protected tokens."
  },
  "offline.labels.txt_5fc250": {
    en: "TRIP_ALREADY_RETURNED Rejected",
    ur: "TRIP_ALREADY_RETURNED مسترد",
    rationale: "Preserved TRIP_ALREADY_RETURNED protected token."
  },
  "offline.labels.txt_66c55e": {
    en: "Outbox Queue",
    ur: "آؤٹ باکس کی قطار (Outbox Queue)",
    rationale: "Preserved Outbox Queue token."
  },
  "offline.labels.txt_6aae4c": {
    en: "Effective Date of New Prices:",
    ur: "نئی قیمتوں کا نفاذ:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_6aaee2": {
    en: "Offline Pricing Protection:",
    ur: "آف لائن قیمتوں کا تحفظ (Offline):",
    rationale: "Preserved Offline protected token."
  },
  "offline.labels.txt_6fc0d8": {
    en: "Master Data Storage Record in IndexedDB",
    ur: "IndexedDB میں Master Data کے ذخیرے کا ریکارڈ",
    rationale: "Preserved Master Data and IndexedDB protected tokens."
  },
  "offline.labels.txt_74ecba": {
    en: "Network Status: Disconnected (Offline Mode)",
    ur: "نیٹ ورک کی حالت: منقطع (Offline Mode)",
    rationale: "Preserved Offline Mode protected token."
  },
  "offline.labels.txt_7eb4ca": {
    en: "TRUCK_CARRIER_CONFLICT Dependency",
    ur: "TRUCK_CARRIER_CONFLICT انحصار",
    rationale: "Preserved TRUCK_CARRIER_CONFLICT protected token."
  },
  "offline.labels.txt_9a78d6": {
    en: "Offline Operating Standards (Offline Rules):",
    ur: "آف لائن آپریشن کے معیارات (Offline Rules):",
    rationale: "Preserved Offline Rules protected token."
  },
  "offline.labels.txt_9b46da": {
    en: "No operations found in this category",
    ur: "اس زمرے میں کوئی آپریشنز موجود نہیں ہیں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.txt_6ff41d": {
    en: "gross < tare (rejected)",
    ur: "gross < tare (مسترد)",
    rationale: "Preserved gross < tare formula tokens."
  },
  "weighbridge.labels.txt_780026": {
    en: "Returned Result (netWeight):",
    ur: "واپس کردہ نتیجہ (netWeight):",
    rationale: "Preserved netWeight parameter."
  },
  "weighbridge.labels.txt_7a0944": {
    en: "net = 0 (rejected ➔ null)",
    ur: "net = 0 (مسترد ➔ null)",
    rationale: "Preserved formula and null tokens."
  },
  "weighbridge.labels.txt_7fffbf": {
    en: "4 Engine Functions (Functions Sandbox)",
    ur: "انجن کے 4 فنکشنز (Functions Sandbox)",
    rationale: "Preserved Functions Sandbox token."
  },
  "weighbridge.labels.txt_cd2e11": {
    en: "Supported tolerance types: absolute / percentage / both",
    ur: "رواداری کی معاون اقسام: absolute / percentage / both",
    rationale: "Preserved absolute, percentage protected tokens."
  },
  "weighbridge.labels.txt_d894c3": {
    en: "Percentage Tolerance (percentageTolerance)",
    ur: "فیصد رواداری (percentageTolerance)",
    rationale: "Preserved percentageTolerance parameter."
  },
  "weighbridge.labels.weighbridge_2": {
    en: "Additional Notes on Weighbridge Ticket",
    ur: "وزن کے پل کے ٹکٹ پر اضافی نوٹس",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "weighbridge.labels.weighbridge_3": {
    en: "Weighbridge File Content (CSV Text / Raw Input):",
    ur: "وزن کے پل کی فائل کا مواد (CSV Text / Raw Input):",
    rationale: "Preserved CSV Text / Raw Input token."
  },
  "weighbridge.labels.weighbridge_7": {
    en: "Weighbridge Review Table and Weights (Weighbridge Review Table)",
    ur: "وزن کے پل کے ٹکٹوں اور اوزان کا جائزہ ٹیبل (Weighbridge Review Table)",
    rationale: "Preserved Weighbridge Review Table token."
  },
  "trips.labels.txt_752683": {
    en: "Scenario 7: Weight Security Test - Reject client netWeight and compute on server",
    ur: "منظرنامہ 7: وزن کی حفاظت کا ٹیسٹ - کلائنٹ کے netWeight کو مسترد کرنا اور سرور پر حساب لگانا",
    rationale: "Preserved netWeight token."
  },
  "offline.labels.pricing_2": {
    en: "Local pricing rule is out of operational validity range (${pricingRule.effectiveFrom} to ${pricingRule.effectiveTo})",
    ur: "مقامی قیمت کا اصول آپریشنل میعاد کی حد سے باہر ہے (${pricingRule.effectiveFrom} تا ${pricingRule.effectiveTo})",
    rationale: "Preserved pricingRule parameters."
  },
  "other.labels.txt_24cc60": {
    en: "Structure of cloud folders and sheets to be automatically created:",
    ur: "کلاؤڈ فولڈرز اور شیٹس کا ڈھانچہ جو خودکار طور پر تیار کیا جائے گا:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_330dcc": {
    en: "📂 Google Drive Folders:",
    ur: "📂 Google Drive فولڈرز:",
    rationale: "Preserved Google Drive protected token."
  },
  "other.labels.txt_34897c": {
    en: "Deactivate Record (Set to INACTIVE)",
    ur: "ریکارڈ کو معطل کریں (INACTIVE میں تبدیل کریں)",
    rationale: "Preserved INACTIVE protected token."
  },
  "other.labels.txt_412551": {
    en: "Generate Automated Project Labels",
    ur: "پروجیکٹ کے لیے خودکار لیبلز تیار کریں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_4755d8": {
    en: "Available Regulatory Action:",
    ur: "دستیاب قانونی کارروائی:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_486bf8": {
    en: "Preview and Trial Mode (Preview Mode)",
    ur: "معائنہ اور آزمائشی موڈ (Preview Mode)",
    rationale: "Preserved Preview Mode token."
  },
  "other.labels.txt_558322": {
    en: "Enable Automated Provisioning for Google Drive and Sheets Workspace",
    ur: "Google Drive اور Sheets ورک اسپیس کی خودکار تیاری کو فعال کریں",
    rationale: "Preserved Google Drive and Sheets protected tokens."
  },
  "other.labels.txt_5860fa": {
    en: "Financial and operational workbook synchronized in real time with Firestore.",
    ur: "مالی اور آپریشنل ورک بک جو Firestore کے ساتھ فوری طور پر مطابقت پذیر ہوتی ہے۔",
    rationale: "Preserved Firestore protected token."
  },
  "other.labels.txt_63748e": {
    en: "You can change record status to",
    ur: "آپ ریکارڈ کی حالت تبدیل کر سکتے ہیں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_674f3e": {
    en: "Click \"Rerun Tests\" to run the test suite immediately.",
    ur: "ٹیسٹ سوٹ کو فوری طور پر چلانے کے لیے «ٹیسٹ دوبارہ چلائیں» کے بٹن پر کلک کریں۔",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_68f9e8": {
    en: "Commercial Registration (10 digits):",
    ur: "تجارتی رجسٹریشن (10 ہندسے):",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_71317d": {
    en: "Executing test scenarios in memory and Firestore repository...",
    ur: "میموری اور Firestore ریپوزٹری میں آزمائشی منظرنامے چلائے جا رہے ہیں...",
    rationale: "Preserved Firestore protected token."
  },
  "other.labels.txt_f4c520": {
    en: "Inactive Only (INACTIVE)",
    ur: "صرف غیر فعال (INACTIVE)",
    rationale: "Preserved INACTIVE protected token."
  },
  "other.labels.txt_f87929": {
    en: "This record has not been used in any previous trips",
    ur: "یہ ریکارڈ پچھلی کسی بھی ٹرپ میں استعمال نہیں ہوا ہے",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_f8afcf": {
    en: "Google Workspace Configuration Alerts:",
    ur: "Google Workspace کنفیگریشن الرٹس:",
    rationale: "Preserved Google Workspace protected token."
  },
  "other.messages.txt_197fc5": {
    en: "Running automated checks on Firestore requires logging in with a Google account first.",
    ur: "Firestore پر خودکار جانچ چلانے کے لیے پہلے Google اکاؤنٹ سے لاگ ان کرنا ضروری ہے۔",
    rationale: "Preserved Firestore and Google protected tokens."
  },
  "other.messages.txt_731859": {
    en: "Could not connect to live Firestore data; local preview mode activated.",
    ur: "براہ راست Firestore ڈیٹا سے رابطہ نہیں ہو سکا، مقامی پیش منظر موڈ فعال کر دیا گیا ہے۔",
    rationale: "Preserved Firestore protected token."
  },
  "projects.labels.txt_126e48": {
    en: "Allow Driver Self-Registration",
    ur: "ڈرائیوروں کے خود اندراج کی اجازت دیں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "projects.labels.txt_17e9e8": {
    en: "Owner Entity / Main Client (Client Name)",
    ur: "مالک ادارہ / بنیادی کلائنٹ (Client Name)",
    rationale: "Preserved Client Name token."
  },
  "projects.labels.txt_36fea4": {
    en: "Operating Currency (currency)",
    ur: "آپریشنل کرنسی (currency)",
    rationale: "Preserved currency token."
  },
  "projects.labels.txt_4a32a9": {
    en: "Traffic and Weighbridge Officer (DISPATCHER)",
    ur: "ٹریفک اور وی برج آفیسر (DISPATCHER)",
    rationale: "Preserved DISPATCHER protected token."
  },
  "projects.labels.txt_606611": {
    en: "Financial Auditor (FINANCE_AUDITOR)",
    ur: "مالیاتی آڈیٹر (FINANCE_AUDITOR)",
    rationale: "Preserved FINANCE_AUDITOR protected token."
  }
};

async function main() {
  console.log("Starting BLOCK 63 execution...");

  const selB = JSON.parse(fs.readFileSync("reports/block63-selected-b.json", "utf8"));
  const selC = JSON.parse(fs.readFileSync("reports/block63-selected-c.json", "utf8"));
  const selectedEntries = [...selB, ...selC];

  console.log(`Loaded ${selB.length} Category B and ${selC.length} Category C entries (total: ${selectedEntries.length}).`);

  if (selectedEntries.length !== 150) {
    throw new Error(`Expected exactly 150 entries, got ${selectedEntries.length}`);
  }

  const repairedEntries: RepairedEntry[] = [];

  for (const item of selectedEntries) {
    const key = item.key;
    const patch = block63Translations[key];
    if (!patch) {
      throw new Error(`Missing translation mapping for key "${key}"`);
    }

    const arVal = (arTranslations as Record<string, string>)[key];
    const oldEnVal = (enTranslations as Record<string, string>)[key];
    const oldUrVal = (urTranslations as Record<string, string>)[key];

    repairedEntries.push({
      key,
      domain: item.domain,
      category: item.category,
      priority: item.priority,
      ar: arVal,
      oldEn: oldEnVal,
      newEn: patch.en,
      oldUr: oldUrVal,
      newUr: patch.ur,
      reviewStatus: "REVIEW_REQUIRED",
      rationale: patch.rationale
    });
  }

  // Pre-flight checks on repaired entries:
  const arabicRegex = /[\u0600-\u06FF]/;
  for (const entry of repairedEntries) {
    // EN must have 0 Arabic chars
    if (arabicRegex.test(entry.newEn)) {
      throw new Error(`Accidental Arabic found in new EN for key "${entry.key}": "${entry.newEn}"`);
    }

    // UR must not match Arabic source (except known anomalies like other.labels.delete_2 where AR was seeded as Urdu)
    if (entry.key !== 'other.labels.delete_2' && entry.newUr === entry.ar) {
      throw new Error(`Urdu translation matches unmigrated Arabic fallback for key "${entry.key}"`);
    }

    // Check interpolation parameters
    const getParams = (str: string) => {
      const p1 = (str.match(/\$\{[^}]+\}/g) || []).sort();
      const p2 = (str.match(/\{[^}]+\}/g) || []).sort();
      return [...p1, ...p2];
    };

    const arParams = getParams(entry.ar);
    const enParams = getParams(entry.newEn);
    const urParams = getParams(entry.newUr);

    if (arParams.join(",") !== enParams.join(",") || arParams.join(",") !== urParams.join(",")) {
      throw new Error(`Interpolation mismatch for key "${entry.key}": AR=[${arParams}] EN=[${enParams}] UR=[${urParams}]`);
    }
  }

  console.log("All pre-flight quality assertions passed.");

  // Read current en/index.ts and ur/index.ts
  const enPath = path.resolve("src/locales/en/index.ts");
  const urPath = path.resolve("src/locales/ur/index.ts");

  let enContent = fs.readFileSync(enPath, "utf8");
  let urContent = fs.readFileSync(urPath, "utf8");

  let replacedEnCount = 0;
  let replacedUrCount = 0;

  for (const entry of repairedEntries) {
    // Replace key in EN
    const enPattern = new RegExp(`("${entry.key.replace(/\./g, '\\.')}"\\s*:\\s*)(?:'[^']*'|"[^"]*"|` + '`[^`]*`)', 'g');
    if (enPattern.test(enContent)) {
      enContent = enContent.replace(enPattern, `$1${JSON.stringify(entry.newEn)}`);
      replacedEnCount++;
    } else {
      throw new Error(`Failed to locate key in en/index.ts: "${entry.key}"`);
    }

    // Replace key in UR
    const urPattern = new RegExp(`("${entry.key.replace(/\./g, '\\.')}"\\s*:\\s*)(?:'[^']*'|"[^"]*"|` + '`[^`]*`)', 'g');
    if (urPattern.test(urContent)) {
      urContent = urContent.replace(urPattern, `$1${JSON.stringify(entry.newUr)}`);
      replacedUrCount++;
    } else {
      throw new Error(`Failed to locate key in ur/index.ts: "${entry.key}"`);
    }
  }

  console.log(`Replaced ${replacedEnCount} keys in EN, ${replacedUrCount} keys in UR.`);

  fs.writeFileSync(enPath, enContent, "utf8");
  fs.writeFileSync(urPath, urContent, "utf8");
  console.log("Saved updated src/locales/en/index.ts and src/locales/ur/index.ts");

  // Domain breakdown
  const domainDist = repairedEntries.reduce((acc: Record<string, { total: number; b: number; c: number }>, e) => {
    if (!acc[e.domain]) acc[e.domain] = { total: 0, b: 0, c: 0 };
    acc[e.domain].total++;
    if (e.category === "B") acc[e.domain].b++;
    if (e.category === "C") acc[e.domain].c++;
    return acc;
  }, {});

  const skippedKeys = [
    {
      key: "navigation.labels.trips",
      category: "B",
      priority: "P1",
      reason: "Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01) as required detection fixture"
    },
    {
      key: "navigation.labels.import",
      category: "B",
      priority: "P1",
      reason: "Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01/02) as required detection fixture"
    },
    {
      key: "trips.labels.status_6",
      category: "B",
      priority: "P1",
      reason: "Embedded Arabic literal in interpolation code expression; referred to technical governance"
    }
  ];

  const reportJson = {
    block: 63,
    title: "BLOCK 63 — Professional Translation Quality Expansion III",
    timestamp: new Date().toISOString(),
    status: "COMPLETE",
    counts: {
      totalRepaired: repairedEntries.length,
      categoryBRepaired: repairedEntries.filter(e => e.category === "B").length,
      categoryCRepaired: repairedEntries.filter(e => e.category === "C").length,
      categoryBRemaining: 352 - 100,
      categoryCRemaining: 150 - 50,
      categoryDRemaining: 0,
      humanReviewTotal: 33
    },
    domainDistribution: domainDist,
    skippedKeys,
    repairedEntries
  };

  fs.writeFileSync("reports/i18n-block63-quality-expansion.json", JSON.stringify(reportJson, null, 2));
  console.log("Saved reports/i18n-block63-quality-expansion.json");

  // Generate Markdown report
  let md = `# BLOCK 63 — Professional Translation Quality Expansion III Report

**Status:** COMPLETE ✅  
**GitHub Recovery Point:** BLOCK 62  
**Timestamp:** ${new Date().toISOString()}  

## 1. Executive Summary & Defect Burn-Down

| Defect Category | Block 62 Baseline | Repaired in Block 63 | Remaining Authoritative | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 352 | **100** | **252** | Progressing 🚀 |
| **Category C (Untranslated Fallback)** | 150 | **50** | **100** | Progressing 🚀 |
| **Category D (Corrupt Morphology)** | 0 | **0** | **0** | **100% ELIMINATED** |
| **Human Review Governance Queue** | 33 | **0** | **33** | Preserved (Untouched) |
| **Total Authoritative Queue** | 502 | **150** | **352** | Active Pipeline |

## 2. Domain Distribution

| Domain | Category B | Category C | Total Repaired |
|---|:---:|:---:|:---:|
`;

  for (const [dom, stats] of Object.entries(domainDist)) {
    md += `| \`${dom}\` | ${stats.b} | ${stats.c} | **${stats.total}** |\n`;
  }
  md += `| **Total** | **100** | **50** | **150** |\n\n`;

  md += `## 3. Skipped Keys & Technical Exclusions

| # | Key | Category | Priority | Governance Justification |
|---|---|:---:|:---:|---|
`;
  skippedKeys.forEach((s, idx) => {
    md += `| ${idx + 1} | \`${s.key}\` | **${s.category}** | ${s.priority} | ${s.reason} |\n`;
  });

  md += `\n## 4. Repaired Entries Audit (150 Total)\n\n`;
  md += `| # | Key | Domain | Cat | Arabic Source | English Translation | Urdu Translation | Status |\n`;
  md += `|---|---|---|:---:|---|---|---|:---:|\n`;

  repairedEntries.forEach((e, idx) => {
    const cleanAr = e.ar.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const cleanEn = e.newEn.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const cleanUr = e.newUr.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md += `| ${idx + 1} | \`${e.key}\` | \`${e.domain}\` | **${e.category}** | ${cleanAr} | ${cleanEn} | ${cleanUr} | \`${e.reviewStatus}\` |\n`;
  });

  fs.writeFileSync("reports/i18n-block63-quality-expansion.md", md);
  console.log("Saved reports/i18n-block63-quality-expansion.md");
}

main().catch(err => {
  console.error("BLOCK 63 Execution Failed:", err);
  process.exit(1);
});
