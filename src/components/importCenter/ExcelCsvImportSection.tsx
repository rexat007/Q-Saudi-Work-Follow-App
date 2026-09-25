import React, { useState, useRef, useMemo } from 'react';
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
    if (pipelineContext) {
      return {
        ...pipelineContext,
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
        operationId: `OP-IMP-${Date.now()}`,
        allowWarningsCommit: confirmWarnings,
      });
    }

    return {
      projectId: currentProjectId,
      userId: effectiveUserId,
      userName: effectiveUserName,
      role: effectiveRole,
      operationId: `OP-IMP-${Date.now()}`,
      allowWarningsCommit: confirmWarnings,
      knownEntities: ImportProjectContextAdapter.toPipelineKnownEntities(null),
    };
  }, [pipelineContext, canonicalRelationshipContext, currentProjectId, effectiveUserId, effectiveUserName, effectiveRole, confirmWarnings]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setProcessError(null);
    setActiveBatch(null);
    setCommitResult(null);
    setConfirmWarnings(false);

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);

      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
      const importSource: ImportSource = {
        sourceType,
        importBatchId: `BAT-${Date.now()}`,
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

      // Execute pipeline through review stage with discovery choices
      await runPipeline(buffer, file.name, file.size, file.type, defaultSheet, detectedIdx);
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
    overriddenHeaderRowIndex?: number
  ) => {
    try {
      setIsProcessing(true);
      setProcessError(null);

      const targetHeaderRowIdx = overriddenHeaderRowIndex !== undefined ? overriddenHeaderRowIndex : headerRowIndex;

      const batch = await ExcelCsvPipelineService.processFileToReview(
        buffer,
        fileName,
        fileSize,
        mimeType,
        context,
        {
          sheetName,
          headerRowIndex: targetHeaderRowIdx,
        }
      );

      setActiveBatch(batch);

      // Inspect column mappings
      if (batch.rows.length > 0 && batch.rows[0].raw) {
        const rawHeaders = Object.keys(batch.rows[0].raw).filter((k) => !k.startsWith('_'));
        const mappings = ExcelCsvPipelineService.inspectColumnMappings(rawHeaders);
        setColumnMappings(mappings);
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
        importBatchId: `BAT-${Date.now()}`,
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

  const handleRowAction = (rowNumber: number, action: 'ACCEPT_WARNING' | 'REJECT_ROW') => {
    if (!activeBatch) return;
    const updated = ExcelCsvPipelineService.applyRowReview(
      activeBatch,
      rowNumber,
      action,
      context,
      action === 'ACCEPT_WARNING' ? 'تمت الموافقة اليدوية على التنبيه' : 'تم استبعاد الصف يدوياً'
    );
    setActiveBatch({ ...updated });
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

      if (result.success && onCommitSuccess) {
        onCommitSuccess(result);
      }
    } catch (err: any) {
      setProcessError(err?.message || 'فشل في تنفيذ الاعتماد وحفظ الشحنات');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
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
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                استقبال ومعالجة ملفات جداول البيانات (.xlsx, .xls, .csv) بالاعتماد المباشر على معمارية الاستيراد الموحد (المراحل العشر) دون كتابة مسبقة في Firestore.
              </p>
            </div>
          </div>

          {selectedFile && (
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
        {!selectedFile && (
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
                      className="px-3 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors"
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
                      {discoveryResult.detectedHeaders.map((header: string) => {
                        const match = discoveryResult.mappingDiagnostics[header];
                        const isMapped = match && match.confidence >= 0.70 && !String(match.canonicalField).startsWith('unmapped_');
                        return (
                          <span
                            key={header}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                              isMapped
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border-stone-200'
                            }`}
                          >
                            <span className="truncate max-w-[120px]">{header}</span>
                            <span className="text-stone-300">➜</span>
                            <span className="font-mono font-black text-stone-900">
                              {isMapped ? match.canonicalField : 'غير مطابَق (Unmapped)'}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ambiguity reasons & warning flags */}
                  {discoveryResult.requiresReview && discoveryResult.ambiguityReasons.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <span className="font-black text-amber-900 block flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        تنبيهات وتعارضات كشف المخطط:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-800 pr-4">
                        {discoveryResult.ambiguityReasons.map((reason: string, idx: number) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {showManualOverrides && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setShowManualOverrides(false)}
                        className="text-xs font-bold text-stone-500 hover:text-stone-700"
                      >
                        إخفاء خيارات التعديل اليدوي
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-6 p-6 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="text-xs font-bold text-emerald-900">
              جاري معالجة الملف عبر مراحل الـ Pipeline العشر (Normalize, Map, Resolve, Validate, Duplicate Check)...
            </span>
          </div>
        )}

        {/* Process Error Banner */}
        {processError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{processError}</span>
          </div>
        )}
      </div>

      {/* 2. Pipeline Results & Stats */}
      {activeBatch && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 block">إجمالي الصفوف</span>
              <span className="text-xl font-black text-stone-900 font-mono">{activeBatch.totalRows}</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 block">صفوف سليمة</span>
              <span className="text-xl font-black text-emerald-700 font-mono">{activeBatch.validRows}</span>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 block">تنبيهات (تحذير)</span>
              <span className="text-xl font-black text-amber-800 font-mono">{activeBatch.warningRows}</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 block">أخطاء مانعة</span>
              <span className="text-xl font-black text-rose-700 font-mono">{activeBatch.errorRows}</span>
            </div>

            <div className="bg-sky-50/50 border border-sky-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-sky-800 block">تتطلب مراجعة</span>
              <span className="text-xl font-black text-sky-800 font-mono">{activeBatch.requiresReviewRows}</span>
            </div>

            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-purple-800 block">المرحلة الحالية</span>
              <span className="text-xs font-black text-purple-900 font-mono block mt-1">
                {activeBatch.currentStage}
              </span>
            </div>
          </div>

          {/* Column Mapping Review Accordion */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  خريطة مطابقة الأعمدة الذكية (Intelligent Column Mapping)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 font-bold">
                  {Object.keys(columnMappings).length} أعمدة مكتشفة
                </span>
              </div>
              <button
                onClick={() => setShowMappingDrawer(!showMappingDrawer)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                {showMappingDrawer ? 'إخفاء التفاصيل' : 'استعراض خريطة الأعمدة'}
              </button>
            </div>

            {showMappingDrawer && (
              <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(columnMappings).map(([rawHeader, match]) => (
                  <div
                    key={rawHeader}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      match.confidence >= 0.85
                        ? 'bg-emerald-50/40 border-emerald-200/70'
                        : match.confidence >= 0.70
                        ? 'bg-amber-50/40 border-amber-200/70'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-bold text-stone-900 block truncate">{rawHeader}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ➜ {match.canonicalField}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          match.confidence >= 0.85
                            ? 'bg-emerald-100 text-emerald-800'
                            : match.confidence >= 0.70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {Math.round(match.confidence * 100)}%
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">{match.matchType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Review Table & Gate */}
          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  جدول معاينة وتدقيق الصفوف (Review Table)
                </h3>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                {(['ALL', 'VALID', 'WARNING', 'ERROR', 'REQUIRES_REVIEW'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      filterStatus === st
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st === 'ALL' && 'الكل'}
                    {st === 'VALID' && 'سليم'}
                    {st === 'WARNING' && 'تنبيه'}
                    {st === 'ERROR' && 'خطأ مانع'}
                    {st === 'REQUIRES_REVIEW' && 'مراجعة'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50/80 text-stone-600 font-bold border-b border-stone-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">التذكرة / البوليصة</th>
                    <th className="py-2.5 px-3">اللوحة / الشاحنة</th>
                    <th className="py-2.5 px-3">الناقل</th>
                    <th className="py-2.5 px-3">المادة</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3 font-mono">فارغ (كجم)</th>
                    <th className="py-2.5 px-3 font-mono">قائم (كجم)</th>
                    <th className="py-2.5 px-3 font-mono">صافي (كجم)</th>
                    <th className="py-2.5 px-3">حالة الصف</th>
                    <th className="py-2.5 px-3">إجراءات المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-stone-400 font-medium">
                        لا توجد صفوف تطابق الفلتر المحدد
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => {
                      const canonical = row.mapped || row.canonical || {};
                      const isRejected = row.status === 'REJECTED';
                      const hasBlocking = row.validationIssues.some((i) => i.blocking);
                      const hasWarning = row.validationIssues.some((i) => i.severity === 'WARNING');

                      return (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-stone-50/60 transition-colors ${
                            isRejected
                              ? 'bg-stone-100/60 opacity-60 line-through'
                              : hasBlocking
                              ? 'bg-rose-50/30'
                              : hasWarning
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-stone-500">{row.rowNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-900 font-mono">
                            {canonical.ticketId || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-stone-800">
                            {canonical.truckNo || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">{canonical.carrier || '-'}</td>
                          <td className="py-2.5 px-3 text-stone-700">{canonical.materialType || '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-stone-600">
                            {canonical.shiftDate || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-stone-800">
                            {canonical.tareWeight !== undefined ? canonical.tareWeight : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-stone-800">
                            {canonical.grossWeight !== undefined ? canonical.grossWeight : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                            {canonical.netWeight !== undefined ? canonical.netWeight : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.duplicateInfo?.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                مكرر (Duplicate)
                              </span>
                            ) : hasBlocking ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                خطأ مانع
                              </span>
                            ) : hasWarning ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                تحذير
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                سليم
                              </span>
                            )}

                            {/* Issues subtitle */}
                            {row.validationIssues.length > 0 && (
                              <div className="text-[10px] text-stone-500 mt-1">
                                {row.validationIssues.map((iss) => (
                                  <div key={iss.issueId} className="truncate max-w-xs">
                                    • {iss.messageAr || iss.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {hasWarning && !isRejected && (
                                <button
                                  onClick={() => handleRowAction(row.rowNumber, 'ACCEPT_WARNING')}
                                  title="قبول التحذير وتمرير الصف"
                                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isRejected ? (
                                <button
                                  onClick={() => handleRowAction(row.rowNumber, 'REJECT_ROW')}
                                  title="استبعاد هذا الصف من الاستيراد"
                                  className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
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

            {/* 4. Pre-Commit Gate & Actions */}
            <div className="p-5 bg-stone-50 border-t border-stone-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-stone-700" />
                  <span className="text-xs font-bold text-stone-900">
                    بوابة الاعتماد الصارمة (Pre-Commit Gate):
                  </span>
                  {activeBatch.errorRows === 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      خالٍ من الأخطاء المانعة
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      يوجد {activeBatch.errorRows} أخطاء مانعة
                    </span>
                  )}
                </div>

                {activeBatch.warningRows > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={confirmWarnings}
                      onChange={(e) => setConfirmWarnings(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs text-stone-700 font-medium">
                      أؤكد مراجعة كافة التنبيهات ({activeBatch.warningRows} تنبيه) والموافقة على استيراد الشحنات بهذه الحالة.
                    </span>
                  </label>
                )}
              </div>

              {/* Commit Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCommit}
                  disabled={
                    isCommitting ||
                    activeBatch.errorRows > 0 ||
                    (activeBatch.warningRows > 0 && !confirmWarnings) ||
                    commitResult?.success === true
                  }
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    activeBatch.errorRows > 0 || (activeBatch.warningRows > 0 && !confirmWarnings)
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : commitResult?.success
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الاعتماد وحفظ الرحلات...</span>
                    </>
                  ) : commitResult?.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم الاعتماد بنجاح</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>اعتماد واستيراد الشحنات (Commit Trips)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {commitResult?.success && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">اكتمل الاستيراد والاعتماد بنجاح في قاعدة البيانات</h4>
                <p className="text-xs text-emerald-800">
                  تم اعتماد وحفظ ({commitResult.committedRows}) شحنة رسمية من ملف ({activeBatch.source.sourceFileName}) وربطها بمصدر العمليات ({activeBatch.source.sourceType}) وسجل التدقيق.
                </p>
                <div className="text-[11px] font-mono text-emerald-700 pt-1">
                  Operation ID: {commitResult.operationId} | Batch ID: {commitResult.importBatchId}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
