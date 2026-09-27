import React, { useState, useEffect, useMemo } from 'react';
import {
  HardDrive,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
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
  Eye,
  Layers,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
  ExternalLink,
  Folder,
  Lock,
  Database,
  PlusCircle,
} from 'lucide-react';
import { GoogleDrivePipelineService } from '../../services/import/googleDrivePipeline.service';
import { clientWorkspaceService } from '../../services/workspace.service';
import { entityResolutionCommandService, NormalizedEntityResolutionResult } from '../../services/import/entityResolutionCommand.service';
import { importSessionClientService } from '../../services/import/importSessionClient.service';
import {
  UnifiedImportBatch,
  PipelineContext,
  ImportResult,
  ImportRow,
} from '../../types/unifiedImport';
import { ColumnMappingMatch } from '../../types/excelCsvImport';
import { GoogleDriveFileItem } from '../../types/googleDriveImport';
import {
  runGoogleDriveImportTests,
  GoogleDriveTestCaseResult,
} from '../../tests/googleDriveImport.test';
import { RelationshipContext } from '../../types/dataQuality';
import { ImportProjectContextAdapter } from '../../services/import/importProjectContext.adapter';
import { AuthUserContext } from '../../types/common';

interface GoogleDriveImportSectionProps {
  currentProjectId?: string;
  authContext?: AuthUserContext;
  userId?: string;
  userName?: string;
  userRole?: string;
  onCommitSuccess?: (result: ImportResult) => void;
  canonicalRelationshipContext?: RelationshipContext | null;
  pipelineContext?: PipelineContext;
}

export function GoogleDriveImportSection({
  currentProjectId = '',
  authContext,
  userId,
  userName,
  userRole,
  onCommitSuccess,
  canonicalRelationshipContext,
  pipelineContext,
}: GoogleDriveImportSectionProps) {
  // Drive browser state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true);
  const [fileListError, setFileListError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>('imported files');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'EXCEL' | 'CSV'>('ALL');

  // Selected file state
  const [selectedFileMeta, setSelectedFileMeta] = useState<GoogleDriveFileItem | null>(null);
  const [downloadedBuffer, setDownloadedBuffer] = useState<ArrayBuffer | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Pipeline & Import Session Active Identity State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [activeImportBatchId, setActiveImportBatchId] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [requiresSourceFileReattach, setRequiresSourceFileReattach] = useState<boolean>(false);

  // Pipeline Batch state
  const [activeBatch, setActiveBatch] = useState<UnifiedImportBatch | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnMappingMatch>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Review & Commit state
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR' | 'REQUIRES_REVIEW'>('ALL');
  const [expandedReviewRowNumber, setExpandedReviewRowNumber] = useState<number | null>(null);
  const [activeCreateFormKey, setActiveCreateFormKey] = useState<string | null>(null);
  const [isCreatingEntity, setIsCreatingEntity] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmWarnings, setConfirmWarnings] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<ImportResult | null>(null);
  const [showMappingDrawer, setShowMappingDrawer] = useState<boolean>(false);

  // Automated Test Suite State
  const [testResults, setTestResults] = useState<{
    ran: boolean;
    allPassed: boolean;
    total: number;
    passed: number;
    failed: number;
    results: GoogleDriveTestCaseResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [showTestPanel, setShowTestPanel] = useState<boolean>(false);

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    setShowTestPanel(true);
    try {
      const res = await runGoogleDriveImportTests();
      setTestResults({
        ran: true,
        allPassed: res.allPassed,
        total: res.total,
        passed: res.passed,
        failed: res.failed,
        results: res.results,
      });
    } catch (err: any) {
      console.error('Error running Google Drive tests:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const effectiveUserId = authContext?.userId || userId || '';
  const effectiveUserName = authContext?.displayName || userName || '';
  const effectiveRole = authContext?.role || userRole || '';

  const context: PipelineContext = useMemo(() => {
    const opId = activeOperationId || `OP-GDRV-${Date.now()}`;
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

          const reconstructedBatch: UnifiedImportBatch = {
            importBatchId: sessionRecord.importBatchId,
            projectId: sessionRecord.projectId,
            source: {
              sourceType: (sessionRecord.sourceType as any) || 'GOOGLE_DRIVE',
              importBatchId: sessionRecord.importBatchId,
              sourceFileName: sessionRecord.sourceMetadata?.sourceFileName || 'resumed_drive_file',
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
                details: 'Resumed Google Drive import session from server persistence',
              },
            ],
          };

          setActiveBatch(reconstructedBatch);

          if (reconstructedBatch.rows.length > 0 && reconstructedBatch.rows[0].raw) {
            const rawHeaders = Object.keys(reconstructedBatch.rows[0].raw).filter((k) => !k.startsWith('_'));
            const mappings = GoogleDrivePipelineService.inspectColumnMappings(rawHeaders);
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

  // Fetch Drive Files for current project
  const loadDriveFiles = async () => {
    setIsLoadingFiles(true);
    setFileListError(null);
    try {
      const res = await clientWorkspaceService.listDriveImportFiles(currentProjectId);
      setDriveFiles(res.files || []);
      if (res.folderName) setFolderName(res.folderName);
    } catch (err: any) {
      setFileListError(err?.message || 'فشل في استعراض ملفات Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadDriveFiles();
  }, [currentProjectId]);

  // Filtered Drive files in browser
  const filteredFiles = useMemo(() => {
    return driveFiles.filter((file) => {
      if (formatFilter !== 'ALL' && file.format !== formatFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return file.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [driveFiles, formatFilter, searchQuery]);

  // Handle selecting and downloading file from Google Drive
  const handleSelectDriveFile = async (file: GoogleDriveFileItem) => {
    setSelectedFileMeta(file);
    setProcessError(null);
    setActiveBatch(null);
    setCommitResult(null);
    setConfirmWarnings(false);

    const targetProjectId = currentProjectId || context.projectId;

    // Generate stable identities ONCE for new Drive import flow
    const stable = importSessionClientService.generateStableIdentities();
    const opId = stable.operationId;
    const batchId = stable.importBatchId;
    setActiveOperationId(opId);
    setActiveImportBatchId(batchId);

    let createdSessionId: string | null = null;
    let createdVersion = 0;

    if (targetProjectId) {
      try {
        const sessionRecord = await importSessionClientService.createSession(targetProjectId, {
          projectId: targetProjectId,
          operationId: opId,
          importBatchId: batchId,
          sourceType: 'GOOGLE_DRIVE',
          sourceMetadata: {
            sourceFileId: file.id,
            sourceFileName: file.name,
            sourceMimeType: file.mimeType,
            fileSize: file.size,
            folderName: folderName,
          },
        });

        createdSessionId = sessionRecord.importSessionId;
        createdVersion = sessionRecord.version;
        setActiveSessionId(createdSessionId);
        setSessionVersion(createdVersion);

        sessionStorage.setItem(
          `qsaudi_import_session_locator_${targetProjectId}`,
          JSON.stringify({
            projectId: targetProjectId,
            importSessionId: createdSessionId,
          })
        );
      } catch (err: any) {
        // FAIL CLOSED: STOP! DO NOT proceed to download or pipeline
        setIsDownloading(false);
        setIsProcessing(false);
        setProcessError(err?.message || 'فشل في إنشاء جلسة الاستيراد على الخادم. تم إيقاف المعالجة.');
        return;
      }
    }

    setRequiresSourceFileReattach(false);
    setIsDownloading(true);

    try {
      const { buffer } = await clientWorkspaceService.downloadDriveFileContent(file.id);
      setDownloadedBuffer(buffer);

      let sheets: string[] = [];
      let defaultSheet = '';

      if (file.format === 'EXCEL') {
        sheets = GoogleDrivePipelineService.getExcelSheets(buffer);
        setAvailableSheets(sheets);
        defaultSheet = sheets.length > 0 ? sheets[0] : '';
        setSelectedSheet(defaultSheet);
      } else {
        setAvailableSheets([]);
        setSelectedSheet('');
      }

      // Execute pipeline intake
      await runPipeline(buffer, file, defaultSheet, opId, batchId, createdSessionId, createdVersion);
    } catch (err: any) {
      setProcessError(err?.message || 'فشل في تحميل ومعالجة ملف Google Drive');
    } finally {
      setIsDownloading(false);
    }
  };

  const runPipeline = async (
    buffer: ArrayBuffer,
    fileMeta: GoogleDriveFileItem,
    sheetName?: string,
    overrideOpId?: string,
    overrideBatchId?: string,
    overrideSessionId?: string | null,
    overrideVersion?: number
  ) => {
    try {
      setIsProcessing(true);
      setProcessError(null);

      const opId = overrideOpId || activeOperationId || `OP-GDRV-${Date.now()}`;
      const batchId = overrideBatchId || activeImportBatchId || undefined;
      const sessionId = overrideSessionId !== undefined ? overrideSessionId : activeSessionId;
      const currentVer = overrideVersion !== undefined ? overrideVersion : sessionVersion;
      const targetProjectId = currentProjectId || context.projectId;

      const activeContext: PipelineContext = {
        ...context,
        projectId: targetProjectId,
        operationId: opId,
      };

      const batch = await GoogleDrivePipelineService.processDriveFileToReview(
        buffer,
        fileMeta,
        activeContext,
        { sheetName, importBatchId: batchId }
      );

      setActiveBatch(batch);

      // Inspect column mappings
      if (batch.rows.length > 0 && batch.rows[0].raw) {
        const rawHeaders = Object.keys(batch.rows[0].raw).filter((k) => !k.startsWith('_'));
        const mappings = GoogleDrivePipelineService.inspectColumnMappings(rawHeaders);
        setColumnMappings(mappings);
      }

      // Save REVIEW checkpoint to server session
      if (targetProjectId && sessionId) {
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
            targetProjectId,
            sessionId,
            {
              lifecycleState: 'REVIEW_REQUIRED',
              currentStage: 'REVIEW',
              reviewSnapshot: cleanSnapshot,
              validationIssues: batch.issues || [],
              warningConfirmation: confirmWarnings,
              sourceMetadata: {
                sourceFileId: fileMeta.id,
                sourceFileName: fileMeta.name,
                sourceMimeType: fileMeta.mimeType,
                fileSize: fileMeta.size,
                sourceSheetName: sheetName,
                folderName: folderName,
              },
            },
            currentVer
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
      setProcessError(err?.message || 'حدث خطأ أثناء فحص وتحليل الملف');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = async (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (downloadedBuffer && selectedFileMeta) {
      await runPipeline(downloadedBuffer, selectedFileMeta, newSheet);
    }
  };

  const handleApplyRowAction = async (
    rowNumber: number,
    action: 'ACCEPT_WARNING' | 'REJECT_ROW'
  ) => {
    if (!activeBatch) return;
    const targetProjectId = currentProjectId || context.projectId;
    const activeContext: PipelineContext = {
      ...context,
      projectId: targetProjectId,
      operationId: activeOperationId || `OP-REVIEW-${Date.now()}`,
    };

    const updated = GoogleDrivePipelineService.applyRowReview(
      activeBatch,
      rowNumber,
      action,
      activeContext,
      action === 'ACCEPT_WARNING' ? 'قبول يدوي من مراجع Google Drive' : 'استبعاد السطر يدوياً'
    );
    setActiveBatch(updated);

    if (targetProjectId && activeSessionId) {
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
          targetProjectId,
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
    if (!activeBatch) return;
    const targetProjectId = currentProjectId || context.projectId;

    try {
      setProcessError(null);
      const activeContext: PipelineContext = {
        ...context,
        projectId: targetProjectId,
        operationId: activeOperationId || context.operationId,
      };
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        activeBatch,
        rowNumber,
        entityTypeKey,
        decision,
        candidate || {},
        activeContext,
        effectiveUserId || 'user'
      );

      setActiveBatch({ ...updated });

      if (targetProjectId && activeSessionId) {
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
          targetProjectId,
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
    if (!activeBatch || (!currentProjectId && !context.projectId)) return;
    const targetProjectId = currentProjectId || context.projectId;

    const row = activeBatch.rows.find((r) => r.rowNumber === rowNumber);
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
          projectId: targetProjectId,
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
          projectId: targetProjectId,
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
          if (carrierRes && !GoogleDrivePipelineService.checkResolutionRequiresAttention(carrierRes)) {
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
          projectId: targetProjectId,
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
          if (carrierRes && !GoogleDrivePipelineService.checkResolutionRequiresAttention(carrierRes)) {
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
          projectId: targetProjectId,
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

      const updated = GoogleDrivePipelineService.applyCreatedEntityResolution(
        activeBatch,
        rowNumber,
        entityTypeKey,
        result,
        context
      );

      setActiveBatch({ ...updated });
      setActiveCreateFormKey(null);

      if (targetProjectId && activeSessionId) {
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
            targetProjectId,
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
    const targetProjectId = currentProjectId || context.projectId;
    if (targetProjectId && activeSessionId) {
      try {
        const updatedSession = await importSessionClientService.updateCheckpoint(
          targetProjectId,
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
    const targetProjectId = currentProjectId || context.projectId;

    try {
      setIsCommitting(true);
      setProcessError(null);

      const { batch: finalBatch, result } = await GoogleDrivePipelineService.commitBatch(
        activeBatch,
        {
          ...context,
          operationId: activeOperationId || context.operationId,
          allowWarningsCommit: confirmWarnings,
        }
      );

      setActiveBatch(finalBatch);
      setCommitResult(result);

      const isFullSuccess = result.success && (result.failedRows === undefined || result.failedRows === 0);

      if (isFullSuccess) {
        if (targetProjectId && activeSessionId) {
          try {
            const updatedSession = await importSessionClientService.updateCheckpoint(
              targetProjectId,
              activeSessionId,
              {
                lifecycleState: 'COMMITTED',
                currentStage: 'COMMITTED',
              },
              sessionVersion
            );
            setSessionVersion(updatedSession.version);
            sessionStorage.removeItem(`qsaudi_import_session_locator_${targetProjectId}`);
          } catch {
            // Commit succeeded on business domain; ignore session close error
          }
        }

        if (onCommitSuccess) {
          onCommitSuccess(result);
        }
      } else {
        // Partial or failed commit: keep session active as REVIEW_REQUIRED, checkpoint updated batch, keep locator
        if (targetProjectId && activeSessionId) {
          try {
            const cleanSnapshot = {
              totalRows: finalBatch.totalRows,
              validRows: finalBatch.validRows,
              warningRows: finalBatch.warningRows,
              errorRows: finalBatch.errorRows,
              requiresReviewRows: finalBatch.requiresReviewRows,
              committedRows: finalBatch.committedRows,
              rows: finalBatch.rows.map((r) => {
                const { rawInput, ...rest } = r as any;
                return rest;
              }),
            };

            const updatedSession = await importSessionClientService.updateCheckpoint(
              targetProjectId,
              activeSessionId,
              {
                lifecycleState: 'REVIEW_REQUIRED',
                currentStage: 'REVIEW',
                reviewSnapshot: cleanSnapshot,
                validationIssues: finalBatch.issues || [],
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
      setProcessError(err?.message || 'حدث خطأ أثناء اعتماد الدفعة');
    } finally {
      setIsCommitting(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!activeBatch) return [];
    return activeBatch.rows.filter((r) => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'VALID') return r.status === 'VALID';
      if (filterStatus === 'WARNING') return r.status === 'WARNING';
      if (filterStatus === 'ERROR') return r.status === 'ERROR';
      if (filterStatus === 'REQUIRES_REVIEW') return r.reviewStatus === 'requires_review';
      return true;
    });
  }, [activeBatch, filterStatus]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6" id="google-drive-import-section">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-stone-900">
                  استيراد ملفات Google Drive (BLOCK 32)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Google Drive Source
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Reuses Unified Pipeline (BLOCK 30)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                تصفح واختيار ملفات Excel و CSV من مجلد المشروع في Google Drive ثم تمريرها إلى مسار التدقيق الموحد بدون أي كتابة في قاعدة البيانات قبل الاعتماد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700">
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              <span>المجلد: {folderName}</span>
            </div>
            <button
              onClick={runAutomatedTests}
              disabled={isRunningTests}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>فحص واختبارات BLOCK 32</span>
            </button>
            <button
              onClick={loadDriveFiles}
              disabled={isLoadingFiles}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>تحديث الملفات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Automated Tests Result Panel */}
      {showTestPanel && testResults && (
        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  نتائج اختبارات تكامل Google Drive (BLOCK 32 Verification Suite)
                </h3>
                <p className="text-xs text-stone-600">
                  {testResults.allPassed
                    ? `اجتازت جميع الفحوصات (${testResults.passed} من ${testResults.total}) بنجاح تام وبدون أي أخطاء.`
                    : `فشلت بعض الفحوصات (${testResults.failed} من ${testResults.total}).`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black ${
                  testResults.allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {testResults.passed} / {testResults.total} ناجح
              </span>
              <button
                onClick={() => setShowTestPanel(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testResults.results.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  t.passed
                    ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}
              >
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-stone-500">{t.id}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        t.passed ? 'bg-emerald-200/60 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <h5 className="font-bold text-stone-900 truncate" title={t.name}>
                    {t.name}
                  </h5>
                  <p className="text-[11px] text-stone-600">{t.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Drive Files Browser & Picker */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>الملفات المتاحة في Google Drive للمشروع ({currentProjectId})</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600">
              {filteredFiles.length} ملف
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الملف..."
                className="pr-8 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 w-48"
              />
            </div>

            <div className="flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-50 text-xs">
              <button
                onClick={() => setFormatFilter('ALL')}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  formatFilter === 'ALL' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFormatFilter('EXCEL')}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  formatFilter === 'EXCEL' ? 'bg-white shadow-xs text-emerald-800' : 'text-stone-600'
                }`}
              >
                Excel
              </button>
              <button
                onClick={() => setFormatFilter('CSV')}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  formatFilter === 'CSV' ? 'bg-white shadow-xs text-blue-800' : 'text-stone-600'
                }`}
              >
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Files Grid / List */}
        {isLoadingFiles ? (
          <div className="py-12 text-center text-stone-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">جاري فحص واسترجاع ملفات Google Drive...</p>
          </div>
        ) : fileListError ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fileListError}</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-10 text-center text-stone-500 space-y-1">
            <Folder className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-bold text-stone-700">لا توجد ملفات متوافقة في المجلد</p>
            <p className="text-[11px] text-stone-500">
              تأكد من وجود ملفات بصيغة .xlsx أو .xls أو .csv في مجلد المشروع.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFiles.map((file) => {
              const isSelected = selectedFileMeta?.id === file.id;
              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-xl border transition-all text-right flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                          file.format === 'EXCEL'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {file.format}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                        {file.format === 'EXCEL' ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-1">
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                        ID: {file.id}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <span>الحجم: {formatFileSize(file.size)}</span>
                      <span>
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ar-SA') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSelectDriveFile(file)}
                      disabled={isDownloading && isSelected}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      {isDownloading && isSelected ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>اختيار وتمرير للـ Pipeline</span>
                        </>
                      )}
                    </button>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        title="فتح في Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Selected File Intake & Sheet Configuration */}
      {selectedFileMeta && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-stone-900">{selectedFileMeta.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    GOOGLE_DRIVE SOURCE
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600 mt-0.5">
                  <span>معرف الملف: {selectedFileMeta.id}</span>
                  <span>•</span>
                  <span>الحجم: {formatFileSize(selectedFileMeta.size)}</span>
                  <span>•</span>
                  <span>الصيغة: {selectedFileMeta.format}</span>
                </div>
              </div>
            </div>

            {/* Multi-sheet selector for Excel */}
            {availableSheets.length > 1 && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-xs font-bold text-stone-700 whitespace-nowrap">ورقة العمل (Sheet):</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  disabled={isProcessing}
                  className="text-xs bg-transparent border-0 font-bold text-stone-900 focus:outline-none cursor-pointer"
                >
                  {availableSheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {processError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{processError}</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Active Batch Statistics & Stage Tracker */}
      {activeBatch && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  بوابة المراجعة البشرية (REVIEW GATE)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700">
                  {activeBatch.importBatchId}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                تم استلام ملف Google Drive وتمريره عبر 7 مراحل تدقيق متتالية. توقف إلزامي لمنع أي كتابة قبل الاعتماد الصريح.
              </p>
            </div>

            <button
              onClick={() => setShowMappingDrawer(!showMappingDrawer)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فحص مطابقة الأعمدة ({Object.keys(columnMappings).length})</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-500">إجمالي الصفوف</span>
              <p className="text-2xl font-black text-stone-900 font-mono">{activeBatch.totalRows}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>صفوف سليمة</span>
              </span>
              <p className="text-2xl font-black text-emerald-800 font-mono">{activeBatch.validRows}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>تحذيرات (Warnings)</span>
              </span>
              <p className="text-2xl font-black text-amber-800 font-mono">{activeBatch.warningRows}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>أخطاء مانعة (Errors)</span>
              </span>
              <p className="text-2xl font-black text-rose-800 font-mono">{activeBatch.errorRows}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>تتطلب مراجعة</span>
              </span>
              <p className="text-2xl font-black text-purple-800 font-mono">{activeBatch.requiresReviewRows}</p>
            </div>
          </div>

          {/* Column Mappings Drawer if toggled */}
          {showMappingDrawer && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold text-stone-900">
                خريطة مطابقة الأعمدة المكتشفة من ملف Google Drive:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(columnMappings).map(([rawCol, mapping]) => (
                  <div
                    key={rawCol}
                    className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-stone-800 font-mono truncate max-w-[140px]" title={rawCol}>
                      {rawCol}
                    </span>
                    <div className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-stone-400 rotate-180" />
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                        {String(mapping.canonicalField)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Filters */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                الكل ({activeBatch.rows.length})
              </button>
              <button
                onClick={() => setFilterStatus('VALID')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'VALID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
                }`}
              >
                سليم ({activeBatch.validRows})
              </button>
              <button
                onClick={() => setFilterStatus('WARNING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'WARNING' ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600'
                }`}
              >
                تحذير ({activeBatch.warningRows})
              </button>
              <button
                onClick={() => setFilterStatus('ERROR')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'ERROR' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-600'
                }`}
              >
                خطأ ({activeBatch.errorRows})
              </button>
            </div>

            <span className="text-xs text-stone-500">
              معروض: {filteredRows.length} من {activeBatch.rows.length} سطر
            </span>
          </div>

          {/* Rows Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">رقم التذكرة</th>
                  <th className="p-3">رقم الشاحنة</th>
                  <th className="p-3">الناقل</th>
                  <th className="p-3">السائق</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">الوزن (صافي / قائم / فارغ)</th>
                  <th className="p-3">الحالة والملاحظات</th>
                  <th className="p-3 text-center">إجراءات المراجعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRows.map((row) => {
                  const canonical = (row.mapped || row.canonical || {}) as any;
                  const hasErrors = row.validationIssues.some((i) => i.blocking);
                  const hasWarnings = row.validationIssues.some((i) => i.severity === 'WARNING');
                  const isRejected = row.status === 'REJECTED';
                  const needsResolution = GoogleDrivePipelineService.rowRequiresEntityResolution(row) || row.reviewStatus === 'requires_review';

                  return (
                    <React.Fragment key={row.rowNumber}>
                      <tr
                        className={`hover:bg-stone-50/60 transition-colors ${
                          isRejected
                            ? 'bg-stone-100/70 opacity-60'
                            : hasErrors
                            ? 'bg-rose-50/30'
                            : hasWarnings
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-stone-500">{row.rowNumber}</td>
                        <td className="p-3 font-bold font-mono text-stone-900">
                          {canonical.ticketId || canonical.ticketNo || '—'}
                        </td>
                        <td className="p-3 font-mono text-stone-800">
                          {canonical.truckId || canonical.truckNo || '—'}
                        </td>
                        <td className="p-3 text-stone-800">
                          {canonical.carrierId || canonical.carrier || '—'}
                        </td>
                        <td className="p-3 text-stone-700">
                          {canonical.driverId || canonical.driverName || '—'}
                        </td>
                        <td className="p-3 text-stone-700">
                          {canonical.materialId || canonical.materialType || '—'}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className="font-bold text-stone-900">
                            {canonical.netWeight ? `${canonical.netWeight} كجم` : '—'}
                          </span>
                          <span className="text-stone-400 block text-[10px]">
                            قائم: {canonical.grossWeight || 0} | فارغ: {canonical.tareWeight || 0}
                          </span>
                        </td>
                        <td className="p-3 space-y-1 max-w-xs">
                          {isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                              مستبعد (Rejected)
                            </span>
                          ) : hasErrors ? (
                            row.validationIssues
                              .filter((i) => i.blocking)
                              .map((issue) => (
                                <div
                                  key={issue.issueId}
                                  className="text-[11px] text-rose-700 font-semibold flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3 shrink-0" />
                                  <span>{issue.messageAr || issue.message}</span>
                                </div>
                              ))
                          ) : hasWarnings ? (
                            row.validationIssues
                              .filter((i) => i.severity === 'WARNING')
                              .map((issue) => (
                                <div
                                  key={issue.issueId}
                                  className="text-[11px] text-amber-800 flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                                  <span>{issue.messageAr || issue.message}</span>
                                </div>
                              ))
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>سليم ومطابق</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
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

                            <div className="flex items-center justify-center gap-1.5">
                              {row.reviewStatus === 'warning' && !isRejected && (
                                <button
                                  onClick={() => handleApplyRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="قبول التنبيه يدوياً"
                                >
                                  قبول التنبيه
                                </button>
                              )}
                              {!isRejected && (
                                <button
                                  onClick={() => handleApplyRowAction(row.rowNumber, 'REJECT_ROW')}
                                  className="px-2 py-1 rounded bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-800 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="استبعاد هذا السطر"
                                >
                                  استبعاد
                                </button>
                              )}
                              {isRejected && (
                                <span className="text-[11px] text-stone-400 font-bold">تم الاستبعاد</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Candidate Resolution Drawer */}
                      {expandedReviewRowNumber === row.rowNumber && (
                        <tr className="bg-blue-50/30 border-b border-blue-200/80">
                          <td colSpan={9} className="p-4">
                            <div className="p-4 rounded-xl bg-white border border-blue-200/90 shadow-xs space-y-4 text-right">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                <div className="font-bold text-xs text-blue-900 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                  <span>مراجعة مطابقة الكيانات للصف رقم {row.rowNumber} (Existing Candidate Resolution)</span>
                                </div>
                                <button
                                  onClick={() => setExpandedReviewRowNumber(null)}
                                  className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(['carrier', 'truck', 'driver', 'material'] as const)
                                  .filter((k) => GoogleDrivePipelineService.checkResolutionRequiresAttention(row.entityResolutions?.[k]))
                                  .map((entityKey) => {
                                    const res = row.entityResolutions![entityKey]!;
                                    const labelAr = entityKey === 'carrier' ? 'الناقل' : entityKey === 'truck' ? 'الشاحنة' : entityKey === 'driver' ? 'السائق' : 'المادة';
                                    const candidates = res.candidates || [];

                                    return (
                                      <div key={entityKey} className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="font-black text-xs text-stone-900">{labelAr}</span>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            res.riskLevel === 'CRITICAL' || res.riskLevel === 'HIGH'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            مستوى المخاطرة: {res.riskLevel}
                                          </span>
                                        </div>

                                        <div className="text-xs space-y-1">
                                          <div><span className="text-stone-500 font-bold">القيمة المستوردة: </span><span className="font-mono font-bold text-stone-800">{res.sourceValue || res.originalValue || '-'}</span></div>
                                          {res.matchedName && (
                                            <div><span className="text-stone-500 font-bold">المطابق الحالي: </span><span className="font-bold text-emerald-800">{res.matchedName}</span> <span className="text-[10px] text-stone-400 font-mono">({(res.confidence * 100).toFixed(0)}%)</span></div>
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
                                            <span className="text-[11px] font-bold text-stone-600 block">المرشحون المتاحون للمطابقة:</span>
                                            <div className="space-y-1">
                                              {candidates.map((cand) => (
                                                <div key={cand.candidateEntityId} className="flex items-center justify-between p-2 rounded bg-white border border-stone-200 text-xs">
                                                  <div>
                                                    <span className="font-bold text-stone-900">{cand.candidateDisplayName}</span>
                                                    <span className="text-[10px] text-stone-400 font-mono pr-2">({(cand.confidence * 100).toFixed(0)}%)</span>
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
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
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
                                            className="px-3 py-1.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                                          >
                                            ترك غير مطابق
                                          </button>
                                          {GoogleDrivePipelineService.checkResolutionRequiresAttention(res) && (
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

          {/* 5. Pre-Commit Gate & Final Transaction Action */}
          <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-black">بوابة الاعتماد والتسجيل (Commit Gate)</h4>
                </div>
                <p className="text-xs text-stone-300">
                  {activeBatch.errorRows > 0
                    ? `توجد (${activeBatch.errorRows}) أخطاء مانعة. يمنع النظام الاعتماد حتى معالجة أو استبعاد الصفوف المرفوضة.`
                    : activeBatch.warningRows > 0
                    ? `توجد (${activeBatch.warningRows}) تنبيهات تشغيلية. يلزم تأكيد المشرف قبل الاعتماد.`
                    : 'كافة الصفوف مفحوصة ومطابقة وجاهزة للتسجيل النهائي في سجل رحلات المشروع.'}
                </p>
              </div>

              {/* Warning Confirmation Checkbox */}
              {activeBatch.warningRows > 0 && activeBatch.errorRows === 0 && (
                <label className="flex items-center gap-2 bg-stone-800 px-4 py-2 rounded-xl text-xs text-amber-300 font-bold cursor-pointer border border-amber-500/30">
                  <input
                    type="checkbox"
                    checked={confirmWarnings}
                    onChange={(e) => handleConfirmWarningsChange(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>أؤكد مراجعة كافة التنبيهات وموافقتي على تسجيل الرحلات</span>
                </label>
              )}

              {/* Commit Button */}
              <button
                onClick={handleCommit}
                disabled={
                  isCommitting ||
                  activeBatch.errorRows > 0 ||
                  (activeBatch.warningRows > 0 && !confirmWarnings)
                }
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer ${
                  activeBatch.errorRows > 0 || (activeBatch.warningRows > 0 && !confirmWarnings)
                    ? 'bg-stone-700 text-stone-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                }`}
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الاعتماد الفعلي...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>اعتماد وتسجيل الرحلات الرسمية (Commit to Trips)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Commit Success Banner */}
      {commitResult && commitResult.success && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black">
                تم اعتماد وتوثيق دفعة Google Drive بنجاح في سجل الرحلات الرسمي!
              </h3>
              <p className="text-xs text-emerald-800">
                المصدر: Google Drive | معرف العملية (Operation ID): {commitResult.operationId} | المشروع:{' '}
                {commitResult.projectId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-[11px] text-stone-500 font-bold block">الرحلات المسجلة</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {commitResult.committedRows} رحلة
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-[11px] text-stone-500 font-bold block">الصفوف المستبعدة</span>
              <span className="text-xl font-black text-stone-600 font-mono">
                {commitResult.skippedRows} سطر
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-[11px] text-stone-500 font-bold block">حالة المصدر</span>
              <span className="text-sm font-black text-emerald-800">GOOGLE_DRIVE</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-[11px] text-stone-500 font-bold block">التدقيق والرقابة</span>
              <span className="text-sm font-black text-emerald-800">سجل تدقيق موثق</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const canonical = (row as any).normalized?.canonicalData || row.canonical || (row as any).mapped || {};
  const raw = row.raw || {};

  // Carrier prefill
  const [carrierNameAr, setCarrierNameAr] = useState(res.sourceValue || res.originalValue || canonical.carrier || canonical.carrierName || '');
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState(canonical.commercialRegistrationNo || raw.commercialRegistrationNo || raw.crNumber || '');
  const [transportLicenseNo, setTransportLicenseNo] = useState(canonical.transportLicenseNo || raw.transportLicenseNo || '');

  // Material prefill
  const [materialNameAr, setMaterialNameAr] = useState(res.sourceValue || res.originalValue || canonical.materialType || canonical.materialName || '');
  const [materialCode, setMaterialCode] = useState(canonical.materialCode || raw.materialCode || raw.code || '');

  // Driver prefill
  const [driverName, setDriverName] = useState(canonical.driverName || canonical.driverId || res.sourceValue || res.originalValue || '');
  const [residencyId, setResidencyId] = useState(
    canonical.residencyId || canonical.driverIdentity || canonical.nationalOrIqamaId || raw.residencyId || raw.driverIdentity || raw.nationalOrIqamaId || raw.idNumber || ''
  );
  const [driverPhone, setDriverPhone] = useState(canonical.driverPhone || canonical.phone || raw.phone || '');

  // Truck prefill
  const [plateNumber, setPlateNumber] = useState(canonical.plateNumber || canonical.truckNo || canonical.truckId || canonical.truckPlate || res.sourceValue || res.originalValue || '');
  const [truckType, setTruckType] = useState(canonical.truckType || raw.truckType || '');
  const [tareWeightKg, setTareWeightKg] = useState<string>(canonical.tareWeight ? String(canonical.tareWeight) : (canonical.tareWeightKg ? String(canonical.tareWeightKg) : (raw.tareWeightKg ? String(raw.tareWeightKg) : '')));
  const [maxGrossWeightKg, setMaxGrossWeightKg] = useState<string>(
    canonical.grossWeight ? String(canonical.grossWeight) : (canonical.maxGrossWeightKg ? String(canonical.maxGrossWeightKg) : (raw.maxGrossWeightKg ? String(raw.maxGrossWeightKg) : ''))
  );

  // Check carrier dependency for Driver and Truck
  let carrierId = row.resolvedValues?.carrierId;
  if (!carrierId) {
    const carrierRes = row.entityResolutions?.carrier;
    if (carrierRes && !GoogleDrivePipelineService.checkResolutionRequiresAttention(carrierRes)) {
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
        <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer">
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
                <label className="block font-bold text-stone-700 mb-1">اسم الناقل (العربية)</label>
                <input
                  type="text"
                  value={carrierNameAr}
                  onChange={(e) => setCarrierNameAr(e.target.value)}
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">رقم السجل التجاري <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={commercialRegistrationNo}
                  onChange={(e) => setCommercialRegistrationNo(e.target.value)}
                  placeholder="مثال: 1010123456"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">رقم ترخيص النقل (اختياري)</label>
                <input
                  type="text"
                  value={transportLicenseNo}
                  onChange={(e) => setTransportLicenseNo(e.target.value)}
                  placeholder="مثال: 01-123456"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {entityKey === 'material' && (
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">اسم المادة (العربية)</label>
                <input
                  type="text"
                  value={materialNameAr}
                  onChange={(e) => setMaterialNameAr(e.target.value)}
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">رمز المادة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  placeholder="مثال: MAT-SAND-01"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
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
                <label className="block font-bold text-stone-700 mb-1">اسم السائق</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">رقم الهوية / الإقامة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={residencyId}
                  onChange={(e) => setResidencyId(e.target.value)}
                  placeholder="مثال: 1098765432"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
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
                <label className="block font-bold text-stone-700 mb-1">رقم اللوحة <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="مثال: 1234 أ ب ج"
                  className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نوع الشاحنة (اختياري)</label>
                  <input
                    type="text"
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full p-1.5 rounded border border-stone-300 bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم)</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(e.target.value)}
                    className="w-full p-1.5 rounded border border-stone-300 bg-white font-mono focus:ring-1 focus:ring-blue-500"
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
              className="px-3 py-1.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </>
      )}
    </form>
  );
}
