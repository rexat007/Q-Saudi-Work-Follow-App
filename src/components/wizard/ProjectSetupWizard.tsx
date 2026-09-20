import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  Boxes, 
  Truck, 
  CircleDollarSign, 
  Users, 
  FolderSync, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  UploadCloud, 
  RefreshCw, 
  FileSpreadsheet, 
  Lock, 
  Unlock, 
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { ProjectEntity, MaterialEntity, CarrierEntity, PricingRuleEntity } from '../../types/entities';
import { AuthUserContext } from '../../types/common';
import { projectService } from '../../services/project.service';
import { projectRepository } from '../../repositories/project.repository';
import { materialRepository } from '../../repositories/material.repository';
import { carrierRepository } from '../../repositories/carrier.repository';
import { pricingRuleRepository } from '../../repositories/pricingRule.repository';
import { clientWorkspaceService } from '../../services/workspace.service';
import { DriverTruckPipelineService } from '../../services/import/driverTruckPipeline.service';
import { auth } from '../../firebase/config';

export interface ProjectSetupWizardProps {
  projects: ProjectEntity[];
  authContext: AuthUserContext;
}

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({
  projects: globalProjects,
  authContext
}) => {
  const { t, isRTL, locale } = useI18n();
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<number>(1); // 1 to 5
  
  // Dashboard view search & filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Project Creation State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjNameAr, setNewProjNameAr] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjVatRate, setNewProjVatRate] = useState(15);
  const [newProjZatca, setNewProjZatca] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjStartDate, setNewProjStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSubmittingCreation, setIsSubmittingCreation] = useState(false);

  // Active Project Sub-collection States
  const [materials, setMaterials] = useState<MaterialEntity[]>([]);
  const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleEntity[]>([]);
  const [fleetRows, setFleetRows] = useState<any[]>([]);

  // Editing Forms and Modals
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [matName, setMatName] = useState('');
  const [matCode, setMatCode] = useState('');
  const [matUnit, setMatUnit] = useState<'TON' | 'M3' | 'TRIP'>('TON');
  const [matDensity, setMatDensity] = useState(1.6);

  const [isAddingCarrier, setIsAddingCarrier] = useState(false);
  const [carName, setCarName] = useState('');
  const [carCr, setCarCr] = useState('');
  const [carLicense, setCarLicense] = useState('');
  const [carContactName, setCarContactName] = useState('');
  const [carContactPhone, setCarContactPhone] = useState('');
  const [carContactEmail, setCarContactEmail] = useState('');

  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [priceCarrierId, setPriceCarrierId] = useState('ALL');
  const [priceMaterialId, setPriceMaterialId] = useState('ALL_MATERIALS');
  const [priceModel, setPriceModel] = useState<'PER_TRIP' | 'PER_TON'>('PER_TRIP');
  const [priceRate, setPriceRate] = useState(0);
  const [priceFrom, setPriceFrom] = useState(new Date().toISOString().split('T')[0]);
  const [priceTo, setPriceTo] = useState('');
  const [priceNotes, setPriceNotes] = useState('');

  // Roster Management States
  const [isAddingRosterRow, setIsAddingRosterRow] = useState(false);
  const [rostDriverName, setRostDriverName] = useState('');
  const [rostPlate, setRostPlate] = useState('');
  const [rostPhone, setRostPhone] = useState('');
  const [rostResidency, setRostResidency] = useState('');
  const [rostCarrier, setRostCarrier] = useState('');
  const [rostMaterial, setRostMaterial] = useState('');

  // Roster CSV/Excel Import Pipeline State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [importBatch, setImportBatch] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isCommittingImport, setIsCommittingImport] = useState(false);

  // Google Sync Action state
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Active project lookup helper
  const project = useMemo(() => {
    if (!editingProjectId) return null;
    return globalProjects.find(p => p.projectId === editingProjectId) || null;
  }, [globalProjects, editingProjectId]);

  // Read-only Lock Indicator for Active Projects
  const isLocked = useMemo(() => {
    return project?.status === 'ACTIVE';
  }, [project]);

  // Real-time Subscriptions to Active Project sub-collections
  useEffect(() => {
    if (!editingProjectId) {
      setMaterials([]);
      setCarriers([]);
      setPricingRules([]);
      setFleetRows([]);
      return;
    }

    // Load canonical lists and fleet rows
    const fetchCanonicalData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [matRes, carRes, fleetRes] = await Promise.all([
          fetch(`/api/projects/${editingProjectId}/materials`, { headers }).then(r => r.json()),
          fetch(`/api/projects/${editingProjectId}/carriers`, { headers }).then(r => r.json()),
          fetch(`/api/projects/${editingProjectId}/fleet-read-model`, { headers }).then(r => r.json())
        ]);
        setMaterials(matRes.data || []);
        setCarriers(carRes.data || []);
        setFleetRows(fleetRes.data?.rows || []);
      } catch (err) {
        console.error('Failed to load canonical data', err);
      }
    };
    
    fetchCanonicalData();

    const unsubP = pricingRuleRepository.subscribeByProject(editingProjectId, (list) => {
      setPricingRules(list || []);
    });

    return () => {
      unsubP();
    };
  }, [editingProjectId]);

  // Calculate Completeness for projects in list
  const getProjectCompleteness = (p: ProjectEntity) => {
    // Phase completion logic
    let score = 0;
    if (p.nameAr && p.clientName) score += 20; // Phase 1 basic details
    if (p.settings?.googleSpreadsheetId) score += 20; // Phase 1 Google sync
    if (p.authorizedMaterialIds && p.authorizedMaterialIds.length > 0) score += 15; // Material
    if (p.authorizedCarrierIds && p.authorizedCarrierIds.length > 0) score += 15; // Carrier
    if (p.status === 'ACTIVE') score = 100;
    else score = Math.min(score, 90);
    return score;
  };

  // Filtered setup projects
  const setupProjects = useMemo(() => {
    return globalProjects.filter(p => {
      const matchSearch = p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [globalProjects, searchTerm]);

  // Real-time pricing overlap validator
  const pricingConflicts = useMemo(() => {
    const conflicts: string[] = [];
    for (let i = 0; i < pricingRules.length; i++) {
      for (let j = i + 1; j < pricingRules.length; j++) {
        const r1 = pricingRules[i];
        const r2 = pricingRules[j];
        
        // Check if rules apply to same carrier and material
        const sameCarrier = r1.carrierId === r2.carrierId;
        const sameMaterial = r1.materialId === r2.materialId;
        
        if (sameCarrier && sameMaterial) {
          const from1 = new Date(r1.effectiveFrom).getTime();
          const to1 = r1.effectiveTo ? new Date(r1.effectiveTo).getTime() : Infinity;
          const from2 = new Date(r2.effectiveFrom).getTime();
          const to2 = r2.effectiveTo ? new Date(r2.effectiveTo).getTime() : Infinity;
          
          // Check for date range overlap
          const overlap = (from1 <= to2) && (from2 <= to1);
          if (overlap) {
            conflicts.push(`تضارب تداخل تاريخ: القاعدة [${r1.name}] تتعارض مع القاعدة [${r2.name}]`);
          }
        }
      }
    }
    return conflicts;
  }, [pricingRules]);

  // Readiness Checklist calculations
  const readinessChecklist = useMemo(() => {
    if (!project) return [];
    return [
      { id: 'foundation', text: 'تكوين بيانات التأسيس والعميل', isDone: !!project.nameAr && !!project.clientName },
      { id: 'materials', text: 'إضافة مادة واحدة على الأقل للمشروع', isDone: materials.length > 0 },
      { id: 'carriers', text: 'إضافة ناقل واحد معتمد على الأقل', isDone: carriers.length > 0 },
      { id: 'roster', text: 'تسجيل شاحنة واحدة نشطة على الأقل في الأسطول التشغيلي', isDone: fleetRows.length > 0 },
      { id: 'pricing', text: 'تهيئة قواعد الأسعار والتعرفة', isDone: pricingRules.length > 0 },
      { id: 'conflicts', text: 'خلو المشروع من تضارب تداخل الأسعار', isDone: pricingConflicts.length === 0 },
      { id: 'google_sync', text: 'مزامنة وتهيئة ملفات Google Workspace', isDone: !!project.settings?.googleSpreadsheetId }
    ];
  }, [project, materials, carriers, fleetRows, pricingRules, pricingConflicts]);

  const isReadinessGreen = useMemo(() => {
    return readinessChecklist.every(item => item.isDone);
  }, [readinessChecklist]);

  // Phase 1: Initialize New Project (Atomic transaction with sequential custom numbering)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError(null);
    setIsSubmittingCreation(true);

    try {
      const payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        projectId: 'TEMP_GENERATE', // To be overridden server-side
        projectCode: 'TEMP_GENERATE',
        projectNumber: 0,
        nameAr: newProjNameAr.trim(),
        nameEn: newProjNameAr.trim(),
        clientName: newProjClient.trim(),
        description: newProjDesc.trim(),
        status: 'SETUP' as any,
        startDate: newProjStartDate,
        endDate: '',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: {
          lat: 24.7136,
          lng: 46.6753,
          geoFenceRadiusMeters: 1000,
          addressAr: newProjLocation.trim()
        },
        settings: {
          currency: 'SAR',
          vatRatePercent: Number(newProjVatRate),
          zatcaTaxNumber: newProjZatca.trim(),
          requireTareOnExit: true,
          maxToleranceKg: 500,
          allowDriverSelfDispatch: false,
          googleDriveProvisioning: {
            enabled: true,
            rootFolderName: `مجلد مشروع - ${newProjNameAr.trim()}`,
            spreadsheetTitle: `شيت تشغيل - ${newProjNameAr.trim()}`,
            status: 'PENDING' as any
          }
        }
      };

      const createdProject = await projectService.createProject(payload, authContext);
      setIsCreatingNew(false);
      setEditingProjectId(createdProject.projectId);
      setActivePhase(1);
      
      // Clean creation fields
      setNewProjNameAr('');
      setNewProjClient('');
      setNewProjDesc('');
      setNewProjLocation('');
      setNewProjZatca('');
    } catch (err: any) {
      setCreationError(err.message || 'فشل إنشاء المشروع');
    } finally {
      setIsSubmittingCreation(false);
    }
  };

  // Trigger Google Workspace Sync asynchronously with Retry logic
  const handleSyncGoogleWorkspace = async () => {
    if (!project) return;
    setIsSyncingGoogle(true);
    setSyncNotice(null);

    try {
      // 1. Trigger OAuth Popup to retrieve Google Credentials
      await clientWorkspaceService.requestGoogleScopes();
      
      // 2. Perform Provisioning
      const syncResult = await clientWorkspaceService.provisionProjectDrive(project);
      
      setSyncNotice({
        type: 'success',
        text: `تمت تهيئة مجلدات Google Drive وجدول البيانات بنجاح: ${syncResult.projectFolderName}`
      });
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        text: err.message || 'فشلت عملية تهيئة مجلدات Google'
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Phase 1: Add Material Item
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || isLocked) return;

    try {
      const materialId = `MAT-${project.projectId}-${String(materials.length + 1).padStart(2, '0')}`;
      const payload = {
        name: matName.trim(),
        code: matCode.trim().toUpperCase(),
        unitOfMeasure: matUnit,
        standardDensityTonPerM3: Number(matDensity),
      };

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/projects/${project.projectId}/setup-material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ materialData: payload })
      });
      if (!response.ok) throw new Error('فشل إضافة المادة عبر الخادم');
      
      // Automatically update authorized materials on project doc - REMOVED AS PART OF P6 CONVERGENCE
      // const updatedMaterialsList = [...(project.authorizedMaterialIds || []), materialId];
      // await projectService.updateProject(project.projectId, {
      //   authorizedMaterialIds: updatedMaterialsList
      // }, authContext);

      setIsAddingMaterial(false);
      setMatName('');
      setMatCode('');
    } catch (err: any) {
      alert(err.message || 'خطأ في إضافة المادة');
    }
  };

  // Phase 2: Add Carrier Item
  const handleAddCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || isLocked) return;

    try {
      const payload = {
        carrierId: carCr.trim(),
        name: carName.trim(),
        commercialRegistrationNo: carCr.trim(),
        transportLicenseNo: carLicense.trim(),
        contactPersonName: carContactName.trim(),
        contactPhone: carContactPhone.trim(),
        contactEmail: carContactEmail.trim(),
      };

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/projects/${project.projectId}/setup-carrier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ carrierData: payload })
      });
      if (!response.ok) throw new Error('فشل إضافة الناقل عبر الخادم');

      // Automatically update authorized carriers on project doc - REMOVED AS PART OF P6 CONVERGENCE
      // const updatedCarriersList = [...(project.authorizedCarrierIds || []), carrierId];
      // await projectService.updateProject(project.projectId, {
      //   authorizedCarrierIds: updatedCarriersList
      // }, authContext);

      setIsAddingCarrier(false);
      setCarName('');
      setCarCr('');
      setCarLicense('');
      setCarContactName('');
      setCarContactPhone('');
      setCarContactEmail('');
    } catch (err: any) {
      alert(err.message || 'خطأ في إضافة الناقل');
    }
  };

  // Phase 2: Add Fleet Row Manually (Uses canonical intake API)
  const handleAddRosterManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || isLocked) return;

    if (!rostDriverName.trim() || !rostPlate.trim() || !rostCarrier || !rostMaterial || !rostResidency.trim()) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة بما في ذلك الهوية الوطنية ورقم اللوحة والناقل والمادة');
      return;
    }

    try {
      const payload = {
        projectId: project.projectId,
        carrierId: rostCarrier,
        materialId: rostMaterial,
        driverName: rostDriverName.trim(),
        plateNumber: rostPlate.trim().toUpperCase(),
        phone: rostPhone.trim() || undefined,
        residencyId: rostResidency.trim(),
      };

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/intake/canonical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'فشلت عملية التسجيل التشغيلي');
      }

      setIsAddingRosterRow(false);
      setRostDriverName('');
      setRostPlate('');
      setRostPhone('');
      setRostResidency('');
      setRostCarrier('');
      setRostMaterial('');

      // Reload canonical lists/fleet model
      const headers = { 'Authorization': `Bearer ${token}` };
      const [matRes, carRes, fleetRes] = await Promise.all([
        fetch(`/api/projects/${project.projectId}/materials`, { headers }).then(r => r.json()),
        fetch(`/api/projects/${project.projectId}/carriers`, { headers }).then(r => r.json()),
        fetch(`/api/projects/${project.projectId}/fleet-read-model`, { headers }).then(r => r.json())
      ]);
      setMaterials(matRes.data || []);
      setCarriers(carRes.data || []);
      setFleetRows(fleetRes.data?.rows || []);

    } catch (err: any) {
      alert(err.message || 'خطأ في إضافة شريك التشغيل');
    }
  };

  // Phase 2: Roster Unified Import File Input Change
  const handleRosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    await processRosterFile(file);
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !project) return;
    await processRosterFile(file);
  };

  const processRosterFile = async (file: File) => {
    setIsImportingFile(true);
    setImportError(null);
    setImportBatch(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          if (!data) throw new Error('فشلت قراءة ملف البيانات');

          // Process using our production pipeline
          const batch = await DriverTruckPipelineService.processFileToReview(
            data,
            file.name,
            file.size,
            file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            {
              projectId: project.projectId,
              userId: authContext.userId,
              role: authContext.role,
              operationId: `OP-${Date.now()}`
            }
          );
          setImportBatch(batch);
        } catch (innerErr: any) {
          setImportError(innerErr.message || 'خطأ أثناء تحليل ملف سجل التشغيل');
        } finally {
          setIsImportingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setImportError(err.message || 'خطأ في استيراد ملف سجل التشغيل');
      setIsImportingFile(false);
    }
  };

  // Confirm and Commit the Import Roster Batch
  const handleCommitRosterImport = async () => {
    if (!project || !importBatch || isLocked) return;
    setIsCommittingImport(true);

    try {
      // Execute the commit operation via the real pipeline
      const { result } = await DriverTruckPipelineService.commitBatch(importBatch, {
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-${Date.now()}`
      });

      alert(`تم بنجاح استيراد ${result.committedRows} سجلات تشغيل من الملف!`);
      setImportBatch(null);
    } catch (err: any) {
      alert(err.message || 'فشلت عملية حفظ وحقن السجلات');
    } finally {
      setIsCommittingImport(false);
    }
  };

  // Sync Roster from Project's Google Sheets (Disabled direct write, directs to reviewed import)
  const handleSyncRosterFromSheet = async () => {
    alert(isRTL 
      ? 'تم إيقاف المزامنة المباشرة لأوراق العمل إلى السجلات لحماية البيانات. يرجى استخدام بوابة الاستيراد المعتمدة والمراجعة من لوحة البيانات (Import Center) لمراجعة واعتماد السجلات أولاً.' 
      : 'Direct Google Sheets sync has been disabled for security and data protection. Please use the Import Center on the dashboard to review and commit records safely.');
  };

  // Phase 3: Add Pricing Rule
  const handleAddPricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || isLocked) return;

    try {
      const pricingRuleId = `PR-${project.projectId}-${String(pricingRules.length + 1).padStart(2, '0')}`;
      const carrierName = priceCarrierId === 'ALL' ? 'عام' : carriers.find(c => c.carrierId === priceCarrierId)?.name || priceCarrierId;
      const modelLabel = priceModel === 'PER_TRIP' ? 'بالرد' : 'بالطن';

      const payload: Omit<PricingRuleEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
        pricingRuleId,
        projectId: project.projectId,
        carrierId: priceCarrierId === 'ALL' ? undefined : priceCarrierId,
        materialId: priceMaterialId === 'ALL_MATERIALS' ? undefined : priceMaterialId,
        name: `تعرفة ${carrierName} - ${modelLabel} (${priceRate} ريال)`,
        pricingModel: priceModel,
        baseRateSAR: Number(priceRate),
        currency: 'SAR',
        effectiveFrom: priceFrom,
        effectiveTo: priceTo || undefined,
        notes: priceNotes.trim(),
        demurrageRatePerHourSAR: 50,
        freeTimeHours: 2,
        vatApplicable: true,
        isActive: true,
        createdBy: authContext.userId,
        updatedBy: authContext.userId
      };

      await pricingRuleRepository.create(payload);
      setIsAddingPricing(false);
      setPriceRate(0);
      setPriceNotes('');
    } catch (err: any) {
      alert(err.message || 'خطأ في إضافة تعرفة السعر');
    }
  };

  // Phase 5: Transition Project Setup Status (Governance rules)
  const handleTransitionStatus = async (nextStatus: ProjectEntity['status']) => {
    if (!project) return;
    
    try {
      await projectService.updateProject(project.projectId, {
        status: nextStatus
      }, authContext);
      alert(`تمت ترقية حالة المشروع بنجاح إلى: ${nextStatus}`);
    } catch (err: any) {
      alert(err.message || 'خطأ في ترقية حالة المشروع');
    }
  };

  const handleActivateProject = async () => {
    try {
      const response = await fetch(`/api/projects/${project?.projectId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await auth.currentUser?.getIdToken())}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error((await response.json()).error);
      alert('تم تنشيط المشروع بنجاح');
      // Refresh project state
    } catch (error: any) {
      alert(`فشل التنشيط: ${error.message}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Welcoming Dashboard & Staged List */}
      {!editingProjectId ? (
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-amber-500" />
                <span>لوحة التحكم والتأسيس المرحلي للمشاريع</span>
              </h1>
              <p className="text-xs text-stone-400">
                متابعة وإعداد مشاريع نقل المواد والجاهزية التشغيلية في دورة التأسيس المكونة من 5 مراحل
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="البحث عن مشروع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-950 border border-stone-800 px-4 py-2 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
              <button
                onClick={() => setIsCreatingNew(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>تأسيس مشروع جديد</span>
              </button>
            </div>
          </div>

          {/* New Project Dialog */}
          {isCreatingNew && (
            <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleCreateProject} className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">تأسيس مشروع جديد - مرحلة 1</h3>
                  <button type="button" onClick={() => setIsCreatingNew(false)} className="p-1 text-stone-400 hover:text-white rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-stone-300">
                  {creationError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{creationError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">اسم المشروع بالكامل (عربي)</label>
                      <input 
                        type="text" required value={newProjNameAr} onChange={(e) => setNewProjNameAr(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">العميل المستفيد / الشركة</label>
                      <input 
                        type="text" required value={newProjClient} onChange={(e) => setNewProjClient(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">الموقع / الحقل الميداني</label>
                      <input 
                        type="text" required value={newProjLocation} onChange={(e) => setNewProjLocation(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">تاريخ البدء التشغيلي</label>
                      <input 
                        type="date" required value={newProjStartDate} onChange={(e) => setNewProjStartDate(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">الرقم الضريبي للمشروع (ZATCA)</label>
                      <input 
                        type="text" maxLength={15} value={newProjZatca} onChange={(e) => setNewProjZatca(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono font-bold"
                        placeholder="15 خانة ضريبية"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">نسبة الضريبة المضافة (%)</label>
                      <input 
                        type="number" min={0} max={100} value={newProjVatRate} onChange={(e) => setNewProjVatRate(Number(e.target.value))}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-stone-400 font-bold">نطاق العمل ووصف التفاصيل</label>
                    <textarea 
                      value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full h-24 bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded-xl font-medium leading-relaxed">
                    * ملاحظة: رمز المشروع (projectCode) ورقم تسلسله (projectNumber) لا يمكن تعديلهما أو إدخالهما من قبل المستخدم، بل يتم توليدهما تلقائياً على الخادم لضمان سلامة الإثبات الإحصائي.
                  </div>
                </div>

                <div className="p-5 border-t border-stone-800 bg-stone-950 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreatingNew(false)} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors">
                    إلغاء
                  </button>
                  <button type="submit" disabled={isSubmittingCreation} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-2">
                    {isSubmittingCreation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>إنشاء وتأسيس المشروع</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Setup Projects List Grid */}
          {setupProjects.length === 0 ? (
            <div className="bg-stone-950 border border-stone-800 rounded-3xl p-16 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-stone-900 border border-stone-800 text-stone-500 rounded-full flex items-center justify-center mx-auto">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">لا توجد مشاريع قيد التأسيس</h3>
                <p className="text-xs text-stone-400">انقر على زر التأسيس بالأعلى للبدء في صياغة أول مشروع لوجستي</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {setupProjects.map((p) => {
                const completeness = getProjectCompleteness(p);
                return (
                  <div key={p.projectId} className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col justify-between hover:border-stone-700 transition-all shadow-md overflow-hidden relative group">
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        p.status === 'READY_FOR_REVIEW' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                        'bg-stone-950 text-stone-500 border-stone-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-stone-500 font-bold block">
                          {p.projectCode} • #{p.projectNumber}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {p.nameAr}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-stone-800/80 text-[11px] text-stone-400">
                        <div>
                          <span className="block text-stone-500 text-[10px]">العميل المستفيد</span>
                          <span className="font-bold text-stone-200 block truncate">{p.clientName}</span>
                        </div>
                        <div>
                          <span className="block text-stone-500 text-[10px]">تاريخ البدء</span>
                          <span className="font-mono text-stone-200 block truncate">{p.startDate || '—'}</span>
                        </div>
                      </div>

                      {/* Completeness Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-stone-400">
                          <span>اكتمال تهيئة المتطلبات</span>
                          <span className="font-mono">{completeness}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-600 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500">
                        {p.location?.addressAr || 'المملكة العربية السعودية'}
                      </span>
                      
                      <button
                        onClick={() => {
                          setEditingProjectId(p.projectId);
                          setActivePhase(1);
                        }}
                        className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-white font-bold text-[11px] rounded-lg border border-stone-700 flex items-center gap-1 transition-all"
                      >
                        <span>متابعة التهيئة</span>
                        <ArrowLeft className="w-3 h-3 text-stone-400 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // 2. Active Staged Workspace View (phases 1 to 5)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main workspace Sidebar (Phases Indicator) */}
          <div className="lg:col-span-3 bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-4">
            <div className="p-3 border-b border-stone-800 space-y-1 text-center lg:text-right">
              <button
                onClick={() => setEditingProjectId(null)}
                className="text-[10px] font-bold text-amber-500 hover:underline flex items-center gap-1 mx-auto lg:mx-0"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                <span>الرجوع للوحة المشاريع</span>
              </button>
              <h2 className="text-sm font-black text-white mt-1">{project?.nameAr}</h2>
              <span className="text-[10px] font-mono text-stone-500 block">
                {project?.projectCode} • #{project?.projectNumber}
              </span>
            </div>

            {/* Locked setup alert */}
            {isLocked && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>التهيئة مقفلة حالياً لأن هذا المشروع نشط للعمليات الميدانية</span>
              </div>
            )}

            {/* Phase Selector Stack */}
            <div className="space-y-1.5">
              {[
                { phase: 1, label: 'البيانات الأساسية والمواد', sub: 'Phase 1: Foundation', icon: Building2 },
                { phase: 2, label: 'الناقلون وسجل التشغيل', sub: 'Phase 2: Roster & Carriers', icon: Truck },
                { phase: 3, label: 'قواعد الأسعار والتعرفة', sub: 'Phase 3: Pricing Rules', icon: CircleDollarSign },
                { phase: 4, label: 'إدارة وتصاريح المستخدمين', sub: 'Phase 4: Governance', icon: Users },
                { phase: 5, label: 'مراجعة المتطلبات والتفعيل', sub: 'Phase 5: Activation', icon: ShieldCheck }
              ].map((p) => {
                const isActive = activePhase === p.phase;
                const Icon = p.icon;
                return (
                  <button
                    key={p.phase}
                    onClick={() => setActivePhase(p.phase)}
                    className={`w-full p-3 rounded-xl text-right flex items-center gap-3 transition-all ${
                      isActive 
                        ? 'bg-amber-600/10 border border-amber-500/20 text-white' 
                        : 'hover:bg-stone-850 text-stone-400 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-500'}`} />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black block">{p.label}</span>
                      <span className="text-[9px] text-stone-500 font-mono block">{p.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staged Panel Content */}
          <div className="lg:col-span-9 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-6 min-h-[500px]">
            {/* Panel Phase Header */}
            <div className="border-b border-stone-800 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-600/15 text-amber-500 text-xs font-mono font-black rounded-lg flex items-center justify-center">
                    {activePhase}
                  </span>
                  <span>
                    {activePhase === 1 && 'البيانات الأساسية وتكوين قوقل'}
                    {activePhase === 2 && 'الناقلون المعتمدون وسجل التشغيل'}
                    {activePhase === 3 && 'هيكل قواعد الأسعار والاتفاقيات المجدولة'}
                    {activePhase === 4 && 'تصاريح وصلاحيات مستخدمي المشروع'}
                    {activePhase === 5 && 'مراجعة الجاهزية واعتماد وتفعيل العمليات الميدانية'}
                  </span>
                </h2>
              </div>

              {isLocked && (
                <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded-xl font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مقفل</span>
                </span>
              )}
            </div>

            {/* ================= PHASE 1: FOUNDATION & MATERIALS ================= */}
            {activePhase === 1 && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Project details card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <h3 className="font-black text-white text-[13px] border-b border-stone-800 pb-2">تفاصيل المشروع</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">اسم المشروع</label>
                      <input 
                        type="text" value={project.nameAr} disabled={isLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, { nameAr: e.target.value }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">العميل المستفيد</label>
                      <input 
                        type="text" value={project.clientName} disabled={isLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, { clientName: e.target.value }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">الموقع الميداني</label>
                      <input 
                        type="text" value={project.location?.addressAr || ''} disabled={isLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, {
                            location: {
                              lat: project.location?.lat || 24.7136,
                              lng: project.location?.lng || 46.6753,
                              geoFenceRadiusMeters: project.location?.geoFenceRadiusMeters || 1000,
                              addressAr: e.target.value
                            }
                          }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">الرقم الضريبي ZATCA</label>
                      <input 
                        type="text" maxLength={15} value={project.settings?.zatcaTaxNumber || ''} disabled={isLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, {
                            settings: { ...project.settings, zatcaTaxNumber: e.target.value.replace(/\D/g, '') }
                          }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">تاريخ البدء التشغيلي</label>
                      <input 
                        type="date" value={project.startDate || ''} disabled={isLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, { startDate: e.target.value }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Workspace Setup card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">حالة مزامنة ملفات Google Drive / Google Sheets</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      project.settings?.googleSpreadsheetId ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {project.settings?.googleSpreadsheetId ? 'مكتمل' : 'بانتظار التهيئة'}
                    </span>
                  </div>

                  {syncNotice && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      syncNotice.type === 'success' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{syncNotice.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-stone-400">
                    <div>
                      <span className="block text-stone-500 font-bold">معرف شيت قوقل لإنزال الرحلات</span>
                      <span className="font-mono text-stone-200 block truncate">{project.settings?.googleSpreadsheetId || 'غير مهيأ'}</span>
                    </div>
                    <div>
                      <span className="block text-stone-500 font-bold">معرف المجلد الرئيسي للمشروع</span>
                      <span className="font-mono text-stone-200 block truncate">{project.settings?.googleDriveFolderId || 'غير مهيأ'}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSyncGoogleWorkspace}
                      disabled={isSyncingGoogle}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSyncingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderSync className="w-4 h-4" />}
                      <span>{project.settings?.googleSpreadsheetId ? 'إعادة مزامنة وتهيئة الملفات' : 'مزامنة وتوليد مجلدات قوقل شيت'}</span>
                    </button>
                  </div>
                </div>

                {/* Materials list management card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">قائمة المواد المصرح بها</h3>
                    {!isLocked && (
                      <button
                        onClick={() => setIsAddingMaterial(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مادة جديدة</span>
                      </button>
                    )}
                  </div>

                  {isAddingMaterial && (
                    <form onSubmit={handleAddMaterial} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">اسم المادة</label>
                          <input type="text" required value={matName} onChange={(e) => setMatName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">رمز الكود</label>
                          <input type="text" required value={matCode} onChange={(e) => setMatCode(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">وحدة القياس</label>
                          <select value={matUnit} onChange={(e) => setMatUnit(e.target.value as any)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="TON">TON (طن)</option>
                            <option value="M3">M3 (متر مكعب)</option>
                            <option value="TRIP">TRIP (رد)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingMaterial(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">إلغاء</button>
                        <button type="submit" className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">حفظ المادة</button>
                      </div>
                    </form>
                  )}

                  {materials.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">لم يتم تسجيل أي مواد لهذا المشروع بعد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">معرف المادة</th>
                            <th className="pb-2">الاسم</th>
                            <th className="pb-2">رمز الكود</th>
                            <th className="pb-2">الوحدة</th>
                            <th className="pb-2">الكثافة الافتراضية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m) => (
                            <tr key={m.materialId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{m.materialId}</td>
                              <td className="py-2.5">{m.nameAr}</td>
                              <td className="py-2.5 font-mono">{m.code}</td>
                              <td className="py-2.5">{m.unitOfMeasure}</td>
                              <td className="py-2.5 font-mono">{m.standardDensityTonPerM3 || 1.6} طن/م³</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= PHASE 2: CARRIERS & OPERATIONAL ROSTER ================= */}
            {activePhase === 2 && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Carriers checklist */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">الناقلون المعتمدون بالمشروع</h3>
                    {!isLocked && (
                      <button
                        onClick={() => setIsAddingCarrier(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة ناقل جديد</span>
                      </button>
                    )}
                  </div>

                  {isAddingCarrier && (
                    <form onSubmit={handleAddCarrier} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">اسم الناقل / الشركة</label>
                          <input type="text" required value={carName} onChange={(e) => setCarName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">السجل التجاري (CR)</label>
                          <input type="text" required value={carCr} onChange={(e) => setCarCr(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">رقم تصريح هيئة النقل</label>
                          <input type="text" required value={carLicense} onChange={(e) => setCarLicense(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">المسؤول التشغيلي</label>
                          <input type="text" value={carContactName} onChange={(e) => setCarContactName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">الهاتف</label>
                          <input type="text" value={carContactPhone} onChange={(e) => setCarContactPhone(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">البريد الإلكتروني</label>
                          <input type="email" value={carContactEmail} onChange={(e) => setCarContactEmail(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingCarrier(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">إلغاء</button>
                        <button type="submit" className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">حفظ الناقل</button>
                      </div>
                    </form>
                  )}

                  {carriers.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">لم يتم تسجيل أي ناقلين معتمدين للمشروع بعد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">معرف الناقل</th>
                            <th className="pb-2">اسم الشركة</th>
                            <th className="pb-2">السجل التجاري</th>
                            <th className="pb-2">رقم التصريح TGA</th>
                            <th className="pb-2">البريد الإلكتروني</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carriers.map((c) => (
                            <tr key={c.carrierId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{c.carrierId}</td>
                              <td className="py-2.5">{c.name}</td>
                              <td className="py-2.5 font-mono">{c.commercialRegistrationNo}</td>
                              <td className="py-2.5 font-mono">{c.transportLicenseNo}</td>
                              <td className="py-2.5 truncate font-mono">{c.contactPerson?.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Unified Import Pipeline Roster section */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-800 pb-2 gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-white text-[13px]">سجل تشغيل السائقين والشاحنات الموحد (Roster)</h3>
                      <p className="text-[10px] text-stone-500">مزامنة وترخيص السائقين والشاحنات للمشروع لمنع التكرار والحفظ الإقصائي</p>
                    </div>

                    {!isLocked && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => setIsAddingRosterRow(true)}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-stone-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة يدوية</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-amber-500 hover:text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>استيراد ملف</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleRosterFileChange}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />
                        <button
                          onClick={handleSyncRosterFromSheet}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-blue-400 hover:text-blue-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>مزامنة شيت قوقل</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Add Roster Row form */}
                  {isAddingRosterRow && (
                    <form onSubmit={handleAddRosterManual} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">اسم السائق الثنائي</label>
                          <input type="text" required value={rostDriverName} onChange={(e) => setRostDriverName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">رقم الجوال (+966)</label>
                          <input type="text" required value={rostPhone} onChange={(e) => setRostPhone(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">لوحة الشاحنة</label>
                          <input type="text" required value={rostPlate} onChange={(e) => setRostPlate(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">رقم الهوية / الإقامة</label>
                          <input type="text" value={rostResidency} onChange={(e) => setRostResidency(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">الناقل المعين</label>
                          <select required value={rostCarrier} onChange={(e) => setRostCarrier(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="">اختر الناقل...</option>
                            {carriers.map(c => <option key={c.carrierId} value={c.carrierId}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">المادة المعتادة</label>
                          <select required value={rostMaterial} onChange={(e) => setRostMaterial(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="">اختر المادة...</option>
                            {materials.map(m => <option key={m.materialId} value={m.materialId}>{m.nameAr}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingRosterRow(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">إلغاء</button>
                        <button type="submit" className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">تسجيل وحفظ</button>
                      </div>
                    </form>
                  )}

                  {/* Drag and Drop File intake Area */}
                  {!isLocked && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragOver ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 bg-stone-950 hover:bg-stone-900/50'
                      }`}
                    >
                      <UploadCloud className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                      <p className="text-[11px] text-stone-400 font-medium">سحب وإفلات ملف Excel/CSV لسجل التشغيل هنا لبدء الفحص التلقائي</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-amber-500 font-bold text-[10px] hover:underline mt-1 block mx-auto"
                      >
                        أو تصفح الملفات يدوياً
                      </button>
                    </div>
                  )}

                  {/* File Review popup modal for Unified Import Pipeline */}
                  {importBatch && (
                    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                            <span>مراجعة وفحص ملف سجل التشغيل الموحد</span>
                          </h3>
                          <button onClick={() => setImportBatch(null)} className="p-1 text-stone-400 hover:text-white rounded-lg">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-stone-300">
                          <div className="grid grid-cols-3 gap-3 bg-stone-950 p-3 rounded-xl border border-stone-850 text-center font-bold">
                            <div className="text-emerald-400">
                              <span className="block text-stone-500 text-[10px]">صفوف جاهزة للاستيراد</span>
                              <span className="text-base font-mono">{importBatch.validRows || 0}</span>
                            </div>
                            <div className="text-amber-400">
                              <span className="block text-stone-500 text-[10px]">تحذيرات تحتاج تدقيق</span>
                              <span className="text-base font-mono">{importBatch.warningRows || 0}</span>
                            </div>
                            <div className="text-rose-400">
                              <span className="block text-stone-500 text-[10px]">صفوف تحتوي أخطاء</span>
                              <span className="text-base font-mono">{importBatch.errorRows || 0}</span>
                            </div>
                          </div>

                          {/* Issues table */}
                          {importBatch.issues && importBatch.issues.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-white text-[11px] flex items-center gap-1.5 text-amber-400">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span>تفاصيل تنبيهات وأخطاء الفحص التلقائي:</span>
                              </h4>
                              <div className="bg-stone-950 border border-stone-850 rounded-lg p-3 max-h-[150px] overflow-y-auto space-y-1 font-mono text-[10px] text-stone-400 leading-relaxed">
                                {importBatch.issues.map((iss: any, idx: number) => (
                                  <div key={idx} className="border-b border-stone-900 pb-1 flex justify-between items-start">
                                    <span>السطر #{iss.rowNum}: {iss.messageAr || iss.message}</span>
                                    <span className={`px-1.5 py-0.2 rounded-md ${iss.severity === 'BLOCKING' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'}`}>
                                      {iss.severity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-5 border-t border-stone-800 bg-stone-950 flex justify-end gap-3">
                          <button onClick={() => setImportBatch(null)} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs">إلغاء</button>
                          <button
                            onClick={handleCommitRosterImport}
                            disabled={isCommittingImport || (importBatch.errorRows > 0)}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isCommittingImport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>حقن وتأكيد الاستيراد</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fleet Data Table */}
                  {fleetRows.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">الأسطول التشغيلي فارغ حالياً.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-right">
                        <thead className="sticky top-0 bg-stone-950 z-10">
                          <tr className="border-b border-stone-800 text-stone-500 font-black text-[11px]">
                            <th className="pb-2">معرف الشاحنة</th>
                            <th className="pb-2">اسم السائق</th>
                            <th className="pb-2">رقم اللوحة</th>
                            <th className="pb-2">الناقل</th>
                            <th className="pb-2">المادة المعتمدة</th>
                            <th className="pb-2">حالة التعيين</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fleetRows.map((r) => (
                            <tr key={r.truckId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{r.truckId}</td>
                              <td className="py-2.5">{r.driverName || '—'}</td>
                              <td className="py-2.5 font-mono">{r.plateNumber}</td>
                              <td className="py-2.5 font-semibold">{r.carrierName}</td>
                              <td className="py-2.5">{r.materialName || '—'}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  r.assignmentStatus === 'ASSIGNMENT_ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-stone-900 text-stone-500'
                                }`}>
                                  {r.assignmentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= PHASE 3: PRICING & CONTRACTS ================= */}
            {activePhase === 3 && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Overlap warnings alert */}
                {pricingConflicts.length > 0 && (
                  <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-300 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 font-black">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <span>تنبيه تداخل زمني نشط للتعرفات الضريبية والمالية:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[10px] leading-relaxed">
                      {pricingConflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <div>
                      <h3 className="font-black text-white text-[13px]">قواعد وأسعار النقل والاتفاقيات</h3>
                      <p className="text-[10px] text-stone-500">تطبيق الفحص المنطقي لمنع الازدواجية في فترات التعاقد وحساب الفروقات الضريبية</p>
                    </div>

                    {!isLocked && (
                      <button
                        onClick={() => setIsAddingPricing(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة تعرفة جديدة</span>
                      </button>
                    )}
                  </div>

                  {isAddingPricing && (
                    <form onSubmit={handleAddPricingRule} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">الناقل المعني</label>
                          <select required value={priceCarrierId} onChange={(e) => setPriceCarrierId(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="ALL">جميع الناقلين المعتمدين (تعرفة عامة)</option>
                            {carriers.map(c => <option key={c.carrierId} value={c.carrierId}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">المادة المستهدفة</label>
                          <select required value={priceMaterialId} onChange={(e) => setPriceMaterialId(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="ALL_MATERIALS">جميع المواد المصرحة</option>
                            {materials.map(m => <option key={m.materialId} value={m.materialId}>{m.nameAr}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">نموذج التسعير</label>
                          <select required value={priceModel} onChange={(e) => setPriceModel(e.target.value as any)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="PER_TRIP">بالرد (PER TRIP)</option>
                            <option value="PER_TON">بالطن (PER TON)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">السعر الأساسي للرد/الطن (SAR)</label>
                          <input type="number" min={0} step={0.01} required value={priceRate} onChange={(e) => setPriceRate(Number(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">تاريخ السريان من</label>
                          <input type="date" required value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">تاريخ الانتهاء إلى (اختياري)</label>
                          <input type="date" value={priceTo} onChange={(e) => setPriceTo(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold">ملاحظات ومرجع التعاقد</label>
                        <input type="text" value={priceNotes} onChange={(e) => setPriceNotes(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingPricing(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">إلغاء</button>
                        <button type="submit" className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">حفظ التعرفة</button>
                      </div>
                    </form>
                  )}

                  {pricingRules.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">لم يتم تكوين أي قواعد أسعار أو اتفاقيات بعد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">معرف القاعدة</th>
                            <th className="pb-2">الناقل المعني</th>
                            <th className="pb-2">المادة المستهدفة</th>
                            <th className="pb-2">الموديل</th>
                            <th className="pb-2">التعرفة (SAR)</th>
                            <th className="pb-2">السريان من</th>
                            <th className="pb-2">انتهاء السريان</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingRules.map((r) => (
                            <tr key={r.pricingRuleId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{r.pricingRuleId}</td>
                              <td className="py-2.5 font-bold">
                                {r.carrierId ? (carriers.find(c => c.carrierId === r.carrierId)?.name || r.carrierId) : 'جميع الناقلين'}
                              </td>
                              <td className="py-2.5">
                                {r.materialId ? (materials.find(m => m.materialId === r.materialId)?.nameAr || r.materialId) : 'جميع المواد المعتمدة'}
                              </td>
                              <td className="py-2.5">{r.pricingModel === 'PER_TRIP' ? 'بالرد' : 'بالطن'}</td>
                              <td className="py-2.5 font-mono text-emerald-400">{r.baseRateSAR} ريال</td>
                              <td className="py-2.5 font-mono">{r.effectiveFrom}</td>
                              <td className="py-2.5 font-mono">{r.effectiveTo || 'مفتوح / غير محدد'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= PHASE 4: ACCESS & GOVERNANCE ================= */}
            {activePhase === 4 && project && (
              <div className="space-y-6 text-xs text-stone-300">
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <h3 className="font-black text-white text-[13px] border-b border-stone-800 pb-2">إدارة وصلاحيات مستخدمي المشروع</h3>
                  
                  <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-4 leading-relaxed">
                    <p className="text-stone-400 text-[11px]">
                      تطبيق عزل البيانات التشغيلية والمستندية على مستوى المشروع لضمان الوصول الخاضع للمراقبة والتدقيق.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-stone-950 rounded-lg border border-stone-850 space-y-1">
                        <span className="font-bold text-white block">مدير المشروع (PROJECT_ADMIN)</span>
                        <span className="text-stone-500 text-[10px] block">صلاحية التأسيس، تعديل سجل التشغيل، إضافة الأسعار وتغيير حالة المشروع.</span>
                      </div>
                      <div className="p-3 bg-stone-950 rounded-lg border border-stone-850 space-y-1">
                        <span className="font-bold text-white block">مراقب الميدان (FIELD_SUPERVISOR)</span>
                        <span className="text-stone-500 text-[10px] block">صلاحية تتبع شاحنات سجل التشغيل، وإصدار وتعديل كشوفات الرحلات اللوجستية.</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                          <th className="pb-2">المستخدم</th>
                          <th className="pb-2">البريد الإلكتروني</th>
                          <th className="pb-2">الدور الوظيفي في النظام</th>
                          <th className="pb-2">عزل المشاريع</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-stone-850 text-stone-300 font-semibold">
                          <td className="py-2.5 font-bold">{authContext.displayName}</td>
                          <td className="py-2.5 font-mono">{authContext.email}</td>
                          <td className="py-2.5 font-mono text-amber-500 font-bold">{authContext.role}</td>
                          <td className="py-2.5 text-emerald-400">كامل الصلاحيات (مرخص)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PHASE 5: REVIEW & ACTIVATE ================= */}
            {activePhase === 5 && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Readiness summary */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <h3 className="font-black text-white text-[13px] border-b border-stone-800 pb-2">فحص وجاهزية إعدادات ومستندات المشروع</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readinessChecklist.map((item) => (
                      <div key={item.id} className="p-3 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between">
                        <span className="text-stone-300 font-semibold">{item.text}</span>
                        {item.isDone ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>مستوفى</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/60 font-bold flex items-center gap-1">
                            <X className="w-3 h-3 text-rose-400" />
                            <span>غير مكتمل</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Governance and transitions controller */}
                <div className="bg-stone-950 border border-stone-850 p-6 rounded-2xl text-center space-y-6 max-w-xl mx-auto shadow-lg">
                  <div className="space-y-2">
                    <span className="text-stone-500 font-mono font-bold block">دورة حوكمة حالة المشروع</span>
                    <div className="flex justify-center gap-2 items-center text-xs font-black">
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'SETUP' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>SETUP</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'READY_FOR_REVIEW' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>READY_FOR_REVIEW</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'APPROVED' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>APPROVED</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-stone-500'}`}>ACTIVE</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-stone-400 leading-relaxed text-[11px] max-w-md mx-auto">
                      يتطلب تحويل المشروع إلى الحالة <span className="font-bold text-white">ACTIVE</span> استيفاء كافة المتطلبات أعلاه. بتفعيل المشروع، يتم قفل تهيئات الفترات والتعرفات ويصبح جاهزاً للتشغيل الفعلي وحقن بيانات الميزان.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {(project.status as any) === 'SETUP' && (
                        <button
                          onClick={() => handleTransitionStatus('READY_FOR_REVIEW' as any)}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md"
                        >
                          تقديم طلب مراجعة واعتماد الإعدادات
                        </button>
                      )}

                      {(project.status as any) === 'READY_FOR_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleTransitionStatus('SETUP' as any)}
                            className="px-4 py-2 bg-rose-900/50 border border-rose-800 text-rose-300 font-black rounded-xl transition-all"
                          >
                            رفض للتعديل
                          </button>
                          <button
                            onClick={() => handleTransitionStatus('APPROVED' as any)}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all"
                          >
                            اعتماد وتصديق جاهزية التهيئة
                          </button>
                        </>
                      )}

                      {(project.status as any) === 'APPROVED' && (
                        <button
                          onClick={handleActivateProject}
                          disabled={!isReadinessGreen}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>تفعيل المشروع وبدء العمليات الميدانية</span>
                        </button>
                      )}

                      {(project.status as any) === 'ACTIVE' && (
                        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl text-emerald-400 font-black flex flex-col items-center gap-3">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                          <div className="space-y-1">
                            <span className="text-xs block">المشروع نشط للتشغيل الميداني الفعلي</span>
                            <span className="text-[10px] text-stone-500 font-mono block">جميع متطلبات التأسيس تم قفلها بنجاح</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
