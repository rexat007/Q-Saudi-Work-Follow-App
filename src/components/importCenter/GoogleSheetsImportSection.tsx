import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Database,
  Filter,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  PlayCircle,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { clientWorkspaceService } from '../../services/workspace.service';
import { GoogleSheetsPipelineService } from '../../services/import/googleSheetsPipeline.service';
import { entityResolutionCommandService, NormalizedEntityResolutionResult } from '../../services/import/entityResolutionCommand.service';
import { importSessionClientService } from '../../services/import/importSessionClient.service';
import { RosterBatchReviewService, RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
import { DriverTruckPipelineService } from '../../services/import/driverTruckPipeline.service';
import {
  GoogleSpreadsheetItem,
  GoogleSheetTabItem,
} from '../../types/googleSheetsImport';
import {
  UnifiedImportBatch,
  ImportRow,
  PipelineContext,
  ImportResult,
  UNIFIED_IMPORT_PIPELINE_STAGES,
  ImportSource,
} from '../../types/unifiedImport';
import { runGoogleSheetsImportTests, GoogleSheetsTestReport } from '../../tests/googleSheetsImport.test';
import { RelationshipContext } from '../../types/dataQuality';
import { ImportProjectContextAdapter } from '../../services/import/importProjectContext.adapter';
import { AuthUserContext } from '../../types/common';
import { smartSourceDiscoveryService } from '../../services/import/smartSourceDiscovery.service';

interface GoogleSheetsImportSectionProps {
  projectId: string;
  authContext?: AuthUserContext;
  userId?: string;
  userName?: string;
  userRole?: string;
  canonicalRelationshipContext?: RelationshipContext | null;
  pipelineContext?: PipelineContext;
}

export const GoogleSheetsImportSection: React.FC<GoogleSheetsImportSectionProps> = ({
  projectId,
  authContext,
  userId,
  userName,
  userRole,
  canonicalRelationshipContext,
  pipelineContext,
}) => {
  // State for Spreadsheets
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<GoogleSpreadsheetItem | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');

  // Pipeline & Import Session Active Identity State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [activeImportBatchId, setActiveImportBatchId] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [confirmWarnings, setConfirmWarnings] = useState<boolean>(false);

  // Processing & Pipeline
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [batch, setBatch] = useState<UnifiedImportBatch | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR' | 'REQUIRES_REVIEW' | 'REJECTED'>('ALL');
  const [activeCreateGroupKey, setActiveCreateGroupKey] = useState<string | null>(null);
  const [isCreatingEntity, setIsCreatingEntity] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showFullBatchTable, setShowFullBatchTable] = useState<boolean>(false);

  const reviewGroups = useMemo(() => {
    if (!batch) return { carrier: [], material: [], driver: [], truck: [] };
    return RosterBatchReviewService.getBatchReviewGroups(batch);
  }, [batch]);

  const unresolvedGroups = useMemo(() => {
    const all = [...reviewGroups.carrier, ...reviewGroups.material, ...reviewGroups.driver, ...reviewGroups.truck];
    return all.filter(g => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT');
  }, [reviewGroups]);

  const rowExceptions = useMemo(() => {
    if (!batch) return [];
    return RosterBatchReviewService.getRowExceptions(batch);
  }, [batch]);

  const handleGroupResolutionDecision = async (
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    normalizedSourceKey: string,
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidate?: { selectedEntityId?: string; selectedDisplayName?: string }
  ) => {
    if (!batch) return;

    try {
      setProcessError(null);
      const context: PipelineContext = {
        ...effectivePipelineContext,
        operationId: activeOperationId || effectivePipelineContext.operationId,
      };
      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        batch,
        entityTypeKey,
        normalizedSourceKey,
        decision,
        candidate || {},
        context,
        effectiveUserId || 'user'
      );

      setBatch({ ...updated });

      if (projectId && activeSessionId) {
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
          projectId,
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
    if (!batch || !projectId) return;
    const representativeRowNumber = group.rowNumbers[0];
    const row = batch.rows.find((r) => r.rowNumber === representativeRowNumber);
    if (!row) return;

    setProcessError(null);
    setCreateError(null);
    setIsCreatingEntity(true);

    try {
      let result: NormalizedEntityResolutionResult;
      const resItem = group.currentResolution;
      const sourceVal = resItem?.sourceValue || resItem?.originalValue || group.sourceValue || formData.nameAr || formData.driverName || formData.plateNumber || formData.code || '';
      const context: PipelineContext = {
        ...effectivePipelineContext,
        operationId: activeOperationId || effectivePipelineContext.operationId,
      };

      if (group.entityType === 'carrier') {
        if (!formData.commercialRegistrationNo || !formData.commercialRegistrationNo.trim()) {
          throw new Error('رقم السجل التجاري للناقل مطلوب');
        }
        result = await entityResolutionCommandService.createCarrier({
          projectId,
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
          projectId,
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
          projectId,
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
          projectId,
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
        batch,
        group.entityType,
        group.normalizedSourceKey,
        result,
        context
      );

      setBatch({ ...updated });
      setActiveCreateGroupKey(null);

      if (projectId && activeSessionId) {
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
          projectId,
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

  // Committing
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<ImportResult | null>(null);

  // Automated Tests Runner
  const [testReport, setTestReport] = useState<GoogleSheetsTestReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'TESTS'>('IMPORT');

  // Offline detection
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resume active import session on mount if locator exists
  useEffect(() => {
    let isMounted = true;

    const resumeSession = async () => {
      if (!projectId) return;
      const locatorKey = `qsaudi_import_session_locator_${projectId}`;
      const rawLocator = sessionStorage.getItem(locatorKey);
      if (!rawLocator) return;

      try {
        const locator = JSON.parse(rawLocator);
        if (!locator || locator.projectId !== projectId || !locator.importSessionId) {
          sessionStorage.removeItem(locatorKey);
          return;
        }

        const sessionRecord = await importSessionClientService.getSession(projectId, locator.importSessionId);
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

          const reconstructedBatch: UnifiedImportBatch = {
            importBatchId: sessionRecord.importBatchId,
            projectId: sessionRecord.projectId,
            source: {
              sourceType: (sessionRecord.sourceType as any) || 'GOOGLE_SHEETS',
              importBatchId: sessionRecord.importBatchId,
              sourceFileName: sessionRecord.sourceMetadata?.sourceFileName || sessionRecord.sourceMetadata?.spreadsheetTitle || 'resumed_sheet',
              sourceMimeType: sessionRecord.sourceMetadata?.sourceMimeType,
              sourceSheetName: sessionRecord.sourceMetadata?.sourceSheetName || sessionRecord.sourceMetadata?.sheetTitle,
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
                details: 'Resumed Google Sheets import session from server persistence',
              },
            ],
          };

          setBatch(reconstructedBatch);
        }
      } catch {
        sessionStorage.removeItem(locatorKey);
      }
    };

    resumeSession();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const loadSpreadsheets = async () => {
    if (!isOnline) {
      setFetchError('التطبيق في وضع عدم الاتصال (Offline). لا يمكن استعراض جداول بيانات Google.');
      return;
    }

    setIsLoadingSpreadsheets(true);
    setFetchError(null);
    try {
      const res = await clientWorkspaceService.listGoogleSpreadsheets(projectId);
      setSpreadsheets(res.spreadsheets);
      if (res.spreadsheets.length > 0 && !selectedSpreadsheet) {
        handleSelectSpreadsheet(res.spreadsheets[0]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'فشل في استعراض جداول بيانات Google Sheets للمشروع');
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, [projectId]);

  const handleSelectSpreadsheet = (item: GoogleSpreadsheetItem) => {
    setSelectedSpreadsheet(item);
    setBatch(null);
    setCommitResult(null);
    setProcessError(null);

    if (item.sheets && item.sheets.length > 0) {
      setSelectedSheetTab(item.sheets[0].title);
    } else {
      setSelectedSheetTab('Sheet1');
    }
  };

  const effectiveUserId = authContext?.userId || userId || '';
  const effectiveUserName = authContext?.displayName || userName || '';
  const effectiveRole = authContext?.role || userRole || '';

  // Run Pipeline from Google Sheets to REVIEW Gate
  const handleProcessSheet = async () => {
    if (!selectedSpreadsheet) return;
    if (!isOnline) {
      setProcessError('التطبيق غير متصل بالإنترنت. لا يمكن جلب بيانات ورقة العمل أثناء انقطاع الاتصال.');
      return;
    }

    setIsProcessing(true);
    setProcessError(null);
    setCommitResult(null);

    // Generate stable identities ONCE for brand new import flow
    const stable = importSessionClientService.generateStableIdentities();
    const opId = stable.operationId;
    const batchId = stable.importBatchId;
    setActiveOperationId(opId);
    setActiveImportBatchId(batchId);
    setConfirmWarnings(false);

    let createdSessionId: string | null = null;
    let createdVersion = 0;

    // Create server session BEFORE processing source to REVIEW (FAIL CLOSED)
    if (projectId) {
      try {
        const sessionRecord = await importSessionClientService.createSession(projectId, {
          projectId,
          operationId: opId,
          importBatchId: batchId,
          sourceType: 'GOOGLE_SHEETS',
          sourceMetadata: {
            spreadsheetId: selectedSpreadsheet.id,
            spreadsheetTitle: selectedSpreadsheet.name,
            sheetTitle: selectedSheetTab || 'Sheet1',
            modifiedTime: selectedSpreadsheet.modifiedTime,
            sourceMimeType: 'application/vnd.google-apps.spreadsheet',
            sourceFileName: selectedSpreadsheet.name,
            sourceSheetName: selectedSheetTab || 'Sheet1',
          },
        });

        createdSessionId = sessionRecord.importSessionId;
        createdVersion = sessionRecord.version;
        setActiveSessionId(createdSessionId);
        setSessionVersion(createdVersion);

        sessionStorage.setItem(
          `qsaudi_import_session_locator_${projectId}`,
          JSON.stringify({
            projectId,
            importSessionId: createdSessionId,
          })
        );
      } catch (err: any) {
        // FAIL CLOSED: STOP! DO NOT proceed to discovery/pipeline!
        setIsProcessing(false);
        setProcessError(err?.message || 'فشل في إنشاء جلسة الاستيراد على الخادم. تم إيقاف المعالجة.');
        return;
      }
    }

    try {
      // 1. Fetch 2D values from server API
      const sheetData = await clientWorkspaceService.getSpreadsheetValues(
        selectedSpreadsheet.id,
        selectedSheetTab || 'Sheet1'
      );

      // Run Smart Source Discovery to automatically detect headerRowIndex and sheet details
      const importSource: ImportSource = {
        sourceType: 'GOOGLE_SHEETS',
        importBatchId: batchId,
        sourceFileName: selectedSpreadsheet.name,
        sourceSheetName: selectedSheetTab || 'Sheet1',
      };
      const discovery = await smartSourceDiscoveryService.discover(importSource, sheetData.values);
      const detectedIdx = discovery.detectedHeaderRowIndex || 0;

      // 2. Build Pipeline Context
      const context: PipelineContext = pipelineContext || (canonicalRelationshipContext && canonicalRelationshipContext.projectId
        ? ImportProjectContextAdapter.createPipelineContext({
            relContext: canonicalRelationshipContext,
            projectId: canonicalRelationshipContext.projectId,
            userId: effectiveUserId,
            userName: effectiveUserName,
            role: effectiveRole,
            operationId: opId,
            allowWarningsCommit: confirmWarnings,
          })
        : {
            projectId,
            userId: effectiveUserId,
            userName: effectiveUserName,
            role: effectiveRole,
            operationId: opId,
            allowWarningsCommit: confirmWarnings,
            knownEntities: ImportProjectContextAdapter.toPipelineKnownEntities(null),
          });

      // 3. Process through 8 pipeline stages up to REVIEW (strictly NO writes before COMMIT)
      const reviewedBatch = await GoogleSheetsPipelineService.processSheetsDataToReview(
        sheetData.values,
        selectedSpreadsheet,
        selectedSheetTab || 'Sheet1',
        context,
        { headerRowIndex: detectedIdx, importBatchId: batchId }
      );

      setBatch(reviewedBatch);

      // 4. Save initial REVIEW checkpoint to server session
      if (projectId && createdSessionId) {
        try {
          const cleanSnapshot = {
            totalRows: reviewedBatch.totalRows,
            validRows: reviewedBatch.validRows,
            warningRows: reviewedBatch.warningRows,
            errorRows: reviewedBatch.errorRows,
            requiresReviewRows: reviewedBatch.requiresReviewRows,
            committedRows: reviewedBatch.committedRows,
            rows: reviewedBatch.rows.map((r) => {
              const { rawInput, ...rest } = r as any;
              return rest;
            }),
          };

          const updatedSession = await importSessionClientService.updateCheckpoint(
            projectId,
            createdSessionId,
            {
              lifecycleState: 'REVIEW_REQUIRED',
              currentStage: 'REVIEW',
              reviewSnapshot: cleanSnapshot,
              validationIssues: reviewedBatch.issues || [],
              warningConfirmation: confirmWarnings,
              sourceMetadata: {
                spreadsheetId: selectedSpreadsheet.id,
                spreadsheetTitle: selectedSpreadsheet.name,
                sheetTitle: selectedSheetTab || 'Sheet1',
                modifiedTime: selectedSpreadsheet.modifiedTime,
                sourceMimeType: 'application/vnd.google-apps.spreadsheet',
                sourceFileName: selectedSpreadsheet.name,
                sourceSheetName: selectedSheetTab || 'Sheet1',
                headerRowIndex: detectedIdx,
              },
            },
            createdVersion
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
      setProcessError(err.message || 'فشل في معالجة بيانات ورقة العمل عبر مسار الاستيراد الموحد');
    } finally {
      setIsProcessing(false);
    }
  };

  const effectivePipelineContext: PipelineContext = useMemo(() => {
    if (pipelineContext) {
      return {
        ...pipelineContext,
        projectId: projectId || pipelineContext.projectId,
        userId: effectiveUserId || pipelineContext.userId,
        userName: effectiveUserName || pipelineContext.userName,
        role: effectiveRole || pipelineContext.role,
      };
    }
    return {
      projectId,
      userId: effectiveUserId || 'user',
      userName: effectiveUserName || 'User',
      role: effectiveRole || 'OPERATOR',
      operationId: `OP-GSHT-${Date.now()}`,
    };
  }, [pipelineContext, projectId, effectiveUserId, effectiveUserName, effectiveRole]);

  // Row Review Actions
  const handleRowAction = async (rowNumber: number, action: 'ACCEPT_WARNING' | 'REJECT_ROW') => {
    if (!batch) return;
    const context: PipelineContext = {
      ...effectivePipelineContext,
      operationId: activeOperationId || `OP-REVIEW-${Date.now()}`,
    };
    const updated = GoogleSheetsPipelineService.applyRowReview(
      batch,
      rowNumber,
      action,
      context,
      action === 'ACCEPT_WARNING' ? 'تمت الموافقة اليدوية على التنبيه' : 'تم استبعاد الصف يدوياً'
    );
    setBatch({ ...updated });

    if (projectId && activeSessionId) {
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
          projectId,
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
    if (projectId && activeSessionId) {
      try {
        const updatedSession = await importSessionClientService.updateCheckpoint(
          projectId,
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

  // Final Commit Gate
  const handleCommit = async () => {
    if (!batch) return;
    if (!isOnline) {
      alert('يجب توفر اتصال بالإنترنت لاعتماد الشحنات في قاعدة البيانات الرئيسية.');
      return;
    }

    if (!effectiveUserId) {
      alert('يتطلب الاعتماد مستخدماً مصادقاً عليه (Unauthenticated - Access Denied)');
      return;
    }

    setIsCommitting(true);
    try {
      const context: PipelineContext = {
        projectId,
        userId: effectiveUserId,
        userName: effectiveUserName,
        role: effectiveRole,
        operationId: activeOperationId || `OP-GSHT-COMMIT-${Date.now()}`,
        allowWarningsCommit: confirmWarnings,
      };

      const { batch: committedBatch, result } = await GoogleSheetsPipelineService.commitBatch(batch, context);
      setBatch(committedBatch);
      setCommitResult(result);

      const isFullSuccess = result.success && (result.failedRows === undefined || result.failedRows === 0);

      if (isFullSuccess) {
        if (projectId && activeSessionId) {
          try {
            const updatedSession = await importSessionClientService.updateCheckpoint(
              projectId,
              activeSessionId,
              {
                lifecycleState: 'COMMITTED',
                currentStage: 'COMMITTED',
              },
              sessionVersion
            );
            setSessionVersion(updatedSession.version);
            sessionStorage.removeItem(`qsaudi_import_session_locator_${projectId}`);
          } catch {
            // Commit succeeded on business domain; ignore session close error
          }
        }
      } else {
        // Partial or failed commit: keep session active as REVIEW_REQUIRED, checkpoint updated batch, keep locator
        if (projectId && activeSessionId) {
          try {
            const cleanSnapshot = {
              totalRows: committedBatch.totalRows,
              validRows: committedBatch.validRows,
              warningRows: committedBatch.warningRows,
              errorRows: committedBatch.errorRows,
              requiresReviewRows: committedBatch.requiresReviewRows,
              committedRows: committedBatch.committedRows,
              rows: committedBatch.rows.map((r) => {
                const { rawInput, ...rest } = r as any;
                return rest;
              }),
            };

            const updatedSession = await importSessionClientService.updateCheckpoint(
              projectId,
              activeSessionId,
              {
                lifecycleState: 'REVIEW_REQUIRED',
                currentStage: 'REVIEW',
                reviewSnapshot: cleanSnapshot,
                validationIssues: committedBatch.issues || [],
                warningConfirmation: confirmWarnings,
                reviewAction: { action: 'PARTIAL_COMMIT_ATTEMPT' },
              },
              sessionVersion
            );
            setSessionVersion(updatedSession.version);
          } catch (err: any) {
            if (err?.code === 'VERSION_CONFLICT') {
              setProcessError('تعارض في إصدار الجلسة (VERSION_CONFLICT): تعذر تحديث حالة الاعتماد الجزئي');
            } else {
              console.warn('Failed to update partial commit checkpoint:', err);
            }
          }
        }
      }
    } catch (err: any) {
      alert(`فشل الاعتماد: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  // Run Automated Tests
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const report = await runGoogleSheetsImportTests();
      setTestReport(report);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Filtered Rows for Review Table
  const filteredRows = useMemo(() => {
    if (!batch) return [];
    if (filterTab === 'ALL') return batch.rows;
    if (filterTab === 'VALID') return batch.rows.filter((r) => r.status === 'VALID' || r.status === 'COMMITTED');
    if (filterTab === 'WARNING') return batch.rows.filter((r) => r.status === 'WARNING');
    if (filterTab === 'ERROR') return batch.rows.filter((r) => r.status === 'ERROR');
    if (filterTab === 'REJECTED') return batch.rows.filter((r) => r.status === 'REJECTED');
    return batch.rows;
  }, [batch, filterTab]);

  const filteredSpreadsheets = useMemo(() => {
    if (!searchQuery.trim()) return spreadsheets;
    const q = searchQuery.toLowerCase();
    return spreadsheets.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [spreadsheets, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner: Mode & Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">استيراد مباشر من جداول Google (Google Sheets)</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  BLOCK 33
                </span>
                {!isOnline && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    غير متصل (Offline)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                استيراد جداول البيانات ومطابقة الأعمدة آلياً وفحص بيانات الميزان وتذاكر التحميل مع الحفاظ على عزل المشاريع وبوابة الاعتماد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('IMPORT')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'IMPORT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              استيراد الجداول
            </button>
            <button
              onClick={() => {
                setActiveTab('TESTS');
                if (!testReport && !isRunningTests) handleRunTests();
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'TESTS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              فحص الاختبارات (14 فحصاً)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'TESTS' ? (
        /* Automated Tests View */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">حزمة الاختبارات الفنية لـ BLOCK 33</h3>
              <p className="text-sm text-slate-500">
                التحقق التلقائي من عزل المشاريع، حماية الأسرار، مطابقة الميزان، والاعتماد الآمن.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'جارٍ التشغيل...' : 'إعادة تشغيل الاختبارات'}
            </button>
          </div>

          {isRunningTests && (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p>جارٍ فحص واختبار سيناريوهات BLOCK 33 بالكامل...</p>
            </div>
          )}

          {testReport && !isRunningTests && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      testReport.allPassed ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    {testReport.passed}/{testReport.total}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {testReport.allPassed ? 'اجتياز جميع الفحوصات بنسبة 100%' : 'توجد بعض الفحوصات غير المجتازة'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      تم تشغيل {testReport.total} اختباراً معيارياً وفق مواصفات BLOCK 33.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    testReport.allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {testReport.allPassed ? 'PASSED (100%)' : 'FAILED'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {testReport.results.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {t.id}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                      </div>
                      <p className="text-xs text-slate-600">{t.notes}</p>
                      <div className="text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded mt-1">
                        <div>المتوقع: {t.expected}</div>
                        <div>الفعلي: {t.actual}</div>
                      </div>
                    </div>
                    <div>
                      {t.passed ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ناجح
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          <XCircle className="w-3.5 h-3.5" />
                          فشل
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Main Import View */
        <div className="space-y-6">
          {/* Step 1 & 2: Spreadsheet Selection & Sheet Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-900">اختيار جدول البيانات (Spreadsheet) وورقة العمل (Sheet Tab)</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث في الجداول..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 pl-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 md:w-64"
                  />
                </div>
                <button
                  onClick={loadSpreadsheets}
                  disabled={isLoadingSpreadsheets || !isOnline}
                  className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition disabled:opacity-50"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSpreadsheets ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Spreadsheets Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSpreadsheets.map((s) => {
                const isSelected = selectedSpreadsheet?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSpreadsheet(s)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-right ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      {s.webViewLink && (
                        <a
                          href={s.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded"
                          title="فتح في Google Sheets"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">{s.name}</h4>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">ID: {s.id}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      <span>{s.sheets?.length || 1} ورقات عمل</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.modifiedTime ? new Date(s.modifiedTime).toLocaleDateString('ar-SA') : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sheet Tabs Selection */}
            {selectedSpreadsheet && selectedSpreadsheet.sheets && selectedSpreadsheet.sheets.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  اختر ورقة العمل المراد استيراد بياناتها:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedSpreadsheet.sheets.map((tab) => (
                    <button
                      key={tab.sheetId}
                      onClick={() => setSelectedSheetTab(tab.title)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        selectedSheetTab === tab.title
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.title} {tab.rowCount ? `(${tab.rowCount} صفاً)` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action to Process Sheet */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>المعالجة تمر بـ 8 بوابات فحص وتدقيق دون أي حفظ في قاعدة البيانات حتى مرحلة الاعتماد.</span>
              </div>

              <button
                onClick={handleProcessSheet}
                disabled={!selectedSpreadsheet || isProcessing || !isOnline}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ تحليل ورقة العمل ومطابقة الأعمدة...</span>
                  </>
                ) : (
                  <>
                    <span>بدء المعالجة والتحليل (Process Sheet)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {processError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{processError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Visual Pipeline Stepper & Review Table */}
          {batch && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900">مراجعة بيانات الشحنات وبوابة الاعتماد (Human Review Gate)</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    Batch: {batch.importBatchId}
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    المصدر: {batch.source.sourceType}
                  </span>
                </div>
              </div>

              {/* 10-Stage Visual Stepper */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
                  <span>المراحل العشر لخط الاستيراد الموحد (Unified 10-Stage Pipeline):</span>
                  <span className="text-emerald-700 font-bold">المرحلة الحالية: {batch.currentStage}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {UNIFIED_IMPORT_PIPELINE_STAGES.map((stg, idx) => {
                    const isPassed =
                      UNIFIED_IMPORT_PIPELINE_STAGES.indexOf(batch.currentStage) >= idx;
                    const isCurrent = batch.currentStage === stg;
                    return (
                      <div
                        key={stg}
                        className={`p-2 rounded-lg text-center text-xs font-mono font-bold transition-all border ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/20'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 font-sans">مرحلة {idx + 1}</div>
                        <div>{stg}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500">إجمالي الصفوف</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{batch.totalRows}</div>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <div className="text-xs text-emerald-700 font-semibold">صفوف صالحة</div>
                  <div className="text-xl font-bold text-emerald-800 mt-1">{batch.validRows}</div>
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="text-xs text-amber-700 font-semibold">تحذيرات (غير مانعة)</div>
                  <div className="text-xl font-bold text-amber-800 mt-1">{batch.warningRows}</div>
                </div>
                <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                  <div className="text-xs text-red-700 font-semibold">أخطاء مانعة</div>
                  <div className="text-xl font-bold text-red-800 mt-1">{batch.errorRows}</div>
                </div>
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50">
                  <div className="text-xs text-indigo-700 font-semibold">مكررة</div>
                  <div className="text-xl font-bold text-indigo-800 mt-1">{batch.rows.filter((r) => r.duplicateInfo?.isDuplicate).length}</div>
                </div>
              </div>

              {/* True Exception Queue Section */}
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4">
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
                          const canonical = row.canonical || {};
                          const hasBlocking = row.validationIssues?.some((i) => i.severity === 'BLOCKING' || i.blocking);
                          const isError = row.status === 'ERROR' || row.reviewStatus === 'error';
                          const isWarning = row.status === 'WARNING' || row.reviewStatus === 'requires_review';
                          const isDuplicate = Boolean(row.duplicateInfo?.isDuplicate);

                          return (
                            <tr key={row.rowNumber} className="hover:bg-amber-50/50 transition-colors">
                              <td className="p-3 text-center font-mono font-bold text-slate-700">
                                {row.rowNumber}
                              </td>

                              <td className="p-3">
                                <div className="flex flex-col gap-1 items-start">
                                  {hasBlocking || isError ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                                      <XCircle className="w-3 h-3 text-red-600" /> خطأ مانع
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
                                <div className="font-bold text-slate-900">
                                  {canonical.carrier || 'ناقل غير محدد'} | {canonical.materialType || 'مادة غير محددة'}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                                  تذكرة: {canonical.ticketId || '—'} | الشاحنة: {canonical.truckNo || '—'} | السائق: {canonical.driverName || '—'}
                                </div>
                              </td>

                              <td className="p-3 max-w-md">
                                {row.validationIssues && row.validationIssues.length > 0 ? (
                                  <div className="text-red-800 text-[11px] font-bold space-y-0.5">
                                    {row.validationIssues.map((e, idx) => (
                                      <div key={idx}>• {e.messageAr || e.message}</div>
                                    ))}
                                  </div>
                                ) : isDuplicate ? (
                                  <div className="text-blue-800 text-[11px] font-bold">
                                    {row.duplicateInfo?.reason || 'تم اكتشاف تكرار لبيانات هذه الشحنة'}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">يتطلب اتخاذ قرار مراجعة</span>
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
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-800 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="استبعاد الصف"
                                  >
                                    <X className="w-3.5 h-3.5 text-red-600" />
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
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowFullBatchTable(!showFullBatchTable)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                    <span>
                      {showFullBatchTable
                        ? 'إخفاء جدول مرجع جميع الصفوف'
                        : `عرض جميع صفوف الدفعة الكاملة (Full Batch Reference Table - ${batch.rows.length} صف)`}
                    </span>
                  </button>
                </div>

                {showFullBatchTable && (
                  <div className="mt-4 space-y-4">
                    {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    filterTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  الكل ({batch.rows.length})
                </button>
                <button
                  onClick={() => setFilterTab('VALID')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    filterTab === 'VALID' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  صالحة ({batch.validRows})
                </button>
                <button
                  onClick={() => setFilterTab('WARNING')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    filterTab === 'WARNING' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  تحذيرات ({batch.warningRows})
                </button>
                <button
                  onClick={() => setFilterTab('ERROR')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    filterTab === 'ERROR' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  أخطاء مانعة ({batch.errorRows})
                </button>
              </div>

              {/* Review Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">رقم التذكرة</th>
                      <th className="p-3">اللوحة / الشاحنة</th>
                      <th className="p-3">الناقل والسائق</th>
                      <th className="p-3">المادة</th>
                      <th className="p-3">الأوزان (فارغ / قائم / صافي)</th>
                      <th className="p-3">الحالة والتحذيرات</th>
                      <th className="p-3 text-center">إجراء المراجعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => {
                      const canonical = row.canonical || {};
                      const hasBlocking = row.validationIssues.some((i) => i.blocking);
                      const hasWarnings = row.validationIssues.some((i) => !i.blocking);
                      const isRejected = row.status === 'REJECTED';
                      const needsResolution = GoogleSheetsPipelineService.rowRequiresEntityResolution(row) || row.reviewStatus === 'requires_review';

                      return (
                        <React.Fragment key={row.rowNumber}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${
                            isRejected ? 'bg-slate-100 opacity-60' : hasBlocking ? 'bg-red-50/30' : hasWarnings ? 'bg-amber-50/30' : ''
                          }`}>
                            <td className="p-3 font-mono text-slate-400 font-bold">{row.rowNumber}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{canonical.ticketId || '—'}</td>
                            <td className="p-3 font-semibold text-slate-800">{canonical.truckNo || '—'}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{canonical.carrier || 'غير محدد'}</div>
                              <div className="text-slate-400 text-[11px]">{canonical.driverName || 'بدون سائق'}</div>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{canonical.materialType || '—'}</td>
                            <td className="p-3 font-mono">
                              <div className="text-slate-500">
                                ف: {canonical.tareWeight ?? '—'} | ق: {canonical.grossWeight ?? '—'}
                              </div>
                              <div className="font-bold text-slate-900">
                                صافي: {canonical.netWeight ?? '—'} كجم
                                {canonical.destNetWeight ? ` (تفريغ: ${canonical.destNetWeight})` : ''}
                              </div>
                            </td>
                            <td className="p-3">
                              {row.status === 'COMMITTED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> تم الاعتماد
                                </span>
                              ) : row.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                                  <X className="w-3 h-3" /> مستبعد
                                </span>
                              ) : hasBlocking ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3" /> خطأ مانع
                                  </span>
                                  <div className="text-[10px] text-red-600">
                                    {row.validationIssues.find((i) => i.blocking)?.messageAr}
                                  </div>
                                </div>
                              ) : hasWarnings ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                    <AlertTriangle className="w-3 h-3" /> تحذير
                                  </span>
                                  <div className="text-[10px] text-amber-700">
                                    {row.validationIssues.map((i) => i.messageAr || i.message).join(' | ')}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> صالح للاعتماد
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {row.status !== 'COMMITTED' && (
                                <div className="flex items-center justify-center gap-1">
                                  {hasWarnings && row.status !== 'REJECTED' && (
                                    <button
                                      onClick={() => handleRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 cursor-pointer"
                                      title="قبول التحذير"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {row.status !== 'REJECTED' ? (
                                    <button
                                      onClick={() => handleRowAction(row.rowNumber, 'REJECT_ROW')}
                                      className="p-1 text-red-700 hover:bg-red-50 rounded border border-red-200 cursor-pointer"
                                      title="استبعاد هذا الصف"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                     <span className="text-[10px] text-slate-400 font-bold">مستبعد</span>
                                   )}
                                </div>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>

          {/* Final Review & Pre-Commit Summary Section */}
          {(() => {
            const readyValidCount = batch.rows.filter(
              (r) => (r.status === 'VALID' || r.reviewStatus === 'accepted') && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const pendingWarningCount = batch.rows.filter(
              (r) => (r.status === 'WARNING' || r.reviewStatus === 'requires_review') && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const blockingErrorCount = batch.rows.filter(
              (r) => (r.status === 'ERROR' || r.reviewStatus === 'error' || r.validationIssues?.some((i) => i.blocking)) && r.status !== 'REJECTED' && r.status !== 'COMMITTED'
            ).length;
            const rejectedCount = batch.rows.filter((r) => r.status === 'REJECTED').length;
            const eligibleCommitCount = batch.rows.filter(
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>ملخص المراجعة النهائية قبل الاعتماد (Pre-Commit Breakdown)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    توضيح دقيق لتوزيع الصفوف والقرارات قبل التنفيذ النهائي في قاعدة البيانات.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500">إجمالي الدفعة</div>
                    <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{batch.totalRows}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800">سليمة وجاهزة</div>
                    <div className="text-sm font-black text-emerald-900 font-mono mt-0.5">{readyValidCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-800">تنبيهات معلقة</div>
                    <div className="text-sm font-black text-amber-900 font-mono mt-0.5">{pendingWarningCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-[10px] font-bold text-red-800">أخطاء مانعة</div>
                    <div className="text-sm font-black text-red-900 font-mono mt-0.5">{blockingErrorCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-600">صفوف مستبعدة</div>
                    <div className="text-sm font-black text-slate-700 font-mono mt-0.5">{rejectedCount}</div>
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

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1.5 max-w-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmWarnings}
                        onChange={(e) => setConfirmWarnings(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-900">
                        أقرّ بالموافقة على اعتماد الصفوف التي تتضمن تنبيهات قابلة لتجاوز المراجعة (Allow Warnings Commit)
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 pr-6">
                      تنبيه: لن يتم اعتماد أي شحنة مستبعدة أو تحتوي على أخطاء قاتلة (Fatal Errors).
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={handleCommit}
                      disabled={isCommitting || Boolean(cannotCommitReason)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isCommitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جارٍ اعتماد الشحنات وتوثيق السجل...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اعتماد الشحنات الصالحة ({eligibleCommitCount})</span>
                        </>
                      )}
                    </button>

                    {cannotCommitReason && (
                      <span className="text-[11px] text-red-700 font-bold max-w-xs text-left">
                        {cannotCommitReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

                {commitResult && (
                  <div
                    className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                      commitResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {commitResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {commitResult.success
                          ? `تم اعتماد واستيراد (${commitResult.committedRows}) رحلة بنجاح في سجل العمليات!`
                          : 'تعذر اعتماد الشحنات'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 font-mono">
                        Operation ID: {commitResult.operationId} | Batch: {commitResult.importBatchId}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
  );
};
