

'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingBag, Truck, UserCheck, List, LayoutDashboard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePos } from '@/contexts/pos-context';


const navLinks = [
    { href: '/commercial/invoices', value: 'invoices', label: 'Factures', reportLabel: 'Liste Factures', reportFilter: 'Fact-' },
    { href: '/commercial/quotes', value: 'quotes', label: 'Devis', reportLabel: 'Liste Devis', reportFilter: 'Devis-' },
    { href: '/commercial/delivery-notes', value: 'delivery-notes', label: 'BL', reportLabel: 'Liste BL', reportFilter: 'BL-' },
    { href: '/commercial/supplier-orders', value: 'supplier-orders', label: 'Cdes Fournisseur', reportLabel: 'Liste Cdes Fournisseur', reportFilter: 'CF-' },
]

const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return `hsla(var(--background), ${opacity / 100})`;
};

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { order, showNavConfirm, invoiceBgColor, invoiceBgOpacity, quoteBgColor, quoteBgOpacity, deliveryNoteBgColor, deliveryNoteBgOpacity, supplierOrderBgColor, supplierOrderBgOpacity } = usePos();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const activeTab = navLinks.find(link => pathname.startsWith(link.href))?.value || 'invoices';
  const activeReportInfo = navLinks.find(link => link.value === activeTab);
  
  const backgroundColor = useMemo(() => {
    if (!isClient) return 'transparent';

    switch (activeTab) {
      case 'invoices':
        return hexToRgba(invoiceBgColor, invoiceBgOpacity);
      case 'quotes':
        return hexToRgba(quoteBgColor, quoteBgOpacity);
      case 'delivery-notes':
        return hexToRgba(deliveryNoteBgColor, deliveryNoteBgOpacity);
      case 'supplier-orders':
        return hexToRgba(supplierOrderBgColor, supplierOrderBgOpacity);
      default:
        return 'transparent';
    }
  }, [isClient, activeTab, invoiceBgColor, invoiceBgOpacity, quoteBgColor, quoteBgOpacity, deliveryNoteBgColor, deliveryNoteBgOpacity, supplierOrderBgColor, supplierOrderBgOpacity]);


  const handleTabClick = (e: React.MouseEvent, href: string) => {
    if (order.length > 0 && !pathname.startsWith(href)) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  const handleBackToDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (order.length > 0) {
      showNavConfirm('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  if (!isClient) {
    return (
        <div className="h-full flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Skeleton or minimal header for SSR */}
                </div>
            </header>
            <main className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center">Chargement...</div>
            </main>
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor }}>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Tabs value={activeTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        {navLinks.map(link => (
                            <TabsTrigger value={link.value} asChild key={link.href}>
                                <Link href={link.href} onClick={(e) => handleTabClick(e, link.href)} className="flex items-center gap-2">
                                     <FileText className="h-4 w-4" />
                                    <span className="hidden sm:inline-block">{link.label}</span>
                                </Link>
                            </TabsTrigger>
                        ))}
                         <TabsTrigger value="customer-orders" disabled>
                           <UserCheck className="h-4 w-4 mr-2" />
                           <span className="hidden sm:inline-block">Cdes Client</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="pl-4 flex items-center gap-2">
                    {activeReportInfo && (
                        <Button asChild variant="outline">
                            <Link href={`/reports?filter=${activeReportInfo.reportFilter}`}>
                                <List className="mr-2 h-4 w-4"/>
                                {activeReportInfo.reportLabel}
                            </Link>
                        </Button>
                    )}
                    <Button onClick={handleBackToDashboard} variant="outline" size="icon" className="btn-back">
                        <LayoutDashboard />
                    </Button>
                </div>
            </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </main>
    </div>
  );
}
