import { adminDb } from '../firebase/admin';
import { AuthUserContext } from '../types/common';

export class ImportSessionServerService {
  async createSession(projectId: string, payload: any, context: AuthUserContext) {
    if (!context || !['PROJECT_ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR', 'FINANCE_AUDITOR'].includes(context.role)) {
      const err: any = new Error('غير مصرح لك بإنشاء جلسات الاستيراد');
      err.code = 'AUTHORIZATION_ERROR';
      throw err;
    }

    if (!projectId || !projectId.trim()) {
      const err: any = new Error('معرّف المشروع مطلوب');
      err.code = 'INVALID_PROJECT_ID';
      throw err;
    }

    if (payload.projectId && payload.projectId !== projectId) {
      const err: any = new Error('عدم تطابق معرّف المشروع بين المسار والبيانات');
      err.code = 'PROJECT_MISMATCH';
      throw err;
    }

    if (payload.file || payload.sourceMetadata?.file || payload.token || payload.secret) {
      const err: any = new Error('يُحظر تضمين كائنات الملفات (File objects) أو الرموز السرية في جلسة الاستيراد');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }

    const importSessionId = payload.importSessionId || `isess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const operationId = payload.operationId || `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const importBatchId = payload.importBatchId || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const now = new Date().toISOString();

    const sessionRecord = {
      importSessionId,
      projectId,
      operationId,
      importBatchId,
      sourceType: payload.sourceType || 'EXCEL_CSV',
      lifecycleState: payload.lifecycleState || payload.state || 'SOURCE',
      currentStage: payload.currentStage || 'PARSING',
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
      sourceMetadata: payload.sourceMetadata || {},
      reviewSnapshot: payload.reviewSnapshot || {},
      entityResolutions: payload.entityResolutions || {},
      reviewAction: payload.reviewAction || null,
      validationIssues: payload.validationIssues || [],
      warningConfirmation: payload.warningConfirmation || false,
    };

    const docRef = adminDb.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);

    await adminDb.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        const err: any = new Error('جلسة الاستيراد موجودة مسبقاً بنفس المعرّف');
        err.code = 'SESSION_ALREADY_EXISTS';
        throw err;
      }
      transaction.set(docRef, sessionRecord);
    });

    return sessionRecord;
  }

  async getSession(projectId: string, importSessionId: string, context: AuthUserContext) {
    if (!context) {
      const err: any = new Error('المستخدم غير مصادق عليه');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const docRef = adminDb.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      const err: any = new Error('جلسة الاستيراد غير موجودة');
      err.code = 'IMPORT_SESSION_NOT_FOUND';
      throw err;
    }

    const data = docSnap.data();

    if (data.projectId !== projectId) {
      const err: any = new Error('عزل أمني: عدم تطابق معرف المشروع لجلسة الاستيراد');
      err.code = 'PROJECT_MISMATCH';
      throw err;
    }

    return data;
  }

  async updateCheckpoint(
    projectId: string,
    importSessionId: string,
    updates: any,
    concurrency: { expectedVersion: number },
    context: AuthUserContext
  ) {
    if (!context || !['PROJECT_ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR', 'FINANCE_AUDITOR'].includes(context.role)) {
      const err: any = new Error('غير مصرح لك بتعديل جلسات الاستيراد');
      err.code = 'AUTHORIZATION_ERROR';
      throw err;
    }

    if (!concurrency || concurrency.expectedVersion === undefined) {
      const err: any = new Error('رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل');
      err.code = 'MISSING_EXPECTED_VERSION';
      throw err;
    }

    if (updates.file || updates.sourceMetadata?.file || updates.token || updates.secret) {
      const err: any = new Error('يُحظر تضمين كائنات الملفات أو الأسرار في التحديث');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }

    const docRef = adminDb.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);

    let updatedRecord: any = null;

    await adminDb.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists) {
        const err: any = new Error('جلسة الاستيراد غير موجودة');
        err.code = 'IMPORT_SESSION_NOT_FOUND';
        throw err;
      }

      const existing = docSnap.data();

      if (existing.projectId !== projectId) {
        const err: any = new Error('عزل أمني: عدم تطابق معرف المشروع');
        err.code = 'PROJECT_MISMATCH';
        throw err;
      }

      if (existing.version !== concurrency.expectedVersion) {
        const err: any = new Error(`تعارض إصدار (VERSION_CONFLICT): المتوقع ${concurrency.expectedVersion}، الحالي ${existing.version}`);
        err.code = 'VERSION_CONFLICT';
        throw err;
      }

      if (updates.importSessionId && updates.importSessionId !== existing.importSessionId) {
        const err: any = new Error('تغيير معرف جلسة الاستيراد (importSessionId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.operationId && updates.operationId !== existing.operationId) {
        const err: any = new Error('تغيير معرف العملية (operationId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.importBatchId && updates.importBatchId !== existing.importBatchId) {
        const err: any = new Error('تغيير معرف دفعة الاستيراد (importBatchId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }

      const now = new Date().toISOString();

      updatedRecord = {
        ...existing,
        ...updates,
        importSessionId: existing.importSessionId,
        projectId: existing.projectId,
        operationId: existing.operationId,
        importBatchId: existing.importBatchId,
        version: existing.version + 1,
        updatedAt: now,
        updatedBy: context.userId,
      };

      transaction.set(docRef, updatedRecord);
    });

    return updatedRecord;
  }
}

export const importSessionServerService = new ImportSessionServerService();
