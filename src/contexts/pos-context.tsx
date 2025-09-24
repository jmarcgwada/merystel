
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { OrderItem, Table } from '@/lib/types';
import { mockItems, mockTables } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (item: OrderItem['id']) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  clearOrder: () => void;
  orderTotal: number;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  addTable: (name: string) => void;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  updateTableOrder: (tableId: string, order: OrderItem[]) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const { toast } = useToast();

  const addToOrder = (itemId: OrderItem['id']) => {
    const itemToAdd = mockItems.find((i) => i.id === itemId);
    if (!itemToAdd) return;

    setOrder((currentOrder) => {
      const existingItem = currentOrder.find((item) => item.id === itemId);
      if (existingItem) {
        return currentOrder.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1, total: item.price * (item.quantity + 1) } : item
        );
      }
      return [...currentOrder, { ...itemToAdd, quantity: 1, total: itemToAdd.price }];
    });
    toast({ title: `${itemToAdd.name} added to order` });
  };

  const removeFromOrder = (itemId: OrderItem['id']) => {
    setOrder((currentOrder) => currentOrder.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: OrderItem['id'], quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
    setOrder((currentOrder) =>
      currentOrder.map((item) =>
        item.id === itemId ? { ...item, quantity, total: item.price * quantity } : item
      )
    );
  };
  
  const clearOrder = () => {
    setOrder([]);
  };

  const orderTotal = useMemo(() => {
    return order.reduce((sum, item) => sum + item.total, 0);
  }, [order]);
  
  const updateTableOrder = (tableId: string, orderData: OrderItem[]) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === tableId ? { ...table, order: orderData, status: orderData.length > 0 ? 'occupied' : 'available' } : table
      )
    );
  };

  const addTable = (name: string) => {
    const newTable: Table = {
      id: `t${tables.length + 1}`,
      name,
      status: 'available',
      order: [],
    };
    setTables(prevTables => [...prevTables, newTable]);
  };

  const value = {
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    orderTotal,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    updateTableOrder,
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
