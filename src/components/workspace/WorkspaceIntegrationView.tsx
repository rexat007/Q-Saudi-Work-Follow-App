import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FolderTree, 
  Database, 
  Layers, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  FileUp, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Truck, 
  UserCheck, 
  AlertTriangle, 
  Calculator, 
  HardDrive, 
  Key, 
  Search,
  Sparkles,
  Info,
  Clock,
  ChevronDown,
  Building2,
  FolderOpen,
  Download,
  History,
  ArrowUpRight,
  Shield,
  Check,
  X
} from 'lucide-react';
import { 
  WORKSPACE_TABS, 
  OPERATIONS_LEGACY_COLUMNS, 
  OPERATIONS_PRICING_COLUMNS, 
  OPERATIONS_AUDIT_COLUMNS,
  OPERATIONS_FULL_COLUMNS,
  WorkspaceSheetTab,
  SchemaMigrationPlan,
  GoogleDriveProjectStructure,
  WorkspaceSyncSummary,
  ProjectStorageProfile,
  StorageHistoryRecord,
  MigrationJob,
  DestinationValidationResult,
  WorkspaceProjectionInput
} from '../../types/workspace';
import { ProjectEntity, TripEntity, DriverEntity, CarrierEntity, MaterialEntity, TripExceptionEntity } from '../../types/entities';
import { projectRepository } from '../../repositories/project.repository';
import { tripRepository } from '../../repositories/trip.repository';
import { driverRepository } from '../../repositories/driver.repository';
import { carrierRepository } from '../../repositories/carrier.repository';
import { materialRepository } from '../../repositories/material.repository';
import { exceptionRepository } from '../../repositories/exception.repository';
import { clientWorkspaceService } from '../../services/workspace.service';
import { useAuth } from '../../firebase/authContext';
import { useI18n } from '../../i18n';


export function WorkspaceIntegrationView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Canonical dataset state
  const [trips, setTrips] = useState<TripEntity[]>([]);
  const [drivers, setDrivers] = useState<DriverEntity[]>([]);
  const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
  const [materials, setMaterials] = useState<MaterialEntity[]>([]);
  const [exceptions, setExceptions] = useState<TripExceptionEntity[]>([]);

  // Readiness / Error state per dataset
  const [tripsStatus, setTripsStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');
  const [driversStatus, setDriversStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');
  const [carriersStatus, setCarriersStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');
  const [materialsStatus, setMaterialsStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');
  const [exceptionsStatus, setExceptionsStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');

  const [activeTabKey, setActiveTabKey] = useState<WorkspaceSheetTab>('OPERATIONS');
  
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [provisionResult, setProvisionResult] = useState<GoogleDriveProjectStructure | null>(null);
  const [syncSummary, setSyncSummary] = useState<WorkspaceSyncSummary | null>(null);
  const [migrationPlan, setMigrationPlan] = useState<SchemaMigrationPlan | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const [uploadFileName, setUploadFileName] = useState<string>('تذكرة_ميزان_WB-99101.pdf');
  const [uploadSubfolder, setUploadSubfolder] = useState<'importedFiles' | 'reports' | 'printableDocuments'>('printableDocuments');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);

  // BLOCK 100G-B: Storage Migration & Archive State
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [targetProvider, setTargetProvider] = useState<'MY_DRIVE' | 'SHARED_DRIVE'>('SHARED_DRIVE');
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [targetFolderName, setTargetFolderName] = useState<string>('');
  const [targetFolderPathDisplay, setTargetFolderPathDisplay] = useState<string>('');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState<boolean>(false);
  const [pastedDriveUrl, setPastedDriveUrl] = useState<string>('');
  const [targetSharedDriveId, setTargetSharedDriveId] = useState<string>('');
  const [validationResult, setValidationResult] = useState<DestinationValidationResult | null>(null);
  const [isValidatingDestination, setIsValidatingDestination] = useState<boolean>(false);
  const [migrationJob, setMigrationJob] = useState<MigrationJob | null>(null);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);

  const [isDownloadingArchive, setIsDownloadingArchive] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [storageHistoryRecords, setStorageHistoryRecords] = useState<StorageHistoryRecord[]>([]);

  const ENTERPRISE_FOLDER_PRESETS = [
    {
      id: 'folder_target_999',
      name: 'مجلد مشروع الجبيل الرئيسي - Shared Drive',
      pathDisplay: '[Shared Drive] Q-Saudi Enterprise / Projects / Jubail Target Folder',
      provider: 'SHARED_DRIVE' as const,
    },
    {
      id: 'folder_target_enterprise_002',
      name: 'أرشيف مشاريع المنطقة الشرقية - Enterprise Archive',
      pathDisplay: '[Shared Drive] Q-Saudi Projects / Eastern Province Storage',
      provider: 'SHARED_DRIVE' as const,
    },
    {
      id: 'folder_target_mydrive_003',
      name: 'مجلد التخزين الشخصي - My Drive Target',
      pathDisplay: '[My Drive] Q-Saudi / Storage Target Folder',
      provider: 'MY_DRIVE' as const,
    },
  ];

  const handleSelectFolder = (folderId: string, folderName?: string, pathDisplay?: string, provider?: 'MY_DRIVE' | 'SHARED_DRIVE') => {
    setTargetFolderId(folderId);
    setTargetFolderName(folderName || `مجلد Google Drive (${folderId.slice(0, 8)})`);
    setTargetFolderPathDisplay(pathDisplay || `${(provider || targetProvider) === 'MY_DRIVE' ? '[My Drive]' : '[Shared Drive]'} Projects / ${folderName || folderId}`);
    if (provider) setTargetProvider(provider);
    setValidationResult(null);
    setIsFolderPickerOpen(false);
  };

  const handleParseAndSetUrl = (url: string) => {
    setPastedDriveUrl(url);
    const trimmed = url.trim();
    if (!trimmed) return;
    const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    const extractedId = match && match[1] ? match[1] : trimmed;
    handleSelectFolder(
      extractedId,
      `مجلد مستهدف من الرابط (${extractedId.slice(0, 8)}...)`,
      `[Drive Location] ${trimmed.slice(0, 45)}...`
    );
  };

  useEffect(() => {
    const unsub = projectRepository.subscribeToProjects(
      (list) => {
        const activeList = list.filter(p => p.status !== 'ARCHIVED' && p.status !== 'SUSPENDED');
        setProjects(activeList);
        if (activeList.length > 0) {
          if (!selectedProjectId || !activeList.some(p => p.projectId === selectedProjectId)) {
            setSelectedProjectId(activeList[0].projectId);
          }
        } else {
          setSelectedProjectId('');
        }
      },
      (err) => {
        console.error('[WorkspaceIntegrationView] Error subscribing to projects:', err);
      },
      (user as any)?.assignedProjectIds,
      (user as any)?.isSuperAdmin
    );
    return () => unsub();
  }, [user, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTrips([]);
      setDrivers([]);
      setCarriers([]);
      setMaterials([]);
      setExceptions([]);
      setTripsStatus('PENDING');
      setDriversStatus('PENDING');
      setCarriersStatus('PENDING');
      setMaterialsStatus('PENDING');
      setExceptionsStatus('PENDING');
      return;
    }

    setTrips([]);
    setDrivers([]);
    setCarriers([]);
    setMaterials([]);
    setExceptions([]);
    setTripsStatus('PENDING');
    setDriversStatus('PENDING');
    setCarriersStatus('PENDING');
    setMaterialsStatus('PENDING');
    setExceptionsStatus('PENDING');

    const currentSubProjectId = selectedProjectId;

    const unsubTrips = tripRepository.subscribeByProject(
      currentSubProjectId,
      (data) => {
        setTrips(data);
        setTripsStatus('READY');
      },
      () => setTripsStatus('ERROR')
    );

    const unsubDrivers = driverRepository.subscribeByProject(
      currentSubProjectId,
      (data) => {
        setDrivers(data);
        setDriversStatus('READY');
      },
      () => setDriversStatus('ERROR')
    );

    const unsubCarriers = carrierRepository.subscribeByProject(
      currentSubProjectId,
      (data) => {
        setCarriers(data);
        setCarriersStatus('READY');
      },
      () => setCarriersStatus('ERROR')
    );

    const unsubMaterials = materialRepository.subscribeByProject(
      currentSubProjectId,
      (data) => {
        setMaterials(data);
        setMaterialsStatus('READY');
      },
      () => setMaterialsStatus('ERROR')
    );

    const unsubExceptions = exceptionRepository.subscribeByProject(
      currentSubProjectId,
      (data) => {
        setExceptions(data);
        setExceptionsStatus('READY');
      },
      () => setExceptionsStatus('ERROR')
    );

    return () => {
      unsubTrips();
      unsubDrivers();
      unsubCarriers();
      unsubMaterials();
      unsubExceptions();
    };
  }, [selectedProjectId]);

  const isSyncReady = selectedProjectId !== '' && 
    tripsStatus === 'READY' && 
    driversStatus === 'READY' && 
    carriersStatus === 'READY' && 
    materialsStatus === 'READY' && 
    exceptionsStatus === 'READY';

  const isSyncError = tripsStatus === 'ERROR' || 
    driversStatus === 'ERROR' || 
    carriersStatus === 'ERROR' || 
    materialsStatus === 'ERROR' || 
    exceptionsStatus === 'ERROR';

  const isMigrationReady = selectedProjectId !== '' && tripsStatus === 'READY';
  const isArchiveReady = selectedProjectId !== '' && tripsStatus === 'READY';

  const currentProject = projects.find(p => p.projectId === selectedProjectId) || projects[0] || null;

  useEffect(() => {
    clientWorkspaceService.fetchMigrationPlan().then(setMigrationPlan).catch(console.error);
  }, []);

  const handleRequestOAuth = async () => {
    try {
      setNotification({ type: 'info', text: t('navigation.labels.txt_a4ab42') });
      const token = await clientWorkspaceService.requestGoogleScopes();
      setNotification({ type: 'success', text: t('navigation.status.txt_7568b1') });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'تعذر الحصول على تصاريح Google' });
    }
  };

  const handleProvisionProject = async () => {
    if (!currentProject) return;
    setIsProvisioning(true);
    setNotification(null);
    try {
      const res = await clientWorkspaceService.provisionProjectDrive(currentProject);
      setProvisionResult(res);
      // Update local state project
      setProjects(prev => prev.map(p => {
        if (p.projectId === currentProject.projectId) {
          return {
            ...p,
            settings: {
              ...p.settings,
              googleDriveFolderId: res.projectFolderId,
              googleSpreadsheetId: res.spreadsheetId,
            }
          };
        }
        return p;
      }));
      setNotification({
        type: 'success',
        text: `تمت تهيئة مجلدات Google Drive وشيت الإسقاط بنجاح للمشروع (${currentProject.nameAr})`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'فشلت عملية تهيئة Google Drive للمشروع' });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSyncProjection = async () => {
    if (!currentProject || !isSyncReady) {
      if (isSyncError) {
        setNotification({
          type: 'error',
          text: 'تعذر إجراء المزامنة بسبب وجود خطأ في تحميل بيانات Firestore للمشروع.',
        });
      }
      return;
    }
    const spreadsheetId = currentProject.settings.googleSpreadsheetId || provisionResult?.spreadsheetId;
    if (!spreadsheetId) {
      setNotification({
        type: 'error',
        text: t('navigation.labels.project_2'),
      });
      return;
    }

    setIsSyncing(true);
    setNotification(null);
    try {
      const input: WorkspaceProjectionInput = {
        projectId: currentProject.projectId,
        spreadsheetId,
        trips,
        drivers,
        carriers,
        materials,
        exceptions,
      };
      const summary = await clientWorkspaceService.syncProjectionToSheets(input);
      setSyncSummary(summary);
      setNotification({
        type: 'success',
        text: `تمت المزامنة وتطبيق الـ Upsert بنجاح! تم تحديث وإسقاط ${summary.totalRecordsUpserted} سجلاً في Google Sheets.`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'فشلت المزامنة مع Google Sheets' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!currentProject) return;
    if (!provisionResult?.subfolders && !currentProject.settings.googleDriveFolderId) {
      setNotification({
        type: 'error',
        text: t('navigation.labels.projectUpload'),
      });
      return;
    }

    const subfolderId = provisionResult?.subfolders?.[uploadSubfolder]?.id || `sub_${uploadSubfolder}_${currentProject.projectId}`;
    setIsUploading(true);
    setNotification(null);
    try {
      const dummyContent = `Q-Saudi Enterprise Document\nProject: ${currentProject.nameAr}\nTicket: WB-99101\nDate: ${new Date().toISOString()}`;
      const res = await clientWorkspaceService.uploadDocument(
        subfolderId,
        uploadFileName,
        'application/pdf',
        dummyContent
      );
      setLastUploadedLink(res.webViewLink);
      setNotification({
        type: 'success',
        text: `تم رفع المستند (${uploadFileName}) بنجاح إلى مجلد ${uploadSubfolder} في Google Drive!`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'فشل رفع المستند إلى Google Drive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidateDestination = async () => {
    if (!currentProject || !targetFolderId.trim()) {
      setNotification({ type: 'error', text: 'يرجى إدخال معرف مجلد التخزين المستهدف' });
      return;
    }
    setIsValidatingDestination(true);
    setValidationResult(null);
    try {
      const res = await clientWorkspaceService.validateDestinationFolder(
        currentProject.projectId,
        targetFolderId.trim(),
        targetProvider,
        currentProject.settings.googleDriveFolderId,
        targetSharedDriveId.trim() || undefined
      );
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        folderId: targetFolderId,
        folderName: '',
        provider: targetProvider,
        error: err.message || 'فشلت عملية التحقق من المجلد',
      });
    } finally {
      setIsValidatingDestination(false);
    }
  };

  const handleExecuteMigration = async () => {
    if (!currentProject || !targetFolderId.trim() || !isMigrationReady) return;
    setIsMigrating(true);
    setNotification(null);
    try {
      const res = await clientWorkspaceService.startStorageMigration({
        projectId: currentProject.projectId,
        projectCode: currentProject.projectCode || 'Q-PRJ-001',
        projectNameAr: currentProject.nameAr,
        sourceFolderId: currentProject.settings.googleDriveFolderId || 'folder_pilot_root',
        sourceSpreadsheetId: currentProject.settings.googleSpreadsheetId || 'sheet_pilot_master',
        targetFolderId: targetFolderId.trim(),
        targetProvider,
        sharedDriveId: targetSharedDriveId.trim() || undefined,
        trips,
      });

      setMigrationJob(res.job);
      if (res.job.status === 'READY_TO_SWITCH') {
        const oldFolderId = currentProject.settings.googleDriveFolderId;
        const oldSheetId = currentProject.settings.googleSpreadsheetId;
        
        const newProfile: ProjectStorageProfile = {
          storageProvider: targetProvider,
          currentStorageFolderId: targetFolderId.trim(),
          currentSpreadsheetId: `gsheet_${currentProject.projectId}_${Date.now()}`,
          previousStorageFolderId: oldFolderId,
          previousSpreadsheetId: oldSheetId,
          sharedDriveId: targetSharedDriveId.trim() || null,
          rootFolderPathDisplay: targetProvider === 'SHARED_DRIVE' 
            ? `[Shared Drive] Q-Saudi / Projects / ${currentProject.nameAr}`
            : `[My Drive] Projects / ${currentProject.nameAr}`,
          provisioningStatus: 'PROVISIONED',
          migrationStatus: 'SWITCHED',
          lastVerifiedAt: new Date().toISOString(),
          archiveVersion: (currentProject.settings.storageProfile?.archiveVersion || 0) + 1,
        };

        const newHistoryRecord: StorageHistoryRecord = {
          historyId: `hist_${Date.now()}`,
          projectId: currentProject.projectId,
          folderId: targetFolderId.trim(),
          spreadsheetId: newProfile.currentSpreadsheetId,
          displayNamePath: newProfile.rootFolderPathDisplay,
          provider: targetProvider,
          sharedDriveId: targetSharedDriveId.trim() || null,
          createdAt: new Date().toISOString(),
          changedBy: {
            userId: user?.uid || 'usr_admin',
            email: user?.email || 'admin@q-saudi.com',
            role: (user as any)?.role || 'SUPER_ADMIN',
          },
          migrationJobId: res.job.migrationJobId,
          copiedFilesCount: res.job.copiedFileIds.length,
          verificationStatus: 'VERIFIED',
          fileIdMap: res.job.fileIdMap,
          status: 'ACTIVE',
        };

        setStorageHistoryRecords(prev => [newHistoryRecord, ...prev.map(r => ({ ...r, status: 'ARCHIVED' as const }))]);

        setProjects(prev => prev.map(p => {
          if (p.projectId === currentProject.projectId) {
            return {
              ...p,
              settings: {
                ...p.settings,
                googleDriveFolderId: targetFolderId.trim(),
                googleSpreadsheetId: newProfile.currentSpreadsheetId,
                storageProfile: newProfile,
              }
            };
          }
          return p;
        }));

        setNotification({
          type: 'success',
          text: `تم نقل موقع تخزين مشروع (${currentProject.nameAr}) بنجاح وبشكل آمن إلى ${targetProvider === 'SHARED_DRIVE' ? 'المحرك المشارك (Shared Drive)' : 'My Drive'}!`,
        });
        setIsMigrationModalOpen(false);
      } else {
        setNotification({
          type: 'error',
          text: res.job.errorDetails || 'فشلت عملية التحقق أو النقل إلى المكان الجديد',
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'خطأ أثناء النقل' });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDownloadArchive = async () => {
    if (!currentProject || !isArchiveReady) return;
    setIsDownloadingArchive(true);
    setNotification(null);
    try {
      await clientWorkspaceService.downloadProjectArchive({
        project: currentProject,
        trips,
        drivers,
        carriers,
        materials,
        exceptions,
        storageProfile: currentProject.settings.storageProfile,
      });
      setNotification({
        type: 'success',
        text: `تم إنشاء وتحميل حزمة الأرشيف الكاملة للمشروع (Q-PRJ-${currentProject.projectCode || '001'}) بنجاح!`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'فشل تحميل أرشيف المشروع' });
    } finally {
      setIsDownloadingArchive(false);
    }
  };

  const currentStorageProfile = currentProject?.settings?.storageProfile || {
    storageProvider: 'MY_DRIVE' as const,
    currentStorageFolderId: currentProject?.settings?.googleDriveFolderId || 'folder_pilot_001',
    currentSpreadsheetId: currentProject?.settings?.googleSpreadsheetId || 'sheet_pilot_001',
    rootFolderPathDisplay: `[My Drive] Q-Saudi Projects / ${currentProject?.nameAr || 'المشروع'}`,
    provisioningStatus: 'PROVISIONED' as const,
    migrationStatus: 'IDLE' as const,
    lastVerifiedAt: new Date().toISOString(),
    archiveVersion: 1,
  };

  const currentSpreadsheetId = currentProject?.settings?.googleSpreadsheetId || provisionResult?.spreadsheetId;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Enterprise Architecture Core Principles */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 text-white shadow-md border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("navigation.labels.txt_58e08d")}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t("navigation.labels.txt_19c7ca")}</h1>
            <p className="text-stone-300 text-sm max-w-3xl leading-relaxed">
              {t("navigation.labels.txt_269608")}<span className="text-amber-400 font-semibold">{t("navigation.labels.txt_706091")}</span> {t("navigation.labels.txt_000648")}<span className="text-emerald-400 font-semibold"> {t("navigation.labels.txt_409d13")}</span>{t("navigation.labels.txt_6f6242")}<code className="bg-stone-800 px-1.5 py-0.5 rounded text-rose-300 font-mono text-xs">SpreadsheetApp.getActiveSpreadsheet()</code> {t("navigation.labels.txt_1f48b9")}<span className="text-amber-400 font-semibold">spreadsheetId</span> {t("navigation.labels.project_3")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-google-oauth-authorize"
              onClick={handleRequestOAuth}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              <span>{t("navigation.labels.txt_681fb6")}</span>
            </button>
            <button
              id="btn-sync-all-projection"
              onClick={handleSyncProjection}
              disabled={isSyncing || !isSyncReady}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-xs shadow-md transition-all active:scale-95 ${
                isSyncing || !isSyncReady ? 'bg-stone-600 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري المزامنة...' : !isSyncReady ? 'جاري تحميل البيانات...' : t("navigation.labels.txt_22bd57")}</span>
            </button>
          </div>
        </div>

        {/* 4 Architectural Rule Badges */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-stone-800">
          <div className="flex items-center gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <Database className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">{t("navigation.labels.txt_55b425")}</div>
              <div className="text-[11px] text-stone-400">{t("navigation.labels.pricing")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">{t("navigation.labels.txt_5c0d92")}</div>
              <div className="text-[11px] text-stone-400">{t("navigation.labels.txt_6b7707")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <ArrowRightLeft className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">{t("navigation.labels.txt_12e46c")}</div>
              <div className="text-[11px] text-stone-400">{t("navigation.labels.txt_202ca4")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">Project Registry Binding</div>
              <div className="text-[11px] text-stone-400">ربط مستقل لكل مشروع برقم الشيت</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : notification.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Project Selection & Registry Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">{t("navigation.labels.projects")}</h2>
              <p className="text-xs text-stone-500">{t("navigation.labels.txt_2a462a")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              id="select-project-registry"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.nameAr} ({p.projectCode || p.projectId})
                </option>
              ))}
            </select>

            <button
              id="btn-provision-drive-sheets"
              onClick={handleProvisionProject}
              disabled={isProvisioning}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-white transition-all shadow-xs ${
                isProvisioning ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800'
              }`}
            >
              <FolderTree className={`w-4 h-4 ${isProvisioning ? 'animate-spin' : ''}`} />
              <span>{isProvisioning ? 'جاري التهيئة...' : 'تهيئة هيكل المشروع في Drive & Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Project Registry Metadata Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">المشروع المحدد</div>
            <div className="text-xs font-bold text-stone-900">{currentProject.nameAr}</div>
            <div className="text-[10px] text-stone-500 font-mono mt-0.5">ID: {currentProject.projectId}</div>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">{t("navigation.labels.txt_48ae1b")}</div>
            {currentSpreadsheetId ? (
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono font-bold text-emerald-800 truncate">{currentSpreadsheetId}</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-800"
                  title="فتح في Google Sheets"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <span className="text-xs text-amber-700 font-medium">{t("navigation.labels.txt_132f08")}</span>
            )}
            <div className="text-[10px] text-stone-400 mt-0.5">{t("navigation.labels.txt_2c9a36")}</div>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">{t("navigation.labels.txt_454be9")}</div>
            {currentProject.settings.googleDriveFolderId || provisionResult?.projectFolderId ? (
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono font-bold text-indigo-800 truncate">
                  {currentProject.settings.googleDriveFolderId || provisionResult?.projectFolderId}
                </span>
                <a
                  href={`https://drive.google.com/drive/folders/${currentProject.settings.googleDriveFolderId || provisionResult?.projectFolderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                  title="فتح في Google Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <span className="text-xs text-amber-700 font-medium">{t("navigation.labels.txt_684973")}</span>
            )}
            <div className="text-[10px] text-stone-400 mt-0.5">{t("navigation.labels.txt_257f0d")}</div>
          </div>
        </div>
      </div>

      {/* BLOCK 100G-B & 100G-D: Configurable Project Storage Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">ملف التخزين الخاص بالمشروع (Project Storage Profile)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {currentStorageProfile.provisioningStatus}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  v{currentStorageProfile.archiveVersion}
                </span>
              </div>
              <p className="text-xs text-stone-500">إدارة مسار وتوزيع مستندات وجداول بيانات المشروع على Google Drive</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-open-storage-migration-modal"
              onClick={() => setIsMigrationModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>تغيير موقع التخزين (نقل التخزين)</span>
            </button>

            <button
              id="btn-download-project-archive"
              onClick={handleDownloadArchive}
              disabled={isDownloadingArchive}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all shadow-xs ${
                isDownloadingArchive ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Download className={`w-4 h-4 ${isDownloadingArchive ? 'animate-spin' : ''}`} />
              <span>تحميل الأرشيف (.ZIP)</span>
            </button>

            <button
              id="btn-view-storage-history"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 transition-all"
            >
              <History className="w-4 h-4" />
              <span>سجل التغييرات</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">مزود التخزين الحالي (Storage Provider)</div>
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentStorageProfile.storageProvider === 'SHARED_DRIVE' ? 'المحرك المشارك (Shared Drive)' : 'My Drive'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">المسار المعروض للمجلد الرئيسية</div>
            <div className="font-mono text-[11px] font-semibold text-stone-800 truncate" title={currentStorageProfile.rootFolderPathDisplay}>
              {currentStorageProfile.rootFolderPathDisplay}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">حالة النقل (Migration Status)</div>
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentStorageProfile.migrationStatus || 'IDLE'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-semibold text-stone-500 mb-1">آخر تحقق آمن (Last Verified)</div>
            <div className="font-mono text-[11px] text-stone-700">
              {currentStorageProfile.lastVerifiedAt ? new Date(currentStorageProfile.lastVerifiedAt).toLocaleString('ar-SA') : 'لم يتم التحقق'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Google Drive Structure & Google Sheets Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Main Column: Google Sheets 6-Tabs Projection */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t("navigation.labels.txt_116753")}</span>
                </h3>
                <p className="text-xs text-stone-500">{t("navigation.labels.txt_42845c")}</p>
              </div>

              {currentSpreadsheetId && (
                <a
                  id="link-open-google-sheet"
                  href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  <span>{t("navigation.labels.txt_75522f")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* 6 Tabs Pill Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
              {(Object.keys(WORKSPACE_TABS) as WorkspaceSheetTab[]).map((tabKey) => {
                const tab = WORKSPACE_TABS[tabKey];
                const isActive = activeTabKey === tabKey;
                return (
                  <button
                    key={tabKey}
                    id={`sheet-tab-${tabKey.toLowerCase()}`}
                    onClick={() => setActiveTabKey(tabKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50' 
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>{tab.tabTitleAr}</span>
                    <span className="text-[10px] text-stone-400 font-mono">({tab.primaryKey})</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Info Box */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <span>جدول: {WORKSPACE_TABS[activeTabKey].tabTitleAr}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded-md font-semibold">
                    المفتاح التقني: {WORKSPACE_TABS[activeTabKey].primaryKey}
                  </span>
                </div>
                <p className="text-stone-500 text-[11px]">{WORKSPACE_TABS[activeTabKey].descriptionAr}</p>
              </div>

              <div className="text-right shrink-0 font-mono text-[11px] text-stone-500">
                {t("navigation.labels.refresh")}<span className="font-bold text-emerald-700">Upsert (In-Place / Append)</span>
              </div>
            </div>

            {/* Special Section for OPERATIONS Tab: The 20 Legacy Columns + 6 Pricing Columns */}
            {activeTabKey === 'OPERATIONS' && (
              <div className="space-y-4 pt-2">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>{t("navigation.labels.pricing_2")}</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                      إجمالي الأعمدة: {OPERATIONS_FULL_COLUMNS.length} عموداً
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    تم الالتزام الصارم بالاحتفاظ بأعمدة التشغيل الـ 20 الحالية للتوافق ومنع أي تضارب أو كسر في التقارير التاريخية،
                    وإضافة أعمدة التسعير الستة المعتمدة باللقطة التعاقدية دون حذف أو تعديل الأعمدة القديمة.
                  </p>

                  {/* Columns Visualizer */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-stone-600 uppercase">
                      {t("navigation.labels.txt_19e865")}</div>
                    <div className="flex flex-wrap gap-1">
                      {OPERATIONS_LEGACY_COLUMNS.map((col, idx) => (
                        <span 
                          key={col} 
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-stone-200 text-stone-800 font-medium"
                          title={`العمود رقم ${idx + 1}`}
                        >
                          <span className="text-amber-700 font-bold ml-1">{idx + 1}.</span>
                          {col}
                        </span>
                      ))}
                    </div>

                    <div className="text-[10px] font-bold text-emerald-800 uppercase mt-3">
                      {t("navigation.labels.pricing_3")}</div>
                    <div className="flex flex-wrap gap-1">
                      {OPERATIONS_PRICING_COLUMNS.map((col, idx) => (
                        <span 
                          key={col} 
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold"
                          title={`العمود رقم ${21 + idx}`}
                        >
                          <span className="text-emerald-700 font-bold ml-1">{21 + idx}.</span>
                          {col}
                        </span>
                      ))}
                    </div>

                    <div className="text-[10px] font-bold text-stone-500 uppercase mt-3">
                      {t("navigation.labels.txt_2d0c08")}</div>
                    <div className="flex flex-wrap gap-1">
                      {OPERATIONS_AUDIT_COLUMNS.map((col, idx) => (
                        <span 
                          key={col} 
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 font-medium"
                        >
                          <span className="text-stone-400 font-bold ml-1">{27 + idx}.</span>
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sample Trips Preview (Showing both operational & pricing columns) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">{t("navigation.labels.project_6")}</span>
                    <span className="text-stone-500 text-[11px]">{trips.length} رحلة مسجلة في المحرك</span>
                  </div>

                  <div className="overflow-x-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-right text-[11px] border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                          <th className="p-2 border-l border-stone-200">tripId (PK)</th>
                          <th className="p-2 border-l border-stone-200">الرقم التسلسلي</th>
                          <th className="p-2 border-l border-stone-200">تذكرة الميزان</th>
                          <th className="p-2 border-l border-stone-200">{t("navigation.labels.txt_4eac23")}</th>
                          <th className="p-2 border-l border-stone-200">الحالة</th>
                          <th className="p-2 border-l border-stone-200 bg-emerald-50 text-emerald-900">نوع التسعير</th>
                          <th className="p-2 border-l border-stone-200 bg-emerald-50 text-emerald-900">السعر المتفق</th>
                          <th className="p-2 border-l border-stone-200 bg-emerald-50 text-emerald-900">{t("navigation.labels.txt_2f3fde")}</th>
                          <th className="p-2 bg-emerald-50 text-emerald-900">العملة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {trips.slice(0, 5).map((t) => (
                          <tr key={t.tripId} className="hover:bg-amber-50/40">
                            <td className="p-2 font-mono font-bold text-amber-900 border-l border-stone-100">{t.tripId}</td>
                            <td className="p-2 font-mono border-l border-stone-100">{t.tripNumber}</td>
                            <td className="p-2 font-mono border-l border-stone-100">{t.weights?.originTicketNo || (t as any).waybillNumber || t.tripNumber}</td>
                            <td className="p-2 font-mono border-l border-stone-100">{(t.weights?.originNetKg ? t.weights.originNetKg / 1000 : 0).toLocaleString()}</td>
                            <td className="p-2 border-l border-stone-100">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-2 font-mono font-semibold text-emerald-800 bg-emerald-50/40 border-l border-stone-100">
                              {t.pricingSnapshot?.pricingType || 'N/A'}
                            </td>
                            <td className="p-2 font-mono text-emerald-900 bg-emerald-50/40 border-l border-stone-100">
                              {t.pricingSnapshot?.agreedRate ?? 'N/A'}
                            </td>
                            <td className="p-2 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-stone-100">
                              {(t.pricingSnapshot?.settlementAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-2 font-mono text-emerald-800 bg-emerald-50/40">{t.pricingSnapshot?.currency || 'SAR'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Other Tabs Placeholder Info */}
            {activeTabKey !== 'OPERATIONS' && (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <Info className="w-4 h-4 text-stone-500" />
                  <span>معلومات ومحددات الإسقاط لجدول {WORKSPACE_TABS[activeTabKey].tabTitleAr}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  يتم سحب السجلات من مستودعات البيانات الرئيسية في Firestore وتحديث جدول {WORKSPACE_TABS[activeTabKey].tabTitleAr}
                  باستخدام المفتاح التقني <code className="font-mono bg-stone-200 px-1 py-0.5 rounded">{WORKSPACE_TABS[activeTabKey].primaryKey}</code>.
                  في حال وجود السجل مسبقاً يتم تحديث الصف دون تكرار، وفي حال كونه جديداً يُلحق في نهاية الشيت.
                </p>
              </div>
            )}
          </div>

          {/* Upsert Sync Execution Results Card */}
          {syncSummary && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t("navigation.labels.txt_7f525d")}</span>
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  {new Date(syncSummary.syncedAt).toLocaleTimeString('ar-SA')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {syncSummary.upsertResults.map((r) => (
                  <div key={r.tabKey} className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 text-center">
                    <div className="text-[11px] font-bold text-stone-800 truncate">{r.tabTitle}</div>
                    <div className="text-base font-bold text-stone-900 mt-1">{r.processedCount}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      +{r.insertedCount} جديد • ~{r.updatedCount} تحديث
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Google Drive Hierarchy & Migration Plan */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Google Drive Structure Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-stone-900">{t("navigation.labels.txt_136877")}</h3>
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                {t("navigation.labels.txt_102b03")}</span>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              {t("navigation.labels.projectReports")}</p>

            {/* Folder Tree Visualizer */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs space-y-2 font-mono">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <FolderTree className="w-4 h-4 text-amber-600" />
                <span className="truncate">[Q-Saudi] {currentProject.nameAr}</span>
              </div>

              <div className="pr-5 space-y-2 border-r-2 border-stone-200 mr-2 text-[11px]">
                <div className="flex items-center justify-between gap-1 text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>imported files</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans">{t("navigation.labels.import")}</span>
                </div>

                <div className="flex items-center justify-between gap-1 text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-500" />
                    <span>reports</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans">{t("navigation.labels.reports_2")}</span>
                </div>

                <div className="flex items-center justify-between gap-1 text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
                    <span>printable documents</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans">{t("navigation.labels.txt_acdcf5")}</span>
                </div>

                <div className="flex items-center justify-between gap-1 text-emerald-800 font-semibold pt-1 border-t border-stone-200">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("navigation.labels.project_7")}</span>
                  </div>
                  <span className="text-[10px] font-sans">{t("navigation.labels.txt_7f13e8")}</span>
                </div>
              </div>
            </div>

            {/* Document Upload Tester to Drive */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <FileUp className="w-4 h-4 text-amber-700" />
                <span>{t("navigation.labels.upload")}</span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="اسم الملف (مثال: تذكرة_ميزان_WB-99101.pdf)"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={uploadSubfolder}
                    onChange={(e) => setUploadSubfolder(e.target.value as any)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-700"
                  >
                    <option value="printableDocuments">{t("navigation.labels.txt_3f72a1")}</option>
                    <option value="reports">{t("navigation.labels.txt_114bd2")}</option>
                    <option value="importedFiles">{t("navigation.labels.txt_1a928c")}</option>
                  </select>

                  <button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                  >
                    {isUploading ? 'جاري الرفع...' : 'رفع'}
                  </button>
                </div>

                {lastUploadedLink && (
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <a href={lastUploadedLink} target="_blank" rel="noreferrer" className="underline font-mono truncate">
                      {t("navigation.labels.txt_310722")}</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Migration Plan Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">{t("navigation.labels.txt_4d5df6")}</h3>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Migration Plan
              </span>
            </div>

            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800">{t("navigation.labels.txt_177b34")}</span>
                  {t("navigation.labels.deleteReports")}</div>
              </div>

              <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800">{t("navigation.labels.txt_15ec91")}</span>
                  {t("navigation.labels.pricing_5")}</div>
              </div>

              <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800">{t("navigation.labels.txt_3c3f5c")}</span>
                  {t("navigation.labels.refresh_4")}</div>
              </div>
            </div>

            {migrationPlan && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>الإصدار: {migrationPlan.planVersion}</span>
                <span>الاستراتيجية: {migrationPlan.migrationStrategy}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* BLOCK 100G-D: Safe Storage Migration Modal with User-Friendly Folder Selector UX */}
      {isMigrationModalOpen && currentProject && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">نقل موقع تخزين المشروع والتوزيع (Storage Migration)</h2>
                  <p className="text-xs text-stone-500">إعادة توجيه وإسقاط ملفات وسجلات المشروع إلى موقع تخزين جديد في Google Drive.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMigrationModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Section 1: Current Storage */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="font-bold text-stone-800 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-stone-600" />
                  <span>موقع التخزين الحالي (Current Storage Location)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600 pt-1">
                  <div>
                    <span className="text-stone-400">المسار: </span>
                    <span className="font-mono text-[11px] text-stone-800">{currentStorageProfile.rootFolderPathDisplay}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">المزود: </span>
                    <span className="font-semibold text-stone-800">{currentStorageProfile.storageProvider === 'SHARED_DRIVE' ? 'Shared Drive' : 'My Drive'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Change Storage Location (Folder Selector UX) */}
              <div className="space-y-3 pt-2">
                <label className="font-bold text-stone-900 block">
                  اختر موقع التخزين الجديد (Change Storage Location)
                </label>

                {/* Storage Provider Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetProvider('SHARED_DRIVE')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      targetProvider === 'SHARED_DRIVE'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">المحرك المشارك (Shared Drive)</div>
                      <div className="text-[10px] text-stone-500">تخزين مؤسسي مشترك للفرق والأطقم</div>
                    </div>
                    {targetProvider === 'SHARED_DRIVE' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetProvider('MY_DRIVE')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      targetProvider === 'MY_DRIVE'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">مجلدي الشخصي (My Drive)</div>
                      <div className="text-[10px] text-stone-500">تخزين في حساب المدير المباشر</div>
                    </div>
                    {targetProvider === 'MY_DRIVE' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                </div>

                {/* Main Folder Picker Workflow */}
                <div className="p-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-indigo-600" />
                        <span>اختيار مجلد Google Drive المستهدف</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        حدد المجلد المستهدف من مجلدات Google Drive المتاحة أو اختر حزمة أرشيف المؤسسة.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-select-google-drive-folder"
                      onClick={() => setIsFolderPickerOpen(!isFolderPickerOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-xs shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span>{isFolderPickerOpen ? 'إغلاق منتقي المجلدات' : 'اختر مجلد Google Drive'}</span>
                    </button>
                  </div>

                  {/* Visual Folder Picker Drawer / Preset Browser */}
                  {isFolderPickerOpen && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-lg space-y-3 animate-in fade-in duration-150">
                      <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between border-b border-stone-100 pb-2">
                        <span>قائمة المجلدات المؤسسية المتاحة (Enterprise Drive Folders)</span>
                        <span className="text-stone-400 font-normal">انقر لتحديد المجلد</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {ENTERPRISE_FOLDER_PRESETS.map((preset) => (
                          <div
                            key={preset.id}
                            onClick={() => handleSelectFolder(preset.id, preset.name, preset.pathDisplay, preset.provider)}
                            className="p-2.5 rounded-lg border border-stone-100 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-stone-900 group-hover:text-indigo-900 flex items-center gap-2">
                                <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{preset.name}</span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">{preset.pathDisplay}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 group-hover:bg-indigo-100 text-stone-700 group-hover:text-indigo-800">
                              تحديد المجلد
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* URL Resolver Option */}
                      <div className="pt-2 border-t border-stone-100 space-y-1.5">
                        <label className="text-[11px] font-semibold text-stone-600 block">
                          أو الصق رابط مجلد Google Drive (Drive Folder URL):
                        </label>
                        <input
                          type="text"
                          value={pastedDriveUrl}
                          onChange={(e) => handleParseAndSetUrl(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/1A2B3C..."
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-stone-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Selected Location Card Display */}
                  {targetFolderId ? (
                    <div className="p-3.5 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>المجلد المحدد: {targetFolderName || targetFolderId}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          محدد وآمن
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 font-mono">
                        {targetFolderPathDisplay || `[${targetProvider}] / ${targetFolderId}`}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium pt-0.5">
                        جاهز للتحقق من التراخيص عبر السيرفر بالنقر على زر التحقق أدناه.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-100/80 border border-stone-200 text-stone-500 text-center text-xs">
                      لم يتم تحديد مجلد بعد. يرجى اختيار مجلد من الزر أعلاه.
                    </div>
                  )}
                </div>

                {/* Server Validation Result Card */}
                {validationResult && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    validationResult.valid 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {validationResult.valid ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{validationResult.valid ? 'تم التحقق بنجاح: المجلد المستهدف صالح ومصرح به' : 'تعذر التحقق من المجلد المستهدف'}</span>
                    </div>
                    {validationResult.error && (
                      <div className="text-[11px] text-rose-700">{validationResult.error}</div>
                    )}
                    {validationResult.valid && (
                      <div className="text-[11px] text-emerald-700">
                        مجلد ({validationResult.folderName || targetFolderId}) جاهز لبدء نقل الملفات والجداول بأمان.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-all"
              >
                إلغاء
              </button>

              <button
                type="button"
                id="btn-validate-destination-folder"
                onClick={handleValidateDestination}
                disabled={isValidatingDestination || !targetFolderId}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
                  isValidatingDestination || !targetFolderId
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                    : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${isValidatingDestination ? 'animate-spin' : ''}`} />
                <span>{isValidatingDestination ? 'جاري التحقق من السيرفر...' : 'التحقق من المجلد والتراخيص'}</span>
              </button>

              <button
                type="button"
                id="btn-execute-storage-migration"
                onClick={handleExecuteMigration}
                disabled={isMigrating || !validationResult?.valid}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all ${
                  isMigrating || !validationResult?.valid
                    ? 'bg-stone-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? 'جاري النقل والتسجيل...' : 'بدء نقل التخزين والتحديث الآمن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK 100G-B: Storage History Log Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-stone-900">سجل التغييرات التاريخية لمواقع التخزين</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              {storageHistoryRecords.length === 0 ? (
                <div className="p-6 text-center text-stone-400 font-medium">
                  لا توجد عمليات نقل سابقة مسجلة في التاريخ لهذا المشروع.
                </div>
              ) : (
                storageHistoryRecords.map((rec) => (
                  <div key={rec.historyId} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 font-mono text-xs">{rec.displayNamePath}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>المستخدم: {rec.changedBy.email} ({rec.changedBy.role})</span>
                      <span>التاريخ: {new Date(rec.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 text-left">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
