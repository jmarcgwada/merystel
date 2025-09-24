

"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { OrderItem, Table, Item, Category, Customer, Sale, Payment, PaymentMethod, HeldOrder, VatRate } from '@/lib/types';
import { mockItems, mockTables, mockCategories, mockCustomers, mockSales, mockPaymentMethods, mockVatRates } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: OrderItem['id']) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  clearOrder: () => void;
  orderTotal: number;
  orderTax: number;

  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  toggleItemFavorite: (itemId: string) => void;
  
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;

  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  addTable: (name: string) => void;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setSelectedTableById: (tableId: string | null) => void;
  updateTableOrder: (tableId: string, order: OrderItem[]) => void;

  sales: Sale[];
  recordSale: (sale: Omit<Sale, 'id' | 'date' | 'ticketNumber'>) => void;
  
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;

  vatRates: VatRate[];
  addVatRate: (vatRate: Omit<VatRate, 'id'>) => void;
  updateVatRate: (vatRate: VatRate) => void;
  deleteVatRate: (vatRateId: string) => void;

  heldOrders: HeldOrder[];
  holdOrder: () => void;
  recallOrder: (orderId: string) => void;
  deleteHeldOrder: (orderId: string) => void;
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
  const [vatRates, setVatRates] = useState<VatRate[]>(mockVatRates);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
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

  const setSelectedTableById = useCallback((tableId: string | null) => {
    const table = tableId ? tables.find(t => t.id === tableId) || null : null;
    setSelectedTable(table);
    if (table) {
      setOrder(table.order);
    } else {
      clearOrder();
    }
  }, [tables, clearOrder]);

  const orderTotal = useMemo(() => {
    return order.reduce((sum, item) => sum + item.total, 0);
  }, [order]);
  
  const orderTax = useMemo(() => {
    return order.reduce((sum, item) => {
        const vat = vatRates.find(v => v.id === item.vatId);
        const taxForItem = item.total * ((vat?.rate || 0) / 100);
        return sum + taxForItem;
    }, 0);
  }, [order, vatRates]);
  
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
    setItems(prev => prev.filter(i => i.categoryId !== categoryId));
    toast({ title: 'Catégorie supprimée' });
  }, [toast]);
  
  const toggleCategoryFavorite = useCallback((categoryId: string) => {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, isFavorite: !c.isFavorite } : c));
  }, []);

  const addItem = useCallback((itemData: Omit<Item, 'id'>) => {
    const newItem: Item = { ...itemData, id: `item${Date.now()}` };
    setItems(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((item: Item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
  }, []);
  
  const deleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    toast({ title: 'Article supprimé' });
  }, [toast]);

  const toggleItemFavorite = useCallback((itemId: string) => {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isFavorite: !i.isFavorite } : i));
  }, []);

  const addCustomer = useCallback((customer: Customer) => {
    const newCustomer = { ...customer, id: `cust${Date.now()}`};
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
  }, []);
  
  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    toast({ title: 'Client supprimé' });
  }, [toast]);

  const recordSale = useCallback((saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>) => {
    const today = new Date();
    const datePrefix = format(today, 'yyyyMMdd');
    const todaysSalesCount = sales.filter(s => s.ticketNumber.startsWith(datePrefix)).length;
    const ticketNumber = `${datePrefix}-${(todaysSalesCount + 1).toString().padStart(4, '0')}`;

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      date: today,
      ticketNumber,
    };
    setSales(prevSales => [newSale, ...prevSales]);
  }, [sales]);

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

  const addVatRate = useCallback((vatRate: Omit<VatRate, 'id'>) => {
    const newVatRate: VatRate = { ...vatRate, id: `vat-${Date.now()}` };
    setVatRates(prev => [...prev, newVatRate]);
    toast({ title: 'Taux de TVA ajouté' });
  }, [toast]);
  
  const updateVatRate = useCallback((vatRate: VatRate) => {
    setVatRates(prev => prev.map(v => v.id === vatRate.id ? vatRate : v));
    toast({ title: 'Taux de TVA modifié' });
  }, [toast]);

  const deleteVatRate = useCallback((vatRateId: string) => {
    setVatRates(prev => prev.filter(v => v.id !== vatRateId));
    toast({ title: 'Taux de TVA supprimé' });
  }, [toast]);


  const holdOrder = useCallback(() => {
    if(order.length === 0) return;
    const newHeldOrder: HeldOrder = {
      id: `held-${Date.now()}`,
      date: new Date(),
      items: order,
      total: orderTotal + orderTax,
    };
    setHeldOrders(prev => [newHeldOrder, ...prev]);
    clearOrder();
    if (selectedTable) {
        setSelectedTable(null);
    }
    toast({ title: 'Commande mise en attente.' });
  }, [order, orderTotal, orderTax, clearOrder, selectedTable, toast]);

  const recallOrder = useCallback((orderId: string) => {
    const orderToRecall = heldOrders.find(o => o.id === orderId);
    if (orderToRecall) {
      if (selectedTable) {
        setSelectedTable(null);
      }
      setOrder(orderToRecall.items);
      setHeldOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ title: 'Commande rappelée.' });
    }
  }, [heldOrders, toast, selectedTable]);

  const deleteHeldOrder = useCallback((orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    toast({ title: 'Ticket en attente supprimé.'});
  }, [toast]);

  const value = useMemo(() => ({
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    orderTotal,
    orderTax,
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleItemFavorite,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryFavorite,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    setSelectedTableById,
    updateTableOrder,
    sales,
    recordSale,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    vatRates,
    addVatRate,
    updateVatRate,
    deleteVatRate,
    heldOrders,
    holdOrder,
    recallOrder,
    deleteHeldOrder,
  }), [
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    orderTotal,
    orderTax,
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleItemFavorite,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryFavorite,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    setSelectedTableById,
    updateTableOrder,
    sales,
    recordSale,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    vatRates,
    addVatRate,
    updateVatRate,
    deleteVatRate,
    heldOrders,
    holdOrder,
    recallOrder,
    deleteHeldOrder,
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
