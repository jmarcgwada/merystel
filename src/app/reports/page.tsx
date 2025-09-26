
'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import type { Timestamp } from 'firebase/firestore';


const ClientFormattedDate = ({ date }: { date: Date | Timestamp }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) return;
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp).toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            // Attempt to parse if it's a string or number, though it shouldn't be
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, "d MMM yyyy 'à' HH:mm", { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date]);

    return <>{formattedDate}</>;
}


export default function ReportsPage() {
    const { sales, customers, isLoading } = usePos();
    const { user } = useUser();
    const isCashier = user?.role === 'cashier';
    
    const PaymentBadges = ({ payments }: { payments: Payment[] }) => (
      <div className="flex flex-wrap gap-1">
        {!payments || payments.length === 0 ? (
          <Badge variant="destructive" className="font-normal">En attente</Badge>
        ) : (
          payments.map((p, index) => (
            <Badge key={index} variant="outline" className="capitalize font-normal">
              {p.method.name}: <span className="font-semibold ml-1">{p.amount.toFixed(2)}€</span>
            </Badge>
          ))
        )}
      </div>
    );

    const getCustomerName = (customerId?: string) => {
        if (!customerId || !customers) return 'N/A';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports"
        subtitle="Analysez vos performances de vente."
      >
        {!isCashier && (
            <Button asChild>
                <Link href="/reports/popular-items">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Voir les articles populaires
                </Link>
            </Button>
        )}
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
                            <TableHead className="text-right">Total (TTC)</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length: 10}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && sales && sales.map(sale => (
                            <TableRow key={sale.id}>
                                 <TableCell className="font-mono text-muted-foreground text-xs">
                                    {sale.ticketNumber}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">
                                    <ClientFormattedDate date={sale.date} />
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
