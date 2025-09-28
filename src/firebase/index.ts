
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
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


