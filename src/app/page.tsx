
'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';

export default function RootPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  return null;
}
