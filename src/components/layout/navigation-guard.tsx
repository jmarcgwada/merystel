'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

// This component is now deprecated as the logic has been moved to NavigationBlocker
// and specific layout files for better contextual control.
// This file can be deleted. We are keeping it empty to avoid build errors if it's imported elsewhere.

export function NavigationGuard() {
  return null;
}
