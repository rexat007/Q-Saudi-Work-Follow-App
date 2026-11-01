import {CLIENT_BUILD_ID,ensureRuntimeGeneration,assertRuntimeGeneration} from '../runtime/runtimeGeneration';
import {workspaceFailureCode} from '../utils/workspaceGenerationErrors';
import { selectWorkspaceDestinationFolder } from './googleTemplatePicker';
import { classifyGoogleWorkspaceError } from '../utils/googleWorkspaceErrors';
import {workspaceScopeDiagnosticCode} from '../utils/googleWorkspaceScopes';
import type { ProjectGoogleStatus } from '../types/projectGoogleWorkspace';
import type { StorageProviderType } from '../types/workspace';
import { 
  WORKSPACE_TABS, 
  OPERATIONS_FULL_COLUMNS,
  SchemaMigrationPlan,
  GoogleDriveProjectStructure,
  WorkspaceSyncSummary,
  UpsertResult,
  ProjectStorageProfile,
  StorageHistoryRecord,
  MigrationJob,
  DestinationValidationResult,
  WorkspaceProjectionInput,
  WorkspaceTripProjectionDTO
} from '../types/workspace';
import { GoogleDriveFileItem } from '../types/googleDriveImport';
import { ProjectEntity, TripEntity } from '../types/entities';
import { auth } from '../firebase/config';
import { requestWorkspaceGoogleToken, prepareWorkspaceGoogleAuthorization } from './googleWorkspaceAuthorization';

export function mapTripToWorkspaceProjection(trip: TripEntity): WorkspaceTripProjectionDTO {
  return {
    tripId: trip.tripId,
    tripNumber: trip.tripNumber,
    projectId: trip.projectId,
    carrierId: trip.carrierId,
    carrierNameAr: trip.carrierSnapshot?.companyNameAr,
    driverId: trip.driverId,
    driverNameAr: trip.driverSnapshot?.fullNameAr,
    truckId: trip.truckId,
    truckPlateAr: trip.truckSnapshot?.plateNumberAr,
    materialId: trip.materialId,
    materialNameAr: trip.materialSnapshot?.nameAr,
    status: trip.status,
    originGrossKg: trip.weights?.originGrossKg,
    originTareKg: trip.weights?.originTareKg,
    originNetKg: trip.weights?.originNetKg,
    destinationGrossKg: trip.weights?.destinationGrossKg,
    destinationTareKg: trip.weights?.destinationTareKg,
    destinationNetKg: trip.weights?.destinationNetKg,
    pricingType: trip.pricingSnapshot?.pricingType,
    agreedRate: trip.pricingSnapshot?.agreedRate,
    pricingRuleId: trip.pricingSnapshot?.pricingRuleId,
    settlementAmount: trip.pricingSnapshot?.settlementAmount,
    waybillNumber: trip.weights?.originTicketNo || (trip as any).waybillNumber || trip.tripNumber,
    loadTime: (trip as any).loadingTimestamp || (trip.createdAt ? (typeof trip.createdAt === 'string' ? trip.createdAt : (trip.createdAt as any)?.toDate?.()?.toISOString?.() || '') : ''),
    arrivalTime: (trip as any).arrivalTimestamp || '',
    unloadTime: (trip as any).unloadingTimestamp || '',
    createdAt: typeof trip.createdAt === 'string' ? trip.createdAt : (trip.createdAt as any)?.toDate ? (trip.createdAt as any).toDate().toISOString() : trip.createdAt instanceof Date ? trip.createdAt.toISOString() : new Date().toISOString(),
  };
}

const getApiBase = () => (typeof window !== 'undefined' ? '' : 'http://localhost:3000');

export class ClientWorkspaceService {
  private currentAccessToken: string | null = null;

  public getAccessToken(): string | null {
    return this.currentAccessToken;
  }

  public setAccessToken(token: string | null): void {
    this.currentAccessToken = token;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (token) {
        sessionStorage.setItem('q_saudi_google_token', token);
      } else {
        sessionStorage.removeItem('q_saudi_google_token');
      }
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('q_saudi_google_token');
      if (saved) this.currentAccessToken = saved;
    }
  }

  /**
   * Builds the dual-token headers for Google Workspace requests:
   * 1. Authorization: Bearer <Firebase ID Token> (for application auth, RBAC, project isolation)
   * 2. X-Google-Access-Token: <Google OAuth Access Token> (for Google Drive & Sheets APIs)
   *
   * @param extraHeaders - Optional additional headers (e.g. Content-Type)
   * @param requireAuth - If true, fails closed if Firebase user is not signed in or token retrieval fails.
   */
  public async getWorkspaceHeaders(
    extraHeaders: Record<string, string> = {},
    requireAuth: boolean = true
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...extraHeaders };

    // 1. Firebase Application Identity (Authorization: Bearer <Firebase ID Token>)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (requireAuth) {
        throw new Error('غير مصرح: يجب تسجيل الدخول بحساب المستخدم لتنفيذ عمليات مساحة العمل (Firebase Authentication required)');
      }
    } else {
      try {
        const idToken = await currentUser.getIdToken();
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        } else if (requireAuth) {
          throw new Error('فشل استخراج رمز تعريف المستخدم (Firebase ID Token missing)');
        }
      } catch (err: any) {
        if (requireAuth) {
          throw new Error(`فشل استخراج رمز تعريف المستخدم: ${err.message || 'Firebase ID Token retrieval failed'}`);
        }
      }
    }

    // 2. Google OAuth Access Token (X-Google-Access-Token: <Google OAuth Token>)
    headers['X-App-Build']=CLIENT_BUILD_ID;
    const googleToken = this.getAccessToken();
    if (googleToken) {
      headers['X-Google-Access-Token'] = googleToken;
    }

    return headers;
  }

  /**
   * Requests a Google-only Workspace permission grant without changing the Firebase session.
   */
  public async prepareGoogleAuthorization(): Promise<void> { await Promise.all([ensureRuntimeGeneration(),prepareWorkspaceGoogleAuthorization()]); }

  public async requestGoogleScopes(): Promise<string> {
    assertRuntimeGeneration();
    const current = auth.currentUser;
    const uid = current?.uid;
    const subject = current?.providerData.find(provider => provider.providerId === 'google.com')?.uid;
    try {
      if (!uid || !subject) throw new Error('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');
      const token = await requestWorkspaceGoogleToken(subject, () => auth.currentUser?.uid === uid);
      if (auth.currentUser?.uid !== uid) throw new Error('WORKSPACE_IDENTITY_CHANGED');
      this.setAccessToken(token);
      return token;
    } catch (error: unknown) {
      this.setAccessToken(null);
      const code = error instanceof Error ? error.message : '';
      const scopeDiagnostic=workspaceScopeDiagnosticCode(code);
      if(scopeDiagnostic) throw new Error(scopeDiagnostic);
      if (/^(GOOGLE_OAUTH_CONFIGURATION_REQUIRED|WORKSPACE_IDENTITY_CHANGED|WORKSPACE_GOOGLE_ACCOUNT_MISMATCH)$/.test(code)) throw new Error(code);
      throw new Error(classifyGoogleWorkspaceError(error));
    }
  }

  public async selectProjectWorkspaceDestination(projectId: string): Promise<string> {
    await ensureRuntimeGeneration();
    const token = this.getAccessToken();
    if (!token) throw new Error('AUTHORIZATION_DENIED');
    const destinationRootFolderId = await selectWorkspaceDestinationFolder(token);
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/workspace/destination`, {
      method:'POST',headers,body:JSON.stringify({destinationRootFolderId}),
    });
    const result=await response.json();
    if(!response.ok)throw new Error(workspaceFailureCode(result.code||'DESTINATION_FOLDER_INVALID'));
    return result.data.destinationRootFolderId;
  }

  public async getGoogleWorkspaceStatus(projectId: string): Promise<ProjectGoogleStatus> {
    const headers = await this.getWorkspaceHeaders({}, true);
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/workspace`, { headers });
    const result = await response.json();
    if (!response.ok) throw new Error(result.code || 'PROVISIONING_FAILED');
    return result.data;
  }
  public async initializeWorkspace(projectId:string):Promise<ProjectGoogleStatus> {
    await ensureRuntimeGeneration();
    const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/workspace/initialize`,{method:'POST',headers:await this.getWorkspaceHeaders({'Content-Type':'application/json'},true),body:'{}'});
    const result=await response.json();if(!response.ok)throw Error(result.code||'WORKSPACE_INITIALIZATION_FAILED');return result.data;
  }
  /** Only a bounded status crosses the popup boundary. Refresh credentials stay server-side. */
  public async connectBackgroundAuthorization(projectId:string,isCurrent:()=>boolean):Promise<void> {
    const popup=window.open('about:blank','qsaudi-workspace-authorization','popup,width=560,height=720');
    if(!popup)throw Error('POPUP_BLOCKED');
    let listener:(event:MessageEvent)=>void=()=>{},timer:ReturnType<typeof setTimeout>|undefined,poll:ReturnType<typeof setInterval>|undefined;
    try {
      await ensureRuntimeGeneration();if(!isCurrent())throw Error('WORKSPACE_IDENTITY_CHANGED');
      const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/workspace/authorization`,{method:'POST',headers:await this.getWorkspaceHeaders({'Content-Type':'application/json'},true),body:JSON.stringify({automation:true})});
      const result=await response.json();if(!response.ok)throw Error(result.code||'GOOGLE_OFFLINE_AUTHORIZATION_FAILED');
      const url=new URL(result.url);if(url.origin!=='https://accounts.google.com')throw Error('GOOGLE_OFFLINE_AUTHORIZATION_FAILED');
      await new Promise<void>((resolve,reject)=>{
        listener=(event:MessageEvent)=>{
          if(event.origin!==window.location.origin||event.source!==popup||event.data?.type!=='QSAUDI_WORKSPACE_OAUTH')return;
          if(!isCurrent())return reject(Error('WORKSPACE_IDENTITY_CHANGED'));
          if(event.data.result==='CONNECTED'&&event.data.projectId===projectId)resolve();else reject(Error('GOOGLE_OFFLINE_AUTHORIZATION_FAILED'));
        };
        window.addEventListener('message',listener);timer=setTimeout(()=>reject(Error('GOOGLE_OFFLINE_AUTHORIZATION_FAILED')),600000);
        poll=setInterval(()=>{if(!isCurrent()||popup.closed)reject(Error('GOOGLE_OFFLINE_AUTHORIZATION_FAILED'));},500);
        popup.location.href=url.href;
      });
    } finally {window.removeEventListener('message',listener);clearTimeout(timer);clearInterval(poll);popup.close();}
  }
  public async resumeProjectWorkspace(projectId:string):Promise<{spreadsheetId:string;projectFolderId:string}> {
    await ensureRuntimeGeneration();
    const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/workspace/resume`,{method:'POST',headers:await this.getWorkspaceHeaders({'Content-Type':'application/json'},true),body:JSON.stringify({projectId})});
    const result=await response.json();if(!response.ok)throw new Error(workspaceFailureCode(result.code||'WORKSPACE_RECOVERY_REQUIRED'));
    const binding=result.data;return {spreadsheetId:binding.spreadsheetId,projectFolderId:binding.projectFolderId};
  }

  /**
   * Fetches the Schema Migration Plan from the server.
   */
  public async fetchMigrationPlan(): Promise<SchemaMigrationPlan> {
    try {
      const res = await fetch('/api/workspace/migration-plan');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      // Fallback local representation
      return {
        planVersion: '1.2.0-SAUDI-ENTERPRISE',
        sourceOfTruth: 'Firestore',
        projectionTarget: 'Google Sheets',
        sheetName: 'العمليات',
        primaryKey: 'tripId',
        legacyColumnCount: 20,
        legacyColumns: [
          'tripId', 'projectId', 'tripSerial', 'ticketId', 'truckId', 'driverId', 'carrierId', 'materialId', 'shiftDate', 'tareWeight',
          'grossWeight', 'netWeight', 'destNetWeight', 'varianceWeight', 'loaderId', 'unloaderId', 'status', 'loadTime', 'arrivalTime', 'unloadTime'
        ] as any,
        pricingColumnCount: 6,
        pricingColumns: ['pricingType', 'agreedRate', 'settlementBase', 'settlementAmount', 'currency', 'pricingRuleId'] as any,
        totalColumnCount: 29,
        migrationStrategy: 'NON_DESTRUCTIVE_COLUMN_EXPANSION',
        rules: {
          preserveExistingHeaders: true,
          forbidInPlaceRenaming: true,
          appendNewPricingColumnsAtEnd: true,
          supportIdempotentUpsert: true,
          allowRollback: true,
        },
      };
    }
  }

  /**
   * Provisions Google Drive folders and Google Sheets for a project via server.
   */
  public async provisionProjectDrive(project: ProjectEntity, destinationRootFolderId?: string): Promise<GoogleDriveProjectStructure> {
    await ensureRuntimeGeneration();
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch('/api/workspace/provision', {
      method: 'POST',
      headers,
      body: JSON.stringify({projectId:project.projectId,destinationRootFolderId}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(workspaceFailureCode(err.code || err.error || 'PROVISIONING_FAILED'));
    }

    const data = await res.json();
    const structure: GoogleDriveProjectStructure = data.data;

    // Server provisioning commits only Workspace linkage, with current settings and atomic audit.

    return structure;
  }

  /**
   * Server-Authoritative Initial Project Setup Projection
   * Sends only projectId and spreadsheetId to trigger server-authoritative loading
   * and projection of Drivers, Carriers, Materials, and Fleet Roster into Google Sheets.
   */
  public async syncInitialProjectWorkspace(
    projectId: string,
    spreadsheetId: string
  ): Promise<WorkspaceSyncSummary> {
    if (!projectId || !spreadsheetId) {
      throw new Error('معرف المشروع وشيت المزامنة مطلوبان لإتمام الإسقاط الأولي');
    }

    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch('/api/workspace/sync/initial', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectId: projectId.trim(),
        spreadsheetId: spreadsheetId.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشلت المزامنة والإسقاط الأولي لمساحة العمل');
    }

    const data = await res.json();
    return data.data;
  }

  /**
   * Syncs Firestore projection to Google Sheets with idempotent upsert.
   */
  public async syncProjectionToSheets(input: WorkspaceProjectionInput | string, legacySpreadsheetId?: string): Promise<WorkspaceSyncSummary> {
    let projectId: string;
    let spreadsheetId: string;
    let trips: TripEntity[];
    let drivers: any[];
    let carriers: any[];
    let materials: any[];
    let exceptions: any[];

    if (typeof input === 'object' && input !== null) {
      projectId = input.projectId;
      spreadsheetId = input.spreadsheetId;
      trips = input.trips;
      drivers = input.drivers;
      carriers = input.carriers;
      materials = input.materials;
      exceptions = input.exceptions;
    } else {
      projectId = input as string;
      spreadsheetId = legacySpreadsheetId || '';
      trips = [];
      drivers = [];
      carriers = [];
      materials = [];
      exceptions = [];
    }


    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const projectTrips = trips.map(mapTripToWorkspaceProjection);

    const mappedDrivers = drivers.map(d => ({
      driverId: d.driverId,
      projectId: d.projectId,
      fullNameAr: d.name || d.fullNameAr || '',
      idNumber: d.nationalOrIqamaId || d.idNumber || '',
      phone: d.phone || '',
      licenseNumber: d.licenseNumber || '',
      status: d.status,
    }));

    const mappedCarriers = carriers.map(c => ({
      carrierId: c.carrierId,
      projectId: c.projectId,
      companyNameAr: c.companyNameAr || c.name || '',
      commercialRegistrationNo: c.commercialRegistrationNo || '',
      transportLicenseNo: c.transportLicenseNo || '',
      status: c.status,
    }));

    const mappedMaterials = materials.map(m => ({
      materialId: m.materialId,
      projectId: m.projectId,
      nameAr: m.nameAr || m.name || '',
      code: m.code || '',
      unitOfMeasure: m.unitOfMeasure || '',
      standardDensityTonPerM3: m.standardDensityTonPerM3,
      status: m.status,
    }));

    const mappedExceptions = exceptions.map(e => ({
      exceptionId: e.exceptionId,
      projectId: e.projectId,
      tripId: e.tripId || '',
      type: e.type,
      severity: e.severity,
      status: e.status,
      description: e.description,
      openedAt: e.openedAt,
      resolvedAt: e.reviewedAt || '',
      resolutionNote: e.resolutionNote || '',
    }));

    // Compute Selected Reports
    const totalTons = trips.reduce((acc, t) => acc + (t.weights?.originNetKg ? t.weights.originNetKg / 1000 : 0), 0);
    const totalSettlement = trips.reduce((acc, t) => acc + (t.pricingSnapshot?.settlementAmount || 0), 0);
    const completedCount = trips.filter(t => t.status === 'COMPLETED').length;
    const exceptionCount = exceptions.length;

    const reports = [
      {
        reportCode: 'REP-VOL-01',
        reportNameAr: 'إجمالي الكميات الموردة بالمشروع',
        metricValue: parseFloat(totalTons.toFixed(2)),
        metricUnit: 'طن متري',
        period: 'سبتمبر 2026',
        calculatedAt: new Date().toISOString(),
        notes: `حساب تراكمي لـ ${trips.length} رحلة مسجلة`,
      },
      {
        reportCode: 'REP-FIN-02',
        reportNameAr: 'إجمالي مستحقات النقل المعتمدة',
        metricValue: parseFloat(totalSettlement.toFixed(2)),
        metricUnit: 'ريال سعودي (SAR)',
        period: 'سبتمبر 2026',
        calculatedAt: new Date().toISOString(),
        notes: 'بناءً على لقطات التسعير التعاقدية للرحلات',
      },
      {
        reportCode: 'REP-OPS-03',
        reportNameAr: 'نسبة إنجاز الرحلات المكتملة',
        metricValue: trips.length > 0 ? parseFloat(((completedCount / trips.length) * 100).toFixed(1)) : 100,
        metricUnit: '%',
        period: 'سبتمبر 2026',
        calculatedAt: new Date().toISOString(),
        notes: `${completedCount} من أصل ${trips.length} رحلة مكتملة التفريغ`,
      },
      {
        reportCode: 'REP-EXC-04',
        reportNameAr: 'إجمالي حالات الاستثناء وفروقات الموازين',
        metricValue: exceptionCount,
        metricUnit: 'حالة مسجلة',
        period: 'سبتمبر 2026',
        calculatedAt: new Date().toISOString(),
        notes: 'تشمل الفروقات الموزنية وتجاوزات الحمولات النظامية',
      },
    ];

    const res = await fetch('/api/workspace/sync/sheets', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectId,
        spreadsheetId,
        trips: projectTrips,
        drivers: mappedDrivers,
        carriers: mappedCarriers,
        materials: mappedMaterials,
        exceptions: mappedExceptions,
        reports,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشلت المزامنة مع Google Sheets');
    }

    const data = await res.json();
    return data.data;
  }

  /**
   * Uploads a document to Google Drive.
   */
  public async uploadDocument(
    subfolderId: string,
    fileName: string,
    mimeType: string,
    content: string
  ): Promise<{ fileId: string; webViewLink: string; uploadedAt: string }> {
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch('/api/workspace/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subfolderId,
        fileName,
        mimeType,
        fileContentBase64: btoa(unescape(encodeURIComponent(content))),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل رفع الملف إلى Google Drive');
    }

    const data = await res.json();
    return data.data;
  }

  /**
   * Lists available operational Excel and CSV files from a project's Google Drive folder.
   * BLOCK 32: Google Drive File Picker
   */
  public async listDriveImportFiles(
    projectId: string,
    folderId?: string
  ): Promise<{ files: GoogleDriveFileItem[]; folderId: string; folderName: string }> {
    const headers = await this.getWorkspaceHeaders({}, true);

    const params = new URLSearchParams({ projectId });
    if (folderId) params.append('folderId', folderId);

    const res = await fetch(`/api/workspace/drive/files?${params.toString()}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل استعراض ملفات Google Drive');
    }

    const data = await res.json();
    return {
      files: data.files || [],
      folderId: data.folderId,
      folderName: data.folderName,
    };
  }

  /**
   * Downloads raw file bytes from Google Drive for client-side pipeline intake.
   * BLOCK 32: Streams file bytes for Unified Import Pipeline
   */
  public async downloadDriveFileContent(
    fileId: string
  ): Promise<{ buffer: ArrayBuffer; fileName: string; mimeType: string; size: number }> {
    const headers = await this.getWorkspaceHeaders({}, true);

    const res = await fetch(`/api/workspace/drive/files/${encodeURIComponent(fileId)}/content`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل تحميل محتوى الملف من Google Drive');
    }

    const json = await res.json();
    const base64 = json.contentBase64 || '';
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return {
      buffer: bytes.buffer,
      fileName: json.fileName,
      mimeType: json.mimeType,
      size: json.size || bytes.length,
    };
  }

  /**
   * Lists Google Spreadsheets accessible for project.
   * BLOCK 33: Google Sheets discovery
   */
  public async listGoogleSpreadsheets(projectId: string): Promise<{
    spreadsheets: Array<{
      id: string;
      name: string;
      mimeType: 'application/vnd.google-apps.spreadsheet';
      modifiedTime?: string;
      webViewLink?: string;
      sheets?: Array<{ sheetId: number; title: string; index: number; rowCount?: number; columnCount?: number }>;
    }>;
    totalCount: number;
    projectId: string;
  }> {
    const headers = await this.getWorkspaceHeaders({}, true);

    const res = await fetch(`${getApiBase()}/api/workspace/sheets/spreadsheets?projectId=${encodeURIComponent(projectId)}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل استعراض جداول بيانات Google Sheets للمشروع');
    }

    const data = await res.json();
    return {
      spreadsheets: data.spreadsheets || [],
      totalCount: data.totalCount || 0,
      projectId: data.projectId || projectId,
    };
  }

  /**
   * Retrieves metadata and sheet tabs for a spreadsheet.
   * BLOCK 33: Sheet selection
   */
  public async getSpreadsheetMetadata(spreadsheetId: string): Promise<{
    spreadsheetId: string;
    title: string;
    sheets: Array<{ sheetId: number; title: string; index: number; rowCount?: number; columnCount?: number }>;
  }> {
    const headers = await this.getWorkspaceHeaders({}, true);

    const res = await fetch(`${getApiBase()}/api/workspace/sheets/${encodeURIComponent(spreadsheetId)}/metadata`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل استخراج بيانات ورقات العمل في جدول البيانات');
    }

    return res.json();
  }

  /**
   * Retrieves 2D array row data from a specific sheet in a Google Spreadsheet.
   * BLOCK 33: Reading Sheet Data
   */
  public async getSpreadsheetValues(
    spreadsheetId: string,
    sheetName: string
  ): Promise<{
    spreadsheetId: string;
    spreadsheetTitle: string;
    sheetTitle: string;
    values: any[][];
    totalRows: number;
    totalColumns: number;
  }> {
    const headers = await this.getWorkspaceHeaders({}, true);

    const url = `${getApiBase()}/api/workspace/sheets/${encodeURIComponent(spreadsheetId)}/values?sheetName=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل قراءة بيانات ورقة العمل من جدول البيانات');
    }

    return res.json();
  }

  // ====================================================
  // BLOCK 100G-B: Configurable Storage & Archive Methods
  // ====================================================

  /**
   * Validates target Google Drive destination folder.
   */
  public async validateDestinationFolder(
    projectId: string,
    targetFolderId: string,
    targetProvider: StorageProviderType,
    currentFolderId?: string,
    sharedDriveId?: string
  ): Promise<DestinationValidationResult> {
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch(`${getApiBase()}/api/workspace/validate-destination`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectId,
        targetFolderId,
        targetProvider,
        currentFolderId,
        sharedDriveId,
      }),
    });

    const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
    if (!res.ok) {
      return {
        valid: false,
        folderId: targetFolderId,
        folderName: '',
        provider: targetProvider,
        error: data.error || 'فشل التحقق من المجلد المستهدف',
      };
    }
    return data.data;
  }

  /**
   * Starts safe storage migration job.
   */
  public async startStorageMigration(params: {
    projectId: string;
    projectCode: string;
    projectNameAr: string;
    sourceFolderId: string;
    sourceSpreadsheetId: string;
    targetFolderId: string;
    targetProvider: StorageProviderType;
    sharedDriveId?: string | null;
    migrationJobId?: string;
    trips?: any[];
    drivers?: any[];
    carriers?: any[];
    materials?: any[];
    pricingRules?: any[];
    exceptions?: any[];
  }): Promise<{ success: boolean; job: MigrationJob }> {
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch(`${getApiBase()}/api/workspace/migrate/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
    if (!res.ok) {
      throw new Error(data.error || 'فشلت عملية النقل إلى المكان المستهدف');
    }
    return data;
  }

  /**
   * Generates and triggers browser download of Complete Project Archive (.ZIP).
   */
  public async downloadProjectArchive(params: {
    project: any;
    trips?: any[];
    carriers?: any[];
    trucks?: any[];
    drivers?: any[];
    materials?: any[];
    pricingRules?: any[];
    exceptions?: any[];
    auditLogs?: any[];
    storageProfile?: ProjectStorageProfile | null;
  }): Promise<void> {
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch(`${getApiBase()}/api/workspace/archive/download`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشل إنشاء وتحميل ملف الأرشيف الكامل للمشروع');
    }

    const blob = await res.blob();
    const projectCode = params.project?.projectCode || params.project?.projectId || 'Q-PRJ-001';
    const filename = `Q-PRJ-${projectCode}_PROJECT_ARCHIVE_${Date.now()}.zip`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Resolves a file ID via current fileIdMap or historical storage history.
   */
  public async resolveFileLink(
    projectId: string,
    fileId: string,
    historyRecords?: StorageHistoryRecord[]
  ): Promise<{ resolvedFileId: string; isHistorical: boolean; sourceHistoryId?: string }> {
    const headers = await this.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    const res = await fetch(`${getApiBase()}/api/workspace/resolve-file`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, fileId, historyRecords }),
    });

    if (!res.ok) {
      return { resolvedFileId: fileId, isHistorical: false };
    }
    const data = await res.json();
    return data.data;
  }
}

export const clientWorkspaceService = new ClientWorkspaceService();

