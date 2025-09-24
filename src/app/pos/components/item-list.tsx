
'use client';

import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Category } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { PlusCircle } from 'lucide-react';

interface ItemListProps {
  category: Category | null;
}

export function ItemList({ category }: ItemListProps) {
  const { addToOrder, items: mockItems } = usePos();
  const items = category
    ? mockItems.filter((item) => item.categoryId === category.id)
    : mockItems;

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight font-headline">
        {category ? category.name : 'Tous les articles'}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <Card
            key={item.id}
            className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <button onClick={() => addToOrder(item.id)} className="flex flex-col h-full text-left">
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
              <CardContent className="flex-1 p-3">
                <h3 className="font-semibold leading-tight">{item.name}</h3>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-3 pt-0">
                <span className="text-lg font-bold text-primary">
                  {item.price.toFixed(2)}€
                </span>
                <PlusCircle className="w-6 h-6 text-muted-foreground" />
              </CardFooter>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
