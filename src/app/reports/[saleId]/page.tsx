
'use client';

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

export default function SaleDetailPage() {
  const { saleId } = useParams();
  const { sales, customers } = usePos();

  const sale = sales.find(s => s.id === saleId);
  const customer = sale?.customerId ? customers.find(c => c.id === sale?.customerId) : null;

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
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <Image src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                        <TableCell className="text-right font-bold">{item.total.toFixed(2)}€</TableCell>
                    </TableRow>
                  ))}
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
                <span className="text-muted-foreground">Sous-total</span>
                <span>{sale.subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes (10%)</span>
                <span>{sale.tax.toFixed(2)}€</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{sale.total.toFixed(2)}€</span>
              </div>
            </CardContent>
            <CardFooter>
                 <div className="w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Paiements</h3>
                    <div className="space-y-2">
                        {sale.payments.map((p, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <Badge variant="secondary">{p.method.name}</Badge>
                                <span className="font-medium">{p.amount.toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>
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
