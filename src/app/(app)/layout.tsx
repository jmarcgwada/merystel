
'use client';

import { useUser } from '@/firebase/auth/use-user';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  if (!user) {
    // The useUser hook handles redirection, so we can just return null or a loading state.
    return null;
  }

  return <>{children}</>;
}
