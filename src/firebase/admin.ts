import { readFileSync } from 'fs';
import { join } from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (err) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON. Initializing with default app credentials.', err);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

// Resolve the Firestore Database ID used by the client
let firestoreDatabaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID;

if (!firestoreDatabaseId) {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
  } catch (err) {
    console.warn('Could not read firebase-applet-config.json for firestoreDatabaseId, using fallback:', err);
  }
}

if (!firestoreDatabaseId) {
  firestoreDatabaseId = 'ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1';
}

export let adminAuth = getAuth();
export let adminDb = getFirestore(firestoreDatabaseId);

export const setTestAuthOverride = (override: any) => {
  adminAuth = override;
};

export const setTestDbOverride = (override: any) => {
  adminDb = override;
};

export const getResolvedDatabaseId = () => {
  return firestoreDatabaseId;
};
