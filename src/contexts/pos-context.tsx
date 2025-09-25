
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import type {
  OrderItem,
  Table,
  Item,
  Category,
  Customer,
  Sale,
  PaymentMethod,
  HeldOrder,
  VatRate,
  CompanyInfo,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  deleteDoc,
  addDoc,
  setDoc,
} from 'firebase/firestore';
import type { CombinedUser } from '@/firebase/auth/use-user';

interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: OrderItem['id']) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  applyDiscount: (
    itemId: OrderItem['id'],
    value: number,
    type: 'percentage' | 'fixed'
  ) => void;
  clearOrder: () => void;
  orderTotal: number;
  orderTax: number;
  isKeypadOpen: boolean;
  setIsKeypadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentSaleId: string | null;
  setCurrentSaleId: React.Dispatch<React.SetStateAction<string | null>>;
  currentSaleContext: Partial<Sale> | null;
  recentlyAddedItemId: string | null;
  setRecentlyAddedItemId: React.Dispatch<React.SetStateAction<string | null>>;

  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  toggleItemFavorite: (itemId: string) => void;
  toggleFavoriteForList: (itemIds: string[], setFavorite: boolean) => void;
  popularItems: Item[];

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
  addTable: (
    tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>
  ) => void;
  updateTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  forceFreeTable: (tableId: string) => void;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setSelectedTableById: (tableId: string | null) => void;
  updateTableOrder: (tableId: string, order: OrderItem[]) => void;
  saveTableOrderAndExit: (tableId: string, order: OrderItem[]) => void;
  promoteTableToTicket: (tableId: string) => void;

  sales: Sale[];
  recordSale: (
    sale: Omit<Sale, 'id' | 'date' | 'ticketNumber'>,
    saleIdToUpdate?: string
  ) => void;

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
  popularItemsCount: number;
  setPopularItemsCount: React.Dispatch<React.SetStateAction<number>>;
  itemCardOpacity: number;
  setItemCardOpacity: React.Dispatch<React.SetStateAction<number>>;
  enableRestaurantCategoryFilter: boolean;
  setEnableRestaurantCategoryFilter: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => void;

  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;

  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;

  isLoading: boolean;
  user: CombinedUser | null;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const companyId = useMemo(() => user?.companyId, [user]);

  const { data: items = [], isLoading: itemsLoading } = useCollection<Item>(
    useMemoFirebase(
      () => companyId && collection(firestore, 'companies', companyId, 'items'),
      [firestore, companyId]
    )
  );
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useCollection<Category>(
    useMemoFirebase(
      () =>
        companyId && collection(firestore, 'companies', companyId, 'categories'),
      [firestore, companyId]
    )
  );
  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useCollection<Customer>(
    useMemoFirebase(
      () =>
        companyId && collection(firestore, 'companies', companyId, 'customers'),
      [firestore, companyId]
    )
  );
  const { data: tables = [], isLoading: tablesLoading } = useCollection<Table>(
    useMemoFirebase(
      () => companyId && collection(firestore, 'companies', companyId, 'tables'),
      [firestore, companyId]
    )
  );
  const { data: sales = [], isLoading: salesLoading } = useCollection<Sale>(
    useMemoFirebase(
      () => companyId && collection(firestore, 'companies', companyId, 'sales'),
      [firestore, companyId]
    )
  );
  const {
    data: paymentMethods = [],
    isLoading: paymentMethodsLoading,
  } = useCollection<PaymentMethod>(
    useMemoFirebase(
      () =>
        companyId &&
        collection(firestore, 'companies', companyId, 'paymentMethods'),
      [firestore, companyId]
    )
  );
  const { data: vatRates = [], isLoading: vatRatesLoading } = useCollection<
    VatRate
  >(
    useMemoFirebase(
      () =>
        companyId && collection(firestore, 'companies', companyId, 'vatRates'),
      [firestore, companyId]
    )
  );
  const { data: heldOrders = [], isLoading: heldOrdersLoading } = useCollection<
    HeldOrder
  >(
    useMemoFirebase(
      () =>
        companyId && collection(firestore, 'companies', companyId, 'heldOrders'),
      [firestore, companyId]
    )
  );
  const { data: companyInfo, isLoading: companyInfoLoading } = useDoc<CompanyInfo>(
    useMemoFirebase(() => companyId && doc(firestore, 'companies', companyId), [
      firestore,
      companyId,
    ])
  );

  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [showTicketImages, setShowTicketImages] = useState(true);
  const [popularItemsCount, setPopularItemsCount] = useState(5);
  const [itemCardOpacity, setItemCardOpacity] = useState(30);
  const [enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter] =
    useState(true);
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const router = useRouter();

  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<
    Sale
  > | null>(null);
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);

  const isLoading =
    userLoading ||
    itemsLoading ||
    categoriesLoading ||
    customersLoading ||
    tablesLoading ||
    salesLoading ||
    paymentMethodsLoading ||
    vatRatesLoading ||
    heldOrdersLoading ||
    companyInfoLoading;

  const getCollectionRef = useCallback(
    (name: string) => {
      if (!companyId) throw new Error('Company ID is not available');
      return collection(firestore, 'companies', companyId, name);
    },
    [companyId, firestore]
  );

  const getDocRef = useCallback(
    (collectionName: string, docId: string) => {
      if (!companyId) throw new Error('Company ID is not available');
      return doc(firestore, 'companies', companyId, collectionName, docId);
    },
    [companyId, firestore]
  );

  const clearOrder = useCallback(() => {
    setOrder([]);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    if (selectedTable) {
      setSelectedTable(null);
    }
  }, [selectedTable]);

  const showNavConfirm = (url: string) => {
    setNextUrl(url);
    setNavConfirmOpen(true);
  };

  const closeNavConfirm = () => {
    setNextUrl(null);
    setNavConfirmOpen(false);
  };

  const confirmNavigation = () => {
    if (nextUrl) {
      clearOrder();
      router.push(nextUrl);
    }
    closeNavConfirm();
  };

  const triggerItemHighlight = (itemId: string) => {
    setRecentlyAddedItemId(itemId);
  };

  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder(currentOrder =>
      currentOrder.filter(item => item.id !== itemId)
    );
  }, []);

  const addEntity = useCallback(
    async (collectionName: string, data: any, toastTitle: string) => {
      try {
        const ref = getCollectionRef(collectionName);
        await addDoc(ref, data);
        toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error adding ${collectionName}:`, error);
        toast({
          variant: 'destructive',
          title: `Erreur lors de l'ajout`,
        });
      }
    },
    [getCollectionRef, toast]
  );

  const updateEntity = useCallback(
    async (collectionName: string, id: string, data: any, toastTitle: string) => {
      try {
        const ref = getDocRef(collectionName, id);
        await setDoc(ref, data, { merge: true });
        toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
        toast({
          variant: 'destructive',
          title: 'Erreur de mise à jour',
        });
      }
    },
    [getDocRef, toast]
  );

  const deleteEntity = useCallback(
    async (collectionName: string, id: string, toastTitle: string) => {
      try {
        const ref = getDocRef(collectionName, id);
        await deleteDoc(ref);
        toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error deleting ${collectionName}:`, error);
        toast({
          variant: 'destructive',
          title: 'Erreur de suppression',
        });
      }
    },
    [getDocRef, toast]
  );
  
  const recallOrder = useCallback(
    (orderId: string) => {
      if (!heldOrders) return;
      const orderToRecall = heldOrders.find(o => o.id === orderId);
      if (orderToRecall) {
        if (selectedTable) {
          setSelectedTable(null);
        }
        setOrder(orderToRecall.items);
        setCurrentSaleId(orderToRecall.id);
        setCurrentSaleContext({
          tableId: orderToRecall.tableId,
          tableName: orderToRecall.tableName,
        });
        deleteEntity('heldOrders', orderId, 'Commande rappelée.');
      }
    },
    [heldOrders, selectedTable, deleteEntity]
  );

  const setSelectedTableById = useCallback(
    (tableId: string | null) => {
      if (!tables || !heldOrders) return;
      const table = tableId ? tables.find(t => t.id === tableId) || null : null;
      setSelectedTable(table);
      if (table) {
        if (table.status === 'paying') {
          const heldOrderForTable = heldOrders.find(ho => ho.tableId === tableId);
          if (heldOrderForTable) {
            recallOrder(heldOrderForTable.id);
            router.push('/pos');
          }
        } else {
          setOrder(table.order);
          setCurrentSaleContext({ tableId: table.id, tableName: table.name });
        }
      } else {
        clearOrder();
      }
    },
    [tables, heldOrders, clearOrder, router, recallOrder]
  );

  const orderTotal = useMemo(() => {
    return order.reduce((sum, item) => sum + item.total, 0);
  }, [order]);

  const orderTax = useMemo(() => {
    if (!vatRates) return 0;
    return order.reduce((sum, item) => {
      const vat = vatRates.find(v => v.id === item.vatId);
      const taxForItem = item.total * ((vat?.rate || 0) / 100);
      return sum + taxForItem;
    }, 0);
  }, [order, vatRates]);

  const holdOrder = useCallback(async () => {
    if (order.length === 0) return;
    const newHeldOrder = {
      date: new Date(),
      items: order,
      total: orderTotal + orderTax,
    };
    await addEntity('heldOrders', newHeldOrder, 'Commande mise en attente.');
    clearOrder();
  }, [order, orderTotal, orderTax, clearOrder, addEntity]);
  
  const addToOrder = useCallback(
    (itemId: OrderItem['id']) => {
      if (!items) return;
      const itemToAdd = items.find(i => i.id === itemId);
      if (!itemToAdd) return;

      setOrder(currentOrder => {
        const existingItemIndex = currentOrder.findIndex(
          item => item.id === itemId
        );

        if (existingItemIndex !== -1) {
          const newOrder = [...currentOrder];
          const existingItem = newOrder[existingItemIndex];
          const newQuantity = existingItem.quantity + 1;
          newOrder[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            total: existingItem.price * newQuantity - (existingItem.discount || 0),
          };
          return newOrder;
        } else {
          const newItem: OrderItem = {
            ...itemToAdd,
            quantity: 1,
            total: itemToAdd.price,
            discount: 0,
          };
          return [...currentOrder, newItem];
        }
      });
      triggerItemHighlight(itemId);
      toast({ title: `${itemToAdd.name} ajouté à la commande` });
    },
    [items, toast]
  );

  const updateQuantity = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      if (quantity <= 0) {
        removeFromOrder(itemId);
        return;
      }
      setOrder(currentOrder =>
        currentOrder.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                total: item.price * quantity - (item.discount || 0),
              }
            : item
        )
      );
      triggerItemHighlight(itemId);
    },
    [removeFromOrder]
  );

  const updateQuantityFromKeypad = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      if (quantity <= 0) {
        removeFromOrder(itemId);
        return;
      }
      setOrder(currentOrder =>
        currentOrder.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                total: item.price * quantity - (item.discount || 0),
              }
            : item
        )
      );
      triggerItemHighlight(itemId);
    },
    [removeFromOrder]
  );

  const applyDiscount = useCallback(
    (itemId: OrderItem['id'], value: number, type: 'percentage' | 'fixed') => {
      setOrder(currentOrder =>
        currentOrder.map(item => {
          if (item.id === itemId) {
            let discountAmount = 0;
            let discountPercent: number | undefined = undefined;

            if (type === 'percentage') {
              discountAmount = item.price * item.quantity * (value / 100);
              discountPercent = value;
            } else {
              discountAmount = value;
            }

            if (discountAmount < 0) discountAmount = 0;
            if (value === 0) discountPercent = undefined;

            const newTotal = item.price * item.quantity - discountAmount;

            return {
              ...item,
              discount: discountAmount,
              discountPercent,
              total: newTotal > 0 ? newTotal : 0,
            };
          }
          return item;
        })
      );
      triggerItemHighlight(itemId);
    },
    []
  );

  const updateTableOrder = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      try {
        const tableRef = getDocRef('tables', tableId);
        await setDoc(
          tableRef,
          {
            order: orderData,
            status: orderData.length > 0 ? 'occupied' : 'available',
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error updating table order:', error);
        toast({ variant: 'destructive', title: 'Erreur de sauvegarde' });
      }
    },
    [getDocRef, toast]
  );

  const saveTableOrderAndExit = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      await updateTableOrder(tableId, orderData);
      toast({ title: 'Table sauvegardée' });
      clearOrder();
      setSelectedTable(null);
    },
    [updateTableOrder, clearOrder, toast]
  );

  const recordSale = useCallback(
    async (saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>) => {
      if (!companyId || !sales) return;
      const saleIdToUpdate = currentSaleId;
      const tableToEnd = saleIdToUpdate
        ? heldOrders.find(ho => ho.id === saleIdToUpdate)?.tableId
        : undefined;

      const batch = writeBatch(firestore);

      if (saleIdToUpdate && saleIdToUpdate.startsWith('held-')) {
        // This was a held order, delete it
        batch.delete(getDocRef('heldOrders', saleIdToUpdate));
      }

      if (tableToEnd) {
        const tableRef = getDocRef('tables', tableToEnd);
        batch.update(tableRef, { status: 'available', order: [] });
      }

      const today = new Date();
      const datePrefix = format(today, 'yyyyMMdd');
      const todaysSalesCount = sales.filter(s =>
        s.ticketNumber.startsWith(datePrefix)
      ).length;
      const ticketNumber =
        `${datePrefix}-0001`.slice(0, -(todaysSalesCount + 1).toString().length) +
        (todaysSalesCount + 1).toString();

      const finalSale: Omit<Sale, 'id'> = {
        ...saleData,
        date: today,
        ticketNumber,
        status: 'paid',
        ...(currentSaleContext?.tableId && {
          tableId: currentSaleContext.tableId,
          tableName: currentSaleContext.tableName,
        }),
      };

      const newSaleRef = doc(getCollectionRef('sales'));
      batch.set(newSaleRef, finalSale);

      await batch.commit();
    },
    [
      companyId,
      currentSaleId,
      heldOrders,
      firestore,
      getDocRef,
      sales,
      getCollectionRef,
      currentSaleContext,
    ]
  );

  const promoteTableToTicket = useCallback(
    async (tableId: string) => {
      if (!tables || !vatRates || !heldOrders) return;
      const table = tables.find(t => t.id === tableId);
      if (!table || table.order.length === 0) return;

      const subtotal = table.order.reduce((sum, item) => sum + item.total, 0);
      const tax = table.order.reduce((sum, item) => {
        const vat = vatRates.find(v => v.id === item.vatId);
        const taxForItem = item.total * ((vat?.rate || 0) / 100);
        return sum + taxForItem;
      }, 0);

      const total = subtotal + tax;

      const existingHeldOrder = heldOrders.find(ho => ho.tableId === table.id);

      const newHeldOrderData = {
        date: new Date(),
        items: table.order,
        total: total,
        tableName: table.name,
        tableId: table.id,
      };

      const batch = writeBatch(firestore);

      const heldOrderRef = existingHeldOrder
        ? getDocRef('heldOrders', existingHeldOrder.id)
        : doc(getCollectionRef('heldOrders'));

      batch.set(heldOrderRef, newHeldOrderData);

      const tableRef = getDocRef('tables', tableId);
      batch.update(tableRef, { status: 'paying' });

      await batch.commit();

      setSelectedTable(null);
      clearOrder();
      router.push('/restaurant');

      toast({
        title: 'Table transformée en ticket',
        description: 'Le ticket est maintenant en attente dans le point de vente.',
      });
    },
    [
      tables,
      vatRates,
      heldOrders,
      firestore,
      getDocRef,
      getCollectionRef,
      toast,
      clearOrder,
      router,
    ]
  );

  const addTable = useCallback(
    (tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>) => {
      const newTable = {
        ...tableData,
        number: Date.now() % 10000,
        status: 'available' as const,
        order: [],
      };
      addEntity('tables', newTable, 'Table créée');
    },
    [addEntity]
  );

  const updateTable = useCallback(
    (table: Table) => {
      updateEntity('tables', table.id, table, 'Table modifiée');
    },
    [updateEntity]
  );

  const deleteTable = useCallback(
    (tableId: string) => deleteEntity('tables', tableId, 'Table supprimée'),
    [deleteEntity]
  );

  const forceFreeTable = useCallback(
    async (tableId: string) => {
      if (!heldOrders) return;
      const batch = writeBatch(firestore);
      const tableRef = getDocRef('tables', tableId);
      batch.update(tableRef, { status: 'available', order: [] });

      const heldOrderForTable = heldOrders.find(ho => ho.tableId === tableId);
      if (heldOrderForTable) {
        const heldOrderRef = getDocRef('heldOrders', heldOrderForTable.id);
        batch.delete(heldOrderRef);
      }
      await batch.commit();
      toast({ title: 'Table libérée' });
    },
    [firestore, getDocRef, heldOrders, toast]
  );

  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) =>
      addEntity('categories', category, 'Catégorie ajoutée'),
    [addEntity]
  );
  const updateCategory = useCallback(
    (category: Category) =>
      updateEntity('categories', category.id, category, 'Catégorie modifiée'),
    [updateEntity]
  );
  const deleteCategory = useCallback(
    (id: string) => deleteEntity('categories', id, 'Catégorie supprimée'),
    [deleteEntity]
  );
  const toggleCategoryFavorite = useCallback(
    (id: string) => {
      if (!categories) return;
      const category = categories.find(c => c.id === id);
      if (category)
        updateEntity(
          'categories',
          id,
          { isFavorite: !category.isFavorite },
          'Favori mis à jour'
        );
    },
    [categories, updateEntity]
  );

  const addItem = useCallback(
    (item: Omit<Item, 'id'>) => addEntity('items', item, 'Article créé'),
    [addEntity]
  );
  const updateItem = useCallback(
    (item: Item) => updateEntity('items', item.id, item, 'Article modifié'),
    [updateEntity]
  );
  const deleteItem = useCallback(
    (id: string) => deleteEntity('items', id, 'Article supprimé'),
    [deleteEntity]
  );
  const toggleItemFavorite = useCallback(
    (id: string) => {
      if (!items) return;
      const item = items.find(i => i.id === id);
      if (item)
        updateEntity(
          'items',
          id,
          { isFavorite: !item.isFavorite },
          'Favori mis à jour'
        );
    },
    [items, updateEntity]
  );
  const toggleFavoriteForList = useCallback(
    async (itemIds: string[], setFavorite: boolean) => {
      const batch = writeBatch(firestore);
      itemIds.forEach(id => {
        const itemRef = getDocRef('items', id);
        batch.update(itemRef, { isFavorite: setFavorite });
      });
      await batch.commit();
      toast({ title: `Favoris mis à jour.` });
    },
    [firestore, getDocRef, toast]
  );

  const addCustomer = useCallback(
    (customer: Omit<Customer, 'id' | 'isDefault'>) => {
      if (!customers) return;
      const newCustomer = {
        ...customer,
        isDefault: !customers.some(c => c.isDefault),
      };
      addEntity('customers', newCustomer, 'Client ajouté');
    },
    [addEntity, customers]
  );
  const updateCustomer = useCallback(
    (customer: Customer) =>
      updateEntity('customers', customer.id, customer, 'Client modifié'),
    [updateEntity]
  );
  const deleteCustomer = useCallback(
    (id: string) => deleteEntity('customers', id, 'Client supprimé'),
    [deleteEntity]
  );
  const setDefaultCustomer = useCallback(
    async (customerId: string) => {
      if (!customers) return;
      const batch = writeBatch(firestore);
      customers.forEach(c => {
        const customerRef = getDocRef('customers', c.id);
        if (c.id === customerId) {
          batch.update(customerRef, { isDefault: !c.isDefault });
        } else if (c.isDefault) {
          batch.update(customerRef, { isDefault: false });
        }
      });
      await batch.commit();
      toast({ title: 'Client par défaut modifié' });
    },
    [customers, firestore, getDocRef, toast]
  );

  const addPaymentMethod = useCallback(
    (method: Omit<PaymentMethod, 'id'>) =>
      addEntity('paymentMethods', method, 'Moyen de paiement ajouté'),
    [addEntity]
  );
  const updatePaymentMethod = useCallback(
    (method: PaymentMethod) =>
      updateEntity(
        'paymentMethods',
        method.id,
        method,
        'Moyen de paiement modifié'
      ),
    [updateEntity]
  );
  const deletePaymentMethod = useCallback(
    (id: string) =>
      deleteEntity('paymentMethods', id, 'Moyen de paiement supprimé'),
    [deleteEntity]
  );

  const addVatRate = useCallback(
    (vatRate: Omit<VatRate, 'id' | 'code'>) => {
      if (!vatRates) return;
      const newCode = Math.max(0, ...vatRates.map(v => v.code)) + 1;
      const newVatRate = { ...vatRate, code: newCode };
      addEntity('vatRates', newVatRate, 'Taux de TVA ajouté');
    },
    [addEntity, vatRates]
  );
  const updateVatRate = useCallback(
    (vatRate: VatRate) =>
      updateEntity('vatRates', vatRate.id, vatRate, 'Taux de TVA modifié'),
    [updateEntity]
  );
  const deleteVatRate = useCallback(
    (id: string) => deleteEntity('vatRates', id, 'Taux de TVA supprimé'),
    [deleteEntity]
  );

  const deleteHeldOrder = useCallback(
    async (orderId: string) => {
      if (!heldOrders) return;
      const orderToDelete = heldOrders.find(o => o.id === orderId);
      if (orderToDelete?.tableId) {
        const tableRef = getDocRef('tables', orderToDelete.tableId);
        await setDoc(tableRef, { status: 'available' }, { merge: true });
      }
      await deleteEntity('heldOrders', orderId, 'Ticket en attente supprimé.');
    },
    [heldOrders, getDocRef, deleteEntity, setDoc]
  );

  const popularItems = useMemo(() => {
    if (!sales || !items) return [];
    const itemCounts: { [key: string]: { item: Item; count: number } } = {};

    sales.forEach(sale => {
      sale.items.forEach(orderItem => {
        if (itemCounts[orderItem.id]) {
          itemCounts[orderItem.id].count += orderItem.quantity;
        } else {
          const itemDetails = items.find(i => i.id === orderItem.id);
          if (itemDetails) {
            itemCounts[orderItem.id] = {
              item: itemDetails,
              count: orderItem.quantity,
            };
          }
        }
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, popularItemsCount)
      .map(i => i.item);
  }, [sales, items, popularItemsCount]);

  const setCompanyInfo = useCallback(
    (info: CompanyInfo) => {
      if (companyId) {
        const companyRef = doc(firestore, 'companies', companyId);
        setDoc(companyRef, info, { merge: true });
      }
    },
    [companyId, firestore]
  );

  const value = useMemo(
    () => ({
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
      currentSaleContext,
      recentlyAddedItemId,
      setRecentlyAddedItemId,
      items,
      addItem,
      updateItem,
      deleteItem,
      toggleItemFavorite,
      toggleFavoriteForList,
      popularItems,
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
      setTables: () => {}, // setTables is now managed by Firestore
      addTable,
      updateTable,
      deleteTable,
      forceFreeTable,
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
      popularItemsCount,
      setPopularItemsCount,
      itemCardOpacity,
      setItemCardOpacity,
      enableRestaurantCategoryFilter,
      setEnableRestaurantCategoryFilter,
      companyInfo,
      setCompanyInfo,
      isNavConfirmOpen,
      showNavConfirm,
      closeNavConfirm,
      confirmNavigation,
      cameFromRestaurant,
      setCameFromRestaurant,
      isLoading,
      user,
    }),
    [
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
      currentSaleId,
      currentSaleContext,
      recentlyAddedItemId,
      items,
      addItem,
      updateItem,
      deleteItem,
      toggleItemFavorite,
      toggleFavoriteForList,
      popularItems,
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
      addTable,
      updateTable,
      deleteTable,
      forceFreeTable,
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
      popularItemsCount,
      itemCardOpacity,
      enableRestaurantCategoryFilter,
      companyInfo,
      setCompanyInfo,
      isNavConfirmOpen,
      confirmNavigation,
      cameFromRestaurant,
      isLoading,
      user,
      closeNavConfirm,
    ]
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos doit être utilisé dans un PosProvider');
  }
  return context;
}
