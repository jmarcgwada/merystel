
'use client';

import React, { useState, useEffect } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

export default function PosPage() {
  const { categories, selectedTable, setSelectedTable, tables, setOrder, clearOrder } = usePos();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    categories[0] || null
  );
  
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');

  useEffect(() => {
    if (tableId) {
      const table = tables.find(t => t.id === tableId);
      if (table) {
        setSelectedTable(table);
        setOrder(table.order);
      }
    } else {
        // If not a table order, ensure we are not using a previous table's context
        if(selectedTable) {
            clearOrder();
        }
        setSelectedTable(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, tables, setOrder, setSelectedTable, clearOrder, selectedTable]);

  useEffect(() => {
    if(!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory])


  return (
    <div className="flex h-[calc(100vh-4rem)] flex-1 bg-muted/40">
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-3 lg:col-span-2 border-r bg-card">
          <CategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className="md:col-span-5 lg:col-span-6 overflow-y-auto p-4">
          <ItemList category={selectedCategory} />
        </div>

        <div className="md:col-span-4 lg:col-span-4 border-l bg-card">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
