'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';
import { usePathname, useRouter } from 'next/navigation';

export function useUser() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  return { user, loading };
}
