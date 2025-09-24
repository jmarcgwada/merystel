
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { LayoutGrid } from 'lucide-react';

interface CategoryListProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) {
  const { categories } = usePos();
  return (
    <div className="flex h-full flex-col">
      <h2 className="p-4 text-xl font-bold tracking-tight border-b font-headline">
        Catégories
      </h2>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
           <Button
              variant={!selectedCategory ? 'default' : 'ghost'}
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory(null)}
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              <span className="text-base">Tout</span>
            </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategory?.id === category.id ? 'default' : 'ghost'
              }
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory(category)}
            >
              <span className="text-base ml-8">{category.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
