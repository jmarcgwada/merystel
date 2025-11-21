
'use client';

import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Utensils, User, Pencil, Edit, FileText, Copy, Printer, Send, Repeat, Save, Notebook } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import type { Sale, Payment, Item, OrderItem, VatBreakdown, Customer, Cheque } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from './invoice-print-template';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EmailSenderDialog } from './email-sender-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';

const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined, formatString: string}) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (date) {
            let jsDate: Date;
            if (date instanceof Date) jsDate = date;
            else if (date && typeof (date as Timestamp)?.toDate === 'function') jsDate = (date as Timestamp).toDate();
            else if (date && typeof (date as any).seconds === 'number') {
                jsDate = new Date((date as any).seconds * 1000);
            } else {
                jsDate = new Date(date as any);
            }
            
            if (!isNaN(jsDate.getTime())) {
                setFormattedDate(format(jsDate, formatString, { locale: fr }));
            }
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}

const PaymentsList = ({ payments, title, saleId }: { payments: Payment[], title: string, saleId: string }) => {
    const { cheques } = usePos();
    const saleCheques = useMemo(() => cheques.filter(c => c.factureId === saleId), [cheques, saleId]);

    return (
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
            {payments && payments.length > 0 ? (
                <div className="space-y-2">
                    {payments.map((p, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{p.method.name}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    (<ClientFormattedDate date={p.date} formatString="dd/MM/yy HH:mm" />)
                                  </span>
                                  {p.chequesCount && p.chequesCount > 1 && (
                                      <Badge variant="outline">{p.chequesCount} chèques</Badge>
                                  )}
                              </div>
                              <span className="font-medium">{p.amount.toFixed(2)}€</span>
                          </div>
                          {p.method.name === 'Chèque' && saleCheques.length > 0 && (
                            <div className="pl-4 mt-1 space-y-1">
                              {saleCheques.map(cheque => (
                                <div key={cheque.id} className="flex justify-between text-xs text-muted-foreground">
                                  <span>Chèque n°{cheque.numeroCheque}</span>
                                  <span>{cheque.montant.toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                    ))}
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}€</span>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Aucun paiement.</p>
            )}
        </div>
    );
};

interface FullSaleDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
}

export function FullSaleDetailDialog({ isOpen, onClose, saleId }: FullSaleDetailDialogProps) {
  const { toast } = useToast();
  
  const { customers, vatRates, sales: allSales, items: allItems, isLoading: isPosLoading, users: allUsers, companyInfo } = usePos();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  
  useEffect(() => {
    if (allSales && saleId) {
      const foundSale = allSales.find(s => s.id === saleId);
      setSale(foundSale || null);
    }
  }, [allSales, saleId, isOpen]);

  const customer = sale?.customerId ? customers?.find(c => c.id === sale?.customerId) : null;
  const seller = sale?.userId ? allUsers?.find(u => u.id === sale.userId) : null;
  const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : sale?.userName;
  
  const getItemInfo = useCallback((orderItem: OrderItem): Partial<Item> => {
      if (!allItems) return {};
      return allItems.find(i => i.id === orderItem.itemId) || {};
  }, [allItems]);

  const { subtotal, tax, balanceDue } = useMemo(() => {
    if (!sale || !vatRates) return { subtotal: 0, tax: 0, balanceDue: 0 };
    
    const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = sale.total - totalPaid;

    let calcSubtotal = 0;
    sale.items.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        const rate = vatInfo ? vatInfo.rate / 100 : 0;
        const priceHT = item.total / (1 + rate);
        calcSubtotal += priceHT;
    });

    const calcTax = sale.total - calcSubtotal;
    
    const finalSubtotal = sale.subtotal ?? calcSubtotal;

    return { 
        subtotal: finalSubtotal,
        tax: sale.tax ?? calcTax,
        balanceDue: balance 
    };
  }, [sale, vatRates]);
  
  const pieceType = sale?.documentType === 'invoice' ? 'Facture'
                  : sale?.documentType === 'quote' ? 'Devis'
                  : sale?.documentType === 'delivery_note' ? 'Bon de Livraison'
                  : sale?.documentType === 'credit_note' ? 'Avoir'
                  : 'Ticket';

  const handlePrint = async () => {
    if (!sale) return;
    if (!printRef.current) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de préparer l'impression." });
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printRef.current, {
      callback: function (pdf) {
        pdf.save(`${sale.ticketNumber}.pdf`);
      },
      x: 0, y: 0, width: 210, windowWidth: printRef.current.scrollWidth, autoPaging: 'text',
    });
  };

  if (!isOpen) return null;

  if (isPosLoading || (saleId && !sale)) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                  <Skeleton className="h-96 w-full" />
              </div>
              <div className="lg:col-span-1 space-y-8">
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sale) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader><DialogTitle>Erreur</DialogTitle></DialogHeader>
          <p>Pièce introuvable.</p>
          <DialogFooter><Button onClick={onClose}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <div className="absolute -left-[9999px] -top-[9999px]">
         {sale && vatRates && <InvoicePrintTemplate ref={printRef} sale={sale} customer={customer || null} companyInfo={companyInfo} vatRates={vatRates} />}
      </div>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Détail {pieceType} #{sale.ticketNumber}</DialogTitle>
            <DialogDescription>
              <span className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm mt-1">
                <span>Créé le : <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy 'à' HH:mm" /></span>
                {sale.modifiedAt && (
                  <span className="flex items-center gap-1"><Edit className="h-3 w-3"/> Modifié le : <ClientFormattedDate date={sale.modifiedAt} formatString="d MMMM yyyy 'à' HH:mm" /></span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-[64px]">Image</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Code TVA</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Total (TTC)</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {sale.items.map(item => {
                        const fullItem = getItemInfo(item);
                        const vatInfo = vatRates.find(v => v.id === item.vatId);
                        return (
                            <TableRow key={item.id}>
                                <TableCell><Image src={fullItem.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" /></TableCell>
                                <TableCell className="font-medium">
                                    <div>{item.name}</div>
                                    {item.note && <div className="text-xs text-amber-600 mt-1 flex items-start gap-1.5"><Pencil className="h-3 w-3 mt-0.5 shrink-0"/><span>{item.note}</span></div>}
                                </TableCell>
                                <TableCell><Badge variant="outline">{vatInfo?.code}</Badge></TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right font-bold">{item.total.toFixed(2)}€</TableCell>
                            </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {sale.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Notebook />Notes de la facture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{sale.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="lg:col-span-1 space-y-8">
                <Card>
                  <CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span>{subtotal.toFixed(2)}€</span></div>
                    <div className="flex justify-between text-muted-foreground font-semibold"><span>Total TVA</span><span>{tax.toFixed(2)}€</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total (TTC)</span><span>{sale.total.toFixed(2)}€</span></div>
                    {balanceDue > 0.01 && <div className="flex justify-between font-bold text-lg text-destructive pt-2 border-t border-destructive/20"><span>Solde Dû</span><span>{balanceDue.toFixed(2)}€</span></div>}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4">
                     <PaymentsList payments={sale.payments || []} title="Paiements" saleId={sale.id} />
                  </CardFooter>
                </Card>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end border-t pt-4">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button variant="secondary" onClick={() => setEmailDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Envoyer par E-mail
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EmailSenderDialog isOpen={isEmailDialogOpen} onClose={() => setEmailDialogOpen(false)} sale={sale} onSend={() => {}} />
    </>
  );
}
