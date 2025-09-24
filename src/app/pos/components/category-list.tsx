'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { mockCategories } from '@/lib/mock-data';

interface CategoryListProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="p-4 text-xl font-bold tracking-tight border-b font-headline">
        Categories
      </h2>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {mockCategories.map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategory?.id === category.id ? 'default' : 'ghost'
              }
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory(category)}
            >
              <span className="text-base">{category.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
