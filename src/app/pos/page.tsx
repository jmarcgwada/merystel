'use client';

import React, { useState, useEffect } from 'react';
import { CategoryList } from './components/category-list';
import { ItemList } from './components/item-list';
import { OrderSummary } from './components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { Category } from '@/lib/types';
import { mockCategories } from '@/lib/mock-data';
import { useSearchParams } from 'next/navigation';

export default function PosPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    mockCategories[0] || null
  );
  const { selectedTable, setSelectedTable, tables, order, setOrder, clearOrder } = usePos();
  
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
  }, [tableId, tables]);


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
