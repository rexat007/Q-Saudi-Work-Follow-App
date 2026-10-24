import { describe, expect, it, vi } from 'vitest';
import { createAuthSession } from '../firebase/authSession';
import type { UserEntity } from '../types/entities';
import { readFileSync } from 'node:fs';
const account = { userId: 'u', role: 'SUPER_ADMIN' } as UserEntity;
function setup() {
  const sink = { user: vi.fn(), profile: vi.fn(), token: vi.fn(), loading: vi.fn(), ready: vi.fn(), error: vi.fn() };
  let receive: (profile: UserEntity | null) => void = () => {};
  let fail: () => void = () => {};
  const stop = vi.fn();
  const deps = { load: vi.fn(async () => account), watch: vi.fn((_user: unknown, next: typeof receive, error: typeof fail) => { receive = next; fail = error; return stop; }), terminate: vi.fn(async () => {}) };
  const controller = createAuthSession(sink, deps);
  const user = { uid: 'u', getIdToken: vi.fn(async () => 'token') };
  return { sink, deps, controller, user, stop, receive: (value: UserEntity | null) => receive(value), fail: () => fail() };
}
describe('Auth session refresh coherence', () => {
  it('refreshes both token and current profile and watches profile revocation', async () => {
    const x = setup(); await x.controller.change(x.user);
    expect(x.sink.token).toHaveBeenLastCalledWith('token'); expect(x.sink.profile).toHaveBeenLastCalledWith(account);
    x.receive({ ...account, role: 'VIEWER' }); expect(x.sink.profile).toHaveBeenLastCalledWith({ ...account, role: 'VIEWER' });
    x.receive(null); expect(x.sink.profile).toHaveBeenLastCalledWith(null);
    await x.controller.refresh(); expect(x.user.getIdToken).toHaveBeenCalledTimes(2); expect(x.stop).toHaveBeenCalledOnce();
  });
  it('clears privileged profile immediately on refresh and does not fabricate a profile on failure', async () => {
    const x = setup(); await x.controller.change(x.user); x.deps.load.mockRejectedValueOnce(Error('network'));
    await x.controller.refresh(); expect(x.sink.profile).toHaveBeenLastCalledWith(null); expect(x.sink.token).toHaveBeenLastCalledWith(null);
  });
  it('clears stale privilege on profile-listener failure', async () => {
    const x = setup(); await x.controller.change(x.user); x.fail(); expect(x.sink.profile).toHaveBeenLastCalledWith(null);
  });
  it('sign-out clears identity/profile/token synchronously and detaches profile watch', async () => {
    const x = setup(); await x.controller.change(x.user); x.controller.clear();
    expect(x.sink.user).toHaveBeenLastCalledWith(null); expect(x.sink.profile).toHaveBeenLastCalledWith(null); expect(x.sink.token).toHaveBeenLastCalledWith(null); expect(x.stop).toHaveBeenCalledOnce();
  });
  it('an old asynchronous profile cannot restore privilege after sign-out', async () => {
    const x = setup(); let resolve!: (value: UserEntity) => void;
    x.deps.load.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = x.controller.change(x.user); await Promise.resolve(); x.controller.clear(); resolve(account); await pending;
    expect(x.sink.profile).toHaveBeenLastCalledWith(null); expect(x.deps.watch).not.toHaveBeenCalled();
  });
  it('an old user refresh cannot overwrite a new authenticated session', async () => {
    const x = setup(); let resolve!: (value: UserEntity) => void;
    x.deps.load.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = x.controller.change(x.user); await Promise.resolve();
    const newAccount = { ...account, userId: 'v', role: 'VIEWER' } as UserEntity;
    x.deps.load.mockResolvedValueOnce(newAccount); await x.controller.change({ uid: 'v', getIdToken: async () => 'v-token' });
    resolve(account); await pending;
    expect(x.sink.profile).toHaveBeenLastCalledWith(newAccount); expect(x.sink.token).toHaveBeenLastCalledWith('v-token');
  });
  it.each(['auth/user-disabled', 'auth/user-token-expired', 'auth/invalid-user-token', 'auth/id-token-revoked'])('collapses invalid authentication %s', async code => {
    const x = setup(); x.user.getIdToken.mockRejectedValueOnce({ code }); await x.controller.change(x.user);
    expect(x.sink.user).toHaveBeenLastCalledWith(null); expect(x.deps.terminate).toHaveBeenCalledOnce();
  });
  it('ignores callbacks and asynchronous results after dispose', async () => {
    const x = setup(); await x.controller.change(x.user); x.controller.dispose(); x.sink.profile.mockClear();
    x.receive(account); x.fail(); expect(x.sink.profile).not.toHaveBeenCalled(); expect(x.stop).toHaveBeenCalledOnce();
  });
  it('wires token events, live profile changes and immediate sign-out clearing in AuthProvider', () => {
    const source = readFileSync('src/firebase/authContext.tsx', 'utf8');
    expect(source).toContain('onIdTokenChanged(auth,'); expect(source).not.toContain('onAuthStateChanged');
    expect(source).toContain("onSnapshot(doc(db, 'users', current.uid)"); expect(source).toContain('validateAccountProfile(raw, uid)');
    expect(source.indexOf('session.current?.clear();', source.indexOf('const signOutUser'))).toBeLessThan(source.indexOf('await signOut(auth)', source.indexOf('const signOutUser')));
    expect(source).not.toContain('new Date().toISOString()');
  });
});
