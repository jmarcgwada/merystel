

"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { OrderItem, Table, Item, Category, Customer, Sale, Payment, PaymentMethod, HeldOrder, VatRate } from '@/lib/types';
import { mockItems, mockTables, mockCategories, mockCustomers, mockSales, mockPaymentMethods, mockVatRates } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: OrderItem['id']) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  applyDiscount: (itemId: OrderItem['id'], value: number, type: 'percentage' | 'fixed') => void;
  clearOrder: () => void;
  orderTotal: number;
  orderTax: number;
  isKeypadOpen: boolean;
  setIsKeypadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentSaleId: string | null;
  setCurrentSaleId: React.Dispatch<React.SetStateAction<string | null>>;

  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  toggleItemFavorite: (itemId: string) => void;
  
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  setDefaultCustomer: (customerId: string) => void;

  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  addTable: (name: string) => void;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setSelectedTableById: (tableId: string | null) => void;
  updateTableOrder: (tableId: string, order: OrderItem[]) => void;
  saveTableOrderAndExit: (tableId: string, order: OrderItem[]) => void;
  promoteTableToTicket: (tableId: string) => void;

  sales: Sale[];
  recordSale: (sale: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'status'>, saleIdToUpdate?: string) => void;
  
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;

  vatRates: VatRate[];
  addVatRate: (vatRate: Omit<VatRate, 'id' | 'code'>) => void;
  updateVatRate: (vatRate: VatRate) => void;
  deleteVatRate: (vatRateId: string) => void;

  heldOrders: HeldOrder[];
  holdOrder: () => void;
  recallOrder: (orderId: string) => void;
  deleteHeldOrder: (orderId: string) => void;

  showTicketImages: boolean;
  setShowTicketImages: React.Dispatch<React.SetStateAction<boolean>>;

  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;
  holdOrderAndNavigate: () => void;
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
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [showTicketImages, setShowTicketImages] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const clearOrder = useCallback(() => {
    setOrder([]);
    setCurrentSaleId(null);
  }, []);

  const showNavConfirm = (url: string) => {
    setNextUrl(url);
    setNavConfirmOpen(true);
  };

  const closeNavConfirm = () => {
    setNextUrl(null);
    setNavConfirmOpen(false);
  };

  const confirmNavigation = () => {
    clearOrder();
    if (nextUrl) {
      router.push(nextUrl);
    }
    closeNavConfirm();
  };


  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder((currentOrder) => currentOrder.filter((item) => item.id !== itemId));
  }, []);

  const addToOrder = useCallback((itemId: OrderItem['id']) => {
    const itemToAdd = items.find((i) => i.id === itemId);
    if (!itemToAdd) return;

    setOrder((currentOrder) => {
      const existingItemIndex = currentOrder.findIndex((item) => item.id === itemId);
      
      if (existingItemIndex !== -1) {
        const existingItem = currentOrder[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        const updatedItem = { ...existingItem, quantity: newQuantity, total: (existingItem.price * newQuantity) - (existingItem.discount || 0) };
        
        const newOrder = [...currentOrder];
        newOrder.splice(existingItemIndex, 1);
        return [updatedItem, ...newOrder];

      } else {
        const newItem: OrderItem = { ...itemToAdd, quantity: 1, total: itemToAdd.price, discount: 0 };
        return [newItem, ...currentOrder];
      }
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
        item.id === itemId ? { ...item, quantity, total: (item.price * quantity) - (item.discount || 0) } : item
      )
    );
  }, [removeFromOrder]);
  
  const updateQuantityFromKeypad = useCallback((itemId: OrderItem['id'], quantity: number) => {
     if (quantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
     setOrder((currentOrder) =>
      currentOrder.map((item) =>
        item.id === itemId ? { ...item, quantity, total: (item.price * quantity) - (item.discount || 0) } : item
      )
    );
  }, [removeFromOrder]);

  const applyDiscount = useCallback((itemId: OrderItem['id'], value: number, type: 'percentage' | 'fixed') => {
      setOrder(currentOrder => currentOrder.map(item => {
          if (item.id === itemId) {
              let discountAmount = 0;
              let discountPercent: number | undefined = undefined;

              if (type === 'percentage') {
                  discountAmount = (item.price * item.quantity) * (value / 100);
                  discountPercent = value;
              } else {
                  discountAmount = value;
              }

              if (discountAmount < 0) discountAmount = 0;
              if (value === 0) discountPercent = undefined;
              
              const newTotal = (item.price * item.quantity) - discountAmount;

              return {
                  ...item,
                  discount: discountAmount,
                  discountPercent,
                  total: newTotal > 0 ? newTotal : 0,
              }
          }
          return item;
      }));
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

  const saveTableOrderAndExit = useCallback((tableId: string, orderData: OrderItem[]) => {
    updateTableOrder(tableId, orderData);
    toast({ title: 'Table sauvegardée' });
    clearOrder();
    setSelectedTable(null);
  }, [updateTableOrder, clearOrder, toast]);
  
  const recordSale = useCallback((saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber'> & { status: Sale['status'] }, saleIdToUpdate?: string) => {
    if (saleIdToUpdate) {
        const saleToUpdate = sales.find(s => s.id === saleIdToUpdate);
        setSales(prevSales => 
            prevSales.map(sale => 
                sale.id === saleIdToUpdate 
                    ? { ...sale, ...saleData, status: 'paid', tableId: saleToUpdate?.tableId }
                    : sale
            )
        );
         const updatedSale = sales.find(s => s.id === saleIdToUpdate);
         return updatedSale;
    } else {
        const today = new Date();
        const datePrefix = format(today, 'yyyyMMdd');
        const todaysSalesCount = sales.filter(s => s.ticketNumber.startsWith(datePrefix)).length;
        const ticketNumber = `${datePrefix}-0001`.slice(0, - (todaysSalesCount + 1).toString().length) + (todaysSalesCount + 1).toString()

        const newSale: Sale = {
          ...saleData,
          id: `sale-${Date.now()}`,
          date: today,
          ticketNumber,
          status: 'paid',
        };
        setSales(prevSales => [newSale, ...prevSales]);
        return newSale;
    }
}, [sales]);


  const promoteTableToTicket = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.order.length === 0) return;

    const subtotal = table.order.reduce((sum, item) => sum + item.total, 0);
    const tax = table.order.reduce((sum, item) => {
      const vat = vatRates.find(v => v.id === item.vatId);
      const taxForItem = item.total * ((vat?.rate || 0) / 100);
      return sum + taxForItem;
    }, 0);
    const total = subtotal + tax;

    const newHeldOrder: HeldOrder = {
        id: `held-${table.id}-${Date.now()}`,
        date: new Date(),
        items: table.order,
        total: total,
        tableName: table.name,
    };

    setHeldOrders(prev => [newHeldOrder, ...prev]);

    setTables(prevTables => 
      prevTables.map(t => 
        t.id === tableId ? { ...t, order: [], status: 'available' } : t
      )
    );
    
    setSelectedTable(null);
    clearOrder();

    toast({ title: 'Table transformée en ticket', description: 'Le ticket est maintenant en attente dans le point de vente.' });
  }, [tables, vatRates, toast, clearOrder]);


  const addTable = useCallback((name: string) => {
    const newTable: Table = {
      id: `t-${Date.now()}`,
      name,
      status: 'available',
      order: [],
    };
    setTables(prevTables => [...prevTables, newTable]);
  }, []);

  const addCategory = useCallback((categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...categoryData, id: `cat-${Date.now()}`};
    setCategories(prev => [...prev, newCategory]);
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
    const newItem: Item = { ...itemData, id: `item-${Date.now()}`, showImage: itemData.showImage ?? true };
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

  const addCustomer = useCallback((customerData: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customerData, id: `cust-${Date.now()}`};
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

  const setDefaultCustomer = useCallback((customerId: string) => {
    setCustomers(prev => 
      prev.map(c => ({
        ...c,
        isDefault: c.id === customerId ? !c.isDefault : false
      }))
    );
    toast({ title: 'Client par défaut modifié' });
  }, [toast]);


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

  const addVatRate = useCallback((vatRate: Omit<VatRate, 'id' | 'code'>) => {
    const newCode = Math.max(0, ...vatRates.map(v => v.code)) + 1;
    const newVatRate: VatRate = { ...vatRate, id: `vat-${Date.now()}`, code: newCode };
    setVatRates(prev => [...prev, newVatRate]);
    toast({ title: 'Taux de TVA ajouté' });
  }, [vatRates, toast]);
  
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
      id: currentSaleId || `held-${Date.now()}`,
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
  }, [order, orderTotal, orderTax, clearOrder, selectedTable, toast, currentSaleId]);

  const holdOrderAndNavigate = () => {
    holdOrder();
    if (nextUrl) {
      router.push(nextUrl);
    }
    closeNavConfirm();
  };

  const recallOrder = useCallback((orderId: string) => {
    const orderToRecall = heldOrders.find(o => o.id === orderId);
    if (orderToRecall) {
      if (selectedTable) {
        setSelectedTable(null);
      }
      setOrder(orderToRecall.items);
      
      const isPendingSale = sales.some(s => s.id === orderId && s.status === 'paid');
      if (isPendingSale) {
        setCurrentSaleId(orderId);
      } else {
        setCurrentSaleId(null);
      }

      setHeldOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ title: 'Commande rappelée.' });
    }
  }, [heldOrders, toast, selectedTable, sales]);

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
    updateQuantityFromKeypad,
    applyDiscount,
    clearOrder,
    orderTotal,
    orderTax,
    isKeypadOpen,
    setIsKeypadOpen,
    currentSaleId,
    setCurrentSaleId,
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
    setDefaultCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    setSelectedTableById,
    updateTableOrder,
    saveTableOrderAndExit,
    promoteTableToTicket,
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
    showTicketImages,
    setShowTicketImages,
    isNavConfirmOpen,
    showNavConfirm,
    closeNavConfirm,
    confirmNavigation,
    holdOrderAndNavigate,
  }), [
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    updateQuantityFromKeypad,
    applyDiscount,
    clearOrder,
    orderTotal,
    orderTax,
    isKeypadOpen,
    setIsKeypadOpen,
    currentSaleId,
    setCurrentSaleId,
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
    setDefaultCustomer,
    tables,
    setTables,
    addTable,
    selectedTable,
    setSelectedTable,
    setSelectedTableById,
    updateTableOrder,
    saveTableOrderAndExit,
    promoteTableToTicket,
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
    showTicketImages,
    setShowTicketImages,
isNavConfirmOpen, 
closeNavConfirm, 
confirmNavigation, 
holdOrderAndNavigate, 
nextUrl, 
router
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
