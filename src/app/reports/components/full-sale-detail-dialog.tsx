
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
import type { Sale, Payment, Item, OrderItem, VatBreakdown, Customer } from '@/lib/types';
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
            if (date instanceof Date) {
                jsDate = date;
            } else if (date && typeof (date as Timestamp).toDate === 'function') {
                jsDate = (date as Timestamp).toDate();
            } else if (date && typeof (date as any).seconds === 'number') {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const { customers, vatRates, sales: allSales, items: allItems, isLoading: isPosLoading, users: allUsers, companyInfo, updateSale } = usePos();
  const { user } = useUser();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);

  const [sale, setSale] = useState<Sale | null>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(undefined);
  const [isRecurrenceModified, setIsRecurrenceModified] = useState(false);

  useEffect(() => {
    if (allSales && saleId) {
      const foundSale = allSales.find(s => s.id === saleId);
      setSale(foundSale || null);
      if (foundSale?.isRecurring) {
        setIsRecurring(true);
        setRecurrenceFrequency(foundSale.recurrence?.frequency || 'monthly');
        setNextDueDate(foundSale.recurrence?.nextDueDate ? new Date(foundSale.recurrence.nextDueDate as any) : undefined);
      } else {
        setIsRecurring(false);
        setRecurrenceFrequency('monthly');
        setNextDueDate(undefined);
      }
      setIsRecurrenceModified(false);
    }
  }, [allSales, saleId, isOpen]);

  const handleSaveRecurrence = async () => {
    if (!sale) return;

    let newNextDueDate = nextDueDate;
    if (isRecurring && !newNextDueDate) {
        const now = new Date();
        newNextDueDate = addMonths(now, 1); // Default to one month from now
        setNextDueDate(newNextDueDate);
    }

    const updatedSale: Sale = {
      ...sale,
      isRecurring,
      recurrence: isRecurring ? {
        frequency: recurrenceFrequency as any,
        nextDueDate: newNextDueDate,
        isActive: true,
      } : undefined,
    };
    await updateSale(updatedSale);
    setIsRecurrenceModified(false);
    toast({ title: 'Configuration de la récurrence sauvegardée.' });
  };
  
  const getCustomerName = useCallback((customerId?: string) => {
      if (!customerId || !customers) return 'Client au comptoir';
      return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
  }, [customers]);

   const getUserName = useCallback((userId?: string, fallbackName?: string) => {
    if (!userId) return fallbackName || 'N/A';
    if (!allUsers) return fallbackName || 'Chargement...';
    const saleUser = allUsers.find(u => u.id === userId);
    if (saleUser?.firstName && saleUser?.lastName) {
        return `${saleUser.firstName} ${saleUser.lastName.charAt(0)}.`;
    }
    return fallbackName || saleUser?.email || 'Utilisateur supprimé';
  }, [allUsers]);

  const isLoading = isPosLoading || (saleId && !sale);

  const customer = sale?.customerId ? customers?.find(c => c.id === sale?.customerId) : null;
  const seller = sale?.userId ? allUsers?.find(u => u.id === sale.userId) : null;
  const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : sale?.userName;
  
  const getItemInfo = useCallback((orderItem: OrderItem): Partial<Item> => {
      if (!allItems) return {};
      return allItems.find(i => i.id === orderItem.itemId) || {};
  }, [allItems]);

  const { subtotal, tax, vatBreakdown, balanceDue } = useMemo(() => {
    if (!sale || !vatRates) return { subtotal: 0, tax: 0, vatBreakdown: {}, balanceDue: 0 };
    
    const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = sale.total - totalPaid;

    if (sale.vatBreakdown && sale.subtotal !== undefined && sale.tax !== undefined) {
        return { subtotal: sale.subtotal, tax: sale.tax, vatBreakdown: sale.vatBreakdown, balanceDue: balance };
    }
    
    let calcSubtotal = 0;
    const breakdown: VatBreakdown = {};

    sale.items.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        const rate = vatInfo ? vatInfo.rate : 0;
        const priceHT = item.total / (1 + rate / 100);
        const taxAmount = item.total - priceHT;

        calcSubtotal += priceHT;

        const rateKey = rate.toString();
        if (breakdown[rateKey]) {
            breakdown[rateKey].base += priceHT;
            breakdown[rateKey].total += taxAmount;
        } else {
            breakdown[rateKey] = {
                rate: rate,
                total: taxAmount,
                base: priceHT,
                code: vatInfo?.code || 0,
            };
        }
    });

    const calcTax = Object.values(breakdown).reduce((acc, curr) => acc + curr.total, 0);

    return { subtotal: calcSubtotal, tax: calcTax, vatBreakdown: breakdown, balanceDue: balance };
  }, [sale, vatRates]);
  
  const pieceType = sale?.documentType === 'invoice' ? 'Facture'
                  : sale?.documentType === 'quote' ? 'Devis'
                  : sale?.documentType === 'delivery_note' ? 'Bon de Livraison'
                  : sale?.documentType === 'credit_note' ? 'Avoir'
                  : 'Ticket';

  if (!isOpen) return null;

  if (isLoading) {
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
                  <Skeleton className="h-32 w-full" />
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
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
          </DialogHeader>
          <p>Pièce introuvable.</p>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
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
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">P.U. (TTC)</TableHead>
                      <TableHead className="text-right">Remise</TableHead>
                      <TableHead className="text-right">Total (TTC)</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {sale.items.map(item => {
                        const fullItem = getItemInfo(item);
                        return (
                            <TableRow key={item.id}>
                                <TableCell><Image src={fullItem.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" /></TableCell>
                                <TableCell className="font-medium">
                                    <div>{item.name}</div>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{item.description}</p>
                                    {item.note && <div className="text-xs text-amber-600 mt-1 flex items-start gap-1.5"><Pencil className="h-3 w-3 mt-0.5 shrink-0"/><span>{item.note}</span></div>}
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                                <TableCell className="text-right text-destructive">{item.discount > 0 ? `-${item.discount.toFixed(2)}€` : '-'}</TableCell>
                                <TableCell className="text-right font-bold">{item.total.toFixed(2)}€</TableCell>
                            </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-8">
                <Card>
                  <CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span>{subtotal.toFixed(2)}€</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Total TVA</span><span>{tax.toFixed(2)}€</span></div>
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
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EmailSenderDialog isOpen={isEmailDialogOpen} onClose={() => setEmailDialogOpen(false)} sale={sale} onSend={() => {}} />
    </>
  );
}
