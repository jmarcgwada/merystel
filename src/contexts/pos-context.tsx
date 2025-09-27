

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
import { useToast as useShadcnToast } from '@/hooks/use-toast';
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
  runTransaction,
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
};


interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: OrderItem['id']) => void;
  addSerializedItemToOrder: (item: Item, quantity: number, serialNumbers: string[]) => void;
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
  currentSaleContext: Partial<Sale> & { isTableSale?: boolean } | null;
  recentlyAddedItemId: string | null;
  setRecentlyAddedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  serialNumberItem: { item: Item; quantity: number } | null;
  setSerialNumberItem: React.Dispatch<React.SetStateAction<{ item: Item; quantity: number } | null>>;


  users: User[];
  addUser: (user: Omit<User, 'id' | 'companyId'>, password?: string) => Promise<void>;
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
  promoteTableToTicket: (tableId: string, order: OrderItem[]) => void;

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
  descriptionDisplay: 'none' | 'first' | 'both';
  setDescriptionDisplay: React.Dispatch<React.SetStateAction<'none' | 'first' | 'both'>>;
  popularItemsCount: number;
  setPopularItemsCount: React.Dispatch<React.SetStateAction<number>>;
  itemCardOpacity: number;
  setItemCardOpacity: React.Dispatch<React.SetStateAction<number>>;
  enableRestaurantCategoryFilter: boolean;
  setEnableRestaurantCategoryFilter: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  notificationDuration: number;
  setNotificationDuration: React.Dispatch<React.SetStateAction<number>>;
  enableSerialNumber: boolean;
  setEnableSerialNumber: React.Dispatch<React.SetStateAction<boolean>>;
  directSaleBackgroundColor: string;
  setDirectSaleBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  restaurantModeBackgroundColor: string;
  setRestaurantModeBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  directSaleBgOpacity: number;
  setDirectSaleBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  restaurantModeBgOpacity: number;
  setRestaurantModeBgOpacity: React.Dispatch<React.SetStateAction<number>>;

  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => void;

  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;
  
  seedInitialData: () => void;
  resetAllData: () => void;
  exportConfiguration: () => void;
  importConfiguration: (file: File) => Promise<void>;

  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;

  isLoading: boolean;
  user: CombinedUser | null;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

// Helper function to remove undefined properties from an object before sending to Firebase
const cleanDataForFirebase = (data: any) => {
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === undefined) {
            delete cleanedData[key as keyof typeof cleanedData];
        }
    });
    return cleanedData;
};

// Helper hook for persisting state to localStorage
function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedValue = localStorage.getItem(key);
                return storedValue ? JSON.parse(storedValue) : defaultValue;
            } catch (error) {
                console.error(`Error reading localStorage key “${key}”:`, error);
                return defaultValue;
            }
        }
        return defaultValue;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(`Error setting localStorage key “${key}”:`, error);
            }
        }
    }, [key, state]);

    return [state, setState];
}


export function PosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast: shadcnToast } = useShadcnToast();

  const companyId = SHARED_COMPANY_ID;

  // #region State
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  
  const [showTicketImages, setShowTicketImages] = usePersistentState('settings.showTicketImages', true);
  const [descriptionDisplay, setDescriptionDisplay] = usePersistentState<'none' | 'first' | 'both'>('settings.descriptionDisplay', 'none');
  const [popularItemsCount, setPopularItemsCount] = usePersistentState('settings.popularItemsCount', 10);
  const [itemCardOpacity, setItemCardOpacity] = usePersistentState('settings.itemCardOpacity', 30);
  const [enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter] = usePersistentState('settings.enableRestaurantCategoryFilter', true);
  const [showNotifications, setShowNotifications] = usePersistentState('settings.showNotifications', true);
  const [notificationDuration, setNotificationDuration] = usePersistentState('settings.notificationDuration', 3000);
  const [enableSerialNumber, setEnableSerialNumber] = usePersistentState('settings.enableSerialNumber', true);
  const [directSaleBackgroundColor, setDirectSaleBackgroundColor] = usePersistentState('settings.directSaleBgColor', '#ffffff');
  const [restaurantModeBackgroundColor, setRestaurantModeBackgroundColor] = usePersistentState('settings.restaurantModeBgColor', '#eff6ff');
  const [directSaleBgOpacity, setDirectSaleBgOpacity] = usePersistentState('settings.directSaleBgOpacity', 15);
  const [restaurantModeBgOpacity, setRestaurantModeBgOpacity] = usePersistentState('settings.restaurantModeBgOpacity', 15);
    
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(
    null
  );
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<Sale> & { isTableSale?: boolean } | null>(
    null
  );
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [serialNumberItem, setSerialNumberItem] = useState<{item: Item, quantity: number} | null>(null);
  // #endregion

  // Custom toast function that respects the user setting
  const toast = useCallback((props: Parameters<typeof useShadcnToast>[0]) => {
    if (showNotifications) {
      shadcnToast({
        ...props,
        duration: props?.duration || notificationDuration,
      });
    }
  }, [showNotifications, notificationDuration, shadcnToast]);

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
  
  const tables = useMemo(() => tablesData ? [TAKEAWAY_TABLE, ...tablesData.sort((a, b) => a.number - b.number)] : [TAKEAWAY_TABLE], [tablesData]);
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
        await addDoc(ref, cleanDataForFirebase(data));
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
        await setDoc(ref, cleanDataForFirebase(data), { merge: true });
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

  // #region Config Import/Export
    const exportConfiguration = useCallback(async () => {
        if (!companyId || !firestore) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Connexion à la base de données indisponible.' });
            return;
        }

        toast({ title: 'Exportation en cours...' });

        try {
            const collectionsToExport = ['categories', 'customers', 'items', 'paymentMethods', 'tables', 'vatRates'];
            const config: { [key: string]: any[] } = {};

            for (const collectionName of collectionsToExport) {
                const collectionRef = collection(firestore, 'companies', companyId, collectionName);
                const snapshot = await getDocs(collectionRef);
                config[collectionName] = snapshot.docs.map(doc => ({ ...doc.data(), __id: doc.id }));
            }
            
            const companyDoc = await getDoc(doc(firestore, 'companies', companyId));
            if(companyDoc.exists()) {
                config.companyInfo = [{...companyDoc.data(), __id: companyDoc.id}];
            }

            const jsonString = JSON.stringify(config, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zenith-pos-config-${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: 'Exportation réussie', description: 'Le fichier de configuration a été téléchargé.' });

        } catch (error) {
            console.error("Error exporting configuration:", error);
            toast({ variant: 'destructive', title: 'Erreur d\'exportation' });
        }

    }, [companyId, firestore, toast]);

    const importConfiguration = useCallback(async (file: File) => {
        if (!companyId || !firestore) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Connexion à la base de données indisponible.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result as string;
                const config = JSON.parse(jsonString);

                toast({ title: 'Importation en cours...', description: 'Veuillez ne pas fermer cette page.' });

                // 1. Delete existing data
                const collectionsToDelete = ['categories', 'customers', 'items', 'paymentMethods', 'tables', 'vatRates'];
                const deleteBatch = writeBatch(firestore);
                for (const collectionName of collectionsToDelete) {
                    const collectionRef = collection(firestore, 'companies', companyId, collectionName);
                    const snapshot = await getDocs(collectionRef);
                    snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
                }
                await deleteBatch.commit();

                // 2. Import new data
                const importBatch = writeBatch(firestore);
                for (const collectionName in config) {
                    if (collectionName === 'companyInfo') {
                        const info = config.companyInfo[0];
                        if (info) {
                            const { __id, ...data } = info;
                            const companyRef = doc(firestore, 'companies', companyId);
                            importBatch.set(companyRef, data);
                        }
                    } else {
                        const collectionData = config[collectionName] as any[];
                        collectionData.forEach(item => {
                            const { __id, ...data } = item;
                            const docRef = doc(firestore, 'companies', companyId, collectionName, __id);
                            importBatch.set(docRef, data);
                        });
                    }
                }
                await importBatch.commit();
                
                toast({ title: 'Importation réussie!', description: 'La configuration a été restaurée. L\'application va se recharger.' });
                
                // Force reload to reflect all changes
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                console.error("Error importing configuration:", error);
                toast({ variant: 'destructive', title: 'Erreur d\'importation', description: 'Le fichier est peut-être invalide ou corrompu.' });
            }
        };
        reader.readAsText(file);
    }, [companyId, firestore, toast]);
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
        { name: 'Table 1', description: 'Près de la fenêtre', number: 1, status: 'available', order: [], covers: 4 },
        { name: 'Table 2', description: 'Au fond', number: 2, status: 'available', order: [], covers: 2 },
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
    if(selectedTable && selectedTable.lockedBy) {
        const tableRef = getDocRef('tables', selectedTable.id);
        if (tableRef) {
          await updateDoc(tableRef, { lockedBy: deleteField() });
        }
    }
    setOrder([]);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
  }, [selectedTable, getDocRef]);
  
  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder((currentOrder) =>
      currentOrder.filter((item) => item.id !== itemId)
    );
  }, []);

  const triggerItemHighlight = (itemId: string) => {
    setRecentlyAddedItemId(itemId);
  };
  
  const addSerializedItemToOrder = useCallback((item: Item, quantity: number, serialNumbers: string[]) => {
    const newOrderItem: OrderItem = {
      ...item,
      quantity,
      total: item.price * quantity,
      discount: 0,
      serialNumbers: serialNumbers,
    };
    
    setOrder(currentOrder => {
        const existingItemIndex = currentOrder.findIndex(i => i.id === item.id);
        if (existingItemIndex > -1) {
            const newOrder = [...currentOrder];
            const existingItem = newOrder[existingItemIndex];
            // When updating, we replace the item entirely, including quantity and serials.
            newOrder[existingItemIndex] = newOrderItem;
            return newOrder;
        }
        return [...currentOrder, newOrderItem];
    });

    triggerItemHighlight(item.id);
    toast({ title: `${item.name} ajouté/mis à jour dans la commande` });

  }, [toast]);

  const addToOrder = useCallback(
    (itemId: OrderItem['id']) => {
      if (!items) return;
      const itemToAdd = items.find((i) => i.id === itemId);
      if (!itemToAdd) return;
      
      const existingItem = order.find(
        (item) => item.id === itemId
      );

      if (itemToAdd.requiresSerialNumber && enableSerialNumber) {
          const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
          setSerialNumberItem({ item: itemToAdd, quantity: newQuantity });
          return;
      }

      setOrder((currentOrder) => {
        if (existingItem) {
          const newOrder = [...currentOrder];
          const newQuantity = existingItem.quantity + 1;
          const existingItemIndex = newOrder.findIndex(i => i.id === itemId);
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
    [items, order, toast, enableSerialNumber]
  );

  const updateQuantity = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      const itemToUpdate = order.find((item) => item.id === itemId);
      if (!itemToUpdate) return;
  
      if (itemToUpdate.requiresSerialNumber && enableSerialNumber) {
        if (quantity <= 0) {
          removeFromOrder(itemId);
        } else {
          setSerialNumberItem({ item: itemToUpdate, quantity });
        }
        return;
      }
      
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
    [order, removeFromOrder, enableSerialNumber]
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
  const holdOrder = useCallback(async () => {
    if (currentSaleContext?.isTableSale && currentSaleContext.tableId) {
        const tableRef = getDocRef('tables', currentSaleContext.tableId);
        if (tableRef) {
            await updateDoc(tableRef, { status: 'occupied', lockedBy: deleteField() });
        }
        await clearOrder();
        routerRef.current.push('/restaurant');
        return;
    }

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
    };
    addEntity('heldOrders', newHeldOrder, 'Commande mise en attente');
    await clearOrder();
  }, [order, orderTotal, orderTax, addEntity, clearOrder, toast, currentSaleContext, getDocRef]);
  
  const deleteHeldOrder = useCallback(
    async (orderId: string) => {
      if (!heldOrders) return;
      const orderToDelete = heldOrders.find((o) => o.id === orderId);
      const tableRef = orderToDelete?.tableId ? getDocRef('tables', orderToDelete.tableId) : null;
      
      if (tableRef) {
        await updateDoc(tableRef, { status: 'available', lockedBy: deleteField() });
      }

      await deleteEntity('heldOrders', orderId, 'Ticket en attente supprimé.');
    },
    [heldOrders, getDocRef, deleteEntity, toast, updateDoc]
  );

  const recallOrder = useCallback(async (orderId: string) => {
    if (!heldOrdersRef.current || !user) return;
    const orderToRecall = heldOrdersRef.current.find((o) => o.id === orderId);
    if (orderToRecall) {
      setOrder(orderToRecall.items);
      setCurrentSaleId(orderToRecall.id);
      setSelectedTable(null); // Ensure no table is selected
      setCurrentSaleContext({
          tableId: orderToRecall.tableId,
          tableName: orderToRecall.tableName,
      });
      await deleteEntity('heldOrders', orderId, '');
      toast({ title: 'Commande rappelée' });
      routerRef.current.push('/pos');
    }
  }, [user, deleteEntity, toast]);

    const promoteTableToTicket = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      const tableRef = getDocRef('tables', tableId);
      const table = tables.find(t => t.id === tableId);
      if (!tableRef || !table) return;
      try {
        await updateDoc(tableRef, {
          order: orderData,
          status: 'paying',
          lockedBy: user?.uid
        });
        setCurrentSaleId(`table-${tableId}`);
        setCurrentSaleContext({
          tableId: table.id,
          tableName: table.name,
          isTableSale: true,
        });
      } catch (error) {
        console.error('Error promoting table to ticket:', error);
        toast({ variant: 'destructive', title: 'Erreur de clôture' });
      }
    },
    [getDocRef, toast, tables, user]
  );

const setSelectedTableById = useCallback(async (tableId: string | null) => {
    if (!firestore || !user) {
        return;
    }
    
    // Clear order and selection if tableId is null
    if (!tableId) {
        if(selectedTable) {
             const tableRef = doc(firestore, 'companies', SHARED_COMPANY_ID, 'tables', selectedTable.id);
             await updateDoc(tableRef, { lockedBy: deleteField() });
        }
        await clearOrder();
        return;
    }

    if (tableId === 'takeaway') {
        setCameFromRestaurant(true);
        await clearOrder();
        routerRef.current.push('/pos');
        return;
    }

    const tableRef = doc(firestore, 'companies', SHARED_COMPANY_ID, 'tables', tableId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const tableDoc = await transaction.get(tableRef);
            if (!tableDoc.exists()) {
                throw new Error("La table n'existe pas.");
            }
            const tableData = tableDoc.data() as Table;

            if (tableData.verrou) {
                 throw new Error("Cette table est verrouillée et ne peut pas être sélectionnée.");
            }
            if (tableData.lockedBy && tableData.lockedBy !== user.uid) {
                throw new Error("Cette table est actuellement utilisée par un autre utilisateur.");
            }
            if (tableData.status === 'available') {
                transaction.update(tableRef, { lockedBy: user.uid });
            }
        });
        
        const updatedTableDoc = await getDoc(tableRef);
        const tableData = { ...updatedTableDoc.data(), id: updatedTableDoc.id } as Table;
        
        if (tableData.status === 'paying') {
            promoteTableToTicket(tableData.id, tableData.order);
        } else {
            setSelectedTable(tableData);
            setOrder(tableData.order || []);
        }
        
        setCurrentSaleId(null);
        setCurrentSaleContext({
            tableId: tableData.id,
            tableName: tableData.name,
        });
        routerRef.current.push(`/pos?tableId=${tableId}`);

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Accès impossible',
            description: error.message,
        });
    }

}, [firestore, user, clearOrder, toast, promoteTableToTicket, tables]);


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
      const tableRef = getDocRef('tables', tableId);
      if (tableRef) {
          routerRef.current.push('/restaurant');
          await updateDoc(tableRef, {
            order: orderData,
            status: orderData.length > 0 ? 'occupied' : 'available',
            lockedBy: deleteField()
          });
          toast({ title: 'Table sauvegardée' });
          await clearOrder();
      }
    },
    [getDocRef, clearOrder, toast]
  );

  const forceFreeTable = useCallback(
    async (tableId: string) => {
      if (!firestore) return;
      const batch = writeBatch(firestore);
      const tableRef = getDocRef('tables', tableId);
      if (tableRef) {
        batch.update(tableRef, { status: 'available', order: [], lockedBy: deleteField(), verrou: deleteField() });
      }
      
      // Also delete any associated held order for that table
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
    (tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>) => {
      const newTable: Omit<Table, 'id'> = {
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
  // #endregion

  // #region Sales
  const recordSale = useCallback(
    async (saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>) => {
      if (!companyId || !sales || !firestore) return;
      
      const batch = writeBatch(firestore);
      
      // If sale comes from a table, free the table.
      if (currentSaleContext?.isTableSale && currentSaleContext.tableId) {
        const tableRef = getDocRef('tables', currentSaleContext.tableId);
        if (tableRef) {
          batch.update(tableRef, { status: 'available', order: [], lockedBy: deleteField() });
        }
      }

      // If sale comes from a recalled held order, delete the held order
      if (currentSaleId && !currentSaleContext?.isTableSale) {
        const docRef = getDocRef('heldOrders', currentSaleId);
        if (docRef) batch.delete(docRef);
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
      addSerializedItemToOrder,
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
      serialNumberItem, 
      setSerialNumberItem,
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
      recallOrder,
      deleteHeldOrder,
      authRequired,
      showTicketImages,
      setShowTicketImages,
      descriptionDisplay,
      setDescriptionDisplay,
      popularItemsCount,
      setPopularItemsCount,
      itemCardOpacity,
      setItemCardOpacity,
      enableRestaurantCategoryFilter,
      setEnableRestaurantCategoryFilter,
      showNotifications,
      setShowNotifications,
      notificationDuration,
      setNotificationDuration,
      enableSerialNumber,
      setEnableSerialNumber,
      directSaleBackgroundColor,
      setDirectSaleBackgroundColor,
      restaurantModeBackgroundColor,
      setRestaurantModeBackgroundColor,
      directSaleBgOpacity,
      setDirectSaleBgOpacity,
      restaurantModeBgOpacity,
      setRestaurantModeBgOpacity,
      companyInfo,
      setCompanyInfo,
      isNavConfirmOpen,
      showNavConfirm,
      closeNavConfirm,
      confirmNavigation,
      seedInitialData,
      resetAllData,
      exportConfiguration,
      importConfiguration,
      cameFromRestaurant,
      setCameFromRestaurant,
      isLoading,
      user,
      holdOrder,
    }),
    [
      order,
      setOrder,
      addToOrder,
      addSerializedItemToOrder,
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
      serialNumberItem, 
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
      recallOrder,
      deleteHeldOrder,
      authRequired,
      showTicketImages,
      setShowTicketImages,
      descriptionDisplay,
      setDescriptionDisplay,
      popularItemsCount,
      setPopularItemsCount,
      itemCardOpacity,
      setEnableRestaurantCategoryFilter,
      enableRestaurantCategoryFilter,
      showNotifications,
      setShowNotifications,
      notificationDuration,
      setNotificationDuration,
      enableSerialNumber,
      setEnableSerialNumber,
      directSaleBackgroundColor,
      setDirectSaleBackgroundColor,
      restaurantModeBackgroundColor,
      setRestaurantModeBackgroundColor,
      directSaleBgOpacity,
      setDirectSaleBgOpacity,
      restaurantModeBgOpacity,
      setRestaurantModeBgOpacity,
      companyInfo,
      setCompanyInfo,
      isNavConfirmOpen,
      showNavConfirm,
      closeNavConfirm,
      confirmNavigation,
      seedInitialData,
      resetAllData,
      exportConfiguration,
      importConfiguration,
      cameFromRestaurant,
      isLoading,
      user,
      holdOrder,
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
