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
  return op.status === 'SYNCED' && Boolean(op.serverAck?.tripId && op.serverAck?.tripSerial);
}
