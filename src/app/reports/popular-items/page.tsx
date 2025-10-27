
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Item, Sale } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import Link from 'next/link';

export default function PopularItemsPage() {
    const firestore = useFirestore();
    const { items, categories, toggleItemFavorite, toggleFavoriteForList, isLoading: isPosLoading } = usePos();
    const { user } = useUser();
    const isCashier = user?.role === 'cashier';
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const salesCollectionRef = useMemoFirebase(() => isClient ? query(collection(firestore, 'companies', 'main', 'sales')) : null, [firestore, isClient]);
    const { data: sales, isLoading: isSalesLoading } = useCollection<Sale>(salesCollectionRef);
    const isLoading = isPosLoading || isSalesLoading || !isClient;

    const popularItems = useMemo(() => {
        if (!sales || !items) return [];
        const relevantSales = sales.filter(sale => sale.ticketNumber?.startsWith('Fact-') || sale.ticketNumber?.startsWith('Tick-'));

        const itemCounts: { [key: string]: { item: Item, count: number, revenue: number } } = {};

        relevantSales.forEach(sale => {
            sale.items.forEach(orderItem => {
                if(itemCounts[orderItem.itemId]) {
                    itemCounts[orderItem.itemId].count += orderItem.quantity;
                    itemCounts[orderItem.itemId].revenue += orderItem.total;
                } else {
                    const itemDetails = items.find(i => i.id === orderItem.itemId);
                    if(itemDetails) {
                         itemCounts[orderItem.itemId] = { 
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
        if (!categories) return 'N/A';
        return categories.find(c => c.id === categoryId)?.name || 'N/A';
    }

    const allItemsAreFavorites = useMemo(() => {
      return popularItems.length > 0 && popularItems.every(({ item }) => item.isFavorite);
    }, [popularItems]);

    const handleToggleAllFavorites = () => {
        const popularItemIds = popularItems.map(({ item }) => item.id);
        toggleFavoriteForList(popularItemIds, !allItemsAreFavorites);
    }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Articles populaires"
        subtitle="Classement des articles les plus vendus sur la base des factures et tickets."
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            {!isCashier && (
                <Button onClick={handleToggleAllFavorites} disabled={popularItems.length === 0}>
                    <Star className="mr-2 h-4 w-4" />
                    {allItemsAreFavorites ? 'Tout retirer des favoris' : 'Tout mettre en favori'}
                </Button>
            )}
        </div>
      </PageHeader>
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
                  {isLoading && Array.from({length: 10}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && popularItems.map(({ item, count, revenue }, index) => (
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
                           <Button variant="ghost" size="icon" onClick={() => !isCashier && toggleItemFavorite(item.id)} disabled={isCashier}>
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

    