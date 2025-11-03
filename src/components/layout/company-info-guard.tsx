
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { AppLoading } from '@/components/layout/app-loading';

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
    return <AppLoading message="Vérification de la configuration..." />;
  }

  return <>{children}</>;
}
