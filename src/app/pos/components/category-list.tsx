

'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  const { categories, popularItemsCount, selectedTable } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const { showKeyboard, setTargetInput, inputValue, targetInput } = useKeyboard();
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

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
    if (!categories) return [];
    
    // Start with search term filter
    let baseCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If a table is selected (restaurant mode), show only categories marked for restaurant
    if (selectedTable) {
        return baseCategories.filter(category => category.isRestaurantOnly === true);
    }

    // In direct sale mode, show all categories matching the search
    return baseCategories;

  }, [categories, searchTerm, selectedTable]);

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
        '--hover-bg-color': `${category.color}E6` // 90% opacity for hover
      };
    }
    if (isHovered && category.color) {
        return {
            backgroundColor: `${category.color}33`, // Add alpha for hover effect
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
              variant={isSpecialCategorySelected('all') ? 'default' : 'ghost'}
              className="h-12 w-full justify-start text-left"
              onClick={() => onSelectCategory('all')}
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              <span className="text-base">Tout</span>
            </Button>
            <Button
              variant={isSpecialCategorySelected('popular') ? 'default' : 'ghost'}
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
  );
}
