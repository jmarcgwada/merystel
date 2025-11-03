
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AppLoading({ message = "Chargement de l'application..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 animate-pulse text-primary"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        <p className="text-muted-foreground">{message}</p>
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
