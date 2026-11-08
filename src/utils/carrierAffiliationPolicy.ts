import { GlobalIdentityError } from './globalIdentityPolicy';

export type CarrierAffiliationCommand = 'SET_AFFILIATION' | 'REACTIVATE_AFFILIATION' | 'REASSIGN' | 'INACTIVATE';

/** Existing explicit affiliation transition rules, independent of persistence. */
export function planCarrierAffiliationState(kind: 'DRIVER'|'TRUCK', command: CarrierAffiliationCommand,
  carrierId: string, before: {carrierId:string;status:string}|null) {
  const fail = (code: string): never => { throw new GlobalIdentityError(code); };
  if (!['SET_AFFILIATION','REACTIVATE_AFFILIATION','REASSIGN','INACTIVATE'].includes(command)) fail('INVALID_PARTICIPATION_COMMAND');
  if (!before && command!=='SET_AFFILIATION') fail('AFFILIATION_NOT_FOUND');
  if (before && command!=='REASSIGN' && before.carrierId!==carrierId) fail(`${kind}_CARRIER_AFFILIATION_CONFLICT`);
  if (before && (command==='SET_AFFILIATION' || command==='REASSIGN' && before.carrierId===carrierId)
    && before.status!=='ACTIVE') fail('AFFILIATION_STATE_CONFLICT');
  const status = command==='INACTIVATE' ? 'INACTIVE' : 'ACTIVE';
  return {status,changed:!before || before.carrierId!==carrierId || before.status!==status};
}
