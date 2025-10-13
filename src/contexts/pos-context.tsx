
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useUser as useFirebaseUser } from '@/firebase/auth/use-user';
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
  currentSaleContext: Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order'; } | null;
  setCurrentSaleContext: React.Dispatch<React.SetStateAction<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order'; } | null>>;
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
  addSupplier: (supplier: Omit<Supplier, 'id'> & {id: string}) => Promise<Supplier | null>;
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

const initializeDemoData = () => {
  const demoVatRates = [
    { id: 'vat_20', name: 'Taux Normal', rate: 20, code: 1 },
    { id: 'vat_10', name: 'Taux Intermédiaire', rate: 10, code: 2 },
    { id: 'vat_5.5', name: 'Taux Réduit', rate: 5.5, code: 3 },
  ];

  const demoPaymentMethods = [
    { id: 'pm_cash', name: 'Espèces', icon: 'cash' as const, type: 'direct' as const, isActive: true },
    { id: 'pm_card', name: 'Carte Bancaire', icon: 'card' as const, type: 'direct' as const, isActive: true },
    { id: 'pm_check', name: 'Chèque', icon: 'check' as const, type: 'direct' as const, isActive: true },
    { id: 'pm_other', name: 'AUTRE', icon: 'other' as const, type: 'direct' as const, isActive: true },
  ];

  const demoCategories: Category[] = [];
  const demoItems: Item[] = [];

  demoData.categories.forEach((categoryData, catIndex) => {
      const catId = `cat_${catIndex}`;
      demoCategories.push({
          id: catId,
          name: categoryData.name,
          image: `https://picsum.photos/seed/${catId}/200/150`,
          color: '#e2e8f0'
      });

      categoryData.items.forEach((itemData, itemIndex) => {
          const itemId = `${catId}_item_${itemIndex}`;
          demoItems.push({
              id: itemId,
              name: itemData.name,
              price: itemData.price,
              description: itemData.description,
              categoryId: catId,
              vatId: 'vat_20', // Default VAT
              image: `https://picsum.photos/seed/${itemId}/200/150`,
              barcode: `DEMO${Math.floor(100000 + Math.random() * 900000)}`
          });
      });
  });

  return { demoVatRates, demoPaymentMethods, demoCategories, demoItems };
};


export function PosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const router = useRouter();
  const { toast: shadcnToast } = useShadcnToast();

  const { demoVatRates, demoPaymentMethods, demoCategories, demoItems } = useMemo(initializeDemoData, []);

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
  const [items, setItems] = useState<Item[]>(demoItems);
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tablesData, setTablesData] = useState<Table[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(demoPaymentMethods);
  const [vatRates, setVatRates] = useState<VatRate[]>(demoVatRates);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);

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

  // #region Mock Data Management
  const seedInitialData = useCallback(() => {}, []);
  const importDemoData = useCallback(() => {}, []);
  const resetAllData = useCallback(() => {}, []);
  const deleteAllSales = useCallback(async () => {
    setSales([]);
    toast({ title: 'Ventes supprimées (localement)' });
  }, [toast]);
  // #endregion

  // #region Order Management (all local now)
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
          // Pass the existing order item to preserve serials
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

  // #region Mock Implementations of DB-dependent functions
  const holdOrder = useCallback(() => toast({ title: 'Fonctionnalité désactivée', description: 'La mise en attente nécessite une base de données.' }), [toast]);
  const recallOrder = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const deleteHeldOrder = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const setSelectedTableById = useCallback((tableId: string | null) => {
      if (!tableId) {
          clearOrder();
          return;
      }
      if (tableId === 'takeaway') {
          setCameFromRestaurant(true);
          router.push('/pos');
          return;
      }
      const table = tables.find(t => t.id === tableId);
      if(table) {
        setSelectedTable(table);
        setOrder(table.order);
        router.push(`/pos?tableId=${tableId}`);
      }
  }, [tables, clearOrder, router, setCameFromRestaurant]);
  const updateTableOrder = useCallback(() => {}, []);
  const saveTableOrderAndExit = useCallback(() => router.push('/restaurant'), [router]);
  const promoteTableToTicket = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const forceFreeTable = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const addTable = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const updateTable = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const deleteTable = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const recordSale = useCallback(async (): Promise<Sale | null> => null, []);
  const recordCommercialDocument = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);

  const addUser = useCallback(async () => {}, []);
  const updateUser = useCallback(() => {}, []);
  const deleteUser = useCallback(() => {}, []);
  const sendPasswordResetEmailForUser = useCallback(() => {}, []);
  const findUserByEmail = useCallback(() => undefined, []);
  const handleSignOut = useCallback(async () => {}, []);
  const validateSession = useCallback(() => false, []);
  const forceSignOut = useCallback(() => {}, []);
  const forceSignOutUser = useCallback(() => {}, []);
  const addCategory = useCallback(async () => null, []);
  const updateCategory = useCallback(() => {}, []);
  const deleteCategory = useCallback(() => {}, []);
  const toggleCategoryFavorite = useCallback(() => {}, []);
  const getCategoryColor = useCallback(() => undefined, []);
  const addItem = useCallback(async () => null, []);
  const updateItem = useCallback(() => {}, []);
  const deleteItem = useCallback(() => {}, []);
  const toggleItemFavorite = useCallback(() => {}, []);
  const toggleFavoriteForList = useCallback(() => {}, []);
  const addCustomer = useCallback(async () => null, []);
  const updateCustomer = useCallback(() => {}, []);
  const deleteCustomer = useCallback(() => {}, []);
  const setDefaultCustomer = useCallback(() => {}, []);
  const addSupplier = useCallback(async () => null, []);
  const updateSupplier = useCallback(() => {}, []);
  const deleteSupplier = useCallback(() => {}, []);
  const addPaymentMethod = useCallback(() => {}, []);
  const updatePaymentMethod = useCallback(() => {}, []);
  const deletePaymentMethod = useCallback(() => {}, []);
  const addVatRate = useCallback(() => {}, []);
  const updateVatRate = useCallback(() => {}, []);
  const deleteVatRate = useCallback(() => {}, []);
  const setCompanyInfo = useCallback(() => {}, []);
  const exportConfiguration = useCallback(() => toast({ title: 'Fonctionnalité désactivée' }), [toast]);
  const importConfiguration = useCallback(async () => {}, []);
  const importDemoCustomers = useCallback(async () => {}, []);
  const importDemoSuppliers = useCallback(async () => {}, []);
  const loadTicketForViewing = useCallback(() => {}, []);
  const loadSaleForEditing = useCallback(() => {}, []);
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
  
  const lastDirectSale: Sale | null = null;
  const lastRestaurantSale: Sale | null = null;

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

    