import type { OperationalTranslator } from './operationalMessages';

function ownEntry<T>(table: Readonly<Record<string, T>>, id: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(table, id) ? table[id] : undefined;
}
// UI labels only. Canonical IDs, discovery metadata, required flags and mapping values stay unchanged.
const fieldKeys: Readonly<Record<string, string>> = {
  "driverName": "entityResolution.labels.driver_name",
  "carrier": "entityResolution.labels.carrier_company_name",
  "carrierName": "entityResolution.labels.carrier_company_name",
  "materialName": "analytics.column.material_name",
  "materialCode": "materials.labels.material_2",
  "driverPhone": "entityResolution.labels.phone_number",
  "driverIdentity": "entityResolution.labels.residency_identifier",
  "truckPlate": "analytics.column.plate_number",
  "tareWeight": "field_operations.tare_weight_ticket",
  "tareWeightKg": "field_operations.tare_weight_ticket",
  "grossWeight": "field_operations.gross_weight_ticket",
  "netWeight": "field_operations.net_weight_label",
  "destNetWeight": "field_operations.dest_net_weight",
  "shiftDate": "dashboard.shift_date",
  "truckType": "batch4.presentation.field_truckType",
  "ticketId": "batch4.presentation.field_ticketId",
  "truckNo": "batch4.presentation.field_truckNo",
  "materialType": "batch4.presentation.field_materialType",
  "varianceWeight": "analytics.metadata.weight_variance",
  "weighTime": "batch4.presentation.field_weighTime",
  "loadTime": "batch4.presentation.field_loadTime",
  "unloadTime": "batch4.presentation.field_unloadTime",
  "loader": "batch4.presentation.field_loader",
  "unloader": "batch4.presentation.field_unloader",
  "tripRate": "batch4.presentation.field_tripRate",
  "projectId": "batch4.presentation.field_projectId",
  "unmapped": "batch4.presentation.field_unmapped",
  "maxGrossWeightKg": "batch4.presentation.field_maxGrossWeightKg"
};
const layerKeys: Readonly<Record<string, string>> = {
  "FOUNDATION": "projects.batch4.layer_foundation",
  "WORKSPACE": "projects.batch4.layer_workspace",
  "MATERIALS": "projects.batch4.layer_materials",
  "CARRIERS": "projects.batch4.layer_carriers",
  "ROSTER": "projects.batch4.layer_roster",
  "PRICING": "projects.batch4.layer_pricing",
  "ACCESS": "projects.batch4.layer_access",
  "REVIEW_ACTIVATION": "projects.batch4.layer_activation"
};
const stageKeys: Readonly<Record<string, string>> = {
  "SOURCE_DISCOVERY": "batch4.presentation.stage_SOURCE_DISCOVERY",
  "MAPPING_APPROVAL": "batch4.presentation.stage_MAPPING_APPROVAL",
  "CARRIER_RESOLUTION": "batch4.presentation.stage_CARRIER_RESOLUTION",
  "MATERIAL_RESOLUTION": "batch4.presentation.stage_MATERIAL_RESOLUTION",
  "DRIVER_TRUCK_RESOLUTION": "batch4.presentation.stage_DRIVER_TRUCK_RESOLUTION",
  "FINAL_REVIEW": "batch4.presentation.stage_FINAL_REVIEW",
  "COMMIT_RESULT": "batch4.presentation.stage_COMMIT_RESULT"
};
const kilogramFields = new Set(['tareWeight', 'grossWeight', 'netWeight', 'destNetWeight', 'tareWeightKg', 'maxGrossWeightKg']);
export function batch4FieldLabel(t: OperationalTranslator, field: string, fallback: string): string {
  const key = ownEntry(fieldKeys, field);
  if (!key) return fallback;
  const label = t(key);
  return kilogramFields.has(field) ? label + ' (' + t('shared.units.kg') + ')' : label;
}
export function batch4LayerLabel(t: OperationalTranslator, id: string, fallback: string): string {
  const key = ownEntry(layerKeys, id);
  return key ? t(key) : fallback;
}
export function batch4RosterStageLabel(t: OperationalTranslator, id: string, fallback: string): string {
  const key = ownEntry(stageKeys, id);
  return key ? t(key) : fallback;
}

// Diagnostic case IDs are stable; runners, assertions and actual server evidence are untouched.
const diagnosticKeys: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "SEC-RBAC-01": {
    "titleAr": "batch4.diagnostics.sec_rbac_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_01.details"
  },
  "SEC-RBAC-02": {
    "titleAr": "batch4.diagnostics.sec_rbac_02.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_02.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_02.details"
  },
  "SEC-RBAC-03": {
    "titleAr": "batch4.diagnostics.sec_rbac_03.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_03.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_03.details"
  },
  "SEC-RBAC-04": {
    "titleAr": "batch4.diagnostics.sec_rbac_04.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_04.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_04.details"
  },
  "SEC-RBAC-05": {
    "titleAr": "batch4.diagnostics.sec_rbac_05.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_05.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_05.details"
  },
  "SEC-RBAC-06": {
    "titleAr": "batch4.diagnostics.sec_rbac_06.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_rbac_06.expectedBehavior",
    "details": "batch4.diagnostics.sec_rbac_06.details"
  },
  "SEC-ISOLATION-01": {
    "titleAr": "batch4.diagnostics.sec_isolation_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_isolation_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_isolation_01.details"
  },
  "SEC-IMPORT-01": {
    "titleAr": "batch4.diagnostics.sec_import_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_import_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_import_01.details"
  },
  "SEC-PRICING-01": {
    "titleAr": "batch4.diagnostics.sec_pricing_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_pricing_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_pricing_01.details"
  },
  "SEC-REPLAY-01": {
    "titleAr": "batch4.diagnostics.sec_replay_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_replay_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_replay_01.details"
  },
  "SEC-UPLOAD-01": {
    "titleAr": "batch4.diagnostics.sec_upload_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_upload_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_upload_01.details"
  },
  "SEC-SECRETS-01": {
    "titleAr": "batch4.diagnostics.sec_secrets_01.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_secrets_01.expectedBehavior",
    "details": "batch4.diagnostics.sec_secrets_01.details"
  },
  "SEC-31": {
    "titleAr": "batch4.diagnostics.sec_31.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_31.expectedBehavior",
    "details": "batch4.diagnostics.sec_31.details"
  },
  "SEC-32": {
    "titleAr": "batch4.diagnostics.sec_32.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_32.expectedBehavior",
    "details": "batch4.diagnostics.sec_32.details"
  },
  "SEC-33": {
    "titleAr": "batch4.diagnostics.sec_33.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_33.expectedBehavior",
    "details": "batch4.diagnostics.sec_33.details"
  },
  "SEC-34": {
    "titleAr": "batch4.diagnostics.sec_34.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_34.expectedBehavior",
    "details": "batch4.diagnostics.sec_34.details"
  },
  "SEC-35": {
    "titleAr": "batch4.diagnostics.sec_35.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_35.expectedBehavior",
    "details": "batch4.diagnostics.sec_35.details"
  },
  "SEC-36": {
    "titleAr": "batch4.diagnostics.sec_36.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_36.expectedBehavior",
    "details": "batch4.diagnostics.sec_36.details"
  },
  "SEC-37": {
    "titleAr": "batch4.diagnostics.sec_37.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_37.expectedBehavior",
    "details": "batch4.diagnostics.sec_37.details"
  },
  "SEC-38": {
    "titleAr": "batch4.diagnostics.sec_38.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_38.expectedBehavior",
    "details": "batch4.diagnostics.sec_38.details"
  },
  "SEC-39": {
    "titleAr": "batch4.diagnostics.sec_39.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_39.expectedBehavior",
    "details": "batch4.diagnostics.sec_39.details"
  },
  "SEC-40": {
    "titleAr": "batch4.diagnostics.sec_40.titleAr",
    "expectedBehavior": "batch4.diagnostics.sec_40.expectedBehavior",
    "details": "batch4.diagnostics.sec_40.details"
  },
  "PAYLOAD-01-CROSS-PROJECT-IDOR": {
    "nameAr": "batch4.diagnostics.payload_01_cross_project_idor.nameAr",
    "attackDescription": "batch4.diagnostics.payload_01_cross_project_idor.attackDescription"
  },
  "PAYLOAD-02-SUPERVISOR-FINANCIAL-TAMPER": {
    "nameAr": "batch4.diagnostics.payload_02_supervisor_financial_tamper.nameAr",
    "attackDescription": "batch4.diagnostics.payload_02_supervisor_financial_tamper.attackDescription"
  },
  "PAYLOAD-03-SUPERVISOR-CARRIER-TRUCK-MUTATION": {
    "nameAr": "batch4.diagnostics.payload_03_supervisor_carrier_truck_mutation.nameAr",
    "attackDescription": "batch4.diagnostics.payload_03_supervisor_carrier_truck_mutation.attackDescription"
  },
  "PAYLOAD-04-PROJECT-ID-TAMPERING": {
    "nameAr": "batch4.diagnostics.payload_04_project_id_tampering.nameAr",
    "attackDescription": "batch4.diagnostics.payload_04_project_id_tampering.attackDescription"
  },
  "PAYLOAD-05-TRUCK-CARRIER-HIJACK": {
    "nameAr": "batch4.diagnostics.payload_05_truck_carrier_hijack.nameAr",
    "attackDescription": "batch4.diagnostics.payload_05_truck_carrier_hijack.attackDescription"
  },
  "PAYLOAD-06-HISTORICAL-PRICING-MUTATION": {
    "nameAr": "batch4.diagnostics.payload_06_historical_pricing_mutation.nameAr",
    "attackDescription": "batch4.diagnostics.payload_06_historical_pricing_mutation.attackDescription"
  },
  "PAYLOAD-07-AUDIT-MUTATION-DELETION": {
    "nameAr": "batch4.diagnostics.payload_07_audit_mutation_deletion.nameAr",
    "attackDescription": "batch4.diagnostics.payload_07_audit_mutation_deletion.attackDescription"
  },
  "PAYLOAD-08-PATH-TRAVERSAL-UPLOAD": {
    "nameAr": "batch4.diagnostics.payload_08_path_traversal_upload.nameAr",
    "attackDescription": "batch4.diagnostics.payload_08_path_traversal_upload.attackDescription"
  },
  "PAYLOAD-09-DANGEROUS-FILE-UPLOAD": {
    "nameAr": "batch4.diagnostics.payload_09_dangerous_file_upload.nameAr",
    "attackDescription": "batch4.diagnostics.payload_09_dangerous_file_upload.attackDescription"
  },
  "PAYLOAD-10-IDEMPOTENCY-REPLAY": {
    "nameAr": "batch4.diagnostics.payload_10_idempotency_replay.nameAr",
    "attackDescription": "batch4.diagnostics.payload_10_idempotency_replay.attackDescription"
  },
  "PAYLOAD-11-WEIGHBRIDGE-UNLOAD-TAMPERING": {
    "nameAr": "batch4.diagnostics.payload_11_weighbridge_unload_tampering.nameAr",
    "attackDescription": "batch4.diagnostics.payload_11_weighbridge_unload_tampering.attackDescription"
  },
  "PAYLOAD-12-UNAUTHENTICATED-ACCESS": {
    "nameAr": "batch4.diagnostics.payload_12_unauthenticated_access.nameAr",
    "attackDescription": "batch4.diagnostics.payload_12_unauthenticated_access.attackDescription"
  },
  "LM-01": {
    "name": "batch4.diagnostics.lm_01.name"
  },
  "LM-02": {
    "name": "batch4.diagnostics.lm_02.name"
  },
  "LM-03": {
    "name": "batch4.diagnostics.lm_03.name"
  },
  "LM-04": {
    "name": "batch4.diagnostics.lm_04.name"
  },
  "LM-05": {
    "name": "batch4.diagnostics.lm_05.name"
  },
  "LM-06": {
    "name": "batch4.diagnostics.lm_06.name"
  },
  "LM-07": {
    "name": "batch4.diagnostics.lm_07.name"
  },
  "LM-08": {
    "name": "batch4.diagnostics.lm_08.name"
  },
  "LM-09": {
    "name": "batch4.diagnostics.lm_09.name"
  },
  "LM-10": {
    "name": "batch4.diagnostics.lm_10.name"
  },
  "LM-11": {
    "name": "batch4.diagnostics.lm_11.name"
  },
  "LM-12": {
    "name": "batch4.diagnostics.lm_12.name"
  },
  "LM-13": {
    "name": "batch4.diagnostics.lm_13.name"
  },
  "LM-14": {
    "name": "batch4.diagnostics.lm_14.name"
  },
  "LM-15": {
    "name": "batch4.diagnostics.lm_15.name"
  },
  "LM-16": {
    "name": "batch4.diagnostics.lm_16.name"
  },
  "LM-17": {
    "name": "batch4.diagnostics.lm_17.name"
  },
  "LM-18": {
    "name": "batch4.diagnostics.lm_18.name"
  },
  "LM-19": {
    "name": "batch4.diagnostics.lm_19.name"
  },
  "LM-20": {
    "name": "batch4.diagnostics.lm_20.name"
  },
  "LM-21": {
    "name": "batch4.diagnostics.lm_21.name"
  },
  "LM-22": {
    "name": "batch4.diagnostics.lm_22.name"
  },
  "LM-23": {
    "name": "batch4.diagnostics.lm_23.name"
  },
  "LM-24": {
    "name": "batch4.diagnostics.lm_24.name"
  },
  "LM-25": {
    "name": "batch4.diagnostics.lm_25.name"
  },
  "LM-26": {
    "name": "batch4.diagnostics.lm_26.name"
  },
  "LM-27": {
    "name": "batch4.diagnostics.lm_27.name"
  },
  "LM-28": {
    "name": "batch4.diagnostics.lm_28.name"
  },
  "LM-29": {
    "name": "batch4.diagnostics.lm_29.name"
  },
  "LM-30": {
    "name": "batch4.diagnostics.lm_30.name"
  },
  "LM-31": {
    "name": "batch4.diagnostics.lm_31.name"
  },
  "LM-32": {
    "name": "batch4.diagnostics.lm_32.name"
  },
  "LM-33": {
    "name": "batch4.diagnostics.lm_33.name"
  },
  "LM-34": {
    "name": "batch4.diagnostics.lm_34.name"
  },
  "LM-35": {
    "name": "batch4.diagnostics.lm_35.name"
  },
  "LM-36": {
    "name": "batch4.diagnostics.lm_36.name"
  },
  "LM-37": {
    "name": "batch4.diagnostics.lm_37.name"
  },
  "LM-38": {
    "name": "batch4.diagnostics.lm_38.name"
  },
  "LM-39": {
    "name": "batch4.diagnostics.lm_39.name"
  },
  "LM-40": {
    "name": "batch4.diagnostics.lm_40.name"
  },
  "LM-41": {
    "name": "batch4.diagnostics.lm_41.name"
  },
  "LM-42": {
    "name": "batch4.diagnostics.lm_42.name"
  },
  "LM-43": {
    "name": "batch4.diagnostics.lm_43.name"
  },
  "LM-44": {
    "name": "batch4.diagnostics.lm_44.name"
  },
  "LM-45": {
    "name": "batch4.diagnostics.lm_45.name"
  },
  "LM-46": {
    "name": "batch4.diagnostics.lm_46.name"
  },
  "LM-47": {
    "name": "batch4.diagnostics.lm_47.name"
  },
  "LM-48": {
    "name": "batch4.diagnostics.lm_48.name"
  },
  "LM-49": {
    "name": "batch4.diagnostics.lm_49.name"
  },
  "LM-50": {
    "name": "batch4.diagnostics.lm_50.name"
  },
  "TC-GSHT-01": {
    "name": "batch4.diagnostics.tc_gsht_01.name"
  },
  "TC-GSHT-02": {
    "name": "batch4.diagnostics.tc_gsht_02.name"
  },
  "TC-GSHT-03": {
    "name": "batch4.diagnostics.tc_gsht_03.name"
  },
  "TC-GSHT-04": {
    "name": "batch4.diagnostics.tc_gsht_04.name"
  },
  "TC-GSHT-05": {
    "name": "batch4.diagnostics.tc_gsht_05.name"
  },
  "TC-GSHT-06": {
    "name": "batch4.diagnostics.tc_gsht_06.name"
  },
  "TC-GSHT-07": {
    "name": "batch4.diagnostics.tc_gsht_07.name"
  },
  "TC-GSHT-08": {
    "name": "batch4.diagnostics.tc_gsht_08.name"
  },
  "TC-GSHT-09": {
    "name": "batch4.diagnostics.tc_gsht_09.name"
  },
  "TC-GSHT-10": {
    "name": "batch4.diagnostics.tc_gsht_10.name"
  },
  "TC-GSHT-11": {
    "name": "batch4.diagnostics.tc_gsht_11.name"
  },
  "TC-GSHT-12": {
    "name": "batch4.diagnostics.tc_gsht_12.name"
  },
  "TC-GSHT-13": {
    "name": "batch4.diagnostics.tc_gsht_13.name"
  },
  "TC-GSHT-14": {
    "name": "batch4.diagnostics.tc_gsht_14.name"
  }
,

  "PR-01": {
    "titleAr": "batch4.diagnostics.pr_01.titleAr"
  },
  "PR-02": {
    "titleAr": "batch4.diagnostics.pr_02.titleAr"
  },
  "PR-03": {
    "titleAr": "batch4.diagnostics.pr_03.titleAr"
  },
  "PR-04": {
    "titleAr": "batch4.diagnostics.pr_04.titleAr"
  },
  "PR-05": {
    "titleAr": "batch4.diagnostics.pr_05.titleAr"
  },
  "PR-06": {
    "titleAr": "batch4.diagnostics.pr_06.titleAr"
  },
  "PR-07": {
    "titleAr": "batch4.diagnostics.pr_07.titleAr"
  },
  "PR-08": {
    "titleAr": "batch4.diagnostics.pr_08.titleAr"
  },
  "PR-09": {
    "titleAr": "batch4.diagnostics.pr_09.titleAr"
  },
  "PR-10": {
    "titleAr": "batch4.diagnostics.pr_10.titleAr"
  },
  "PR-11": {
    "titleAr": "batch4.diagnostics.pr_11.titleAr"
  },
  "PR-12": {
    "titleAr": "batch4.diagnostics.pr_12.titleAr"
  },
  "PR-13": {
    "titleAr": "batch4.diagnostics.pr_13.titleAr"
  },
  "PR-14": {
    "titleAr": "batch4.diagnostics.pr_14.titleAr"
  },
  "PR-15": {
    "titleAr": "batch4.diagnostics.pr_15.titleAr"
  },
  "PR-16": {
    "titleAr": "batch4.diagnostics.pr_16.titleAr"
  },
  "PR-17": {
    "titleAr": "batch4.diagnostics.pr_17.titleAr"
  },
  "PR-18": {
    "titleAr": "batch4.diagnostics.pr_18.titleAr"
  },
  "PR-19": {
    "titleAr": "batch4.diagnostics.pr_19.titleAr"
  },
  "PR-20": {
    "titleAr": "batch4.diagnostics.pr_20.titleAr"
  },
  "PR-21": {
    "titleAr": "batch4.diagnostics.pr_21.titleAr"
  },
  "PR-22": {
    "titleAr": "batch4.diagnostics.pr_22.titleAr"
  },
  "PR-23": {
    "titleAr": "batch4.diagnostics.pr_23.titleAr"
  },
  "PR-24": {
    "titleAr": "batch4.diagnostics.pr_24.titleAr"
  },
  "PR-25": {
    "titleAr": "batch4.diagnostics.pr_25.titleAr"
  },
  "PR-26": {
    "titleAr": "batch4.diagnostics.pr_26.titleAr"
  },
  "PR-27": {
    "titleAr": "batch4.diagnostics.pr_27.titleAr"
  },
  "PR-28": {
    "titleAr": "batch4.diagnostics.pr_28.titleAr"
  },
  "PR-29": {
    "titleAr": "batch4.diagnostics.pr_29.titleAr"
  },
  "PR-30": {
    "titleAr": "batch4.diagnostics.pr_30.titleAr"
  },
  "PR-31": {
    "titleAr": "batch4.diagnostics.pr_31.titleAr"
  },
  "PR-32": {
    "titleAr": "batch4.diagnostics.pr_32.titleAr"
  },
  "PR-33": {
    "titleAr": "batch4.diagnostics.pr_33.titleAr"
  },
  "PR-34": {
    "titleAr": "batch4.diagnostics.pr_34.titleAr"
  },
  "PR-35": {
    "titleAr": "batch4.diagnostics.pr_35.titleAr"
  },
  "PR-36": {
    "titleAr": "batch4.diagnostics.pr_36.titleAr"
  },
  "PR-37": {
    "titleAr": "batch4.diagnostics.pr_37.titleAr"
  },
  "PR-38": {
    "titleAr": "batch4.diagnostics.pr_38.titleAr"
  },
  "PR-39": {
    "titleAr": "batch4.diagnostics.pr_39.titleAr"
  },
  "PR-40": {
    "titleAr": "batch4.diagnostics.pr_40.titleAr"
  },
  "PR-41": {
    "titleAr": "batch4.diagnostics.pr_41.titleAr"
  },
  "PR-42": {
    "titleAr": "batch4.diagnostics.pr_42.titleAr"
  },
  "PR-43": {
    "titleAr": "batch4.diagnostics.pr_43.titleAr"
  },
  "PR-44": {
    "titleAr": "batch4.diagnostics.pr_44.titleAr"
  },
  "PR-45": {
    "titleAr": "batch4.diagnostics.pr_45.titleAr"
  },
  "PR-46": {
    "titleAr": "batch4.diagnostics.pr_46.titleAr"
  }

};
export function batch4DiagnosticText(t: OperationalTranslator, id: string, field: string, fallback: string): string {
  const fields = ownEntry(diagnosticKeys, id);
  const key = fields ? ownEntry(fields, field) : undefined;
  return key ? t(key, { logId: '{logId}' }) : fallback;
}

const architectureKeys: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "projects": {
    "nameAr": "other.labels.projects_2",
    "descriptionAr": "other.labels.txt_2d6b3b",
    "rule:0": "projects.batch4.zatca_fifteen_digits",
    "rule:1": "batch4.architecture.project_status_rule",
    "rule:2": "batch4.architecture.project_id_rule"
  },
  "carriers": {
    "nameAr": "other.labels.carriers_2",
    "descriptionAr": "other.labels.txt_6be985",
    "rule:0": "batch4.architecture.carrier_cr_rule",
    "rule:1": "batch4.architecture.carrier_tga_rule",
    "rule:2": "batch4.architecture.carrier_phone_rule"
  },
  "pricingRules": {
    "nameAr": "offline.labels.pricing",
    "descriptionAr": "other.labels.txt_792227",
    "rule:0": "batch4.architecture.pricing_model_rule",
    "rule:1": "batch4.architecture.pricing_rate_rule",
    "rule:2": "batch4.architecture.pricing_demurrage_rule"
  },
  "materials": {
    "nameAr": "projects.labels.materials",
    "descriptionAr": "other.labels.materials_4",
    "rule:0": "batch4.architecture.material_code_rule",
    "rule:1": "batch4.architecture.material_unit_rule",
    "rule:2": "batch4.architecture.material_name_rule"
  },
  "trucks": {
    "nameAr": "entityResolution.labels.trucks",
    "descriptionAr": "batch4.architecture.trucks_description",
    "rule:0": "batch4.service.tare_positive",
    "rule:1": "batch4.architecture.truck_gross_rule",
    "rule:2": "batch4.architecture.truck_payload_rule",
    "rule:3": "batch4.architecture.truck_absolute_limit"
  },
  "drivers": {
    "nameAr": "other.labels.drivers_2",
    "descriptionAr": "other.labels.drivers_4",
    "rule:0": "batch4.architecture.driver_id_rule",
    "rule:1": "batch4.architecture.driver_phone_rule",
    "rule:2": "batch4.architecture.driver_name_rule"
  },
  "users": {
    "nameAr": "other.labels.txt_15a8ac",
    "descriptionAr": "other.labels.txt_aba485",
    "rule:0": "batch4.architecture.user_email_rule",
    "rule:1": "batch4.architecture.user_role_rule",
    "rule:2": "batch4.architecture.user_id_rule"
  },
  "trips": {
    "nameAr": "dashboard.labels.trips",
    "descriptionAr": "batch4.architecture.trips_description",
    "rule:0": "batch4.architecture.trip_snapshots_rule",
    "rule:1": "batch4.architecture.trip_state_rule",
    "rule:2": "batch4.architecture.trip_weight_rule",
    "rule:3": "batch4.architecture.trip_money_rule"
  },
  "tripEvents": {
    "nameAr": "other.labels.trip",
    "descriptionAr": "other.labels.txt_4a13ec",
    "rule:0": "batch4.architecture.event_actor_rule",
    "rule:1": "batch4.architecture.event_idempotency_rule",
    "rule:2": "batch4.architecture.event_status_rule"
  },
  "exceptions": {
    "nameAr": "other.labels.txt_1fe296",
    "descriptionAr": "other.labels.close",
    "rule:0": "batch4.architecture.exception_type_rule",
    "rule:1": "batch4.architecture.exception_severity_rule",
    "rule:2": "batch4.architecture.exception_resolution_rule"
  },
  "auditLogs": {
    "nameAr": "other.labels.txt_334bfc",
    "descriptionAr": "other.labels.user_2",
    "rule:0": "batch4.architecture.audit_immutable_rule",
    "rule:1": "batch4.architecture.audit_actor_rule",
    "rule:2": "batch4.architecture.audit_diff_rule"
  },
  "syncOperations": {
    "nameAr": "other.labels.txt_43b461",
    "descriptionAr": "other.labels.txt_2670a3",
    "rule:0": "batch4.architecture.sync_id_rule",
    "rule:1": "batch4.architecture.sync_uuid_rule",
    "rule:2": "batch4.architecture.sync_status_rule"
  },
  "importBatches": {
    "nameAr": "other.labels.import",
    "descriptionAr": "batch4.architecture.imports_description",
    "rule:0": "batch4.architecture.import_type_rule",
    "rule:1": "batch4.architecture.import_total_rule",
    "rule:2": "batch4.architecture.import_admin_rule"
  }
};
export function batch4ArchitectureText(t: OperationalTranslator, id: string, field: string, fallback: string): string {
  const fields = ownEntry(architectureKeys, id);
  const key = fields ? ownEntry(fields, field) : undefined;
  return key ? t(key) : fallback;
}

// Read-only system-tool metadata is localized at render time; exported contracts remain unchanged.
const relationKeys: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "Project": {
    "nameAr": "analytics.ui.project",
    "shortDescAr": "other.labels.projects_5",
    "roleInSystemAr": "batch4.relations.project.roleinsystemar",
    "relation:Carrier": "batch4.relations.project.relation_carrier",
    "relation:Material": "batch4.relations.project.relation_material",
    "relation:Pricing Rule": "batch4.relations.project.relation_pricing_rule",
    "relation:Trip": "batch4.relations.project.relation_trip",
    "relation:Audit Log": "batch4.relations.project.relation_audit_log",
    "rule:0": "batch4.relations.project.rule_0",
    "rule:1": "batch4.relations.project.rule_1"
  },
  "Carrier": {
    "nameAr": "batch4.relations.carrier.namear",
    "shortDescAr": "batch4.relations.carrier.shortdescar",
    "roleInSystemAr": "batch4.relations.carrier.roleinsystemar",
    "relation:Project": "batch4.relations.carrier.relation_project",
    "relation:Truck": "batch4.relations.carrier.relation_truck",
    "relation:Driver": "batch4.relations.carrier.relation_driver",
    "relation:Pricing Rule": "batch4.relations.carrier.relation_pricing_rule",
    "relation:Trip": "other.labels.trips_6",
    "rule:0": "batch4.relations.carrier.rule_0"
  },
  "Pricing Rule": {
    "nameAr": "field_operations.pricing_rule_label",
    "shortDescAr": "batch4.relations.pricing_rule.shortdescar",
    "roleInSystemAr": "batch4.relations.pricing_rule.roleinsystemar",
    "relation:Project": "batch4.relations.pricing_rule.relation_project",
    "relation:Material": "batch4.relations.pricing_rule.relation_material",
    "relation:Carrier": "batch4.relations.pricing_rule.relation_carrier",
    "relation:Trip": "batch4.relations.pricing_rule.relation_trip",
    "rule:0": "batch4.relations.pricing_rule.rule_0",
    "rule:1": "batch4.relations.pricing_rule.rule_1"
  },
  "Material": {
    "nameAr": "analytics.ui.material",
    "shortDescAr": "other.labels.material_9",
    "roleInSystemAr": "batch4.relations.material.roleinsystemar",
    "relation:Project": "batch4.relations.material.relation_project",
    "relation:Pricing Rule": "batch4.relations.material.relation_pricing_rule",
    "relation:Trip": "batch4.relations.material.relation_trip",
    "rule:0": "batch4.relations.material.rule_0"
  },
  "Truck": {
    "nameAr": "other.labels.truck_5",
    "shortDescAr": "batch4.relations.truck.shortdescar",
    "roleInSystemAr": "batch4.relations.truck.roleinsystemar",
    "relation:Carrier": "batch4.relations.truck.relation_carrier",
    "relation:Driver": "batch4.relations.truck.relation_driver",
    "relation:Trip": "batch4.relations.truck.relation_trip",
    "rule:0": "batch4.relations.truck.rule_0"
  },
  "Driver": {
    "nameAr": "analytics.ui.driver",
    "shortDescAr": "batch4.relations.driver.shortdescar",
    "roleInSystemAr": "batch4.relations.driver.roleinsystemar",
    "relation:Carrier": "batch4.relations.driver.relation_carrier",
    "relation:Truck": "batch4.relations.driver.relation_truck",
    "relation:Trip": "other.labels.trips_7",
    "rule:0": "batch4.relations.driver.rule_0"
  },
  "Trip": {
    "nameAr": "batch4.relations.trip.namear",
    "shortDescAr": "batch4.relations.trip.shortdescar",
    "roleInSystemAr": "batch4.relations.trip.roleinsystemar",
    "relation:Project": "batch4.relations.trip.relation_project",
    "relation:Carrier": "batch4.relations.trip.relation_carrier",
    "relation:Truck": "batch4.relations.trip.relation_truck",
    "relation:Driver": "batch4.relations.trip.relation_driver",
    "relation:Material": "batch4.relations.trip.relation_material",
    "relation:Trip Event": "batch4.relations.trip.relation_trip_event",
    "relation:Exception": "batch4.relations.trip.relation_exception",
    "relation:Audit Log": "batch4.relations.trip.relation_audit_log",
    "rule:0": "batch4.relations.trip.rule_0",
    "rule:1": "batch4.relations.trip.rule_1",
    "rule:2": "batch4.relations.trip.rule_2"
  },
  "Trip Event": {
    "nameAr": "batch4.relations.trip_event.namear",
    "shortDescAr": "batch4.relations.trip_event.shortdescar",
    "roleInSystemAr": "batch4.relations.trip_event.roleinsystemar",
    "relation:Trip": "batch4.relations.trip_event.relation_trip",
    "relation:Sync Operation": "batch4.relations.trip_event.relation_sync_operation",
    "rule:0": "batch4.relations.trip_event.rule_0"
  },
  "Exception": {
    "nameAr": "batch4.relations.exception.namear",
    "shortDescAr": "batch4.relations.exception.shortdescar",
    "roleInSystemAr": "batch4.relations.exception.roleinsystemar",
    "relation:Trip": "batch4.relations.exception.relation_trip",
    "relation:Audit Log": "batch4.relations.exception.relation_audit_log",
    "rule:0": "batch4.relations.exception.rule_0"
  },
  "Audit Log": {
    "nameAr": "other.labels.txt_334bfc",
    "shortDescAr": "batch4.relations.audit_log.shortdescar",
    "roleInSystemAr": "batch4.relations.audit_log.roleinsystemar",
    "relation:Project": "batch4.relations.audit_log.relation_project",
    "relation:Trip": "batch4.relations.audit_log.relation_trip",
    "rule:0": "batch4.relations.audit_log.rule_0"
  },
  "Sync Operation": {
    "nameAr": "batch4.relations.sync_operation.namear",
    "shortDescAr": "batch4.relations.sync_operation.shortdescar",
    "roleInSystemAr": "batch4.relations.sync_operation.roleinsystemar",
    "relation:Trip Event": "batch4.relations.sync_operation.relation_trip_event",
    "relation:Project": "batch4.relations.sync_operation.relation_project",
    "rule:0": "batch4.relations.sync_operation.rule_0",
    "rule:1": "batch4.relations.sync_operation.rule_1"
  },
  "principle_1": {
    "title": "batch4.relations.principle_1.title",
    "desc": "batch4.relations.principle_1.desc"
  },
  "principle_2": {
    "title": "batch4.relations.principle_2.title",
    "desc": "batch4.relations.principle_2.desc"
  },
  "principle_3": {
    "title": "batch4.relations.principle_3.title",
    "desc": "batch4.relations.principle_3.desc"
  },
  "principle_4": {
    "title": "batch4.relations.principle_4.title",
    "desc": "batch4.relations.principle_4.desc"
  },
  "principle_5": {
    "title": "batch4.relations.principle_5.title",
    "desc": "other.labels.refresh_2"
  },
  "principle_6": {
    "title": "batch4.relations.principle_6.title",
    "desc": "batch4.relations.principle_6.desc"
  },
  "principle_7": {
    "title": "batch4.relations.principle_7.title",
    "desc": "batch4.relations.principle_7.desc"
  },
  "principle_8": {
    "title": "batch4.relations.principle_8.title",
    "desc": "batch4.relations.principle_8.desc"
  },
  "principle_9": {
    "title": "batch4.relations.principle_9.title",
    "desc": "batch4.relations.principle_9.desc"
  },
  "principle_10": {
    "title": "batch4.relations.principle_10.title",
    "desc": "batch4.relations.principle_10.desc"
  },
  "principle_11": {
    "title": "batch4.relations.principle_11.title",
    "desc": "batch4.relations.principle_11.desc"
  },
  "principle_12": {
    "title": "batch4.relations.principle_12.title",
    "desc": "batch4.relations.principle_12.desc"
  }
};
export function batch4RelationText(t: OperationalTranslator, id: string, field: string, fallback: string): string {
  const fields = ownEntry(relationKeys, id);
  const key = fields ? ownEntry(fields, field) : undefined;
  return key ? t(key) : fallback;
}

// These are viewer titles and summaries. Authoritative reference-document contents stay verbatim.
const referenceKeys: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "architecture": {
    "titleAr": "batch4.reference.architecture.titleAr",
    "summaryAr": "batch4.reference.architecture.summaryAr"
  },
  "data-model": {
    "titleAr": "batch4.reference.data_model.titleAr",
    "summaryAr": "batch4.reference.data_model.summaryAr"
  },
  "api-contract": {
    "titleAr": "batch4.reference.api_contract.titleAr",
    "summaryAr": "batch4.reference.api_contract.summaryAr"
  },
  "security-model": {
    "titleAr": "batch4.reference.security_model.titleAr",
    "summaryAr": "batch4.reference.security_model.summaryAr"
  },
  "offline-model": {
    "titleAr": "batch4.reference.offline_model.titleAr",
    "summaryAr": "batch4.reference.offline_model.summaryAr"
  },
  "pricing-model": {
    "titleAr": "batch4.reference.pricing_model.titleAr",
    "summaryAr": "batch4.reference.pricing_model.summaryAr"
  },
  "data-quality-model": {
    "titleAr": "batch4.reference.data_quality_model.titleAr",
    "summaryAr": "batch4.reference.data_quality_model.summaryAr"
  }
};
export function batch4ReferenceText(t: OperationalTranslator, id: string, field: string, fallback: string): string {
  const fields = ownEntry(referenceKeys, id);
  const key = fields ? ownEntry(fields, field) : undefined;
  return key ? t(key) : fallback;
}
const conflictFieldKeys: Readonly<Record<string, string>> = {
  'اسم السائق': 'entityResolution.labels.driver_name',
  'رقم الهوية/الإقامة': 'entityResolution.labels.residency_identifier',
  'رقم الجوال': 'entityResolution.labels.phone_number',
  'رقم اللوحة': 'analytics.column.plate_number',
  'نوع الشاحنة': 'batch4.presentation.field_truckType',
  'الوزن الفارغ': 'field_operations.tare_weight_ticket',
  'الوزن الأقصى': 'batch4.presentation.field_maxGrossWeightKg',
};
export function batch4ConflictFieldLabel(t: OperationalTranslator, field: string): string {
  const key = ownEntry(conflictFieldKeys, field);
  return key ? t(key) : field;
}

// Only this synthetic status caption is localized; actual business values remain verbatim.
export function batch4ConflictValueLabel(t: OperationalTranslator, field: string, value: unknown): string {
  return field === 'materialId' && value === 'موقوفة (DEACTIVATED)'
    ? t("residual.messages.suspended_deactivated")
    : String(value);
}
