
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Item } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PopularItemsPage() {
    const { sales, items, categories, toggleItemFavorite } = usePos();

    const popularItems = useMemo(() => {
        const itemCounts: { [key: string]: { item: Item, count: number, revenue: number } } = {};

        sales.forEach(sale => {
            sale.items.forEach(orderItem => {
                if(itemCounts[orderItem.id]) {
                    itemCounts[orderItem.id].count += orderItem.quantity;
                    itemCounts[orderItem.id].revenue += orderItem.total;
                } else {
                    const itemDetails = items.find(i => i.id === orderItem.id);
                    if(itemDetails) {
                         itemCounts[orderItem.id] = { 
                            item: itemDetails, 
                            count: orderItem.quantity,
                            revenue: orderItem.total
                        };
                    }
                }
            })
        });
        
        return Object.values(itemCounts)
            .sort((a,b) => b.count - a.count);

    }, [sales, items]);

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'N/A';
    }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Articles populaires"
        subtitle="Classement des articles les plus vendus."
      />
      <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rang</TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Ventes (Qté)</TableHead>
                    <TableHead className="text-right">Revenu Total</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularItems.map(({ item, count, revenue }, index) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-bold text-lg text-muted-foreground">
                            #{index + 1}
                        </TableCell>
                        <TableCell>
                          <Image 
                            src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            data-ai-hint="product image"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">{count}</TableCell>
                        <TableCell className="text-right font-bold">{revenue.toFixed(2)}€</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" onClick={() => toggleItemFavorite(item.id)}>
                               <Star className={cn("h-4 w-4", item.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
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
