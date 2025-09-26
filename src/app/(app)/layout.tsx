
'use client';

import { usePos } from '@/contexts/pos-context';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const { authRequired } = usePos();

  useEffect(() => {
    if (!loading) {
      if (authRequired && !user) {
        redirect('/login');
      } else if (!authRequired && !user) {
        // If auth is not required and there's no user, sign in anonymously.
        initiateAnonymousSignIn(auth);
      }
    }
  }, [user, loading, authRequired, auth]);

  // Show loading screen while we determine auth state and requirements.
  if (loading || (authRequired && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de la session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
