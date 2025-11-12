
'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingBag, Truck, UserCheck, List, LayoutDashboard, EyeOff, Eye } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePos } from '@/contexts/pos-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FormInputModal } from '@/app/pos/components/form-input-modal';


const navLinks = [
    { href: '/commercial/invoices', value: 'invoices', label: 'Factures', reportLabel: 'Liste Factures', reportFilter: 'invoice' },
    { href: '/commercial/quotes', value: 'quotes', label: 'Devis', reportLabel: 'Liste Devis', reportFilter: 'quote' },
    { href: '/commercial/delivery-notes', value: 'delivery-notes', label: 'BL', reportLabel: 'Liste BL', reportFilter: 'delivery_note' },
    { href: '/commercial/supplier-orders', value: 'supplier-orders', label: 'Cdes Fournisseur', reportLabel: 'Liste Cdes Fournisseur', reportFilter: 'supplier_order' },
    { href: '/commercial/credit-notes', value: 'credit-notes', label: 'Avoirs', reportLabel: 'Liste Avoirs', reportFilter: 'credit_note' },
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
  const { order, showNavConfirm, currentSaleContext, invoiceBgColor, invoiceBgOpacity, quoteBgColor, quoteBgOpacity, deliveryNoteBgColor, deliveryNoteBgOpacity, supplierOrderBgColor, supplierOrderBgOpacity, creditNoteBgColor, creditNoteBgOpacity, isCommercialNavVisible } = usePos();
  const [isClient, setIsClient] = useState(false);
  const [isCreditNoteConfirmOpen, setCreditNoteConfirmOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const activeTab = navLinks.find(link => pathname.startsWith(link.href))?.value || 'invoices';
  const activeReportInfo = navLinks.find(link => link.value === activeTab);
  const isReadOnly = currentSaleContext?.isReadOnly ?? false;
  const isCreditNotePage = activeTab === 'credit-notes';
  
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
      case 'credit-notes':
        return hexToRgba(creditNoteBgColor, creditNoteBgOpacity);
      default:
        return 'transparent';
    }
  }, [isClient, activeTab, invoiceBgColor, invoiceBgOpacity, quoteBgColor, quoteBgOpacity, deliveryNoteBgColor, deliveryNoteBgOpacity, supplierOrderBgColor, supplierOrderBgOpacity, creditNoteBgColor, creditNoteBgOpacity]);


  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (order.length > 0 && !isReadOnly && !pathname.startsWith(href)) {
      e.preventDefault();
      showNavConfirm(href);
      return;
    }
    if (href.includes('credit-notes')) {
        e.preventDefault();
        setCreditNoteConfirmOpen(true);
        return;
    }
  };

  const handleBackToDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (order.length > 0 && !isReadOnly) {
      showNavConfirm('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleListClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (order.length > 0 && activeReportInfo && !isReadOnly) {
      e.preventDefault();
      showNavConfirm(`/reports?docType=${activeReportInfo.reportFilter}`);
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
    <>
    <div className="h-full flex flex-col" style={{ backgroundColor }}>
        {isCommercialNavVisible && (
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex-1">
                        <Tabs value={activeTab} className="w-full max-w-2xl">
                            <TabsList className="grid w-full grid-cols-5">
                                {navLinks.map(link => (
                                    <TabsTrigger value={link.value} asChild key={link.href} disabled={isCreditNotePage && link.value !== 'credit-notes'}>
                                        <Link href={link.href} onClick={(e) => handleTabClick(e, link.href)} className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="hidden sm:inline-block">{link.label}</span>
                                        </Link>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {activeReportInfo && (
                            <Button asChild variant="outline">
                                <Link href={`/reports?docType=${activeReportInfo.reportFilter}`} onClick={handleListClick}>
                                    <List className="mr-2 h-4 w-4"/>
                                    {activeReportInfo.reportLabel}
                                </Link>
                            </Button>
                        )}
                        <Button onClick={handleBackToDashboard} size="icon" className="btn-back">
                            <LayoutDashboard />
                        </Button>
                    </div>
                </div>
            </header>
        )}
        <main className="flex-1 flex flex-col relative">
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </main>
    </div>
     <AlertDialog open={isCreditNoteConfirmOpen} onOpenChange={setCreditNoteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Créer un nouvel avoir ?</AlertDialogTitle>
            <AlertDialogDescription>
                Cette action va initialiser une nouvelle pièce de type "Avoir". Êtes-vous sûr de vouloir continuer ?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/commercial/credit-notes')}>
                Confirmer
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <FormInputModal />
    </>
  );
}
