
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore'

export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  let firebaseApp;
  try {
    // This will succeed in a Firebase App Hosting environment
    firebaseApp = initializeApp();
  } catch (e) {
    // We're not in App Hosting, so initialize with the provided config
    firebaseApp = initializeApp(firebaseConfig);
  }
  
  return getSdks(firebaseApp);
}

// Keep a reference to Firestore instance to avoid re-initializing persistence
let firestoreInstance: Firestore | null = null;

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firestoreInstance) {
    const db = getFirestore(firebaseApp);
    enableIndexedDbPersistence(db, {force: true}).catch((err) => {
      if (err.code === 'failed-precondition') {
        // This can happen if multiple tabs are open.
        console.warn('Firestore persistence could not be enabled: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence.
        console.warn('Firestore persistence is not supported in this browser.');
      }
    });
    firestoreInstance = db;
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestoreInstance
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';



