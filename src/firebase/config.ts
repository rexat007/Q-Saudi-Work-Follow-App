import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';

const getEnvVar = (key: string): string | undefined => {
  try {
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

const rawConfig = {
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || rawFirebaseConfig.projectId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || rawFirebaseConfig.appId,
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || rawFirebaseConfig.apiKey,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || rawFirebaseConfig.authDomain,
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || rawFirebaseConfig.firestoreDatabaseId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || rawFirebaseConfig.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || rawFirebaseConfig.messagingSenderId,
  measurementId: rawFirebaseConfig.measurementId,
  oAuthClientId: getEnvVar('VITE_FIREBASE_OAUTH_CLIENT_ID') || rawFirebaseConfig.oAuthClientId,
  recaptchaSiteKey: rawFirebaseConfig.recaptchaSiteKey,
};

export const normalizedFirebaseConfig = {
  ...rawConfig,
  authDomain:
    rawConfig.authDomain && !rawConfig.authDomain.includes('--')
      ? rawConfig.authDomain
      : `${rawConfig.projectId}.firebaseapp.com`,
};

const app = getApps().length === 0 ? initializeApp(normalizedFirebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId to bind to the provisioned database instance
export const db = getFirestore(app, (normalizedFirebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export default app;
