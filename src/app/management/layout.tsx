
'use client';

import React from 'react';
import ManagementSideNav from './components/management-sidenav';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex">
      <aside className="w-56 shrink-0 border-r bg-card overflow-y-auto">
        <ManagementSideNav />
      </aside>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
