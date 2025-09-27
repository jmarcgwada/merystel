
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
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-52 lg:w-56 shrink-0">
          <div className="sticky top-24">
            <ManagementSideNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
