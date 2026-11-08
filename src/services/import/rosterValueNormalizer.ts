import type { DriverTruckCanonicalMappingTarget, CanonicalDriverTruckRow } from './driverTruckImport';
import { ExcelCsvNormalizer } from './normalizer.service';
import { ExcelCsvColumnMapper } from './columnMapper.service';
import { RosterSourceError } from './rosterSourceContract';
import { normalizePhone,normalizeIdNumber,normalizePlate,normalizeCode } from '../../utils/normalization';

export class DriverTruckImportNormalizer {
  public customMappings?: Record<string, DriverTruckCanonicalMappingTarget>;

  constructor(customMappings?: Record<string, DriverTruckCanonicalMappingTarget>) {
    this.customMappings = customMappings;
  }

  public normalize(
    raw: Record<string, any>,
    rowNumber: number,
    _context?: any,
    runtimeCustomMappings?: Record<string, DriverTruckCanonicalMappingTarget>
  ): CanonicalDriverTruckRow {
    const canonical: CanonicalDriverTruckRow = { _rowNumber: rowNumber };
    canonical._raw = raw; // Preserve extra fields in source metadata without leaking into entity payload

    const numeric = (value: unknown, field: 'tareWeightKg' | 'maxGrossWeightKg') => {
      if (value === undefined || value === null || String(value).trim() === '') return;
      const text = ExcelCsvNormalizer.convertArabicNumerals(String(value).replace(/٬/g, ''));
      const grouped = text.replace(/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?=\s*(?:kg|كجم|كيلو|طن|tons?)?\s*$)/i, match => match.replace(/,/g, ''));
      const parsed = /[0-9]/.test(grouped) && /^[0-9\s,.+\-]+(?:kg|كجم|كيلو|طن|tons?)?$/i.test(grouped.trim()) ? ExcelCsvNormalizer.parseFlexibleNumber(grouped) : null;
      if (parsed === null || !Number.isFinite(parsed)) {
        (canonical._invalidNumericFields ||= []).push(field);
      } else canonical[field] = parsed;
    };
    const effectiveMappings = runtimeCustomMappings || this.customMappings;

    if (effectiveMappings && Object.keys(effectiveMappings).length > 0) {
      // Manual approved mappings take precedence deterministically
      const mapped: Partial<Record<DriverTruckCanonicalMappingTarget, any>> = {};

      const seen = new Set<string>();
      for (const [rawHeader, targetField] of Object.entries(effectiveMappings)) {
        if (targetField && targetField !== ('unmapped' as any) && raw[rawHeader] !== undefined && raw[rawHeader] !== null) {
          if (seen.has(targetField)) throw new RosterSourceError('MAPPING_DUPLICATE');
          seen.add(targetField);
          mapped[targetField] = raw[rawHeader];
        }
      }

      // Explicit target extraction only - unmapped / extra fields in raw do not leak into canonical payload fields
      canonical.driverName = mapped.driverName !== undefined ? String(mapped.driverName).trim() : '';
      canonical.driverPhone = mapped.driverPhone !== undefined ? normalizePhone(String(mapped.driverPhone)) : '';
      canonical.driverIdentity = mapped.driverIdentity !== undefined ? normalizeIdNumber(String(mapped.driverIdentity)) : '';
      canonical.truckPlate = mapped.truckPlate !== undefined ? normalizePlate(String(mapped.truckPlate)) : '';
      canonical.truckType = mapped.truckType !== undefined ? String(mapped.truckType).trim() : '';
      canonical.carrierName = mapped.carrierName !== undefined ? String(mapped.carrierName).trim() : '';
      canonical.materialName = mapped.materialName !== undefined ? String(mapped.materialName).trim() : '';
      canonical.materialCode = mapped.materialCode !== undefined ? normalizeCode(String(mapped.materialCode)) : '';

      numeric(mapped.tareWeightKg, 'tareWeightKg');
      numeric(mapped.maxGrossWeightKg, 'maxGrossWeightKg');
    } else {
      // Use shared ExcelCsvColumnMapper logic to identify fields (backward-compatible fallback)
      const headers = Object.keys(raw);
      const mappings = ExcelCsvColumnMapper.mapHeaders(headers);

      const mapped: any = {};
      for (const [rawHeader, match] of Object.entries(mappings)) {
        if (match && match.confidence >= 0.70 && !match.isAmbiguous) {
          mapped[match.canonicalField] = raw[rawHeader];
        }
      }

      // Normalize canonical field values
      canonical.driverName = mapped.driverName ? String(mapped.driverName).trim() : '';
      canonical.driverPhone = mapped.driverPhone ? normalizePhone(String(mapped.driverPhone)) : '';
      canonical.driverIdentity = mapped.driverIdentity ? normalizeIdNumber(String(mapped.driverIdentity)) : '';

      // Map truckNo (from shared mapper) to truckPlate (roster canonical)
      const plateVal = mapped.truckNo || mapped.truckPlate || '';
      canonical.truckPlate = plateVal ? normalizePlate(String(plateVal)) : '';

      canonical.truckType = mapped.truckType ? String(mapped.truckType).trim() : '';
      canonical.carrierName = mapped.carrier ? String(mapped.carrier).trim() : (mapped.carrierName ? String(mapped.carrierName).trim() : '');

      // Map materialType (from shared mapper) to materialName (roster canonical)
      const matVal = mapped.materialType || mapped.materialName || '';
      canonical.materialName = matVal ? String(matVal).trim() : '';

      canonical.materialCode = mapped.materialCode ? normalizeCode(String(mapped.materialCode)) : '';

      numeric(raw.tareWeightKg, 'tareWeightKg');
      numeric(raw.maxGrossWeightKg, 'maxGrossWeightKg');
    }

    return canonical;
  }
}
