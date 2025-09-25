
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
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
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...authUser, ...docSnap.data() } as CombinedUser);
          } else {
            // User exists in Auth but not in Firestore yet, might happen during signup
            setUser(authUser as CombinedUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user from Firestore:", error);
          setUser(authUser as CombinedUser); // Fallback to auth user
          setLoading(false);
        });
        // Return the firestore unsubscribe function to be called when auth state changes
        return () => unsubscribeFirestore();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    // Return the auth unsubscribe function to be called when the component unmounts
    return () => unsubscribeAuth();
  }, [auth, firestore]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user && !isAuthPage) {
      redirect('/login');
    }

    if(user && isAuthPage) {
      redirect('/dashboard');
    }

  }, [user, loading, pathname, router]);

  return { user, loading };
}
