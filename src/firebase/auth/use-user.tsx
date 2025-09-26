
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { useAuth, useFirestore } from '@/firebase/provider';

// This will be the new user type, combining Firebase Auth user and our Firestore user profile.
export type CombinedUser = AuthUser & DocumentData & AppUser;

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is signed in, now fetch their profile from Firestore.
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profileData = doc.data() as AppUser;
            // Combine auth data and profile data
            setUser({ ...authUser, ...profileData, id: doc.id });
          } else {
            // Firestore profile doesn't exist. This can happen.
            // You might want to handle this case, e.g., by creating a default profile.
            // For now, we treat them as not fully logged in.
            setUser(null); 
          }
          setLoading(false);
        });

        // Return a cleanup function for the profile listener
        return () => unsubProfile();
      } else {
        // User is signed out.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading };
}
