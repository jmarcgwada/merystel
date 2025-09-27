
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
       <div className="grid grid-cols-1 md:grid-cols-[208px_1fr] lg:grid-cols-[224px_1fr] gap-8">
        <aside className="w-full shrink-0">
           <div className="sticky top-24">
            <ManagementSideNav />
          </div>
        </aside>
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
