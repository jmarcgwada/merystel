
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { LayoutGrid, Search } from 'lucide-react';

interface CategoryListProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) {
  const { categories } = usePos();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold tracking-tight font-headline mb-3">
          Catégories
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
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
          {filteredCategories.map((category) => (
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
