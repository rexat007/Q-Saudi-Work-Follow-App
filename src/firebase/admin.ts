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

export let adminAuth = getAuth();
export let adminDb = getFirestore();

export const setTestAuthOverride = (override: any) => {
  adminAuth = override;
};

export const setTestDbOverride = (override: any) => {
  adminDb = override;
};
