import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import * as ts from 'typescript';

const source = readFileSync(resolve('src/firebase/admin.ts'), 'utf8');
const executable = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const fallbackDatabase = 'ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1';

function load(options: {
  env?: Record<string, string>;
  existingApp?: boolean;
  config?: Record<string, unknown>;
  configError?: boolean;
  certError?: Error;
  initializationError?: Error;
  firestoreError?: Error;
  writeError?: Error;
} = {}) {
  const credential = { source: 'explicit-test-credential' };
  const auth = { source: 'admin-auth' };
  const set = vi.fn(async () => {
    if (options.writeError) throw options.writeError;
  });
  const realDb = { collection: vi.fn(() => ({ doc: vi.fn(() => ({ set })) })) };
  const initializeApp = vi.fn(() => {
    if (options.initializationError) throw options.initializationError;
    return {};
  });
  const cert = vi.fn((value: unknown) => {
    if (options.certError) throw options.certError;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid credential');
    return credential;
  });
  const getFirestore = vi.fn(() => {
    if (options.firestoreError) throw options.firestoreError;
    return realDb;
  });
  const readConfig = vi.fn(() => {
    if (options.configError) throw new Error('Missing local config');
    return JSON.stringify(options.config ?? { firestoreDatabaseId: 'configured-db' });
  });
  const exports: any = {};
  const evaluate = () => runInNewContext(executable, {
    exports,
    process: { env: options.env ?? {}, cwd: () => '/isolated-fixture' },
    console: { warn: vi.fn() },
    require: (id: string) => {
      if (id === 'fs') return { readFileSync: readConfig };
      if (id === 'path') return { join: (...parts: string[]) => parts.join('/') };
      if (id === 'firebase-admin/app') return {
        getApps: () => options.existingApp ? [{}] : [], initializeApp, cert,
      };
      if (id === 'firebase-admin/auth') return { getAuth: () => auth };
      if (id === 'firebase-admin/firestore') return { getFirestore };
      throw new Error(`Unexpected runtime import: ${id}`);
    },
  });
  return { evaluate, exports, initializeApp, cert, getFirestore, readConfig, credential, auth, realDb, set };
}

describe('Firebase Admin persistence selection boundary', () => {
  it.each(['production', 'development', ''])('uses real Firestore with ADC in ordinary %s execution', (mode) => {
    const fixture = load({ env: mode ? { NODE_ENV: mode } : {} });
    fixture.evaluate();
    expect(fixture.initializeApp).toHaveBeenCalledExactlyOnceWith();
    expect(fixture.cert).not.toHaveBeenCalled();
    expect(fixture.getFirestore).toHaveBeenCalledExactlyOnceWith('configured-db');
    expect(fixture.exports.adminDb).toBe(fixture.realDb);
    expect(fixture.exports.inMemoryAdminStore).toEqual({});
  });

  it('keeps automatic memory persistence inside explicit test execution', async () => {
    const fixture = load({ env: { NODE_ENV: 'test' } });
    fixture.evaluate();
    expect(fixture.getFirestore).not.toHaveBeenCalled();
    const ref = fixture.exports.adminDb.collection('isolated').doc('record');
    await ref.set({ value: 7 });
    expect((await ref.get()).data()).toEqual({ value: 7 });
    expect(fixture.exports.inMemoryAdminStore['isolated/record']).toEqual({ value: 7 });
  });

  it('preserves explicit credential initialization and real production persistence', () => {
    const serviceAccount = { project_id: 'isolated-project', client_email: 'fixture@example.invalid', private_key: 'fixture-only' };
    const fixture = load({ env: { NODE_ENV: 'production', FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify(serviceAccount) } });
    fixture.evaluate();
    expect(fixture.cert).toHaveBeenCalledExactlyOnceWith(serviceAccount);
    expect(fixture.initializeApp).toHaveBeenCalledExactlyOnceWith({ credential: fixture.credential });
    expect(fixture.exports.adminDb).toBe(fixture.realDb);
  });

  it.each(['{invalid-secret-json', '', 'null', '"invalid"', '[]'])('fails visibly for malformed explicit configuration %j', (value) => {
    const fixture = load({ env: { NODE_ENV: 'production', FIREBASE_SERVICE_ACCOUNT_KEY: value } });
    expect(fixture.evaluate).toThrow('Invalid FIREBASE_SERVICE_ACCOUNT_KEY configuration.');
    expect(fixture.initializeApp).not.toHaveBeenCalled();
    expect(fixture.getFirestore).not.toHaveBeenCalled();
    expect(fixture.exports.adminDb).toBeUndefined();
  });

  it('fails without exposing SDK credential error details or falling back to ADC', () => {
    const fixture = load({ env: { FIREBASE_SERVICE_ACCOUNT_KEY: '{}' }, certError: new Error('sensitive credential details') });
    expect(fixture.evaluate).toThrow(/^Invalid FIREBASE_SERVICE_ACCOUNT_KEY configuration\.$/);
    expect(fixture.initializeApp).not.toHaveBeenCalled();
    expect(fixture.getFirestore).not.toHaveBeenCalled();
  });

  it('reuses an existing Admin app without duplicate initialization', () => {
    const fixture = load({ env: { NODE_ENV: 'production' }, existingApp: true });
    fixture.evaluate();
    expect(fixture.initializeApp).not.toHaveBeenCalled();
    expect(fixture.exports.adminDb).toBe(fixture.realDb);
  });

  it('does not hide malformed explicit configuration behind an existing app', () => {
    const fixture = load({ existingApp: true, env: { FIREBASE_SERVICE_ACCOUNT_KEY: 'malformed' } });
    expect(fixture.evaluate).toThrow('Invalid FIREBASE_SERVICE_ACCOUNT_KEY configuration.');
    expect(fixture.getFirestore).not.toHaveBeenCalled();
  });

  it('preserves environment database ID precedence over local configuration', () => {
    const fixture = load({ env: { FIREBASE_FIRESTORE_DATABASE_ID: 'environment-db' } });
    fixture.evaluate();
    expect(fixture.readConfig).not.toHaveBeenCalled();
    expect(fixture.getFirestore).toHaveBeenCalledExactlyOnceWith('environment-db');
    expect(fixture.exports.getResolvedDatabaseId()).toBe('environment-db');
  });

  it.each([{ configError: true }, { config: {} }])('preserves the existing final database fallback %j', (options) => {
    const fixture = load(options);
    fixture.evaluate();
    expect(fixture.getFirestore).toHaveBeenCalledExactlyOnceWith(fallbackDatabase);
    expect(fixture.exports.getResolvedDatabaseId()).toBe(fallbackDatabase);
  });

  it('preserves explicit DB/auth override hooks and factory seeding', async () => {
    const fixture = load();
    fixture.evaluate();
    const injected = fixture.exports.createInMemoryAdminDb({ 'isolated/seed': { value: 11 } });
    fixture.exports.setTestDbOverride(injected);
    expect(fixture.exports.adminDb).toBe(injected);
    expect((await injected.collection('isolated').doc('seed').get()).data()).toEqual({ value: 11 });
    const authOverride = { verifyIdToken: vi.fn() };
    fixture.exports.setTestAuthOverride(authOverride);
    expect(fixture.exports.adminAuth).toBe(authOverride);
  });

  it('propagates app initialization failure without switching persistence', () => {
    const failure = new Error('initialization failed');
    const fixture = load({ initializationError: failure });
    expect(fixture.evaluate).toThrow(failure);
    expect(fixture.getFirestore).not.toHaveBeenCalled();
    expect(fixture.exports.adminDb).toBeUndefined();
  });

  it('propagates real Firestore initialization failure without selecting memory', () => {
    const failure = new Error('Firestore initialization failed');
    const fixture = load({ firestoreError: failure });
    expect(fixture.evaluate).toThrow(failure);
    expect(fixture.exports.adminDb).toBeUndefined();
    expect(fixture.exports.inMemoryAdminStore).toEqual({});
  });

  it('keeps a failed real write visible without a successful memory replacement', async () => {
    const failure = new Error('persistence unavailable');
    const fixture = load({ env: { NODE_ENV: 'production' }, writeError: failure });
    fixture.evaluate();
    await expect(fixture.exports.adminDb.collection('isolated').doc('record').set({ value: 1 })).rejects.toThrow(failure);
    expect(fixture.set).toHaveBeenCalledExactlyOnceWith({ value: 1 });
    expect(fixture.exports.adminDb).toBe(fixture.realDb);
    expect(fixture.exports.inMemoryAdminStore).toEqual({});
  });
});
