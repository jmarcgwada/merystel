
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarProvider,
} from '@/components/ui/sidebar';
import ManagementSideNav from './components/management-sidenav';


export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-full">
        <Sidebar className="h-full">
          <SidebarContent className="flex-1 flex flex-col">
            <SidebarMenu className="flex-1">
               <ManagementSideNav />
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
