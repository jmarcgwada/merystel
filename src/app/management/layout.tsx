

'use client';

import React from 'react';
import ManagementSideNav from './components/management-sidenav';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative">
        <aside className="w-[224px] shrink-0 fixed">
          <ManagementSideNav />
        </aside>
        <main className="pl-[256px] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
