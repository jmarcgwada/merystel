
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
  SelectedVariant,
} from '@/lib/types';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay } from 'date-fns';
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
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import type { CombinedUser } from '@/firebase/auth/use-user';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import demoData from '@/lib/demodata.json';

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
  dynamicBgImage: string | null;
  enableDynamicBg: boolean;
  setEnableDynamicBg: React.Dispatch<React.SetStateAction<boolean>>;
  dynamicBgOpacity: number;
  setDynamicBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  readOnlyOrder: OrderItem[] | null;
  setReadOnlyOrder: React.Dispatch<React.SetStateAction<OrderItem[] | null>>;
  addToOrder: (itemId: string, selectedVariants?: SelectedVariant[]) => void;
  addSerializedItemToOrder: (item: Item, quantity: number, serialNumbers: string[]) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  updateItemNote: (itemId: OrderItem['id'], note: string) => void;
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
  currentSaleContext: Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; } | null;
  setCurrentSaleContext: React.Dispatch<React.SetStateAction<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; } | null>>;
  recentlyAddedItemId: string | null;
  setRecentlyAddedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  serialNumberItem: { item: Item; quantity: number } | null;
  setSerialNumberItem: React.Dispatch<React.SetStateAction<{ item: Item; quantity: number } | null>>;
  variantItem: Item | null;
  setVariantItem: React.Dispatch<React.SetStateAction<Item | null>>;
  lastDirectSale: Sale | null;
  lastRestaurantSale: Sale | null;
  loadTicketForViewing: (ticket: Sale) => void;

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
  getCategoryColor: (categoryId: string) => string | undefined;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
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
    sale: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'>,
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
  showItemImagesInGrid: boolean;
  setShowItemImagesInGrid: React.Dispatch<React.SetStateAction<boolean>>;
  descriptionDisplay: 'none' | 'first' | 'both';
  setDescriptionDisplay: React.Dispatch<React.SetStateAction<'none' | 'first' | 'both'>>;
  popularItemsCount: number;
  setPopularItemsCount: React.Dispatch<React.SetStateAction<number>>;
  itemCardOpacity: number;
  setItemCardOpacity: React.Dispatch<React.SetStateAction<number>>;
  paymentMethodImageOpacity: number;
  setPaymentMethodImageOpacity: React.Dispatch<React.SetStateAction<number>>;
  itemDisplayMode: 'grid' | 'list';
  setItemDisplayMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
  itemCardShowImageAsBackground: boolean;
  setItemCardShowImageAsBackground: React.Dispatch<React.SetStateAction<boolean>>;
  itemCardImageOverlayOpacity: number;
  setItemCardImageOverlayOpacity: React.Dispatch<React.SetStateAction<number>>;
  itemCardTextColor: 'light' | 'dark';
  setItemCardTextColor: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  itemCardShowPrice: boolean;
  setItemCardShowPrice: React.Dispatch<React.SetStateAction<boolean>>;
  externalLinkModalEnabled: boolean;
  setExternalLinkModalEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  externalLinkUrl: string;
  setExternalLinkUrl: React.Dispatch<React.SetStateAction<string>>;
  externalLinkTitle: string;
  setExternalLinkTitle: React.Dispatch<React.SetStateAction<string>>;
  externalLinkModalWidth: number;
  setExternalLinkModalWidth: React.Dispatch<React.SetStateAction<number>>;
  externalLinkModalHeight: number;
  setExternalLinkModalHeight: React.Dispatch<React.SetStateAction<number>>;
  showDashboardStats: boolean;
  setShowDashboardStats: React.Dispatch<React.SetStateAction<boolean>>;
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
  dashboardBgType: 'color' | 'image';
  setDashboardBgType: React.Dispatch<React.SetStateAction<'color' | 'image'>>;
  dashboardBackgroundColor: string;
  setDashboardBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  dashboardBackgroundImage: string;
  setDashboardBackgroundImage: React.Dispatch<React.SetStateAction<string>>;
  dashboardBgOpacity: number;
  setDashboardBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  dashboardButtonBackgroundColor: string;
  setDashboardButtonBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  dashboardButtonOpacity: number;
  setDashboardButtonOpacity: React.Dispatch<React.SetStateAction<number>>;
  dashboardButtonShowBorder: boolean;
  setDashboardButtonShowBorder: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardButtonBorderColor: string;
  setDashboardButtonBorderColor: React.Dispatch<React.SetStateAction<string>>;
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
  importDemoData: () => Promise<void>;
  importDemoCustomers: () => Promise<void>;
  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  user: CombinedUser | null;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

// Helper function to recursively remove undefined properties from an object before sending to Firebase
const cleanDataForFirebase = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForFirebase(item));
  }
  if (data !== null && typeof data === 'object') {
    // This handles Firebase Timestamps and other special objects correctly
    if (typeof data.toDate === 'function' || data instanceof Timestamp) {
        return data;
    }
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        (acc as any)[key] = cleanDataForFirebase(value);
      }
      return acc;
    }, {});
  }
  return data;
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
  const [dynamicBgImage, setDynamicBgImage] = useState<string | null>(null);
  const [enableDynamicBg, setEnableDynamicBg] = usePersistentState('settings.enableDynamicBg', true);
  const [dynamicBgOpacity, setDynamicBgOpacity] = usePersistentState('settings.dynamicBgOpacity', 10);
  const [readOnlyOrder, setReadOnlyOrder] = useState<OrderItem[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  
  const [showTicketImages, setShowTicketImages] = usePersistentState('settings.showTicketImages', true);
  const [showItemImagesInGrid, setShowItemImagesInGrid] = usePersistentState('settings.showItemImagesInGrid', true);
  const [descriptionDisplay, setDescriptionDisplay] = usePersistentState<'none' | 'first' | 'both'>('settings.descriptionDisplay', 'none');
  const [popularItemsCount, setPopularItemsCount] = usePersistentState('settings.popularItemsCount', 10);
  const [itemCardOpacity, setItemCardOpacity] = usePersistentState('settings.itemCardOpacity', 30);
  const [paymentMethodImageOpacity, setPaymentMethodImageOpacity] = usePersistentState('settings.paymentMethodImageOpacity', 20);
  const [itemDisplayMode, setItemDisplayMode] = usePersistentState<'grid' | 'list'>('settings.itemDisplayMode', 'grid');
  const [itemCardShowImageAsBackground, setItemCardShowImageAsBackground] = usePersistentState('settings.itemCardShowImageAsBackground', false);
  const [itemCardImageOverlayOpacity, setItemCardImageOverlayOpacity] = usePersistentState('settings.itemCardImageOverlayOpacity', 30);
  const [itemCardTextColor, setItemCardTextColor] = usePersistentState<'light' | 'dark'>('settings.itemCardTextColor', 'dark');
  const [itemCardShowPrice, setItemCardShowPrice] = usePersistentState('settings.itemCardShowPrice', true);
  const [externalLinkModalEnabled, setExternalLinkModalEnabled] = usePersistentState('settings.externalLinkModalEnabled', false);
  const [externalLinkUrl, setExternalLinkUrl] = usePersistentState('settings.externalLinkUrl', '');
  const [externalLinkTitle, setExternalLinkTitle] = usePersistentState('settings.externalLinkTitle', '');
  const [externalLinkModalWidth, setExternalLinkModalWidth] = usePersistentState('settings.externalLinkModalWidth', 80);
  const [externalLinkModalHeight, setExternalLinkModalHeight] = usePersistentState('settings.externalLinkModalHeight', 90);
  const [showDashboardStats, setShowDashboardStats] = usePersistentState('settings.showDashboardStats', true);
  const [enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter] = usePersistentState('settings.enableRestaurantCategoryFilter', true);
  const [showNotifications, setShowNotifications] = usePersistentState('settings.showNotifications', true);
  const [notificationDuration, setNotificationDuration] = usePersistentState('settings.notificationDuration', 3000);
  const [enableSerialNumber, setEnableSerialNumber] = usePersistentState('settings.enableSerialNumber', true);
  const [directSaleBackgroundColor, setDirectSaleBackgroundColor] = usePersistentState('settings.directSaleBgColor', '#ffffff');
  const [restaurantModeBackgroundColor, setRestaurantModeBackgroundColor] = usePersistentState('settings.restaurantModeBgColor', '#eff6ff');
  const [directSaleBgOpacity, setDirectSaleBgOpacity] = usePersistentState('settings.directSaleBgOpacity', 15);
  const [restaurantModeBgOpacity, setRestaurantModeBgOpacity] = usePersistentState('settings.restaurantModeBgOpacity', 15);
  const [dashboardBgType, setDashboardBgType] = usePersistentState<'color' | 'image'>('settings.dashboardBgType', 'color');
  const [dashboardBackgroundColor, setDashboardBackgroundColor] = usePersistentState('settings.dashboardBgColor', '#f8fafc');
  const [dashboardBackgroundImage, setDashboardBackgroundImage] = usePersistentState('settings.dashboardBgImage', '');
  const [dashboardBgOpacity, setDashboardBgOpacity] = usePersistentState('settings.dashboardBgOpacity', 100);
  const [dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor] = usePersistentState('settings.dashboardButtonBgColor', '#ffffff');
  const [dashboardButtonOpacity, setDashboardButtonOpacity] = usePersistentState('settings.dashboardButtonOpacity', 100);
  const [dashboardButtonShowBorder, setDashboardButtonShowBorder] = usePersistentState('settings.dashboardButtonShowBorder', true);
  const [dashboardButtonBorderColor, setDashboardButtonBorderColor] = usePersistentState('settings.dashboardButtonBorderColor', '#e2e8f0');
    
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(
    null
  );
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; } | null>(
    null
  );
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [serialNumberItem, setSerialNumberItem] = useState<{item: Item, quantity: number} | null>(null);
  const [variantItem, setVariantItem] = useState<Item | null>(null);
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
        return null;
      }
      try {
        const docRef = await addDoc(ref, cleanDataForFirebase(data));
        toast({ title: toastTitle });
        return { ...data, id: docRef.id };
      } catch (error) {
        console.error(`Error adding ${collectionName}:`, error);
        toast({ variant: 'destructive', title: `Erreur lors de l'ajout` });
        return null;
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
  const importDemoData = useCallback(async () => {
    if (!firestore || !companyId || !vatRates) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Les services ne sont pas prêts.' });
        return;
    }

    toast({ title: 'Importation des données de démo...' });
    
    try {
        const batch = writeBatch(firestore);
        const categoryIdMap: { [key: string]: string } = {};

        const defaultVatId = vatRates.find(v => v.rate === 20)?.id || vatRates[0]?.id;

        if (!defaultVatId) {
            toast({ variant: 'destructive', title: 'Erreur de configuration', description: 'Aucun taux de TVA n\'est configuré. Veuillez en ajouter un avant d\'importer.' });
            return;
        }

        for (const category of demoData.categories) {
            const newCategoryRef = doc(collection(firestore, 'companies', companyId, 'categories'));
            categoryIdMap[category.name] = newCategoryRef.id;
            batch.set(newCategoryRef, { name: category.name, image: `https://picsum.photos/seed/${newCategoryRef.id}/200/150` });

            for (const item of category.items) {
                const newItemRef = doc(collection(firestore, 'companies', companyId, 'items'));
                batch.set(newItemRef, {
                    name: item.name,
                    price: item.price,
                    description: item.description,
                    categoryId: newCategoryRef.id,
                    vatId: defaultVatId,
                    image: `https://picsum.photos/seed/${newItemRef.id}/200/150`,
                    barcode: `${newCategoryRef.id.slice(0,3)}${newItemRef.id.slice(0,8)}`
                });
            }
        }

        await batch.commit();
        toast({ title: 'Importation réussie', description: 'Les articles et catégories de démonstration ont été ajoutés.' });
    } catch (error) {
        console.error('Error importing demo data:', error);
        toast({ variant: 'destructive', title: 'Erreur d\'importation' });
    }
  }, [firestore, companyId, vatRates, toast]);

    const importDemoCustomers = useCallback(async () => {
    if (!firestore || !companyId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La base de données n\'est pas prête.' });
      return;
    }
    toast({ title: 'Importation des clients de démo...' });

    const demoCustomers = [
      { name: 'Alice Martin', email: 'alice.martin@example.com', phone: '0612345678', address: '12 Rue de la Paix', postalCode: '75002', city: 'Paris', country: 'France' },
      { name: 'Bruno Petit', email: 'bruno.petit@example.com', phone: '0623456789', address: '45 Avenue des Champs-Élysées', postalCode: '75008', city: 'Paris', country: 'France' },
      { name: 'Chloé Durand', email: 'chloe.durand@example.com', phone: '0634567890', address: '8 Rue de la République', postalCode: '69001', city: 'Lyon', country: 'France' },
      { name: 'David Lefebvre', email: 'david.lefebvre@example.com', phone: '0645678901', address: '22 Quai de la Joliette', postalCode: '13002', city: 'Marseille', country: 'France' },
      { name: 'Émilie Moreau', email: 'emilie.moreau@example.com', phone: '0656789012', address: '15 Place du Capitole', postalCode: '31000', city: 'Toulouse', country: 'France' },
      { name: 'François Lambert', email: 'francois.lambert@example.com', phone: '0667890123', address: '5 Rue Nationale', postalCode: '59000', city: 'Lille', country: 'France' },
      { name: 'Gabrielle Simon', email: 'gabrielle.simon@example.com', phone: '0678901234', address: '30 Place de la Bourse', postalCode: '33000', city: 'Bordeaux', country: 'France' },
      { name: 'Hugo Bernard', email: 'hugo.bernard@example.com', phone: '0689012345', address: '1 Place Masséna', postalCode: '06000', city: 'Nice', country: 'France' },
      { name: 'Inès Girard', email: 'ines.girard@example.com', phone: '0690123456', address: '10 Rue de la Krutenau', postalCode: '67000', city: 'Strasbourg', country: 'France' },
      { name: 'Julien Laurent', email: 'julien.laurent@example.com', phone: '0601234567', address: '2 Rue du Calvaire', postalCode: '44000', city: 'Nantes', country: 'France' },
    ];
    
    try {
      const batch = writeBatch(firestore);
      const customersRef = collection(firestore, 'companies', companyId, 'customers');
      
      demoCustomers.forEach(customer => {
        const newCustomerRef = doc(customersRef);
        batch.set(newCustomerRef, customer);
      });

      await batch.commit();
      toast({ title: 'Clients de démo ajoutés', description: '10 clients fictifs ont été ajoutés à votre liste.' });
    } catch (error) {
      console.error('Error importing demo customers:', error);
      toast({ variant: 'destructive', title: 'Erreur d\'importation des clients' });
    }
  }, [firestore, companyId, toast]);

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

      const defaultCategories = [
        { id: 'boulangerie', name: 'Boulangerie', color: '#f59e0b' },
        { id: 'patisserie', name: 'Pâtisserie', color: '#ec4899' },
        { id: 'epicerie_sucree', name: 'Épicerie Sucrée', color: '#8b5cf6' },
        { id: 'epicerie_salee', name: 'Épicerie Salée', color: '#10b981' },
        { id: 'boissons_fraiches', name: 'Boissons Fraîches', color: '#3b82f6' },
        { id: 'boissons_chaudes', name: 'Boissons Chaudes', color: '#a16207' },
        { id: 'vins_spiritueux', name: 'Vins & Spiritueux', color: '#dc2626' },
        { id: 'fruits_legumes', name: 'Fruits & Légumes', color: '#84cc16' },
        { id: 'cremerie', name: 'Crémerie', color: '#fde047' },
        { id: 'boucherie', name: 'Boucherie', color: '#ef4444', isRestaurantOnly: true },
        { id: 'plats_cuisines', name: 'Plats Cuisinés', color: '#f97316', isRestaurantOnly: true },
        { id: 'sandwichs', name: 'Sandwichs', color: '#64748b' },
      ];

      const defaultVatRates = [
        { id: 'vat_0', name: 'Exonéré', rate: 0, code: 1 },
        { id: 'vat_20', name: 'Taux Normal', rate: 20, code: 2 },
        { id: 'vat_8_5', name: 'Taux Spécifique', rate: 8.5, code: 3 },
        { id: 'vat_10', name: 'Taux Intermédiaire', rate: 10, code: 4 },
        { id: 'vat_5_5', name: 'Taux Réduit', rate: 5.5, code: 5 },
      ];
      
      const defaultPaymentMethods = [
        { name: 'Espèces', icon: 'cash', type: 'direct', isActive: true },
        { name: 'Carte Bancaire', icon: 'card', type: 'direct', isActive: true },
        { name: 'Chèque', icon: 'check', type: 'direct', isActive: true },
        { name: 'AUTRE', icon: 'other', type: 'direct', isActive: true },
      ];
      
      const defaultCustomers = [
        { name: 'Client au comptoir', isDefault: true },
      ];

      const defaultTables = [
        { name: 'Table 1', description: 'Près de la fenêtre', number: 1, status: 'available', order: [], covers: 4 },
        { name: 'Table 2', description: 'Au fond', number: 2, status: 'available', order: [], covers: 2 },
      ];

      const defaultItems = [
        // Boulangerie (10)
        { name: 'Baguette Tradition', price: 1.30, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: '3700123456789' },
        { name: 'Croissant au Beurre AOP', price: 1.50, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: '3700123456796' },
        { name: 'Pain au Chocolat', price: 1.70, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: '3700123456802' },
        { name: 'Pain Complet Bio', price: 2.80, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: 'REF-PAIN-COMP' },
        { name: 'Pain aux Céréales', price: 3.10, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: 'REF-PAIN-CERE' },
        { name: 'Ficelle Apéro', price: 2.50, categoryId: 'boulangerie', vatId: 'vat_20', barcode: 'APERO-FICELLE' },
        { name: 'Brioche Nanterre', price: 5.50, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: 'BRIOCHE-NANT' },
        { name: 'Pain de Mie Artisanal', price: 4.20, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: 'PAIN-MIE-ART' },
        { name: 'Gougère au fromage', price: 1.90, categoryId: 'boulangerie', vatId: 'vat_20', barcode: 'GOUGERE-FROM' },
        { name: 'Pain de Seigle', price: 3.50, categoryId: 'boulangerie', vatId: 'vat_5_5', barcode: 'REF-PAIN-SEI' },
        // Pâtisserie (12)
        { name: 'Éclair au Chocolat', price: 3.50, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-ECL-CHO' },
        { name: 'Éclair au Café', price: 3.50, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-ECL-CAF' },
        { name: 'Tartelette Citron Meringuée', price: 4.20, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-TAR-CIT' },
        { name: 'Mille-feuille', price: 4.50, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: '3700123456819' },
        { name: 'Paris-Brest', price: 4.80, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-PAR-BRE' },
        { name: 'Opéra', price: 5.00, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-OPERA' },
        { name: 'Fraisier (part)', price: 5.20, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-FRAISIER' },
        { name: 'Tarte aux Pommes (part)', price: 3.80, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-TAR-POM' },
        { name: 'Flan Pâtissier', price: 3.20, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-FLAN' },
        { name: 'Canelé Bordelais', price: 2.50, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'PAT-CANELE' },
        { name: 'Macaron Pistache', price: 1.80, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'MAC-PIST' },
        { name: 'Macaron Framboise', price: 1.80, categoryId: 'patisserie', vatId: 'vat_5_5', barcode: 'MAC-FRAMB' },
        // Épicerie Sucrée (10)
        { name: 'Confiture de Fraises 350g', price: 4.80, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'CONF-FRA-350G' },
        { name: 'Miel de Lavande 250g', price: 6.50, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'MIEL-LAV-250G' },
        { name: 'Tablette Chocolat Noir 70%', price: 3.90, categoryId: 'epicerie_sucree', vatId: 'vat_20', barcode: 'CHOC-NOIR-70' },
        { name: 'Pâte à Tartiner Noisette', price: 5.90, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'PATE-TART-NOI' },
        { name: 'Sablés Bretons', price: 4.10, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'SABLES-BRET' },
        { name: 'Caramels au Beurre Salé', price: 6.00, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'CARAM-BS' },
        { name: 'Nougat de Montélimar', price: 5.20, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'NOUGAT-MONT' },
        { name: 'Sucre de Canne Bio 1kg', price: 3.50, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'SUCRE-CAN-BIO' },
        { name: 'Sirop d\'Érable 250ml', price: 7.20, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'SIROP-ERABLE' },
        { name: 'Cacao en Poudre non sucré', price: 4.90, categoryId: 'epicerie_sucree', vatId: 'vat_5_5', barcode: 'CACAO-POUDRE' },
        // Épicerie Salée (10)
        { name: 'Huile d\'Olive Vierge Extra 50cl', price: 9.50, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'HUILE-OLI-50CL' },
        { name: 'Pâtes artisanales Tagliatelle 500g', price: 3.20, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'PATES-TAGLIA' },
        { name: 'Sel de Guérande 250g', price: 2.50, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'SEL-GUER-250G' },
        { name: 'Vinaigre Balsamique de Modène', price: 6.80, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'VINAIGRE-BALS' },
        { name: 'Moutarde de Dijon à l\'Ancienne', price: 3.10, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'MOUTARDE-DIJ' },
        { name: 'Tapenade Noire 100g', price: 4.50, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'TAPENADE-NOIRE' },
        { name: 'Rillettes de Canard 180g', price: 7.90, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'RILLET-CANARD' },
        { name: 'Chips Artisanales Paprika', price: 2.90, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'CHIPS-PAPRIKA' },
        { name: 'Soupe de Poisson 500ml', price: 6.20, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'SOUPE-POISSON' },
        { name: 'Poivre Noir de Kampot', price: 8.50, categoryId: 'epicerie_salee', vatId: 'vat_5_5', barcode: 'POIVRE-KAMPOT' },
        // Boissons Fraîches (10)
        { name: 'Jus de Pomme Artisanal 1L', price: 3.80, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'JUS-POM-1L' },
        { name: 'Limonade Bio 33cl', price: 2.90, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'LIMO-BIO-33CL' },
        { name: 'Eau Minérale Gazeuse 50cl', price: 1.50, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: '3700123456826' },
        { name: 'Coca-Cola 33cl', price: 2.50, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'COCA-33' },
        { name: 'Ice Tea Pêche 33cl', price: 2.80, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'ICETEA-PECHE' },
        { name: 'Jus d\'Ananas 25cl', price: 3.20, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'JUS-ANANAS' },
        { name: 'Bière Blonde Locale 33cl', price: 4.50, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'BIERE-BLOND-LOC' },
        { name: 'Orangina 25cl', price: 2.70, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'ORANGINA-25' },
        { name: 'Eau Plate 50cl', price: 1.20, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'EAU-PLATE-50' },
        { name: 'Jus de Tomate 25cl', price: 3.00, categoryId: 'boissons_fraiches', vatId: 'vat_20', barcode: 'JUS-TOMATE' },
        // Boissons Chaudes (8)
        { name: 'Café Espresso', price: 2.20, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'CAFE-ESPRESSO' },
        { name: 'Café Allongé', price: 2.50, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'CAFE-ALLONGE' },
        { name: 'Cappuccino', price: 3.80, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'CAFE-CAPPU' },
        { name: 'Thé Vert Sencha', price: 3.50, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'THE-SENCHA' },
        { name: 'Thé Noir Earl Grey', price: 3.50, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'THE-EARLGREY' },
        { name: 'Infusion Verveine', price: 3.50, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'INF-VERVEINE' },
        { name: 'Chocolat Chaud Viennois', price: 4.50, categoryId: 'boissons_chaudes', vatId: 'vat_10', barcode: 'CHOCO-VIENNOI' },
        { name: 'Vin Chaud (Hiver)', price: 4.00, categoryId: 'boissons_chaudes', vatId: 'vat_20', barcode: 'VIN-CHAUD' },
        // Vins & Spiritueux (8)
        { name: 'Verre de Bordeaux Rouge', price: 5.50, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'VIN-ROUGE-VERRE' },
        { name: 'Bouteille de Bordeaux Rouge', price: 28.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'VIN-ROUGE-BOUT' },
        { name: 'Verre de Chardonnay Blanc', price: 5.50, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'VIN-BLANC-VERRE' },
        { name: 'Bouteille de Rosé de Provence', price: 26.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'VIN-ROSE-BOUT' },
        { name: 'Coupe de Champagne', price: 9.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'CHAMP-COUPE' },
        { name: 'Whisky Single Malt', price: 12.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'WHISKY-SINGLE' },
        { name: 'Rhum Arrangé Maison', price: 8.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'RHUM-ARRANGE' },
        { name: 'Pastis', price: 4.00, categoryId: 'vins_spiritueux', vatId: 'vat_20', barcode: 'PASTIS-51' },
        // Crémerie (10)
        { name: 'Yaourt Nature Bio', price: 1.20, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'YAOURT-NAT-BIO' },
        { name: 'Beurre Doux AOP 250g', price: 3.80, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'BEURRE-DOUX' },
        { name: 'Fromage de Chèvre Frais', price: 4.50, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'CHEVRE-FRAIS' },
        { name: 'Camembert au Lait Cru', price: 5.20, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'CAMEM-LAITCRU' },
        { name: 'Comté 18 mois (100g)', price: 4.00, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'COMTE-18MOIS' },
        { name: 'Lait Entier Frais 1L', price: 1.80, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'LAIT-ENTIER' },
        { name: 'Crème Fraîche Épaisse 20cl', price: 2.10, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'CREME-FRAICHE' },
        { name: 'Fromage Blanc 500g', price: 3.30, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'FROM-BLANC' },
        { name: 'Part de Roquefort', price: 4.80, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'ROQUEFORT-PART' },
        { name: 'Tomme de Savoie (100g)', price: 3.50, categoryId: 'cremerie', vatId: 'vat_5_5', barcode: 'TOMME-SAVOIE' },
        // Fruits & Légumes (10)
        { name: 'Pommes Golden (kg)', price: 3.50, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'FRU-POM-GOL' },
        { name: 'Bananes (kg)', price: 2.80, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'FRU-BAN' },
        { name: 'Salade Laitue', price: 1.50, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'LEG-LAITUE' },
        { name: 'Tomates Grappe (kg)', price: 4.20, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'LEG-TOM-GR' },
        { name: 'Courgettes (kg)', price: 3.80, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'LEG-COURG' },
        { name: 'Avocat', price: 1.90, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'FRU-AVOCAT' },
        { name: 'Oignons Jaunes (filet)', price: 2.20, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'LEG-OIGNON-J' },
        { name: 'Pommes de Terre (kg)', price: 2.50, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'LEG-PDT' },
        { name: 'Fraises Gariguette (barquette)', price: 5.50, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'FRU-FRAISE-G' },
        { name: 'Citrons Jaunes (pièce)', price: 0.80, categoryId: 'fruits_legumes', vatId: 'vat_5_5', barcode: 'FRU-CITRON-J' },
        // Boucherie (5, restaurant)
        { name: 'Entrecôte de Boeuf (300g)', price: 24.00, categoryId: 'boucherie', vatId: 'vat_10', barcode: 'BOU-ENTREC', isRestaurantOnly: true },
        { name: 'Côte de Veau', price: 22.00, categoryId: 'boucherie', vatId: 'vat_10', barcode: 'BOU-COTE-VEAU', isRestaurantOnly: true },
        { name: 'Magret de Canard', price: 19.50, categoryId: 'boucherie', vatId: 'vat_10', barcode: 'BOU-MAGRET', isRestaurantOnly: true },
        { name: 'Saucisse de Toulouse', price: 14.00, categoryId: 'boucherie', vatId: 'vat_10', barcode: 'BOU-SAUCISSE', isRestaurantOnly: true },
        { name: 'Tartare de Boeuf Préparé', price: 17.00, categoryId: 'boucherie', vatId: 'vat_10', barcode: 'BOU-TARTARE', isRestaurantOnly: true },
        // Plats Cuisinés (5, restaurant)
        { name: 'Lasagnes Bolognaises Maison', price: 15.50, categoryId: 'plats_cuisines', vatId: 'vat_10', barcode: 'PLA-LASAGNE', isRestaurantOnly: true },
        { name: 'Parmentier de Canard', price: 16.50, categoryId: 'plats_cuisines', vatId: 'vat_10', barcode: 'PLA-PARMENTIER', isRestaurantOnly: true },
        { name: 'Blanquette de Veau', price: 17.50, categoryId: 'plats_cuisines', vatId: 'vat_10', barcode: 'PLA-BLANQUETTE', isRestaurantOnly: true },
        { name: 'Ratatouille Niçoise', price: 13.00, categoryId: 'plats_cuisines', vatId: 'vat_10', barcode: 'PLA-RATATOUILLE', isRestaurantOnly: true },
        { name: 'Poisson du jour et ses petits légumes', price: 21.00, categoryId: 'plats_cuisines', vatId: 'vat_10', barcode: 'PLA-POISSON-JOUR', isRestaurantOnly: true },
        // Sandwichs (5)
        { name: 'Le Parisien (Jambon-Beurre)', price: 5.50, categoryId: 'sandwichs', vatId: 'vat_10', barcode: 'SAND-PARISIEN' },
        { name: 'Le Végétarien (Houmous, légumes grillés)', price: 6.80, categoryId: 'sandwichs', vatId: 'vat_10', barcode: 'SAND-VEGE' },
        { name: 'Le Nordique (Saumon fumé, crème aneth)', price: 7.50, categoryId: 'sandwichs', vatId: 'vat_10', barcode: 'SAND-NORDIQUE' },
        { name: 'L\'Italien (Jambon cru, mozza, pesto)', price: 7.20, categoryId: 'sandwichs', vatId: 'vat_10', barcode: 'SAND-ITALIEN' },
        { name: 'Le Complet (Poulet, oeuf, tomate, salade)', price: 7.00, categoryId: 'sandwichs', vatId: 'vat_10', barcode: 'SAND-COMPLET' },
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
          const { isRestaurantOnly, ...itemData } = data;
          const category = defaultCategories.find(c => c.id === itemData.categoryId);
          const fullItemData = { ...itemData, isRestaurantOnly: category?.isRestaurantOnly || false };
          batch.set(ref, fullItemData);
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
    if (readOnlyOrder) {
      setReadOnlyOrder(null);
    }
    setOrder([]);
    setDynamicBgImage(null);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
  }, [readOnlyOrder]);
  
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
      itemId: item.id,
      id: uuidv4(),
      name: item.name,
      price: item.price,
      vatId: item.vatId,
      image: item.image,
      quantity,
      total: item.price * quantity,
      discount: 0,
      description: item.description,
      description2: item.description2,
      serialNumbers: serialNumbers,
    };
    
    setOrder(currentOrder => {
        const existingItemIndex = currentOrder.findIndex(i => i.itemId === item.id);
        if (existingItemIndex > -1 && currentOrder[existingItemIndex].serialNumbers?.length === serialNumbers.length) {
            const newOrder = [...currentOrder];
            newOrder[existingItemIndex] = { ...newOrder[existingItemIndex], serialNumbers };
            return newOrder;
        } else if (existingItemIndex > -1) {
            const newOrder = [...currentOrder.filter(i => i.itemId !== item.id), newOrderItem];
            return newOrder;
        }
        return [...currentOrder, newOrderItem];
    });
    if(item.image) setDynamicBgImage(item.image);
    triggerItemHighlight(item.id);
    toast({ title: `${item.name} ajouté/mis à jour dans la commande` });
  }, [toast]);

  const addToOrder = useCallback(
    (itemId: string, selectedVariants?: SelectedVariant[]) => {
      if (!items) return;
      const itemToAdd = items.find((i) => i.id === itemId);
      if (!itemToAdd) return;
      
      const uniqueId = selectedVariants ? uuidv4() : itemToAdd.id;

      const existingItemIndex = order.findIndex(
        (item) => item.itemId === itemId && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );

      if (itemToAdd.requiresSerialNumber && enableSerialNumber) {
          const newQuantity = (order[existingItemIndex]?.quantity || 0) + 1;
          setSerialNumberItem({ item: itemToAdd, quantity: newQuantity });
          return;
      }
      
      if (itemToAdd.hasVariants && itemToAdd.variantOptions && !selectedVariants) {
        setVariantItem(itemToAdd);
        return;
      }

      setOrder((currentOrder) => {
        if (existingItemIndex > -1) { // Group identical items (with same variants)
          const newOrder = [...currentOrder];
          const newQuantity = newOrder[existingItemIndex].quantity + 1;
          newOrder[existingItemIndex] = {
            ...newOrder[existingItemIndex],
            quantity: newQuantity,
            total:
              newOrder[existingItemIndex].price * newQuantity - (newOrder[existingItemIndex].discount || 0),
          };
           // Move to top
           const itemToMove = newOrder.splice(existingItemIndex, 1)[0];
          return [itemToMove, ...newOrder];
        } else {
          const newItem: OrderItem = {
            itemId: itemToAdd.id,
            id: uniqueId,
            name: itemToAdd.name,
            price: itemToAdd.price,
            vatId: itemToAdd.vatId,
            image: itemToAdd.image,
            quantity: 1,
            total: itemToAdd.price,
            discount: 0,
            description: itemToAdd.description,
            description2: itemToAdd.description2,
            barcode: itemToAdd.barcode,
            selectedVariants,
            serialNumbers: [],
          };
          return [newItem, ...currentOrder];
        }
      });
      if(itemToAdd.image) setDynamicBgImage(itemToAdd.image);
      triggerItemHighlight(uniqueId);
      toast({ title: `${itemToAdd.name} ajouté à la commande` });
    },
    [items, order, toast, enableSerialNumber]
  );

  const updateQuantity = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      const itemToUpdate = order.find((item) => item.id === itemId);
      if (!itemToUpdate) return;
      
      const originalItem = items?.find(i => i.id === itemToUpdate.itemId);
      if(!originalItem) return;

      if (originalItem.requiresSerialNumber && enableSerialNumber) {
        if (quantity <= 0) {
          removeFromOrder(itemId);
        } else {
          setSerialNumberItem({ item: originalItem, quantity });
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
    [order, removeFromOrder, enableSerialNumber, items]
  );
  
  const updateQuantityFromKeypad = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      updateQuantity(itemId, quantity);
    },
    [updateQuantity]
  );

   const updateItemNote = useCallback((itemId: OrderItem['id'], note: string) => {
    setOrder(currentOrder =>
      currentOrder.map(item =>
        item.id === itemId ? { ...item, note } : item
      )
    );
    toast({ title: 'Note ajoutée à l\'article.' });
  }, [toast]);

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
    () => (readOnlyOrder || order).reduce((sum, item) => sum + item.total, 0),
    [order, readOnlyOrder]
  );
  const orderTax = useMemo(() => {
    if (!vatRates) return 0;
    return (readOnlyOrder || order).reduce((sum, item) => {
      const vat = vatRates.find((v) => v.id === item.vatId);
      const taxForItem = item.total * ((vat?.rate || 0) / 100);
      return sum + taxForItem;
    }, 0);
  }, [order, readOnlyOrder, vatRates]);
  // #endregion

  // #region Held Order & Table Management
  const recallOrder = useCallback(async (orderId: string) => {
    if (!heldOrdersRef.current) return;
    const orderToRecall = heldOrdersRef.current.find((o) => o.id === orderId);
    if (orderToRecall) {
      setOrder(orderToRecall.items);
      if(orderToRecall.items?.[0]?.image) setDynamicBgImage(orderToRecall.items[0].image);
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
  }, [deleteEntity, toast]);

  const setSelectedTableById = useCallback(
    (tableId: string | null) => {
      if (tableId && tableId === 'takeaway') {
          setCameFromRestaurant(true);
          clearOrder();
          routerRef.current.push('/pos?from=restaurant');
      } else {
          const tableToSelect = tableId ? tables.find((t) => t.id === tableId) : null;
          setSelectedTable(tableToSelect || null);
          const tableOrder = tableToSelect?.order || [];
          setOrder(tableOrder);
          if (tableOrder.length > 0 && tableOrder[0].image) {
            setDynamicBgImage(tableOrder[0].image);
          } else {
            setDynamicBgImage(null);
          }
          setCurrentSaleId(null);
          setCurrentSaleContext({
              tableId: tableToSelect?.id,
              tableName: tableToSelect?.name,
              isTableSale: !!tableToSelect && tableToSelect.id !== 'takeaway'
          });
      }
    },
    [tables, clearOrder, setCameFromRestaurant]
  );
  
  const holdOrder = useCallback(async () => {
    if (currentSaleContext?.isTableSale && currentSaleContext.tableId) {
        const tableRef = getDocRef('tables', currentSaleContext.tableId);
        if (tableRef) {
            await updateDoc(tableRef, { status: 'occupied' });
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
    await addEntity('heldOrders', newHeldOrder, 'Commande mise en attente');
    clearOrder();
  }, [order, orderTotal, orderTax, addEntity, clearOrder, toast, currentSaleContext, getDocRef]);
  
  const deleteHeldOrder = useCallback(
    async (orderId: string) => {
      if (!heldOrders) return;
      const orderToDelete = heldOrders.find((o) => o.id === orderId);
      const tableRef = orderToDelete?.tableId ? getDocRef('tables', orderToDelete.tableId) : null;
      
      if (tableRef) {
        await updateDoc(tableRef, { status: 'available' });
      }
      await deleteEntity('heldOrders', orderId, 'Ticket en attente supprimé.');
    },
    [heldOrders, getDocRef, deleteEntity, toast]
  );
  
  const promoteTableToTicket = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      const tableRef = getDocRef('tables', tableId);
      const table = tables.find(t => t.id === tableId);
      if (!tableRef || !table) return;
      try {
        await updateDoc(tableRef, {
          order: orderData.map(cleanDataForFirebase),
          status: 'paying',
          occupiedByUserId: user?.uid,
          occupiedAt: table.status === 'available' ? serverTimestamp() : table.occupiedAt,
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

  const updateTableOrder = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      const tableRef = getDocRef('tables', tableId);
      const table = tables.find(t => t.id === tableId);
      if (!tableRef || !table) return;
      try {
        await updateDoc(tableRef, {
            order: orderData.map(cleanDataForFirebase),
            status: orderData.length > 0 ? 'occupied' : 'available',
            occupiedByUserId: orderData.length > 0 ? (table.occupiedByUserId || user?.uid) : deleteField(),
            occupiedAt: orderData.length > 0 ? (table.occupiedAt || serverTimestamp()) : deleteField(),
            closedByUserId: orderData.length === 0 ? user?.uid : deleteField(),
            closedAt: orderData.length === 0 ? serverTimestamp() : deleteField(),
        });
      } catch (error) {
        console.error('Error updating table order:', error);
        toast({ variant: 'destructive', title: 'Erreur de sauvegarde' });
      }
    },
    [getDocRef, toast, tables, user]
  );

  const saveTableOrderAndExit = useCallback(
    async (tableId: string, orderData: OrderItem[]) => {
      const tableRef = getDocRef('tables', tableId);
      const table = tables.find(t => t.id === tableId);
      if (tableRef && table) {
          routerRef.current.push('/restaurant');
          await updateDoc(tableRef, {
            order: orderData.map(cleanDataForFirebase),
            status: orderData.length > 0 ? 'occupied' : 'available',
            occupiedByUserId: orderData.length > 0 ? (table.occupiedByUserId || user?.uid) : deleteField(),
            occupiedAt: orderData.length > 0 ? (table.occupiedAt || serverTimestamp()) : deleteField(),
            closedByUserId: orderData.length === 0 ? user?.uid : deleteField(),
            closedAt: orderData.length === 0 ? serverTimestamp() : deleteField(),
          });
          toast({ title: 'Table sauvegardée' });
          await clearOrder();
      }
    },
    [getDocRef, clearOrder, toast, tables, user]
  );

  const forceFreeTable = useCallback(
    async (tableId: string) => {
      if (!firestore) return;
      const batch = writeBatch(firestore);
      const tableRef = getDocRef('tables', tableId);
      if (tableRef) {
        batch.update(tableRef, { 
          status: 'available', 
          order: [], 
          verrou: deleteField(),
          occupiedByUserId: deleteField(),
          occupiedAt: deleteField(),
          closedByUserId: user?.uid,
          closedAt: serverTimestamp(),
        });
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
    [firestore, getDocRef, heldOrders, toast, user]
  );

  const addTable = useCallback(
    (tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>) => {
      const newTable: Omit<Table, 'id'> = {
        ...tableData,
        number: Date.now() % 10000,
        status: 'available' as const,
        order: [],
        verrou: false,
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
  const recordSale = useCallback(async (
    saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'>,
    saleIdToUpdate?: string
) => {
    if (!companyId || !firestore || !user) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const salesCollRef = getCollectionRef('sales');
             if (!salesCollRef) {
                throw new Error("Sales collection reference is not available.");
            }

            let pieceRef;
            let existingData: Partial<Sale> = {};

            if (saleIdToUpdate) {
                pieceRef = doc(salesCollRef, saleIdToUpdate);
                const existingDoc = await transaction.get(pieceRef);
                if (existingDoc.exists()) {
                    existingData = existingDoc.data() as Sale;
                }
            } else {
                pieceRef = doc(salesCollRef);
            }

            const needsNumber = (saleData.status === 'paid' || currentSaleContext?.isInvoice) && !existingData.ticketNumber?.startsWith('Fact-') && !existingData.ticketNumber?.startsWith('Tick-');
            
            let pieceNumber = existingData.ticketNumber || '';

            if (needsNumber) {
                const prefix = currentSaleContext?.isInvoice ? 'Fact-' : 'Tick-';
                const today = new Date();
                const startOfToday = startOfDay(today);
                const endOfToday = endOfDay(today);

                // This query requires an index on 'date'.
                const q = query(salesCollRef, where('date', '>=', startOfToday), where('date', '<=', endOfToday));
                const todaysSalesSnapshot = await transaction.get(q);

                const todaysPieces = todaysSalesSnapshot.docs.map(d => d.data() as Sale);
                const countForPrefix = todaysPieces.filter(p => p.ticketNumber?.startsWith(prefix)).length;
                
                const dayMonth = format(today, 'ddMM');
                const shortUuid = uuidv4().substring(0, 4).toUpperCase();
                pieceNumber = `${prefix}${dayMonth}-${(countForPrefix + 1).toString().padStart(4, '0')}-${shortUuid}`;
            }

            const sellerName = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email;

            const finalSaleData = cleanDataForFirebase({
                ...existingData,
                ...saleData,
                userId: user.uid,
                userName: sellerName,
                ...(needsNumber && { date: existingData.date || serverTimestamp(), ticketNumber: pieceNumber }),
                ...(!needsNumber && saleIdToUpdate && { modifiedAt: serverTimestamp() }),
            });

            transaction.set(pieceRef, finalSaleData, { merge: true });

            if (finalSaleData.status === 'paid') {
                finalSaleData.items?.forEach((orderItem: OrderItem) => {
                    const itemDoc = items.find(i => i.id === orderItem.itemId);
                    if (itemDoc && itemDoc.manageStock) {
                        const itemRef = doc(firestore, 'companies', companyId, 'items', orderItem.itemId);
                        const newStock = (itemDoc.stock || 0) - orderItem.quantity;
                        transaction.update(itemRef, { stock: newStock });
                    }
                });

                if (finalSaleData.tableId) {
                    const tableRef = doc(firestore, 'companies', companyId, 'tables', finalSaleData.tableId);
                    transaction.update(tableRef, {
                        status: 'available',
                        order: [],
                        occupiedByUserId: deleteField(),
                        occupiedAt: deleteField(),
                        closedByUserId: user.uid,
                        closedAt: serverTimestamp(),
                    });
                }
            }
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        toast({ variant: 'destructive', title: 'Erreur de sauvegarde', description: "La pièce n'a pas pu être enregistrée." });
    }
}, [companyId, firestore, user, items, currentSaleContext, toast, getCollectionRef]);
  // #endregion

  // #region User Management & Session
  const addUser = useCallback(
    async (userData: Omit<User, 'id' | 'companyId'>, password?: string) => {
      const authInstance = getAuth();
      if (!authInstance || !firestore) {
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
        const userCredential = await createUserWithEmailAndPassword(authInstance, userData.email, finalPassword);
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
    [firestore, toast]
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

    const forceSignOutUser = useCallback(
      async (userId: string) => {
        const userRef = getDocRef('users', userId, true);
        if (!userRef) return;
        try {
          await updateDoc(userRef, { sessionToken: deleteField() });
          // The onSnapshot listener for the users collection will automatically update the UI.
          toast({ title: 'Utilisateur déconnecté', description: "La session de l'utilisateur a été terminée." });
        } catch (error) {
          console.error("Error forcing user sign out:", error);
          toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de déconnecter l'utilisateur." });
        }
      },
      [getDocRef, toast]
    );

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

  const getCategoryColor = useCallback((categoryId: string) => {
    if (!categories) return undefined;
    return categories.find(c => c.id === categoryId)?.color;
  }, [categories]);

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
    async (customer: Omit<Customer, 'id' | 'isDefault'>): Promise<Customer | null> => {
        const newCustomerData = {
            ...customer,
            isDefault: !customers || !customers.some((c) => c.isDefault),
        };
        const newCustomer = await addEntity('customers', newCustomerData, 'Client ajouté');
        return newCustomer ? newCustomer as Customer : null;
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
        if (itemCounts[orderItem.itemId]) {
          itemCounts[orderItem.itemId].count += orderItem.quantity;
        } else {
          const itemDetails = items.find((i) => i.id === orderItem.itemId);
          if (itemDetails) {
            itemCounts[orderItem.itemId] = {
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
  
  const { lastDirectSale, lastRestaurantSale } = useMemo(() => {
    if (!sales || sales.length === 0) {
        return { lastDirectSale: null, lastRestaurantSale: null };
    }
    const sortedSales = [...sales].sort((a, b) => {
        const dateA = a.date instanceof Object && 'toDate' in a.date ? a.date.toDate() : new Date(a.date);
        const dateB = b.date instanceof Object && 'toDate' in b.date ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });

    const lastDirectSale = sortedSales.find(s => !s.tableId) || null;
    const lastRestaurantSale = sortedSales.find(s => s.tableId && s.tableId !== 'takeaway') || null;

    return { lastDirectSale, lastRestaurantSale };
  }, [sales]);

  const loadTicketForViewing = useCallback((ticket: Sale) => {
    const itemsWithSource = ticket.items.map(item => ({ ...item, sourceSale: ticket }));
    setReadOnlyOrder(itemsWithSource);
    if(itemsWithSource?.[0]?.image) setDynamicBgImage(itemsWithSource[0].image);
    setCurrentSaleId(ticket.id); // Also set currentSaleId to have context
    setCurrentSaleContext({ 
        ticketNumber: ticket.ticketNumber,
        date: ticket.date,
        userName: ticket.userName,
        isTableSale: !!ticket.tableId,
        tableName: ticket.tableName,
        tableId: ticket.tableId,
        payments: ticket.payments,
        originalTotal: ticket.originalTotal,
        originalPayments: ticket.originalPayments,
        change: ticket.change
    });
  }, []);
  // #endregion
  
  useEffect(() => {
    // Automatically seed data on first launch for admin
    if (
      !isLoading &&
      user?.role === 'admin' &&
      (!categories || categories.length === 0) &&
      (!vatRates || vatRates.length === 0) &&
      (!paymentMethods || paymentMethods.length === 0)
    ) {
      seedInitialData();
    }
  }, [isLoading, user, categories, vatRates, paymentMethods, seedInitialData]);


  const value = useMemo(
    () => ({
      order,
      setOrder,
      dynamicBgImage,
      enableDynamicBg,
      setEnableDynamicBg,
      dynamicBgOpacity,
      setDynamicBgOpacity,
      readOnlyOrder,
      setReadOnlyOrder,
      addToOrder,
      addSerializedItemToOrder,
      removeFromOrder,
      updateQuantity,
      updateQuantityFromKeypad,
      updateItemNote,
      applyDiscount,
      clearOrder,
      orderTotal,
      orderTax,
      isKeypadOpen,
      setIsKeypadOpen,
      currentSaleId,
      setCurrentSaleId,
      currentSaleContext,
      setCurrentSaleContext,
      recentlyAddedItemId,
      setRecentlyAddedItemId,
      serialNumberItem, 
      setSerialNumberItem,
      variantItem,
      setVariantItem,
      lastDirectSale,
      lastRestaurantSale,
      loadTicketForViewing,
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
      getCategoryColor,
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
      showItemImagesInGrid,
      setShowItemImagesInGrid,
      descriptionDisplay,
      setDescriptionDisplay,
      popularItemsCount,
      setPopularItemsCount,
      itemCardOpacity,
      setItemCardOpacity,
      paymentMethodImageOpacity,
      setPaymentMethodImageOpacity,
      itemDisplayMode,
      setItemDisplayMode,
      itemCardShowImageAsBackground,
      setItemCardShowImageAsBackground,
      itemCardImageOverlayOpacity,
      setItemCardImageOverlayOpacity,
      itemCardTextColor,
      setItemCardTextColor,
      itemCardShowPrice,
      setItemCardShowPrice,
      externalLinkModalEnabled,
      setExternalLinkModalEnabled,
      externalLinkUrl,
      setExternalLinkUrl,
      externalLinkTitle,
      setExternalLinkTitle,
      externalLinkModalWidth,
      setExternalLinkModalWidth,
      externalLinkModalHeight,
      setExternalLinkModalHeight,
      showDashboardStats,
      setShowDashboardStats,
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
      dashboardBgType,
      setDashboardBgType,
      dashboardBackgroundColor,
      setDashboardBackgroundColor,
      dashboardBackgroundImage,
      setDashboardBackgroundImage,
      dashboardBgOpacity,
      setDashboardBgOpacity,
      dashboardButtonBackgroundColor,
      setDashboardButtonBackgroundColor,
      dashboardButtonOpacity,
      setDashboardButtonOpacity,
      dashboardButtonShowBorder,
      setDashboardButtonShowBorder,
      dashboardButtonBorderColor,
      setDashboardButtonBorderColor,
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
      importDemoData,
      importDemoCustomers,
      cameFromRestaurant,
      setCameFromRestaurant,
      isLoading,
      user,
      holdOrder,
    }),
    [
      order,
      setOrder,
      dynamicBgImage,
      enableDynamicBg,
      setEnableDynamicBg,
      dynamicBgOpacity,
      setDynamicBgOpacity,
      readOnlyOrder,
      addToOrder,
      addSerializedItemToOrder,
      removeFromOrder,
      updateQuantity,
      updateQuantityFromKeypad,
      updateItemNote,
      applyDiscount,
      clearOrder,
      orderTotal,
      orderTax,
      isKeypadOpen,
      currentSaleId,
      currentSaleContext,
      recentlyAddedItemId,
      serialNumberItem,
      variantItem,
      setVariantItem,
      lastDirectSale,
      lastRestaurantSale,
      loadTicketForViewing,
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
      getCategoryColor,
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
      showItemImagesInGrid,
      setShowItemImagesInGrid,
      descriptionDisplay,
      setDescriptionDisplay,
      popularItemsCount,
      setPopularItemsCount,
      itemCardOpacity,
      setItemCardOpacity,
      paymentMethodImageOpacity,
      setPaymentMethodImageOpacity,
      itemDisplayMode,
      setItemDisplayMode,
      itemCardShowImageAsBackground,
      setItemCardShowImageAsBackground,
      itemCardImageOverlayOpacity,
      setItemCardImageOverlayOpacity,
      itemCardTextColor,
      setItemCardTextColor,
      itemCardShowPrice,
      setItemCardShowPrice,
      externalLinkModalEnabled,
      setExternalLinkModalEnabled,
      externalLinkUrl,
      setExternalLinkUrl,
      externalLinkTitle,
      setExternalLinkTitle,
      externalLinkModalWidth,
      setExternalLinkModalWidth,
      externalLinkModalHeight,
      setExternalLinkModalHeight,
      showDashboardStats,
      setShowDashboardStats,
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
      dashboardBgType,
      setDashboardBgType,
      dashboardBackgroundColor,
      setDashboardBackgroundColor,
      dashboardBackgroundImage,
      setDashboardBackgroundImage,
      dashboardBgOpacity,
      setDashboardBgOpacity,
      dashboardButtonBackgroundColor,
      setDashboardButtonBackgroundColor,
      dashboardButtonOpacity,
      setDashboardButtonOpacity,
      dashboardButtonShowBorder,
      setDashboardButtonShowBorder,
      dashboardButtonBorderColor,
      setDashboardButtonBorderColor,
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
      importDemoData,
      importDemoCustomers,
      cameFromRestaurant,
      isLoading,
      user,
      holdOrder,
      setReadOnlyOrder,
      setIsKeypadOpen,
      setRecentlyAddedItemId,
      setCurrentSaleId,
      setSerialNumberItem,
      setSessionInvalidated,
      setCameFromRestaurant,
      setEnableRestaurantCategoryFilter,
      setShowDashboardStats,
      setExternalLinkModalHeight,
      setExternalLinkModalWidth,
      setExternalLinkTitle,
      setExternalLinkUrl,
      setExternalLinkModalEnabled,
      setItemCardShowPrice,
      setItemCardTextColor,
      setItemCardImageOverlayOpacity,
      setItemCardShowImageAsBackground,
      setItemDisplayMode,
      setPaymentMethodImageOpacity,
      setItemCardOpacity,
      setPopularItemsCount,
      setDescriptionDisplay,
      setDashboardButtonBorderColor,
      setDashboardButtonShowBorder,
      setDashboardButtonOpacity,
      setDashboardButtonBackgroundColor,
      setDashboardBgOpacity,
      setDashboardBackgroundImage,
      setDashboardBackgroundColor,
      setDashboardBgType,
      setRestaurantModeBgOpacity,
      setDirectSaleBgOpacity,
      setRestaurantModeBackgroundColor,
      setDirectSaleBackgroundColor,
      setEnableSerialNumber,
      setNotificationDuration,
      setShowNotifications,
      setCurrentSaleContext,
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
