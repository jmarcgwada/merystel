

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
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
  User,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  useUser as useFirebaseUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  useAuth,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  deleteDoc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import type { CombinedUser } from '@/firebase/auth/use-user';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// The single, shared company ID for the entire application.
const SHARED_COMPANY_ID = 'main';

const TAKEAWAY_TABLE: Table = {
  id: 'takeaway',
  name: 'Vente directe au comptoir',
  number: 999,
  status: 'available',
  order: [],
  description: 'Pour les ventes à emporter et les commandes rapides.',
  covers: 0,
  lockedBy: null,
};


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

  users: User[];
  addUser: (user: Omit<User, 'id' | 'companyId'>, password?: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  sendPasswordResetEmailForUser: (email: string) => void;
  findUserByEmail: (email: string) => User | undefined;
  handleSignOut: () => Promise<void>;
  validateSession: (userId: string, token: string) => boolean;
  forceSignOut: (message: string) => void;
  forceSignOutUser: (userId: string) => void;
  sessionInvalidated: boolean;
  setSessionInvalidated: React.Dispatch<React.SetStateAction<boolean>>;


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
  addTable: (
    tableData: Omit<Table, 'id' | 'status' | 'order' | 'number' | 'lockedBy'>
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

  heldOrders: HeldOrder[] | null;
  holdOrder: () => void;
  recallOrder: (orderId: string) => void;
  deleteHeldOrder: (orderId: string) => void;

  authRequired: boolean;
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
  
  seedInitialData: () => void;
  resetAllData: () => void;

  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;

  isLoading: boolean;
  user: CombinedUser | null;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const companyId = SHARED_COMPANY_ID;

  // #region State
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  
  const [showTicketImages, setShowTicketImages] = useState(true);
  const [popularItemsCount, setPopularItemsCount] = useState(10);
  const [itemCardOpacity, setItemCardOpacity] = useState(30);
  const [enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter] =
    useState(true);
    
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(
    null
  );
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<Sale> | null>(
    null
  );
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);

  // #endregion

  // #region Data Fetching
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: usersData = [], isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  const itemsCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'items') : null, [firestore, companyId]);
  const { data: itemsData = [], isLoading: itemsLoading } = useCollection<Item>(itemsCollectionRef);

  const categoriesCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'categories') : null, [firestore, companyId]);
  const { data: categoriesData = [], isLoading: categoriesLoading } = useCollection<Category>(categoriesCollectionRef);

  const customersCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'customers') : null, [firestore, companyId]);
  const { data: customersData = [], isLoading: customersLoading } = useCollection<Customer>(customersCollectionRef);

  const tablesCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'tables') : null, [firestore, companyId]);
  const { data: tablesData = [], isLoading: tablesLoading } = useCollection<Table>(tablesCollectionRef);
  
  const tables = useMemo(() => tablesData ? [TAKEAWAY_TABLE, ...tablesData] : [TAKEAWAY_TABLE], [tablesData]);
  const users = useMemo(() => usersData, [usersData]);
  const items = useMemo(() => itemsData, [itemsData]);
  const categories = useMemo(() => categoriesData, [categoriesData]);
  const customers = useMemo(() => customersData, [customersData]);


  const salesCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'sales') : null, [firestore, companyId]);
  const { data: sales = [], isLoading: salesLoading } = useCollection<Sale>(salesCollectionRef);

  const paymentMethodsCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'paymentMethods') : null, [firestore, companyId]);
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useCollection<PaymentMethod>(paymentMethodsCollectionRef);

  const vatRatesCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'vatRates') : null, [firestore, companyId]);
  const { data: vatRates = [], isLoading: vatRatesLoading } = useCollection<VatRate>(vatRatesCollectionRef);

  const heldOrdersCollectionRef = useMemoFirebase(() => companyId ? collection(firestore, 'companies', companyId, 'heldOrders') : null, [firestore, companyId]);
  const { data: heldOrders, isLoading: heldOrdersLoading } = useCollection<HeldOrder>(heldOrdersCollectionRef);

  const companyDocRef = useMemoFirebase(() => companyId ? doc(firestore, 'companies', companyId) : null, [firestore, companyId]);
  const { data: companyInfo, isLoading: companyInfoLoading } = useDoc<CompanyInfo>(companyDocRef);


  const isLoading =
    userLoading ||
    usersLoading ||
    itemsLoading ||
    categoriesLoading ||
    customersLoading ||
    tablesLoading ||
    salesLoading ||
    paymentMethodsLoading ||
    vatRatesLoading ||
    heldOrdersLoading ||
    companyInfoLoading;
  // #endregion
  
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const heldOrdersRef = useRef(heldOrders);
  useEffect(() => {
    heldOrdersRef.current = heldOrders;
  }, [heldOrders]);

  const authRequired = true;
  
  // #region Base Callbacks
  const getCollectionRef = useCallback(
    (name: string, global: boolean = false) => {
      if (!firestore) return null;
      if (global) {
        return collection(firestore, name);
      }
      if (!companyId) {
         console.warn(`Cannot get collection ${name}, companyId not available.`);
         return null;
      };
      return collection(firestore, 'companies', companyId, name);
    },
    [companyId, firestore]
  );

  const getDocRef = useCallback(
    (collectionName: string, docId: string, global: boolean = false) => {
      if (!firestore) return null;
      if (global) {
        return doc(firestore, collectionName, docId);
      }
      if (!companyId) {
        console.warn(`Cannot get doc from ${collectionName}, companyId not available.`);
        return null;
      }
      return doc(firestore, 'companies', companyId, collectionName, docId);
    },
    [companyId, firestore]
  );

  const addEntity = useCallback(
    async (collectionName: string, data: any, toastTitle: string, global: boolean = false) => {
      const ref = getCollectionRef(collectionName, global);
      if (!ref) {
        return;
      }
      try {
        await addDoc(ref, data);
        toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error adding ${collectionName}:`, error);
        toast({ variant: 'destructive', title: `Erreur lors de l'ajout` });
      }
    },
    [getCollectionRef, toast]
  );

  const updateEntity = useCallback(
    async (
      collectionName: string,
      id: string,
      data: any,
      toastTitle: string,
      global: boolean = false,
    ) => {
       const ref = getDocRef(collectionName, id, global);
       if (!ref) {
        return;
      }
      try {
        await setDoc(ref, data, { merge: true });
        if(toastTitle) toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
        toast({ variant: 'destructive', title: 'Erreur de mise à jour' });
      }
    },
    [getDocRef, toast]
  );

  const deleteEntity = useCallback(
    async (collectionName: string, id: string, toastTitle: string, global: boolean = false) => {
      const ref = getDocRef(collectionName, id, global);
      if (!ref) {
        return;
      }
      try {
        await deleteDoc(ref);
        toast({ title: toastTitle });
      } catch (error) {
        console.error(`Error deleting ${collectionName}:`, error);
        toast({ variant: 'destructive', title: 'Erreur de suppression' });
      }
    },
    [getDocRef, toast]
  );
  // #endregion

  // #region Locking Mechanism
    const lockResource = useCallback(async (resourceType: 'table' | 'heldOrder', resourceId: string) => {
        if (!user || !firestore || !companyId) return;
        const collectionName = resourceType === 'table' ? 'tables' : 'heldOrders';
        const resourceRef = doc(firestore, 'companies', companyId, collectionName, resourceId);
        try {
            await updateDoc(resourceRef, { lockedBy: user.id });
        } catch (error) {
            console.error(`Error locking ${resourceType} ${resourceId}:`, error);
        }
    }, [user, firestore, companyId]);

    const unlockResource = useCallback(async (resourceType: 'table' | 'heldOrder', resourceId: string) => {
        if (!firestore || !companyId) return;
        const collectionName = resourceType === 'table' ? 'tables' : 'heldOrders';
        const resourceRef = doc(firestore, 'companies', companyId, collectionName, resourceId);
        try {
            await updateDoc(resourceRef, { lockedBy: null });
        } catch (error) {
            console.error(`Error unlocking ${resourceType} ${resourceId}:`, error);
        }
    }, [firestore, companyId]);
  // #endregion

  // #region Data Seeding
  const seedInitialData = useCallback(async () => {
    if (!firestore || !companyId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Connexion à la base de données indisponible.' });
      return;
    }

    const canSeed = !categories || categories.length === 0 || !vatRates || vatRates.length === 0 || !paymentMethods || paymentMethods.length === 0;

    if (!canSeed) {
      toast({ variant: 'destructive', title: 'Données existantes', description: "L'initialisation a été annulée car des données de configuration existent déjà." });
      return;
    }

    try {
      const batch = writeBatch(firestore);

      // --- Define Data ---
      const defaultCategories = [
        { id: 'cat_boissons_chaudes', name: 'Boissons Chaudes', color: '#a855f7', image: `https://picsum.photos/seed/boissonschaudes/200/150` },
        { id: 'cat_boissons_fraiches', name: 'Boissons Fraîches', color: '#ef4444', image: `https://picsum.photos/seed/boissonsfraiches/200/150` },
        { id: 'cat_viennoiseries', name: 'Viennoiseries', color: '#eab308', image: `https://picsum.photos/seed/viennoiseries/200/150` },
        { id: 'cat_plats', name: 'Plats Principaux', color: '#3b82f6', image: `https://picsum.photos/seed/plats/200/150`, isRestaurantOnly: true },
        { id: 'cat_entrees', name: 'Entrées', color: '#10b981', image: `https://picsum.photos/seed/entrees/200/150`, isRestaurantOnly: true },
        { id: 'cat_desserts', name: 'Desserts', color: '#f97316', image: `https://picsum.photos/seed/desserts/200/150` },
      ];
      const defaultVatRates = [
        { id: 'vat_20', name: 'Taux Normal', rate: 20, code: 1 },
        { id: 'vat_10', name: 'Taux Intermédiaire', rate: 10, code: 2 },
        { id: 'vat_5', name: 'Taux Réduit', rate: 5.5, code: 3 },
      ];
      const defaultPaymentMethods = [
        { name: 'Espèces', icon: 'cash', type: 'direct' },
        { name: 'Carte Bancaire', icon: 'card', type: 'direct' },
        { name: 'Chèque', icon: 'check', type: 'direct' },
      ];
      const defaultCustomers = [
        { name: 'Client au comptoir', isDefault: true },
        { name: 'Marie Dubois', email: 'marie.d@email.com' },
        { name: 'Ahmed Khan', email: 'ahmed.k@email.com' },
        { name: 'Sophie Leroy', email: 'sophie.l@email.com' },
      ];
      const defaultItems = [
          { name: 'Café Espresso', price: 2.50, categoryId: 'cat_boissons_chaudes', vatId: 'vat_5', image: 'https://picsum.photos/seed/espresso/200/150' },
          { name: 'Cappuccino', price: 3.50, categoryId: 'cat_boissons_chaudes', vatId: 'vat_5', image: 'https://picsum.photos/seed/cappuccino/200/150', isFavorite: true },
          { name: 'Thé Vert', price: 3.00, categoryId: 'cat_boissons_chaudes', vatId: 'vat_5', image: 'https://picsum.photos/seed/thevert/200/150' },
          { name: 'Jus d\'orange pressé', price: 4.00, categoryId: 'cat_boissons_fraiches', vatId: 'vat_10', image: 'https://picsum.photos/seed/jusorange/200/150', isFavorite: true },
          { name: 'Limonade Artisanale', price: 3.50, categoryId: 'cat_boissons_fraiches', vatId: 'vat_10', image: 'https://picsum.photos/seed/limonade/200/150' },
          { name: 'Croissant', price: 1.50, categoryId: 'cat_viennoiseries', vatId: 'vat_5', image: 'https://picsum.photos/seed/croissant/200/150', isFavorite: true },
          { name: 'Pain au chocolat', price: 1.70, categoryId: 'cat_viennoiseries', vatId: 'vat_5', image: 'https://picsum.photos/seed/painchoc/200/150' },
          { name: 'Salade César', price: 12.50, categoryId: 'cat_plats', vatId: 'vat_10', image: 'https://picsum.photos/seed/saladecesar/200/150', isRestaurantOnly: true },
          { name: 'Burger Classique', price: 15.00, categoryId: 'cat_plats', vatId: 'vat_10', image: 'https://picsum.photos/seed/burger/200/150', isRestaurantOnly: true },
          { name: 'Mousse au chocolat', price: 6.50, categoryId: 'cat_desserts', vatId: 'vat_10', image: 'https://picsum.photos/seed/moussechoc/200/150' },
      ];
      const defaultTables = [
        { name: 'Table 1', description: 'Près de la fenêtre', number: 1, status: 'available', order: [], covers: 4, lockedBy: null },
        { name: 'Table 2', description: 'Au fond', number: 2, status: 'available', order: [], covers: 2, lockedBy: null },
      ];


      // --- Batch Write ---
      defaultCategories.forEach(data => {
          const ref = doc(firestore, 'companies', companyId, 'categories', data.id);
          batch.set(ref, data);
      });
      defaultVatRates.forEach(data => {
          const ref = doc(firestore, 'companies', companyId, 'vatRates', data.id);
          batch.set(ref, data);
      });
      defaultPaymentMethods.forEach(data => {
          const ref = doc(collection(firestore, 'companies', companyId, 'paymentMethods'));
          batch.set(ref, data);
      });
      defaultCustomers.forEach(data => {
          const ref = doc(collection(firestore, 'companies', companyId, 'customers'));
          batch.set(ref, data);
      });
      defaultItems.forEach(data => {
          const ref = doc(collection(firestore, 'companies', companyId, 'items'));
          batch.set(ref, data);
      });
      defaultTables.forEach(data => {
          const ref = doc(collection(firestore, 'companies', companyId, 'tables'));
          batch.set(ref, data);
      });
      
      await batch.commit();
      toast({ title: 'Initialisation réussie', description: 'Les données de démonstration ont été créées.' });

    } catch (error) {
      console.error('Error seeding data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: "L'initialisation des données a échoué." });
    }
  }, [firestore, companyId, categories, vatRates, paymentMethods, toast]);

    const resetAllData = useCallback(async () => {
        if (!firestore || !companyId) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Connexion à la base de données indisponible.' });
            return;
        }

        const collectionsToDelete = ['items', 'categories', 'customers', 'tables', 'sales', 'paymentMethods', 'vatRates', 'heldOrders'];
        
        try {
            const batch = writeBatch(firestore);

            for (const collectionName of collectionsToDelete) {
                const collRef = getCollectionRef(collectionName);
                if (collRef) {
                    const snapshot = await getDocs(query(collRef));
                    snapshot.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                }
            }

            await batch.commit();
            toast({ title: 'Réinitialisation réussie', description: 'Toutes les données de l\'application ont été supprimées.' });
        } catch (error) {
            console.error('Error resetting data:', error);
            toast({ variant: 'destructive', title: 'Erreur de réinitialisation', description: 'Une erreur s\'est produite lors de la suppression des données.' });
        }

    }, [firestore, companyId, getCollectionRef, toast]);
  // #endregion

  // #region Order Management
  const clearOrder = useCallback(async () => {
    // Unlock any associated resource before clearing
    if (selectedTable) {
        await unlockResource('table', selectedTable.id);
    }
    if (currentSaleId) {
        await unlockResource('heldOrder', currentSaleId);
    }

    setOrder([]);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
  }, [selectedTable, currentSaleId, unlockResource]);
  
  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder((currentOrder) =>
      currentOrder.filter((item) => item.id !== itemId)
    );
  }, []);

  const triggerItemHighlight = (itemId: string) => {
    setRecentlyAddedItemId(itemId);
  };

  const addToOrder = useCallback(
    (itemId: OrderItem['id']) => {
      if (!items) return;
      const itemToAdd = items.find((i) => i.id === itemId);
      if (!itemToAdd) return;

      setOrder((currentOrder) => {
        const existingItemIndex = currentOrder.findIndex(
          (item) => item.id === itemId
        );
        if (existingItemIndex !== -1) {
          const newOrder = [...currentOrder];
          const existingItem = newOrder[existingItemIndex];
          const newQuantity = existingItem.quantity + 1;
          newOrder[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            total:
              existingItem.price * newQuantity - (existingItem.discount || 0),
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
      setOrder((currentOrder) =>
        currentOrder.map((item) =>
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
      updateQuantity(itemId, quantity);
    },
    [updateQuantity]
  );

  const applyDiscount = useCallback(
    (
      itemId: OrderItem['id'],
      value: number,
      type: 'percentage' | 'fixed'
    ) => {
      setOrder((currentOrder) =>
        currentOrder.map((item) => {
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

  const orderTotal = useMemo(
    () => order.reduce((sum, item) => sum + item.total, 0),
    [order]
  );

  const orderTax = useMemo(() => {
    if (!vatRates) return 0;
    return order.reduce((sum, item) => {
      const vat = vatRates.find((v) => v.id === item.vatId);
      const taxForItem = item.total * ((vat?.rate || 0) / 100);
      return sum + taxForItem;
    }, 0);
  }, [order, vatRates]);
  // #endregion

  // #region Held Order & Table Management
  const holdOrder = useCallback(() => {
    if (order.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Commande vide',
        description: 'Ajoutez des articles avant de mettre en attente.',
      });
      return;
    }
    const newHeldOrder: Omit<HeldOrder, 'id'> = {
      date: new Date(),
      items: order,
      total: orderTotal + orderTax,
      lockedBy: null,
    };
    addEntity('heldOrders', newHeldOrder, 'Commande mise en attente');
    clearOrder();
  }, [order, orderTotal, orderTax, addEntity, clearOrder, toast]);
  
  const deleteHeldOrder = useCallback(
    async (orderId: string) => {
      if (!heldOrders) return;
      const orderToDelete = heldOrders.find((o) => o.id === orderId);
      if (orderToDelete?.lockedBy) {
          toast({ variant: 'destructive', title: 'Ticket verrouillé', description: "Ce ticket est en cours d'utilisation par un autre utilisateur." });
          return;
      }
      const tableRef = orderToDelete?.tableId ? getDocRef('tables', orderToDelete.tableId) : null;
      
      if (tableRef) {
        await setDoc(tableRef, { status: 'available', lockedBy: null }, { merge: true });
      }

      await deleteEntity('heldOrders', orderId, 'Ticket en attente supprimé.');
    },
    [heldOrders, getDocRef, deleteEntity, toast]
  );

  const recallOrder = useCallback(async (orderId: string) => {
    if (!heldOrders || !user) return;
    const orderToRecall = heldOrders.find((o) => o.id === orderId);
    if (orderToRecall) {
        if (orderToRecall.lockedBy && orderToRecall.lockedBy !== user.id) {
            toast({ variant: 'destructive', title: 'Ticket verrouillé', description: "Ce ticket est déjà utilisé par un autre utilisateur." });
            return;
        }

        // Unlock previous resource if any
        if (selectedTable) {
             await unlockResource('table', selectedTable.id);
        }

        await lockResource('heldOrder', orderId);
        
        setOrder(orderToRecall.items);
        setCurrentSaleId(orderToRecall.id);
        setSelectedTable(null); // Ensure no table is selected
        setCurrentSaleContext({
            tableId: orderToRecall.tableId,
            tableName: orderToRecall.tableName,
        });
        toast({ title: 'Commande rappelée' });
        routerRef.current.push('/pos');
    }
  }, [heldOrders, user, selectedTable, toast, lockResource, unlockResource]);


const setSelectedTableById = useCallback(async (tableId: string | null) => {
    if (!tables || !user) {
        if (!tableId) await clearOrder();
        return;
    }

    const previousTableId = selectedTable?.id;
    const previousHeldOrderId = currentSaleId;

    if (previousTableId && previousTableId !== tableId) {
        await unlockResource('table', previousTableId);
    }
    if (previousHeldOrderId) {
        await unlockResource('heldOrder', previousHeldOrderId);
        setCurrentSaleId(null);
    }
    
    if (!tableId) {
        setSelectedTable(null);
        await clearOrder();
        return;
    }

    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    if (table.lockedBy && table.lockedBy !== user.id) {
        toast({ variant: 'destructive', title: 'Table verrouillée', description: 'Cette table est en cours d\'utilisation.' });
        return;
    }
    
    if (table.id === 'takeaway') {
        setCameFromRestaurant(true);
        routerRef.current.push('/pos');
        return;
    }
    
    await lockResource('table', table.id);

    setSelectedTable(table);
    setOrder(table.order || []);
    setCurrentSaleId(null); // Clear any held order sale ID
    setCurrentSaleContext({
        tableId: table.id,
        tableName: table.name,
    });
    routerRef.current.push(`/pos?tableId=${tableId}`);
}, [tables, user, clearOrder, toast, selectedTable, lockResource, unlockResource, currentSaleId]);


  const updateTableOrder = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      const tableRef = getDocRef('tables', tableId);
      if (!tableRef) return;
      try {
        await updateDoc(tableRef, {
            order: orderData,
            status: orderData.length > 0 ? 'occupied' : 'available',
        });
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
      await unlockResource('table', tableId);
      toast({ title: 'Table sauvegardée' });
      await clearOrder();
    },
    [updateTableOrder, clearOrder, toast, unlockResource]
  );

  const promoteTableToTicket = useCallback(async (tableId: string) => {
    if (!tables || !vatRates || !heldOrders || !firestore || !user) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.order.length === 0) return;

    const subtotal = table.order.reduce((sum, item) => sum + item.total, 0);
    const tax = table.order.reduce((sum, item) => {
      const vat = vatRates.find((v) => v.id === item.vatId);
      return sum + item.total * ((vat?.rate || 0) / 100);
    }, 0);
    const total = subtotal + tax;

    const existingHeldOrder = heldOrders.find((ho) => ho.tableId === table.id);
    const newHeldOrderData: HeldOrder = {
      id: existingHeldOrder?.id || uuidv4(),
      date: new Date(),
      items: table.order,
      total: total,
      tableName: table.name,
      tableId: table.id,
      lockedBy: null,
    };
    
    const tableRef = getDocRef('tables', tableId);
    const heldOrdersCollRef = getCollectionRef('heldOrders');
    if (!tableRef || !heldOrdersCollRef) return;
    
    const batch = writeBatch(firestore);

    const heldOrderRef = existingHeldOrder
      ? getDocRef('heldOrders', existingHeldOrder.id)
      : doc(heldOrdersCollRef, newHeldOrderData.id);
      
    if (!heldOrderRef) return;

    const { id, ...dataToSave } = newHeldOrderData;
    batch.set(heldOrderRef, dataToSave);
    batch.update(tableRef, { status: 'paying', order: [], lockedBy: null });
    await batch.commit();

    await clearOrder();
    routerRef.current.push('/restaurant');
    toast({
      title: 'Table transformée en ticket',
      description:
        'Le ticket est maintenant en attente dans le point de vente.',
    });
  }, [tables, vatRates, heldOrders, firestore, user, getDocRef, getCollectionRef, toast, clearOrder]);

  const forceFreeTable = useCallback(
    async (tableId: string) => {
      if (!firestore) return;
      const batch = writeBatch(firestore);
      const tableRef = getDocRef('tables', tableId);
      if (tableRef) {
        batch.update(tableRef, { status: 'available', order: [], lockedBy: null });
      }
      
      const heldOrderForTable = heldOrders?.find(
        (ho) => ho.tableId === tableId
      );
      if (heldOrderForTable) {
        const heldOrderRef = getDocRef('heldOrders', heldOrderForTable.id);
        if (heldOrderRef) {
          batch.delete(heldOrderRef);
        }
      }
      await batch.commit();
      toast({ title: 'Table libérée' });
    },
    [firestore, getDocRef, heldOrders, toast]
  );

  const addTable = useCallback(
    (tableData: Omit<Table, 'id' | 'status' | 'order' | 'number' | 'lockedBy'>) => {
      const newTable: Omit<Table, 'id'> = {
        ...tableData,
        number: Date.now() % 10000,
        status: 'available' as const,
        order: [],
        lockedBy: null,
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
  // #endregion

  // #region Sales
  const recordSale = useCallback(
    async (saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>) => {
      if (!companyId || !sales || !firestore) return;
      
      const saleIdToUpdate = currentSaleId;
      const tableToEnd = saleIdToUpdate
        ? heldOrdersRef.current?.find((ho) => ho.id === saleIdToUpdate)?.tableId
        : undefined;
      const batch = writeBatch(firestore);

      if (saleIdToUpdate) {
        await unlockResource('heldOrder', saleIdToUpdate);
        const docRef = getDocRef('heldOrders', saleIdToUpdate);
        if (docRef) batch.delete(docRef);
      }
      if (tableToEnd) {
        const tableRef = getDocRef('tables', tableToEnd);
        if (tableRef) batch.update(tableRef, { status: 'available', order: [], lockedBy: null });
      }

      const today = new Date();
      const datePrefix = format(today, 'yyyyMMdd');
      const todaysSalesCount = sales.filter((s) =>
        s.ticketNumber.startsWith(datePrefix)
      ).length;
      const ticketNumber =
        `${datePrefix}-0001`.slice(
          0,
          -(todaysSalesCount + 1).toString().length
        ) + (todaysSalesCount + 1).toString();

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
      const salesCollRef = getCollectionRef('sales');
      if (salesCollRef) {
        const newSaleRef = doc(salesCollRef);
        batch.set(newSaleRef, finalSale);
        await batch.commit();
      }
    },
    [
      companyId,
      currentSaleId,
      firestore,
      getDocRef,
      sales,
      getCollectionRef,
      currentSaleContext,
      unlockResource,
    ]
  );
  // #endregion

  // #region User Management & Session
  const addUser = useCallback(
    async (userData: Omit<User, 'id' | 'companyId'>, password?: string) => {
      if (!auth || !firestore) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Le service d\'authentification n\'est pas disponible.',
        });
        return;
      }

      const finalPassword = password;
      if (!finalPassword) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Un mot de passe est requis pour créer un utilisateur.',
        });
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, finalPassword);
        const authUser = userCredential.user;

        const userDocData: Omit<User, 'id'> = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          companyId: SHARED_COMPANY_ID,
        };

        await setDoc(doc(firestore, 'users', authUser.uid), userDocData);

        toast({
            title: 'Utilisateur créé avec succès',
        });

      } catch (error: any) {
        console.error('Error creating user:', error);
        let description = "Une erreur inconnue s'est produite.";
        if (error.code === 'auth/email-already-in-use') {
          description = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
        } else if (error.code === 'auth/invalid-email') {
          description = "L'adresse e-mail n'est pas valide.";
        } else if (error.code === 'auth/weak-password') {
          description = 'Le mot de passe est trop faible.';
        }
        toast({ variant: 'destructive', title: 'Erreur de création', description });
        throw error; // Re-throw to be caught by the caller if needed
      }
    },
    [auth, firestore, toast]
  );

  const updateUser = useCallback(
    (userData: User) => {
      const {id, ...data} = userData;
      updateEntity('users', id, data, 'Utilisateur mis à jour', true)
    },
    [updateEntity]
  );

  const deleteUser = useCallback(
    (id: string) => deleteEntity('users', id, 'Utilisateur supprimé', true),
    [deleteEntity]
  );

  const sendPasswordResetEmailForUser = useCallback(async (email: string) => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Service d\'authentification non disponible.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'E-mail envoyé', description: `Un e-mail de réinitialisation de mot de passe a été envoyé à ${email}.` });
    } catch (error: any) {
        console.error("Password reset error:", error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer l\'e-mail de réinitialisation.' });
    }
  }, [auth, toast]);

    const findUserByEmail = useCallback((email: string) => {
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }, [users]);
    
    const handleSignOut = useCallback(async () => {
        if (!auth || !user) return;
        
        await updateDoc(doc(firestore, 'users', user.uid), {
            sessionToken: deleteField()
        });
        
        await signOut(auth);
        localStorage.removeItem('sessionToken');
    }, [auth, user, firestore]);


    const validateSession = useCallback((userId: string, token: string) => {
        const user = users.find(u => u.id === userId);
        return user?.sessionToken === token;
    }, [users]);

    const forceSignOut = useCallback(async (message: string) => {
        await handleSignOut();
        toast({
            variant: 'destructive',
            title: "Session expirée",
            description: message,
        });
    }, [toast, handleSignOut]);

    const forceSignOutUser = useCallback(async (userId: string) => {
        const userRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userRef, {
                sessionToken: deleteField()
            });
            toast({ title: 'Utilisateur déconnecté', description: "La session de l'utilisateur a été terminée." });
        } catch (error) {
            console.error("Error forcing user sign out:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de déconnecter l'utilisateur." });
        }
    }, [firestore, toast]);

  // #endregion

  // #region Generic Entity Management
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
      const category = categories.find((c) => c.id === id);
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
      const item = items.find((i) => i.id === id);
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
      if (!firestore) return;
      const batch = writeBatch(firestore);
      itemIds.forEach((id) => {
        const itemRef = getDocRef('items', id);
        if (itemRef) {
          batch.update(itemRef, { isFavorite: setFavorite });
        }
      });
      await batch.commit();
      toast({ title: `Favoris mis à jour.` });
    },
    [firestore, getDocRef, toast]
  );

  const addCustomer = useCallback(
    (customer: Omit<Customer, 'id' | 'isDefault'>) => {
      const newCustomer = {
        ...customer,
        isDefault: !customers || !customers.some((c) => c.isDefault),
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
      if (!customers || !firestore) return;
      const batch = writeBatch(firestore);
      customers.forEach((c) => {
        const customerRef = getDocRef('customers', c.id);
        if (customerRef) {
          if (c.id === customerId) {
            batch.update(customerRef, { isDefault: !c.isDefault });
          } else if (c.isDefault) {
            batch.update(customerRef, { isDefault: false });
          }
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
      const newCode = Math.max(0, ...vatRates.map((v) => v.code)) + 1;
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

  const setCompanyInfo = useCallback(
    (info: CompanyInfo) => {
      if (companyId && firestore) {
        const { id, ...data } = info;
        const companyRef = doc(firestore, 'companies', companyId);
        setDoc(companyRef, data, { merge: true });
      }
    },
    [companyId, firestore]
  );
  
  const updateSetting = useCallback((key: keyof Omit<CompanyInfo, 'id'>, value: any) => {
    if (companyInfo) {
      setCompanyInfo({ ...companyInfo, [key]: value });
    }
  }, [companyInfo, setCompanyInfo]);

  // #endregion

  // #region Navigation Confirmation
  const showNavConfirm = (url: string) => {
    setNextUrl(url);
    setNavConfirmOpen(true);
  };

  const closeNavConfirm = useCallback(() => {
    setNextUrl(null);
    setNavConfirmOpen(false);
  }, []);

  const confirmNavigation = useCallback(async () => {
    if (nextUrl) {
      await clearOrder();
      routerRef.current.push(nextUrl);
    }
    closeNavConfirm();
  }, [nextUrl, clearOrder, closeNavConfirm]);
  // #endregion

  // #region Derived State
  const popularItems = useMemo(() => {
    if (!sales || !items) return [];
    const itemCounts: { [key: string]: { item: Item; count: number } } = {};
    sales.forEach((sale) => {
      sale.items.forEach((orderItem) => {
        if (itemCounts[orderItem.id]) {
          itemCounts[orderItem.id].count += orderItem.quantity;
        } else {
          const itemDetails = items.find((i) => i.id === orderItem.id);
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
      .map((i) => i.item);
  }, [sales, items, popularItemsCount]);
  // #endregion

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
      users,
      addUser,
      updateUser,
      deleteUser,
      sendPasswordResetEmailForUser,
      findUserByEmail,
      handleSignOut,
      validateSession,
      forceSignOut,
      forceSignOutUser,
      sessionInvalidated,
      setSessionInvalidated,
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
      authRequired,
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
      seedInitialData,
      resetAllData,
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
      users,
      addUser,
      updateUser,
      deleteUser,
      sendPasswordResetEmailForUser,
      findUserByEmail,
      handleSignOut,
      validateSession,
      forceSignOut,
      forceSignOutUser,
      sessionInvalidated,
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
      authRequired,
      showTicketImages,
      popularItemsCount,
      itemCardOpacity,
      enableRestaurantCategoryFilter,
      companyInfo,
      setCompanyInfo,
      isNavConfirmOpen,
      showNavConfirm,
      closeNavConfirm,
      confirmNavigation,
      seedInitialData,
      resetAllData,
      cameFromRestaurant,
      isLoading,
      user,
      updateSetting,
      setSessionInvalidated,
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
