
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

export function NavigationGuard() {
  const { order, showNavConfirm, blockBrowserNav, isForcedMode } = usePos();
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Most browsers will use a generic message.
      event.returnValue = 'Êtes-vous sûr de vouloir quitter ? Des données pourraient ne pas être sauvegardées.';
      return event.returnValue;
    };

    const handlePopState = (event: PopStateEvent) => {
      // If global lock is on, always prevent back/forward
      if (blockBrowserNav || isForcedMode) {
        history.go(1);
        showNavConfirm(pathname);
      }
      // If there's an order, prevent going back and show confirmation
      else if (order && order.length > 0) {
        history.go(1); 
        showNavConfirm(pathname);
      }
    };
    
    if (blockBrowserNav || isForcedMode) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    // This part handles the back/forward buttons
    if ((blockBrowserNav || isForcedMode) || (order && order.length > 0)) {
        history.pushState(null, '', pathname);
        window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, order, showNavConfirm, blockBrowserNav, isForcedMode]);

  return null;
}
