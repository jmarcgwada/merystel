
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';
import { PosProvider } from '@/contexts/pos-context';
import { NavigationBlocker } from '@/components/layout/navigation-blocker';

function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-primary animate-pulse"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
        <p className="text-muted-foreground">Vérification de la session...</p>
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
}

function SessionValidation({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const { validateSession, forceSignOut, sessionInvalidated, setSessionInvalidated, order } = usePos();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      redirect('/login');
      return;
    }
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken || !validateSession(user.uid, sessionToken)) {
        if (order && order.length > 0) {
            setSessionInvalidated(true);
        } else {
            forceSignOut("Une nouvelle session a été démarrée sur un autre appareil.");
            return;
        }
    } else if (sessionInvalidated && order && order.length === 0) {
        forceSignOut("Session terminée après la fin de la transaction.");
        return;
    }
    setIsCheckingSession(false);
  }, [user, loading, validateSession, forceSignOut, order, sessionInvalidated, setSessionInvalidated]);

  if (isCheckingSession || loading) {
    return <AppLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <NavigationBlocker />
      {children}
    </>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PosProvider>
      <SessionValidation>
        {children}
      </SessionValidation>
    </PosProvider>
  )
}
