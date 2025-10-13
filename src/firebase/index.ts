
'use client';

// This file is now mostly a barrel file for mock providers
// and hooks, since the actual Firebase connection is removed.

export function initializeFirebase() {
  return {
    firebaseApp: {},
    auth: {},
    firestore: {}
  };
}

export * from './provider';

// Mock implementation of hooks that would have used firebase
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: any,
): { data: T[] | null; isLoading: boolean; error: Error | null; } {
  return { data: [], isLoading: false, error: null };
}

export function useDoc<T = any>(
  memoizedDocRef: any,
): { data: T | null; isLoading: boolean; error: Error | null; } {
  return { data: null, isLoading: false, error: null };
}

export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
