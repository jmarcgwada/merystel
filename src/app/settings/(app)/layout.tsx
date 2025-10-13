
import React from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';

export default function SettingsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Chargement...</div>;
  }

  // All users can now access settings
  // if (!user || user.role === 'cashier') {
  //   redirect('/dashboard');
  //   return null;
  // }
  
  return <>{children}</>;
}

    