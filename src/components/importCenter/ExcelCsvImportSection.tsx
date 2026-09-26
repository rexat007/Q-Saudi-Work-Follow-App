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
} from 'lucide-react';
import { ExcelCsvPipelineService } from '../../services/import/excelCsvPipeline.service';
import { importSessionClientService } from '../../services/import/importSessionClient.service';
import { UnifiedImportBatch, PipelineContext, ImportResult, ImportRow, ImportSource } from '../../types/unifiedImport';
import { ColumnMappingMatch } from '../../types/excelCsvImport';
import { RelationshipContext } from '../../types/dataQuality';
import { ImportProjectContextAdapter } from '../../services/import/importProjectContext.adapter';
import { AuthUserContext } from '../../types/common';
import { smartSourceDiscoveryService } from '../../services/import/smartSourceDiscovery.service';

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
      setConfirmWarnings(false);
      setActiveBatch(null);
    }

    let createdSessionId: string | null = activeSessionId;
    let createdVersion = sessionVersion;

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);

      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';

      // Create server session if new flow and currentProjectId is present
      if (!isReattach && currentProjectId) {
        try {
          const sessionRecord = await importSessionClientService.createSession(currentProjectId, {
            projectId: currentProjectId,
            operationId: opId,
            importBatchId: batchId,
            sourceType,
            sourceMetadata: {
              sourceFileName: file.name,
              sourceMimeType: file.type,
              fileSize: file.size,
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
          // ISSUE 2: CREATE SESSION MUST FAIL CLOSED
          setIsProcessing(false);
          setProcessError(err?.message || 'فشل في إنشاء جلسة الاستيراد على الخادم. تم إيقاف المعالجة.');
          return; // STOP! DO NOT proceed to discovery/pipeline!
        }
      }

      setRequiresSourceFileReattach(false);

      const importSource: ImportSource = {
        sourceType,
        importBatchId: batchId,
        sourceFileName: file.name,
      };

      const discovery = await smartSourceDiscoveryService.discover(importSource, buffer);
      setDiscoveryResult(discovery);

      const sheets = discovery.availableSheets || [];
      const defaultSheet = discovery.selectedSheet || '';
      const detectedIdx = discovery.detectedHeaderRowIndex || 0;

      setAvailableSheets(sheets);
      setSelectedSheet(defaultSheet);
      setHeaderRowIndex(detectedIdx);

      // Execute pipeline through review stage passing local variables explicitly (ISSUE 1 FIX)
      await runPipeline(
        buffer,
        file.name,
        file.size,
        file.type,
        defaultSheet,
        detectedIdx,
        opId,
        batchId,
        createdSessionId,
        createdVersion
      );
    } catch (err: any) {
      setProcessError(err?.message || 'حدث خطأ أثناء فحص وتحليل الملف');
    } finally {
      setIsProcessing(false);
    }
  };

  const runPipeline = async (
    buffer: ArrayBuffer,
    fileName: string,
    fileSize: number,
    mimeType: string,
    sheetName?: string,
    overriddenHeaderRowIndex?: number,
    overrideOpId?: string,
    overrideBatchId?: string,
    overrideSessionId?: string | null,
    overrideVersion?: number
  ) => {
    try {
      setIsProcessing(true);
      setProcessError(null);

      const targetHeaderRowIdx = overriddenHeaderRowIndex !== undefined ? overriddenHeaderRowIndex : headerRowIndex;
      const opId = overrideOpId || activeOperationId || `OP-IMP-${Date.now()}`;
      const batchId = overrideBatchId || activeImportBatchId || undefined;
      const sessionId = overrideSessionId !== undefined ? overrideSessionId : activeSessionId;
      const currentVer = overrideVersion !== undefined ? overrideVersion : sessionVersion;

      const activeContext: PipelineContext = {
        ...context,
        operationId: opId,
      };

      const batch = await ExcelCsvPipelineService.processFileToReview(
        buffer,
        fileName,
        fileSize,
        mimeType,
        activeContext,
        {
          sheetName,
          headerRowIndex: targetHeaderRowIdx,
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
      if (currentProjectId && sessionId) {
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
            sessionId,
            {
              lifecycleState: 'REVIEW_REQUIRED',
              currentStage: 'REVIEW',
              reviewSnapshot: cleanSnapshot,
              validationIssues: batch.issues || [],
              warningConfirmation: confirmWarnings,
              sourceMetadata: {
                sourceFileName: fileName,
                sourceMimeType: mimeType,
                fileSize,
                sourceSheetName: sheetName,
                headerRowIndex: targetHeaderRowIdx,
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
      setProcessError(err?.message || 'فشل في تشغيل مسار الاستيراد الموحد');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = async (sheet: string) => {
    setSelectedSheet(sheet);
    if (selectedFile && fileBuffer && discoveryResult) {
      const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
      const importSource: ImportSource = {
        sourceType,
        importBatchId: activeImportBatchId || `BAT-${Date.now()}`,
        sourceFileName: selectedFile.name,
        sourceSheetName: sheet,
      };

      try {
        const updatedDiscovery = await smartSourceDiscoveryService.discover(importSource, fileBuffer);
        setDiscoveryResult(updatedDiscovery);
        const detectedIdx = updatedDiscovery.detectedHeaderRowIndex || 0;
        setHeaderRowIndex(detectedIdx);
        await runPipeline(fileBuffer, selectedFile.name, selectedFile.size, selectedFile.type, sheet, detectedIdx);
      } catch (err: any) {
        console.error('Sheet change discovery failed, using fallback:', err);
        await runPipeline(fileBuffer, selectedFile.name, selectedFile.size, selectedFile.type, sheet, headerRowIndex);
      }
    }
  };

  const handleHeaderRowIndexChange = async (index: number) => {
    setHeaderRowIndex(index);
    if (selectedFile && fileBuffer) {
      await runPipeline(fileBuffer, selectedFile.name, selectedFile.size, selectedFile.type, selectedSheet, index);
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

        {/* Selected File Details & Sheet Selection */}
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

            {availableSheets.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700">ورقة العمل (Sheet):</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        )}

        {/* Smart Source Discovery Preview Panel */}
        {selectedFile && discoveryResult && (() => {
          const isAmbiguous = discoveryResult.requiresReview || discoveryResult.confidence < 80;
          const shouldShowDetails = isAmbiguous || showManualOverrides;

          return (
            <div className="mt-4 p-5 rounded-2xl bg-stone-50 border border-stone-200/90 text-right space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 font-semibold">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h4 className="text-sm font-black text-stone-900">
                    تحليل الكشف الذكي عن مصدر البيانات (Smart Source Discovery Analysis)
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500">مستوى الثقة والموثوقية:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                      discoveryResult.confidence >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : discoveryResult.confidence >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {discoveryResult.confidence}%
                    </span>
                  </div>
                  
                  {!shouldShowDetails && (
                    <button
                      onClick={() => setShowManualOverrides(true)}
                      className="px-3 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      تعديل الخيارات يدوياً (Manual Overrides)
                    </button>
                  )}
                </div>
              </div>

              {!shouldShowDetails ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                    تم كشف وتطابق المخطط بنجاح وثقة عالية جدّاً (Auto-Discovery Optimal). الملف جاهز للمراجعة والاستيراد.
                  </span>
                  <span className="text-stone-400 font-normal">
                    ترويسة صف {headerRowIndex + 1} | ورقة {selectedSheet || 'N/A'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-stone-500 block">نوع الملف ونطاقه</span>
                      <span className="font-mono font-black text-stone-800 bg-white px-2.5 py-1 rounded border border-stone-200 inline-block">
                        {discoveryResult.sourceType}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-stone-500 block">ورقة العمل الموصى بها</span>
                      <span className="font-bold text-stone-800 bg-white px-2.5 py-1 rounded border border-stone-200 inline-block">
                        {discoveryResult.selectedSheet || 'N/A'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-stone-500 block">صف الترويسة المكتشف (Header Row)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-800 bg-white px-2.5 py-1 rounded border border-stone-200 inline-block">
                          الصف {headerRowIndex + 1} (مؤشر: {headerRowIndex})
                        </span>
                        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded px-1.5 py-0.5">
                          <span className="text-[10px] text-stone-500 font-bold">تعديل الترويسة:</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={headerRowIndex}
                            onChange={(e) => handleHeaderRowIndexChange(parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono font-bold bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mapped Headers Diagnostics Preview */}
                  <div className="pt-2">
                    <span className="font-bold text-stone-700 block mb-2">
                      تشخيصات تطابق الأعمدة المكتشفة (Detected Header Mapping Diagnostics)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {discoveryResult.detectedHeaders?.map((header: string) => {
                        const match = discoveryResult.mappingDiagnostics?.[header];
                        const isMapped = match && match.confidence >= 0.70 && !String(match.canonicalField).startsWith('unmapped_');

                        return (
                          <div
                            key={header}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${
                              isMapped
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            <span>{header}</span>
                            <ArrowRight className="w-3 h-3 text-stone-400 rotate-180" />
                            <span className="font-mono text-[10px]">
                              {isMapped ? String(match.canonicalField) : 'unmapped'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

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
                    const isRejected = row.reviewStatus === 'rejected';

                    return (
                      <tr
                        key={row.rowNumber}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Warning Confirmation Checkbox & Commit Action */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
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
                تنبيه: لن يتم اعتماد أي شحنة تحتوي على أخطاء قاتلة (Fatal Errors). الشحنات السليمة والموافق عليها فقط هي التي سيتم اعتمادها وحفظها في Firestore.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleCommit}
                disabled={isCommitting || activeBatch.validRows === 0}
                className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                  isCommitting || activeBatch.validRows === 0
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
                    <span>اعتماد وتحفيظ الشحنات الرسمية</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Commit Success Banner */}
          {commitResult && commitResult.success && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>تم اعتماد وتحفيظ الشحنات بنجاح في سجلات المشروع!</span>
              </div>
              <div className="text-xs text-emerald-800 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div>تم إنشاء: {commitResult.createdCount}</div>
                <div>تم تحديث: {commitResult.updatedCount}</div>
                <div>تم التجاوز: {commitResult.skippedCount}</div>
                <div>فشل: {commitResult.failedCount}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
