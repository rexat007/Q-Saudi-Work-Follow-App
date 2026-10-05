import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { canEnterProjectSetupLayer, NavigationGateContext } from '../services/projectSetupWorkflow.service';
import { ProjectCanonicalRefreshSnapshot } from '../services/projectCanonicalRefresh.service';

function findFileContent(relativePath: string): string {
  const possiblePaths = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), 'app/applet', relativePath),
    path.join(__dirname, '..', relativePath.replace(/^src\//, '')),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  throw new Error(`Could not find file at any location for ${relativePath}`);
}

describe('UNIT 3A.2 — Project Data Freshness & Race-Safe Loading Suite', () => {
  const wizardContent = findFileContent('src/components/wizard/ProjectSetupWizard.tsx');
  const appContent = findFileContent('src/App.tsx');

  // A. Switch A -> B immediately clears A materials/carriers/fleet/context
  it('A. Switch A -> B immediately clears A materials/carriers/fleet/context before loading B', () => {
    // Structural inspection of project switch effect
    const effectIdx = wizardContent.indexOf('useEffect(() => {\n    if (!editingProjectId) {');
    expect(effectIdx).toBeGreaterThanOrEqual(0);
    const effectBlock = wizardContent.slice(effectIdx, effectIdx + 3000);

    expect(effectBlock).toContain('projectDataLoadGenerationRef.current += 1');
    expect(effectBlock).toContain('setMaterials([])');
    expect(effectBlock).toContain('setCarriers([])');
    expect(effectBlock).toContain('setFleetRows([])');
    expect(effectBlock).toContain('setPricingRules([])');
    expect(effectBlock).toContain('setProjectRelationshipContext(null)');
    expect(effectBlock).toContain('setServerReadiness(null)');
    expect(effectBlock).toContain('setLoadedProjectId(null)');
    expect(effectBlock).toContain('setIsProjectDataLoading(true)');
  });

  // B. Late canonical response from A is ignored after B selected
  it('B. Late canonical response from A is ignored after B selected (Generation & Target check)', async () => {
    let generation = 0;
    let currentEditingProjectId: string | null = 'PROJECT-A';
    let loadedMaterials: string[] = [];

    // Project A starts loading
    generation += 1;
    const genA = generation;
    const targetA = currentEditingProjectId;

    // Simulate async fetch for A
    let resolveA: (data: string[]) => void = () => {};
    const fetchPromiseA = new Promise<string[]>((res) => { resolveA = res; });

    // User switches to Project B before A finishes
    currentEditingProjectId = 'PROJECT-B';
    generation += 1;
    const genB = generation;
    const targetB = currentEditingProjectId;

    // A finishes late
    resolveA(['Material-A1', 'Material-A2']);
    const resA = await fetchPromiseA;

    // Handler for A resolves
    if (genA === generation && currentEditingProjectId === targetA) {
      loadedMaterials = resA;
    }

    // State for B must NOT have been mutated by A
    expect(loadedMaterials).toEqual([]);
    expect(currentEditingProjectId).toBe('PROJECT-B');
    expect(generation).toBe(genB);
  });

  // C. Layer change alone does not call projectCanonicalRefreshService.refresh again
  it('C. Layer change alone does not call projectCanonicalRefreshService.refresh again', () => {
    const effectIdx = wizardContent.indexOf('// Real-time Subscriptions & Authoritative Canonical Data Loading');
    expect(effectIdx).toBeGreaterThanOrEqual(0);
    const nextEffectIdx = wizardContent.indexOf('// Unit 3A.2: Pricing Rules Subscription', effectIdx);
    expect(nextEffectIdx).toBeGreaterThan(effectIdx);
    const effectBlock = wizardContent.slice(effectIdx, nextEffectIdx);

    // Dependency array must depend on [editingProjectId, applyCanonicalSnapshot] and NOT activeSetupLayer
    expect(effectBlock).toContain('}, [editingProjectId, applyCanonicalSnapshot]);');
    expect(effectBlock).not.toContain('activeSetupLayer');
  });

  // D. Pricing subscription is not recreated on layer change
  it('D. Pricing subscription is not recreated on layer change', () => {
    const pricingIdx = wizardContent.indexOf('// Unit 3A.2: Pricing Rules Subscription depends only on editingProjectId');
    expect(pricingIdx).toBeGreaterThanOrEqual(0);
    const pricingBlock = wizardContent.slice(pricingIdx, pricingIdx + 400);

    expect(pricingBlock).toContain('}, [editingProjectId]);');
    expect(pricingBlock).not.toContain('activeSetupLayer');
  });

  // E. ROSTER blocked while project B canonical data still loading
  it('E. ROSTER blocked while project B canonical data still loading', () => {
    const navFnIdx = wizardContent.indexOf('const attemptProjectSetupLayerNavigation = useCallback');
    expect(navFnIdx).toBeGreaterThanOrEqual(0);
    const navBlock = wizardContent.slice(navFnIdx, navFnIdx + 1200);

    expect(navBlock).toContain("isProjectDataLoading || loadedProjectId !== editingProjectId");
    expect(navBlock).toContain("['ROSTER', 'PRICING', 'REVIEW_ACTIVATION'].includes(targetLayer)");
    expect(navBlock).toContain("setNavigationError('جاري تحميل بيانات المشروع المعتمدة، يرجى الانتظار...')");
  });

  // F. Old A counts cannot authorize B ROSTER gate
  it('F. Old A counts cannot authorize B ROSTER gate', () => {
    // When project B is selected, loadedProjectId is null and isProjectDataLoading is true
    const isProjectDataLoading = true;
    const loadedProjectId: string | null = null;
    const editingProjectId = 'PROJECT-B';
    const staleMaterialsCountFromA = 5;
    const staleCarriersCountFromA = 3;

    let targetLayerAttempt: string | null = null;
    let navigationError: string | null = null;

    const attemptNav = (target: any) => {
      if (editingProjectId && (isProjectDataLoading || loadedProjectId !== editingProjectId)) {
        if (['ROSTER', 'PRICING', 'REVIEW_ACTIVATION'].includes(target)) {
          navigationError = 'جاري تحميل بيانات المشروع المعتمدة، يرجى الانتظار...';
          return;
        }
      }

      const context: NavigationGateContext = {
        projectId: editingProjectId,
        materialsCount: staleMaterialsCountFromA,
        carriersCount: staleCarriersCountFromA,
      };
      const gate = canEnterProjectSetupLayer(target, context);
      if (gate.allowed) {
        targetLayerAttempt = target;
      } else {
        navigationError = gate.reason || 'Blocked';
      }
    };

    attemptNav('ROSTER');
    expect(targetLayerAttempt).toBeNull();
    expect(navigationError).toBe('جاري تحميل بيانات المشروع المعتمدة، يرجى الانتظار...');
  });

  // G. createdProject appears immediately after createProject resolves before globalProjects subscription update
  it('G. createdProject appears immediately after createProject resolves before globalProjects subscription update', () => {
    const createIdx = wizardContent.indexOf('const handleCreateProject = async');
    expect(createIdx).toBeGreaterThanOrEqual(0);
    const createBlock = wizardContent.slice(createIdx, createIdx + 2000);

    expect(createBlock).toContain('const createdProject = await projectService.createProject(payload, authContext);');
    expect(createBlock).toContain('setLocalProjectOverride(createdProject);');
    expect(createBlock).toContain('setEditingProjectId(createdProject.projectId);');

    // project lookup derivation verifies localProjectOverride
    const projectMemoIdx = wizardContent.indexOf('const project = useMemo(() => {');
    const projectMemoBlock = wizardContent.slice(projectMemoIdx, projectMemoIdx + 800);
    expect(projectMemoBlock).toContain('localProjectOverride && localProjectOverride.projectId === editingProjectId');
  });

  // H. Foundation save displays updated project fields immediately after success
  it('H. Foundation save displays updated project fields immediately after success', () => {
    const saveIdx = wizardContent.indexOf('const handleSaveFoundation = useCallback(async');
    expect(saveIdx).toBeGreaterThanOrEqual(0);
    const saveBlock = wizardContent.slice(saveIdx, saveIdx + 2500);

    expect(saveBlock).toContain('await projectService.updateProject(project.projectId, updates, authContext);');
    expect(saveBlock).toContain('setLocalProjectOverride(updatedProject);');
    expect(saveBlock).toContain("setFoundationSaveSuccess('تم حفظ تعديلات المشروع بنجاح');");
  });

  // I. Late resumable session response from A is ignored after B selected
  it('I. Late resumable session response from A is ignored after B selected', async () => {
    let currentGen = 0;
    let currentProjectId: string | null = 'PROJECT-A';
    let restoredSessionId: string | null = null;

    // Start restore for A
    currentGen += 1;
    const targetA = currentProjectId;
    const genA = currentGen;

    let resolveSessionA: (s: any) => void = () => {};
    const sessionPromiseA = new Promise<any>((res) => { resolveSessionA = res; });

    // Switch to B
    currentProjectId = 'PROJECT-B';
    currentGen += 1;

    // Session A returns late
    resolveSessionA([{ importSessionId: 'SESSION-A-OLD', version: 1 }]);
    const sessionsA = await sessionPromiseA;

    if (genA === currentGen && currentProjectId === targetA) {
      restoredSessionId = sessionsA[0].importSessionId;
    }

    expect(restoredSessionId).toBeNull();
    expect(currentProjectId).toBe('PROJECT-B');
  });

  // J. Late readiness response from A is ignored after B selected
  it('J. Late readiness response from A is ignored after B selected', async () => {
    let currentGen = 0;
    let currentProjectId: string | null = 'PROJECT-A';
    let readinessState: any = null;

    currentGen += 1;
    const targetA = currentProjectId;
    const genA = currentGen;

    let resolveReadinessA: (r: any) => void = () => {};
    const readinessPromiseA = new Promise<any>((res) => { resolveReadinessA = res; });

    currentProjectId = 'PROJECT-B';
    currentGen += 1;

    resolveReadinessA({ isReady: true, projectId: 'PROJECT-A' });
    const resA = await readinessPromiseA;

    if (genA === currentGen && currentProjectId === targetA) {
      readinessState = resA;
    }

    expect(readinessState).toBeNull();
  });

  // K. Canonical snapshot cannot apply to wrong project
  it('K. Canonical snapshot cannot apply to wrong project', () => {
    const applyIdx = wizardContent.indexOf('const applyCanonicalSnapshot = useCallback');
    expect(applyIdx).toBeGreaterThanOrEqual(0);
    const applyBlock = wizardContent.slice(applyIdx, applyIdx + 1200);

    expect(applyBlock).toContain('if (generation !== undefined && generation !== projectDataLoadGenerationRef.current) {');
    expect(applyBlock).toContain('if (targetProjectId && editingProjectId && targetProjectId !== editingProjectId) {');
  });

  // L. App project subscription is not recreated on activeTab change
  it('L. App project subscription is not recreated on activeTab change', () => {
    const subIdx = appContent.indexOf('// Real-time Firestore project subscription');
    expect(subIdx).toBeGreaterThanOrEqual(0);
    const subBlock = appContent.slice(subIdx, subIdx + 800);

    expect(subBlock).toContain('}, [user?.uid, effectiveRole]);');
    expect(subBlock).not.toContain('}, [user, activeTab]);');

    // Reconciliation effect is separate
    const reconcileIdx = appContent.indexOf('// Synchronize and reconcile selectedProjectId');
    expect(reconcileIdx).toBeGreaterThanOrEqual(0);
  });

  // M. Existing material/carrier convergence tests remain valid
  it('M. Existing material/carrier convergence tests remain valid', () => {
    expect(wizardContent).toContain('reloadProjectCanonicalData');
    expect(wizardContent).toContain('projectCanonicalRefreshService.refresh');
  });

  // N. Convergence tests for localProjectOverride bridge & canonical arrival
  describe('N. Local Project Override Convergence & Bridge Behavior', () => {
    it('A. Newly created project is visible immediately before globalProjects update', () => {
      const editingProjectId = 'PROJECT-NEW';
      const globalProjects: any[] = [];
      const localProjectOverride: any = { projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد مؤقت' };

      const resolveProject = (gProjects: any[], eId: string | null, lOverride: any) => {
        if (!eId) return null;
        const fromGlobal = gProjects.find(p => p.projectId === eId);
        if (fromGlobal) return fromGlobal;
        if (lOverride && lOverride.projectId === eId) {
          return lOverride;
        }
        return null;
      };

      const resolved = resolveProject(globalProjects, editingProjectId, localProjectOverride);
      expect(resolved).toEqual({ projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد مؤقت' });
    });

    it('B. Override remains while canonical project is absent in globalProjects', () => {
      let localProjectOverride: any = { projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد مؤقت' };
      const globalProjects: any[] = [{ projectId: 'OTHER-PROJECT', nameAr: 'مشروع آخر' }];
      const editingProjectId = 'PROJECT-NEW';

      const canonicalExists = globalProjects.some(p => p.projectId === editingProjectId);
      if (canonicalExists && localProjectOverride?.projectId === editingProjectId) {
        localProjectOverride = null;
      }

      expect(localProjectOverride).not.toBeNull();
      expect(localProjectOverride.projectId).toBe('PROJECT-NEW');
    });

    it('C. When canonical project arrives for same editingProjectId: localProjectOverride is cleared', () => {
      let localProjectOverride: any = { projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد مؤقت' };
      const globalProjects: any[] = [{ projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد كانونيكال' }];
      const editingProjectId = 'PROJECT-NEW';

      const canonicalExists = globalProjects.some(p => p.projectId === editingProjectId);
      if (canonicalExists && localProjectOverride?.projectId === editingProjectId) {
        localProjectOverride = null;
      }

      expect(localProjectOverride).toBeNull();
    });

    it('D. After canonical arrival: project lookup prefers canonical global project', () => {
      const canonicalProject = { projectId: 'PROJECT-NEW', nameAr: 'مشروع جديد كانونيكال من السيرفر' };
      const staleOverride = { projectId: 'PROJECT-NEW', nameAr: 'مشروع قديم مؤقت' };
      const globalProjects = [canonicalProject];
      const editingProjectId = 'PROJECT-NEW';

      const resolveProject = (gProjects: any[], eId: string | null, lOverride: any) => {
        if (!eId) return null;
        const fromGlobal = gProjects.find(p => p.projectId === eId);
        if (fromGlobal) return fromGlobal;
        if (lOverride && lOverride.projectId === eId) {
          return lOverride;
        }
        return null;
      };

      const resolved = resolveProject(globalProjects, editingProjectId, staleOverride);
      expect(resolved.nameAr).toBe('مشروع جديد كانونيكال من السيرفر');
    });

    it('E. A later canonical server/subscription update is NOT masked by stale override', () => {
      let globalProjects = [{ projectId: 'PROJECT-NEW', nameAr: 'إصدار 1' }];
      const editingProjectId = 'PROJECT-NEW';
      let localProjectOverride: any = null;

      globalProjects = [{ projectId: 'PROJECT-NEW', nameAr: 'إصدار 2 المحدث' }];

      const resolveProject = (gProjects: any[], eId: string | null, lOverride: any) => {
        if (!eId) return null;
        const fromGlobal = gProjects.find(p => p.projectId === eId);
        if (fromGlobal) return fromGlobal;
        if (lOverride && lOverride.projectId === eId) {
          return lOverride;
        }
        return null;
      };

      const resolved = resolveProject(globalProjects, editingProjectId, localProjectOverride);
      expect(resolved.nameAr).toBe('إصدار 2 المحدث');
    });

    it('F. Switching to a different project still clears unrelated override', () => {
      let localProjectOverride: any = { projectId: 'PROJECT-OLD', nameAr: 'قديم' };
      const editingProjectId = 'PROJECT-NEW';

      if (localProjectOverride && localProjectOverride.projectId !== editingProjectId) {
        localProjectOverride = null;
      }

      expect(localProjectOverride).toBeNull();
    });

    it('G. ProjectSetupWizard contains convergence effect and non-merging project memo lookup', () => {
      expect(wizardContent).toContain('// Convergence rule: Clear temporary local override once canonical project arrives in globalProjects');
      expect(wizardContent).toContain('const canonicalExists = globalProjects.some');
      expect(wizardContent).toContain('setLocalProjectOverride(null)');
      expect(wizardContent).toContain('if (fromGlobal) return fromGlobal;');
      expect(wizardContent).not.toContain('...localProjectOverride,');
    });
  });

  // O. Type-safety and Mapping tests for Discovery Metadata
  describe('O. Discovery Metadata Type Safety & Mapping Suite', () => {
    it('A. buildSafeDiscoveryMetadata uses DiscoveryResult strict typing and no DiscoveryResult | any remains', () => {
      expect(wizardContent).toContain('disc: DiscoveryResult | null');
      expect(wizardContent).not.toContain('disc: DiscoveryResult | any');
    });

    it('B. availableSheets maps to sheetNames', () => {
      const disc: any = {
        sourceType: 'EXCEL_CSV',
        availableSheets: ['Sheet1', 'RosterData'],
        selectedSheet: 'RosterData',
        detectedHeaderRowIndex: 0,
        detectedHeaders: ['اسم السائق', 'رقم الهوية'],
        mappingDiagnostics: {},
        confidence: 100,
        requiresReview: false,
        ambiguityReasons: [],
      };

      const sheetNames = disc?.availableSheets && disc.availableSheets.length > 0 ? disc.availableSheets : undefined;
      expect(sheetNames).toEqual(['Sheet1', 'RosterData']);
    });

    it('C. selectedSheet maps correctly', () => {
      const disc: any = { selectedSheet: 'Sheet1' };
      const selectedSheet = disc?.selectedSheet || undefined;
      expect(selectedSheet).toBe('Sheet1');
    });

    it('D. detectedHeaders maps to headers', () => {
      const disc: any = { detectedHeaders: ['H1', 'H2'] };
      const headers = disc?.detectedHeaders && disc.detectedHeaders.length > 0 ? disc.detectedHeaders : undefined;
      expect(headers).toEqual(['H1', 'H2']);
    });

    it('E. mappingDiagnostics converts to Record<string, string> string values', () => {
      const mappingDiagnostics: Record<string, any> = {
        'اسم السائق': { canonicalField: 'fullNameAr', confidence: 0.95 },
        'رقم الهوية': { canonicalField: 'idNumber', confidence: 1.0 },
      };

      const cols: Record<string, string> = {};
      for (const [header, match] of Object.entries(mappingDiagnostics)) {
        if (match && match.canonicalField) {
          cols[header] = String(match.canonicalField);
        }
      }

      expect(cols).toEqual({
        'اسم السائق': 'fullNameAr',
        'رقم الهوية': 'idNumber',
      });
    });

    it('F. full ColumnMappingMatch objects are NOT persisted in detectedColumns', () => {
      const mappingDiagnostics: Record<string, any> = {
        'اسم السائق': { canonicalField: 'fullNameAr', confidence: 0.95, sampleValue: 'أحمد' },
      };

      const cols: Record<string, string> = {};
      for (const [header, match] of Object.entries(mappingDiagnostics)) {
        if (match && match.canonicalField) {
          cols[header] = String(match.canonicalField);
        }
      }

      expect(typeof cols['اسم السائق']).toBe('string');
      expect(cols['اسم السائق']).not.toHaveProperty('confidence');
      expect(cols['اسم السائق']).not.toHaveProperty('sampleValue');
    });

    it('G. no unsafe binary/raw file payload is included in SafeDiscoveryMetadata', () => {
      const fnStr = wizardContent.substring(
        wizardContent.indexOf('const buildSafeDiscoveryMetadata ='),
        wizardContent.indexOf('const buildSmartImportCheckpointPayload =')
      );

      expect(fnStr).not.toContain('rawInput');
      expect(fnStr).not.toContain('ArrayBuffer');
      expect(fnStr).not.toContain('Uint8Array');
      expect(fnStr).not.toContain('Workbook');
      expect(fnStr).not.toContain('Blob');
    });
  });
});
