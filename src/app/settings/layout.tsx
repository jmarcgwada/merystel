
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  // We need a reference to a scrollable element. 
  // Since this layout doesn't define its own, we'll find the main one from the root layout.
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the main scrollable container from the root layout
    mainScrollRef.current = document.querySelector('main');
    const mainEl = mainScrollRef.current;

    if (!mainEl) return;

    const checkScroll = () => {
      if (mainEl.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    mainEl.addEventListener('scroll', checkScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {children}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
