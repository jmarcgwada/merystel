
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ArrowUp,
} from 'lucide-react';
import Link from 'next/link';
import ManagementSideNav from './components/management-sidenav';


export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const checkScroll = () => {
        setShowScrollTop(mainEl.scrollTop > 200);
    };

    mainEl.addEventListener('scroll', checkScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="sticky top-0 h-screen">
          <SidebarContent className="p-2 flex-1 flex flex-col">
            <SidebarMenu className="flex-1">
               <ManagementSideNav />
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main ref={mainContentRef} className="flex-1 overflow-y-auto relative">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50"
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
