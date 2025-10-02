
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category, SpecialCategory } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search, Star, Trophy, ArrowDown, ArrowUp, Keyboard as KeyboardIcon, LayoutGrid, List } from 'lucide-react';
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
    isKeypadOpen, 
    popularItemsCount, 
    selectedTable, 
    directSaleBackgroundColor, 
    directSaleBgOpacity, 
    setCameFromRestaurant,
    itemDisplayMode,
    setItemDisplayMode,
   } = usePos();
  const [isClient, setIsClient] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | SpecialCategory | null>('all');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  
  const { setTargetInput, inputValue, targetInput } = useKeyboard();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemScrollAreaRef = useRef<HTMLDivElement>(null);
  const categoryScrollAreaRef = useRef<HTMLDivElement>(null);
  const itemContentRef = useRef<HTMLDivElement>(null);
  
  const [canScrollItemsUp, setCanScrollItemsUp] = useState(false);
  const [canScrollItemsDown, setCanScrollItemsDown] = useState(false);
  const [canScrollCategoriesUp, setCanScrollCategoriesUp] = useState(false);
  const [canScrollCategoriesDown, setCanScrollCategoriesDown] = useState(false);

  const itemScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const categoryScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredItems = useMemo(() => (
    <ItemList 
        ref={itemContentRef}
        category={selectedCategory} 
        searchTerm={itemSearchTerm} 
        showFavoritesOnly={showFavoritesOnly}
    />
  ), [selectedCategory, itemSearchTerm, showFavoritesOnly, itemDisplayMode]);

  const useScrollability = (scrollRef: React.RefObject<HTMLDivElement>, contentRef?: React.RefObject<HTMLDivElement>) => {
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    useEffect(() => {
        const scrollArea = scrollRef.current;
        if (!scrollArea) return;

        const check = () => {
            setCanScrollUp(scrollArea.scrollTop > 0);
            setCanScrollDown(scrollArea.scrollTop < scrollArea.scrollHeight - scrollArea.clientHeight -1); // -1 for pixel rounding
        };

        check();
        
        let observer: ResizeObserver;
        if (contentRef?.current) {
            observer = new ResizeObserver(check);
            observer.observe(contentRef.current);
        }
        
        scrollArea.addEventListener('scroll', check);

        return () => {
            if (observer && contentRef?.current) {
                observer.unobserve(contentRef.current);
            }
            scrollArea.removeEventListener('scroll', check);
        };
    }, [scrollRef, contentRef]);

    return { canScrollUp, canScrollDown };
  };

  const itemScrollability = useScrollability(itemScrollAreaRef, itemContentRef);
  const categoryScrollability = useScrollability(categoryScrollAreaRef);

  useEffect(() => setCanScrollItemsUp(itemScrollability.canScrollUp), [itemScrollability.canScrollUp]);
  useEffect(() => setCanScrollItemsDown(itemScrollability.canScrollDown), [itemScrollability.canScrollDown]);
  useEffect(() => setCanScrollCategoriesUp(categoryScrollability.canScrollUp), [categoryScrollability.canScrollUp]);
  useEffect(() => setCanScrollCategoriesDown(categoryScrollability.canScrollDown), [categoryScrollability.canScrollDown]);

  const createScroller = (scrollRef: React.RefObject<HTMLDivElement>, intervalRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
      const handleScroll = (direction: 'up' | 'down') => {
        const scrollArea = scrollRef.current;
        if (scrollArea) {
          const scrollAmount = scrollArea.clientHeight * 0.8;
          scrollArea.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
      };

      const startScrolling = (direction: 'up' | 'down') => {
        stopScrolling();
        handleScroll(direction);
        intervalRef.current = setInterval(() => handleScroll(direction), 300);
      };

      const stopScrolling = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };

      return { startScrolling, stopScrolling };
  };
  
  const itemScroller = createScroller(itemScrollAreaRef, itemScrollIntervalRef);
  const categoryScroller = createScroller(categoryScrollAreaRef, categoryScrollIntervalRef);

  useEffect(() => {
    if (targetInput?.name === 'item-search') {
      setItemSearchTerm(inputValue);
    }
  }, [inputValue, targetInput]);

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
    setTargetInput({
      value: itemSearchTerm,
      name: 'item-search',
      ref: searchInputRef,
    });
  };
  
  const backgroundColor = isClient ? hexToRgba(directSaleBackgroundColor, directSaleBgOpacity) : 'transparent';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-4 p-4" style={{ backgroundColor }}>
          <div className="md:col-span-3 lg:col-span-2 border bg-card flex flex-col overflow-hidden rounded-lg">
            <CategoryList
              scrollRef={categoryScrollAreaRef}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={handleToggleFavorites}
              canScrollUp={canScrollCategoriesUp}
              canScrollDown={canScrollCategoriesDown}
              onScrollUp={() => categoryScroller.startScrolling('up')}
              onScrollDown={() => categoryScroller.startScrolling('down')}
              onStopScroll={categoryScroller.stopScrolling}
            />
          </div>

          <div className={cn(
            "md:col-span-5 lg:col-span-6 flex flex-col transition-opacity overflow-hidden border bg-card rounded-lg",
             isKeypadOpen && 'opacity-50 pointer-events-none'
          )}>
            <div className="p-4 border-b">
                 <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight font-headline flex-shrink-0">
                      {pageTitle}
                    </h2>
                    {showFavoritesOnly && <Badge variant="secondary"><Star className="h-3 w-3 mr-1"/>Favoris</Badge>}
                    {selectedCategory === 'popular' && <Badge variant="secondary"><Trophy className="h-3 w-3 mr-1"/>Populaires</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                    <div className="relative w-full max-w-sm flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <div className="flex items-center gap-1">
                      {(canScrollItemsUp || canScrollItemsDown) && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onMouseDown={() => itemScroller.startScrolling('up')} 
                            onMouseUp={itemScroller.stopScrolling} 
                            onMouseLeave={itemScroller.stopScrolling}
                            onTouchStart={() => itemScroller.startScrolling('up')}
                            onTouchEnd={itemScroller.stopScrolling}
                            disabled={!canScrollItemsUp}
                          >
                              <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onMouseDown={() => itemScroller.startScrolling('down')} 
                            onMouseUp={itemScroller.stopScrolling} 
                            onMouseLeave={itemScroller.stopScrolling}
                            onTouchStart={() => itemScroller.startScrolling('down')}
                            onTouchEnd={itemScroller.stopScrolling}
                            disabled={!canScrollItemsDown}
                          >
                              <ArrowDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button 
                        variant="outline" 
                        onClick={() => setHeldOpen(true)}
                        disabled={order.length > 0}
                        className={cn(
                            "flex-shrink-0",
                            (heldOrders?.length || 0) > 0 && order.length === 0 && 'animate-pulse-button'
                        )}
                    >
                        <Hand className="mr-2 h-4 w-4"/>
                        Tickets
                        <Badge variant="secondary" className="ml-2">{heldOrders?.length || 0}</Badge>
                    </Button>
                   </div>
                </div>
            </div>
            <ScrollArea className="flex-1" viewportRef={itemScrollAreaRef}>
                <div className="p-4">
                  {isClient ? filteredItems : <Skeleton className="h-full w-full" />}
                </div>
            </ScrollArea>
          </div>

          <div className="md:col-span-4 lg:col-span-4 border flex flex-col overflow-hidden rounded-lg">
            <OrderSummary />
          </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
      <SerialNumberModal />
      <VariantSelectionModal />
    </>
  );
}
