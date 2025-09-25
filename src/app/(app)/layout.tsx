
'use client';

// Since authentication is removed, this layout no longer needs to check for a user.
// It simply renders its children.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
