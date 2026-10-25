import { operationalTripProjection } from '../../utils/operationalTripProjection';
import { queuedTripCommand, sendTripCommand } from '../tripCommandClient.service';
/**
 * Outbox Service for Offline-First Architecture.
 * Manages the client-side operation queue, status transitions, and online synchronization pipeline.
 * 
 * Outbox Schema:
 * - operationId
 * - projectId
 * - userId
 * - deviceId
 * - operationType
 * - payload
 * - createdAt
 * - retryCount
 * - status (PENDING | SENDING | SYNCED | FAILED | CONFLICT)
 * 
 * Synchronization Pipeline (Online):
 * Sync → Server validation → Idempotency → Commit → ACK
 */

import { indexedDBService } from './indexedDB.service';
import { OutboxOperation, OutboxStatus, OutboxStats } from '../../types/offline';
import { conflictResolutionService } from './conflictResolution.service';
import { auth } from '../../firebase/config';

const DEVICE_ID_KEY = 'q_saudi_device_id';

export class OutboxService {
  private isSyncing = false;
  private listeners: Set<() => void> = new Set();

  /**
   * Retrieves or initializes a persistent device identifier.
   */
  public getDeviceId(): string {
    if (typeof window === 'undefined') return 'DEV-SERVER-STATIC';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `DEV-SCALE-${Math.floor(100 + Math.random() * 900)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Enqueues a new operation into the Outbox with status PENDING.
   */
  public async queueOperation(params: {
    operationId?: string;
    projectId: string;
    userId: string;
    operationType: OutboxOperation['operationType'];
    payload: Record<string, any>;
  }): Promise<OutboxOperation> {
    const operationId = params.operationId || `OP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const op: OutboxOperation = {
      operationId,
      projectId: params.projectId,
      userId: params.userId,
      deviceId: this.getDeviceId(),
      operationType: params.operationType,
      payload: params.payload,
      createdAt: now,
      retryCount: 0,
      status: 'PENDING',
    };

    await indexedDBService.saveOutboxOperation(op);
    this.notifyListeners();
    return op;
  }

  /**
   * Retrieves all outbox operations.
   */
  public async getOperations(): Promise<OutboxOperation[]> {
    return indexedDBService.getOutboxOperations();
  }

  /**
   * Computes counts for each outbox status.
   */
  public async getStats(): Promise<OutboxStats> {
    const ops = await this.getOperations();
    return {
      total: ops.length,
      pending: ops.filter(o => o.status === 'PENDING').length,
      sending: ops.filter(o => o.status === 'SENDING').length,
      synced: ops.filter(o => o.status === 'SYNCED').length,
      failed: ops.filter(o => o.status === 'FAILED').length,
      conflict: ops.filter(o => o.status === 'CONFLICT').length,
    };
  }

  /**
   * Synchronizes queued Outbox operations when Online.
   * Pipeline:
   * 1. Sync: Fetch PENDING and FAILED operations
   * 2. Server validation: Verify data integrity against server rules
   * 3. Idempotency: Verify operationId hasn't already been committed
   * 4. Commit: Save to authoritative server store
   * 5. ACK: Mark operation as SYNCED with server details
   */
  public async syncAll(isSimulatedOffline = false): Promise<{
    processedCount: number;
    syncedCount: number;
    failedCount: number;
    conflictCount: number;
  }> {
    if (this.isSyncing) {
      return { processedCount: 0, syncedCount: 0, failedCount: 0, conflictCount: 0 };
    }

    if (isSimulatedOffline || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return { processedCount: 0, syncedCount: 0, failedCount: 0, conflictCount: 0 };
    }

    this.isSyncing = true;
    let processedCount = 0;
    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    try {
      const ops = await this.getOperations();
      const pendingOps = ops.filter(o => o.status === 'PENDING' || (o.status === 'FAILED' && o.retryCount < 5));

      for (const op of pendingOps) {
        processedCount++;

        // Step 1: Set to SENDING
        await indexedDBService.updateOutboxStatus(op.operationId, 'SENDING');
        this.notifyListeners();

        try {
          // Step 2: Server validation
          const validationError = this.validateOperationServerSide(op);
          if (validationError) {
            await indexedDBService.updateOutboxStatus(op.operationId, 'FAILED', {
              retryCount: op.retryCount + 1,
              errorReason: validationError,
            });
            failedCount++;
            continue;
          }

          // Idempotency is checked only after current-principal authorization on the server.
          // Step 3.5: Conflict Detection Engine (No Last-Write-Wins)
          // Preserves local command, preserves server state, records conflict, and blocks sync until explicit resolution
          // An optimistic cache record is not a server conflict witness. The
          // authoritative command still checks the current persisted FSM in its transaction.
          const cached = op.payload.tripId ? indexedDBService.getSync<any>('trips', op.payload.tripId) : null;
          const conflict = cached?.syncStatus === 'PENDING' ? null : conflictResolutionService.detectConflict(op);
          if (conflict) {
            await indexedDBService.updateOutboxStatus(op.operationId, 'CONFLICT', {
              conflictDetails: {
                conflictId: conflict.conflictId,
                conflictType: conflict.conflictType,
                clientVersion: conflict.localCommand.version,
                serverVersion: conflict.serverState.serverVersion,
                conflictField: conflict.diffFields[0]?.field,
                messageAr: conflict.descriptionAr,
              },
            });
            conflictCount++;
            continue;
          }

          // Step 4: Commit to authoritative stores via canonical replay path
          let commitResult: { tripId: string; tripSerial: string; version: number } = { tripId: '', tripSerial: '', version: 1 };

          const intent = queuedTripCommand(op);
          const resData = await sendTripCommand(op.projectId, intent.command, intent.payload, op.operationId, intent.tripId);

          if (op.operationType === 'CREATE_TRIP_LOADING') {
            const serverTrip = resData.trip;
            if (op.payload.tripId) {
              await indexedDBService.delete('trips', op.payload.tripId);
            }
            await indexedDBService.put('trips', operationalTripProjection(serverTrip));

            commitResult = {
              tripId: serverTrip.tripId,
              tripSerial: serverTrip.tripNumber || serverTrip.tripSerial,
              version: serverTrip.version,
            };

            await indexedDBService.updateOutboxStatus(op.operationId, 'SYNCED', {
              syncedAt: new Date().toISOString(),
              serverAck: {
                tripId: commitResult.tripId,
                tripSerial: commitResult.tripSerial,
                serverVersion: commitResult.version,
                committedAt: new Date().toISOString(),
                messageAr: 'تمت المصادقة والاعتماد الخادومي بنجاح (ACK Confirmed)',
              },
            });
            syncedCount++;
          } else if (op.operationType === 'UPDATE_TRIP_STATUS') {
            const serverTrip = resData.trip;
            await indexedDBService.put('trips', operationalTripProjection(serverTrip));

            commitResult = {
              tripId: serverTrip.tripId,
              tripSerial: serverTrip.tripNumber || serverTrip.tripSerial,
              version: serverTrip.version,
            };

            await indexedDBService.updateOutboxStatus(op.operationId, 'SYNCED', {
              syncedAt: new Date().toISOString(),
              serverAck: {
                tripId: commitResult.tripId,
                tripSerial: commitResult.tripSerial,
                serverVersion: commitResult.version,
                committedAt: new Date().toISOString(),
                messageAr: 'تم تحديث حالة الرحلة واعتمادها بنجاح خادومياً (ACK Confirmed)',
              },
            });
            syncedCount++;
          } else if (op.operationType === 'RECORD_RECEIPT') {
            const serverTrip = resData.trip;
            await indexedDBService.put('trips', operationalTripProjection(serverTrip));

            commitResult = {
              tripId: serverTrip.tripId,
              tripSerial: serverTrip.tripNumber || serverTrip.tripSerial,
              version: serverTrip.version,
            };

            await indexedDBService.updateOutboxStatus(op.operationId, 'SYNCED', {
              syncedAt: new Date().toISOString(),
              serverAck: {
                tripId: commitResult.tripId,
                tripSerial: commitResult.tripSerial,
                serverVersion: commitResult.version,
                committedAt: new Date().toISOString(),
                messageAr: 'تم تسجيل إيصال الاستلام وتحديث أوزان الوجهة بنجاح (ACK Confirmed)',
              },
            });
            syncedCount++;
          } else if (op.operationType === 'REPORT_EXCEPTION') {
            const serverException = resData.exception;
            
            try {
              const tripId = op.payload.tripId;
              if (tripId) {
                const localTrip = await indexedDBService.getById<any>('trips', tripId);
                if (localTrip) {
                  localTrip.hasExceptions = true;
                  await indexedDBService.put('trips', localTrip);
                }
              }
            } catch (err) {
              console.warn('[OutboxService] Failed to update local trip with exceptions flag:', err);
            }

            await indexedDBService.updateOutboxStatus(op.operationId, 'SYNCED', {
              syncedAt: new Date().toISOString(),
              serverAck: {
                committedAt: new Date().toISOString(),
                messageAr: 'تم تسجيل الاستثناء التشغيلي بنجاح خادومياً (ACK Confirmed)',
              },
            });
            syncedCount++;
          }
        } catch (err: any) {
          await indexedDBService.updateOutboxStatus(op.operationId, 'FAILED', {
            retryCount: op.retryCount + 1,
            errorReason: err.message || 'خطأ غير متوقع أثناء معالجة المزامنة',
          });
          failedCount++;
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { processedCount, syncedCount, failedCount, conflictCount };
  }

  /**
   * Server validation of operation payload.
   */
  private validateOperationServerSide(op: OutboxOperation): string | null {
    if (!op.projectId) return 'معرف المشروع مفقود في حمولة العملية';
    if (!op.payload) return 'بيانات العملية (Payload) فارغة';

    if (op.operationType === 'CREATE_TRIP_LOADING') {
      const { tareWeight, grossWeight, pricingRuleId, truckId, carrierId, driverId, materialId } = op.payload;
      if (tareWeight !== undefined && grossWeight !== undefined && grossWeight <= tareWeight) {
        return `فشل التحقق الخادومي: الوزن القائم (${grossWeight}) غير صالح مقارنة بوزن الفارغ (${tareWeight})`;
      }
      if (!pricingRuleId) {
        return 'فشل التحقق الخادومي: بيانات وقاعدة التسعير غير محددة بالرحلة';
      }
      if (!truckId || !carrierId || !driverId || !materialId) {
        return 'فشل التحقق الخادومي: نقص في بيانات Master Data الأساسية';
      }
    }

    if (op.operationType === 'UPDATE_TRIP_STATUS') {
      const { tripId, status } = op.payload;
      if (!tripId) return 'فشل التحقق الخادومي: معرف الرحلة مفقود';
      if (!status) return 'فشل التحقق الخادومي: حالة الرحلة مفقودة';
    }

    if (op.operationType === 'RECORD_RECEIPT') {
      const { tripId, destinationTareKg, destinationGrossKg } = op.payload;
      if (!tripId) return 'فشل التحقق الخادومي: معرف الرحلة مفقود';
      if (op.payload.receiptMode !== 'DIRECT' && op.payload.receiptMode !== 'ACCEPT_ORIGIN_NET' && destinationTareKg !== undefined && destinationGrossKg !== undefined && destinationGrossKg <= destinationTareKg) {
        return `فشل التحقق الخادومي: وزن الوجهة القائم (${destinationGrossKg}) يجب أن يكون أكبر من وزن الفارغ (${destinationTareKg})`;
      }
    }

    if (op.operationType === 'REPORT_EXCEPTION') {
      const { exceptionId, type, severity } = op.payload;
      if (!exceptionId) return 'فشل التحقق الخادومي: معرف الاستثناء مفقود';
      if (!type) return 'فشل التحقق الخادومي: نوع الاستثناء مفقود';
      if (!severity) return 'فشل التحقق الخادومي: درجة خطورة الاستثناء مفقودة';
    }

    return null;
  }

  /**
   * Detects conflict with existing server state.
   */
  private detectStateConflict(op: OutboxOperation): OutboxOperation['conflictDetails'] | null {
    if (op.operationType === 'CREATE_TRIP_LOADING') {
      const existingTrip = indexedDBService.getSync<any>('trips', op.payload.tripId);
      if (existingTrip && existingTrip.status === 'COMPLETED') {
        return {
          clientVersion: op.payload.version || 1,
          serverVersion: existingTrip.version,
          conflictField: 'status',
          messageAr: 'تعارض: الرحلة منتهية ومكتملة بالفعل على الخادم ولا يمكن إعادة فتحها من التحميل',
        };
      }
    }
    return null;
  }

  /**
   * Prohibits local fallback business mutations.
   * Authoritative trips must be committed through the canonical server/domain replay path.
   */
  private commitOperation(op: OutboxOperation): { tripId: string; tripSerial: string; version: number } {
    throw new Error(
      `مسار الاعتماد المحلي القديم تم إيقافه. يجب ترحيل العملية (${op.operationId}) عبر مسار الاعتماد الخادومي المعتمد.`
    );
  }

  /**
   * Retries a specific failed or conflicted operation.
   */
  public async retryOperation(operationId: string): Promise<void> {
    await indexedDBService.updateOutboxStatus(operationId, 'PENDING', {
      errorReason: undefined,
    });
    this.notifyListeners();
  }

  /**
   * Removes all acknowledged SYNCED operations from the Outbox.
   */
  public async clearSynced(): Promise<void> {
    const ops = await this.getOperations();
    for (const op of ops) {
      if (op.status === 'SYNCED') {
        await indexedDBService.delete('outbox', op.operationId);
      }
    }
    this.notifyListeners();
  }

  /**
   * Observer subscription for reactive UI updates.
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => {
      try { cb(); } catch {}
    });
  }
}

export const outboxService = new OutboxService();
