
'use client';

import React, { useState, useMemo } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PosPage() {
  const { setSelectedTableById, heldOrders, isKeypadOpen } = usePos();

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all' | null>('all');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');

  React.useEffect(() => {
    setSelectedTableById(tableId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const pageTitle = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === null) return 'Tous les articles';
    if (typeof selectedCategory === 'object') return selectedCategory.name;
    return 'Articles';
  }, [selectedCategory]);

  const handleSelectCategory = (category: Category | 'all' | null) => {
    setSelectedCategory(category);
  }

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(prev => !prev);
  }

  return (
    <>
      <div className="h-full bg-muted/40 grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-3 lg:col-span-2 border-r bg-card overflow-y-auto">
            <CategoryList
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={handleToggleFavorites}
            />
          </div>

          <div className={cn(
            "md:col-span-5 lg:col-span-6 flex flex-col h-full transition-opacity",
             isKeypadOpen && 'opacity-50 pointer-events-none'
          )}>
            <div className="p-4 border-b bg-card">
                 <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight font-headline flex-shrink-0">
                      {pageTitle}
                    </h2>
                    {showFavoritesOnly && <Badge variant="secondary"><Star className="h-3 w-3 mr-1"/>Favoris</Badge>}
                  </div>
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un article..."
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setHeldOpen(true)} className="flex-shrink-0">
                    <Hand className="mr-2 h-4 w-4"/>
                    Tickets en attente
                    {heldOrders.length > 0 && <Badge variant="secondary" className="ml-2">{heldOrders.length}</Badge>}
                  </Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <ItemList 
                  category={selectedCategory} 
                  searchTerm={itemSearchTerm} 
                  showFavoritesOnly={showFavoritesOnly}
                />
            </div>
          </div>

          <div className="md:col-span-4 lg:col-span-4 border-l bg-card overflow-y-auto">
            <OrderSummary />
          </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
    </>
  );
}
