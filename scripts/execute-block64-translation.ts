import fs from "fs";
import path from "path";
import { dictionaries } from "../src/locales";

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

export const block64Translations: Record<string, { en: string; ur: string; rationale: string }> = {
  // =========================================================================
  // 1-100: Category B (61 projects, 23 offline, 16 entityResolution)
  // =========================================================================
  "other.labels.driver_6": {
    en: "Driver",
    ur: "ڈرائیور",
    rationale: "Standardized clean driver entity label."
  },
  "other.labels.drivers_5": {
    en: "Drivers",
    ur: "ڈرائیورز (Drivers)",
    rationale: "Eliminated mixed Arabic in EN and standardized Urdu driver plural."
  },
  "other.labels.material_4": {
    en: "Material Code",
    ur: "مٹیریل کوڈ",
    rationale: "Replaced mixed Arabic and English with standard terminology."
  },
  "other.labels.material_6": {
    en: "Activate Material (Set to ACTIVE)",
    ur: "مٹیریل فعال کریں (ACTIVE میں تبدیل کریں)",
    rationale: "Eliminated mixed Arabic and preserved ACTIVE token."
  },
  "other.labels.material_9": {
    en: "Transported construction or raw material with its physical and supply specifications.",
    ur: "منتقل کردہ تعمیراتی یا خام مٹیریل اور اس کی طبعی اور ترسیلی خصوصیات۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.materialProject_3": {
    en: "Toggle material permit for this project",
    ur: "اس پروجیکٹ کے لیے مٹیریل کا اجازت نامہ تبدیل کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.materials_5": {
    en: "Materials",
    ur: "مٹیریلز",
    rationale: "Removed redundant parenthetical English duplication."
  },
  "other.labels.materials_7": {
    en: "Approved Materials (Step 2)",
    ur: "منظور شدہ مٹیریلز (Step 2)",
    rationale: "Preserved Step 2 and eliminated mixed Arabic fragments."
  },
  "other.labels.project_4": {
    en: "${code} - Project Logistics Documents and Archive",
    ur: "${code} - پروجیکٹ لاجسٹکس دستاویزات اور آرکائیو",
    rationale: "Preserved ${code} parameter and normalized terminology."
  },
  "other.labels.project_5": {
    en: "Project Identifier in Firestore:",
    ur: "Firestore میں پروجیکٹ شناختی کوڈ:",
    rationale: "Preserved Firestore protected token and eliminated mixed Arabic."
  },
  "other.labels.project_6": {
    en: "Copy Project Code",
    ur: "پروجیکٹ کوڈ کاپی کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.projects_5": {
    en: "Root operational entity, financial perimeter, and multi-tenant isolation boundary (Tenant Boundary).",
    ur: "بنیادی آپریشنل اکائی، مالیاتی حدود اور کثیر صارف تنہائی کی حد (Tenant Boundary)۔",
    rationale: "Preserved Tenant Boundary token and eliminated mixed Arabic."
  },
  "other.labels.refresh_2": {
    en: "Client submits proposed events, while the server is the sole authoritative entity authorized to approve changes and update trip status.",
    ur: "کلائنٹ مجوزہ واقعات بھیجتا ہے، جبکہ سرور واحد بااختیار ادارہ ہے جو تبدیلیوں کی منظوری اور ٹرپ کی حالت کو اپ ڈیٹ کرنے کا مجاز ہے۔",
    rationale: "Eliminated mixed Arabic fragments and standardized technical phrasing."
  },
  "other.labels.saveCarrier": {
    en: "Save and Normalize Carrier",
    ur: "کیریئر محفوظ کریں اور نارملائز کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.saveDriver": {
    en: "Save and Normalize Driver",
    ur: "ڈرائیور محفوظ کریں اور نارملائز کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.saveMaterial": {
    en: "Save and Normalize Material",
    ur: "مٹیریل محفوظ کریں اور نارملائز کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.saveTruck": {
    en: "Save and Normalize Truck",
    ur: "ٹرک محفوظ کریں اور نارملائز کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.truck": {
    en: "Deactivate Truck (Set to INACTIVE)",
    ur: "ٹرک غیر فعال کریں (INACTIVE میں تبدیل کریں)",
    rationale: "Preserved INACTIVE token and eliminated mixed Arabic."
  },
  "other.labels.truck_2": {
    en: "Activate Truck (Set to ACTIVE)",
    ur: "ٹرک فعال کریں (ACTIVE میں تبدیل کریں)",
    rationale: "Preserved ACTIVE token and eliminated mixed Arabic."
  },
  "other.labels.truck_5": {
    en: "Truck",
    ur: "ٹرک",
    rationale: "Removed redundant parenthetical English duplication."
  },
  "other.labels.txt_14af6c": {
    en: "Directory containing all weighbridge tickets, delivery notes, and truck records.",
    ur: "وہ فولڈر جس میں تمام وزنی پل ٹکٹس، ترسیل کے نوٹس اور ٹرکوں کے ریکارڈ موجود ہیں۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.txt_1a0a87": {
    en: "Operations Google Sheets Spreadsheet Title (spreadsheetTitle)",
    ur: "آپریشنز Google Sheets اسپریڈ شیٹ کا عنوان (spreadsheetTitle)",
    rationale: "Preserved Google Sheets protected token."
  },
  "other.labels.txt_2ed1b5": {
    en: "All (ACTIVE + INACTIVE)",
    ur: "تمام (ACTIVE + INACTIVE)",
    rationale: "Preserved ACTIVE and INACTIVE protected tokens."
  },
  "other.labels.txt_35c4cc": {
    en: "Automated Integrity Checks and Tests",
    ur: "خودکار سالمیت کی جانچ اور ٹیسٹ",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.txt_36b6da": {
    en: "Authorized Carrier",
    ur: "مجاز کیریئر",
    rationale: "Replaced Arabic fallback with professional translations."
  },
  "other.labels.txt_394b13": {
    en: "Architectural Certification Status",
    ur: "آرکیٹیکچرل تصدیق کی حالت",
    rationale: "Eliminated mixed Arabic in EN and UR."
  },
  "other.labels.txt_3fb9ae": {
    en: "Per Trip (TRIP)",
    ur: "فی چکر (TRIP)",
    rationale: "Preserved TRIP token and replaced Arabic fallback."
  },
  "other.labels.txt_47f763": {
    en: "Rigorous Engineering Audit Results for Master Data Modules (9 Test Categories)",
    ur: "Master Data ماڈیولز کے سخت انجینئرنگ آڈٹ کے نتائج (9 ٹیسٹ کیٹیگریز)",
    rationale: "Preserved Master Data token and eliminated mixed Arabic."
  },
  "other.labels.txt_4e4d76": {
    en: "The application is currently running with full baseline reference data for Saudi projects. To enable live synchronization with Firestore databases and persist edits to the cloud, please sign in with your Google account.",
    ur: "ایپلی کیشن فی الحال سعودی منصوبوں کے مکمل حوالہ جاتی ڈیٹا کے ساتھ کام کر رہی ہے۔ Firestore ڈیٹا بیسز کے ساتھ براہ راست مطابقت پذیری اور کلاؤڈ میں ترامیم محفوظ کرنے کے لیے، آپ اپنے Google اکاؤنٹ سے لاگ ان کر سکتے ہیں۔",
    rationale: "Preserved Firestore and Google tokens, eliminated corrupt mixed morphology."
  },
  "other.labels.txt_592f64": {
    en: "Failed (FAILED)",
    ur: "ناکام (FAILED)",
    rationale: "Preserved FAILED token and replaced Arabic fallback."
  },
  "other.labels.txt_5c9a61": {
    en: "Successful Checks (100%)",
    ur: "کامیاب چیکس (100%)",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_618712": {
    en: "National ID / Iqama",
    ur: "قومی شناختی کارڈ / اقامہ",
    rationale: "Replaced Arabic fallback with domain-standard terms."
  },
  "other.labels.txt_66cfae": {
    en: "Unauthorized Carrier",
    ur: "غیر مجاز کیریئر",
    rationale: "Replaced Arabic fallback with domain-standard terms."
  },
  "other.labels.txt_67f664": {
    en: "Registered in System:",
    ur: "سسٹم میں رجسٹرڈ:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_6b093a": {
    en: "All Carriers",
    ur: "تمام کیریئرز",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_714016": {
    en: "Any carrier, material, truck, or driver referenced in past trips is never deleted in order to safeguard financial and audit integrity.",
    ur: "ماضی کے ٹرپس میں شامل کسی بھی کیریئر، مٹیریل، ٹرک یا ڈرائیور کو کبھی حذف نہیں کیا جاتا تاکہ مالیاتی حسابات اور آڈٹ کا تحفظ برقرار رہے۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.labels.txt_73dcb9": {
    en: "This record is linked to",
    ur: "یہ ریکارڈ منسلک ہے",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.labels.txt_7bb941": {
    en: "However, enforcing the rule \"use ACTIVE/INACTIVE instead of hard delete\", this record will be deactivated by setting its status to (INACTIVE).",
    ur: "اس کے باوجود، \"ہارڈ ڈیلیٹ کے بجائے ACTIVE/INACTIVE استعمال کریں\" کے اصول کے نفاذ کے تحت، اس ریکارڈ کو غیر فعال کر کے اس کی حالت (INACTIVE) کر دی جائے گی۔",
    rationale: "Preserved ACTIVE/INACTIVE tokens and eliminated corrupt mixed fragments."
  },
  "other.labels.txt_7f7eb1": {
    en: "Master Data Management (Master Data Modules)",
    ur: "ماسٹر ڈیٹا مینجمنٹ (Master Data Modules)",
    rationale: "Preserved Master Data Modules token."
  },
  "other.labels.txt_ebe0e2": {
    en: "Failures",
    ur: "ناکامیاں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "other.messages.driverCarrier": {
    en: "Driver registered and linked to carrier (Driver → Carrier) locally.",
    ur: "ڈرائیور کامیابی سے رجسٹرڈ اور کیریئر کے ساتھ منسلک (Driver → Carrier) مقامی طور پر کر دیا گیا۔",
    rationale: "Preserved Driver → Carrier token and eliminated mixed Arabic."
  },
  "other.messages.driverCarrier_2": {
    en: "Driver registered and linked to carrier (Driver → Carrier) with normalized national ID and mobile.",
    ur: "ڈرائیور کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Driver → Carrier) شناختی کارڈ اور موبائل نمبر کی نارملائزیشن کے ساتھ کر دیا گیا۔",
    rationale: "Preserved Driver → Carrier token and eliminated mixed Arabic."
  },
  "other.messages.truckCarrier": {
    en: "Truck registered and linked to carrier (Truck → Carrier) locally.",
    ur: "ٹرک کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Truck → Carrier) مقامی طور پر کر دیا گیا۔",
    rationale: "Preserved Truck → Carrier token and eliminated mixed Arabic."
  },
  "other.messages.truckCarrier_2": {
    en: "Truck registered and linked to carrier (Truck → Carrier) with normalized license plate.",
    ur: "ٹرک کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Truck → Carrier) نمبر پلیٹ کی نارملائزیشن کے ساتھ کر دیا گیا۔",
    rationale: "Preserved Truck → Carrier token and eliminated mixed Arabic."
  },
  "other.status.projectActive": {
    en: "Active Project:",
    ur: "فعال پروجیکٹ:",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.status.success_2": {
    en: "Initialization and archiving completed successfully",
    ur: "ابتدائی ترتیب اور آرکائیو کامیابی کے ساتھ مکمل ہو گئی",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "other.status.success_3": {
    en: "Success",
    ur: "کامیابی",
    rationale: "Eliminated mixed Arabic fallback in UR."
  },
  "projects.labels.add_2": {
    en: "At least one carrier must be added to the project",
    ur: "پروجیکٹ میں کم از کم ایک کیریئر شامل کرنا ضروری ہے",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "projects.labels.add_3": {
    en: "Add and Assign Role",
    ur: "شامل کریں اور کردار تفویض کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "projects.labels.location": {
    en: "Geographic Location of Project",
    ur: "پروجیکٹ کا جغرافیائی مقام",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "projects.labels.project_10": {
    en: "Invite a new user and assign permissions in the project",
    ur: "نئے صارف کو مدعو کریں اور پروجیکٹ میں اختیارات تفویض کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "projects.labels.project_11": {
    en: "Project Administrator (PROJECT_ADMIN)",
    ur: "پروجیکٹ ایڈمنسٹریٹر (PROJECT_ADMIN)",
    rationale: "Preserved PROJECT_ADMIN token and eliminated mixed Arabic."
  },
  "projects.labels.project_4": {
    en: "Project Administrators (Admin):",
    ur: "پروجیکٹ ایڈمنسٹریٹرز (Admin):",
    rationale: "Preserved Admin token and eliminated mixed Arabic."
  },
  "projects.labels.project_6": {
    en: "Project code (projectCode) is required",
    ur: "پروجیکٹ کوڈ (projectCode) درکار ہے",
    rationale: "Preserved projectCode parameter token and eliminated mixed Arabic."
  },
  "projects.labels.project_7": {
    en: "Project code must contain letters, numbers, and dashes only with no spaces",
    ur: "پروجیکٹ کوڈ میں صرف حروف، اعداد اور ڈیشز ہونے چاہئیں، بغیر فاصلے کے",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "projects.labels.trucks": {
    en: "Permitted Weight Variance for Trucks (KG)",
    ur: "ٹرکوں کے وزن میں جائز تفاوت (KG)",
    rationale: "Preserved KG protected token and eliminated mixed Arabic."
  },
  "projects.labels.txt_42e94e": {
    en: "General Observer (VIEWER)",
    ur: "عمومی مبصر (VIEWER)",
    rationale: "Preserved VIEWER token and replaced Arabic fallback."
  },
  "projects.labels.txt_50bf83": {
    en: "Permissions Warnings:",
    ur: "اختیارات کی وارننگز:",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "projects.labels.txt_74b183": {
    en: "Unique project identifier in Firestore; modification is prohibited after creation.",
    ur: "Firestore میں پروجیکٹ کا منفرد شناختی کوڈ؛ تخلیق کے بعد اس میں ترمیم ممنوع ہے۔",
    rationale: "Preserved Firestore protected token and eliminated hybrid morphology."
  },
  "projects.labels.txt_78a490": {
    en: "Operational Role (Role)",
    ur: "آپریشنل کردار (Role)",
    rationale: "Replaced Arabic fallback with clean domain terms."
  },
  "projects.labels.userProject": {
    en: "Check the box to add the user to this project and define their role",
    ur: "صارف کو اس پروجیکٹ میں شامل کرنے اور اس کا کردار منتخب کرنے کے لیے چیک باکس کو نشان زد کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "offline.labels.status": {
    en: "State Comparison (Preserved Local Command vs Server State)",
    ur: "محفوظ شدہ حالت کا موازنہ (Preserved Local Command vs Server State)",
    rationale: "Preserved Preserved Local Command vs Server State token."
  },
  "offline.labels.trip": {
    en: "Conflict: Trip is classified as returned (RETURNED) on server",
    ur: "تنازع: ٹرپ سرور پر واپس شدہ (RETURNED) کے طور پر درجہ بند ہے",
    rationale: "Preserved RETURNED token and eliminated mixed Arabic."
  },
  "offline.labels.truck": {
    en: "Truck-Carrier Dependency Conflict (Truck-Carrier Conflict)",
    ur: "ٹرک اور کیریئر کے تعلق کا تنازع (Truck-Carrier Conflict)",
    rationale: "Preserved Truck-Carrier Conflict token."
  },
  "offline.labels.txt_10f795": {
    en: "The server record has been modified concurrently with a newer version.",
    ur: "سرور پر ریکارڈ کو بیک وقت ایک نئے ورژن کے ساتھ تبدیل کر دیا گیا ہے۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "offline.labels.txt_2a088a": {
    en: "The application operates completely standalone without internet via Offline PWA technology.",
    ur: "ایپلی کیشن Offline PWA ٹیکنالوجی کے ذریعے انٹرنیٹ کے بغیر مکمل طور پر خودمختار کام کرے گی۔",
    rationale: "Preserved Offline PWA token and eliminated hybrid morphology."
  },
  "offline.labels.txt_35c87e": {
    en: "Install Application on iOS Devices",
    ur: "iOS آلات پر ایپلی کیشن انسٹال کریں",
    rationale: "Preserved iOS token and eliminated hybrid morphology."
  },
  "offline.labels.txt_3ba53d": {
    en: "Approve Explicit Resolution and Commit",
    ur: "واضح حل کی منظوری دیں اور لاگو کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "offline.labels.txt_3d9611": {
    en: "Accept Server State",
    ur: "سرور کی حالت قبول کریں (Accept Server State)",
    rationale: "Preserved Accept Server State token."
  },
  "offline.labels.txt_3db2df": {
    en: "Understood",
    ur: "سمجھ آ گئی",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_3e2425": {
    en: "Arbitration Notes",
    ur: "ثالثی کے نوٹس",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_4c59dc": {
    en: "Protected by Snapshot",
    ur: "اسنیپ شاٹ کے ذریعے محفوظ",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_4d3e1f": {
    en: "Difference Table (Diff)",
    ur: "تفاوت کا جدول (Diff)",
    rationale: "Preserved Diff token and replaced Arabic fallback."
  },
  "offline.labels.txt_4e1b80": {
    en: "The resolution will be recorded in the audit log and the Outbox state synchronized automatically",
    ur: "فیصلہ آڈٹ لاگ میں ریکارڈ کیا جائے گا اور آؤٹ باکس کی حالت خودکار طور پر مطابقت پذیر ہو جائے گی",
    rationale: "Preserved Outbox token and eliminated mixed Arabic."
  },
  "offline.labels.txt_5037be": {
    en: "Raw Data (JSON)",
    ur: "خام ڈیٹا (JSON)",
    rationale: "Preserved JSON protected token."
  },
  "offline.labels.txt_540354": {
    en: "Click the button",
    ur: "بٹن پر کلک کریں",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_59a3b5": {
    en: "Field",
    ur: "فیلڈ",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "offline.labels.txt_6357c3": {
    en: "Install PWA",
    ur: "PWA انسٹال کریں",
    rationale: "Preserved PWA protected token."
  },
  "offline.labels.txt_6a75f1": {
    en: "Share",
    ur: "شیئر کریں",
    rationale: "Removed redundant parenthetical English duplication."
  },
  "offline.labels.txt_6fd255": {
    en: "Install Application (PWA)",
    ur: "ایپلی کیشن انسٹال کریں (PWA)",
    rationale: "Preserved PWA protected token and eliminated hybrid morphology."
  },
  "offline.labels.txt_71eceb": {
    en: "Strict Architectural Rule:",
    ur: "سخت تعمیراتی اصول:",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "offline.labels.txt_7c7b96": {
    en: "Install the app on your device to work offline via PWA",
    ur: "انٹرنیٹ کے بغیر کام کرنے کے لیے اپنے آلے پر ایپلی کیشن (PWA) انسٹال کریں",
    rationale: "Preserved PWA protected token and eliminated hybrid morphology."
  },
  "offline.labels.txt_7e9398": {
    en: "Scale Supervisor (Scale Supervisor)",
    ur: "فیلڈ آپریشنز سپروائزر (Scale Supervisor)",
    rationale: "Preserved Scale Supervisor token and eliminated mixed Arabic."
  },
  "offline.status.cancelSuccess": {
    en: "Cancel duplicated ticket locally as it has already been committed successfully.",
    ur: "مقامی طور پر ڈپلیکیٹ ٹکٹ منسوخ کر دیا گیا کیونکہ یہ پہلے ہی کامیابی کے ساتھ منتقل ہو چکا ہے۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.carrier_3": {
    en: "Carrier",
    ur: "کیریئر",
    rationale: "Standardized clean carrier entity label."
  },
  "entityResolution.labels.driver_2": {
    en: "Driver",
    ur: "ڈرائیور",
    rationale: "Standardized clean driver entity label."
  },
  "entityResolution.labels.edit": {
    en: "Concurrent Edit in Offline Mode",
    ur: "آف لائن موڈ میں ہم وقت ترمیم",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.import": {
    en: "Critical conflict in entity relationships or permissions. Intake or import is strictly blocked until resolved and corrected.",
    ur: "تعلقات یا اختیارات میں سنگین تنازع۔ حل اور درستگی تک ڈیٹا اندراج یا امپورٹ مکمل طور پر ممنوع ہے۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.truck": {
    en: "Truck Conflict (CARRIER_TRUCK_CONFLICT)",
    ur: "ٹرک تنازع (CARRIER_TRUCK_CONFLICT)",
    rationale: "Preserved CARRIER_TRUCK_CONFLICT token."
  },
  "entityResolution.labels.txt_116ee2": {
    en: "Apply Resolution and Approve Record",
    ur: "حل لاگو کریں اور ریکارڈ منظور کریں",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.txt_148e7c": {
    en: "Matched and Safe (LOW)",
    ur: "مماثل اور محفوظ (LOW)",
    rationale: "Preserved LOW token and replaced Arabic fallback."
  },
  "entityResolution.labels.txt_189ba3": {
    en: "Blocked / Excluded",
    ur: "مسدود / خارج شدہ",
    rationale: "Replaced Arabic fallback with standard terminology."
  },
  "entityResolution.labels.txt_24239d": {
    en: "Carrier",
    ur: "کیریئر",
    rationale: "Removed redundant parenthetical duplication."
  },
  "entityResolution.labels.txt_257cc7": {
    en: "8 Stages Executed",
    ur: "8 مراحل مکمل",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "entityResolution.labels.txt_273452": {
    en: "High Risk (HIGH)",
    ur: "بلند خطرہ (HIGH)",
    rationale: "Preserved HIGH token and replaced Arabic fallback."
  },
  "entityResolution.labels.txt_2a7413": {
    en: "Requires Manual Confirmation",
    ur: "دستی تصدیق درکار ہے",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.txt_2c7a04": {
    en: "Database Candidate (Candidate)",
    ur: "ڈیٹا بیس میں مجوزہ ریکارڈ (Candidate)",
    rationale: "Preserved Candidate token and eliminated mixed Arabic."
  },
  "entityResolution.labels.txt_2fc03e": {
    en: "Manually Processed",
    ur: "دستی طور پر پروسیس شدہ",
    rationale: "Replaced Arabic fallback in EN and UR."
  },
  "entityResolution.labels.txt_30daee": {
    en: "Approved after passing verification and matching.",
    ur: "تصدیق اور مماثلت کے مراحل کامیابی سے طے کرنے کے بعد منظور کر لیا گیا۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },
  "entityResolution.labels.txt_30e91e": {
    en: "Intake of raw string value from file or input interface without modification.",
    ur: "فائل یا ان پٹ انٹرفیس سے بغیر کسی ترمیم کے ابتدائی متنی قدر کی وصولی۔",
    rationale: "Eliminated mixed Arabic fragments in EN and UR."
  },

  // =========================================================================
  // 101-150: Category C (1 project, 9 offline, 27 entityResolution, 10 exceptions, 3 shared)
  // =========================================================================
  "projects.labels.txt_ee3f70": {
    en: "Site Geofence Radius (GeoFence in meters)",
    ur: "سائٹ کے جغرافیائی دائرے کا رداس (میٹر میں GeoFence)",
    rationale: "Preserved GeoFence token and translated Arabic fallback."
  },
  "offline.labels.txt_3d5113": {
    en: "Audit Justification for Decision:",
    ur: "آڈٹ فیصلے کا جواز (Audit Justification):",
    rationale: "Preserved Audit Justification token and translated Arabic fallback."
  },
  "offline.labels.txt_41c156": {
    en: "Offline Pricing Snapshot Invariance Guarantee",
    ur: "آف لائن قیمت کی مستقل مزاجی کی ضمانت (Pricing Snapshot Invariance)",
    rationale: "Preserved Pricing Snapshot Invariance token and translated Arabic fallback."
  },
  "offline.labels.txt_47cf18": {
    en: "Explicit Resolution Strategy",
    ur: "لازمی واضح حل کی حکمت عملی (Explicit Resolution Strategy)",
    rationale: "Preserved Explicit Resolution Strategy token and translated Arabic fallback."
  },
  "offline.labels.txt_4d4137": {
    en: "Shipment intake rejected due to violation of authorization terms in central registry.",
    ur: "مرکزی رجسٹر میں اجازت نامے کی شرائط کی خلاف ورزی کی بنا پر شپمنٹ کی منتقلی مسترد کر دی گئی۔",
    rationale: "Translated Arabic fallback into professional EN and UR."
  },
  "offline.labels.txt_5b9d20": {
    en: "Shipment rejection or return has been registered on the server.",
    ur: "سرور پر شپمنٹ کا مسترد ہونا یا واپسی ریکارڈ کر دی گئی ہے۔",
    rationale: "Translated Arabic fallback into professional EN and UR."
  },
  "offline.labels.txt_604d7b": {
    en: "Discard Duplicate Operation (Discard Duplicate)",
    ur: "ڈپلیکیٹ آپریشن کو مسترد کریں (Discard Duplicate)",
    rationale: "Preserved Discard Duplicate token and translated Arabic fallback."
  },
  "offline.labels.txt_60c85c": {
    en: "Force Local Operation with Audit Trail (Force Local With Audit)",
    ur: "آڈٹ ریکارڈ کے ساتھ مقامی آپریشن نافذ کریں (Force Local With Audit)",
    rationale: "Preserved Force Local With Audit token and translated Arabic fallback."
  },
  "offline.labels.txt_69531e": {
    en: "Server State",
    ur: "سرور کی حالت (Server State)",
    rationale: "Preserved Server State token and translated Arabic fallback."
  },
  "offline.labels.txt_78ff43": {
    en: "Install on iPhone / iPad Devices",
    ur: "آئی فون / آئی پیڈ آلات پر انسٹال کریں",
    rationale: "Translated Arabic fallback with clean device terminology."
  },
  "entityResolution.labels.txt_14919c": {
    en: "Regulatory Reasons and Remarks:",
    ur: "باقاعدہ وجوہات اور تبصرے:",
    rationale: "Translated Arabic fallback into professional EN and UR."
  },
  "entityResolution.labels.txt_15728b": {
    en: "Critical (CRITICAL) - Intake Blocked",
    ur: "سنگین (CRITICAL) - اندراج ممنوع ہے",
    rationale: "Preserved CRITICAL token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_16c00c": {
    en: "Intelligent canonical standardization preserving semantics (removing diacritics and tatweel, normalizing digits, retaining substantive differences).",
    ur: "معنی کو محفوظ رکھنے والی ذہین معیاری ایڈجسٹمنٹ (اعراب اور کشیدہ علامات کا خاتمہ، ہندسوں کی یکسانیت، بنیادی فرق کی برقراری)۔",
    rationale: "Translated complex algorithmic description into fluent EN and UR."
  },
  "entityResolution.labels.txt_17f8ed": {
    en: "Fuzzy vs Normalized Matching (Possible Match)",
    ur: "فزی بمقابلہ نارملائزڈ مماثلت (Possible Match)",
    rationale: "Preserved Possible Match token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_1c98fc": {
    en: "High (HIGH) - Do Not Auto-Approve",
    ur: "اعلیٰ (HIGH) - خودکار منظوری نہ دیں",
    rationale: "Preserved HIGH token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_1ccbcc": {
    en: "⚠️ Explicit intervention required due to insufficient matching confidence.",
    ur: "⚠️ ناکافی مماثلت کی وجہ سے واضح دستی مداخلت درکار ہے۔",
    rationale: "Preserved warning emoji and translated Arabic fallback."
  },
  "entityResolution.labels.txt_2acaf8": {
    en: "Relationship Conflict (RELATIONSHIP)",
    ur: "تعلقات کا تنازع (RELATIONSHIP)",
    rationale: "Preserved RELATIONSHIP token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_2e1ff5": {
    en: "Regulatory Conflict Resolution (Conflict Resolution)",
    ur: "تنظیمی تنازعات کا حل (Conflict Resolution)",
    rationale: "Preserved Conflict Resolution token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_2e6c0e": {
    en: "Match Score:",
    ur: "مماثلت کا تناسب (Match Score):",
    rationale: "Preserved Match Score token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_392bf7": {
    en: "Compliance with Saudi transport regulations (license plate formats, national IDs, weight and payload limits).",
    ur: "سعودی ٹرانسپورٹ کے ضوابط سے ہم آہنگی (نمبر پلیٹ فارمیٹس، شناختی کارڈ نمبرز، وزن اور لوڈنگ کی حدود)۔",
    rationale: "Translated regulatory compliance description into professional EN and UR."
  },
  "entityResolution.labels.txt_39b3f8": {
    en: "Mandatory Control Gate (Pre-Import Gate)",
    ur: "لازمی کنٹرول گیٹ (Pre-Import Gate)",
    rationale: "Preserved Pre-Import Gate token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_3a8654": {
    en: "Source Input Value (Source)",
    ur: "اصل درج شدہ قدر (Source)",
    rationale: "Preserved Source token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_42e7b2": {
    en: "Pipeline Execution Trace",
    ur: "پائپ لائن پر عمل درآمد کی تفصیلی ٹریسنگ (Pipeline Execution Trace)",
    rationale: "Preserved Pipeline Execution Trace token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_42f259": {
    en: "NEOM Project - Northern Sector (PRJ-NEOM-001)",
    ur: "نیوم پروجیکٹ - شمالی سیکٹر (PRJ-NEOM-001)",
    rationale: "Preserved PRJ-NEOM-001 token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_446084": {
    en: "Mandatory Architectural Pipeline (The 8-Stage Quality Pipeline)",
    ur: "لازمی آرکیٹیکچرل پائپ لائن (The 8-Stage Quality Pipeline)",
    rationale: "Preserved The 8-Stage Quality Pipeline token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_4b1baa": {
    en: "Exact Match",
    ur: "مکمل مماثلت (Exact Match)",
    rationale: "Preserved Exact Match token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_4be3c3": {
    en: "Raw Input Value (Raw Value)",
    ur: "خام ان پٹ ویلیو (Raw Value)",
    rationale: "Preserved Raw Value token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_4d8e7a": {
    en: "Material Not Allowed (MATERIAL_NOT_ALLOWED)",
    ur: "غیر مجاز مٹیریل (MATERIAL_NOT_ALLOWED)",
    rationale: "Preserved MATERIAL_NOT_ALLOWED token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_5182e1": {
    en: "Unauthorized Carrier (CARRIER_NOT_ALLOWED)",
    ur: "غیر مجاز کیریئر (CARRIER_NOT_ALLOWED)",
    rationale: "Preserved CARRIER_NOT_ALLOWED token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_5604bd": {
    en: "⛔ Intake cannot proceed until conflict is manually resolved.",
    ur: "⛔ تنازع کو دستی طور پر حل کیے جانے تک اندراج ممکن نہیں۔",
    rationale: "Preserved stop emoji and translated Arabic fallback."
  },
  "entityResolution.labels.txt_5786fc": {
    en: "Entity Type to Match",
    ur: "مماثلت کے لیے مطلوبہ اکائی کی قسم",
    rationale: "Translated Arabic fallback into clear professional terms."
  },
  "entityResolution.labels.txt_63d60e": {
    en: "Deterministic risk severity assessment (CRITICAL / HIGH / MEDIUM / LOW).",
    ur: "حتمی رسک گریڈ کا حساب (CRITICAL / HIGH / MEDIUM / LOW)۔",
    rationale: "Preserved severity level tokens and translated Arabic fallback."
  },
  "entityResolution.labels.txt_63e83a": {
    en: "Total Inspected Records",
    ur: "جانچ شدہ کل ریکارڈز",
    rationale: "Translated Arabic fallback into clean statistical label."
  },
  "entityResolution.labels.txt_6608f0": {
    en: "Deterministic pipeline guaranteeing every intake value is processed through 8 sequential audit stages prior to any commit in Firestore",
    ur: "حتمی سلسلہ جو اس بات کو یقینی بناتا ہے کہ Firestore میں لکھنے سے قبل ہر درج شدہ قدر 8 متواتر آڈٹ مراحل سے گزرے",
    rationale: "Preserved Firestore protected token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_795a77": {
    en: "✓ All fields are verified and compliant with regulatory standards.",
    ur: "✓ تمام فیلڈز مطابقت رکھتی ہیں اور باضابطہ طور پر منظور شدہ ہیں۔",
    rationale: "Preserved checkmark and translated Arabic fallback."
  },
  "entityResolution.labels.txt_7e9185": {
    en: "No Match Found (NO_MATCH)",
    ur: "کوئی مماثلت نہیں ملی (NO_MATCH)",
    rationale: "Preserved NO_MATCH token and translated Arabic fallback."
  },
  "entityResolution.labels.txt_a74c7a": {
    en: "Similarity algorithms (Levenshtein & Jaro-Winkler) to calculate match confidence and detect Possible Matches.",
    ur: "مماثلت کے الگورتھم (Levenshtein & Jaro-Winkler) تاکہ مماثلت کے تناسب کا حساب لگایا جا سکے اور ممکنہ مماثلت تلاش کی جا سکے۔",
    rationale: "Preserved algorithmic tokens and translated Arabic fallback."
  },
  "exceptions.labels.txt_268748": {
    en: "Approved and Resolved (RESOLVED)",
    ur: "منظور شدہ اور حل شدہ (RESOLVED)",
    rationale: "Preserved RESOLVED token and translated Arabic fallback."
  },
  "exceptions.labels.txt_2fee62": {
    en: "Raise New Operational Exception (Raise Exception)",
    ur: "نیا آپریشنل استثناء درج کریں (Raise Exception)",
    rationale: "Preserved Raise Exception token and translated Arabic fallback."
  },
  "exceptions.labels.txt_391836": {
    en: "Raise New Exception (Raise Exception)",
    ur: "نیا استثناء درج کریں (Raise Exception)",
    rationale: "Preserved Raise Exception token and translated Arabic fallback."
  },
  "exceptions.labels.txt_482fcf": {
    en: "Resolved and Approved (RESOLVED)",
    ur: "حل شدہ اور منظور شدہ (RESOLVED)",
    rationale: "Preserved RESOLVED token and translated Arabic fallback."
  },
  "exceptions.labels.txt_4eb7b8": {
    en: "Mandatory Audit Trail (Audit Trail)",
    ur: "لازمی آڈٹ لاگ (Audit Trail)",
    rationale: "Preserved Audit Trail token and translated Arabic fallback."
  },
  "exceptions.labels.txt_5675c9": {
    en: "Initiate Review (UNDER_REVIEW)",
    ur: "جائزہ شروع کریں (UNDER_REVIEW)",
    rationale: "Preserved UNDER_REVIEW token and translated Arabic fallback."
  },
  "exceptions.labels.txt_5b7754": {
    en: "Reporter / System (openedBy)",
    ur: "رپورٹ کنندہ / سسٹم (openedBy)",
    rationale: "Preserved openedBy token and translated Arabic fallback."
  },
  "exceptions.labels.txt_60d9c1": {
    en: "Operating system is compliant and stable",
    ur: "آپریشنل سسٹم ہم آہنگ اور مستحکم ہے",
    rationale: "Translated Arabic fallback into professional EN and UR."
  },
  "exceptions.labels.txt_69c1d3": {
    en: "Exception Type (12 Types)",
    ur: "استثناء کی قسم (12 Types)",
    rationale: "Preserved 12 Types token and translated Arabic fallback."
  },
  "exceptions.labels.txt_6abe88": {
    en: "Under Review (UNDER_REVIEW)",
    ur: "زیر جائزہ (UNDER_REVIEW)",
    rationale: "Preserved UNDER_REVIEW token and translated Arabic fallback."
  },
  "navigation.labels.txt_15ec91": {
    en: "Non-Destructive Extension (Additive Only):",
    ur: "غیر تخریبی توسیع (Additive Only):",
    rationale: "Preserved Additive Only token and translated Arabic fallback."
  },
  "navigation.labels.txt_19c7ca": {
    en: "Server-side integration with Google Sheets and Google Drive",
    ur: "سرور کی سطح پر Google Sheets اور Google Drive کا انضمام",
    rationale: "Preserved Google Sheets and Google Drive protected tokens."
  },
  "navigation.labels.txt_19e865": {
    en: "1. Current 20 Operational Columns (Legacy Operational Columns)",
    ur: "1. موجودہ 20 آپریشنل کالمز (Legacy Operational Columns)",
    rationale: "Preserved Legacy Operational Columns token and translated Arabic fallback."
  }
};

async function main() {
  console.log("Validating Block 64 translations map...");

  const selB = JSON.parse(fs.readFileSync("reports/block64-selected-b.json", "utf8"));
  const selC = JSON.parse(fs.readFileSync("reports/block64-selected-c.json", "utf8"));
  const allSelected = [...selB, ...selC];

  if (allSelected.length !== 150) {
    throw new Error(`Expected 150 selected items, got ${allSelected.length}`);
  }

  const keys = Object.keys(block64Translations);
  if (keys.length !== 150) {
    throw new Error(`Expected exactly 150 translations in map, got ${keys.length}`);
  }

  const arabicRegex = /[\u0600-\u06FF]/;
  const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  const protectedTokens = [
    "ticketId", "truckNo", "projectId", "carrierId", "driverId", "materialId",
    "operationId", "pricingType", "settlementBase", "sourceType",
    "SAR", "KG", "TON", "M3", "CSV", "Excel", "Sheets", "Drive", "Firestore",
    "PWA", "JSON", "RBAC", "API",
    "IN_TRANSIT", "ARRIVED", "COMPLETED", "PENDING", "LOADED", "ACTIVE",
    "PER_TRIP", "PER_TON"
  ];

  const repairedEntries: RepairedEntry[] = [];

  for (const item of allSelected) {
    const t = block64Translations[item.key];
    if (!t) {
      throw new Error(`Missing translation for key "${item.key}"`);
    }

    const ar = dictionaries.ar[item.key] || item.ar;
    const oldEn = dictionaries.en[item.key] || item.currentEn;
    const oldUr = dictionaries.ur[item.key] || item.currentUr;

    // 1. Check EN has NO Arabic
    if (arabicRegex.test(t.en)) {
      throw new Error(`Accidental Arabic in EN for key "${item.key}": "${t.en}"`);
    }

    // 2. Check UR has no hybrid suffix
    if (hybridSuffixRegex.test(t.ur)) {
      throw new Error(`Hybrid morphology in UR for key "${item.key}": "${t.ur}"`);
    }

    // 3. Parameter parity
    const arParams = (ar.match(paramRegex) || []).sort();
    const enParams = (t.en.match(paramRegex) || []).sort();
    const urParams = (t.ur.match(paramRegex) || []).sort();
    if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
      throw new Error(`Parameter mismatch in EN for key "${item.key}": AR=${arParams}, EN=${enParams}`);
    }
    if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
      throw new Error(`Parameter mismatch in UR for key "${item.key}": AR=${arParams}, UR=${urParams}`);
    }

    // 4. Protected token parity
    for (const tok of protectedTokens) {
      if (ar.includes(tok)) {
        if (!t.en.includes(tok)) {
          throw new Error(`Protected token "${tok}" missing in EN for key "${item.key}"`);
        }
        if (!t.ur.includes(tok)) {
          throw new Error(`Protected token "${tok}" missing in UR for key "${item.key}"`);
        }
      }
    }

    // 5. Check no leading/trailing whitespace
    if (t.en !== t.en.trim()) {
      throw new Error(`Untrimmed EN translation for key "${item.key}"`);
    }
    if (t.ur !== t.ur.trim()) {
      throw new Error(`Untrimmed UR translation for key "${item.key}"`);
    }

    repairedEntries.push({
      key: item.key,
      domain: item.domain,
      category: item.category,
      priority: item.priority,
      ar,
      oldEn,
      newEn: t.en,
      oldUr,
      newUr: t.ur,
      reviewStatus: "REVIEW_REQUIRED",
      rationale: t.rationale
    });
  }

  console.log("All 150 translations verified successfully!");

  // Now execute update to src/locales/en/index.ts and src/locales/ur/index.ts
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
    block: 64,
    title: "BLOCK 64 — Professional Translation Quality Expansion IV",
    timestamp: new Date().toISOString(),
    status: "COMPLETE",
    counts: {
      totalRepaired: repairedEntries.length,
      categoryBRepaired: repairedEntries.filter(e => e.category === "B").length,
      categoryCRepaired: repairedEntries.filter(e => e.category === "C").length,
      categoryBRemaining: 252 - 100,
      categoryCRemaining: 100 - 50,
      categoryDRemaining: 0,
      humanReviewTotal: 33
    },
    domainDistribution: domainDist,
    skippedKeys,
    repairedEntries
  };

  fs.writeFileSync("reports/i18n-block64-quality-expansion.json", JSON.stringify(reportJson, null, 2));
  console.log("Saved reports/i18n-block64-quality-expansion.json");

  // Generate Markdown report
  let md = `# BLOCK 64 — Professional Translation Quality Expansion IV Report

**Status:** COMPLETE ✅  
**GitHub Recovery Point:** BLOCK 63  
**Timestamp:** ${new Date().toISOString()}  

## 1. Executive Summary & Defect Burn-Down

| Defect Category | Block 63 Baseline | Repaired in Block 64 | Remaining Authoritative | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 252 | **100** | **152** | Progressing 🚀 |
| **Category C (Untranslated Fallback)** | 100 | **50** | **50** | Progressing 🚀 |
| **Category D (Corrupt Morphology)** | 0 | **0** | **0** | **100% ELIMINATED** |
| **Human Review Governance Queue** | 33 | **0** | **33** | Preserved (Untouched) |
| **Total Authoritative Queue** | 385 | **150** | **235** | Active Pipeline |

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

  fs.writeFileSync("reports/i18n-block64-quality-expansion.md", md);
  console.log("Saved reports/i18n-block64-quality-expansion.md");
}

main().catch(err => {
  console.error("BLOCK 64 Execution Failed:", err);
  process.exit(1);
});
