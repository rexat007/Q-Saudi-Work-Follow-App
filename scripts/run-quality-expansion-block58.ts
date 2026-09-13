import fs from 'fs';
import path from 'path';

export interface QualityExpansionEntry {
  key: string;
  domain: string;
  category: 'B' | 'C';
  problemType: string;
  ar: string;
  oldEn: string;
  newEn: string;
  oldUr: string;
  newUr: string;
  reviewStatus: 'REVIEW_REQUIRED';
}

export const block58Entries: QualityExpansionEntry[] = [
  // Dashboard (20)
  {
    key: 'dashboard.labels.downloadLocation',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'أوزان التحميل / الموقع',
    oldEn: 'أوزان التحميل / Location',
    newEn: 'Loading / Site Weights',
    oldUr: 'أوزان التحميل / مقام',
    newUr: 'لوڈنگ / سائٹ کا وزن',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.download_2',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تم التحميل',
    oldEn: 'تم التحميل',
    newEn: 'Loaded',
    oldUr: 'تم التحميل',
    newUr: 'لوڈ ہو گیا',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.download_3',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'دقة حساب إجمالي أوزان التحميل والاستلام وفارق الموازين',
    oldEn: 'دقة حساب إجمالي أوزان التحميل والاستلام وفارق الموازين',
    newEn: 'Accuracy of total loading weights, received weights, and scale variance calculation',
    oldUr: 'دقة حساب إجمالي أوزان التحميل والاستلام وفارق الموازين',
    newUr: 'کل لوڈنگ وزن، موصولہ وزن اور وزنی پل کے فرق کے حساب کی درستگی',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.location_2',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إجمالي أوزان الاستلام بالموقع (Total Received Tons)',
    oldEn: 'إجمالي أوزان الاستلام بLocation (Total Received Tons)',
    newEn: 'Total Site Received Weights (Total Received Tons)',
    oldUr: 'إجمالي أوزان الاستلام بمقام (Total Received Tons)',
    newUr: 'سائٹ پر موصولہ کل وزن (Total Received Tons)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.materials_2',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'كافة المواد',
    oldEn: 'كافة Materials',
    newEn: 'All Materials',
    oldUr: 'كافة مٹیریلز',
    newUr: 'تمام مٹیریلز',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.pricing_3',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تم توزيع ${matDist.length} مواد، ونموذجي التسعير (PER_TRIP و PER_TON) بنسبة 100%.',
    oldEn: 'تم توزيع ${matDist.length} مواد، ونموذجي التسعير (PER_TRIP و PER_TON) بنسبة 100%.',
    newEn: '${matDist.length} materials and both pricing models (PER_TRIP and PER_TON) distributed at 100%.',
    oldUr: 'تم توزيع ${matDist.length} مواد، ونموذجي التسعير (PER_TRIP و PER_TON) بنسبة 100%.',
    newUr: '${matDist.length} مٹیریلز اور دونوں قیمت کے ماڈلز (PER_TRIP اور PER_TON) 100% تقسیم کیے گئے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'اختباراً لعزل المشاريع وحسابات الأوزان والتسويات.',
    oldEn: 'اختباراً لعزل Projects وحسابات الأوزان والتسويات.',
    newEn: 'Tests for project isolation, weight calculations, and settlements.',
    oldUr: 'اختباراً لعزل منصوبے وحسابات الأوزان والتسويات.',
    newUr: 'منصوبوں کی تفریق، وزن کے حسابات اور سیٹلمنٹس کے ٹیسٹ۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects_2',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إدارة العمليات المركزية - كافة المشاريع',
    oldEn: 'إدارة العمليات المركزية - كافة Projects',
    newEn: 'Central Operations Management - All Projects',
    oldUr: 'إدارة العمليات المركزية - كافة منصوبے',
    newUr: 'مرکزی آپریشنز مینجمنٹ - تمام منصوبے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects_3',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'صلاحية مدير العمليات العام لكافة المشاريع',
    oldEn: 'صلاحية مدير العمليات العام لكافة Projects',
    newEn: 'General Operations Manager authority for all projects',
    oldUr: 'صلاحية مدير العمليات العام لكافة منصوبے',
    newUr: 'تمام منصوبوں کے لیے جنرل آپریشنز مینیجر کے اختیارات',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects_4',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تم السماح لمدير العمليات العام بالوصول لـ ${superRes.trips.length} رحلات من مختلف المشاريع بدون حجب.',
    oldEn: 'تم السماح لمدير العمليات العام بالوصول لـ ${superRes.trips.length} Trips من مختلف Projects بدون حجب.',
    newEn: 'General Operations Manager granted access to ${superRes.trips.length} trips across various projects without restriction.',
    oldUr: 'تم السماح لمدير العمليات العام بالوصول لـ ${superRes.trips.length} ٹرپس من مختلف منصوبے بدون حجب.',
    newUr: 'جنرل آپریشنز مینیجر کو بغیر کسی پابندی کے مختلف منصوبوں سے ${superRes.trips.length} ٹرپس تک رسائی دی گئی۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects_5',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'نتائج فحص أمان المشاريع وصحة مؤشرات العمليات (Compliance Suite)',
    oldEn: 'نتائج فحص أمان Projects وصحة مؤشرات العمليات (Compliance Suite)',
    newEn: 'Project security scan results and operational indicator health (Compliance Suite)',
    oldUr: 'نتائج فحص أمان منصوبے وصحة مؤشرات العمليات (Compliance Suite)',
    newUr: 'پروجیکٹ سیکیورٹی اسکین کے نتائج اور آپریشنل اشاریوں کی درستگی (Compliance Suite)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.projects_7',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'كافة المشاريع المصرحة',
    oldEn: 'كافة Projects المصرحة',
    newEn: 'All Authorized Projects',
    oldUr: 'كافة منصوبے المصرحة',
    newUr: 'تمام مجاز منصوبے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.search',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'لا توجد حركات مسجلة تطابق معايير الفلترة أو البحث الحالية.',
    oldEn: 'لا توجد حركات مسجلة تطابق معايير الفلترة أو Search الحالية.',
    newEn: 'No recorded transactions match the current filter or search criteria.',
    oldUr: 'لا توجد حركات مسجلة تطابق معايير الفلترة أو تلاش کریں الحالية.',
    newUr: 'موجودہ فلٹر یا تلاش کے معیار کے مطابق کوئی ریکارڈ شدہ ٹرانزیکشن موجود نہیں ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.trips_2',
    domain: 'dashboard',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'دقة حساب بطاقات حالات وأعداد الرحلات',
    oldEn: 'دقة حساب بطاقات حالات وأعداد Trips',
    newEn: 'Calculation accuracy of trip status cards and counts',
    oldUr: 'دقة حساب بطاقات حالات وأعداد ٹرپس',
    newUr: 'ٹرپ کی حالت کے کارڈز اور گنتی کے حساب کی درستگی',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_1137e3',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'استثناءات (Exceptions)',
    oldEn: 'استثناءات (Exceptions)',
    newEn: 'Exceptions',
    oldUr: 'استثناءات (Exceptions)',
    newUr: 'استثنیات (Exceptions)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_11a6ad',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'مستوى صلاحيات المدير العام للمنظومة',
    oldEn: 'مستوى صلاحيات المدير العام للمنظومة',
    newEn: 'System General Manager authority level',
    oldUr: 'مستوى صلاحيات المدير العام للمنظومة',
    newUr: 'سسٹم کے جنرل مینیجر کے اختیارات کی سطح',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_125b36',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'بطاقات الأوزان وتفاوت الموازين (Tonnage & Weighbridge Variance)',
    oldEn: 'بطاقات الأوزان وتفاوت الموازين (Tonnage & Weighbridge Variance)',
    newEn: 'Weight and Scale Variance Cards (Tonnage & Weighbridge Variance)',
    oldUr: 'بطاقات الأوزان وتفاوت الموازين (Tonnage & Weighbridge Variance)',
    newUr: 'وزن اور وزنی پل کے فرق کے کارڈز (Tonnage & Weighbridge Variance)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_15b1d1',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'لا توجد بيانات ناقلين مطابقة لمعايير الفلترة الحالية.',
    oldEn: 'لا توجد بيانات ناقلين مطابقة لمعايير الفلترة الحالية.',
    newEn: 'No carrier data matches the current filter criteria.',
    oldUr: 'لا توجد بيانات ناقلين مطابقة لمعايير الفلترة الحالية.',
    newUr: 'موجودہ فلٹر کے معیار کے مطابق کیریئرز کا کوئی ڈیٹا نہیں ملا۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_176fe6',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'مقطوعية بالرد (PER_TRIP)',
    oldEn: 'مقطوعية بالرد (PER_TRIP)',
    newEn: 'Fixed rate per trip (PER_TRIP)',
    oldUr: 'مقطوعية بالرد (PER_TRIP)',
    newUr: 'فی ٹرپ طے شدہ شرح (PER_TRIP)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'dashboard.labels.txt_18193c',
    domain: 'dashboard',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'بطاقات التسويات والمستحقات المالية (Financial Settlement - Snapshot Invariance)',
    oldEn: 'بطاقات التسويات والمستحقات المالية (Financial Settlement - Snapshot Invariance)',
    newEn: 'Financial Settlements and Dues Cards (Financial Settlement - Snapshot Invariance)',
    oldUr: 'بطاقات التسويات والمستحقات المالية (Financial Settlement - Snapshot Invariance)',
    newUr: 'مالی سیٹلمنٹس اور واجبات کے کارڈز (Financial Settlement - Snapshot Invariance)',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Trips (20)
  {
    key: 'trips.labels.cancel',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء ✕',
    oldEn: 'Cancel ✕',
    newEn: 'Cancel ✕',
    oldUr: 'إلغاء ✕',
    newUr: 'منسوخ کریں ✕',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.cancelTrip',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء أمر الرحلة كلياً قبل الانطلاق أو بقرار تشغيلي معتمد',
    oldEn: 'Cancel أمر الTrip كلياً قبل الانطلاق أو بقرار تشغيلي معتمد',
    newEn: 'Cancel trip order completely before departure or by approved operational decision',
    oldUr: 'منسوخ کریں أمر الٹرپ كلياً قبل الانطلاق أو بقرار تشغيلي معتمد',
    newUr: 'روانگی سے قبل یا مجاز آپریشنل فیصلے کے تحت ٹرپ آرڈر کو مکمل منسوخ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.carrier',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الناقل (${params.carrierId}) غير مسجل في النظام',
    oldEn: 'Carrier (${params.carrierId}) غير مسجل في النظام',
    newEn: 'Carrier (${params.carrierId}) is not registered in the system',
    oldUr: 'کیریئر (${params.carrierId}) غير مسجل في النظام',
    newUr: 'کیریئر (${params.carrierId}) سسٹم میں رجسٹرڈ نہیں ہے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.carrierTruck',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الناقل والشاحنة:',
    oldEn: 'Carrier والTruck:',
    newEn: 'Carrier and Truck:',
    oldUr: 'کیریئر والٹرک:',
    newUr: 'کیریئر اور ٹرک:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.carrier_2',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الناقل (${carrier.name}) حالته معطلة (INACTIVE)',
    oldEn: 'Carrier (${carrier.name}) حالته معطلة (INACTIVE)',
    newEn: 'Carrier (${carrier.name}) is inactive (INACTIVE)',
    oldUr: 'کیریئر (${carrier.name}) حالته معطلة (INACTIVE)',
    newUr: 'کیریئر (${carrier.name}) کی حالت غیر فعال ہے (INACTIVE)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.confirm',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تأكيد التحول إلى [',
    oldEn: 'Confirm التحول إلى [',
    newEn: 'Confirm transition to [',
    oldUr: 'تصدیق کریں التحول إلى [',
    newUr: 'حالت کی تبدیلی کی تصدیق کریں [',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.confirmBackTruck',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تأكيد رجوع الشاحنة إلى الكسارة أو المحجر المصدر.',
    oldEn: 'Confirm رجوع الTruck إلى الكسارة أو المحجر المصدر.',
    newEn: 'Confirm truck return to crusher or source quarry.',
    oldUr: 'تصدیق کریں رجوع الٹرک إلى الكسارة أو المحجر المصدر.',
    newUr: 'کرشر یا ماخذ کان میں ٹرک کی واپسی کی تصدیق کریں۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.create',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تم الإنشاء:',
    oldEn: 'Created:',
    newEn: 'Created:',
    oldUr: 'تم الإنشاء:',
    newUr: 'تخلیق شدہ:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.createTrip',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تعذر إنشاء الرحلة لانتهاك قواعد التحقق المعمارية: ${validation.blockingError}',
    oldEn: 'تعذر إنشاء الTrip لانتهاك قواعد التحقق المعمارية: ${validation.blockingError}',
    newEn: 'Unable to create trip due to architectural validation violation: ${validation.blockingError}',
    oldUr: 'تعذر إنشاء الٹرپ لانتهاك قواعد التحقق المعمارية: ${validation.blockingError}',
    newUr: 'آرکیٹیکچرل تصدیقی قواعد کی خلاف ورزی کے باعث ٹرپ بنانا ممکن نہیں: ${validation.blockingError}',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.createTrip_2',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تم إنشاء أمر الرحلة واعتماد تسعير الرد والقواعد الستة',
    oldEn: 'تم إنشاء أمر الTrip واعتماد تسعير الرد والقواعد الستة',
    newEn: 'Trip order created, trip pricing approved, and six core rules enforced',
    oldUr: 'تم إنشاء أمر الٹرپ واعتماد تسعير الرد والقواعد الستة',
    newUr: 'ٹرپ کا آرڈر بنا دیا گیا، ٹرپ کی قیمت منظور کر دی گئی اور چھ بنیادی قواعد نافذ کر دیے گئے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.create_2',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تعذر إنشاء واعتماد الشحنة بمحطة التحميل: ${validation.blockingError}',
    oldEn: 'تعذر إنشاء واعتماد الشحنة بLoading Station: ${validation.blockingError}',
    newEn: 'Unable to create and approve shipment at loading station: ${validation.blockingError}',
    oldUr: 'تعذر إنشاء واعتماد الشحنة بLoading Station: ${validation.blockingError}',
    newUr: 'لوڈنگ اسٹیشن پر شپمنٹ بنانا اور منظور کرنا ممکن نہیں: ${validation.blockingError}',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.download',
    domain: 'trips',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تم التحميل (LOADED)',
    oldEn: 'تم التحميل (LOADED)',
    newEn: 'Loaded (LOADED)',
    oldUr: 'تم التحميل (LOADED)',
    newUr: 'لوڈ ہو گیا (LOADED)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.downloadTrips',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'انقر على أي سيناريو أدناه لتحميل بياناته فوراً وملاحظة سلوك محرك الرحلات في القبول أو الحظر:',
    oldEn: 'انقر على أي سيناريو أدناه لتحميل بياناته فوراً وملاحظة سلوك محرك Trips في القبول أو الحظر:',
    newEn: 'Click any scenario below to load its data immediately and observe the trip engine behavior in accepting or blocking:',
    oldUr: 'انقر على أي سيناريو أدناه لتحميل بياناته فوراً وملاحظة سلوك محرك ٹرپس في القبول أو الحظر:',
    newUr: 'اس کا ڈیٹا فوری لوڈ کرنے اور منظوری یا روک تھام میں ٹرپ انجن کا رویہ دیکھنے کے لیے نیچے دیے گئے کسی بھی منظر نامے پر کلک کریں:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.downloadWeighbridge',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'مشغل محطة التحميل والميزان',
    oldEn: 'مشغل Loading Station والميزان',
    newEn: 'Loading Station and Scale Operator',
    oldUr: 'مشغل Loading Station والميزان',
    newUr: 'لوڈنگ اسٹیشن اور وزنی پل آپریٹر',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.download_2',
    domain: 'trips',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تحميل واختبار السيناريو',
    oldEn: 'تحميل واختبار السيناريو',
    newEn: 'Load and Test Scenario',
    oldUr: 'تحميل واختبار السيناريو',
    newUr: 'منظر نامہ لوڈ اور ٹیسٹ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.download_3',
    domain: 'trips',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تحميل واختبار سيناريو الأمان الرقابي',
    oldEn: 'تحميل واختبار سيناريو الأمان الرقابي',
    newEn: 'Load and Test Regulatory Security Scenario',
    oldUr: 'تحميل واختبار سيناريو الأمان الرقابي',
    newUr: 'نگرانی کے سیکیورٹی منظر نامے کو لوڈ اور ٹیسٹ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.driver',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'السائق (driverId)',
    oldEn: 'Driver (driverId)',
    newEn: 'Driver (driverId)',
    oldUr: 'السائق (driverId)',
    newUr: 'ڈرائیور (driverId)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.driverDownload',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'مثال: محاولة السائق اعتماد التحميل أو الاستلام',
    oldEn: 'مثال: محاولة Driver اعتماد التحميل أو الاستلام',
    newEn: 'Example: Driver attempting to approve loading or receipt',
    oldUr: 'مثال: محاولة ڈرائیور اعتماد التحميل أو الاستلام',
    newUr: 'مثال: ڈرائیور کی طرف سے لوڈنگ یا وصولی کی منظوری کی کوشش',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.driverMaterial',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'السائق والمادة',
    oldEn: 'Driver والMaterial',
    newEn: 'Driver and Material',
    oldUr: 'ڈرائیور والMaterial',
    newUr: 'ڈرائیور اور مٹیریل',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'trips.labels.editTrip_2',
    domain: 'trips',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'لا يمكن تعديل حالة الرحلة لأنها مقفلة ومفوترة نهائياً',
    oldEn: 'لا يمكن تعديل حالة الTrip لأنها مقفلة ومفوترة نهائياً',
    newEn: 'Trip status cannot be edited because it is locked and finally invoiced',
    oldUr: 'لا يمكن تعديل حالة الٹرپ لأنها مقفلة ومفوترة نهائياً',
    newUr: 'ٹرپ کی حالت میں ترمیم نہیں کی جا سکتی کیونکہ یہ بند اور حتمی طور پر انوائس ہو چکی ہے',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Loading (15)
  {
    key: 'loading.labels.carrier_4',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'شاحنات أسطول الناقل التابعة للمشروع',
    oldEn: 'شاحنات أسطول Carrier التابعة لProject',
    newEn: 'Carrier fleet trucks assigned to the project',
    oldUr: 'شاحنات أسطول کیریئر التابعة لپروجیکٹ',
    newUr: 'پروجیکٹ سے منسلک کیریئر کے بیڑے کے ٹرکس',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.confirm',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تأكيد وترحيل الشحنة مع التحقق الخادومي المباشر',
    oldEn: 'Confirm وترحيل الشحنة مع التحقق الخادومي المباشر',
    newEn: 'Confirm and dispatch shipment with direct server-side verification',
    oldUr: 'تصدیق کریں وترحيل الشحنة مع التحقق الخادومي المباشر',
    newUr: 'براہ راست سرور کی توثیق کے ساتھ شپمنٹ کی تصدیق اور روانگی',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.confirm_4',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تسلسل المحرك بعد التأكيد:',
    oldEn: 'تسلسل المحرك بعد الConfirm:',
    newEn: 'Engine sequence after confirmation:',
    oldUr: 'تسلسل المحرك بعد التصدیق کریں:',
    newUr: 'تصدیق کے بعد انجن کی ترتیب:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.createTripDownload',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: ': إنشاء سجل الرحلة بحالة التحميل المبدئية.',
    oldEn: ': إنشاء سجل الTrip بحالة التحميل المبدئية.',
    newEn: ': Create trip record with initial loading status.',
    oldUr: ': إنشاء سجل الٹرپ بحالة التحميل المبدئية.',
    newUr: ': ابتدائی لوڈنگ کی حالت کے ساتھ ٹرپ ریکارڈ بنائیں۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.createTripStatusSave',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: ': إنشاء سجل الرحلة المبدئي بالحالة LOADED وحفظ Pricing Snapshot',
    oldEn: ': إنشاء سجل الTrip المبدئي بالحالة LOADED وحفظ Pricing Snapshot',
    newEn: ': Create initial trip record with LOADED status and save Pricing Snapshot',
    oldUr: ': إنشاء سجل الٹرپ المبدئي بالحالة LOADED وحفظ Pricing Snapshot',
    newUr: ': LOADED حالت کے ساتھ ابتدائی ٹرپ ریکارڈ بنائیں اور Pricing Snapshot محفوظ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.createTrip_2',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'محظور نظامياً: لا يمكن إنشاء رحلة Offline بدون بيانات تسعير معتمدة مسبقاً',
    oldEn: 'محظور نظامياً: لا يمكن إنشاء Trip Offline بدون بيانات Pricing معتمدة مسبقاً',
    newEn: 'System prohibited: Cannot create offline trip without pre-approved pricing data',
    oldUr: 'محظور نظامياً: لا يمكن إنشاء ٹرپ Offline بدون بيانات قیمت معتمدة مسبقاً',
    newUr: 'سسٹم کی رو سے ممنوع: پہلے سے منظور شدہ قیمت کے ڈیٹا کے بغیر آف لائن ٹرپ نہیں بنایا جا سکتا',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.downloadPricing',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'يعمل التحميل بدون اتصال: تتوفر Master Data وقاعدة التسعير محلياً. يتم الاحتساب والحفظ محلياً ثم الإدراج في Outbox.',
    oldEn: 'يعمل التحميل بدون اتصال: تتوفر Master Data وقاعدة الPricing محلياً. يتم الاحتساب والحفظ محلياً ثم الإدراج في Outbox.',
    newEn: 'Offline loading active: Master Data and pricing rules available locally. Calculation and saving occur locally, then queued in Outbox.',
    oldUr: 'يعمل التحميل بدون اتصال: تتوفر Master Data وقاعدة قیمت محلياً. يتم الاحتساب والحفظ محلياً ثم الإدراج في Outbox.',
    newUr: 'آف لائن لوڈنگ فعال ہے: Master Data اور قیمت کا اصول مقامی طور پر دستیاب ہے۔ حساب اور بچت مقامی طور پر ہوتی ہے اور پھر Outbox میں شامل کی جاتی ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.downloadPricing_2',
    domain: 'loading',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'تحميل مثال التسعير بالمقطوعية (120 SAR)',
    oldEn: 'تحميل مثال التسعير بالمقطوعية (120 SAR)',
    newEn: 'Load flat rate pricing example (120 SAR)',
    oldUr: 'تحميل مثال التسعير بالمقطوعية (120 SAR)',
    newUr: 'فلیٹ ریٹ کی قیمت کی مثال لوڈ کریں (120 SAR)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.downloadPricing_4',
    domain: 'loading',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'الخطوة 8: معاينة بطاقة التحميل والتسعير (Preview)',
    oldEn: 'الخطوة 8: معاينة بطاقة التحميل والتسعير (Preview)',
    newEn: 'Step 8: Preview Loading and Pricing Card',
    oldUr: 'الخطوة 8: معاينة بطاقة التحميل والتسعير (Preview)',
    newUr: 'مرحلہ 8: لوڈنگ اور قیمت کے کارڈ کا پیش نظارہ (Preview)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.downloadWeighbridge_2',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'محطة التحميل والميزان (Loading Station)',
    oldEn: 'Loading Station والميزان (Loading Station)',
    newEn: 'Loading and Weighbridge Station (Loading Station)',
    oldUr: 'Loading Station والميزان (Loading Station)',
    newUr: 'لوڈنگ اور وزنی پل اسٹیشن (Loading Station)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.drivers',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'السائقون المصرحون',
    oldEn: 'Drivers المصرحون',
    newEn: 'Authorized Drivers',
    oldUr: 'ڈرائیورز المصرحون',
    newUr: 'مجاز ڈرائیورز',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.driversCarrierTruck',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'السائقون المصرحون والمسجلون تحت الناقل والشاحنة',
    oldEn: 'Drivers المصرحون والمسجلون تحت Carrier والTruck',
    newEn: 'Authorized drivers registered under the carrier and truck',
    oldUr: 'ڈرائیورز المصرحون والمسجلون تحت کیریئر والٹرک',
    newUr: 'کیریئر اور ٹرک کے تحت رجسٹرڈ مجاز ڈرائیورز',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.edit',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'ممنوع تعديل قيمة التسوية من الواجهة',
    oldEn: 'ممنوع Edit قيمة التسوية من الواجهة',
    newEn: 'Editing settlement amount from user interface is strictly prohibited',
    oldUr: 'ممنوع ترمیم کریں قيمة التسوية من الواجهة',
    newUr: 'یوزر انٹرفیس سے سیٹلمنٹ کی رقم میں ترمیم کرنا سختی سے ممنوع ہے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.edit_2',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'حظر تعديل settlementAmount من الواجهة:',
    oldEn: 'حظر Edit settlementAmount من الواجهة:',
    newEn: 'Prohibit editing settlementAmount from user interface:',
    oldUr: 'حظر ترمیم کریں settlementAmount من الواجهة:',
    newUr: 'یوزر انٹرفیس سے settlementAmount میں ترمیم پر پابندی:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'loading.labels.material_3',
    domain: 'loading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'كود المادة:',
    oldEn: 'كود الMaterial:',
    newEn: 'Material Code:',
    oldUr: 'كود Material:',
    newUr: 'مٹیریل کوڈ:',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Unloading (15)
  {
    key: 'unloading.labels.create',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إنشاء كائن استثناء رسمي (TripExceptionEntity) حقيقي وليس مجرد لون واجهة',
    oldEn: 'إنشاء كائن استثناء رسمي (TripExceptionEntity) حقيقي وليس مجرد لون واجهة',
    newEn: 'Create an authentic formal exception object (TripExceptionEntity), not just a UI color state',
    oldUr: 'إنشاء كائن استثناء رسمي (TripExceptionEntity) حقيقي وليس مجرد لون واجهة',
    newUr: 'ایک حقیقی باضابطہ استثنائی آبجیکٹ (TripExceptionEntity) بنائیں، محض انٹرفیس کا رنگ نہیں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.location',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'هوية مستلم الموقع (unloaderId)',
    oldEn: 'هوية مستلم الLocation (unloaderId)',
    newEn: 'Site Receiver Identifier (unloaderId)',
    oldUr: 'هوية مستلم مقام (unloaderId)',
    newUr: 'سائٹ وصول کنندہ کی شناخت (unloaderId)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.location_2',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تمت مراجعة الفارق واحتساب نسبة رطوبة وتبخر طبيعية معتمدة من مدير الموقع',
    oldEn: 'تمت مراجعة الفارق واحتساب نسبة رطوبة وتبخر طبيعية معتمدة من مدير الLocation',
    newEn: 'Variance reviewed and natural moisture and evaporation rate approved by site manager accounted for',
    oldUr: 'تمت مراجعة الفارق واحتساب نسبة رطوبة وتبخر طبيعية معتمدة من مدير مقام',
    newUr: 'فرق کا جائزہ لیا گیا اور سائٹ مینیجر کی طرف سے منظور شدہ قدرتی نمی اور بخارات کے تناسب کا حساب لگایا گیا',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.location_4',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'القائم بالموقع',
    oldEn: 'القائم بLocation',
    newEn: 'Gross Weight at Site',
    oldUr: 'القائم بمقام',
    newUr: 'سائٹ پر مجموعی وزن',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.location_5',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الفارغ بالموقع',
    oldEn: 'الفارغ بLocation',
    newEn: 'Tare Weight at Site',
    oldUr: 'الفارغ بمقام',
    newUr: 'سائٹ پر خالی وزن',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.project',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'محطة التفريغ والاستلام بموقع المشروع (Unloading Station)',
    oldEn: 'محطة التفريغ والاستلام بموقع الProject (Unloading Station)',
    newEn: 'Unloading and Receiving Station at Project Site (Unloading Station)',
    oldUr: 'محطة التفريغ والاستلام بموقع پروجیکٹ (Unloading Station)',
    newUr: 'پروجیکٹ سائٹ پر ان لوڈنگ اور وصولی کا اسٹیشن (Unloading Station)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.project_2',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'مطلوب اعتماد مدير المشروع',
    oldEn: 'مطلوب اعتماد مدير Project',
    newEn: 'Project Manager approval required',
    oldUr: 'مطلوب اعتماد مدير پروجیکٹ',
    newUr: 'پروجیکٹ مینیجر کی منظوری درکار ہے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.refresh',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'سيتم التحديث',
    oldEn: 'سيتم الRefresh',
    newEn: 'Will be updated',
    oldUr: 'سیٹم ریفریش کریں',
    newUr: 'اپ ڈیٹ کر دیا جائے گا',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.refresh_2',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: '✓ حزم التحديث الذري الإلزامي للحقول الخمسة على السيرفر (Atomic Server Updates):',
    oldEn: '✓ حزم الRefresh الذري الإلزامي للحقول الخمسة على السيرفر (Atomic Server Updates):',
    newEn: '✓ Mandatory atomic server update batch for the five fields (Atomic Server Updates):',
    oldUr: '✓ حزم ریفریش کریں الذري الإلزامي للحقول الخمسة على السيرفر (Atomic Server Updates):',
    newUr: '✓ سرور پر پانچ فیلڈز کے لیے لازمی ایٹمی اپ ڈیٹ بیچ (Atomic Server Updates):',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.search',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'بحث وتحقق',
    oldEn: 'Search وتحقق',
    newEn: 'Search and Verify',
    oldUr: 'تلاش کریں وتحقق',
    newUr: 'تلاش اور تصدیق',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.searchCreate',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'فحص الامتثال لقواعد البحث الخادومي، حظر اللوحة، التدرج، وإنشاء كائنات الاستثناء',
    oldEn: 'فحص الامتثال لقواعد Search الخادومي، حظر اللوحة، التدرج، وإنشاء كائنات الاستثناء',
    newEn: 'Audit compliance with server search rules, license plate lockouts, escalation, and exception object creation',
    oldUr: 'فحص الامتثال لقواعد تلاش کریں الخادومي، حظر اللوحة، التدرج، وإنشاء كائنات الاستثناء',
    newUr: 'سرور سرچ کے قواعد، نمبر پلیٹ بلاک، تدریج اور استثنائی آبجیکٹس کی تخلیق کے ساتھ مطابقت کی جانچ',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.searchTrip',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'البحث والتعرف على الرحلة (Search & Identification)',
    oldEn: 'الSearch والتعرف على الTrip (Search & Identification)',
    newEn: 'Trip Search and Identification (Search & Identification)',
    oldUr: 'تلاش کریں والتعرف على الٹرپ (Search & Identification)',
    newUr: 'ٹرپ کی تلاش اور شناخت (Search & Identification)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.searchTrip_2',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'بانتظار البحث عن رحلة',
    oldEn: 'بانتظار Search عن Trip',
    newEn: 'Awaiting trip search',
    oldUr: 'بانتظار تلاش کریں عن ٹرپ',
    newUr: 'ٹرپ کی تلاش کا انتظار ہے',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.trip',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تم اختيار الرحلة المحددة: ${cand.tripSerial}',
    oldEn: 'تم اختيار الTrip المحددة: ${cand.tripSerial}',
    newEn: 'Selected designated trip: ${cand.tripSerial}',
    oldUr: 'تم اختيار الٹرپ المحددة: ${cand.tripSerial}',
    newUr: 'منتخب کردہ نامزد ٹرپ: ${cand.tripSerial}',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'unloading.labels.trip_2',
    domain: 'unloading',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'اشتراط صارم: لا تستخدم truckPlate وحده لتحديد الرحلة',
    oldEn: 'اشتراط صارم: لا تستخدم truckPlate وحده لتحديد الTrip',
    newEn: 'Strict requirement: Do not use truckPlate alone to identify the trip',
    oldUr: 'اشتراط صارم: لا تستخدم truckPlate وحده لتحديد الٹرپ',
    newUr: 'سخت شرط: ٹرپ کی شناخت کے لیے صرف truckPlate کا استعمال نہ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Weighbridge (15)
  {
    key: 'weighbridge.labels.addRefresh',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إضافة أو تحديث قاعدة تفاوت (Tolerance Rule)',
    oldEn: 'إضافة أو Refresh قاعدة تفاوت (Tolerance Rule)',
    newEn: 'Add or update tolerance rule (Tolerance Rule)',
    oldUr: 'شامل کریں أو ریفریش کریں قاعدة تفاوت (Tolerance Rule)',
    newUr: 'رواداری کا اصول شامل یا اپ ڈیٹ کریں (Tolerance Rule)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.cancel',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء وتراجع (Cancel)',
    oldEn: 'Cancel وتراجع (Cancel)',
    newEn: 'Cancel and revert (Cancel)',
    oldUr: 'منسوخ کریں وتراجع (Cancel)',
    newUr: 'منسوخ اور واپس کریں (Cancel)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.confirm',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'بانتظار تأكيد التحذيرات (WARNINGS_PENDING)',
    oldEn: 'بانتظار Confirm التحذيرات (WARNINGS_PENDING)',
    newEn: 'Awaiting warnings confirmation (WARNINGS_PENDING)',
    oldUr: 'بانتظار تصدیق کریں التحذيرات (WARNINGS_PENDING)',
    newUr: 'انتباہات کی تصدیق کا انتظار ہے (WARNINGS_PENDING)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.confirm_3',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تأكيد اعتماد صافي المصدر كصافي وصول (Audit Confirmation)',
    oldEn: 'Confirm Approval صافي Source كصافي وصول (Audit Confirmation)',
    newEn: 'Confirm approval of source net weight as arrival net weight (Audit Confirmation)',
    oldUr: 'تصدیق کریں منظوری صافي ماخذ كصافي وصول (Audit Confirmation)',
    newUr: 'ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر منظور کرنے کی تصدیق کریں (Audit Confirmation)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.confirm_4',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تأكيد واعتماد القرار الرقابي',
    oldEn: 'Confirm وApproval القرار الرقابي',
    newEn: 'Confirm and approve regulatory decision',
    oldUr: 'تصدیق کریں ومنظوری القرار الرقابي',
    newUr: 'نگرانی کے فیصلے کی تصدیق اور منظوری دیں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.details',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تفاصيل التقييم الخادومي:',
    oldEn: 'Details التقييم الخادومي:',
    newEn: 'Server-side evaluation details:',
    oldUr: 'تفصیلات التقييم الخادومي:',
    newUr: 'سرور سائیڈ جانچ کی تفصیلات:',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.download',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'calculateVariance: التحقق الإلزامي من (net > 0) لصافي التحميل',
    oldEn: 'calculateVariance: Verification الإلزامي من (net > 0) لصافي التحميل',
    newEn: 'calculateVariance: Mandatory verification of (net > 0) for loading net weight',
    oldUr: 'calculateVariance: تصدیق الإلزامي من (net > 0) لصافي التحميل',
    newUr: 'calculateVariance: لوڈنگ کے خالص وزن کے لیے (net > 0) کی لازمی توثیق',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.download_2',
    domain: 'weighbridge',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'صافي التحميل (loadedNet)',
    oldEn: 'صافي التحميل (loadedNet)',
    newEn: 'Loading Net Weight (loadedNet)',
    oldUr: 'صافي التحميل (loadedNet)',
    newUr: 'لوڈنگ کا خالص وزن (loadedNet)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.import',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'بروفايل متخصص لاستيراد تذاكر وسجلات ميزان البسكول عبر مسار الاستيراد الموحد (Unified Pipeline). يفصل بين المصدر التشغيلي (WEIGHBRIDGE) ومصدر الإدخال (Excel/CSV/Sheets/Drive).',
    oldEn: 'بروفايل متخصص لImport تذاكر وسجلات ميزان البسكول عبر مسار الImport الموحد (Unified Pipeline). يفصل بين Source التشغيلي (WEIGHBRIDGE) ومصدر الإدخال (Excel/CSV/Sheets/Drive).',
    newEn: 'Specialized profile for importing weighbridge tickets and logs via the Unified Pipeline. Separates operational source (WEIGHBRIDGE) from input source (Excel/CSV/Sheets/Drive).',
    oldUr: 'بروفايل متخصص لامپورٹ کریں تذاكر وسجلات ميزان البسكول عبر مسار الامپورٹ کریں الموحد (Unified Pipeline). يفصل بين ماخذ التشغيلي (WEIGHBRIDGE) ومصدر الإدخال (Excel/CSV/Sheets/Drive).',
    newUr: 'یونیفائیڈ پائپ لائن (Unified Pipeline) کے ذریعے وزنی پل کے ٹکٹوں اور لاگز کو درآمد کرنے کا خصوصی پروفائل۔ آپریشنل ماخذ (WEIGHBRIDGE) اور ان پٹ ماخذ (Excel/CSV/Sheets/Drive) کو الگ کرتا ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.importWeighbridge_2',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'يدعم مسار الاستيراد الموحد قراءة بيانات الميزان من ملفات CSV وExcel وتكامل Google Drive وSheets.',
    oldEn: 'يدعم مسار الImport الموحد قراءة بيانات الميزان من ملفات CSV وExcel وتكامل Google Drive وSheets.',
    newEn: 'Unified import pipeline supports reading scale data from CSV and Excel files as well as Google Drive and Sheets integrations.',
    oldUr: 'يدعم مسار الامپورٹ کریں الموحد قراءة بيانات الميزان من ملفات CSV وExcel وتكامل Google Drive وSheets.',
    newUr: 'یونیفائیڈ امپورٹ پائپ لائن CSV اور Excel فائلوں کے ساتھ ساتھ Google Drive اور Sheets کے انضمام سے وزنی پل کے ڈیٹا کو پڑھنے کی حمایت کرتی ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.importWeighbridge_3',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تنفيذ مسار استيراد الميزان وصولاً للمراجعة',
    oldEn: 'تنفيذ مسار Import الميزان وصولاً للمراجعة',
    newEn: 'Execute weighbridge import pipeline through to audit review',
    oldUr: 'تنفيذ مسار امپورٹ کریں الميزان وصولاً للمراجعة',
    newUr: 'آڈٹ جائزے تک وزنی پل کی درآمدی پائپ لائن کو مکمل کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.location',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'صافي الاستلام بالموقع (receivedNet) كجم',
    oldEn: 'صافي الاستلام بLocation (receivedNet) kg',
    newEn: 'Site Received Net Weight (receivedNet) kg',
    oldUr: 'صافي الاستلام بمقام (receivedNet) کلوگرام',
    newUr: 'سائٹ پر موصولہ خالص وزن (receivedNet) کلوگرام',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.pricing',
    domain: 'weighbridge',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'قاعدة التسعير (pricingRule) مفقودة أو غير محددة.',
    oldEn: 'قاعدة التسعير (pricingRule) مفقودة أو غير محددة.',
    newEn: 'Pricing rule (pricingRule) is missing or undefined.',
    oldUr: 'قاعدة التسعير (pricingRule) مفقودة أو غير محددة.',
    newUr: 'قیمت کا اصول (pricingRule) گم ہے یا متعین نہیں ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.save',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'حفظ القاعدة في محرك الأوزان',
    oldEn: 'Save القاعدة في Weight Engine',
    newEn: 'Save rule in Weight Engine',
    oldUr: 'محفوظ کریں القاعدة في وزن کا انجن',
    newUr: 'اصول کو وزن کے انجن میں محفوظ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'weighbridge.labels.trips',
    domain: 'weighbridge',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'عدد الرحلات المعتمدة:',
    oldEn: 'عدد Trips المعتمدة:',
    newEn: 'Approved Trips Count:',
    oldUr: 'عدد ٹرپس المعتمدة:',
    newUr: 'منظور شدہ ٹرپس کی تعداد:',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Projects (10)
  {
    key: 'carriers.labels.carrier_2',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تسجيل الناقل',
    oldEn: 'تسجيل Carrier',
    newEn: 'Register Carrier',
    oldUr: 'تسجيل کیریئر',
    newUr: 'کیریئر کی رجسٹریشن',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'carriers.labels.project_2',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'لا يوجد ناقلون مسجلون في المشروع حتى الآن.',
    oldEn: 'لا يوجد ناقلون مسجلون في Project حتى الآن.',
    newEn: 'No carriers registered in the project yet.',
    oldUr: 'لا يوجد ناقلون مسجلون في پروجیکٹ حتى الآن.',
    newUr: 'ابھی تک منصوبے میں کوئی کیریئر رجسٹرڈ نہیں ہے۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'carriers.labels.trucksPricing',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'معرف وحيد للربط مع الشاحنات وقواعد التسعير',
    oldEn: 'معرف وحيد للربط مع Trucks وقواعد التسعير',
    newEn: 'Unique identifier for linking with trucks and pricing rules',
    oldUr: 'معرف وحيد للربط مع ٹرکس وقواعد التسعير',
    newUr: 'ٹرکس اور قیمتوں کے قواعد سے منسلک کرنے کے لیے منفرد شناخت کنندہ',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'carriers.labels.txt_5a7969',
    domain: 'projects',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'أضف أول ناقل الآن',
    oldEn: 'أضف أول ناقل الآن',
    newEn: 'Add First Carrier Now',
    oldUr: 'أضف أول ناقل الآن',
    newUr: 'اب پہلا کیریئر شامل کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'carriers.labels.txt_6354e4',
    domain: 'projects',
    category: 'C',
    problemType: 'untranslated_fallback',
    ar: 'ترخيص هيئة النقل العامة (TGA)',
    oldEn: 'ترخيص هيئة النقل العامة (TGA)',
    newEn: 'Transport General Authority (TGA) License',
    oldUr: 'ترخيص هيئة النقل العامة (TGA)',
    newUr: 'ٹرانسپورٹ جنرل اتھارٹی (TGA) کا لائسنس',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'carriers.status.status',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تغيير الحالة (نشط / معطّل)',
    oldEn: 'تغيير Status (Active / معطّل)',
    newEn: 'Change Status (Active / Disabled)',
    oldUr: 'تغيير حالت (فعال / معطّل)',
    newUr: 'حالت تبدیل کریں (فعال / غیر فعال)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'entityResolution.labels.carrier_5',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الناقل غير مسجل في قائمة المقاولين المعتمدين للمشروع. هل ترغب في ترخيص هذا الناقل وإضافته للمشروع رسمياً؟',
    oldEn: 'Carrier غير مسجل في قائمة المقاولين المعتمدين للمشروع. هل ترغب في ترخيص هذا Carrier وإضافته للمشروع رسمياً؟',
    newEn: "The carrier is not registered in the project's approved contractor list. Do you want to authorize this carrier and officially add them to the project?",
    oldUr: 'کیریئر غير مسجل في قائمة المقاولين المعتمدين للمشروع. هل ترغب في ترخيص هذا کیریئر وإضافته للمشروع رسمياً؟',
    newUr: 'کیریئر پروجیکٹ کے منظور شدہ ٹھیکیداروں کی فہرست میں شامل نہیں ہے۔ کیا آپ اس کیریئر کو مجاز بنا کر سرکاری طور پر پروجیکٹ میں شامل کرنا چاہتے ہیں؟',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'entityResolution.labels.confirm',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'ℹ️ يوجد مرشح تقريبي (Possible Match)، يرجى التأكيد قبل الدمج.',
    oldEn: 'ℹ️ يوجد مرشح تقريبي (Possible Match)، يرجى الConfirm قبل الدمج.',
    newEn: 'ℹ️ Possible match found. Please confirm before merging.',
    oldUr: 'ℹ️ يوجد مرشح تقريبي (Possible Match)، يرجى التصدیق کریں قبل الدمج.',
    newUr: 'ℹ️ ممکنہ مماثلت موجود ہے، براہ کرم انضمام سے قبل تصدیق کریں۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'entityResolution.labels.details',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'تفاصيل المطابقة وتفسير الخوارزمية',
    oldEn: 'Details المطابقة وتفسير الخوارزمية',
    newEn: 'Matching Details and Algorithm Explanation',
    oldUr: 'تفصیلات المطابقة وتفسير الخوارزمية',
    newUr: 'مماثلت کی تفصیلات اور الگورتھم کی وضاحت',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'entityResolution.labels.driver',
    domain: 'projects',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'التحقق الصارم من التبعيات (الشاحنة للناقل، السائق للناقل، والترخيص في المشروع).',
    oldEn: 'التحقق الصارم من التبعيات (الTruck لCarrier، الDriver لCarrier، والترخيص في Project).',
    newEn: 'Strict validation of dependencies (truck to carrier, driver to carrier, and project authorization).',
    oldUr: 'التحقق الصارم من التبعيات (الٹرک لکیریئر، الڈرائیور لکیریئر، والترخيص في پروجیکٹ).',
    newUr: 'وابستگیوں کی سخت جانچ پڑتال (کیریئر کے لیے ٹرک، کیریئر کے لیے ڈرائیور، اور پروجیکٹ میں اجازت نامہ)۔',
    reviewStatus: 'REVIEW_REQUIRED'
  },

  // Offline (5)
  {
    key: 'offline.labels.add',
    domain: 'offline',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إضافة إلى الصفحة الرئيسية (Add to Home Screen)',
    oldEn: 'Add إلى الصفحة الرئيسية (Add to Home Screen)',
    newEn: 'Add to Home Screen',
    oldUr: 'شامل کریں إلى الصفحة الرئيسية (Add to Home Screen)',
    newUr: 'ہوم اسکرین میں شامل کریں (Add to Home Screen)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'offline.labels.cancel',
    domain: 'offline',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report)',
    oldEn: 'Cancel العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report)',
    newEn: 'Cancel local operation with logging of operational variance exception report (Exception Report)',
    oldUr: 'منسوخ کریں العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report)',
    newUr: 'آپریشنل فرق کے استثنائی رپورٹ (Exception Report) کے اندراج کے ساتھ مقامی آپریشن منسوخ کریں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'offline.labels.cancelTrip',
    domain: 'offline',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء أمر الرحلة لعدم صلاحية الكيان (Cancel Dispatch)',
    oldEn: 'Cancel أمر الTrip لعدم صلاحية الكيان (Cancel Dispatch)',
    newEn: 'Cancel trip dispatch due to invalid entity (Cancel Dispatch)',
    oldUr: 'منسوخ کریں أمر الٹرپ لعدم صلاحية الكيان (Cancel Dispatch)',
    newUr: 'ناقص شناخت کی وجہ سے ٹرپ آرڈر منسوخ کریں (Cancel Dispatch)',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'offline.labels.cancel_2',
    domain: 'offline',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'إلغاء ومراجعة لاحقاً',
    oldEn: 'Cancel ومراجعة لاحقاً',
    newEn: 'Cancel and review later',
    oldUr: 'منسوخ کریں ومراجعة لاحقاً',
    newUr: 'منسوخ کریں اور بعد میں جائزہ لیں',
    reviewStatus: 'REVIEW_REQUIRED'
  },
  {
    key: 'offline.labels.carrier',
    domain: 'offline',
    category: 'B',
    problemType: 'arabic_in_en',
    ar: 'الناقل الفعلي بالخادم: ${serverTruckConflict.serverCarrierName}',
    oldEn: 'Carrier الفعلي بالخادم: ${serverTruckConflict.serverCarrierName}',
    newEn: 'Actual carrier on server: ${serverTruckConflict.serverCarrierName}',
    oldUr: 'کیریئر الفعلي بالخادم: ${serverTruckConflict.serverCarrierName}',
    newUr: 'سرور پر اصل کیریئر: ${serverTruckConflict.serverCarrierName}',
    reviewStatus: 'REVIEW_REQUIRED'
  }
];

export function executeBlock58QualityExpansion() {
  console.log('======================================================');
  console.log(`🚀 Executing BLOCK 58 Quality Expansion (${block58Entries.length} entries)...`);
  console.log('======================================================');

  if (block58Entries.length !== 100) {
    throw new Error(`Expected exactly 100 entries, got ${block58Entries.length}`);
  }

  const enPath = path.resolve(process.cwd(), 'src/locales/en/index.ts');
  const urPath = path.resolve(process.cwd(), 'src/locales/ur/index.ts');
  const arPath = path.resolve(process.cwd(), 'src/locales/ar/index.ts');

  let enContent = fs.readFileSync(enPath, 'utf8');
  let urContent = fs.readFileSync(urPath, 'utf8');
  const arContent = fs.readFileSync(arPath, 'utf8');

  // Verify Arabic source has not been modified
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  let enReplacedCount = 0;
  let urReplacedCount = 0;

  for (const entry of block58Entries) {
    // 1. Validation checks
    if (arabicRegex.test(entry.newEn)) {
      throw new Error(`Accidental Arabic found in new EN for key ${entry.key}: "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newEn)) {
      throw new Error(`Hybrid morphology found in new EN for key ${entry.key}: "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newUr)) {
      throw new Error(`Hybrid morphology found in new UR for key ${entry.key}: "${entry.newUr}"`);
    }
    if (!entry.newEn.trim() || !entry.newUr.trim()) {
      throw new Error(`Empty value found for key ${entry.key}`);
    }

    // Interpolation parameter check
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
    const arParams = (entry.ar.match(paramRegex) || []).sort();
    const enParams = (entry.newEn.match(paramRegex) || []).sort();
    const urParams = (entry.newUr.match(paramRegex) || []).sort();

    if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
      throw new Error(`Parameter mismatch in EN for key ${entry.key}: AR=${arParams}, EN=${enParams}`);
    }
    if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
      throw new Error(`Parameter mismatch in UR for key ${entry.key}: AR=${arParams}, UR=${urParams}`);
    }

    // Replace in EN
    const escapedKey = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const enMatches = [...enContent.matchAll(enKeyRegex)];

    if (enMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in EN dictionary`);
    }

    const safeNewEn = entry.newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    enContent = enContent.replace(enKeyRegex, `$1'${safeNewEn}'$4`);
    enReplacedCount += enMatches.length;

    // Replace in UR
    const urKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const urMatches = [...urContent.matchAll(urKeyRegex)];

    if (urMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in UR dictionary`);
    }

    const safeNewUr = entry.newUr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    urContent = urContent.replace(urKeyRegex, `$1'${safeNewUr}'$4`);
    urReplacedCount += urMatches.length;
  }

  console.log(`Verified and replaced ${enReplacedCount} occurrences in EN.`);
  console.log(`Verified and replaced ${urReplacedCount} occurrences in UR.`);

  if (enReplacedCount < 100 || urReplacedCount < 100) {
    throw new Error(`Replacement count under 100! EN: ${enReplacedCount}, UR: ${urReplacedCount}`);
  }

  // Write updated files
  fs.writeFileSync(enPath, enContent, 'utf8');
  fs.writeFileSync(urPath, urContent, 'utf8');

  console.log('✅ Successfully updated src/locales/en/index.ts and src/locales/ur/index.ts');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('run-quality-expansion-block58')) {
  executeBlock58QualityExpansion();
}
