

'use client';

import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import { PlusCircle } from 'lucide-react';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemListProps {
  category: Category | 'all' | 'favorites' | null;
  searchTerm: string;
}

export function ItemList({ category, searchTerm }: ItemListProps) {
  const { addToOrder, items: allItems } = usePos();
  
  const filteredItems = allItems.filter(item => {
    let matchesCategory = true;
    if (category === 'all' || category === null) {
        matchesCategory = true;
    } else if (category === 'favorites') {
        matchesCategory = !!item.isFavorite;
    } else if (typeof category === 'object' && category.id) {
        matchesCategory = item.categoryId === category.id;
    }
    
    const matchesSearch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {filteredItems.map((item) => {
        const showImage = item.showImage ?? true;
        return (
          <Card
            key={item.id}
            className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <button onClick={() => addToOrder(item.id)} className="flex flex-col h-full text-left">
              {showImage && (
                <CardHeader className="p-0">
                  <div className="relative aspect-video w-full">
                    <Image
                      src={item.image || 'https://picsum.photos/seed/placeholder/200/150'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      data-ai-hint="product image"
                    />
                  </div>
                </CardHeader>
              )}
              <CardContent className={cn("flex-1 p-3", !showImage && "flex flex-col justify-center")}>
                <h3 className={cn("font-semibold leading-tight", !showImage && "text-center")}>{item.name}</h3>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-3 pt-0 mt-auto">
                <span className="text-lg font-bold text-primary">
                  {item.price.toFixed(2)}€
                </span>
                <PlusCircle className="w-6 h-6 text-muted-foreground" />
              </CardFooter>
            </button>
          </Card>
        )
      })}
    </div>
  );
}
