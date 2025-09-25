
'use client';

import React from 'react';
import ManagementSideNav from './components/management-sidenav';
import { useUser } from '@/firebase/auth/use-user';
import { notFound } from 'next/navigation';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">Chargement...</div>;
  }
  
  if (!user) {
    // Should be handled by the root app layout, but as a safeguard.
    return notFound();
  }
  
  const isAuthorized = user.role === 'admin' || user.role === 'manager';

  if (!isAuthorized) {
    // Or redirect to a "not authorized" page
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold">Accès non autorisé</h1>
            <p className="mt-4 text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 grid md:grid-cols-[200px_1fr] gap-8">
      <ManagementSideNav />
      <div>{children}</div>
    </div>
  );
}
