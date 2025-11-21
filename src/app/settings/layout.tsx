

'use client';

import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
