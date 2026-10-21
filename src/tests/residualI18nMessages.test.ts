import { describe, it, expect } from 'vitest';
import { presentBatch4Message } from '../i18n/batch4Messages';
import { batch4ConflictValueLabel } from '../i18n/batch4Presentation';
import { resolveTranslation } from '../i18n/utils';
import { dictionaries } from '../locales';

// Closed source templates from all 118 audited producer positions; repeated sources remain covered.
const audited = [
  {
    "source": "تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.",
    "key": "residual.messages.sign_in_window_was_closed_by_the_user"
  },
  {
    "source": "تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة.",
    "key": "residual.messages.the_browser_blocked_the_popup_please_allow_popups"
  },
  {
    "source": "نطاق التطبيق ({value0}) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains.",
    "key": "residual.messages.application_domain_value_is_not_in_firebase_console_authorized_domains_add_it_at_firebase_console_authentication_settings_authorized_domains"
  },
  {
    "source": "تم إلغاء طلب تسجيل الدخول.",
    "key": "residual.messages.the_sign_in_request_was_cancelled"
  },
  {
    "source": "تعذر الاتصال بخدمة المصادقة. يرجى التحقق من اتصالك بالإنترنت.",
    "key": "residual.messages.could_not_connect_to_authentication_check_your_internet_connection"
  },
  {
    "source": "فشل تسجيل الدخول عبر Google.",
    "key": "residual.messages.google_sign_in_failed"
  },
  {
    "source": "فشل تسجيل الخروج.",
    "key": "residual.messages.sign_out_failed"
  },
  {
    "source": "فشلت عملية التهيئة: تم تهيئة النظام مسبقاً ويوجد مستخدمين مسجلين بالفعل.",
    "key": "residual.messages.setup_failed_the_system_is_already_initialized_and_registered_users_exist"
  },
  {
    "source": "حدث خطأ غير متوقع أثناء تهيئة النظام.",
    "key": "residual.messages.an_unexpected_error_occurred_during_system_initialization"
  },
  {
    "source": "فشلت عملية إنشاء قاعدة التسعير خادومياً.",
    "key": "residual.messages.failed_to_create_the_pricing_rule_on_the_server"
  },
  {
    "source": "فشل إنشاء جلسة الاستيراد.",
    "key": "residual.messages.failed_to_create_the_import_session"
  },
  {
    "source": "فشل استعراض جلسات الاستيراد.",
    "key": "residual.messages.failed_to_list_import_sessions"
  },
  {
    "source": "فشل استرجاع جلسة الاستيراد.",
    "key": "residual.messages.failed_to_retrieve_the_import_session"
  },
  {
    "source": "فشل تحديث جلسة الاستيراد.",
    "key": "residual.messages.failed_to_update_the_import_session"
  },
  {
    "source": "فشل استرجاع لقطة الكيان المعتمد",
    "key": "residual.messages.failed_to_retrieve_the_canonical_entity_snapshot"
  },
  {
    "source": "فشل إنشاء المشروع في الخادم الرئيسي",
    "key": "residual.messages.failed_to_create_the_project_on_the_main_server"
  },
  {
    "source": "فشلت عملية تهيئة Google Workspace للمشروع",
    "key": "residual.messages.failed_to_provision_google_workspace_for_the_project"
  },
  {
    "source": "فشلت عملية التسجيل الموثقة للسائق والشاحنة",
    "key": "residual.messages.failed_to_register_the_canonical_driver_and_truck"
  },
  {
    "source": "فشلت عملية المزامنة والإسقاط الأولي لجداول مساحة العمل",
    "key": "residual.messages.initial_synchronization_and_projection_of_workspace_sheets_failed"
  },
  {
    "source": "فشل استعراض جداول بيانات Google Sheets للمشروع",
    "key": "residual.messages.failed_to_list_the_project_s_google_sheets_spreadsheets"
  },
  {
    "source": "فشل قراءة بيانات ورقة العمل من جدول البيانات",
    "key": "residual.messages.failed_to_read_worksheet_data_from_the_spreadsheet"
  },
  {
    "source": "فشلت عملية إنشاء الرحلة المستوردة الخادومية المعتمدة.",
    "key": "residual.messages.failed_to_create_the_canonical_imported_trip_on_the_server"
  },
  {
    "source": "فشل استعلام نموذج قراءة أسطول المشروع",
    "key": "residual.messages.failed_to_query_the_project_fleet_read_model"
  },
  {
    "source": "فشلت عملية إنشاء السائق المعتمد",
    "key": "residual.messages.failed_to_create_the_canonical_driver"
  },
  {
    "source": "فشلت عملية إنشاء الشاحنة المعتمدة",
    "key": "residual.messages.failed_to_create_the_canonical_truck"
  },
  {
    "source": "تم تأكيد المعالجة السابقة خادومياً (Idempotency Hit)",
    "key": "residual.messages.previous_server_processing_confirmed_idempotency_hit"
  },
  {
    "source": "تمت المصادقة والاعتماد الخادومي بنجاح (ACK Confirmed)",
    "key": "residual.messages.server_authentication_and_approval_succeeded_ack_confirmed"
  },
  {
    "source": "تم تحديث حالة الرحلة واعتمادها بنجاح خادومياً (ACK Confirmed)",
    "key": "residual.messages.trip_status_updated_and_approved_on_the_server_ack_confirmed"
  },
  {
    "source": "تم تسجيل إيصال الاستلام وتحديث أوزان الوجهة بنجاح (ACK Confirmed)",
    "key": "residual.messages.receipt_recorded_and_destination_weights_updated_ack_confirmed"
  },
  {
    "source": "تم تسجيل الاستثناء التشغيلي بنجاح خادومياً (ACK Confirmed)",
    "key": "residual.messages.operational_exception_recorded_on_the_server_ack_confirmed"
  },
  {
    "source": "خطأ غير متوقع أثناء معالجة المزامنة",
    "key": "residual.messages.unexpected_error_while_processing_synchronization"
  },
  {
    "source": "معرف المشروع مفقود في حمولة العملية",
    "key": "residual.messages.project_identifier_is_missing_from_the_operation_payload"
  },
  {
    "source": "بيانات العملية (Payload) فارغة",
    "key": "residual.messages.the_operation_payload_is_empty"
  },
  {
    "source": "فشل التحقق الخادومي: الوزن القائم ({value0}) غير صالح مقارنة بوزن الفارغ ({value1})",
    "key": "residual.messages.server_validation_failed_gross_weight_value_is_invalid_relative_to_tare_weight_value"
  },
  {
    "source": "فشل التحقق الخادومي: بيانات وقاعدة التسعير غير محددة بالرحلة",
    "key": "residual.messages.server_validation_failed_trip_pricing_data_and_rule_are_missing"
  },
  {
    "source": "فشل التحقق الخادومي: نقص في بيانات Master Data الأساسية",
    "key": "residual.messages.server_validation_failed_required_master_data_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: معرف الرحلة مفقود",
    "key": "residual.messages.server_validation_failed_trip_identifier_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: حالة الرحلة مفقودة",
    "key": "residual.messages.server_validation_failed_trip_status_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: معرف الرحلة مفقود",
    "key": "residual.messages.server_validation_failed_trip_identifier_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: وزن الوجهة القائم ({value0}) يجب أن يكون أكبر من وزن الفارغ ({value1})",
    "key": "residual.messages.server_validation_failed_destination_gross_weight_value_must_exceed_tare_weight_value"
  },
  {
    "source": "فشل التحقق الخادومي: معرف الاستثناء مفقود",
    "key": "residual.messages.server_validation_failed_exception_identifier_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: نوع الاستثناء مفقود",
    "key": "residual.messages.server_validation_failed_exception_type_is_missing"
  },
  {
    "source": "فشل التحقق الخادومي: درجة خطورة الاستثناء مفقودة",
    "key": "residual.messages.server_validation_failed_exception_severity_is_missing"
  },
  {
    "source": "نوع العملية غير مدعوم في المزامنة: {value0}",
    "key": "operations.service.sync.unsupported_operation"
  },
  {
    "source": "تعارض: الرحلة مكتملة ومغلقة بالفعل على الخادم",
    "key": "offline.status.trip"
  },
  {
    "source": "تعارض: الرحلة مصنفة كمرتجعة (RETURNED) على الخادم",
    "key": "offline.labels.trip"
  },
  {
    "source": "تعارض في إصدارات السجل (Version Conflict)",
    "key": "residual.messages.record_version_conflict"
  },
  {
    "source": "تعارض تكرار التذكرة/العملية (Duplicate Operation)",
    "key": "residual.messages.duplicate_ticket_or_operation_conflict"
  },
  {
    "source": "تحديث في قاعدة التسعير الخادومية (Pricing Changed)",
    "key": "residual.messages.server_pricing_rule_changed"
  },
  {
    "source": "تعارض تبعية الشاحنة للناقل (Truck-Carrier Conflict)",
    "key": "offline.labels.truck"
  },
  {
    "source": "تغيير في البيانات الأساسية (Master Data Changed)",
    "key": "residual.messages.master_data_changed"
  },
  {
    "source": "تم تفريغ واستلام الرحلة ({value0}) وتأكيد اكتمالها خادومياً قبل مزامنة العملية المحلية. يمنع نظامياً الكتابة فوق الرحلات المكتملة (Anti Last-Write-Wins).",
    "key": "residual.messages.trip_value_was_unloaded_received_and_completed_on_the_server_before_local_synchronization_completed_trips_cannot_be_overwritten_anti_last_write_wins"
  },
  {
    "source": "تم رفض الشحنة أو إرجاعها إلى المصدر ({value0}) على الخادم قبل وصول العملية المحلية.",
    "key": "residual.messages.shipment_value_was_rejected_or_returned_to_origin_on_the_server_before_the_local_operation_arrived"
  },
  {
    "source": "السجل في الخادم تم تعديله (الإصدار الحالي: v{value0}) بينما تم إعداد الأمر المحلي بالاعتماد على الإصدار (v{value1}). يمنع الكتابة التلقائية دون حل معتمد.",
    "key": "residual.messages.the_server_record_is_at_vvalue_but_the_local_command_uses_vvalue_automatic_overwrite_requires_an_approved_resolution"
  },
  {
    "source": "رقم تذكرة الميزان ({value0}) مسجل مسبقاً لرحلة أخرى في النظام ({value1}). لا يمكن إصدار تذكرتين برقم موحد.",
    "key": "residual.messages.weighbridge_ticket_value_is_already_registered_to_another_trip_value_ticket_numbers_must_be_unique"
  },
  {
    "source": "تم تحديث سعر القاعدة ({value0}) على الخادم من ({value1} ر.س) إلى ({value2} ر.س). تحمي المنظومة السعر الأصلي للرحلة استناداً للقطة التسعير الموثقة وقت الإنشاء.",
    "key": "residual.messages.rule_value_changed_on_the_server_from_value_sar_to_value_sar_the_documented_creation_time_snapshot_protects_the_original_trip_rate"
  },
  {
    "source": "الشاحنة ({value0}) مسجلة على الخادم تابعة لناقل آخر ({value1}) أو تم إلغاء ربطها بالناقل ({value2}).",
    "key": "residual.messages.truck_value_belongs_to_another_carrier_value_on_the_server_or_its_link_to_carrier_value_was_removed"
  },
  {
    "source": "تم إيقاف توريد هذه المادة خادومياً لعدم مطابقة المواصفات البيئية للمشروع",
    "key": "residual.messages.this_material_s_supply_was_stopped_on_the_server_because_it_does_not_meet_the_project_s_environmental_specifications"
  },
  {
    "source": "حالة الرحلة",
    "key": "analytics.ui.trip_status_151"
  },
  {
    "source": "رقم الإصدار",
    "key": "residual.messages.version_number"
  },
  {
    "source": "حالة الرحلة",
    "key": "analytics.ui.trip_status_151"
  },
  {
    "source": "إصدار السجل",
    "key": "residual.messages.record_version"
  },
  {
    "source": "الملاحظات وبيانات التحديث",
    "key": "residual.messages.notes_and_update_data"
  },
  {
    "source": "رقم تذكرة الميزان",
    "key": "operations.weighbridge_ticket_number"
  },
  {
    "source": "السعر المتفق عليه (ر.س)",
    "key": "residual.messages.agreed_rate_sar"
  },
  {
    "source": "إجمالي التسوية المالية التقديرية",
    "key": "residual.messages.estimated_total_settlement"
  },
  {
    "source": "الناقل المفوض",
    "key": "field_operations.authorized_carrier"
  },
  {
    "source": "المادة المنقولة",
    "key": "residual.messages.transported_material"
  },
  {
    "source": "الحالة في الخادم مكتملة رسمياً",
    "key": "residual.messages.the_server_status_is_officially_completed"
  },
  {
    "source": "التذكرة محجوزة لرحلة سابقة",
    "key": "offline.labels.trip_2"
  },
  {
    "source": "محمي باللقطة التعاقدية وقت الإنشاء",
    "key": "residual.messages.protected_by_the_creation_time_contractual_snapshot"
  },
  {
    "source": "الناقل الفعلي بالخادم: {value0}",
    "key": "residual.messages.actual_server_carrier_value"
  },
  {
    "source": "تم تعليق أو تعديل الكيان خادومياً أثناء عمل الـ Offline",
    "key": "offline.labels.edit"
  },
  {
    "source": "قاعدة عدم المساس بالقيمة التعاقدية للـ Offline: نظراً لإنشاء الرحلة باستخدام لقطة تسعير (Pricing Snapshot) صالحة ومعتمدة وقت الإنشاء، فإن قيمة الرحلة تظل ثابتة تماماً باللقطة الأصلية. التحديث الخادومي يسري فقط على الرحلات المستقبلية.",
    "key": "residual.messages.offline_contractual_value_protection_a_trip_created_with_a_valid_approved_pricing_snapshot_keeps_its_original_value_server_price_changes_apply_only_to_future_trips"
  },
  {
    "source": "اكتشاف تعارض الإصدارات (VERSION_CONFLICT)",
    "key": "residual.messages.detect_record_version_conflicts_version_conflict"
  },
  {
    "source": "اكتشاف تغير السعر الخادومي مع حماية اللقطة (PRICING_CHANGED)",
    "key": "residual.messages.detect_server_rate_changes_and_protect_snapshots_pricing_changed"
  },
  {
    "source": "منع الكتابة فوق الرحلات المكتملة (TRIP_ALREADY_COMPLETED)",
    "key": "residual.messages.prevent_overwriting_completed_trips_trip_already_completed"
  },
  {
    "source": "رصد تعارض الرحلة المرتجعة (TRIP_ALREADY_RETURNED)",
    "key": "residual.messages.detect_returned_trips_trip_already_returned"
  },
  {
    "source": "اكتشاف تكرار تذكرة الميزان والعملية (DUPLICATE_OPERATION)",
    "key": "residual.messages.detect_duplicate_weighbridge_tickets_and_operations_duplicate_operation"
  },
  {
    "source": "تعارض تبعية الشاحنة للناقل (TRUCK_CARRIER_CONFLICT)",
    "key": "residual.messages.truck_carrier_affiliation_conflict"
  },
  {
    "source": "تغيير أو إيقاف البيانات الأساسية (MASTER_DATA_CHANGED)",
    "key": "residual.messages.detect_changed_or_suspended_master_data_master_data_changed"
  },
  {
    "source": "الحفاظ الصارم على الأمرين وإشعار المستخدم (Preserve Local & Server State)",
    "key": "residual.messages.preserve_both_commands_and_notify_the_user_preserve_local_server_state"
  },
  {
    "source": "ثبات تسعير الـ Offline وعدم تأثره بتحديثات السعر اللاحقة (Pricing Invariance)",
    "key": "residual.messages.offline_pricing_remains_stable_after_later_rate_changes_pricing_invariance"
  },
  {
    "source": "التسوية الصريحة والتدقيق الإلزامي (Explicit Resolution & Audit Trail)",
    "key": "residual.messages.explicit_resolution_and_mandatory_audit_explicit_resolution_audit_trail"
  },
  {
    "source": "تم بنجاح رصد تعارض الإصدار (خادم: v{value0} مقابل محلي: v1)",
    "key": "residual.messages.version_conflict_detected_server_vvalue_local_v1"
  },
  {
    "source": "فشل اكتشاف تعارض الإصدار",
    "key": "residual.messages.failed_to_detect_the_version_conflict"
  },
  {
    "source": "تم حماية لقطة السعر وقت الإنشاء بنجاح دون المساس بقيمة الرحلة الأصلية",
    "key": "residual.messages.creation_time_pricing_snapshot_protected_without_changing_the_original_trip_value"
  },
  {
    "source": "فشل اكتشاف تعارض السعر أو حماية اللقطة",
    "key": "residual.messages.failed_to_detect_the_price_conflict_or_protect_the_snapshot"
  },
  {
    "source": "تم رصد إغلاق الرحلة الخادومي ({value0}) ومنع الكتابة التلقائية",
    "key": "residual.messages.server_completion_of_trip_value_detected_and_automatic_overwrite_prevented"
  },
  {
    "source": "فشل رصد تعارض الرحلة المكتملة",
    "key": "residual.messages.failed_to_detect_the_completed_trip_conflict"
  },
  {
    "source": "تم رصد حالة الإرجاع الخادومية وتجميد الأمر المحلي",
    "key": "residual.messages.server_return_status_detected_and_local_command_frozen"
  },
  {
    "source": "فشل رصد تعارض الرحلة المرتجعة",
    "key": "residual.messages.failed_to_detect_the_returned_trip_conflict"
  },
  {
    "source": "تم رصد التكرار على تذكرة الميزان ({value0}) ومنع التكرار الميداني",
    "key": "residual.messages.duplicate_weighbridge_ticket_value_detected_and_field_duplication_prevented"
  },
  {
    "source": "فشل رصد العملية المكررة",
    "key": "residual.messages.failed_to_detect_the_duplicate_operation"
  },
  {
    "source": "تم اكتشاف تعارض التبعية للشاحنة TRK-9011 والناقل CAR-003 بنجاح",
    "key": "residual.messages.truck_trk_9011_and_carrier_car_003_affiliation_conflict_detected"
  },
  {
    "source": "فشل اكتشاف تعارض الشاحنة والناقل",
    "key": "residual.messages.failed_to_detect_the_truck_carrier_conflict"
  },
  {
    "source": "تم رصد المادة الموقوفة (MAT-DEACTIVATED) وتجميد العملية",
    "key": "residual.messages.suspended_material_mat_deactivated_detected_and_operation_frozen"
  },
  {
    "source": "فشل رصد تغيير البيانات الأساسية",
    "key": "residual.messages.failed_to_detect_the_master_data_change"
  },
  {
    "source": "تم تجميد الأمر المحلي وحفظ حالة الخادم وإرسال إشعار للمستخدم وفتح سجل تعارض صريح",
    "key": "residual.messages.local_command_frozen_server_state_preserved_user_notified_and_explicit_conflict_record_opened"
  },
  {
    "source": "فشل في حفظ أحد الأمرين أو في إشعار المستخدم",
    "key": "residual.messages.failed_to_preserve_both_commands_or_notify_the_user"
  },
  {
    "source": "تم تأكيد فك تعليق الرحلة بقيمة ({value0} ر.س) وإعادة جدولتها للمزامنة بنجاح بالصيغة المحمية.",
    "key": "residual.messages.trip_released_at_the_protected_rate_value_sar_and_rescheduled_for_synchronization"
  },
  {
    "source": "فشل ثبات تسعير الـ Offline",
    "key": "residual.messages.offline_pricing_invariance_failed"
  },
  {
    "source": "تم توثيق التدقيق وسجل الحل الصريح وهوية المسؤول وتاريخ القرار بنجاح",
    "key": "residual.messages.audit_explicit_resolution_responsible_identity_and_decision_date_recorded"
  },
  {
    "source": "فشل في تطبيق التسوية الصريحة",
    "key": "residual.messages.failed_to_apply_explicit_resolution"
  },
  {
    "source": "سجل التعارض ({value0}) غير موجود",
    "key": "residual.messages.conflict_record_value_was_not_found"
  },
  {
    "source": "بيانات السعر الجديد للخادم غير متوفرة للتطبيق",
    "key": "residual.messages.new_server_rate_data_is_unavailable_for_application"
  },
  {
    "source": "UNAUTHENTICATED: User must be signed in to create project carrier",
    "key": "residual.messages.unauthenticated_sign_in_to_create_a_project_carrier"
  },
  {
    "source": "UNAUTHENTICATED: User must be signed in to update project carrier",
    "key": "residual.messages.unauthenticated_sign_in_to_update_a_project_carrier"
  },
  {
    "source": "UNAUTHENTICATED: User must be signed in to create project material",
    "key": "residual.messages.unauthenticated_sign_in_to_create_a_project_material"
  },
  {
    "source": "UNAUTHENTICATED: User must be signed in to update project material",
    "key": "residual.messages.unauthenticated_sign_in_to_update_a_project_material"
  },
  {
    "source": "UNAUTHENTICATED: User must be signed in to perform canonical refresh",
    "key": "residual.messages.unauthenticated_sign_in_to_refresh_canonical_data"
  },
  {
    "source": "CANONICAL_REFRESH_NOT_CONVERGED: Canonical refresh did not converge within bounded attempts",
    "key": "residual.messages.canonical_refresh_not_converged_canonical_refresh_did_not_converge_within_bounded_attempts"
  },
  {
    "source": "INVALID_PAYLOAD_FORBIDDEN_FIELDS: Browser File objects cannot be persisted",
    "key": "residual.messages.invalid_payload_forbidden_fields_browser_file_objects_cannot_be_persisted"
  },
  {
    "source": "INVALID_PAYLOAD_FORBIDDEN_FIELDS: Blob objects cannot be persisted",
    "key": "residual.messages.invalid_payload_forbidden_fields_blob_objects_cannot_be_persisted"
  },
  {
    "source": "INVALID_PAYLOAD_FORBIDDEN_FIELDS: Raw ArrayBuffers cannot be persisted",
    "key": "residual.messages.invalid_payload_forbidden_fields_raw_arraybuffers_cannot_be_persisted"
  },
  {
    "source": "INVALID_PAYLOAD_FORBIDDEN_FIELDS: Field '{value0}' is forbidden",
    "key": "residual.messages.invalid_payload_forbidden_fields_field_value_is_forbidden"
  },
  {
    "source": "sessionRecord is required for resume mapping",
    "key": "residual.messages.a_session_record_is_required_to_reconstruct_a_resumed_import"
  },
  {
    "source": "موقوفة (DEACTIVATED)",
    "key": "residual.messages.suspended_deactivated"
  }
];

describe('Whole-app residual message presentation', () => {
  it.each(['ar', 'en', 'ur'] as const)('resolves every audited producer in %s with lossless parameters', locale => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, locale, params);
    for (const entry of audited) {
      const names = [...entry.source.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
      const params = Object.fromEntries(names.map((name, index) => [name, 'BUSINESS-VALUE-' + index]));
      const message = entry.source.replace(/\{(\w+)\}/g, (_, name) => params[name]);
      const expected = t(entry.key, params);
      expect(dictionaries[locale][entry.key], entry.key).toBeDefined();
      expect(presentBatch4Message(message, t), entry.source).toBe(expected);
      for (const value of Object.values(params)) expect(expected).toContain(value);
    }
  });

  it('retains unknown and ambiguously parameterized messages verbatim', () => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, 'ur', params);
    const unknown = 'CUSTOMER-42: original imported business data';
    expect(presentBatch4Message(unknown, t)).toBe(unknown);
    const ambiguous = 'فشل التحقق الخادومي: الوزن القائم (A) غير صالح مقارنة بوزن الفارغ (B) غير صالح مقارنة بوزن الفارغ (C)';
    expect(presentBatch4Message(ambiguous, t)).toBe(ambiguous);
  });

  it.each(['ar', 'en', 'ur'] as const)('preserves stable machine error codes in %s', locale => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, locale, params);
    for (const entry of audited.filter(entry => /^(UNAUTHENTICATED|CANONICAL_REFRESH_NOT_CONVERGED|INVALID_PAYLOAD_FORBIDDEN_FIELDS):/.test(entry.source))) {
      const message = entry.source.replace(/\{\w+\}/g, 'column-42');
      expect(presentBatch4Message(message, t).split(':')[0]).toBe(message.split(':')[0]);
    }
  });

  it('localizes only the synthetic material status and preserves business values', () => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, 'en', params);
    expect(batch4ConflictValueLabel(t, 'materialId', 'موقوفة (DEACTIVATED)')).toBe('Suspended (DEACTIVATED)');
    expect(batch4ConflictValueLabel(t, 'driverName', 'موقوفة (DEACTIVATED)')).toBe('موقوفة (DEACTIVATED)');
    expect(batch4ConflictValueLabel(t, 'materialId', 'Imported customer material')).toBe('Imported customer material');
    expect(batch4ConflictValueLabel(t, 'status', 'DEACTIVATED')).toBe('DEACTIVATED');
  });
});
