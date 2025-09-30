

'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, ArrowRight, Utensils, User, Pencil, Edit } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useDoc, useMemoFirebase } from '@/firebase';
import type { Sale, Payment } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';


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
        } else if (date && typeof (date as Timestamp).toDate === 'function') {
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


export default function SaleDetailPage() {
  const { saleId } = useParams();
  const firestore = useFirestore();
  const { customers, vatRates, sales: allSales, isLoading: isPosLoading } = usePos();
  const router = useRouter();

  const saleDocRef = useMemoFirebase(() => saleId ? doc(firestore, 'companies', 'main', 'sales', saleId as string) : null, [firestore, saleId]);
  const { data: sale, isLoading: isSaleLoading } = useDoc<Sale>(saleDocRef);
  const isLoading = isPosLoading || isSaleLoading;

  const { previousSaleId, nextSaleId } = useMemo(() => {
    if (!allSales || allSales.length === 0 || !saleId) {
      return { previousSaleId: null, nextSaleId: null };
    }
    const sortedSales = [...allSales].sort((a, b) => {
        const dateA = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
        const dateB = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });

    const currentIndex = sortedSales.findIndex(s => s.id === saleId);
    if (currentIndex === -1) {
        return { previousSaleId: null, nextSaleId: null };
    }
    
    const previousSale = currentIndex > 0 ? sortedSales[currentIndex - 1] : null;
    const nextSale = currentIndex < sortedSales.length - 1 ? sortedSales[currentIndex + 1] : null;

    return { 
        previousSaleId: previousSale ? previousSale.id : null,
        nextSaleId: nextSale ? nextSale.id : null
    };

  }, [allSales, saleId]);

  const customer = sale?.customerId ? customers?.find(c => c.id === sale?.customerId) : null;

  const getVatInfo = (vatId: string) => {
    return vatRates?.find(v => v.id === vatId);
  }

  const vatBreakdown = useMemo(() => {
    if (!sale) return {};
    const breakdown: { [key: string]: { rate: number; total: number } } = {};

    sale.items.forEach(item => {
      const vatInfo = getVatInfo(item.vatId);
      if (vatInfo) {
        const taxForItem = item.total * (vatInfo.rate / 100);
        if (breakdown[vatInfo.rate]) {
          breakdown[vatInfo.rate].total += taxForItem;
        } else {
          breakdown[vatInfo.rate] = { rate: vatInfo.rate, total: taxForItem };
        }
      }
    });

    return breakdown;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale, vatRates]);

  if (isLoading) {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Détails de la vente"
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
        <p>Vente non trouvée.</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/reports">Retour aux rapports</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Détail de la vente #${sale.ticketNumber}`}
        subtitle={
          <span className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm mt-1">
            <span>
              Créé le : <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy 'à' HH:mm" />
            </span>
            {sale.modifiedAt && (
              <span className="flex items-center gap-1">
                <Edit className="h-3 w-3"/> Modifié le : <ClientFormattedDate date={sale.modifiedAt} formatString="d MMM yyyy 'à' HH:mm" />
              </span>
            )}
          </span>
        }
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="btn-back">
                <Link href="/reports">
                    <ArrowLeft />
                    Retour
                </Link>
            </Button>
            <div className="flex items-center">
                <Button asChild variant="outline" size="icon" disabled={!previousSaleId}>
                    <Link href={`/reports/${previousSaleId}`} scroll={false}>
                        <ArrowLeft />
                    </Link>
                </Button>
                <Button asChild variant="outline" size="icon" disabled={!nextSaleId}>
                    <Link href={`/reports/${nextSaleId}`} scroll={false}>
                        <ArrowRight />
                    </Link>
                </Button>
            </div>
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
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total Ligne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map(item => {
                    const vatInfo = getVatInfo(item.vatId);
                    const vatAmount = item.total * ((vatInfo?.rate || 0) / 100);
                    return (
                        <TableRow key={item.id}>
                            <TableCell>
                                <Image src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" />
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
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total (HT)</span>
                <span>{sale.subtotal.toFixed(2)}€</span>
              </div>
              
              {Object.values(vatBreakdown).map(vat => (
                <div key={vat.rate} className="flex justify-between">
                  <span className="text-muted-foreground">TVA ({vat.rate}%)</span>
                  <span>{vat.total.toFixed(2)}€</span>
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

          <div className="space-y-4">
            {sale.userName && (
                <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <User className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Vendeur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{sale.userName}</p>
                    </CardContent>
                </Card>
            )}
            {sale.tableName && (
                 <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <Utensils className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Origine de la vente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Cette vente provient de la table : <span className="font-semibold">{sale.tableName}</span>.</p>
                    </CardContent>
                </Card>
            )}
            {customer && (
                <Card>
                    <CardHeader>
                        <CardTitle>Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{customer.name}</p>
                        {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                        {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                    </CardContent>
                </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
