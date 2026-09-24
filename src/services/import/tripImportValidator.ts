/**
 * Excel & CSV Trip Import Validator
 * BLOCK 31: Validates imported rows against domain constraints
 * Strictly implements IImportValidator from BLOCK 30
 * 
 * Rules:
 * - Blocking errors:
 *   * Missing mandatory identification (neither ticketId nor truckNo)
 *   * Invalid numeric value (negative or NaN)
 *   * Invariant: gross < tare (physically impossible)
 *   * Invalid unparseable date
 *   * Invalid source structure
 * - Warnings (Non-blocking):
 *   * Missing driver (optional)
 *   * Missing unload data (destNetWeight) -> weighbridge compatible!
 *   * Unknown carrier / truck / material
 * - Do NOT turn every warning into an error!
 */

import { IImportValidator } from './contracts';
import { ImportRow, ImportIssue, PipelineContext } from '../../types/unifiedImport';
import { CanonicalTripRow } from '../../types/excelCsvImport';
import { normalizeName, normalizePlate } from '../../utils/normalization';

/**
 * Tolerance for net weight calculation discrepancy (kg).
 * Accounts for standard decimal precision and floating-point representations.
 */
export const NET_WEIGHT_CALCULATION_TOLERANCE_KG = 0.05;

/**
 * Resolves an incoming carrier identifier/name to a canonical carrier object.
 */
function findCanonicalCarrier(rawCarrier: string, knownEntities?: PipelineContext['knownEntities']) {
  if (!rawCarrier || !knownEntities) return undefined;
  const clean = String(rawCarrier).trim();
  if (!clean) return undefined;
  const norm = normalizeName(clean);

  // 1. Match structured carriers by ID, normalized Name, or Alias
  if (knownEntities.carriers && knownEntities.carriers.length > 0) {
    const found = knownEntities.carriers.find(
      (c) =>
        c.carrierId.toLowerCase() === clean.toLowerCase() ||
        normalizeName(c.name) === norm ||
        c.aliases?.some((a) => normalizeName(a) === norm)
    );
    if (found) return found;
  }

  // 2. Legacy primitive carrierIds array match
  if (knownEntities.carrierIds && knownEntities.carrierIds.length > 0) {
    const idMatch = knownEntities.carrierIds.find((id) => id.toLowerCase() === clean.toLowerCase());
    if (idMatch) return { carrierId: idMatch, name: idMatch };
  }

  return undefined;
}

/**
 * Resolves an incoming material identifier/code/name to a canonical material object.
 */
function findCanonicalMaterial(rawMaterial: string, knownEntities?: PipelineContext['knownEntities']) {
  if (!rawMaterial || !knownEntities) return undefined;
  const clean = String(rawMaterial).trim();
  if (!clean) return undefined;
  const norm = normalizeName(clean);

  // 1. Match structured materials by materialId, normalized name, or code
  if (knownEntities.materials && knownEntities.materials.length > 0) {
    const found = knownEntities.materials.find(
      (m) =>
        m.materialId.toLowerCase() === clean.toLowerCase() ||
        normalizeName(m.name) === norm ||
        (m.code && m.code.toLowerCase() === clean.toLowerCase()) ||
        (m.code && normalizeName(m.code) === norm)
    );
    if (found) return found;
  }

  // 2. Legacy primitive materialCodes array match
  if (knownEntities.materialCodes && knownEntities.materialCodes.length > 0) {
    const codeMatch = knownEntities.materialCodes.find((c) => c.toLowerCase() === clean.toLowerCase());
    if (codeMatch) return { materialId: codeMatch, name: codeMatch, code: codeMatch };
  }

  return undefined;
}

/**
 * Resolves an incoming driver identifier/name to a canonical driver object.
 */
function findCanonicalDriver(rawDriver: string, knownEntities?: PipelineContext['knownEntities']) {
  if (!rawDriver || !knownEntities) return undefined;
  const clean = String(rawDriver).trim();
  if (!clean) return undefined;
  const norm = normalizeName(clean);

  // 1. Match structured drivers by driverId, idNumber, or normalized name
  if (knownEntities.drivers && knownEntities.drivers.length > 0) {
    const found = knownEntities.drivers.find(
      (d) =>
        d.driverId.toLowerCase() === clean.toLowerCase() ||
        (d.idNumber && d.idNumber === clean) ||
        normalizeName(d.name) === norm
    );
    if (found) return found;
  }

  // 2. Legacy primitive driverIds array match
  if (knownEntities.driverIds && knownEntities.driverIds.length > 0) {
    const idMatch = knownEntities.driverIds.find((id) => id.toLowerCase() === clean.toLowerCase());
    if (idMatch) return { driverId: idMatch, name: idMatch };
  }

  return undefined;
}

export class ExcelCsvTripValidator implements IImportValidator<CanonicalTripRow> {
  public validateRow(row: ImportRow<any, CanonicalTripRow>, context: PipelineContext): ImportIssue[] {
    const issues: ImportIssue[] = [];
    const canonical: Partial<CanonicalTripRow> = (row.mapped as any) || (row.canonical as any) || {};

    const rowNum = row.rowNumber;

    // 1. Weighbridge Profile vs Standard Intake Checks
    const isWeighbridge =
      context.profile === 'WEIGHBRIDGE' ||
      canonical.isWeighbridgeOnly ||
      (canonical.sourceType as string) === 'WEIGHBRIDGE';

    if (isWeighbridge) {
      // Weighbridge Input Profile Mandatory Fields
      if (!canonical.ticketId || String(canonical.ticketId).trim() === '') {
        issues.push({
          issueId: `ERR-WB-TICKET-${rowNum}`,
          row: rowNum,
          field: 'ticketId',
          code: 'MISSING_TICKET_ID',
          severity: 'BLOCKING',
          message: 'Ticket ID is required for weighbridge intake.',
          messageAr: 'رقم تذكرة الميزان إلزامي لاعتماد بيانات الميزان.',
          resolvable: true,
          blocking: true,
        });
      }

      if (!canonical.truckNo || String(canonical.truckNo).trim() === '') {
        issues.push({
          issueId: `ERR-WB-TRUCK-${rowNum}`,
          row: rowNum,
          field: 'truckNo',
          code: 'MISSING_TRUCK_NO',
          severity: 'BLOCKING',
          message: 'Truck number / plate is required for weighbridge intake.',
          messageAr: 'رقم لوحة / تعريف الشاحنة إلزامي لاعتماد بيانات الميزان.',
          resolvable: true,
          blocking: true,
        });
      }

      if (!canonical.shiftDate || String(canonical.shiftDate).trim() === '') {
        issues.push({
          issueId: `ERR-WB-DATE-${rowNum}`,
          row: rowNum,
          field: 'shiftDate',
          code: 'MISSING_DATE',
          severity: 'BLOCKING',
          message: 'Shift date is required for weighbridge intake.',
          messageAr: 'تاريخ عملية الوزن إلزامي لاعتماد بيانات الميزان.',
          resolvable: true,
          blocking: true,
        });
      }

      if (canonical.tareWeight === undefined || canonical.tareWeight === null) {
        issues.push({
          issueId: `ERR-WB-TARE-${rowNum}`,
          row: rowNum,
          field: 'tareWeight',
          code: 'MISSING_TARE_WEIGHT',
          severity: 'BLOCKING',
          message: 'Tare weight is required for weighbridge intake.',
          messageAr: 'وزن الفارغ إلزامي لاعتماد بيانات الميزان.',
          resolvable: true,
          blocking: true,
        });
      }

      if (canonical.grossWeight === undefined || canonical.grossWeight === null) {
        issues.push({
          issueId: `ERR-WB-GROSS-${rowNum}`,
          row: rowNum,
          field: 'grossWeight',
          code: 'MISSING_GROSS_WEIGHT',
          severity: 'BLOCKING',
          message: 'Gross weight is required for weighbridge intake.',
          messageAr: 'وزن القائم إلزامي لاعتماد بيانات الميزان.',
          resolvable: true,
          blocking: true,
        });
      }
    } else {
      // Standard Identification Check (BLOCKING)
      const hasTicket = canonical.ticketId && String(canonical.ticketId).trim() !== '';
      const hasTruck = canonical.truckNo && String(canonical.truckNo).trim() !== '';

      if (!hasTicket && !hasTruck) {
        issues.push({
          issueId: `ERR-ID-${rowNum}`,
          row: rowNum,
          field: 'identification',
          code: 'MISSING_IDENTIFICATION',
          severity: 'BLOCKING',
          message: 'Missing both Ticket ID and Truck Plate. At least one required.',
          messageAr: 'بيانات التعريف مفقودة: يجب توفر رقم التذكرة أو رقم اللوحة على الأقل.',
          resolvable: true,
          blocking: true,
        });
      }
    }

    // 2. Numeric Weights Validation (BLOCKING if negative, unparseable, or gross < tare)
    const tare = canonical.tareWeight;
    const gross = canonical.grossWeight;
    const net = canonical.netWeight;

    if (tare !== undefined && tare !== null) {
      if (typeof tare !== 'number' || isNaN(tare)) {
        issues.push({
          issueId: `ERR-TARE-NAN-${rowNum}`,
          row: rowNum,
          field: 'tareWeight',
          code: 'INVALID_NUMERIC_TARE',
          severity: 'BLOCKING',
          message: 'Tare weight is not a valid number',
          messageAr: 'الوزن الفارغ غير صالح (قيمة رقمية غير صحيحة)',
          resolvable: true,
          blocking: true,
          originalValue: tare,
        });
      } else if (tare <= 0) {
        issues.push({
          issueId: `ERR-TARE-NONPOS-${rowNum}`,
          row: rowNum,
          field: 'tareWeight',
          code: 'TARE_WEIGHT_NON_POSITIVE',
          severity: 'BLOCKING',
          message: 'Tare weight must be strictly positive',
          messageAr: 'الوزن الفارغ يجب أن يكون أكبر من الصفر',
          resolvable: true,
          blocking: true,
          originalValue: tare,
        });
      }
    }

    if (gross !== undefined && gross !== null) {
      if (typeof gross !== 'number' || isNaN(gross)) {
        issues.push({
          issueId: `ERR-GROSS-NAN-${rowNum}`,
          row: rowNum,
          field: 'grossWeight',
          code: 'INVALID_NUMERIC_GROSS',
          severity: 'BLOCKING',
          message: 'Gross weight is not a valid number',
          messageAr: 'الوزن الإجمالي/القائم غير صالح (قيمة رقمية غير صحيحة)',
          resolvable: true,
          blocking: true,
          originalValue: gross,
        });
      } else if (gross <= 0) {
        issues.push({
          issueId: `ERR-GROSS-NONPOS-${rowNum}`,
          row: rowNum,
          field: 'grossWeight',
          code: 'GROSS_WEIGHT_NON_POSITIVE',
          severity: 'BLOCKING',
          message: 'Gross weight must be strictly positive',
          messageAr: 'الوزن الإجمالي لا يمكن أن يكون سالباً أو صفراً',
          resolvable: true,
          blocking: true,
          originalValue: gross,
        });
      }
    }

    if (net !== undefined && net !== null) {
      if (typeof net !== 'number' || isNaN(net)) {
        issues.push({
          issueId: `ERR-NET-NAN-${rowNum}`,
          row: rowNum,
          field: 'netWeight',
          code: 'INVALID_NUMERIC_NET',
          severity: 'BLOCKING',
          message: 'Net weight is not a valid number',
          messageAr: 'الوزن الصافي غير صالح (قيمة رقمية غير صحيحة)',
          resolvable: true,
          blocking: true,
          originalValue: net,
        });
      } else if (net < 0) {
        issues.push({
          issueId: `ERR-NET-NEG-${rowNum}`,
          row: rowNum,
          field: 'netWeight',
          code: 'NEGATIVE_WEIGHT',
          severity: 'BLOCKING',
          message: 'Net weight cannot be negative',
          messageAr: 'الوزن الصافي لا يمكن أن يكون سالباً',
          resolvable: true,
          blocking: true,
          originalValue: net,
        });
      }
    }

    // Physical Invariant Check: gross >= tare
    if (
      typeof gross === 'number' &&
      typeof tare === 'number' &&
      !isNaN(gross) &&
      !isNaN(tare) &&
      gross > 0 &&
      tare > 0
    ) {
      if (gross < tare) {
        issues.push({
          issueId: `ERR-PHYSICS-${rowNum}`,
          row: rowNum,
          field: 'grossWeight',
          code: 'GROSS_LESS_THAN_TARE',
          severity: 'BLOCKING',
          message: `Physical invariant violated: Gross weight (${gross}) is less than Tare weight (${tare})`,
          messageAr: `مخالفة فيزيائية حتمية للميزان: الوزن القائم (${gross} كجم) أقل من الوزن الفارغ (${tare} كجم).`,
          resolvable: true,
          blocking: true,
          originalValue: { gross, tare },
        });
      }
    }

    // Check Net Weight Calculation Consistency: net vs (gross - tare)
    // Non-blocking WARNING if gross, tare, and net are all present, valid numbers, gross >= tare, but net differs beyond tolerance
    if (
      typeof gross === 'number' &&
      typeof tare === 'number' &&
      typeof net === 'number' &&
      !isNaN(gross) &&
      !isNaN(tare) &&
      !isNaN(net) &&
      gross >= tare
    ) {
      const calculatedNet = Math.round((gross - tare) * 100) / 100;
      const actualNet = Math.round(net * 100) / 100;
      const difference = Math.round(Math.abs(actualNet - calculatedNet) * 100) / 100;

      if (difference > NET_WEIGHT_CALCULATION_TOLERANCE_KG) {
        issues.push({
          issueId: `WRN-NET-MISMATCH-${rowNum}`,
          row: rowNum,
          field: 'netWeight',
          code: 'NET_WEIGHT_CALCULATION_MISMATCH',
          severity: 'WARNING',
          blocking: false,
          resolvable: true,
          actualNetWeight: net,
          calculatedNetWeight: calculatedNet,
          difference,
          message: `Imported net weight (${net} kg) does not match calculated weight (gross ${gross} - tare ${tare} = ${calculatedNet} kg). Difference: ${difference} kg.`,
          messageAr: `الوزن الصافي المسجل في التذكرة (${net} كجم) يختلف عن الصافي المحسوب (القائم ${gross} - الفارغ ${tare} = ${calculatedNet} كجم) بفارق ${difference} كجم.`,
          originalValue: {
            actualNetWeight: net,
            calculatedNetWeight: calculatedNet,
            difference,
          },
        });
      }
    }

    // 3. Date Validation (BLOCKING if invalid unparseable format)
    if (canonical.shiftDate) {
      const dateStr = String(canonical.shiftDate).trim();
      const isIso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
      if (!isIso) {
        issues.push({
          issueId: `ERR-DATE-${rowNum}`,
          row: rowNum,
          field: 'shiftDate',
          code: 'INVALID_DATE_FORMAT',
          severity: 'BLOCKING',
          message: `Invalid date format (${dateStr}). Expected YYYY-MM-DD.`,
          messageAr: `صيغة التاريخ غير صالحة (${dateStr}). يجب أن تكون YYYY-MM-DD.`,
          resolvable: true,
          blocking: true,
          originalValue: dateStr,
        });
      }
    }

    // 4. Missing Driver Warning (WARNING - NON-BLOCKING)
    if (!canonical.driverName && !canonical.driverId) {
      issues.push({
        issueId: `WRN-DRIVER-${rowNum}`,
        row: rowNum,
        field: 'driverName',
        code: 'MISSING_OPTIONAL_DRIVER',
        severity: 'WARNING',
        message: 'Driver name is missing. Trip can proceed without assigned driver.',
        messageAr: 'اسم السائق غير مدخل. يمكن قبول الشحنة بدون سائق محدد كتحذير.',
        resolvable: true,
        blocking: false,
      });
    }

    // 5. Missing Unloading Data Warning (WARNING - NON-BLOCKING - WEIGHBRIDGE COMPATIBLE)
    const hasUnloadNet = canonical.destNetWeight !== undefined && canonical.destNetWeight !== null;
    if (!hasUnloadNet) {
      issues.push({
        issueId: `WRN-UNLOAD-${rowNum}`,
        row: rowNum,
        field: 'destNetWeight',
        code: 'MISSING_UNLOAD_DATA',
        severity: 'WARNING',
        message: 'Unload net weight missing. Row accepted as weighbridge origin loading dispatch.',
        messageAr: 'بيانات وزن الوصول/التفريغ غير متوفرة. تم قبول الصف كشحنة محملة من الميزان.',
        resolvable: true,
        blocking: false,
      });
    }

    // 6. Unknown Entity Warnings (WARNING - NON-BLOCKING)
    if (canonical.carrier && (context.knownEntities?.carrierIds?.length || context.knownEntities?.carriers?.length)) {
      const carrierStr = String(canonical.carrier).trim();
      const canonicalCarrier = findCanonicalCarrier(carrierStr, context.knownEntities);
      if (!canonicalCarrier) {
        issues.push({
          issueId: `WRN-CARRIER-UNK-${rowNum}`,
          row: rowNum,
          field: 'carrier',
          code: 'UNKNOWN_CARRIER',
          severity: 'WARNING',
          message: `Carrier (${carrierStr}) not found in master records.`,
          messageAr: `الناقل (${carrierStr}) غير مسجل في السجلات المعتمدة للمشروع.`,
          resolvable: true,
          blocking: false,
          originalValue: carrierStr,
        });
      }
    }

    if (canonical.truckNo && (context.knownEntities?.truckPlates?.length || context.knownEntities?.trucks?.length)) {
      const truckStr = String(canonical.truckNo).trim();
      const normTruck = normalizePlate(truckStr);
      const match =
        (context.knownEntities?.truckPlates && context.knownEntities.truckPlates.some((t) => normalizePlate(t) === normTruck || t.toLowerCase() === truckStr.toLowerCase())) ||
        (context.knownEntities?.trucks && context.knownEntities.trucks.some((t) => normalizePlate(t.plate) === normTruck || t.truckId.toLowerCase() === truckStr.toLowerCase()));
      if (!match) {
        issues.push({
          issueId: `WRN-TRUCK-UNK-${rowNum}`,
          row: rowNum,
          field: 'truckNo',
          code: 'UNKNOWN_TRUCK',
          severity: 'WARNING',
          message: `Truck plate (${truckStr}) not found in master records.`,
          messageAr: `الشاحنة / اللوحة (${truckStr}) غير مسجلة في السجلات المعتمدة للمشروع.`,
          resolvable: true,
          blocking: false,
          originalValue: truckStr,
        });
      }
    }

    if (canonical.materialType && (context.knownEntities?.materialCodes?.length || context.knownEntities?.materials?.length)) {
      const matStr = String(canonical.materialType).trim();
      const canonicalMat = findCanonicalMaterial(matStr, context.knownEntities);
      if (!canonicalMat) {
        issues.push({
          issueId: `WRN-MAT-UNK-${rowNum}`,
          row: rowNum,
          field: 'materialType',
          code: 'UNKNOWN_MATERIAL',
          severity: 'WARNING',
          message: `Material (${matStr}) not found in master records.`,
          messageAr: `المادة (${matStr}) غير مسجلة في قائمة المواد المعتمدة للمشروع.`,
          resolvable: true,
          blocking: false,
          originalValue: matStr,
        });
      }
    }

    // 7. BLOCK 34 & BLOCK 35: Truck-Carrier Association Integrity Check (WARNING - REQUIRES_REVIEW)
    if (canonical.truckNo && canonical.carrier && context.knownEntities?.truckCarrierMap) {
      const cleanTruck = String(canonical.truckNo).trim();
      const normTruck = normalizePlate(cleanTruck);
      // Match across map keys (by exact key or normalized plate)
      const mapKey = Object.keys(context.knownEntities.truckCarrierMap).find(
        (k) => k.toLowerCase() === cleanTruck.toLowerCase() || normalizePlate(k) === normTruck
      );
      if (mapKey) {
        const expectedCarrierId = context.knownEntities.truckCarrierMap[mapKey];
        const rowCarrierObj = findCanonicalCarrier(String(canonical.carrier), context.knownEntities);
        const resolvedRowCarrierId = rowCarrierObj ? rowCarrierObj.carrierId : String(canonical.carrier).trim();

        // Compare canonical carrier ID to canonical carrier ID
        if (expectedCarrierId && expectedCarrierId.toLowerCase() !== resolvedRowCarrierId.toLowerCase()) {
          const masterCarrierName = context.knownEntities?.carriers?.find((c) => c.carrierId === expectedCarrierId)?.name || expectedCarrierId;
          issues.push({
            issueId: `WRN-TRUCK-CARRIER-${rowNum}`,
            row: rowNum,
            field: 'carrier',
            code: 'RELATIONSHIP_CONFLICT',
            severity: 'WARNING',
            message: `Truck (${cleanTruck}) is assigned to carrier (${masterCarrierName}) in master records, but row lists carrier (${canonical.carrier}).`,
            messageAr: `تعارض في العلاقة: الشاحنة (${cleanTruck}) مرتبطة في السجلات بالناقل (${masterCarrierName}) بينما السجل الوارد ينسبها للناقل (${canonical.carrier}).`,
            resolvable: true,
            blocking: false,
            originalValue: {
              truckNo: cleanTruck,
              rowCarrier: canonical.carrier,
              masterCarrier: expectedCarrierId,
            },
          });
        }
      }
    }

    // 8. BLOCK 35: Truck Matched but Carrier Missing Check
    if (canonical.truckNo && (!canonical.carrier || String(canonical.carrier).trim() === '')) {
      const cleanTruck = String(canonical.truckNo).trim();
      const normTruck = normalizePlate(cleanTruck);
      const isKnownTruck =
        (context.knownEntities?.truckPlates && context.knownEntities.truckPlates.some((t) => normalizePlate(t) === normTruck || t.toLowerCase() === cleanTruck.toLowerCase())) ||
        (context.knownEntities?.truckCarrierMap && Object.keys(context.knownEntities.truckCarrierMap).some((k) => normalizePlate(k) === normTruck || k.toLowerCase() === cleanTruck.toLowerCase())) ||
        (context.knownEntities?.trucks && context.knownEntities.trucks.some((t) => normalizePlate(t.plate) === normTruck || t.truckId.toLowerCase() === cleanTruck.toLowerCase()));

      if (isKnownTruck) {
        issues.push({
          issueId: `WRN-TRUCK-NO-CARRIER-${rowNum}`,
          row: rowNum,
          field: 'carrier',
          code: 'TRUCK_MATCHED_CARRIER_UNKNOWN',
          severity: 'WARNING',
          message: `Truck (${cleanTruck}) recognized in master data, but carrier is missing from the row. Carrier must not be guessed automatically.`,
          messageAr: `تم التعرف على الشاحنة (${cleanTruck}) ولكن بيان الناقل مفقود من السجل الوارد. يمنع تخمين الناقل تلقائياً.`,
          resolvable: true,
          blocking: false,
          originalValue: cleanTruck,
        });
      }
    }

    // 9. BLOCK 35: Driver-Carrier Relationship Integrity Check
    if ((canonical.driverName || canonical.driverId) && canonical.carrier && context.knownEntities?.driverCarrierMap) {
      const cleanDriver = String(canonical.driverName || canonical.driverId).trim();
      const driverObj = findCanonicalDriver(cleanDriver, context.knownEntities);
      const driverKey = driverObj ? driverObj.driverId : cleanDriver;

      // Find driver in driverCarrierMap
      const mapKey = Object.keys(context.knownEntities.driverCarrierMap).find(
        (k) => k.toLowerCase() === driverKey.toLowerCase() || k.toLowerCase() === cleanDriver.toLowerCase()
      );
      if (mapKey) {
        const expectedCarrierId = context.knownEntities.driverCarrierMap[mapKey];
        const rowCarrierObj = findCanonicalCarrier(String(canonical.carrier), context.knownEntities);
        const resolvedRowCarrierId = rowCarrierObj ? rowCarrierObj.carrierId : String(canonical.carrier).trim();

        if (expectedCarrierId && expectedCarrierId.toLowerCase() !== resolvedRowCarrierId.toLowerCase()) {
          const masterCarrierName = context.knownEntities?.carriers?.find((c) => c.carrierId === expectedCarrierId)?.name || expectedCarrierId;
          issues.push({
            issueId: `WRN-DRIVER-CARRIER-${rowNum}`,
            row: rowNum,
            field: 'carrier',
            code: 'DRIVER_CARRIER_CONFLICT',
            severity: 'WARNING',
            message: `Driver (${cleanDriver}) is associated with carrier (${masterCarrierName}), but row lists carrier (${canonical.carrier}).`,
            messageAr: `تعارض كفالة السائق: السائق (${cleanDriver}) مرتبط بالناقل (${masterCarrierName}) بينما السجل الوارد ينسبه للناقل (${canonical.carrier}).`,
            resolvable: true,
            blocking: false,
            originalValue: {
              driverName: cleanDriver,
              rowCarrier: canonical.carrier,
              masterCarrier: expectedCarrierId,
            },
          });
        }
      }
    }

    // 10. BLOCK 35: Material-Project Scope Validation
    if (canonical.materialType && context.knownEntities?.projectMaterials && context.knownEntities.projectMaterials.length > 0) {
      const matStr = String(canonical.materialType).trim();
      const canonicalMat = findCanonicalMaterial(matStr, context.knownEntities);
      const resolvedMatId = canonicalMat ? canonicalMat.materialId : matStr;
      const resolvedMatCode = canonicalMat?.code || matStr;

      const isProjectAuth = context.knownEntities.projectMaterials.some(
        (m) =>
          m.toLowerCase() === resolvedMatId.toLowerCase() ||
          m.toLowerCase() === resolvedMatCode.toLowerCase() ||
          m.toLowerCase() === matStr.toLowerCase() ||
          (canonicalMat && m.toLowerCase() === canonicalMat.name.toLowerCase())
      );
      if (!isProjectAuth) {
        issues.push({
          issueId: `WRN-MAT-PROJ-${rowNum}`,
          row: rowNum,
          field: 'materialType',
          code: 'MATERIAL_PROJECT_CONFLICT',
          severity: 'WARNING',
          message: `Material (${canonical.materialType}) is not authorized for project (${context.projectId}).`,
          messageAr: `المادة (${canonical.materialType}) غير مصرح بها أو غير معتمدة ضمن نطاق هذا المشروع (${context.projectId}).`,
          resolvable: true,
          blocking: false,
          originalValue: canonical.materialType,
        });
      }
    }

    // 11. BLOCK 37: Legacy Variance Mismatch Check
    if (
      typeof canonical.netWeight === 'number' &&
      typeof canonical.destNetWeight === 'number' &&
      !isNaN(canonical.netWeight) &&
      !isNaN(canonical.destNetWeight) &&
      canonical.varianceWeight !== undefined &&
      canonical.varianceWeight !== null &&
      typeof canonical.varianceWeight === 'number' &&
      !isNaN(canonical.varianceWeight)
    ) {
      const calculatedVariance = Math.round((canonical.destNetWeight - canonical.netWeight) * 100) / 100;
      const absCalcVar = Math.abs(calculatedVariance);
      const absSourceVar = Math.abs(canonical.varianceWeight);
      const diff = Math.round(Math.abs(absSourceVar - absCalcVar) * 100) / 100;

      if (diff > NET_WEIGHT_CALCULATION_TOLERANCE_KG) {
        issues.push({
          issueId: `WRN-LEGACY-VAR-${rowNum}`,
          row: rowNum,
          field: 'varianceWeight',
          code: 'LEGACY_VARIANCE_MISMATCH',
          severity: 'WARNING',
          blocking: false,
          resolvable: true,
          message: `Legacy sheet variance (${canonical.varianceWeight} kg) does not match calculated variance (${calculatedVariance} kg). Difference: ${diff} kg.`,
          messageAr: `فارق الوزن المسجل بالشيت القديم (${canonical.varianceWeight} كجم) يختلف عن الفارق المحسوب بين الصافي وصافي الوصول (${calculatedVariance} كجم) بفارق ${diff} كجم.`,
          originalValue: {
            sourceVariance: canonical.varianceWeight,
            calculatedVariance,
            difference: diff,
          },
        });
      }
    }

    // 12. BLOCK 37: Legacy Status Verification
    if (canonical.status || canonical.legacyStatus) {
      const statusToCheck = canonical.status || canonical.legacyStatus;
      const knownStatuses = [
        'مكتمل', 'مكتملة', 'تم الانتهاء', 'completed', 'delivered', 'done',
        'منقول', 'في الطريق', 'محمل', 'تم التحميل', 'in_transit', 'transit', 'dispatched',
        'مرفوض', 'مرفوضة', 'rejected',
        'ملغى', 'ملغي', 'ملغية', 'cancelled', 'canceled',
        'موزون', 'موزونة', 'weighed', 'weighed_origin'
      ];
      const normStatus = String(statusToCheck).trim().toLowerCase();
      const isKnown = knownStatuses.some((s) => normStatus.includes(s));
      if (!isKnown) {
        issues.push({
          issueId: `WRN-STATUS-UNK-${rowNum}`,
          row: rowNum,
          field: 'status',
          code: 'UNKNOWN_LEGACY_STATUS',
          severity: 'WARNING',
          blocking: false,
          resolvable: true,
          message: `Legacy trip status (${statusToCheck}) is unrecognized and requires review.`,
          messageAr: `حالة الرحلة في الشيت القديم (${statusToCheck}) غير معروفة وتتطلب مراجعة.`,
          originalValue: statusToCheck,
        });
      }
    }

    return issues;
  }
}
