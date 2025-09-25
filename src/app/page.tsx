
'use client';
import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';

export default function RootPage() {
  const { user, loading } = useUser();

  // It's better to handle redirection logic inside the (app) group layout
  // or within the useUser hook itself to avoid flashes of content.
  // This page can serve as a loading screen or a simple redirector.

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  // This part will likely not be reached due to the redirects above.
  return null;
}
