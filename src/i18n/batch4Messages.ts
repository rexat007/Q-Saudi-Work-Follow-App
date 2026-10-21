import { presentOperationalMessage, type OperationalTranslator } from './operationalMessages';
// Closed, observed presentation mappings. Never imported by services or used for decisions.
// Unknown and ambiguously interpolated data is returned verbatim.
export const batch4MessageTemplates: readonly { key: string; source: string }[] = [
{"key":"batch4.pricing.overlap_warning","source":"تحذير تضارب: {detail}"},
{"key":"batch4.pricing.overlap_warning","source":"Overlap warning: {detail}"},
{"key":"batch4.pricing.overlap_warning","source":"تداخل کی تنبیہ: {detail}"},
{"key":"batch4.service.project_id_required","source":"معرّف المشروع مطلوب لحل قاعدة التسعير"},
{"key":"batch4.service.project_id_required","source":"معرف المشروع مطلوب"},
{"key":"batch4.service.project_id_required","source":"Project identifier is required"},
{"key":"batch4.service.project_id_required","source":"پروجیکٹ کی شناخت ضروری ہے"},
{"key":"batch4.pricing_service.explicit_carrier_required","source":"يجب تحديد الناقل بشكل صريح ولا يسمح باتفاقية مجهولة الناقل"},
{"key":"batch4.pricing_service.explicit_carrier_required","source":"The carrier must be explicitly specified; an agreement with an unknown carrier is not allowed"},
{"key":"batch4.pricing_service.explicit_carrier_required","source":"نقل و حمل کمپنی واضح مقرر ہونی چاہیے؛ نامعلوم کمپنی کا معاہدہ مجاز نہیں"},
{"key":"batch4.pricing_service.trip_date_invalid","source":"تاريخ الرحلة غير محدد أو غير صالح"},
{"key":"batch4.pricing_service.trip_date_invalid","source":"The trip date is missing or invalid"},
{"key":"batch4.pricing_service.trip_date_invalid","source":"ٹرپ کی تاریخ غائب یا غلط ہے"},
{"key":"batch4.pricing_service.carrier_rules_missing","source":"لا توجد أي قواعد تسعير مسجلة للناقل [{value0}] في هذا المشروع"},
{"key":"batch4.pricing_service.carrier_rules_missing","source":"No pricing rules are registered for carrier [{value0}] in this project"},
{"key":"batch4.pricing_service.carrier_rules_missing","source":"اس پروجیکٹ میں کمپنی [{value0}] کے قیمت کے قواعد رجسٹر نہیں"},
{"key":"batch4.pricing_service.pricing_type_missing","source":"لا توجد تسعيرة للناقل [{value0}] بنوع التسعير المطلوب [{value1}]"},
{"key":"batch4.pricing_service.pricing_type_missing","source":"Carrier [{value0}] has no rate for the requested pricing type [{value1}]"},
{"key":"batch4.pricing_service.pricing_type_missing","source":"کمپنی [{value0}] کے لیے مطلوبہ قیمت کی قسم [{value1}] کا نرخ نہیں"},
{"key":"batch4.pricing_service.rules_inactive","source":"قواعد التسعير للناقل موجودة ولكنها معطلة أو مسودة (INACTIVE/DRAFT)"},
{"key":"batch4.pricing_service.rules_inactive","source":"Carrier pricing rules exist but are inactive or draft (INACTIVE/DRAFT)"},
{"key":"batch4.pricing_service.rules_inactive","source":"کمپنی کے قیمت کے قواعد موجود ہیں مگر غیر فعال یا مسودہ ہیں (INACTIVE/DRAFT)"},
{"key":"batch4.pricing_service.rule_expired","source":"تسعيرة الناقل منتهية الصلاحية بتاريخ {value0} (تاريخ الرحلة: {value1})"},
{"key":"batch4.pricing_service.rule_expired","source":"The carrier rate expired on {value0} (trip date: {value1})"},
{"key":"batch4.pricing_service.rule_expired","source":"کمپنی کے نرخ کی مدت {value0} کو ختم ہوئی (ٹرپ کی تاریخ: {value1})"},
{"key":"batch4.pricing_service.rule_future","source":"تسعيرة الناقل تبدأ بتاريخ مستقبلي [{value0}] وتاريخ الرحلة [{value1}] سابق لها"},
{"key":"batch4.pricing_service.rule_future","source":"The carrier rate starts on [{value0}], after the trip date [{value1}]"},
{"key":"batch4.pricing_service.rule_future","source":"کمپنی کا نرخ [{value0}] سے شروع ہوتا ہے، جو ٹرپ کی تاریخ [{value1}] کے بعد ہے"},
{"key":"batch4.pricing_service.trip_outside_window","source":"تاريخ الرحلة [{value0}] خارج النطاق الزمني لسريان تسعيرة الناقل"},
{"key":"batch4.pricing_service.trip_outside_window","source":"Trip date [{value0}] is outside the carrier rate's effective period"},
{"key":"batch4.pricing_service.trip_outside_window","source":"ٹرپ کی تاریخ [{value0}] کمپنی کے نرخ کی نافذ مدت سے باہر ہے"},
{"key":"batch4.pricing_service.material_rate_missing","source":"لا توجد تسعيرة متوافقة مع المادة [{value0}] للناقل المحدد في هذا التاريخ"},
{"key":"batch4.pricing_service.material_rate_missing","source":"No rate matches material [{value0}] for the selected carrier on this date"},
{"key":"batch4.pricing_service.material_rate_missing","source":"اس تاریخ پر منتخب کمپنی کے مواد [{value0}] سے کوئی نرخ مطابق نہیں"},
{"key":"batch4.pricing_service.ambiguous_rules","source":"يوجد أكثر من قاعدة تسعير متداخلة سارية لنفس الناقل والمادة في هذا التاريخ ({value0})"},
{"key":"batch4.pricing_service.ambiguous_rules","source":"Multiple active pricing rules overlap for this carrier and material on this date ({value0})"},
{"key":"batch4.pricing_service.ambiguous_rules","source":"اس تاریخ پر اس کمپنی اور مواد کے متعدد فعال قیمت کے قواعد متداخل ہیں ({value0})"},
{"key":"batch4.pricing_service.rule_resolved","source":"تم تحديد قاعدة التسعير التعاقدية بنجاح وبشكل حتمي"},
{"key":"batch4.pricing_service.rule_resolved","source":"The contractual pricing rule was resolved successfully and deterministically"},
{"key":"batch4.pricing_service.rule_resolved","source":"معاہداتی قیمت کے قاعدے کا تعین کامیابی سے قطعی طور پر ہوا"},
{"key":"batch4.pricing_service.rule_query_failed","source":"خطأ أثناء استعلام قواعد التسعير: {value0}"},
{"key":"batch4.pricing_service.rule_query_failed","source":"Failed to query pricing rules: {value0}"},
{"key":"batch4.pricing_service.rule_query_failed","source":"قیمت کے قواعد کی درخواست ناکام ہوئی: {value0}"},
{"key":"batch4.pricing_service.settlement_pending","source":"التسوية معلقة بانتظار اعتماد عقد التسعير"},
{"key":"batch4.pricing_service.settlement_pending","source":"Settlement is pending approval of the pricing contract"},
{"key":"batch4.pricing_service.settlement_pending","source":"تصفیہ قیمت کے معاہدے کی منظوری کا منتظر ہے"},
{"key":"batch4.pricing_service.per_trip_formula","source":"تسعيرة مقطوعة بالرد: {value0} {value1} × {value2} رد = {value3} {value4}"},
{"key":"batch4.pricing_service.per_trip_formula","source":"Flat trip rate: {value0} {value1} × {value2} trips = {value3} {value4}"},
{"key":"batch4.pricing_service.per_trip_formula","source":"مقررہ فی ٹرپ کرایہ: {value0} {value1} × {value2} ٹرپس = {value3} {value4}"},
{"key":"batch4.pricing_service.billable_weight_pending","source":"بانتظار احتساب الوزن المعتمد للفوترة بالطن (السعر المتفق عليه: {value0} {value1}/طن)"},
{"key":"batch4.pricing_service.billable_weight_pending","source":"Awaiting approved billable weight in tons (agreed rate: {value0} {value1}/ton)"},
{"key":"batch4.pricing_service.billable_weight_pending","source":"ٹن میں منظور شدہ قابل بل وزن کا انتظار (متفقہ نرخ: {value0} {value1}/ٹن)"},
{"key":"batch4.pricing_service.per_ton_formula","source":"حساب صافي بالوزن: {value0} طن × {value1} {value2}/طن = {value3} {value4}"},
{"key":"batch4.pricing_service.per_ton_formula","source":"Net-weight calculation: {value0} tons × {value1} {value2}/ton = {value3} {value4}"},
{"key":"batch4.pricing_service.per_ton_formula","source":"خالص وزن کا حساب: {value0} ٹن × {value1} {value2}/ٹن = {value3} {value4}"},
{"key":"batch4.pricing_service.rule_id_required","source":"معرّف قاعدة التسعير مطلوب"},
{"key":"batch4.pricing_service.rule_id_required","source":"Pricing rule identifier is required"},
{"key":"batch4.pricing_service.rule_id_required","source":"قیمت کے قاعدے کی شناخت ضروری ہے"},
{"key":"batch4.service.project_id_required","source":"معرّف المشروع مطلوب"},
{"key":"batch4.pricing_service.explicit_carrier_required","source":"يجب تحديد الناقل المتعاقد معه صراحة ولا يسمح باتفاقية مجهولة الناقل"},
{"key":"batch4.pricing_service.pricing_model_invalid","source":"نموذج التسعير غير معتمد في المنظومة (يجب أن يكون PER_TON أو PER_TRIP)"},
{"key":"batch4.pricing_service.pricing_model_invalid","source":"The pricing model is unsupported (must be PER_TON or PER_TRIP)"},
{"key":"batch4.pricing_service.pricing_model_invalid","source":"قیمت کا ماڈل غیر معاون ہے (PER_TON یا PER_TRIP ضروری ہے)"},
{"key":"batch4.pricing_service.rate_positive","source":"سعر التعرفة يجب أن يكون رقمًا موجبًا أكبر من الصفر"},
{"key":"batch4.pricing_service.rate_positive","source":"The tariff rate must be a positive number greater than zero"},
{"key":"batch4.pricing_service.rate_positive","source":"کرایے کا نرخ صفر سے زیادہ مثبت عدد ہونا چاہیے"},
{"key":"batch4.pricing_service.currency_invalid","source":"رمز العملة غير صالح أو مفقود"},
{"key":"batch4.pricing_service.currency_invalid","source":"The currency code is invalid or missing"},
{"key":"batch4.pricing_service.currency_invalid","source":"کرنسی کا کوڈ غلط یا غائب ہے"},
{"key":"batch4.pricing_service.effective_start_required","source":"تاريخ بدء سريان التسعيرة مطلوب"},
{"key":"batch4.pricing_service.effective_start_required","source":"The rate's effective start date is required"},
{"key":"batch4.pricing_service.effective_start_required","source":"نرخ کی نافذ ہونے کی ابتدائی تاریخ ضروری ہے"},
{"key":"batch4.pricing_service.effective_start_invalid","source":"تاريخ بدء السريان غير صالح"},
{"key":"batch4.pricing_service.effective_start_invalid","source":"The effective start date is invalid"},
{"key":"batch4.pricing_service.effective_start_invalid","source":"نافذ ہونے کی ابتدائی تاریخ غلط ہے"},
{"key":"batch4.pricing_service.effective_end_invalid","source":"تاريخ نهاية السريان غير صالح"},
{"key":"batch4.pricing_service.effective_end_invalid","source":"The effective end date is invalid"},
{"key":"batch4.pricing_service.effective_end_invalid","source":"نافذ ہونے کی اختتامی تاریخ غلط ہے"},
{"key":"batch4.pricing_service.end_before_start","source":"تاريخ نهاية السريان يجب أن يكون لاحقًا لتاريخ البداية أو مساويًا له"},
{"key":"batch4.pricing_service.end_before_start","source":"The effective end date must be on or after the start date"},
{"key":"batch4.pricing_service.end_before_start","source":"نافذ ہونے کی اختتامی تاریخ ابتدائی تاریخ یا اس کے بعد ہونی چاہیے"},
{"key":"batch4.pricing_service.demurrage_nonnegative","source":"سعر غرامة التأخير يجب أن يكون قيمة موجبة أو صفر"},
{"key":"batch4.pricing_service.demurrage_nonnegative","source":"The waiting penalty rate must be positive or zero"},
{"key":"batch4.pricing_service.demurrage_nonnegative","source":"انتظار کے جرمانے کا نرخ مثبت یا صفر ہونا چاہیے"},
{"key":"batch4.pricing_service.rule_overlap","source":"يوجد تداخل زمني مع قاعدة تسعير سارية لنفس الناقل والمادة ({value0}) للفترة [{value1} - {value2}]"},
{"key":"batch4.pricing_service.rule_overlap","source":"An active rule overlaps for the same carrier and material ({value0}) during [{value1} - {value2}]"},
{"key":"batch4.pricing_service.rule_overlap","source":"اسی کمپنی اور مواد کا فعال قاعدہ ({value0}) مدت [{value1} - {value2}] میں متداخل ہے"},
{"key":"batch4.service.required_field_blocks","source":"حقل إلزامي مفقود يمنع الاعتماد"},
{"key":"batch4.service.required_field_blocks","source":"A missing required field prevents approval"},
{"key":"batch4.service.required_field_blocks","source":"لازمی فیلڈ کی عدم موجودگی منظوری روکتی ہے"},
{"key":"batch4.service.nonstandard_field_warning","source":"تنبيه: صيغة الحقل غير قياسية ولكن مقبولة مع التحذير"},
{"key":"batch4.service.nonstandard_field_warning","source":"Warning: the field format is nonstandard but acceptable with a warning"},
{"key":"batch4.service.nonstandard_field_warning","source":"تنبیہ: فیلڈ کی صورت غیر معیاری ہے مگر تنبیہ کے ساتھ قابل قبول ہے"},
{"key":"batch4.service.duplicate_in_batch","source":"تكرار داخل نفس دفعة الاستيراد للمفتاح ({value0})"},
{"key":"batch4.service.duplicate_in_batch","source":"Duplicate within the import batch for key ({value0})"},
{"key":"batch4.service.duplicate_in_batch","source":"درآمدی بیچ میں کلید ({value0}) کی نقل"},
{"key":"batch4.service.key_already_in_database","source":"المفتاح ({value0}) مسجل مسبقاً في قاعدة البيانات"},
{"key":"batch4.service.key_already_in_database","source":"Key ({value0}) already exists in the database"},
{"key":"batch4.service.key_already_in_database","source":"کلید ({value0}) ڈیٹا بیس میں پہلے سے موجود ہے"},
{"key":"batch4.service.row_missing","source":"الصف #{value0} غير موجود في الدفعة"},
{"key":"batch4.service.row_missing","source":"Row #{value0} is not in the batch"},
{"key":"batch4.service.row_missing","source":"قطار #{value0} بیچ میں موجود نہیں"},
{"key":"batch4.service.carrier_not_registered","source":"الناقل ({value0}) غير مسجل في السجلات المعتمدة للمشروع."},
{"key":"batch4.service.carrier_not_registered","source":"Carrier ({value0}) is not registered in the project's approved records."},
{"key":"batch4.service.carrier_not_registered","source":"نقل و حمل کمپنی ({value0}) پروجیکٹ کے منظور شدہ ریکارڈ میں رجسٹر نہیں۔"},
{"key":"batch4.service.truck_not_registered","source":"الشاحنة / اللوحة ({value0}) غير مسجلة في سجلات أسطول المشروع."},
{"key":"batch4.service.truck_not_registered","source":"Truck / plate ({value0}) is not registered in the project fleet."},
{"key":"batch4.service.truck_not_registered","source":"ٹرک / پلیٹ ({value0}) پروجیکٹ کے بیڑے میں رجسٹر نہیں۔"},
{"key":"batch4.service.driver_not_registered","source":"السائق ({value0}) غير مسجل في قاعدة بيانات السائقين للمشروع."},
{"key":"batch4.service.driver_not_registered","source":"Driver ({value0}) is not registered in the project's driver records."},
{"key":"batch4.service.driver_not_registered","source":"ڈرائیور ({value0}) پروجیکٹ کے ڈرائیور ریکارڈ میں رجسٹر نہیں۔"},
{"key":"batch4.service.material_not_registered","source":"المادة ({value0}) غير مسجلة في قائمة المواد المعتمدة للمشروع."},
{"key":"batch4.service.material_not_registered","source":"Material ({value0}) is not registered in the project's approved materials."},
{"key":"batch4.service.material_not_registered","source":"مواد ({value0}) پروجیکٹ کے منظور شدہ مواد میں رجسٹر نہیں۔"},
{"key":"batch4.service.ticket_required","source":"رقم تذكرة الميزان إلزامي لاعتماد بيانات الميزان."},
{"key":"batch4.service.ticket_required","source":"A weighbridge ticket number is required to approve weighbridge data."},
{"key":"batch4.service.ticket_required","source":"کانٹے کا ڈیٹا منظور کرنے کے لیے ٹکٹ نمبر ضروری ہے۔"},
{"key":"batch4.service.truck_required","source":"رقم لوحة / تعريف الشاحنة إلزامي لاعتماد بيانات الميزان."},
{"key":"batch4.service.truck_required","source":"A truck number / plate is required to approve weighbridge data."},
{"key":"batch4.service.truck_required","source":"کانٹے کا ڈیٹا منظور کرنے کے لیے ٹرک نمبر / پلیٹ ضروری ہے۔"},
{"key":"batch4.service.weigh_date_required","source":"تاريخ عملية الوزن إلزامي لاعتماد بيانات الميزان."},
{"key":"batch4.service.weigh_date_required","source":"The weighing date is required to approve weighbridge data."},
{"key":"batch4.service.weigh_date_required","source":"کانٹے کا ڈیٹا منظور کرنے کے لیے وزن کی تاریخ ضروری ہے۔"},
{"key":"batch4.service.tare_required","source":"وزن الفارغ إلزامي لاعتماد بيانات الميزان."},
{"key":"batch4.service.tare_required","source":"Tare weight is required to approve weighbridge data."},
{"key":"batch4.service.tare_required","source":"کانٹے کا ڈیٹا منظور کرنے کے لیے خالی وزن ضروری ہے۔"},
{"key":"batch4.service.gross_required","source":"وزن القائم إلزامي لاعتماد بيانات الميزان."},
{"key":"batch4.service.gross_required","source":"Gross weight is required to approve weighbridge data."},
{"key":"batch4.service.gross_required","source":"کانٹے کا ڈیٹا منظور کرنے کے لیے مجموعی وزن ضروری ہے۔"},
{"key":"batch4.service.ticket_or_plate_required","source":"بيانات التعريف مفقودة: يجب توفر رقم التذكرة أو رقم اللوحة على الأقل."},
{"key":"batch4.service.ticket_or_plate_required","source":"Identification is missing: at least a ticket number or plate number is required."},
{"key":"batch4.service.ticket_or_plate_required","source":"شناخت غائب ہے: کم از کم ٹکٹ نمبر یا پلیٹ نمبر ضروری ہے۔"},
{"key":"batch4.service.tare_not_numeric","source":"الوزن الفارغ غير صالح (قيمة رقمية غير صحيحة)"},
{"key":"batch4.service.tare_not_numeric","source":"Tare weight is invalid (not a valid number)"},
{"key":"batch4.service.tare_not_numeric","source":"خالی وزن غلط ہے (درست عدد نہیں)"},
{"key":"batch4.service.tare_positive","source":"الوزن الفارغ يجب أن يكون أكبر من الصفر"},
{"key":"batch4.service.tare_positive","source":"Tare weight must be greater than zero"},
{"key":"batch4.service.tare_positive","source":"خالی وزن صفر سے زیادہ ہونا چاہیے"},
{"key":"batch4.service.gross_not_numeric","source":"الوزن الإجمالي/القائم غير صالح (قيمة رقمية غير صحيحة)"},
{"key":"batch4.service.gross_not_numeric","source":"Gross weight is invalid (not a valid number)"},
{"key":"batch4.service.gross_not_numeric","source":"مجموعی وزن غلط ہے (درست عدد نہیں)"},
{"key":"batch4.service.gross_positive","source":"الوزن الإجمالي لا يمكن أن يكون سالباً أو صفراً"},
{"key":"batch4.service.gross_positive","source":"Gross weight cannot be negative or zero"},
{"key":"batch4.service.gross_positive","source":"مجموعی وزن منفی یا صفر نہیں ہو سکتا"},
{"key":"batch4.service.net_not_numeric","source":"الوزن الصافي غير صالح (قيمة رقمية غير صحيحة)"},
{"key":"batch4.service.net_not_numeric","source":"Net weight is invalid (not a valid number)"},
{"key":"batch4.service.net_not_numeric","source":"خالص وزن غلط ہے (درست عدد نہیں)"},
{"key":"batch4.service.net_nonnegative","source":"الوزن الصافي لا يمكن أن يكون سالباً"},
{"key":"batch4.service.net_nonnegative","source":"Net weight cannot be negative"},
{"key":"batch4.service.net_nonnegative","source":"خالص وزن منفی نہیں ہو سکتا"},
{"key":"batch4.service.gross_below_tare","source":"مخالفة فيزيائية حتمية للميزان: الوزن القائم ({value0} كجم) أقل من الوزن الفارغ ({value1} كجم)."},
{"key":"batch4.service.gross_below_tare","source":"Physical weighbridge violation: gross weight ({value0} kg) is less than tare weight ({value1} kg)."},
{"key":"batch4.service.gross_below_tare","source":"کانٹے کی طبعی خلاف ورزی: مجموعی وزن ({value0} کلوگرام) خالی وزن ({value1} کلوگرام) سے کم ہے۔"},
{"key":"batch4.service.net_calculation_mismatch","source":"الوزن الصافي المسجل في التذكرة ({value0} كجم) يختلف عن الصافي المحسوب (القائم {value1} - الفارغ {value2} = {value3} كجم) بفارق {value4} كجم."},
{"key":"batch4.service.net_calculation_mismatch","source":"Ticket net weight ({value0} kg) differs from calculated net weight (gross {value1} - tare {value2} = {value3} kg) by {value4} kg."},
{"key":"batch4.service.net_calculation_mismatch","source":"ٹکٹ کا خالص وزن ({value0} کلوگرام) حسابی خالص وزن (مجموعی {value1} - خالی {value2} = {value3} کلوگرام) سے {value4} کلوگرام مختلف ہے۔"},
{"key":"batch4.service.invalid_date_format","source":"صيغة التاريخ غير صالحة ({value0}). يجب أن تكون YYYY-MM-DD."},
{"key":"batch4.service.invalid_date_format","source":"Invalid date format ({value0}). Expected YYYY-MM-DD."},
{"key":"batch4.service.invalid_date_format","source":"تاریخ کی صورت غلط ہے ({value0})۔ مطلوبہ صورت YYYY-MM-DD ہے۔"},
{"key":"batch4.service.driver_missing_warning","source":"اسم السائق غير مدخل. يمكن قبول الشحنة بدون سائق محدد كتحذير."},
{"key":"batch4.service.driver_missing_warning","source":"No driver name was entered. The shipment may be accepted without a specific driver, with a warning."},
{"key":"batch4.service.driver_missing_warning","source":"ڈرائیور کا نام درج نہیں۔ کھیپ کسی مخصوص ڈرائیور کے بغیر تنبیہ کے ساتھ قبول ہو سکتی ہے۔"},
{"key":"batch4.service.unload_missing_warning","source":"بيانات وزن الوصول/التفريغ غير متوفرة. تم قبول الصف كشحنة محملة من الميزان."},
{"key":"batch4.service.unload_missing_warning","source":"Arrival / unloading weights are unavailable. The row was accepted as a shipment loaded from the weighbridge."},
{"key":"batch4.service.unload_missing_warning","source":"آمد / ان لوڈنگ کے اوزان دستیاب نہیں۔ قطار کو کانٹے سے لوڈ شدہ کھیپ کے طور پر قبول کیا گیا۔"},
{"key":"batch4.service.truck_not_approved","source":"الشاحنة / اللوحة ({value0}) غير مسجلة في السجلات المعتمدة للمشروع."},
{"key":"batch4.service.truck_not_approved","source":"Truck / plate ({value0}) is not registered in the project's approved records."},
{"key":"batch4.service.truck_not_approved","source":"ٹرک / پلیٹ ({value0}) پروجیکٹ کے منظور شدہ ریکارڈ میں رجسٹر نہیں۔"},
{"key":"batch4.service.truck_carrier_conflict","source":"تعارض في العلاقة: الشاحنة ({value0}) مرتبطة في السجلات بالناقل ({value1}) بينما السجل الوارد ينسبها للناقل ({value2})."},
{"key":"batch4.service.truck_carrier_conflict","source":"Relationship conflict: truck ({value0}) belongs to carrier ({value1}) in master records, but the incoming row assigns it to carrier ({value2})."},
{"key":"batch4.service.truck_carrier_conflict","source":"ربط میں تعارض: مرکزی ریکارڈ میں ٹرک ({value0}) نقل و حمل کمپنی ({value1}) کا ہے، مگر آنے والی قطار اسے کمپنی ({value2}) سے منسوب کرتی ہے۔"},
{"key":"batch4.service.truck_carrier_missing","source":"تم التعرف على الشاحنة ({value0}) ولكن بيان الناقل مفقود من السجل الوارد. يمنع تخمين الناقل تلقائياً."},
{"key":"batch4.service.truck_carrier_missing","source":"Truck ({value0}) was identified, but the incoming row has no carrier. Automatic carrier guessing is prohibited."},
{"key":"batch4.service.truck_carrier_missing","source":"ٹرک ({value0}) شناخت ہو گیا مگر آنے والی قطار میں نقل و حمل کمپنی نہیں۔ خودکار اندازہ ممنوع ہے۔"},
{"key":"batch4.service.driver_carrier_conflict","source":"تعارض كفالة السائق: السائق ({value0}) مرتبط بالناقل ({value1}) بينما السجل الوارد ينسبه للناقل ({value2})."},
{"key":"batch4.service.driver_carrier_conflict","source":"Driver-carrier conflict: driver ({value0}) belongs to carrier ({value1}), but the incoming row assigns the driver to carrier ({value2})."},
{"key":"batch4.service.driver_carrier_conflict","source":"ڈرائیور اور کمپنی میں تعارض: ڈرائیور ({value0}) کمپنی ({value1}) سے منسلک ہے مگر آنے والی قطار اسے کمپنی ({value2}) سے منسوب کرتی ہے۔"},
{"key":"batch4.service.material_not_authorized","source":"المادة ({value0}) غير مصرح بها أو غير معتمدة ضمن نطاق هذا المشروع ({value1})."},
{"key":"batch4.service.material_not_authorized","source":"Material ({value0}) is not permitted or approved for this project ({value1})."},
{"key":"batch4.service.material_not_authorized","source":"مواد ({value0}) اس پروجیکٹ ({value1}) کے لیے مجاز یا منظور شدہ نہیں۔"},
{"key":"batch4.service.legacy_variance_mismatch","source":"فارق الوزن المسجل بالشيت القديم ({value0} كجم) يختلف عن الفارق المحسوب بين الصافي وصافي الوصول ({value1} كجم) بفارق {value2} كجم."},
{"key":"batch4.service.legacy_variance_mismatch","source":"Legacy sheet variance ({value0} kg) differs from variance calculated from net and destination weights ({value1} kg) by {value2} kg."},
{"key":"batch4.service.legacy_variance_mismatch","source":"پرانی شیٹ کا وزنی فرق ({value0} کلوگرام)، خالص اور منزل کے وزن سے حساب کردہ فرق ({value1} کلوگرام) سے {value2} کلوگرام مختلف ہے۔"},
{"key":"batch4.service.unknown_legacy_status","source":"حالة الرحلة في الشيت القديم ({value0}) غير معروفة وتتطلب مراجعة."},
{"key":"batch4.service.unknown_legacy_status","source":"Legacy trip status ({value0}) is unknown and requires review."},
{"key":"batch4.service.unknown_legacy_status","source":"پرانے ٹرپ کی حالت ({value0}) نامعلوم ہے اور جائزہ ضروری ہے۔"},
{"key":"batch4.service.duplicate_file_row","source":"تكرار داخل نفس الملف مع الصف رقم ({value0}) للمفتاح ({value1})"},
{"key":"batch4.service.duplicate_file_row","source":"Duplicate in the same file with row ({value0}) for key ({value1})"},
{"key":"batch4.service.duplicate_file_row","source":"اسی فائل میں قطار ({value0}) کے ساتھ کلید ({value1}) کی نقل"},
{"key":"batch4.service.key_exists_system","source":"المفتاح ({value0}) مسجل مسبقاً في قاعدة بيانات النظام"},
{"key":"batch4.service.key_exists_system","source":"Key ({value0}) is already registered in the system database"},
{"key":"batch4.service.key_exists_system","source":"کلید ({value0}) نظام کے ڈیٹا بیس میں پہلے سے رجسٹر ہے"},
{"key":"batch4.service.user_context_missing","source":"UNAUTHENTICATED: سياق المستخدم مفقود"},
{"key":"batch4.service.user_context_missing","source":"UNAUTHENTICATED: user context is missing"},
{"key":"batch4.service.user_context_missing","source":"UNAUTHENTICATED: صارف کا سیاق غائب ہے"},
{"key":"batch4.service.http_failure","source":"فشل الاتصال بالخادم HTTP {value0}"},
{"key":"batch4.service.http_failure","source":"Server connection failed: HTTP {value0}"},
{"key":"batch4.service.http_failure","source":"سرور کا رابطہ ناکام: HTTP {value0}"},
{"key":"batch4.service.approved_carrier_required","source":"معرف الناقل المعتمد مطلوب"},
{"key":"batch4.service.approved_carrier_required","source":"An approved carrier identifier is required"},
{"key":"batch4.service.approved_carrier_required","source":"منظور شدہ نقل و حمل کمپنی کی شناخت ضروری ہے"},
{"key":"batch4.service.approved_truck_required","source":"معرف الشاحنة المعتمد مطلوب"},
{"key":"batch4.service.approved_truck_required","source":"An approved truck identifier is required"},
{"key":"batch4.service.approved_truck_required","source":"منظور شدہ ٹرک کی شناخت ضروری ہے"},
{"key":"batch4.service.approved_driver_required","source":"معرف السائق المعتمد مطلوب"},
{"key":"batch4.service.approved_driver_required","source":"An approved driver identifier is required"},
{"key":"batch4.service.approved_driver_required","source":"منظور شدہ ڈرائیور کی شناخت ضروری ہے"},
{"key":"batch4.service.approved_material_required","source":"معرف المادة المعتمد مطلوب"},
{"key":"batch4.service.approved_material_required","source":"An approved material identifier is required"},
{"key":"batch4.service.approved_material_required","source":"منظور شدہ مواد کی شناخت ضروری ہے"},
{"key":"batch4.service.entity_review_required","source":"يجب مراجعة مطابقة الكيانات أولاً لهذا الصف"},
{"key":"batch4.service.entity_review_required","source":"Review entity matching for this row first"},
{"key":"batch4.service.entity_review_required","source":"پہلے اس قطار کی اکائیوں کی مطابقت کا جائزہ لیں"},
{"key":"batch4.service.row_server_save_failed","source":"فشل حفظ الرحلة في الخادم للصف {value0}: {value1}"},
{"key":"batch4.service.row_server_save_failed","source":"Failed to save the trip on the server for row {value0}: {value1}"},
{"key":"batch4.service.row_server_save_failed","source":"قطار {value0} کا ٹرپ سرور پر محفوظ نہیں ہوا: {value1}"},
{"key":"batch4.service.project_not_found","source":"المشروع غير موجود"},
{"key":"batch4.service.project_not_found","source":"Project not found"},
{"key":"batch4.service.project_not_found","source":"پروجیکٹ نہیں ملا"},
{"key":"batch4.service.carrier_not_found","source":"الناقل غير موجود"},
{"key":"batch4.service.carrier_not_found","source":"Carrier not found"},
{"key":"batch4.service.carrier_not_found","source":"نقل و حمل کمپنی نہیں ملی"},
{"key":"batch4.service.material_not_found","source":"المادة غير موجودة"},
{"key":"batch4.service.material_not_found","source":"Material not found"},
{"key":"batch4.service.material_not_found","source":"مواد نہیں ملا"},



{"key":"batch4.service.truck_not_found","source":"الشاحنة غير موجودة"},
{"key":"batch4.service.truck_not_found","source":"Truck not found"},
{"key":"batch4.service.truck_not_found","source":"ٹرک نہیں ملا"},
{"key":"batch4.service.driver_not_found","source":"السائق غير موجود"},
{"key":"batch4.service.driver_not_found","source":"Driver not found"},
{"key":"batch4.service.driver_not_found","source":"ڈرائیور نہیں ملا"},
{"key":"batch4.service.user_not_found","source":"المستخدم غير موجود"},
{"key":"batch4.service.user_not_found","source":"User not found"},
{"key":"batch4.service.user_not_found","source":"صارف نہیں ملا"},



{"key":"batch4.service.legacy_no_pricing","source":"لا توجد اتفاقية تسعير سارية لهذا الناقل والمادة. يتم الاحتفاظ بسعر الشيت القديم كمرجع تاريخي فقط."},
{"key":"batch4.service.legacy_no_pricing","source":"No active pricing agreement exists for this carrier and material. The old sheet rate is retained only as a historical reference."},
{"key":"batch4.service.legacy_no_pricing","source":"اس نقل و حمل کمپنی اور مواد کا فعال قیمت معاہدہ نہیں۔ پرانی شیٹ کا کرایہ صرف تاریخی حوالے کے لیے محفوظ ہے۔"},
{"key":"batch4.service.legacy_carrier_unresolved","source":"الناقل غير معتمد أو غير محدد بدقة. يتم الاحتفاظ بسعر الشيت القديم كمرجع تاريخي مع تعليق التسعيرة (PENDING)."},
{"key":"batch4.service.legacy_carrier_unresolved","source":"The carrier is not approved or precisely identified. The old sheet rate is retained as a historical reference while pricing remains PENDING."},
{"key":"batch4.service.legacy_carrier_unresolved","source":"نقل و حمل کمپنی منظور شدہ یا قطعی شناخت شدہ نہیں۔ قیمت PENDING رہنے کے دوران پرانی شیٹ کا کرایہ تاریخی حوالے کے طور پر محفوظ ہے۔"},
{"key":"batch4.service.migration_preview_expired","source":"تقرير الترحيل غير موجود أو انتهت صلاحية جلسة المعاينة."},
{"key":"batch4.service.migration_preview_expired","source":"The migration report is missing or the preview session has expired."},
{"key":"batch4.service.migration_preview_expired","source":"منتقلی کی رپورٹ غائب ہے یا پیش منظر کے سیشن کی مدت ختم ہو گئی ہے۔"},
{"key":"batch4.service.migration_admin_required","source":"غير مصرح: ترحيل واعتماد البيانات التاريخية يتطلب صلاحية مدير النظام (PROJECT_ADMIN)."},
{"key":"batch4.service.migration_admin_required","source":"Unauthorized: migrating and approving historical data requires PROJECT_ADMIN authority."},
{"key":"batch4.service.migration_admin_required","source":"اجازت نہیں: تاریخی ڈیٹا کی منتقلی اور منظوری کے لیے PROJECT_ADMIN کا اختیار ضروری ہے۔"},
{"key":"batch4.service.migration_batch_unavailable","source":"دفعة المعالجة الموحدة غير مهيأة."},
{"key":"batch4.service.migration_batch_unavailable","source":"The unified processing batch is not initialized."},
{"key":"batch4.service.migration_batch_unavailable","source":"متحد پراسیسنگ بیچ کی ابتدا نہیں ہوئی۔"},
{"key":"batch4.service.project_create_super_admin","source":"غير مصرح لك: إنشاء المشاريع مقتصر فقط على مدير النظام (SUPER_ADMIN)"},
{"key":"batch4.service.project_create_super_admin","source":"Unauthorized: only SUPER_ADMIN can create projects"},
{"key":"batch4.service.project_create_super_admin","source":"اجازت نہیں: صرف SUPER_ADMIN پروجیکٹس بنا سکتا ہے"},
{"key":"batch4.service.project_activation_on_create","source":"لا يمكن تنشيط المشروع مباشرة عند الإنشاء"},
{"key":"batch4.service.project_activation_on_create","source":"A project cannot be activated directly during creation"},
{"key":"batch4.service.project_activation_on_create","source":"پروجیکٹ تخلیق کے دوران براہ راست فعال نہیں ہو سکتا"},
{"key":"batch4.service.project_edit_forbidden","source":"غير مصرح لك بتعديل بيانات المشروع"},
{"key":"batch4.service.project_edit_forbidden","source":"You are not authorized to edit project data"},
{"key":"batch4.service.project_edit_forbidden","source":"آپ کو پروجیکٹ کے ڈیٹا میں ترمیم کی اجازت نہیں"},
{"key":"batch4.service.project_activation_formal","source":"لا يمكن تنشيط المشروع عبر تحديث عام. يرجى استخدام عملية التنشيط الرسمية."},
{"key":"batch4.service.project_activation_formal","source":"A project cannot be activated through a general update. Use the official activation operation."},
{"key":"batch4.service.project_activation_formal","source":"پروجیکٹ معمول کی اپ ڈیٹ سے فعال نہیں ہو سکتا۔ باضابطہ فعالیت کا عمل استعمال کریں۔"},
{"key":"batch4.service.project_governance_formal","source":"لا يمكن تعديل حالة دورة حياة المشروع عبر التحديث العام. يرجى استخدام عملية انتقال الحوكمة المعتمدة."},
{"key":"batch4.service.project_governance_formal","source":"Project lifecycle status cannot be changed through a general update. Use the approved governance transition."},
{"key":"batch4.service.project_governance_formal","source":"پروجیکٹ کی دورانی حالت معمول کی اپ ڈیٹ سے تبدیل نہیں ہو سکتی۔ منظور شدہ انتظامی انتقال استعمال کریں۔"},



{"key":"batch4.service.workspace_login_required","source":"غير مصرح: يجب تسجيل الدخول بحساب المستخدم لتنفيذ عمليات مساحة العمل (Firebase Authentication required)"},
{"key":"batch4.service.workspace_login_required","source":"Unauthorized: sign in to your account to perform workspace operations (Firebase Authentication required)"},
{"key":"batch4.service.workspace_login_required","source":"اجازت نہیں: ورک اسپیس کی کارروائیوں کے لیے اکاؤنٹ میں داخل ہوں (Firebase Authentication ضروری ہے)"},
{"key":"batch4.service.workspace_token_missing","source":"فشل استخراج رمز تعريف المستخدم (Firebase ID Token missing)"},
{"key":"batch4.service.workspace_token_missing","source":"Failed to obtain the user identity token (Firebase ID Token missing)"},
{"key":"batch4.service.workspace_token_missing","source":"صارف کا شناختی ٹوکن نہیں مل سکا (Firebase ID Token غائب ہے)"},
{"key":"batch4.service.workspace_token_failed","source":"فشل استخراج رمز تعريف المستخدم: {value0}"},
{"key":"batch4.service.workspace_token_failed","source":"Failed to obtain the user identity token: {value0}"},
{"key":"batch4.service.workspace_token_failed","source":"صارف کا شناختی ٹوکن نہیں مل سکا: {value0}"},
{"key":"batch4.service.google_access_token_missing","source":"لم يتم إرجاع رمز الوصول (Access Token) من حساب Google"},
{"key":"batch4.service.google_access_token_missing","source":"Google did not return an access token"},
{"key":"batch4.service.google_access_token_missing","source":"Google نے رسائی کا ٹوکن واپس نہیں کیا"},
{"key":"batch4.service.workspace_auth_failed","source":"فشل المصادقة مع Google Workspace: {value0}"},
{"key":"batch4.service.workspace_auth_failed","source":"Google Workspace authentication failed: {value0}"},
{"key":"batch4.service.workspace_auth_failed","source":"Google Workspace کی تصدیق ناکام ہوئی: {value0}"},
{"key":"batch4.service.workspace_projection_ids_required","source":"معرف المشروع وشيت المزامنة مطلوبان لإتمام الإسقاط الأولي"},
{"key":"batch4.service.workspace_projection_ids_required","source":"Project and synchronization spreadsheet identifiers are required for initial projection"},
{"key":"batch4.service.workspace_projection_ids_required","source":"ابتدائی منتقلی کے لیے پروجیکٹ اور ہم وقت سازی کی اسپریڈ شیٹ کی شناخت ضروری ہے"},
{"key":"batch4.service.parser_no_input","source":"لا توجد بيانات مدخلة للتحليل (No input data provided)"},
{"key":"batch4.service.parser_no_input","source":"No input data was provided for parsing"},
{"key":"batch4.service.parser_no_input","source":"پڑھنے کے لیے کوئی ڈیٹا فراہم نہیں کیا گیا"},
{"key":"batch4.service.excel_read_failed","source":"فشل في قراءة ملف الإكسل: {value0}"},
{"key":"batch4.service.excel_read_failed","source":"Failed to read the Excel file: {value0}"},
{"key":"batch4.service.excel_read_failed","source":"Excel فائل پڑھی نہیں جا سکی: {value0}"},
{"key":"batch4.service.excel_sheet_missing","source":"ورقة العمل المحددة ({value0}) غير موجودة في ملف الإكسل. الأوراق المتاحة: {value1}"},
{"key":"batch4.service.excel_sheet_missing","source":"Worksheet ({value0}) does not exist in the Excel file. Available sheets: {value1}"},
{"key":"batch4.service.excel_sheet_missing","source":"ورک شیٹ ({value0}) Excel فائل میں موجود نہیں۔ دستیاب شیٹس: {value1}"},
{"key":"batch4.service.roster_empty_row","source":"الصف فارغ، لا يحتوي على بيانات سائق أو شاحنة."},
{"key":"batch4.service.roster_empty_row","source":"The row is empty and contains no driver or truck data."},
{"key":"batch4.service.roster_empty_row","source":"قطار خالی ہے اور اس میں ڈرائیور یا ٹرک کا ڈیٹا نہیں۔"},
{"key":"batch4.service.roster_driver_required","source":"اسم السائق مطلوب ومفقود."},
{"key":"batch4.service.roster_driver_required","source":"The required driver name is missing."},
{"key":"batch4.service.roster_driver_required","source":"ڈرائیور کا لازمی نام غائب ہے۔"},
{"key":"batch4.service.roster_identity_ten_digits","source":"رقم الهوية أو الإقامة يجب أن يتكون من 10 أرقام."},
{"key":"batch4.service.roster_identity_ten_digits","source":"The national ID or residency number must contain 10 digits."},
{"key":"batch4.service.roster_identity_ten_digits","source":"قومی شناختی یا اقامہ نمبر 10 ہندسوں پر مشتمل ہونا چاہیے۔"},
{"key":"batch4.service.roster_plate_required","source":"رقم لوحة الشاحنة مطلوب ومفقود."},
{"key":"batch4.service.roster_plate_required","source":"The required truck plate number is missing."},
{"key":"batch4.service.roster_plate_required","source":"ٹرک کا لازمی پلیٹ نمبر غائب ہے۔"},
{"key":"batch4.service.roster_carrier_not_approved","source":"الناقل غير معرّف أو غير مصرح به في هذا المشروع."},
{"key":"batch4.service.roster_carrier_not_approved","source":"The carrier is unknown or not authorized for this project."},
{"key":"batch4.service.roster_carrier_not_approved","source":"نقل و حمل کمپنی نامعلوم ہے یا اس پروجیکٹ کے لیے مجاز نہیں۔"},
{"key":"batch4.service.roster_material_not_approved","source":"المادة غير معرّفة أو غير مصرح بها في هذا المشروع."},
{"key":"batch4.service.roster_material_not_approved","source":"The material is unknown or not authorized for this project."},
{"key":"batch4.service.roster_material_not_approved","source":"مواد نامعلوم ہے یا اس پروجیکٹ کے لیے مجاز نہیں۔"},
{"key":"batch4.service.roster_material_unknown","source":"المادة غير معرّفة في المشروع [{value0}]"},
{"key":"batch4.service.roster_material_unknown","source":"Material is not defined in the project [{value0}]"},
{"key":"batch4.service.roster_material_unknown","source":"پروجیکٹ میں مواد متعین نہیں [{value0}]"},
{"key":"batch4.service.roster_truck_exists","source":"الشاحنة مسجلة مسبقاً في قاعدة البيانات برقم اللوحة: {value0}"},
{"key":"batch4.service.roster_truck_exists","source":"The truck is already registered in the database with plate number: {value0}"},
{"key":"batch4.service.roster_truck_exists","source":"ٹرک ڈیٹا بیس میں پہلے سے اس پلیٹ نمبر کے ساتھ رجسٹر ہے: {value0}"},
{"key":"batch4.service.roster_driver_exists","source":"السائق مسجل مسبقاً في قاعدة البيانات برقم الهوية: {value0}"},
{"key":"batch4.service.roster_driver_exists","source":"The driver is already registered in the database with identity number: {value0}"},
{"key":"batch4.service.roster_driver_exists","source":"ڈرائیور ڈیٹا بیس میں پہلے سے اس شناختی نمبر کے ساتھ رجسٹر ہے: {value0}"},
{"key":"batch4.service.roster_carrier_id_missing","source":"فشل الاستيراد لعدم تحديد معرف الناقل المعتمد."},
{"key":"batch4.service.roster_carrier_id_missing","source":"Import failed because an approved carrier identifier was not specified."},
{"key":"batch4.service.roster_carrier_id_missing","source":"درآمد ناکام ہوئی کیونکہ منظور شدہ نقل و حمل کمپنی کی شناخت متعین نہیں تھی۔"},
{"key":"batch4.service.roster_material_id_missing","source":"فشل الاستيراد لعدم تحديد معرف المادة المعتمد."},
{"key":"batch4.service.roster_material_id_missing","source":"Import failed because an approved material identifier was not specified."},
{"key":"batch4.service.roster_material_id_missing","source":"درآمد ناکام ہوئی کیونکہ منظور شدہ مواد کی شناخت متعین نہیں تھی۔"},
{"key":"batch4.service.roster_gateway_save_failed","source":"فشل الحفظ عبر البوابة الموحدة: {value0}"},
{"key":"batch4.service.roster_gateway_save_failed","source":"Saving through the unified gateway failed: {value0}"},
{"key":"batch4.service.roster_gateway_save_failed","source":"متحد گیٹ وے سے محفوظ کرنا ناکام ہوا: {value0}"},
{"key":"batch4.service.file_extension_not_supported","source":"امتداد الملف ({value0}) غير مدعوم. الصيغ المقبولة: .xlsx, .xls, .csv"},
{"key":"batch4.service.file_extension_not_supported","source":"File extension ({value0}) is unsupported. Accepted formats: .xlsx, .xls, .csv"},
{"key":"batch4.service.file_extension_not_supported","source":"فائل کی توسیع ({value0}) معاون نہیں۔ قابل قبول صورتیں: .xlsx، .xls، .csv"},
{"key":"batch4.service.file_empty","source":"الملف فارغ (0 بايت) ولا يحتوي على أي بيانات"},
{"key":"batch4.service.file_empty","source":"The file is empty (0 bytes) and contains no data"},
{"key":"batch4.service.file_empty","source":"فائل خالی ہے (0 بائٹس) اور اس میں ڈیٹا نہیں"},
{"key":"batch4.service.file_too_large","source":"حجم الملف ({value0} ميغابايت) يتجاوز الحد الأقصى المسموح به (25 ميغابايت)"},
{"key":"batch4.service.file_too_large","source":"File size ({value0} MB) exceeds the maximum permitted size (25 MB)"},
{"key":"batch4.service.file_too_large","source":"فائل کا حجم ({value0} میگابائٹس) زیادہ سے زیادہ حد (25 میگابائٹس) سے تجاوز کرتا ہے"},
{"key":"batch4.service.excel_mime_invalid","source":"نوع وسائط الملف ({value0}) لا يتطابق مع ملفات إكسل المعتمدة"},
{"key":"batch4.service.excel_mime_invalid","source":"File media type ({value0}) does not match approved Excel files"},
{"key":"batch4.service.excel_mime_invalid","source":"فائل کی میڈیا قسم ({value0}) منظور شدہ Excel فائلوں سے مطابقت نہیں رکھتی"},
{"key":"batch4.service.csv_mime_invalid","source":"نوع وسائط الملف ({value0}) لا يتطابق مع ملفات CSV المعتمدة"},
{"key":"batch4.service.csv_mime_invalid","source":"File media type ({value0}) does not match approved CSV files"},
{"key":"batch4.service.csv_mime_invalid","source":"فائل کی میڈیا قسم ({value0}) منظور شدہ CSV فائلوں سے مطابقت نہیں رکھتی"},
{"key":"batch4.service.smart_source_unsupported","source":"نوع المصدر غير مدعوم للتحليل الذكي: {value0}"},
{"key":"batch4.service.smart_source_unsupported","source":"Unsupported source type for smart analysis: {value0}"},
{"key":"batch4.service.smart_source_unsupported","source":"ذہین تجزیے کے لیے غیر معاون ماخذ کی قسم: {value0}"},
{"key":"batch4.service.duplicate_schema_fields","source":"تكرار في حقول المخطط لنفس العمود: {value0}"},
{"key":"batch4.service.duplicate_schema_fields","source":"Duplicate schema fields for the same column: {value0}"},
{"key":"batch4.service.duplicate_schema_fields","source":"اسی کالم کے لیے خاکے کی فیلڈز کی نقل: {value0}"},
{"key":"batch4.service.too_few_matched_fields","source":"عدد الحقول الأساسية المطابقة أقل من 3 حقول (مطلوب على الأقل: رقم التذكرة، رقم اللوحة، الناقل، التاريخ، والوزن الصافي)"},
{"key":"batch4.service.too_few_matched_fields","source":"Fewer than 3 primary fields matched (at least ticket number, plate number, carrier, date and net weight are required)"},
{"key":"batch4.service.too_few_matched_fields","source":"3 سے کم بنیادی فیلڈز مطابق ملیں (کم از کم ٹکٹ نمبر، پلیٹ نمبر، نقل و حمل کمپنی، تاریخ اور خالص وزن ضروری ہیں)"},
{"key":"batch4.service.too_many_unmapped_columns","source":"أكثر من 50% من أعمدة الملف غير مطابقة لأي حقل قياسي في النظام"},
{"key":"batch4.service.too_many_unmapped_columns","source":"More than 50% of file columns do not match any canonical field"},
{"key":"batch4.service.too_many_unmapped_columns","source":"فائل کے 50% سے زیادہ کالم کسی مستند فیلڈ سے مطابق نہیں"},
{"key":"batch4.service.file_validation_failed","source":"خطأ في فحص الملف: {value0}"},
{"key":"batch4.service.file_validation_failed","source":"File validation failed: {value0}"},
{"key":"batch4.service.file_validation_failed","source":"فائل کی جانچ ناکام ہوئی: {value0}"},
{"key":"batch4.service.blocking_rows_count","source":"توجد ({value0}) صفوف تتضمن أخطاء مانعة"},
{"key":"batch4.service.blocking_rows_count","source":"({value0}) rows contain blocking errors"},
{"key":"batch4.service.blocking_rows_count","source":"({value0}) قطاروں میں مانع خرابیاں ہیں"},
{"key":"batch4.service.pending_reviews_count","source":"توجد ({value0}) مجموعات كائنات أو مراجعات معلقة"},
{"key":"batch4.service.pending_reviews_count","source":"({value0}) entity groups or reviews are pending"},
{"key":"batch4.service.pending_reviews_count","source":"({value0}) اکائیوں کے گروپس یا جائزے زیر التوا ہیں"},
{"key":"batch4.service.pending_warnings_count","source":"توجد ({value0}) تنبيهات معلقة تتطلب تأكيد بشري صريح"},
{"key":"batch4.service.pending_warnings_count","source":"({value0}) warnings require explicit human confirmation"},
{"key":"batch4.service.pending_warnings_count","source":"({value0}) تنبیہات کے لیے واضح انسانی تصدیق ضروری ہے"},
{"key":"batch4.service.user_unauthenticated","source":"المستخدم غير موثق"},
{"key":"batch4.service.user_unauthenticated","source":"The user is not authenticated"},
{"key":"batch4.service.user_unauthenticated","source":"صارف کی تصدیق نہیں ہوئی"},
{"key":"batch4.service.project_id_required","source":"معرف المشروع مطلوب"},
{"key":"batch4.service.project_id_required","source":"Project identifier is required"},
{"key":"batch4.service.project_id_required","source":"پروجیکٹ کی شناخت ضروری ہے"},
{"key":"batch4.service.target_entity_required","source":"معرف الكيان المستهدف مطلوب"},
{"key":"batch4.service.target_entity_required","source":"Target entity identifier is required"},
{"key":"batch4.service.target_entity_required","source":"مطلوبہ اکائی کی شناخت ضروری ہے"},
{"key":"batch4.service.entity_type_required","source":"نوع الكيان مطلوب"},
{"key":"batch4.service.entity_type_required","source":"Entity type is required"},
{"key":"batch4.service.entity_type_required","source":"اکائی کی قسم ضروری ہے"},
{"key":"batch4.service.carrier_registration_required","source":"رقم السجل التجاري للناقل مطلوب"},
{"key":"batch4.service.carrier_registration_required","source":"Carrier commercial registration number is required"},
{"key":"batch4.service.carrier_registration_required","source":"نقل و حمل کمپنی کا تجارتی رجسٹریشن نمبر ضروری ہے"},
{"key":"batch4.service.server_carrier_id_missing","source":"لم يتضمن رد الخادم معرف الناقل المعتمد (carrierId)"},
{"key":"batch4.service.server_carrier_id_missing","source":"The server response did not include the approved carrierId"},
{"key":"batch4.service.server_carrier_id_missing","source":"سرور کے جواب میں منظور شدہ carrierId نہیں تھی"},
{"key":"entityResolution.messages.material_code_required","source":"رمز المادة (Code) مطلوب"},
{"key":"entityResolution.messages.material_code_required","source":"Material code is required"},
{"key":"entityResolution.messages.material_code_required","source":"مواد کا کوڈ لازمی ہے"},
{"key":"batch4.service.server_material_id_missing","source":"لم يتضمن رد الخادم معرف المادة المعتمد (materialId)"},
{"key":"batch4.service.server_material_id_missing","source":"The server response did not include the approved materialId"},
{"key":"batch4.service.server_material_id_missing","source":"سرور کے جواب میں منظور شدہ materialId نہیں تھی"},
{"key":"batch4.service.driver_data_required","source":"بيانات السائق (driverData) مطلوبة"},
{"key":"batch4.service.driver_data_required","source":"Driver data (driverData) is required"},
{"key":"batch4.service.driver_data_required","source":"ڈرائیور کا ڈیٹا (driverData) ضروری ہے"},
{"key":"batch4.service.driver_carrier_required","source":"معرف الناقل (carrierId) مطلوب للسائق"},
{"key":"batch4.service.driver_carrier_required","source":"A carrier identifier (carrierId) is required for the driver"},
{"key":"batch4.service.driver_carrier_required","source":"ڈرائیور کے لیے نقل و حمل کمپنی کی شناخت (carrierId) ضروری ہے"},
{"key":"batch4.service.driver_name_required","source":"اسم السائق (driverName) مطلوب"},
{"key":"batch4.service.driver_name_required","source":"Driver name (driverName) is required"},
{"key":"batch4.service.driver_name_required","source":"ڈرائیور کا نام (driverName) ضروری ہے"},
{"key":"entityResolution.messages.residency_identifier_required","source":"رقم الهوية الوطنية أو الإقامة (residencyId) مطلوب"},
{"key":"entityResolution.messages.residency_identifier_required","source":"National ID or residency number (residencyId) is required"},
{"key":"entityResolution.messages.residency_identifier_required","source":"قومی شناخت یا اقامہ نمبر (residencyId) لازمی ہے"},
{"key":"batch4.service.server_driver_id_missing","source":"لم يتضمن رد الخادم معرف السائق المعتمد (driverId)"},
{"key":"batch4.service.server_driver_id_missing","source":"The server response did not include the approved driverId"},
{"key":"batch4.service.server_driver_id_missing","source":"سرور کے جواب میں منظور شدہ driverId نہیں تھی"},
{"key":"batch4.service.truck_data_required","source":"بيانات الشاحنة (truckData) مطلوبة"},
{"key":"batch4.service.truck_data_required","source":"Truck data (truckData) is required"},
{"key":"batch4.service.truck_data_required","source":"ٹرک کا ڈیٹا (truckData) ضروری ہے"},
{"key":"batch4.service.truck_carrier_required","source":"معرف الناقل (carrierId) مطلوب للشاحنة"},
{"key":"batch4.service.truck_carrier_required","source":"A carrier identifier (carrierId) is required for the truck"},
{"key":"batch4.service.truck_carrier_required","source":"ٹرک کے لیے نقل و حمل کمپنی کی شناخت (carrierId) ضروری ہے"},
{"key":"batch4.service.truck_plate_required","source":"رقم لوحة الشاحنة (plateNumber) مطلوب"},
{"key":"batch4.service.truck_plate_required","source":"Truck plate number (plateNumber) is required"},
{"key":"batch4.service.truck_plate_required","source":"ٹرک کا پلیٹ نمبر (plateNumber) ضروری ہے"},
{"key":"batch4.service.server_truck_id_missing","source":"لم يتضمن رد الخادم معرف الشاحنة المعتمد (truckId)"},
{"key":"batch4.service.server_truck_id_missing","source":"The server response did not include the approved truckId"},
{"key":"batch4.service.server_truck_id_missing","source":"سرور کے جواب میں منظور شدہ truckId نہیں تھی"},
{"key":"batch4.service.user_not_signed_in","source":"المستخدم غير مسجل الدخول"},
{"key":"batch4.service.user_not_signed_in","source":"The user is not signed in"},
{"key":"batch4.service.user_not_signed_in","source":"صارف داخل نہیں ہے"},
{"key":"batch4.service.auth_token_unavailable","source":"تعذر استخراج رمز المصادقة"},
{"key":"batch4.service.auth_token_unavailable","source":"Unable to obtain the authentication token"},
{"key":"batch4.service.auth_token_unavailable","source":"تصدیقی ٹوکن حاصل نہیں ہو سکا"},
{"key":"batch4.service.import_project_required","source":"معرف المشروع مطلوب لإنشاء جلسة استيراد"},
{"key":"batch4.service.import_project_required","source":"A project identifier is required to create an import session"},
{"key":"batch4.service.import_project_required","source":"درآمدی سیشن بنانے کے لیے پروجیکٹ کی شناخت ضروری ہے"},
{"key":"batch4.service.import_session_required","source":"معرف جلسة الاستيراد مطلوب"},
{"key":"batch4.service.import_session_required","source":"An import-session identifier is required"},
{"key":"batch4.service.import_session_required","source":"درآمدی سیشن کی شناخت ضروری ہے"},
{"key":"batch4.service.expected_version_required","source":"رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل"},
{"key":"batch4.service.expected_version_required","source":"Expected version (expectedVersion) is required for optimistic concurrency control"},
{"key":"batch4.service.expected_version_required","source":"متوقع ورژن (expectedVersion) مثبت متوازی کنٹرول کے لیے ضروری ہے"},
{"key":"batch4.service.navigation_project_required","source":"يجب إنشاء وحفظ المشروع أولاً للوصول إلى هذه الطبقة."},
{"key":"batch4.service.navigation_project_required","source":"Create and save the project before opening this layer."},
{"key":"batch4.service.navigation_project_required","source":"اس پرت کو کھولنے سے پہلے پروجیکٹ بنائیں اور محفوظ کریں۔"},
{"key":"batch4.service.navigation_material_carrier_required","source":"سجل تشغيل السائقين وقواعد الأسعار تتطلب مادة مصرحة واحدة وناقل واحد على الأقل."},
{"key":"batch4.service.navigation_material_carrier_required","source":"The operational roster and pricing rules require at least one approved material and one carrier."},
{"key":"batch4.service.navigation_material_carrier_required","source":"عملیاتی رجسٹر اور قیمت کے قواعد کے لیے کم از کم ایک منظور شدہ مواد اور ایک نقل و حمل کمپنی ضروری ہے۔"},
{"key":"batch4.service.navigation_material_required","source":"يلزم وجود مادة مصرح بها واحدة على الأقل."},
{"key":"batch4.service.navigation_material_required","source":"At least one approved material is required."},
{"key":"batch4.service.navigation_material_required","source":"کم از کم ایک منظور شدہ مواد ضروری ہے۔"},
{"key":"batch4.service.navigation_carrier_required","source":"يلزم وجود ناقل معتمد واحد على الأقل."},
{"key":"batch4.service.navigation_carrier_required","source":"At least one approved carrier is required."},
{"key":"batch4.service.navigation_carrier_required","source":"کم از کم ایک منظور شدہ نقل و حمل کمپنی ضروری ہے۔"},
{"key":"batch4.service.navigation_layer_invalid","source":"الطبقة المحددة غير صالحة."},
{"key":"batch4.service.navigation_layer_invalid","source":"The selected layer is invalid."},
{"key":"batch4.service.navigation_layer_invalid","source":"منتخب پرت درست نہیں۔"},
{"key":"batch4.service.sheets_format_invalid","source":"تنسيق بيانات Google Sheets غير صالح. المتوقع مصفوفة صفوف ثنائية الأبعاد."},
{"key":"batch4.service.sheets_format_invalid","source":"Invalid Google Sheets data format. Expected a two-dimensional array of rows."},
{"key":"batch4.service.sheets_format_invalid","source":"Google Sheets کے ڈیٹا کی صورت غلط ہے۔ قطاروں کی دو جہتی صف متوقع ہے۔"},
{"key":"batch4.service.sheets_rows_limit","source":"تجاوز جدول البيانات الحد الأقصى المسموح به للصفوف ({value0} صفاً). يحتوي الملف على {value1} صفاً. يرجى تقسيم البيانات قبل الاستيراد."},
{"key":"batch4.service.sheets_rows_limit","source":"The spreadsheet exceeds the maximum ({value0} rows) and contains {value1} rows. Split the data before importing."},
{"key":"batch4.service.sheets_rows_limit","source":"اسپریڈ شیٹ زیادہ سے زیادہ حد ({value0} قطاریں) سے تجاوز کرتی ہے اور اس میں {value1} قطاریں ہیں۔ درآمد سے پہلے ڈیٹا تقسیم کریں۔"},
{"key":"batch4.service.sheets_header_index_invalid","source":"مؤشر صف الترويسة ({value0}) أكبر من عدد صفوف الجدول المتاحة ({value1})."},
{"key":"batch4.service.sheets_header_index_invalid","source":"Header row index ({value0}) exceeds the available sheet rows ({value1})."},
{"key":"batch4.service.sheets_header_index_invalid","source":"عنوانات کی قطار کا اشاریہ ({value0}) شیٹ کی دستیاب قطاروں ({value1}) سے زیادہ ہے۔"},
{"key":"batch4.service.sheets_data_unavailable","source":"بيانات Google Sheets غير متوفرة أو بتنسيق غير صالح."},
{"key":"batch4.service.sheets_data_unavailable","source":"Google Sheets data is unavailable or has an invalid format."},
{"key":"batch4.service.sheets_data_unavailable","source":"Google Sheets کا ڈیٹا دستیاب نہیں یا اس کی صورت غلط ہے۔"},
{"key":"batch4.service.sheets_id_required","source":"معرف جدول بيانات Google Sheets مطلوب."},
{"key":"batch4.service.sheets_id_required","source":"A Google Sheets spreadsheet identifier is required."},
{"key":"batch4.service.sheets_id_required","source":"Google Sheets کی اسپریڈ شیٹ کی شناخت ضروری ہے۔"},
{"key":"entityResolution.messages.no_eligible_rows","source":"لا توجد أي صفوف صالحة جاهزة للاعتماد"},
{"key":"entityResolution.messages.no_eligible_rows","source":"No valid rows are ready for approval"},
{"key":"entityResolution.messages.no_eligible_rows","source":"کوئی درست قطار منظوری کے لیے تیار نہیں"},
{"key":"batch4.service.workspace_identifiers","source":"معرفات Google Workspace للمشروع غير مكتملة أو غير متطابقة (يلزم توفر معرف المجلد ومعرف الشيت معاً)"},
{"key":"batch4.service.workspace_identifiers","source":"Project Google Workspace identifiers are incomplete or inconsistent (both folder and spreadsheet identifiers are required)"},
{"key":"batch4.service.workspace_identifiers","source":"پروجیکٹ کے Google Workspace شناختی کوڈ نامکمل یا غیر مطابق ہیں (فولڈر اور اسپریڈ شیٹ دونوں کی شناخت ضروری ہے)"},
{"key":"batch4.service.workspace_projection_success","source":"تم تحديث وإسقاط بيانات المشروع في جدول البيانات بنجاح دون إعادة تهيئة مساحة العمل"},
{"key":"batch4.service.workspace_projection_success","source":"Project data was updated and projected into the spreadsheet without reinitializing the workspace"},
{"key":"batch4.service.workspace_projection_success","source":"ورک اسپیس دوبارہ ترتیب دیے بغیر پروجیکٹ کا ڈیٹا اسپریڈ شیٹ میں کامیابی سے تازہ اور منتقل کیا گیا"},
{"key":"batch4.service.workspace_projection_failed","source":"فشل تحديث وإسقاط البيانات في جدول البيانات: {value0}"},
{"key":"batch4.service.workspace_projection_failed","source":"Failed to update and project spreadsheet data: {value0}"},
{"key":"batch4.service.workspace_projection_failed","source":"اسپریڈ شیٹ کا ڈیٹا تازہ اور منتقل نہیں ہو سکا: {value0}"},
{"key":"batch4.service.workspace_provision_ids_missing","source":"فشلت تهيئة مساحة العمل: لم يتم إرجاع معرفات المجلد أو جدول البيانات"},
{"key":"batch4.service.workspace_provision_ids_missing","source":"Workspace setup failed: folder or spreadsheet identifiers were not returned"},
{"key":"batch4.service.workspace_provision_ids_missing","source":"ورک اسپیس کی ترتیب ناکام: فولڈر یا اسپریڈ شیٹ کی شناخت واپس نہیں ملی"},
{"key":"batch4.service.workspace_provision_success","source":"تمت تهيئة مساحة العمل في Google بنجاح وإسقاط بيانات المشروع الأولية في جدول البيانات"},
{"key":"batch4.service.workspace_provision_success","source":"Google workspace was initialized and initial project data was projected into the spreadsheet"},
{"key":"batch4.service.workspace_provision_success","source":"Google ورک اسپیس ترتیب دی گئی اور پروجیکٹ کا ابتدائی ڈیٹا اسپریڈ شیٹ میں منتقل کیا گیا"},
{"key":"batch4.service.workspace_initial_projection_failed","source":"تمت تهيئة مساحة العمل في Google Drive بنجاح، ولكن تعذر إكمال إسقاط البيانات الأولية: {value0}"},
{"key":"batch4.service.workspace_initial_projection_failed","source":"Google Drive workspace was initialized, but initial data projection could not be completed: {value0}"},
{"key":"batch4.service.workspace_initial_projection_failed","source":"Google Drive ورک اسپیس ترتیب دی گئی مگر ابتدائی ڈیٹا کی منتقلی مکمل نہیں ہوئی: {value0}"},
{"key":"batch4.service.workspace_provision_failed","source":"فشلت عملية تهيئة مجلدات ومساحة عمل Google"},
{"key":"batch4.service.workspace_provision_failed","source":"Failed to initialize Google folders and workspace"},
{"key":"batch4.service.workspace_provision_failed","source":"Google کے فولڈرز اور ورک اسپیس کی ترتیب ناکام ہوئی"},
{"key":"batch4.service.readiness_no_material","source":"لا يوجد مواد نشطة"},
{"key":"batch4.service.readiness_no_material","source":"No active materials"},
{"key":"batch4.service.readiness_no_material","source":"کوئی فعال مواد نہیں"},
{"key":"batch4.service.readiness_no_carrier","source":"لا يوجد ناقلات نشطة"},
{"key":"batch4.service.readiness_no_carrier","source":"No active carriers"},
{"key":"batch4.service.readiness_no_carrier","source":"کوئی فعال نقل و حمل کمپنی نہیں"},
{"key":"batch4.service.readiness_no_path","source":"لا يوجد مسار تشغيلي مكتمل"},
{"key":"batch4.service.readiness_no_path","source":"No complete operational path"},
{"key":"batch4.service.readiness_no_path","source":"کوئی مکمل عملیاتی راستہ نہیں"},
{"key":"admin_console.user_approved","source":"تم اعتماد المستخدم بنجاح بالدور: {role}"},
{"key":"admin_console.user_approved","source":"User approved successfully with role: {role}"},
{"key":"admin_console.user_approved","source":"صارف کو {role} کردار کے ساتھ کامیابی سے منظور کر دیا گیا"},
{"key":"admin_console.approval_failed","source":"فشلت عملية الاعتماد: {error}"},
{"key":"admin_console.approval_failed","source":"Approval failed: {error}"},
{"key":"admin_console.approval_failed","source":"منظوری ناکام ہوئی: {error}"},
{"key":"admin_console.user_rejected","source":"تم رفض حساب المستخدم وتقديم التبرير الحوكمي."},
{"key":"admin_console.user_rejected","source":"The user account was rejected and the governance justification recorded."},
{"key":"admin_console.user_rejected","source":"صارف کا اکاؤنٹ مسترد کر دیا گیا اور انتظامی جواز درج کر دیا گیا۔"},
{"key":"admin_console.rejection_failed","source":"فشلت عملية الرفض: {error}"},
{"key":"admin_console.rejection_failed","source":"Rejection failed: {error}"},
{"key":"admin_console.rejection_failed","source":"درخواست مسترد کرنے کا عمل ناکام ہوا: {error}"},
{"key":"admin_console.user_suspended","source":"تم تعليق حساب المستخدم بنجاح."},
{"key":"admin_console.user_suspended","source":"The user account was suspended successfully."},
{"key":"admin_console.user_suspended","source":"صارف کا اکاؤنٹ کامیابی سے معطل کر دیا گیا۔"},
{"key":"admin_console.suspension_failed","source":"فشلت عملية التعليق: {error}"},
{"key":"admin_console.suspension_failed","source":"Account suspension failed: {error}"},
{"key":"admin_console.suspension_failed","source":"اکاؤنٹ معطل کرنے کا عمل ناکام ہوا: {error}"},
{"key":"admin_console.user_reactivated","source":"تمت إعادة تفعيل الحساب بنجاح."},
{"key":"admin_console.user_reactivated","source":"The account was reactivated successfully."},
{"key":"admin_console.user_reactivated","source":"اکاؤنٹ کامیابی سے دوبارہ فعال کر دیا گیا۔"},
{"key":"admin_console.reactivation_failed","source":"فشلت إعادة التفعيل: {error}"},
{"key":"admin_console.reactivation_failed","source":"Account reactivation failed: {error}"},
{"key":"admin_console.reactivation_failed","source":"اکاؤنٹ دوبارہ فعال کرنے کا عمل ناکام ہوا: {error}"},
{"key":"admin_console.security_updated","source":"تم تحديث وثيقة الصلاحيات والوصول الأمني للمستخدم: {email}"},
{"key":"admin_console.security_updated","source":"Permissions and access policy updated for: {email}"},
{"key":"admin_console.security_updated","source":"{email} کے لیے اجازتوں اور رسائی کی پالیسی اپ ڈیٹ کر دی گئی"},
{"key":"admin_console.security_update_failed","source":"فشل تحديث السياسات الأمنية: {error}"},
{"key":"admin_console.security_update_failed","source":"Security policy update failed: {error}"},
{"key":"admin_console.security_update_failed","source":"سیکیورٹی پالیسی اپ ڈیٹ نہیں ہو سکی: {error}"},
{"key":"projects.messages.canonical_data_loading","source":"جاري تحميل بيانات المشروع المعتمدة، يرجى الانتظار..."},
{"key":"projects.messages.canonical_data_loading","source":"Approved project data is loading. Please wait..."},
{"key":"projects.messages.canonical_data_loading","source":"منظور شدہ پروجیکٹ ڈیٹا لوڈ ہو رہا ہے۔ براہ کرم انتظار کریں۔۔۔"},
{"key":"projects.batch4.navigation_failed","source":"تعذر الانتقال إلى هذه الطبقة."},
{"key":"projects.batch4.navigation_failed","source":"Unable to navigate to this layer."},
{"key":"projects.batch4.navigation_failed","source":"اس پرت پر نہیں جا سکے۔"},
{"key":"projects.batch4.project_name_minimum","source":"اسم المشروع بالعربية يجب ألا يقل عن 3 أحرف"},
{"key":"projects.batch4.project_name_minimum","source":"The Arabic project name must contain at least 3 characters"},
{"key":"projects.batch4.project_name_minimum","source":"پروجیکٹ کے عربی نام میں کم از کم 3 حروف ضروری ہیں"},
{"key":"projects.batch4.zatca_fifteen_digits","source":"الرقم الضريبي لهيئة الزكاة والضريبة والجمارك (ZATCA) يجب أن يتكون من 15 رقمًا"},
{"key":"projects.batch4.zatca_fifteen_digits","source":"The ZATCA tax number must contain 15 digits"},
{"key":"projects.batch4.zatca_fifteen_digits","source":"ZATCA ٹیکس نمبر 15 ہندسوں پر مشتمل ہونا چاہیے"},
{"key":"projects.messages.changes_saved","source":"تم حفظ تعديلات المشروع بنجاح"},
{"key":"projects.messages.changes_saved","source":"Project changes saved successfully"},
{"key":"projects.messages.changes_saved","source":"پروجیکٹ کی تبدیلیاں کامیابی سے محفوظ ہو گئیں"},
{"key":"projects.batch4.save_changes_failed","source":"فشلت عملية حفظ التعديلات"},
{"key":"projects.batch4.save_changes_failed","source":"Failed to save changes"},
{"key":"projects.batch4.save_changes_failed","source":"تبدیلیاں محفوظ نہیں ہو سکیں"},
{"key":"projects.batch4.readiness_fetch_failed","source":"خطأ في جلب تقرير الجاهزية التشغيلية من الخادم"},
{"key":"projects.batch4.readiness_fetch_failed","source":"Failed to fetch the operational readiness report from the server"},
{"key":"projects.batch4.readiness_fetch_failed","source":"سرور سے عملیاتی تیاری کی رپورٹ حاصل نہیں ہو سکی"},
{"key":"projects.batch4.project_load_failed","source":"فشل تحميل بيانات المشروع"},
{"key":"projects.batch4.project_load_failed","source":"Failed to load project data"},
{"key":"projects.batch4.project_load_failed","source":"پروجیکٹ کا ڈیٹا لوڈ نہیں ہو سکا"},
{"key":"projects.batch4.import_restore_invalid","source":"فشل استعادة جلسة الاستيراد: هيكل البيانات المحفوظ تالف أو غير متوافق."},
{"key":"projects.batch4.import_restore_invalid","source":"Failed to restore the import session: saved data is damaged or incompatible."},
{"key":"projects.batch4.import_restore_invalid","source":"درآمدی سیشن بحال نہیں ہو سکا: محفوظ ڈیٹا خراب یا غیر موافق ہے۔"},
{"key":"projects.batch4.project_creation_failed","source":"فشل إنشاء المشروع"},
{"key":"projects.batch4.project_creation_failed","source":"Failed to create the project"},
{"key":"projects.batch4.project_creation_failed","source":"پروجیکٹ نہیں بن سکا"},
{"key":"projects.batch4.roster_required_fields","source":"الرجاء تعبئة جميع الحقول المطلوبة بما في ذلك الهوية الوطنية ورقم اللوحة والناقل والمادة"},
{"key":"projects.batch4.roster_required_fields","source":"Complete all required fields, including national ID, plate number, carrier and material"},
{"key":"projects.batch4.roster_required_fields","source":"قومی شناختی نمبر، پلیٹ نمبر، نقل و حمل کمپنی اور مواد سمیت تمام لازمی خانے مکمل کریں"},
{"key":"projects.batch4.partner_add_failed","source":"خطأ في إضافة شريك التشغيل"},
{"key":"projects.batch4.partner_add_failed","source":"Failed to add the operational partner"},
{"key":"projects.batch4.partner_add_failed","source":"عملیاتی شراکت دار شامل نہیں ہو سکا"},
{"key":"projects.batch4.checkpoint_identifiers_missing","source":"تعذر حفظ نقطة الاستعادة: معرف المشروع أو معرف جلسة الاستيراد مفقود"},
{"key":"projects.batch4.checkpoint_identifiers_missing","source":"Cannot save checkpoint: project or import-session identifier is missing"},
{"key":"projects.batch4.checkpoint_identifiers_missing","source":"چیک پوائنٹ محفوظ نہیں ہو سکتا: پروجیکٹ یا درآمدی سیشن کی شناخت موجود نہیں"},
{"key":"projects.batch4.import_version_conflict","source":"تعارض في إصدار جلسة الاستيراد (VERSION_CONFLICT): تم تحديث الجلسة من جلسة أخرى."},
{"key":"projects.batch4.import_version_conflict","source":"Import-session version conflict (VERSION_CONFLICT): another session updated it."},
{"key":"projects.batch4.import_version_conflict","source":"درآمدی سیشن کے ورژن میں تعارض (VERSION_CONFLICT): اسے دوسرے سیشن نے تازہ کیا ہے۔"},
{"key":"projects.batch4.checkpoint_persistence_failed","source":"فشل حفظ نقطة استعادة جلسة الاستيراد (تعذر الحفظ الدائم على الخادم)"},
{"key":"projects.batch4.checkpoint_persistence_failed","source":"Failed to save the import-session checkpoint (durable server save unavailable)"},
{"key":"projects.batch4.checkpoint_persistence_failed","source":"درآمدی سیشن کا چیک پوائنٹ محفوظ نہیں ہوا (سرور پر مستقل محفوظ کرنا ممکن نہیں)"},
{"key":"projects.batch4.import_cancel_failed","source":"فشل إلغاء جلسة الاستيراد على الخادم"},
{"key":"projects.batch4.import_cancel_failed","source":"Failed to cancel the import session on the server"},
{"key":"projects.batch4.import_cancel_failed","source":"سرور پر درآمدی سیشن منسوخ نہیں ہو سکا"},
{"key":"projects.batch4.roster_discovery_failed","source":"خطأ أثناء استكشاف ملف سجل التشغيل"},
{"key":"projects.batch4.roster_discovery_failed","source":"Failed to discover the operational-log file"},
{"key":"projects.batch4.roster_discovery_failed","source":"عملیاتی لاگ فائل کی شناخت نہیں ہو سکی"},
{"key":"projects.batch4.roster_import_failed","source":"خطأ في استيراد ملف سجل التشغيل"},
{"key":"projects.batch4.roster_import_failed","source":"Failed to import the operational-log file"},
{"key":"projects.batch4.roster_import_failed","source":"عملیاتی لاگ فائل درآمد نہیں ہو سکی"},
{"key":"entityResolution.messages.worksheet_discovery_failed","source":"فشل في استكشاف ورقة العمل المحددة"},
{"key":"entityResolution.messages.worksheet_discovery_failed","source":"Could not inspect the selected worksheet"},
{"key":"entityResolution.messages.worksheet_discovery_failed","source":"منتخب ورک شیٹ کی جانچ نہیں ہو سکی"},
{"key":"projects.batch4.mapping_required_fields","source":"اعتماد الربط يتطلب ربط حقل الناقل (carrierName) وحقل المادة (materialName) وحقل السائق (driverName) أو الشاحنة (truckPlate) على الأقل قبل المتابعة."},
{"key":"projects.batch4.mapping_required_fields","source":"Mapping approval requires carrierName and materialName, plus driverName or truckPlate, before continuing."},
{"key":"projects.batch4.mapping_required_fields","source":"آگے بڑھنے سے پہلے میپنگ کی منظوری کے لیے carrierName، materialName اور driverName یا truckPlate کی میپنگ ضروری ہے۔"},
{"key":"projects.batch4.roster_analysis_failed","source":"خطأ أثناء تحليل ملف سجل التشغيل أو إنشاء جلسة الاستيراد"},
{"key":"projects.batch4.roster_analysis_failed","source":"Failed to analyze the operational-log file or create the import session"},
{"key":"projects.batch4.roster_analysis_failed","source":"عملیاتی لاگ فائل کا تجزیہ یا درآمدی سیشن کی تخلیق ناکام ہو گئی"},
{"key":"projects.batch4.import_session_save_failed","source":"فشل حفظ جلسة الاستيراد على الخادم"},
{"key":"projects.batch4.import_session_save_failed","source":"Failed to save the import session on the server"},
{"key":"projects.batch4.import_session_save_failed","source":"سرور پر درآمدی سیشن محفوظ نہیں ہو سکا"},
{"key":"projects.batch4.carrier_groups_missing","source":"لم يتم اكتشاف أي مجموعات ناقلين في الملف. الناقل مطلوب لكل سجل تشغيل."},
{"key":"projects.batch4.carrier_groups_missing","source":"No carrier groups were found in the file. A carrier is required for each operational-log entry."},
{"key":"projects.batch4.carrier_groups_missing","source":"فائل میں نقل و حمل کمپنیوں کے گروپس نہیں ملے۔ ہر عملیاتی لاگ اندراج کے لیے کمپنی ضروری ہے۔"},
{"key":"projects.batch4.carrier_groups_pending","source":"يرجى حسم جميع مجموعات الناقلين قبل الانتقال إلى مراجعة المواد"},
{"key":"projects.batch4.carrier_groups_pending","source":"Resolve all carrier groups before reviewing materials"},
{"key":"projects.batch4.carrier_groups_pending","source":"مواد کے جائزے سے پہلے نقل و حمل کمپنیوں کے تمام گروپس کا حتمی تعین کریں"},
{"key":"projects.batch4.carrier_rows_pending","source":"يوجد سجلات تشغيل نشطة بدون ناقل معتمد أو بحاجة لحسم. يجب حسم جميع صفوف الناقلين قبل المتابعة."},
{"key":"projects.batch4.carrier_rows_pending","source":"Active log entries have no approved carrier or need resolution. Resolve every carrier row before continuing."},
{"key":"projects.batch4.carrier_rows_pending","source":"فعال لاگ اندراجات کی نقل و حمل کمپنی منظور شدہ نہیں یا فیصلہ زیر التوا ہے۔ آگے بڑھنے سے پہلے متعلقہ ہر قطار کا حتمی تعین کریں۔"},
{"key":"projects.batch4.material_groups_missing","source":"لم يتم اكتشاف أي مجموعات مواد في الملف. المادة مطلوبة لكل سجل تشغيل."},
{"key":"projects.batch4.material_groups_missing","source":"No material groups were found in the file. A material is required for each operational-log entry."},
{"key":"projects.batch4.material_groups_missing","source":"فائل میں مواد کے گروپس نہیں ملے۔ ہر عملیاتی لاگ اندراج کے لیے مواد ضروری ہے۔"},
{"key":"projects.batch4.material_groups_pending","source":"يرجى حسم جميع مجموعات المواد قبل الانتقال إلى مراجعة السائقين والشاحنات"},
{"key":"projects.batch4.material_groups_pending","source":"Resolve all material groups before reviewing drivers and trucks"},
{"key":"projects.batch4.material_groups_pending","source":"ڈرائیوروں اور ٹرکوں کے جائزے سے پہلے مواد کے تمام گروپس کا حتمی تعین کریں"},
{"key":"projects.batch4.material_rows_pending","source":"يوجد سجلات تشغيل نشطة بدون مادة معتمدة أو بحاجة لحسم. يجب حسم جميع صفوف المواد قبل المتابعة."},
{"key":"projects.batch4.material_rows_pending","source":"Active log entries have no approved material or need resolution. Resolve every material row before continuing."},
{"key":"projects.batch4.material_rows_pending","source":"فعال لاگ اندراجات کا مواد منظور شدہ نہیں یا فیصلہ زیر التوا ہے۔ آگے بڑھنے سے پہلے مواد کی ہر قطار کا حتمی تعین کریں۔"},
{"key":"projects.batch4.driver_decision_failed","source":"فشل تطبيق قرار مطابقة السائق"},
{"key":"projects.batch4.driver_decision_failed","source":"Failed to apply the driver matching decision"},
{"key":"projects.batch4.driver_decision_failed","source":"ڈرائیور کی مطابقت کا فیصلہ لاگو نہیں ہو سکا"},
{"key":"projects.batch4.driver_alternative_failed","source":"فشل تعيين السائق البديل"},
{"key":"projects.batch4.driver_alternative_failed","source":"Failed to assign the alternative driver"},
{"key":"projects.batch4.driver_alternative_failed","source":"متبادل ڈرائیور مقرر نہیں ہو سکا"},
{"key":"projects.batch4.driver_prepare_failed","source":"فشلت عملية تجهيز السائق الجديد"},
{"key":"projects.batch4.driver_prepare_failed","source":"Failed to prepare the new driver"},
{"key":"projects.batch4.driver_prepare_failed","source":"نئے ڈرائیور کی تیاری ناکام ہو گئی"},
{"key":"projects.batch4.truck_decision_failed","source":"فشل تطبيق قرار مطابقة الشاحنة"},
{"key":"projects.batch4.truck_decision_failed","source":"Failed to apply the truck matching decision"},
{"key":"projects.batch4.truck_decision_failed","source":"ٹرک کی مطابقت کا فیصلہ لاگو نہیں ہو سکا"},
{"key":"projects.batch4.truck_alternative_failed","source":"فشل تعيين الشاحنة البديلة"},
{"key":"projects.batch4.truck_alternative_failed","source":"Failed to assign the alternative truck"},
{"key":"projects.batch4.truck_alternative_failed","source":"متبادل ٹرک مقرر نہیں ہو سکا"},
{"key":"projects.batch4.truck_prepare_failed","source":"فشلت عملية تجهيز الشاحنة الجديدة"},
{"key":"projects.batch4.truck_prepare_failed","source":"Failed to prepare the new truck"},
{"key":"projects.batch4.truck_prepare_failed","source":"نئے ٹرک کی تیاری ناکام ہو گئی"},
{"key":"entityResolution.messages.created_refresh_failed","source":"تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة."},
{"key":"entityResolution.messages.created_refresh_failed","source":"The record was created successfully, but canonical data could not be refreshed."},
{"key":"entityResolution.messages.created_refresh_failed","source":"ریکارڈ کامیابی سے بن گیا، لیکن مستند ڈیٹا تازہ نہیں ہو سکا۔"},
{"key":"projects.batch4.refresh_retry_failed","source":"فشلت إعادة محاولة تحديث البيانات"},
{"key":"projects.batch4.refresh_retry_failed","source":"Failed to retry refreshing the data"},
{"key":"projects.batch4.refresh_retry_failed","source":"ڈیٹا تازہ کرنے کی دوبارہ کوشش ناکام ہو گئی"},
{"key":"projects.batch4.final_review_groups_missing","source":"تعذر الانتقال للمراجعة النهائية: لا توجد مجموعات سائقين أو شاحنات لتقييمها."},
{"key":"projects.batch4.final_review_groups_missing","source":"Cannot enter final review: no driver or truck groups are available to evaluate."},
{"key":"projects.batch4.final_review_groups_missing","source":"حتمی جائزہ ممکن نہیں: جانچ کے لیے ڈرائیور یا ٹرک کے گروپس موجود نہیں۔"},
{"key":"projects.batch4.final_review_pending","source":"تعذر الانتقال للمراجعة النهائية: توجد بيانات سائقين/شاحنات معلقة أو أخطاء تطابق قيد المعالجة."},
{"key":"projects.batch4.final_review_pending","source":"Cannot enter final review: driver/truck data or matching errors are still pending."},
{"key":"projects.batch4.final_review_pending","source":"حتمی جائزہ ممکن نہیں: ڈرائیور/ٹرک کا ڈیٹا یا مطابقت کی خرابیاں ابھی زیر التوا ہیں۔"},
{"key":"projects.batch4.pre_review_check_failed","source":"حدث خطأ أثناء إجراء الفحص النهائي قبل المراجعة."},
{"key":"projects.batch4.pre_review_check_failed","source":"An error occurred during the final pre-review check."},
{"key":"projects.batch4.pre_review_check_failed","source":"حتمی جائزے سے پہلے جانچ کے دوران خرابی پیش آئی۔"},
{"key":"entityResolution.messages.already_committed","source":"تم اعتماد دفعة الاستيراد بنجاح بالفعل لهذه الجلسة. لا يمكن إعادة الاعتماد."},
{"key":"entityResolution.messages.already_committed","source":"This import batch has already been approved successfully for this session. It cannot be approved again."},
{"key":"entityResolution.messages.already_committed","source":"اس سیشن کے لیے درآمدی بیچ پہلے ہی کامیابی سے منظور ہو چکا ہے۔ اسے دوبارہ منظور نہیں کیا جا سکتا۔"},
{"key":"projects.batch4.commit_preflight_pending","source":"تعذر الاعتماد: أظهر الفحص المسبق وجود بيانات معلقة أو غير مطابقة مجدداً."},
{"key":"projects.batch4.commit_preflight_pending","source":"Cannot approve: the preflight check found pending or unmatched data again."},
{"key":"projects.batch4.commit_preflight_pending","source":"منظوری ممکن نہیں: پیشگی جانچ میں دوبارہ زیر التوا یا غیر مطابق ڈیٹا ملا ہے۔"},
{"key":"projects.messages.checkpoint_full_failure","source":"تم تنفيذ الاستيراد، لكن تعذر حفظ حالة الإكمال. أعد المحاولة لحفظ حالة الجلسة."},
{"key":"projects.messages.checkpoint_full_failure","source":"The import completed, but its completion status could not be saved. Retry saving the session state."},
{"key":"projects.messages.checkpoint_full_failure","source":"درآمد مکمل ہو گئی، لیکن تکمیل کی حیثیت محفوظ نہیں ہو سکی۔ سیشن کی حالت محفوظ کرنے کے لیے دوبارہ کوشش کریں۔"},
{"key":"projects.messages.checkpoint_partial_failure","source":"فشل حفظ نقطة استعادة الجلسة بعد تنفيذ جزئي. تم الاحتفاظ بالبيانات غير المكتملة لإعادة المحاولة."},
{"key":"projects.messages.checkpoint_partial_failure","source":"The import ran partially, but the session checkpoint could not be saved. Incomplete data has been retained for retry."},
{"key":"projects.messages.checkpoint_partial_failure","source":"درآمد جزوی طور پر مکمل ہوئی، لیکن سیشن کا چیک پوائنٹ محفوظ نہیں ہو سکا۔ نامکمل ڈیٹا دوبارہ کوشش کے لیے محفوظ رکھا گیا ہے۔"},
{"key":"projects.batch4.commit_execution_failed","source":"حدث خطأ أثناء تنفيذ عملية الاعتماد"},
{"key":"projects.batch4.commit_execution_failed","source":"An error occurred while executing approval"},
{"key":"projects.batch4.commit_execution_failed","source":"منظوری نافذ کرتے وقت خرابی پیش آئی"},
{"key":"projects.batch4.carrier_decision_failed","source":"فشل تطبيق قرار مطابقة الناقل"},
{"key":"projects.batch4.carrier_decision_failed","source":"Failed to apply the carrier matching decision"},
{"key":"projects.batch4.carrier_decision_failed","source":"نقل و حمل کمپنی کی مطابقت کا فیصلہ لاگو نہیں ہو سکا"},
{"key":"projects.batch4.carrier_alternative_failed","source":"فشل تعيين الناقل البديل"},
{"key":"projects.batch4.carrier_alternative_failed","source":"Failed to assign the alternative carrier"},
{"key":"projects.batch4.carrier_alternative_failed","source":"متبادل نقل و حمل کمپنی مقرر نہیں ہو سکی"},
{"key":"projects.batch4.material_decision_failed","source":"فشل تطبيق قرار مطابقة المادة"},
{"key":"projects.batch4.material_decision_failed","source":"Failed to apply the material matching decision"},
{"key":"projects.batch4.material_decision_failed","source":"مواد کی مطابقت کا فیصلہ لاگو نہیں ہو سکا"},
{"key":"projects.batch4.material_alternative_failed","source":"فشل تعيين المادة البديلة"},
{"key":"projects.batch4.material_alternative_failed","source":"Failed to assign the alternative material"},
{"key":"projects.batch4.material_alternative_failed","source":"متبادل مواد مقرر نہیں ہو سکا"},
{"key":"projects.batch4.sheets_integration_pending","source":"تكامل جداول بيانات جوجل (Google Sheets) لهذا المشروع قيد الإنجاز والتوافق"},
{"key":"projects.batch4.sheets_integration_pending","source":"Google Sheets integration for this project workspace is pending convergence"},
{"key":"projects.batch4.sheets_integration_pending","source":"اس پروجیکٹ کی ورک اسپیس کے لیے Google Sheets کا انضمام ابھی تکمیل کے مراحل میں ہے"},
{"key":"projects.batch4.pricing_add_failed","source":"خطأ في إضافة تعرفة السعر"},
{"key":"projects.batch4.pricing_add_failed","source":"Failed to add the pricing tariff"},
{"key":"projects.batch4.pricing_add_failed","source":"قیمت کا کرایہ شامل نہیں ہو سکا"},
{"key":"projects.batch4.project_status_success","source":"تمت ترقية حالة المشروع بنجاح إلى: {status}"},
{"key":"projects.batch4.project_status_success","source":"Project status advanced successfully to: {status}"},
{"key":"projects.batch4.project_status_success","source":"پروجیکٹ کی حالت کامیابی سے آگے بڑھ گئی: {status}"},
{"key":"projects.batch4.project_status_failed","source":"خطأ في ترقية حالة المشروع"},
{"key":"projects.batch4.project_status_failed","source":"Failed to advance the project status"},
{"key":"projects.batch4.project_status_failed","source":"پروجیکٹ کی حالت آگے نہیں بڑھ سکی"},
{"key":"projects.batch4.activation_success","source":"تم تنشيط المشروع بنجاح"},
{"key":"projects.batch4.activation_success","source":"Project activated successfully"},
{"key":"projects.batch4.activation_success","source":"پروجیکٹ کامیابی سے فعال ہو گیا"},
{"key":"projects.batch4.activation_error","source":"فشل التنشيط: {error}"},
{"key":"projects.batch4.activation_error","source":"Activation failed: {error}"},
{"key":"projects.batch4.activation_error","source":"فعال کرنا ناکام ہو گیا: {error}"},
{"key":"entityResolution.messages.version_conflict_correction","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر حفظ تصحيح الصف"},
{"key":"entityResolution.messages.version_conflict_correction","source":"Session version conflict (VERSION_CONFLICT): row correction could not be saved"},
{"key":"entityResolution.messages.version_conflict_correction","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT): قطار کی اصلاح محفوظ نہیں ہو سکی"},
{"key":"entityResolution.messages.row_correction_save_failed","source":"فشل في حفظ تصحيح بيانات الصف"},
{"key":"entityResolution.messages.row_correction_save_failed","source":"Row corrections could not be saved"},
{"key":"entityResolution.messages.row_correction_save_failed","source":"قطار کی اصلاحات محفوظ نہیں ہو سکیں"},
{"key":"entityResolution.messages.version_conflict_matching","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر حفظ قرار المطابقة"},
{"key":"entityResolution.messages.version_conflict_matching","source":"Session version conflict (VERSION_CONFLICT): matching decision could not be saved"},
{"key":"entityResolution.messages.version_conflict_matching","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT): مطابقت کا فیصلہ محفوظ نہیں ہو سکا"},
{"key":"entityResolution.messages.matching_decision_save_failed","source":"فشل في حفظ قرار المطابقة في جلسة الخادم"},
{"key":"entityResolution.messages.matching_decision_save_failed","source":"Matching decision could not be saved in the server session"},
{"key":"entityResolution.messages.matching_decision_save_failed","source":"سرور کے سیشن میں مطابقت کا فیصلہ محفوظ نہیں ہو سکا"},
{"key":"entityResolution.messages.version_conflict","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT)"},
{"key":"entityResolution.messages.version_conflict","source":"Session version conflict (VERSION_CONFLICT)"},
{"key":"entityResolution.messages.version_conflict","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT)"},
{"key":"entityResolution.messages.group_entity_create_failed","source":"فشل في إنشاء الكيان وإسقاطه على المجموعة"},
{"key":"entityResolution.messages.group_entity_create_failed","source":"Entity creation and application to the group failed"},
{"key":"entityResolution.messages.group_entity_create_failed","source":"اکائی بنانے اور اسے گروپ پر لاگو کرنے کا عمل ناکام ہوا"},
{"key":"entityResolution.messages.file_discovery_failed","source":"حدث خطأ أثناء فحص واستكشاف الملف"},
{"key":"entityResolution.messages.file_discovery_failed","source":"An error occurred while inspecting and discovering the file"},
{"key":"entityResolution.messages.file_discovery_failed","source":"فائل کی جانچ اور شناخت کے دوران خرابی پیش آئی"},
{"key":"entityResolution.messages.version_conflict_refresh","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT): يرجى تحديث الصفحة"},
{"key":"entityResolution.messages.version_conflict_refresh","source":"Session version conflict (VERSION_CONFLICT): refresh the page"},
{"key":"entityResolution.messages.version_conflict_refresh","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT): صفحہ تازہ کریں"},
{"key":"entityResolution.messages.file_processing_failed","source":"فشل في تحليل ومعالجة ملف الاستيراد"},
{"key":"entityResolution.messages.file_processing_failed","source":"Could not analyze and process the import file"},
{"key":"entityResolution.messages.file_processing_failed","source":"درآمدی فائل کا تجزیہ اور پراسیسنگ نہیں ہو سکی"},
{"key":"entityResolution.messages.version_conflict_review","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر حفظ إجراء المراجعة"},
{"key":"entityResolution.messages.version_conflict_review","source":"Session version conflict (VERSION_CONFLICT): review action could not be saved"},
{"key":"entityResolution.messages.version_conflict_review","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT): جائزے کی کارروائی محفوظ نہیں ہو سکی"},
{"key":"entityResolution.messages.review_save_failed","source":"فشل في حفظ إجراء المراجعة في جلسة الخادم"},
{"key":"entityResolution.messages.review_save_failed","source":"The review action could not be saved in the server session"},
{"key":"entityResolution.messages.review_save_failed","source":"سرور کے سیشن میں جائزے کی کارروائی محفوظ نہیں ہو سکی"},
{"key":"entityResolution.messages.shipment_commit_failed","source":"فشل في تنفيذ الاعتماد وحفظ الشحنات"},
{"key":"entityResolution.messages.shipment_commit_failed","source":"Approval and shipment saving failed"},
{"key":"entityResolution.messages.shipment_commit_failed","source":"منظوری اور کھیپیں محفوظ کرنے کا عمل ناکام ہوا"},
{"key":"entityResolution.messages.offline_sheet_listing","source":"التطبيق في وضع عدم الاتصال (Offline). لا يمكن استعراض جداول بيانات Google."},
{"key":"entityResolution.messages.offline_sheet_listing","source":"The app is offline. Google spreadsheets cannot be listed."},
{"key":"entityResolution.messages.offline_sheet_listing","source":"ایپ آف لائن ہے۔ Google کی اسپریڈشیٹس کی فہرست نہیں دکھائی جا سکتی۔"},
{"key":"entityResolution.messages.sheet_listing_failed","source":"فشل في استعراض جداول بيانات Google Sheets للمشروع"},
{"key":"entityResolution.messages.sheet_listing_failed","source":"Could not list the project's Google spreadsheets"},
{"key":"entityResolution.messages.sheet_listing_failed","source":"پروجیکٹ کی Google اسپریڈشیٹس کی فہرست حاصل نہیں ہو سکی"},
{"key":"entityResolution.messages.offline_sheet_fetch","source":"التطبيق غير متصل بالإنترنت. لا يمكن جلب بيانات ورقة العمل أثناء انقطاع الاتصال."},
{"key":"entityResolution.messages.offline_sheet_fetch","source":"The app is offline. Worksheet data cannot be fetched without a connection."},
{"key":"entityResolution.messages.offline_sheet_fetch","source":"ایپ آف لائن ہے۔ کنکشن کے بغیر ورک شیٹ کا ڈیٹا حاصل نہیں کیا جا سکتا۔"},
{"key":"entityResolution.messages.session_create_stopped","source":"فشل في إنشاء جلسة الاستيراد على الخادم. تم إيقاف المعالجة."},
{"key":"entityResolution.messages.session_create_stopped","source":"The import session could not be created on the server. Processing was stopped."},
{"key":"entityResolution.messages.session_create_stopped","source":"سرور پر درآمدی سیشن نہیں بن سکا۔ کارروائی روک دی گئی۔"},
{"key":"entityResolution.messages.sheet_processing_failed","source":"فشل في معالجة بيانات ورقة العمل عبر مسار الاستيراد الموحد"},
{"key":"entityResolution.messages.sheet_processing_failed","source":"Worksheet data could not be processed through the unified import pipeline"},
{"key":"entityResolution.messages.sheet_processing_failed","source":"ورک شیٹ کا ڈیٹا متحدہ درآمدی سلسلے سے پراسیس نہیں ہو سکا"},
{"key":"entityResolution.messages.connection_required_commit","source":"يجب توفر اتصال بالإنترنت لاعتماد الشحنات في قاعدة البيانات الرئيسية."},
{"key":"entityResolution.messages.connection_required_commit","source":"An internet connection is required to approve shipments in the primary database."},
{"key":"entityResolution.messages.connection_required_commit","source":"مرکزی ڈیٹا بیس میں کھیپوں کی منظوری کے لیے انٹرنیٹ کنکشن ضروری ہے۔"},
{"key":"entityResolution.messages.authentication_required_commit","source":"يتطلب الاعتماد مستخدماً مصادقاً عليه (Unauthenticated - Access Denied)"},
{"key":"entityResolution.messages.authentication_required_commit","source":"An authenticated user is required for approval (Unauthenticated - Access Denied)"},
{"key":"entityResolution.messages.authentication_required_commit","source":"منظوری کے لیے تصدیق شدہ صارف ضروری ہے (Unauthenticated - Access Denied)"},
{"key":"entityResolution.messages.version_conflict_partial_commit","source":"تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر تحديث حالة الاعتماد الجزئي"},
{"key":"entityResolution.messages.version_conflict_partial_commit","source":"Session version conflict (VERSION_CONFLICT): partial approval status could not be updated"},
{"key":"entityResolution.messages.version_conflict_partial_commit","source":"سیشن کے ورژن میں تضاد (VERSION_CONFLICT): جزوی منظوری کی حیثیت اپ ڈیٹ نہیں ہو سکی"},
{"key":"entityResolution.messages.carrier_save_failed","source":"حدث خطأ أثناء حفظ الناقل"},
{"key":"entityResolution.messages.carrier_save_failed","source":"An error occurred while saving the carrier"},
{"key":"entityResolution.messages.carrier_save_failed","source":"نقل و حمل کی کمپنی محفوظ کرتے وقت خرابی پیش آئی"},
{"key":"entityResolution.messages.carrier_saved_refresh_failed","source":"تم حفظ الناقل بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل."},
{"key":"entityResolution.messages.carrier_saved_refresh_failed","source":"The carrier was saved, but project data could not be refreshed immediately. Retry the refresh before continuing."},
{"key":"entityResolution.messages.carrier_saved_refresh_failed","source":"نقل و حمل کی کمپنی محفوظ ہو گئی، لیکن پروجیکٹ کا ڈیٹا فوراً تازہ نہیں ہو سکا۔ آگے بڑھنے سے پہلے ڈیٹا دوبارہ تازہ کریں۔"},
{"key":"entityResolution.messages.carrier_update_failed","source":"حدث خطأ أثناء تعديل بيانات الناقل"},
{"key":"entityResolution.messages.carrier_update_failed","source":"An error occurred while updating the carrier"},
{"key":"entityResolution.messages.carrier_update_failed","source":"نقل و حمل کی کمپنی کا ڈیٹا اپ ڈیٹ کرتے وقت خرابی پیش آئی"},
{"key":"entityResolution.messages.carrier_updated_refresh_failed","source":"تم حفظ تعديلات الناقل بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل."},
{"key":"entityResolution.messages.carrier_updated_refresh_failed","source":"Carrier changes were saved, but project data could not be refreshed immediately. Retry the refresh before continuing."},
{"key":"entityResolution.messages.carrier_updated_refresh_failed","source":"نقل و حمل کی کمپنی کی تبدیلیاں محفوظ ہو گئیں، لیکن پروجیکٹ کا ڈیٹا فوراً تازہ نہیں ہو سکا۔ آگے بڑھنے سے پہلے ڈیٹا دوبارہ تازہ کریں۔"},
{"key":"entityResolution.messages.material_create_failed","source":"حدث خطأ أثناء إنشاء المادة"},
{"key":"entityResolution.messages.material_create_failed","source":"An error occurred while creating the material"},
{"key":"entityResolution.messages.material_create_failed","source":"مواد بناتے وقت خرابی پیش آئی"},
{"key":"entityResolution.messages.material_saved_refresh_failed","source":"تم حفظ المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل."},
{"key":"entityResolution.messages.material_saved_refresh_failed","source":"The material was saved, but project data could not be refreshed immediately. Retry the refresh before continuing."},
{"key":"entityResolution.messages.material_saved_refresh_failed","source":"مواد محفوظ ہو گیا، لیکن پروجیکٹ کا ڈیٹا فوراً تازہ نہیں ہو سکا۔ آگے بڑھنے سے پہلے ڈیٹا دوبارہ تازہ کریں۔"},
{"key":"entityResolution.messages.material_update_failed","source":"حدث خطأ أثناء تعديل بيانات المادة"},
{"key":"entityResolution.messages.material_update_failed","source":"An error occurred while updating the material"},
{"key":"entityResolution.messages.material_update_failed","source":"مواد اپ ڈیٹ کرتے وقت خرابی پیش آئی"},
{"key":"entityResolution.messages.material_updated_refresh_failed","source":"تم حفظ تعديلات المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل."},
{"key":"entityResolution.messages.material_updated_refresh_failed","source":"Material changes were saved, but project data could not be refreshed immediately. Retry the refresh before continuing."},
{"key":"entityResolution.messages.material_updated_refresh_failed","source":"مواد کی تبدیلیاں محفوظ ہو گئیں، لیکن پروجیکٹ کا ڈیٹا فوراً تازہ نہیں ہو سکا۔ آگے بڑھنے سے پہلے ڈیٹا دوبارہ تازہ کریں۔"},
{"key":"entityResolution.messages.driver_source_conflicts","source":"توجد بيانات متعارضة لهذا السائق في الملف يجب إدخال القيمة المعتمدة لها"},
{"key":"entityResolution.messages.driver_source_conflicts","source":"Conflicting driver data was found in the file. Enter the approved values."},
{"key":"entityResolution.messages.driver_source_conflicts","source":"فائل میں ڈرائیور کا متضاد ڈیٹا ملا ہے۔ منظور شدہ اقدار درج کریں۔"},
{"key":"entityResolution.messages.driver_resolve_before_create","source":"يجب حسم وإدخال القيم المعتمدة للبيانات المتعارضة للسائق قبل الإنشاء"},
{"key":"entityResolution.messages.driver_resolve_before_create","source":"Resolve the driver's conflicting data and enter approved values before creation"},
{"key":"entityResolution.messages.driver_resolve_before_create","source":"بنانے سے پہلے ڈرائیور کے متضاد ڈیٹا کا حتمی تعین کریں اور منظور شدہ اقدار درج کریں"},
{"key":"entityResolution.messages.driver_name_required","source":"اسم السائق مطلوب"},
{"key":"entityResolution.messages.driver_name_required","source":"Driver name is required"},
{"key":"entityResolution.messages.driver_name_required","source":"ڈرائیور کا نام لازمی ہے"},
{"key":"entityResolution.messages.residency_identifier_length","source":"رقم الهوية الوطنية أو الإقامة يجب أن يتكون من 10 أرقام"},
{"key":"entityResolution.messages.residency_identifier_length","source":"National ID or residency number must contain 10 digits"},
{"key":"entityResolution.messages.residency_identifier_length","source":"قومی شناخت یا اقامہ نمبر 10 ہندسوں پر مشتمل ہونا چاہیے"},
{"key":"entityResolution.messages.driver_create_failed","source":"فشلت عملية إنشاء السائق"},
{"key":"entityResolution.messages.driver_create_failed","source":"Driver creation failed"},
{"key":"entityResolution.messages.driver_create_failed","source":"ڈرائیور بنانے کا عمل ناکام ہو گیا"},
{"key":"entityResolution.messages.truck_source_conflicts","source":"توجد بيانات متعارضة لهذه الشاحنة في الملف يجب إدخال القيمة المعتمدة لها"},
{"key":"entityResolution.messages.truck_source_conflicts","source":"Conflicting truck data was found in the file. Enter the approved values."},
{"key":"entityResolution.messages.truck_source_conflicts","source":"فائل میں ٹرک کا متضاد ڈیٹا ملا ہے۔ منظور شدہ اقدار درج کریں۔"},
{"key":"entityResolution.messages.truck_resolve_before_create","source":"يجب حسم وإدخال القيم المعتمدة للبيانات المتعارضة للشاحنة قبل الإنشاء"},
{"key":"entityResolution.messages.truck_resolve_before_create","source":"Resolve the truck's conflicting data and enter approved values before creation"},
{"key":"entityResolution.messages.truck_resolve_before_create","source":"بنانے سے پہلے ٹرک کے متضاد ڈیٹا کا حتمی تعین کریں اور منظور شدہ اقدار درج کریں"},
{"key":"entityResolution.messages.truck_plate_required","source":"رقم لوحة الشاحنة مطلوب"},
{"key":"entityResolution.messages.truck_plate_required","source":"Truck license plate is required"},
{"key":"entityResolution.messages.truck_plate_required","source":"ٹرک کی نمبر پلیٹ لازمی ہے"},
{"key":"entityResolution.messages.truck_create_failed","source":"فشلت عملية إنشاء الشاحنة"},
{"key":"entityResolution.messages.truck_create_failed","source":"Truck creation failed"},
{"key":"entityResolution.messages.truck_create_failed","source":"ٹرک بنانے کا عمل ناکام ہو گیا"},
{"key":"batch4.service.stage_prerequisite_1","source":"PREREQUISITE_MISSING: Source file is required to enter MAPPING_APPROVAL"},
{"key":"batch4.service.stage_prerequisite_2","source":"PREREQUISITE_MISSING: Discovery result is required to enter MAPPING_APPROVAL"},
{"key":"batch4.service.stage_prerequisite_3","source":"PREREQUISITE_MISSING: Detected headers are required to enter MAPPING_APPROVAL"},
{"key":"batch4.service.stage_prerequisite_4","source":"PREREQUISITE_MISSING: Mapping must be explicitly approved to enter CARRIER_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_5","source":"PREREQUISITE_MISSING: Processed import batch is required to enter CARRIER_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_6","source":"PREREQUISITE_MISSING: Import batch required for MATERIAL_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_7","source":"PREREQUISITE_MISSING: CARRIER_RESOLUTION stage must be reached before MATERIAL_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_8","source":"PREREQUISITE_MISSING: Import batch required for DRIVER_TRUCK_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_9","source":"PREREQUISITE_MISSING: MATERIAL_RESOLUTION stage must be reached before DRIVER_TRUCK_RESOLUTION"},
{"key":"batch4.service.stage_prerequisite_10","source":"PREREQUISITE_MISSING: Import batch required for FINAL_REVIEW"},
{"key":"batch4.service.stage_prerequisite_11","source":"PREREQUISITE_MISSING: DRIVER_TRUCK_RESOLUTION stage must be reached before FINAL_REVIEW"},
{"key":"batch4.service.stage_prerequisite_12","source":"PREREQUISITE_MISSING: Import batch required for COMMIT_RESULT"},
{"key":"batch4.service.stage_prerequisite_13","source":"PREREQUISITE_MISSING: Commit execution must be attempted/completed to enter COMMIT_RESULT"},
{"key":"batch4.service.stage_jump","source":"ILLEGAL_STAGE_JUMP: Cannot jump directly from {value0} to {value1}. Stages must be resolved in sequence."},
{"key":"batch4.service.unknown_error","source":"خطأ غير معروف"},
  {
    "key": "batch4.service.required_field_blocks",
    "source": "حقل إلزامي مفقود يمنع الاعتماد"
  },
  {
    "key": "batch4.service.nonstandard_field_warning",
    "source": "تنبيه: صيغة الحقل غير قياسية ولكن مقبولة مع التحذير"
  },
  {
    "key": "batch4.service.duplicate_in_batch",
    "source": "تكرار داخل نفس دفعة الاستيراد للمفتاح ({value0})"
  },
  {
    "key": "batch4.service.key_already_in_database",
    "source": "المفتاح ({value0}) مسجل مسبقاً في قاعدة البيانات"
  },
  {
    "key": "batch4.service.row_missing",
    "source": "الصف #{value0} غير موجود في الدفعة"
  },
  {
    "key": "batch4.service.carrier_not_registered",
    "source": "الناقل ({value0}) غير مسجل في السجلات المعتمدة للمشروع."
  },
  {
    "key": "batch4.service.truck_not_registered",
    "source": "الشاحنة / اللوحة ({value0}) غير مسجلة في سجلات أسطول المشروع."
  },
  {
    "key": "batch4.service.driver_not_registered",
    "source": "السائق ({value0}) غير مسجل في قاعدة بيانات السائقين للمشروع."
  },
  {
    "key": "batch4.service.material_not_registered",
    "source": "المادة ({value0}) غير مسجلة في قائمة المواد المعتمدة للمشروع."
  },
  {
    "key": "batch4.service.ticket_required",
    "source": "رقم تذكرة الميزان إلزامي لاعتماد بيانات الميزان."
  },
  {
    "key": "batch4.service.ticket_required",
    "source": "Ticket ID is required for weighbridge intake."
  },
  {
    "key": "batch4.service.truck_required",
    "source": "رقم لوحة / تعريف الشاحنة إلزامي لاعتماد بيانات الميزان."
  },
  {
    "key": "batch4.service.truck_required",
    "source": "Truck number / plate is required for weighbridge intake."
  },
  {
    "key": "batch4.service.weigh_date_required",
    "source": "تاريخ عملية الوزن إلزامي لاعتماد بيانات الميزان."
  },
  {
    "key": "batch4.service.weigh_date_required",
    "source": "Shift date is required for weighbridge intake."
  },
  {
    "key": "batch4.service.tare_required",
    "source": "وزن الفارغ إلزامي لاعتماد بيانات الميزان."
  },
  {
    "key": "batch4.service.tare_required",
    "source": "Tare weight is required for weighbridge intake."
  },
  {
    "key": "batch4.service.gross_required",
    "source": "وزن القائم إلزامي لاعتماد بيانات الميزان."
  },
  {
    "key": "batch4.service.gross_required",
    "source": "Gross weight is required for weighbridge intake."
  },
  {
    "key": "batch4.service.ticket_or_plate_required",
    "source": "بيانات التعريف مفقودة: يجب توفر رقم التذكرة أو رقم اللوحة على الأقل."
  },
  {
    "key": "batch4.service.ticket_or_plate_required",
    "source": "Missing both Ticket ID and Truck Plate. At least one required."
  },
  {
    "key": "batch4.service.tare_not_numeric",
    "source": "الوزن الفارغ غير صالح (قيمة رقمية غير صحيحة)"
  },
  {
    "key": "batch4.service.tare_not_numeric",
    "source": "Tare weight is not a valid number"
  },
  {
    "key": "batch4.service.tare_positive",
    "source": "الوزن الفارغ يجب أن يكون أكبر من الصفر"
  },
  {
    "key": "batch4.service.tare_positive",
    "source": "Tare weight must be strictly positive"
  },
  {
    "key": "batch4.service.gross_not_numeric",
    "source": "الوزن الإجمالي/القائم غير صالح (قيمة رقمية غير صحيحة)"
  },
  {
    "key": "batch4.service.gross_not_numeric",
    "source": "Gross weight is not a valid number"
  },
  {
    "key": "batch4.service.gross_positive",
    "source": "الوزن الإجمالي لا يمكن أن يكون سالباً أو صفراً"
  },
  {
    "key": "batch4.service.gross_positive",
    "source": "Gross weight must be strictly positive"
  },
  {
    "key": "batch4.service.net_not_numeric",
    "source": "الوزن الصافي غير صالح (قيمة رقمية غير صحيحة)"
  },
  {
    "key": "batch4.service.net_not_numeric",
    "source": "Net weight is not a valid number"
  },
  {
    "key": "batch4.service.net_nonnegative",
    "source": "الوزن الصافي لا يمكن أن يكون سالباً"
  },
  {
    "key": "batch4.service.net_nonnegative",
    "source": "Net weight cannot be negative"
  },
  {
    "key": "batch4.service.gross_below_tare",
    "source": "مخالفة فيزيائية حتمية للميزان: الوزن القائم ({value0} كجم) أقل من الوزن الفارغ ({value1} كجم)."
  },
  {
    "key": "batch4.service.gross_below_tare",
    "source": "Physical invariant violated: Gross weight ({value0}) is less than Tare weight ({value1})"
  },
  {
    "key": "batch4.service.net_calculation_mismatch",
    "source": "الوزن الصافي المسجل في التذكرة ({value0} كجم) يختلف عن الصافي المحسوب (القائم {value1} - الفارغ {value2} = {value3} كجم) بفارق {value4} كجم."
  },
  {
    "key": "batch4.service.net_calculation_mismatch",
    "source": "Imported net weight ({value0} kg) does not match calculated weight (gross {value1} - tare {value2} = {value3} kg). Difference: {value4} kg."
  },
  {
    "key": "batch4.service.invalid_date_format",
    "source": "صيغة التاريخ غير صالحة ({value0}). يجب أن تكون YYYY-MM-DD."
  },
  {
    "key": "batch4.service.invalid_date_format",
    "source": "Invalid date format ({value0}). Expected YYYY-MM-DD."
  },
  {
    "key": "batch4.service.driver_missing_warning",
    "source": "اسم السائق غير مدخل. يمكن قبول الشحنة بدون سائق محدد كتحذير."
  },
  {
    "key": "batch4.service.driver_missing_warning",
    "source": "Driver name is missing. Trip can proceed without assigned driver."
  },
  {
    "key": "batch4.service.unload_missing_warning",
    "source": "بيانات وزن الوصول/التفريغ غير متوفرة. تم قبول الصف كشحنة محملة من الميزان."
  },
  {
    "key": "batch4.service.unload_missing_warning",
    "source": "Unload net weight missing. Row accepted as weighbridge origin loading dispatch."
  },
  {
    "key": "batch4.service.truck_not_approved",
    "source": "الشاحنة / اللوحة ({value0}) غير مسجلة في السجلات المعتمدة للمشروع."
  },
  {
    "key": "batch4.service.truck_not_approved",
    "source": "Truck plate ({value0}) not found in master records."
  },
  {
    "key": "batch4.service.truck_carrier_conflict",
    "source": "تعارض في العلاقة: الشاحنة ({value0}) مرتبطة في السجلات بالناقل ({value1}) بينما السجل الوارد ينسبها للناقل ({value2})."
  },
  {
    "key": "batch4.service.truck_carrier_conflict",
    "source": "Truck ({value0}) is assigned to carrier ({value1}) in master records, but row lists carrier ({value2})."
  },
  {
    "key": "batch4.service.truck_carrier_missing",
    "source": "تم التعرف على الشاحنة ({value0}) ولكن بيان الناقل مفقود من السجل الوارد. يمنع تخمين الناقل تلقائياً."
  },
  {
    "key": "batch4.service.truck_carrier_missing",
    "source": "Truck ({value0}) recognized in master data, but carrier is missing from the row. Carrier must not be guessed automatically."
  },
  {
    "key": "batch4.service.driver_carrier_conflict",
    "source": "تعارض كفالة السائق: السائق ({value0}) مرتبط بالناقل ({value1}) بينما السجل الوارد ينسبه للناقل ({value2})."
  },
  {
    "key": "batch4.service.driver_carrier_conflict",
    "source": "Driver ({value0}) is associated with carrier ({value1}), but row lists carrier ({value2})."
  },
  {
    "key": "batch4.service.material_not_authorized",
    "source": "المادة ({value0}) غير مصرح بها أو غير معتمدة ضمن نطاق هذا المشروع ({value1})."
  },
  {
    "key": "batch4.service.material_not_authorized",
    "source": "Material ({value0}) is not authorized for project ({value1})."
  },
  {
    "key": "batch4.service.legacy_variance_mismatch",
    "source": "فارق الوزن المسجل بالشيت القديم ({value0} كجم) يختلف عن الفارق المحسوب بين الصافي وصافي الوصول ({value1} كجم) بفارق {value2} كجم."
  },
  {
    "key": "batch4.service.legacy_variance_mismatch",
    "source": "Legacy sheet variance ({value0} kg) does not match calculated variance ({value1} kg). Difference: {value2} kg."
  },
  {
    "key": "batch4.service.unknown_legacy_status",
    "source": "حالة الرحلة في الشيت القديم ({value0}) غير معروفة وتتطلب مراجعة."
  },
  {
    "key": "batch4.service.unknown_legacy_status",
    "source": "Legacy trip status ({value0}) is unrecognized and requires review."
  },
  {
    "key": "batch4.service.duplicate_file_row",
    "source": "تكرار داخل نفس الملف مع الصف رقم ({value0}) للمفتاح ({value1})"
  },
  {
    "key": "batch4.service.key_exists_system",
    "source": "المفتاح ({value0}) مسجل مسبقاً في قاعدة بيانات النظام"
  },
  {
    "key": "batch4.service.user_context_missing",
    "source": "UNAUTHENTICATED: سياق المستخدم مفقود"
  },
  {
    "key": "batch4.service.http_failure",
    "source": "فشل الاتصال بالخادم HTTP {value0}"
  },
  {
    "key": "batch4.service.approved_carrier_required",
    "source": "معرف الناقل المعتمد مطلوب"
  },
  {
    "key": "batch4.service.approved_truck_required",
    "source": "معرف الشاحنة المعتمد مطلوب"
  },
  {
    "key": "batch4.service.approved_driver_required",
    "source": "معرف السائق المعتمد مطلوب"
  },
  {
    "key": "batch4.service.approved_material_required",
    "source": "معرف المادة المعتمد مطلوب"
  },
  {
    "key": "batch4.service.entity_review_required",
    "source": "يجب مراجعة مطابقة الكيانات أولاً لهذا الصف"
  },
  {
    "key": "batch4.service.row_server_save_failed",
    "source": "فشل حفظ الرحلة في الخادم للصف {value0}: {value1}"
  },
  {
    "key": "batch4.service.project_not_found",
    "source": "المشروع غير موجود"
  },
  {
    "key": "batch4.service.carrier_not_found",
    "source": "الناقل غير موجود"
  },
  {
    "key": "batch4.service.material_not_found",
    "source": "المادة غير موجودة"
  },
  
  {
    "key": "batch4.service.truck_not_found",
    "source": "الشاحنة غير موجودة"
  },
  {
    "key": "batch4.service.driver_not_found",
    "source": "السائق غير موجود"
  },
  {
    "key": "batch4.service.user_not_found",
    "source": "المستخدم غير موجود"
  },
  
  {
    "key": "batch4.service.legacy_no_pricing",
    "source": "لا توجد اتفاقية تسعير سارية لهذا الناقل والمادة. يتم الاحتفاظ بسعر الشيت القديم كمرجع تاريخي فقط."
  },
  {
    "key": "batch4.service.legacy_carrier_unresolved",
    "source": "الناقل غير معتمد أو غير محدد بدقة. يتم الاحتفاظ بسعر الشيت القديم كمرجع تاريخي مع تعليق التسعيرة (PENDING)."
  },
  {
    "key": "batch4.service.migration_preview_expired",
    "source": "تقرير الترحيل غير موجود أو انتهت صلاحية جلسة المعاينة."
  },
  {
    "key": "batch4.service.migration_admin_required",
    "source": "غير مصرح: ترحيل واعتماد البيانات التاريخية يتطلب صلاحية مدير النظام (PROJECT_ADMIN)."
  },
  {
    "key": "batch4.service.migration_batch_unavailable",
    "source": "دفعة المعالجة الموحدة غير مهيأة."
  },
  {
    "key": "batch4.service.project_create_super_admin",
    "source": "غير مصرح لك: إنشاء المشاريع مقتصر فقط على مدير النظام (SUPER_ADMIN)"
  },
  {
    "key": "batch4.service.project_activation_on_create",
    "source": "لا يمكن تنشيط المشروع مباشرة عند الإنشاء"
  },
  {
    "key": "batch4.service.project_edit_forbidden",
    "source": "غير مصرح لك بتعديل بيانات المشروع"
  },
  {
    "key": "batch4.service.project_activation_formal",
    "source": "لا يمكن تنشيط المشروع عبر تحديث عام. يرجى استخدام عملية التنشيط الرسمية."
  },
  {
    "key": "batch4.service.project_governance_formal",
    "source": "لا يمكن تعديل حالة دورة حياة المشروع عبر التحديث العام. يرجى استخدام عملية انتقال الحوكمة المعتمدة."
  },
  
  {
    "key": "batch4.service.workspace_login_required",
    "source": "غير مصرح: يجب تسجيل الدخول بحساب المستخدم لتنفيذ عمليات مساحة العمل (Firebase Authentication required)"
  },
  {
    "key": "batch4.service.workspace_token_missing",
    "source": "فشل استخراج رمز تعريف المستخدم (Firebase ID Token missing)"
  },
  {
    "key": "batch4.service.workspace_token_failed",
    "source": "فشل استخراج رمز تعريف المستخدم: {value0}"
  },
  {
    "key": "batch4.service.google_access_token_missing",
    "source": "لم يتم إرجاع رمز الوصول (Access Token) من حساب Google"
  },
  {
    "key": "batch4.service.workspace_auth_failed",
    "source": "فشل المصادقة مع Google Workspace: {value0}"
  },
  {
    "key": "batch4.service.workspace_projection_ids_required",
    "source": "معرف المشروع وشيت المزامنة مطلوبان لإتمام الإسقاط الأولي"
  },
  {
    "key": "batch4.service.parser_no_input",
    "source": "لا توجد بيانات مدخلة للتحليل (No input data provided)"
  },
  {
    "key": "batch4.service.excel_read_failed",
    "source": "فشل في قراءة ملف الإكسل: {value0}"
  },
  {
    "key": "batch4.service.excel_sheet_missing",
    "source": "ورقة العمل المحددة ({value0}) غير موجودة في ملف الإكسل. الأوراق المتاحة: {value1}"
  },
  {
    "key": "batch4.service.roster_empty_row",
    "source": "الصف فارغ، لا يحتوي على بيانات سائق أو شاحنة."
  },
  {
    "key": "batch4.service.roster_driver_required",
    "source": "اسم السائق مطلوب ومفقود."
  },
  {
    "key": "batch4.service.roster_identity_ten_digits",
    "source": "رقم الهوية أو الإقامة يجب أن يتكون من 10 أرقام."
  },
  {
    "key": "batch4.service.roster_plate_required",
    "source": "رقم لوحة الشاحنة مطلوب ومفقود."
  },
  {
    "key": "batch4.service.roster_carrier_not_approved",
    "source": "الناقل غير معرّف أو غير مصرح به في هذا المشروع."
  },
  {
    "key": "batch4.service.roster_material_not_approved",
    "source": "المادة غير معرّفة أو غير مصرح بها في هذا المشروع."
  },
  {
    "key": "batch4.service.roster_material_unknown",
    "source": "المادة غير معرّفة في المشروع [{value0}]"
  },
  {
    "key": "batch4.service.roster_truck_exists",
    "source": "الشاحنة مسجلة مسبقاً في قاعدة البيانات برقم اللوحة: {value0}"
  },
  {
    "key": "batch4.service.roster_driver_exists",
    "source": "السائق مسجل مسبقاً في قاعدة البيانات برقم الهوية: {value0}"
  },
  {
    "key": "batch4.service.roster_carrier_id_missing",
    "source": "فشل الاستيراد لعدم تحديد معرف الناقل المعتمد."
  },
  {
    "key": "batch4.service.roster_material_id_missing",
    "source": "فشل الاستيراد لعدم تحديد معرف المادة المعتمد."
  },
  {
    "key": "batch4.service.roster_gateway_save_failed",
    "source": "فشل الحفظ عبر البوابة الموحدة: {value0}"
  },
  {
    "key": "batch4.service.file_extension_not_supported",
    "source": "امتداد الملف ({value0}) غير مدعوم. الصيغ المقبولة: .xlsx, .xls, .csv"
  },
  {
    "key": "batch4.service.file_empty",
    "source": "الملف فارغ (0 بايت) ولا يحتوي على أي بيانات"
  },
  {
    "key": "batch4.service.file_too_large",
    "source": "حجم الملف ({value0} ميغابايت) يتجاوز الحد الأقصى المسموح به (25 ميغابايت)"
  },
  {
    "key": "batch4.service.excel_mime_invalid",
    "source": "نوع وسائط الملف ({value0}) لا يتطابق مع ملفات إكسل المعتمدة"
  },
  {
    "key": "batch4.service.csv_mime_invalid",
    "source": "نوع وسائط الملف ({value0}) لا يتطابق مع ملفات CSV المعتمدة"
  },
  {
    "key": "batch4.service.smart_source_unsupported",
    "source": "نوع المصدر غير مدعوم للتحليل الذكي: {value0}"
  },
  {
    "key": "batch4.service.duplicate_schema_fields",
    "source": "تكرار في حقول المخطط لنفس العمود: {value0}"
  },
  {
    "key": "batch4.service.too_few_matched_fields",
    "source": "عدد الحقول الأساسية المطابقة أقل من 3 حقول (مطلوب على الأقل: رقم التذكرة، رقم اللوحة، الناقل، التاريخ، والوزن الصافي)"
  },
  {
    "key": "batch4.service.too_many_unmapped_columns",
    "source": "أكثر من 50% من أعمدة الملف غير مطابقة لأي حقل قياسي في النظام"
  },
  {
    "key": "batch4.service.file_validation_failed",
    "source": "خطأ في فحص الملف: {value0}"
  },
  {
    "key": "batch4.service.blocking_rows_count",
    "source": "توجد ({value0}) صفوف تتضمن أخطاء مانعة"
  },
  {
    "key": "batch4.service.pending_reviews_count",
    "source": "توجد ({value0}) مجموعات كائنات أو مراجعات معلقة"
  },
  {
    "key": "batch4.service.pending_warnings_count",
    "source": "توجد ({value0}) تنبيهات معلقة تتطلب تأكيد بشري صريح"
  },
  {
    "key": "batch4.service.user_unauthenticated",
    "source": "المستخدم غير موثق"
  },
  {
    "key": "batch4.service.project_id_required",
    "source": "معرف المشروع مطلوب"
  },
  {
    "key": "batch4.service.target_entity_required",
    "source": "معرف الكيان المستهدف مطلوب"
  },
  {
    "key": "batch4.service.entity_type_required",
    "source": "نوع الكيان مطلوب"
  },
  {
    "key": "batch4.service.carrier_registration_required",
    "source": "رقم السجل التجاري للناقل مطلوب"
  },
  {
    "key": "batch4.service.server_carrier_id_missing",
    "source": "لم يتضمن رد الخادم معرف الناقل المعتمد (carrierId)"
  },
  {
    "key": "entityResolution.messages.material_code_required",
    "source": "رمز المادة (code) مطلوب"
  },
  {
    "key": "batch4.service.server_material_id_missing",
    "source": "لم يتضمن رد الخادم معرف المادة المعتمد (materialId)"
  },
  {
    "key": "batch4.service.driver_data_required",
    "source": "بيانات السائق (driverData) مطلوبة"
  },
  {
    "key": "batch4.service.driver_carrier_required",
    "source": "معرف الناقل (carrierId) مطلوب للسائق"
  },
  {
    "key": "batch4.service.driver_name_required",
    "source": "اسم السائق (driverName) مطلوب"
  },
  {
    "key": "entityResolution.messages.residency_identifier_required",
    "source": "رقم الهوية الوطنية أو الإقامة (residencyId) مطلوب"
  },
  {
    "key": "batch4.service.server_driver_id_missing",
    "source": "لم يتضمن رد الخادم معرف السائق المعتمد (driverId)"
  },
  {
    "key": "batch4.service.truck_data_required",
    "source": "بيانات الشاحنة (truckData) مطلوبة"
  },
  {
    "key": "batch4.service.truck_carrier_required",
    "source": "معرف الناقل (carrierId) مطلوب للشاحنة"
  },
  {
    "key": "batch4.service.truck_plate_required",
    "source": "رقم لوحة الشاحنة (plateNumber) مطلوب"
  },
  {
    "key": "batch4.service.server_truck_id_missing",
    "source": "لم يتضمن رد الخادم معرف الشاحنة المعتمد (truckId)"
  },
  {
    "key": "batch4.service.user_not_signed_in",
    "source": "المستخدم غير مسجل الدخول"
  },
  {
    "key": "batch4.service.auth_token_unavailable",
    "source": "تعذر استخراج رمز المصادقة"
  },
  {
    "key": "batch4.service.import_project_required",
    "source": "معرف المشروع مطلوب لإنشاء جلسة استيراد"
  },
  {
    "key": "batch4.service.import_session_required",
    "source": "معرف جلسة الاستيراد مطلوب"
  },
  {
    "key": "batch4.service.expected_version_required",
    "source": "رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل"
  },
  {
    "key": "batch4.service.navigation_project_required",
    "source": "يجب إنشاء وحفظ المشروع أولاً للوصول إلى هذه الطبقة."
  },
  {
    "key": "batch4.service.navigation_material_carrier_required",
    "source": "سجل تشغيل السائقين وقواعد الأسعار تتطلب مادة مصرحة واحدة وناقل واحد على الأقل."
  },
  {
    "key": "batch4.service.navigation_material_required",
    "source": "يلزم وجود مادة مصرح بها واحدة على الأقل."
  },
  {
    "key": "batch4.service.navigation_carrier_required",
    "source": "يلزم وجود ناقل معتمد واحد على الأقل."
  },
  {
    "key": "batch4.service.navigation_layer_invalid",
    "source": "الطبقة المحددة غير صالحة."
  },
  {
    "key": "batch4.service.sheets_format_invalid",
    "source": "تنسيق بيانات Google Sheets غير صالح. المتوقع مصفوفة صفوف ثنائية الأبعاد."
  },
  {
    "key": "batch4.service.sheets_rows_limit",
    "source": "تجاوز جدول البيانات الحد الأقصى المسموح به للصفوف ({value0} صفاً). يحتوي الملف على {value1} صفاً. يرجى تقسيم البيانات قبل الاستيراد."
  },
  {
    "key": "batch4.service.sheets_header_index_invalid",
    "source": "مؤشر صف الترويسة ({value0}) أكبر من عدد صفوف الجدول المتاحة ({value1})."
  },
  {
    "key": "batch4.service.sheets_data_unavailable",
    "source": "بيانات Google Sheets غير متوفرة أو بتنسيق غير صالح."
  },
  {
    "key": "batch4.service.sheets_id_required",
    "source": "معرف جدول بيانات Google Sheets مطلوب."
  },
  {
    "key": "entityResolution.messages.no_eligible_rows",
    "source": "لا توجد أي صفوف صالحة جاهزة للاعتماد"
  },
  {
    "key": "batch4.service.workspace_identifiers",
    "source": "معرفات Google Workspace للمشروع غير مكتملة أو غير متطابقة (يلزم توفر معرف المجلد ومعرف الشيت معاً)"
  },
  {
    "key": "batch4.service.workspace_projection_success",
    "source": "تم تحديث وإسقاط بيانات المشروع في جدول البيانات بنجاح دون إعادة تهيئة مساحة العمل"
  },
  {
    "key": "batch4.service.workspace_projection_failed",
    "source": "فشل تحديث وإسقاط البيانات في جدول البيانات: {value0}"
  },
  {
    "key": "batch4.service.workspace_provision_ids_missing",
    "source": "فشلت تهيئة مساحة العمل: لم يتم إرجاع معرفات المجلد أو جدول البيانات"
  },
  {
    "key": "batch4.service.workspace_provision_success",
    "source": "تمت تهيئة مساحة العمل في Google بنجاح وإسقاط بيانات المشروع الأولية في جدول البيانات"
  },
  {
    "key": "batch4.service.workspace_initial_projection_failed",
    "source": "تمت تهيئة مساحة العمل في Google Drive بنجاح، ولكن تعذر إكمال إسقاط البيانات الأولية: {value0}"
  },
  {
    "key": "batch4.service.workspace_provision_failed",
    "source": "فشلت عملية تهيئة مجلدات ومساحة عمل Google"
  },
  {
    "key": "batch4.service.readiness_no_material",
    "source": "لا يوجد مواد نشطة"
  },
  {
    "key": "batch4.service.readiness_no_carrier",
    "source": "لا يوجد ناقلات نشطة"
  },
  {
    "key": "batch4.service.readiness_no_path",
    "source": "لا يوجد مسار تشغيلي مكتمل"
  }
];

function extract(template: string, message: string): Record<string, string> | undefined {
  const names: string[] = [];
  const literals: string[] = [];
  let cursor = 0;
  while (true) {
    const open = template.indexOf('{', cursor);
    if (open < 0) { literals.push(template.slice(cursor)); break; }
    const close = template.indexOf('}', open);
    literals.push(template.slice(cursor, open));
    names.push(template.slice(open + 1, close));
    cursor = close + 1;
  }
  if (!message.startsWith(literals[0])) return undefined;
  const matches: Record<string, string>[] = [];
  const visit = (index: number, offset: number, params: Record<string, string>) => {
    if (matches.length > 1) return;
    if (index === names.length) {
      if (offset === message.length) matches.push(params);
      return;
    }
    const next = literals[index + 1];
    if (!next) {
      if (index === names.length - 1 && offset <= message.length) {
        visit(index + 1, message.length, { ...params, [names[index]]: message.slice(offset) });
      }
      return;
    }
    let end = message.indexOf(next, offset);
    while (end >= 0 && matches.length < 2) {
      visit(index + 1, end + next.length, { ...params, [names[index]]: message.slice(offset, end) });
      end = message.indexOf(next, end + 1);
    }
  };
  visit(0, literals[0].length, {});
  return matches.length === 1 ? matches[0] : undefined;
}

function resolveBatch4Message(message: string, t: OperationalTranslator, depth: number): string {
  if (depth > 4) return message;
  const matches = batch4MessageTemplates.flatMap(entry => {
    const params = extract(entry.source, message);
    return params ? [{ key: entry.key, params }] : [];
  });
  // Multiple aliases may recognize the same message only if every parameter and key agrees.
  const unique = [...new Map(matches.map(m => [JSON.stringify(m), m])).values()];
  if (unique.length === 1) {
    const { key, params } = unique[0];
    // Only these observed producer templates embed a human-facing error, rather than business data.
    const nestedParameter: Readonly<Record<string, string>> = {
      "admin_console.approval_failed": "error",
      "admin_console.rejection_failed": "error",
      "admin_console.suspension_failed": "error",
      "admin_console.reactivation_failed": "error",
      "admin_console.security_update_failed": "error",
      "legacyMigration.labels.migration_failed": "error",
      "batch4.pricing.overlap_warning": "detail",
      "projects.batch4.activation_error": "error",
      'batch4.service.row_server_save_failed': 'value1',
      'batch4.pricing_service.rule_query_failed': 'value0',
      'batch4.service.workspace_token_failed': 'value0',
      'batch4.service.workspace_auth_failed': 'value0',
      'batch4.service.excel_read_failed': 'value0',
      'batch4.service.roster_gateway_save_failed': 'value0',
      'batch4.service.workspace_projection_failed': 'value0',
      'batch4.service.workspace_initial_projection_failed': 'value0',
    };
    const nested = nestedParameter[key];
    if (nested) params[nested] = resolveBatch4Message(params[nested], t, depth + 1);
    if (key === 'batch4.service.file_validation_failed') {
      // FileIntakeValidator alone produces this joined family. Never split arbitrary business values.
      const allowed = new Set([
        'batch4.service.file_extension_not_supported', 'batch4.service.file_empty',
        'batch4.service.file_too_large', 'batch4.service.excel_mime_invalid', 'batch4.service.csv_mime_invalid',
      ]);
      const parts = params.value0.split(' | ');
      const recognized = parts.every(part => batch4MessageTemplates.some(entry =>
        allowed.has(entry.key) && extract(entry.source, part) !== undefined));
      if (recognized) params.value0 = parts.map(part => resolveBatch4Message(part, t, depth + 1)).join(' | ');
    }
    return t(key, params);
  }
  if (unique.length > 1) return message;
  // These recovery banners retain their machine-readable diagnostic prefix.
  for (const prefix of ['DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN: ', 'TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN: ']) {
    if (message.startsWith(prefix)) {
      const detail = message.slice(prefix.length);
      if (batch4MessageTemplates.some(entry => entry.key === 'entityResolution.messages.created_refresh_failed' && entry.source === detail)) {
        return prefix + resolveBatch4Message(detail, t, depth + 1);
      }
    }
  }
  // The pricing form joins only PricingRuleValidator's finite, non-parameterized validation messages.
  const pricingValidationKeys = new Set([
    'batch4.pricing_service.rule_id_required', 'batch4.service.project_id_required',
    'batch4.pricing_service.explicit_carrier_required', 'batch4.pricing_service.pricing_model_invalid',
    'batch4.pricing_service.rate_positive', 'batch4.pricing_service.currency_invalid',
    'batch4.pricing_service.effective_start_required', 'batch4.pricing_service.effective_start_invalid',
    'batch4.pricing_service.effective_end_invalid', 'batch4.pricing_service.end_before_start',
    'batch4.pricing_service.demurrage_nonnegative',
  ]);
  const parts = message.split(' | ');
  if (parts.length > 1 && parts.every(part => batch4MessageTemplates.some(entry =>
    pricingValidationKeys.has(entry.key) && entry.source === part))) {
    return parts.map(part => resolveBatch4Message(part, t, depth + 1)).join(' | ');
  }
  return presentOperationalMessage(message, t);
}

export function presentBatch4Message(message: string, t: OperationalTranslator): string {
  return resolveBatch4Message(message, t, 0);
}
