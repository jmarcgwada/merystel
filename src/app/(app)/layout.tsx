
'use client';

import { usePos } from '@/contexts/pos-context';
import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const { authRequired } = usePos();

  useEffect(() => {
    if (authRequired && !loading && !user) {
      redirect('/login');
    }
  }, [user, loading, authRequired]);

  if (authRequired && (loading || !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de la session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
