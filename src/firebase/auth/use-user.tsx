
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { usePathname, useRouter, redirect } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';

export type CombinedUser = AuthUser & DocumentData & AppUser;

const SHARED_COMPANY_ID = 'main'; // Centralize company ID
const ADMIN_EMAIL = 'admin@zenith.com'; // Define the super admin email

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // If a user logs out, make sure to unsubscribe from any existing Firestore listener first.
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (authUser) {
        // Correctly point to the user document inside the company subcollection
        const userDocRef = doc(firestore, 'companies', SHARED_COMPANY_ID, 'users', authUser.uid);
        
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          let combinedUser: CombinedUser;
          if (docSnap.exists()) {
            combinedUser = { ...authUser, ...docSnap.data() } as CombinedUser;
          } else {
            // This case might happen briefly during registration before the doc is created
            combinedUser = authUser as CombinedUser; 
          }

          // ** This is the new logic to enforce the admin role for the specific email **
          if (combinedUser.email === ADMIN_EMAIL) {
            combinedUser.role = 'admin';
          }

          setUser(combinedUser);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user from Firestore:", error);
          const tempUser = authUser as CombinedUser;
          // Also apply admin role override on error to be safe
          if (tempUser.email === ADMIN_EMAIL) {
            tempUser.role = 'admin';
          }
          setUser(tempUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [auth, firestore]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user && !isAuthPage) {
      redirect('/login');
    }

    if (user && isAuthPage) {
      redirect('/dashboard');
    }

  }, [user, loading, pathname]);

  return { user, loading };
}
