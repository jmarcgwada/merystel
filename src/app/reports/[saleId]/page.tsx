'use client';

import { useMemo, useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Utensils, User, Pencil, Edit, FileText, Copy, LayoutDashboard, Printer, Send } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import type { Sale, Payment, Item, OrderItem, VatBreakdown } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from '../components/invoice-print-template';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';


const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined, formatString: string}) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) jsDate = date;
        else if (date && typeof (date as Timestamp)?.toDate === 'function') jsDate = (date as Timestamp).toDate();
        else jsDate = new Date(date as any);

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, formatString, { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}

const PaymentsList = ({ payments, title }: { payments: Payment[], title: string }) => (
    <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
        {payments && payments.length > 0 ? (
            <div className="space-y-2">
                {payments.map((p, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <Badge variant="secondary">{p.method.name}</Badge>
                        <span className="font-medium">{p.amount.toFixed(2)}€</span>
                    </div>
                ))}
                {/* Display total for this payment group */}
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
  
  const fromPos = searchParams.get('from') === 'pos';
  const fromAnalytics = searchParams.get('from') === 'analytics';
  
  const sortKey = searchParams.get('sortKey') as SortKey | null;
  const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
  const generalFilter = searchParams.get('filter');
  const statusFilter = searchParams.get('filterStatus');
  const dateFromFilter = searchParams.get('dateFrom');
  const dateToFilter = searchParams.get('dateTo');
  const customerFilter = searchParams.get('customer');
  const sellerFilter = searchParams.get('seller');
  const originFilter = searchParams.get('origin');
  const articleFilter = searchParams.get('article');


  const { customers, vatRates, sales: allSales, items: allItems, isLoading: isPosLoading, loadTicketForViewing, users: allUsers, companyInfo, smtpConfig } = usePos();
  const { user } = useUser();
  const printRef = useRef<HTMLDivElement>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (allSales && saleId) {
      const foundSale = allSales.find(s => s.id === saleId);
      setSale(foundSale || null);
    }
  }, [allSales, saleId]);
  
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
        if (fromPos && !s.ticketNumber?.startsWith('Tick-')) {
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
  }, [allSales, saleId, sortKey, sortDirection, getCustomerName, getUserName, allItems, customerFilter, sellerFilter, originFilter, articleFilter, dateFromFilter, dateToFilter, statusFilter, generalFilter, fromPos]);
  
  const navigationParams = useMemo(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    return params;
  }, [searchParams]);

  const handleBack = () => {
    const backParams = new URLSearchParams(navigationParams);
    if (fromPos && sale) {
        loadTicketForViewing(sale);
        router.push('/pos');
    } else if (fromAnalytics) {
        backParams.delete('from');
        router.push(`/reports/analytics?${backParams.toString()}`);
    } else {
        router.push(`/reports?${backParams.toString()}`);
    }
  }

  const getDetailLink = (id: string | null) => {
    if (!id) return '#';
    const params = new URLSearchParams(navigationParams);
    return `/reports/${id}?${params.toString()}`;
  };

  const generatePdfForEmail = useCallback(async (): Promise<{ content: string; filename: string } | null> => {
    if (!printRef.current || !sale) {
        toast({ variant: 'destructive', title: "Erreur de génération" });
        return null;
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfContent = await pdf.html(printRef.current, { autoPaging: 'text', width: 210, windowWidth: printRef.current.scrollWidth }).output('datauristring');
    return {
        content: pdfContent.split(',')[1],
        filename: `${sale.ticketNumber || 'document'}.pdf`,
    };
  }, [sale, toast]);

  const handleSendEmail = useCallback(async () => {
      if (!sale || !smtpConfig?.senderEmail) {
          toast({ variant: 'destructive', title: 'Erreur de configuration SMTP' });
          return;
      }
      const customer = sale.customerId ? customers?.find(c => c.id === sale.customerId) : null;
      if (!customer?.email) {
          toast({ variant: 'destructive', title: 'E-mail du client manquant' });
          return;
      }
      
      setIsSendingEmail(true);
      toast({ title: 'Envoi en cours...' });

      const pdfData = await generatePdfForEmail();
      if (!pdfData) {
          setIsSendingEmail(false);
          return;
      }

      const emailResult = await sendEmail({
          smtpConfig: {
              host: smtpConfig.host!, port: smtpConfig.port!, secure: smtpConfig.secure || false,
              auth: { user: smtpConfig.user!, pass: smtpConfig.password! },
              senderEmail: smtpConfig.senderEmail!,
          },
          to: customer.email, cc: smtpConfig.senderEmail,
          subject: `Votre document #${sale.ticketNumber}`,
          text: `Veuillez trouver ci-joint votre document #${sale.ticketNumber}.`,
          html: `<p>Veuillez trouver ci-joint votre document #${sale.ticketNumber}.</p>`,
          attachments: [{ filename: pdfData.filename, content: pdfData.content, encoding: 'base64' }],
      });

      toast({
          variant: emailResult.success ? 'default' : 'destructive',
          title: emailResult.success ? 'E-mail envoyé !' : "Échec de l'envoi",
          description: emailResult.message,
      });

      setIsSendingEmail(false);
  }, [sale, smtpConfig, customers, toast, generatePdfForEmail]);


  const customer = sale?.customerId ? customers?.find(c => c.id === sale?.customerId) : null;
  const seller = sale?.userId ? allUsers?.find(u => u.id === sale.userId) : null;
  const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : sale?.userName;
  
  const getItemInfo = useCallback((orderItem: OrderItem): Partial<Item> => {
      if (!allItems) return {};
      return allItems.find(i => i.id === orderItem.itemId) || {};
  }, [allItems]);

  const { subtotal, tax, vatBreakdown } = useMemo(() => {
    if (!sale || !vatRates) return { subtotal: 0, tax: 0, vatBreakdown: {} };
    
    if (sale.vatBreakdown && sale.subtotal !== undefined && sale.tax !== undefined) {
        return { subtotal: sale.subtotal, tax: sale.tax, vatBreakdown: sale.vatBreakdown };
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

    return { subtotal: calcSubtotal, tax: calcTax, vatBreakdown: breakdown };
}, [sale, vatRates]);
  
  const pieceType = sale?.documentType === 'invoice' ? 'Facture'
                  : sale?.documentType === 'quote' ? 'Devis'
                  : sale?.documentType === 'delivery_note' ? 'BL'
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
            <Button onClick={handleSendEmail} variant="outline" disabled={isSendingEmail}>
                <Send className="mr-2 h-4 w-4" />
                {isSendingEmail ? 'Envoi...' : 'Envoyer par E-mail'}
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
        <div className="lg:col-span-2">
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
        </div>
        
        <div className="lg:col-span-1 space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {sellerName && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Vendeur</h3>
                    <p>{sellerName}</p>
                  </div>
                )}
                {customer && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Client</h3>
                    <p className="font-semibold">{customer.name}</p>
                    {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                    {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                  </div>
                )}
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
              
              {Object.entries(vatBreakdown).map(([rate, values]) => (
                <div key={rate} className="flex justify-between text-muted-foreground">
                    <span>Base TVA ({parseFloat(rate).toFixed(2)}%)</span>
                    <span>{values.base.toFixed(2)}€</span>
                </div>
              ))}

              <div className="flex justify-between text-muted-foreground">
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
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 {sale.originalPayments && sale.originalPayments.length > 0 && (
                    <PaymentsList payments={sale.originalPayments} title="Paiements Originaux" />
                 )}
                 {sale.originalPayments && <Separator />}
                 <PaymentsList payments={sale.payments || []} title={sale.originalPayments ? "Paiements de la Modification" : "Paiements"} />

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
    </div>
  );
}

export default function SaleDetailPage() {
  return (
    <Suspense fallback={<p>Chargement...</p>}>
      <SaleDetailContent />
    </Suspense>
  )
}
