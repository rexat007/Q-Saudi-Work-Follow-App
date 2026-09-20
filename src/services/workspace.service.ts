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
import { projectRepository } from '../repositories/project.repository';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
    if (token) {
      sessionStorage.setItem('q_saudi_google_token', token);
    } else {
      sessionStorage.removeItem('q_saudi_google_token');
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('q_saudi_google_token');
      if (saved) this.currentAccessToken = saved;
    }
  }

  /**
   * Requests Google OAuth access token with Spreadsheets and Drive scopes via Firebase Auth.
   */
  public async requestGoogleScopes(): Promise<string> {
    const isProduction = 
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true);

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'consent' });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        this.setAccessToken(token);
        return token;
      }
      throw new Error('لم يتم إرجاع رمز الوصول (Access Token) من حساب Google');
    } catch (err: any) {
      if (isProduction) {
        console.error('[ClientWorkspaceService] Production Google OAuth authentication failed (Fail-Closed):', err);
        throw new Error(`فشل المصادقة مع Google Workspace: ${err.message || 'تعذر تشغيل نافذة تسجيل الدخول'}`);
      }
      console.warn('[ClientWorkspaceService] Google Auth popup notice (Non-Production Dev Fallback):', err);
      // In non-production testing environment only:
      const fallbackToken = `mock_oauth_token_${Date.now()}`;
      this.setAccessToken(fallbackToken);
      return fallbackToken;
    }
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
  public async provisionProjectDrive(project: ProjectEntity): Promise<GoogleDriveProjectStructure> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/workspace/provision', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        project: {
          projectId: project.projectId,
          projectCode: project.projectCode,
          nameAr: project.nameAr,
          nameEn: project.nameEn,
          clientName: project.clientName,
          googleSpreadsheetId: project.settings.googleSpreadsheetId,
          googleDriveFolderId: project.settings.googleDriveFolderId,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'فشلت عملية تهيئة مجلدات Google Drive');
    }

    const data = await res.json();
    const structure: GoogleDriveProjectStructure = data.data;

    // Update Project in Project Registry (Firestore) with the provisioned IDs
    try {
      if (auth.currentUser) {
        await projectRepository.update(project.projectId, {
          settings: {
            ...project.settings,
            googleDriveFolderId: structure.projectFolderId,
            googleSpreadsheetId: structure.spreadsheetId,
            googleDriveProvisioning: {
              enabled: true,
              rootFolderName: structure.projectFolderName,
              spreadsheetTitle: structure.projectFolderName,
              status: 'PROVISIONED',
            },
          },
        }, 'WORKSPACE_INTEGRATION_SERVICE');
      } else {
        console.info('[ClientWorkspaceService] User unauthenticated; skipping remote Firestore project update in demo mode.');
      }
    } catch (e) {
      console.warn('Notice updating project registry in Firestore:', e);
    }

    return structure;
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

    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    targetProvider: 'MY_DRIVE' | 'SHARED_DRIVE',
    currentFolderId?: string,
    sharedDriveId?: string
  ): Promise<DestinationValidationResult> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    targetProvider: 'MY_DRIVE' | 'SHARED_DRIVE';
    sharedDriveId?: string | null;
    migrationJobId?: string;
    trips?: any[];
    drivers?: any[];
    carriers?: any[];
    materials?: any[];
    pricingRules?: any[];
    exceptions?: any[];
  }): Promise<{ success: boolean; job: MigrationJob }> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    const token = this.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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

