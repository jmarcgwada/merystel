'use client';

import { useMemo, useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Utensils, User, Pencil, Edit, FileText, Copy, LayoutDashboard, Printer, Send, Repeat, Save, Notebook, Wrench } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import type { Sale, Payment, Item, OrderItem, VatBreakdown, Customer, Cheque, SupportTicket } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from '../components/invoice-print-template';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EmailSenderDialog } from '../components/email-sender-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FullSaleDetailDialog } from '../components/full-sale-detail-dialog';

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

type SortKey = 'date' | 'total' | 'tableName' | 'customerName' | 'itemCount' | 'userName' | 'ticketNumber';

const getDateFromSale = (sale: Sale): Date => {
    if (!sale.date) return new Date(0);
    if (sale.date instanceof Date) return sale.date;
    if (typeof (sale.date as Timestamp)?.toDate === 'function') {
        return (sale.date as Timestamp).toDate();
    }
    const d = new Date(sale.date as any);
    return isNaN(d.getTime()) ? new Date(0) : d;
};


function SaleDetailContent() {
  const { saleId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const from = searchParams.get('from');
  
  const sortKey = searchParams.get('sortKey') as SortKey | null;
  const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
  const generalFilter = searchParams.get('q');
  const statusFilter = searchParams.get('status');
  const dateFromFilter = searchParams.get('dateFrom');
  const dateToFilter = searchParams.get('dateTo');
  const customerFilter = searchParams.get('customer');
  const sellerFilter = searchParams.get('seller');
  const originFilter = searchParams.get('origin');
  const articleFilter = searchParams.get('article');


  const { customers, vatRates, sales: allSales, items: allItems, isLoading: isPosLoading, users: allUsers, companyInfo, updateSale, supportTickets } = usePos();
  const { user } = useUser();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);

  const [sale, setSale] = useState<Sale | null>(null);
  const [linkedSupportTicket, setLinkedSupportTicket] = useState<SupportTicket | null>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(undefined);
  const [isRecurrenceModified, setIsRecurrenceModified] = useState(false);

  useEffect(() => {
    if (allSales && saleId) {
      const foundSale = allSales.find(s => s.id === saleId);
      setSale(foundSale || null);

      if (foundSale) {
        const foundTicket = supportTickets.find(ticket => ticket.saleId === foundSale.id);
        setLinkedSupportTicket(foundTicket || null);
      } else {
        setLinkedSupportTicket(null);
      }

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
  }, [allSales, saleId, supportTickets]);

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

  const { previousSaleId, nextSaleId } = useMemo(() => {
    if (!allSales || allSales.length === 0 || !saleId) {
      return { previousSaleId: null, nextSaleId: null };
    }

    let filteredSales = allSales.filter(s => {
        if (from === 'pos' && !s.ticketNumber?.startsWith('Tick-')) {
            return false;
        }

        const customerNameMatch = !customerFilter || getCustomerName(s.customerId).toLowerCase().includes(customerFilter.toLowerCase());
        const sellerNameMatch = !sellerFilter || getUserName(s.userId, s.userName).toLowerCase().includes(sellerFilter.toLowerCase());
        const originMatch = !originFilter || (s.tableName && s.tableName.toLowerCase().includes(originFilter.toLowerCase()));
        const articleMatch = !articleFilter || s.items.some(item => (allItems.find(i => i.id === item.itemId)?.name || '').toLowerCase().includes(articleFilter.toLowerCase()));
        
        let dateMatch = true;
        const saleDate = getDateFromSale(s);
        if (dateFromFilter) dateMatch = saleDate >= startOfDay(new Date(dateFromFilter));
        if (dateToFilter) dateMatch = dateMatch && saleDate <= endOfDay(new Date(dateToFilter));

        let statusMatch = true;
        if (statusFilter && statusFilter !== 'all') {
            const totalPaid = (s.payments || []).reduce((acc, p) => acc + p.amount, 0);
            if (statusFilter === 'paid') statusMatch = s.status === 'paid';
            else if (statusFilter === 'pending') statusMatch = s.status === 'pending' && totalPaid === 0;
            else if (statusFilter === 'partial') statusMatch = s.status === 'pending' && totalPaid > 0 && totalPaid < s.total;
            else statusMatch = s.status === statusFilter;
        }

        const generalMatch = !generalFilter || (
            (s.ticketNumber && s.ticketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
            (s.items.some(item => (item.name.toLowerCase().includes(generalFilter.toLowerCase()))))
        );
        

        return customerNameMatch && sellerNameMatch && originMatch && articleMatch && dateMatch && statusMatch && generalMatch;
    });

    const sortedSales = [...filteredSales].sort((a, b) => {
      const sortConfig = { key: sortKey || 'date', direction: sortDirection || 'desc' };
      
      let aValue: string | number | Date, bValue: string | number | Date;
                
        switch (sortConfig.key) {
            case 'date':
                aValue = getDateFromSale(a);
                bValue = getDateFromSale(b);
                break;
            case 'tableName':
                aValue = a.tableName || '';
                bValue = b.tableName || '';
                break;
            case 'customerName':
                aValue = getCustomerName(a.customerId);
                bValue = getCustomerName(b.customerId);
                break;
            case 'itemCount':
                aValue = Array.isArray(a.items) ? a.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                bValue = Array.isArray(b.items) ? b.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                break;
            case 'userName':
                aValue = getUserName(a.userId, a.userName);
                bValue = getUserName(b.userId, b.userName);
                break;
            case 'ticketNumber':
                aValue = a.ticketNumber || '';
                bValue = b.ticketNumber || '';
                break;
            default:
                aValue = a[sortConfig.key as keyof Sale] as number || 0;
                bValue = b[sortConfig.key as keyof Sale] as number || 0;
                break;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
            return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentIndex = sortedSales.findIndex(s => s.id === saleId);
    
    if (currentIndex === -1) {
        return { previousSaleId: null, nextSaleId: null };
    }
    
    const nextSale = currentIndex > 0 ? sortedSales[currentIndex - 1] : null;
    const previousSale = currentIndex < sortedSales.length - 1 ? sortedSales[currentIndex + 1] : null;

    return { 
        previousSaleId: previousSale ? previousSale.id : null,
        nextSaleId: nextSale ? nextSale.id : null
    };
  }, [allSales, saleId, sortKey, sortDirection, getCustomerName, getUserName, allItems, customerFilter, sellerFilter, originFilter, articleFilter, dateFromFilter, dateToFilter, statusFilter, generalFilter, from]);
  
  const navigationParams = useMemo(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    return params.toString();
  }, [searchParams]);

  const handleBack = () => {
    let backUrl = '/reports';
    if (from === 'analytics') {
      backUrl = '/reports/analytics';
    } else if (from === 'audit-log') {
      backUrl = '/settings/audit-log';
    } else if (from === 'payments') {
      backUrl = '/reports/payments';
    } else if (from === 'recurring') {
      backUrl = '/management/recurring';
    } else if (from === 'unpaid') {
      backUrl = '/reports/unpaid';
    }
    router.push(`${backUrl}?${navigationParams}`);
  };

  const getDetailLink = (id: string | null) => {
    if (!id) return '#';
    const params = new URLSearchParams(navigationParams);
    return `/reports/${id}?${params.toString()}`;
  };

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

  if (isLoading) {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Détails de la pièce"
                subtitle="Chargement des données..."
            >
                <Skeleton className="h-10 w-40" />
            </PageHeader>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
      )
  }

  if (!sale) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center">
        <Alert variant="destructive">
            <AlertTitle>Pièce introuvable</AlertTitle>
            <AlertDescription>La pièce que vous cherchez n'existe pas ou a été supprimée.</AlertDescription>
        </Alert>
        <Button asChild variant="link" className="mt-4">
            <Link href="/reports">Retour aux rapports</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute -left-[9999px] -top-[9999px]">
         {sale && vatRates && <InvoicePrintTemplate ref={printRef} sale={sale} customer={customer || null} companyInfo={companyInfo} vatRates={vatRates} />}
      </div>
      <PageHeader
        title={`Détail ${pieceType} #${sale.ticketNumber}`}
        subtitle={
          <span className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm mt-1">
            <span>
              Créé le : <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy 'à' HH:mm" />
            </span>
            {sale.modifiedAt && (
              <span className="flex items-center gap-1">
                <Edit className="h-3 w-3"/> Modifié le : <ClientFormattedDate date={sale.modifiedAt} formatString="d MMMM yyyy 'à' HH:mm" />
              </span>
            )}
          </span>
        }
      >
        <div className="flex items-center gap-2">
            {linkedSupportTicket && (
                <Button asChild>
                    <Link href={`/management/support-tickets/${linkedSupportTicket.id}`}>
                        <Wrench className="mr-2 h-4 w-4" />
                        Voir la prise en charge
                    </Link>
                </Button>
            )}
            <Button onClick={() => setEmailDialogOpen(true)} variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Envoyer par E-mail
            </Button>
            <Button onClick={handleBack} variant="outline" className="btn-back">
                <ArrowLeft />
                Retour
            </Button>
            {user?.role !== 'cashier' && (
              <>
                <div className="flex items-center">
                    <Button asChild variant="outline" size="icon" disabled={!nextSaleId}>
                        <Link href={getDetailLink(nextSaleId)} scroll={false}>
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" disabled={!previousSaleId}>
                        <Link href={getDetailLink(previousSaleId)} scroll={false}>
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
              </>
            )}
        </div>
      </PageHeader>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Articles vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[64px]">Image</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Prix Unitaire (TTC)</TableHead>
                    <TableHead className="text-right">Remise</TableHead>
                    <TableHead className="text-right">Total Ligne (TTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map(item => {
                    const fullItem = getItemInfo(item);
                    
                    return (
                        <TableRow key={item.id}>
                            <TableCell>
                                <Image src={fullItem.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div>{item.name}</div>
                                {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{item.description}</p>}
                                {item.selectedVariants && item.selectedVariants.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1 capitalize">
                                        {item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                    </div>
                                )}
                                {item.note && (
                                    <div className="text-xs text-amber-600 mt-1 flex items-start gap-1.5">
                                        <Pencil className="h-3 w-3 mt-0.5 shrink-0"/>
                                        <span>{item.note}</span>
                                    </div>
                                )}
                                {item.serialNumbers && item.serialNumbers.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-semibold">N/S:</span> {item.serialNumbers.filter(sn => sn).join(', ')}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                             <TableCell className="text-right text-destructive">
                                {item.discount > 0 ? `-${item.discount.toFixed(2)}€` : '-'}
                            </TableCell>
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
           {sale.documentType === 'invoice' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Repeat />Gestion de la Récurrence</CardTitle>
                <CardDescription>
                  Configurez cette facture pour qu'elle soit générée automatiquement à intervalle régulier.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-recurring" className="text-base">Activer la récurrence pour cette facture</Label>
                  </div>
                  <Switch
                    id="is-recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => { setIsRecurring(checked); setIsRecurrenceModified(true); }}
                  />
                </div>
                {isRecurring && (
                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Select
                        value={recurrenceFrequency}
                        onValueChange={(value) => { setRecurrenceFrequency(value); setIsRecurrenceModified(true); }}
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Journalière</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="yearly">Annuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="next-due-date">Prochaine échéance</Label>
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !nextDueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {nextDueDate ? format(nextDueDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={nextDueDate}
                            onSelect={(date) => { setNextDueDate(date); setIsRecurrenceModified(true); }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveRecurrence} disabled={!isRecurrenceModified}>
                    <Save className="mr-2 h-4 w-4"/>
                    Enregistrer la configuration
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-1 space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {sellerName && (<div><h3 className="text-sm font-semibold text-muted-foreground">Vendeur</h3><p>{sellerName}</p></div>)}
                {customer && (<div><h3 className="text-sm font-semibold text-muted-foreground">Client</h3><p className="font-semibold">{customer.name}</p></div>)}
              </div>
            </div>

          <Card>
            <CardHeader>
              <CardTitle>Résumé de la transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              
              <div className="space-y-1 text-sm border-t pt-2">
                 <h4 className="font-medium mb-1">Détail TVA</h4>
                 {Object.entries(vatBreakdown).map(([rate, values]) => (
                    <div key={rate} className="flex justify-between text-muted-foreground pl-2">
                        <span>Base TVA ({parseFloat(rate).toFixed(2)}%)</span>
                        <span>{values.base.toFixed(2)}€</span>
                    </div>
                ))}
              </div>
              <div className="flex justify-between text-muted-foreground font-semibold">
                 <span>Total TVA</span>
                 <span>{tax.toFixed(2)}€</span>
              </div>

              <Separator />
              {sale.originalTotal && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Original (TTC)</span>
                  <span>{sale.originalTotal.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total {sale.originalTotal ? 'Final ' : ''}(TTC)</span>
                <span>{sale.total.toFixed(2)}€</span>
              </div>
              {balanceDue > 0.01 && (
                <div className="flex justify-between font-bold text-lg text-destructive pt-2 border-t border-destructive/20">
                    <span>Solde Dû</span>
                    <span>{balanceDue.toFixed(2)}€</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 {sale.originalPayments && sale.originalPayments.length > 0 && (
                    <PaymentsList payments={sale.originalPayments} title="Paiements Originaux" saleId={sale.id} />
                 )}
                 {sale.originalPayments && <Separator />}
                 <PaymentsList payments={sale.payments || []} title={`${sale.originalPayments ? "Paiements de la Modification" : "Paiements"}`} saleId={sale.id} />

                 {sale.change && sale.change > 0 && (
                  <div className="w-full flex justify-between items-center text-sm text-amber-600 pt-2 border-t">
                      <Badge variant="secondary" className="bg-amber-200 text-amber-800">Monnaie Rendue</Badge>
                      <span className="font-medium">{sale.change.toFixed(2)}€</span>
                  </div>
                )}
            </CardFooter>
          </Card>

          {sale.tableName && (
                <Card>
                  <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <Utensils className="h-6 w-6 text-muted-foreground" />
                      <CardTitle>Origine</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>Cette pièce provient de la table : <span className="font-semibold">{sale.tableName}</span>.</p>
                  </CardContent>
              </Card>
          )}
        </div>
      </div>
       <EmailSenderDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          sale={sale}
          onSend={() => {
            // Note: onSend is now handled inside the dialog,
            // we could add post-send logic here if needed.
          }}
        />
    </div>
    </>
  );
}

export default function SaleDetailPage() {
  return (
    <Suspense fallback={<p>Chargement...</p>}>
      <SaleDetailContent />
    </Suspense>
  )
}
