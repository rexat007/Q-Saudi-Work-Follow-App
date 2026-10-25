import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: { currentUser: null as any }, writes: vi.fn() }));
vi.mock('../firebase/config', () => ({ auth: state.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (...parts: any[]) => ({ id: parts.at(-1) }), collection: (...parts: any[]) => parts,
  query: (...parts: any[]) => parts, where: (...parts: any[]) => parts, orderBy: (...parts: any[]) => parts,
  getDoc: async () => ({ exists: () => false }), getDocs: async () => ({ docs: [], empty: true }),
  setDoc: state.writes, updateDoc: state.writes, deleteDoc: state.writes, runTransaction: state.writes,
}));
import { ProjectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { ProjectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
beforeEach(() => { state.auth.currentUser = null; state.writes.mockClear(); });
afterEach(() => vi.restoreAllMocks());
describe('P5-B3 browser mutation and authoritative-absence boundary', () => {
  it('assignment mutations cannot persist or emit detached audit; empty persistent reads do not resurrect cache', async () => {
    const repo = new ProjectDriverTruckAssignmentRepository(); vi.spyOn(repo, 'validateAssignmentPreconditions').mockResolvedValue('C1');
    const audit = vi.spyOn(auditLogRepository, 'create').mockResolvedValue(undefined as any);
    const first = await repo.assignDriverToTruck('P1', 'D1', 'T1', 'original'); state.auth.currentUser = { uid: 'actor' }; audit.mockClear();
    await expect(repo.assignDriverToTruck('P1', 'D1', 'T2', 'actor')).rejects.toThrow('TEMPORAL_SERVER_COMMAND_REQUIRED'); await expect(repo.closeAssignment('P1', first.assignment.assignmentId, 'actor')).rejects.toThrow('TEMPORAL_SERVER_COMMAND_REQUIRED');
    expect(await repo.getAssignment('P1', first.assignment.assignmentId)).toBeNull(); expect(await repo.getActiveDriverSlot('P1', 'D1')).toBeNull(); expect(await repo.getActiveTruckSlot('P1', 'T1')).toBeNull();
    expect(await repo.listDriverAssignmentHistory('P1', 'D1')).toEqual([]); expect(await repo.listTruckAssignmentHistory('P1', 'T1')).toEqual([]); expect(state.writes).not.toHaveBeenCalled(); expect(audit).not.toHaveBeenCalled();
  });
  it('allocation mutation/close cannot persist; authoritative absence wins over cached history and slot', async () => {
    const repo = new ProjectTruckMaterialAllocationRepository(); vi.spyOn(repo, 'validateAllocationPreconditions').mockResolvedValue(undefined);
    const audit = vi.spyOn(auditLogRepository, 'create').mockResolvedValue(undefined as any);
    const first = await repo.allocateTruckToMaterial('P1', 'T1', 'M1', 'original'); state.auth.currentUser = { uid: 'actor' }; audit.mockClear();
    await expect(repo.allocateTruckToMaterial('P1', 'T1', 'M2', 'actor')).rejects.toThrow('TEMPORAL_SERVER_COMMAND_REQUIRED'); await expect(repo.closeTruckMaterialAllocation('P1', first.allocation.allocationId, 'actor')).rejects.toThrow('TEMPORAL_SERVER_COMMAND_REQUIRED');
    expect(await repo.getAllocation('P1', first.allocation.allocationId)).toBeNull(); expect(await repo.getActiveSlot('P1', 'T1')).toBeNull(); expect(await repo.listTruckMaterialHistory('P1', 'T1')).toEqual([]); expect(state.writes).not.toHaveBeenCalled(); expect(audit).not.toHaveBeenCalled();
  });
});
