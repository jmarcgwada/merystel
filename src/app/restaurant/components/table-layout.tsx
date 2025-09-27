

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import type { Table } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Utensils, CircleDollarSign, CheckCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';


const statusConfig = {
    available: {
        icon: CheckCircle,
        label: 'Disponible',
        className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
        cardClassName: 'border-green-300 hover:border-green-500 dark:border-green-800 dark:hover:border-green-600',
    },
    occupied: {
        icon: Utensils,
        label: 'Occupée',
        className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
        cardClassName: 'border-primary/50 hover:border-primary',
    },
    paying: {
        icon: CircleDollarSign,
        label: 'Paiement',
        className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
        cardClassName: 'border-accent/50 hover:border-accent',
    }
};


export function TableLayout() {
  const { tables, vatRates, setCameFromRestaurant, isLoading, setSelectedTableById, promoteTableToTicket } = usePos();
  const router = useRouter();

  const handleTableSelect = (table: Table) => {
    if (table.id === 'takeaway') {
      setCameFromRestaurant(true);
      router.push('/pos');
    } else {
      setSelectedTableById(table.id);
    }
  };

  if (isLoading) {
      return (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
              ))}
          </div>
      )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tables && tables.map((table) => {
        const config = statusConfig[table.status];
        const Icon = config.icon;
        
        const subtotal = table.order.reduce((sum, item) => sum + item.total, 0);
        const tax = table.order.reduce((sum, item) => {
            const vat = vatRates?.find(v => v.id === item.vatId);
            const taxForItem = item.total * ((vat?.rate || 0) / 100);
            return sum + taxForItem;
        }, 0);
        const total = subtotal + tax;

        return (
          <Card
            key={table.id}
            className={cn(
              'transition-all duration-200',
              config.cardClassName,
              table.id !== 'takeaway' && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
            )}
            onClick={() => handleTableSelect(table)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium font-headline">{table.name}</CardTitle>
               <Badge variant="outline" className={cn('text-xs', config.className)}>
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
            </CardHeader>
            <CardContent>
              {(table.status === 'occupied' || table.status === 'paying') && table.id !== 'takeaway' ? (
                <div className="relative">
                  <p className={cn("text-2xl font-bold text-foreground")}>
                    {total.toFixed(2)}€
                  </p>
                   <Popover>
                        <PopoverTrigger asChild>
                             <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto" onClick={(e) => e.stopPropagation()}>
                                {table.order.length} article{table.order.length !== 1 ? 's' : ''}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent onClick={(e) => e.stopPropagation()} className="w-64">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Détail de la commande</h4>
                                <Separator />
                                <div className="text-sm space-y-2 max-h-64 overflow-y-auto">
                                    {table.order.map(item => (
                                        <div key={item.id} className="flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="font-mono">{item.total.toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
              ) : (
                 <div className="h-[52px] flex items-center">
                    <p className="text-sm text-muted-foreground">{table.id === 'takeaway' ? 'Vente directe au comptoir' : 'Prête pour de nouveaux clients'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

