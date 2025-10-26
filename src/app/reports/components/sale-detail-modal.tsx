
'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Sale } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Clock } from 'lucide-react';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
                    <Badge variant="outline">{p.method.name}</Badge>
                    <span className="font-medium">{p.amount.toFixed(2)}€</span>
                </div>
            ))}
        </div>
    );
};

export function SaleDetailModal({ isOpen, onClose, sale }: SaleDetailModalProps) {
  const { customers, users, loadSaleForEditing } = usePos();
  
  const customer = useMemo(() => sale?.customerId ? customers.find(c => c.id === sale.customerId) : null, [sale, customers]);
  const seller = useMemo(() => sale?.userId ? users.find(u => u.id === sale.userId) : null, [sale, users]);

  if (!sale) return null;

  const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = sale.total - totalPaid;
  const isInvoice = sale.documentType === 'invoice';

  const handleEdit = () => {
    if (sale.documentType === 'invoice') {
        onClose();
        loadSaleForEditing(sale.id, 'invoice');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold">{customer?.name || 'Client au comptoir'}</p>
                        <p className="text-sm text-muted-foreground">{customer?.email}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Articles ({sale.items.length})</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Désignation</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <span className="text-muted-foreground">{item.quantity}x</span> {item.name}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{item.total.toFixed(2)}€</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <div className="space-y-4">
                 <Card>
                    <CardHeader><CardTitle className="text-base">Récapitulatif</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total à payer</span><span className="font-semibold">{sale.total.toFixed(2)}€</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total payé</span><span className="font-semibold">{totalPaid.toFixed(2)}€</span></div>
                        <Separator />
                        <div className={`flex justify-between font-bold ${balanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}><span>Reste à payer</span><span>{balanceDue.toFixed(2)}€</span></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Paiements enregistrés</CardTitle></CardHeader>
                    <CardContent>
                        <PaymentsList payments={sale.payments || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" asChild>
                <Link href={`/reports/${sale.id}?from=payments`}>Voir la fiche détaillée</Link>
            </Button>
            {isInvoice && balanceDue > 0 && (
                <Button onClick={handleEdit}>
                    Ajouter un paiement
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
