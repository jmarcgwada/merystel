
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
  AuditLog,
  SmtpConfig,
  FtpConfig,
  TwilioConfig,
  MappingTemplate,
} from '@/lib/types';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';
import { useUser as useFirebaseUser } from '@/firebase/auth/use-user';
import { v4 as uuidv4 } from 'uuid';
import demoData from '@/lib/demodata.json';
import type { Timestamp } from 'firebase/firestore';
import { sendEmail } from '@/ai/flows/send-email-flow';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from '@/app/reports/components/invoice-print-template';
import isEqual from 'lodash.isequal';


const SHARED_COMPANY_ID = 'main';

const TAKEAWAY_TABLE: Table = {
  id: 'takeaway',
  name: 'Vente directe au comptoir',
  number: 999,
  status: 'available',
  order: [],
  description: 'Pour les ventes à emporter et les commandes rapides.',
  covers: 0,
  createdAt: new Date(),
};

export type DeletableDataKeys = 
  | 'items' 
  | 'categories' 
  | 'customers' 
  | 'suppliers' 
  | 'tables' 
  | 'sales' 
  | 'paymentMethods' 
  | 'vatRates' 
  | 'heldOrders' 
  | 'auditLogs';

export interface PosContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  systemDate: Date;
  dynamicBgImage: string | null;
  readOnlyOrder: OrderItem[] | null;
  setReadOnlyOrder: React.Dispatch<React.SetStateAction<OrderItem[] | null>>;
  addToOrder: (itemId: string, selectedVariants?: SelectedVariant[]) => void;
  addSerializedItemToOrder: (item: Item | OrderItem, quantity: number, serialNumbers: string[]) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemQuantityInOrder: (itemId: string, quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  updateItemNote: (itemId: OrderItem['id'], note: string) => void;
  updateItemPrice: (itemId: string, newPriceTTC: number) => void;
  updateOrderItem: (item: Item) => void;
  applyDiscount: (
    itemId: OrderItem['id'],
    value: number,
    type: 'percentage' | 'fixed'
  ) => void;
  clearOrder: () => void;
  resetCommercialPage: (pageType: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note') => void;
  orderTotal: number;
  orderTax: number;
  isKeypadOpen: boolean;
  setIsKeypadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentSaleId: string | null;
  setCurrentSaleId: React.Dispatch<React.SetStateAction<string | null>>;
  currentSaleContext: Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; isReadOnly?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'ticket' | 'supplier_order' | 'credit_note'; fromConversion?: boolean; originalTotal?: number; originalPayments?: Payment[], change?:number; originalSaleId?: string; } | null;
  setCurrentSaleContext: React.Dispatch<React.SetStateAction<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; isReadOnly?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'ticket' | 'supplier_order' | 'credit_note'; fromConversion?: boolean; originalTotal?: number; originalPayments?: Payment[], change?:number; originalSaleId?: string;} | null>>;
  serialNumberItem: { item: Item | OrderItem; quantity: number } | null;
  setSerialNumberItem: React.Dispatch<React.SetStateAction<{ item: Item | OrderItem; quantity: number } | null>>;
  variantItem: Item | null;
  setVariantItem: React.Dispatch<React.SetStateAction<Item | null>>;
  lastDirectSale: Sale | null;
  lastRestaurantSale: Sale | null;
  loadTicketForViewing: (ticket: Sale) => void;
  loadSaleForEditing: (saleId: string, type: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note') => Promise<boolean>;
  loadSaleForConversion: (saleId: string) => void;
  convertToInvoice: (saleId: string) => void;

  users: User[];
  addUser: (user: Omit<User, 'id' | 'companyId' | 'createdAt'>, password?: string) => Promise<void>;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  sendPasswordResetEmailForUser: (email: string) => void;
  findUserByEmail: (email: string) => User | undefined;
  handleSignOut: (isAuto?: boolean) => Promise<void>;
  forceSignOut: (message: string) => void;
  forceSignOutUser: (userId: string) => void;
  sessionInvalidated: boolean;
  setSessionInvalidated: React.Dispatch<React.SetStateAction<boolean>>;
  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { barcode: string }) => Promise<Item | null>;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  toggleItemFavorite: (itemId: string) => void;
  toggleFavoriteForList: (itemIds: string[], setFavorite: boolean) => void;
  popularItems: Item[];
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category | null>;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;
  getCategoryColor: (categoryId: string) => string | undefined;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'isDefault' | 'createdAt'> & {id?: string}) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  setDefaultCustomer: (customerId: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier | null>;
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
    sale: Omit<Sale, 'id' | 'ticketNumber' | 'date'>,
    saleIdToUpdate?: string
  ) => Promise<Sale | null>;
   recordCommercialDocument: (
    doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'>,
    type: 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note',
    docIdToUpdate?: string,
  ) => void,
  deleteAllSales: () => Promise<void>;
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;
  vatRates: VatRate[];
  addVatRate: (vatRate: Omit<VatRate, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => void;
  updateVatRate: (vatRate: VatRate) => void;
  deleteVatRate: (vatRateId: string) => void;
  heldOrders: HeldOrder[] | null;
  holdOrder: () => void;
  recallOrder: (orderId: string) => void;
  deleteHeldOrder: (orderId: string) => void;
  auditLogs: AuditLog[];
  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;
  seedInitialData: () => void;
  resetAllData: () => Promise<void>;
  exportConfiguration: () => string;
  importConfiguration: (file: File) => Promise<void>;
  importDataFromJson: (dataType: string, jsonData: any[]) => Promise<{ successCount: number, errorCount: number, errors: string[] }>;
  importDemoData: () => Promise<void>;
  importDemoCustomers: () => Promise<void>;
  importDemoSuppliers: () => Promise<void>;
  cameFromRestaurant: boolean;
  setCameFromRestaurant: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  user: any;
  toast: (props: any) => void;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  enableDynamicBg: boolean;
  setEnableDynamicBg: React.Dispatch<React.SetStateAction<boolean>>;
  dynamicBgOpacity: number;
  setDynamicBgOpacity: React.Dispatch<React.SetStateAction<number>>;
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
  requirePinForAdmin: boolean;
  setRequirePinForAdmin: React.Dispatch<React.SetStateAction<boolean>>;
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
  invoiceBgColor: string;
  setInvoiceBgColor: React.Dispatch<React.SetStateAction<string>>;
  invoiceBgOpacity: number;
  setInvoiceBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  quoteBgColor: string;
  setQuoteBgColor: React.Dispatch<React.SetStateAction<string>>;
  quoteBgOpacity: number;
  setQuoteBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  deliveryNoteBgColor: string;
  setDeliveryNoteBgColor: React.Dispatch<React.SetStateAction<string>>;
  deliveryNoteBgOpacity: number;
  setDeliveryNoteBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  supplierOrderBgColor: string;
  setSupplierOrderBgColor: React.Dispatch<React.SetStateAction<string>>;
  supplierOrderBgOpacity: number;
  setSupplierOrderBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  creditNoteBgColor: string;
  setCreditNoteBgColor: React.Dispatch<React.SetStateAction<string>>;
  creditNoteBgOpacity: number;
  setCreditNoteBgOpacity: React.Dispatch<React.SetStateAction<number>>;
  commercialViewLevel: number;
  cycleCommercialViewLevel: () => void;
  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => void;
  smtpConfig: SmtpConfig;
  setSmtpConfig: React.Dispatch<React.SetStateAction<SmtpConfig>>;
  ftpConfig: FtpConfig;
  setFtpConfig: React.Dispatch<React.SetStateAction<FtpConfig>>;
  twilioConfig: TwilioConfig;
  setTwilioConfig: React.Dispatch<React.SetStateAction<TwilioConfig>>;
  sendEmailOnSale: boolean;
  setSendEmailOnSale: React.Dispatch<React.SetStateAction<boolean>>;
  lastSelectedSaleId: string | null;
  setLastSelectedSaleId: React.Dispatch<React.SetStateAction<string | null>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  importLimit: number;
  setImportLimit: React.Dispatch<React.SetStateAction<number>>;
  mappingTemplates: MappingTemplate[];
  addMappingTemplate: (template: MappingTemplate) => void;
  deleteMappingTemplate: (templateName: string) => void;
  selectivelyResetData: (dataToReset: Record<DeletableDataKeys, boolean>) => Promise<void>;
  removeDuplicateItems: () => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
    const [state, setState] = useState(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                setState(JSON.parse(storedValue));
            }
        } catch (error) {
            console.error("Error reading localStorage key " + key + ":", error);
        }
        setIsHydrated(true);
    }, [key]);

    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error("Error setting localStorage key " + key + ":", error);
            }
        }
    }, [key, state, isHydrated]);

    const rehydrate = useCallback(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                setState(JSON.parse(storedValue));
            }
        } catch (error) {
            console.error("Error re-reading localStorage key " + key + ":", error);
        }
    }, [key]);

    return [state, setState, rehydrate];
}

export function PosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast: shadcnToast } = useShadcnToast();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);


  // Settings States
  const [showNotifications, setShowNotifications] = usePersistentState('settings.showNotifications', true);
  const [notificationDuration, setNotificationDuration] = usePersistentState('settings.notificationDuration', 3000);
  const [enableDynamicBg, setEnableDynamicBg] = usePersistentState('settings.enableDynamicBg', true);
  const [dynamicBgOpacity, setDynamicBgOpacity] = usePersistentState('settings.dynamicBgOpacity', 10);
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
  const [enableSerialNumber, setEnableSerialNumber] = usePersistentState('settings.enableSerialNumber', true);
  const [defaultSalesMode, setDefaultSalesMode] = usePersistentState<'pos' | 'supermarket' | 'restaurant'>('settings.defaultSalesMode', 'pos');
  const [isForcedMode, setIsForcedMode] = usePersistentState('settings.isForcedMode', false);
  const [requirePinForAdmin, setRequirePinForAdmin] = usePersistentState('settings.requirePinForAdmin', true);
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
  const [invoiceBgColor, setInvoiceBgColor] = usePersistentState('settings.invoiceBgColor', '#eef2ff');
  const [invoiceBgOpacity, setInvoiceBgOpacity] = usePersistentState('settings.invoiceBgOpacity', 100);
  const [quoteBgColor, setQuoteBgColor] = usePersistentState('settings.quoteBgColor', '#f0fdf4');
  const [quoteBgOpacity, setQuoteBgOpacity] = usePersistentState('settings.quoteBgOpacity', 100);
  const [deliveryNoteBgColor, setDeliveryNoteBgColor] = usePersistentState('settings.deliveryNoteBgColor', '#fefce8');
  const [deliveryNoteBgOpacity, setDeliveryNoteBgOpacity] = usePersistentState('settings.deliveryNoteBgOpacity', 100);
  const [supplierOrderBgColor, setSupplierOrderBgColor] = usePersistentState('settings.supplierOrderBgColor', '#faf5ff');
  const [supplierOrderBgOpacity, setSupplierOrderBgOpacity] = usePersistentState('settings.supplierOrderBgOpacity', 100);
  const [creditNoteBgColor, setCreditNoteBgColor] = usePersistentState('settings.creditNoteBgColor', '#fee2e2');
  const [creditNoteBgOpacity, setCreditNoteBgOpacity] = usePersistentState('settings.creditNoteBgOpacity', 100);
  const [commercialViewLevel, setCommercialViewLevel] = usePersistentState('settings.commercialViewLevel', 0);
  const [smtpConfig, setSmtpConfig] = usePersistentState<SmtpConfig>('settings.smtpConfig', {});
  const [ftpConfig, setFtpConfig] = usePersistentState<FtpConfig>('settings.ftpConfig', {});
  const [twilioConfig, setTwilioConfig] = usePersistentState<TwilioConfig>('settings.twilioConfig', {});
  const [sendEmailOnSale, setSendEmailOnSale] = usePersistentState('settings.sendEmailOnSale', false);
  const [itemsPerPage, setItemsPerPage] = usePersistentState('settings.itemsPerPage', 20);
  const [lastSelectedSaleId, setLastSelectedSaleId] = usePersistentState<string | null>('state.lastSelectedSaleId', null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [importLimit, setImportLimit] = usePersistentState('settings.importLimit', 100);
  const [mappingTemplates, setMappingTemplates] = usePersistentState<MappingTemplate[]>('settings.mappingTemplates', []);


  const [order, setOrder] = useState<OrderItem[]>([]);
  const [systemDate, setSystemDate] = useState(new Date());
  const [dynamicBgImage, setDynamicBgImage] = useState<string | null>(null);
  const [readOnlyOrder, setReadOnlyOrder] = useState<OrderItem[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
    
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [currentSaleContext, setCurrentSaleContext] = useState<Partial<Sale> & { isTableSale?: boolean; isInvoice?: boolean; isReadOnly?: boolean; acompte?: number; documentType?: 'invoice' | 'quote' | 'delivery_note' | 'ticket' | 'supplier_order' | 'credit_note'; fromConversion?: boolean; originalSaleId?: string; } | null>(
    null
  );
  const [isNavConfirmOpen, setNavConfirmOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [cameFromRestaurant, setCameFromRestaurant] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [serialNumberItem, setSerialNumberItem] = useState<{item: Item | OrderItem, quantity: number} | null>(null);
  const [variantItem, setVariantItem] = useState<Item | null>(null);
  
  const [items, setItems, rehydrateItems] = usePersistentState<Item[]>('data.items', []);
  const [categories, setCategories, rehydrateCategories] = usePersistentState<Category[]>('data.categories', []);
  const [customers, setCustomers, rehydrateCustomers] = usePersistentState<Customer[]>('data.customers', []);
  const [suppliers, setSuppliers, rehydrateSuppliers] = usePersistentState<Supplier[]>('data.suppliers', []);
  const [tablesData, setTablesData, rehydrateTables] = usePersistentState<Table[]>('data.tables', []);
  const [sales, setSales, rehydrateSales] = usePersistentState<Sale[]>('data.sales', []);
  const [paymentMethods, setPaymentMethods, rehydratePaymentMethods] = usePersistentState<PaymentMethod[]>('data.paymentMethods', []);
  const [vatRates, setVatRates, rehydrateVatRates] = usePersistentState<VatRate[]>('data.vatRates', []);
  const [heldOrders, setHeldOrders, rehydrateHeldOrders] = usePersistentState<HeldOrder[]>('data.heldOrders', []);
  const [auditLogs, setAuditLogs, rehydrateAuditLogs] = usePersistentState<AuditLog[]>('data.auditLogs', []);
  const [companyInfo, setCompanyInfo, rehydrateCompanyInfo] = usePersistentState<CompanyInfo | null>('data.companyInfo', null);
  const [users, setUsers, rehydrateUsers] = usePersistentState<User[]>('data.users', []);

  const isLoading = userLoading || !isHydrated;
  
  const toast = useCallback((props: Parameters<typeof useShadcnToast>[0]) => {
    if (showNotifications) {
      shadcnToast({
        ...props,
        duration: props?.duration || notificationDuration,
      });
    }
  }, [showNotifications, notificationDuration, shadcnToast]);

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

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
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
    },
    [order, removeFromOrder, enableSerialNumber, items, setSerialNumberItem]
  );
  
  const updateQuantityFromKeypad = useCallback(
    (itemId: OrderItem['id'], quantity: number) => {
      updateQuantity(itemId, quantity);
    },
    [updateQuantity]
  );

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

  const resetCommercialPage = useCallback((pageType: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note') => {
    clearOrder();
    setCurrentSaleId(null);
    setCurrentSaleContext({ documentType: pageType });
  }, [clearOrder]);

  const addAuditLog = useCallback((logData: Omit<AuditLog, 'id' | 'date'>) => {
    if (!user) return;
    const newLog: AuditLog = {
      ...logData,
      id: uuidv4(),
      date: new Date(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [user, setAuditLogs]);

  const seedInitialData = useCallback(() => {
    const hasData = categories.length > 0 || vatRates.length > 0;
    if (hasData) {
        return;
    }

    const defaultVatRates: VatRate[] = [
        { id: 'vat_20', name: 'Taux Normal', rate: 20, code: 1, createdAt: new Date() },
        { id: 'vat_10', name: 'Taux Intermédiaire', rate: 10, code: 2, createdAt: new Date() },
        { id: 'vat_5', name: 'Taux Réduit', rate: 5.5, code: 3, createdAt: new Date() },
    ];
    setVatRates(defaultVatRates);

    const defaultPaymentMethods: PaymentMethod[] = [
        { id: 'pm_cash', name: 'Espèces', icon: 'cash' as const, type: 'direct' as const, isActive: true, createdAt: new Date() },
        { id: 'pm_card', name: 'Carte Bancaire', icon: 'card' as const, type: 'direct' as const, isActive: true, createdAt: new Date() },
        { id: 'pm_check', name: 'Chèque', icon: 'check' as const, type: 'direct' as const, isActive: true, createdAt: new Date() },
        { id: 'pm_other', name: 'AUTRE', icon: 'other' as const, type: 'direct' as const, isActive: true, createdAt: new Date() },
    ];
    setPaymentMethods(defaultPaymentMethods);
    
    toast({ title: 'Données initialisées', description: 'TVA et méthodes de paiement par défaut créées.' });
  }, [categories.length, vatRates.length, setVatRates, setPaymentMethods, toast]);
    
  const importDemoData = useCallback(async () => {
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
            color: '#e2e8f0',
            createdAt: new Date(),
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
                barcode: `DEMO${Math.floor(100000 + Math.random() * 900000)}`,
                createdAt: new Date(),
            });
        });
    });
    
    const demoCustomers: Customer[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `C${uuidv4().substring(0,6)}`,
        name: `Client Démo ${i + 1}`,
        email: `client${i+1}@demo.com`,
        createdAt: new Date(),
    }));
    
    const demoSuppliers: Supplier[] = Array.from({ length: 5 }).map((_, i) => ({
        id: `S-${uuidv4().substring(0,6)}`,
        name: `Fournisseur Démo ${i + 1}`,
        email: `fournisseur${i+1}@demo.com`,
        createdAt: new Date(),
    }));

    setCategories(prev => [...prev, ...newCategories]);
    setItems(prev => [...prev, ...newItems]);
    setCustomers(prev => [...prev, ...demoCustomers]);
    setSuppliers(prev => [...prev, ...demoSuppliers]);
    toast({ title: 'Données de démo importées !' });
  }, [vatRates, setCategories, setItems, setCustomers, setSuppliers, toast]);

  const importDemoCustomers = useCallback(async () => {
    const demoCustomers: Customer[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `C${uuidv4().substring(0,6)}`,
        name: `Client Démo ${i + 1}`,
        email: `client${i+1}@demo.com`,
        createdAt: new Date(),
    }));
    setCustomers(prev => [...prev, ...demoCustomers]);
    toast({ title: 'Clients de démo importés !' });
  }, [setCustomers, toast]);
    
  const importDemoSuppliers = useCallback(async () => {
    const demoSuppliers: Supplier[] = Array.from({ length: 5 }).map((_, i) => ({
        id: `S-${uuidv4().substring(0,6)}`,
        name: `Fournisseur Démo ${i + 1}`,
        email: `fournisseur${i+1}@demo.com`,
        createdAt: new Date(),
    }));
    setSuppliers(prev => [...prev, ...demoSuppliers]);
    toast({ title: 'Fournisseurs de démo importés !' });
  }, [setSuppliers, toast]);

  const resetAllData = useCallback(async () => {
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
    setTimeout(() => {
      seedInitialData();
      importDemoData();
      localStorage.setItem('data.seeded', 'true');
    }, 100);
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales, setHeldOrders, setPaymentMethods, setVatRates, setCompanyInfo, toast, seedInitialData, importDemoData]);
  
  useEffect(() => {
    if(isHydrated) {
        const isSeeded = localStorage.getItem('data.seeded');
        if (!isSeeded) {
          seedInitialData();
          importDemoData();
          localStorage.setItem('data.seeded', 'true');
        }
    }
  }, [isHydrated, seedInitialData, importDemoData]);


  useEffect(() => {
    const timer = setInterval(() => setSystemDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tables = useMemo(() => [TAKEAWAY_TABLE, ...tablesData.sort((a, b) => a.number - b.number)], [tablesData]);
  
  const deleteAllSales = useCallback(async () => {
    setSales([]);
    toast({ title: 'Ventes supprimées' });
  }, [setSales, toast]);
  
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
        users,
    };
    return JSON.stringify(config, null, 2);
  }, [items, categories, customers, suppliers, tablesData, paymentMethods, vatRates, companyInfo, users]);

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
            if (config.users) setUsers(config.users);
            toast({ title: 'Importation réussie!', description: 'La configuration a été restaurée.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur d\'importation' });
        }
    };
    reader.readAsText(file);
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setPaymentMethods, setVatRates, setCompanyInfo, setUsers, toast]);
  
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
            title: "Prix d'achat manquant ou nul",
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
    [items, order, toast, enableSerialNumber, currentSaleContext, setVariantItem, setSerialNumberItem]
  );
  
  const updateItemQuantityInOrder = useCallback((itemId: string, quantity: number) => {
      setOrder(currentOrder => currentOrder.map(item => 
          item.id === itemId 
              ? { ...item, quantity: quantity, total: item.price * quantity - (item.discount || 0) } 
              : item
      ));
  }, []);

   const updateItemNote = useCallback((itemId: OrderItem['id'], note: string) => {
    setOrder(currentOrder =>
      currentOrder.map(item =>
        item.id === itemId ? { ...item, note } : item
      )
    );
    toast({ title: 'Note ajoutée à l\'article.' });
  }, [toast]);
    
   const updateItemPrice = useCallback((itemId: string, newPriceTTC: number) => {
        setOrder(currentOrder =>
            currentOrder.map(item => {
                if (item.id === itemId) {
                    const discountRatio = item.discount ? item.discount / (item.price * item.quantity) : 0;
                    const newDiscount = (newPriceTTC * item.quantity) * discountRatio;
                    const newTotal = (newPriceTTC * item.quantity) - newDiscount;

                    return {
                        ...item,
                        price: newPriceTTC,
                        discount: newDiscount,
                        total: newTotal
                    };
                }
                return item;
            })
        );
    }, []);

  const updateOrderItem = useCallback((updatedItem: Item) => {
    setOrder(currentOrder => 
      currentOrder.map(orderItem => 
        orderItem.itemId === updatedItem.id 
          ? { 
              ...orderItem, 
              name: updatedItem.name, 
              price: updatedItem.price, 
              description: updatedItem.description, 
              description2: updatedItem.description2,
              barcode: updatedItem.barcode || '',
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
      const taxForItem = item.total / (1 + (vat?.rate || 0) / 100) * ((vat?.rate || 0) / 100);
      return sum + taxForItem;
    }, 0);
  }, [order, readOnlyOrder, vatRates]);
  
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
            setSelectedTable(null);
            setCurrentSaleContext({
                tableId: orderToRecall.tableId,
                tableName: orderToRecall.tableName,
            });
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
         router.push('/pos?tableId=' + tableId);
      }
    }, [tables, cameFromRestaurant, clearOrder, router]);

    const updateTableOrder = useCallback((tableId: string, order: OrderItem[]) => {
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, order, status: order.length > 0 ? 'occupied' : 'available', occupiedAt: order.length > 0 ? new Date() : undefined, occupiedByUserId: order.length > 0 ? user?.id : undefined, updatedAt: new Date() } : t));
    }, [setTablesData, user]);

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
      setCurrentSaleId('table-' + tableId);
      setCurrentSaleContext({ tableId: table.id, tableName: table.name, isTableSale: true });
      setOrder(orderData);
    }, [tables, setTablesData]);
    
    const forceFreeTable = useCallback((tableId: string) => {
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, status: 'available', order: [], lockedBy: null, verrou: false, occupiedAt: undefined, occupiedByUserId: undefined, updatedAt: new Date() } : t));
      toast({ title: 'Table libérée' });
    }, [setTablesData, toast]);

    const addTable = useCallback((tableData: Omit<Table, 'id' | 'status' | 'order' | 'number'>) => {
      const newTable: Table = {
        ...tableData,
        id: uuidv4(),
        number: (tablesData.length > 0 ? Math.max(...tablesData.map(t => t.number || 0)) : 0) + 1,
        status: 'available',
        order: [],
        createdAt: new Date()
      };
      setTablesData(prev => [...prev, newTable]);
    }, [tablesData, setTablesData]);

    const updateTable = useCallback((table: Table) => {
        const updatedTable = { ...table, updatedAt: new Date() };
      setTablesData(prev => prev.map(t => t.id === table.id ? updatedTable : t));
    }, [setTablesData]);

    const deleteTable = useCallback((tableId: string) => {
      setTablesData(prev => prev.filter(t => t.id !== tableId));
    }, [setTablesData]);
  
    const recordSale = useCallback(async (saleData: Omit<Sale, 'id' | 'ticketNumber' | 'date'>, saleIdToUpdate?: string): Promise<Sale | null> => {
        const today = new Date();
        let finalSale: Sale;
    
        if (saleIdToUpdate && !saleIdToUpdate.startsWith('table-')) {
            const existingSale = sales.find(s => s.id === saleIdToUpdate);
            if (!existingSale) return null;
            
            finalSale = {
                ...existingSale,
                ...saleData,
                date: existingSale.date, // Preserve original date on update
                modifiedAt: today, 
            };
        } else {
            const dayMonth = format(today, 'ddMM');
            let ticketNumber: string;
            let newId = uuidv4();
    
            if (saleData.documentType === 'invoice') {
                const invoiceCount = sales.filter(s => s.documentType === 'invoice').length;
                ticketNumber = 'Fact-' + (invoiceCount + 1).toString().padStart(4, '0');
            } else {
                const todaysSalesCount = sales.filter(s => {
                    const saleDate = new Date(s.date as Date);
                    return saleDate.toDateString() === today.toDateString() && s.documentType !== 'invoice';
                }).length;
                ticketNumber = 'Tick-' + dayMonth + '-' + (todaysSalesCount + 1).toString().padStart(4, '0');
            }
            
            finalSale = {
                id: newId,
                ticketNumber,
                ...saleData,
                date: today,
                userId: user?.id || 'unknown',
                userName: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur Inconnu',
            };
        }
        
        if (currentSaleContext?.isTableSale && currentSaleContext.tableId) {
            setTablesData(prev => prev.map(t => t.id === currentSaleContext.tableId ? {...t, status: 'available', order: [], closedAt: new Date(), closedByUserId: user?.id} : t));
        }
        
        if (currentSaleId && !currentSaleId.startsWith('table-')) {
            setHeldOrders(prev => prev?.filter(o => o.id !== currentSaleId) || null);
        }

        // Handle invoice conversion: update original doc status
        if (currentSaleContext?.originalSaleId) {
          addAuditLog({
            action: 'transform',
            documentId: finalSale.id,
            documentNumber: finalSale.ticketNumber,
            documentType: finalSale.documentType || 'unknown',
            details: `Transformé depuis ${currentSaleContext.documentType} #${currentSaleContext.ticketNumber}`,
            userId: user?.id || 'system',
            userName: user ? `${user.firstName} ${user.lastName}` : 'System',
          });
          setSales(currentSales =>
            currentSales.map(s =>
              s.id === currentSaleContext.originalSaleId
                ? { ...s, status: 'invoiced', modifiedAt: new Date() }
                : s
            )
          );
        }

        if (saleIdToUpdate && !saleIdToUpdate.startsWith('table-')) {
           setSales(prev => prev.map(s => s.id === saleIdToUpdate ? finalSale : s));
           if (!isEqual(sales.find(s=>s.id === saleIdToUpdate)?.items, finalSale.items)) {
             addAuditLog({ action: 'update', documentId: finalSale.id, documentNumber: finalSale.ticketNumber, documentType: finalSale.documentType || 'unknown', details: 'Mise à jour de la pièce', userId: user?.id || 'system', userName: user ? `${user.firstName} ${user.lastName}` : 'System', richDetails: { items: finalSale.items, payments: finalSale.payments } });
           }
        } else {
           setSales(prev => [finalSale, ...prev]);
           addAuditLog({ action: 'create', documentId: finalSale.id, documentNumber: finalSale.ticketNumber, documentType: finalSale.documentType || 'unknown', details: 'Création de la pièce', userId: user?.id || 'system', userName: user ? `${user.firstName} ${user.lastName}` : 'System', richDetails: { items: finalSale.items, payments: finalSale.payments } });
        }

        if(sendEmailOnSale && smtpConfig?.senderEmail) {
            sendEmail({
                smtpConfig: {
                    host: smtpConfig.host!,
                    port: smtpConfig.port!,
                    secure: smtpConfig.secure || false,
                    auth: { user: smtpConfig.user!, pass: smtpConfig.password! },
                    senderEmail: smtpConfig.senderEmail!,
                },
                to: smtpConfig.senderEmail,
                subject: `Nouvelle vente: ${finalSale.ticketNumber}`,
                text: `Une nouvelle vente de ${finalSale.total.toFixed(2)}€ a été enregistrée.`,
                html: `<p>Une nouvelle vente de <strong>${finalSale.total.toFixed(2)}€</strong> a été enregistrée.</p><p>Numéro: ${finalSale.ticketNumber}</p>`
            })
        }
    
        return finalSale;
    }, [sales, user, currentSaleContext, currentSaleId, setTablesData, setHeldOrders, setSales, addAuditLog, sendEmailOnSale, smtpConfig]);
    
    const recordCommercialDocument = useCallback(async (docData: Omit<Sale, 'id' | 'date' | 'ticketNumber'>, type: 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note', docIdToUpdate?: string) => {
        const today = new Date();
        const prefixes = { 'quote': 'Devis', 'delivery_note': 'BL', 'supplier_order': 'CF', 'credit_note': 'Avoir' };
        const prefix = prefixes[type];
        
        let finalDoc: Sale;

        if (docIdToUpdate) {
            const existingDoc = sales.find(s => s.id === docIdToUpdate);
            if (!existingDoc) return;
            finalDoc = {
                ...existingDoc,
                ...docData,
                modifiedAt: today,
            };
            addAuditLog({ action: 'update', documentId: finalDoc.id, documentNumber: finalDoc.ticketNumber, documentType: type, details: `Mise à jour de la pièce ${finalDoc.ticketNumber}`, userId: user?.id || 'system', userName: user ? `${user.firstName} ${user.lastName}` : 'System', richDetails: { items: finalDoc.items } });
            setSales(prev => prev.map(s => s.id === docIdToUpdate ? finalDoc : s));
        } else {
             const count = sales.filter(s => s.documentType === type).length;
             const number = prefix + '-' + (count + 1).toString().padStart(4, '0');
             finalDoc = {
                id: uuidv4(),
                date: today,
                ticketNumber: number,
                documentType: type,
                userId: user?.id || 'unknown',
                userName: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur Inconnu',
                ...docData,
            };
            addAuditLog({ action: 'create', documentId: finalDoc.id, documentNumber: finalDoc.ticketNumber, documentType: type, details: `Création de la pièce ${finalDoc.ticketNumber}`, userId: user?.id || 'system', userName: user ? `${user.firstName} ${user.lastName}` : 'System' });
            setSales(prev => [finalDoc, ...prev]);
        }
        
        toast({ title: `${prefix} ${finalDoc.status === 'paid' ? 'facturé' : 'enregistré'}` });
        clearOrder();

        const reportPath = `/reports?docType=${type}`;
        router.push(reportPath);
    }, [sales, setSales, user, clearOrder, toast, router, addAuditLog]);

  const addUser = useCallback(async () => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
  const updateUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
  const deleteUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
  const sendPasswordResetEmailForUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);
  const findUserByEmail = useCallback(() => undefined, []);
  const handleSignOut = useCallback(async () => { router.push('/login'); }, [router]);
  const forceSignOut = useCallback(() => { router.push('/login'); }, [router]);
  const forceSignOutUser = useCallback(() => { toast({ title: 'Fonctionnalité désactivée' }) }, [toast]);

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
    setReadOnlyOrder(ticket.items.map(item => ({...item, sourceSale: ticket })));
    setCurrentSaleId(ticket.id);
    setCurrentSaleContext({
      ticketNumber: ticket.ticketNumber,
      date: ticket.date,
      userName: ticket.userName,
      isTableSale: !!ticket.tableId,
      tableName: ticket.tableName,
      tableId: ticket.tableId,
      isReadOnly: true,
    });
  }, []);
  
  const loadSaleForEditing = useCallback(async (saleId: string, type: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note'): Promise<boolean> => {
      const saleToEdit = sales.find(s => s.id === saleId);
      if (saleToEdit) {
        const isReadOnly = saleToEdit.status === 'paid' || saleToEdit.status === 'invoiced';
        
        const totalPaid = (saleToEdit.payments || []).reduce((acc, p) => acc + p.amount, 0);

        setOrder(saleToEdit.items);
        setCurrentSaleId(saleId);
        setCurrentSaleContext({
          ...saleToEdit,
          documentType: type,
          isReadOnly: isReadOnly,
          originalTotal: saleToEdit.total,
          originalPayments: saleToEdit.payments,
          acompte: totalPaid,
          change: saleToEdit.change,
        });
        return true;
      } else {
        toast({ title: "Erreur", description: "Pièce introuvable.", variant: "destructive" });
        return false;
      }
    }, [sales, toast]);

    const loadSaleForConversion = useCallback((saleId: string) => {
      const saleToConvert = sales.find(s => s.id === saleId);
      if (!saleToConvert) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Pièce originale introuvable.' });
          return;
      }
  
      setOrder(saleToConvert.items);
      setCurrentSaleId(null); 
      
      const { items: _, ticketNumber: __, ...restOfSale } = saleToConvert;

      setCurrentSaleContext({
        ...restOfSale,
        documentType: 'invoice',
        status: 'pending',
        date: new Date(),
        payments: [],            
        originalTotal: undefined,
        originalPayments: undefined,
        change: undefined,
        modifiedAt: undefined,
        originalSaleId: saleToConvert.id,
      });
  }, [sales, toast]);

    const convertToInvoice = useCallback((saleId: string) => {
      router.push(`/commercial/invoices?fromConversion=${saleId}`);
  }, [router]);
  
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newCategory = { ...category, id: uuidv4(), code: category.code || `${category.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`, createdAt: new Date() };
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
  }, [setCategories]);

  const updateCategory = useCallback((category: Category) => {
      const updatedCategory = { ...category, updatedAt: new Date() };
      setCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      setItems(prev => prev.filter(i => i.categoryId !== id));
  }, [setCategories, setItems]);

  const toggleCategoryFavorite = useCallback((id: string) => {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: new Date() } : c));
  }, [setCategories]);

  const getCategoryColor = useCallback((categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color;
  }, [categories]);

  const addItem = useCallback(async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { barcode: string }) => {
    if (item.barcode && items.some(i => i.barcode === item.barcode)) {
        throw new Error('Un article avec ce code-barres existe déjà.');
    }
    const newItem = { ...item, id: uuidv4(), barcode: item.barcode || uuidv4().substring(0, 13), createdAt: new Date() };
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [items, setItems]);


  const updateItem = useCallback((item: Item) => {
      const updatedItem = { ...item, updatedAt: new Date() };
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
  }, [setItems]);

  const deleteItem = useCallback((id: string) => {
      setItems(prev => prev.filter(i => i.id !== id));
  }, [setItems]);

  const toggleItemFavorite = useCallback((id: string) => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite, updatedAt: new Date() } : i));
  }, [setItems]);

  const toggleFavoriteForList = useCallback((itemIds: string[], setFavorite: boolean) => {
      setItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, isFavorite: setFavorite, updatedAt: new Date() } : i));
  }, [setItems]);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'isDefault' | 'createdAt'> & {id?: string}) => {
    if (customer.id && customers.some(c => c.id === customer.id)) {
        throw new Error('Un client avec ce code existe déjà.');
    }
    const newCustomer = { ...customer, id: customer.id || `C${uuidv4().substring(0, 6)}`, isDefault: customers.length === 0, createdAt: new Date() };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, [customers, setCustomers]);

  const updateCustomer = useCallback((customer: Customer) => {
      const updatedCustomer = { ...customer, updatedAt: new Date() };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
  }, [setCustomers]);

  const deleteCustomer = useCallback((id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
  }, [setCustomers]);

  const setDefaultCustomer = useCallback((id: string) => {
      setCustomers(prev => prev.map(c => ({...c, isDefault: c.id === id ? !c.isDefault : false })));
  }, [setCustomers]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier = { ...supplier, id: `S-${uuidv4().substring(0, 6)}`, createdAt: new Date() };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
}, [setSuppliers]);

  const updateSupplier = useCallback((supplier: Supplier) => {
      const updatedSupplier = { ...supplier, updatedAt: new Date() };
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? updatedSupplier : s));
  }, [setSuppliers]);

  const deleteSupplier = useCallback((id: string) => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
  }, [setSuppliers]);

  const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
      setPaymentMethods(prev => [...prev, { ...method, id: uuidv4(), createdAt: new Date() }]);
  }, [setPaymentMethods]);

  const updatePaymentMethod = useCallback((method: PaymentMethod) => {
      const updatedMethod = { ...method, updatedAt: new Date() };
      setPaymentMethods(prev => prev.map(pm => pm.id === method.id ? updatedMethod : pm));
  }, [setPaymentMethods]);

  const deletePaymentMethod = useCallback((id: string) => {
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  }, [setPaymentMethods]);

  const addVatRate = useCallback((vatRate: Omit<VatRate, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
      const newCode = (vatRates.length > 0 ? Math.max(...vatRates.map(v => v.code)) : 0) + 1;
      setVatRates(prev => [...prev, { ...vatRate, id: uuidv4(), code: newCode, createdAt: new Date() }]);
  }, [vatRates, setVatRates]);

  const updateVatRate = useCallback((vatRate: VatRate) => {
      const updatedVatRate = { ...vatRate, updatedAt: new Date() };
      setVatRates(prev => prev.map(v => v.id === vatRate.id ? updatedVatRate : v));
  }, [setVatRates]);

  const deleteVatRate = useCallback((id: string) => {
      setVatRates(prev => prev.filter(v => v.id !== id));
  }, [setVatRates]);
  
  const addMappingTemplate = useCallback((template: MappingTemplate) => {
    setMappingTemplates(prev => {
        const existingIndex = prev.findIndex(t => t.name === template.name);
        if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = template;
            return updated;
        }
        return [...prev, template];
    });
    toast({ title: 'Modèle de mappage sauvegardé !' });
  }, [setMappingTemplates, toast]);

  const deleteMappingTemplate = useCallback((templateName: string) => {
    setMappingTemplates(prev => prev.filter(t => t.name !== templateName));
    toast({ title: 'Modèle de mappage supprimé.' });
  }, [setMappingTemplates, toast]);
  
  const selectivelyResetData = useCallback(async (dataToReset: Record<DeletableDataKeys, boolean>) => {
    let message = 'Les données suivantes ont été supprimées : ';
    const deletedKeys: string[] = [];

    if (dataToReset.items) { setItems([]); deletedKeys.push('Articles'); }
    if (dataToReset.categories) { setCategories([]); deletedKeys.push('Catégories'); }
    if (dataToReset.customers) { setCustomers([]); deletedKeys.push('Clients'); }
    if (dataToReset.suppliers) { setSuppliers([]); deletedKeys.push('Fournisseurs'); }
    if (dataToReset.tables) { setTablesData([]); deletedKeys.push('Tables'); }
    if (dataToReset.sales) { setSales([]); deletedKeys.push('Ventes'); }
    if (dataToReset.paymentMethods) { setPaymentMethods([]); deletedKeys.push('Moyens de paiement'); }
    if (dataToReset.vatRates) { setVatRates([]); deletedKeys.push('TVA'); }
    if (dataToReset.heldOrders) { setHeldOrders([]); deletedKeys.push('Tickets en attente'); }
    if (dataToReset.auditLogs) { setAuditLogs([]); deletedKeys.push('Logs d\'audit'); }

    toast({ title: 'Réinitialisation sélective effectuée', description: message + deletedKeys.join(', ') });
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales, setHeldOrders, setPaymentMethods, setVatRates, setAuditLogs, toast]);
  
  const removeDuplicateItems = useCallback(() => {
    const seenBarcodes = new Set<string>();
    const uniqueItems: Item[] = [];
    items.forEach(item => {
        if (!item.barcode || !seenBarcodes.has(item.barcode)) {
            if (item.barcode) seenBarcodes.add(item.barcode);
            uniqueItems.push(item);
        }
    });
    setItems(uniqueItems);
    toast({ title: 'Doublons supprimés', description: `${items.length - uniqueItems.length} articles en double ont été supprimés.` });
  }, [items, setItems, toast]);

  const importDataFromJson = useCallback(async (dataType: string, jsonData: any[]): Promise<{ successCount: number, errorCount: number, errors: string[] }> => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    switch (dataType) {
        case 'clients':
            const existingCustomerIds = new Set(customers.map(c => c.id));
            for (const data of jsonData) {
                if (!data.id || !data.name) {
                    errorCount++;
                    errors.push(`Ligne ignorée : L'ID et le nom du client sont requis. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                if (existingCustomerIds.has(data.id)) {
                    errorCount++;
                    errors.push(`Ligne ignorée : Le client avec l'ID ${data.id} existe déjà. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                await addCustomer(data);
                successCount++;
            }
            break;
        case 'articles':
            const existingBarcodes = new Set(items.map(i => i.barcode));
            for (const data of jsonData) {
                 if (!data.barcode || !data.name || !data.price || !data.vatId) {
                    errorCount++;
                    errors.push(`Ligne ignorée : Code-barres, Nom, Prix et TVA sont requis. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                if (existingBarcodes.has(data.barcode)) {
                    errorCount++;
                    errors.push(`Ligne ignorée : L'article avec le code-barres ${data.barcode} existe déjà. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                await addItem(data);
                successCount++;
            }
            break;
         case 'fournisseurs':
            const existingSupplierIds = new Set(suppliers.map(c => c.id));
            for (const data of jsonData) {
                if (!data.id || !data.name) {
                    errorCount++;
                    errors.push(`Ligne ignorée : L'ID et le nom du fournisseur sont requis. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                if (existingSupplierIds.has(data.id)) {
                    errorCount++;
                    errors.push(`Ligne ignorée : Le fournisseur avec l'ID ${data.id} existe déjà. Ligne : ${JSON.stringify(data)}`);
                    continue;
                }
                await addSupplier(data);
                successCount++;
            }
            break;
        case 'ventes':
            const salesMap = new Map<string, Sale>();
            const existingSaleNumbers = new Set(sales.map(s => s.ticketNumber));

            for (const [index, row] of jsonData.entries()) {
                if (!row.ticketNumber) {
                    errorCount++;
                    errors.push(`Ligne ${index + 1}: Numéro de pièce manquant.`);
                    continue;
                }

                if (existingSaleNumbers.has(row.ticketNumber)) {
                    errorCount++;
                    errors.push(`Ligne ${index + 1}: La pièce N°${row.ticketNumber} existe déjà.`);
                    continue;
                }
                
                const item = items.find(i => i.barcode === row.itemBarcode);
                if (!item) {
                     errorCount++;
                     errors.push(`Ligne ${index + 1} (Pièce ${row.ticketNumber}): Article avec code-barres ${row.itemBarcode} introuvable.`);
                     continue;
                }

                let sale = salesMap.get(row.ticketNumber);
                if (!sale) {
                    const customer = customers.find(c => c.id === row.customerCode || c.name === row.customerName);
                    const seller = users.find(u => u.firstName + ' ' + u.lastName === row.sellerName);
                    sale = {
                        id: uuidv4(),
                        ticketNumber: row.ticketNumber,
                        date: row.date ? new Date(row.date) : new Date(),
                        items: [],
                        subtotal: 0,
                        tax: 0,
                        total: 0,
                        payments: [],
                        status: 'paid',
                        customerId: customer?.id,
                        userId: seller?.id,
                        userName: row.sellerName,
                        documentType: row.pieceName === 'Facture' ? 'invoice' : 'ticket',
                    };
                }

                const unitPriceTTC = row.totalTTC / row.quantity;

                const orderItem: OrderItem = {
                    id: uuidv4(),
                    itemId: item.id,
                    name: item.name,
                    price: unitPriceTTC || 0,
                    quantity: row.quantity,
                    total: row.totalTTC || 0,
                    vatId: item.vatId,
                    barcode: item.barcode,
                    discount: (row.unitPriceHT * row.quantity) * (row.discountPercentage / 100) || row.discountAmount || 0,
                    discountPercent: row.discountPercentage
                };
                sale.items.push(orderItem);
                salesMap.set(row.ticketNumber, sale);
            }
            
            for (const sale of salesMap.values()) {
                const total = sale.items.reduce((acc, item) => acc + item.total, 0);
                let totalTax = 0;
                let totalSub = 0;

                sale.items.forEach(item => {
                    const vatRateValue = vatRates.find(v => v.id === item.vatId)?.rate || 0;
                    const sub = item.total / (1 + vatRateValue / 100);
                    totalSub += sub;
                    totalTax += item.total - sub;
                });

                sale.total = total;
                sale.tax = totalTax;
                sale.subtotal = totalSub;

                setSales(prev => [sale, ...prev]);
                successCount++;
            }
            break;
    }

    toast({
        title: "Rapport d'importation",
        description: `${successCount} ${dataType} importés, ${errorCount} erreurs.`,
    });
    
    return { successCount, errorCount, errors };
  }, [addCustomer, addItem, addSupplier, customers, items, suppliers, sales, setSales, vatRates, toast, users]);
  
  const cycleCommercialViewLevel = useCallback(() => {
    setCommercialViewLevel(prev => (prev + 1) % 3);
  }, [setCommercialViewLevel]);
  

  const value: PosContextType = {
    order, setOrder, systemDate, dynamicBgImage, readOnlyOrder, setReadOnlyOrder,
    addToOrder, addSerializedItemToOrder, removeFromOrder, updateQuantity, updateItemQuantityInOrder, updateQuantityFromKeypad, updateItemNote, updateOrderItem, applyDiscount,
    clearOrder, resetCommercialPage, orderTotal, orderTax, isKeypadOpen, setIsKeypadOpen, currentSaleId, setCurrentSaleId, currentSaleContext, setCurrentSaleContext, serialNumberItem, setSerialNumberItem,
    variantItem, setVariantItem, lastDirectSale, lastRestaurantSale, loadTicketForViewing, loadSaleForEditing, loadSaleForConversion, convertToInvoice, users, addUser, updateUser, deleteUser,
    sendPasswordResetEmailForUser, findUserByEmail, handleSignOut, forceSignOut, forceSignOutUser, sessionInvalidated, setSessionInvalidated,
    items, addItem, updateItem, deleteItem, toggleItemFavorite, toggleFavoriteForList, popularItems, categories, addCategory, updateCategory, deleteCategory, toggleCategoryFavorite,
    getCategoryColor, customers, addCustomer, updateCustomer, deleteCustomer, setDefaultCustomer, suppliers, addSupplier, updateSupplier, deleteSupplier,
    tables, addTable, updateTable, deleteTable, forceFreeTable, selectedTable, setSelectedTable, setSelectedTableById, updateTableOrder, saveTableOrderAndExit,
    promoteTableToTicket, sales, recordSale, recordCommercialDocument, deleteAllSales, paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    vatRates, addVatRate, updateVatRate, deleteVatRate, heldOrders, holdOrder, recallOrder, deleteHeldOrder, auditLogs,
    isNavConfirmOpen, showNavConfirm, closeNavConfirm, confirmNavigation,
    seedInitialData, resetAllData, exportConfiguration, importConfiguration, importDataFromJson, importDemoData, importDemoCustomers, importDemoSuppliers,
    cameFromRestaurant, setCameFromRestaurant, isLoading, user, toast, 
    isCalculatorOpen, setIsCalculatorOpen, enableDynamicBg, setEnableDynamicBg, dynamicBgOpacity, setDynamicBgOpacity,
    showTicketImages, setShowTicketImages, showItemImagesInGrid, setShowItemImagesInGrid, descriptionDisplay, setDescriptionDisplay, popularItemsCount, setPopularItemsCount,
    itemCardOpacity, setItemCardOpacity, paymentMethodImageOpacity, setPaymentMethodImageOpacity, itemDisplayMode, setItemDisplayMode, itemCardShowImageAsBackground,
    setItemCardShowImageAsBackground, itemCardImageOverlayOpacity, setItemCardImageOverlayOpacity, itemCardTextColor, setItemCardTextColor, itemCardShowPrice,
      updateItemPrice,
    setItemCardShowPrice, externalLinkModalEnabled, setExternalLinkModalEnabled, externalLinkUrl, setExternalLinkUrl, externalLinkTitle, setExternalLinkTitle,
    externalLinkModalWidth, setExternalLinkModalWidth, externalLinkModalHeight, setExternalLinkModalHeight, showDashboardStats, setShowDashboardStats,
    enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter, showNotifications, setShowNotifications, notificationDuration, setNotificationDuration,
    enableSerialNumber, setEnableSerialNumber, defaultSalesMode, setDefaultSalesMode, isForcedMode, setIsForcedMode, requirePinForAdmin, setRequirePinForAdmin, directSaleBackgroundColor, setDirectSaleBackgroundColor,
    restaurantModeBackgroundColor, setRestaurantModeBackgroundColor, directSaleBgOpacity, setDirectSaleBgOpacity, restaurantModeBgOpacity, setRestaurantModeBgOpacity,
    dashboardBgType, setDashboardBgType, dashboardBackgroundColor, setDashboardBackgroundColor, dashboardBackgroundImage, setDashboardBackgroundImage, dashboardBgOpacity,
    setDashboardBgOpacity, dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor, dashboardButtonOpacity, setDashboardButtonOpacity,
    dashboardButtonShowBorder, setDashboardButtonShowBorder, dashboardButtonBorderColor, setDashboardButtonBorderColor, 
    invoiceBgColor, setInvoiceBgColor, invoiceBgOpacity, setInvoiceBgOpacity,
    quoteBgColor, setQuoteBgColor, quoteBgOpacity, setQuoteBgOpacity,
    deliveryNoteBgColor, setDeliveryNoteBgColor, deliveryNoteBgOpacity, setDeliveryNoteBgOpacity,
    supplierOrderBgColor, setSupplierOrderBgColor, supplierOrderBgOpacity, setSupplierOrderBgOpacity,
    creditNoteBgColor, setCreditNoteBgColor, creditNoteBgOpacity, setCreditNoteBgOpacity,
    commercialViewLevel, cycleCommercialViewLevel, companyInfo, setCompanyInfo,
    smtpConfig, setSmtpConfig, ftpConfig, setFtpConfig, twilioConfig, setTwilioConfig, sendEmailOnSale, setSendEmailOnSale,
    lastSelectedSaleId, setLastSelectedSaleId, itemsPerPage, setItemsPerPage, importLimit, setImportLimit,
    mappingTemplates, addMappingTemplate, deleteMappingTemplate, selectivelyResetData, removeDuplicateItems,
  };

  return (
    <PosContext.Provider value={value}>
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
