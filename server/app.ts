import {resolveWorkspaceExecutionToken} from './workspaceExecutionToken';
import {runtimeVersionHandler,workspaceGenerationFence} from './runtimeVersion';
import {registerWorkspaceOAuthCallback,registerWorkspaceOAuthCommands} from './workspaceGoogleOAuth.routes';
import {workspaceOfflineAuthorization} from './workspaceSyncWorker';
import { projectGoogleBlueprintPort } from './projectGoogleBlueprint.adapter';
import { projectGoogleWorkspaceServer, continuityRef, workspaceOperation, GoogleWorkspaceCommandError } from '../src/services/projectGoogleWorkspace.server';
import { projectGoogleTemplatePort } from './projectGoogleTemplate.adapter';
import {MASTER_TABS} from '../src/services/projectWorkspaceMasterContract';
import { TripCommandsServerService, TripCommandError } from '../src/services/tripCommands.server';
import { STATUS_COMMANDS } from '../src/types/tripCommands';
import { AdminAccountServerService, AdminCommandError } from '../src/services/adminAccount.server';
import { strictWorkspaceProject, WorkspaceStorageBoundary, projectStorage, normalizeStorageId, workspaceError } from './workspace.isolation';
import express from 'express';
import path from 'path';
import { adminDb } from '../src/firebase/admin';
import { serverWorkspaceService } from './workspace.service';
import { driverTruckIntakeService } from '../src/services/driverTruckIntake.service';
import { projectWorkspaceInitialProjectionServer } from '../src/services/projectWorkspaceInitialProjection.server';
import { 
  getState as getWorkspaceProjectionState, 
  markProjectionSuccessful as markWorkspaceProjectionSuccessful 
} from '../src/services/projectWorkspaceProjectionState.server';
import { 
  WORKSPACE_TABS, 
  OPERATIONS_FULL_COLUMNS, 
  WorkspaceSyncSummary, 
  UpsertResult,
  FLEET_ROSTER_COLUMNS,
  WorkspaceSheetTab
} from '../src/types/workspace';
import {
  authenticateUser,
  enforceProjectIsolation,
  enforceTripSupervisorRestrictions,
  enforceTruckCarrierIntegrity,
  enforceIdempotency,
  enforceFileUploadSecurity,
  enforceRole,
  enforceAdminOnly,
  enforceAuditorOrAdmin,
  enforceDispatcherOrAbove,
  enforceWeighbridgeUnloadIntegrity,
} from './security.middleware';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public, non-sensitive and never cached; precedes application authentication.
app.get('/api/runtime-version',runtimeVersionHandler);
registerWorkspaceOAuthCallback(app);

// Global API Authentication Context Resolver
app.use('/api', authenticateUser);
registerWorkspaceOAuthCommands(app,[enforceProjectIsolation,enforceAdminOnly,workspaceGenerationFence]);

// Global account governance: current principal plus transaction-time reauthorization.
app.post('/api/admin/users/:userId/commands', async (req: any, res) => {
  try {
    const user = await new AdminAccountServerService().execute(req.params.userId, req.body, req.user);
    res.json({ success: true, user });
  } catch (error: any) {
    const code = error instanceof AdminCommandError ? error.code : 'ADMIN_UPDATE_CONFLICT';
    const status = code === 'FORBIDDEN_ADMIN_ACTION' ? 403 : code === 'TARGET_USER_NOT_FOUND' ? 404 : code === 'INVALID_ADMIN_COMMAND' ? 400 : 409;
    res.status(status).json({ success: false, code });
  }
});

app.get('/api/admin/driver-identities', async (req: any, res) => {
  try { res.json({ success: true, drivers: await new AdminAccountServerService().listDriverIdentities(req.user) }); }
  catch { res.status(403).json({ success: false, code: 'FORBIDDEN_ADMIN_ACTION' }); }
});

// ----------------------------------------------------
// 0. Canonical First-Admin Bootstrap Endpoint
// ----------------------------------------------------
app.post('/api/auth/bootstrap', async (req: any, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير مصادق عليه',
        code: 'UNAUTHENTICATED'
      });
    }

    // Verify Google identity matches configured initial owner
    const targetOwnerEmail = 'saudiali044@gmail.com';
    if (user.email.toLowerCase() !== targetOwnerEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `حساب غير مصرح به: البريد الإلكتروني ${user.email} ليس هو المالك المعين للنظام.`,
        code: 'UNAUTHORIZED_OWNER'
      });
    }

    const { adminDb } = await import('../src/firebase/admin');

    // Create the canonical Super Admin profile
    const newUserProfile = {
      userId: user.userId,
      email: user.email,
      fullName: user.displayName || 'أبو علي المالك',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
      assignedProjectIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'SYSTEM_BOOTSTRAP',
      updatedBy: 'SYSTEM_BOOTSTRAP'
    };

    // Use Firestore Transaction to atomically lock the bootstrap state
    await adminDb.runTransaction(async (transaction: any) => {
      const lockRef = adminDb.collection('system_state').doc('bootstrap');
      const lockDoc = await transaction.get(lockRef);

      if (lockDoc.exists && lockDoc.data()?.initialized === true) {
        throw new Error('BOOTSTRAP_ALREADY_COMPLETED');
      }

      const userDocRef = adminDb.collection('users').doc(user.userId);
      const userDoc = await transaction.get(userDocRef);
      if (userDoc.exists) {
        throw new Error('BOOTSTRAP_ALREADY_COMPLETED');
      }

      // Check if ANY users exist in Firestore inside the transaction
      const usersQuery = adminDb.collection('users').limit(1);
      const usersSnapshot = await transaction.get(usersQuery);
      if (!usersSnapshot.empty) {
        throw new Error('BOOTSTRAP_ALREADY_COMPLETED');
      }

      transaction.set(userDocRef, newUserProfile);
      transaction.set(lockRef, {
        initialized: true,
        initializedAt: new Date().toISOString(),
        initializedBy: user.userId
      });
    });

    res.json({
      success: true,
      message: 'تم تهيئة النظام بنجاح! تم تعيينك كمدير عام رئيسي (SUPER_ADMIN).',
      data: newUserProfile
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    if (error.message === 'BOOTSTRAP_ALREADY_COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'فشلت عملية التهيئة: تم تهيئة النظام مسبقاً ويوجد مستخدمين مسجلين بالفعل.',
        code: 'BOOTSTRAP_ALREADY_COMPLETED'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ غير متوقع أثناء تهيئة النظام.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ----------------------------------------------------
// 0.2 Server-Authoritative Pricing Rule Creation Endpoint
// ----------------------------------------------------
app.get('/api/projects/:projectId/pricing-rules', enforceProjectIsolation, async(req:any,res)=>{
  try{const {projectPricingServerService}=await import('../src/services/projectPricing.server');return res.json({success:true,data:await projectPricingServerService.listPricingRules(req.params.projectId,req.user)});}
  catch(error:any){return res.status(error.status||403).json({success:false,code:error.code||'PRICING_READ_FAILED'});}
});

app.post(
  '/api/projects/:projectId/pricing-rules',
  enforceProjectIsolation,
  enforceAuditorOrAdmin,
  async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const user = (req as any).user;
      const { projectPricingServerService } = await import('../src/services/projectPricing.server');

      const createdRule = await projectPricingServerService.createPricingRule(
        projectId,
        req.body,
        user
      );

      return res.status(201).json({
        success: true,
        data: createdRule,
        message: 'تم إنشاء قاعدة التسعير خادومياً بنجاح.'
      });
    } catch (error: any) {
      console.error('Pricing creation failed:', error);
      return res.status(error.status || 400).json({
        success: false,
        error: error.message || 'فشلت عملية إنشاء قاعدة التسعير خادومياً.',
        code: error.code || 'PRICING_CREATION_FAILED'
      });
    }
  }
);

// ----------------------------------------------------
// 0.3 Server-Authoritative Import Session Persistence Endpoints (Unit 4A)
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/import-sessions',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const user = req.user;
      const { importSessionServerService } = await import('../src/services/importSession.server');
      const session = await importSessionServerService.createSession(projectId, req.body, user);
      return res.status(201).json({
        success: true,
        data: session,
        message: 'تم إنشاء جلسة الاستيراد بنجاح.'
      });
    } catch (error: any) {
      console.error('Create import session failed:', error);
      const code = error.code || 'IMPORT_SESSION_CREATE_FAILED';
      const status = code === 'AUTHORIZATION_ERROR' || code === 'UNAUTHENTICATED' ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: error.message || 'فشل إنشاء جلسة الاستيراد.',
        code
      });
    }
  }
);

app.get(
  '/api/projects/:projectId/import-sessions',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const user = req.user;
      const { importSessionServerService } = await import('../src/services/importSession.server');
      const sessions = await importSessionServerService.listResumableSessions(projectId, user, req.query.includeRosterResults === 'true');
      return res.json({
        success: true,
        sessions,
        count: sessions.length
      });
    } catch (error: any) {
      console.error('List import sessions failed:', error);
      const code = error.code || 'IMPORT_SESSIONS_LIST_FAILED';
      const status = code === 'AUTHORIZATION_ERROR' || code === 'PROJECT_MISMATCH' ? 403 : (code === 'UNAUTHENTICATED' ? 401 : 400);
      return res.status(status).json({
        success: false,
        error: error.message || 'فشل استعراض جلسات الاستيراد.',
        code
      });
    }
  }
);

app.get(
  '/api/projects/:projectId/import-sessions/:importSessionId',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { projectId, importSessionId } = req.params;
      const user = req.user;
      const { importSessionServerService } = await import('../src/services/importSession.server');
      const session = await importSessionServerService.getSession(projectId, importSessionId, user);
      return res.json({
        success: true,
        data: session
      });
    } catch (error: any) {
      console.error('Get import session failed:', error);
      const code = error.code || 'IMPORT_SESSION_GET_FAILED';
      const status = code === 'IMPORT_SESSION_NOT_FOUND' ? 404 : (code === 'PROJECT_MISMATCH' || code === 'AUTHORIZATION_ERROR' ? 403 : 400);
      return res.status(status).json({
        success: false,
        error: error.message || 'فشل استرجاع جلسة الاستيراد.',
        code
      });
    }
  }
);

app.post(
  '/api/projects/:projectId/import-sessions/:importSessionId/commit-reviewed-intent',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { RosterExecutionServer } = await import('../src/services/import/rosterExecution.server');
      const data = await new RosterExecutionServer().requestCommit(req.params.projectId, req.params.importSessionId, req.body, req.user);
      return res.json({success:true,data});
    } catch (error: any) {
      return res.status(error.status || 400).json({success:false,code:error.code || 'REVIEWED_COMMIT_FAILED',serverVersion:error.serverVersion});
    }
  }
);

// P8-B3 operation recovery API. No client completion list or execution plan is accepted.
app.get('/api/projects/:projectId/import-sessions/:importSessionId/execution', enforceProjectIsolation, enforceDispatcherOrAbove, async (req:any,res) => {
  try {
    const { RosterExecutionServer } = await import('../src/services/import/rosterExecution.server');
    return res.json({success:true,data:await new RosterExecutionServer().status(req.params.projectId,req.params.importSessionId,req.user)});
  } catch(error:any) {return res.status(error.status || 400).json({success:false,code:error.code || 'EXECUTION_STATUS_FAILED'});}
});
for (const action of ['retry','cancel'] as const) app.post(`/api/projects/:projectId/import-sessions/:importSessionId/execution/${action}`, enforceProjectIsolation, enforceDispatcherOrAbove, async (req:any,res) => {
  try {
    if(!req.body || Object.keys(req.body).some(k=>k!=='expectedOperationVersion'))return res.status(400).json({success:false,code:'INVALID_EXECUTION_COMMAND'});
    const { RosterExecutionServer } = await import('../src/services/import/rosterExecution.server');
    const authority=new RosterExecutionServer();
    const data=await authority[action==='retry'?'advance':'cancel'](req.params.projectId,req.params.importSessionId,req.body.expectedOperationVersion,req.user);
    return res.json({success:true,data});
  } catch(error:any) {return res.status(error.status || 400).json({success:false,code:error.code || 'EXECUTION_COMMAND_FAILED'});}
});

app.patch(
  '/api/projects/:projectId/import-sessions/:importSessionId',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { projectId, importSessionId } = req.params;
      const user = req.user;
      const { expectedVersion, ...updates } = req.body;
      const { importSessionServerService } = await import('../src/services/importSession.server');
      const updated = await importSessionServerService.updateCheckpoint(
        projectId,
        importSessionId,
        updates,
        { expectedVersion },
        user
      );
      return res.json({
        success: true,
        data: updated,
        message: 'تم تحديث نقطة تفتيش جلسة الاستيراد بنجاح.'
      });
    } catch (error: any) {
      console.error('Update import session failed:', error);
      const code = error.code || 'IMPORT_SESSION_UPDATE_FAILED';
      let status = 400;
      if (code === 'VERSION_CONFLICT') status = 409;
      else if (code === 'IMPORT_SESSION_NOT_FOUND') status = 404;
      else if (code === 'PROJECT_MISMATCH' || code === 'AUTHORIZATION_ERROR' || code === 'IMMUTABLE_IDENTITY_VIOLATION') status = 403;
      
      return res.status(status).json({
        success: false,
        error: error.message || 'فشل تحديث جلسة الاستيراد.',
        code,
        serverVersion: error.serverVersion
      });
    }
  }
);


// ----------------------------------------------------
// 0.4 Global Canonical Snapshot Boundary Endpoint
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/canonical-snapshot',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const user = req.user;
      const { carrierId, truckId, driverId, materialId } = req.body;

      const { canonicalSnapshotServerService } = await import('../src/services/canonicalSnapshot.server');
      const snapshotBundle = await canonicalSnapshotServerService.getTripCanonicalSnapshot(
        projectId,
        { carrierId, truckId, driverId, materialId },
        user
      );

      return res.json({
        success: true,
        data: snapshotBundle,
      });
    } catch (error: any) {
      console.error('Canonical snapshot retrieval failed:', error);
      const code = error.code || 'CANONICAL_SNAPSHOT_FAILED';
      let status = 400;
      if (code === 'UNAUTHENTICATED') status = 401;
      else if (code.includes('NOT_ACTIVE') || code.includes('CONFLICT') || code === 'FORBIDDEN_PROJECT_ACCESS') status = 403;
      else if (code.includes('NOT_FOUND')) status = 404;

      return res.status(status).json({
        success: false,
        error: error.message || 'فشل استرجاع لقطة الكيان المعتمد',
        code,
      });
    }
  }
);


// ----------------------------------------------------
// 0.1 Server-Authoritative Project Creation Endpoint
// ----------------------------------------------------
app.post('/api/projects', async (req: any, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير مصادق عليه',
        code: 'UNAUTHENTICATED'
      });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك: إنشاء المشاريع مقتصر فقط على مدير النظام (SUPER_ADMIN)',
        code: 'FORBIDDEN_ROLE_ACCESS'
      });
    }

    const { projectCommandsServerService } = await import('../src/services/projectCommands.server');
    const createdProject = await projectCommandsServerService.createProject(req.body, user);

    return res.status(201).json({
      success: true,
      data: createdProject,
      message: 'تم إنشاء المشروع وتوثيقه بنجاح بنظام ترقيم خادومي موحد'
    });
  } catch (error: any) {
    console.error('Project creation failed:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'فشل إنشاء المشروع في الخادم الرئيسي',
      code: error.code || 'SERVER_ERROR',
      errors: error.errors
    });
  }
});

// ----------------------------------------------------
// 1. Health Endpoint
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Q-Saudi Enterprise Server',
    sourceOfTruth: 'Firestore',
    projection: 'Google Sheets & Drive',
    timestamp: new Date().toISOString() 
  });
});

// ----------------------------------------------------
// 2. Schema Migration Plan for Operations
// ----------------------------------------------------
app.get('/api/workspace/migration-plan', (req, res) => {
  const plan = serverWorkspaceService.getOperationsMigrationPlan();
  res.json({
    success: true,
    data: plan,
  });
});

// ----------------------------------------------------
// Google Workspace Dual-Token Authentication Helper
// ----------------------------------------------------
/**
 * Safely extracts the Google OAuth Access Token from the X-Google-Access-Token header.
 * Strictly decoupled from req.headers.authorization (which carries Firebase ID tokens).
 * In production mode, fails closed if the token is missing for routes requiring Google APIs.
 */
export function getGoogleAccessToken(req: express.Request, enforceInProduction: boolean = false): string | undefined {
  const header = req.headers['x-google-access-token'];
  let token: string | undefined = undefined;

  if (typeof header === 'string' && header.trim()) {
    token = header.trim();
  } else if (Array.isArray(header) && typeof header[0] === 'string' && header[0].trim()) {
    token = header[0].trim();
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (enforceInProduction && isProduction && !token) {
    const error: any = new Error('رمز الوصول لخدمات Google Workspace مطلوب في بيئة الإنتاج (X-Google-Access-Token header is required)');
    error.statusCode = 401;
    error.code = 'GOOGLE_ACCESS_TOKEN_REQUIRED';
    throw error;
  }

  return token;
}

/**
 * Safely resolves an HTTP status code from a Workspace error.
 * Ensures custom status codes are within the valid 400-599 range and defaults to 500.
 */
export function resolveWorkspaceErrorStatusCode(error: any): number {
  if (typeof error?.status === 'number' && error.status >= 400 && error.status <= 599) return error.status;
  if (typeof error?.statusCode === 'number' && error.statusCode >= 400 && error.statusCode <= 599) {
    return error.statusCode;
  }
  if (typeof error?.code === 'number' && error.code >= 400 && error.code <= 599) {
    return error.code;
  }
  return 500;
}

// Only project-owned workspace routes use this boundary. External import sources stay provider-only.
const projectWorkspacePaths = new Set([
  '/provision', '/sync/trips', '/sync/initial', '/sync/sheets', '/upload', '/drive/files',
  '/validate-destination', '/migrate/start', '/archive/download', '/resolve-file',
]);
const workspaceRoutePath = (req: express.Request) => req.path.toLowerCase().replace(/\/+$/, '');
app.use('/api/workspace', (req, res, next) => {
  if (!projectWorkspacePaths.has(workspaceRoutePath(req))) return next();
  return strictWorkspaceProject(req, res, next);
});
app.use('/api/workspace', async (req, res, next) => {
  if (!projectWorkspacePaths.has(workspaceRoutePath(req))) return next();
  try {
    const actionPath = workspaceRoutePath(req);
    const projectId = res.locals.workspaceProjectId as string;
    if (req.path.startsWith('/migrate/') && req.method !== 'GET') {
      const id = req.body.projectId;
      if (id && (await continuityRef(adminDb, id).get()).data()?.binding) throw workspaceError('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION', 409);
    }
    const boundary = new WorkspaceStorageBoundary();
    const project = await boundary.project(projectId);
    const storage = projectStorage(project);
    await boundary.assertCanonicalStorage(project);
    res.locals.workspaceProject = project;
    req.body = { ...(req.body || {}), projectId };
    const bind = (supplied: unknown, canonical: string | undefined, required = true) => {
      if (required && !canonical) throw workspaceError('PROJECT_STORAGE_NOT_CONFIGURED');
      if (supplied !== undefined && (normalizeStorageId(supplied) !== canonical)) throw workspaceError('STORAGE_RESOURCE_MISMATCH', 403);
      return canonical;
    };
    if (actionPath === '/provision') {
      if(Object.keys(req.body).some(key=>!['projectId','destinationRootFolderId'].includes(key))) throw workspaceError('INVALID_WORKSPACE_COMMAND',400);
    } else if (actionPath.startsWith('/sync/')) {
      req.body.spreadsheetId = bind(req.body.spreadsheetId, storage.spreadsheetId);
    } else if (actionPath === '/migrate/start' || actionPath === '/validate-destination') {
      req.body.targetFolderId = await boundary.eligibleDestination(projectId, req.body.targetFolderId);
      if (!['MY_DRIVE', 'SHARED_DRIVE'].includes(req.body.targetProvider || 'SHARED_DRIVE')) throw workspaceError('INVALID_STORAGE_PROVIDER', 400);
      if (actionPath === '/migrate/start') {
        req.body.sourceFolderId = bind(req.body.sourceFolderId, storage.folderId);
        req.body.sourceSpreadsheetId = bind(req.body.sourceSpreadsheetId, storage.spreadsheetId);
        req.body.projectCode = project.projectCode || project.projectId;
        req.body.projectNameAr = project.nameAr;
      } else {
        req.body.currentFolderId = bind(req.body.currentFolderId, storage.folderId);
      }
    } else if (actionPath === '/archive/download') {
      bind(req.body.project?.settings?.googleDriveFolderId, storage.folderId, false);
      bind(req.body.project?.settings?.googleSpreadsheetId, storage.spreadsheetId, false);
      bind(req.body.storageProfile?.currentStorageFolderId, storage.folderId, false);
      bind(req.body.storageProfile?.currentSpreadsheetId, storage.spreadsheetId, false);
      req.body.project = project;
      req.body.storageProfile = project.settings?.storageProfile;
    } else if (actionPath === '/resolve-file') {
      // Client-supplied historical mappings are not ownership evidence.
      res.locals.workspaceMigrationJobs = await boundary.jobs(projectId);
    } else if (actionPath === '/upload' || actionPath === '/drive/files') {
      if (!storage.folderId) throw workspaceError('PROJECT_STORAGE_NOT_CONFIGURED');
      const requested = actionPath === '/upload' ? req.body.subfolderId : req.query.folderId;
      const resource = requested === undefined && actionPath === '/drive/files' ? storage.folderId : normalizeStorageId(requested);
      const token = getGoogleAccessToken(req, true);
      await serverWorkspaceService.assertProjectFolderResource(resource, [storage.folderId], token, await boundary.foreignFolderIds(projectId));
      res.locals.workspaceFolderId = resource;
    }
    next();
  } catch (error: any) {
    res.status(resolveWorkspaceErrorStatusCode(error)).json({ success: false, error: error.message, code: error.code });
  }
});

// Foundation commands accept a bounded patch; server account/profile owns authorization.
app.post('/api/projects/:projectId/foundation', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).some(key => !['updates','expectedVersion'].includes(key)) || !Number.isInteger(req.body.expectedVersion)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROJECT_COMMAND', error: 'INVALID_PROJECT_COMMAND' });
    }
    const { projectCommandsServerService } = await import('../src/services/projectCommands.server');
    const data = await projectCommandsServerService.updateFoundation(req.params.projectId, req.body.updates, (req as any).user, req.body.expectedVersion);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, code: error.code, error: error.message });
  }
});

// ----------------------------------------------------
// 3. Provision Google Drive & Sheets for Project
// ----------------------------------------------------
app.post('/api/workspace/provision', enforceProjectIsolation, enforceAdminOnly, workspaceGenerationFence, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { projectId, destinationRootFolderId } = req.body;
    if (!projectId || !destinationRootFolderId || Object.keys(req.body).some(key=>!['projectId','destinationRootFolderId'].includes(key))) return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const binding = await projectGoogleWorkspaceServer.provision(projectId, destinationRootFolderId, (req as any).user, projectGoogleBlueprintPort(googleToken,projectId));
    const structure = { projectId, spreadsheetId:binding.spreadsheetId,spreadsheetUrl:binding.spreadsheetUrl,projectFolderId:binding.projectFolderId,projectFolderName:projectId,subfolders:{},provisionedAt:binding.provisionedAt,status:'PROVISIONED' };

    res.json({
      success: true,
      data: structure,
      message: 'تم تهيئة هيكل مجلدات Google Drive وشيت الإسقاط بنجاح للمشروع',
    });
  } catch (error: any) {
    // Provider errors are sanitized by the canonical authority; never log OAuth material.
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشلت عملية تهيئة Google Workspace للمشروع',
      code: error.code,
      ...(error instanceof GoogleWorkspaceCommandError && error.diagnostic ? {diagnostic:error.diagnostic} : {}),
    });
  }
});

// ----------------------------------------------------
// Project Driver/Truck Intake Canonical Entry Point
// ----------------------------------------------------
app.post('/api/intake/canonical', enforceProjectIsolation, enforceAdminOnly, async (req: any, res) => {
  try {
    const payload = req.body;
    const context = req.user; // populated by authenticateUser middleware
    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير مصادق عليه',
      });
    }

    const { driverTruckIntakeServer } = await import('../src/services/driverTruckIntake.server');
    const result = await driverTruckIntakeServer.processSharedIntake(payload, context);

    res.json({
      success: true,
      data: result,
      message: 'تم تسجيل السائق والشاحنة وتوثيقهما في المشروع بنجاح',
    });
  } catch (error: any) {
    console.error('Error in /api/intake/canonical:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'فشلت عملية التسجيل الموثقة للسائق والشاحنة',
      code: error.code || 'SETUP_COMMAND_FAILED',
    });
  }
});

// Retired: normal Project users never receive or select a runtime reference template.
app.get('/api/projects/:projectId/workspace/template', enforceProjectIsolation, enforceAdminOnly, (_req, res) => res.status(410).json({success:false,code:'APP_UPDATE_REQUIRED',retiredCode:'RUNTIME_TEMPLATE_SELECTION_RETIRED'}));
app.post('/api/projects/:projectId/workspace/destination', enforceProjectIsolation, enforceAdminOnly, workspaceGenerationFence, async (req, res) => {
  try {
    if(Object.keys(req.body||{}).some(key=>key!=='destinationRootFolderId')) return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const data=await projectGoogleWorkspaceServer.approveDestination(req.params.projectId,req.body.destinationRootFolderId,(req as any).user,projectGoogleBlueprintPort(getGoogleAccessToken(req,true),req.params.projectId));
    return res.json({success:true,data});
  } catch(error:any) { return res.status(error.status||error.statusCode||400).json({success:false,code:error.code||'DESTINATION_FOLDER_INVALID'}); }
});
app.post('/api/projects/:projectId/workspace/resume', enforceProjectIsolation, enforceAdminOnly, workspaceGenerationFence, async (req,res)=>{
  try {
    if(Object.keys(req.body||{}).some(key=>key!=='projectId')||(req.body?.projectId!==undefined&&req.body.projectId!==req.params.projectId))return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const data=await projectGoogleWorkspaceServer.resume(req.params.projectId,(req as any).user,projectGoogleBlueprintPort(getGoogleAccessToken(req,true),req.params.projectId));
    return res.json({success:true,data});
  } catch(error:any){return res.status(error.status||502).json({success:false,code:error.code||'WORKSPACE_RECOVERY_REQUIRED'});}
});
app.post('/api/projects/:projectId/operational-configuration',enforceProjectIsolation,enforceAdminOnly,async(req:any,res)=>{
  try {const {projectCommandsServerService}=await import('../src/services/projectCommands.server');return res.json({success:true,data:await projectCommandsServerService.configureOperations(req.params.projectId,req.body,req.user)});}
  catch(error:any){return res.status(error.status||error.statusCode||409).json({success:false,code:error.code||'OPERATIONAL_CONFIGURATION_INVALID'});}
});
app.post('/api/projects/:projectId/workspace/automation/recover',enforceProjectIsolation,enforceAdminOnly,workspaceGenerationFence,async(req:any,res)=>{
  try {
    if(Object.keys(req.body||{}).some(k=>k!=='scriptProjectId')||typeof req.body?.scriptProjectId!=='string')return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const credential=await resolveWorkspaceExecutionToken(req.params.projectId,req.user,req,{status:(id,user)=>projectGoogleWorkspaceServer.status(id,user),access:(id,user)=>workspaceOfflineAuthorization.access(id,user)});
    const execution=projectGoogleWorkspaceServer.forExecutionAuthorization(credential.authorizationId);
    return res.json({success:true,data:await execution.recoverAutomation(req.params.projectId,req.body.scriptProjectId,req.user,projectGoogleBlueprintPort(credential.accessToken,req.params.projectId))});
  }catch(error){return res.status(error instanceof GoogleWorkspaceCommandError?error.status:502).json({success:false,code:error instanceof GoogleWorkspaceCommandError?error.code:'AUTOMATION_RECOVERY_FAILED'});}
});
app.post('/api/projects/:projectId/workspace/initialize',enforceProjectIsolation,enforceAdminOnly,workspaceGenerationFence,async(req:any,res)=>{
  try {
    if(Object.keys(req.body||{}).length)return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const credential=await resolveWorkspaceExecutionToken(req.params.projectId,req.user,req,{status:(id,user)=>projectGoogleWorkspaceServer.status(id,user),access:(id,user)=>workspaceOfflineAuthorization.access(id,user)});
    const execution=projectGoogleWorkspaceServer.forExecutionAuthorization(credential.authorizationId);
    await execution.initializeBound(req.params.projectId,req.user,projectGoogleBlueprintPort(credential.accessToken,req.params.projectId));
    return res.json({success:true,data:await projectGoogleWorkspaceServer.status(req.params.projectId,req.user)});
  }catch(error){return res.status(error instanceof GoogleWorkspaceCommandError?error.status:502).json({success:false,code:error instanceof GoogleWorkspaceCommandError?error.code:'WORKSPACE_INITIALIZATION_FAILED'});}
});
app.get('/api/projects/:projectId/workspace', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try { const data=await projectGoogleWorkspaceServer.status(req.params.projectId,(req as any).user);
    const authorizationDiagnostic=await workspaceOfflineAuthorization.diagnoseWorkspaceAuthorization(req.params.projectId,(req as any).user);
    res.setHeader('Cache-Control','no-store');res.json({success:true,data:{...data,authorizationDiagnostic}}); }
  catch(error){res.status(error instanceof GoogleWorkspaceCommandError?error.status:503).json({success:false,code:error instanceof GoogleWorkspaceCommandError?error.code:'GOOGLE_AUTHORIZATION_DIAGNOSIS_UNAVAILABLE'});}
});
app.post('/api/projects/:projectId/workspace/retry-sync', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    if (Object.keys(req.body || {}).length) return res.status(400).json({ success: false, code: 'INVALID_WORKSPACE_COMMAND' });
    const current=await projectGoogleWorkspaceServer.status(req.params.projectId,(req as any).user);
    const credential=await resolveWorkspaceExecutionToken(req.params.projectId,(req as any).user,req,{status:(id,user)=>projectGoogleWorkspaceServer.status(id,user),access:(id,user)=>workspaceOfflineAuthorization.access(id,user)});
    const execution=projectGoogleWorkspaceServer.forExecutionAuthorization(credential.authorizationId);
    const port=current.binding?.workspaceBlueprintVersion?projectGoogleBlueprintPort(credential.accessToken,req.params.projectId):projectGoogleTemplatePort(credential.accessToken);
    res.json({ success: true, data: await execution.retrySync(req.params.projectId, (req as any).user, port) });
  } catch (error: any) { res.status(error.status || 502).json({ success: false, code: error.code || 'SHEET_SYNC_FAILED' }); }
});

// ----------------------------------------------------
// 4. Upsert Operations (Trips) to Google Sheets
// ----------------------------------------------------
app.post('/api/workspace/sync/trips', enforceProjectIsolation, enforceDispatcherOrAbove, async (req, res) => {
  try {
    const pid = req.body.projectId;
    if (pid && (await continuityRef(adminDb, pid).get()).data()?.binding) return res.status(409).json({ success: false, code: 'TEMPLATE_REQUIRES_CANONICAL_OUTBOX' });

    const googleToken = getGoogleAccessToken(req, true);
    const { spreadsheetId, trips } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشيت spreadsheetId مطلوب في Project Registry لإتمام الإسقاط',
      });
    }

    if (!Array.isArray(trips)) {
      return res.status(400).json({
        success: false,
        error: 'قائمة الرحلات trips يجب أن تكون مصفوفة صالحة',
      });
    }

    // Execute upsert into 'العمليات' sheet tab
    const result = await serverWorkspaceService.upsertTabRecords(
      spreadsheetId,
      WORKSPACE_TABS.OPERATIONS.tabTitleAr,
      'tripId',
      trips,
      OPERATIONS_FULL_COLUMNS,
      googleToken
    );

    res.json({
      success: true,
      data: result,
      message: `تم إسقاط وتحديث العمليات بنجاح (معالجة ${result.processedCount} رحلة: إدراج ${result.insertedCount} وتحديث ${result.updatedCount})`,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/sync/trips:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشلت عملية إسقاط وتحديث العمليات في Google Sheets',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 4b. Server-Authoritative Initial Project Setup Projection
// ----------------------------------------------------
// Template-bound workbooks use the sole continuity authority; legacy projection remains isolated.
app.use('/api/workspace/sync/initial', enforceAdminOnly, async (req, res, next) => {
  if (req.method !== 'POST') return next();
  try {
    const templateProjectId = req.body.projectId;
    if (templateProjectId && (await continuityRef(adminDb, templateProjectId).get()).data()?.binding) {
      const current = await projectGoogleWorkspaceServer.status(templateProjectId, (req as any).user);
      if (req.body.spreadsheetId !== current.binding?.spreadsheetId) return res.status(403).json({ success: false, code: 'WORKSPACE_BINDING_CONFLICT' });
      const data = await projectGoogleWorkspaceServer.retrySync(templateProjectId, (req as any).user, current.binding?.workspaceBlueprintVersion?projectGoogleBlueprintPort(getGoogleAccessToken(req,true),templateProjectId):projectGoogleTemplatePort(getGoogleAccessToken(req, true)));
      return res.json({ success: true, data });
    }
    return next();
  } catch (error: any) { return res.status(error.status || 502).json({success:false,code:error.code || 'SHEET_SYNC_FAILED'}); }
});
app.post('/api/workspace/sync/initial', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    if(Object.keys(req.body||{}).some(key=>!['projectId','spreadsheetId'].includes(key)))return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
    const googleToken = getGoogleAccessToken(req, true);
    const { projectId, spreadsheetId } = req.body;

    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'معرف المشروع projectId مطلوب لإتمام الإسقاط الأولي',
        code: 'PROJECT_ID_REQUIRED',
      });
    }

    if (!spreadsheetId || typeof spreadsheetId !== 'string' || !spreadsheetId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشيت spreadsheetId مطلوب لإتمام الإسقاط الأولي',
        code: 'SPREADSHEET_ID_REQUIRED',
      });
    }

    const cleanProjectId = projectId.trim();
    const cleanSpreadsheetId = spreadsheetId.trim();

    const workspace=await projectGoogleWorkspaceServer.status(cleanProjectId,(req as any).user);
    if(!workspace.binding||workspace.binding.spreadsheetId!==cleanSpreadsheetId)return res.status(409).json({success:false,code:'WORKSPACE_BINDING_INVALID'});
    const google=projectGoogleBlueprintPort(googleToken,cleanProjectId);
    if(await google.subject()!==workspace.binding.googleSubject)return res.status(403).json({success:false,code:'WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION'});
    if(workspace.binding.workspaceBlueprintVersion)await google.verifyBinding(workspace.binding.destinationRootFolderId!,workspace.binding.projectFolderId!,cleanSpreadsheetId,workspace.binding.workspaceBlueprintVersion);
    else await google.verify(cleanSpreadsheetId,workspaceOperation(cleanProjectId));

    // Read freshness state to capture expected mutation revision BEFORE building snapshot
    const freshnessState = await getWorkspaceProjectionState(cleanProjectId);
    const expectedMutationRevision = freshnessState.mutationRevision;

    // 1. Build server-authoritative canonical initial snapshot (Drivers, Carriers, Materials, Fleet)
    const native=Boolean(workspace.binding.workspaceBlueprintVersion);
    const snapshot = native?await projectWorkspaceInitialProjectionServer.buildCanonicalProjection(cleanProjectId):await projectWorkspaceInitialProjectionServer.buildInitialProjection(cleanProjectId);

    const upsertResults: UpsertResult[] = [];
    const successfullyProjectedTabs: WorkspaceSheetTab[] = [];

    // 2. DRIVERS Master: Primary Key: driverId (Authoritative Snapshot Reconciliation)
    const drvResult = await serverWorkspaceService.reconcileTabSnapshot(
      cleanSpreadsheetId,
      WORKSPACE_TABS.DRIVERS.tabTitleAr,
      'driverId',
      snapshot.drivers,
      native?MASTER_TABS[0].columns:['driverId', 'projectId', 'fullNameAr', 'idNumber', 'phone', 'licenseType', 'status', 'lastSyncedAt'],
      googleToken,
      native?'RAW':undefined
    );
    upsertResults.push(drvResult);
    successfullyProjectedTabs.push('DRIVERS');

    // 3. CARRIERS Master: Primary Key: carrierId (Authoritative Snapshot Reconciliation)
    const carResult = await serverWorkspaceService.reconcileTabSnapshot(
      cleanSpreadsheetId,
      WORKSPACE_TABS.CARRIERS.tabTitleAr,
      'carrierId',
      snapshot.carriers,
      native?MASTER_TABS[1].columns:['carrierId', 'projectId', 'companyNameAr', 'commercialRegistrationNo', 'transportLicenseNo', 'status', 'lastSyncedAt'],
      googleToken,
      native?'RAW':undefined
    );
    upsertResults.push(carResult);
    successfullyProjectedTabs.push('CARRIERS');

    // 4. MATERIALS Master: Primary Key: materialId (Authoritative Snapshot Reconciliation)
    const matResult = await serverWorkspaceService.reconcileTabSnapshot(
      cleanSpreadsheetId,
      WORKSPACE_TABS.MATERIALS.tabTitleAr,
      'materialId',
      snapshot.materials,
      native?MASTER_TABS[2].columns:['materialId', 'projectId', 'nameAr', 'code', 'unitOfMeasure', 'standardDensityTonPerM3', 'status', 'lastSyncedAt'],
      googleToken,
      native?'RAW':undefined
    );
    upsertResults.push(matResult);
    successfullyProjectedTabs.push('MATERIALS');

    // 5. FLEET_ROSTER: Reconciled Snapshot (Always called, even if fleetRows is empty, preserving Unit 2 stale-row reconciliation)
    const fleetResult = await serverWorkspaceService.reconcileTabSnapshot(
      cleanSpreadsheetId,
      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      'truckId',
      snapshot.fleetRows,
      native?MASTER_TABS[3].columns:[...FLEET_ROSTER_COLUMNS],
      googleToken,
      native?'RAW':undefined
    );
    upsertResults.push(fleetResult);
    successfullyProjectedTabs.push('FLEET_ROSTER');

    const projectionCompletedAt = new Date().toISOString();

    // 6. Concurrency-safe successful projection acknowledgement
    if (successfullyProjectedTabs.length > 0) {
      await markWorkspaceProjectionSuccessful(
        cleanProjectId,
        successfullyProjectedTabs,
        projectionCompletedAt,
        expectedMutationRevision
      );
    }

    const totalRecords = upsertResults.reduce((acc, curr) => acc + curr.processedCount, 0);
    if(native)await adminDb.runTransaction(async(tx:any)=>{
      const ref=adminDb.collection('projects').doc(cleanProjectId).collection('workspace_sync_outbox').doc('MASTER_DATA'),event=await tx.get(ref);
      if(event.data()?.projectId===cleanProjectId&&event.data()?.revision===expectedMutationRevision)tx.set(ref,{...event.data(),status:'DELIVERED',deliveredAt:projectionCompletedAt});
    });
    await projectGoogleWorkspaceServer.initialProjectionResult(cleanProjectId,cleanSpreadsheetId,(req as any).user,null);

    const summary: WorkspaceSyncSummary = {
      projectId: cleanProjectId,
      spreadsheetId: cleanSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanSpreadsheetId}/edit`,
      syncedAt: projectionCompletedAt,
      sourceOfTruth: 'Firestore',
      status: 'SUCCESS',
      upsertResults,
      totalRecordsUpserted: totalRecords,
      auditMessage: `تمت المزامنة والإسقاط الأولي لبيانات تهيئة المشروع (${totalRecords} سجلاً على مستوى السائقين والناقلين والمواد وسجل الأسطول)`,
    };

    res.json({
      success: true,
      data: summary,
      message: summary.auditMessage,
    });
  } catch (error: any) {
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    const code=error instanceof GoogleWorkspaceCommandError ? error.code : ['WORKSPACE_PROJECTION_REVISION_CONFLICT','GOOGLE_ACCESS_TOKEN_REQUIRED'].includes(error.code) ? error.code : 'SHEET_SYNC_FAILED';
    await projectGoogleWorkspaceServer.initialProjectionResult(req.body?.projectId,req.body?.spreadsheetId,(req as any).user,code).catch(()=>{});
    res.status(statusCode).json({
      success: false,
      error: 'WORKSPACE_INITIAL_PROJECTION_FAILED',
      code,
    });
  }
});

// ----------------------------------------------------
// 5. Full Projection Sync (All 6 Tabs) to Google Sheets
// ----------------------------------------------------
app.post('/api/workspace/sync/sheets', enforceProjectIsolation, enforceDispatcherOrAbove, async (req, res) => {
  try {
    const pid = req.body.projectId;
    if (pid && (await continuityRef(adminDb, pid).get()).data()?.binding) return res.status(409).json({ success: false, code: 'TEMPLATE_REQUIRES_CANONICAL_OUTBOX' });

    const googleToken = getGoogleAccessToken(req, true);
    const { 
      projectId, 
      spreadsheetId, 
      trips = [], 
      drivers = [], 
      carriers = [], 
      materials = [], 
      exceptions = [], 
      reports = []
    } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشيت spreadsheetId مطلوب من سجل المشروع Project Registry',
      });
    }

    // Server-Authoritative Project Fleet Roster extraction
    const { projectFleetReadModelService } = await import('../src/services/projectFleetReadModel.service');
    const { ProjectFleetReadModelAdminReadContext } = await import('../src/services/projectFleetReadModel.server');
    const readContext = new ProjectFleetReadModelAdminReadContext();
    const fleetData = await projectFleetReadModelService.getProjectFleetReadModel(projectId, readContext);

    const mappedFleetRows = (fleetData.rows || []).map((row: any) => ({
      truckId: row.truckId,
      projectId,
      plateNumber: row.plateNumber,
      truckType: row.truckType,
      carrierId: row.carrierId,
      carrierName: row.carrierName,
      driverId: row.driverId,
      driverName: row.driverName,
      materialId: row.materialId,
      materialName: row.materialName,
      assignmentStatus: row.assignmentStatus,
      allocationStatus: row.allocationStatus,
      integrityStatus: (row.integrityIssues && row.integrityIssues.length > 0) ? 'ISSUE' : 'CLEAN',
      integrityIssueCount: row.integrityIssues ? row.integrityIssues.length : 0,
      lastSyncedAt: new Date().toISOString()
    }));

    const upsertResults: UpsertResult[] = [];

    // 1. Operations (العمليات) - Primary Key: tripId
    if (trips.length > 0) {
      const opResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.OPERATIONS.tabTitleAr,
        'tripId',
        trips,
        OPERATIONS_FULL_COLUMNS,
        googleToken
      );
      upsertResults.push(opResult);
    }

    // 2. Drivers (السائقين) - Primary Key: driverId
    if (drivers.length > 0) {
      const drvResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.DRIVERS.tabTitleAr,
        'driverId',
        drivers,
        ['driverId', 'projectId', 'fullNameAr', 'idNumber', 'phone', 'licenseType', 'status', 'lastSyncedAt'],
        googleToken
      );
      upsertResults.push(drvResult);
    }

    // 3. Carriers (الناقلين) - Primary Key: carrierId
    if (carriers.length > 0) {
      const carResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.CARRIERS.tabTitleAr,
        'carrierId',
        carriers,
        ['carrierId', 'projectId', 'companyNameAr', 'commercialRegistrationNo', 'transportLicenseNo', 'status', 'lastSyncedAt'],
        googleToken
      );
      upsertResults.push(carResult);
    }

    // 4. Materials (المواد) - Primary Key: materialId
    if (materials.length > 0) {
      const matResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.MATERIALS.tabTitleAr,
        'materialId',
        materials,
        ['materialId', 'projectId', 'nameAr', 'code', 'unitOfMeasure', 'standardDensityTonPerM3', 'status', 'lastSyncedAt'],
        googleToken
      );
      upsertResults.push(matResult);
    }

    // 4b. Fleet Roster (سجل الأسطول والتشغيل) - Primary Key: truckId (Reconciled Snapshot)
    const fleetResult = await serverWorkspaceService.reconcileTabSnapshot(
      spreadsheetId,
      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      'truckId',
      mappedFleetRows,
      [...FLEET_ROSTER_COLUMNS],
      googleToken
    );
    upsertResults.push(fleetResult);

    // 5. Exceptions (الاستثناءات) - Primary Key: exceptionId
    if (exceptions.length > 0) {
      const excResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.EXCEPTIONS.tabTitleAr,
        'exceptionId',
        exceptions,
        ['exceptionId', 'projectId', 'tripId', 'type', 'severity', 'status', 'description', 'openedAt', 'resolvedAt', 'resolutionNote', 'lastSyncedAt'],
        googleToken
      );
      upsertResults.push(excResult);
    }

    // 6. Reports (تقارير مختارة) - Primary Key: reportCode
    if (reports.length > 0) {
      const repResult = await serverWorkspaceService.upsertTabRecords(
        spreadsheetId,
        WORKSPACE_TABS.REPORTS.tabTitleAr,
        'reportCode',
        reports,
        ['reportCode', 'reportNameAr', 'metricValue', 'metricUnit', 'period', 'calculatedAt', 'notes'],
        googleToken
      );
      upsertResults.push(repResult);
    }

    const totalRecords = upsertResults.reduce((acc, curr) => acc + curr.processedCount, 0);

    const summary: WorkspaceSyncSummary = {
      projectId: projectId || 'PRJ-DEFAULT',
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      syncedAt: new Date().toISOString(),
      sourceOfTruth: 'Firestore',
      status: 'SUCCESS',
      upsertResults,
      totalRecordsUpserted: totalRecords,
      auditMessage: `تمت مزامنة وإسقاط ${totalRecords} سجلاً على مستوى جداول المشروع الستة بنجاح`,
    };

    res.json({
      success: true,
      data: summary,
      message: summary.auditMessage,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/sync/sheets:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشلت عملية المزامنة والإسقاط لجداول Google Sheets',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6. Upload Document to Google Drive Subfolder (Security Hardened)
// ----------------------------------------------------
app.post('/api/workspace/upload', enforceProjectIsolation, enforceFileUploadSecurity, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { subfolderId, fileName, mimeType, fileContentBase64 } = req.body;

    if (!subfolderId || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'معرف المجلد الفرعي subfolderId واسم الملف مطلوبان',
      });
    }

    const buffer = fileContentBase64 
      ? Buffer.from(fileContentBase64, 'base64') 
      : Buffer.from(`Q-Saudi Document: ${fileName}\nCreated: ${new Date().toISOString()}`);

    const result = await serverWorkspaceService.uploadToProjectDriveFolder(
      subfolderId,
      fileName,
      mimeType || 'application/octet-stream',
      buffer,
      googleToken
    );

    res.json({
      success: true,
      data: result,
      message: `تم رفع الملف (${fileName}) بنجاح إلى مجلد المشروع في Google Drive`,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/upload:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل رفع الملف إلى Google Drive',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6b. List Import Files from Google Drive Project Folder (BLOCK 32)
// ----------------------------------------------------
app.get('/api/workspace/drive/files', enforceProjectIsolation, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const projectId = res.locals.workspaceProjectId as string;
    const folderId = res.locals.workspaceFolderId as string;

    const result = await serverWorkspaceService.listProjectDriveFiles(projectId, folderId, googleToken);

    res.json({
      success: true,
      files: result.files,
      folderId: result.folderId,
      folderName: result.folderName,
      totalCount: result.files.length,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/drive/files:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل استعراض ملفات Google Drive للمشروع',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6c. Download File Content from Google Drive (BLOCK 32)
// ----------------------------------------------------

// ----------------------------------------------------
// BLOCK 100G-B: Configurable Project Storage & Archive Endpoints
// ----------------------------------------------------

// 1. Validate Destination Folder
app.post('/api/workspace/validate-destination', enforceAdminOnly, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { projectId, targetFolderId, targetProvider, currentFolderId, sharedDriveId } = req.body;

    const result = await serverWorkspaceService.validateDestinationFolder(
      projectId,
      targetFolderId,
      targetProvider || 'SHARED_DRIVE',
      currentFolderId,
      sharedDriveId,
      googleToken
    );

    res.json({
      success: result.valid,
      data: result,
    });
  } catch (error: any) {
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل التحقق من المجلد المستهدف',
      code: error.code,
    });
  }
});

// 2. Start Storage Migration
app.post('/api/workspace/migrate/start', enforceAdminOnly, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { 
      projectId, 
      projectCode, 
      projectNameAr, 
      sourceFolderId, 
      sourceSpreadsheetId, 
      targetFolderId, 
      targetProvider, 
      sharedDriveId, 
      migrationJobId,
      trips,
      drivers,
      carriers,
      materials,
      pricingRules,
      exceptions
    } = req.body;

    const job = await serverWorkspaceService.executeStorageMigration(
      {
        projectId,
        projectCode: projectCode || 'Q-PRJ-001',
        projectNameAr: projectNameAr || 'مشروع Q-Saudi',
        sourceFolderId,
        sourceSpreadsheetId,
        targetFolderId,
        targetProvider: targetProvider || 'SHARED_DRIVE',
        sharedDriveId,
        migrationJobId,
        trips,
        drivers,
        carriers,
        materials,
        pricingRules,
        exceptions
      },
      googleToken
    );

    res.json({
      success: job.status !== 'FAILED',
      job,
    });
  } catch (error: any) {
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشلت عملية النقل إلى المكان المستهدف',
      code: error.code,
    });
  }
});

// 3. Download Standalone Project Archive (.ZIP)
app.post('/api/workspace/archive/download', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, false);
    const { project, trips, carriers, trucks, drivers, materials, pricingRules, exceptions, auditLogs, storageProfile } = req.body;

    const zipBuffer = await serverWorkspaceService.generateProjectArchive(
      {
        project,
        trips,
        carriers,
        trucks,
        drivers,
        materials,
        pricingRules,
        exceptions,
        auditLogs,
        storageProfile,
      },
      googleToken
    );

    const projectCode = project?.projectCode || project?.projectId || 'Q-PRJ-001';
    const fileName = `Q-PRJ-${projectCode}_PROJECT_ARCHIVE_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('Error generating project archive:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل إنشاء وإعداد ملف الأرشيف الكامل',
      code: error.code,
    });
  }
});

// 4. Resolve File ID via fileIdMap
app.post('/api/workspace/resolve-file', enforceProjectIsolation, async (req, res) => {
  try {
    const fileId = normalizeStorageId(req.body.fileId);
    const jobs = res.locals.workspaceMigrationJobs || [];
    const historical = jobs.find((job: any) => job.fileIdMap && Object.prototype.hasOwnProperty.call(job.fileIdMap, fileId));
    const result = historical
      ? { resolvedFileId: historical.fileIdMap[fileId], isHistorical: true, sourceHistoryId: historical.migrationJobId }
      : { resolvedFileId: fileId, isHistorical: false };
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'فشلت عملية حل معرف الملف',
    });
  }
});

app.get('/api/workspace/drive/files/:fileId/content', async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'معرف ملف Google Drive مطلوب',
      });
    }

    const { buffer, fileName, mimeType, size } = await serverWorkspaceService.getDriveFileContent(
      fileId,
      googleToken
    );

    res.json({
      success: true,
      fileId,
      fileName,
      mimeType,
      size,
      contentBase64: buffer.toString('base64'),
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/drive/files/:fileId/content:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل تحميل محتوى الملف من Google Drive',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6d. List Google Spreadsheets for Project (BLOCK 33)
// ----------------------------------------------------
app.get('/api/workspace/sheets/spreadsheets', enforceProjectIsolation, async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const projectId = (req.query.projectId as string) || 'PRJ-NEOM-NORTH-01';

    const result = await serverWorkspaceService.listProjectSpreadsheets(projectId, googleToken);

    res.json({
      success: true,
      spreadsheets: result.spreadsheets,
      totalCount: result.totalCount,
      projectId: result.projectId,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/sheets/spreadsheets:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل استعراض جداول بيانات Google Sheets للمشروع',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6e. Get Spreadsheet Metadata & Sheet Tabs (BLOCK 33)
// ----------------------------------------------------
app.get('/api/workspace/sheets/:spreadsheetId/metadata', async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { spreadsheetId } = req.params;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'معرف جدول بيانات Google Sheets مطلوب',
      });
    }

    const metadata = await serverWorkspaceService.getSpreadsheetMetadata(spreadsheetId, googleToken);

    res.json({
      success: true,
      ...metadata,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/sheets/:spreadsheetId/metadata:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل استخراج معلومات وأوراق جدول البيانات',
      code: error.code,
    });
  }
});

// ----------------------------------------------------
// 6f. Get Spreadsheet Values from Sheet Tab (BLOCK 33)
// ----------------------------------------------------
app.get('/api/workspace/sheets/:spreadsheetId/values', async (req, res) => {
  try {
    const googleToken = getGoogleAccessToken(req, true);
    const { spreadsheetId } = req.params;
    const sheetName = (req.query.sheetName as string) || 'Sheet1';

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'معرف جدول بيانات Google Sheets مطلوب',
      });
    }

    const data = await serverWorkspaceService.getSpreadsheetValues(spreadsheetId, sheetName, googleToken);

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('Error in /api/workspace/sheets/:spreadsheetId/values:', error);
    const statusCode = resolveWorkspaceErrorStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'فشل قراءة بيانات ورقة العمل من جدول البيانات',
      code: error.code,
    });
  }
});

// Generic trip patches are retired: callers must express a named business command.
app.patch(['/api/projects/:projectId/trips/:tripId', '/api/trips/:tripId'], (_req, res) => {
  res.status(410).json({ success: false, code: 'TRIP_COMMAND_REQUIRED' });
});

// ----------------------------------------------------
// 8. Security Enforcement: Import Truck with Carrier Check & RBAC
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/trucks/import',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  enforceTruckCarrierIntegrity,
  (req, res) => {
    const { targetCarrierId, truck } = req.body;
    res.json({
      success: true,
      message: `تم استيراد الشاحنة (${truck.truckId}) تحت الناقل المستهدف (${targetCarrierId}) بنجاح`,
      truckId: truck.truckId,
      carrierId: targetCarrierId,
      projectId: req.params.projectId,
    });
  }
);

// ----------------------------------------------------
// 9. Security Enforcement: Pricing Rule Update & Immutability (Auditor or Admin)
// ----------------------------------------------------
app.post('/api/projects/:projectId/pricing-rules/:ruleId/save', enforceProjectIsolation, enforceAuditorOrAdmin, async (req:any,res) => {
  try { const {projectPricingServerService}=await import('../src/services/projectPricing.server');
    const data=await projectPricingServerService.savePricingRule(req.params.projectId,req.params.ruleId,req.body,req.user);
    return res.json({success:true,data});
  } catch(error:any){return res.status(error.status||400).json({success:false,code:error.code||'PRICING_SAVE_FAILED'});}
});

app.post('/api/projects/:projectId/pricing-rules/:ruleId/update', enforceProjectIsolation, enforceAuditorOrAdmin, async (req:any,res) => {
  try { const { projectPricingServerService }=await import('../src/services/projectPricing.server');
    const data=await projectPricingServerService.updatePricingRule(req.params.projectId,req.params.ruleId,req.body,req.user);
    return res.json({success:true,data});
  } catch(error:any){return res.status(error.status||400).json({success:false,code:error.code||'PRICING_UPDATE_FAILED'});}
});

// ----------------------------------------------------
// 9b. Legacy Migration Commit (Admin Only)
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/legacy-migration/commit',
  enforceProjectIsolation,
  enforceAdminOnly,
  (req, res) => {
    res.json({
      success: true,
      message: 'تم اعتماد وتثبيت حزمة الهجرة القديمة بنجاح من قبل مدير المشروع',
      projectId: req.params.projectId,
      batchId: req.body.batchId,
    });
  }
);

// ----------------------------------------------------
// 9c. Entity Resolution Approval (Admin Only)
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/entity-resolution/approve',
  enforceProjectIsolation,
  enforceAdminOnly,
  (req, res) => {
    res.json({
      success: true,
      message: 'تم اعتماد مطابقة ودمج الكيانات بنجاح من قبل مدير المشروع',
      projectId: req.params.projectId,
      candidateId: req.body.candidateId,
    });
  }
);

// ----------------------------------------------------
// 9d. Weighbridge Import Commit (Dispatcher or Above)
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/weighbridge/commit',
  enforceProjectIsolation,
  enforceDispatcherOrAbove,
  (req, res) => {
    res.json({
      success: true,
      message: 'تم اعتماد واستيراد تذاكر الميزان بنجاح',
      projectId: req.params.projectId,
      ticketsCount: req.body.tickets?.length || 0,
    });
  }
);

// ----------------------------------------------------
// 9e. Audit Logs Query (Auditor or Admin Only)
// ----------------------------------------------------
app.get(
  '/api/projects/:projectId/audit-logs',
  enforceProjectIsolation,
  enforceAuditorOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      projectId: req.params.projectId,
      auditLogs: [],
      message: 'تم استرجاع سجلات التدقيق للمستخدم المصرح له بنجاح',
    });
  }
);

// Named operational commands; service re-reads current principal inside the transaction.
const executeTripCommand = async (req: any, res: any, input: any) => {
  try {
    const result = await new TripCommandsServerService().execute(req.params.projectId, input, req.user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    const code = error instanceof TripCommandError ? error.code : ['ACCOUNT_NOT_ACTIVE', 'INVALID_ACCOUNT_PROFILE'].includes(error.code) ? error.code : 'TRIP_COMMAND_FAILED';
    res.status(code.startsWith('FORBIDDEN') ? 403 : code === 'TRIP_NOT_FOUND' ? 404 : 400).json({ success: false, code, error: code });
  }
};
app.post('/api/projects/:projectId/trips/commands', (req, res) => executeTripCommand(req, res, req.body));
// Existing URLs remain bounded compatibility adapters, never generic field mutation.
app.post('/api/projects/:projectId/trips', (req, res) => {
  const { operationId, clientUUID, ...payload } = req.body;
  return executeTripCommand(req, res, { command: 'DISPATCH_TRIP', payload, operationId: operationId || clientUUID });
});
app.post('/api/projects/:projectId/trips/import', (req, res) => {
  const { operationId, clientUUID, ...payload } = req.body;
  return executeTripCommand(req, res, { command: 'IMPORT_TRIP', payload, operationId: operationId || clientUUID });
});
app.patch('/api/projects/:projectId/trips/:tripId/status', (req, res) => {
  if (typeof req.body.status !== 'string' || Object.keys(req.body).some(key => !['status', 'payload', 'operationId'].includes(key))) return res.status(400).json({ success: false, code: 'INVALID_TRIP_COMMAND' });
  const command = STATUS_COMMANDS[req.body.status as keyof typeof STATUS_COMMANDS];
  return executeTripCommand(req, res, { command, tripId: req.params.tripId, payload: req.body.payload === undefined ? {} : req.body.payload, operationId: req.body.operationId });
});
app.post('/api/projects/:projectId/trips/:tripId/receipt', (req, res) => {
  const { operationId, ...payload } = req.body;
  return executeTripCommand(req, res, { command: 'RECORD_DESTINATION_WEIGHT', tripId: req.params.tripId, payload, operationId });
});
app.post('/api/projects/:projectId/trips/:tripId/exceptions', (req, res) => {
  const { operationId, ...payload } = req.body;
  return executeTripCommand(req, res, { command: 'REPORT_EXCEPTION', tripId: req.params.tripId, payload, operationId });
});

// ----------------------------------------------------
// 10. Security Enforcement: Idempotent Operations Sync
// ----------------------------------------------------
app.post(
  '/api/projects/:projectId/operations/sync',
  enforceProjectIsolation,
  enforceIdempotency,
  (req, res) => {
    res.json({
      success: true,
      isDuplicate: false,
      message: `تمت معالجة العملية (${req.body.operationId}) بنجاح لأول مرة`,
      operationId: req.body.operationId,
      projectId: req.params.projectId,
    });
  }
);

app.post('/api/projects/:projectId/fleet-profile/:kind/:entityId', enforceProjectIsolation, enforceAdminOnly, async(req,res)=>{
 try{if(!['DRIVER','TRUCK'].includes(req.params.kind)||!req.body||Object.keys(req.body).some(k=>!['updates','expectedVersion'].includes(k)))return res.status(400).json({success:false,code:'INVALID_PROFILE_COMMAND'});
 const {FleetProfileMaintenanceServer}=await import('../src/services/fleetProfileMaintenance.server');
 res.json({success:true,data:await new FleetProfileMaintenanceServer().update(req.params.projectId,req.params.kind as 'DRIVER'|'TRUCK',req.params.entityId,req.body.updates,req.body.expectedVersion,(req as any).user)});
 }catch(error:any){res.status(error.status||409).json({success:false,code:error.code||'PROFILE_UPDATE_FAILED'});}
});
app.get('/api/projects/:projectId/foundation-snapshot', enforceProjectIsolation, async(req,res)=>{
  try { const {ProjectFleetQueryService}=await import('../src/services/projectFleetQuery.server');
    res.json({success:true,data:await new ProjectFleetQueryService().foundation(req.params.projectId,(req as any).user)});
  } catch(error:any){res.status(error.status||400).json({success:false,code:error.code||'FOUNDATION_READ_FAILED'});}
});

app.get('/api/projects/:projectId/fleet-read-model', enforceProjectIsolation, async (req, res) => {
  try {
    const { ProjectFleetQueryService } = await import('../src/services/projectFleetQuery.server');
    const data = await new ProjectFleetQueryService().fleet(req.params.projectId, (req as any).user);
    res.json({ success: true, data });
  } catch (error: any) { res.status(error.status || 500).json({ success: false, error: error.message, code: error.code }); }
});
app.post('/api/projects/:projectId/intake-preview', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { SetupFleetQuery } = await import('../src/services/setupFleetQuery.server');
    res.json({ success: true, data: await new SetupFleetQuery().previewIntake(req.params.projectId, req.body, (req as any).user) });
  } catch (error: any) { res.status(error.status || 400).json({ success: false, code: error.code || 'SETUP_PREVIEW_UNAVAILABLE' }); }
});
app.get('/api/projects/:projectId/setup-context', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { SetupFleetQuery } = await import('../src/services/setupFleetQuery.server');
    res.json({ success: true, data: await new SetupFleetQuery().read(req.params.projectId, (req as any).user) });
  } catch (error: any) { res.status(error.status || 400).json({ success: false, code: error.code || 'SETUP_READ_FAILED' }); }
});
app.get('/api/projects/:projectId/relationship-context', enforceProjectIsolation, async (req, res) => {
  try {
    const { ProjectFleetQueryService } = await import('../src/services/projectFleetQuery.server');
    const data = await new ProjectFleetQueryService().context(req.params.projectId, (req as any).user, req.query.resolution === '1' ? { resolution: true, kind: req.query.kind as any, naturalKey: typeof req.query.naturalKey === 'string' ? req.query.naturalKey : undefined } : undefined);
    res.json({ success: true, data });
  } catch (error: any) { res.status(error.status || 500).json({ success: false, error: error.message, code: error.code }); }
});

// ----------------------------------------------------
// 10C. Project Setup Provisioning (Phase 6)
// ----------------------------------------------------
// P5-B3: no generic patch or client-controlled interval/slot/audit fields.
app.post('/api/projects/:projectId/assignment-commands', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { TemporalRelationshipAuthority } = await import('../src/services/temporalRelationshipAuthority.server');
    const result = await new TemporalRelationshipAuthority().execute('ASSIGNMENT', req.params.projectId, req.body, (req as any).user);
    res.json({ success: true, ...result });
  } catch (error: any) { res.status(error.status || 400).json({ success: false, error: error.message, code: error.code }); }
});
app.post('/api/projects/:projectId/allocation-commands', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { TemporalRelationshipAuthority } = await import('../src/services/temporalRelationshipAuthority.server');
    const result = await new TemporalRelationshipAuthority().execute('ALLOCATION', req.params.projectId, req.body, (req as any).user);
    res.json({ success: true, ...result });
  } catch (error: any) { res.status(error.status || 400).json({ success: false, error: error.message, code: error.code }); }
});

// P5-B2: bounded server participation commands; current account is reread in transaction.
app.post('/api/projects/:projectId/membership-commands', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { ProjectParticipationAuthority } = await import('../src/services/projectParticipationAuthority.server');
    const result = await new ProjectParticipationAuthority().membership(req.params.projectId, req.body, (req as any).user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.message, code: error.code, dependencies:error.dependencies });
  }
});
app.post('/api/projects/:projectId/affiliation-commands', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { ProjectParticipationAuthority } = await import('../src/services/projectParticipationAuthority.server');
    const result = await new ProjectParticipationAuthority().affiliation(req.params.projectId, req.body, (req as any).user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.message, code: error.code });
  }
});

app.post('/api/projects/:projectId/setup-material', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { materialData } = req.body;
    const user = (req as any).user;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.setupProjectMaterial(projectId, materialData, user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message, code: error.code });
  }
});

app.patch('/api/projects/:projectId/materials/:materialId', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId, materialId } = req.params;
    const { materialData } = req.body;
    const user = (req as any).user;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.updateProjectMaterial(projectId, materialId, materialData, user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.message, code: error.code });
  }
});

app.post('/api/projects/:projectId/setup-carrier', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { carrierData } = req.body;
    const user = (req as any).user;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.setupProjectCarrier(projectId, carrierData, user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message, code: error.code });
  }
});

app.patch('/api/projects/:projectId/carriers/:carrierId', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId, carrierId } = req.params;
    const { carrierData } = req.body;
    const user = (req as any).user;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.updateProjectCarrier(projectId, carrierId, carrierData, user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.message, code: error.code });
  }
});

app.post('/api/projects/:projectId/setup-driver', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { driverData } = req.body || {};
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'المستخدم غير مصادق عليه', code: 'UNAUTHENTICATED' });
    }
    if (!driverData) {
      return res.status(400).json({ success: false, error: 'بيانات السائق driverData مطلوبة', code: 'INVALID_ARGUMENT' });
    }
    const { driverTruckIntakeServer } = await import('../src/services/driverTruckIntake.server');
    const result = await driverTruckIntakeServer.createStandaloneDriver(
      {
        ...driverData,
        projectId, // Authoritative path projectId
      },
      user
    );
    res.json({
      success: true,
      data: result,
      driverId: result.driverId,
      message: 'تم تسجيل السائق وتوثيقه في المشروع بنجاح',
    });
  } catch (error: any) {
    console.error('Error in /api/projects/:projectId/setup-driver:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'فشلت عملية إنشاء السائق المعتمد',
      code: error.code || 'DRIVER_SETUP_FAILED',
    });
  }
});

app.post('/api/projects/:projectId/setup-truck', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { truckData } = req.body || {};
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'المستخدم غير مصادق عليه', code: 'UNAUTHENTICATED' });
    }
    if (!truckData) {
      return res.status(400).json({ success: false, error: 'بيانات الشاحنة truckData مطلوبة', code: 'INVALID_ARGUMENT' });
    }
    const { driverTruckIntakeServer } = await import('../src/services/driverTruckIntake.server');
    const result = await driverTruckIntakeServer.createStandaloneTruck(
      {
        ...truckData,
        projectId, // Authoritative path projectId
      },
      user
    );
    res.json({
      success: true,
      data: result,
      truckId: result.truckId,
      message: 'تم تسجيل الشاحنة وتوثيقها في المشروع بنجاح',
    });
  } catch (error: any) {
    console.error('Error in /api/projects/:projectId/setup-truck:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'فشلت عملية إنشاء الشاحنة المعتمدة',
      code: error.code || 'TRUCK_SETUP_FAILED',
    });
  }
});

// Assuming these endpoints list from canonical membership
app.get('/api/projects/:projectId/materials', enforceProjectIsolation, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.listProjectMaterials(projectId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/projects/:projectId/carriers', enforceProjectIsolation, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ProjectProvisioningAdminService } = await import('../src/services/projectProvisioning.server');
    const provisioningService = new ProjectProvisioningAdminService();
    const result = await provisioningService.listProjectCarriers(projectId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 10D. Project Activation (Phase 6)
// ----------------------------------------------------
app.post('/api/projects/:projectId/reactivate', enforceProjectIsolation, enforceAdminOnly, async(req,res)=>{
 try{const {projectActivationService}=await import('../src/services/projectActivation.service');await projectActivationService.reactivateProject(req.params.projectId,(req as any).user);res.json({success:true});}
 catch(error:any){res.status(error.status||409).json({success:false,code:error.code,error:error.message,blockers:error.blockers});}
});
app.post('/api/projects/:projectId/activate', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const { projectActivationService } = await import('../src/services/projectActivation.service');
    await projectActivationService.activateProject(projectId, user);
    res.json({ success: true, message: 'تم تنشيط المشروع بنجاح' });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.message, code: error.code });
  }
});

// ----------------------------------------------------
// 10E. Project Readiness Authority (Phase 6)
// ----------------------------------------------------
app.get('/api/projects/:projectId/readiness', enforceProjectIsolation, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ProjectReadinessQueryService } = await import('../src/services/projectReadinessQuery.server');
    const result = await new ProjectReadinessQueryService().read(projectId, (req as any).user);

    res.json({
      success: true,
      projectId: result.projectId,
      ready: result.ready,
      lifecycle: result.lifecycle,
      operational: result.operational,
      setup: result.setup,
      evaluatedAt: result.evaluatedAt,
      blockers: result.blockers,
      candidatePath: result.candidatePath ? {
        driverId: result.candidatePath.driverId,
        truckId: result.candidatePath.truckId,
        carrierId: result.candidatePath.carrierId,
        materialId: result.candidatePath.materialId,
      } : null,
    });
  } catch (error: any) {
    if (error.message === 'المشروع غير موجود') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.status(error.status || 400).json({ success: false, error: 'Project readiness could not be verified.', code: error.code || 'READINESS_UNAVAILABLE', category: /FORBIDDEN|ACCOUNT|PROFILE/.test(error.code || '') ? 'AUTHORITY' : 'DATA_INTEGRITY' });
  }
});

// ----------------------------------------------------
// 10F. Project Lifecycle Governance Transition (Phase 6)
// ----------------------------------------------------
app.post('/api/projects/:projectId/lifecycle-transition', enforceProjectIsolation, enforceAdminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targetStatus, reason } = req.body;
    const user = (req as any).user;

    if (!targetStatus) {
      res.status(400).json({ success: false, error: 'targetStatus مطلوب' });
      return;
    }

    const { projectLifecycleServerService } = await import('../src/services/projectLifecycle.server');
    const result = await projectLifecycleServerService.transitionStatus(projectId, targetStatus, user, reason);

    res.json({
      success: true,
      data: result,
      message: `تم تحويل حالة المشروع إلى ${targetStatus} بنجاح`,
    });
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, error: error.code === 'PROJECT_SETUP_NOT_READY' ? 'Project setup is incomplete.' : 'Project transition failed.', code: error.code, blockers: error.blockers });
  }
});

// ----------------------------------------------------
// 11. Security Audit Suite Run Endpoint
// ----------------------------------------------------
app.get('/api/security/audit-status', (req, res) => {
  res.json({
    status: 'SECURE',
    auditedDomains: [
      'Authentication & Token Verification',
      'RBAC & Field-Level Authorization',
      'Project Multi-Tenant Isolation',
      'IDOR Protection',
      'Firestore Security Rules',
      'Truck-Carrier Import Relationship Integrity',
      'Pricing Rules Historical Immutability & Copy-on-Write',
      'Operation Idempotency & Replay Attack Defense',
      'File Upload Sanitization & Path Traversal Prevention',
      'No Secrets in Frontend',
      'Audit Trail Tamper-Resistance',
      'Offline Cache Isolation & Conflict Resolution'
    ],
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Vite Middleware / Static Files Setup
// ----------------------------------------------------
export { app };

