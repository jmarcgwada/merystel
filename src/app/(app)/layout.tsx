
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { usePos } from '@/contexts/pos-context';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const { validateSession } = usePos();


  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }
    if (user) {
      validateSession();
    }
  }, [user, loading, validateSession]);

  // Show loading screen while we determine auth state.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de la session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
