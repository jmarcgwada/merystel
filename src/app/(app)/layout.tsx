
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
  const { validateSession, forceSignOut } = usePos();


  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }

    if (!loading && user) {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken || !validateSession(user.uid, sessionToken)) {
            forceSignOut("Une nouvelle session a été démarrée sur un autre appareil.");
        }
    }

  }, [user, loading, validateSession, forceSignOut]);

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

