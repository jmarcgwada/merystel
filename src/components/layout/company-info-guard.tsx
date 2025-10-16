
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';

export function CompanyInfoGuard({ children }: { children: React.ReactNode }) {
  const { companyInfo, isLoading } = usePos();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!companyInfo?.name && pathname !== '/settings/company') {
        router.push('/settings/company');
      }
    }
  }, [isLoading, companyInfo, pathname, router]);

  if (isLoading || (!companyInfo?.name && pathname !== '/settings/company')) {
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
            className="h-10 w-10 text-primary animate-pulse"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <p className="text-muted-foreground">Vérification de la configuration...</p>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
