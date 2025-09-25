
'use client';

import React from 'react';
import ManagementSideNav from './components/management-sidenav';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 grid md:grid-cols-[200px_1fr] gap-8">
      <ManagementSideNav />
      <div>{children}</div>
    </div>
  );
}
