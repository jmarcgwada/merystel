
'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';
import type { Item, Payment } from '@/lib/types';


export default function ReportsPage() {
    const { sales, items } = usePos();

    const popularItems = useMemo(() => {
        const itemCounts: { [key: string]: { item: Item, count: number } } = {};

        sales.forEach(sale => {
            sale.items.forEach(orderItem => {
                if(itemCounts[orderItem.id]) {
                    itemCounts[orderItem.id].count += orderItem.quantity;
                } else {
                    const itemDetails = items.find(i => i.id === orderItem.id);
                    if(itemDetails) {
                         itemCounts[orderItem.id] = { item: itemDetails, count: orderItem.quantity };
                    }
                }
            })
        });
        
        return Object.values(itemCounts)
            .sort((a,b) => b.count - a.count)
            .slice(0, 5);

    }, [sales, items]);
    
    const PaymentBadges = ({ payments }: { payments: Payment[] }) => (
      <div className="flex flex-wrap gap-1">
        {payments.map((p, index) => (
          <Badge key={index} variant="outline" className="capitalize">
            {p.method.name}
          </Badge>
        ))}
      </div>
    );


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports"
        subtitle="Analysez vos performances de vente."
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Ventes Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Articles</TableHead>
                                <TableHead>Paiement</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.map(sale => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(sale.date, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        {sale.items.reduce((acc, item) => acc + item.quantity, 0)}
                                    </TableCell>
                                    <TableCell>
                                         <PaymentBadges payments={sale.payments} />
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{sale.total.toFixed(2)}€</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Articles Populaires</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {popularItems.map(({ item, count }, index) => (
                             <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.price.toFixed(2)}€</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{count}</p>
                                    <p className="text-xs text-muted-foreground">Ventes</p>
                                </div>
                             </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
