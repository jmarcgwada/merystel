
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
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
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SaleDetailPage() {
  const { saleId } = useParams();
  const { sales, customers, vatRates } = usePos();

  const sale = sales.find(s => s.id === saleId);
  const customer = sale?.customerId ? customers.find(c => c.id === sale?.customerId) : null;

  const getVatInfo = (vatId: string) => {
    return vatRates.find(v => v.id === vatId);
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
  }, [sale, vatRates]);

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
        subtitle={`Effectuée le ${format(sale.date, "d MMMM yyyy 'à' HH:mm", { locale: fr })}`}
      >
        <Button asChild variant="outline">
            <Link href="/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux rapports
            </Link>
        </Button>
      </PageHeader>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {sale.status === 'pending' && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Vente en attente</AlertTitle>
                <AlertDescription>
                  Cette vente a été enregistrée mais est en attente de paiement.
                </AlertDescription>
              </Alert>
            )}
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
                            <TableCell className="font-medium">{item.name}</TableCell>
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
              <div className="flex justify-between font-bold text-lg">
                <span>Total (TTC)</span>
                <span>{sale.total.toFixed(2)}€</span>
              </div>
            </CardContent>
            <CardFooter>
                 <div className="w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Paiements</h3>
                    {sale.payments.length > 0 ? (
                      <div className="space-y-2">
                          {sale.payments.map((p, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                  <Badge variant="secondary">{p.method.name}</Badge>
                                  <span className="font-medium">{p.amount.toFixed(2)}€</span>
                              </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-destructive font-medium">
                        Aucun paiement enregistré
                      </div>
                    )}
                </div>
            </CardFooter>
          </Card>
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
  );
}
