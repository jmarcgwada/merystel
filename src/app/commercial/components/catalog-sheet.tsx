'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { usePos } from '@/contexts/pos-context';
import { CategoryList } from '@/app/pos/components/category-list';
import { ItemList } from '@/app/pos/components/item-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, List, ArrowUp, ArrowDown } from 'lucide-react';
import type { Category, SpecialCategory, Item } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid } from 'lucide-react';

interface CatalogSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CatalogSheet({ isOpen, onClose }: CatalogSheetProps) {
  const { addToOrder, itemDisplayMode, setItemDisplayMode } = usePos();
  const [selectedCategory, setSelectedCategory] = useState<Category | SpecialCategory | null>('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const itemListRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const handleItemClick = (item: Item) => {
    addToOrder(item.id);
  };

  const handleSelectCategory = (category: Category | SpecialCategory | null) => {
    setSelectedCategory(category);
    setShowFavoritesOnly(false);
  };

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(prev => !prev);
    if (!showFavoritesOnly) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory('all');
    }
  };

  const pageTitle = useMemo(() => {
    if (showFavoritesOnly) return 'Favoris';
    if (selectedCategory === 'all' || selectedCategory === null) return 'Tous les articles';
    if (selectedCategory === 'popular') return 'Populaires';
    if (typeof selectedCategory === 'object') return selectedCategory.name;
    return 'Articles';
  }, [selectedCategory, showFavoritesOnly]);

  const handleScroll = (direction: 'up' | 'down') => {
    const scrollArea = itemListRef.current;
    if (scrollArea) {
      const scrollAmount = scrollArea.clientHeight * 0.8;
      scrollArea.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const startScrolling = (direction: 'up' | 'down') => {
    stopScrolling();
    handleScroll(direction);
    scrollIntervalRef.current = setInterval(() => handleScroll(direction), 300);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
  };

  useEffect(() => {
    const scrollArea = itemListRef.current;
    if (!scrollArea) return;

    const checkScrollability = () => {
      setCanScrollUp(scrollArea.scrollTop > 0);
      setCanScrollDown(scrollArea.scrollHeight > scrollArea.clientHeight + scrollArea.scrollTop);
    };

    checkScrollability();
    const observer = new MutationObserver(checkScrollability);
    scrollArea.addEventListener('scroll', checkScrollability);
    observer.observe(scrollArea, { childList: true, subtree: true });

    return () => {
      scrollArea.removeEventListener('scroll', checkScrollability);
      observer.disconnect();
    };
  }, [isOpen, selectedCategory, itemSearchTerm, showFavoritesOnly]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex h-full">
        <div className="w-1/4 border-r">
          <CategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={handleToggleFavorites}
          />
        </div>
        <div className="w-3/4 flex flex-col">
            <SheetHeader className="p-4 border-b">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SheetTitle className="text-2xl font-semibold tracking-tight font-headline">
                        {pageTitle}
                    </SheetTitle>
                    <div className="flex flex-grow items-center gap-2 sm:flex-grow-0">
                        <div className="relative flex w-full max-w-sm items-center">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un article..."
                                value={itemSearchTerm}
                                onChange={(e) => setItemSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={itemDisplayMode}
                            onValueChange={(value) => {
                                if (value) setItemDisplayMode(value as 'grid' | 'list');
                            }}
                        >
                            <ToggleGroupItem value="grid" aria-label="Affichage en grille">
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="Affichage en liste">
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                     <div className="flex items-center gap-2 ml-auto">
                        <Button variant="outline" size="icon" onMouseDown={() => startScrolling('up')} onMouseUp={stopScrolling} onMouseLeave={stopScrolling} onTouchStart={() => startScrolling('up')} onTouchEnd={stopScrolling} disabled={!canScrollUp}><ArrowUp className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onMouseDown={() => startScrolling('down')} onMouseUp={stopScrolling} onMouseLeave={stopScrolling} onTouchStart={() => startScrolling('down')} onTouchEnd={stopScrolling} disabled={!canScrollDown}><ArrowDown className="h-4 w-4" /></Button>
                    </div>
                </div>
            </SheetHeader>
            <div className="relative flex-1">
                 <ScrollArea className="absolute inset-0" viewportRef={itemListRef}>
                    <div className="p-4">
                        <ItemList
                            category={selectedCategory}
                            searchTerm={itemSearchTerm}
                            showFavoritesOnly={showFavoritesOnly}
                            onItemClick={handleItemClick}
                        />
                    </div>
                </ScrollArea>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
