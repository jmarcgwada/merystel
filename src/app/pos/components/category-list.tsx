
'use client';

import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category, SpecialCategory } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { LayoutGrid, Search, Star, Trophy, Keyboard } from 'lucide-react';
import { useKeyboard } from '@/contexts/keyboard-context';

interface CategoryListProps {
  onSelectCategory: (category: Category | SpecialCategory | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  selectedCategory: Category | SpecialCategory | null;
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavorites,
}: CategoryListProps) {
  const { categories, popularItemsCount } = usePos();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { showKeyboard, setTargetInput, inputValue, targetInput } = useKeyboard();

  useEffect(() => {
    if (targetInput?.name === 'category-search') {
      setSearchTerm(inputValue);
    }
  }, [inputValue, targetInput]);
  
  const handleSearchClick = () => {
    setTargetInput({
      value: searchTerm,
      name: 'category-search',
    });
    showKeyboard();
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const getVariant = (id: string | null) => {
    if (!selectedCategory && id === 'all') return 'default';
    // This handles both SpecialCategory string and Category object
    if (selectedCategory && typeof selectedCategory === 'object' && selectedCategory.id === id) return 'default';
    if (typeof selectedCategory === 'string' && selectedCategory === id) return 'default';
    return 'ghost';
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold tracking-tight font-headline mb-3">
          Catégories
        </h2>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-10"
          />
          <Button variant="ghost" size="icon" onClick={handleSearchClick} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <Keyboard className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
           <Button
              variant={getVariant('all')}
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory('all')}
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              <span className="text-base">Tout</span>
            </Button>
            <Button
              variant={getVariant('popular')}
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory('popular')}
            >
              <Trophy className="mr-3 h-5 w-5" />
              <span className="text-base">Top {popularItemsCount} Populaires</span>
            </Button>
            <Button
              variant={showFavoritesOnly ? 'secondary' : 'ghost'}
              className="h-12 w-full justify-start text-left"
              onClick={onToggleFavorites}
            >
              <Star className={cn("mr-3 h-5 w-5", showFavoritesOnly && 'text-yellow-500 fill-yellow-400')} />
              <span className="text-base">Favoris</span>
            </Button>
          {filteredCategories.map((category) => (
            <Button
              key={category.id}
              variant={getVariant(category.id)}
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
