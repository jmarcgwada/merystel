'use client';

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
});

export const FirebaseProvider = ({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) => {
  return (
    <FirebaseContext.Provider
      value={{ app: firebaseApp, auth: auth, firestore: firestore }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => {
  const context = useFirebase();
  return context.app;
};

export const useAuth = () => {
  const context = useFirebase();
  if (!context.auth) {
    throw new Error('Auth not initialized');
  }
  return context.auth;
};

export const useFirestore = () => {
  const context = useFirebase();
  if (!context.firestore) {
    throw new Error('Firestore not initialized');
  }
  return context.firestore;
};
