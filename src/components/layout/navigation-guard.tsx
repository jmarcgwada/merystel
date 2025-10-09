
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

const salesPages = ['/pos', '/supermarket', '/restaurant', '/commercial'];

export function NavigationGuard() {
  const pathname = usePathname();
  const { order, showNavConfirm } = usePos();

  const isSalesPage = salesPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSalesPage && order.length > 0) {
        event.preventDefault();
        // This message is often ignored by modern browsers, which show a generic one.
        event.returnValue = 'Vous avez une commande en cours. Êtes-vous sûr de vouloir quitter ?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSalesPage, order.length]);

  return null;
}

