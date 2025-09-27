

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category, SpecialCategory } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search, Star, Trophy, Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboard } from '@/contexts/keyboard-context';

export default function PosPage() {
  const { setSelectedTableById, heldOrders, isKeypadOpen, popularItemsCount, selectedTable, directSaleBackgroundColor } = usePos();

  const [selectedCategory, setSelectedCategory] = useState<Category | SpecialCategory | null>('all');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  
  const { showKeyboard, setTargetInput, inputValue, targetInput } = useKeyboard();

  useEffect(() => {
    if (targetInput?.name === 'item-search') {
      setItemSearchTerm(inputValue);
    }
  }, [inputValue, targetInput]);

  useEffect(() => {
    if(tableId) {
      setSelectedTableById(tableId);
    } else {
      // If we are not in restaurant mode (no tableId), ensure selectedTable is null.
      if (selectedTable) {
        setSelectedTableById(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

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

  const handleSearchClick = () => {
    setTargetInput({
      value: itemSearchTerm,
      name: 'item-search',
    });
    showKeyboard();
  };
  
  const backgroundColor = selectedTable ? 'transparent' : directSaleBackgroundColor;

  return (
    <>
      <div className="h-full grid grid-cols-1 md:grid-cols-12" style={{ backgroundColor }}>
          <div className="md:col-span-3 lg:col-span-2 border-r bg-card flex flex-col overflow-hidden">
            <CategoryList
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={handleToggleFavorites}
            />
          </div>

          <div className={cn(
            "md:col-span-5 lg:col-span-6 flex flex-col transition-opacity overflow-hidden",
             isKeypadOpen && 'opacity-50 pointer-events-none'
          )}>
            <div className="p-4 border-b bg-card">
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
                            placeholder="Rechercher un article..."
                            value={itemSearchTerm}
                            onChange={(e) => setItemSearchTerm(e.target.value)}
                            className="pl-9 pr-10"
                        />
                        <Button variant="ghost" size="icon" onClick={handleSearchClick} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                            <Keyboard className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setHeldOpen(true)} 
                        className={cn(
                            "flex-shrink-0",
                            heldOrders && heldOrders.length > 0 && 'animate-pulse-button'
                        )}
                    >
                        <Hand className="mr-2 h-4 w-4"/>
                        Tickets
                        {heldOrders && heldOrders.length > 0 && <Badge variant="secondary" className="ml-2">{heldOrders.length}</Badge>}
                    </Button>
                  </div>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4">
                  <ItemList 
                    category={selectedCategory} 
                    searchTerm={itemSearchTerm} 
                    showFavoritesOnly={showFavoritesOnly}
                  />
                </div>
            </ScrollArea>
          </div>

          <div className="md:col-span-4 lg:col-span-4 border-l flex flex-col overflow-hidden">
            <OrderSummary />
          </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
    </>
  );
}
