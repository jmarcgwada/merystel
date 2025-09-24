
"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { OrderItem, Table, Item, Category, Customer, Sale, Payment, PaymentMethod } from '@/lib/types';
import { mockItems, mockTables, mockCategories, mockCustomers, mockSales, mockPaymentMethods } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: OrderItem['id']) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  clearOrder: () => void;
  orderTotal: number;

  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  addTable: (name: string) => void;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  updateTableOrder: (tableId: string, order: OrderItem[]) => void;

  sales: Sale[];
  recordSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const { toast } = useToast();

  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder((currentOrder) => currentOrder.filter((item) => item.id !== itemId));
  }, []);

  const addToOrder = useCallback((itemId: OrderItem['id']) => {
    const itemToAdd = items.find((i) => i.id === itemId);
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
    toast({ title: `${itemToAdd.name} ajouté à la commande` });
  }, [items, toast]);

  const updateQuantity = useCallback((itemId: OrderItem['id'], quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
    setOrder((currentOrder) =>
      currentOrder.map((item) =>
        item.id === itemId ? { ...item, quantity, total: item.price * quantity } : item
      )
    );
  }, [removeFromOrder]);
  
  const clearOrder = useCallback(() => {
    setOrder([]);
  }, []);

  const orderTotal = useMemo(() => {
    return order.reduce((sum, item) => sum + item.total, 0);
  }, [order]);
  
  const updateTableOrder = useCallback((tableId: string, orderData: OrderItem[]) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === tableId ? { ...table, order: orderData, status: orderData.length > 0 ? 'occupied' : 'available' } : table
      )
    );
  }, []);

  const addTable = useCallback((name: string) => {
    const newTable: Table = {
      id: `t${Date.now()}`,
      name,
      status: 'available',
      order: [],
    };
    setTables(prevTables => [...prevTables, newTable]);
  }, []);

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, []);

  const updateCategory = useCallback((category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  }, []);
  
  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    // Also delete items in that category
    setItems(prev => prev.filter(i => i.categoryId !== categoryId));
    toast({ title: 'Catégorie supprimée' });
  }, [toast]);

  const addItem = useCallback((item: Item) => {
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((item: Item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
  }, []);
  
  const deleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    toast({ title: 'Article supprimé' });
  }, [toast]);

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  }, []);

  const updateCustomer = useCallback((customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
  }, []);
  
  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    toast({ title: 'Client supprimé' });
  }, [toast]);

  const recordSale = useCallback((saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      date: new Date(),
    };
    setSales(prevSales => [newSale, ...prevSales]);
  }, []);

  const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`
    };
    setPaymentMethods(prev => [...prev, newMethod]);
    toast({ title: 'Moyen de paiement ajouté' });
  }, [toast]);

  const updatePaymentMethod = useCallback((method: PaymentMethod) => {
    setPaymentMethods(prev => prev.map(m => m.id === method.id ? method : m));
    toast({ title: 'Moyen de paiement modifié' });
  }, [toast]);

  const deletePaymentMethod = useCallback((methodId: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
    toast({ title: 'Moyen de paiement supprimé' });
  }, [toast]);

  const value = useMemo(() => ({
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    orderTotal,
    items,
    addItem,
    updateItem,
    deleteItem,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    updateTableOrder,
    sales,
    recordSale,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  }), [
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    orderTotal,
    items,
    addItem,
    updateItem,
    deleteItem,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    updateTableOrder,
    sales,
    recordSale,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  ]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos doit être utilisé dans un PosProvider');
  }
  return context;
}
