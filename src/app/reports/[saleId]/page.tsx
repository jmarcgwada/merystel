
'use client';

import { useMemo, useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Utensils, User, Pencil, Edit, FileText, Copy } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import type { Sale, Payment, Item, OrderItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';


const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined, formatString: string}) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp)?.toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            jsDate = new Date(date as any);
        }

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

function SaleDetailContent() {
  const { saleId } = useParams();
  const searchParams = useSearchParams();
  const fromPos = searchParams.get('from') === 'pos';
  const { customers, vatRates, sales: allSales, items: allItems, isLoading: isPosLoading, loadTicketForViewing, users: allUsers, setOrder, setReadOnlyOrder, setCurrentSaleId, setCurrentSaleContext, toast } = usePos();
  const router = useRouter();
  const { user } = useUser();

  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (allSales && saleId) {
      const foundSale = allSales.find(s => s.id === saleId);
      setSale(foundSale || null);
    }
  }, [allSales, saleId]);

  const isLoading = isPosLoading || (saleId && !sale);

  const { previousSaleId, nextSaleId } = useMemo(() => {
    if (!allSales || allSales.length === 0 || !saleId) {
      return { previousSaleId: null, nextSaleId: null };
    }
    const sortedSales = [...allSales].sort((a, b) => {
        const dateA = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
        const dateB = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
        return dateB.getTime() - a.getTime();
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

  }, [allSales, saleId]);

  const customer = sale?.customerId ? customers?.find(c => c.id === sale?.customerId) : null;
  const seller = sale?.userId ? allUsers?.find(u => u.id === sale.userId) : null;
  const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : sale?.userName;

  const getVatInfo = (vatId: string) => {
    return vatRates?.find(v => v.id === vatId);
  }
  
  const getItemInfo = useCallback((orderItem: OrderItem): Partial<Item> => {
      if (!allItems) return {};
      return allItems.find(i => i.id === orderItem.itemId) || {};
  }, [allItems]);

  const vatBreakdown = useMemo(() => {
    if (!sale || !vatRates) return {};
    const breakdown: { [key: string]: { rate: number; total: number; base: number } } = {};

    sale.items.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        if (vatInfo) {
            const priceHT = item.price / (1 + vatInfo.rate / 100);
            const totalHT = priceHT * item.quantity;
            const vatAmount = totalHT * (vatInfo.rate / 100);
            
            if (breakdown[vatInfo.rate]) {
                breakdown[vatInfo.rate].total += vatAmount;
                breakdown[vatInfo.rate].base += totalHT;
            } else {
                breakdown[vatInfo.rate] = { rate: vatInfo.rate, total: vatAmount, base: totalHT };
            }
        }
    });
    return breakdown;
  }, [sale, vatRates]);
  
  const subTotalHT = useMemo(() => {
    if (!sale) return 0;
    return sale.total - sale.tax;
  }, [sale]);

  const handleBack = () => {
    if (fromPos && sale) {
        loadTicketForViewing(sale);
        router.push('/pos');
    } else {
        router.push('/reports');
    }
  }

  const handleDuplicateTicket = () => {
    if (!sale) return;
    const itemsToDuplicate = sale.items.map(item => {
        const { sourceSale, id, ...rest } = item;
        return { ...rest, id: uuidv4() };
    });
    setOrder(itemsToDuplicate);
    setReadOnlyOrder(null);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    toast({ title: 'Commande dupliquée', description: 'La commande est prête pour un nouvel encaissement.' });
    router.push('/pos');
};
  
  const pieceType = sale?.ticketNumber?.startsWith('Fact-') ? 'Facture' : sale?.ticketNumber?.startsWith('Devis-') ? 'Devis' : sale?.ticketNumber?.startsWith('BL-') ? 'BL' : 'Ticket';

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
            <Button onClick={handleBack} variant="outline" className="btn-back">
                <ArrowLeft />
                Retour
            </Button>
            {user?.role !== 'cashier' && (
              <>
                <Button variant="outline" onClick={handleDuplicateTicket}>
                    <Copy className="mr-2 h-4 w-4" />
                    Dupliquer
                </Button>
                <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Avoir
                </Button>
                <div className="flex items-center">
                    <Button asChild variant="outline" size="icon" disabled={!previousSaleId}>
                        <Link href={`/reports/${previousSaleId}${fromPos ? '?from=pos' : ''}`} scroll={false}>
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" disabled={!nextSaleId}>
                        <Link href={`/reports/${nextSaleId}${fromPos ? '?from=pos' : ''}`} scroll={false}>
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
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total Ligne (TTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map(item => {
                    const vatInfo = getVatInfo(item.vatId);
                    const itemTotalHT = item.total / (1 + (vatInfo?.rate || 0) / 100);
                    const vatAmount = item.total - itemTotalHT;
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
                             <TableCell className="text-right text-muted-foreground text-xs">
                                <div>{vatAmount.toFixed(2)}€</div>
                                <div>({vatInfo?.rate || 0}%)</div>
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
                <span className="text-muted-foreground">Sous-total (HT)</span>
                <span>{subTotalHT.toFixed(2)}€</span>
              </div>
              
              {Object.entries(vatBreakdown).map(([rate, values]) => (
                <div key={rate} className="flex justify-between text-muted-foreground">
                    <span>Base TVA ({rate}%)</span>
                    <span>{values.base.toFixed(2)}€</span>
                </div>
              ))}

              <div className="flex justify-between text-muted-foreground">
                 <span>Total TVA</span>
                 <span>{sale.tax.toFixed(2)}€</span>
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
                 <PaymentsList payments={sale.payments} title={sale.originalPayments ? "Paiements de la Modification" : "Paiements"} />

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
