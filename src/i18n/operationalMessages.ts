// Presentation only: exact service prose observed in Batch-2. Never import this in services.
// Unknown, partially matching, or ambiguously parameterized messages remain unchanged.
export type OperationalTranslator = (key: string, params?: Record<string, string | number>) => string;

export interface OperationalMessageTemplate {
  readonly key: string;
  readonly source: string;
  readonly messageParams?: readonly string[];
}

export const operationalMessageTemplates: readonly OperationalMessageTemplate[] = [
  {"key":"operations.service.weight.tare_missing","source":"قيمة وزن الفارغ (tare) مفقودة أو غير محددة (يجب أن تكون null وليس 0)."},
  {"key":"operations.service.weight.gross_missing","source":"قيمة وزن القائم (gross) مفقودة أو غير محددة (يجب أن تكون null وليس 0)."},
  {"key":"operations.service.weight.tare_invalid","source":"وزن الفارغ غير صالح ({value0} كجم). يجب أن يكون وزن الفارغ أكبر من صفر قطعي (tare > 0)."},
  {"key":"operations.service.weight.gross_invalid","source":"وزن القائم ({value0} كجم) يجب أن يكون أكبر قطعي من وزن الفارغ ({value1} كجم) (gross > tare)."},
  {"key":"operations.service.weight.net_invalid","source":"الوزن الصافي المحسوب ({value0} كجم) يجب أن يكون أكبر من صفر (net > 0)."},
  {"key":"operations.service.weight.loaded_missing","source":"وزن الصافي المحمّل بالمصدر (loadedNet) مفقود (يجب أن يكون null وليس 0)."},
  {"key":"operations.service.weight.received_missing","source":"وزن الصافي المستلم بالموقع (receivedNet) مفقود (يجب أن يكون null وليس 0)."},
  {"key":"operations.service.weight.loaded_invalid","source":"وزن المصدر غير صالح ({value0} كجم). يجب أن يكون صافي التحميل أكبر من صفر (net > 0)."},
  {"key":"operations.service.weight.received_invalid","source":"وزن الاستلام غير صالح ({value0} كجم). يجب أن يكون صافي الاستلام أكبر من صفر (received > 0)."},
  {"key":"operations.service.weight.variance_missing","source":"قيمة الفارق الوزني (variance) مفقودة أو null."},
  {"key":"operations.service.weight.tolerance_missing","source":"قاعدة التفاوت (ToleranceRule) مفقودة أو غير محددة."},
  {"key":"operations.service.weight.tolerance_inactive","source":"قاعدة التفاوت غير مفعلة (الحالة: {value0})."},
  {"key":"operations.service.weight.tolerance_no_criterion","source":"قاعدة التفاوت لا تحتوي على معيار مطلق ولا معيار نسبة مئوية."},
  {"key":"operations.service.weight.tolerance_no_limits","source":"قاعدة التفاوت خالية من أي حدود صالحة."},
  {"key":"operations.service.weight.both_requires_net","source":"التقييم المشترك (BOTH) يتطلب loadedNet > 0 لاحتساب حد النسبة المئوية."},
  {"key":"operations.service.weight.percentage_requires_net","source":"تقييم نسبة التفاوت (PERCENTAGE) يتطلب loadedNet > 0."},
  {"key":"operations.service.weight.tolerance_exceeded","source":"تجاوز الفارق ({value0} كجم) حد التسامح المسموح ({value1} كجم) بموجب قاعدة [{value2}]. يتطلب إنشاء استثناء رسمي وحجز التسوية."},
  {"key":"operations.service.weight.tolerance_warning","source":"الفارق ({value0} كجم) يقترب من حد التسامح الأقصى ({value1} كجم) وبلغ نطاق التحذير الرقابي ({value2} كجم)."},
  {"key":"operations.service.weight.tolerance_normal","source":"الفارق الوزني ({value0} كجم) طبيعي وضمن حدود التسامح المعتمدة ({value1} كجم)."},
  {"key":"operations.service.weight.settlement_net_missing","source":"قيمة الوزن الصافي (netWeight) مفقودة أو null (يُمنع استخدام 0 كبديل)."},
  {"key":"operations.service.weight.pricing_missing","source":"قاعدة التسعير (pricingRule) مفقودة أو غير محددة."},
  {"key":"operations.service.weight.formula_missing","source":"مفقود (غير محدد)"},
  {"key":"operations.service.weight.settlement_net_invalid","source":"الوزن الصافي ({value0} كجم) غير صالح. يجب أن يكون أكبر من صفر (net > 0)."},
  {"key":"operations.service.weight.formula_invalid","source":"غير صالح (الوزن الصافي <= 0)"},
  {"key":"operations.service.weight.formula_per_ton","source":"{value0} طن × {value1} {value2} = {value3} {value4}"},
  {"key":"operations.service.weight.formula_per_trip","source":"مقطوعية ثابتة للرد = {value0} {value1}"},
  {"key":"operations.service.weight.pricing_unknown","source":"نوع التسعير غير معروف ({value0})."},
  {"key":"operations.service.weight.formula_type_error","source":"خطأ في نوع التسعير"},
  {"key":"operations.service.validation.truck_missing","source":"الشاحنة ({value0}) غير مسجلة بالنظام"},
  {"key":"operations.service.validation.truck_inactive","source":"الشاحنة ({value0}) حالتها معطلة (INACTIVE)"},
  {"key":"operations.service.validation.truck_carrier_unauthorized","source":"الشاحنة تتبع ناقل غير معتمد بالمشروع ({value0})"},
  {"key":"operations.service.validation.truck_valid","source":"الشاحنة ({value0}) معتمدة وتابعة لناقل مصرح بالمشروع"},
  {"key":"operations.service.validation.truck_rule","source":"truck يجب أن يكون تابعاً للمشروع"},
  {"key":"operations.service.validation.driver_missing","source":"السائق ({value0}) غير مسجل بالنظام"},
  {"key":"operations.service.validation.driver_inactive","source":"السائق ({value0}) حالته معطلة (INACTIVE)"},
  {"key":"operations.service.validation.driver_id_invalid","source":"رقم هوية/إقامة السائق ({value0}) غير صالح"},
  {"key":"operations.service.validation.driver_valid","source":"السائق ({value0}) صالح ونشط وهوية رقم ({value1})"},
  {"key":"operations.service.validation.driver_rule","source":"driver يجب أن يكون صالحاً ونشطاً"},
  {"key":"operations.service.validation.carrier_missing","source":"الناقل ({value0}) غير مسجل في النظام"},
  {"key":"operations.service.validation.carrier_inactive","source":"الناقل ({value0}) حالته معطلة (INACTIVE)"},
  {"key":"operations.service.validation.carrier_unauthorized","source":"الناقل ({value0}) ليس ضمن الناقلين المصرح لهم بالمشروع ({value1})"},
  {"key":"operations.service.validation.carrier_valid","source":"الناقل ({value0}) مصرح له رسمياً بالمشروع"},
  {"key":"operations.service.validation.carrier_rule","source":"carrier يجب أن يكون تابعاً ومصرحاً للمشروع"},
  {"key":"operations.service.validation.material_missing","source":"المادة ({value0}) غير مسجلة في النظام"},
  {"key":"operations.service.validation.material_inactive","source":"المادة ({value0}) معطلة (INACTIVE)"},
  {"key":"operations.service.validation.material_unauthorized","source":"المادة ({value0}) غير مسموحة للتوريد في هذا المشروع ({value1})"},
  {"key":"operations.service.validation.material_valid","source":"المادة ({value0}) مصرح بتوريدها في نطاق المشروع"},
  {"key":"operations.service.validation.material_rule","source":"material يجب أن تكون مسموحة ومصرحة في المشروع"},
  {"key":"operations.service.validation.truck_relationship","source":"تعارض علاقة: الشاحنة ({value0}) تتبع الناقل ({value1}) وليس الناقل المختار ({value2})"},
  {"key":"operations.service.validation.driver_relationship","source":"تعارض علاقة: السائق ({value0}) يتبع كفالة الناقل ({value1}) وليس الناقل المختار ({value2})"},
  {"key":"operations.service.validation.relationship_valid","source":"علاقة الشاحنة والسائق بالناقل صحيحة وموثقة كفالياً وتشغيلياً"},
  {"key":"operations.service.validation.relationship_rule","source":"truck/carrier relationship يجب أن تكون صحيحة"},
  {"key":"operations.service.validation.pricing_missing","source":"قاعدة التسعير ({value0}) غير موجودة بالنظام"},
  {"key":"operations.service.validation.pricing_inactive","source":"قاعدة التسعير ({value0}) معطلة (INACTIVE)"},
  {"key":"operations.service.validation.pricing_date_invalid","source":"قاعدة التسعير ({value0}) غير صالحة في تاريخ الرحلة ({value1}). نطاق الصلاحية: [{value2} إلى {value3}]"},
  {"key":"operations.service.validation.pricing_valid","source":"قاعدة التسعير ({value0}) نشطة وصالحة لتاريخ التشغيل ({value1})"},
  {"key":"operations.service.validation.pricing_rule","source":"pricing rule يجب أن تكون صالحة في تاريخ الرحلة"},
  {"key":"operations.service.trip.creation_rejected","source":"تعذر إنشاء الرحلة لانتهاك قواعد التحقق المعمارية: {value0}","messageParams":["value0"]},
  {"key":"operations.service.trip.gross_invalid","source":"الوزن القائم ({value0} كجم) يجب أن يكون أكبر من وزن الفارغ ({value1} كجم)"},
  {"key":"operations.service.trip.loading_rejected","source":"تعذر إنشاء واعتماد الشحنة بمحطة التحميل: {value0}","messageParams":["value0"]},
  {"key":"operations.service.trip.missing_system","source":"الرحلة ({value0}) غير موجودة في النظام"},
  {"key":"operations.service.trip.destination_gross_invalid","source":"الوزن القائم في موقع الاستلام ({value0}) يجب أن يكون أكبر من الفارغ ({value1})"},
  {"key":"operations.service.trip.destination_weights_missing","source":"يجب تزويد أوزان موقع الاستلام (الوزن القائم والفارغ أو الصافي المستلم)"},
  {"key":"operations.service.trip.missing_system_period","source":"الرحلة ({value0}) غير موجودة في النظام."},
  {"key":"operations.service.trip.missing","source":"الرحلة ({value0}) غير موجودة"},
  {"key":"operations.service.search.query_required","source":"الرجاء إدخال معيار بحث للرحلة"},
  {"key":"operations.service.search.plate_prohibited","source":"حظر رقابي: لا يُسمح باستخدام لوحة الشاحنة (truckPlate) وحدها لتحديد الرحلة منعاً للتداخل بين رحلات الشاحنة المتعددة عبر الورديات. يُرجى البحث برقم الرحلة (tripSerial) أو رقم التذكرة (ticketId) أو معرف الشاحنة (truckId)."},
  {"key":"operations.service.search.serial_found","source":"تم العثور على الرحلة بالبحث الأساسي (tripSerial: {value0})"},
  {"key":"operations.service.search.serial_ambiguous","source":"تنبيه غامض (AMBIGUOUS): تم العثور على أكثر من رحلة ({value0}) مطابقة لنفس الرقم التسلسلي. يلزم تحديد الرحلة يدوياً لمنع الخطأ."},
  {"key":"operations.service.search.ticket_found","source":"تم العثور على الرحلة برقم تذكرة الميزان (ticketId: {value0})"},
  {"key":"operations.service.search.ticket_ambiguous","source":"تنبيه غامض (AMBIGUOUS): تم العثور على أكثر من رحلة ({value0}) بنفس رقم التذكرة. يلزم تحديد الرحلة يدوياً."},
  {"key":"operations.service.search.truck_found","source":"تم العثور على رحلة واحدة مطابقة لمعرف الشاحنة (truckId: {value0})"},
  {"key":"operations.service.search.truck_ambiguous","source":"تنبيه غامض (AMBIGUOUS): تم العثور على {value0} رحلات مرتبطة بالشاحنة ({value1}). يُحظر التحديد التلقائي؛ الرجاء اختيار الرحلة المستهدفة أدناه."},
  {"key":"operations.service.search.not_found","source":"لم يتم العثور على أي رحلة مطابقة للمعايير (tripSerial: {value0} / ticketId / truckId)"},
  {"key":"operations.service.trip.missing_period","source":"الرحلة ({value0}) غير موجودة."},
  {"key":"operations.service.trip.destination_net_invalid","source":"الوزن الصافي في موقع التفريغ (destNetWeight) يجب أن يكون قيمة موجبة (تم إدخال: {value0})."},
  {"key":"operations.service.transition.loaded_label","source":"تم التحميل والوزن"},
  {"key":"operations.service.transition.loaded_description","source":"اكتمال عملية التحميل في الموقع ووزن الميزان القائم والفارغ بالمصدر"},
  {"key":"operations.service.transition.transit_label","source":"بدء الرحلة (في الطريق)"},
  {"key":"operations.service.transition.transit_description","source":"ترحيل الشاحنة وانطلاقها على المسار المعتمد بعد اجتياز تسعير الرحلة"},
  {"key":"operations.service.transition.arrived_label","source":"وصول الشاحنة"},
  {"key":"operations.service.transition.arrived_description","source":"وصول الشاحنة إلى بوابة موقع الاستلام/التفريغ"},
  {"key":"operations.service.transition.unloading_label","source":"بدء التفريغ"},
  {"key":"operations.service.transition.unloading_description","source":"دخول الشاحنة إلى منصة/قمع التفريغ بعد التفتيش المبدئي"},
  {"key":"operations.service.transition.completed_label","source":"إكمال الرحلة والتسوية"},
  {"key":"operations.service.transition.completed_description","source":"إتمام التفريغ وتوثيق صافي وزن الوصول واحتساب تفاوت الوزن تلقائياً"},
  {"key":"operations.service.transition.return_requested_label","source":"طلب إرجاع الشحنة"},
  {"key":"operations.service.transition.return_requested_description","source":"رفض الشحنة لعدم مطابقة المواصفات أو تعذر التفريغ وطلب العودة للمصدر"},
  {"key":"operations.service.transition.returned_label","source":"تم الإرجاع للمصدر"},
  {"key":"operations.service.transition.returned_description","source":"تأكيد وصول الشاحنة المرتجعة إلى المحجر أو الكسارة المصدرية"},
  {"key":"operations.service.transition.exception_label","source":"تسجيل استثناء / عطل"},
  {"key":"operations.service.transition.exception_description","source":"توثيق حالة طارئة كعطل ميكانيكي، حادث مروري، أو نزاع وزني"},
  {"key":"operations.service.transition.cancelled_label","source":"إلغاء الرحلة"},
  {"key":"operations.service.transition.cancelled_description","source":"إلغاء أمر الرحلة كلياً قبل الانطلاق أو بقرار تشغيلي معتمد"},
  {"key":"operations.service.state.target_unknown","source":"الحالة المستهدفة ({value0}) غير معرفة في محرك الحالات."},
  {"key":"operations.service.state.transition_prohibited","source":"الانتقال من الحالة الحالية [{value0}] إلى [{value1}] غير مسموح به. الحالات المسموح بها للانطلاق: [{value2}]."},
  {"key":"operations.service.state.role_unauthorized","source":"الرتبة التشغيلية الحالية [{value0}] غير مصرح لها بتنفيذ التحول إلى [{value1}]. الأدوار المصرحة: [{value2}]."},
  {"key":"operations.service.state.project_mismatch","source":"فشل التحقق من المشروع: مشروع المشغل ({value0}) لا يطابق مشروع الرحلة ({value1}). التحول محظور."},
  {"key":"operations.service.state.pricing_failed","source":"[حظر بدء الرحلة]: فشل حل التسعير واحتساب التسوية (Pricing Resolution Failed) - {value0}","messageParams":["value0"]},
  {"key":"operations.service.state.origin_weight_required","source":"لا يمكن بدء الرحلة بدون تسجيل وزن صافي موجب بالمصدر (netWeight > 0)."},
  {"key":"operations.service.state.destination_weight_required","source":"[حظر إكمال الرحلة]: لا يمكن إكمال الرحلة بدون تسجيل وتأكيد صافي وزن موقع الاستلام (destNetWeight)."},
  {"key":"operations.service.state.unloader_required","source":"[حظر إكمال الرحلة]: لا يمكن إكمال الرحلة بدون تحديد هوية مستلم الموقع المعتمد (unloaderId)."},
  {"key":"operations.service.state.unload_time_required","source":"[حظر إكمال الرحلة]: لا يمكن إكمال الرحلة بدون تسجيل وقت التفريغ الفعلي (unloadTime)."},
  {"key":"operations.service.state.variance_origin_required","source":"[حظر إكمال الرحلة]: صافي وزن المصدر مفقود، لا يمكن حساب تفاوت الوزن (varianceWeight)."},
  {"key":"operations.service.state.reason_required","source":"يجب كتابة سبب توضيحي صريح ومبرر (5 أحرف على الأقل) للانتقال إلى حالة [{value0}]."},
  {"key":"operations.service.state.snapshot_missing","source":"لقطة التسعير (Pricing Snapshot) مفقودة في وثيقة الرحلة."},
  {"key":"operations.service.state.rate_invalid","source":"السعر المتفق عليه صفر أو غير محدد في قاعدة التسعير."},
  {"key":"operations.service.state.settlement_invalid","source":"مبلغ التسوية المحسوب غير صحيح أو يساوي صفراً."},
  {"key":"operations.service.state.pricing_unregistered","source":"قاعدة التسعير ({value0}) غير مسجلة في المشروع الحالي."},
  {"key":"operations.service.state.pricing_inactive","source":"قاعدة التسعير ({value0}) معطلة أو غير نشطة حالياً."},
  {"key":"operations.service.state.pricing_not_started","source":"تاريخ الرحلة ({value0}) يسبق تاريخ بدء سريان التسعيرة ({value1})."},
  {"key":"operations.service.state.pricing_expired","source":"انتهت صلاحية قاعدة التسعير في ({value0}) وتاريخ الوردية ({value1})."},
  {"key":"operations.service.offline.pricing_required","source":"حظر إنشاء الرحلة بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بإنشاء أي رحلة بدون احتساب تسعيري معتمد."},
  {"key":"operations.service.offline.project_missing","source":"المشروع ({value0}) غير متوفر أو غير معتمد محلياً"},
  {"key":"operations.service.offline.carrier_missing","source":"الناقل ({value0}) غير متوفر أو غير نشط في الذاكرة المحلية"},
  {"key":"operations.service.offline.truck_missing","source":"الشاحنة ({value0}) غير متوفرة أو معطلة في الذاكرة المحلية"},
  {"key":"operations.service.offline.driver_missing","source":"السائق ({value0}) غير مسجل أو معطل في الذاكرة المحلية"},
  {"key":"operations.service.offline.material_missing","source":"المادة ({value0}) غير متوفرة محلياً"},
  {"key":"operations.service.sync.unsupported_operation","source":"نوع العملية غير مدعوم في المزامنة: {value0}"},
  {"key":"operations.service.sync.http_failed","source":"فشلت مزامنة العملية مع السيرفر (كود: {value0})"},
  {"key":"operations.service.state.transition_failed","source":"[خطأ في محرك الحالات المركزي]: فشل الانتقال إلى [{value0}] - {value1}","messageParams":["value1"]},
  {"key":"operations.service.dispatch.project_missing","source":"المشروع غير موجود أو غير صالح"},
  {"key":"operations.service.dispatch.project_status","source":"حالة المشروع ({value0}) لا تسمح بترحيل رحلات تشغيلية"},
  {"key":"operations.service.dispatch.carrier_identity","source":"الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)"},
  {"key":"operations.service.dispatch.carrier_membership","source":"الناقل ({value0}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع"},
  {"key":"operations.service.dispatch.material_identity","source":"المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة (INACTIVE)"},
  {"key":"operations.service.dispatch.material_membership","source":"المادة ({value0}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع"},
  {"key":"operations.service.dispatch.driver_identity","source":"السائق المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)"},
  {"key":"operations.service.dispatch.driver_membership","source":"السائق ({value0}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع"},
  {"key":"operations.service.dispatch.truck_identity","source":"الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل (INACTIVE)"},
  {"key":"operations.service.dispatch.truck_membership","source":"الشاحنة ({value0}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع"},
  {"key":"operations.service.dispatch.assignment_missing","source":"لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck) بين السائق ({value0}) والشاحنة ({value1})"},
  {"key":"operations.service.dispatch.assignment_conflict","source":"تعارض في التعيين التشغيلي: السائق ({value0}) معين للشاحنة ({value1}) بينما الشاحنة ({value2}) معينة للسائق ({value3})"},
  {"key":"operations.service.dispatch.driver_affiliation_missing","source":"السائق ({value0}) ليس لديه تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع"},
  {"key":"operations.service.dispatch.driver_affiliation_conflict","source":"السائق المحدد ({value0}) تابع للناقل ({value1}) وليس للناقل المختار ({value2}) [العلاقة: Driver → Carrier]"},
  {"key":"operations.service.dispatch.truck_affiliation_missing","source":"الشاحنة ({value0}) ليس لديها تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع"},
  {"key":"operations.service.dispatch.truck_affiliation_conflict","source":"الشاحنة المحددة ({value0}) تابعة للناقل ({value1}) وليس للناقل المختار ({value2}) [العلاقة: Truck → Carrier]"},
  {"key":"operations.service.dispatch.material_allocation_missing","source":"لا يوجد تخصيص مادة نشط (Truck ↔ Material) للشاحنة ({value0})"},
  {"key":"operations.service.dispatch.material_allocation_conflict","source":"الشاحنة ({value0}) مخصصة للمادة ({value1}) وليس للمادة المختارة ({value2}) [العلاقة: Truck ↔ Material]"},
  {"key":"operations.service.dispatch.project_required","source":"معرف المشروع (projectId) مطلوب ولا يمكن تركه فارغاً"},
  {"key":"operations.service.dispatch.carrier_required","source":"معرف الناقل (carrierId) مطلوب ولا يمكن تركه فارغاً"},
  {"key":"operations.service.dispatch.truck_required","source":"معرف الشاحنة (truckId) مطلوب ولا يمكن تركه فارغاً"},
  {"key":"operations.service.dispatch.driver_required","source":"معرف السائق (driverId) مطلوب ولا يمكن تركه فارغاً"},
  {"key":"operations.service.dispatch.material_required","source":"معرف المادة (materialId) مطلوب لإتمام عملية الشحن والتفريغ ولا يمكن الاعتماد على النص العابر"},
  {"key":"operations.service.dispatch.pricing_required","source":"معرف قاعدة التسعير (pricingRuleId) مطلوب ولا يمكن تركه فارغاً"},
  {"key":"operations.service.dispatch.pricing_invalid","source":"قاعدة التسعير غير صالحة أو غير نشطة"},
  {"key":"operations.service.dispatch.pricing_project_mismatch","source":"قاعدة التسعير المحددة لا تنتمي لهذا المشروع"},
  {"key":"operations.service.dispatch.pricing_carrier_mismatch","source":"قاعدة التسعير مخصصة للناقل ({value0}) وتتعارض مع الناقل المختار ({value1})"},
  {"key":"operations.service.dispatch.pricing_material_mismatch","source":"قاعدة التسعير مخصصة للمادة ({value0}) وتتعارض مع المادة المختارة ({value1})"},
  {"key":"operations.service.dispatch.pricing_future","source":"قاعدة التسعير تبدأ بتاريخ مستقبلي ({value0}) وتاريخ اليوم ({value1}) يسبقها"},
  {"key":"operations.service.dispatch.pricing_expired","source":"قاعدة التسعير منتهية الصلاحية بتاريخ ({value0})"},
  {"key":"operations.service.dispatch.trip_missing","source":"الرحلة غير موجودة"},
  {"key":"operations.service.dispatch.trip_finalized","source":"لا يمكن تغيير حالة الرحلة لأنها مقفلة ومفوترة نهائياً"},
  {"key":"operations.service.dispatch.transition_invalid","source":"لا يمكن نقل الرحلة من الحالة \"{value0}\" إلى الحالة \"{value1}\" في مسار FSM النظامي"},
  {"key":"operations.service.server.user_context_required","source":"غير مصرح: سياق المستخدم مفقود."},
  {"key":"operations.service.server.manual_number_prohibited","source":"محاولة غير مصرح بها: لا يمكن للعميل تحديد رقم الرحلة (tripNumber) يدوياً."},
  {"key":"operations.service.server.manual_pricing_prohibited","source":"تعارض أمني: يُحظر تحديد لقطات الأسعار أو مبالغ التسوية والماليات يدوياً من قِبل العميل."},
  {"key":"operations.service.server.project_mismatch","source":"تعارض أمني: معرف المشروع غير متطابق بين الطلب ورابط الخدمة."},
  {"key":"operations.service.server.creation_failed","source":"فشلت عملية إنشاء الرحلة الخادومية المعتمدة."},
  {"key":"operations.service.server.status_required","source":"حالة الرحلة المستهدفة مطلوبة."},
  {"key":"operations.service.server.status_failed","source":"فشلت عملية تحديث حالة الرحلة خادومياً"},
  {"key":"operations.service.server.receipt_failed","source":"فشلت عملية تسجيل إيصال الاستلام خادومياً"},
  {"key":"operations.service.server.exception_required","source":"معرف الاستثناء مطلوب."},
  {"key":"operations.service.server.exception_failed","source":"فشلت عملية تسجيل الاستثناء خادومياً"},
  {"key":"operations.service.server.destination_net_required","source":"[حظر إكمال الرحلة]: لا يمكن إكمال الرحلة بدون صافي وزن موقع الاستلام."},
  {"key":"operations.service.auth.token_required","source":"غير مصرح: يجب تقديم رمز مميز صالح (Bearer ID Token)."},
  {"key":"operations.service.auth.token_empty","source":"رمز المصادقة فارغ."},
  {"key":"operations.service.auth.token_user_missing","source":"رمز مصادقة غير صالح: معرف المستخدم مفقود."},
  {"key":"operations.service.auth.account_missing","source":"حساب غير موجود: لم يتم العثور على سجل حساب لهذا المستخدم."},
  {"key":"operations.service.auth.account_invalid","source":"بيانات الحساب فارغة أو تالفة."},
  {"key":"operations.service.auth.account_status","source":"رفض أمني: حسابك ليس بحالة نشطة، حالته الحالية: {value0}. لا يمكنك استخدام الخدمات التشغيلية."},
  {"key":"operations.service.auth.account_disabled","source":"رفض أمني: الحساب معطل."},
  {"key":"operations.service.auth.token_invalid","source":"رمز المصادقة غير صالح أو منتهي الصلاحية."},
  {"key":"operations.service.auth.project_isolation","source":"عزل أمني (Cross-Project Isolation Violation): غير مصرح للمستخدم ({value0}) بالوصول لبيانات المشروع ({value1}). المشاريع المصرح بها: [{value2}]"},
  {"key":"operations.service.auth.authentication_required","source":"رفض أمني: يتطلب هذا الإجراء تسجيل الدخول والمصادقة."},
  {"key":"operations.service.auth.role_unauthorized","source":"رفض أمني (RBAC Violation): دور المستخدم الحالي ({value0}) غير مخول لتنفيذ هذه العملية الحساسة. الأدوار المصرح بها: [{value1}]."},
];

// Match the entire explicit template, with one unambiguous extraction only.
// No regular expressions, substring classification, or language heuristics.
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

// Only these two current service results concatenate validation messages.
// A delimiter in an arbitrary message is never enough to classify it.
const joinedMessageKeyFamilies = [
  new Set([
    'operations.service.weight.variance_missing',
    'operations.service.weight.tolerance_missing',
    'operations.service.weight.tolerance_inactive',
    'operations.service.weight.tolerance_no_criterion',
    'operations.service.weight.both_requires_net',
    'operations.service.weight.percentage_requires_net',
  ]),
  new Set([
    'operations.service.state.target_unknown',
    'operations.service.state.transition_prohibited',
    'operations.service.state.role_unauthorized',
    'operations.service.state.project_mismatch',
    'operations.service.state.pricing_failed',
    'operations.service.state.origin_weight_required',
    'operations.service.state.destination_weight_required',
    'operations.service.state.unloader_required',
    'operations.service.state.unload_time_required',
    'operations.service.state.variance_origin_required',
    'operations.service.state.reason_required',
  ]),
];

const tripValidationKeys = new Set([
  'operations.service.validation.truck_missing',
  'operations.service.validation.truck_inactive',
  'operations.service.validation.truck_carrier_unauthorized',
  'operations.service.validation.truck_valid',
  'operations.service.validation.driver_missing',
  'operations.service.validation.driver_inactive',
  'operations.service.validation.driver_id_invalid',
  'operations.service.validation.driver_valid',
  'operations.service.validation.carrier_missing',
  'operations.service.validation.carrier_inactive',
  'operations.service.validation.carrier_unauthorized',
  'operations.service.validation.carrier_valid',
  'operations.service.validation.material_missing',
  'operations.service.validation.material_inactive',
  'operations.service.validation.material_unauthorized',
  'operations.service.validation.material_valid',
  'operations.service.validation.truck_relationship',
  'operations.service.validation.driver_relationship',
  'operations.service.validation.relationship_valid',
  'operations.service.validation.pricing_missing',
  'operations.service.validation.pricing_inactive',
  'operations.service.validation.pricing_date_invalid',
  'operations.service.validation.pricing_valid',
]);
const pricingResolutionKeys = new Set([
  'operations.service.state.snapshot_missing',
  'operations.service.state.rate_invalid',
  'operations.service.state.settlement_invalid',
  'operations.service.state.pricing_unregistered',
  'operations.service.state.pricing_inactive',
  'operations.service.state.pricing_not_started',
  'operations.service.state.pricing_expired',
]);
const nestedMessageKeyFamilies: Record<string, ReadonlySet<string>> = {
  'operations.service.trip.creation_rejected': tripValidationKeys,
  'operations.service.trip.loading_rejected': tripValidationKeys,
  'operations.service.state.pricing_failed': pricingResolutionKeys,
  'operations.service.state.transition_failed': joinedMessageKeyFamilies[1],
};

interface ResolvedMessage { key?: string; params?: Record<string, string>; keys: readonly string[]; text: string }

function resolve(message: string, t: OperationalTranslator, depth: number): ResolvedMessage | undefined {
  if (depth > 4) return undefined;
  const matches = operationalMessageTemplates.flatMap(entry => {
    const params = extract(entry.source, message);
    if (!params) return [];
    if (Object.entries(params).some(([name, value]) => value.includes(' | ') && !entry.messageParams?.includes(name))) return [];
    for (const name of entry.messageParams ?? []) {
      const nested = resolve(params[name], t, depth + 1);
      if (!nested || !nested.keys.every(key => nestedMessageKeyFamilies[entry.key]?.has(key))) return [];
      params[name] = nested.text;
    }
    return [{ key: entry.key, keys: [entry.key], params, text: t(entry.key, params) }];
  });
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return undefined;
  // Services explicitly join validation errors with this exact separator.
  const parts = message.split(' | ');
  if (parts.length < 2) return undefined;
  const resolved = parts.map(part => resolve(part, t, depth + 1));
  const keys = resolved.map(part => part?.key);
  const knownFamily = joinedMessageKeyFamilies.some(family => keys.every(key => key !== undefined && family.has(key)));
  if (!knownFamily || new Set(keys).size !== keys.length) return undefined;
  return { keys: resolved.map(part => part!.key!), text: resolved.map(part => part!.text).join(' | ') };
}

export function presentOperationalMessage(message: string, t: OperationalTranslator): string {
  return resolve(message, t, 0)?.text ?? message;
}
