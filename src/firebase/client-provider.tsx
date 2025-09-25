'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const firebaseApp = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp.app}
      auth={firebaseApp.auth}
      firestore={firebaseApp.db}
    >
      {children}
    </FirebaseProvider>
  );
}
