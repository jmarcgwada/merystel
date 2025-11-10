
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
} from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


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
  } = usePos();

  const mainNavLinks = [
    { href: '/management/items', label: 'Articles', icon: Box, count: items?.length || 0 },
    { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, count: categories?.length || 0 },
    { href: '/management/tables', label: 'Tables', icon: Utensils, count: tables?.filter(t => t.id !== 'takeaway').length || 0 },
    { href: '/management/customers', label: 'Clients', icon: Users, count: customers?.length || 0 },
    { href: '/management/suppliers', label: 'Fournisseurs', icon: Truck, count: suppliers?.length || 0 },
  ];

  const accountingNavLinks = [
    { href: '/management/payment-methods', label: 'Moyens de paiement', icon: CreditCard, count: paymentMethods?.length || 0 },
    { href: '/management/vat', label: 'TVA', icon: Percent, count: vatRates?.length || 0 },
    { href: '/management/checks', label: 'Chèques', icon: Landmark, count: cheques?.filter(c => c.statut === 'enPortefeuille').length || 0 },
  ];
  
  const reportLinks = [
    { href: '/reports', label: 'Pièces de vente', icon: BarChart3 },
    { href: '/reports/payments', label: 'Paiements', icon: CreditCard },
    { href: '/management/recurring', label: 'Récurrences', icon: History, count: sales?.filter(s => s.isRecurring).length || 0 },
  ];

  const diversLinks = [
    { href: '/management/remises', label: 'Remises', icon: Library, count: remises?.length || 0 },
  ];

  const renderLink = (link: { href: string; label: string; icon: React.ElementType; count?: number }) => (
      <SidebarMenuItem key={link.href}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(link.href)}>
              <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                   {typeof link.count !== 'undefined' && <Badge variant={pathname.startsWith(link.href) ? "default" : "secondary"} className="ml-auto">{link.count}</Badge>}
              </Link>
          </SidebarMenuButton>
      </SidebarMenuItem>
  );

  return (
    <div className="h-full flex">
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarContent className="p-2">
            <SidebarMenu>
                {mainNavLinks.map(renderLink)}
                <SidebarSeparator/>
                {accountingNavLinks.map(renderLink)}
                <SidebarSeparator/>
                <SidebarGroup>
                  <SidebarGroupLabel>Rapports</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                        {reportLinks.map(renderLink)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator/>
                <SidebarGroup>
                  <SidebarGroupLabel>Divers</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                        {diversLinks.map(renderLink)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link href="/dashboard">
                            <LayoutDashboard />
                            <span>Tableau de bord</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
