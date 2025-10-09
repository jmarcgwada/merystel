'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

const salesPages = ['/pos', '/supermarket', '/restaurant', '/commercial'];

export function NavigationGuard() {
  const pathname = usePathname();
  const { order, showNavConfirm } = usePos();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const wasOnSalesPage = salesPages.some(page => previousPathname.current.startsWith(page));
    const isSalesPage = salesPages.some(page => pathname.startsWith(page));

    // Handle internal navigation away from a sales page
    if (wasOnSalesPage && !isSalesPage && order.length > 0) {
      // Use a trick to prevent navigation: show confirm and immediately push state back.
      // The `confirmNavigation` in the context will handle the actual route change.
      showNavConfirm(pathname);
      history.pushState(null, '', previousPathname.current);
    }
    
    // Update the ref to the current path for the next navigation event.
    previousPathname.current = pathname;

  }, [pathname, order.length, showNavConfirm]);


  useEffect(() => {
    // This effect handles leaving the entire site (refresh, close tab, etc.)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check the path from window.location because pathname might be stale
      const isOnSalesPageNow = salesPages.some(page => window.location.pathname.startsWith(page));
      if (isOnSalesPageNow && order.length > 0) {
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
  }, [order.length]); // Dependency on order.length ensures the listener is up-to-date.

  return null;
}
