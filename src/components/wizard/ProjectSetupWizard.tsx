import { ContextualCanonicalCreation } from '../import/ContextualCanonicalCreation';
import { ContextualPrerequisiteReceipts } from '../../services/import/contextualCanonicalCreation.service';
import { RosterSemanticReview, intentIssueKey } from '../import/RosterSemanticReview';
import { buildRosterCanonicalIntent, attachReviewedRosterIntent } from '../../services/import/rosterCanonicalIntent.service';
import type { GlobalKind } from '../../utils/globalIdentityPolicy';
import { resolutionErrorKey } from '../../i18n/importResolution';
import { validateRosterFile, RosterSourceError, rosterErrorKey } from '../../services/import/rosterSourceContract';
import { SetupReadinessPanel } from './SetupReadinessPanel';
import { isEvaluatedReadiness, type EvaluatedReadinessView } from '../../i18n/readinessPresentation';
import { FleetSetupWorkspace } from './FleetSetupWorkspace';
import { SetupMutationSession, setupCommand, postSetupJson } from '../../services/setupOrchestration.service';
import { setupErrorKey } from '../../i18n/setupErrors';
import { ProjectContextLifetime, type ProjectContextToken } from '../../utils/projectContextLifetime';
import { ProjectAccessView } from './ProjectAccessView';
import { presentBatch4Message } from '../../i18n/batch4Messages';
import { batch4FieldLabel, batch4LayerLabel, batch4RosterStageLabel } from '../../i18n/batch4Presentation';
import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
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
  translateDiscoveryToRosterTarget,
  validateRosterMapping
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
import { importSessionClientService, ImportSessionVersionConflictError } from '../../services/importSessionClient.service';
import { 
  SafeDiscoveryMetadata, 
  ImportSessionLifecycleState,
  LIFECYCLE_TO_ROSTER_STAGE_MAP,
  ROSTER_STAGE_TO_LIFECYCLE_MAP,
  UpdateImportSessionPayload
} from '../../types/importSession';
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

const PROJECT_STATUS_KEYS: Record<ProjectEntity['status'], string> = {
  SETUP: 'setup.closure.status.SETUP', READY_FOR_REVIEW: 'setup.closure.status.READY_FOR_REVIEW',
  APPROVED: 'analytics.column.approved', ACTIVE: 'setup.status.ACTIVE', SUSPENDED: 'setup.status.SUSPENDED',
  ARCHIVED: 'setup.closure.status.ARCHIVED', PLANNING: 'setup.closure.status.PLANNING', DRAFT: 'operations.draft',
};

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

export interface ServerReadinessDTO extends EvaluatedReadinessView {
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
  isCurrent?: () => boolean;
}

export async function executeProjectWorkspaceSyncOrchestration(
  params: ProjectWorkspaceSyncParams
): Promise<void> {
  const {
    project,
    isSyncingGoogle,
    setIsSyncingGoogle: updateBusy,
    setSyncNotice: updateNotice,
    isCurrent = () => true,
    workspaceService = clientWorkspaceService,
  } = params;

  const setIsSyncingGoogle = (value: boolean) => { if (isCurrent()) updateBusy(value); };
  const setSyncNotice = (notice: { type: 'success' | 'error'; text: string } | null) => { if (isCurrent()) updateNotice(notice); };
  if (!project || isSyncingGoogle || !isCurrent()) return;

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
  // Keep presentation current without changing canonical-read callback identities or effects.
  const presentationTranslator = useRef(t);
  presentationTranslator.current = t;
  const [editingProjectId, updateEditingProjectId] = useState<string | null>(null);
  const projectContext = useRef(new ProjectContextLifetime()).current;
  const renderedContext = projectContext.capture();
  const projectScopeKey = JSON.stringify([authContext.userId, authContext.role, [...new Set(authContext.assignedProjectIds || [])].sort()]);
  const setEditingProjectId = (id: string | null) => {
    projectContext.enter(id, projectScopeKey);
    updateEditingProjectId(id || null);
  };
  useLayoutEffect(() => {
    projectContext.enter(editingProjectId, projectScopeKey);
  }, [editingProjectId, projectScopeKey, projectContext]);
  useLayoutEffect(() => () => projectContext.dispose(), [projectContext]);

  // Unit 3A.2: Project Data Freshness, Race-Safe Loading & Authoritative Snapshot
  const bridgeContextRef = useRef<ProjectContextToken | null>(null);
  const bridgeOriginRef = useRef<'CREATION' | 'FOUNDATION'>('CREATION');
  const currentProjectsRef = useRef(globalProjects);
  currentProjectsRef.current = globalProjects;
  const canonicalProjectsSeen = useRef(new Set<string>());
  globalProjects.forEach(item => canonicalProjectsSeen.current.add(item.projectId));
  const [isProjectDataLoading, setIsProjectDataLoading] = useState<boolean>(false);
  const [projectDataLoadError, setProjectDataLoadError] = useState<string | null>(null);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [localProjectOverride, setLocalProjectOverride] = useState<ProjectEntity | null>(null);

  // Active Project Sub-collection States
  const [activeSetupLayer, setActiveSetupLayer] = useState<ProjectSetupLayer>('FOUNDATION');
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialEntity[]>([]);
  const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleEntity[]>([]);
  const [fleetRows, setFleetRows] = useState<any[]>([]);
  const [canonicalRevision, setCanonicalRevision] = useState(0);
  const manualSession = useMemo(() => new SetupMutationSession(), [editingProjectId, projectScopeKey]);
  const manualLock = useRef(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualPreview, setManualPreview] = useState<any>(null);
  const [manualConfirmed, setManualConfirmed] = useState(false);

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

  // Invalidate external selection changes before passive loads/completions.
  useLayoutEffect(() => {
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
    const t = (key: string, params?: Record<string, string | number>) => presentationTranslator.current(key, params);
    // Unit 3A.2: Block data-dependent layers while project data is loading or project ID not yet loaded
    if (editingProjectId && (isProjectDataLoading || loadedProjectId !== editingProjectId)) {
      if (['ROSTER', 'PRICING', 'REVIEW_ACTIVATION'].includes(targetLayer)) {
        setNavigationError(t('projects.messages.canonical_data_loading'));
        return;
      }
    }

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
      setNavigationError(gate.reason || t('projects.batch4.navigation_failed'));
    }
  }, [editingProjectId, isProjectDataLoading, loadedProjectId, materials.length, carriers.length]);

  
  // Dashboard view search & filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Project Creation State
  const [isCreatingNew, updateCreatingNew] = useState(false);
  const creatingRef = useRef(false);
  const setIsCreatingNew = (value: boolean) => {
    if (creatingRef.current !== value) projectContext.invalidate();
    creatingRef.current = value;
    updateCreatingNew(value);
    setIsSubmittingCreation(false);
    setCreationError(null);
  };
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

  // Unit 3A.1 Persistent Import Session & Checkpoint State
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [importSessionVersion, setImportSessionVersion] = useState<number>(1);
  const [importSessionOperationId, setImportSessionOperationId] = useState<string | null>(null);
  const [importSessionRecoveryError, setImportSessionRecoveryError] = useState<string | null>(null);
  const [isRestoringImportSession, setIsRestoringImportSession] = useState<boolean>(false);
  const importSessionVersionRef = useRef<number>(1);
  importSessionVersionRef.current = importSessionVersion;

  // DT-01 Roster Smart Import Discovery & Mapping Approval State
  const [rosterSelectedFile, setRosterSelectedFile] = useState<File | null>(null);
  const [rosterBuffer, setRosterBuffer] = useState<ArrayBuffer | null>(null);
  const [rosterDiscoveryResult, setRosterDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [rosterSelectedSheet, setRosterSelectedSheet] = useState<string>('');
  const [rosterHeaderRowIndex, setRosterHeaderRowIndex] = useState<number>(0);
  const [rosterCustomMappings, setRosterCustomMappings] = useState<Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'>>({});
  const [isRosterMappingApproved, setIsRosterMappingApproved] = useState<boolean>(false);
  const rosterMappingIssue = validateRosterMapping(rosterDiscoveryResult?.detectedHeaders || [], rosterCustomMappings);
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
        const msg = err.message || t('projects.batch4.stage_navigation_failed', { stage: targetStage });
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

  // Active project lookup helper with temporary local bridge override
  const project = useMemo(() => {
    if (!editingProjectId) return null;
    const fromGlobal = globalProjects.find(p => p.projectId === editingProjectId);
    if (bridgeOriginRef.current === 'CREATION') {
      if (fromGlobal) return fromGlobal;
    }
    // This bridge contains only a successful canonical read/command result, never a draft merge.
    if (localProjectOverride && localProjectOverride.projectId === editingProjectId && bridgeContextRef.current && projectContext.isCurrent(bridgeContextRef.current, editingProjectId)) {
      return localProjectOverride;
    }
    return fromGlobal || null;
  }, [globalProjects, editingProjectId, localProjectOverride]);

  const setCurrentProjectOverride = (value: ProjectEntity, token: ProjectContextToken, origin: 'CREATION' | 'FOUNDATION' = 'CREATION') => {
    if (!projectContext.isCurrent(token, value.projectId)) return;
    bridgeContextRef.current = token;
    bridgeOriginRef.current = origin;
    setLocalProjectOverride(value);
  };

  // Convergence rule: Clear temporary local override once canonical project arrives in globalProjects
  useEffect(() => {
    if (!editingProjectId || !localProjectOverride) return;

    const canonicalExists = globalProjects.some(p => p.projectId === editingProjectId);
    const canonical = globalProjects.find(p => p.projectId === editingProjectId);
    if (!canonicalExists || !canonical) return;
    const stamp = (value: any): number => {
      const date = value?.toDate ? value.toDate() : new Date(value);
      return Number.isFinite(date?.getTime()) ? date.getTime() : 0;
    };
    const stable = (value: any): any => value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
    if (localProjectOverride.projectId === editingProjectId &&
      (bridgeOriginRef.current === 'CREATION' || stamp(canonical.updatedAt) > stamp(localProjectOverride.updatedAt) || JSON.stringify(stable(canonical)) === JSON.stringify(stable(localProjectOverride)))) {
      bridgeContextRef.current = null;
      setLocalProjectOverride(null);
    }
  }, [editingProjectId, globalProjects, localProjectOverride]);

  // Core foundation setup lock for Active Projects (primary identifiers & metadata)
  const isCoreSetupLocked = useMemo(() => {
    return project?.status === 'ACTIVE';
  }, [project]);

  // Operational Mutability check (Active projects allow operational additions/mutations under governance)
  const isOperationallyMutable = useMemo(() => {
    return isProjectOperationallyMutable(project?.status);
  }, [project]);

  // Unit 2 — Foundation Edit / Save / Cancel Boundary State
  const [isEditingFoundation, setIsEditingFoundation] = useState<boolean>(false);
  const [foundationDraft, setFoundationDraft] = useState<{
    nameAr: string;
    clientName: string;
    addressAr: string;
    zatcaTaxNumber: string;
    startDate: string;
  } | null>(null);
  const [foundationSaveError, setFoundationSaveError] = useState<string | null>(null);
  const [foundationSaveSuccess, setFoundationSaveSuccess] = useState<string | null>(null);
  const [isSavingFoundation, setIsSavingFoundation] = useState<boolean>(false);
  const foundationReceipt = useRef<ProjectContextToken | null>(null);
  const [foundationNeedsRefresh, setFoundationNeedsRefresh] = useState(false);

  // Reset foundation edit state before a changed project can paint.
  useLayoutEffect(() => {
    foundationReceipt.current = null; setFoundationNeedsRefresh(false);
    setIsEditingFoundation(false);
    setFoundationDraft(null);
    setFoundationSaveError(null);
    setFoundationSaveSuccess(null);
    if (localProjectOverride && localProjectOverride.projectId !== editingProjectId) {
      setLocalProjectOverride(null);
    }
  }, [editingProjectId, projectScopeKey]);

  useLayoutEffect(() => {
    creatingRef.current = false;
    updateCreatingNew(false);
    setMaterials([]); setCarriers([]); setPricingRules([]); setFleetRows([]);
    setProjectRelationshipContext(null); setLoadedProjectId(null);
    setProjectDataLoadError(null); setIsProjectDataLoading(Boolean(editingProjectId));
    setServerReadiness(null); setReadinessError(null);
    setIsSavingFoundation(false);
    setIsLoadingReadiness(false);
    setIsActivating(false);
    setIsTransitioning(false);
    setIsSyncingGoogle(false);
    setSyncNotice(null);
    setIsSubmittingCreation(false);
    setCreationError(null);
    setIsAddingMaterial(false);
    setEditingMaterial(null);
    setIsCarrierEditorOpen(false);
    setEditingCarrier(null);
    setIsAddingPricing(false);
    setIsAddingRosterRow(false);
    manualLock.current = false; setManualBusy(false); setManualError(null); setManualPreview(null); setManualConfirmed(false);
    setPriceCarrierId('ALL'); setPriceMaterialId('ALL_MATERIALS');
    setPriceModel('PER_TRIP'); setPriceFrom(new Date().toISOString().split('T')[0]); setPriceTo('');
    setPriceRate(0); setPriceNotes('');
    setActiveSetupLayer('FOUNDATION'); setNavigationError(null);
    setRosterTransitionError(null); setIsDragOver(false);
    setRostDriverName(''); setRostPlate(''); setRostPhone('');
    setRostResidency(''); setRostCarrier(''); setRostMaterial('');
    setIsRestoringImportSession(false);
    handleResetRosterImport();
    if (!bridgeContextRef.current || !projectContext.isCurrent(bridgeContextRef.current, editingProjectId)) {
      bridgeContextRef.current = null;
      setLocalProjectOverride(null);
    }
  }, [editingProjectId, projectScopeKey]);

  // Canonical scope loss must retire even a local bridge before it can resurrect a project.
  useLayoutEffect(() => {
    if (!editingProjectId) return;
    const assigned = authContext.role === 'SUPER_ADMIN' || (authContext.assignedProjectIds || []).includes(editingProjectId);
    const disappeared = canonicalProjectsSeen.current.has(editingProjectId) && !globalProjects.some(item => item.projectId === editingProjectId);
    if (!assigned || disappeared) {
      const fallback = globalProjects.find(item => authContext.role === 'SUPER_ADMIN' || (authContext.assignedProjectIds || []).includes(item.projectId))?.projectId || null;
      setEditingProjectId(fallback);
      onSelectProject?.(fallback);
    }
  }, [editingProjectId, globalProjects, projectScopeKey]);

  const isFoundationDirty = useMemo(() => {
    if (!isEditingFoundation || !foundationDraft || !project) return false;
    return (
      foundationDraft.nameAr !== (project.nameAr || '') ||
      foundationDraft.clientName !== (project.clientName || '') ||
      foundationDraft.addressAr !== (project.location?.addressAr || '') ||
      foundationDraft.zatcaTaxNumber !== (project.settings?.zatcaTaxNumber || '') ||
      foundationDraft.startDate !== (project.startDate || '')
    );
  }, [isEditingFoundation, foundationDraft, project]);

  const handleEnterFoundationEdit = useCallback(() => {
    if (isCoreSetupLocked || !project) return;
    setFoundationDraft({
      nameAr: project.nameAr || '',
      clientName: project.clientName || '',
      addressAr: project.location?.addressAr || '',
      zatcaTaxNumber: project.settings?.zatcaTaxNumber || '',
      startDate: project.startDate || '',
    });
    setIsEditingFoundation(true);
    setFoundationSaveError(null);
    setFoundationSaveSuccess(null);
  }, [isCoreSetupLocked, project]);

  const handleCancelFoundationEdit = useCallback(() => {
    setIsEditingFoundation(false);
    setFoundationDraft(null);
    setFoundationSaveError(null);
  }, []);

  const handleSaveFoundation = useCallback(async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    const t = (key: string, params?: Record<string, string | number>) => presentationTranslator.current(key, params);
    if (!project || !foundationDraft || (!isFoundationDirty && !foundationNeedsRefresh) || isSavingFoundation) return;

    if (!foundationDraft.nameAr.trim() || foundationDraft.nameAr.trim().length < 3) {
      setFoundationSaveError(t('projects.batch4.project_name_minimum'));
      return;
    }
    if (foundationDraft.zatcaTaxNumber && !/^[0-9]{15}$/.test(foundationDraft.zatcaTaxNumber)) {
      setFoundationSaveError(t('projects.batch4.zatca_fifteen_digits'));
      return;
    }

    setIsSavingFoundation(true);
    setFoundationSaveError(null);
    setFoundationSaveSuccess(null);

    try {
      const updates: Partial<ProjectEntity> = {
        nameAr: foundationDraft.nameAr.trim(),
        clientName: foundationDraft.clientName.trim(),
        location: {
          lat: project.location?.lat || 24.7136,
          lng: project.location?.lng || 46.6753,
          geoFenceRadiusMeters: project.location?.geoFenceRadiusMeters || 1000,
          addressAr: foundationDraft.addressAr.trim(),
        },
        settings: {
          zatcaTaxNumber: foundationDraft.zatcaTaxNumber.trim(),
        } as ProjectEntity['settings'],
        startDate: foundationDraft.startDate || undefined,
      };

      if (!foundationReceipt.current || !projectContext.isCurrent(foundationReceipt.current, project.projectId)) {
        await projectService.updateProject(project.projectId, updates, authContext);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        foundationReceipt.current = requestContext;
        setFoundationNeedsRefresh(true);
      }
      const updatedProject = await projectService.getProject(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!updatedProject) throw new Error('FOUNDATION_REFRESH_FAILED');
      foundationReceipt.current = null; setFoundationNeedsRefresh(false);

      setCurrentProjectOverride(updatedProject, requestContext, 'FOUNDATION');
      setIsEditingFoundation(false);
      setFoundationDraft(null);
      setFoundationSaveSuccess(t('projects.messages.changes_saved'));
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setFoundationSaveError(t(foundationReceipt.current ? 'setup.errors.refresh' : setupErrorKey(err)));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setIsSavingFoundation(false);
    }
  }, [project, foundationDraft, isFoundationDirty, isSavingFoundation, foundationNeedsRefresh, authContext, renderedContext.generation]);

  // Canonical Server Readiness States (Phase 5)
  const [serverReadiness, setServerReadiness] = useState<ServerReadinessDTO | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState<boolean>(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const readinessRequestRef = useRef<symbol | null>(null);
  const fetchServerReadiness = useCallback(async (targetProjectId: string) => {
    const requestContext = projectContext.capture();
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    const t = (key: string, params?: Record<string, string | number>) => presentationTranslator.current(key, params);
    const readinessRequest = Symbol('readiness');
    readinessRequestRef.current = readinessRequest;
    const isCurrentReadiness = () => projectContext.isCurrent(requestContext, targetProjectId) && readinessRequestRef.current === readinessRequest;
    setIsLoadingReadiness(true);
    setServerReadiness(null);
    setReadinessError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const res = await fetch(`/api/projects/${targetProjectId}/readiness`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!isCurrentReadiness()) {
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        throw new Error('READINESS_UNAVAILABLE');
      }
      const data: ServerReadinessDTO = await res.json();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!isCurrentReadiness()) {
        return;
      }
      if (!isEvaluatedReadiness(data, targetProjectId)) throw new Error('READINESS_UNAVAILABLE');
      setServerReadiness(data);
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (isCurrentReadiness()) {
        setServerReadiness(null);
        setReadinessError(t('readiness.unavailable'));
        setServerReadiness(null);
      }
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (isCurrentReadiness()) {
        setIsLoadingReadiness(false);
      }
    }
  }, [editingProjectId, projectScopeKey, projectContext]);

  const applyCanonicalSnapshot = useCallback((
    arg1: string | ProjectCanonicalRefreshSnapshot,
    arg2?: ProjectCanonicalRefreshSnapshot,
    generation?: number
  ) => {
    let targetProjectId: string | undefined;
    let snapshot: ProjectCanonicalRefreshSnapshot;
    if (typeof arg1 === 'string') {
      targetProjectId = arg1;
      snapshot = arg2!;
    } else {
      snapshot = arg1;
    }

    if (!targetProjectId || generation === undefined || !projectContext.isCurrent({ projectId: targetProjectId, generation }, targetProjectId)) return;

    setProjectDataLoadError(null);
    setCanonicalRevision(value => value + 1);
    setMaterials(snapshot.materials || []);
    setCarriers(snapshot.carriers || []);
    setFleetRows(snapshot.fleetRows || []);
    if (snapshot.relationshipContext) {
      setProjectRelationshipContext(snapshot.relationshipContext);
    }
    if (targetProjectId || editingProjectId) {
      setLoadedProjectId(targetProjectId || editingProjectId);
    }
  }, [editingProjectId, projectContext]);

  // Real-time Subscriptions & Authoritative Canonical Data Loading (depends only on editingProjectId)
  useEffect(() => {
    if (!editingProjectId) {
      setMaterials([]);
      setCarriers([]);
      setPricingRules([]);
      setFleetRows([]);
      setProjectRelationshipContext(null);
      setServerReadiness(null);
      setReadinessError(null);
      setDriverConvergenceError(null);
      setTruckConvergenceError(null);
      setCachedSuccessfulDriverResult(null);
      setCachedSuccessfulTruckResult(null);
      setSmartImportCommitResult(null);
      setSmartImportCommitError(null);
      setImportSessionId(null);
      setImportSessionOperationId(null);
      setImportSessionRecoveryError(null);
      setImportBatch(null);
      setIsRosterMappingApproved(false);
      setRosterDiscoveryResult(null);
      setRosterSelectedFile(null);
      setRosterBuffer(null);
      setIsSmartImportOpen(false);
      setRosterImportStage('SOURCE_DISCOVERY');
      setLoadedProjectId(null);
      setIsProjectDataLoading(false);
      setProjectDataLoadError(null);
      return;
    }

    const currentGen = projectContext.capture().generation;
    const targetProjectId = editingProjectId;

    // Immediately clear previous project-scoped state before loading target project
    setMaterials([]);
    setCarriers([]);
    setFleetRows([]);
    setPricingRules([]);
    setProjectRelationshipContext(null);
    setServerReadiness(null);
    setReadinessError(null);
    setDriverConvergenceError(null);
    setTruckConvergenceError(null);
    setCachedSuccessfulDriverResult(null);
    setCachedSuccessfulTruckResult(null);
    setSmartImportCommitResult(null);
    setSmartImportCommitError(null);
    setImportSessionId(null);
    setImportSessionOperationId(null);
    setImportSessionRecoveryError(null);
    setImportBatch(null);
    setIsRosterMappingApproved(false);
    setRosterDiscoveryResult(null);
    setRosterSelectedFile(null);
    setRosterBuffer(null);
    setIsSmartImportOpen(false);
    setRosterImportStage('SOURCE_DISCOVERY');
    setLoadedProjectId(null);
    setIsProjectDataLoading(true);
    setProjectDataLoadError(null);

    // Fetch canonical lists and fleet rows via canonical refresh barrier
    const fetchCanonicalData = async () => {
      const requestContext = projectContext.capture();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      try {
        const snapshot = await projectCanonicalRefreshService.refresh(targetProjectId);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        if (!projectContext.isCurrent(requestContext, targetProjectId)) {
          return;
        }
        applyCanonicalSnapshot(targetProjectId, snapshot, currentGen);
        setLoadedProjectId(targetProjectId);
        setIsProjectDataLoading(false);
      } catch (err: any) {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        if (projectContext.isCurrent(requestContext, targetProjectId)) {
          console.error('Failed to load canonical data', err);
          setProjectDataLoadError(err?.message || t('projects.batch4.project_load_failed'));
          setIsProjectDataLoading(false);
        }
      }
    };
    
    fetchCanonicalData();
  }, [editingProjectId, applyCanonicalSnapshot, projectScopeKey]);

  // Unit 3A.2: Pricing Rules Subscription depends only on editingProjectId
  useEffect(() => {
    if (!editingProjectId) {
      setPricingRules([]);
      return;
    }
    const subscriptionContext = projectContext.capture();
    const unsubP = pricingRuleRepository.subscribeByProject(editingProjectId, (list) => {
      if (!projectContext.isCurrent(subscriptionContext, editingProjectId)) return;
      setPricingRules(list || []);
    });
    return () => {
      unsubP();
    };
  }, [editingProjectId, projectScopeKey]);

  useEffect(() => {
    if (editingProjectId && !foundationNeedsRefresh && !isSavingFoundation) {
      fetchServerReadiness(editingProjectId);
    } else {
      setServerReadiness(null);
    }
  }, [editingProjectId, fetchServerReadiness, canonicalRevision, foundationNeedsRefresh, isSavingFoundation]);

  useEffect(() => {
    if (activeSetupLayer === 'REVIEW_ACTIVATION' && editingProjectId) {
      fetchServerReadiness(editingProjectId);
    }
  }, [activeSetupLayer, editingProjectId, fetchServerReadiness]);

  // Unit 3A.1 / 3A.2: Restore Resumable Smart Import Session when entering ROSTER layer
  useEffect(() => {
    if (!editingProjectId || activeSetupLayer !== 'ROSTER') return;

    const restoreResumableSession = async () => {
      const requestContext = projectContext.capture();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      const targetProjectId = editingProjectId;
      const currentGen = requestContext.generation;
      try {
        setIsRestoringImportSession(true);
        const sessions = await importSessionClientService.listResumableSessions(targetProjectId);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        if (!projectContext.isCurrent(requestContext, targetProjectId)) {
          return;
        }
        if (!sessions || sessions.length === 0) {
          setIsRestoringImportSession(false);
          return;
        }

        // Multiple sessions: take newest by updatedAt (already sorted DESC) and fail closed if corrupted
        const candidate = sessions[0];
        if (!candidate || !candidate.importSessionId) {
          setIsRestoringImportSession(false);
          return;
        }

        // Validate checkpoint structural integrity
        if (candidate.importBatch && (!Array.isArray(candidate.importBatch.rows) || typeof candidate.importBatch.importBatchId !== 'string')) {
          setImportSessionRecoveryError(t('projects.batch4.import_restore_invalid'));
          setIsRestoringImportSession(false);
          return;
        }

        if (!projectContext.isCurrent(requestContext, targetProjectId)) {
          return;
        }

        // Restore verified session
        setImportSessionId(candidate.importSessionId);
        const ver = typeof candidate.version === 'number' ? candidate.version : 1;
        setImportSessionVersion(ver);
        importSessionVersionRef.current = ver;
        setImportSessionOperationId(candidate.operationId || null);

        if (candidate.importBatch) {
          setImportBatch(candidate.importBatch);
          // Normalized batch resumed without requiring the original browser File object
          setRosterSelectedFile(null);
          setRosterBuffer(null);
        }

        if (candidate.smartImportCommitResult) {
          setSmartImportCommitResult(candidate.smartImportCommitResult);
        }

        if (candidate.isRosterMappingApproved) {
          setIsRosterMappingApproved(true);
        }

        if (candidate.discoveryMetadata || candidate.rosterDiscoveryResult || candidate.sourceMetadata) {
          const meta = candidate.discoveryMetadata || candidate.rosterDiscoveryResult || candidate.sourceMetadata;
          if (meta?.headers) {
            const cols: Record<string, any> = {};
            if (meta.detectedColumns) {
              for (const [h, col] of Object.entries(meta.detectedColumns)) {
                cols[h] = { canonicalField: col };
              }
            }
            setRosterDiscoveryResult({
              sourceType: 'EXCEL',
              availableSheets: meta.sheetNames || [],
              selectedSheet: meta.selectedSheet || null,
              detectedHeaderRowIndex: 0,
              detectedHeaders: meta.headers || [],
              mappingDiagnostics: cols as any,
              confidence: 100,
              requiresReview: false,
              ambiguityReasons: [],
            });
          }
        }

        // Restore target stage
        const targetStage: RosterSmartImportStage = candidate.rosterStage || (candidate.lifecycleState ? LIFECYCLE_TO_ROSTER_STAGE_MAP[candidate.lifecycleState] : 'CARRIER_RESOLUTION') || 'CARRIER_RESOLUTION';
        setRosterImportStage(targetStage);
        setIsSmartImportOpen(true);
        setImportSessionRecoveryError(null);
      } catch (err: any) {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        console.warn('Failed to discover resumable import sessions:', err);
      } finally {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        if (projectContext.isCurrent(requestContext, targetProjectId)) {
          setIsRestoringImportSession(false);
        }
      }
    };

    restoreResumableSession();
  }, [editingProjectId, activeSetupLayer, projectScopeKey]);

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
            conflicts.push(t('projects.batch4.pricing_overlap', { first: r1.name, second: r2.name }));
          }
        }
      }
    }
    return conflicts;
  }, [pricingRules, t]);

  const creationCommandRef = useRef<{ fingerprint: string; operationId: string } | null>(null);

  // Phase 1: Initialize New Project (Atomic transaction with sequential custom numbering)
  const handleCreateProject = async (e: React.FormEvent) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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

      const fingerprint = JSON.stringify(payload);
      if (!creationCommandRef.current || creationCommandRef.current.fingerprint !== fingerprint) {
        creationCommandRef.current = { fingerprint, operationId: crypto.randomUUID() };
      }
      const createdProject = await projectService.createProject({ ...payload, operationId: creationCommandRef.current.operationId }, authContext);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      creationCommandRef.current = null;
      creatingRef.current = false;
      updateCreatingNew(false);
      setEditingProjectId(createdProject.projectId);
      setCurrentProjectOverride(createdProject, projectContext.capture());
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setCreationError(err.message || t('projects.batch4.project_creation_failed'));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setIsSubmittingCreation(false);
    }
  };

  // Trigger Google Workspace Sync & Initial Projection asynchronously
  const handleSyncGoogleWorkspace = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: clientWorkspaceService,
      isCurrent: () => projectContext.isCurrent(requestContext, editingProjectId),
    });
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
  };




  // Convenience composite intake: explicit read-only preview, then retained receipt + common refresh.
  const handleAddRosterManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestContext = renderedContext;
    const current = () => projectContext.isCurrent(requestContext, editingProjectId);
    if (!current() || !project || manualLock.current || !canPerformOperationalMutation('INTAKE_DRIVER_TRUCK', project.status)) return;
    if (!manualSession.committed && (!rostDriverName.trim() || !rostPlate.trim() || !rostCarrier || !rostMaterial || !rostResidency.trim())) return;
    manualLock.current = true; setManualBusy(true); setManualError(null);
    const payload = { projectId: project.projectId, carrierId: rostCarrier, materialId: rostMaterial, driverName: rostDriverName.trim(), plateNumber: rostPlate.trim(), residencyId: rostResidency.trim(), phone: rostPhone.trim() || undefined };
    try {
      if (!manualSession.committed) {
        const preview = await setupCommand(project.projectId, 'intake-preview', { residencyId: payload.residencyId, plateNumber: payload.plateNumber });
        if (!current()) return;
        const displacesAssignment = preview.assignments.some((r: any) => r.driverId !== preview.driverId || r.truckId !== preview.truckId);
        const displacesMaterial = preview.allocation && preview.allocation.materialId !== payload.materialId;
        const signature = JSON.stringify({ payload, preview });
        if ((displacesAssignment || displacesMaterial) && (!manualConfirmed || manualPreview?.signature !== signature)) {
          setManualPreview({ ...preview, signature }); setManualConfirmed(false); return;
        }
      }
      const ok = await manualSession.run(project.projectId, () => postSetupJson('/api/intake/canonical', payload), current,
        snapshot => applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation));
      if (!ok || !current()) return;
      setIsAddingRosterRow(false);
      setRostDriverName(''); setRostPlate(''); setRostPhone(''); setRostResidency(''); setRostCarrier(''); setRostMaterial('');
      setManualPreview(null); setManualConfirmed(false);
    } catch (err: any) { if (current()) setManualError(manualSession.committed ? 'setup.errors.refresh' : setupErrorKey(err)); }
    finally { if (current()) { manualLock.current = false; setManualBusy(false); } }
  };

  // Phase 2: Roster Unified Import File Input Change
  const handleRosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    const file = e.target.files?.[0];
    if (!file || !project) return;
    await processRosterFile(file);
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !project) return;
    await processRosterFile(file);
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
  };

  // =========================================================================
  // Unit 3A.1 Persistent Import Session & Checkpoint Orchestration Helpers
  // =========================================================================

  const buildSafeDiscoveryMetadata = (
    disc: DiscoveryResult | null,
    fileName?: string,
    fileSize?: number
  ): SafeDiscoveryMetadata | null => {
    if (!disc && !fileName) return null;

    let detectedColumns: Record<string, string> | undefined = undefined;
    if (disc?.mappingDiagnostics) {
      const cols: Record<string, string> = {};
      for (const [header, match] of Object.entries(disc.mappingDiagnostics)) {
        if (match && match.canonicalField) {
          cols[header] = String(match.canonicalField);
        }
      }
      if (Object.keys(cols).length > 0) {
        detectedColumns = cols;
      }
    }

    return {
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      sheetNames: disc?.availableSheets && disc.availableSheets.length > 0 ? disc.availableSheets : undefined,
      selectedSheet: disc?.selectedSheet || rosterSelectedSheet || undefined,
      headers: disc?.detectedHeaders && disc.detectedHeaders.length > 0 ? disc.detectedHeaders : undefined,
      detectedColumns,
      sampleRowCount: undefined,
    };
  };

  const buildSmartImportCheckpointPayload = (params: {
    stage?: RosterSmartImportStage;
    batch?: UnifiedImportBatch | null;
    commitResult?: ImportResult | null;
    warningConfirmation?: boolean;
    isMappingApproved?: boolean;
    discoveryMetadata?: SafeDiscoveryMetadata | null;
    lifecycleState?: ImportSessionLifecycleState;
  }): UpdateImportSessionPayload => {
    const targetStage = params.stage || rosterImportStage;
    const targetBatch = params.batch !== undefined ? params.batch : importBatch;
    const targetCommitResult = params.commitResult !== undefined ? params.commitResult : smartImportCommitResult;
    const targetMappingApproved = params.isMappingApproved !== undefined ? params.isMappingApproved : isRosterMappingApproved;
    const targetDiscovery = params.discoveryMetadata !== undefined ? params.discoveryMetadata : buildSafeDiscoveryMetadata(rosterDiscoveryResult, rosterSelectedFile?.name, rosterSelectedFile?.size);

    let targetLifecycle: ImportSessionLifecycleState = params.lifecycleState || ROSTER_STAGE_TO_LIFECYCLE_MAP[targetStage] || 'RESOLUTION';

    if (targetStage === 'COMMIT_RESULT' && targetCommitResult) {
      if (targetCommitResult.success && (targetCommitResult.failedRows || 0) === 0) {
        targetLifecycle = 'COMMITTED';
      } else {
        targetLifecycle = 'FAILED'; // Retryable partial failure
      }
    }

    return {
      lifecycleState: targetLifecycle,
      currentStage: targetStage,
      rosterStage: targetStage,
      importBatch: targetBatch || undefined,
      smartImportCommitResult: targetCommitResult,
      isRosterMappingApproved: targetMappingApproved,
      sourceMetadata: targetDiscovery || undefined,
      rosterDiscoveryResult: targetDiscovery || undefined,
      warningConfirmation: params.warningConfirmation !== undefined ? params.warningConfirmation : (targetBatch?.warningConfirmation?.confirmed ?? false),
    };
  };

  const persistSmartImportCheckpoint = async (params: {
    stage?: RosterSmartImportStage;
    batch?: UnifiedImportBatch | null;
    commitResult?: ImportResult | null;
    warningConfirmation?: boolean;
    isMappingApproved?: boolean;
    discoveryMetadata?: SafeDiscoveryMetadata | null;
    lifecycleState?: ImportSessionLifecycleState;
  }): Promise<boolean> => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;

    if (!project || !importSessionId) {
      setImportSessionRecoveryError(t('projects.batch4.checkpoint_identifiers_missing'));
      return false;
    }

    try {
      const payload = buildSmartImportCheckpointPayload(params);
      const expectedVer = importSessionVersionRef.current;

      const updated = await importSessionClientService.updateCheckpoint(
        project.projectId,
        importSessionId,
        payload,
        expectedVer
      );
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;

      if (updated && typeof updated.version === 'number') {
        importSessionVersionRef.current = updated.version;
        setImportSessionVersion(updated.version);
      }
      setImportSessionRecoveryError(null);
      return true;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;

      console.error('Import session checkpoint failed:', err);
      if (err instanceof ImportSessionVersionConflictError || err?.code === 'VERSION_CONFLICT') {
        setImportSessionRecoveryError(t('projects.batch4.import_version_conflict'));
      } else {
        setImportSessionRecoveryError(err.message || t('projects.batch4.checkpoint_persistence_failed'));
      }
      return false;
    }
  };

  const handleResetRosterImport = () => {
    // LOCAL_TERMINAL_CLEAR / LOCAL_CLEANUP
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
    setImportSessionId(null);
    setImportSessionVersion(1);
    importSessionVersionRef.current = 1;
    setImportSessionOperationId(null);
    setImportSessionRecoveryError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelRosterImport = async (): Promise<boolean> => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;

    // EXPLICIT_CANCEL: Persist CANCELLED lifecycle on server, then clear local state
    if (importSessionId && project) {
      try {
        setIsProcessing(true);
        const expectedVer = importSessionVersionRef.current;
        await importSessionClientService.updateCheckpoint(
          project.projectId,
          importSessionId,
          {
            lifecycleState: 'CANCELLED',
            rosterStage: 'SOURCE_DISCOVERY',
          },
          expectedVer
        );
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;
      } catch (err: any) {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return false;

        console.error('Failed to cancel import session on server:', err);
        setImportError(err.message || t('projects.batch4.import_cancel_failed'));
        setImportSessionRecoveryError(err.message || t('projects.batch4.import_cancel_failed'));
        setIsProcessing(false);
        return false;
      }
    }

    handleResetRosterImport();
    setIsSmartImportOpen(false);
    return true;
  };

  const contextualReceipts = useRef(new ContextualPrerequisiteReceipts()).current;
  const loadImportResolutionContext = async (projectId: string, expectedId?: string) => {
    const request = renderedContext;
    let value: RelationshipContext;
    try { value = await canonicalRelationshipContextService.getProjectRelationshipContext(projectId, { resolution: true }); }
    catch (error) {
      if (projectContext.isCurrent(request, projectId) && resolutionErrorKey(error) === 'import.resolution.access') { setProjectRelationshipContext(null); setImportBatch(null); setIsSmartImportOpen(false); }
      throw new Error(t(resolutionErrorKey(error)));
    }
    if (!projectContext.isCurrent(request, projectId)) throw Error('PROJECT_CONTEXT_STALE');
    if (value.importResolution?.projectId !== projectId || (expectedId && !value.importResolution.entities.some(e => e.id === expectedId && e.membershipStatus === 'ACTIVE' && e.globalStatus === 'ACTIVE'))) throw Error('CONTEXT_UNAVAILABLE');
    setProjectRelationshipContext(value);
    return value;
  };
  const applyCanonicalImportChoice = async (group: RosterEntityReviewGroup, context: RelationshipContext, id: string, prerequisite?: string) => {
    const request = renderedContext;
    if (!project || !importBatch || !projectContext.isCurrent(request, project.projectId)) return;
    const pipeline = ImportProjectContextAdapter.createPipelineContext({ relContext: context, projectId:project.projectId, userId:authContext.userId, role:authContext.role, operationId:importBatch.operationId });
    const updated=DriverTruckPipelineService.applyGroupedEntityResolutionDecision(importBatch,group.entityType,group.normalizedSourceKey,'SELECT_ALTERNATE',{selectedEntityId:id},pipeline,authContext.userId);
    if (prerequisite) updated.metadata = { ...updated.metadata, canonicalPrerequisites:[...(updated.metadata?.canonicalPrerequisites || []), {projectId:project.projectId, key:`${group.entityType.toUpperCase()}:${id}`, action:prerequisite, completed:true, rowNumbers:group.rowNumbers}] };
    setProjectRelationshipContext(context); setImportBatch(updated);
    await persistSmartImportCheckpoint({batch:updated});
  };
  const inspectCanonicalBeforeCreate = async (kind: GlobalKind, group: RosterEntityReviewGroup, naturalKey: string) => {
    const request=renderedContext;
    if(!project||!projectContext.isCurrent(request,project.projectId))return false;
    if(group.currentResolution?.ambiguous)throw Error('IDENTITY_AMBIGUITY');
    const context=await canonicalRelationshipContextService.getProjectRelationshipContext(project.projectId,{resolution:true,kind,naturalKey});
    if(!projectContext.isCurrent(request,project.projectId))return false;
    const lookup=context.importResolution?.lookup;
    if(!lookup||lookup.kind!==kind||lookup.naturalKey!==naturalKey)throw Error('CONTEXT_UNAVAILABLE');
    setProjectRelationshipContext(context);
    if(lookup.matchedId){
      await applyCanonicalImportChoice(group,context,lookup.matchedId);
      if(!projectContext.isCurrent(request,project.projectId))return false;
      if(kind==='CARRIER')setIsSmartImportCarrierModalOpen(false);
      if(kind==='MATERIAL')setIsSmartImportMaterialModalOpen(false);
      return false;
    }
    return true;
  };

  const processRosterFile = async (file: File) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    handleResetRosterImport();
    const currentGen = rosterImportSessionGenerationRef.current;
    setRosterSelectedFile(file);
    setIsImportingFile(true);
    setIsDiscoveringRoster(true);

    try {
      validateRosterFile(file);
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        try {
          const data = event.target?.result as ArrayBuffer;
          if (!data) throw new Error(t('projects.batch4.file_read_failed'));
          if (currentGen !== rosterImportSessionGenerationRef.current) return;
          setRosterBuffer(data);

          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
          const sourceType = (ext === '.xlsx' || ext === '.xls') ? 'EXCEL' : 'CSV';
          const discSource: ImportSource = {
            sourceType,
            importBatchId: `BAT-DISC-ROSTER-${Date.now()}`,
            sourceFileName: file.name,
          };

          const discovery = await smartSourceDiscoveryService.discover(discSource, data, { roster: true });
          if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
          if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

          if (currentGen !== rosterImportSessionGenerationRef.current) return;
          setRosterDiscoveryError(t(rosterErrorKey(innerErr)));
        } finally {
          if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

          if (currentGen === rosterImportSessionGenerationRef.current) {
            setIsImportingFile(false);
            setIsDiscoveringRoster(false);
          }
        }
      };
      const failRead = () => {
        if (!projectContext.isCurrent(requestContext, editingProjectId) || currentGen !== rosterImportSessionGenerationRef.current) return;
        setIsImportingFile(false); setIsDiscoveringRoster(false);
        setRosterDiscoveryError(t(rosterErrorKey(new RosterSourceError('FILE_READ_ERROR'))));
      };
      reader.onerror = failRead;
      reader.onabort = failRead;
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setRosterDiscoveryError(t(rosterErrorKey(err)));
      setIsImportingFile(false);
      setIsDiscoveringRoster(false);
    }
  };

  const handleRosterSheetChange = async (sheet: string) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    setRosterSelectedSheet(sheet); setRosterDiscoveryError(null);
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

        const updatedDiscovery = await smartSourceDiscoveryService.discover(discSource, rosterBuffer, { roster: true });
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        if (currentGen !== rosterImportSessionGenerationRef.current) return;
        console.error('Roster sheet change discovery error:', err);
        setRosterDiscoveryResult(prev => prev ? { ...prev, detectedHeaders: [] } : null); setRosterCustomMappings({});
        setRosterDiscoveryError(t(rosterErrorKey(err)));
      } finally {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        if (currentGen === rosterImportSessionGenerationRef.current) {
          setIsDiscoveringRoster(false);
        }
      }
    }
  };

  const handleRosterHeaderRowIndexChange = async (index: number) => {
    const requestContext = renderedContext, currentGen = rosterImportSessionGenerationRef.current;
    if (!projectContext.isCurrent(requestContext, editingProjectId) || !rosterBuffer || !rosterSelectedFile) return;
    setRosterHeaderRowIndex(index); setIsDiscoveringRoster(true); setRosterDiscoveryError(null);
    try {
      const intake = validateRosterFile(rosterSelectedFile);
      const discovery = await smartSourceDiscoveryService.discover({ sourceType: intake.fileType === 'CSV' ? 'CSV' : 'EXCEL', importBatchId: 'ROSTER-HEADER', sourceSheetName: rosterSelectedSheet || undefined }, rosterBuffer, { roster: true, headerRowIndex: index });
      if (!projectContext.isCurrent(requestContext, editingProjectId) || currentGen !== rosterImportSessionGenerationRef.current) return;
      setRosterDiscoveryResult(discovery);
      setRosterCustomMappings(Object.fromEntries(discovery.detectedHeaders.map(h => [h, translateDiscoveryToRosterTarget(String(discovery.mappingDiagnostics[h]?.canonicalField || ''))])));
    } catch (error) {
      if (!projectContext.isCurrent(requestContext, editingProjectId) || currentGen !== rosterImportSessionGenerationRef.current) return;
      setRosterDiscoveryResult(prev => prev ? { ...prev, detectedHeaders: [] } : null); setRosterCustomMappings({});
      setRosterDiscoveryError(t(rosterErrorKey(error)));
    } finally {
      if (projectContext.isCurrent(requestContext, editingProjectId) && currentGen === rosterImportSessionGenerationRef.current) setIsDiscoveringRoster(false);
    }
  };

  const handleRosterMappingChange = (header: string, target: DriverTruckCanonicalMappingTarget | 'unmapped') => {
    setRosterCustomMappings((prev) => ({
      ...prev,
      [header]: target,
    }));
  };

  const handleApproveRosterMappingAndStartPipeline = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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

      const mappingIssue = validateRosterMapping(rosterDiscoveryResult?.detectedHeaders || [], approvedCustomMappings);
      if (mappingIssue) {
        setImportError(t(rosterErrorKey(new RosterSourceError(mappingIssue))));
        setIsImportingFile(false); setIsProcessing(false);
        return;
      }

      let relContext = null;
      try {
        relContext = await loadImportResolutionContext(project.projectId);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      } catch (relErr) {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

        throw new Error('CONTEXT_UNAVAILABLE');
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
        rosterSelectedFile.type || undefined,
        pipelineCtx,
        {
          sheetName: rosterSelectedSheet || undefined,
          headerRowIndex: rosterHeaderRowIndex,
          customMappings: approvedCustomMappings,
        }
      );
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;

      // Unit 3A.1 / 3A.1a: Create Server Import Session at durable mapping point BEFORE stage advance
      const discMeta = buildSafeDiscoveryMetadata(rosterDiscoveryResult, rosterSelectedFile.name, rosterSelectedFile.size);
      const createdSessionRecord = await importSessionClientService.createSession(project.projectId, {
        sourceType: batch.source.sourceType === 'CSV' ? 'CSV' : 'EXCEL',
        currentStage: 'CARRIER_RESOLUTION',
        rosterStage: 'CARRIER_RESOLUTION',
        lifecycleState: 'RESOLUTION',
        importBatchId: batch.importBatchId,
        operationId: pipelineCtx.operationId,
        importBatch: batch,
        isRosterMappingApproved: true,
        sourceMetadata: discMeta || undefined,
        rosterDiscoveryResult: discMeta || undefined,
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;

      if (!createdSessionRecord || !createdSessionRecord.importSessionId) {
        throw new Error(t('projects.batch4.import_session_id_missing'));
      }

      setImportSessionId(createdSessionRecord.importSessionId);
      const sVer = typeof createdSessionRecord.version === 'number' ? createdSessionRecord.version : 1;
      setImportSessionVersion(sVer);
      importSessionVersionRef.current = sVer;
      setImportSessionOperationId(createdSessionRecord.operationId || pipelineCtx.operationId);
      setImportSessionRecoveryError(null);

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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      console.error('Mapping approval & session initialization error:', err);
      setImportError(err instanceof RosterSourceError ? t(rosterErrorKey(err)) : (err?.message || t('projects.batch4.roster_analysis_failed')));
      setImportSessionRecoveryError(err instanceof RosterSourceError ? null : (err?.message || t('projects.batch4.import_session_save_failed')));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsImportingFile(false);
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Progression Gate from CARRIER_RESOLUTION to MATERIAL_RESOLUTION (D10, D14)
  const handleSmartImportContinueToMaterials = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch) return;
    const reviewGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const carrierGroups = reviewGroups.carrier || [];
    if (carrierGroups.length === 0 && !projectRelationshipContext?.importResolution) {
      alert(presentBatch4Message(t('projects.batch4.carrier_groups_missing'), t));
      return;
    }
    const hasUnresolvedCarriers = carrierGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );
    if (hasUnresolvedCarriers) {
      alert(presentBatch4Message(t('projects.batch4.carrier_groups_pending'), t));
      return;
    }

    // D10: Carrier row-level required gate
    const activeRows = importBatch.rows.filter((r) => r.status !== 'REJECTED');
    const hasUnresolvedCarrierRow = activeRows.some((r) => {
      if (projectRelationshipContext?.importResolution && !r.canonical?.carrierName && !r.canonical?.carrierId && !r.canonical?.driverName && !r.canonical?.driverIdentity && !r.canonical?.truckPlate) return false;
      const carrierRes = r.entityResolutions?.carrier;
      return !carrierRes?.matchedId || carrierRes.relationshipStatus === 'RELATIONSHIP_CONFLICT';
    });
    if (hasUnresolvedCarrierRow) {
      alert(presentBatch4Message(t('projects.batch4.carrier_rows_pending'), t));
      return;
    }

    const persisted = await persistSmartImportCheckpoint({ stage: 'MATERIAL_RESOLUTION' });
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    if (!persisted) return;
    transitionToRosterStage('MATERIAL_RESOLUTION');
  };

  // C4 Smart Import: Progression Gate from MATERIAL_RESOLUTION to DRIVER_TRUCK_RESOLUTION (D11, D14)
  const handleSmartImportContinueToDriverTruck = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch) return;
    const reviewGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const materialGroups = reviewGroups.material || [];
    if (materialGroups.length === 0 && !projectRelationshipContext?.importResolution) {
      alert(presentBatch4Message(t('projects.batch4.material_groups_missing'), t));
      return;
    }
    const hasUnresolvedMaterials = materialGroups.some(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    );
    if (hasUnresolvedMaterials) {
      alert(presentBatch4Message(t('projects.batch4.material_groups_pending'), t));
      return;
    }

    // D11: Material row-level required gate
    const activeRows = importBatch.rows.filter((r) => r.status !== 'REJECTED');
    const hasUnresolvedMaterialRow = activeRows.some((r) => {
      const materialRes = r.entityResolutions?.material;
      if (projectRelationshipContext?.importResolution && !r.canonical?.materialName && !r.canonical?.materialCode && !r.canonical?.materialId) return false;
      return !materialRes?.matchedId || materialRes.relationshipStatus === 'RELATIONSHIP_CONFLICT';
    });
    if (hasUnresolvedMaterialRow) {
      alert(presentBatch4Message(t('projects.batch4.material_rows_pending'), t));
      return;
    }

    const persisted = await persistSmartImportCheckpoint({ stage: 'DRIVER_TRUCK_RESOLUTION' });
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    if (!persisted) return;
    transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
  };

  // C4 Smart Import: Accept Driver Candidate
  const handleSmartImportDriverAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.driver_decision_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.driver_alternative_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // Unit 3A: Plan Driver Creation with Non-persisted PREPARED_NEW plan (Zero Server Mutations)
  const handleSmartImportDriverCreate = async (
    group: RosterEntityReviewGroup,
    data: { driverName: string; residencyId: string; phone?: string }
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      const carrierId = extractGroupCarrierContext(group);
      if (!carrierId) {
        throw new Error(t('projects.batch4.driver_carrier_missing'));
      }

      if (!data.driverName.trim()) {
        throw new Error(t('entityResolution.messages.driver_name_required'));
      }
      if (!data.residencyId.trim()) {
        throw new Error(t('projects.batch4.driver_identity_required'));
      }

      if (!(await inspectCanonicalBeforeCreate('DRIVER', group, data.residencyId.trim()))) return;
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: await loadImportResolutionContext(project.projectId),
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-DRIVER-PREPARE-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyPreparedNewDriverPlan(
        importBatch,
        group.normalizedSourceKey,
        {
          driverName: data.driverName.trim(),
          residencyId: data.residencyId.trim(),
          phone: data.phone?.trim() || undefined,
          carrierId,
        },
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...updated });
      setDriverConvergenceError(null);
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      throw err;
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.truck_decision_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.truck_alternative_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // Unit 3A: Plan Truck Creation with Non-persisted PREPARED_NEW plan (Zero Server Mutations)
  const handleSmartImportTruckCreate = async (
    group: RosterEntityReviewGroup,
    data: { plateNumber: string; truckType?: string; tareWeightKg?: number; maxGrossWeightKg?: number }
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);

    try {
      const carrierId = extractGroupCarrierContext(group);
      if (!carrierId) {
        throw new Error(t('projects.batch4.truck_carrier_missing'));
      }

      if (!data.plateNumber.trim()) {
        throw new Error(t('entityResolution.messages.truck_plate_required'));
      }

      if (!(await inspectCanonicalBeforeCreate('TRUCK', group, data.plateNumber.trim()))) return;
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: await loadImportResolutionContext(project.projectId),
        projectId: project.projectId,
        userId: authContext.userId,
        role: authContext.role,
        operationId: `OP-TRUCK-PREPARE-${Date.now()}`
      });

      const updated = DriverTruckPipelineService.applyPreparedNewTruckPlan(
        importBatch,
        group.normalizedSourceKey,
        {
          plateNumber: data.plateNumber.trim().toUpperCase(),
          truckType: data.truckType?.trim() || undefined,
          tareWeightKg: data.tareWeightKg,
          maxGrossWeightKg: data.maxGrossWeightKg,
          carrierId,
        },
        pipelineCtx
      );

      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      setImportBatch({ ...updated });
      setTruckConvergenceError(null);
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      throw err;
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (group.entityType === 'truck') {
      await handleSmartImportTruckAcceptCandidate(group, candidateEntityId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      return;
    }
    if (group.entityType === 'driver') {
      await handleSmartImportDriverAcceptCandidate(group, candidateEntityId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      return;
    }
    throw new Error('INVALID_DRIVER_TRUCK_GROUP_TYPE');
  };

  const handleSmartImportDriverTruckSelectAlternate = async (
    group: RosterEntityReviewGroup,
    entityId: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (group.entityType === 'truck') {
      await handleSmartImportTruckSelectAlternate(group, entityId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      return;
    }
    if (group.entityType === 'driver') {
      await handleSmartImportDriverSelectAlternate(group, entityId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      return;
    }
    throw new Error('INVALID_DRIVER_TRUCK_GROUP_TYPE');
  };

  const handleRetryDriverConvergence = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !project || !importBatch || !cachedSuccessfulDriverResult) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      setDriverConvergenceError(null);
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundDriver = snapshot.relationshipContext?.knownDrivers?.some(
        (d) => d.driverId === cachedSuccessfulDriverResult.result.matchedId && d.carrierId === cachedSuccessfulDriverResult.carrierId
      );
      if (!foundDriver) {
        setDriverConvergenceError(`DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN: ${t('entityResolution.messages.created_refresh_failed')}`);
        throw new Error('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }
      setDriverConvergenceError(null);
      applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: await loadImportResolutionContext(project.projectId),
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setDriverConvergenceError(err.message || t('projects.batch4.refresh_retry_failed'));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleRetryTruckConvergence = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !project || !importBatch || !cachedSuccessfulTruckResult) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      setTruckConvergenceError(null);
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const foundTruck = snapshot.relationshipContext?.knownTrucks?.some(
        (t) => t.truckId === cachedSuccessfulTruckResult.result.matchedId && t.carrierId === cachedSuccessfulTruckResult.carrierId
      );
      if (!foundTruck) {
        setTruckConvergenceError(`TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN: ${t('entityResolution.messages.created_refresh_failed')}`);
        throw new Error('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
      }
      setTruckConvergenceError(null);
      applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
      const pipelineCtx = ImportProjectContextAdapter.createPipelineContext({
        relContext: await loadImportResolutionContext(project.projectId),
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      setTruckConvergenceError(err.message || t('projects.batch4.refresh_retry_failed'));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const semanticRosterIntent = useMemo(() => {
    if (!importBatch || !projectRelationshipContext?.importResolution || !project || importBatch.projectId !== project.projectId || projectRelationshipContext.projectId !== project.projectId) return null;
    const context = ImportProjectContextAdapter.createPipelineContext({ relContext:projectRelationshipContext, projectId:project.projectId, userId:authContext.userId, role:authContext.role, operationId:importBatch.operationId });
    return buildRosterCanonicalIntent(importBatch, context);
  }, [importBatch, projectRelationshipContext, project, authContext.userId, authContext.role]);

  // Accept only the exact review displayed. Refresh can change its semantic signature.
  const handleAcceptCanonicalIntent = async (signature: string, displacementSignature?: string) => {
    const requestContext = renderedContext;
    if (!project || !importBatch || isProcessing || !projectContext.isCurrent(requestContext, editingProjectId)) return;
    const generation = rosterImportSessionGenerationRef.current;
    setIsProcessing(true);
    setSmartImportCommitError(null);
    try {
      const fresh = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId) || generation !== rosterImportSessionGenerationRef.current) return;
      const ctx = ImportProjectContextAdapter.createPipelineContext({relContext:fresh, projectId:project.projectId, userId:authContext.userId, role:authContext.role, operationId:importBatch.operationId});
      const revalidated = DriverTruckPipelineService.revalidateRosterBatch(importBatch,ctx);
      const intent = buildRosterCanonicalIntent(revalidated,ctx);
      setProjectRelationshipContext(fresh);
      setImportBatch(revalidated);
      if (intent.signature !== signature) { setSmartImportCommitError('RELATIONSHIP_CONTEXT_STALE'); return; }
      const reviewed = attachReviewedRosterIntent(revalidated,intent,displacementSignature);
      setImportBatch(reviewed);
      // Phase 8 consumes this explicit handoff. Do not send it to the raw-row intake committer.
    } catch (e: any) {
      if (projectContext.isCurrent(requestContext, editingProjectId)) setSmartImportCommitError(e.message || 'RELATIONSHIP_CONTEXT_UNAVAILABLE');
    } finally {
      if (projectContext.isCurrent(requestContext, editingProjectId)) setIsProcessing(false);
    }
  };

  // C5 Smart Import: Progression from Driver/Truck Resolution to Final Review
  const handleSmartImportContinueToFinalReview = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;

    // 1. Independent Re-check of CURRENT importBatch using RosterBatchReviewService
    const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
    const driverGroups = batchGroups.driver || [];
    const truckGroups = batchGroups.truck || [];
    const driverTruckGroups = [...driverGroups, ...truckGroups];

    if (driverTruckGroups.length === 0 && !projectRelationshipContext?.importResolution) {
      alert(presentBatch4Message(t('projects.batch4.final_review_groups_missing'), t));
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
      alert(presentBatch4Message(t('projects.batch4.final_review_pending'), t));
      return;
    }

    // 2. Fresh Revalidation before entering FINAL_REVIEW
    setIsProcessing(true);
    try {
      const freshContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      const intent = buildRosterCanonicalIntent(revalidated, pipelineCtx);
      setImportBatch({ ...revalidated });
      if (intent.blockers.length > 0) {
        setSmartImportCommitError('CANONICAL_INTENT_BLOCKED');
        return;
      }
      const persisted = await persistSmartImportCheckpoint({ batch: revalidated, stage: 'FINAL_REVIEW' });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!persisted) {
        if (currentGen === rosterImportSessionGenerationRef.current) {
          setIsProcessing(false);
        }
        return;
      }

      setImportBatch({ ...revalidated });
      transitionToRosterStage('FINAL_REVIEW');
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      console.error('Final review revalidation error:', err);
      alert(presentBatch4Message(err.message || t('projects.batch4.pre_review_check_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C5 Smart Import: Pre-flight Recheck & Guarded Commit Execution
  const handleSmartImportCommit = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || isCommittingImport || !project || !importBatch) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;

    if (smartImportCommitResult !== null && smartImportCommitResult.success) {
      setSmartImportCommitError(
        t('entityResolution.messages.already_committed')
      );
      return;
    }

    setIsCommittingImport(true);
    setIsProcessing(true);
    setSmartImportCommitError(null);

    try {
      // 1. Fetch fresh canonical RelationshipContext
      const freshContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        setSmartImportCommitError(t('projects.batch4.commit_preflight_pending'));
        setIsCommittingImport(false);
        return;
      }

      // 5. Execute Commit via DriverTruckPipelineService.commitBatch ONLY
      const { batch: committedBatch, result } = await DriverTruckPipelineService.commitBatch(revalidated, pipelineCtx);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (currentGen !== rosterImportSessionGenerationRef.current || importBatch?.importBatchId !== currentBatchId) return;

      // Canonical Setup handoff; import stage/checkpoint ownership stays unchanged.
      try {
        const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
      } catch {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        setProjectDataLoadError(t('setup.errors.refresh'));
      }

      // 6. Store result and batch without clearing
      setImportBatch({ ...committedBatch });
      setSmartImportCommitResult(result);
      transitionToRosterStage('COMMIT_RESULT');

      // 7. Unit 3A.1a Durable Checkpoint on Commit Result (COMMITTED or retryable FAILED)
      const isFullSuccess = result.success && (result.failedRows || 0) === 0;
      const targetLifecycle = isFullSuccess ? 'COMMITTED' : 'FAILED';
      const persisted = await persistSmartImportCheckpoint({
        batch: committedBatch,
        commitResult: result,
        stage: 'COMMIT_RESULT',
        lifecycleState: targetLifecycle,
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (!persisted) {
        if (isFullSuccess) {
          setSmartImportCommitError(t('projects.messages.checkpoint_full_failure'));
        } else {
          setSmartImportCommitError(t('projects.messages.checkpoint_partial_failure'));
        }
      }

    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      console.error('Commit execution error:', err);
      setSmartImportCommitError(err.message || t('projects.batch4.commit_execution_failed'));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsCommittingImport(false);
        setIsProcessing(false);
      }
    }
  };

  // C5 Smart Import: Final Review Blocker / Back Navigation Strategy (D14, D17)
  const handleFinalReviewBack = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch) {
      transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
      return;
    }

    const returningBatch = {...importBatch, commitStatus:'AWAITING_REVIEW' as const, metadata:{...importBatch.metadata, reviewedCanonicalIntent:undefined}};
    setImportBatch(returningBatch);
    const blockerType = classifyFinalReviewBlocker(importBatch);

    if (blockerType === 'CARRIER') {
      const confirmed = window.confirm(
        t('projects.batch4.carrier_reanalysis_confirmation')
      );
      if (confirmed) {
        const cancelled = await handleCancelRosterImport();
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        if (!cancelled) {
          return;
        }
      }
      return;
    }

    if (blockerType === 'MATERIAL') {
      const persisted = await persistSmartImportCheckpoint({ batch:returningBatch, stage: 'MATERIAL_RESOLUTION' });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!persisted) return;
      transitionToRosterStage('MATERIAL_RESOLUTION');
      return;
    }

    // DRIVER/TRUCK OWNED BLOCKER OR NORMAL BACK
    const persisted = await persistSmartImportCheckpoint({ batch:returningBatch, stage: 'DRIVER_TRUCK_RESOLUTION' });
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    if (!persisted) return;
    transitionToRosterStage('DRIVER_TRUCK_RESOLUTION');
  };

  // C2 Smart Import: Accept Carrier Candidate
  const handleSmartImportCarrierAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.carrier_decision_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.carrier_alternative_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C2 Smart Import: Carrier Creation via Authoritative CarrierEditorModal


  // C3 Smart Import: Accept Material Candidate
  const handleSmartImportMaterialAcceptCandidate = async (
    group: RosterEntityReviewGroup,
    candidateEntityId: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.material_decision_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (isProcessing || !importBatch || !project) return;
    const currentGen = rosterImportSessionGenerationRef.current;
    const currentBatchId = importBatch.importBatchId;
    setIsProcessing(true);
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      await persistSmartImportCheckpoint({ batch: updated });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen !== rosterImportSessionGenerationRef.current) return;
      alert(presentBatch4Message(err.message || t('projects.batch4.material_alternative_failed'), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (currentGen === rosterImportSessionGenerationRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // C3 Smart Import: Material Creation via Authoritative MaterialEditorModal


  const handleApplyResolutionDecision = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidateId?: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch || !project) return;
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(err.message || 'فشل تطبيق قرار المطابقة');
    }
  };

  const handleApplyGroupedResolutionDecision = async (
    entityTypeKey: ReviewGroupEntityType,
    normalizedSourceKey: string,
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidateId?: string
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch || !project) return;
    try {
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(err.message || 'فشل تطبيق قرار المطابقة الجماعي');
    }
  };

  const handleGroupedCreateMissingEntity = async (
    group: any
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!importBatch || !project) return;
    const { entityType, normalizedSourceKey, sourceValue } = group;
    try {
      // 1. Fetch & validate canonical relationship context FIRST before prompt or create
      const relContext = await loadImportResolutionContext(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!project) return;
    try {
      const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
    } catch (err) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      console.warn('Failed reloading project canonical data:', err);
    }
  };

  const handleCreateMissingEntity = async (
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material'
  ) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(err.message || 'فشل إنشاء الكيان المفقود');
    }
  };

  // Confirm and Commit the Import Roster Batch
  const handleCommitRosterImport = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!project || !importBatch || !canPerformOperationalMutation('COMMIT_ROSTER_BATCH', project.status)) return;
    if ((importBatch.requiresReviewRows || 0) > 0 || importBatch.rows.some((r: any) => r.reviewStatus === 'requires_review' || r.reviewStatus === 'error')) {
      alert(isRTL ? 'لا يمكن اعتماد الاستيراد: توجد صفوف تتطلب مراجعة أو حل كيانات معلقة' : 'Cannot commit: import batch contains unresolved review rows');
      return;
    }
    setIsCommittingImport(true);

    try {
      let relContext = null;
      try {
        relContext = await loadImportResolutionContext(project.projectId);
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      } catch (relErr) {
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      if (result.success && result.failedRows === 0) {
        alert(isRTL ? `تم تأكيد واستيراد سجل التشغيل بنجاح (${result.committedRows} صفوف)` : `Successfully committed batch (${result.committedRows} rows)`);
        setImportBatch(null);
        await reloadProjectCanonicalData();
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      } else {
        alert(isRTL ? `فشل جزئي أو كلي في اعتماد الاستيراد. تم اعتماد: ${result.committedRows}, فشل: ${result.failedRows}` : `Partial or failed commit. Committed: ${result.committedRows}, Failed: ${result.failedRows}`);
        setImportBatch({ ...committedBatch });
      }
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(err.message || 'خطأ في اعتماد واستيراد السجل');
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setIsCommittingImport(false);
    }
  };

  // Sync Roster from Project's Google Sheets (Non-destructive pending convergence message)
  const handleSyncRosterFromSheet = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    alert(presentBatch4Message(t('projects.batch4.sheets_integration_pending'), t));
  };

  // Phase 3: Add Pricing Rule
  const handleAddPricingRule = async (e: React.FormEvent) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const response = await fetch(`/api/projects/${project.projectId}/pricing-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!response.ok) {
        const errorData = await response.json();
        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
        throw new Error(errorData.error || t('projects.batch4.pricing_add_failed'));
      }
      setIsAddingPricing(false);
      setPriceRate(0);
      setPriceNotes('');
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(presentBatch4Message(err.message || t('projects.batch4.pricing_add_failed'), t));
    }
  };

  // Phase 5: Transition Project Setup Status (Canonical governance rules)
  const handleTransitionStatus = async (nextStatus: ProjectEntity['status']) => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!project) return;
    setIsTransitioning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const res = await fetch(`/api/projects/${project.projectId}/lifecycle-transition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetStatus: nextStatus }),
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const data = await res.json();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!res.ok) {
        throw Object.assign(new Error('PROJECT_TRANSITION_FAILED'), { code: data.code });
      }
      alert(presentBatch4Message(t('projects.batch4.project_status_success', { status: nextStatus }), t));
      await fetchServerReadiness(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (err: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(t(err.code === 'PROJECT_SETUP_NOT_READY' ? 'readiness.reviewBlocked' : 'setup.errors.failed'));
      await fetchServerReadiness(project.projectId);
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      setIsTransitioning(false);
    }
  };

  const handleActivateProject = async () => {
    const requestContext = renderedContext;
    if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

    if (!project) return;
    setIsActivating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const response = await fetch(`/api/projects/${project.projectId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      const data = await response.json();
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
      if (!response.ok) {
        throw new Error(data.error || t('projects.batch4.activation_failed'));
      }
      alert(presentBatch4Message(t('projects.batch4.activation_success'), t));
      await fetchServerReadiness(project.projectId);
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
    } catch (error: any) {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

      alert(presentBatch4Message(t('projects.batch4.activation_error', { error: presentBatch4Message(String(error.message), t) }), t));
    } finally {
      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
                <span>{t('projects.batch4.setup_dashboard_title')}</span>
              </h1>
              <p className="text-xs text-stone-400">
                {t('projects.batch4.setup_dashboard_description')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder={t('projects.batch4.search_projects')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-950 border border-stone-800 px-4 py-2 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
              <button
                onClick={() => setIsCreatingNew(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('navigation.labels.provision_new_project')}</span>
              </button>
            </div>
          </div>

          {/* New Project Dialog */}
          {isCreatingNew && (
            <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleCreateProject} className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">{t('projects.batch4.create_project_stage_one')}</h3>
                  <button type="button" onClick={() => setIsCreatingNew(false)} className="p-1 text-stone-400 hover:text-white rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-stone-300">
                  {creationError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{presentBatch4Message(creationError, t)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.project_full_arabic_name')}</label>
                      <input 
                        type="text" required value={newProjNameAr} onChange={(e) => setNewProjNameAr(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.beneficiary_company')}</label>
                      <input 
                        type="text" required value={newProjClient} onChange={(e) => setNewProjClient(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.field_location')}</label>
                      <input 
                        type="text" required value={newProjLocation} onChange={(e) => setNewProjLocation(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.operational_start_date')}</label>
                      <input 
                        type="date" required value={newProjStartDate} onChange={(e) => setNewProjStartDate(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.project_zatca_number')}</label>
                      <input 
                        type="text" maxLength={15} value={newProjZatca} onChange={(e) => setNewProjZatca(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono font-bold"
                        placeholder={t('projects.batch4.fifteen_tax_digits')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-bold">{t('projects.batch4.vat_percent')}</label>
                      <input 
                        type="number" min={0} max={100} value={newProjVatRate} onChange={(e) => setNewProjVatRate(Number(e.target.value))}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-stone-400 font-bold">{t('projects.batch4.scope_and_details')}</label>
                    <textarea 
                      value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full h-24 bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded-xl font-medium leading-relaxed">
                    {t('projects.batch4.server_generated_identifiers_note')}
                  </div>
                </div>

                <div className="p-5 border-t border-stone-800 bg-stone-950 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreatingNew(false)} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors">
                    {t('shared.actions.cancel')}
                  </button>
                  <button type="submit" disabled={isSubmittingCreation} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-2">
                    {isSubmittingCreation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{t('projects.batch4.create_project')}</span>
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
                <h3 className="text-sm font-black text-white">{t('projects.batch4.no_setup_projects')}</h3>
                <p className="text-xs text-stone-400">{t('projects.batch4.create_first_project_hint')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {setupProjects.map((p) => {

                return (
                  <div key={p.projectId} className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col justify-between hover:border-stone-700 transition-all shadow-md overflow-hidden relative group">
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        p.status === 'READY_FOR_REVIEW' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                        'bg-stone-950 text-stone-500 border-stone-800'
                      }`}>
                        {t(PROJECT_STATUS_KEYS[p.status] || 'setup.status.MISSING')}
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
                          <span className="block text-stone-500 text-[10px]">{t('projects.batch4.beneficiary_client')}</span>
                          <span className="font-bold text-stone-200 block truncate">{p.clientName}</span>
                        </div>
                        <div>
                          <span className="block text-stone-500 text-[10px]">{t('projects.batch4.start_date')}</span>
                          <span className="font-mono text-stone-200 block truncate">{p.startDate || '—'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-400">{t('readiness.openToEvaluate')}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500">
                        {p.location?.addressAr || t('analytics.ui.kingdom_of_saudi_arabia')}
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
                        <span>{t('projects.batch4.continue_setup')}</span>
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
            <div className="p-3 border-b border-stone-800 space-y-1 text-center lg:text-start">
              <button
                onClick={() => {
                  setEditingProjectId(null);
                  onSelectProject?.(null);
                }}
                className="text-[10px] font-bold text-amber-500 hover:underline flex items-center gap-1 mx-auto lg:mx-0"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('projects.batch4.back_to_projects')}</span>
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
                    className={`w-full p-3 rounded-xl text-start flex items-center gap-3 transition-all ${
                      isActive 
                        ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                        : 'hover:bg-stone-850 text-stone-400 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-500'}`} />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black block">{batch4LayerLabel(t, layer.id, layer.labelAr)}</span>
                      <span className="text-[9px] text-stone-500 font-mono block">{t('projects.batch4.layer')} {layer.ordinal} • {layer.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {navigationError && (
              <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-400 text-[10px] font-bold flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{presentBatch4Message(navigationError, t)}</span>
              </div>
            )}
          </div>

          {/* Staged Panel Content */}
          <div className="lg:col-span-9 min-w-0 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-6 min-h-[500px]">
            {/* Panel Phase Header */}
            <div className="border-b border-stone-800 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-600/15 text-amber-500 text-xs font-mono font-black rounded-lg flex items-center justify-center">
                    {PROJECT_SETUP_LAYERS.findIndex(l => l.id === activeSetupLayer) + 1}
                  </span>
                  <span>
                    {activeSetupLayer === 'FOUNDATION' && t('projects.batch4.layer_foundation')}
                    {activeSetupLayer === 'WORKSPACE' && t('projects.batch4.layer_workspace')}
                    {activeSetupLayer === 'MATERIALS' && t('projects.batch4.layer_materials')}
                    {activeSetupLayer === 'CARRIERS' && t('projects.batch4.layer_carriers')}
                    {activeSetupLayer === 'ROSTER' && t('projects.batch4.layer_roster')}
                    {activeSetupLayer === 'PRICING' && t('projects.batch4.layer_pricing')}
                    {activeSetupLayer === 'ACCESS' && t('projects.batch4.layer_access')}
                    {activeSetupLayer === 'REVIEW_ACTIVATION' && t('projects.batch4.layer_activation')}
                  </span>
                </h2>
              </div>

              {isCoreSetupLocked && (
                <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded-xl font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('projects.batch4.editing_locked')}</span>
                </span>
              )}
            </div>

            {/* Lightweight loading state for project data */}
            {isProjectDataLoading && activeSetupLayer !== 'FOUNDATION' && (
              <div className="p-8 bg-stone-950/60 border border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-stone-400 font-bold text-xs">{t('projects.batch4.loading_canonical_project')}</span>
              </div>
            )}

            {projectDataLoadError && project && <div role="alert" className="rounded-xl border border-amber-800 p-3">
              <p>{t('setup.errors.read')}</p>
              <button onClick={async () => {
                const request = renderedContext;
                if (!projectContext.isCurrent(request, project.projectId)) return;
                try {
                  const snapshot = await projectCanonicalRefreshService.refresh(project.projectId);
                  if (!projectContext.isCurrent(request, project.projectId)) return;
                  applyCanonicalSnapshot(project.projectId, snapshot, request.generation);
                  setProjectDataLoadError(null);
                } catch { if (projectContext.isCurrent(request, project.projectId)) setProjectDataLoadError(t('setup.errors.read')); }
              }}>{t('setup.retry')}</button>
            </div>}

            {/* ================= LAYER 1: FOUNDATION ================= */}
            {activeSetupLayer === 'FOUNDATION' && project && (
              <div className="space-y-6 text-xs text-stone-300">
                {/* Project details card */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <h3 className="font-black text-white text-[13px]">{t('projects.batch4.project_details')}</h3>
                    {!isCoreSetupLocked && (
                      <div>
                        {!isEditingFoundation ? (
                          <button
                            type="button"
                            onClick={handleEnterFoundationEdit}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t('projects.batch4.edit_data')}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveFoundation}
                              disabled={(!isFoundationDirty && !foundationNeedsRefresh) || isSavingFoundation}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              {isSavingFoundation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>{t(foundationNeedsRefresh ? 'setup.retry' : 'shared.actions.save')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelFoundationEdit}
                              disabled={isSavingFoundation || foundationNeedsRefresh}
                              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{t('shared.actions.cancel')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {foundationSaveSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{foundationSaveSuccess}</span>
                    </div>
                  )}

                  {foundationSaveError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{presentBatch4Message(foundationSaveError, t)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">{t('dashboard.labels.project')}</label>
                      <input 
                        type="text" 
                        value={isEditingFoundation ? (foundationDraft?.nameAr ?? '') : (project.nameAr || '')} 
                        disabled={foundationNeedsRefresh || !isEditingFoundation || isCoreSetupLocked || isSavingFoundation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoundationDraft(prev => prev ? ({ ...prev, nameAr: val }) : null);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">{t('projects.batch4.beneficiary_client')}</label>
                      <input 
                        type="text" 
                        value={isEditingFoundation ? (foundationDraft?.clientName ?? '') : (project.clientName || '')} 
                        disabled={foundationNeedsRefresh || !isEditingFoundation || isCoreSetupLocked || isSavingFoundation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoundationDraft(prev => prev ? ({ ...prev, clientName: val }) : null);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">{t('projects.batch4.field_site')}</label>
                      <input 
                        type="text" 
                        value={isEditingFoundation ? (foundationDraft?.addressAr ?? '') : (project.location?.addressAr || '')} 
                        disabled={foundationNeedsRefresh || !isEditingFoundation || isCoreSetupLocked || isSavingFoundation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoundationDraft(prev => prev ? ({ ...prev, addressAr: val }) : null);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">{t('analytics.ui.zatca_tax_number')}</label>
                      <input 
                        type="text" 
                        maxLength={15} 
                        value={isEditingFoundation ? (foundationDraft?.zatcaTaxNumber ?? '') : (project.settings?.zatcaTaxNumber || '')} 
                        disabled={foundationNeedsRefresh || !isEditingFoundation || isCoreSetupLocked || isSavingFoundation}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFoundationDraft(prev => prev ? ({ ...prev, zatcaTaxNumber: val }) : null);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">{t('projects.batch4.operational_start_date')}</label>
                      <input 
                        type="date" 
                        value={isEditingFoundation ? (foundationDraft?.startDate ?? '') : (project.startDate || '')} 
                        disabled={foundationNeedsRefresh || !isEditingFoundation || isCoreSetupLocked || isSavingFoundation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoundationDraft(prev => prev ? ({ ...prev, startDate: val }) : null);
                        }}
                        className="w-full bg-stone-900 border border-stone-800 text-white px-3 py-2 rounded-xl focus:outline-hidden font-mono disabled:opacity-60"
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
                    <h3 className="font-black text-white text-[13px]">{t('projects.batch4.workspace_sync_status')}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      project.settings?.googleSpreadsheetId ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {project.settings?.googleSpreadsheetId ? t('entityResolution.labels.complete') : t('projects.batch4.awaiting_workspace_setup')}
                    </span>
                  </div>

                  {syncNotice && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      syncNotice.type === 'success' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{presentBatch4Message(syncNotice.text, t)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-stone-400">
                    <div>
                      <span className="block text-stone-500 font-bold">{t('projects.batch4.trip_spreadsheet_id')}</span>
                      <span className="font-mono text-stone-200 block truncate">{project.settings?.googleSpreadsheetId || t('projects.batch4.not_configured')}</span>
                    </div>
                    <div>
                      <span className="block text-stone-500 font-bold">{t('projects.batch4.project_root_folder_id')}</span>
                      <span className="font-mono text-stone-200 block truncate">{project.settings?.googleDriveFolderId || t('projects.batch4.not_configured')}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSyncGoogleWorkspace}
                      disabled={isSyncingGoogle}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSyncingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderSync className="w-4 h-4" />}
                      <span>{project.settings?.googleSpreadsheetId && project.settings?.googleDriveFolderId ? t('projects.labels.update_workspace_sync') : t('projects.labels.initialize_workspace_sync')}</span>
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
                    <h3 className="font-black text-white text-[13px]">{t('projects.batch4.layer_materials')}</h3>
                    {isOperationallyMutable && (
                      <button
                        onClick={() => setIsAddingMaterial(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('projects.batch4.add_material')}</span>
                      </button>
                    )}
                  </div>

                  {/* Reusable Material Creation Modal */}
                  <MaterialEditorModal
                    key={`1:${project.projectId}:${renderedContext.generation}`}
                    isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                    open={isAddingMaterial}
                    projectId={project.projectId}
                    onClose={() => setIsAddingMaterial(false)}
                    onCreated={async (result) => {
                      const requestContext = renderedContext;
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

                      const snapshot = await projectCanonicalRefreshService.refresh(
                        project.projectId,
                        { expect: { materialId: result.materialId } }
                      );
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                      applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
                    }}
                  />

                  {/* Smart Import Dedicated Material Creation Modal */}

                  {editingMaterial && (
                    <MaterialEditorModal
                    key={`3:${project.projectId}:${renderedContext.generation}:${editingMaterial?.materialId}`}
                    isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
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
                        const requestContext = renderedContext;
                        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
                        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                        applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
                        setEditingMaterial(null);
                      }}
                    />
                  )}

                  {materials.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">{t('projects.batch4.no_project_materials')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">{t('projects.batch4.material_id')}</th>
                            <th className="pb-2">{t('projects.batch4.name')}</th>
                            <th className="pb-2">{t('projects.batch4.code')}</th>
                            <th className="pb-2">{t('materials.labels.txt_252118')}</th>
                            <th className="pb-2">{t('projects.batch4.default_density')}</th>
                            <th className="pb-2 text-center">{t('admin_console.col_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m) => (
                            <tr key={m.materialId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{m.materialId}</td>
                              <td className="py-2.5">{m.nameAr || (m as any).name}</td>
                              <td className="py-2.5 font-mono">{m.code}</td>
                              <td className="py-2.5">{m.unitOfMeasure}</td>
                              <td className="py-2.5 font-mono">{m.standardDensityTonPerM3 || 1.6} {t('projects.batch4.ton_per_cubic_meter')}</td>
                              <td className="py-2.5 text-center">
                                {isOperationallyMutable && authContext.role === 'SUPER_ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingMaterial(m)}
                                    className="p-1 px-2 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                                    title={t('materials.labels.editMaterial')}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{t('shared.actions.edit')}</span>
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
                    <h3 className="font-black text-white text-[13px]">{t('projects.batch4.project_approved_carriers')}</h3>
                    {isOperationallyMutable && (
                      <button
                        onClick={() => setIsCarrierEditorOpen(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('projects.labels.add_carrier')}</span>
                      </button>
                    )}
                  </div>

                  <CarrierEditorModal
                    key={`4:${project.projectId}:${renderedContext.generation}`}
                    isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                    open={isCarrierEditorOpen}
                    mode="CREATE"
                    projectId={project.projectId}
                    onClose={() => setIsCarrierEditorOpen(false)}
                    onCreated={async (result) => {
                      const requestContext = renderedContext;
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

                      const snapshot = await projectCanonicalRefreshService.refresh(
                        project.projectId,
                        { expect: { carrierId: result.carrierId } }
                      );
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                      applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
                      setIsCarrierEditorOpen(false);
                    }}
                  />

                  {/* Smart Import Dedicated Carrier Creation Modal */}

                  {/* Smart Import Dedicated Material Creation Modal (D02: Reachable in Phase 2) */}

                  {editingCarrier && (
                    <CarrierEditorModal
                    key={`7:${project.projectId}:${renderedContext.generation}:${editingCarrier?.carrierId}`}
                    isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                      open={!!editingCarrier}
                      mode="EDIT"
                      projectId={project.projectId}
                      initialCarrier={editingCarrier}
                      onClose={() => setEditingCarrier(null)}
                      onUpdated={async (result) => {
                        const requestContext = renderedContext;
                        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

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
                        if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                        applyCanonicalSnapshot(project.projectId, snapshot, requestContext.generation);
                        setEditingCarrier(null);
                      }}
                    />
                  )}

                  {carriers.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">{t('projects.batch4.no_project_carriers')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">{t('projects.batch4.carrier_id')}</th>
                            <th className="pb-2">{t('projects.batch4.company_name')}</th>
                            <th className="pb-2">{t('projects.batch4.commercial_registration')}</th>
                            <th className="pb-2">{t('projects.batch4.tga_permit_number')}</th>
                            <th className="pb-2">{t('admin_console.col_email')}</th>
                            <th className="pb-2 text-center">{t('trips.labels.txt_1309b3')}</th>
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
                                {isOperationallyMutable && authContext.role === 'SUPER_ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCarrier(c)}
                                    className="p-1 px-2 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{t('shared.actions.edit')}</span>
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
                <FleetSetupWorkspace key={`${project.projectId}:${renderedContext.generation}`} projectId={project.projectId}
                  revision={canonicalRevision} mutable={isOperationallyMutable}
                  isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                  apply={snapshot => applyCanonicalSnapshot(project.projectId, snapshot, renderedContext.generation)} />
                {/* Unified Import Pipeline Roster section */}
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-800 pb-2 gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-white text-[13px]">{t('projects.batch4.unified_roster')}</h3>
                      <p className="text-[10px] text-stone-500">{t('projects.batch4.roster_description')}</p>
                    </div>

                    {isOperationallyMutable && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => { manualSession.resetCompleted(); setIsAddingRosterRow(true); setManualPreview(null); setManualConfirmed(false); }}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-stone-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('projects.batch4.manual_add')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsSmartImportOpen(true);
                            transitionToRosterStage('SOURCE_DISCOVERY');
                          }}
                          className="px-3 py-1.5 bg-stone-900 border border-stone-850 text-amber-500 hover:text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>{t('projects.batch4.import_file')}</span>
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
                          <span>{t('projects.batch4.sync_google_sheet')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Add Roster Row form */}
                  {isAddingRosterRow && (
                    <form onSubmit={handleAddRosterManual} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <fieldset disabled={manualBusy || manualSession.committed} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.driver_two_part_name')}</label>
                          <input type="text" required value={rostDriverName} onChange={(e) => setRostDriverName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.mobile_saudi_prefix')}</label>
                          <input type="text" required value={rostPhone} onChange={(e) => setRostPhone(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.truck_plate')}</label>
                          <input type="text" required value={rostPlate} onChange={(e) => setRostPlate(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('entityResolution.labels.residency_identifier')}</label>
                          <input type="text" value={rostResidency} onChange={(e) => setRostResidency(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.assigned_carrier')}</label>
                          <select required value={rostCarrier} onChange={(e) => setRostCarrier(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="">{t('projects.batch4.choose_carrier')}</option>
                            {carriers.filter(c => (c as any).isActive).map(c => <option key={c.carrierId} value={c.carrierId}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.usual_material')}</label>
                          <select required value={rostMaterial} onChange={(e) => setRostMaterial(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="">{t('projects.batch4.choose_material')}</option>
                            {materials.filter(m => (m as any).isActive).map(m => <option key={m.materialId} value={m.materialId}>{(m as any).name}</option>)}
                          </select>
                        </div>
                      </div>

                      </fieldset>
                      {manualPreview && <div className="rounded-lg border border-amber-700 p-3 space-y-2">
                        <p>{t('setup.displacement')}</p>
                        {manualPreview.assignments.map((r: any) => <p key={r.assignmentId}>{r.driverId} → {r.truckId}</p>)}
                        {manualPreview.allocation && <p>{manualPreview.allocation.materialId} → {rostMaterial}</p>}
                        <p>{t('setup.requested')}: {rostDriverName} → {rostPlate}</p>
                        <label><input type="checkbox" checked={manualConfirmed} onChange={e => setManualConfirmed(e.target.checked)} disabled={manualBusy || manualSession.committed} />{t('setup.confirmDisplacement')}</label>
                      </div>}
                      {manualError && <p role="alert">{t(manualError)} {t('setup.useExplicit')}</p>}
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingRosterRow(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">{t('shared.actions.cancel')}</button>
                        <button type="submit" disabled={manualBusy} className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">{t(manualSession.committed ? 'setup.retry' : manualBusy ? 'shared.status.loading' : 'projects.batch4.register_and_save')}</button>
                      </div>
                    </form>
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
                      <span>{t('projects.batch4.active_tariff_overlap')}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[10px] leading-relaxed">
                      {pricingConflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <div>
                      <h3 className="font-black text-white text-[13px]">{t('projects.batch4.pricing_agreements')}</h3>
                      <p className="text-[10px] text-stone-500">{t('projects.batch4.pricing_agreements_description')}</p>
                    </div>

                    {isOperationallyMutable && (
                      <button
                        onClick={() => setIsAddingPricing(true)}
                        className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('projects.batch4.add_tariff')}</span>
                      </button>
                    )}
                  </div>

                  {isAddingPricing && (
                    <form onSubmit={handleAddPricingRule} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('analytics.column.concerned_carrier')}</label>
                          <select required value={priceCarrierId} onChange={(e) => setPriceCarrierId(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="ALL">{t('projects.batch4.all_approved_carriers_tariff')}</option>
                            {carriers.map(c => <option key={c.carrierId} value={c.carrierId}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.target_material')}</label>
                          <select required value={priceMaterialId} onChange={(e) => setPriceMaterialId(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="ALL_MATERIALS">{t('projects.batch4.all_authorized_materials')}</option>
                            {materials.map(m => <option key={m.materialId} value={m.materialId}>{m.nameAr}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('analytics.column.pricing_model')}</label>
                          <select required value={priceModel} onChange={(e) => setPriceModel(e.target.value as any)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-bold"
                          >
                            <option value="PER_TRIP">{t('operations.per_trip_per_trip')}</option>
                            <option value="PER_TON">{t('operations.per_ton_per_ton')}</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.base_rate_sar')}</label>
                          <input type="number" min={0} step={0.01} required value={priceRate} onChange={(e) => setPriceRate(Number(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.effective_from')}</label>
                          <input type="date" required value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-stone-400 font-bold">{t('projects.batch4.expires_optional')}</label>
                          <input type="date" value={priceTo} onChange={(e) => setPriceTo(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold">{t('projects.batch4.contract_notes')}</label>
                        <input type="text" value={priceNotes} onChange={(e) => setPriceNotes(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 text-white px-2 py-1.5 rounded-lg focus:outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddingPricing(false)} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">{t('shared.actions.cancel')}</button>
                        <button type="submit" className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">{t('projects.batch4.save_tariff')}</button>
                      </div>
                    </form>
                  )}

                  {pricingRules.length === 0 ? (
                    <p className="text-center text-stone-500 py-6">{t('projects.batch4.no_pricing_agreements')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start">
                        <thead>
                          <tr className="border-b border-stone-800/80 text-stone-500 font-black">
                            <th className="pb-2">{t('projects.batch4.rule_id')}</th>
                            <th className="pb-2">{t('analytics.column.concerned_carrier')}</th>
                            <th className="pb-2">{t('projects.batch4.target_material')}</th>
                            <th className="pb-2">{t('projects.batch4.model')}</th>
                            <th className="pb-2">{t('projects.batch4.tariff_sar')}</th>
                            <th className="pb-2">{t('operations.valid_from')}</th>
                            <th className="pb-2">{t('projects.batch4.valid_until')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingRules.map((r) => (
                            <tr key={r.pricingRuleId} className="border-b border-stone-850 text-stone-300 font-semibold">
                              <td className="py-2.5 font-mono">{r.pricingRuleId}</td>
                              <td className="py-2.5 font-bold">
                                {r.carrierId ? (carriers.find(c => c.carrierId === r.carrierId)?.name || r.carrierId) : t('dashboard.all_carriers')}
                              </td>
                              <td className="py-2.5">
                                {r.materialId ? (materials.find(m => m.materialId === r.materialId)?.nameAr || r.materialId) : t('projects.batch4.all_approved_materials')}
                              </td>
                              <td className="py-2.5">{r.pricingModel === 'PER_TRIP' ? t('field_operations.pricing_per_trip') : t('field_operations.pricing_per_ton')}</td>
                              <td className="py-2.5 font-mono text-emerald-400">{r.baseRateSAR} {t('shared.units.sar')}</td>
                              <td className="py-2.5 font-mono">{r.effectiveFrom}</td>
                              <td className="py-2.5 font-mono">{r.effectiveTo || t('projects.batch4.open_ended')}</td>
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
              <ProjectAccessView key={project.projectId} projectId={project.projectId} />
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
                          {t('readiness.title')}
                        </h3>
                        <p className="text-[11px] text-stone-400">
                          {t('readiness.separation')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchServerReadiness(project.projectId)}
                      disabled={isLoadingReadiness}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-750 text-stone-300 rounded-lg flex items-center gap-1.5 transition-all text-[11px] disabled:opacity-50"
                      title={t('projects.batch4.recheck_readiness')}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReadiness ? 'animate-spin text-amber-500' : 'text-stone-400'}`} />
                      <span>{isLoadingReadiness ? t('legacyMigration.labels.running_checks') : t('projects.batch4.refresh_readiness')}</span>
                    </button>
                  </div>

                  {isLoadingReadiness ? (
                    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl text-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                      <p className="text-stone-400">{t('projects.batch4.readiness_checking')}</p>
                    </div>
                  ) : readinessError ? (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center gap-3 text-rose-300">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold block">{t('projects.batch4.readiness_unavailable')}</span>
                        <span className="text-[11px] opacity-80">{presentBatch4Message(readinessError, t)}</span>
                      </div>
                    </div>
                  ) : serverReadiness ? (
                    <SetupReadinessPanel result={serverReadiness} onAction={action => {
                      if (action === 'RETRY_READINESS') { void fetchServerReadiness(project.projectId); return; }
                      const layers = { OPEN_FOUNDATION: 'FOUNDATION', OPEN_CARRIERS: 'CARRIERS', OPEN_MATERIALS: 'MATERIALS', OPEN_ROSTER: 'ROSTER' } as const;
                      attemptProjectSetupLayerNavigation(layers[action]);
                    }} />
                  ) : (
                    <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-400 text-center">
                      {t('projects.batch4.readiness_refresh_hint')}
                    </div>
                  )}
                </div>

                {/* 3. Governance and Lifecycle Controller */}
                <div className="bg-stone-950 border border-stone-850 p-6 rounded-2xl text-center space-y-6 max-w-xl mx-auto shadow-lg">
                  <div className="space-y-2">
                    <span className="text-stone-500 font-mono font-bold block">{t('projects.batch4.project_governance_cycle')}</span>
                    <div className="flex justify-center gap-2 items-center text-xs font-black">
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'SETUP' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>{t(PROJECT_STATUS_KEYS['SETUP'])}</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'READY_FOR_REVIEW' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>{t(PROJECT_STATUS_KEYS['READY_FOR_REVIEW'])}</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'APPROVED' ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500'}`}>{t(PROJECT_STATUS_KEYS['APPROVED'])}</span>
                      <span className="text-stone-700">➔</span>
                      <span className={`px-2 py-0.5 rounded-md ${(project.status as any) === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-stone-500'}`}>{t(PROJECT_STATUS_KEYS['ACTIVE'])}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-stone-400 leading-relaxed text-[11px] max-w-md mx-auto">
                      {t('projects.batch4.activation_requires')} <span className="font-bold text-white">{t(PROJECT_STATUS_KEYS['ACTIVE'])}</span> {t('projects.batch4.activation_governance_requirements')}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {(project.status as any) === 'SETUP' && (
                        <button
                          onClick={() => handleTransitionStatus('READY_FOR_REVIEW' as any)}
                          disabled={isTransitioning || isLoadingReadiness || !serverReadiness?.setup.ready || foundationNeedsRefresh || isSavingFoundation || Boolean(projectDataLoadError) || !(authContext.role === 'SUPER_ADMIN' || authContext.role === 'PROJECT_ADMIN' && authContext.assignedProjectIds?.includes(project.projectId))}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50"
                        >
                          {isTransitioning ? t('projects.batch4.submitting_review') : t('projects.batch4.submit_review')}
                        </button>
                      )}

                      {(project.status as any) === 'READY_FOR_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleTransitionStatus('SETUP' as any)}
                            disabled={isTransitioning}
                            className="px-4 py-2 bg-rose-900/50 border border-rose-800 text-rose-300 font-black rounded-xl transition-all disabled:opacity-50"
                          >
                            {t('projects.batch4.reject_for_revision')}
                          </button>
                          <button
                            onClick={() => handleTransitionStatus('APPROVED' as any)}
                            disabled={isTransitioning}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
                          >
                            {isTransitioning ? t('projects.batch4.approving_setup') : t('projects.batch4.approve_setup')}
                          </button>
                        </>
                      )}

                      {(project.status as any) === 'APPROVED' && (
                        <div className="flex flex-col items-center gap-2">
                          <button type="button" onClick={() => handleTransitionStatus('SETUP' as any)} disabled={isTransitioning || isActivating}
                            className="rounded-lg border border-stone-700 px-4 py-2 text-stone-300 disabled:opacity-50">{t('setup.closure.returnToSetup')}</button>
                          <button
                            onClick={handleActivateProject}
                            disabled={!serverReadiness?.ready || !serverReadiness?.lifecycle.ready || !serverReadiness?.setup.ready || !serverReadiness?.operational.ready || isActivating || isLoadingReadiness || foundationNeedsRefresh || isSavingFoundation || Boolean(projectDataLoadError)}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>{isActivating ? t('projects.batch4.activating_project') : t('projects.batch4.activate_operations')}</span>
                          </button>
                          {!serverReadiness?.ready && (
                            <span className="text-[10px] text-rose-400 font-semibold">
                              {t('projects.batch4.activation_locked_hint')}
                            </span>
                          )}
                        </div>
                      )}

                      {(project.status as any) === 'ACTIVE' && (
                        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl text-emerald-400 font-black flex flex-col items-center gap-3">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                          <div className="space-y-1">
                            <span className="text-xs block">{t('projects.batch4.project_operational_active')}</span>
                            <span className="text-[10px] text-stone-500 font-mono block">{t('projects.batch4.setup_locked_success')}</span>
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
      {isSmartImportOpen && project && importBatch && smartImportPendingCarrierGroup && projectRelationshipContext && isSmartImportCarrierModalOpen && (<ContextualCanonicalCreation key={`Carrier:${project.projectId}:${renderedContext.generation}:${importBatch?.importBatchId}`} projectId={project.projectId} batch={importBatch!} group={smartImportPendingCarrierGroup!} context={projectRelationshipContext!} receipts={contextualReceipts} canMutate={authContext.role==='PROJECT_ADMIN'||authContext.role==='SUPER_ADMIN'} isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)} onClose={()=>{setIsSmartImportCarrierModalOpen(false);setSmartImportPendingCarrierGroup(null);}} onVerified={async(fresh,id,prerequisite,snapshot)=>{if(snapshot)applyCanonicalSnapshot(project.projectId,snapshot,renderedContext.generation);await applyCanonicalImportChoice(smartImportPendingCarrierGroup!,fresh,id,prerequisite);}}/>)}
      {isSmartImportOpen && project && importBatch && smartImportPendingMaterialGroup && projectRelationshipContext && isSmartImportMaterialModalOpen && (<ContextualCanonicalCreation key={`Material:${project.projectId}:${renderedContext.generation}:${importBatch?.importBatchId}`} projectId={project.projectId} batch={importBatch!} group={smartImportPendingMaterialGroup!} context={projectRelationshipContext!} receipts={contextualReceipts} canMutate={authContext.role==='PROJECT_ADMIN'||authContext.role==='SUPER_ADMIN'} isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)} onClose={()=>{setIsSmartImportMaterialModalOpen(false);setSmartImportPendingMaterialGroup(null);}} onVerified={async(fresh,id,prerequisite,snapshot)=>{if(snapshot)applyCanonicalSnapshot(project.projectId,snapshot,renderedContext.generation);await applyCanonicalImportChoice(smartImportPendingMaterialGroup!,fresh,id,prerequisite);}}/>)}
      {isSmartImportOpen && project && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex flex-col justify-center p-4 md:p-8 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-5xl w-full mx-auto my-auto shadow-2xl p-6 space-y-6 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header & 7-Stage Orientation Stepper */}
            <div className="space-y-4 shrink-0">
              <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-black text-white text-base">{t('projects.batch4.smart_roster_import')}</h3>
                    <p className="text-[10px] text-stone-400 font-bold">{t('projects.labels.smart_import_workflow')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelRosterImport}
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
                      <span>{batch4RosterStageLabel(t, def.stage, def.labelAr)}</span>
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
                      <h4 className="font-bold text-stone-200 text-sm">{t('projects.batch4.drop_roster_file')}</h4>
                      <p className="text-stone-500 text-xs">{t('projects.batch4.roster_file_formats')}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isDiscoveringRoster || isImportingFile}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isDiscoveringRoster ? t('projects.batch4.discovering_file') : t('projects.batch4.choose_device_file')}</span>
                    </button>
                  </div>

                  {isDiscoveringRoster && (
                    <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-stone-300 text-xs font-semibold">{t('projects.batch4.discovering_columns')}</p>
                    </div>
                  )}

                  {rosterDiscoveryError && (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>{presentBatch4Message(rosterDiscoveryError, t)}</span>
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
                        <label className="text-stone-400 font-bold block">{t('entityResolution.labels.worksheet')}</label>
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
                      <label className="text-stone-400 font-bold block">{t('projects.batch4.header_row_index')}</label>
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
                      <span className="font-bold text-stone-300 text-xs">{t('projects.batch4.map_canonical_columns')}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {Object.keys(rosterCustomMappings).length} {t('projects.batch4.discovered_columns')}
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-start text-xs">
                        <thead className="bg-stone-900/80 sticky top-0 border-b border-stone-800 text-stone-400 font-bold">
                          <tr>
                            <th className="p-2.5">{t('projects.batch4.source_column_name')}</th>
                            <th className="p-2.5">{t('projects.batch4.matched_canonical_field')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850">
                          {(rosterDiscoveryResult.detectedHeaders || []).map((header) => (
                            <tr key={header} className="hover:bg-stone-900/40">
                              <td className="p-2.5 font-semibold text-stone-200">{rosterDiscoveryResult.sourceColumns?.find(c => c.key === header)?.label || header}<small className="block font-mono text-stone-500">{header}</small></td>
                              <td className="p-2.5">
                                <select
                                  value={rosterCustomMappings[header] || 'unmapped'}
                                  onChange={(e) => handleRosterMappingChange(header, e.target.value as any)}
                                  className="w-full bg-stone-900 border border-stone-800 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-hidden"
                                >
                                  {ROSTER_CANONICAL_FIELD_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {batch4FieldLabel(t, opt.value, opt.labelAr)} ({opt.value})
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
                      <span>{presentBatch4Message(importError, t)}</span>
                    </div>
                  )}

                  {(rosterMappingIssue || rosterDiscoveryError) && <p role="alert" className="text-xs text-rose-300">{rosterDiscoveryError || t(rosterErrorKey(new RosterSourceError(rosterMappingIssue!)))}</p>}
                  {/* Mapping Approval Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={handleCancelRosterImport}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold"
                    >
                      {t('projects.batch4.cancel_reset')}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveRosterMappingAndStartPipeline}
                      disabled={isProcessing || isImportingFile || isDiscoveringRoster || Boolean(rosterMappingIssue)}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t('projects.batch4.analyzing_roster')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('projects.labels.approve_mapping_analyze_log')}</span>
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
                  <RosterCarrierResolutionLayer receipts={contextualReceipts} canonicalContext={projectRelationshipContext?.importResolution ? projectRelationshipContext : undefined}
                    onCanonicalVerified={applyCanonicalImportChoice} canManageParticipation={authContext.role==='SUPER_ADMIN'||authContext.role==='PROJECT_ADMIN'} isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                    importBatch={importBatch}
                    projectCarriers={carriers}
                    onAcceptCandidate={handleSmartImportCarrierAcceptCandidate}
                    onSelectAlternate={handleSmartImportCarrierSelectAlternate}
                    onCreateCarrier={(group) => {
                      setSmartImportPendingCarrierGroup(group);
                      setIsSmartImportCarrierModalOpen(true);
                    }}
                    onContinueToMaterials={handleSmartImportContinueToMaterials}
                    onCancelImport={handleCancelRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 4: MATERIAL_RESOLUTION */}
              {importBatch && rosterImportStage === 'MATERIAL_RESOLUTION' && (
                <div>
                  <RosterMaterialResolutionLayer receipts={contextualReceipts} canonicalContext={projectRelationshipContext?.importResolution ? projectRelationshipContext : undefined}
                    onCanonicalVerified={applyCanonicalImportChoice} canManageParticipation={authContext.role==='SUPER_ADMIN'||authContext.role==='PROJECT_ADMIN'} isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                    importBatch={importBatch}
                    projectMaterials={materials}
                    onAcceptCandidate={handleSmartImportMaterialAcceptCandidate}
                    onSelectAlternate={handleSmartImportMaterialSelectAlternate}
                    onCreateMaterial={(group) => {
                      setSmartImportPendingMaterialGroup(group);
                      setIsSmartImportMaterialModalOpen(true);
                    }}
                    onContinueToDriverTruck={handleSmartImportContinueToDriverTruck}
                    onCancelImport={handleCancelRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {/* STAGE 5: DRIVER_TRUCK_RESOLUTION */}
              {importBatch && rosterImportStage === 'DRIVER_TRUCK_RESOLUTION' && (
                <div>
                  <RosterDriverTruckResolutionLayer receipts={contextualReceipts} canonicalContext={projectRelationshipContext?.importResolution ? projectRelationshipContext : undefined}
                    onCanonicalVerified={applyCanonicalImportChoice} canManageParticipation={authContext.role==='SUPER_ADMIN'||authContext.role==='PROJECT_ADMIN'} isCurrent={() => projectContext.isCurrent(renderedContext, project.projectId)}
                    importBatch={importBatch}
                    projectDrivers={projectRelationshipContext?.knownDrivers || []}
                    projectTrucks={projectRelationshipContext?.knownTrucks || []}
                    onAcceptCandidate={handleSmartImportDriverTruckAcceptCandidate}
                    onSelectAlternate={handleSmartImportDriverTruckSelectAlternate}
                    onCreateDriver={handleSmartImportDriverCreate}
                    onCreateTruck={handleSmartImportTruckCreate}
                    driverConvergenceError={driverConvergenceError ? presentBatch4Message(driverConvergenceError, t) : null}
                    truckConvergenceError={truckConvergenceError ? presentBatch4Message(truckConvergenceError, t) : null}
                    onRetryDriverConvergence={handleRetryDriverConvergence}
                    onRetryTruckConvergence={handleRetryTruckConvergence}
                    onContinueToFinalReview={handleSmartImportContinueToFinalReview}
                    onCancelImport={handleCancelRosterImport}
                    isProcessing={isProcessing}
                    embeddedInWorkflowHost={true}
                  />
                </div>
              )}

              {importBatch && rosterImportStage === 'DRIVER_TRUCK_RESOLUTION' && semanticRosterIntent && semanticRosterIntent.blockers.some(b => b.code.startsWith('CROSS_ROW_') || b.code === 'PREPARED_ENTITY_CONFLICT') && <div role="alert" className="p-3 text-rose-400">{semanticRosterIntent.blockers.map((b,i) => <p key={i}>{t(intentIssueKey(b.code))} · {t('intent.rows')}: {b.rowNumbers.join(', ')}</p>)}</div>}
              {importBatch && rosterImportStage === 'DRIVER_TRUCK_RESOLUTION' && semanticRosterIntent?.warnings.length ? <label className="flex gap-2 p-3 text-amber-500"><input type="checkbox" checked={Boolean(importBatch.warningConfirmation?.confirmed)} disabled={isProcessing} onChange={e => setImportBatch({...importBatch, warningConfirmation:e.target.checked ? {confirmed:true, confirmedBy:authContext.userId, confirmedAt:new Date().toISOString()} : undefined})}/>{t('entityResolution.labels.accept_warning_records')}</label> : null}
              {/* STAGE 6: FINAL_REVIEW */}
              {importBatch && importBatch.projectId === project?.projectId && rosterImportStage === 'FINAL_REVIEW' && (
                <div>
                  {semanticRosterIntent ? <>
                    <RosterSemanticReview key={project?.projectId} intent={semanticRosterIntent} onAccept={handleAcceptCanonicalIntent} onBack={handleFinalReviewBack} busy={isProcessing || isCommittingImport} error={smartImportCommitError}/>
                    {importBatch.metadata?.reviewedCanonicalIntent?.acceptedSignature === semanticRosterIntent.signature && <p role="status" className="p-3 text-emerald-500">{t('intent.ready')}</p>}
                  </> : <RosterFinalReviewLayer
                    importBatch={importBatch}
                    onCommit={handleSmartImportCommit}
                    isCommitting={isCommittingImport}
                    commitError={smartImportCommitError}
                    onClose={handleFinalReviewBack}
                    embeddedInWorkflowHost={true}
                  />}
                </div>
              )}

              {/* STAGE 7: COMMIT_RESULT */}
              {importBatch && rosterImportStage === 'COMMIT_RESULT' && (
                <div>
                  <RosterCommitResultLayer
                    importBatch={importBatch}
                    commitResult={smartImportCommitResult!}
                    onClose={async () => {
                      const requestContext = renderedContext;
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

                      const persisted = await persistSmartImportCheckpoint({
                        stage: 'FINAL_REVIEW',
                        lifecycleState: 'REVIEW',
                      });
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                      if (!persisted) {
                        return;
                      }
                      transitionToRosterStage('FINAL_REVIEW');
                    }}
                    onFinish={async () => {
                      const requestContext = renderedContext;
                      if (!projectContext.isCurrent(requestContext, editingProjectId)) return;

                      if (smartImportCommitResult?.success && (smartImportCommitResult.failedRows || 0) === 0) {
                        if (importSessionRecoveryError) {
                          const retrySuccess = await persistSmartImportCheckpoint({
                            batch: importBatch,
                            commitResult: smartImportCommitResult,
                            stage: 'COMMIT_RESULT',
                            lifecycleState: 'COMMITTED',
                          });
                          if (!projectContext.isCurrent(requestContext, editingProjectId)) return;
                          if (!retrySuccess) {
                            setSmartImportCommitError(t('projects.messages.checkpoint_full_failure'));
                            return;
                          }
                        }
                      }
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
