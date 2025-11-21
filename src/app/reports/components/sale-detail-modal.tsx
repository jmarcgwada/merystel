
'use client';

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Sale } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Clock, Edit, FileText } from 'lucide-react';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { FullSaleDetailDialog } from './full-sale-detail-dialog';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const PaymentsList = ({ payments }: { payments: Sale['payments'] }) => {
    if (!payments || payments.length === 0) return <p className="text-sm text-muted-foreground">Aucun paiement.</p>;
    
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
  const { customers, users, vatRates } = usePos();
  const router = useRouter();
  const [isFullDetailOpen, setIsFullDetailOpen] = useState(false);
  
  const customer = useMemo(() => sale?.customerId ? customers.find(c => c.id === sale.customerId) : null, [sale, customers]);
  const seller = useMemo(() => sale?.userId ? users.find(u => u.id === sale.userId) : null, [sale, users]);

  const { subtotal, tax, balanceDue } = useMemo(() => {
    if (!sale || !vatRates) return { subtotal: 0, tax: 0, balanceDue: 0 };
    
    const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = sale.total - totalPaid;

    if (sale.subtotal !== undefined && sale.tax !== undefined) {
        return { subtotal: sale.subtotal, tax: sale.tax, balanceDue: balance };
    }
    
    let calcSubtotal = 0;
    sale.items.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        const rate = vatInfo ? vatInfo.rate : 0;
        const priceHT = item.total / (1 + rate / 100);
        calcSubtotal += priceHT;
    });

    const calcTax = sale.total - calcSubtotal;
    return { subtotal: calcSubtotal, tax: calcTax, balanceDue: balance };
  }, [sale, vatRates]);


  if (!sale) return null;

  const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);

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

  const handleOpenFullDetail = () => {
    onClose(); // Close the current modal first
    setIsFullDetailOpen(true); // Then open the new one
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Détail rapide de la pièce #{sale.ticketNumber}</DialogTitle>
          <DialogDescription>
             <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /><ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" /></span>
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><ClientFormattedDate date={sale.date} formatString="HH:mm" /></span>
                {seller && <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{seller.firstName} {seller.lastName}</span>}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 gap-6">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold">{customer?.name || 'Client au comptoir'}</p>
                        <p className="text-sm text-muted-foreground">{customer?.email}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Résumé de la Vente</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Articles</span><span className="font-medium">{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</span></div>
                        <div className="flex justify-between"><span>Total HT</span><span className="font-medium">{subtotal.toFixed(2)}€</span></div>
                        <div className="flex justify-between"><span>Total TVA</span><span className="font-medium">{tax.toFixed(2)}€</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold text-base"><span>Total TTC</span><span>{sale.total.toFixed(2)}€</span></div>
                        {balanceDue > 0.01 && <div className="flex justify-between font-bold text-destructive"><span>Solde Dû</span><span>{balanceDue.toFixed(2)}€</span></div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Paiements</CardTitle></CardHeader>
                    <CardContent>
                        <PaymentsList payments={sale.payments || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleOpenFullDetail}>
              <FileText className="mr-2 h-4 w-4" /> Fiche détaillée
            </Button>
            <Button onClick={handleNavigate}>
                <Edit className="mr-2 h-4 w-4" /> Modifier / Consulter
            </Button>
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
