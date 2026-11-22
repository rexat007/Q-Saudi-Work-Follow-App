import type {OutboxOperation, OutboxStatus} from '../../types/offline';

// Storage values remain canonical; only their presentation is translated here.
export const outboxStatusLabels: Record<OutboxStatus, string> = {
  PENDING: 'ui6.status_pending', SENDING: 'ui6.status_sending',
  AWAITING_RECEIPT: 'ui6.status_awaiting_receipt', SYNCED: 'ui6.status_synced',
  FAILED: 'ui6.status_failed', CONFLICT: 'ui6.status_conflict',
};
export const outboxStatusHelp: Record<OutboxStatus, string> = {
  PENDING: 'ui6.help_pending', SENDING: 'ui6.help_sending',
  AWAITING_RECEIPT: 'ui6.help_awaiting_receipt', SYNCED: 'ui6.help_synced',
  FAILED: 'ui6.help_failed', CONFLICT: 'ui6.help_conflict',
};
export function hasOutboxAck(op: OutboxOperation): boolean {
  if (op.status !== 'SYNCED' || !op.serverAck) return false;
  const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
  switch (op.operationType) {
    case 'TRIP_COMMAND':
    case 'CREATE_TRIP_LOADING':
    case 'UPDATE_TRIP_STATUS':
    case 'RECORD_RECEIPT':
      return nonempty(op.serverAck.tripId) && nonempty(op.serverAck.tripSerial);
    case 'REPORT_EXCEPTION':
      // Existing engine ACK after a successful exception response has no trip IDs.
      // Its timestamp alone is insufficient; this recognizes the recorded shape,
      // and does not independently verify a server receipt or authorize replay.
      return nonempty(op.payload?.tripId) && nonempty(op.payload?.exceptionId)
        && nonempty(op.serverAck.committedAt) && Number.isFinite(Date.parse(op.serverAck.committedAt))
        && op.serverAck.messageAr === 'تم تسجيل الاستثناء التشغيلي بنجاح خادومياً (ACK Confirmed)';
    default:
      return false;
  }
}
