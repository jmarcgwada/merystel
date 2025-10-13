
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
  Supplier,
} from '@/lib/types';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useUser as useFirebaseUser } from '@/firebase/auth/use-user';
import { v4 as uuidv4 } from 'uuid';
import demoData from '@/lib/demodata.json';
import type { Timestamp } from 'firebase/firestore';

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
  systemDate: Date;
  dynamicBgImage: string | null;
  enableDynamicBg: boolean;
  setEnableDynamicBg: React.Dispatch<React.SetStateAction<boolean>>;
  dynamicBgOpacity: number;
  setDynamicBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  readOnlyOrder: OrderItem[] | null;
  setReadOnlyOrder: React.Dispatch<React.SetStateAction<OrderItem[] | null>>;
  addToOrder: (itemId: string, selectedVariants?: SelectedVariant[]) => void;
  addSerializedItemToOrder: (item: Item | OrderItem, quantity: number, serialNumbers: string[]) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: OrderItem['id'], quantity: number) => void;
  updateItemQuantityInOrder: (itemId: string, quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  updateItemNote: (itemId: OrderItem['id'], note: string) => void;
  updateOrderItem: (item: Item) => void;
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
  currentSaleContext: Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order'; originalTotal?: number; originalPayments?: Payment[], change?:number; } | null;
  setCurrentSaleContext: React.Dispatch<React.SetStateAction<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order'; originalTotal?: number; originalPayments?: Payment[], change?:number;} | null>>;
  serialNumberItem: { item: Item | OrderItem; quantity: number } | null;
  setSerialNumberItem: React.Dispatch<React.SetStateAction<{ item: Item | OrderItem; quantity: number } | null>>;
  variantItem: Item | null;
  setVariantItem: React.Dispatch<React.SetStateAction<Item | null>>;
  lastDirectSale: Sale | null;
  lastRestaurantSale: Sale | null;
  loadTicketForViewing: (ticket: Sale) => void;
  loadSaleForEditing: (saleId: string, type?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order') => void;

  users: User[];
  addUser: (user: Omit<User, 'id' | 'companyId' | 'sessionToken'>, password?: string) => Promise<void>;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  sendPasswordResetEmailForUser: (email: string) => void;
  findUserByEmail: (email: string) => User | undefined;
  handleSignOut: (isAuto?: boolean) => Promise<void>;
  validateSession: (userId: string, token: string) => boolean;
  forceSignOut: (message: string) => void;
  forceSignOutUser: (userId: string) => void;
  sessionInvalidated: boolean;
  setSessionInvalidated: React.Dispatch<React.SetStateAction<boolean>>;
  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => Promise<Item | null>;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  toggleItemFavorite: (itemId: string) => void;
  toggleFavoriteForList: (itemIds: string[], setFavorite: boolean) => void;
  popularItems: Item[];
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;
  getCategoryColor: (categoryId: string) => string | undefined;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'isDefault'> & {id: string}) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  setDefaultCustomer: (customerId: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier | null>;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
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
  ) => Promise<Sale | null>;
   recordCommercialDocument: (
    doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'>,
    type: 'quote' | 'delivery_note' | 'supplier_order',
    docIdToUpdate?: string,
  ) => void,
  deleteAllSales: () => Promise<void>;
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
  defaultSalesMode: 'pos' | 'supermarket' | 'restaurant';
  setDefaultSalesMode: React.Dispatch<React.SetStateAction<'pos' | 'supermarket' | 'restaurant'>>;
  isForcedMode: boolean;
  setIsForcedMode: React.Dispatch<React.SetStateAction<boolean>>;
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
  importDemoSuppliers: () => Promise<void>;
  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  user: any;
  toast: (props: any) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

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
  const router = useRouter();
  const { toast: shadcnToast } = useShadcnToast();

  // #region State
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [systemDate, setSystemDate] = useState(new Date());
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
  const [defaultSalesMode, setDefaultSalesMode] = usePersistentState<'pos' | 'supermarket' | 'restaurant'>('settings.defaultSalesMode', 'pos');
  const [isForcedMode, setIsForcedMode] = usePersistentState('settings.isForcedMode', false);
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
    
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order'; } | null>(
    null
  );
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [serialNumberItem, setSerialNumberItem] = useState<{item: Item | OrderItem, quantity: number} | null>(null);
  const [variantItem, setVariantItem] = useState<Item | null>(null);
  
  // Data states, now managed locally
  const [items, setItems] = usePersistentState<Item[]>('data.items', []);
  const [categories, setCategories] = usePersistentState<Category[]>('data.categories', []);
  const [customers, setCustomers] = usePersistentState<Customer[]>('data.customers', []);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('data.suppliers', []);
  const [tablesData, setTablesData] = usePersistentState<Table[]>('data.tables', []);
  const [sales, setSales] = usePersistentState<Sale[]>('data.sales', []);
  const [paymentMethods, setPaymentMethods] = usePersistentState<PaymentMethod[]>('data.paymentMethods', []);
  const [vatRates, setVatRates] = usePersistentState<VatRate[]>('data.vatRates', []);
  const [heldOrders, setHeldOrders] = usePersistentState<HeldOrder[]>('data.heldOrders', []);
  const [companyInfo, setCompanyInfo] = usePersistentState<CompanyInfo | null>('data.companyInfo', null);
  const [users, setUsers] = usePersistentState<User[]>('data.users', []);

  const isLoading = userLoading;
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
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const authRequired = false;

  const tables = useMemo(() => [TAKEAWAY_TABLE, ...tablesData.sort((a, b) => a.number - b.number)], [tablesData]);

  // #region Mock/Local Data Management
    const seedInitialData = useCallback(() => {
        const hasData = items.length > 0 || categories.length > 0 || vatRates.length > 0;
        if (hasData) {
            toast({ title: 'Données existantes', description: 'Initialisation annulée car des données existent déjà.' });
            return;
        }

        const defaultVatRates = [
            { id: 'vat_20', name: 'Taux Normal', rate: 20, code: 1 },
            { id: 'vat_10', name: 'Taux Intermédiaire', rate: 10, code: 2 },
            { id: 'vat_5', name: 'Taux Réduit', rate: 5.5, code: 3 },
        ];
        setVatRates(defaultVatRates);

        const defaultPaymentMethods = [
            { id: 'pm_cash', name: 'Espèces', icon: 'cash' as const, type: 'direct' as const, isActive: true },
            { id: 'pm_card', name: 'Carte Bancaire', icon: 'card' as const, type: 'direct' as const, isActive: true },
            { id: 'pm_check', name: 'Chèque', icon: 'check' as const, type: 'direct' as const, isActive: true },
            { id: 'pm_other', name: 'AUTRE', icon: 'other' as const, type: 'direct' as const, isActive: true },
        ];
        setPaymentMethods(defaultPaymentMethods);
        
        toast({ title: 'Données initialisées', description: 'TVA et méthodes de paiement par défaut créées.' });
    }, [items, categories, vatRates, setVatRates, setPaymentMethods, toast]);
    
    useEffect(() => {
        const isSeeded = localStorage.getItem('data.seeded');
        if (!isSeeded) {
            seedInitialData();
            localStorage.setItem('data.seeded', 'true');
        }
    }, [seedInitialData]);


  const importDemoData = useCallback(() => {
        const newCategories: Category[] = [];
        const newItems: Item[] = [];
        const categoryIdMap: { [key: string]: string } = {};
        const defaultVatId = vatRates.find(v => v.rate === 20)?.id || vatRates[0]?.id;
        
        if (!defaultVatId) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez configurer un taux de TVA avant d\'importer.' });
            return;
        }

        demoData.categories.forEach((categoryData) => {
            const catId = uuidv4();
            newCategories.push({
                id: catId,
                name: categoryData.name,
                image: `https://picsum.photos/seed/${catId}/200/150`,
                color: '#e2e8f0'
            });
            categoryIdMap[categoryData.name] = catId;

            categoryData.items.forEach((itemData) => {
                const itemId = uuidv4();
                newItems.push({
                    id: itemId,
                    name: itemData.name,
                    price: itemData.price,
                    purchasePrice: itemData.price * 0.6,
                    description: itemData.description,
                    categoryId: catId,
                    vatId: defaultVatId,
                    image: `https://picsum.photos/seed/${itemId}/200/150`,
                    barcode: `DEMO${Math.floor(100000 + Math.random() * 900000)}`
                });
            });
        });

        setCategories(prev => [...prev, ...newCategories]);
        setItems(prev => [...prev, ...newItems]);
        toast({ title: 'Données de démo importées !', description: `${newItems.length} articles et ${newCategories.length} catégories ajoutés.` });
    }, [vatRates, toast]);
    
    const importDemoCustomers = useCallback(() => {
        const demoCustomers: Customer[] = Array.from({ length: 10 }).map((_, i) => ({
            id: `C${uuidv4().substring(0,6)}`,
            name: `Client Démo ${i + 1}`,
            email: `client${i+1}@demo.com`
        }));
        setCustomers(prev => [...prev, ...demoCustomers]);
        toast({ title: 'Clients de démo importés !' });
    }, [toast]);
    
     const importDemoSuppliers = useCallback(() => {
        const demoSuppliers: Supplier[] = Array.from({ length: 5 }).map((_, i) => ({
            id: `S-${uuidv4().substring(0,6)}`,
            name: `Fournisseur Démo ${i + 1}`,
            email: `fournisseur${i+1}@demo.com`
        }));
        setSuppliers(prev => [...prev, ...demoSuppliers]);
        toast({ title: 'Fournisseurs de démo importés !' });
    }, [toast]);

  const resetAllData = useCallback(() => {
    setItems([]);
    setCategories([]);
    setCustomers([]);
    setSuppliers([]);
    setTablesData([]);
    setSales([]);
    setHeldOrders([]);
    setPaymentMethods([]);
    setVatRates([]);
    setCompanyInfo(null);
    localStorage.removeItem('data.seeded');
    toast({ title: 'Application réinitialisée', description: 'Toutes les données ont été effacées.' });
  }, [toast]);
  
  const deleteAllSales = useCallback(async () => {
    setSales([]);
    toast({ title: 'Ventes supprimées' });
  }, [toast]);
  
    const exportConfiguration = useCallback(() => {
        const config = {
            items,
            categories,
            customers,
            suppliers,
            tables: tablesData,
            paymentMethods,
            vatRates,
            companyInfo,
        };
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
        toast({ title: 'Exportation réussie' });
    }, [items, categories, customers, suppliers, tablesData, paymentMethods, vatRates, companyInfo, toast]);

    const importConfiguration = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target?.result as string);
                if (config.items) setItems(config.items);
                if (config.categories) setCategories(config.categories);
                if (config.customers) setCustomers(config.customers);
                if (config.suppliers) setSuppliers(config.suppliers);
                if (config.tables) setTablesData(config.tables);
                if (config.paymentMethods) setPaymentMethods(config.paymentMethods);
                if (config.vatRates) setVatRates(config.vatRates);
                if (config.companyInfo) setCompanyInfo(config.companyInfo);
                toast({ title: 'Importation réussie!', description: 'La configuration a été restaurée.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erreur d\'importation' });
            }
        };
        reader.readAsText(file);
    }, [toast]);

  // #endregion

  // #region Order Management
  const clearOrder = useCallback(() => {
    setOrder([]);
    setDynamicBgImage(null);
    if (readOnlyOrder) setReadOnlyOrder(null);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
  }, [readOnlyOrder]);
  
  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    setOrder((currentOrder) =>
      currentOrder.filter((item) => item.id !== itemId)
    );
  }, []);
  
  const addSerializedItemToOrder = useCallback((item: Item | OrderItem, quantity: number, serialNumbers: string[]) => {
    setOrder(currentOrder => {
      const existingItemIndex = currentOrder.findIndex(i => 'id' in item && i.id === item.id);
  
      if (existingItemIndex > -1) {
        const updatedOrder = [...currentOrder];
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: quantity,
          serialNumbers: serialNumbers,
          total: updatedOrder[existingItemIndex].price * quantity - (updatedOrder[existingItemIndex].discount || 0),
        };
        return updatedOrder;
      } else {
        const newOrderItem: OrderItem = {
          itemId: 'itemId' in item ? item.itemId : item.id,
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
          barcode: 'barcode' in item ? (item.barcode || '') : '',
        };
        return [...currentOrder, newOrderItem];
      }
    });
  
    if ('image' in item && item.image) setDynamicBgImage(item.image);
    toast({ title: `${item.name} ajouté/mis à jour dans la commande` });
  }, [toast]);

  const addToOrder = useCallback(
    (itemId: string, selectedVariants?: SelectedVariant[]) => {
      if (!items) return;
      const itemToAdd = items.find((i) => i.id === itemId);
      if (!itemToAdd) return;
      
      if (itemToAdd.manageStock && (!itemToAdd.stock || itemToAdd.stock <= 0)) {
        toast({
            variant: 'destructive',
            title: 'Rupture de stock',
            description: `L'article "${itemToAdd.name}" n'est plus en stock.`,
        });
        return;
      }
      
      const isSupplierOrder = currentSaleContext?.documentType === 'supplier_order';

      if (isSupplierOrder && (typeof itemToAdd.purchasePrice !== 'number' || itemToAdd.purchasePrice <= 0)) {
        toast({
            variant: 'destructive',
            title: 'Prix d\'achat manquant ou nul',
            description: `L'article "${itemToAdd.name}" n'a pas de prix d'achat valide.`,
        });
        return;
    }

      const existingItemIndex = order.findIndex(
        (item) => item.itemId === itemId && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants) && !item.serialNumbers?.length
      );

      if (itemToAdd.requiresSerialNumber && enableSerialNumber) {
          const newQuantity = (order.find(i => i.itemId === itemId)?.quantity || 0) + 1;
          const existingItem = order.find(i => i.itemId === itemId);
          setSerialNumberItem({ item: existingItem || itemToAdd, quantity: newQuantity });
          return;
      }
      
      if (itemToAdd.hasVariants && itemToAdd.variantOptions && !selectedVariants) {
        setVariantItem(itemToAdd);
        return;
      }

      setOrder((currentOrder) => {
        if (existingItemIndex > -1) {
          const newOrder = [...currentOrder];
          const newQuantity = newOrder[existingItemIndex].quantity + 1;
          newOrder[existingItemIndex] = {
            ...newOrder[existingItemIndex],
            quantity: newQuantity,
            total:
              newOrder[existingItemIndex].price * newQuantity - (newOrder[existingItemIndex].discount || 0),
          };
           const itemToMove = newOrder.splice(existingItemIndex, 1)[0];
          return [itemToMove, ...newOrder];
        } else {
          const uniqueId = uuidv4();
          const newItem: OrderItem = {
            itemId: itemToAdd.id,
            id: uniqueId,
            name: itemToAdd.name,
            price: isSupplierOrder ? (itemToAdd.purchasePrice ?? 0) : itemToAdd.price,
            vatId: itemToAdd.vatId,
            image: itemToAdd.image,
            quantity: 1,
            total: isSupplierOrder ? (itemToAdd.purchasePrice ?? 0) : itemToAdd.price,
            discount: 0,
            description: itemToAdd.description,
            description2: itemToAdd.description2,
            selectedVariants,
            barcode: itemToAdd.barcode || '',
          };
          return [newItem, ...currentOrder];
        }
      });
    if(itemToAdd.image) setDynamicBgImage(itemToAdd.image);
    toast({ title: `${itemToAdd.name} ajouté à la commande` });
    },
    [items, order, toast, enableSerialNumber, currentSaleContext]
  );
  
  const updateItemQuantityInOrder = useCallback((itemId: string, quantity: number) => {
      setOrder(currentOrder => currentOrder.map(item => 
          item.id === itemId 
              ? { ...item, quantity: quantity, total: item.price * quantity - (item.discount || 0) } 
              : item
      ));
  }, []);

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

  const updateOrderItem = useCallback((updatedItem: Item) => {
    setOrder(currentOrder => 
      currentOrder.map(orderItem => 
        orderItem.itemId === updatedItem.id 
          ? { 
              ...orderItem, 
              name: updatedItem.name, 
              price: updatedItem.price, 
              description: updatedItem.description, 
              description2: updatedItem.description2 
            }
          : orderItem
      )
    );
  }, []);

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

  // #region Table & Held Order Management (Local)
    const holdOrder = useCallback(() => {
        if (order.length === 0) return;
        const newHeldOrder: HeldOrder = {
            id: uuidv4(),
            date: new Date(),
            items: order,
            total: orderTotal + orderTax,
        };
        setHeldOrders(prev => [...(prev || []), newHeldOrder]);
        clearOrder();
        toast({ title: 'Commande mise en attente' });
    }, [order, orderTotal, orderTax, setHeldOrders, clearOrder, toast]);

    const recallOrder = useCallback((orderId: string) => {
        const orderToRecall = heldOrders?.find(o => o.id === orderId);
        if (orderToRecall) {
            setOrder(orderToRecall.items);
            setCurrentSaleId(orderToRecall.id);
            setHeldOrders(prev => prev?.filter(o => o.id !== orderId) || null);
            toast({ title: 'Commande rappelée' });
        }
    }, [heldOrders, setHeldOrders, toast]);

    const deleteHeldOrder = useCallback((orderId: string) => {
        setHeldOrders(prev => prev?.filter(o => o.id !== orderId) || null);
        toast({ title: 'Ticket en attente supprimé' });
    }, [setHeldOrders, toast]);

    const setSelectedTableById = useCallback((tableId: string | null) => {
      if (!tableId) {
        setSelectedTable(null);
        if (cameFromRestaurant) clearOrder();
        return;
      }
      const table = tables.find(t => t.id === tableId);
      if (table) {
        setSelectedTable(table);
        setOrder(table.order || []);
      }
    }, [tables, cameFromRestaurant, clearOrder]);

    const updateTableOrder = useCallback((tableId: string, order: OrderItem[]) => {
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, order, status: order.length > 0 ? 'occupied' : 'available'} : t));
    }, [setTablesData]);

    const saveTableOrderAndExit = useCallback((tableId: string, order: OrderItem[]) => {
      updateTableOrder(tableId, order);
      router.push('/restaurant');
      toast({ title: 'Table sauvegardée' });
      clearOrder();
    }, [updateTableOrder, router, clearOrder, toast]);

    const promoteTableToTicket = useCallback((tableId: string, orderData: OrderItem[]) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, status: 'paying'} : t));
      setCurrentSaleId(`table-${tableId}`);
      setCurrentSaleContext({ tableId: table.id, tableName: table.name, isTableSale: true });
      setOrder(orderData);
    }, [tables, setTablesData, setCurrentSaleId, setCurrentSaleContext, setOrder]);
    
    const forceFreeTable = useCallback((tableId: string) => {
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, status: 'available', order: []} : t));
      toast({ title: 'Table libérée' });
    }, [setTablesData, toast]);

    const addTable = useCallback((tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>) => {
      const newTable: Table = {
        ...tableData,
        id: uuidv4(),
        number: (tablesData.length > 0 ? Math.max(...tablesData.map(t => t.number)) : 0) + 1,
        status: 'available',
        order: [],
      };
      setTablesData(prev => [...prev, newTable]);
      toast({ title: 'Table créée' });
    }, [tablesData, setTablesData, toast]);

    const updateTable = useCallback((table: Table) => {
      setTablesData(prev => prev.map(t => t.id === table.id ? table : t));
      toast({ title: 'Table modifiée' });
    }, [setTablesData, toast]);

    const deleteTable = useCallback((tableId: string) => {
      setTablesData(prev => prev.filter(t => t.id !== tableId));
      toast({ title: 'Table supprimée' });
    }, [setTablesData, toast]);
  // #endregion

  // #region Sales
    const recordSale = useCallback(async (saleData: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'>, saleIdToUpdate?: string): Promise<Sale | null> => {
        const today = new Date();
        
        let finalSale: Sale;

        if (saleIdToUpdate && !saleIdToUpdate.startsWith('table-')) {
            const existingSale = sales.find(s => s.id === saleIdToUpdate);
            if (!existingSale) return null;
            finalSale = {
                ...existingSale,
                ...saleData,
                modifiedAt: today,
            };
            setSales(prev => prev.map(s => s.id === saleIdToUpdate ? finalSale : s));
        } else {
            const dayMonth = format(today, 'ddMM');
            const todaysSalesCount = sales.filter(s => new Date(s.date as Date).toDateString() === today.toDateString()).length;
            const shortUuid = uuidv4().substring(0, 4).toUpperCase();
            const ticketNumber = `Tick-${dayMonth}-${(todaysSalesCount + 1).toString().padStart(4, '0')}`;
            
            finalSale = {
                id: uuidv4(),
                date: today,
                ticketNumber,
                userId: user?.id,
                userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
                ...saleData,
            };
            setSales(prev => [finalSale, ...prev]);
        }
        
        if (currentSaleContext?.isTableSale && currentSaleContext.tableId) {
            setTablesData(prev => prev.map(t => t.id === currentSaleContext.tableId ? {...t, status: 'available', order: []} : t));
        }
        
        if (currentSaleId && !currentSaleId.startsWith('table-')) {
            setHeldOrders(prev => prev?.filter(o => o.id !== currentSaleId) || null);
        }

        return finalSale;
    }, [sales, setSales, user, currentSaleContext, currentSaleId, setTablesData, setHeldOrders]);
    
    const recordCommercialDocument = useCallback(async (docData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>, type: 'quote' | 'delivery_note' | 'supplier_order', docIdToUpdate?: string) => {
        const today = new Date();
        const prefix = type === 'quote' ? 'Devis' : type === 'delivery_note' ? 'BL' : 'CF';
        
        const count = sales.filter(s => s.documentType === type).length;
        const number = `${prefix}-${(count + 1).toString().padStart(4, '0')}`;

        let finalDoc: Sale;

        if (docIdToUpdate) {
            const existingDoc = sales.find(s => s.id === docIdToUpdate);
            if (!existingDoc) return;
            finalDoc = {
                ...existingDoc,
                ...docData,
                modifiedAt: today,
            };
            setSales(prev => prev.map(s => s.id === docIdToUpdate ? finalDoc : s));
        } else {
             finalDoc = {
                id: uuidv4(),
                date: today,
                ticketNumber: number,
                documentType: type,
                userId: user?.id,
                userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
                ...docData,
            };
            setSales(prev => [finalDoc, ...prev]);
        }
        
        toast({ title: `${prefix} ${finalDoc.status === 'paid' ? 'facturé' : 'enregistré'}` });
        clearOrder();

        const reportPath = type === 'invoice' ? '/reports?filter=Fact-' 
                        : type === 'quote' ? '/reports?filter=Devis-'
                        : type === 'delivery_note' ? '/reports?filter=BL-'
                        : '/reports';
        router.push(reportPath);
    }, [sales, setSales, user, clearOrder, toast, router]);


  // #endregion

  // #region Entity Management (Local)
    const addUser = useCallback(async () => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
    const updateUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
    const deleteUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
    const sendPasswordResetEmailForUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
    const findUserByEmail = useCallback(() => undefined, []);
    const handleSignOut = useCallback(async () => { router.push('/login'); }, [router]);
    const validateSession = useCallback(() => true, []);
    const forceSignOut = useCallback(() => { router.push('/login'); }, [router]);
    const forceSignOutUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);

    const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
        const newCategory = { ...category, id: uuidv4() };
        setCategories(prev => [...prev, newCategory]);
        toast({ title: 'Catégorie ajoutée' });
        return newCategory;
    }, [setCategories, toast]);
    const updateCategory = useCallback((category: Category) => {
        setCategories(prev => prev.map(c => c.id === category.id ? category : c));
        toast({ title: 'Catégorie modifiée' });
    }, [setCategories, toast]);
    const deleteCategory = useCallback((id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        setItems(prev => prev.filter(i => i.categoryId !== id));
        toast({ title: 'Catégorie supprimée' });
    }, [setCategories, setItems, toast]);
    const toggleCategoryFavorite = useCallback((id: string) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
    }, [setCategories]);
    
    const getCategoryColor = useCallback((categoryId: string) => {
      return categories.find(c => c.id === categoryId)?.color;
    }, [categories]);

    const addItem = useCallback(async (item: Omit<Item, 'id'>) => {
        const newItem = { ...item, id: uuidv4(), barcode: item.barcode || uuidv4().substring(0, 13) };
        setItems(prev => [newItem, ...prev]);
        toast({ title: 'Article créé' });
        return newItem;
    }, [setItems, toast]);
    const updateItem = useCallback((item: Item) => {
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
        toast({ title: 'Article modifié' });
    }, [setItems, toast]);
    const deleteItem = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        toast({ title: 'Article supprimé' });
    }, [setItems, toast]);
    const toggleItemFavorite = useCallback((id: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    }, [setItems]);
    const toggleFavoriteForList = useCallback((itemIds: string[], setFavorite: boolean) => {
        setItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, isFavorite: setFavorite } : i));
    }, [setItems]);

    const addCustomer = useCallback(async (customer: Omit<Customer, 'isDefault'> & {id: string}) => {
        const newCustomer = { ...customer, isDefault: customers.length === 0 };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    }, [customers.length, setCustomers]);
    const updateCustomer = useCallback((customer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    }, [setCustomers]);
    const deleteCustomer = useCallback((id: string) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
    }, [setCustomers]);
    const setDefaultCustomer = useCallback((id: string) => {
        setCustomers(prev => prev.map(c => ({...c, isDefault: c.id === id ? !c.isDefault : false })));
    }, [setCustomers]);

    const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>) => {
        const newSupplier = { ...supplier, id: uuidv4() };
        setSuppliers(prev => [...prev, newSupplier]);
        return newSupplier;
    }, [setSuppliers]);
    const updateSupplier = useCallback((supplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    }, [setSuppliers]);
    const deleteSupplier = useCallback((id: string) => {
        setSuppliers(prev => prev.filter(s => s.id !== id));
    }, [setSuppliers]);

    const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id'>) => {
        setPaymentMethods(prev => [...prev, { ...method, id: uuidv4() }]);
    }, [setPaymentMethods]);
    const updatePaymentMethod = useCallback((method: PaymentMethod) => {
        setPaymentMethods(prev => prev.map(pm => pm.id === method.id ? method : pm));
    }, [setPaymentMethods]);
    const deletePaymentMethod = useCallback((id: string) => {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    }, [setPaymentMethods]);

    const addVatRate = useCallback((vatRate: Omit<VatRate, 'id' | 'code'>) => {
        const newCode = (vatRates.length > 0 ? Math.max(...vatRates.map(v => v.code)) : 0) + 1;
        setVatRates(prev => [...prev, { ...vatRate, id: uuidv4(), code: newCode }]);
    }, [vatRates, setVatRates]);
    const updateVatRate = useCallback((vatRate: VatRate) => {
        setVatRates(prev => prev.map(v => v.id === vatRate.id ? vatRate : v));
    }, [setVatRates]);
    const deleteVatRate = useCallback((id: string) => {
        setVatRates(prev => prev.filter(v => v.id !== id));
    }, [setVatRates]);
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
      router.push(nextUrl);
    }
    closeNavConfirm();
  }, [nextUrl, clearOrder, closeNavConfirm, router]);
  // #endregion

  // #region Derived State
  const popularItems = useMemo(() => {
    return items.slice(0, popularItemsCount);
  }, [items, popularItemsCount]);
  
  const { lastDirectSale, lastRestaurantSale } = useMemo(() => {
    const sortedSales = [...sales].sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime());
    return {
        lastDirectSale: sortedSales.find(s => !s.tableId) || null,
        lastRestaurantSale: sortedSales.find(s => s.tableId && s.tableId !== 'takeaway') || null
    };
  }, [sales]);

  const loadTicketForViewing = useCallback((ticket: Sale) => {
    setReadOnlyOrder(ticket.items.map(item => ({...item, sourceSale: ticket })));
    setCurrentSaleId(ticket.id);
    setCurrentSaleContext({
      ticketNumber: ticket.ticketNumber,
      date: ticket.date,
      userName: ticket.userName,
      isTableSale: !!ticket.tableId,
      tableName: ticket.tableName,
      tableId: ticket.tableId,
    });
  }, []);
  
  const loadSaleForEditing = useCallback((saleId: string, type: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order') => {
      const saleToEdit = sales.find(s => s.id === saleId);
      if (saleToEdit) {
        setOrder(saleToEdit.items);
        setCurrentSaleId(saleId);
        setCurrentSaleContext({
          ...saleToEdit,
          isInvoice: type === 'invoice',
          documentType: type,
        });
      }
    }, [sales]);

  // #endregion

  const value = useMemo(
    () => ({
      order, setOrder, systemDate, dynamicBgImage, enableDynamicBg, setEnableDynamicBg, dynamicBgOpacity, setDynamicBgOpacity, readOnlyOrder, setReadOnlyOrder,
      addToOrder, addSerializedItemToOrder, removeFromOrder, updateQuantity, updateItemQuantityInOrder, updateQuantityFromKeypad, updateItemNote, updateOrderItem, applyDiscount,
      clearOrder, orderTotal, orderTax, isKeypadOpen, setIsKeypadOpen, currentSaleId, setCurrentSaleId, currentSaleContext, setCurrentSaleContext, serialNumberItem, setSerialNumberItem,
      variantItem, setVariantItem, lastDirectSale, lastRestaurantSale, loadTicketForViewing, loadSaleForEditing, users, addUser, updateUser, deleteUser,
      sendPasswordResetEmailForUser, findUserByEmail, handleSignOut, validateSession, forceSignOut, forceSignOutUser, sessionInvalidated, setSessionInvalidated,
      items, addItem, updateItem, deleteItem, toggleItemFavorite, toggleFavoriteForList, popularItems, categories, addCategory, updateCategory, deleteCategory, toggleCategoryFavorite,
      getCategoryColor, customers, addCustomer, updateCustomer, deleteCustomer, setDefaultCustomer, suppliers, addSupplier, updateSupplier, deleteSupplier,
      tables, addTable, updateTable, deleteTable, forceFreeTable, selectedTable, setSelectedTable, setSelectedTableById, updateTableOrder, saveTableOrderAndExit,
      promoteTableToTicket, sales, recordSale, recordCommercialDocument, deleteAllSales, paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      vatRates, addVatRate, updateVatRate, deleteVatRate, heldOrders, holdOrder, recallOrder, deleteHeldOrder, authRequired, showTicketImages, setShowTicketImages,
      showItemImagesInGrid, setShowItemImagesInGrid, descriptionDisplay, setDescriptionDisplay, popularItemsCount, setPopularItemsCount, itemCardOpacity, setItemCardOpacity,
      paymentMethodImageOpacity, setPaymentMethodImageOpacity, itemDisplayMode, setItemDisplayMode, itemCardShowImageAsBackground, setItemCardShowImageAsBackground,
      itemCardImageOverlayOpacity, setItemCardImageOverlayOpacity, itemCardTextColor, setItemCardTextColor, itemCardShowPrice, setItemCardShowPrice,
      externalLinkModalEnabled, setExternalLinkModalEnabled, externalLinkUrl, setExternalLinkUrl, externalLinkTitle, setExternalLinkTitle,
      externalLinkModalWidth, setExternalLinkModalWidth, externalLinkModalHeight, setExternalLinkModalHeight, showDashboardStats, setShowDashboardStats,
      enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter, showNotifications, setShowNotifications, notificationDuration, setNotificationDuration,
      enableSerialNumber, setEnableSerialNumber, defaultSalesMode, setDefaultSalesMode, isForcedMode, setIsForcedMode, directSaleBackgroundColor, setDirectSaleBackgroundColor,
      restaurantModeBackgroundColor, setRestaurantModeBackgroundColor, directSaleBgOpacity, setDirectSaleBgOpacity, restaurantModeBgOpacity, setRestaurantModeBgOpacity,
      dashboardBgType, setDashboardBgType, dashboardBackgroundColor, setDashboardBackgroundColor, dashboardBackgroundImage, setDashboardBackgroundImage, dashboardBgOpacity,
      setDashboardBgOpacity, dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor, dashboardButtonOpacity, setDashboardButtonOpacity,
      dashboardButtonShowBorder, setDashboardButtonShowBorder, dashboardButtonBorderColor, setDashboardButtonBorderColor, companyInfo, setCompanyInfo,
      isNavConfirmOpen, showNavConfirm, closeNavConfirm, confirmNavigation, seedInitialData, resetAllData, exportConfiguration, importConfiguration,
      importDemoData, importDemoCustomers, importDemoSuppliers, cameFromRestaurant, setCameFromRestaurant, isLoading, user, toast,
    }),
    [ order, setOrder, systemDate, dynamicBgImage, enableDynamicBg, setEnableDynamicBg, dynamicBgOpacity, setDynamicBgOpacity, readOnlyOrder, setReadOnlyOrder,
      addToOrder, addSerializedItemToOrder, removeFromOrder, updateQuantity, updateItemQuantityInOrder, updateQuantityFromKeypad, updateItemNote, updateOrderItem, applyDiscount,
      clearOrder, orderTotal, orderTax, isKeypadOpen, setIsKeypadOpen, currentSaleId, setCurrentSaleId, currentSaleContext, setCurrentSaleContext, serialNumberItem, setSerialNumberItem,
      variantItem, setVariantItem, lastDirectSale, lastRestaurantSale, loadTicketForViewing, loadSaleForEditing, users, addUser, updateUser, deleteUser,
      sendPasswordResetEmailForUser, findUserByEmail, handleSignOut, validateSession, forceSignOut, forceSignOutUser, sessionInvalidated, setSessionInvalidated,
      items, addItem, updateItem, deleteItem, toggleItemFavorite, toggleFavoriteForList, popularItems, categories, addCategory, updateCategory, deleteCategory, toggleCategoryFavorite,
      getCategoryColor, customers, addCustomer, updateCustomer, deleteCustomer, setDefaultCustomer, suppliers, addSupplier, updateSupplier, deleteSupplier,
      tables, addTable, updateTable, deleteTable, forceFreeTable, selectedTable, setSelectedTable, setSelectedTableById, updateTableOrder, saveTableOrderAndExit,
      promoteTableToTicket, sales, recordSale, recordCommercialDocument, deleteAllSales, paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      vatRates, addVatRate, updateVatRate, deleteVatRate, heldOrders, holdOrder, recallOrder, deleteHeldOrder, authRequired, showTicketImages, setShowTicketImages,
      showItemImagesInGrid, setShowItemImagesInGrid, descriptionDisplay, setDescriptionDisplay, popularItemsCount, setPopularItemsCount, itemCardOpacity, setItemCardOpacity,
      paymentMethodImageOpacity, setPaymentMethodImageOpacity, itemDisplayMode, setItemDisplayMode, itemCardShowImageAsBackground, setItemCardShowImageAsBackground,
      itemCardImageOverlayOpacity, setItemCardImageOverlayOpacity, itemCardTextColor, setItemCardTextColor, itemCardShowPrice, setItemCardShowPrice,
      externalLinkModalEnabled, setExternalLinkModalEnabled, externalLinkUrl, setExternalLinkUrl, externalLinkTitle, setExternalLinkTitle,
      externalLinkModalWidth, setExternalLinkModalWidth, externalLinkModalHeight, setExternalLinkModalHeight, showDashboardStats, setShowDashboardStats,
      enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter, showNotifications, setShowNotifications, notificationDuration, setNotificationDuration,
      enableSerialNumber, setEnableSerialNumber, defaultSalesMode, setDefaultSalesMode, isForcedMode, setIsForcedMode, directSaleBackgroundColor, setDirectSaleBackgroundColor,
      restaurantModeBackgroundColor, setRestaurantModeBackgroundColor, directSaleBgOpacity, setDirectSaleBgOpacity, restaurantModeBgOpacity, setRestaurantModeBgOpacity,
      dashboardBgType, setDashboardBgType, dashboardBackgroundColor, setDashboardBackgroundColor, dashboardBackgroundImage, setDashboardBackgroundImage, dashboardBgOpacity,
      setDashboardBgOpacity, dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor, dashboardButtonOpacity, setDashboardButtonOpacity,
      dashboardButtonShowBorder, setDashboardButtonShowBorder, dashboardButtonBorderColor, setDashboardButtonBorderColor, companyInfo, setCompanyInfo,
      isNavConfirmOpen, showNavConfirm, closeNavConfirm, confirmNavigation, seedInitialData, resetAllData, exportConfiguration, importConfiguration,
      importDemoData, importDemoCustomers, importDemoSuppliers, cameFromRestaurant, setCameFromRestaurant, isLoading, user, toast]
  );

  return (
    <PosContext.Provider value={value as any}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
