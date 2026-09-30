import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  X,
  RefreshCw,
  Eye,
  FileText,
  Layers,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
  PlusCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExcelCsvPipelineService } from '../../services/import/excelCsvPipeline.service';
import { entityResolutionCommandService, NormalizedEntityResolutionResult } from '../../services/import/entityResolutionCommand.service';
import { importSessionClientService } from '../../services/import/importSessionClient.service';
import { RosterBatchReviewService, RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
import { DriverTruckPipelineService } from '../../services/import/driverTruckPipeline.service';
import { UnifiedImportBatch, PipelineContext, ImportResult, ImportRow, ImportSource } from '../../types/unifiedImport';
import { ColumnMappingMatch } from '../../types/excelCsvImport';
import { RelationshipContext } from '../../types/dataQuality';
import { ImportProjectContextAdapter } from '../../services/import/importProjectContext.adapter';
import { AuthUserContext } from '../../types/common';
import { smartSourceDiscoveryService } from '../../services/import/smartSourceDiscovery.service';
import { CanonicalTripRow } from '../../types/excelCsvImport';

export const CANONICAL_FIELD_OPTIONS: Array<{ value: keyof CanonicalTripRow | 'unmapped'; labelAr: string; isRequired?: boolean }> = [
  { value: 'ticketId', labelAr: 'رقم التذكرة / البوليصة (ticketId)' },
  { value: 'truckNo', labelAr: 'رقم اللوحة / الشاحنة (truckNo)' },
  { value: 'carrier', labelAr: 'الناقل / شركة النقل (carrier)' },
  { value: 'driverName', labelAr: 'اسم السائق (driverName)' },
  { value: 'materialType', labelAr: 'نوع المادة / الصنف (materialType)' },
  { value: 'shiftDate', labelAr: 'تاريخ الوردية / الحركة (shiftDate)' },
  { value: 'tareWeight', labelAr: 'الوزن الفارغ كجم (tareWeight)' },
  { value: 'grossWeight', labelAr: 'الوزن الإجمالي القائم كجم (grossWeight)' },
  { value: 'netWeight', labelAr: 'الوزن الصافي كجم (netWeight)' },
  { value: 'destNetWeight', labelAr: 'صافي وزن الوجهة كجم (destNetWeight)' },
  { value: 'varianceWeight', labelAr: 'فارق الوزن (varianceWeight)' },
  { value: 'loader', labelAr: 'مشغل / محطة التحميل (loader)' },
  { value: 'unloader', labelAr: 'مشغل / محطة التفريغ (unloader)' },
  { value: 'tripRate', labelAr: 'سعر الرحلة / التعرفة (tripRate)' },
  { value: 'projectId', labelAr: 'معرف المشروع (projectId)' },
  { value: 'unmapped', labelAr: '— تجاهل هذا العمود (غير مربوط) —' },
];

interface ExcelCsvImportSectionProps {
  currentProjectId?: string;
  authContext?: AuthUserContext;
  userId?: string;
  userName?: string;
  userRole?: string;
  onCommitSuccess?: (result: ImportResult) => void;
  canonicalRelationshipContext?: RelationshipContext | null;
  pipelineContext?: PipelineContext;
}

export function ExcelCsvImportSection({
  currentProjectId = '',
  authContext,
  userId,
  userName,
  userRole,
  onCommitSuccess,
  canonicalRelationshipContext,
  pipelineContext,
}: ExcelCsvImportSectionProps) {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [discoveryResult, setDiscoveryResult] = useState<any | null>(null);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  const [showManualOverrides, setShowManualOverrides] = useState<boolean>(false);
  const [customMappingOverrides, setCustomMappingOverrides] = useState<Record<string, keyof CanonicalTripRow | 'unmapped'>>({});
  
  // Pipeline & Import Session Active Identity State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [activeImportBatchId, setActiveImportBatchId] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [requiresSourceFileReattach, setRequiresSourceFileReattach] = useState<boolean>(false);

  // Pipeline Batch State
  const [activeBatch, setActiveBatch] = useState<UnifiedImportBatch | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnMappingMatch>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Review & Commit State
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR' | 'REQUIRES_REVIEW'>('ALL');
  const [confirmWarnings, setConfirmWarnings] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<ImportResult | null>(null);
  const [showMappingDrawer, setShowMappingDrawer] = useState<boolean>(false);
  const [activeCreateGroupKey, setActiveCreateGroupKey] = useState<string | null>(null);
  const [isCreatingEntity, setIsCreatingEntity] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showFullBatchTable, setShowFullBatchTable] = useState<boolean>(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'carrier' | 'material' | 'driver' | 'truck'>('carrier');
  const [selectedAlternateCandidates, setSelectedAlternateCandidates] = useState<Record<string, string>>({});
  const [createFormData, setCreateFormData] = useState<{
    nameAr?: string;
    commercialRegistrationNo?: string;
    transportLicenseNo?: string;
    code?: string;
    driverName?: string;
    residencyId?: string;
    phone?: string;
    plateNumber?: string;
    truckType?: string;
    tareWeightKg?: number;
    maxGrossWeightKg?: number;
  }>({});

  const handleOpenCreateForm = (group: RosterEntityReviewGroup) => {
    setActiveCreateGroupKey(group.normalizedSourceKey);
    setCreateError(null);
    const sourceVal = group.sourceValue || '';
    if (group.entityType === 'carrier') {
      setCreateFormData({
        nameAr: sourceVal,
        commercialRegistrationNo: '',
        transportLicenseNo: '',
      });
    } else if (group.entityType === 'material') {
      setCreateFormData({
        nameAr: sourceVal,
        code: '',
      });
    } else if (group.entityType === 'driver') {
      setCreateFormData({
        driverName: sourceVal,
        residencyId: '',
        phone: '',
      });
    } else if (group.entityType === 'truck') {
      setCreateFormData({
        plateNumber: sourceVal,
        truckType: '',
        tareWeightKg: undefined,
        maxGrossWeightKg: undefined,
      });
    }
  };

  const reviewGroups = useMemo(() => {
    if (!activeBatch) return { carrier: [], material: [], driver: [], truck: [] };
    return RosterBatchReviewService.getBatchReviewGroups(activeBatch);
  }, [activeBatch]);

  const unresolvedGroups = useMemo(() => {
    const all = [...reviewGroups.carrier, ...reviewGroups.material, ...reviewGroups.driver, ...reviewGroups.truck];
    return all.filter(g => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT');
  }, [reviewGroups]);

  const rowExceptions = useMemo(() => {
    if (!activeBatch) return [];
    return RosterBatchReviewService.getRowExceptions(activeBatch);
  }, [activeBatch]);

  const handleGroupResolutionDecision = async (
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    normalizedSourceKey: string,
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidate?: { selectedEntityId?: string; selectedDisplayName?: string }
  ) => {
    if (!activeBatch) return;

    try {
      setProcessError(null);
      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        activeBatch,
        entityTypeKey,
        normalizedSourceKey,
        decision,
        candidate || {},
        context,
        effectiveUserId || 'user'
      );

      setActiveBatch({ ...updated });

      if (currentProjectId && activeSessionId) {
        const cleanSnapshot = {
          totalRows: updated.totalRows,
          validRows: updated.validRows,
          warningRows: updated.warningRows,
          errorRows: updated.errorRows,
          requiresReviewRows: updated.requiresReviewRows,
          committedRows: updated.committedRows,
          rows: updated.rows.map((r) => {
            const { rawInput, ...rest } = r as any;
            return rest;
          }),
        };

        const updatedSession = await importSessionClientService.updateCheckpoint(
          currentProjectId,
          activeSessionId,
          {
            lifecycleState: 'REVIEW_REQUIRED',
            currentStage: 'REVIEW',
            reviewSnapshot: cleanSnapshot,
            validationIssues: updated.issues || [],
            warningConfirmation: confirmWarnings,
            reviewAction: { normalizedSourceKey, entityType: entityTypeKey, action: decision as any },
          },
          sessionVersion
        );

        setSessionVersion(updatedSession.version);
      }
    } catch (err: any) {
      if (err?.code === 'VERSION_CONFLICT') {
        setProcessError('تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر حفظ قرار المطابقة');
      } else {
        setProcessError(err?.message || 'فشل في حفظ قرار المطابقة في جلسة الخادم');
      }
    }
  };

  const handleGroupCreateCanonicalEntity = async (
    group: RosterEntityReviewGroup,
    formData: {
      nameAr?: string;
      commercialRegistrationNo?: string;
      transportLicenseNo?: string;
      code?: string;
      driverName?: string;
      residencyId?: string;
      phone?: string;
      plateNumber?: string;
      truckType?: string;
      tareWeightKg?: number;
      maxGrossWeightKg?: number;
    }
  ) => {
    if (!activeBatch || !currentProjectId) return;
    const representativeRowNumber = group.rowNumbers[0];
    const row = activeBatch.rows.find((r) => r.rowNumber === representativeRowNumber);
    if (!row) return;

    setProcessError(null);
    setCreateError(null);
    setIsCreatingEntity(true);

    try {
      let result: NormalizedEntityResolutionResult;
      const resItem = group.currentResolution;
      const sourceVal = resItem?.sourceValue || resItem?.originalValue || group.sourceValue || formData.nameAr || formData.driverName || formData.plateNumber || formData.code || '';

      if (group.entityType === 'carrier') {
        if (!formData.commercialRegistrationNo || !formData.commercialRegistrationNo.trim()) {
          throw new Error('رقم السجل التجاري للناقل مطلوب');
        }
        result = await entityResolutionCommandService.createCarrier({
          projectId: currentProjectId,
          sourceValue: sourceVal,
          carrierData: {
            nameAr: (formData.nameAr && formData.nameAr.trim()) ? formData.nameAr.trim() : sourceVal,
            commercialRegistrationNo: formData.commercialRegistrationNo.trim(),
            ...(formData.transportLicenseNo?.trim() ? { transportLicenseNo: formData.transportLicenseNo.trim() } : {}),
          },
        });
      } else if (group.entityType === 'material') {
        if (!formData.code || !formData.code.trim()) {
          throw new Error('رمز المادة (code) مطلوب');
        }
        result = await entityResolutionCommandService.createMaterial({
          projectId: currentProjectId,
          sourceValue: sourceVal,
          materialData: {
            code: formData.code.trim(),
            nameAr: (formData.nameAr && formData.nameAr.trim()) ? formData.nameAr.trim() : sourceVal,
          },
        });
      } else if (group.entityType === 'driver') {
        let carrierId = row.resolvedValues?.carrierId;
        if (!carrierId) {
          const carrierRes = row.entityResolutions?.carrier;
          if (carrierRes) {
            carrierId = carrierRes.matchedId || carrierRes.entityId;
          }
        }
        if (!carrierId) {
          throw new Error('يجب حسم الناقل أولاً قبل إنشاء السائق');
        }
        if (!formData.residencyId || !formData.residencyId.trim()) {
          throw new Error('رقم الهوية الوطنية أو الإقامة (residencyId) مطلوب');
        }
        result = await entityResolutionCommandService.createDriver({
          projectId: currentProjectId,
          sourceValue: sourceVal,
          driverData: {
            carrierId,
            driverName: (formData.driverName && formData.driverName.trim()) ? formData.driverName.trim() : sourceVal,
            residencyId: formData.residencyId.trim(),
            ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
          },
        });
      } else if (group.entityType === 'truck') {
        let carrierId = row.resolvedValues?.carrierId;
        if (!carrierId) {
          const carrierRes = row.entityResolutions?.carrier;
          if (carrierRes) {
            carrierId = carrierRes.matchedId || carrierRes.entityId;
          }
        }
        if (!carrierId) {
          throw new Error('يجب حسم الناقل أولاً قبل إنشاء الشاحنة');
        }
        if (!formData.plateNumber || !formData.plateNumber.trim()) {
          throw new Error('رقم لوحة الشاحنة (plateNumber) مطلوب');
        }
        result = await entityResolutionCommandService.createTruck({
          projectId: currentProjectId,
          sourceValue: sourceVal,
          truckData: {
            carrierId,
            plateNumber: formData.plateNumber.trim(),
            ...(formData.truckType?.trim() ? { truckType: formData.truckType.trim() } : {}),
            ...(formData.tareWeightKg !== undefined ? { tareWeightKg: formData.tareWeightKg } : {}),
            ...(formData.maxGrossWeightKg !== undefined ? { maxGrossWeightKg: formData.maxGrossWeightKg } : {}),
          },
        });
      } else {
        throw new Error('نوع الكيان غير مدعوم');
      }

      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        activeBatch,
        group.entityType,
        group.normalizedSourceKey,
        result,
        context
      );

      setActiveBatch({ ...updated });
      setActiveCreateGroupKey(null);

      if (currentProjectId && activeSessionId) {
        const cleanSnapshot = {
          totalRows: updated.totalRows,
          validRows: updated.validRows,
          warningRows: updated.warningRows,
          errorRows: updated.errorRows,
          requiresReviewRows: updated.requiresReviewRows,
          committedRows: updated.committedRows,
          rows: updated.rows.map((r) => {
            const { rawInput, ...rest } = r as any;
            return rest;
          }),
        };

        const updatedSession = await importSessionClientService.updateCheckpoint(
          currentProjectId,
          activeSessionId,
          {
            lifecycleState: 'REVIEW_REQUIRED',
            currentStage: 'REVIEW',
            reviewSnapshot: cleanSnapshot,
            validationIssues: updated.issues || [],
            warningConfirmation: confirmWarnings,
            reviewAction: { normalizedSourceKey: group.normalizedSourceKey, entityType: group.entityType, action: 'CREATE_CANONICAL' as any },
          },
          sessionVersion
        );

        setSessionVersion(updatedSession.version);
      }
    } catch (err: any) {
      if (err?.code === 'VERSION_CONFLICT') {
        setCreateError('تعارض في إصدار الجلسة (VERSION_CONFLICT)');
      } else {
        setCreateError(err?.message || 'فشل في إنشاء الكيان وإسقاطه على المجموعة');
      }
    } finally {
      setIsCreatingEntity(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveUserId = authContext?.userId || userId || '';
  const effectiveUserName = authContext?.displayName || userName || '';
  const effectiveRole = authContext?.role || userRole || '';

  const context: PipelineContext = useMemo(() => {
    const opId = activeOperationId || `OP-IMP-${Date.now()}`;
    if (pipelineContext) {
      return {
        ...pipelineContext,
        operationId: opId,
        allowWarningsCommit: confirmWarnings,
      };
    }

    if (canonicalRelationshipContext && canonicalRelationshipContext.projectId) {
      return ImportProjectContextAdapter.createPipelineContext({
        relContext: canonicalRelationshipContext,
        projectId: canonicalRelationshipContext.projectId,
        userId: effectiveUserId,
        userName: effectiveUserName,
        role: effectiveRole,
        operationId: opId,
        allowWarningsCommit: confirmWarnings,
      });
    }

    return {
      projectId: currentProjectId,
      userId: effectiveUserId,
      userName: effectiveUserName,
      role: effectiveRole,
      operationId: opId,
      allowWarningsCommit: confirmWarnings,
      knownEntities: ImportProjectContextAdapter.toPipelineKnownEntities(null),
    };
  }, [pipelineContext, canonicalRelationshipContext, currentProjectId, effectiveUserId, effectiveUserName, effectiveRole, confirmWarnings, activeOperationId]);

  // Resume active import session on mount if locator exists
  useEffect(() => {
    let isMounted = true;

    const resumeSession = async () => {
      if (!currentProjectId) return;
      const locatorKey = `qsaudi_import_session_locator_${currentProjectId}`;
      const rawLocator = sessionStorage.getItem(locatorKey);
      if (!rawLocator) return;

      try {
        const locator = JSON.parse(rawLocator);
        if (!locator || locator.projectId !== currentProjectId || !locator.importSessionId) {
          sessionStorage.removeItem(locatorKey);
          return;
        }

        const sessionRecord = await importSessionClientService.getSession(currentProjectId, locator.importSessionId);
        if (!sessionRecord || sessionRecord.lifecycleState === 'COMMITTED') {
          sessionStorage.removeItem(locatorKey);
          return;
        }

        const resumedState = importSessionClientService.reconstructResumedBatch(sessionRecord);
        if (!isMounted) return;

        setActiveSessionId(sessionRecord.importSessionId);
        setActiveOperationId(sessionRecord.operationId);
        setActiveImportBatchId(sessionRecord.importBatchId);
        setSessionVersion(sessionRecord.version);
        setConfirmWarnings(Boolean(sessionRecord.warningConfirmation));
        setRequiresSourceFileReattach(resumedState.requiresSourceFileReattach);

        if (resumedState.reviewSnapshot) {
          const snapshot = resumedState.reviewSnapshot;
          const rows: ImportRow[] = snapshot.rows || [];
          const issues = sessionRecord.validationIssues || snapshot.issues || [];

          // Derive counts deterministically from rows/snapshot if missing
          const totalRows = snapshot.totalRows ?? rows.length;
          const validRows = snapshot.validRows ?? rows.filter((r) => r.status === 'VALID' || r.reviewStatus === 'accepted').length;
          const warningRows = snapshot.warningRows ?? rows.filter((r) => r.status === 'WARNING' || r.reviewStatus === 'warning').length;
          const errorRows = snapshot.errorRows ?? rows.filter((r) => r.status === 'ERROR' || r.reviewStatus === 'error').length;
          const requiresReviewRows = snapshot.requiresReviewRows ?? rows.filter((r) => r.reviewStatus === 'requires_review').length;
          const committedRows = snapshot.committedRows ?? 0;

          const batch: UnifiedImportBatch = {
            importBatchId: sessionRecord.importBatchId,
            projectId: sessionRecord.projectId,
            source: {
              sourceType: (sessionRecord.sourceType as any) || 'EXCEL_CSV',
              importBatchId: sessionRecord.importBatchId,
              sourceFileName: sessionRecord.sourceMetadata?.sourceFileName || 'resumed_file.xlsx',
              sourceMimeType: sessionRecord.sourceMetadata?.sourceMimeType,
              sourceSheetName: sessionRecord.sourceMetadata?.sourceSheetName,
            },
            currentStage: (sessionRecord.currentStage as any) || 'REVIEW',
            validationStatus: snapshot.validationStatus || 'PASSED',
            commitStatus: sessionRecord.lifecycleState === 'COMMITTED' ? 'COMMITTED' : 'AWAITING_REVIEW',
            totalRows,
            validRows,
            warningRows,
            errorRows,
            requiresReviewRows,
            committedRows,
            rows,
            issues,
            operationId: sessionRecord.operationId,
            createdAt: sessionRecord.createdAt,
            createdBy: sessionRecord.createdBy,
            warningConfirmation: sessionRecord.warningConfirmation !== undefined ? {
              confirmed: Boolean(sessionRecord.warningConfirmation),
              confirmedBy: sessionRecord.createdBy || 'user',
              confirmedAt: sessionRecord.updatedAt || sessionRecord.createdAt,
            } : undefined,
            auditTrail: [
              {
                timestamp: sessionRecord.updatedAt || sessionRecord.createdAt,
                userId: sessionRecord.createdBy || 'system',
                action: 'SESSION_RESUMED',
                details: 'Resumed import session from server persistence',
              },
            ],
          };

          setActiveBatch(batch);

          if (batch.rows.length > 0 && batch.rows[0].raw) {
            const rawHeaders = Object.keys(batch.rows[0].raw).filter((k) => !k.startsWith('_'));
            const mappings = ExcelCsvPipelineService.inspectColumnMappings(rawHeaders);
            setColumnMappings(mappings);
          }
        }
      } catch {
        sessionStorage.removeItem(locatorKey);
      }
    };

    resumeSession();

    return () => {
      isMounted = false;
    };
  }, [currentProjectId]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setProcessError(null);
    setCommitResult(null);
    setActiveBatch(null);
    setConfirmWarnings(false);
    setCustomMappingOverrides({});

    let opId = activeOperationId;
    let batchId = activeImportBatchId;

    // Is this a reattach for an existing resumed session?
    const isReattach = Boolean(requiresSourceFileReattach && activeSessionId && opId && batchId);

    if (!isReattach) {
      // Generate stable identities ONCE for a brand new flow
      const stable = importSessionClientService.generateStableIdentities();
      opId = stable.operationId;
      batchId = stable.importBatchId;
      setActiveOperationId(opId);
      setActiveImportBatchId(batchId);
    }

    let createdSessionId: string | null = activeSessionId;
    let createdVersion = sessionVersion;

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);

      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';

      const importSource: ImportSource = {
        sourceType,
        importBatchId: batchId || `BAT-${Date.now()}`,
        sourceFileName: file.name,
      };

      const discovery = await smartSourceDiscoveryService.discover(importSource, buffer);
      setDiscoveryResult(discovery);

      const sheets = discovery.availableSheets || [];
      const defaultSheet = discovery.selectedSheet || (sheets.length > 0 ? sheets[0] : '');
      const detectedIdx = discovery.detectedHeaderRowIndex || 0;

      setAvailableSheets(sheets);
      setSelectedSheet(defaultSheet);
      setHeaderRowIndex(detectedIdx);

      // Initialize mapping overrides from discovery diagnostics
      const initialMappings: Record<string, keyof CanonicalTripRow | 'unmapped'> = {};
      if (discovery.detectedHeaders) {
        discovery.detectedHeaders.forEach((header) => {
          const match = discovery.mappingDiagnostics?.[header];
          if (match && match.canonicalField && !String(match.canonicalField).startsWith('unmapped_')) {
            initialMappings[header] = match.canonicalField as keyof CanonicalTripRow;
          } else {
            initialMappings[header] = 'unmapped';
          }
        });
      }
      setCustomMappingOverrides(initialMappings);

      // Create server session in DISCOVERY state (DO NOT advance to REVIEW yet)
      if (!isReattach && currentProjectId) {
        try {
          const sessionRecord = await importSessionClientService.createSession(currentProjectId, {
            projectId: currentProjectId,
            operationId: opId || `OP-${Date.now()}`,
            importBatchId: batchId || `BAT-${Date.now()}`,
            sourceType,
            lifecycleState: 'MAPPING_REQUIRED',
            currentStage: 'DISCOVERY',
            sourceMetadata: {
              sourceFileName: file.name,
              sourceMimeType: file.type,
              fileSize: file.size,
              sourceSheetName: defaultSheet,
              headerRowIndex: detectedIdx,
            },
          });

          createdSessionId = sessionRecord.importSessionId;
          createdVersion = sessionRecord.version;

          setActiveSessionId(createdSessionId);
          setSessionVersion(createdVersion);

          sessionStorage.setItem(
            `qsaudi_import_session_locator_${currentProjectId}`,
            JSON.stringify({
              projectId: currentProjectId,
              importSessionId: createdSessionId,
            })
          );
        } catch (err: any) {
          console.warn('Session creation notice:', err);
        }
      }

      setRequiresSourceFileReattach(false);
    } catch (err: any) {
      setProcessError(err?.message || 'حدث خطأ أثناء فحص واستكشاف الملف');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = async (sheet: string) => {
    setSelectedSheet(sheet);
    if (selectedFile && fileBuffer) {
      try {
        setIsProcessing(true);
        const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
        const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
        const importSource: ImportSource = {
          sourceType,
          importBatchId: activeImportBatchId || `BAT-${Date.now()}`,
          sourceFileName: selectedFile.name,
          sourceSheetName: sheet,
        };

        const updatedDiscovery = await smartSourceDiscoveryService.discover(importSource, fileBuffer);
        setDiscoveryResult(updatedDiscovery);
        const detectedIdx = updatedDiscovery.detectedHeaderRowIndex || 0;
        setHeaderRowIndex(detectedIdx);

        // Update proposed mappings from new sheet discovery
        const updatedMappings: Record<string, keyof CanonicalTripRow | 'unmapped'> = {};
        if (updatedDiscovery.detectedHeaders) {
          updatedDiscovery.detectedHeaders.forEach((header) => {
            const match = updatedDiscovery.mappingDiagnostics?.[header];
            if (match && match.canonicalField && !String(match.canonicalField).startsWith('unmapped_')) {
              updatedMappings[header] = match.canonicalField as keyof CanonicalTripRow;
            } else {
              updatedMappings[header] = 'unmapped';
            }
          });
        }
        setCustomMappingOverrides(updatedMappings);
      } catch (err: any) {
        console.error('Sheet change discovery failed:', err);
        setProcessError(err?.message || 'فشل في استكشاف ورقة العمل المحددة');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleHeaderRowIndexChange = async (index: number) => {
    setHeaderRowIndex(index);
    if (selectedFile && fileBuffer) {
      try {
        // Inspect headers at specified row index
        let headers: string[] = [];
        try {
          const wb = XLSX.read(fileBuffer, { type: 'array' });
          const targetSheetName = selectedSheet || wb.SheetNames[0];
          const sheet = wb.Sheets[targetSheetName];
          if (sheet) {
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows && rows[index]) {
              headers = rows[index].map((h: any) => String(h || '').trim()).filter(Boolean);
            }
          }
        } catch {}

        if (headers.length > 0) {
          const diags = ExcelCsvPipelineService.inspectColumnMappings(headers);
          setDiscoveryResult((prev: any) => prev ? { ...prev, detectedHeaderRowIndex: index, detectedHeaders: headers, mappingDiagnostics: diags } : null);
          const newMappings: Record<string, keyof CanonicalTripRow | 'unmapped'> = {};
          headers.forEach((h) => {
            const match = diags[h];
            if (match && match.canonicalField && !String(match.canonicalField).startsWith('unmapped_')) {
              newMappings[h] = match.canonicalField as keyof CanonicalTripRow;
            } else {
              newMappings[h] = 'unmapped';
            }
          });
          setCustomMappingOverrides(newMappings);
        }
      } catch (err: any) {
        console.warn('Header row change error:', err);
      }
    }
  };

  const handleMappingOverrideChange = (header: string, targetField: string) => {
    setCustomMappingOverrides((prev) => ({
      ...prev,
      [header]: targetField as keyof CanonicalTripRow | 'unmapped',
    }));
  };

  const handleApproveAndStartPipeline = async () => {
    if (!selectedFile || !fileBuffer) return;
    try {
      setIsProcessing(true);
      setProcessError(null);

      // Build approved customMappings record
      const approvedMappings: Record<string, keyof CanonicalTripRow> = {};
      Object.entries(customMappingOverrides).forEach(([header, target]) => {
        if (target && target !== 'unmapped' && !String(target).startsWith('unmapped_')) {
          approvedMappings[header] = target as keyof CanonicalTripRow;
        }
      });

      const opId = activeOperationId || `OP-IMP-${Date.now()}`;
      const batchId = activeImportBatchId || `BAT-${Date.now()}`;

      const activeContext: PipelineContext = {
        ...context,
        operationId: opId,
      };

      const batch = await ExcelCsvPipelineService.processFileToReview(
        fileBuffer,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type,
        activeContext,
        {
          sheetName: selectedSheet,
          headerRowIndex,
          customMappings: approvedMappings,
          importBatchId: batchId,
        }
      );

      setActiveBatch(batch);

      // Inspect column mappings
      if (batch.rows.length > 0 && batch.rows[0].raw) {
        const rawHeaders = Object.keys(batch.rows[0].raw).filter((k) => !k.startsWith('_'));
        const mappings = ExcelCsvPipelineService.inspectColumnMappings(rawHeaders);
        setColumnMappings(mappings);
      }

      // Save REVIEW checkpoint to server session
      if (currentProjectId && activeSessionId) {
        try {
          const cleanSnapshot = {
            totalRows: batch.totalRows,
            validRows: batch.validRows,
            warningRows: batch.warningRows,
            errorRows: batch.errorRows,
            requiresReviewRows: batch.requiresReviewRows,
            committedRows: batch.committedRows,
            rows: batch.rows.map((r) => {
              const { rawInput, ...rest } = r as any;
              return rest;
            }),
          };

          const updatedSession = await importSessionClientService.updateCheckpoint(
            currentProjectId,
            activeSessionId,
            {
              lifecycleState: 'REVIEW_REQUIRED',
              currentStage: 'REVIEW',
              reviewSnapshot: cleanSnapshot,
              validationIssues: batch.issues || [],
              warningConfirmation: confirmWarnings,
              sourceMetadata: {
                sourceFileName: selectedFile.name,
                sourceMimeType: selectedFile.type,
                fileSize: selectedFile.size,
                sourceSheetName: selectedSheet,
                headerRowIndex,
                customMappings: approvedMappings,
              },
            },
            sessionVersion
          );

          setSessionVersion(updatedSession.version);
        } catch (err: any) {
          if (err?.code === 'VERSION_CONFLICT') {
            setProcessError('تعارض في إصدار الجلسة (VERSION_CONFLICT): يرجى تحديث الصفحة');
          } else {
            console.warn('Failed to update session checkpoint:', err);
          }
        }
      }
    } catch (err: any) {
      setProcessError(err?.message || 'فشل في تحليل ومعالجة ملف الاستيراد');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRowAction = async (rowNumber: number, action: 'ACCEPT_WARNING' | 'REJECT_ROW') => {
    if (!activeBatch) return;
    const updated = ExcelCsvPipelineService.applyRowReview(
      activeBatch,
      rowNumber,
      action,
      context,
      action === 'ACCEPT_WARNING' ? 'تمت الموافقة اليدوية على التنبيه' : 'تم استبعاد الصف يدوياً'
    );
    setActiveBatch({ ...updated });

    if (currentProjectId && activeSessionId) {
      try {
        const cleanSnapshot = {
          totalRows: updated.totalRows,
          validRows: updated.validRows,
          warningRows: updated.warningRows,
          errorRows: updated.errorRows,
          requiresReviewRows: updated.requiresReviewRows,
          committedRows: updated.committedRows,
          rows: updated.rows.map((r) => {
            const { rawInput, ...rest } = r as any;
            return rest;
          }),
        };

        const updatedSession = await importSessionClientService.updateCheckpoint(
          currentProjectId,
          activeSessionId,
          {
            lifecycleState: 'REVIEW_REQUIRED',
            currentStage: 'REVIEW',
            reviewSnapshot: cleanSnapshot,
            validationIssues: updated.issues || [],
            warningConfirmation: confirmWarnings,
            reviewAction: { rowNumber, action },
          },
          sessionVersion
        );

        setSessionVersion(updatedSession.version);
      } catch (err: any) {
        if (err?.code === 'VERSION_CONFLICT') {
          setProcessError('تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر حفظ إجراء المراجعة');
        } else {
          setProcessError(err?.message || 'فشل في حفظ إجراء المراجعة في جلسة الخادم');
        }
      }
    }
  };

  const handleConfirmWarningsChange = async (checked: boolean) => {
    setConfirmWarnings(checked);
    if (currentProjectId && activeSessionId) {
      try {
        const updatedSession = await importSessionClientService.updateCheckpoint(
          currentProjectId,
          activeSessionId,
          {
            warningConfirmation: checked,
          },
          sessionVersion
        );
        setSessionVersion(updatedSession.version);
      } catch (err: any) {
        if (err?.code === 'VERSION_CONFLICT') {
          setProcessError('تعارض في إصدار الجلسة (VERSION_CONFLICT)');
        } else {
          console.warn('Failed to update warning confirmation:', err);
        }
      }
    }
  };

  const handleCommit = async () => {
    if (!activeBatch) return;
    try {
      setIsCommitting(true);
      setProcessError(null);

      const updatedContext = {
        ...context,
        allowWarningsCommit: confirmWarnings,
      };

      const { batch, result } = await ExcelCsvPipelineService.commitBatch(activeBatch, updatedContext);
      setActiveBatch({ ...batch });
      setCommitResult(result);

      if (result.success) {
        if (currentProjectId && activeSessionId) {
          try {
            const updatedSession = await importSessionClientService.updateCheckpoint(
              currentProjectId,
              activeSessionId,
              {
                lifecycleState: 'COMMITTED',
                currentStage: 'COMMITTED',
              },
              sessionVersion
            );
            setSessionVersion(updatedSession.version);
            sessionStorage.removeItem(`qsaudi_import_session_locator_${currentProjectId}`);
          } catch {
            // Commit succeeded on business domain; ignore session close error
          }
        }

        if (onCommitSuccess) {
          onCommitSuccess(result);
        }
      } else if (result.error) {
        setProcessError(result.error);
      }
    } catch (err: any) {
      setProcessError(err?.message || 'فشل في تنفيذ الاعتماد وحفظ الشحنات');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    if (currentProjectId) {
      sessionStorage.removeItem(`qsaudi_import_session_locator_${currentProjectId}`);
    }
    setSelectedFile(null);
    setFileBuffer(null);
    setAvailableSheets([]);
    setSelectedSheet('');
    setDiscoveryResult(null);
    setHeaderRowIndex(0);
    setShowManualOverrides(false);
    setCustomMappingOverrides({});
    setActiveBatch(null);
    setColumnMappings({});
    setProcessError(null);
    setCommitResult(null);
    setConfirmWarnings(false);
    setActiveSessionId(null);
    setActiveOperationId(null);
    setActiveImportBatchId(null);
    setSessionVersion(0);
    setRequiresSourceFileReattach(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered rows for review table
  const displayedRows = activeBatch?.rows.filter((row) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'VALID') return row.status === 'VALID' || row.reviewStatus === 'accepted';
    if (filterStatus === 'WARNING') return row.status === 'WARNING' || row.reviewStatus === 'warning';
    if (filterStatus === 'ERROR') return row.status === 'ERROR' || row.reviewStatus === 'error';
    if (filterStatus === 'REQUIRES_REVIEW') return row.reviewStatus === 'requires_review';
    return true;
  }) || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Reattach Source File Banner */}
      {requiresSourceFileReattach && !fileBuffer && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>تم استئناف جلسة المراجعة المحفوظة. يُرجى إعادة ربط ملف المصدر الأصلي لتسهيل إعادة التحليل عند الحاجة.</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            إعادة ربط الملف
          </button>
        </div>
      )}

      {/* 1. File Intake & Selection Header */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-stone-900">
                  استيراد ملفات Excel و CSV (BLOCK 31)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                  Unified Pipeline Integrated
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  Weighbridge Compatible
                </span>
                {activeSessionId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 font-mono">
                    Session Active ({sessionVersion})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                استقبال ومعالجة ملفات جداول البيانات (.xlsx, .xls, .csv) بالاعتماد المباشر على معمارية الاستيراد الموحد (المراحل العشر) دون كتابة مسبقة في Firestore.
              </p>
            </div>
          </div>

          {(selectedFile || activeBatch) && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة تعيين / ملف جديد</span>
              </button>
            </div>
          )}
        </div>

        {/* Drag & Drop Zone */}
        {!selectedFile && !activeBatch && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-stone-200 text-stone-400 group-hover:text-emerald-600 group-hover:border-emerald-300 flex items-center justify-center transition-all shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              انقر لاختيار ملف إكسل أو CSV أو اسحبه وأفلته هنا
            </h3>
            <p className="text-xs text-stone-500 mb-4 max-w-md mx-auto">
              الصيغ المدعومة: <span className="font-mono font-bold text-stone-700">.xlsx</span>,{' '}
              <span className="font-mono font-bold text-stone-700">.xls</span>,{' '}
              <span className="font-mono font-bold text-stone-700">.csv</span> (بحد أقصى 25 ميغابايت)
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs">
              <span>تحديد ملف من الجهاز</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </div>
          </div>
        )}

        {/* Selected File Details Banner */}
        {selectedFile && (
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900">{selectedFile.name}</div>
                <div className="text-xs text-stone-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB | {selectedFile.name.endsWith('.csv') ? 'CSV File' : 'Excel Workbook'}
                </div>
              </div>
            </div>

            {activeBatch && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBatch(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  تعديل ربط الأعمدة (Reconfigure Mapping)
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Discovery & Column Mapping Approval Gate */}
        {selectedFile && discoveryResult && !activeBatch && (
          <div className="mt-6 p-6 rounded-2xl bg-stone-50/70 border border-stone-200/90 text-right space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-700 text-white font-mono">
                    الخطوة 2
                  </span>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <span>فهم وربط أعمدة البيانات (Column Mapping Review)</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  راجع مطابقة أعمدة الملف المصدر مع الحقول القياسية للنظام، وقم بتعديل أي حقل يدويّاً قبل بدء معالجة الشحنات.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-stone-500">مستوى الثقة في الاستكشاف:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                  discoveryResult.confidence >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : discoveryResult.confidence >= 60
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {discoveryResult.confidence}%
                </span>
              </div>
            </div>

            {/* Scope & Sheet Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-stone-200 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-stone-500 block">نوع الملف</span>
                <span className="font-mono font-black text-stone-800 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 inline-block">
                  {discoveryResult.sourceType}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-stone-500 block">ورقة العمل (Sheet)</span>
                {availableSheets.length > 1 ? (
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full px-2.5 py-1 rounded font-bold bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  >
                    {availableSheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-stone-800 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 inline-block">
                    {selectedSheet || 'ورقة العمل الأولى'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-stone-500 block">صف الترويسة (Header Row)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-700">الصف:</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={headerRowIndex}
                    onChange={(e) => handleHeaderRowIndexChange(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center font-mono font-bold bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                  <span className="text-[11px] text-stone-400 font-mono">(0-based index)</span>
                </div>
              </div>
            </div>

            {/* Column Mapping Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>جدول ربط الأعمدة المكتشفة ({discoveryResult.detectedHeaders?.length || 0} عمود)</span>
                </h4>
                <span className="text-[11px] text-stone-500">
                  يمكنك تغيير تعيين أي عمود أو اختيار "تجاهل هذا العمود"
                </span>
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center font-mono">#</th>
                      <th className="p-3">اسم العمود في ملف المصدر</th>
                      <th className="p-3">حقل النظام المعتمد (Canonical Target Field)</th>
                      <th className="p-3 text-center">حالة الربط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(discoveryResult.detectedHeaders || []).map((header: string, idx: number) => {
                      const match = discoveryResult.mappingDiagnostics?.[header];
                      const currentVal = customMappingOverrides[header] || 'unmapped';
                      const isMapped = currentVal !== 'unmapped' && !String(currentVal).startsWith('unmapped_');
                      const confidencePercent = match ? Math.round(match.confidence * 100) : 0;

                      return (
                        <tr key={header} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3 text-center font-mono text-stone-400 font-bold">
                            {idx + 1}
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-stone-900 font-mono text-xs">
                              {header}
                            </div>
                            {match && match.matchedBy && (
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                كشف آلي ({match.matchedBy}) | ثقة: {confidencePercent}%
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <select
                              value={currentVal}
                              onChange={(e) => handleMappingOverrideChange(header, e.target.value)}
                              className={`w-full max-w-sm px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                                isMapped
                                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-stone-50 border-stone-300 text-stone-600'
                              }`}
                            >
                              {CANONICAL_FIELD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.labelAr}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 text-center">
                            {isMapped ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>مربوط</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500">
                                <span>مستبعد / غير مربوط</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Gate Primary CTA */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-stone-500">
                عند النقر على اعتماد الربط، سيبدأ النظام في تحليل وتدقيق كافة الصفوف وإجراء المطابقة الذكية.
              </div>

              <button
                onClick={handleApproveAndStartPipeline}
                disabled={isProcessing}
                className={`px-8 py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 ${
                  isProcessing
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تحليل ومعالجة البيانات...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>اعتماد الربط وبدء تحليل البيانات</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Errors Display */}
        {processError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{processError}</span>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-6 p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-900">جاري تحليل ومعالجة ملف الاستيراد عبر المراحل العشر...</div>
            <div className="text-xs text-stone-500 mt-1">يتم الفحص والتطابق الذكي في الذاكرة دون حفظ مسبق</div>
          </div>
        )}
      </div>

      {/* 2. Review & Resolution Stage */}
      {activeBatch && !isProcessing && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-xs font-bold text-stone-500 mb-1">إجمالي الصفوف</div>
              <div className="text-lg font-black text-stone-900 font-mono">{activeBatch.totalRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="text-xs font-bold text-emerald-700 mb-1">صفوف سليمة</div>
              <div className="text-lg font-black text-emerald-800 font-mono">{activeBatch.validRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="text-xs font-bold text-amber-700 mb-1">صفوف تتضمن تنبيهات</div>
              <div className="text-lg font-black text-amber-800 font-mono">{activeBatch.warningRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80">
              <div className="text-xs font-bold text-rose-700 mb-1">صفوف تتضمن أخطاء</div>
              <div className="text-lg font-black text-rose-800 font-mono">{activeBatch.errorRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 col-span-2 sm:col-span-1">
              <div className="text-xs font-bold text-blue-700 mb-1">تتطلب مراجعة</div>
              <div className="text-lg font-black text-blue-800 font-mono">{activeBatch.requiresReviewRows}</div>
            </div>
          </div>

          {/* STEP 5: Grouped Entity Review Workspace */}
          <div className="p-6 rounded-2xl bg-stone-50/80 border border-stone-200/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-700 text-white font-mono">
                    الخطوة 5
                  </span>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span>مساحة مراجعة ومطابقة الكيانات (Entity Review Workspace)</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  حسم وتأكيد مطابقة الكيانات المجمعة (الناقلون، المواد، السائقون، الشاحنات) قبل معالجة استثناءات الصفوف الفردية.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {unresolvedGroups.length > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>توجد ({unresolvedGroups.length}) مجموعات معلقة</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم حسم مطابقة الكيانات — الانتقال إلى مراجعة الصفوف</span>
                  </span>
                )}
              </div>
            </div>

            {/* Category Navigation Tabs */}
            {(() => {
              const categories: Array<{
                key: 'carrier' | 'material' | 'driver' | 'truck';
                titleAr: string;
                titleEn: string;
                groups: RosterEntityReviewGroup[];
              }> = [
                { key: 'carrier', titleAr: '1. الناقلون', titleEn: 'Carriers', groups: reviewGroups.carrier },
                { key: 'material', titleAr: '2. المواد والأصناف', titleEn: 'Materials', groups: reviewGroups.material },
                { key: 'driver', titleAr: '3. السائقون', titleEn: 'Drivers', groups: reviewGroups.driver },
                { key: 'truck', titleAr: '4. الشاحنات والمركبات', titleEn: 'Trucks', groups: reviewGroups.truck },
              ];

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {categories.map((cat) => {
                      const pendingCount = cat.groups.filter(
                        (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
                      ).length;
                      const isActive = activeCategoryTab === cat.key;

                      return (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategoryTab(cat.key)}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isActive
                              ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600'
                              : 'bg-white/60 hover:bg-white border-stone-200 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900">{cat.titleAr}</span>
                            {pendingCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                                {pendingCount} معلق
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                مكتمل
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono">
                            {cat.groups.length} مجموعات ({cat.groups.reduce((acc, g) => acc + g.occurrenceCount, 0)} صف)
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Category Groups Panel */}
                  {(() => {
                    const currentCat = categories.find((c) => c.key === activeCategoryTab) || categories[0];
                    const groups = currentCat.groups;

                    const autoCount = groups.filter((g) => g.status === 'AUTO_RESOLVED').length;
                    const reviewCount = groups.filter((g) => g.status === 'REVIEW_REQUIRED').length;
                    const unresolvedCount = groups.filter((g) => g.status === 'UNRESOLVED').length;
                    const conflictCount = groups.filter((g) => g.status === 'CONFLICT').length;

                    return (
                      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                        {/* Category Stats Summary */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-100 pb-3">
                          <div className="font-bold text-stone-800">
                            مجموعات {currentCat.titleAr} ({groups.length} مجموعة فريدة)
                          </div>
                          <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              مطابقة تلقائية: {autoCount}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              تتطلب مراجعة: {reviewCount}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              غير مطابقة: {unresolvedCount}
                            </span>
                            {conflictCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                                تعارض: {conflictCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Group Cards List */}
                        {groups.length === 0 ? (
                          <div className="p-6 text-center text-stone-400 text-xs font-bold">
                            لا توجد أي بيانات خاصة بفئة {currentCat.titleAr} في الملف المصدر
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {groups.map((group) => {
                              const isAuto = group.status === 'AUTO_RESOLVED';
                              const isReview = group.status === 'REVIEW_REQUIRED';
                              const isUnresolved = group.status === 'UNRESOLVED';
                              const isConflict = group.status === 'CONFLICT';
                              const isCreateOpen = activeCreateGroupKey === group.normalizedSourceKey;

                              const repRowNumber = group.rowNumbers[0];
                              const repRow = activeBatch.rows.find((r) => r.rowNumber === repRowNumber);
                              const carrierRes = repRow?.entityResolutions?.carrier;
                              const resolvedCarrierId = repRow?.resolvedValues?.carrierId || carrierRes?.matchedId;
                              const isCarrierBlocked =
                                (group.entityType === 'driver' || group.entityType === 'truck') && !resolvedCarrierId;

                              return (
                                <div
                                  key={group.normalizedSourceKey}
                                  className={`p-4 rounded-xl border transition-all ${
                                    isAuto
                                      ? 'bg-emerald-50/30 border-emerald-200/70'
                                      : isConflict
                                      ? 'bg-rose-50/40 border-rose-200'
                                      : isReview
                                      ? 'bg-amber-50/40 border-amber-200'
                                      : 'bg-stone-50 border-stone-200'
                                  }`}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-sm text-stone-900 font-mono">
                                          {group.sourceValue}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-200/80 text-stone-700">
                                          تكرار: {group.occurrenceCount} صفوف ({group.rowNumbers.slice(0, 3).join(', ')}
                                          {group.rowNumbers.length > 3 ? '...' : ''})
                                        </span>
                                        {isAuto && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                            <Check className="w-3 h-3 text-emerald-600" /> مطابقة تلقائية مؤكدة
                                          </span>
                                        )}
                                        {isReview && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3 text-amber-600" /> مقترح يتطلب مراجعة
                                          </span>
                                        )}
                                        {isUnresolved && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700 inline-flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3 text-stone-500" /> غير مطابق
                                          </span>
                                        )}
                                        {isConflict && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                            <XCircle className="w-3 h-3 text-rose-600" /> تعارض في العلاقات
                                          </span>
                                        )}
                                      </div>

                                      {/* Match Details */}
                                      <div className="text-xs text-stone-600">
                                        {group.matchedName || group.matchedId ? (
                                          <div className="flex items-center gap-2 flex-wrap mt-1">
                                            <span className="font-bold text-stone-800">
                                              الكيان المعتمد المطابق:
                                            </span>
                                            <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                                              {group.matchedName || group.matchedId}
                                            </span>
                                            {group.currentResolution?.confidence !== undefined && (
                                              <span className="text-[11px] text-stone-400 font-mono">
                                                (ثقة: {Math.round((group.currentResolution.confidence ?? 1) * 100)}%)
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-stone-500 mt-1">
                                            لم يتم العثور على مطابقة تلقائية مؤكدة في قاعدة بيانات المشروع.
                                          </div>
                                        )}

                                        {group.relationshipStatus && group.relationshipStatus !== 'VALID' && (
                                          <div className="text-rose-700 font-bold text-[11px] mt-1">
                                            حالة العلاقة: {group.relationshipStatus}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                                      {/* Accept Suggestion (Review Required) */}
                                      {isReview && group.matchedId && (
                                        <button
                                          onClick={() =>
                                            handleGroupResolutionDecision(
                                              group.entityType,
                                              group.normalizedSourceKey,
                                              'ACCEPT_CANDIDATE',
                                              { selectedEntityId: group.matchedId, selectedDisplayName: group.matchedName }
                                            )
                                          }
                                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>قبول المقترح</span>
                                        </button>
                                      )}

                                      {/* Select Alternate Candidate */}
                                      {group.candidates && group.candidates.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <select
                                            value={
                                              selectedAlternateCandidates[group.normalizedSourceKey] ||
                                              group.candidates[0]?.entityId ||
                                              group.candidates[0]?.id ||
                                              ''
                                            }
                                            onChange={(e) =>
                                              setSelectedAlternateCandidates((prev) => ({
                                                ...prev,
                                                [group.normalizedSourceKey]: e.target.value,
                                              }))
                                            }
                                            className="px-2 py-1 rounded-lg border border-stone-300 text-xs bg-white text-stone-800 font-bold max-w-[140px]"
                                          >
                                            {group.candidates.map((c) => (
                                              <option key={c.entityId || c.id} value={c.entityId || c.id}>
                                                {c.displayName || c.name || c.entityId || c.id}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => {
                                              const candId =
                                                selectedAlternateCandidates[group.normalizedSourceKey] ||
                                                group.candidates[0]?.entityId ||
                                                group.candidates[0]?.id;
                                              const cand = group.candidates.find(
                                                (c) => (c.entityId || c.id) === candId
                                              );
                                              handleGroupResolutionDecision(
                                                group.entityType,
                                                group.normalizedSourceKey,
                                                'SELECT_ALTERNATE',
                                                { selectedEntityId: candId, selectedDisplayName: cand?.displayName || cand?.name }
                                              );
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                                          >
                                            اختيار بديل
                                          </button>
                                        </div>
                                      )}

                                      {/* Create Canonical Entity Button */}
                                      {!isAuto && (
                                        <button
                                          onClick={() => handleOpenCreateForm(group)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border ${
                                            isCreateOpen
                                              ? 'bg-stone-900 text-white border-stone-900'
                                              : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
                                          }`}
                                        >
                                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>إنشاء كيان جديد</span>
                                        </button>
                                      )}

                                      {/* Leave Unresolved Button */}
                                      {!isAuto && (
                                        <button
                                          onClick={() =>
                                            handleGroupResolutionDecision(
                                              group.entityType,
                                              group.normalizedSourceKey,
                                              'LEAVE_UNRESOLVED'
                                            )
                                          }
                                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                          ترك بدون حسم
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Creation Form Panel */}
                                  {isCreateOpen && (
                                    <div className="mt-4 pt-4 border-t border-stone-200/80 bg-white p-4 rounded-xl space-y-4 shadow-2xs">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                                          <span>إنشاء كيان معتمد جديد في المشروع ({group.entityType})</span>
                                        </h5>
                                        <button
                                          onClick={() => setActiveCreateGroupKey(null)}
                                          className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                                        >
                                          إلغاء
                                        </button>
                                      </div>

                                      {isCarrierBlocked ? (
                                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                          <span>
                                            يجب حسم مطابقة الناقل أولاً قبل إنشاء{' '}
                                            {group.entityType === 'driver' ? 'السائق' : 'الشاحنة'}. يُرجى تأكيد الناقل
                                            في تبويب الناقلين أولاً.
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                          {group.entityType === 'carrier' && (
                                            <>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">اسم الناقل (بالعربية)</label>
                                                <input
                                                  type="text"
                                                  value={createFormData.nameAr ?? group.sourceValue}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, nameAr: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">
                                                  رقم السجل التجاري <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  placeholder="مثال: 1010123456"
                                                  value={createFormData.commercialRegistrationNo || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({
                                                      ...prev,
                                                      commercialRegistrationNo: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">ترخيص هيئة النقل (اختياري)</label>
                                                <input
                                                  type="text"
                                                  placeholder="اختياري"
                                                  value={createFormData.transportLicenseNo || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({
                                                      ...prev,
                                                      transportLicenseNo: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                            </>
                                          )}

                                          {group.entityType === 'material' && (
                                            <>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">اسم المادة / الصنف</label>
                                                <input
                                                  type="text"
                                                  value={createFormData.nameAr ?? group.sourceValue}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, nameAr: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">
                                                  رمز المادة (code) <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  placeholder="مثال: MAT-AGG-20"
                                                  value={createFormData.code || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, code: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                            </>
                                          )}

                                          {group.entityType === 'driver' && (
                                            <>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">اسم السائق</label>
                                                <input
                                                  type="text"
                                                  value={createFormData.driverName ?? group.sourceValue}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, driverName: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">
                                                  رقم الهوية / الإقامة <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  placeholder="مثال: 2412345678"
                                                  value={createFormData.residencyId || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({
                                                      ...prev,
                                                      residencyId: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">رقم الجوال (اختياري)</label>
                                                <input
                                                  type="text"
                                                  placeholder="05xxxxxxxx"
                                                  value={createFormData.phone || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, phone: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                            </>
                                          )}

                                          {group.entityType === 'truck' && (
                                            <>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">
                                                  رقم اللوحة <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  value={createFormData.plateNumber ?? group.sourceValue}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({
                                                      ...prev,
                                                      plateNumber: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">نوع الشاحنة (اختياري)</label>
                                                <input
                                                  type="text"
                                                  placeholder="مثال: قلاب ثلاثي"
                                                  value={createFormData.truckType || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({ ...prev, truckType: e.target.value }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-900"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="font-bold text-stone-700 block">الوزن الفارغ كجم (اختياري)</label>
                                                <input
                                                  type="number"
                                                  placeholder="مثال: 14500"
                                                  value={createFormData.tareWeightKg || ''}
                                                  onChange={(e) =>
                                                    setCreateFormData((prev) => ({
                                                      ...prev,
                                                      tareWeightKg: parseFloat(e.target.value) || undefined,
                                                    }))
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold text-stone-900"
                                                />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}

                                      {createError && (
                                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                                          {createError}
                                        </div>
                                      )}

                                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                                        <button
                                          onClick={() => setActiveCreateGroupKey(null)}
                                          className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                                        >
                                          إلغاء
                                        </button>
                                        <button
                                          onClick={() => handleGroupCreateCanonicalEntity(group, createFormData)}
                                          disabled={isCreatingEntity || isCarrierBlocked}
                                          className={`px-4 py-1.5 rounded-lg text-xs font-black text-white flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                            isCreatingEntity || isCarrierBlocked
                                              ? 'bg-stone-300 cursor-not-allowed'
                                              : 'bg-emerald-600 hover:bg-emerald-700'
                                          }`}
                                        >
                                          {isCreatingEntity ? (
                                            <>
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                              <span>جاري إنشاء الكيان...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              <span>حفظ وإنشاء الكيان وإسقاطه على الدفعة</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          {/* Gate Banner between Entity Review and Row Review */}
          {unresolvedGroups.length > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  مراجعة الصفوف والاستثناءات (طابور الاستثناءات) مقفلة مؤقتاً حتى اكتمال حسم مطابقة الكيانات أعلاه (
                  {unresolvedGroups.length} مجموعات معلقة تتطلب اتخاذ قرار).
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم حسم مطابقة الكيانات — الانتقال إلى مراجعة الصفوف والاستثناءات</span>
            </div>
          )}

          {/* True Exception Queue Section */}
          <div className={`p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4 ${unresolvedGroups.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
              <div>
                <h3 className="text-base font-black text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>طابور الاستثناءات الفعلي (True Exception Queue)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200 text-amber-900">
                    {rowExceptions.length} استثناء
                  </span>
                </h3>
                <p className="text-xs text-amber-800/80 mt-1">
                  يعرض فقط الصفوف المعلقة التي تتطلب اتخاذ قرار أو معالجة (أخطاء، تنبيهات معلقة، أو بيانات مكررة).
                </p>
              </div>
            </div>

            {rowExceptions.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>ممتاز! لا توجد أي صفوف استثنائية معلقة. جميع الصفوف إما سليمة، تم قبول تنبيهاتها، أو تم استبعادها رسمياً.</span>
              </div>
            ) : (
              <div className="overflow-x-auto border border-amber-200/80 rounded-xl bg-white">
                <table className="w-full text-right text-xs">
                  <thead className="bg-amber-100/50 border-b border-amber-200 text-amber-950 font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">نوع الاستثناء</th>
                      <th className="p-3">بيانات الشحنة التعريفية</th>
                      <th className="p-3">أسباب الاستثناء والملاحظات</th>
                      <th className="p-3 text-center">الإجراءات المتاحة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {rowExceptions.map((row: ImportRow) => {
                      const canonical = (row as any).normalized?.canonicalData || row.canonical || {};
                      const hasBlocking = row.validationIssues?.some((i) => i.severity === 'BLOCKING' || i.blocking);
                      const isError = row.status === 'ERROR' || row.reviewStatus === 'error';
                      const isWarning = row.status === 'WARNING' || row.reviewStatus === 'requires_review';
                      const isDuplicate = Boolean(row.duplicateInfo?.isDuplicate);

                      return (
                        <tr key={row.rowNumber} className="hover:bg-amber-50/50 transition-colors">
                          <td className="p-3 text-center font-mono font-bold text-stone-700">
                            {row.rowNumber}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-col gap-1 items-start">
                              {hasBlocking || isError ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-600" /> خطأ مانع
                                </span>
                              ) : isDuplicate ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-blue-600" /> صف مكرر
                                </span>
                              ) : isWarning ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> تنبيه يتطلب مراجعة
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-stone-900">
                              {canonical.carrierName || canonical.carrier || 'ناقل غير محدد'} | {canonical.materialName || canonical.materialType || 'مادة غير محددة'}
                            </div>
                            <div className="text-[11px] text-stone-600 mt-0.5 font-mono">
                              تاريخ: {canonical.tripDate || '—'} | اللوحة: {canonical.plateNumber || canonical.truckNo || '—'} | السائق: {canonical.driverName || '—'}
                            </div>
                          </td>

                          <td className="p-3 max-w-md">
                            {row.validationIssues && row.validationIssues.length > 0 ? (
                              <div className="text-rose-800 text-[11px] font-bold space-y-0.5">
                                {row.validationIssues.map((e, idx) => (
                                  <div key={idx}>• {e.messageAr || e.message}</div>
                                ))}
                              </div>
                            ) : isDuplicate ? (
                              <div className="text-blue-800 text-[11px] font-bold">
                                {row.duplicateInfo?.reason || 'تم اكتشاف تكرار لبيانات هذه الشحنة'}
                              </div>
                            ) : (
                              <span className="text-stone-500 text-[11px]">يتطلب اتخاذ قرار مراجعة</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!hasBlocking && !isError && (
                                <button
                                  onClick={() => handleRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="قبول التنبيه واعتماد الصف"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>قبول التنبيه</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleRowAction(row.rowNumber, 'REJECT_ROW')}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="استبعاد الصف"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span>استبعاد</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Collapsible Full Batch Reference Table Control */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFullBatchTable(!showFullBatchTable)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-stone-600" />
                <span>
                  {showFullBatchTable
                    ? 'إخفاء جدول مرجع جميع الصفوف'
                    : `عرض جميع صفوف الدفعة الكاملة (Full Batch Reference Table - ${activeBatch.rows.length} صف)`}
                </span>
              </button>
            </div>

            {showFullBatchTable && (
              <div className="mt-4 space-y-4">
                {/* Table Toolbar & Filtering */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-stone-400 shrink-0" />
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                الكل ({activeBatch.rows.length})
              </button>

              <button
                onClick={() => setFilterStatus('VALID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === 'VALID' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                سليمة ({activeBatch.validRows})
              </button>

              <button
                onClick={() => setFilterStatus('WARNING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === 'WARNING' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                تنبيهات ({activeBatch.warningRows})
              </button>

              <button
                onClick={() => setFilterStatus('ERROR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ERROR' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                أخطاء ({activeBatch.errorRows})
              </button>

              <button
                onClick={() => setFilterStatus('REQUIRES_REVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === 'REQUIRES_REVIEW' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                تتطلب مراجعة ({activeBatch.requiresReviewRows})
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowMappingDrawer(!showMappingDrawer)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>تكتيكات الربط والتطابق</span>
              </button>
            </div>
          </div>

          {/* Mapped Headers Drawer */}
          {showMappingDrawer && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 space-y-3">
              <div className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-2">
                تطابق الأعمدة المكتشفة مع حقول الشحنات القانونية (Canonical Trip Schema Mappings)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                {Object.entries(columnMappings).map(([rawHeader, match]) => (
                  <div key={rawHeader} className="p-2 rounded-lg bg-white border border-stone-200/80 shadow-2xs">
                    <div className="text-[10px] text-stone-500 font-bold truncate">{rawHeader}</div>
                    <div className="font-mono text-xs font-bold text-emerald-800 truncate mt-0.5">
                      {match.canonicalField}
                    </div>
                    <div className="text-[9px] text-stone-400 mt-0.5 font-mono">
                      ثقة التطابق: {(match.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Rows Table */}
          <div className="overflow-x-auto border border-stone-200/80 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">حالة الصف</th>
                  <th className="p-3">تاريخ الشحنة</th>
                  <th className="p-3">السائق الهوية</th>
                  <th className="p-3">الشاحنة / اللوحة</th>
                  <th className="p-3">الناقل / المقاول</th>
                  <th className="p-3">المادة / الحمولة</th>
                  <th className="p-3 text-center">الوزن القائم (كجم)</th>
                  <th className="p-3 text-center">الوزن فارغ (كجم)</th>
                  <th className="p-3 text-center">الوزن الصافي (كجم)</th>
                  <th className="p-3">ملاحظات والتنبيهات</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-stone-500 font-bold">
                      لا توجد صفوف تطابق الفلتر المحدد
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row: ImportRow) => {
                    const canonical = (row as any).normalized?.canonicalData || row.canonical || {};
                    const isError = row.status === 'ERROR' || row.reviewStatus === 'error';
                    const isWarning = row.status === 'WARNING' || row.reviewStatus === 'warning';
                    const isAccepted = row.reviewStatus === 'accepted';
                    const isRejected = row.reviewStatus === 'error';
                    const needsResolution = ExcelCsvPipelineService.rowRequiresEntityResolution(row);

                    return (
                      <React.Fragment key={row.rowNumber}>
                        <tr
                          className={`hover:bg-stone-50/80 transition-colors ${
                            isRejected
                              ? 'bg-stone-100/80 line-through text-stone-400'
                              : isError
                              ? 'bg-rose-50/40'
                              : isWarning && !isAccepted
                              ? 'bg-amber-50/40'
                              : isAccepted
                              ? 'bg-emerald-50/30'
                              : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-bold text-stone-600">
                            {row.rowNumber}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                                  isRejected
                                    ? 'bg-stone-200 text-stone-700'
                                    : isError
                                    ? 'bg-rose-100 text-rose-800'
                                    : isWarning && !isAccepted
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isRejected ? (
                                  <>
                                    <XCircle className="w-3 h-3 text-stone-500" /> مستبعد
                                  </>
                                ) : isError ? (
                                  <>
                                    <XCircle className="w-3 h-3 text-rose-600" /> خطأ
                                  </>
                                ) : isWarning && !isAccepted ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> تنبيه
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> مقبول
                                  </>
                                )}
                              </span>

                              {needsResolution && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-blue-600" /> مراجعة المطابقة
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 font-mono">
                            {canonical.tripDate || <span className="text-stone-300">-</span>}
                          </td>

                          <td className="p-3">
                            <div className="font-bold">{canonical.driverName || '-'}</div>
                            {canonical.residencyId && (
                              <div className="text-[10px] text-stone-500 font-mono">
                                هوية: {canonical.residencyId}
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-mono font-bold">
                            {canonical.plateNumber || <span className="text-stone-300 font-normal">-</span>}
                          </td>

                          <td className="p-3">
                            {canonical.carrierName || <span className="text-stone-300">-</span>}
                          </td>

                          <td className="p-3">
                            {canonical.materialName || <span className="text-stone-300">-</span>}
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-stone-800">
                            {canonical.grossWeightKg ? canonical.grossWeightKg.toLocaleString() : '-'}
                          </td>

                          <td className="p-3 text-center font-mono text-stone-600">
                            {canonical.tareWeightKg ? canonical.tareWeightKg.toLocaleString() : '-'}
                          </td>

                          <td className="p-3 text-center font-mono font-black text-emerald-800">
                            {canonical.netWeightKg ? canonical.netWeightKg.toLocaleString() : '-'}
                          </td>

                          <td className="p-3 max-w-xs">
                            {row.validationIssues && row.validationIssues.length > 0 ? (
                              <div className="text-rose-700 text-[11px] font-bold">
                                {row.validationIssues.map((e) => e.message).join(' | ')}
                              </div>
                            ) : (
                              <span className="text-stone-400 text-[11px]">لا توجد ملاحظات</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isWarning && !isAccepted && !isRejected && (
                                <button
                                  onClick={() => handleRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                                  title="قبول التنبيه"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {!isRejected ? (
                                <button
                                  onClick={() => handleRowAction(row.rowNumber, 'REJECT_ROW')}
                                  className="p-1 rounded bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="استبعاد الصف"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-bold">مستبعد</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

              </div>
            )}
          </div>

          {/* Final Review & Pre-Commit Summary Section */}
          {(() => {
            const readyValidCount = activeBatch.rows.filter(
              (r) => (r.status === 'VALID' || r.reviewStatus === 'accepted') && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const pendingWarningCount = activeBatch.rows.filter(
              (r) => (r.status === 'WARNING' || r.reviewStatus === 'requires_review') && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const blockingErrorCount = activeBatch.rows.filter(
              (r) => (r.status === 'ERROR' || r.reviewStatus === 'error' || r.validationIssues?.some((i) => i.blocking)) && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const rejectedCount = activeBatch.rows.filter((r) => r.status === 'REJECTED').length;
            const eligibleCommitCount = activeBatch.rows.filter(
              (r) => (r.status === 'VALID' || r.reviewStatus === 'accepted' || (r.status === 'WARNING' && confirmWarnings)) && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;

            const cannotCommitReason =
              unresolvedGroups.length > 0
                ? `توجد (${unresolvedGroups.length}) مجموعات كائنات غير مطابقة تتطلب حسم القرار أولاً`
                : blockingErrorCount > 0
                ? `توجد (${blockingErrorCount}) صفوف تتضمن أخطاء مانعة يجب معالجتها أو استبعادها`
                : rowExceptions.length > 0 && !confirmWarnings && pendingWarningCount > 0
                ? `توجد (${pendingWarningCount}) تنبيهات معلقة، يلزم قبول التنبيهات أو تفعيل إقرار الموافقة على التنبيهات`
                : eligibleCommitCount === 0
                ? 'لا توجد أي صفوف صالحة جاهزة للاعتماد'
                : null;

            return (
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h4 className="font-black text-stone-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>ملخص المراجعة النهائية قبل الاعتماد (Pre-Commit Breakdown)</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    توضيح دقيق لتوزيع الصفوف والقرارات قبل التنفيذ النهائي في قاعدة البيانات.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <div className="text-[10px] font-bold text-stone-500">إجمالي الدفعة</div>
                    <div className="text-sm font-black text-stone-900 font-mono mt-0.5">{activeBatch.totalRows}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800">سليمة وجاهزة</div>
                    <div className="text-sm font-black text-emerald-900 font-mono mt-0.5">{readyValidCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-800">تنبيهات معلقة</div>
                    <div className="text-sm font-black text-amber-900 font-mono mt-0.5">{pendingWarningCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-800">أخطاء مانعة</div>
                    <div className="text-sm font-black text-rose-900 font-mono mt-0.5">{blockingErrorCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200">
                    <div className="text-[10px] font-bold text-stone-600">صفوف مستبعدة</div>
                    <div className="text-sm font-black text-stone-700 font-mono mt-0.5">{rejectedCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-[10px] font-bold text-blue-800">كائنات معلقة</div>
                    <div className="text-sm font-black text-blue-900 font-mono mt-0.5">{unresolvedGroups.length}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300">
                    <div className="text-[10px] font-bold text-amber-900">استثناءات معلقة</div>
                    <div className="text-sm font-black text-amber-950 font-mono mt-0.5">{rowExceptions.length}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white border border-emerald-700 shadow-2xs">
                    <div className="text-[10px] font-bold opacity-90">جاهز للاعتماد</div>
                    <div className="text-sm font-black font-mono mt-0.5">{eligibleCommitCount}</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-stone-200">
                  <div className="space-y-1.5 max-w-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmWarnings}
                        onChange={(e) => handleConfirmWarningsChange(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-stone-900">
                        أقرّ بالموافقة على اعتماد الصفوف التي تتضمن تنبيهات قابلة لتجاوز المراجعة (Allow Warnings Commit)
                      </span>
                    </label>
                    <p className="text-[11px] text-stone-500 pr-6">
                      تنبيه: لن يتم اعتماد أي شحنة مستبعدة أو تحتوي على أخطاء قاتلة (Fatal Errors).
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={handleCommit}
                      disabled={isCommitting || Boolean(cannotCommitReason)}
                      className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                        isCommitting || Boolean(cannotCommitReason)
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isCommitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري اعتماد الشحنات...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>اعتماد وتحفيظ الشحنات الرسمية ({eligibleCommitCount})</span>
                        </>
                      )}
                    </button>

                    {cannotCommitReason && (
                      <span className="text-[11px] text-rose-700 font-bold max-w-xs text-left">
                        {cannotCommitReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Commit Success Banner */}
          {commitResult && commitResult.success && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>تم اعتماد وتحفيظ الشحنات بنجاح في سجلات المشروع!</span>
              </div>
              <div className="text-xs text-emerald-800 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div>تم إنشاء: {(commitResult as any).createdCount ?? (commitResult as any).committedTripsCount ?? 0}</div>
                <div>تم تحديث: {(commitResult as any).updatedCount ?? 0}</div>
                <div>تم التجاوز: {(commitResult as any).skippedCount ?? 0}</div>
                <div>فشل: {(commitResult as any).failedCount ?? 0}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
