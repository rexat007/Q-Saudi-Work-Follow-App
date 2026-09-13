import fs from 'fs';
import path from 'path';

const selected = JSON.parse(fs.readFileSync('reports/block59-final-selected.json', 'utf8'));

// We create a translation map for the 100 C and 50 B entries
// Domain-accurate, professional terminology, preserving parameters and protected tokens
const translations: Record<string, { en: string; ur: string }> = {
  // DASHBOARD - Category C (10 items)
  "dashboard.labels.txt_18b638": {
    en: "Approved Net Weight at Unloading Point",
    ur: "ان لوڈنگ پوائنٹ پر منظور شدہ خالص وزن"
  },
  "dashboard.labels.txt_196321": {
    en: "Subject to Loading and Dispatch",
    ur: "لوڈنگ اور ڈسپیچ کے تابع"
  },
  "dashboard.labels.txt_19e345": {
    en: "Custom Widget Filters (Widget Filter Controls)",
    ur: "کسٹم ویجیٹ فلٹرز (Widget Filter Controls)"
  },
  "dashboard.labels.txt_1b110d": {
    en: "Total Scale Variance (Total Variance)",
    ur: "وزنی پل کا کل فرق (Total Variance)"
  },
  "dashboard.labels.txt_2530ed": {
    en: "Live Gates and Weighbridges Board (Live Terminal Board)",
    ur: "لائیو گیٹس اور وزنی پلوں کا بورڈ (Live Terminal Board)"
  },
  "dashboard.labels.txt_2ca1cc": {
    en: "Returned (Returned)",
    ur: "واپس شدہ (Returned)"
  },
  "dashboard.labels.txt_2f010a": {
    en: "Filter",
    ur: "فلٹر"
  },
  "dashboard.labels.txt_3318a9": {
    en: "All Statuses",
    ur: "تمام حالات"
  },
  "dashboard.labels.txt_356679": {
    en: "Total Due for Model:",
    ur: "ماڈل کا کل واجب الادا:"
  },
  "dashboard.labels.txt_36b0b2": {
    en: "- Automatically applied to all widgets unless a specific widget is customized",
    ur: "- خودکار طریقے سے تمام ویجیٹس پر لاگو ہوتا ہے جب تک کہ مخصوص ویجیٹ منتخب نہ کیا جائے"
  },

  // TRIPS - Category C (15 items)
  "trips.labels.pricing": {
    en: "Pricing Resolution (Pricing Resolution):",
    ur: "قیمت کا تعین (Pricing Resolution):"
  },
  "trips.labels.pricing_2": {
    en: "Pricing rule (${params.pricingRuleId}) not found in system",
    ur: "قیمت کا قاعدہ (${params.pricingRuleId}) سسٹم میں موجود نہیں ہے"
  },
  "trips.labels.pricing_3": {
    en: "Pricing rule (${pricingRule.name}) is disabled (INACTIVE)",
    ur: "قیمت کا قاعدہ (${pricingRule.name}) غیر فعال ہے (INACTIVE)"
  },
  "trips.labels.txt_10cba9": {
    en: "Valid and Resolved ✓",
    ur: "درست اور حل شدہ ✓"
  },
  "trips.labels.txt_124138": {
    en: "Reason / Note:",
    ur: "وجہ / نوٹ:"
  },
  "trips.labels.txt_1309b3": {
    en: "Actions",
    ur: "اقدامات"
  },
  "trips.labels.txt_135d7e": {
    en: "Returned to Origin (RETURNED)",
    ur: "ماخذ پر واپس کر دیا گیا (RETURNED)"
  },
  "trips.labels.txt_15d5c6": {
    en: "Settlement Base (settlementBase):",
    ur: "بنیاد برائے تصفیہ (settlementBase):"
  },
  "trips.labels.txt_16825e": {
    en: "Scenario 6: Expired Tariff",
    ur: "منظرنامہ 6: میعاد ختم شدہ ٹیرف"
  },
  "trips.labels.txt_1a8cbe": {
    en: "6. Illegal Skip (DRAFT ➔ COMPLETED)",
    ur: "6. غیر قانونی چھلانگ (DRAFT ➔ COMPLETED)"
  },
  "trips.labels.txt_1af9f4": {
    en: "Documented Regulatory Records",
    ur: "دستاویزی قانونی ریکارڈز"
  },
  "trips.labels.txt_1b87fb": {
    en: "RETURN_REQUESTED (Return Requested)",
    ur: "RETURN_REQUESTED (واپسی کی درخواست کی گئی)"
  },
  "trips.labels.txt_1e7d43": {
    en: "RETURNED (Returned to Origin)",
    ur: "RETURNED (ماخذ پر واپس کر دیا گیا)"
  },
  "trips.labels.txt_22b00b": {
    en: "[Rule 3: Authorized for Project]",
    ur: "[قاعدہ 3: پروجیکٹ کے لیے مجاز]"
  },
  "trips.labels.txt_233016": {
    en: "PRJ-NEOM-001 (NEOM Project - Compliant)",
    ur: "PRJ-NEOM-001 (نیوم پروجیکٹ - مطابقت پذیر)"
  },

  // LOADING - Category C (12 items)
  "loading.labels.pricing_2": {
    en: "Pricing Type (Pricing Type)",
    ur: "قیمت کی قسم (Pricing Type)"
  },
  "loading.labels.pricing_4": {
    en: "Switch Pricing Rule for Comparison:",
    ur: "موازنہ کے لیے قیمت کا قاعدہ تبدیل کریں:"
  },
  "loading.labels.txt_19142a": {
    en: "Atomic Sequence (Atomic)",
    ur: "اٹامک تسلسل (Atomic)"
  },
  "loading.labels.txt_195be1": {
    en: "Completed Engine Sequence:",
    ur: "مکمل شدہ انجن تسلسل:"
  },
  "loading.labels.txt_20c9dd": {
    en: "100% Calculation Precision",
    ur: "100% حسابی درستگی"
  },
  "loading.labels.txt_212255": {
    en: "Automated Settlement Protection",
    ur: "خودکار تصفیے کا تحفظ"
  },
  "loading.labels.txt_2b7e09": {
    en: "Strict Procedural Sequence after Confirm:",
    ur: "تصدیق کے بعد سخت طریقہ کار کا تسلسل:"
  },
  "loading.labels.txt_2dfd1b": {
    en: "National ID / Iqama:",
    ur: "شناختی کارڈ / اقامہ:"
  },
  "loading.labels.txt_31e3da": {
    en: "Fully Server-Calculated",
    ur: "مکمل سرور پر شمار شدہ"
  },
  "loading.labels.txt_31e684": {
    en: "Explicitly Enabled",
    ur: "واضح طور پر فعال"
  },
  "loading.labels.txt_37e310": {
    en: "Settlement Protected by Governance",
    ur: "تصفیہ ریگولیٹری تحفظ کے تحت"
  },
  "loading.labels.txt_3c2d03": {
    en: "Protected and Secured",
    ur: "محفوظ اور مستحکم"
  },

  // UNLOADING - Category C (12 items)
  "unloading.labels.txt_11fefd": {
    en: "➔ Then:",
    ur: "➔ پھر:"
  },
  "unloading.labels.txt_12f468": {
    en: "Actual Arrival Time (arrivalTime)",
    ur: "آمد کا اصل وقت (arrivalTime)"
  },
  "unloading.labels.txt_13d6c6": {
    en: "Immediate Test Scenarios:",
    ur: "فوری ٹیسٹ منظرنامے:"
  },
  "unloading.labels.txt_17be32": {
    en: "Matched via:",
    ur: "مطابقت بذریعہ:"
  },
  "unloading.labels.txt_1efd8d": {
    en: "Justified Normal Shipment Variance",
    ur: "کھیپ کا جائز قدرتی فرق"
  },
  "unloading.labels.txt_280c6b": {
    en: "Upon Start Unloading (Start Unloading)",
    ur: "ان لوڈنگ کے آغاز پر (Start Unloading)"
  },
  "unloading.labels.txt_2af283": {
    en: "\"The difference is not merely a UI color\"",
    ur: "\"یہ فرق صرف انٹرفیس کا رنگ نہیں ہے\""
  },
  "unloading.labels.txt_2e57eb": {
    en: "Server calculates varianceWeight and updates: unloaderId, arrivalTime, unloadTime, destNetWeight, varianceWeight.",
    ur: "سرور varianceWeight کا حساب لگاتا ہے اور اپ ڈیٹ کرتا ہے: unloaderId, arrivalTime, unloadTime, destNetWeight, varianceWeight."
  },
  "unloading.labels.txt_2f5c04": {
    en: "Lifecycle Status",
    ur: "لائف سائیکل کی حالت"
  },
  "unloading.labels.txt_304aff": {
    en: "Upon Arrival (Arrival)",
    ur: "آمد پر (Arrival)"
  },
  "unloading.labels.txt_30adf1": {
    en: "Out of Tolerance (Exception)",
    ur: "تفاوت کی حد سے باہر (Exception)"
  },
  "unloading.labels.txt_424fcb": {
    en: ". (Using truckPlate alone is prohibited).",
    ur: ". (صرف truckPlate کا استعمال ممنوع ہے)۔"
  },

  // WEIGHBRIDGE - Category C (15 items)
  "weighbridge.labels.txt_119698": {
    en: "Missing (Missing)",
    ur: "لاپتہ (Missing)"
  },
  "weighbridge.labels.txt_14234f": {
    en: "Tolerance Mode (Tolerance Mode)",
    ur: "تفاوت کا طریقہ کار (Tolerance Mode)"
  },
  "weighbridge.labels.txt_150ad3": {
    en: "Reset Idempotency",
    ur: "Idempotency ری سیٹ کریں"
  },
  "weighbridge.labels.txt_1644f0": {
    en: "Absolute Tolerance (absoluteTolerance)",
    ur: "مطلق تفاوت (absoluteTolerance)"
  },
  "weighbridge.labels.txt_17aab5": {
    en: "Do not use 0 instead of missing data ➔ Result is null",
    ur: "لاپتہ ڈیٹا کی جگہ 0 استعمال نہ کریں ➔ نتیجہ null ہے"
  },
  "weighbridge.labels.txt_17ffad": {
    en: "Quick Examples:",
    ur: "فوری مثالیں:"
  },
  "weighbridge.labels.txt_2161ff": {
    en: "Both (Absolute and Percentage Together)",
    ur: "دونوں (مطلق اور فیصد ایک ساتھ)"
  },
  "weighbridge.labels.txt_241697": {
    en: "Tare Weight Missing (➔ null)",
    ur: "خالی گاڑی کا وزن غائب (➔ null)"
  },
  "weighbridge.labels.txt_2456f5": {
    en: "Rule Status (status)",
    ur: "قاعدے کی حالت (status)"
  },
  "weighbridge.labels.txt_24fc12": {
    en: "Operation ID (Operation ID):",
    ur: "آپریشن شناختی نمبر (Operation ID):"
  },
  "weighbridge.labels.txt_265f32": {
    en: "Receiving Weight Missing (➔ null)",
    ur: "وصولی کا وزن غائب (➔ null)"
  },
  "weighbridge.labels.txt_2eacb2": {
    en: "Valid Rows (Valid)",
    ur: "درست قطاریں (Valid)"
  },
  "weighbridge.labels.txt_30b047": {
    en: "Regulatory Decision (Decision)",
    ur: "نگرانی کا فیصلہ (Decision)"
  },
  "weighbridge.labels.txt_32f0a0": {
    en: "Prohibit Substitute Zero (Strict null)",
    ur: "متبادل صفر کی ممانعت (حتمی null)"
  },
  "weighbridge.labels.txt_3524f5": {
    en: "Absence of Unloading Data (Non-blocking):",
    ur: "ان لوڈنگ ڈیٹا کی عدم موجودگی (غیر رکاوٹی):"
  },

  // PROJECTS - Category C (15 items)
  "materials.labels.txt_112afc": {
    en: "Click to toggle active and inactive status",
    ur: "فعال اور غیر فعال کے درمیان تبدیل کرنے کے لیے کلک کریں"
  },
  "materials.labels.txt_1a4fae": {
    en: "You can use the ⬆️⬇️ arrows to reorder approved sequence in vouchers",
    ur: "آپ واؤچرز میں منظور شدہ ترتیب بدلنے کے لیے ⬆️⬇️ تیر استعمال کر سکتے ہیں"
  },
  "materials.labels.txt_252118": {
    en: "Unit",
    ur: "اکائی"
  },
  "materials.labels.txt_3b64b7": {
    en: "Approved Unit of Measurement",
    ur: "منظور شدہ پیمائش کی اکائی"
  },
  "materials.labels.txt_60028f": {
    en: "Full Trip (TRIP) - Lump Sum",
    ur: "مکمل چکر (TRIP) - یکمشت"
  },
  "materials.labels.txt_6688ac": {
    en: "Cubic Meter (M3) - Volume",
    ur: "مکعب میٹر (M3) - حجم"
  },
  "materials.labels.txt_73756a": {
    en: "Move Up",
    ur: "اوپر منتقل کریں"
  },
  "materials.labels.txt_737581": {
    en: "Move Down",
    ur: "نیچے منتقل کریں"
  },
  "materials.labels.txt_7f591f": {
    en: "Order / Sequence",
    ur: "ترتیب"
  },
  "materials.labels.txt_9e7170": {
    en: "Add First Material Now",
    ur: "پہلا مٹیریل ابھی شامل کریں"
  },
  "other.labels.txt_109c7a": {
    en: "Base Unit of Measurement:",
    ur: "بنیادی پیمائش کی اکائی:"
  },
  "other.labels.txt_1118c2": {
    en: "Step 6: Provision Cloud Workspace (Google Drive & Sheets Provisioning)",
    ur: "مرحلہ 6: کلاؤڈ ورک اسپیس کی تشکیل (Google Drive & Sheets Provisioning)"
  },
  "other.labels.txt_13cd13": {
    en: "📊 Google Sheets Tabs (Tabs):",
    ur: "📊 Google Sheets ٹیبز (Tabs):"
  },
  "other.labels.txt_1e1bdf": {
    en: "Sign in with Google",
    ur: "Google کے ذریعے سائن ان کریں"
  },
  "other.labels.txt_207857": {
    en: "ACTIVE / INACTIVE State System:",
    ur: "ACTIVE / INACTIVE نظام کی حالت:"
  },

  // OFFLINE - Category C (11 items)
  "offline.labels.txt_15265b": {
    en: "DUPLICATE_OPERATION Duplicate Entry",
    ur: "DUPLICATE_OPERATION ڈپلیکیٹ اندراج"
  },
  "offline.labels.txt_18aa37": {
    en: "Operational Conflict Resolution Center (Conflict Resolution)",
    ur: "آپریشنل تنازعات کے حل کا مرکز (Conflict Resolution)"
  },
  "offline.labels.txt_197045": {
    en: "Offline Pricing Invariance:",
    ur: "آف لائن قیمت کا استحکام:"
  },
  "offline.labels.txt_1bc609": {
    en: "in Safari browser bar.",
    ur: "سفاری براؤزر بار میں۔"
  },
  "offline.labels.txt_21781d": {
    en: "Conflict Resolution Governance Mandates (Conflict Resolution Mandates)",
    ur: "تنازعات کے حل کے گورننس کے اصول (Conflict Resolution Mandates)"
  },
  "offline.labels.txt_231b48": {
    en: "Observed Field Discrepancies:",
    ur: "فیلڈ میں دیکھے گئے تفاوت:"
  },
  "offline.labels.txt_24195a": {
    en: "Local Field Command (Local Command)",
    ur: "مقامی فیلڈ کمانڈ (Local Command)"
  },
  "offline.labels.txt_25bbf9": {
    en: "Scroll down and select",
    ur: "نیچے سکرول کریں اور منتخب کریں"
  },
  "offline.labels.txt_292ade": {
    en: "Server Authentication Acknowledgment (Server ACK):",
    ur: "سرور تصدیقی اعتراف (Server ACK):"
  },
  "offline.labels.txt_2a087d": {
    en: "TRIP_ALREADY_COMPLETED Closed",
    ur: "TRIP_ALREADY_COMPLETED بند شدہ"
  },
  "offline.labels.txt_2eef0a": {
    en: "PRICING_CHANGED and Snapshot Protection",
    ur: "PRICING_CHANGED اور Snapshot تحفظ"
  },

  // SHARED - Category C (10 items)
  "authentication.labels.txt_3548e6": {
    en: "Connected to Firestore",
    ur: "Firestore سے منسلک ہے"
  },
  "authentication.labels.txt_413ffd": {
    en: "Sign In (Google)",
    ur: "سائن ان کریں (Google)"
  },
  "authentication.labels.txt_b1a849": {
    en: "Sign Out",
    ur: "سائن آؤٹ کریں"
  },
  "navigation.labels.txt_102b03": {
    en: "4 Subfolders",
    ur: "4 ذیلی فولڈرز"
  },
  "navigation.labels.txt_10324c": {
    en: "Alert: Operational conflicts detected requiring explicit resolution (Anti-LWW)",
    ur: "انتباہ: آپریشنل تنازعات پائے گئے ہیں جن کے لیے واضح حل درکار ہے (Anti-LWW)"
  },
  "navigation.labels.txt_114bd2": {
    en: "Reports (Reports)",
    ur: "رپورٹس (Reports)"
  },
  "navigation.labels.txt_116753": {
    en: "Six Projection Tabs in Google Sheets (Projection Tabs)",
    ur: "Google Sheets میں چھ پروجیکشن ٹیبز (Projection Tabs)"
  },
  "navigation.labels.txt_11ed5e": {
    en: "7 Steps",
    ur: "7 مراحل"
  },
  "navigation.labels.txt_12e46c": {
    en: "Upsert, not Blind Append",
    ur: "Upsert، Blind Append نہیں"
  },
  "navigation.labels.txt_136877": {
    en: "Project Google Drive Structure",
    ur: "پروجیکٹ کا Google Drive ڈھانچہ"
  },

  // DASHBOARD - Category B (6 items)
  "dashboard.labels.txt_3563c6": {
    en: "Resynchronize with Global Filters",
    ur: "عالمی فلٹرز کے ساتھ دوبارہ مطابقت پذیری کریں"
  },
  "dashboard.labels.txt_38efc7": {
    en: "Reset All",
    ur: "سب دوبارہ ترتیب دیں"
  },
  "dashboard.labels.txt_3b0cf8": {
    en: "Dues (SAR)",
    ur: "واجبات (سعودی ریال)"
  },
  "dashboard.labels.txt_7d6fcd": {
    en: "Operations and Logistics Control Dashboard (Operations Dashboard)",
    ur: "آپریشنز اور لاجسٹکس کنٹرول ڈیش بورڈ (Operations Dashboard)"
  },
  "dashboard.labels.txt_7ef999": {
    en: "Tons",
    ur: "ٹن"
  },
  "dashboard.labels.txt_b1749a": {
    en: "Ton-based Settlement (Ton-based Settlement)",
    ur: "ٹن کی بنیاد پر تصفیہ (Ton-based Settlement)"
  },

  // TRIPS - Category B (8 items)
  "other.labels.trips_7": {
    en: "Executes field trips assigned to them.",
    ur: "انہیں تفویض کردہ فیلڈ ٹرپس انجام دیتا ہے۔"
  },
  "other.labels.deleteCarrierTrips": {
    en: "Delete Carrier (Verify Trips and Integrity)",
    ur: "کیریئر حذف کریں (ٹرپس اور سالمیت کی جانچ)"
  },
  "other.labels.deleteDriverTrips": {
    en: "Delete Driver (Verify Trips and Integrity)",
    ur: "ڈرائیور حذف کریں (ٹرپس اور سالمیت کی جانچ)"
  },
  "other.labels.deleteMaterialTrips": {
    en: "Delete Material (Verify Trips and Integrity)",
    ur: "مٹیریل حذف کریں (ٹرپس اور سالمیت کی جانچ)"
  },
  "other.labels.deleteTruckTrips": {
    en: "Delete Truck (Verify Trips and Integrity)",
    ur: "ٹرک حذف کریں (ٹرپس اور سالمیت کی جانچ)"
  },
  "other.labels.trip": {
    en: "Trip Events",
    ur: "ٹرپ کے واقعات"
  },
  "other.labels.trips_4": {
    en: "Trip Numbers:",
    ur: "ٹرپ نمبرز:"
  },
  "other.labels.trips_6": {
    en: "Trips executed by their fleet and drivers are attributed here.",
    ur: "ان کے بیڑے اور ڈرائیوروں کے ذریعے مکمل کیے گئے ٹرپس یہاں منسوب کیے جاتے ہیں۔"
  },

  // LOADING - Category B (6 items)
  "loading.labels.materialsProject": {
    en: "Materials Approved for Supply at Project Site",
    ur: "پروجیکٹ سائٹ پر سپلائی کے لیے منظور شدہ مٹیریلز"
  },
  "loading.labels.materialsProject_2": {
    en: "Materials Authorized for Project",
    ur: "پروجیکٹ کے لیے مجاز مٹیریلز"
  },
  "loading.labels.pricingConfirm": {
    en: "Display pricing methodology to user before confirmation:",
    ur: "تصدیق سے پہلے صارف کو قیمت کے تعین کا طریقہ دکھائیں:"
  },
  "loading.labels.project": {
    en: "Project ID:",
    ur: "پروجیکٹ آئی ڈی:"
  },
  "loading.labels.projectDownloadPricing": {
    en: "Select project associated with loading order to apply isolation and pricing rules",
    ur: "علیحدگی اور قیمت کے قواعد لاگو کرنے کے لیے لوڈنگ آرڈر سے متعلقہ پروجیکٹ منتخب کریں"
  },
  "loading.labels.project_3": {
    en: "Selection is restricted to carriers authorized to work on the project",
    ur: "انتخاب صرف ان کیریئرز تک محدود ہے جو پروجیکٹ میں کام کرنے کے مجاز ہیں"
  },

  // UNLOADING - Category B (5 items)
  "unloading.labels.trip_3": {
    en: "Ambiguity Alert: Multiple trips found for truck",
    ur: "ابہام کا انتباہ: ٹرک کے لیے ایک سے زیادہ ٹرپس پائے گئے"
  },
  "unloading.labels.tripsTrip": {
    en: "Automatic continuation is prevented to avoid mixing different trips or shifts. Please select target trip below:",
    ur: "مختلف ٹرپس یا شفٹوں کے اختلاط سے بچنے کے لیے خودکار پیش رفت روک دی گئی ہے۔ براہ کرم نیچے مطلوبہ ٹرپ منتخب کریں:"
  },
  "unloading.labels.truck": {
    en: "Graduated resolution succeeded for truck identifier truckId (Status: ${searchResult.status}, Count: ${searchResult.count})",
    ur: "ٹرک شناخت کنندہ truckId کے لیے درجہ بندی کا حل کامیاب رہا (حالت: ${searchResult.status}، تعداد: ${searchResult.count})"
  },
  "unloading.labels.truckTime": {
    en: "Record truck arrival at main gate and document timestamp.",
    ur: "مین گیٹ پر ٹرک کی آمد درج کریں اور ٹائم اسٹیمپ محفوظ کریں۔"
  },
  "unloading.labels.truck_2": {
    en: "Truck ID and License Plate",
    ur: "ٹرک آئی ڈی اور لائسنس پلیٹ"
  },

  // WEIGHBRIDGE - Category B (7 items)
  "weighbridge.labels.trips_2": {
    en: "Created Trip Numbers:",
    ur: "تخلیق شدہ ٹرپ نمبرز:"
  },
  "weighbridge.labels.txt_1247cf": {
    en: "Output Test: WARNING (-380 kg / >75%)",
    ur: "آؤٹ پٹ ٹیسٹ: انتباہ (-380 کلوگرام / >75%)"
  },
  "weighbridge.labels.txt_18b9e9": {
    en: "Strict Validation Rules (Strict Validation):",
    ur: "سخت توثیقی قواعد (Strict Validation):"
  },
  "weighbridge.labels.txt_1e62d1": {
    en: "Notes or Justification for Approval (Optional):",
    ur: "منظوری کے لیے نوٹس یا جواز (اختیاری):"
  },
  "weighbridge.labels.txt_222b14": {
    en: "Normal (-150 kg)",
    ur: "معمول کے مطابق (-150 کلوگرام)"
  },
  "weighbridge.labels.txt_2523f6": {
    en: "Origin Net Weight",
    ur: "ماخذ کا خالص وزن"
  },
  "weighbridge.labels.txt_26b92a": {
    en: "Output Test: EXCEPTION (-750 kg / Limit Exceeded)",
    ur: "آؤٹ پٹ ٹیسٹ: استثنیٰ (-750 کلوگرام / حد سے تجاوز)"
  },

  // PROJECTS - Category B (8 items)
  "materials.labels.add_2": {
    en: "No materials have been added to the project yet.",
    ur: "ابھی تک پروجیکٹ میں کوئی مٹیریل شامل نہیں کیا گیا ہے۔"
  },
  "materials.labels.editMaterial": {
    en: "Edit Material Data",
    ur: "مٹیریل کا ڈیٹا ترمیم کریں"
  },
  "materials.labels.material_2": {
    en: "Material Code (Code)",
    ur: "مٹیریل کوڈ (Code)"
  },
  "materials.labels.materials": {
    en: "List of Approved Materials (",
    ur: "منظور شدہ مٹیریلز کی فہرست ("
  },
  "materials.labels.materials_3": {
    en: "Material Management Alerts:",
    ur: "مٹیریل مینجمنٹ انتباہات:"
  },
  "navigation.labels.projectUpload": {
    en: "Please initialize project folders in Google Drive before uploading files.",
    ur: "براہ کرم فائلز اپ لوڈ کرنے سے پہلے Google Drive میں پروجیکٹ فولڈرز تشکیل دیں۔"
  },
  "navigation.labels.project_2": {
    en: "Initialize Project Structure in Drive & Sheets",
    ur: "Drive اور Sheets میں پروجیکٹ کا ڈھانچہ تشکیل دیں"
  },
  "navigation.labels.project_3": {
    en: "Selected Project",
    ur: "منتخب کردہ پروجیکٹ"
  },

  // OFFLINE - Category B (5 items)
  "offline.labels.createTrip": {
    en: "Effective at trip creation time while offline",
    ur: "آف لائن رہتے ہوئے ٹرپ کی تخلیق کے وقت نافذ العمل"
  },
  "offline.labels.createTrip_2": {
    en: "When working in offline mode and creating a trip from the loading station, operations will automatically appear here for synchronization.",
    ur: "جب آف لائن موڈ میں کام کرتے ہوئے لوڈنگ اسٹیشن سے ٹرپ تخلیق کیا جاتا ہے، تو آپریشنز یہاں خودکار طور پر مطابقت پذیری کے لیے ظاہر ہوں گے۔"
  },
  "offline.labels.deleteSave": {
    en: "Delete operation from outbox and save audit file for logistics review.",
    ur: "آؤٹ باکس سے آپریشن حذف کریں اور لاجسٹکس جائزے کے لیے آڈٹ فائل محفوظ کریں۔"
  },
  "offline.labels.details": {
    en: "Conflict Details (Conflict Detected):",
    ur: "تنازعہ کی تفصیلات (Conflict Detected):"
  },
  "offline.labels.edit": {
    en: "Entity was suspended or modified on the server while working offline",
    ur: "آف لائن کام کے دوران سرور پر ہستی کو معطل یا تبدیل کر دیا گیا تھا"
  },

  // SHARED - Category B (5 items)
  "authentication.labels.txt_49cb21": {
    en: "Initializing authentication...",
    ur: "توثیق کی تشکیل جاری ہے..."
  },
  "navigation.labels.txt_17c5e1": {
    en: "These 12 principles serve as the governing architectural ceiling for the entire platform. No exception or violation of any principle is permitted at any development stage or executive code.",
    ur: "یہ 12 اصول پورے پلیٹ فارم کے لیے حاکم تکنیکی چھت ہیں۔ کسی بھی ترقیاتی مرحلے یا انتظامی کوڈ میں کسی اصول کی استثنا یا خلاف ورزی کی اجازت نہیں ہے۔"
  },
  "navigation.labels.refresh": {
    en: "Records are pulled from primary data stores in Firestore and table is refreshed",
    ur: "ریکارڈز Firestore کے بنیادی ڈیٹا اسٹورز سے حاصل کیے جاتے ہیں اور جدول کو تازہ کیا جاتا ہے"
  },
  "navigation.labels.refresh_4": {
    en: "Update is performed by strictly checking tripId column and matching the designated row exclusively.",
    ur: "اپ ڈیٹ tripId کالم کی سختی سے جانچ کر کے اور خصوصی طور پر نامزد قطار سے مماثلت کر کے انجام دیا جاتا ہے۔"
  },
  "navigation.labels.txt_132f08": {
    en: "Not registered yet (Click to initialize project)",
    ur: "ابھی رجسٹرڈ نہیں ہوا (پروجیکٹ تشکیل دینے کے لیے کلک کریں)"
  }
};

// Combine with final selected metadata
const result: any[] = [];
for (const item of selected.finalC) {
  const trans = translations[item.key];
  if (!trans) throw new Error(`Missing translation for Cat C key: ${item.key}`);
  result.push({
    key: item.key,
    domain: item.domain,
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: item.ar,
    oldEn: item.en,
    newEn: trans.en,
    oldUr: item.ur,
    newUr: trans.ur,
    reviewStatus: 'REVIEW_REQUIRED'
  });
}

for (const item of selected.finalB) {
  const trans = translations[item.key];
  if (!trans) throw new Error(`Missing translation for Cat B key: ${item.key}`);
  result.push({
    key: item.key,
    domain: item.domain,
    category: 'B',
    problemType: 'arabic_in_en',
    ar: item.ar,
    oldEn: item.en,
    newEn: trans.en,
    oldUr: item.ur,
    newUr: trans.ur,
    reviewStatus: 'REVIEW_REQUIRED'
  });
}

console.log(`Generated translations count: ${result.length}`);
fs.writeFileSync('reports/block59-translations-verified.json', JSON.stringify(result, null, 2), 'utf8');
