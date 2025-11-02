
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

export function NavigationGuard() {
  const { order, showNavConfirm } = usePos();
  const pathname = usePathname();

  useEffect(() => {
    if (!order || order.length === 0) {
      return;
    }

    // Push a new entry into the history stack.
    history.pushState(null, '', pathname);

    const handlePopState = (event: PopStateEvent) => {
      // If there's an order, prevent going back and show confirmation.
      if (order && order.length > 0) {
        history.go(1); // Go forward to cancel the back action.
        showNavConfirm(pathname); // Show the confirmation dialog.
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup the event listener when the component unmounts or dependencies change.
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, order, showNavConfirm]);

  return null; // This component doesn't render anything visible.
}
