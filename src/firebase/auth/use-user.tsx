
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { usePathname, useRouter, redirect } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';

export type CombinedUser = AuthUser & DocumentData & AppUser;

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
        const userDocRef = doc(firestore, 'users', authUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...authUser, ...docSnap.data() } as CombinedUser);
          } else {
            setUser(authUser as CombinedUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user from Firestore:", error);
          setUser(authUser as CombinedUser);
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
