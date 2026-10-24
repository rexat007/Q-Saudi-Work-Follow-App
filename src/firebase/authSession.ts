import type { UserEntity } from '../types/entities';

interface SessionUser { uid: string; getIdToken(): Promise<string> }
interface SessionSink<U> {
  user(value: U | null): void; profile(value: UserEntity | null): void;
  token(value: string | null): void; loading(value: boolean): void;
  ready(): void; error(value: string | null): void;
}

/** Serializes asynchronous refreshes so an old identity can never restore its profile. */
export function createAuthSession<U extends SessionUser>(sink: SessionSink<U>, deps: {
  load(user: U): Promise<UserEntity | null>;
  watch(user: U, receive: (profile: UserEntity | null) => void, fail: () => void): () => void;
  terminate(): Promise<void>;
}) {
  let generation = 0;
  let current: U | null = null;
  let stop: (() => void) | undefined;
  const clear = () => {
    generation++; stop?.(); stop = undefined; current = null;
    sink.user(null); sink.profile(null); sink.token(null); sink.loading(false);
  };
  const change = async (user: U | null) => {
    clear(); sink.error(null);
    if (!user) { sink.ready(); return; }
    current = user;
    const version = generation;
    sink.user(user); sink.loading(true);
    try {
      const token = await user.getIdToken();
      const profile = await deps.load(user);
      if (version !== generation) return;
      sink.token(token); sink.profile(profile);
      stop = deps.watch(user, value => {
        if (version === generation) sink.profile(value);
      }, () => {
        if (version === generation) { sink.profile(null); sink.error('PROFILE_UNAVAILABLE'); }
      });
    } catch (error) {
      if (version !== generation) return;
      sink.profile(null); sink.token(null); sink.error('AUTH_REFRESH_FAILED');
      const code = (error as { code?: string })?.code;
      if (['auth/user-disabled', 'auth/user-token-expired', 'auth/invalid-user-token', 'auth/id-token-revoked'].includes(code || '')) {
        clear();
        await deps.terminate().catch(() => {});
      }
    } finally {
      if (version === generation || current === null) { sink.loading(false); sink.ready(); }
    }
  };
  return { change, clear, refresh: () => change(current), dispose: () => { generation++; stop?.(); stop = undefined; } };
}
