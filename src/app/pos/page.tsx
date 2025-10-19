
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category, SpecialCategory, Item } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search, Star, Trophy, LayoutGrid, List, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboard } from '@/contexts/keyboard-context';
import { SerialNumberModal } from './components/serial-number-modal';
import { VariantSelectionModal } from './components/variant-selection-modal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';

// Function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return `hsla(var(--background), ${opacity / 100})`;
};


export default function PosPage() {
  const { 
    setSelectedTableById, 
    heldOrders, 
    order,
    readOnlyOrder,
    isKeypadOpen, 
    popularItemsCount, 
    selectedTable, 
    directSaleBackgroundColor, 
    directSaleBgOpacity, 
    setCameFromRestaurant,
    itemDisplayMode,
    setItemDisplayMode,
    addToOrder,
  } = usePos();
  const [isClient, setIsClient] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | SpecialCategory | null>('all');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  
  const { setTargetInput } = useKeyboard();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const itemListRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleItemClick = (item: any) => {
    addToOrder(item.id);
  };
  

  useEffect(() => {
    if (tableId) {
        setSelectedTableById(tableId);
    } else if (searchParams.get('from') === 'restaurant') {
        setCameFromRestaurant(true);
        setSelectedTableById(null);
    } else if (!tableId && selectedTable) {
        setSelectedTableById(null);
    }
  }, [tableId, searchParams, setSelectedTableById, setCameFromRestaurant, selectedTable]);


  const pageTitle = useMemo(() => {
    if (showFavoritesOnly) return 'Favoris';
    if (selectedCategory === 'all' || selectedCategory === null) return 'Tous les articles';
    if (selectedCategory === 'popular') return `Top ${popularItemsCount} Populaires`;
    if (typeof selectedCategory === 'object') return selectedCategory.name;
    return 'Articles';
  }, [selectedCategory, showFavoritesOnly, popularItemsCount]);

  const handleSelectCategory = (category: Category | SpecialCategory | null) => {
    setSelectedCategory(category);
    setShowFavoritesOnly(false);
  }

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(prev => !prev);
    if (!showFavoritesOnly) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory('all');
    }
  }

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      setTargetInput({
        value: itemSearchTerm,
        name: 'item-search',
        ref: searchInputRef,
      });
    }
  };
  
  const backgroundColor = isClient ? hexToRgba(directSaleBackgroundColor, directSaleBgOpacity) : 'transparent';
  
  const handleScroll = (direction: 'up' | 'down') => {
    const scrollArea = itemListRef.current?.querySelector('[data-radix-scroll-area-viewport]');
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
    const scrollArea = itemListRef.current?.querySelector('[data-radix-scroll-area-viewport]');
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
  }, [selectedCategory, itemSearchTerm, showFavoritesOnly]);

  return (
    <>
      <div className="grid h-full grid-cols-10" style={{ backgroundColor }}>
        <div className="col-span-2 flex h-full flex-col overflow-hidden rounded-l-lg bg-card transition-opacity">
           <CategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={handleToggleFavorites}
          />
        </div>
        <div className={cn(
          "col-span-5 flex flex-col transition-opacity h-full overflow-hidden bg-card border-x",
          isKeypadOpen && 'opacity-50 pointer-events-none'
        )}>
           <div className="p-4 border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="flex-shrink-0 text-2xl font-semibold tracking-tight font-headline">
                    {pageTitle}
                  </h2>
                  {showFavoritesOnly && <Badge variant="secondary"><Star className="mr-1 h-3 w-3"/>Favoris</Badge>}
                  {selectedCategory === 'popular' && <Badge variant="secondary"><Trophy className="mr-1 h-3 w-3"/>Populaires</Badge>}
                </div>
                <div className="flex flex-grow items-center gap-2 sm:flex-grow-0">
                  <div className="relative flex w-full max-w-sm items-center">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                          ref={searchInputRef}
                          placeholder="Rechercher un article..."
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                          className="pl-9"
                          onFocus={handleSearchFocus}
                      />
                  </div>
                  {isClient ? (
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
                  ) : (
                      <Skeleton className="h-10 w-[74px]" />
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button 
                        variant="outline" 
                        size="icon"
                        onMouseDown={() => startScrolling('up')} 
                        onMouseUp={stopScrolling} 
                        onMouseLeave={stopScrolling}
                        onTouchStart={() => startScrolling('up')}
                        onTouchEnd={stopScrolling}
                        disabled={!canScrollUp}
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon"
                        onMouseDown={() => startScrolling('down')} 
                        onMouseUp={stopScrolling} 
                        onMouseLeave={stopScrolling}
                        onTouchStart={() => startScrolling('down')}
                        onTouchEnd={stopScrolling}
                        disabled={!canScrollDown}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                  <Button 
                      variant="outline" 
                      onClick={() => setHeldOpen(true)}
                      disabled={order.length > 0 || !!readOnlyOrder}
                      className={cn(
                          "flex-shrink-0",
                          (heldOrders?.length || 0) > 0 && order.length === 0 && !readOnlyOrder && 'animate-pulse-button'
                      )}
                  >
                      <Hand className="mr-2 h-4 w-4"/>
                      Tickets
                      <Badge variant="secondary" className="ml-2">{heldOrders?.length || 0}</Badge>
                  </Button>
                </div>
              </div>
          </div>
          <div className="relative flex-1" ref={itemListRef}>
            <ScrollArea className="absolute inset-0">
                <div className="p-4">
                  {isClient ? (
                      <ItemList
                          category={selectedCategory} 
                          searchTerm={itemSearchTerm} 
                          showFavoritesOnly={showFavoritesOnly}
                          onItemClick={handleItemClick}
                      />
                  ) : <Skeleton className="h-full w-full" />}
                </div>
            </ScrollArea>
          </div>
        </div>
        <div className="col-span-3 flex h-full flex-col overflow-hidden rounded-r-lg">
          <OrderSummary />
        </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
      <SerialNumberModal />
      <VariantSelectionModal />
    </>
  );
}
