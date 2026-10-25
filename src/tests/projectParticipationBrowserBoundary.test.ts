import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: { currentUser: null as any }, writes: vi.fn() }));
vi.mock('../firebase/config', () => ({ auth: state.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (...parts: any[]) => ({ id: parts.at(-1) }), collection: (...parts: any[]) => parts,
  query: (...parts: any[]) => parts, where: (...parts: any[]) => parts,
  getDoc: async () => ({ exists: () => false }), getDocs: async () => ({ docs: [], empty: true }),
  setDoc: state.writes, updateDoc: state.writes, runTransaction: state.writes, serverTimestamp: () => new Date(),
}));
import { ProjectMembershipRepository, projectDriverMembershipRepository, projectCarrierMembershipRepository } from '../repositories/projectMembership.repository';
import { GenericProjectCarrierAffiliationRepository } from '../repositories/projectCarrierAffiliation.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
beforeEach(() => { state.auth.currentUser = null; state.writes.mockClear(); });
afterEach(() => vi.restoreAllMocks());
describe('P5-B2 browser repositories are compatibility reads and TEST_ONLY writers', () => {
  it.each(['driver', 'truck', 'carrier', 'material'])('%s cannot persist, inject metadata or revive an empty persistent read from memory', async kind => {
    const repo = new ProjectMembershipRepository<any, any>(kind as any, `${kind}_memberships`, `${kind}Id`, async () => true);
    await repo.attachMember('P1', 'ID', 'original');
    state.auth.currentUser = { uid: 'actor' };
    await expect(repo.attachMember('P1', 'ID', 'actor', { metadata: { phone: '123' } })).rejects.toThrow('PARTICIPATION_SERVER_COMMAND_REQUIRED');
    await expect(repo.setMembershipStatus('P1', 'ID', 'REMOVED', 'actor')).rejects.toThrow('PARTICIPATION_SERVER_COMMAND_REQUIRED');
    expect(await repo.getMembership('P1', 'ID')).toBeNull(); expect(await repo.listMemberships('P1')).toEqual([]); expect(state.writes).not.toHaveBeenCalled();
  });
  it.each(['driver', 'truck'])('%s affiliation cannot write or invoke detached client audit in production', async kind => {
    vi.spyOn(projectDriverMembershipRepository, 'getMembership').mockResolvedValue({ status: 'ACTIVE' } as any);
    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockResolvedValue({ status: 'ACTIVE' } as any);
    const audit = vi.spyOn(auditLogRepository, 'create').mockResolvedValue(undefined as any);
    const repo = new GenericProjectCarrierAffiliationRepository<any, any>(`${kind}_carrier_affiliations`, kind as any, `${kind}Id`);
    if (kind === 'truck') {
      const { projectTruckMembershipRepository } = await import('../repositories/projectMembership.repository');
      vi.spyOn(projectTruckMembershipRepository, 'getMembership').mockResolvedValue({ status: 'ACTIVE' } as any);
    }
    await repo.setAffiliation('P1', 'ID', 'C1', 'original'); audit.mockClear(); state.auth.currentUser = { uid: 'actor' };
    await expect(repo.createAffiliation('P1', 'ID', 'C2', 'actor')).rejects.toThrow('PARTICIPATION_SERVER_COMMAND_REQUIRED');
    await expect(repo.setAffiliationStatus('P1', 'ID', 'INACTIVE', 'actor')).rejects.toThrow('PARTICIPATION_SERVER_COMMAND_REQUIRED');
    expect(await repo.getAffiliation('P1', 'ID')).toBeNull(); expect(await repo.listAffiliationsByCarrier('P1', 'C1')).toEqual([]);
    expect(state.writes).not.toHaveBeenCalled(); expect(audit).not.toHaveBeenCalled();
  });
});
