'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Sale, Payment, VatBreakdown } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Clock, Edit, FileText, CreditCard, Scale } from 'lucide-react';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { FullSaleDetailDialog } from './full-sale-detail-dialog';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const PaymentsList = ({ payments }: { payments: Sale['payments'] }) => {
    if (!payments || payments.length === 0) return <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>;
    
    return (
        <div className="space-y-2">
            {payments.map((p, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{p.method.name}</Badge>
                         <span className="text-xs text-muted-foreground">
                           (<ClientFormattedDate date={p.date} formatString="dd/MM/yy HH:mm" />)
                         </span>
                    </div>
                    <span className="font-medium">{p.amount.toFixed(2)}€</span>
                </div>
            ))}
        </div>
    );
};


export function SaleDetailModal({ isOpen, onClose, sale }: SaleDetailModalProps) {
  const { customers, users, vatRates, items: allItems } = usePos();
  const router = useRouter();
  const [isFullDetailOpen, setIsFullDetailOpen] = useState(false);
  
  const customer = useMemo(() => sale?.customerId ? customers.find(c => c.id === sale.customerId) : null, [sale, customers]);
  const seller = useMemo(() => sale?.userId ? users.find(u => u.id === sale.userId) : null, [sale, users]);

  const { balanceDue, totalPaid, subtotal, tax, margin } = useMemo(() => {
    if (!sale) return { balanceDue: 0, totalPaid: 0, subtotal: 0, tax: 0, margin: 0 };
    
    const paid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = sale.total - paid;

    let calcSubtotal = 0;
    let calcTax = 0;
    let totalCost = 0;

    sale.items.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        const rate = vatInfo ? vatInfo.rate / 100 : 0;
        const priceHT = item.total / (1 + rate);
        const taxAmount = item.total - priceHT;

        calcSubtotal += priceHT;
        calcTax += taxAmount;
        
        const catalogItem = allItems.find(i => i.id === item.itemId);
        totalCost += (catalogItem?.purchasePrice || 0) * item.quantity;
    });

    const finalSubtotal = sale.subtotal ?? calcSubtotal;
    const calcMargin = finalSubtotal - totalCost;

    return { 
        balanceDue: balance, 
        totalPaid: paid, 
        subtotal: finalSubtotal,
        tax: sale.tax ?? calcTax,
        margin: calcMargin,
    };
  }, [sale, vatRates, allItems]);
  
  const [isMarginVisible, setIsMarginVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedCols = localStorage.getItem('reportsVisibleColumns');
        if (storedCols) {
            setIsMarginVisible(JSON.parse(storedCols).margin === true);
        }
    }
  }, [isOpen]);


  if (!sale) return null;

  const handleNavigate = () => {
    onClose();
    let path = '/commercial/invoices'; // Default path
    const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');

    switch(docType) {
        case 'quote': path = '/commercial/quotes'; break;
        case 'delivery_note': path = '/commercial/delivery-notes'; break;
        case 'supplier_order': path = '/commercial/supplier-orders'; break;
        case 'credit_note': path = '/commercial/credit-notes'; break;
        case 'ticket': 
            path = '/pos'; 
            break;
    }
    
    router.push(`${path}?edit=${sale.id}`);
  };
  
   const handlePayment = () => {
    onClose();
    router.push(`/commercial/invoices?edit=${sale.id}`);
  };

  const handleOpenFullDetail = () => {
    onClose();
    setTimeout(() => {
        setIsFullDetailOpen(true);
    }, 150)
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Détail de la Pièce #{sale.ticketNumber}</DialogTitle>
          <DialogDescription>
             <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /><ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" /></span>
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><ClientFormattedDate date={sale.date} formatString="HH:mm" /></span>
                {seller && <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{seller.firstName} {seller.lastName}</span>}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold">{customer?.name || 'Client au comptoir'}</p>
                        <p className="text-sm text-muted-foreground">{customer?.email}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Résumé Articles</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nombre d'articles</span>
                            <span className="font-semibold">{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total HT</span>
                            <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Total TVA</span>
                            <span>{tax.toFixed(2)}€</span>
                        </div>
                        {isMarginVisible && (
                            <>
                            <Separator/>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Scale className="h-4 w-4"/>Marge Brute</span>
                                <span className="font-semibold">{margin.toFixed(2)}€</span>
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader><CardTitle className="text-base">Récapitulatif Financier</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Total TTC</span><span className="font-semibold">{sale.total.toFixed(2)}€</span></div>
                        <div className="flex justify-between"><span>Total Payé</span><span className="font-semibold">{totalPaid.toFixed(2)}€</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold text-base"><span>Solde</span><span className={balanceDue > 0.01 ? 'text-destructive' : 'text-green-600'}>{balanceDue.toFixed(2)}€</span></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Paiements Enregistrés</CardTitle></CardHeader>
                    <CardContent>
                        <PaymentsList payments={sale.payments || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleOpenFullDetail}>
              <FileText className="mr-2 h-4 w-4" /> Voir la fiche détaillée
            </Button>
            <div className="flex gap-2">
                {balanceDue > 0.01 && (
                    <Button variant="default" onClick={handlePayment}>
                        <CreditCard className="mr-2 h-4 w-4" /> Encaisser le solde
                    </Button>
                )}
                 <Button variant="secondary" onClick={handleNavigate}>
                    <Edit className="mr-2 h-4 w-4" /> Modifier / Consulter
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
     {isFullDetailOpen && (
        <FullSaleDetailDialog
            isOpen={isFullDetailOpen}
            onClose={() => setIsFullDetailOpen(false)}
            saleId={sale.id}
        />
     )}
    </>
  );
}
