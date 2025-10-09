
'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingBag, Truck, UserCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


const navLinks = [
    { href: '/commercial/invoices', value: 'invoices', label: 'Factures', icon: FileText },
    { href: '/commercial/quotes', value: 'quotes', label: 'Devis', icon: FileText },
    { href: '/commercial/delivery-notes', value: 'delivery-notes', label: 'Bons de livraison', icon: Truck },
    { href: '/commercial/supplier-orders', value: 'supplier-orders', label: 'Cdes Fournisseur', icon: ShoppingBag },
]

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = navLinks.find(link => pathname.startsWith(link.href))?.value || 'invoices';

  return (
    <div className="h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Tabs value={activeTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        {navLinks.map(link => (
                            <TabsTrigger value={link.value} asChild key={link.href}>
                                <Link href={link.href} className="flex items-center gap-2">
                                     <link.icon className="h-4 w-4" />
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
