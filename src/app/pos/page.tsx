
'use client';

import React, { useState } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { HeldOrdersDrawer } from './components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function PosPage() {
  const { setSelectedTableById, heldOrders } = usePos();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isHeldOpen, setHeldOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');

  React.useEffect(() => {
    setSelectedTableById(tableId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);


  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] flex-1 bg-muted/40">
        <div className="grid h-full w-full grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-3 lg:col-span-2 border-r bg-card">
            <CategoryList
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          <div className="md:col-span-5 lg:col-span-6 overflow-y-auto p-4">
             <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-2xl font-semibold tracking-tight font-headline flex-shrink-0">
                {selectedCategory ? selectedCategory.name : 'Tous les articles'}
              </h2>
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
            <ItemList category={selectedCategory} searchTerm={itemSearchTerm} />
          </div>

          <div className="md:col-span-4 lg:col-span-4 border-l bg-card">
            <OrderSummary />
          </div>
        </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
    </>
  );
}
