import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

export * from './provider';
export * from './auth/use-user';
export * from './client-provider';
