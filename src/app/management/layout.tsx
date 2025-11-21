
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Box,
  LayoutGrid,
  Users,
  CreditCard,
  Percent,
  Utensils,
  Truck,
  History,
  Landmark,
  Library,
  BarChart3,
  LayoutDashboard,
  Wrench,
  ClipboardList,
  ArrowUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePos } from '@/contexts/pos-context';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { 
      items, 
      categories, 
      tables, 
      customers, 
      suppliers, 
      paymentMethods, 
      vatRates,
      sales,
      cheques,
      remises,
      supportTickets,
      repairActionPresets,
  } = usePos();
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const mainContentRef = React.useRef<HTMLElement | null>(null);

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


  const mainNavLinks = [
    { href: '/management/items', label: 'Articles', icon: Box, count: items?.length || 0 },
    { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, count: categories?.length || 0 },
    { href: '/management/tables', label: 'Tables', icon: Utensils, count: tables?.filter(t => t.id !== 'takeaway').length || 0 },
    { href: '/management/customers', label: 'Clients', icon: Users, count: customers?.length || 0 },
    { href: '/management/suppliers', label: 'Fournisseurs', icon: Truck, count: suppliers?.length || 0 },
  ];

  const serviceLinks = [
    { href: '/management/support-tickets', label: 'Prises en charge', icon: Wrench, count: supportTickets?.length || 0 },
    { href: '/management/repair-actions', label: 'Paramètres SAV', icon: ClipboardList, count: repairActionPresets?.length || 0 },
  ];
  
  const reportLinks = [
    { href: '/reports', label: 'Pièces de vente', icon: BarChart3 },
    { href: '/reports/payments', label: 'Paiements', icon: CreditCard },
  ];
  
  const financeNavLinks = [
      { href: '/management/payment-methods', label: 'Moyens de paiement', icon: CreditCard, count: paymentMethods?.length || 0 },
      { href: '/management/recurring', label: 'Récurrences', icon: History, count: sales?.filter(s => s.isRecurring).length || 0 },
      { href: '/management/remises', label: 'Remises', icon: Library, count: remises?.length || 0 },
  ];

  const vatLink = { href: '/management/vat', label: 'TVA', icon: Percent, count: vatRates?.length || 0 };
  const chequeLink = { href: '/management/checks', label: 'Chèques', icon: Landmark, count: cheques?.filter(c => c.statut === 'enPortefeuille').length || 0 };

  const renderLink = (link: { href: string; label: string; icon: React.ElementType; count?: number }) => (
      <SidebarMenuItem key={link.href}>
          <Button asChild variant={pathname.startsWith(link.href) ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{link.label}</span>
                   {typeof link.count !== 'undefined' && <Badge variant={pathname.startsWith(link.href) ? "default" : "secondary"}>{link.count}</Badge>}
              </Link>
          </Button>
      </SidebarMenuItem>
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar>
          <SidebarContent className="p-2 flex-1 flex flex-col">
            <SidebarMenu className="flex-1">
              {mainNavLinks.map(renderLink)}
              <Separator className="my-2" />
               <SidebarGroup>
                <SidebarGroupLabel>Services</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {serviceLinks.map(renderLink)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <Separator className="my-2" />
              <SidebarGroup>
                <SidebarGroupLabel>Comptabilité</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {renderLink(vatLink)}
                    {renderLink(chequeLink)}
                    {financeNavLinks.map(renderLink)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <Separator className="my-2" />
               <SidebarGroup>
                <SidebarGroupLabel>Rapports &amp; Finance</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {reportLinks.map(renderLink)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main ref={mainContentRef} className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
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
