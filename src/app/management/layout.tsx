'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarProvider,
} from '@/components/ui/sidebar';
import ManagementSideNav from './components/management-sidenav';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
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
    <SidebarProvider>
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar className="h-full sticky top-0">
          <SidebarContent className="flex-1 flex flex-col">
            <SidebarMenu className="flex-1">
               <ManagementSideNav />
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
           {showScrollTop && (
            <Button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg"
              size="icon"
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
