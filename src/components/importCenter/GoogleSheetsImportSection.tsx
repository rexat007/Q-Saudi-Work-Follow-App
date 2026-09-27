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
  const [expandedReviewRowNumber, setExpandedReviewRowNumber] = useState<number | null>(null);
  const [activeCreateFormKey, setActiveCreateFormKey] = useState<string | null>(null);
  const [isCreatingEntity, setIsCreatingEntity] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleResolutionDecision = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
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
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        rowNumber,
        entityTypeKey,
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
            reviewAction: { rowNumber, action: decision as any, entityType: entityTypeKey },
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

  const handleCreateCanonicalEntity = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
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

    const row = batch.rows.find((r) => r.rowNumber === rowNumber);
    if (!row) return;

    setProcessError(null);
    setCreateError(null);
    setIsCreatingEntity(true);

    try {
      let result: NormalizedEntityResolutionResult;
      const resItem = row.entityResolutions?.[entityTypeKey];
      const sourceVal = resItem?.sourceValue || resItem?.originalValue || formData.nameAr || formData.driverName || formData.plateNumber || formData.code || '';

      if (entityTypeKey === 'carrier') {
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
      } else if (entityTypeKey === 'material') {
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
      } else if (entityTypeKey === 'driver') {
        let carrierId = row.resolvedValues?.carrierId;
        if (!carrierId) {
          const carrierRes = row.entityResolutions?.carrier;
          if (carrierRes && !GoogleSheetsPipelineService.checkResolutionRequiresAttention(carrierRes)) {
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
      } else if (entityTypeKey === 'truck') {
        let carrierId = row.resolvedValues?.carrierId;
        if (!carrierId) {
          const carrierRes = row.entityResolutions?.carrier;
          if (carrierRes && !GoogleSheetsPipelineService.checkResolutionRequiresAttention(carrierRes)) {
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

      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        rowNumber,
        entityTypeKey,
        result,
        effectivePipelineContext
      );

      setBatch({ ...updated });
      setActiveCreateFormKey(null);

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
              reviewAction: {
                rowNumber,
                action: 'CREATE_CANONICAL_ENTITY',
                entityType: entityTypeKey,
                canonicalId: result.matchedId,
              },
            },
            sessionVersion
          );

          setSessionVersion(updatedSession.version);
        } catch (err: any) {
          if (err?.code === 'VERSION_CONFLICT') {
            setProcessError('تم إنشاء الكيان بنجاح على الخادم، ولكن حدث تعارض في إصدار الجلسة أثناء حفظ نقطة المراجعة (VERSION_CONFLICT)');
          } else {
            setProcessError(`تم إنشاء الكيان بنجاح على الخادم (${result.matchedId})، ولكن تعذر حفظ نقطة المراجعة: ${err?.message || 'خطأ غير معروف'}`);
          }
        }
      }
    } catch (err: any) {
      setCreateError(err?.message || 'فشل في إنشاء الكيان المعتمد');
    } finally {
      setIsCreatingEntity(false);
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
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {needsResolution && (
                                    <button
                                      onClick={() => setExpandedReviewRowNumber(expandedReviewRowNumber === row.rowNumber ? null : row.rowNumber)}
                                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                                      title="مراجعة المطابقة"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>مراجعة المطابقة</span>
                                    </button>
                                  )}

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
                                      <button
                                        onClick={() => handleRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                        className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                                      >
                                        استعادة
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Candidate Resolution Drawer */}
                          {expandedReviewRowNumber === row.rowNumber && (
                            <tr className="bg-blue-50/30 border-b border-blue-200/80">
                              <td colSpan={8} className="p-4">
                                <div className="p-4 rounded-xl bg-white border border-blue-200/90 shadow-xs space-y-4 text-right">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="font-bold text-xs text-blue-900 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-blue-600" />
                                      <span>مراجعة مطابقة الكيانات للصف رقم {row.rowNumber} (Existing Candidate Resolution)</span>
                                    </div>
                                    <button
                                      onClick={() => setExpandedReviewRowNumber(null)}
                                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(['carrier', 'truck', 'driver', 'material'] as const)
                                      .filter((k) => GoogleSheetsPipelineService.checkResolutionRequiresAttention(row.entityResolutions?.[k]))
                                      .map((entityKey) => {
                                        const res = row.entityResolutions![entityKey]!;
                                        const labelAr = entityKey === 'carrier' ? 'الناقل' : entityKey === 'truck' ? 'الشاحنة' : entityKey === 'driver' ? 'السائق' : 'المادة';
                                        const candidates = res.candidates || [];

                                        return (
                                          <div key={entityKey} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="font-black text-xs text-slate-900">{labelAr}</span>
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                res.riskLevel === 'CRITICAL' || res.riskLevel === 'HIGH'
                                                  ? 'bg-rose-100 text-rose-800'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}>
                                                مستوى المخاطرة: {res.riskLevel}
                                              </span>
                                            </div>

                                            <div className="text-xs space-y-1">
                                              <div><span className="text-slate-500 font-bold">القيمة المستوردة: </span><span className="font-mono font-bold text-slate-800">{res.sourceValue || res.originalValue || '-'}</span></div>
                                              {res.matchedName && (
                                                <div><span className="text-slate-500 font-bold">المطابق الحالي: </span><span className="font-bold text-emerald-800">{res.matchedName}</span> <span className="text-[10px] text-slate-400 font-mono">({(res.confidence * 100).toFixed(0)}%)</span></div>
                                              )}
                                              {res.conflictDetails && (
                                                <div className="text-rose-700 text-[11px] font-bold bg-rose-50 p-1.5 rounded border border-rose-100 mt-1">
                                                  {res.conflictDetails}
                                                </div>
                                              )}
                                            </div>

                                            {/* Candidates */}
                                            {candidates.length > 0 && (
                                              <div className="space-y-1.5 pt-1">
                                                <span className="text-[11px] font-bold text-slate-600 block">المرشحون المتاحون للمطابقة:</span>
                                                <div className="space-y-1">
                                                  {candidates.map((cand) => (
                                                    <div key={cand.candidateEntityId} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs">
                                                      <div>
                                                        <span className="font-bold text-slate-900">{cand.candidateDisplayName}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono pr-2">({(cand.confidence * 100).toFixed(0)}%)</span>
                                                      </div>
                                                      <button
                                                        onClick={() => handleResolutionDecision(row.rowNumber, entityKey, 'SELECT_ALTERNATE', { selectedEntityId: cand.candidateEntityId, selectedDisplayName: cand.candidateDisplayName })}
                                                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                                      >
                                                        تحديد المقترح
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                                              {(res.matchedId || res.entityId) && (
                                                <button
                                                  onClick={() => handleResolutionDecision(row.rowNumber, entityKey, 'ACCEPT_CANDIDATE', { selectedEntityId: res.matchedId || res.entityId, selectedDisplayName: res.matchedName || res.matchedValue })}
                                                  className="px-3 py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition-colors cursor-pointer"
                                                >
                                                  قبول المرشح الحالي
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleResolutionDecision(row.rowNumber, entityKey, 'LEAVE_UNRESOLVED')}
                                                className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                                              >
                                                ترك غير مطابق
                                              </button>
                                              {GoogleSheetsPipelineService.checkResolutionRequiresAttention(res) && (
                                                <button
                                                  onClick={() => {
                                                    setCreateError(null);
                                                    setActiveCreateFormKey(activeCreateFormKey === `${row.rowNumber}_${entityKey}` ? null : `${row.rowNumber}_${entityKey}`);
                                                  }}
                                                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                  <PlusCircle className="w-3.5 h-3.5" />
                                                  <span>إنشاء سجل جديد</span>
                                                </button>
                                              )}
                                            </div>

                                            {/* Inline Creation Form */}
                                            {activeCreateFormKey === `${row.rowNumber}_${entityKey}` && (
                                              <InlineEntityCreateForm
                                                row={row}
                                                entityKey={entityKey}
                                                res={res}
                                                isCreatingEntity={isCreatingEntity}
                                                createError={createError}
                                                onSubmit={(formData) => handleCreateCanonicalEntity(row.rowNumber, entityKey, formData)}
                                                onCancel={() => setActiveCreateFormKey(null)}
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Stage Section */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      بوابة الاعتماد النهائي (Final COMMIT Stage)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      حسب قواعد المعمارية الصارمة: لم يتم إجراء أي عملية كتابة إلى قاعدة البيانات مسبقاً.
                      الضغط على زر الاعتماد سينشئ الرحلات رسمياً ويوثق سجل التدقيق (Audit Log).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {batch.errorRows > 0 && (
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        لا يمكن الاعتماد مع وجود ({batch.errorRows}) أخطاء مانعة
                      </span>
                    )}

                    <button
                      onClick={handleCommit}
                      disabled={isCommitting || batch.errorRows > 0 || batch.validRows + batch.warningRows === 0}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isCommitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جارٍ اعتماد الشحنات وتوثيق السجل...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اعتماد الشحنات الصالحة ({batch.validRows + batch.warningRows})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface InlineEntityCreateFormProps {
  row: ImportRow;
  entityKey: 'carrier' | 'truck' | 'driver' | 'material';
  res: any;
  isCreatingEntity: boolean;
  createError: string | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

function InlineEntityCreateForm({
  row,
  entityKey,
  res,
  isCreatingEntity,
  createError,
  onSubmit,
  onCancel,
}: InlineEntityCreateFormProps) {
  const canonical = (row as any).normalized?.canonicalData || row.canonical || {};
  const raw = row.raw || {};

  // Carrier prefill
  const [carrierNameAr, setCarrierNameAr] = useState(res.sourceValue || res.originalValue || canonical.carrier || canonical.carrierName || '');
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState(canonical.commercialRegistrationNo || raw.commercialRegistrationNo || raw.crNumber || '');
  const [transportLicenseNo, setTransportLicenseNo] = useState(canonical.transportLicenseNo || raw.transportLicenseNo || '');

  // Material prefill
  const [materialNameAr, setMaterialNameAr] = useState(res.sourceValue || res.originalValue || canonical.materialType || canonical.materialName || '');
  const [materialCode, setMaterialCode] = useState(canonical.materialCode || raw.materialCode || raw.code || '');

  // Driver prefill
  const [driverName, setDriverName] = useState(canonical.driverName || res.sourceValue || res.originalValue || '');
  const [residencyId, setResidencyId] = useState(
    canonical.residencyId || canonical.driverIdentity || canonical.nationalOrIqamaId || raw.residencyId || raw.driverIdentity || raw.nationalOrIqamaId || raw.idNumber || ''
  );
  const [driverPhone, setDriverPhone] = useState(canonical.driverPhone || canonical.phone || raw.phone || '');

  // Truck prefill
  const [plateNumber, setPlateNumber] = useState(canonical.plateNumber || canonical.truckNo || canonical.truckPlate || res.sourceValue || res.originalValue || '');
  const [truckType, setTruckType] = useState(canonical.truckType || raw.truckType || '');
  const [tareWeightKg, setTareWeightKg] = useState<string>(canonical.tareWeight ? String(canonical.tareWeight) : (canonical.tareWeightKg ? String(canonical.tareWeightKg) : (raw.tareWeightKg ? String(raw.tareWeightKg) : '')));
  const [maxGrossWeightKg, setMaxGrossWeightKg] = useState<string>(
    canonical.grossWeight ? String(canonical.grossWeight) : (canonical.maxGrossWeightKg ? String(canonical.maxGrossWeightKg) : (raw.maxGrossWeightKg ? String(raw.maxGrossWeightKg) : ''))
  );

  // Check carrier dependency for Driver and Truck
  let carrierId = row.resolvedValues?.carrierId;
  if (!carrierId) {
    const carrierRes = row.entityResolutions?.carrier;
    if (carrierRes && !GoogleSheetsPipelineService.checkResolutionRequiresAttention(carrierRes)) {
      carrierId = carrierRes.matchedId || carrierRes.entityId;
    }
  }

  const isDriverOrTruckBlocked = (entityKey === 'driver' || entityKey === 'truck') && !carrierId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entityKey === 'carrier') {
      onSubmit({
        nameAr: carrierNameAr,
        commercialRegistrationNo,
        transportLicenseNo,
      });
    } else if (entityKey === 'material') {
      onSubmit({
        nameAr: materialNameAr,
        code: materialCode,
      });
    } else if (entityKey === 'driver') {
      onSubmit({
        driverName,
        residencyId,
        phone: driverPhone,
      });
    } else if (entityKey === 'truck') {
      onSubmit({
        plateNumber,
        truckType,
        tareWeightKg: tareWeightKg ? Number(tareWeightKg) : undefined,
        maxGrossWeightKg: maxGrossWeightKg ? Number(maxGrossWeightKg) : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 mt-2 space-y-3">
      <div className="font-bold text-xs text-blue-900 border-b border-blue-200/80 pb-1.5 flex items-center justify-between">
        <span>نموذج إنشاء سجل معتمد ({entityKey === 'carrier' ? 'ناقل' : entityKey === 'material' ? 'مادة' : entityKey === 'driver' ? 'سائق' : 'شاحنة'})</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {createError && (
        <div className="p-2 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
          {createError}
        </div>
      )}

      {isDriverOrTruckBlocked ? (
        <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
          {entityKey === 'driver' ? 'يجب حسم الناقل أولاً قبل إنشاء السائق' : 'يجب حسم الناقل أولاً قبل إنشاء الشاحنة'}
        </div>
      ) : (
        <>
          {entityKey === 'carrier' && (
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الناقل (العربية)</label>
                <input
                  type="text"
                  value={carrierNameAr}
                  onChange={(e) => setCarrierNameAr(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم السجل التجاري <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={commercialRegistrationNo}
                  onChange={(e) => setCommercialRegistrationNo(e.target.value)}
                  placeholder="مثال: 1010123456"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم ترخيص النقل (اختياري)</label>
                <input
                  type="text"
                  value={transportLicenseNo}
                  onChange={(e) => setTransportLicenseNo(e.target.value)}
                  placeholder="مثال: 01-123456"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {entityKey === 'material' && (
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المادة (العربية)</label>
                <input
                  type="text"
                  value={materialNameAr}
                  onChange={(e) => setMaterialNameAr(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز المادة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  placeholder="مثال: MAT-SAND-01"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {entityKey === 'driver' && (
            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-bold">
                الناقل المرتبط: <span className="font-mono">{carrierId}</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم السائق</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهوية / الإقامة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={residencyId}
                  onChange={(e) => setResidencyId(e.target.value)}
                  placeholder="مثال: 1098765432"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {entityKey === 'truck' && (
            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-bold">
                الناقل المرتبط: <span className="font-mono">{carrierId}</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم اللوحة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="مثال: 1234 أ ب ج"
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الشاحنة (اختياري)</label>
                  <input
                    type="text"
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full p-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوزن الفارغ (كجم)</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(e.target.value)}
                    className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
            <button
              type="submit"
              disabled={isCreatingEntity}
              className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              {isCreatingEntity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>تأكيد وحفظ السجل المعتمد</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </>
      )}
    </form>
  );
}
