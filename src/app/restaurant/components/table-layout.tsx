'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import type { Table } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Utensils, CircleDollarSign, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const statusConfig = {
    available: {
        icon: CheckCircle,
        label: 'Available',
        className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
        cardClassName: 'border-green-300 hover:border-green-500 dark:border-green-800 dark:hover:border-green-600',
    },
    occupied: {
        icon: Utensils,
        label: 'Occupied',
        className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
        cardClassName: 'border-primary/50 hover:border-primary',
    },
    paying: {
        icon: CircleDollarSign,
        label: 'Paying',
        className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
        cardClassName: 'border-accent/50 hover:border-accent',
    }
};


export function TableLayout() {
  const { tables } = usePos();
  const router = useRouter();

  const handleTableSelect = (table: Table) => {
    router.push(`/pos?tableId=${table.id}`);
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tables.map((table) => {
        const config = statusConfig[table.status];
        const Icon = config.icon;
        const total = table.order.reduce((sum, item) => sum + item.total, 0);

        return (
          <Card
            key={table.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1',
              config.cardClassName
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
              {table.status !== 'available' ? (
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${(total * 1.1).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {table.order.length} item{table.order.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                 <div className="h-[52px] flex items-center">
                    <p className="text-sm text-muted-foreground">Ready for new guests</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
