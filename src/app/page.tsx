
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        redirect('/dashboard');
      } else {
        redirect('/about');
      }
    }
  }, [user, loading]);

  return <div className="flex h-screen items-center justify-center">Chargement...</div>;
}
