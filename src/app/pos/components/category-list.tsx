'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category, SpecialCategory } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { LayoutGrid, Search, Star, Trophy, ArrowDown, ArrowUp, Keyboard as KeyboardIcon } from 'lucide-react';
import { useKeyboard } from '@/contexts/keyboard-context';
import { Badge } from '@/components/ui/badge';

interface CategoryListProps {
  selectedCategory: Category | SpecialCategory | null;
  onSelectCategory: (category: Category | SpecialCategory | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavorites,
}: CategoryListProps) {
  const { items, categories, popularItemsCount, selectedTable, enableRestaurantCategoryFilter } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const { setTargetInput, inputValue, targetInput } = useKeyboard();
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (targetInput?.name === 'category-search') {
      setSearchTerm(inputValue);
    }
  }, [inputValue, targetInput]);
  
  const handleSearchFocus = () => {
    setTargetInput({
      value: searchTerm,
      name: 'category-search',
      ref: searchInputRef,
    });
  };

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    
    let baseCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedTable && enableRestaurantCategoryFilter) {
      const restaurantCategories = baseCategories.filter(category => category.isRestaurantOnly === true);
      const generalCategories = baseCategories.filter(category => category.isRestaurantOnly !== true);
      return [...restaurantCategories, ...generalCategories];
    }
    
    if (!selectedTable) {
        return baseCategories.filter(category => category.isRestaurantOnly !== true);
    }
    
    return baseCategories;

  }, [categories, searchTerm, selectedTable, enableRestaurantCategoryFilter]);

  const getVariant = (id: string | null) => {
    const isSelected = (selectedCategory && typeof selectedCategory === 'object' && selectedCategory.id === id) || 
                       (typeof selectedCategory === 'string' && selectedCategory === id) ||
                       (!selectedCategory && id === 'all');
    if (isSelected) return 'default';
    return 'ghost';
  }

  const getStyleForCategory = (category: Category) => {
    const isSelected = selectedCategory && typeof selectedCategory === 'object' && selectedCategory.id === category.id;
    const isHovered = hoveredCategoryId === category.id;

    if (isSelected && category.color) {
      return {
        backgroundColor: category.color,
        color: 'white',
        '--hover-bg-color': `${category.color}E6`
      };
    }
    if (isHovered && category.color) {
        return {
            backgroundColor: `${category.color}33`,
        }
    }
    return {
        '--hover-bg-color': 'hsl(var(--accent))'
    };
  };

  const isSpecialCategorySelected = (id: string) => {
      if (id === 'all') return getVariant('all') === 'default' && !(selectedCategory && typeof selectedCategory === 'object');
      return getVariant(id) === 'default';
  }


  return (
    <div className="flex h-full flex-col relative">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold tracking-tight font-headline">
            Catégories
          </h2>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            ref={searchInputRef}
            placeholder="Rechercher catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            onFocus={handleSearchFocus}
          />
        </div>
      </div>
      <div className="flex-1 relative">
        <ScrollArea className="absolute inset-0">
          <div className="flex flex-col gap-2 p-4">
            <Button
                variant={isSpecialCategorySelected('all') ? 'default' : 'ghost'}
                className="h-12 w-full justify-start text-left"
                onClick={() => onSelectCategory('all')}
              >
                <LayoutGrid className="mr-3 h-5 w-5" />
                <span className="text-base flex-1">Tout</span>
                {isClient && items && <Badge variant="secondary">{items.length}</Badge>}
              </Button>
              <Button
                variant={isSpecialCategorySelected('popular') ? 'default' : 'ghost'}
                className="h-12 w-full justify-start text-left"
                onClick={() => onSelectCategory('popular')}
              >
                <Trophy className="mr-3 h-5 w-5" />
                <span className="text-base">Top {isClient ? popularItemsCount : '...'} Populaires</span>
              </Button>
              <Button
                variant={showFavoritesOnly ? 'secondary' : 'ghost'}
                className="h-12 w-full justify-start text-left"
                onClick={onToggleFavorites}
              >
                <Star className={cn("mr-3 h-5 w-5", showFavoritesOnly && 'text-yellow-500 fill-yellow-400')} />
                <span className="text-base">Favoris</span>
              </Button>
            {filteredCategories.map((category) => {
              const isSelected = selectedCategory && typeof selectedCategory === 'object' && selectedCategory.id === category.id;
              return (
                  <Button
                  key={category.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  style={getStyleForCategory(category) as React.CSSProperties}
                  className={cn("h-12 w-full justify-start text-left", isSelected && "hover:bg-[var(--hover-bg-color)]")}
                  onClick={() => onSelectCategory(category)}
                  onMouseEnter={() => setHoveredCategoryId(category.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                  <span className="text-base ml-8">{category.name}</span>
                  </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
