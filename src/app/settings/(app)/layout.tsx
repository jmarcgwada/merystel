
import React from 'react';

export default function SettingsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is simplified as auth checks are removed
  return <>{children}</>;
}
