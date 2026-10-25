import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: { currentUser: null as any }, documents: {} as Record<string, any>, matches: [] as any[], writes: vi.fn(), error: false }));
vi.mock('../firebase/config', () => ({ auth: state.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}`, id }),
  collection: (_db: unknown, collection: string) => collection,
  where: (...args: unknown[]) => args,
  query: (...args: unknown[]) => args,
  getDoc: vi.fn(async (ref: any) => { if (state.error) throw new Error('OFFLINE'); return { id: ref.id, exists: () => Object.hasOwn(state.documents, ref.path), data: () => state.documents[ref.path] }; }),
  getDocs: vi.fn(async () => ({ docs: state.matches, empty: state.matches.length === 0 })),
  setDoc: state.writes, updateDoc: state.writes, runTransaction: state.writes,
}));
import { GlobalDriverRepository, GlobalTruckRepository, GlobalCarrierRepository, GlobalMaterialRepository } from '../repositories/globalIdentity.repository';
import { computeNaturalKeyToken, legacyNaturalKeyTokens } from '../utils/globalIdentityPolicy';
const cases = [
  { kind: 'DRIVER', repo: () => new GlobalDriverRepository(), input: { nationalId: '1234567890', fullNameAr: 'سائق', phone: '0500000000', createdBy: 'actor' }, id: 'driverId', collection: 'drivers', natural: 'nationalId', key: '1234567890', lookup: 'findByNaturalIdentity', update: 'updateProfile' },
  { kind: 'TRUCK', repo: () => new GlobalTruckRepository(), input: { plate: 'ا ب ج 1234', createdBy: 'actor' }, id: 'truckId', collection: 'trucks', natural: 'normalizedPlate', key: 'ا ب ج 1234', lookup: 'findByNaturalIdentity', update: 'updateProfile' },
  { kind: 'CARRIER', repo: () => new GlobalCarrierRepository(), input: { nameAr: 'ناقل', commercialRegistrationNo: '1010123456', createdBy: 'actor' }, id: 'carrierId', collection: 'carriers', natural: 'commercialRegistrationNo', key: '1010123456', lookup: 'findByLegalIdentity', update: 'updateProfile' },
  { kind: 'MATERIAL', repo: () => new GlobalMaterialRepository(), input: { nameAr: 'مادة', code: 'SAND', createdBy: 'actor' }, id: 'materialId', collection: 'materials', natural: 'code', key: 'SAND', lookup: 'findByCanonicalCode', update: 'updateCatalog' },
] as const;
beforeEach(() => { state.auth.currentUser = null; state.documents = {}; state.matches = []; state.error = false; state.writes.mockClear(); });
describe('P5-B1 authenticated persistent reads never resurrect test cache', () => {
  for (const c of cases) {
    it(`${c.kind} absence and failures never fall back; authenticated writes require server`, async () => {
      const repo: any = c.repo(), cached = await repo.createGlobal(c.input);
      expect(await repo.findById(cached[c.id])).toEqual(cached);
      state.auth.currentUser = { uid: 'actor' };
      expect(await repo.findById(cached[c.id])).toBeNull();
      expect(await repo[c.lookup](c.key)).toBeNull();
      await expect(repo.createGlobal(c.input)).rejects.toThrow('GLOBAL_SERVER_COMMAND_REQUIRED');
      await expect(repo[c.update](cached[c.id], { updatedBy: 'actor' })).rejects.toThrow('GLOBAL_SERVER_COMMAND_REQUIRED');
      state.error = true;
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
      try { await expect(repo.findById(cached[c.id])).rejects.toThrow('OFFLINE'); } finally { consoleError.mockRestore(); }
      expect(state.writes).not.toHaveBeenCalled();
    });
    it(`${c.kind} authenticated lookup validates target and rejects duplicates/conflicts`, async () => {
      const repo: any = c.repo(); state.auth.currentUser = { uid: 'actor' };
      const token = `natural_identity_lookups/${computeNaturalKeyToken(c.kind, c.key)}`;
      state.documents[token] = { entityType: 'WRONG', systemId: 'ID' };
      await expect(repo[c.lookup](c.key)).rejects.toThrow('IDENTITY_LOOKUP_INTEGRITY_ERROR');
      state.documents[token] = { entityType: c.kind, systemId: 'ID' };
      await expect(repo[c.lookup](c.key)).rejects.toThrow('IDENTITY_LOOKUP_INTEGRITY_ERROR');
      const record = { [c.id]: 'ID', [c.natural]: c.key, status: 'ACTIVE' };
      state.documents[`${c.collection}/ID`] = record;
      expect(await repo[c.lookup](c.key)).toEqual(record);
      state.documents[`${c.collection}/ID`].createdAt = 'invalid-time';
      await expect(repo[c.lookup](c.key)).rejects.toThrow('PERSISTENCE_BOUNDARY_INVALID');
      delete state.documents[`${c.collection}/ID`].createdAt;
      state.matches = [{ id: 'ID', data: () => record }, { id: 'SECOND', data: () => ({ ...record, [c.id]: 'SECOND' }) }];
      await expect(repo[c.lookup](c.key)).rejects.toThrow('DUPLICATE_NATURAL_KEY');
      state.matches = [];
      state.documents[`natural_identity_lookups/${legacyNaturalKeyTokens(c.kind, c.key)[0]}`] = { entityType: c.kind, systemId: 'SECOND' };
      state.documents[`${c.collection}/SECOND`] = { ...record, [c.id]: 'SECOND' };
      await expect(repo[c.lookup](c.key)).rejects.toThrow('IDENTITY_LOOKUP_INTEGRITY_ERROR');
      expect(state.writes).not.toHaveBeenCalled();
    });
  }
});
