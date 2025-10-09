
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

const salesPages = ['/pos', '/supermarket', '/restaurant', '/commercial'];

export function NavigationGuard() {
  const pathname = usePathname();
  const { order, showNavConfirm } = usePos();
  const previousPathname = useRef(pathname);

  const isLeavingSalesPage = salesPages.some(page => previousPathname.current.startsWith(page)) && !salesPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    // This effect handles navigation *within* the app (client-side routing)
    if (isLeavingSalesPage && order.length > 0) {
      showNavConfirm(pathname);
       // This is a trick: Next.js router doesn't have a native 'cancel navigation'.
       // We immediately push the user back to where they were.
       // The `showNavConfirm` will handle the actual navigation if confirmed.
      const currentPathWithQuery = previousPathname.current + window.location.search;
      history.pushState(null, '', currentPathWithQuery);
    }
    previousPathname.current = pathname;

  }, [pathname, isLeavingSalesPage, order.length, showNavConfirm]);


  useEffect(() => {
    // This effect handles leaving the entire site (refresh, close tab, etc.)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const isSalesPage = salesPages.some(page => window.location.pathname.startsWith(page));
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
  }, [order.length]);

  return null;
}
