import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { entityResolutionCommandService } from '../../services/import/entityResolutionCommand.service';
import { RosterBatchReviewService, ReviewGroupEntityType } from '../../services/import/rosterBatchReview.service';
import { canonicalRelationshipContextService } from '../../services/canonicalRelationshipContext.service';
import { ImportProjectContextAdapter } from '../../services/import/importProjectContext.adapter';
import { smartSourceDiscoveryService, DiscoveryResult } from '../../services/import/smartSourceDiscovery.service';
import { 
  DriverTruckCanonicalMappingTarget, 
  ROSTER_CANONICAL_FIELD_OPTIONS, 
  translateDiscoveryToRosterTarget 
} from '../../services/import/driverTruckImport';
import { ExcelCsvColumnMapper } from '../../services/import/columnMapper.service';
import { ImportSource, ImportResult, UnifiedImportBatch } from '../../types/unifiedImport';
import * as XLSX from 'xlsx';
import { auth } from '../../firebase/config';
import { CarrierEditorModal } from '../masterData/CarrierEditorModal';
import { MaterialEditorModal } from '../masterData/MaterialEditorModal';
import { RosterCarrierResolutionLayer, checkCarrierResolutionReadiness } from '../import/RosterCarrierResolutionLayer';
import { RosterMaterialResolutionLayer, checkMaterialResolutionReadiness } from '../import/RosterMaterialResolutionLayer';
import { RosterDriverTruckResolutionLayer, extractGroupCarrierContext } from '../import/RosterDriverTruckResolutionLayer';
import { RosterFinalReviewLayer, classifyFinalReviewBlocker } from '../import/RosterFinalReviewLayer';
import { RosterCommitResultLayer } from '../import/RosterCommitResultLayer';
import { RelationshipContext } from '../../types/dataQuality';
import { CarrierCreationResult } from '../../services/carrierManagementClient.service';
import { MaterialCreationResult } from '../../services/materialManagementClient.service';
import { 
  RosterSmartImportStage, 
  ROSTER_STAGE_DEFINITIONS, 
  RosterSmartImportWorkflowService,
  RosterWorkflowContext
} from '../../services/import/rosterSmartImportWorkflow.service';
import { RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
import { projectCanonicalRefreshService, ProjectCanonicalRefreshSnapshot } from '../../services/projectCanonicalRefresh.service';
import { 
  isProjectOperationallyMutable, 
  canPerformOperationalMutation, 
  ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR 
} from '../../services/projectMutability.policy';
import {
  ProjectSetupLayer,
  PROJECT_SETUP_LAYERS,
  canEnterProjectSetupLayer,
  NavigationGateContext
} from '../../services/projectSetupWorkflow.service';

const LAYER_ICONS: Record<ProjectSetupLayer, React.ComponentType<any>> = {
  FOUNDATION: Building2,
  WORKSPACE: FolderSync,
  MATERIALS: Boxes,
  CARRIERS: Truck,
  ROSTER: FileSpreadsheet,
  PRICING: CircleDollarSign,
  ACCESS: Users,
  REVIEW_ACTIVATION: ShieldCheck
};


export interface ServerReadinessBlocker {
  code: string;
  message: string;
}

export interface ServerReadinessDTO {
  projectId: string;
  ready: boolean;
  evaluatedAt: string;
  blockers: ServerReadinessBlocker[];
  candidatePath?: {
    driverId: string;
    truckId: string;
    carrierId: string;
    materialId: string;
  } | null;
}

export interface ProjectSetupWizardProps {
  projects: ProjectEntity[];
  authContext: AuthUserContext;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string | null) => void;
}

export interface ProjectWorkspaceSyncParams {
  project: {
    projectId: string;
    projectCode?: string;
    nameAr?: string;
    nameEn?: string;
    clientName?: string;
    settings?: {
      googleDriveFolderId?: string;
      googleSpreadsheetId?: string;
    };
    [key: string]: any;
  } | null;
  isSyncingGoogle: boolean;
  setIsSyncingGoogle: (val: boolean) => void;
  setSyncNotice: (notice: { type: 'success' | 'error'; text: string } | null) => void;
  workspaceService?: typeof clientWorkspaceService;
}

export async function executeProjectWorkspaceSyncOrchestration(
  params: ProjectWorkspaceSyncParams
): Promise<void> {
  const {
    project,
    isSyncingGoogle,
    setIsSyncingGoogle,
    setSyncNotice,
    workspaceService = clientWorkspaceService,
  } = params;

  if (!project || isSyncingGoogle) return;

  const hasFolderId = Boolean(project.settings?.googleDriveFolderId);
  const hasSpreadsheetId = Boolean(project.settings?.googleSpreadsheetId);

  // Inconsistent Workspace ID State: Fail closed if exactly one Workspace identifier exists
  if ((hasFolderId && !hasSpreadsheetId) || (!hasFolderId && hasSpreadsheetId)) {
    setSyncNotice({
      type: 'error',
      text: 'معرفات Google Workspace للمشروع غير مكتملة أو غير متطابقة (يلزم توفر معرف المجلد ومعرف الشيت معاً)',
    });
    return;
  }

  setIsSyncingGoogle(true);
  setSyncNotice(null);

  // Flow B: Existing Workspace (Both IDs already exist)
  if (hasFolderId && hasSpreadsheetId) {
    try {
      // 1. Request Google OAuth scopes
      await workspaceService.requestGoogleScopes();

      // 2. DO NOT call provisionProjectDrive() - perform initial projection against existing spreadsheet
      await workspaceService.syncInitialProjectWorkspace(
        project.projectId,
        project.settings!.googleSpreadsheetId!
      );

      setSyncNotice({
        type: 'success',
        text: 'تم تحديث وإسقاط بيانات المشروع في جدول البيانات بنجاح دون إعادة تهيئة مساحة العمل',
      });
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        text: `فشل تحديث وإسقاط البيانات في جدول البيانات: ${err.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setIsSyncingGoogle(false);
    }
    return;
  }

  // Flow A: First-time Workspace (Neither ID exists)
  let provisionedSpreadsheetId: string | null = null;
  let provisionSucceeded = false;

  try {
    // 1. Request Google OAuth scopes
    await workspaceService.requestGoogleScopes();

    // 2. Provision Drive folders and spreadsheet
    const syncResult = await workspaceService.provisionProjectDrive(project as any);
    if (!syncResult?.spreadsheetId || !syncResult?.projectFolderId) {
      throw new Error('فشلت تهيئة مساحة العمل: لم يتم إرجاع معرفات المجلد أو جدول البيانات');
    }

    provisionedSpreadsheetId = syncResult.spreadsheetId;
    provisionSucceeded = true;

    // 3. Initial projection using returned spreadsheetId directly (never waiting for React state)
    await workspaceService.syncInitialProjectWorkspace(
      project.projectId,
      provisionedSpreadsheetId
    );

    setSyncNotice({
      type: 'success',
      text: 'تمت تهيئة مساحة العمل في Google بنجاح وإسقاط بيانات المشروع الأولية في جدول البيانات',
    });
  } catch (err: any) {
    if (provisionSucceeded && provisionedSpreadsheetId) {
      // Partial failure: Provisioning succeeded, but initial projection failed
      setSyncNotice({
        type: 'error',
        text: `تمت تهيئة مساحة العمل في Google Drive بنجاح، ولكن تعذر إكمال إسقاط البيانات الأولية: ${err.message || 'خطأ غير معروف'}`,
      });
    } else {
      // OAuth or Provisioning failure
      setSyncNotice({
        type: 'error',
        text: err.message || 'فشلت عملية تهيئة مجلدات ومساحة عمل Google',
      });
    }
  } finally {
    setIsSyncingGoogle(false);
  }
}

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({
  projects: globalProjects,
  authContext,
  selectedProjectId,
  onSelectProject
}) => {
  const { t, isRTL, locale } = useI18n();
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Active Project Sub-collection States
  const [activeSetupLayer, setActiveSetupLayer] = useState<ProjectSetupLayer>('FOUNDATION');
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialEntity[]>([]);
  const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleEntity[]>([]);
  const [fleetRows, setFleetRows] = useState<any[]>([]);
  const [projectRelationshipContext, setProjectRelationshipContext] = useState<RelationshipContext | null>(null);
  const [cachedSuccessfulDriverResult, setCachedSuccessfulDriverResult] = useState<{
    groupKey: string;
    carrierId: string;
    result: { matchedId: string; matchedName: string; sourceValue: string };
  } | null>(null);
  const [cachedSuccessfulTruckResult, setCachedSuccessfulTruckResult] = useState<{
    groupKey: string;
    carrierId: string;
    result: { matchedId: string; matchedName: string; sourceValue: string };
  } | null>(null);
  const [driverConvergenceError, setDriverConvergenceError] = useState<string | null>(null);
  const [truckConvergenceError, setTruckConvergenceError] = useState<string | null>(null);

  // C5 Smart Import Final Review & Commit Result State
  const [smartImportCommitResult, setSmartImportCommitResult] = useState<ImportResult | null>(null);
  const [smartImportCommitError, setSmartImportCommitError] = useState<string | null>(null);

  // Synchronize editingProjectId with prop selectedProjectId
  useEffect(() => {
    if (selectedProjectId) {
      setEditingProjectId(selectedProjectId);
      setActiveSetupLayer('FOUNDATION');
      setNavigationError(null);
    } else {
      setEditingProjectId(null);
      setActiveSetupLayer('FOUNDATION');
      setNavigationError(null);
    }
  }, [selectedProjectId]);

  const attemptProjectSetupLayerNavigation = useCallback((targetLayer: ProjectSetupLayer) => {
    const context: NavigationGateContext = {
      projectId: editingProjectId,
      materialsCount: materials.length,
      carriersCount: carriers.length,
    };
    const gate = canEnterProjectSetupLayer(targetLayer, context);
    if (gate.allowed) {
      setActiveSetupLayer(targetLayer);
      setNavigationError(null);
    } else {
      setNavigationError(gate.reason || 'تعذر الانتقال إلى هذه الطبقة.');
    }
  }, [editingProjectId, materials.length, carriers.length]);

  
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

  // Editing Forms and Modals
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialEntity | null>(null);

  const [isCarrierEditorOpen, setIsCarrierEditorOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<CarrierEntity | null>(null);

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
  const [importBatch, setImportBatch] = useState<UnifiedImportBatch | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isCommittingImport, setIsCommittingImport] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const rosterImportSessionGenerationRef = useRef(0);

  // DT-01 Roster Smart Import Discovery & Mapping Approval State
  const [rosterSelectedFile, setRosterSelectedFile] = useState<File | null>(null);
  const [rosterBuffer, setRosterBuffer] = useState<ArrayBuffer | null>(null);
  const [rosterDiscoveryResult, setRosterDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [rosterSelectedSheet, setRosterSelectedSheet] = useState<string>('');
  const [rosterHeaderRowIndex, setRosterHeaderRowIndex] = useState<number>(0);
  const [rosterCustomMappings, setRosterCustomMappings] = useState<Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'>>({});
  const [isRosterMappingApproved, setIsRosterMappingApproved] = useState<boolean>(false);
  const [isDiscoveringRoster, setIsDiscoveringRoster] = useState<boolean>(false);
  const [rosterDiscoveryError, setRosterDiscoveryError] = useState<string | null>(null);

  // C1 Layered Smart Import Stage Controller
  const [isSmartImportOpen, setIsSmartImportOpen] = useState<boolean>(false);
  const [rosterImportStage, setRosterImportStage] = useState<RosterSmartImportStage>('SOURCE_DISCOVERY');
  const [rosterTransitionError, setRosterTransitionError] = useState<string | null>(null);

  // C2 Smart Import Carrier Resolution State
  const [smartImportPendingCarrierGroup, setSmartImportPendingCarrierGroup] = useState<RosterEntityReviewGroup | null>(null);
  const [isSmartImportCarrierModalOpen, setIsSmartImportCarrierModalOpen] = useState<boolean>(false);

  // C3 Smart Import Material Resolution State
  const [smartImportPendingMaterialGroup, setSmartImportPendingMaterialGroup] = useState<RosterEntityReviewGroup | null>(null);
  const [isSmartImportMaterialModalOpen, setIsSmartImportMaterialModalOpen] = useState<boolean>(false);

  const rosterWorkflowContext: RosterWorkflowContext = useMemo(() => ({
    hasSource: Boolean(rosterSelectedFile && rosterBuffer),
    hasDiscovery: Boolean(rosterDiscoveryResult),
    hasDetectedHeaders: Boolean(rosterDiscoveryResult?.detectedHeaders && rosterDiscoveryResult.detectedHeaders.length > 0),
    isMappingApproved: Boolean(isRosterMappingApproved),
    hasImportBatch: Boolean(importBatch),
    isCommitAttemptedOrCompleted: Boolean(
      smartImportCommitResult !== null ||
      isCommittingImport ||
      (importBatch && (importBatch.commitStatus === 'COMMITTED' || importBatch.commitStatus === 'FAILED' || importBatch.committedRows > 0))
    ),
  }), [rosterSelectedFile, rosterBuffer, rosterDiscoveryResult, isRosterMappingApproved, importBatch, smartImportCommitResult, isCommittingImport]);

  // Guarded workflow transition helper with explicit effective next context support
  const transitionToRosterStage = (
    targetStage: RosterSmartImportStage,
    nextContextOverrides?: Partial<RosterWorkflowContext>
  ): boolean => {
    if (targetStage === 'SOURCE_DISCOVERY') {
      setRosterTransitionError(null);
      setRosterImportStage('SOURCE_DISCOVERY');
      return true;
    }

    const effectiveContext: RosterWorkflowContext = {
      ...rosterWorkflowContext,
      ...nextContextOverrides,
    };

    const canEnter = RosterSmartImportWorkflowService.canEnterStage(
      targetStage,
      effectiveContext,
      rosterImportStage
    );

    if (!canEnter) {
      console.warn(`Blocked transition to ${targetStage} from ${rosterImportStage}`, {
        effectiveContext,
        currentStage: rosterImportStage,
      });
      try {
        RosterSmartImportWorkflowService.assertStagePrerequisites(
          targetStage,
          effectiveContext,
          rosterImportStage
        );
      } catch (err: any) {
        const msg = err.message || `تعذر الانتقال إلى مرحلة ${targetStage}`;
        setRosterTransitionError(msg);
        setImportError(msg);
      }
      return false;
    }

    setRosterTransitionError(null);
    setRosterImportStage(targetStage);
    return true;
  };

  // Google Sync Action state
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Active project lookup helper
  const project = useMemo(() => {
    if (!editingProjectId) return null;
    return globalProjects.find(p => p.projectId === editingProjectId) || null;
  }, [globalProjects, editingProjectId]);

  // Core foundation setup lock for Active Projects (primary identifiers & metadata)
  const isCoreSetupLocked = useMemo(() => {
    return project?.status === 'ACTIVE';
  }, [project]);

  // Operational Mutability check (Active projects allow operational additions/mutations under governance)
  const isOperationallyMutable = useMemo(() => {
    return isProjectOperationallyMutable(project?.status);
  }, [project]);

  // Canonical Server Readiness States (Phase 5)
  const [serverReadiness, setServerReadiness] = useState<ServerReadinessDTO | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState<boolean>(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const fetchServerReadiness = useCallback(async (targetProjectId: string) => {
    setIsLoadingReadiness(true);
    setReadinessError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/projects/${targetProjectId}/readiness`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `خطأ في استعلام الجاهزية (${res.status})`);
      }
      const data: ServerReadinessDTO = await res.json();
      setServerReadiness(data);
    } catch (err: any) {
      setReadinessError(err.message || 'خطأ في جلب تقرير الجاهزية التشغيلية من الخادم');
      setServerReadiness(null);
    } finally {
      setIsLoadingReadiness(false);
    }
  }, []);

  useEffect(() => {
    if (editingProjectId) {
      fetchServerReadiness(editingProjectId);
    } else {
      setServerReadiness(null);
    }
  }, [editingProjectId, fetchServerReadiness]);

  useEffect(() => {
    if (activeSetupLayer === 'REVIEW_ACTIVATION' && editingProjectId) {
      fetchServerReadiness(editingProjectId);
    }
  }, [activeSetupLayer, editingProjectId, fetchServerReadiness]);

  const applyCanonicalSnapshot = useCallback((snapshot: ProjectCanonicalRefreshSnapshot) => {
    setMaterials(snapshot.materials || []);
    setCarriers(snapshot.carriers || []);
    setFleetRows(snapshot.fleetRows || []);
    if (snapshot.relationshipContext) {
      setProjectRelationshipContext(snapshot.relationshipContext);
    }
  }, []);

  // Real-time Subscriptions to Active Project sub-collections
  useEffect(() => {
    if (!editingProjectId) {
      setMaterials([]);
      setCarriers([]);
      setPricingRules([]);
      setFleetRows([]);
      return;
    }

    // Load canonical lists and fleet rows via canonical refresh barrier
    const fetchCanonicalData = async () => {
      try {
        const snapshot = await projectCanonicalRefreshService.refresh(editingProjectId);
        applyCanonicalSnapshot(snapshot);
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

  // Setup Progress Checklist calculations (informational progress tracking)
  const setupChecklist = useMemo(() => {
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

  const isSetupChecklistComplete = useMemo(() => {
    return setupChecklist.every(item => item.isDone);
  }, [setupChecklist]);

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
      onSelectProject?.(createdProject.projectId);
      setActiveSetupLayer('FOUNDATION');
      setNavigationError(null);
      
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

  // Trigger Google Workspace Sync & Initial Projection asynchronously
  const handleSyncGoogleWorkspace = async () => {
    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: clientWorkspaceService,
    });
  };




  // Phase 2: Add Fleet Row Manually (Uses canonical intake API)
  const handleAddRosterManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !canPerformOperationalMutation('INTAKE_DRIVER_TRUCK', project.status)) return;

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

  const handleResetRosterImport = () => {
    rosterImportSessionGenerationRef.current += 1;
    setIsProcessing(false);
    setIsImportingFile(false);
    setIsDiscoveringRoster(false);
    setIsCommittingImport(false);
    setRosterSelectedFile(null);
    setRosterBuffer(null);
    setRosterDiscoveryResult(null);
    setRosterSelectedSheet('');
    setRosterHeaderRowIndex(0);
    setRosterCustomMappings({});
    setIsRosterMappingApproved(false);
    setImportBatch(null);
    setImportError(null);
    setRosterDiscoveryError(null);
    setSmartImportCommitResult(null);
    setSmartImportCommitError(null);
    setRosterImportStage('SOURCE_DISCOVERY');
    setSmartImportPendingCarrierGroup(null);
    setIsSmartImportCarrierModalOpen(false);
    setSmartImportPendingMaterialGroup(null);
    setIsSmartImportMaterialModalOpen(false);
    setCachedSuccessfulDriverResult(null);
    setCachedSuccessfulTruckResult(null);
    setDriverConvergenceError(null);
    setTruckConvergenceError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processRosterFile = async (file: File) => {
    handleResetRosterImport();
    const currentGen = rosterImportSessionGenerationRef.current;
    setRosterSelectedFile(file);
    setIsImportingFile(true);
    setIsDiscoveringRoster(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result as ArrayBuffer;
          if (!data) throw new Error('فشلت قراءة ملف البيانات');
          if (currentGen !== rosterImportSessionGenerationRef.current) return;
          setRosterBuffer(data);

          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
          const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
          const discSource: ImportSource = {
            sourceType,
            importBatchId: `BAT-DISC-ROSTER-${Date.now()}`,
            sourceFileName: file.name,
          };

          const discovery = await smartSourceDiscoveryService.discover(discSource, data);
          if (currentGen !== rosterImportSessionGenerationRef.current) return;
          setRosterDiscoveryResult(discovery);
          const defaultSheet = discovery.selectedSheet || (discovery.availableSheets && discovery.availableSheets[0]) || '';
          setRosterSelectedSheet(defaultSheet);
          const headerIdx = discovery.detectedHeaderRowIndex ?? 0;
          setRosterHeaderRowIndex(headerIdx);

          const initialMappings: Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'> = {};
          (discovery.detectedHeaders || []).forEach((h) => {
            const diag = discovery.mappingDiagnostics?.[h];
            initialMappings[h] = translateDiscoveryToRosterTarget(diag?.canonicalField ? String(diag.canonicalField) : undefined);
          });
          setRosterCustomMappings(initialMappings);
          setIsSmartImportOpen(true);
          transitionToRosterStage('MAPPING_APPROVAL', {
            hasSource: true,
            hasDiscovery: true,
            hasDetectedHeaders: (discovery.detectedHeaders?.length || 0) > 0,
          });
        } catch (innerErr: any) {
          if (currentGen !== rosterImportSessionGenerationRef.current) return;
          setRosterDiscoveryError(innerErr.message || 'خطأ أثناء استكشاف ملف سجل التشغيل');
        } finally {
          if (currentGen === rosterImportSessionGenerationRef.current) {
            setIsImportingFile(false);
            setIsDiscoveringRoster(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setRosterDiscoveryError(err.message || 'خطأ في استيراد ملف سجل التشغيل');
      setIsImportingFile(false);
      setIsDiscoveringRoster(false);
    }
  };

  const handleRosterSheetChange = async (sheet: string) => {
    setRosterSelectedSheet(sheet);
    if (rosterSelectedFile && rosterBuffer) {
      const currentGen = rosterImportSessionGenerationRef.current;
      try {
        setIsDiscoveringRoster(true);
        const ext = rosterSelectedFile.name.toLowerCase().slice(rosterSelectedFile.name.lastIndexOf('.'));
        const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
        const discSource: ImportSource = {
          sourceType,
          importBatchId: `BAT-DISC-ROSTER-${Date.now()}`,
          sourceFileName: rosterSelectedFile.name,
          sourceSheetName: sheet,
        };

        const updatedDiscovery = await smartSourceDiscoveryService.discover(discSource, rosterBuffer);
        if (currentGen !== rosterImportSessionGenerationRef.current) return;
        setRosterDiscoveryResult(updatedDiscovery);
        const detectedIdx = updatedDiscovery.detectedHeaderRowIndex ?? 0;
        setRosterHeaderRowIndex(detectedIdx);

        const updatedMappings: Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'> = {};
        (updatedDiscovery.detectedHeaders || []).forEach((h) => {
          const diag = updatedDiscovery.mappingDiagnostics?.[h];
          updatedMappings[h] = translateDiscoveryToRosterTarget(diag?.canonicalField ? String(diag.canonicalField) : undefined);
        });
        setRosterCustomMappings(updatedMappings);
      } catch (err: any) {
        if (currentGen !== rosterImportSessionGenerationRef.current) return;
        console.error('Roster sheet change discovery error:', err);
        setRosterDiscoveryError(err?.message || 'فشل في استكشاف ورقة العمل المحددة');
      } finally {
        if (currentGen === rosterImportSessionGenerationRef.current) {
          setIsDiscoveringRoster(false);
        }
      }
    }
  };

  const handleRosterHeaderRowIndexChange = (index: number) => {
    setRosterHeaderRowIndex(index);
    if (rosterBuffer && rosterSelectedFile) {
      try {
        let headers: string[] = [];
        const wb = XLSX.read(rosterBuffer, { type: 'array' });
        const targetSheetName = rosterSelectedSheet || wb.SheetNames[0];
        const ws = wb.Sheets[targetSheetName];
        if (ws) {
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (rows && rows[index]) {
            headers = rows[index].map((h: any) => String(h || '').trim()).filter(Boolean);
          }
        }

        if (headers.length > 0) {
          const diags = ExcelCsvColumnMapper.mapHeaders(headers);
          setRosterDiscoveryResult((prev) => prev ? {
            ...prev,
            detectedHeaderRowIndex: index,
            detectedHeaders: headers,
            mappingDiagnostics: diags,
          } : null);

          const newMappings: Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'> = {};
          headers.forEach((h) => {
            const match = diags[h];
            newMappings[h] = translateDiscoveryToRosterTarget(match?.canonicalField ? String(match.canonicalField) : undefined);
          });
          setRosterCustomMappings(newMappings);
        }
      } catch (err) {
        console.warn('Roster header row change error:', err);
      }
    }
  };

  const handleRosterMappingChange = (header: string, target: DriverTruckCanonicalMappingTarget | 'unmapped') => {
    setRosterCustomMappings((prev) => ({
      ...prev,
      [header]: target,
    }));
  };

  const handleApproveRosterMappingAndStartPipeline = async () => {
    if (isProcessing || isImportingFile || !rosterSelectedFile || !rosterBuffer || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    setIsProcessing(true);
    setIsImportingFile(true);
    setImportError(null);

    try {
      const approvedCustomMappings: Record<string, DriverTruckCanonicalMappingTarget> = {};
      for (const [header, target] of Object.entries(rosterCustomMappings)) {
        if (target && target !== 'unmapped') {
          approvedCustomMappings[header] = target;
        }
      }

      // D12: Required Mapping Gate - Block impossible mappings before batch processing
      const mappedTargets = Object.values(approvedCustomMappings);
      const hasCarrierMapping = mappedTargets.includes('carrierName');
      const hasMaterialMapping = mappedTargets.includes('materialName');
      const hasDriverOrTruckMapping = mappedTargets.includes('driverName') || mappedTargets.includes('truckPlate');

      if (!hasCarrierMapping || !hasMaterialMapping || !hasDriverOrTruckMapping) {
        setImportError(
          'اعتماد الربط يتطلب ربط حقل الناقل (carrierName) وحقل المادة (materialName) وحقل السائق (driverName) أو الشاحنة (truckPlate) على الأقل قبل المتابعة.'
        );
        setIsImportingFile(false);
        setIsProcessing(false);
        return;
      }

      let relContext = null;
      try {
        relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      } catch (relErr) {
        console.warn('Could not load canonical relationship context for roster intake:', relErr);
      }
      if (currentGen !== rosterImportSessionGenerationRef.current) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-ROSTER-${Date.now()}`
      });

      const batch = await DriverTruckPipelineService.processFileToReview(
        rosterBuffer,
        rosterSelectedFile.name,
        rosterSelectedFile.size,
        rosterSelectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pipelineCtx,
        {
          sheetName: rosterSelectedSheet || undefined,
          headerRowIndex: rosterHeaderRowIndex,
          customMappings: approvedCustomMappings,
        }
      );

      if (currentGen !== rosterImportSessionGenerationRef.current) return;

      setImportBatch(batch);
      setIsRosterMappingApproved(true);
      setIsSmartImportOpen(true);
      transitionToRosterStage('CARRIER_RESOLUTION', {
        hasSource: true,
        hasDiscovery: true,
        hasDetectedHeaders: true,
        isMappingApproved: true,
        hasImportBatch: true,
      });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setImportError(err?.message || 'خطأ أثناء تحليل ملف سجل التشغيل');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsImportingFile(false);
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Progression Gate from CARRIER_RESOLUTION to MATERIAL_RESOLUTION (D10, D14)
  const handleSmartImportContinueToMaterials = () => {
    if (!importBatch) return;
    const reviewGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const carrierGroups = reviewGroups.carrier || [];
    if (carrierGroups.length === 0) {
      alert('لم يتم اكتشاف أي مجموعات ناقلين في الملف. الناقل مطلوب لكل سجل تشغيل.');
      return;
    }
    const hasUnresolvedCarriers = carrierGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );
    if (hasUnresolvedCarriers) {
      alert('يرجى حسم جميع مجموعات الناقلين قبل الانتقال إلى مراجعة المواد');
      return;
    }

    // D10: Carrier row-level required gate
    const activeRows = importBatch.rows.filter((r) => r.status !== 'REJECTED');
    const hasUnresolvedCarrierRow = activeRows.some((r) => {
      const carrierRes = r.entityResolutions?.carrier;
      return !carrierRes?.matchedId || carrierRes.relationshipStatus === 'RELATIONSHIP_CONFLICT';
    });
    if (hasUnresolvedCarrierRow) {
      alert('يوجد سجلات تشغيل نشطة بدون ناقل معتمد أو بحاجة لحسم. يجب حسم جميع صفوف الناقلين قبل المتابعة.');
      return;
    }

    transitionToRosterStage('MATERIAL_RESOLUTION');
  };

  // C4 Smart Import: Progression Gate from MATERIAL_RESOLUTION to DRIVER_TRUCK_RESOLUTION (D11, D14)
  const handleSmartImportContinueToDriverTruck = () => {
    if (!importBatch) return;
    const reviewGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const materialGroups = reviewGroups.material || [];
    if (materialGroups.length === 0) {
      alert('لم يتم اكتشاف أي مجموعات مواد في الملف. المادة مطلوبة لكل سجل تشغيل.');
      return;
    }
    const hasUnresolvedMaterials = materialGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );
    if (hasUnresolvedMaterials) {
      alert('يرجى حسم جميع مجموعات المواد قبل الانتقال إلى مراجعة السائقين والشاحنات');
      return;
    }

    // D11: Material row-level required gate
    const activeRows = importBatch.rows.filter((r) => r.status !== 'REJECTED');
    const hasUnresolvedMaterialRow = activeRows.some((r) => {
      const materialRes = r.entityResolutions?.material;
      return !materialRes?.matchedId || materialRes.relationshipStatus === 'RELATIONSHIP_CONFLICT';
    });
    if (hasUnresolvedMaterialRow) {
      alert('يوجد سجلات تشغيل نشطة بدون مادة معتمدة أو بحاجة لحسم. يجب حسم جميع صفوف المواد قبل المتابعة.');
      return;
    }

    transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
  };

  // C4 Smart Import: Accept Driver Candidate
  const handleSmartImportDriverAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-DRIVER-RES-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'driver',
        group.normalizedSourceKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: candidateEntityId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تطبيق قرار مطابقة السائق');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Select Alternate Driver
  const handleSmartImportDriverSelectAlternate = async (
    group: RosterEntityReviewGroup,
    driverId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-DRIVER-ALT-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'driver',
        group.normalizedSourceKey,
        'SELECT_ALTERNATE',
        { selectedEntityId: driverId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تعيين السائق البديل');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Create New Driver with Mutation-Success Cache and Explicit Visibility Proof
  const handleSmartImportDriverCreate = async (
    group: RosterEntityReviewGroup,
    data: { driverName: string; residencyId: string; phone?: string }
  ) => {
    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      const carrierId = extractGroupCarrierContext(group);
      if (!carrierId) {
        throw new Error('تعذر استخراج معرف الناقل التابع له السائق');
      }

      let result: { matchedId: string; matchedName: string; sourceValue: string };

      if (cachedSuccessfulDriverResult?.groupKey === group.normalizedSourceKey) {
        result = cachedSuccessfulDriverResult.result;
      } else {
        setDriverConvergenceError(null);
        const apiRes = await entityResolutionCommandService.createDriver({
          projectId: project.projectId,
          sourceValue: group.sourceValue,
          driverData: {
            carrierId,
            driverName: data.driverName,
            residencyId: data.residencyId,
            phone: data.phone,
          },
        });
        if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

        result = {
          matchedId: apiRes.matchedId,
          matchedName: apiRes.matchedName || group.sourceValue,
          sourceValue: group.sourceValue,
        };
        setCachedSuccessfulDriverResult({
          groupKey: group.normalizedSourceKey,
          carrierId,
          result,
        });
      }

      // Canonical Refresh & Explicit Visibility Proof
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundDriver = snapshot.relationshipContext?.knownDrivers?.find(
        (d) => d.driverId === result.matchedId && d.carrierId === carrierId
      );

      if (!foundDriver) {
        setDriverConvergenceError('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN: تم إنشاء السائق بنجاح، لكن تعذر تحديث البيانات الموثوقة. أعد محاولة التحديث دون إنشاء سجل جديد.');
        throw new Error('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }

      setDriverConvergenceError(null);
      applyCanonicalSnapshot(snapshot);

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-DRIVER-CREATE-${Date.now()}`
      });

      const resolutionPayload = {
        matchedId: result.matchedId,
        matchedName: result.matchedName,
        sourceValue: result.sourceValue,
      };

      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'driver',
        group.normalizedSourceKey,
        resolutionPayload,
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...updated });
      setCachedSuccessfulDriverResult(null);
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Accept Truck Candidate
  const handleSmartImportTruckAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-TRUCK-RES-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'truck',
        group.normalizedSourceKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: candidateEntityId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تطبيق قرار مطابقة الشاحنة');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Select Alternate Truck
  const handleSmartImportTruckSelectAlternate = async (
    group: RosterEntityReviewGroup,
    truckId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-TRUCK-ALT-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'truck',
        group.normalizedSourceKey,
        'SELECT_ALTERNATE',
        { selectedEntityId: truckId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تعيين الشاحنة البديلة');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Create New Truck with Mutation-Success Cache and Explicit Visibility Proof
  const handleSmartImportTruckCreate = async (
    group: RosterEntityReviewGroup,
    data: { plateNumber: string; truckType?: string; tareWeightKg?: number; maxGrossWeightKg?: number }
  ) => {
    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      const carrierId = extractGroupCarrierContext(group);
      if (!carrierId) {
        throw new Error('تعذر استخراج معرف الناقل التابع له الشاحنة');
      }

      let result: { matchedId: string; matchedName: string; sourceValue: string };

      if (cachedSuccessfulTruckResult?.groupKey === group.normalizedSourceKey) {
        result = cachedSuccessfulTruckResult.result;
      } else {
        setTruckConvergenceError(null);
        const apiRes = await entityResolutionCommandService.createTruck({
          projectId: project.projectId,
          sourceValue: group.sourceValue,
          truckData: {
            carrierId,
            plateNumber: data.plateNumber,
            truckType: data.truckType,
            tareWeightKg: data.tareWeightKg,
            maxGrossWeightKg: data.maxGrossWeightKg,
          },
        });
        if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

        result = {
          matchedId: apiRes.matchedId,
          matchedName: apiRes.matchedName || group.sourceValue,
          sourceValue: group.sourceValue,
        };
        setCachedSuccessfulTruckResult({
          groupKey: group.normalizedSourceKey,
          carrierId,
          result,
        });
      }

      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundTruck = snapshot.relationshipContext?.knownTrucks?.some(
        (t) => t.truckId === result.matchedId && t.carrierId === carrierId
      );

      if (!foundTruck) {
        setTruckConvergenceError('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN: تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة. أعد محاولة التحديث دون إنشاء سجل جديد.');
        throw new Error('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }

      setTruckConvergenceError(null);
      applyCanonicalSnapshot(snapshot);

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-TRUCK-CREATE-${Date.now()}`
      });

      const resolutionPayload = {
        matchedId: result.matchedId,
        matchedName: result.matchedName,
        sourceValue: result.sourceValue,
      };

      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'truck',
        group.normalizedSourceKey,
        resolutionPayload,
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...updated });
      setCachedSuccessfulTruckResult(null);
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C4 Smart Import: Joint Driver/Truck Accept & Alternate Handlers
  const handleSmartImportDriverTruckAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    if (group.entityType === 'truck') {
      await handleSmartImportTruckAcceptCandidate(group, candidateEntityId);
      return;
    }
    if (group.entityType === 'driver') {
      await handleSmartImportDriverAcceptCandidate(group, candidateEntityId);
      return;
    }
    throw new Error('INVALID_DRIVER_TRUCK_GROUP_TYPE');
  };

  const handleSmartImportDriverTruckSelectAlternate = async (
    group: RosterEntityReviewGroup,
    entityId: string
  ) => {
    if (group.entityType === 'truck') {
      await handleSmartImportTruckSelectAlternate(group, entityId);
      return;
    }
    if (group.entityType === 'driver') {
      await handleSmartImportDriverSelectAlternate(group, entityId);
      return;
    }
    throw new Error('INVALID_DRIVER_TRUCK_GROUP_TYPE');
  };

  const handleRetryDriverConvergence = async () => {
    if (isProcessing || !project || !importBatch || !cachedSuccessfulDriverResult) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      setDriverConvergenceError(null);
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundDriver = snapshot.relationshipContext?.knownDrivers?.some(
        (d) => d.driverId === cachedSuccessfulDriverResult.result.matchedId && d.carrierId === cachedSuccessfulDriverResult.carrierId
      );
      if (!foundDriver) {
        setDriverConvergenceError('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN: تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة.');
        throw new Error('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }
      setDriverConvergenceError(null);
      applyCanonicalSnapshot(snapshot);
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-DRIVER-RETRY-${Date.now()}`
      });
      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'driver',
        cachedSuccessfulDriverResult.groupKey,
        cachedSuccessfulDriverResult.result,
        pipelineCtx
      );
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
      setCachedSuccessfulDriverResult(null);
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setDriverConvergenceError(err.message || 'فشلت إعادة محاولة تحديث البيانات');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleRetryTruckConvergence = async () => {
    if (isProcessing || !project || !importBatch || !cachedSuccessfulTruckResult) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      setTruckConvergenceError(null);
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundTruck = snapshot.relationshipContext?.knownTrucks?.some(
        (t) => t.truckId === cachedSuccessfulTruckResult.result.matchedId && t.carrierId === cachedSuccessfulTruckResult.carrierId
      );
      if (!foundTruck) {
        setTruckConvergenceError('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN: تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة.');
        throw new Error('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }
      setTruckConvergenceError(null);
      applyCanonicalSnapshot(snapshot);
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-TRUCK-RETRY-${Date.now()}`
      });
      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'truck',
        cachedSuccessfulTruckResult.groupKey,
        cachedSuccessfulTruckResult.result,
        pipelineCtx
      );
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
      setCachedSuccessfulTruckResult(null);
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setTruckConvergenceError(err.message || 'فشلت إعادة محاولة تحديث البيانات');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C5 Smart Import: Progression from Driver/Truck Resolution to Final Review
  const handleSmartImportContinueToFinalReview = async () => {
    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;

    // 1. Independent Re-check of CURRENT importBatch using RosterBatchReviewService
    const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const driverGroups = batchGroups.driver || [];
    const truckGroups = batchGroups.truck || [];
    const driverTruckGroups = [...driverGroups, ...truckGroups];

    if (driverTruckGroups.length === 0) {
      alert('تعذر الانتقال للمراجعة النهائية: لا توجد مجموعات سائقين أو شاحنات لتقييمها.');
      return;
    }

    const hasUnresolvedDrivers = driverGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );
    const hasUnresolvedTrucks = truckGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );

    const driverTruckBlockingIssues = (importBatch.issues || []).filter(
      (iss) =>
        iss.severity === 'BLOCKING' &&
        iss.blocking &&
        (iss.field === 'driverName' ||
          iss.field === 'truckPlate' ||
          iss.code === 'DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN' ||
          iss.code === 'TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN')
    );

    if (
      hasUnresolvedDrivers ||
      hasUnresolvedTrucks ||
      driverTruckBlockingIssues.length > 0 ||
      driverConvergenceError !== null ||
      truckConvergenceError !== null
    ) {
      alert('تعذر الانتقال للمراجعة النهائية: توجد بيانات سائقين/شاحنات معلقة أو أخطاء تطابق قيد المعالجة.');
      return;
    }

    // 2. Fresh Revalidation before entering FINAL_REVIEW
    setIsProcessing(true);
    try {
      const freshContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setProjectRelationshipContext(freshContext);

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: freshContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-FINAL-REVIEW-INIT-${Date.now()}`
      });

      const revalidated = await DriverTruckPipelineService.revalidateRosterBatch(importBatch, pipelineCtx);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...revalidated });
      transitionToRosterStage('FINAL_REVIEW');
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      console.error('Final review revalidation error:', err);
      alert(err.message || 'حدث خطأ أثناء إجراء الفحص النهائي قبل المراجعة.');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C5 Smart Import: Pre-flight Recheck & Guarded Commit Execution
  const handleSmartImportCommit = async () => {
    if (isProcessing || isCommittingImport || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;

    if (smartImportCommitResult !== null) {
      setSmartImportCommitError(
        'تم تنفيذ محاولة الاستيراد بالفعل لهذه الجلسة. لا يمكن إعادة التنفيد.'
      );
      return;
    }

    setIsCommittingImport(true);
    setIsProcessing(true);
    setSmartImportCommitError(null);

    try {
      // 1. Fetch fresh canonical RelationshipContext
      const freshContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setProjectRelationshipContext(freshContext);

      // 2. Build fresh PipelineContext
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: freshContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-COMMIT-${Date.now()}`
      });

      // 3. Revalidate SAME importBatch again (Preflight)
      const revalidated = await DriverTruckPipelineService.revalidateRosterBatch(importBatch, pipelineCtx);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      // 4. Inspect row-level readiness again using RosterBatchReviewService
      const activeRows = revalidated.rows.filter((r) => r.status !== 'REJECTED');
      const revalidatedGroups = RosterBatchReviewService.getBatchReviewGroups(revalidated);
      const allRevalidatedGroups = [
        ...(revalidatedGroups.carrier || []),
        ...(revalidatedGroups.material || []),
        ...(revalidatedGroups.driver || []),
        ...(revalidatedGroups.truck || [])
      ];
      const hasUnresolved = allRevalidatedGroups.some(
        (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
      );
      const hasRowErrors = activeRows.some(
        (r) => r.reviewStatus === 'requires_review' || r.reviewStatus === 'error' || r.status === 'ERROR'
      );
      const hasBlockingIssues = (revalidated.issues || []).some(
        (iss) => (iss.severity === 'BLOCKING' || iss.blocking) && iss.code !== 'WARNING'
      );

      if (hasUnresolved || hasRowErrors || hasBlockingIssues) {
        setImportBatch({ ...revalidated });
        setSmartImportCommitError('تعذر الاعتماد: أظهر الفحص المسبق وجود بيانات معلقة أو غير مطابقة مجدداً.');
        setIsCommittingImport(false);
        return;
      }

      // 5. Execute Commit via DriverTruckPipelineService.commitBatch ONLY
      const { batch: committedBatch, result } = await DriverTruckPipelineService.commitBatch(revalidated, pipelineCtx);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      // 6. Store result and batch without clearing
      setImportBatch({ ...committedBatch });
      setSmartImportCommitResult(result);
      transitionToRosterStage('COMMIT_RESULT');

    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      console.error('Commit execution error:', err);
      setSmartImportCommitError(err.message || 'حدث خطأ أثناء تنفيذ عملية الاعتماد');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsCommittingImport(false);
        setIsProcessing(false);
      }
    }
  };

  // C5 Smart Import: Final Review Blocker / Back Navigation Strategy (D14, D17)
  const handleFinalReviewBack = () => {
    if (!importBatch) {
      transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
      return;
    }

    const blockerType = classifyFinalReviewBlocker(importBatch);

    if (blockerType === 'CARRIER') {
      const confirmed = window.confirm(
        'تغيّر أو تعذر اعتماد بيانات الناقل بعد المراجعة النهائية. لأن بيانات السائقين والشاحنات مرتبطة بالناقل، يجب إعادة تحليل جلسة الاستيراد. هل تريد المتابعة؟'
      );
      if (confirmed) {
        handleResetRosterImport();
      }
      return;
    }

    if (blockerType === 'MATERIAL') {
      transitionToRosterStage('MATERIAL_RESOLUTION');
      return;
    }

    // DRIVER/TRUCK OWNED BLOCKER OR NORMAL BACK
    transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
  };

  // C2 Smart Import: Accept Carrier Candidate
  const handleSmartImportCarrierAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-CARRIER-RES-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'carrier',
        group.normalizedSourceKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: candidateEntityId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تطبيق قرار مطابقة الناقل');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C2 Smart Import: Select Alternate Carrier
  const handleSmartImportCarrierSelectAlternate = async (
    group: RosterEntityReviewGroup,
    carrierId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-CARRIER-ALT-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'carrier',
        group.normalizedSourceKey,
        'SELECT_ALTERNATE',
        { selectedEntityId: carrierId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تعيين الناقل البديل');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C2 Smart Import: Carrier Creation via Authoritative CarrierEditorModal
  const handleSmartImportCarrierCreated = async (result: CarrierCreationResult) => {
    if (isProcessing || !project || !importBatch || !smartImportPendingCarrierGroup) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      const snapshot = await projectCanonicalRefreshService.refresh(
        project.projectId,
        { expect: { carrierId: result.carrierId } }
      );
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      applyCanonicalSnapshot(snapshot);

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-CARRIER-CREATE-${Date.now()}`
      });

      const createdCarrier = snapshot.relationshipContext.knownCarriers?.find((c) => c.carrierId === result.carrierId);
      const resolutionPayload = {
        matchedId: result.carrierId,
        matchedName: createdCarrier?.name || smartImportPendingCarrierGroup.sourceValue,
        sourceValue: smartImportPendingCarrierGroup.sourceValue,
      };

      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'carrier',
        smartImportPendingCarrierGroup.normalizedSourceKey,
        resolutionPayload,
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...updated });
      setIsSmartImportCarrierModalOpen(false);
      setSmartImportPendingCarrierGroup(null);
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Accept Material Candidate
  const handleSmartImportMaterialAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-MATERIAL-RES-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'material',
        group.normalizedSourceKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: candidateEntityId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تطبيق قرار مطابقة المادة');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Select Alternate Material
  const handleSmartImportMaterialSelectAlternate = async (
    group: RosterEntityReviewGroup,
    materialId: string
  ) => {
    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-MATERIAL-ALT-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        'material',
        group.normalizedSourceKey,
        'SELECT_ALTERNATE',
        { selectedEntityId: materialId },
        pipelineCtx,
        authContext.userId
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;
      setImportBatch({ ...updated });
    } catch (err: any) {
      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(err.message || 'فشل تعيين المادة البديلة');
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Material Creation via Authoritative MaterialEditorModal
  const handleSmartImportMaterialCreated = async (result: MaterialCreationResult) => {
    if (isProcessing || !project || !importBatch || !smartImportPendingMaterialGroup) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      // 1. Refresh canonical project data expecting the created materialId
      const snapshot = await projectCanonicalRefreshService.refresh(
        project.projectId,
        { expect: { materialId: result.materialId } }
      );
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      // 2. Apply canonical snapshot to local wizard state
      applyCanonicalSnapshot(snapshot);

      // 3. Convert snapshot relationship context into pipeline context via adapter
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: snapshot.relationshipContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-MATERIAL-CREATE-${Date.now()}`
      });

      // 4. Construct resolution payload
      const createdMaterial = snapshot.relationshipContext.knownMaterials?.find((m) => m.materialId === result.materialId);
      const resolutionPayload = {
        matchedId: result.materialId,
        matchedName: createdMaterial?.name || smartImportPendingMaterialGroup.sourceValue,
        sourceValue: smartImportPendingMaterialGroup.sourceValue,
      };

      // 5. Apply grouped created material resolution to the SAME importBatch
      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        'material',
        smartImportPendingMaterialGroup.normalizedSourceKey,
        resolutionPayload,
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      // 6. Update local batch state in place
      setImportBatch({ ...updated });

      // 7. Close modal and clean up pending group
      setIsSmartImportMaterialModalOpen(false);
      setSmartImportPendingMaterialGroup(null);
    } finally {
      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleApplyResolutionDecision = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidateId?: string
  ) => {
    if (!importBatch || !project) return;
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (!relContext || !relContext.knownCarriers) {
        alert('عفواً، تعذر تحميل سياق العلاقات المصرح به للمشروع');
        return;
      }
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-RES-${Date.now()}`
      });
      const updated = DriverTruckPipelineService.applyEntityResolutionDecision(
        importBatch,
        rowNumber,
        entityTypeKey,
        decision,
        { selectedEntityId: candidateId },
        pipelineCtx,
        authContext.userId
      );
      setImportBatch({ ...updated });
    } catch (err: any) {
      alert(err.message || 'فشل تطبيق قرار المطابقة');
    }
  };

  const handleApplyGroupedResolutionDecision = async (
    entityTypeKey: ReviewGroupEntityType,
    normalizedSourceKey: string,
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidateId?: string
  ) => {
    if (!importBatch || !project) return;
    try {
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (!relContext || !relContext.knownCarriers) {
        alert('عفواً، تعذر تحميل سياق العلاقات المصرح به للمشروع');
        return;
      }
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-RES-${Date.now()}`
      });
      const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        importBatch,
        entityTypeKey,
        normalizedSourceKey,
        decision,
        { selectedEntityId: candidateId },
        pipelineCtx,
        authContext.userId
      );
      setImportBatch({ ...updated });
    } catch (err: any) {
      alert(err.message || 'فشل تطبيق قرار المطابقة الجماعي');
    }
  };

  const handleGroupedCreateMissingEntity = async (
    group: any
  ) => {
    if (!importBatch || !project) return;
    const { entityType, normalizedSourceKey, sourceValue } = group;
    try {
      // 1. Fetch & validate canonical relationship context FIRST before prompt or create
      const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      if (
        !relContext ||
        !Array.isArray(relContext.knownCarriers) ||
        !Array.isArray(relContext.knownMaterials) ||
        !Array.isArray(relContext.knownDrivers) ||
        !Array.isArray(relContext.knownTrucks)
      ) {
        alert('عفواً، تعذر تحميل سياق العلاقات المصرح به للمشروع');
        return;
      }

      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-CREATE-${Date.now()}`
      });

      let result: any;
      if (entityType === 'carrier') {
        const crNo = prompt('أدخل رقم السجل التجاري للناقل (إلزامي):');
        if (!crNo || !crNo.trim()) {
          alert('رقم السجل التجاري إلزامي لإنشاء الناقل');
          return;
        }
        result = await entityResolutionCommandService.createCarrier({
          projectId: project.projectId,
          sourceValue: sourceValue,
          carrierData: {
            nameAr: sourceValue,
            commercialRegistrationNo: crNo.trim(),
          },
        });
      } else if (entityType === 'material') {
        const matCode = prompt('أدخل رمز المادة (Code) (إلزامي):');
        if (!matCode || !matCode.trim()) {
          alert('رمز المادة إلزامي لإنشاء المادة');
          return;
        }
        result = await entityResolutionCommandService.createMaterial({
          projectId: project.projectId,
          sourceValue: sourceValue,
          materialData: {
            code: matCode.trim(),
            nameAr: sourceValue,
          },
        });
      } else if (entityType === 'driver') {
        const sampleRow = importBatch.rows.find((r: any) => group.rowNumbers?.includes(r.rowNumber));
        const carrierId = sampleRow?.resolvedValues?.carrierId || sampleRow?.entityResolutions?.carrier?.matchedId;
        if (!carrierId) {
          alert('يجب حسم الناقل أولاً قبل إنشاء السائق');
          return;
        }
        const residency = prompt('أدخل رقم الهوية الوطنية أو الإقامة للسائق (إلزامي):');
        if (!residency || !residency.trim()) {
          alert('رقم الهوية/الإقامة إلزامي لإنشاء السائق');
          return;
        }
        result = await entityResolutionCommandService.createDriver({
          projectId: project.projectId,
          sourceValue: sourceValue,
          driverData: {
            carrierId,
            driverName: sourceValue,
            residencyId: residency.trim(),
          },
        });
      } else if (entityType === 'truck') {
        const sampleRow = importBatch.rows.find((r: any) => group.rowNumbers?.includes(r.rowNumber));
        const carrierId = sampleRow?.resolvedValues?.carrierId || sampleRow?.entityResolutions?.carrier?.matchedId;
        if (!carrierId) {
          alert('يجب حسم الناقل أولاً قبل إنشاء الشاحنة');
          return;
        }
        const plate = prompt('أدخل رقم لوحة الشاحنة (إلزامي):');
        if (!plate || !plate.trim()) {
          alert('رقم اللوحة إلزامي لإنشاء الشاحنة');
          return;
        }
        result = await entityResolutionCommandService.createTruck({
          projectId: project.projectId,
          sourceValue: sourceValue,
          truckData: {
            carrierId,
            plateNumber: plate.trim().toUpperCase(),
          },
        });
      }

      if (!result || !result.matchedId) {
        alert('فشل إنشاء الكيان على الخادم');
        return;
      }

      const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
        importBatch,
        entityType,
        normalizedSourceKey,
        result,
        pipelineCtx
      );
      setImportBatch({ ...updated });
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الكيان المفقود للجماعة');
    }
  };

  const getSourceVal = (row: any, entityType: string) => {
    const res = row.entityResolutions?.[entityType];
    if (res?.sourceValue) return res.sourceValue;
    if (res?.originalValue) return res.originalValue;
    if (entityType === 'carrier') return row.canonical?.carrierName || row.mapped?.carrier || row.raw?.carrier || row.raw?.['الناقل'] || 'غير متوفر في المصدر';
    if (entityType === 'material') return row.canonical?.materialName || row.canonical?.materialCode || row.mapped?.materialType || row.mapped?.materialName || row.raw?.material || row.raw?.['المادة'] || 'غير متوفر في المصدر';
    if (entityType === 'driver') return row.canonical?.driverName || row.mapped?.driverName || row.raw?.driverName || row.raw?.['اسم السائق'] || 'غير متوفر في المصدر';
    if (entityType === 'truck') return row.canonical?.truckPlate || row.mapped?.truckNo || row.mapped?.truckPlate || row.raw?.plate || row.raw?.['رقم اللوحة'] || 'غير متوفر في المصدر';
    return 'غير متوفر في المصدر';
  };

  const getLocalizedEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'carrier': return 'الناقل';
      case 'material': return 'المادة';
      case 'driver': return 'السائق';
      case 'truck': return 'الشاحنة';
      default: return entityType;
    }
  };

  const reloadProjectCanonicalData = async () => {
    if (!project) return;
    try {
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      applyCanonicalSnapshot(snapshot);
    } catch (err) {
      console.warn('Failed reloading project canonical data:', err);
    }
  };

  const handleCreateMissingEntity = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material'
  ) => {
    if (!importBatch || !project) return;
    try {
      const row = importBatch.rows.find((r: any) => r.rowNumber === rowNumber);
      if (!row) return;

      const sourceVal = getSourceVal(row, entityTypeKey);
      if (!sourceVal || sourceVal === 'غير متوفر في المصدر') {
        alert('القيمة الأصلية من المصدر غير متوفرة لإنشاء الكيان');
        return;
      }

      let result: any;
      if (entityTypeKey === 'carrier') {
        const crNo = prompt('أدخل رقم السجل التجاري للناقل (إلزامي):');
        if (!crNo || !crNo.trim()) {
          alert('رقم السجل التجاري إلزامي لإنشاء الناقل');
          return;
        }
        result = await entityResolutionCommandService.createCarrier({
          projectId: project.projectId,
          sourceValue: sourceVal,
          carrierData: {
            nameAr: sourceVal,
            commercialRegistrationNo: crNo.trim(),
          },
        });
      } else if (entityTypeKey === 'material') {
        const matCode = prompt('أدخل رمز المادة (Code) (إلزامي):');
        if (!matCode || !matCode.trim()) {
          alert('رمز المادة إلزامي لإنشاء المادة');
          return;
        }
        result = await entityResolutionCommandService.createMaterial({
          projectId: project.projectId,
          sourceValue: sourceVal,
          materialData: {
            code: matCode.trim(),
            nameAr: sourceVal,
          },
        });
      } else if (entityTypeKey === 'driver') {
        const carrierId = row.resolvedValues?.carrierId || row.entityResolutions?.carrier?.matchedId;
        if (!carrierId) {
          alert('يجب حسم الناقل أولاً قبل إنشاء السائق');
          return;
        }
        const residency = prompt('أدخل رقم الهوية الوطنية أو الإقامة للسائق (إلزامي):');
        if (!residency || !residency.trim()) {
          alert('رقم الهوية/الإقامة إلزامي لإنشاء السائق');
          return;
        }
        result = await entityResolutionCommandService.createDriver({
          projectId: project.projectId,
          sourceValue: sourceVal,
          driverData: {
            carrierId,
            driverName: sourceVal,
            residencyId: residency.trim(),
          },
        });
      } else if (entityTypeKey === 'truck') {
        const carrierId = row.resolvedValues?.carrierId || row.entityResolutions?.carrier?.matchedId;
        if (!carrierId) {
          alert('يجب حسم الناقل أولاً قبل إنشاء الشاحنة');
          return;
        }
        const plate = prompt('أدخل رقم لوحة الشاحنة (إلزامي):');
        if (!plate || !plate.trim()) {
          alert('رقم اللوحة إلزامي لإنشاء الشاحنة');
          return;
        }
        result = await entityResolutionCommandService.createTruck({
          projectId: project.projectId,
          sourceValue: sourceVal,
          truckData: {
            carrierId,
            plateNumber: plate.trim().toUpperCase(),
          },
        });
      }

      let relContext = null;
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-CREATE-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyCreatedEntityResolution(
        importBatch,
        rowNumber,
        entityTypeKey,
        result,
        pipelineCtx
      );
      setImportBatch({ ...updated });
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الكيان المفقود');
    }
  };

  // Confirm and Commit the Import Roster Batch
  const handleCommitRosterImport = async () => {
    if (!project || !importBatch || !canPerformOperationalMutation('COMMIT_ROSTER_BATCH', project.status)) return;
    if ((importBatch.requiresReviewRows || 0) > 0 || importBatch.rows.some((r: any) => r.reviewStatus === 'requires_review' || r.reviewStatus === 'error')) {
      alert(isRTL ? 'لا يمكن اعتماد الاستيراد: توجد صفوف تتطلب مراجعة أو حل كيانات معلقة' : 'Cannot commit: import batch contains unresolved review rows');
      return;
    }
    setIsCommittingImport(true);

    try {
      let relContext = null;
      try {
        relContext = await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId);
      } catch (relErr) {
        console.warn('Could not load canonical relationship context for roster commit:', relErr);
      }

      const commitContext = ImportProjectContextAdapter.createPipelineContext({
        relContext,
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-${Date.now()}`
      });

      const { batch: committedBatch, result } = await DriverTruckPipelineService.commitBatch(importBatch, commitContext);

      if (result.success && result.failedRows === 0) {
        alert(isRTL ? `تم تأكيد واستيراد سجل التشغيل بنجاح (${result.committedRows} صفوف)` : `Successfully committed batch (${result.committedRows} rows)`);
        setImportBatch(null);
        await reloadProjectCanonicalData();
      } else {
        alert(isRTL ? `فشل جزئي أو كلي في اعتماد الاستيراد. تم اعتماد: ${result.committedRows}, فشل: ${result.failedRows}` : `Partial or failed commit. Committed: ${result.committedRows}, Failed: ${result.failedRows}`);
        setImportBatch({ ...committedBatch });
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في اعتماد واستيراد السجل');
    } finally {
      setIsCommittingImport(false);
    }
  };

  // Sync Roster from Project's Google Sheets (Non-destructive pending convergence message)
  const handleSyncRosterFromSheet = async () => {
    alert(isRTL 
      ? 'تكامل جداول بيانات جوجل (Google Sheets) لهذا المشروع قيد الإنجاز والتوافق' 
      : 'Google Sheets integration for this project workspace is pending convergence');
  };

  // Phase 3: Add Pricing Rule
  const handleAddPricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !canPerformOperationalMutation('CREATE_PRICING_RULE', project.status)) return;

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

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/projects/${project.projectId}/pricing-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطأ في إضافة تعرفة السعر');
      }
      setIsAddingPricing(false);
      setPriceRate(0);
      setPriceNotes('');
    } catch (err: any) {
      alert(err.message || 'خطأ في إضافة تعرفة السعر');
    }
  };

  // Phase 5: Transition Project Setup Status (Canonical governance rules)
  const handleTransitionStatus = async (nextStatus: ProjectEntity['status']) => {
    if (!project) return;
    setIsTransitioning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/projects/${project.projectId}/lifecycle-transition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetStatus: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطأ في ترقية حالة المشروع');
      }
      alert(`تمت ترقية حالة المشروع بنجاح إلى: ${nextStatus}`);
      await fetchServerReadiness(project.projectId);
    } catch (err: any) {
      alert(err.message || 'خطأ في ترقية حالة المشروع');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleActivateProject = async () => {
    if (!project) return;
    setIsActivating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/projects/${project.projectId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل التنشيط');
      }
      alert('تم تنشيط المشروع بنجاح');
      await fetchServerReadiness(project.projectId);
    } catch (error: any) {
      alert(`فشل التنشيط: ${error.message}`);
    } finally {
      setIsActivating(false);
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
                          onSelectProject?.(p.projectId);
                          setActiveSetupLayer('FOUNDATION');
                          setNavigationError(null);
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
                onClick={() => {
                  setEditingProjectId(null);
                  onSelectProject?.(null);
                }}
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
            {isCoreSetupLocked && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR}</span>
              </div>
            )}

            {/* Layer Selector Stack */}
            <div className="space-y-1.5">
              {PROJECT_SETUP_LAYERS.map((layer) => {
                const isActive = activeSetupLayer === layer.id;
                const Icon = LAYER_ICONS[layer.id];
                return (
                  <button
                    key={layer.id}
                    onClick={() => attemptProjectSetupLayerNavigation(layer.id)}
                    className={`w-full p-3 rounded-xl text-right flex items-center gap-3 transition-all ${
                      isActive 
                        ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                        : 'hover:bg-stone-850 text-stone-400 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-500'}`} />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black block">{layer.labelAr}</span>
                      <span className="text-[9px] text-stone-500 font-mono block">Layer {layer.ordinal} • {layer.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {navigationError && (
              <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-400 text-[10px] font-bold flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{navigationError}</span>
              </div>
            )}
          </div>

          {/* Staged Panel Content */}
          <div className="lg:col-span-9 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-6 min-h-[500px]">
            {/* Panel Phase Header */}
            <div className="border-b border-stone-800 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-600/15 text-amber-500 text-xs font-mono font-black rounded-lg flex items-center justify-center">
                    {PROJECT_SETUP_LAYERS.findIndex(l => l.id === activeSetupLayer) + 1}
                  </span>
                  <span>
                    {activeSetupLayer === 'FOUNDATION' && 'البيانات الأساسية وتكوين المشروع'}
                    {activeSetupLayer === 'WORKSPACE' && 'مساحة العمل ومزامنة قوقل'}
                    {activeSetupLayer === 'MATERIALS' && 'قائمة المواد المصرح بها'}
                    {activeSetupLayer === 'CARRIERS' && 'الناقلون المعتمدون'}
                    {activeSetupLayer === 'ROSTER' && 'سجل تشغيل السائقين والشاحنات'}
                    {activeSetupLayer === 'PRICING' && 'هيكل قواعد الأسعار والاتفاقيات المجدولة'}
                    {activeSetupLayer === 'ACCESS' && 'إدارة وتصاريح المستخدمين'}
                    {activeSetupLayer === 'REVIEW_ACTIVATION' && 'مراجعة المتطلبات والتفعيل'}
                  </span>
                </h2>
              </div>

              {isCoreSetupLocked && (
                <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded-xl font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مقفل</span>
                </span>
              )}
            </div>
            {/* ================= LAYER 1: FOUNDATION ================= */}
            {activeSetupLayer === 'FOUNDATION' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Project details card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <h3 className="font-black text-white text-[13px] border-b border-stone-800 pb-2">تفاصيل المشروع</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">اسم المشروع</label>
                      <input 
                        type="text" value={project.nameAr} disabled={isCoreSetupLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, { nameAr: e.target.value }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">العميل المستفيد</label>
                      <input 
                        type="text" value={project.clientName} disabled={isCoreSetupLocked}
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
                        type="text" value={project.location?.addressAr || ''} disabled={isCoreSetupLocked}
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
                        type="text" maxLength={15} value={project.settings?.zatcaTaxNumber || ''} disabled={isCoreSetupLocked}
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
                        type="date" value={project.startDate || ''} disabled={isCoreSetupLocked}
                        onChange={async (e) => {
                          await projectService.updateProject(project.projectId, { startDate: e.target.value }, authContext);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= LAYER 2: WORKSPACE ================= */}
            {activeSetupLayer === 'WORKSPACE' && project && (
              <div className="space-y-6 text-xs text-stone-300">
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
                      <span>{project.settings?.googleSpreadsheetId && project.settings?.googleDriveFolderId ? 'تحديث مزامنة Google Workspace' : 'تهيئة ومزامنة Google Workspace'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= LAYER 3: MATERIALS ================= */}
            {activeSetupLayer === 'MATERIALS' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Materials list management card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">قائمة المواد المصرح بها</h3>
                    {isOperationallyMutable && (
                      <button
                        onClick={() => setIsAddingMaterial(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مادة جديدة</span>
                      </button>
                    )}
                  </div>

                  {/* Reusable Material Creation Modal */}
                  <MaterialEditorModal
                    open={isAddingMaterial}
                    projectId={project.projectId}
                    onClose={() => setIsAddingMaterial(false)}
                    onCreated={async (result) => {
                      const snapshot = await projectCanonicalRefreshService.refresh(
                        project.projectId,
                        { expect: { materialId: result.materialId } }
                      );
                      applyCanonicalSnapshot(snapshot);
                    }}
                  />

                  {/* Smart Import Dedicated Material Creation Modal */}
                  {project && isSmartImportMaterialModalOpen && (
                    <MaterialEditorModal
                      open={isSmartImportMaterialModalOpen}
                      mode="CREATE"
                      projectId={project.projectId}
                      zIndexClass="z-60"
                      initialName={smartImportPendingMaterialGroup ? smartImportPendingMaterialGroup.sourceValue : ''}
                      onClose={() => {
                        setIsSmartImportMaterialModalOpen(false);
                        setSmartImportPendingMaterialGroup(null);
                      }}
                      onCreated={handleSmartImportMaterialCreated}
                    />
                  )}

                  {editingMaterial && (
                    <MaterialEditorModal
                      open={!!editingMaterial}
                      mode="EDIT"
                      projectId={project.projectId}
                      initialMaterial={{
                        materialId: editingMaterial.materialId,
                        name: editingMaterial.nameAr || (editingMaterial as any).name || '',
                        code: editingMaterial.code || '',
                        unitOfMeasure: editingMaterial.unitOfMeasure,
                        standardDensityTonPerM3: editingMaterial.standardDensityTonPerM3,
                      }}
                      onClose={() => setEditingMaterial(null)}
                      onUpdated={async (result) => {
                        const snapshot = await projectCanonicalRefreshService.refresh(
                          project.projectId,
                          {
                            expect: {
                              materialProfile: {
                                materialId: result.materialId,
                                name: result.material.name,
                                code: result.material.code,
                                unitOfMeasure: result.material.unitOfMeasure,
                                standardDensityTonPerM3: result.material.standardDensityTonPerM3,
                              },
                            },
                          }
                        );
                        applyCanonicalSnapshot(snapshot);
                        setEditingMaterial(null);
                      }}
                    />
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
                            <th className="pb-2 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m) => (
                            <tr key={m.materialId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{m.materialId}</td>
                              <td className="py-2.5">{m.nameAr || (m as any).name}</td>
                              <td className="py-2.5 font-mono">{m.code}</td>
                              <td className="py-2.5">{m.unitOfMeasure}</td>
                              <td className="py-2.5 font-mono">{m.standardDensityTonPerM3 || 1.6} طن/م³</td>
                              <td className="py-2.5 text-center">
                                {isOperationallyMutable && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingMaterial(m)}
                                    className="p-1 px-2 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                                    title="تعديل بيانات المادة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>
                                )}
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

            {/* ================= LAYER 4: CARRIERS ================= */}
            {activeSetupLayer === 'CARRIERS' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Carriers checklist */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">الناقلون المعتمدون بالمشروع</h3>
                    {isOperationallyMutable && (
                      <button
                        onClick={() => setIsCarrierEditorOpen(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة ناقل جديد</span>
                      </button>
                    )}
                  </div>

                  <CarrierEditorModal
                    open={isCarrierEditorOpen}
                    mode="CREATE"
                    projectId={project.projectId}
                    onClose={() => setIsCarrierEditorOpen(false)}
                    onCreated={async (result) => {
                      const snapshot = await projectCanonicalRefreshService.refresh(
                        project.projectId,
                        { expect: { carrierId: result.carrierId } }
                      );
                      applyCanonicalSnapshot(snapshot);
                      setIsCarrierEditorOpen(false);
                    }}
                  />

                  {/* Smart Import Dedicated Carrier Creation Modal */}
                  {project && isSmartImportCarrierModalOpen && (
                    <CarrierEditorModal
                      open={isSmartImportCarrierModalOpen}
                      mode="CREATE"
                      projectId={project.projectId}
                      zIndexClass="z-60"
                      initialName={smartImportPendingCarrierGroup ? smartImportPendingCarrierGroup.sourceValue : ''}
                      onClose={() => {
                        setIsSmartImportCarrierModalOpen(false);
                        setSmartImportPendingCarrierGroup(null);
                      }}
                      onCreated={handleSmartImportCarrierCreated}
                    />
                  )}

                  {/* Smart Import Dedicated Material Creation Modal (D02: Reachable in Phase 2) */}
                  {project && isSmartImportMaterialModalOpen && (
                    <MaterialEditorModal
                      open={isSmartImportMaterialModalOpen}
                      mode="CREATE"
                      projectId={project.projectId}
                      zIndexClass="z-60"
                      initialName={smartImportPendingMaterialGroup ? smartImportPendingMaterialGroup.sourceValue : ''}
                      onClose={() => {
                        setIsSmartImportMaterialModalOpen(false);
                        setSmartImportPendingMaterialGroup(null);
                      }}
                      onCreated={handleSmartImportMaterialCreated}
                    />
                  )}

                  {editingCarrier && (
                    <CarrierEditorModal
                      open={!!editingCarrier}
                      mode="EDIT"
                      projectId={project.projectId}
                      initialCarrier={editingCarrier}
                      onClose={() => setEditingCarrier(null)}
                      onUpdated={async (result) => {
                        const snapshot = await projectCanonicalRefreshService.refresh(
                          project.projectId,
                          {
                            expect: {
                              carrierId: result.carrierId,
                              carrierProfile: {
                                carrierId: result.carrierId,
                                name: result.carrier.name,
                                transportLicenseNo: result.carrier.transportLicenseNo,
                                contactPersonName: result.carrier.contactPerson?.name || null,
                                contactPhone: result.carrier.contactPerson?.phone || null,
                                contactEmail: result.carrier.contactPerson?.email || null,
                              },
                            },
                          }
                        );
                        applyCanonicalSnapshot(snapshot);
                        setEditingCarrier(null);
                      }}
                    />
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
                            <th className="pb-2 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carriers.map((c) => (
                            <tr key={c.carrierId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{c.carrierId}</td>
                              <td className="py-2.5">{c.name}</td>
                              <td className="py-2.5 font-mono">{c.commercialRegistrationNo}</td>
                              <td className="py-2.5 font-mono">{c.transportLicenseNo || '—'}</td>
                              <td className="py-2.5 truncate font-mono">{c.contactPerson?.email || '—'}</td>
                              <td className="py-2.5 text-center">
                                {isOperationallyMutable && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCarrier(c)}
                                    className="p-1 px-2 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>
                                )}
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

            {/* ================= LAYER 5: OPERATIONAL ROSTER ================= */}
            {activeSetupLayer === 'ROSTER' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Unified Import Pipeline Roster section */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-800 pb-2 gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-white text-[13px]">سجل تشغيل السائقين والشاحنات الموحد (Roster)</h3>
                      <p className="text-[10px] text-stone-500">مزامنة وترخيص السائقين والشاحنات للمشروع لمنع التكرار والحفظ الإقصائي</p>
                    </div>

                    {isOperationallyMutable && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => setIsAddingRosterRow(true)}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-stone-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة يدوية</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsSmartImportOpen(true);
                            transitionToRosterStage('SOURCE_DISCOVERY');
                          }}
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

            {/* ================= LAYER 6: PRICING ================= */}
            {activeSetupLayer === 'PRICING' && project && (
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

                    {isOperationallyMutable && (
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

            {/* ================= LAYER 7: ACCESS ================= */}
            {activeSetupLayer === 'ACCESS' && project && (
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

            {/* ================= LAYER 8: REVIEW_ACTIVATION ================= */}
            {activeSetupLayer === 'REVIEW_ACTIVATION' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* 1. Canonical Server Operational Readiness Authority */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <div>
                        <h3 className="font-black text-white text-[13px]">
                          الجاهزية التشغيلية الميدانية المعتمدة (مرجعية الخادم)
                        </h3>
                        <p className="text-[11px] text-stone-400">
                          تقييم الربط التشغيلي الفعلي (المواد، الناقلين، السائقين، الشاحنات، والتعرفات السارية)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchServerReadiness(project.projectId)}
                      disabled={isLoadingReadiness}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-750 text-stone-300 rounded-lg flex items-center gap-1.5 transition-all text-[11px] disabled:opacity-50"
                      title="إعادة فحص الجاهزية التشغيلية"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReadiness ? 'animate-spin text-amber-500' : 'text-stone-400'}`} />
                      <span>{isLoadingReadiness ? 'جاري الفحص...' : 'تحديث الفحص'}</span>
                    </button>
                  </div>

                  {isLoadingReadiness ? (
                    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl text-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                      <p className="text-stone-400">جاري تقييم الجاهزية التشغيلية من الخادم بشكل موثق...</p>
                    </div>
                  ) : readinessError ? (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center gap-3 text-rose-300">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold block">تعذر تقييم الجاهزية التشغيلية</span>
                        <span className="text-[11px] opacity-80">{readinessError}</span>
                      </div>
                    </div>
                  ) : serverReadiness ? (
                    <div className="space-y-4">
                      {serverReadiness.ready ? (
                        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-3">
                          <div className="flex items-center gap-2.5 text-emerald-400 font-black text-xs">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span>المشروع مستوفٍ لجميع متطلبات الجاهزية التشغيلية وجاهز للتفعيل</span>
                          </div>
                          <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                            تم التحقق السيرفري بنجاح: تم العثور على مسار تشغيلي متكامل ومترابط (عضوية سائق نشطة ↔ تعيين شاحنة ↔ تبعية ناقل متطابقة ↔ تخصيص مادة ↔ تعرفة سعر سارية).
                          </p>
                          {serverReadiness.candidatePath && (
                            <div className="bg-stone-950/80 border border-emerald-900/60 p-3 rounded-lg flex flex-wrap gap-4 text-[10px] font-mono text-stone-300">
                              <div><span className="text-stone-500">سائق: </span>{serverReadiness.candidatePath.driverId}</div>
                              <div><span className="text-stone-500">شاحنة: </span>{serverReadiness.candidatePath.truckId}</div>
                              <div><span className="text-stone-500">ناقل: </span>{serverReadiness.candidatePath.carrierId}</div>
                              <div><span className="text-stone-500">مادة: </span>{serverReadiness.candidatePath.materialId}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-rose-950/30 border border-rose-800/70 rounded-xl space-y-3">
                          <div className="flex items-center gap-2.5 text-rose-400 font-black text-xs">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>المشروع غير جاهز للتشغيل الميداني الفعلي ({serverReadiness.blockers.length} عوائق)</span>
                          </div>
                          <div className="space-y-2 pt-1">
                            {serverReadiness.blockers.map((b, idx) => (
                              <div key={idx} className="flex items-start gap-2 bg-stone-950/70 border border-rose-900/40 p-2.5 rounded-lg text-rose-200 text-[11px]">
                                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-semibold block">{b.message}</span>
                                  <span className="text-[10px] font-mono text-stone-500 block">رمز العائق: {b.code}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-400 text-center">
                      اضغط على تحديث الفحص لجلب تقرير الجاهزية التشغيلية من الخادم.
                    </div>
                  )}
                </div>

                {/* 2. Informational Setup Progress Checklist */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">مؤشرات اكتمال الإعداد والتأسيس (معلوماتية)</h3>
                    <p className="text-[11px] text-stone-500">متابعة إدخال البيانات المبدئية ومزامنة المستندات</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {setupChecklist.map((item) => (
                      <div key={item.id} className="p-3 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between">
                        <span className="text-stone-300 font-semibold text-[11px]">{item.text}</span>
                        {item.isDone ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold flex items-center gap-1 text-[10px]">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>مستوفى</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-stone-850 text-stone-400 border border-stone-750 font-bold flex items-center gap-1 text-[10px]">
                            <X className="w-3 h-3 text-stone-500" />
                            <span>غير مكتمل</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Governance and Lifecycle Controller */}
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
                      يتطلب تحويل المشروع إلى الحالة <span className="font-bold text-white">ACTIVE</span> استيفاء الجاهزية التشغيلية السيرفرية واعتماد الحوكمة (APPROVED). بتفعيل المشروع، يتم قفل التهيئات ويصبح جاهزاً للتشغيل الفعلي.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {(project.status as any) === 'SETUP' && (
                        <button
                          onClick={() => handleTransitionStatus('READY_FOR_REVIEW' as any)}
                          disabled={isTransitioning}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50"
                        >
                          {isTransitioning ? 'جاري التقديم...' : 'تقديم طلب مراجعة واعتماد الإعدادات'}
                        </button>
                      )}

                      {(project.status as any) === 'READY_FOR_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleTransitionStatus('SETUP' as any)}
                            disabled={isTransitioning}
                            className="px-4 py-2 bg-rose-900/50 border border-rose-800 text-rose-300 font-black rounded-xl transition-all disabled:opacity-50"
                          >
                            رفض للتعديل
                          </button>
                          <button
                            onClick={() => handleTransitionStatus('APPROVED' as any)}
                            disabled={isTransitioning}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
                          >
                            {isTransitioning ? 'جاري الاعتماد...' : 'اعتماد وتصديق جاهزية التهيئة'}
                          </button>
                        </>
                      )}

                      {(project.status as any) === 'APPROVED' && (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={handleActivateProject}
                            disabled={!serverReadiness?.ready || isActivating || isLoadingReadiness}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>{isActivating ? 'جاري التنشيط...' : 'تفعيل المشروع وبدء العمليات الميدانية'}</span>
                          </button>
                          {!serverReadiness?.ready && (
                            <span className="text-[10px] text-rose-400 font-semibold">
                              * زر التفعيل مقفل: يتطلب استيفاء الجاهزية التشغيلية السيرفرية أولاً
                            </span>
                          )}
                        </div>
                      )}

                      {(project.status as any) === 'ACTIVE' && (
                        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl text-emerald-400 font-black flex flex-col items-center gap-3">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                          <div className="space-y-1">
                            <span className="text-xs block">المشروع نشط للتشغيل الميداني الفعلي</span>
                            <span className="text-[10px] text-stone-500 font-mono block">جميع متطلبات التأسيس والجاهزية تم قفلها بنجاح</span>
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

      {/* Root Layered Smart Import Workflow Host */}
      {isSmartImportOpen && project && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex flex-col justify-center p-4 md:p-8 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-5xl w-full mx-auto my-auto shadow-2xl p-6 space-y-6 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header & 7-Stage Orientation Stepper */}
            <div className="space-y-4 shrink-0">
              <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-black text-white text-base">استيراد سجل التشغيل الذكي (Smart Roster Import)</h3>
                    <p className="text-[10px] text-stone-400 font-bold">مسار الاستيراد الذكي التراكمي (Smart Import Workflow)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleResetRosterImport();
                    setIsSmartImportOpen(false);
                  }}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* C1 Layered Smart Import Stage Indicator Stepper (Orientation & Progress Indicator) */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-stone-800">
                {ROSTER_STAGE_DEFINITIONS.map((def, idx) => {
                  const isCurrent = rosterImportStage === def.stage;
                  return (
                    <div
                      key={def.stage}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-stone-950/60 text-stone-500 border border-stone-850'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        isCurrent ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{def.labelAr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Body - Exactly one stage active */}
            <div className="flex-1 overflow-y-auto pr-1">
              {/* STAGE 1: SOURCE_DISCOVERY */}
              {rosterImportStage === 'SOURCE_DISCOVERY' && (
                <div className="space-y-6 py-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                      isDragOver
                        ? 'border-amber-500 bg-amber-950/20'
                        : 'border-stone-750 hover:border-amber-500/50 bg-stone-950/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-200 text-sm">اسحب وأفلت ملف إكسل أو CSV هنا</h4>
                      <p className="text-stone-500 text-xs">يدعم ملفات .xlsx, .xls, .csv الخاصة بسجلات السائقين والشاحنات</p>
                    </div>
                    <button
                      type="button"
                      disabled={isDiscoveringRoster || isImportingFile}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isDiscoveringRoster ? 'جاري الاستكشاف...' : 'اختر ملفاً من جهازك'}</span>
                    </button>
                  </div>

                  {isDiscoveringRoster && (
                    <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-stone-300 text-xs font-semibold">جاري استكشاف وقراءة أعمدة الملف وتحليل الحقول...</p>
                    </div>
                  )}

                  {rosterDiscoveryError && (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>{rosterDiscoveryError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 2: MAPPING_APPROVAL */}
              {rosterImportStage === 'MAPPING_APPROVAL' && rosterDiscoveryResult && (
                <div className="space-y-6">
                  {/* Sheet selection & Header row selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs">
                    {rosterDiscoveryResult.availableSheets && rosterDiscoveryResult.availableSheets.length > 1 && (
                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold block">ورقة العمل (Sheet)</label>
                        <select
                          value={rosterSelectedSheet}
                          onChange={(e) => handleRosterSheetChange(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-bold"
                        >
                          {rosterDiscoveryResult.availableSheets.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-stone-400 font-bold block">رقم صف العناوين (Header Row Index)</label>
                      <input
                        type="number"
                        min={0}
                        value={rosterHeaderRowIndex}
                        onChange={(e) => handleRosterHeaderRowIndexChange(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Column mapping table */}
                  <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-stone-800 flex justify-between items-center">
                      <span className="font-bold text-stone-300 text-xs">ربط أعمدة الملف بالحقول المعيارية</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {Object.keys(rosterCustomMappings).length} أعمدة مكتشفة
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-stone-900/80 sticky top-0 border-b border-stone-800 text-stone-400 font-bold">
                          <tr>
                            <th className="p-2.5">اسم العمود في الملف</th>
                            <th className="p-2.5">الحقل المعياري المطابق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850">
                          {(rosterDiscoveryResult.detectedHeaders || []).map((header) => (
                            <tr key={header} className="hover:bg-stone-900/40">
                              <td className="p-2.5 font-semibold text-stone-200">{header}</td>
                              <td className="p-2.5">
                                <select
                                  value={rosterCustomMappings[header] || 'unmapped'}
                                  onChange={(e) => handleRosterMappingChange(header, e.target.value as any)}
                                  className="w-full bg-stone-900 border border-stone-800 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-hidden"
                                >
                                  {ROSTER_CANONICAL_FIELD_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.labelAr} ({opt.value})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {importError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {/* Mapping Approval Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={handleResetRosterImport}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold"
                    >
                      إلغاء وإعادة تعيين
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveRosterMappingAndStartPipeline}
                      disabled={isProcessing || isImportingFile}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري التحليل واستخراج البيانات...</span>
                        </>
                      ) : (
                        <>
                          <span>اعتماد الربط وبدء تحليل سجل التشغيل</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 3: CARRIER_RESOLUTION */}
              {importBatch && rosterImportStage === 'CARRIER_RESOLUTION' && (
                <div>
                  {/* C2: True Carrier-Only Resolution Layer */}
                  {/* Only Carrier review groups are resolved here before future layers. */}
                  <RosterCarrierResolutionLayer
                    importBatch={importBatch}
                    projectCarriers={carriers}
                    onAcceptCandidate={handleSmartImportCarrierAcceptCandidate}
                    onSelectAlternate={handleSmartImportCarrierSelectAlternate}
                    onCreateCarrier={(group) => {
                      setSmartImportPendingCarrierGroup(group);
                      setIsSmartImportCarrierModalOpen(true);
                    }}
                    onContinueToMaterials={handleSmartImportContinueToMaterials}
                    onCancelImport={handleResetRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 4: MATERIAL_RESOLUTION */}
              {importBatch && rosterImportStage === 'MATERIAL_RESOLUTION' && (
                <div>
                  <RosterMaterialResolutionLayer
                    importBatch={importBatch}
                    projectMaterials={materials}
                    onAcceptCandidate={handleSmartImportMaterialAcceptCandidate}
                    onSelectAlternate={handleSmartImportMaterialSelectAlternate}
                    onCreateMaterial={(group) => {
                      setSmartImportPendingMaterialGroup(group);
                      setIsSmartImportMaterialModalOpen(true);
                    }}
                    onContinueToDriverTruck={handleSmartImportContinueToDriverTruck}
                    onCancelImport={handleResetRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 5: DRIVER_TRUCK_RESOLUTION */}
              {importBatch && rosterImportStage === 'DRIVER_TRUCK_RESOLUTION' && (
                <div>
                  <RosterDriverTruckResolutionLayer
                    importBatch={importBatch}
                    projectDrivers={projectRelationshipContext?.knownDrivers || []}
                    projectTrucks={projectRelationshipContext?.knownTrucks || []}
                    onAcceptCandidate={handleSmartImportDriverTruckAcceptCandidate}
                    onSelectAlternate={handleSmartImportDriverTruckSelectAlternate}
                    onCreateDriver={handleSmartImportDriverCreate}
                    onCreateTruck={handleSmartImportTruckCreate}
                    driverConvergenceError={driverConvergenceError}
                    truckConvergenceError={truckConvergenceError}
                    onRetryDriverConvergence={handleRetryDriverConvergence}
                    onRetryTruckConvergence={handleRetryTruckConvergence}
                    onContinueToFinalReview={handleSmartImportContinueToFinalReview}
                    onCancelImport={handleResetRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 6: FINAL_REVIEW */}
              {importBatch && rosterImportStage === 'FINAL_REVIEW' && (
                <div>
                  <RosterFinalReviewLayer
                    importBatch={importBatch}
                    onCommit={handleSmartImportCommit}
                    isCommitting={isCommittingImport}
                    commitError={smartImportCommitError}
                    onClose={handleFinalReviewBack}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 7: COMMIT_RESULT */}
              {importBatch && rosterImportStage === 'COMMIT_RESULT' && (
                <div>
                  <RosterCommitResultLayer
                    importBatch={importBatch}
                    commitResult={smartImportCommitResult!}
                    onFinish={() => {
                      handleResetRosterImport();
                      setIsSmartImportOpen(false);
                    }}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
