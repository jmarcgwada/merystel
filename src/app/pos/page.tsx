'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from '../../pos/components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category, SpecialCategory, Item, OrderItem } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search, Star, Trophy, ArrowDown, ArrowUp, Keyboard as KeyboardIcon, LayoutGrid, List, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboard } from '@/contexts/keyboard-context';
import { SerialNumberModal } from './components/serial-number-modal';
import { VariantSelectionModal } from './components/variant-selection-modal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

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
    addToOrder,
    items,
    setOrder,
    clearOrder,
    toast,
  } = usePos();
  const [isClient, setIsClient] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | SpecialCategory | null>('all');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  
  const { setTargetInput, inputValue, targetInput, clearInput, isOpen: isKeyboardOpen } = useKeyboard();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemScrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleItemClick = (item: any) => {
    addToOrder(item.id);
    if (isKeyboardOpen) {
      clearInput();
    }
  };

  const generateRandomOrder = useCallback(() => {
    if (!items?.length) {
      toast({
        variant: 'destructive',
        title: 'Aucun article',
        description: 'Veuillez ajouter des articles pour générer une vente.',
      });
      return;
    }

    clearOrder();

    const numberOfItems = Math.floor(Math.random() * 4) + 2; // 2 to 5 items
    const newOrder: OrderItem[] = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 quantity
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder) {
            newOrder.push({
                itemId: randomItem.id,
                id: randomItem.id,
                name: randomItem.name,
                price: randomItem.price,
                vatId: randomItem.vatId,
                quantity,
                total: randomItem.price * quantity,
                discount: 0,
                barcode: randomItem.barcode,
            });
        }
    }
    setOrder(newOrder);

    toast({
      title: 'Vente Aléatoire Générée',
      description: `La commande a été remplie avec ${newOrder.length} articles.`,
    });
  }, [items, clearOrder, setOrder, toast]);
  
  useEffect(() => {
    // When keyboard closes, clear the search term if it was the target
    if (!isKeyboardOpen && targetInput?.name === 'item-search') {
      setItemSearchTerm('');
    }
  }, [isKeyboardOpen, targetInput]);

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
  
  const handleItemScroll = (direction: 'up' | 'down') => {
    const scrollArea = itemScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      const scrollAmount = scrollArea.clientHeight * 0.8;
      scrollArea.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  
  const backgroundColor = isClient ? hexToRgba(directSaleBackgroundColor, directSaleBgOpacity) : 'transparent';

  return (
    <>
      <div className="h-full p-4" style={{ backgroundColor }}>
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
            <div className={cn("bg-card flex flex-col h-full overflow-hidden rounded-l-lg transition-opacity", isKeypadOpen && 'opacity-50 pointer-events-none')}>
              <CategoryList
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                showFavoritesOnly={showFavoritesOnly}
                onToggleFavorites={handleToggleFavorites}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
             <div className={cn(
              "flex flex-col transition-opacity h-full overflow-hidden bg-card",
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
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleItemScroll('up')}
                          >
                              <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleItemScroll('down')}
                          >
                              <ArrowDown className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                       <Button variant="outline" size="icon" onClick={generateRandomOrder} title="Générer une vente aléatoire">
                          <Sparkles className="h-4 w-4" />
                        </Button>
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
              <div className="flex-1 relative" ref={itemScrollAreaRef}>
                <ScrollArea className="absolute inset-0">
                    <div className="p-4">
                      {isClient ? (
                          <ItemList
                              ref={null} 
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
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={32} minSize={25}>
            <div className="flex flex-col h-full overflow-hidden rounded-r-lg">
              <OrderSummary />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
      <SerialNumberModal />
      <VariantSelectionModal />
    </>
  );
}
