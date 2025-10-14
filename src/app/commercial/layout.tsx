
'use client';

import React, { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingBag, Truck, UserCheck, BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePos } from '@/contexts/pos-context';
import { NavigationBlocker } from '@/components/layout/navigation-blocker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const navLinks = [
    { href: '/commercial/invoices', value: 'invoices', label: 'Factures', icon: FileText, reportLabel: 'Rapport Factures', reportFilter: 'Fact-' },
    { href: '/commercial/quotes', value: 'quotes', label: 'Devis', icon: FileText, reportLabel: 'Rapport Devis', reportFilter: 'Devis-' },
    { href: '/commercial/delivery-notes', value: 'delivery-notes', label: 'BL', icon: Truck, reportLabel: 'Rapport BL', reportFilter: 'BL-' },
    { href: '/commercial/supplier-orders', value: 'supplier-orders', label: 'Cdes Fournisseur', icon: ShoppingBag, reportLabel: 'Rapport Cdes Fournisseur', reportFilter: 'CF-' },
]

function TransformToInvoiceDialog() {
  const { isTransformToInvoiceConfirmOpen, closeTransformToInvoiceConfirm, confirmTransformToInvoice } = usePos();
  return (
    <AlertDialog open={isTransformToInvoiceConfirmOpen} onOpenChange={closeTransformToInvoiceConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transformer en Facture ?</AlertDialogTitle>
          <AlertDialogDescription>
            La pièce actuelle sera utilisée pour créer une nouvelle facture. Vous pourrez ensuite l'encaisser. Voulez-vous continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={confirmTransformToInvoice}>
            Transformer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { order, showNavConfirm, currentSaleId, showTransformToInvoiceConfirm } = usePos();
  
  const activeTab = navLinks.find(link => pathname.startsWith(link.href))?.value || 'invoices';
  const activeReportInfo = navLinks.find(link => link.value === activeTab);
  

  const handleTabClick = (e: React.MouseEvent, href: string) => {
    // If editing a quote or delivery note and clicking on invoices tab
    if (currentSaleId && (pathname.startsWith('/commercial/quotes') || pathname.startsWith('/commercial/delivery-notes')) && href.startsWith('/commercial/invoices')) {
      e.preventDefault();
      showTransformToInvoiceConfirm();
      return;
    }

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

  return (
    <div className="h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Tabs value={activeTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        {navLinks.map(link => (
                            <TabsTrigger value={link.value} asChild key={link.href}>
                                <Link href={link.href} onClick={(e) => handleTabClick(e, link.href)} className="flex items-center gap-2">
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
                <div className="pl-4 flex items-center gap-2">
                    {activeReportInfo && (
                        <Button asChild variant="outline">
                            <Link href={\`/reports?filter=\${activeReportInfo.reportFilter}\`}>
                                <BarChart3 />
                                {activeReportInfo.reportLabel}
                            </Link>
                        </Button>
                    )}
                    <Button onClick={handleBackToDashboard} variant="outline" className="btn-back">
                        <ArrowLeft />
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </main>
        <TransformToInvoiceDialog />
    </div>
  );
}
