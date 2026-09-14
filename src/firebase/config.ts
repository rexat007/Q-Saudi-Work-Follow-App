import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';

const normalizedFirebaseConfig = {
  ...rawFirebaseConfig,
  authDomain:
    rawFirebaseConfig.authDomain && !rawFirebaseConfig.authDomain.includes('--')
      ? rawFirebaseConfig.authDomain
      : `${rawFirebaseConfig.projectId}.firebaseapp.com`,
};

const app = getApps().length === 0 ? initializeApp(normalizedFirebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId to bind to the provisioned database instance
export const db = getFirestore(app, (normalizedFirebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export default app;
