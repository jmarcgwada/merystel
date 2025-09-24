
'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye } from 'lucide-react';


export default function ReportsPage() {
    const { sales, customers } = usePos();
    
    const PaymentBadges = ({ payments }: { payments: Payment[] }) => (
      <div className="flex flex-wrap gap-1">
        {payments.map((p, index) => (
          <Badge key={index} variant="outline" className="capitalize font-normal">
            {p.method.name}: <span className="font-semibold ml-1">{p.amount.toFixed(2)}€</span>
          </Badge>
        ))}
      </div>
    );

    const getCustomerName = (customerId?: string) => {
        if (!customerId) return 'N/A';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports"
        subtitle="Analysez vos performances de vente."
      >
        <Button asChild>
            <Link href="/reports/popular-items">
                <TrendingUp className="mr-2 h-4 w-4" />
                Voir les articles populaires
            </Link>
        </Button>
      </PageHeader>
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>Ventes Récentes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Paiement</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map(sale => (
                            <TableRow key={sale.id}>
                                 <TableCell className="font-mono text-muted-foreground text-xs">
                                    {sale.ticketNumber}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">
                                    {format(sale.date, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                </TableCell>
                                <TableCell>
                                    {getCustomerName(sale.customerId)}
                                </TableCell>
                                <TableCell>
                                    {sale.items.reduce((acc, item) => acc + item.quantity, 0)}
                                </TableCell>
                                <TableCell>
                                     <PaymentBadges payments={sale.payments} />
                                </TableCell>
                                <TableCell className="text-right font-bold">{sale.total.toFixed(2)}€</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/reports/${sale.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
