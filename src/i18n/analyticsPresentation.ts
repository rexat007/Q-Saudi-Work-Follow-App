// Dashboard/report presentation only. Service datasets and export payloads stay original.
export type AnalyticsTranslator = (key: string, params?: Record<string, string | number>) => string;

// Exact current presentation labels; never apply this registry to entity names or notes.
export const analyticsTextKeys: Readonly<Record<string, string>> = {
  "op.MEASURED": "op.MEASURED",
  "op.DERIVED_FROM_LOADING": "op.DERIVED_FROM_LOADING",
  "op.DERIVED_FROM_UNLOADING": "op.DERIVED_FROM_UNLOADING",
  "op.ESTIMATED_TRUCK_CAPACITY": "op.ESTIMATED_TRUCK_CAPACITY",
  "op.PROJECT_STANDARD": "op.PROJECT_STANDARD",
  "op.ESTIMATED_MATERIAL_TRUCK_MATRIX": "op.ESTIMATED_MATERIAL_TRUCK_MATRIX",
  "op.UNAVAILABLE": "op.UNAVAILABLE",

  "معلقة": "dashboard.labels.pending_suffix",
  "الناقل": "entityResolution.labels.carrier_3",
  "المكتملة": "dashboard.labels.completed_col",
  "قيد النقل": "analytics.ui.in_transit",
  "المادة": "legacyMigration.labels.material_2",
  "مصدر العملية (Source Type)": "analytics.ui.operation_source",
  "التعديلات (Adjustments)": "analytics.ui.adjustments",
  "تاريخ التشغيل": "analytics.column.shift_date",
  "إجمالي الرحلات": "operations.total_trips",
  "المرتجعة": "analytics.column.returned",
  "الاستثناءات": "analytics.column.exceptions",
  "الصافي (طن)": "analytics.column.net_weight_tons",
  "الرحلات المسعرة": "analytics.column.priced_trips",
  "معلقة التسوية": "analytics.column.pending_settlement",
  "المبلغ الإجمالي (SAR)": "analytics.column.gross_amount_sar",
  "صافي المستحق (SAR)": "analytics.column.net_payable_sar",
  "نسبة الإنجاز (%)": "analytics.column.completion_rate",
  "الوردية وتاريخ التشغيل": "analytics.column.shift_and_operation_date",
  "مسؤولو الوردية": "analytics.column.shift_supervisors",
  "عدد الردود": "analytics.column.trip_count",
  "الردود المفرغة": "analytics.column.unloaded_trips",
  "الأطنان المنقولة": "analytics.column.transported_tons",
  "معدل الحمولة (طن/رد)": "analytics.column.payload_rate_tons_trip",
  "اسم الناقل اللوجستي": "analytics.column.logistics_carrier_name",
  "الشاحنات العاملة": "analytics.column.operating_trucks",
  "إجمالي الردود": "analytics.column.total_trips",
  "إجمالي الأطنان": "analytics.column.total_tons",
  "متوسط الحمولة (طن)": "analytics.column.average_payload_tons",
  "المعتمدة مالياً": "analytics.column.financially_approved_trips",
  "بدل الانتظار (SAR)": "analytics.column.waiting_allowance_sar",
  "صافي المستحق النهائي (SAR)": "analytics.column.final_net_payable_sar",
  "نسبة الامتثال (%)": "analytics.column.compliance_rate",
  "المادة الموردة": "field_operations.supplied_material",
  "رمز المادة": "analytics.column.material_code",
  "صافي المصدر (طن)": "analytics.column.source_net_weight_tons",
  "صافي المقصد (طن)": "analytics.column.destination_net_weight_tons",
  "الفارق الموزني (كجم)": "analytics.column.weight_variance_kg",
  "الناقلون المنفذون": "analytics.column.operating_carriers",
  "رقم اللوحة": "analytics.column.plate_number",
  "الناقل التابع": "analytics.column.affiliated_carrier",
  "عدد الرحلات": "analytics.column.number_of_trips",
  "الحمولة النظامية (طن)": "analytics.column.legal_payload_limit_tons",
  "معدل الاستغلال (%)": "analytics.column.utilization_rate",
  "الرقم التسلسلي": "analytics.column.trip_serial_number",
  "تذكرة الميزان": "analytics.column.weighbridge_ticket",
  "الشاحنة": "legacyMigration.labels.truck_2",
  "صافي المصدر (كجم)": "analytics.column.source_net_weight_kg",
  "صافي المقصد (كجم)": "analytics.column.destination_net_weight_kg",
  "مصدر وزن المقصد": "analytics.column.destination_weight_source",
  "الفارق (كجم)": "analytics.column.variance_kg",
  "نسبة الفارق": "analytics.column.variance_percentage",
  "التصنيف الرقابي": "analytics.column.control_classification",
  "التاريخ": "analytics.column.date",
  "المادة المرفوضة": "analytics.column.rejected_material",
  "الكمية المرتجعة (طن)": "analytics.column.returned_quantity_tons",
  "سبب الرفض والإرجاع": "analytics.column.rejection_and_return_reason",
  "المشرف المعتمد للرفض": "analytics.column.authorized_rejection_supervisor",
  "صافي المستحق المحتسب": "analytics.column.calculated_net_payable",
  "معرف الاستثناء": "analytics.column.exception_identifier",
  "معرف الرحلة": "analytics.column.trip_identifier",
  "نوع الاستثناء": "analytics.column.exception_type",
  "درجة الخطورة": "analytics.column.severity",
  "حالة الاستثناء": "analytics.column.exception_status",
  "الناقل المعني": "analytics.column.concerned_carrier",
  "وصف حالة عدم المطابقة": "analytics.column.nonconformity_description",
  "إجراء المعالجة والحل": "analytics.column.resolution_action",
  "الجزاء المترتب (SAR)": "analytics.column.resulting_penalty_sar",
  "مصدر تسجيل العملية": "analytics.column.operation_recording_source",
  "الأطنان المنقولة (طن)": "analytics.column.transported_weight_tons",
  "صافي المستحق المعتمد (SAR)": "analytics.column.approved_net_payable_sar",
  "معلقة التسعير (Pending)": "analytics.column.pending_pricing",
  "توزيع النماذج": "analytics.column.pricing_model_distribution",
  "المبلغ الإجمالي (Gross)": "analytics.column.gross_amount",
  "بدل الانتظار المعتمد": "analytics.column.approved_waiting_allowance",
  "الاستثناءات والخصومات": "analytics.column.exceptions_and_deductions",
  "صافي المستحق النهائي (Net)": "analytics.column.final_net_payable",
  "المستحق شاملاً الضريبة (15%)": "analytics.column.payable_including_vat_15",
  "نموذج التسعير": "analytics.column.pricing_model",
  "قاعدة الحساب المعتمدة": "analytics.column.approved_calculation_formula",
  "صافي المستحق (Net)": "analytics.column.net_payable",
  "الحصة من الإنفاق (%)": "analytics.column.share_of_spending",
  "اسم المادة": "analytics.column.material_name",
  "الردود": "analytics.column.trips",
  "المعتمدة": "analytics.column.approved",
  "الوزن المنقول (طن)": "analytics.column.transported_weight_tons_255",
  "متوسط تكلفة النقل/طن (SAR)": "analytics.column.average_transport_cost_ton_sar",
  "حالة التسوية": "analytics.column.settlement_status",
  "سعر الرد المقطوع (SAR)": "analytics.column.fixed_trip_rate_sar",
  "مطابقة المعادلة (عدد × سعر)": "analytics.column.formula_verification_count_rate",
  "الإجمالي (Gross)": "analytics.column.gross_total",
  "التعديلات": "analytics.column.adjustments",
  "صافي الوزن (طن)": "analytics.column.net_weight_tons_262",
  "سعر الطن المتفق (SAR)": "analytics.column.agreed_rate_per_ton_sar",
  "مطابقة المعادلة (أطنان × سعر)": "analytics.column.formula_verification_tons_rate",
  "تاريخ الاستحقاق اليومي": "analytics.column.daily_due_date",
  "نماذج التسعير المنفذة": "analytics.column.executed_pricing_models",
  "الأطنان الإجمالية": "analytics.column.total_tons_267",
  "صافي المستحق اليومي (Net)": "analytics.column.daily_net_payable",
  "متوسط تكلفة الرد المعتمد (SAR)": "analytics.column.average_approved_trip_cost_sar",
  "المشروع الإنشائي": "analytics.column.construction_project",
  "عدد المواد": "analytics.column.material_count",
  "عدد الناقلين": "analytics.column.carrier_count",
  "صافي المستحق قبل الضريبة": "analytics.column.net_payable_before_vat",
  "ضريبة القيمة المضافة (15%)": "analytics.column.value_added_tax_15",
  "المستحق النهائي مع الضريبة": "analytics.column.final_payable_including_vat",
  "العمليات اليومية": "analytics.metadata.daily_operations",
  "حصر شامل للرحلات اليومية والأوزان المنقولة ونسب الإنجاز لكل تاريخ تشغيل": "analytics.metadata.daily_trips_transported_weights_and_completion_rates_by_operation_date",
  "عمليات الورديات": "analytics.metadata.shift_operations",
  "توزيع حركة النقل والشحن حسب ورديات العمل (صباحية، مسائية، ليلية) ومعدلات الإنتاجية": "analytics.metadata.transport_and_loading_activity_by_morning_evening_and_night_shifts_with_productivity_r",
  "أداء الناقلين": "analytics.metadata.carrier_performance",
  "تقييم كفاءة أساطيل الناقلين، الالتزام بالأوزان النظامية، ونسب إكمال النقل بدون استثناءات": "analytics.metadata.carrier_fleet_efficiency_legal_weight_compliance_and_exception_free_completion_rates",
  "حركة المواد والكميات": "analytics.metadata.material_movement_and_quantities",
  "تتبع حركة المواد الموردة بالأطنان والردود ومطابقة التوريدات بالمشاريع": "analytics.metadata.track_material_deliveries_in_tons_and_trips_and_reconcile_supplies_by_project",
  "معدل استغلال الشاحنات": "analytics.metadata.truck_utilization",
  "كفاءة الحمولة للشاحنات مقارنة بالحمولة النظامية المسموحة وتكرار الرحلات": "analytics.metadata.truck_payload_efficiency_against_legal_load_limits_and_trip_frequency",
  "فروقات الموازين": "analytics.metadata.weight_variance",
  "مقارنة دقيقة بين وزن المصدر ووزن المقصد واحتساب نسبة العجز والزيادة والحدود المسموحة": "analytics.metadata.compare_source_and_destination_weights_shortages_surpluses_and_allowed_limits",
  "الرحلات المرتجعة والمرفوضة": "analytics.metadata.returned_and_rejected_trips",
  "حصر الرحلات التي تم إرجاعها أو رفضها مع أسباب الرفض ومسؤولي التوجيه بالموقع": "analytics.metadata.returned_or_rejected_trips_with_rejection_reasons_and_site_decision_makers",
  "تقرير الاستثناءات": "analytics.metadata.exception_report",
  "تحليل حالات عدم المطابقة الـ 12 وحالات التدقيق والتسوية التشغيلية": "analytics.metadata.analyze_the_12_nonconformity_types_and_operational_audit_and_settlement_cases",
  "تحليل مصادر العمليات": "analytics.metadata.operation_source_analysis",
  "تحليل وتوزيع الرحلات والأوزان والمبالغ المالية حسب مصدر الإدخال والتشغيل": "analytics.metadata.trips_weights_and_financial_amounts_grouped_by_entry_and_operation_source",
  "تسوية ومستحقات الناقلين": "analytics.metadata.carrier_settlements_and_dues",
  "مستحقات الناقلين المعتمدة بناءً على لقطات التسعير التعاقدية للرحلات والتسويات المطبقة": "analytics.metadata.approved_carrier_dues_based_on_trip_contractual_pricing_snapshots_and_applied_settleme",
  "التسوية حسب نوع التسعير": "analytics.metadata.settlement_by_pricing_type",
  "مقارنة مالية بين عقود النقل بالطن (PER_TON) وعقود النقل بالرد المقطوع (PER_TRIP)": "analytics.metadata.financial_comparison_of_per_ton_transport_contracts_and_per_trip_fixed_rate_contracts",
  "التسوية حسب نوع المادة": "analytics.metadata.settlement_by_material",
  "تكاليف النقل الإجمالية الموزعة على المواد المختلفة ومتوسط تكلفة طن التوريد": "analytics.metadata.transport_costs_by_material_and_average_delivery_cost_per_ton",
  "تسويات الرحلات المقطوعة (PER_TRIP)": "analytics.metadata.fixed_rate_trip_settlements_per_trip",
  "تدقيق رحلات الرد المقطوع وفق المعادلة: المبلغ = عدد الرحلات × سعر الرحلة": "analytics.metadata.verify_fixed_rate_trips_amount_trip_count_rate_per_trip",
  "تسويات الأوزان والأطنان (PER_TON)": "analytics.metadata.weight_and_tonnage_settlements_per_ton",
  "تدقيق رحلات الطن المتري وفق المعادلة: المبلغ = مجموع صافي الأطنان × سعر الطن": "analytics.metadata.verify_weight_based_trips_amount_net_tons_rate_per_ton",
  "التسوية اليومية": "analytics.metadata.daily_settlement",
  "التدفقات المالية اليومية والالتزامات التعاقدية اليومية للعمليات اللوجستية": "analytics.metadata.daily_financial_flows_and_contractual_obligations_for_logistics_operations",
  "ملخص التسوية الشامل للمشاريع": "analytics.metadata.project_settlement_summary",
  "تقرير مالي تنفيذي شامل يوضح Gross Amount و Adjustments و Exceptions و Net Amount": "analytics.metadata.executive_financial_report_of_gross_amounts_adjustments_exceptions_and_net_amounts",
  "عقود المقطوعية بالرد (PER_TRIP)": "analytics.upstream.fixed_rate_trip_contracts_per_trip",
  "عقود الطن المتري (PER_TON)": "analytics.upstream.metric_ton_contracts_per_ton",
  "الوردية الصباحية (افتراضي)": "analytics.upstream.morning_shift_default",
  "الوردية الصباحية (06:00 - 14:00)": "analytics.upstream.morning_shift_06_00_14_00",
  "الوردية المسائية (14:00 - 22:00)": "analytics.upstream.evening_shift_14_00_22_00",
  "الوردية الليلية (22:00 - 06:00)": "analytics.upstream.night_shift_22_00_06_00",
  "صافي المصدر المعتمد كمقصد (Origin Net Accepted)": "analytics.upstream.approved_source_net_accepted_as_destination_origin_net_accepted",
  "ميزان المقصد الفعلي (Actual Destination Scale)": "analytics.upstream.actual_destination_scale",
  "بانتظار الوزن بالمقصد": "analytics.upstream.awaiting_destination_weighing",
  "معلق التسوية (Pending Settlement)": "analytics.upstream.pending_settlement",
  "تسوية معتمدة (Finalized)": "analytics.upstream.finalized_settlement",
  "تعتمد الأرقام على تسجيلات الموازين المعتمدة وسجلات التشغيل في Firestore.": "analytics.upstream.figures_are_based_on_approved_weighbridge_and_operation_records_in_firestore",
  "مطابق (ضمن النطاق المسموح)": "analytics.upstream.compliant_within_allowed_limits",
  "مطابق (اعتماد صافي المصدر)": "analytics.upstream.compliant_source_net_accepted",
  "عجز تجاوز التسامح (-)": "analytics.upstream.shortage_exceeds_tolerance",
  "زيادة تجاوز التسامح (+)": "analytics.upstream.surplus_exceeds_tolerance",
  "الحد الأقصى للتفاوت المسموح به تعاقدياً هو ±1.5% أو 500 كجم كحد أقصى.": "analytics.upstream.maximum_contractual_variance_is_1_5_capped_at_500_kg",
  "الشحنات المرتجعة لا يُستحق عنها أجر نقل وتخضع لخصم كامل وفقاً لشروط العقد.": "analytics.upstream.returned_shipments_earn_no_transport_fee_and_are_subject_to_full_deduction_under_the_c",
  "ميزان إلكتروني معتمد (Weighbridge)": "analytics.upstream.approved_electronic_weighbridge",
  "إدخال يدوي ميداني (Manual Entry)": "analytics.upstream.manual_field_entry",
  "استيراد ملفات إكسل (Excel Import)": "analytics.upstream.excel_file_import",
  "ملفات البيانات النصية (CSV)": "analytics.upstream.text_data_files_csv",
  "جداول جوجل المتزامنة (Google Sheets)": "analytics.upstream.synchronized_google_sheets",
  "ملفات سحابة جوجل (Google Drive)": "analytics.upstream.google_drive_files",
  "واجهة الربط البرمجي (External API)": "analytics.upstream.external_api_integration",
  "ترحيل بيانات تاريخية (Legacy Migration)": "analytics.upstream.historical_data_migration",
  "يعزل التقرير مبالغ الرحلات المعلقة عن صافي المستحق النهائي المعتمد وفقاً لقواعد التدقيق المالي.": "analytics.upstream.pending_trip_amounts_are_excluded_from_the_approved_final_net_payable_under_financial_",
  "تُحتسب التسويات وفقاً للمبالغ التعاقدية المثبتة في لقطة التسعير (settlementAmount) لكل رحلة.": "analytics.upstream.settlements_use_the_contractual_settlementamount_stored_in_each_trip_pricing_snapshot",
  "تسعير بالوزن (سعر الطن المتري)": "analytics.upstream.weight_based_pricing_metric_ton_rate",
  "تسعير مقطوعية (سعر الرحلة / الرد)": "analytics.upstream.fixed_rate_pricing_per_trip",
  "مجموع صافي الأطنان × سعر الطن": "analytics.upstream.total_net_tons_rate_per_ton",
  "عدد الرحلات × سعر الرحلة": "analytics.upstream.trip_count_rate_per_trip",
  "معلق — بانتظار اعتماد عقد التسعير": "analytics.upstream.pending_awaiting_pricing_contract_approval",
  "قاعدة الحساب الصارمة: المبلغ = عدد الرحلات × سعر الرحلة. تعزل الرحلات معلقة التسعير من صافي المستحق النهائي.": "analytics.upstream.strict_formula_amount_trip_count_rate_per_trip_trips_awaiting_pricing_are_excluded_fro",
  "قاعدة الحساب الصارمة: المبلغ = مجموع صافي الأطنان × سعر الطن. تعزل الرحلات معلقة التسعير من صافي المستحق النهائي.": "analytics.upstream.strict_formula_amount_total_net_tons_rate_per_ton_trips_awaiting_pricing_are_excluded_",
  "التقرير المالي التنفيذي العام لمستحقات عقود النقل والتوريد وفقاً لمعايير هيئة الزكاة والضريبة والجمارك (ZATCA).": "analytics.upstream.executive_financial_report_of_transport_and_supply_contract_dues_under_zatca_standards",

};

export function presentAnalyticsText(value: string, t: AnalyticsTranslator): string {
  const key = Object.prototype.hasOwnProperty.call(analyticsTextKeys, value) ? analyticsTextKeys[value] : undefined;
  return key ? t(key) : value;
}

// Field provenance is required: identical text in business-name/reason columns stays untouched.
const cellTextSources: Readonly<Record<string, readonly string[]>> = {
  "classification": ["مطابق (ضمن النطاق المسموح)", "مطابق (اعتماد صافي المصدر)", "عجز تجاوز التسامح (-)", "زيادة تجاوز التسامح (+)"],
  "destinationWeightSourceLabelAr": ["صافي المصدر المعتمد كمقصد (Origin Net Accepted)", "ميزان المقصد الفعلي (Actual Destination Scale)", "بانتظار الوزن بالمقصد"],
  "sourceTypeLabelAr": ["ميزان إلكتروني معتمد (Weighbridge)", "إدخال يدوي ميداني (Manual Entry)", "استيراد ملفات إكسل (Excel Import)", "ملفات البيانات النصية (CSV)", "جداول جوجل المتزامنة (Google Sheets)", "ملفات سحابة جوجل (Google Drive)", "واجهة الربط البرمجي (External API)", "ترحيل بيانات تاريخية (Legacy Migration)"],
  "pricingTitleAr": ["تسعير بالوزن (سعر الطن المتري)", "تسعير مقطوعية (سعر الرحلة / الرد)"],
  "formula": ["مجموع صافي الأطنان × سعر الطن", "عدد الرحلات × سعر الرحلة"],
  "formulaCheck": ["معلق — بانتظار اعتماد عقد التسعير"],
  "settlementStatus": ["معلق التسوية (Pending Settlement)", "تسوية معتمدة (Finalized)"],
};

export function presentReportCell(column: string, value: unknown, t: AnalyticsTranslator): string {
  const original = String(value);
  if (Object.prototype.hasOwnProperty.call(cellTextSources, column) && cellTextSources[column].includes(original)) {
    const localized = presentAnalyticsText(original, t);
    if (localized !== original) return localized;
  }
  if (column === 'shiftName') {
    const boundary = original.indexOf(' - ');
    if (boundary >= 0) {
      const label = original.slice(boundary + 3);
      const key = Object.prototype.hasOwnProperty.call(analyticsTextKeys, label) ? analyticsTextKeys[label] : undefined;
      if (key && ["analytics.upstream.morning_shift_default", "analytics.upstream.morning_shift_06_00_14_00", "analytics.upstream.evening_shift_14_00_22_00", "analytics.upstream.night_shift_22_00_06_00"].includes(key)) return original.slice(0, boundary + 3) + t(key);
    }
  }
  const patterns: Record<string, { parts: readonly string[]; key: string }> = {
    pricingSplit: { parts: [' طن / ', ' رد'], key: "analytics.upstream.p0_tons_p1_trips" },
    modelsSplit: { parts: [' بالطن | ', ' بالرد'], key: "analytics.upstream.p0_per_ton_p1_per_trip" },
    formulaCheck: { parts: [' طن × ', ' = ', ''], key: "analytics.upstream.p0_tons_p1_p2" },
  };
  const pattern = Object.prototype.hasOwnProperty.call(patterns, column) ? patterns[column] : undefined;
  if (!pattern) return original;
  const params: Record<string, string> = {};
  let cursor = 0;
  for (const [index, literal] of pattern.parts.entries()) {
    if (!literal) { params['p' + index] = original.slice(cursor); cursor = original.length; continue; }
    const end = original.indexOf(literal, cursor);
    if (end <= cursor || original.indexOf(literal, end + literal.length) >= 0) return original;
    params['p' + index] = original.slice(cursor, end);
    cursor = end + literal.length;
  }
  return cursor === original.length ? t(pattern.key, params) : original;
}
