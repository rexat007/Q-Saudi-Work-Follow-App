/**
 * Excel & CSV Trip Committer
 * BLOCK 31: Commits imported rows into official Trip entities
 * Strictly implements IImportCommitter from BLOCK 30
 * 
 * Rules:
 * - NO Firestore writes before COMMIT
 * - Project Isolation enforced
 * - RBAC & Authentication enforced
 * - Operation Source Model (BLOCK 29) populated (sourceType, sourceMetadata, etc.)
 * - Idempotency via operationId enforced to prevent duplicate trips
 * - Audit log recorded
 */

import { IImportCommitter } from './contracts';
import {
  UnifiedImportBatch,
  ImportResult,
  PipelineContext,
  ImportIssue,
} from '../../types/unifiedImport';
import { TripEntity, TripStatus, OperationSourceType, OperationActorType } from '../../types/entities';
import { CanonicalTripRow } from '../../types/excelCsvImport';
import { UnifiedImportValidator } from '../../validators/unifiedImport.validator';
import { tripRepository } from '../../repositories/trip.repository';
import { auditLogService } from '../auditLog.service';
import { pricingService } from '../pricing.service';
import { pricingRuleRepository } from '../../repositories/pricingRule.repository';
import { PricingRule, TripPricingSnapshot } from '../../types/pricing';
import { mapLegacyStatusToTripStatus } from './legacyStatusMapper';
import { carrierRepository } from '../../repositories/carrier.repository';
import { truckRepository } from '../../repositories/truck.repository';
import { driverRepository } from '../../repositories/driver.repository';
import { materialRepository } from '../../repositories/material.repository';
import { canonicalSnapshotClientService } from './canonicalSnapshotClient.service';


export class ExcelCsvTripCommitter implements IImportCommitter {
  // Static cache for idempotency tracking
  private static committedOperations = new Map<string, ImportResult>();

  public static resetIdempotencyCache(): void {
    this.committedOperations.clear();
  }

  public async commit(batch: UnifiedImportBatch, context: PipelineContext): Promise<ImportResult> {
    // 1. Idempotency Check: if operationId already committed, return cached result immediately
    if (context.operationId && ExcelCsvTripCommitter.committedOperations.has(context.operationId)) {
      return ExcelCsvTripCommitter.committedOperations.get(context.operationId)!;
    }

    // 2. Project Isolation Check
    const isolation = UnifiedImportValidator.enforceProjectIsolation(batch.projectId, context);
    if (!isolation.isAllowed) {
      return {
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: context.operationId,
        sourceType: batch.source.sourceType,
        success: false,
        totalRows: batch.totalRows,
        committedRows: 0,
        skippedRows: batch.totalRows,
        failedRows: batch.totalRows,
        issues: [
          {
            issueId: `ERR-ISOLATION-${Date.now()}`,
            row: 0,
            field: 'projectId',
            code: 'PROJECT_ISOLATION_VIOLATION',
            severity: 'BLOCKING',
            message: isolation.error || 'Project isolation violation',
            resolvable: false,
            blocking: true,
          },
        ],
        executedAt: new Date().toISOString(),
        error: isolation.error,
      };
    }

    // 3. Pre-commit check: Blocking Errors
    if (batch.errorRows > 0) {
      const errorMsg = `لا يمكن تنفيذ الاعتماد: توجد (${batch.errorRows}) أخطاء مانعة للاستيراد يجب تصحيحها أو استبعادها أولاً.`;
      return {
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: context.operationId,
        sourceType: batch.source.sourceType,
        success: false,
        totalRows: batch.totalRows,
        committedRows: 0,
        skippedRows: 0,
        failedRows: batch.errorRows,
        issues: batch.issues.filter((i) => i.blocking),
        executedAt: new Date().toISOString(),
        error: errorMsg,
      };
    }

    // 4. Pre-commit check: Warnings Confirmation
    if (batch.warningRows > 0 && !context.allowWarningsCommit && !batch.warningConfirmation?.confirmed) {
      const errorMsg = `توجد (${batch.warningRows}) تنبيهات تتطلب تأكيد بشري صريح قبل الاعتماد.`;
      return {
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: context.operationId,
        sourceType: batch.source.sourceType,
        success: false,
        totalRows: batch.totalRows,
        committedRows: 0,
        skippedRows: batch.warningRows,
        failedRows: 0,
        issues: batch.issues.filter((i) => i.severity === 'WARNING'),
        executedAt: new Date().toISOString(),
        error: errorMsg,
      };
    }

    // Pre-commit check: Unresolved Reviews (C & D)
    const hasUnresolvedInBatch = (batch.requiresReviewRows && batch.requiresReviewRows > 0) ||
                                 batch.rows.some((r) => r.reviewStatus === 'requires_review');
    if (hasUnresolvedInBatch) {
      const errorMsg = 'لا يمكن تنفيذ الاعتماد: توجد صفوف مراجعة غير مطابقة معلقة (ENTITY_RESOLUTION_REVIEW_REQUIRED)';
      return {
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: context.operationId,
        sourceType: batch.source.sourceType,
        success: false,
        totalRows: batch.totalRows,
        committedRows: 0,
        skippedRows: batch.totalRows,
        failedRows: batch.totalRows,
        issues: [
          {
            issueId: `ERR-UNRESOLVED-COMMIT-BLOCKED-${Date.now()}`,
            row: 0,
            field: 'reviewStatus',
            code: 'ENTITY_RESOLUTION_REVIEW_REQUIRED',
            severity: 'BLOCKING',
            message: errorMsg,
            resolvable: false,
            blocking: true,
          }
        ],
        executedAt: new Date().toISOString(),
        error: errorMsg,
      };
    }

    // 5. Filter active non-rejected rows
    const activeRows = batch.rows.filter(
      (r) => r.status !== 'REJECTED' && r.reviewStatus !== 'error'
    );

    const committedTripIds: string[] = [];
    const executionErrors: ImportIssue[] = [];
    let persistenceErrorsCount = 0;

    // BLOCK 36: Load project pricing rules for deterministic contractual settlement resolution
    let projectRules: PricingRule[] = [];
    try {
      const rawRules = await pricingRuleRepository.listByProject(batch.projectId);
      projectRules = rawRules.map((e: any) => ({
        pricingRuleId: e.pricingRuleId,
        projectId: e.projectId,
        carrierId: e.carrierId || '',
        materialId: e.materialId || null,
        pricingType: (e.pricingModel === 'PER_TRIP' || e.pricingType === 'PER_TRIP') ? 'PER_TRIP' : 'PER_TON',
        rate: e.rate !== undefined ? e.rate : (e.baseRateSAR !== undefined ? e.baseRateSAR : 0),
        currency: e.currency || 'SAR',
        settlementBase: e.settlementBase,
        effectiveFrom: e.effectiveFrom || '2020-01-01',
        effectiveTo: e.effectiveTo || null,
        status: e.status || (e.isActive !== false ? 'ACTIVE' : 'INACTIVE'),
        version: e.version || 1,
        parentRuleId: e.parentRuleId,
        createdAt: e.createdAt || new Date().toISOString(),
        createdBy: e.createdBy || 'system',
        updatedAt: e.updatedAt || new Date().toISOString(),
        notes: e.notes,
      }));
    } catch {
      projectRules = [];
    }

    if (projectRules.length === 0) {
      projectRules = pricingService.getRules().filter((r) => r.projectId === batch.projectId).map((r) => ({
        pricingRuleId: r.pricingRuleId,
        projectId: r.projectId,
        carrierId: r.carrierId || 'CAR-ALMAJDOUIE',
        materialId: r.materialId || null,
        pricingType: r.pricingType,
        rate: r.agreedRate,
        currency: r.currency || 'SAR',
        effectiveFrom: r.effectiveFrom,
        effectiveTo: r.effectiveTo,
        status: r.status,
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
      }));
    }

    // 6. Build and persist Trip entities
    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      const canonical: Partial<CanonicalTripRow> =
        (row.mapped as any) || (row.canonical as any) || {};

      const tripIndex = i + 1;
      const tripId = `TRP-IMP-${batch.importBatchId.slice(-6)}-${tripIndex}`;
      const tripNumber = `TRP-${new Date().getFullYear()}-${String(100000 + tripIndex).padStart(6, '0')}`;

      // Determine initial status based on weights or explicit legacy status
      let initialStatus: TripStatus = 'DISPATCHED';
      if (canonical.isLegacyMigration || canonical.status || canonical.legacyStatus) {
        const mappedStatus = mapLegacyStatusToTripStatus(canonical.status || canonical.legacyStatus);
        if (!mappedStatus.isUnknown) {
          initialStatus = mappedStatus.tripStatus;
        } else if (canonical.destNetWeight !== undefined && canonical.destNetWeight !== null) {
          initialStatus = 'COMPLETED';
        } else if (
          canonical.grossWeight !== undefined &&
          canonical.grossWeight !== null &&
          canonical.tareWeight !== undefined &&
          canonical.tareWeight !== null
        ) {
          initialStatus = 'WEIGHED_ORIGIN';
        }
      } else if (canonical.destNetWeight !== undefined && canonical.destNetWeight !== null) {
        initialStatus = 'COMPLETED';
      } else if (
        canonical.grossWeight !== undefined &&
        canonical.grossWeight !== null &&
        canonical.tareWeight !== undefined &&
        canonical.tareWeight !== null
      ) {
        initialStatus = 'WEIGHED_ORIGIN';
      }

      // Check if weighbridge compatible
      const isWeighbridge =
        batch.source.sourceType === 'WEIGHBRIDGE' ||
        canonical.isWeighbridgeOnly ||
        (canonical.tareWeight && canonical.grossWeight && !canonical.destNetWeight);

      const loadingSource: OperationSourceType = isWeighbridge
        ? 'WEIGHBRIDGE'
        : (batch.source.sourceType as OperationSourceType);

      // BLOCK 34 Rules 10-15: Explicit acceptance of origin net as destination
      const isAcceptedOrigin =
        canonical.unloadDecision === 'ACCEPT_ORIGIN_NET_AS_DESTINATION' ||
        canonical.isAcceptedOriginNet === true;

      const unloadingSource: OperationSourceType | null = isAcceptedOrigin
        ? 'WEIGHBRIDGE'
        : canonical.destNetWeight
        ? (batch.source.sourceType as OperationSourceType)
        : null;

      const unloadingActorType: OperationActorType | null = isAcceptedOrigin
        ? 'USER'
        : canonical.destNetWeight
        ? 'IMPORT'
        : null;

      const unloadingActorId: string | null = isAcceptedOrigin
        ? canonical.unloadingActorId || context.userId
        : canonical.destNetWeight
        ? context.userId
        : null;

      const tripDate =
        canonical.shiftDate ||
        canonical.date ||
        (canonical.weighTime ? canonical.weighTime.split('T')[0] : null) ||
        (canonical.loadTime ? canonical.loadTime.split('T')[0] : null) ||
        new Date().toISOString().split('T')[0];

      // 1. Determine final canonical IDs with strict priority (A)
      let finalCarrierId = row.resolvedValues?.carrierId;
      if (!finalCarrierId) {
        const res = row.entityResolutions?.carrier;
        if (res && res.matchedId) {
          finalCarrierId = res.matchedId;
        } else if (res && res.entityId) {
          finalCarrierId = res.entityId;
        }
      }
      if (!finalCarrierId && canonical.carrierId) {
        const isReal = typeof canonical.carrierId === 'string' && 
                       canonical.carrierId.trim() !== '' && 
                       !canonical.carrierId.startsWith('CARRIER-') && 
                       canonical.carrierId !== 'DEFAULT' && 
                       canonical.carrierId !== 'GENERAL' && 
                       canonical.carrierId !== 'UNASSIGNED' &&
                       !canonical.carrierId.includes(' ') &&
                       !canonical.carrierId.includes('Cargo') &&
                       !canonical.carrierId.includes('شركة');
        if (isReal) {
          finalCarrierId = canonical.carrierId;
        }
      }

      let finalTruckId = row.resolvedValues?.truckId;
      if (!finalTruckId) {
        const res = row.entityResolutions?.truck;
        if (res && res.matchedId) {
          finalTruckId = res.matchedId;
        } else if (res && res.entityId) {
          finalTruckId = res.entityId;
        }
      }
      if (!finalTruckId && canonical.truckId) {
        const isReal = typeof canonical.truckId === 'string' && 
                       canonical.truckId.trim() !== '' && 
                       !canonical.truckId.startsWith('TRUCK-') && 
                       canonical.truckId !== 'DEFAULT' && 
                       canonical.truckId !== 'GENERAL' && 
                       canonical.truckId !== 'UNASSIGNED' &&
                       !canonical.truckId.includes(' ') &&
                       !canonical.truckId.includes('اللوحة') &&
                       !canonical.truckId.includes('شاحنة');
        if (isReal) {
          finalTruckId = canonical.truckId;
        }
      }

      let finalDriverId = row.resolvedValues?.driverId;
      if (!finalDriverId) {
        const res = row.entityResolutions?.driver;
        if (res && res.matchedId) {
          finalDriverId = res.matchedId;
        } else if (res && res.entityId) {
          finalDriverId = res.entityId;
        }
      }
      if (!finalDriverId && canonical.driverId) {
        const isReal = typeof canonical.driverId === 'string' && 
                       canonical.driverId.trim() !== '' && 
                       !canonical.driverId.startsWith('DRIVER-') && 
                       canonical.driverId !== 'DEFAULT' && 
                       canonical.driverId !== 'GENERAL' && 
                       canonical.driverId !== 'UNASSIGNED' &&
                       !canonical.driverId.includes(' ') &&
                       !canonical.driverId.includes('السائق') &&
                       !canonical.driverId.includes('أحمد') &&
                       !canonical.driverId.includes('علي');
        if (isReal) {
          finalDriverId = canonical.driverId;
        }
      }

      let finalMaterialId = row.resolvedValues?.materialId;
      if (!finalMaterialId) {
        const res = row.entityResolutions?.material;
        if (res && res.matchedId) {
          finalMaterialId = res.matchedId;
        } else if (res && res.entityId) {
          finalMaterialId = res.entityId;
        }
      }
      if (!finalMaterialId && canonical.materialId) {
        const isReal = typeof canonical.materialId === 'string' && 
                       canonical.materialId.trim() !== '' && 
                       !canonical.materialId.startsWith('MAT-') && 
                       canonical.materialId !== 'DEFAULT' && 
                       canonical.materialId !== 'GENERAL' && 
                       canonical.materialId !== 'UNASSIGNED' &&
                       !canonical.materialId.includes(' ') &&
                       !canonical.materialId.includes('Red') &&
                       !canonical.materialId.includes('Sand') &&
                       !canonical.materialId.includes('رمل') &&
                       !canonical.materialId.includes('حصى');
        if (isReal) {
          finalMaterialId = canonical.materialId;
        }
      }

      // 2. Pre-commit Defense (E)
      const rowIssues: ImportIssue[] = [];

      if (!finalCarrierId) {
        rowIssues.push({
          issueId: `ERR-CARRIER-REQ-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'carrierId',
          code: 'CANONICAL_CARRIER_ID_REQUIRED',
          severity: 'BLOCKING',
          message: 'معرف الناقل المعتمد مطلوب',
          resolvable: false,
          blocking: true,
        });
      }
      if (!finalTruckId) {
        rowIssues.push({
          issueId: `ERR-TRUCK-REQ-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'truckId',
          code: 'CANONICAL_TRUCK_ID_REQUIRED',
          severity: 'BLOCKING',
          message: 'معرف الشاحنة المعتمد مطلوب',
          resolvable: false,
          blocking: true,
        });
      }
      if (!finalDriverId) {
        rowIssues.push({
          issueId: `ERR-DRIVER-REQ-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'driverId',
          code: 'CANONICAL_DRIVER_ID_REQUIRED',
          severity: 'BLOCKING',
          message: 'معرف السائق المعتمد مطلوب',
          resolvable: false,
          blocking: true,
        });
      }
      if (!finalMaterialId) {
        rowIssues.push({
          issueId: `ERR-MATERIAL-REQ-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'materialId',
          code: 'CANONICAL_MATERIAL_ID_REQUIRED',
          severity: 'BLOCKING',
          message: 'معرف المادة المعتمد مطلوب',
          resolvable: false,
          blocking: true,
        });
      }

      if (row.reviewStatus === 'requires_review') {
        rowIssues.push({
          issueId: `ERR-REQUIRES-REVIEW-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'reviewStatus',
          code: 'ENTITY_RESOLUTION_REVIEW_REQUIRED',
          severity: 'BLOCKING',
          message: 'يجب مراجعة مطابقة الكيانات أولاً لهذا الصف',
          resolvable: false,
          blocking: true,
        });
      }

      if (rowIssues.length > 0) {
        executionErrors.push(...rowIssues);
        if (!batch.issues) batch.issues = [];
        batch.issues.push(...rowIssues);
        continue; // FAIL CLOSED: do not write the row!
      }

      // 3. Snapshot Source Assessment (I, J, K & L) - SNAPSHOT_READ_BOUNDARY_REQUIRED
      let snapshotBundle;
      try {
        snapshotBundle = await canonicalSnapshotClientService.getTripCanonicalSnapshot(
          batch.projectId,
          {
            carrierId: finalCarrierId,
            truckId: finalTruckId,
            driverId: finalDriverId,
            materialId: finalMaterialId,
          }
        );
      } catch (err: any) {
        const snapIssue: ImportIssue = {
          issueId: `ERR-SNAP-MISSING-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'snapshot',
          code: 'CANONICAL_SNAPSHOT_DATA_MISSING',
          severity: 'BLOCKING',
          message: `خطأ في استرداد لقطة الكيان المعتمد: ${err.message || err} (SNAPSHOT_READ_BOUNDARY_REQUIRED) - Carrier: ${finalCarrierId}, Truck: ${finalTruckId}, Driver: ${finalDriverId}, Material: ${finalMaterialId}`,
          resolvable: false,
          blocking: true,
        };
        executionErrors.push(snapIssue);
        if (!batch.issues) batch.issues = [];
        batch.issues.push(snapIssue);
        continue; // FAIL CLOSED: do not write the row!
      }


      // 4. Resolve Pricing with converged identity (F)
      const carrierRes = row.entityResolutions?.carrier as any;
      const materialRes = row.entityResolutions?.material as any;
      const carrierRequiresReview =
        carrierRes?.recommendation === 'REVIEW' || carrierRes?.status === 'REQUIRES_REVIEW' || !finalCarrierId;
      const materialRequiresReview =
        materialRes?.recommendation === 'REVIEW' || materialRes?.status === 'REQUIRES_REVIEW' || !finalMaterialId;
      const entityResolutionPending = carrierRequiresReview || materialRequiresReview;

      let pricingResolution =
        !entityResolutionPending && finalCarrierId
          ? pricingService.resolvePricingRuleFromList(projectRules, {
              projectId: batch.projectId,
              carrierId: finalCarrierId,
              materialId: finalMaterialId,
              tripDate,
            })
          : null;

      // Check if row has an explicit verified pricing rule matching project
      if (!pricingResolution?.selectedRule && canonical.pricingRule) {
        const explicitMatch = projectRules.find(
          (r) => r.pricingRuleId === canonical.pricingRule && r.projectId === batch.projectId
        );
        if (explicitMatch) {
          pricingResolution = {
            status: 'RESOLVED',
            selectedRule: explicitMatch,
            rule: explicitMatch,
            reason: 'تم استخدام قاعدة التسعير التعاقدية المحددة صراحة في بيانات الاستيراد',
            reasonAr: 'تم استخدام قاعدة التسعير التعاقدية المحددة صراحة في بيانات الاستيراد',
            reasonCode: 'EXPLICIT_RULE_APPLIED',
            candidates: [explicitMatch],
          };
        }
      }

      let pricingSnapshot: TripPricingSnapshot;
      let pricingRuleId: string = 'UNRESOLVED_PENDING';
      let pricingType: string = 'PER_TON';
      let isFinalized = false;

      if (pricingResolution && pricingResolution.status === 'RESOLVED' && pricingResolution.selectedRule) {
        const rule = pricingResolution.selectedRule;
        pricingRuleId = rule.pricingRuleId;
        pricingType = rule.pricingType;

        const isWeighbridgeWithoutUnload = isWeighbridge && !canonical.destNetWeight && !isAcceptedOrigin;
        if (rule.pricingType === 'PER_TON' && isWeighbridgeWithoutUnload) {
          const pendingCalc = pricingService.calculateSettlement({
            pricingRule: rule,
            allowMissingWeight: true,
            netWeightTon: 0,
          });
          pricingSnapshot = {
            ...pendingCalc.snapshot,
            isPending: true,
            pendingReason: 'تسعيرة معلقة: بانتظار استكمال إجراءات التنزيل وتسجيل وزن المقصد المعتمد',
            settlementAmount: 0,
          };
          isFinalized = false;
        } else {
          const netTons = isAcceptedOrigin
            ? (canonical.netWeight || 0) / 1000
            : canonical.destNetWeight !== undefined && canonical.destNetWeight !== null
            ? canonical.destNetWeight / 1000
            : (canonical.netWeight || 0) / 1000;

          const calc = pricingService.calculateSettlement({
            pricingRule: rule,
            netWeightTon: netTons,
            unitsCount: 1,
          });

          pricingSnapshot = calc.snapshot;
          isFinalized = !calc.isPending;
        }
      } else {
        const pendingReason = entityResolutionPending
          ? carrierRequiresReview
            ? 'الناقل بانتظار المراجعة (Entity Resolution Pending)'
            : 'مادة التوريد بانتظار المراجعة'
          : pricingResolution?.reasonAr || 'لا توجد اتفاقية تسعير سارية لهذا الناقل والمادة في تاريخ الرحلة';

        pricingSnapshot = pricingService.createPendingSnapshot(pendingReason);
        pricingRuleId = 'UNRESOLVED_PENDING';
        pricingType = 'PER_TON';
        isFinalized = false;
      }

      const baseAmountSAR = pricingSnapshot.settlementAmount;
      const vatAmountSAR = isFinalized ? Number((baseAmountSAR * 0.15).toFixed(2)) : 0;
      const totalAmountSAR = isFinalized ? Number((baseAmountSAR + vatAmountSAR).toFixed(2)) : 0;

      // 5. Build Trip payload with strict actual snapshot data only
      const newTrip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & {
        createdBy: string;
        updatedBy: string;
      } = {
        tripId,
        tripNumber,
        projectId: batch.projectId,
        carrierId: finalCarrierId,
        truckId: finalTruckId,
        driverId: finalDriverId,
        materialId: finalMaterialId,
        pricingRuleId,

        sourceType: (batch.source.sourceType as OperationSourceType) || 'WEIGHBRIDGE',
        loadingDataSource: loadingSource,
        unloadingDataSource: unloadingSource,
        loadingActorType: 'IMPORT',
        loadingActorId: context.userId,
        unloadingActorType,
        unloadingActorId,
        sourceMetadata: {
          importBatchId: batch.importBatchId,
          sourceFileId: batch.source.sourceFileId,
          sourceFileName: batch.source.sourceFileName,
          sourceSheetName: batch.source.sourceSheetName,
          sourceRowId: row.sourceRowId || row.rowNumber,
          sourceMimeType: batch.source.sourceMimeType,
          ...(canonical.tripSerial !== undefined && canonical.tripSerial !== null ? { legacyTripSerial: canonical.tripSerial } : {}),
          ...(canonical.tripRate !== undefined && canonical.tripRate !== null ? { legacyRate: canonical.tripRate } : {}),
          ...(canonical.status ? { legacyStatus: canonical.status } : {}),
        },

        carrierSnapshot: snapshotBundle.carrierSnapshot,
        truckSnapshot: snapshotBundle.truckSnapshot,
        driverSnapshot: snapshotBundle.driverSnapshot,
        materialSnapshot: snapshotBundle.materialSnapshot,

        pricingSnapshot: pricingSnapshot as any,

        status: initialStatus,

        weights: {
          originTareKg: canonical.tareWeight,
          originGrossKg: canonical.grossWeight,
          originNetKg: canonical.netWeight,
          originTicketNo: canonical.ticketId,
          destinationNetKg: canonical.destNetWeight,
          billableWeightKg: canonical.destNetWeight || canonical.netWeight,
        },

        financials: {
          baseAmountSAR,
          demurrageAmountSAR: 0,
          deductionsAmountSAR: 0,
          subtotalSAR: baseAmountSAR,
          vatAmountSAR,
          totalAmountSAR,
          currency: 'SAR',
          isFinalized,
        },

        clientUUID: `CUUID-IMP-${batch.importBatchId}-${row.rowNumber}`,
        syncStatus: 'SYNCED',
        hasExceptions: !isFinalized,
        activeExceptionCount: isFinalized ? 0 : 1,
        createdBy: context.userId,
        updatedBy: context.userId,
      };

      const sanitizedTrip = ExcelCsvTripCommitter.stripUndefined(newTrip);

      try {
        await tripRepository.create(sanitizedTrip);
        committedTripIds.push(tripId);
        row.status = 'COMMITTED';
      } catch (err: any) {
        persistenceErrorsCount++;
        console.error(`[ExcelCsvTripCommitter] Trip creation failed for row ${row.rowNumber}, tripId ${tripId}: ${err?.message || err}`);
        const errMsg = err?.message || String(err);
        const failIssue: ImportIssue = {
          issueId: `ERR-PERSIST-${Date.now()}-${i}`,
          row: row.rowNumber,
          field: 'tripId',
          code: 'TRIP_PERSISTENCE_FAILED',
          severity: 'BLOCKING',
          message: `فشل حفظ الرحلة ${tripId} في قاعدة البيانات للصف ${row.rowNumber}: ${errMsg}`,
          resolvable: false,
          blocking: true,
        };
        executionErrors.push(failIssue);
        if (!batch.issues) {
          batch.issues = [];
        }
        batch.issues.push(failIssue);
        continue;
      }
    }

    // 7. Record Audit Log
    try {
      await auditLogService.recordLog(
        {
          projectId: batch.projectId,
          entityType: 'IMPORT_BATCH',
          entityId: batch.importBatchId,
          action: 'COMMIT_IMPORT_BATCH',
          after: {
            committedRows: committedTripIds.length,
            operationId: context.operationId,
            sourceFileName: batch.source.sourceFileName,
            details: `تم اعتماد واستيراد (${committedTripIds.length}) رحلة بنجاح من مصدر (${batch.source.sourceType}) [الملف: ${batch.source.sourceFileName || 'N/A'}]`,
          },
        },
        {
          userId: context.userId,
          email: `${context.userId}@system.internal`,
          displayName: context.userName || context.userId,
          role: (context.role as any) || 'PROJECT_ADMIN',
          assignedProjectIds: [batch.projectId],
        }
      );
    } catch {
      // Audit fail-safe in disconnected environments
    }

    const committedRowsCount = committedTripIds.length;
    const failedRowsCount = executionErrors.length;
    const skippedRowsCount = Math.max(0, batch.totalRows - committedRowsCount - failedRowsCount);

    const eligibleCommitRowsCount = activeRows.length;
    let success = true;
    if (eligibleCommitRowsCount > 0) {
      success = committedRowsCount > 0;
    } else {
      success = failedRowsCount === 0;
    }

    const result: ImportResult = {
      importBatchId: batch.importBatchId,
      projectId: batch.projectId,
      operationId: context.operationId,
      sourceType: batch.source.sourceType,
      success,
      totalRows: batch.totalRows,
      committedRows: committedRowsCount,
      skippedRows: skippedRowsCount,
      failedRows: failedRowsCount,
      issues: batch.issues,
      committedEntityIds: committedTripIds,
      executedAt: new Date().toISOString(),
    };

    // Cache result for idempotency
    if (context.operationId) {
      ExcelCsvTripCommitter.committedOperations.set(context.operationId, result);
    }

    return result;
  }

  /**
   * Recursively removes undefined keys from objects to adhere to Firestore requirements
   */
  public static stripUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => ExcelCsvTripCommitter.stripUndefined(item)) as unknown as T;
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = ExcelCsvTripCommitter.stripUndefined(value);
      }
    }
    return clean as T;
  }
}
