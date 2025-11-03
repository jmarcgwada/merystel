
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { AppLoading } from '@/components/layout/app-loading';

export function CompanyInfoGuard({ children }: { children: React.ReactNode }) {
  const { companyInfo, isLoading } = usePos();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading) {
      if (!companyInfo?.name && pathname !== '/settings/company') {
        router.push('/settings/company?from=' + pathname);
      }
    }
  }, [isClient, isLoading, companyInfo, pathname, router]);

  if (!isClient || isLoading || (!companyInfo?.name && pathname !== '/settings/company')) {
    return <AppLoading message="Vérification de la configuration..." />;
  }

  return <>{children}</>;
}
