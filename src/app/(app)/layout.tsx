
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
  const { validateSession, forceSignOut, sessionInvalidated, setSessionInvalidated, order } = usePos();


  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }

    if (!loading && user) {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken || !validateSession(user.uid, sessionToken)) {
            // If session is invalid, check if there is an order in progress
            if (order && order.length > 0) {
                // If there is an order, don't log out immediately.
                // Mark session as invalid and let the user finish the transaction.
                setSessionInvalidated(true);
            } else {
                // No order in progress, force sign out immediately.
                forceSignOut("Une nouvelle session a été démarrée sur un autre appareil.");
            }
        } else if (sessionInvalidated && order && order.length === 0) {
            // If the session was marked as invalid and the order is now clear, force logout.
            forceSignOut("Session terminée après la fin de la transaction.");
        }
    }

  }, [user, loading, validateSession, forceSignOut, order, sessionInvalidated, setSessionInvalidated]);

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


