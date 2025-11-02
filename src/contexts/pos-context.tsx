
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
  DunningLog,
  Cheque,
  PaiementPartiel,
  RemiseCheque,
  Payment
} from '@/lib/types';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { format, isSameDay, subDays, parse, isValid, addMonths, addWeeks, addDays } from 'date-fns';
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
  | 'auditLogs'
  | 'cheques'
  | 'remises'
  | 'paiementsPartiels'
  | 'dunningLogs';

export interface ImportReport {
  successCount: number;
  errorCount: number;
  errors: string[];
  newCustomersCount?: number;
  newItemsCount?: number;
  newSalesCount?: number;
}


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
  generateSingleRecurringInvoice: (saleId: string, note?: string) => Promise<void>;

  users: User[];
  addUser: (user: Omit<User, 'id' | 'companyId' | 'createdAt'>, password?: string) => Promise<User | null>;
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
  addCustomer: (customer: Omit<Customer, 'isDefault' | 'createdAt' | 'updatedAt'> & {id?: string}) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  setDefaultCustomer: (customerId: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & {id?: string}) => Promise<Supplier | null>;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  tables: Table[];
  addTable: (
    tableData: Omit<Table, 'id' | 'status' | 'order' | 'number' | 'createdAt' | 'updatedAt'>
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
  updateSale: (sale: Sale) => Promise<void>;
  recordSale: (
    sale: Omit<Sale, 'id' | 'ticketNumber' | 'date'>,
    saleIdToUpdate?: string
  ) => Promise<Sale | null>;
   recordCommercialDocument: (
    doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'>,
    type: 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note' | 'invoice' | 'ticket',
    docIdToUpdate?: string,
  ) => void,
  deleteAllSales: () => Promise<void>;
  generateRandomSales: (count: number) => Promise<void>;
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;
  vatRates: VatRate[];
  addVatRate: (vatRate: Omit<VatRate, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<VatRate | null>;
  updateVatRate: (vatRate: VatRate) => void;
  deleteVatRate: (vatRateId: string) => void;
  heldOrders: HeldOrder[] | null;
  holdOrder: () => void;
  recallOrder: (orderId: string) => void;
  deleteHeldOrder: (orderId: string) => void;
  auditLogs: AuditLog[];
  dunningLogs: DunningLog[];
  addDunningLog: (log: Omit<DunningLog, 'id' | 'date'>) => Promise<void>;
  cheques: Cheque[];
  addCheque: (cheque: Omit<Cheque, 'id'|'createdAt'|'updatedAt'>) => Promise<Cheque | null>;
  updateCheque: (cheque: Cheque) => void;
  deleteCheque: (chequeId: string) => void;
  paiementsPartiels: PaiementPartiel[];
  addPaiementPartiel: (paiement: Omit<PaiementPartiel, 'id'>) => Promise<PaiementPartiel | null>;
  remises: RemiseCheque[];
  addRemise: (remise: Omit<RemiseCheque, 'id'|'createdAt'>) => Promise<RemiseCheque | null>;
  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;
  seedInitialData: () => void;
  resetAllData: () => Promise<void>;
  selectivelyResetData: (dataToReset: Record<DeletableDataKeys, boolean>) => Promise<void>;
  exportConfiguration: () => string;
  importConfiguration: (file: File) => Promise<void>;
  importDataFromJson: (dataType: string, jsonData: any[]) => Promise<ImportReport>;
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
  emailModalWidth: number;
  setEmailModalWidth: React.Dispatch<React.SetStateAction<number>>;
  emailModalHeight: number;
  setEmailModalHeight: React.Dispatch<React.SetStateAction<number>>;
  emailModalPosition: { x: number; y: number };
  setEmailModalPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
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
  dashboardButtonTextColor: string;
  setDashboardButtonTextColor: React.Dispatch<React.SetStateAction<string>>;
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
  lastReportsUrl: string | null;
  setLastReportsUrl: React.Dispatch<React.SetStateAction<string | null>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  importLimit: number;
  setImportLimit: React.Dispatch<React.SetStateAction<number>>;
  mappingTemplates: MappingTemplate[];
  addMappingTemplate: (template: MappingTemplate) => void;
  deleteMappingTemplate: (templateName: string) => void;
  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated) {
            try {
                const storedValue = localStorage.getItem(key);
                if (storedValue !== null) {
                    setState(JSON.parse(storedValue));
                }
            } catch (error) {
                console.error(`Error reading localStorage key “${key}”:`, error);
            }
        }
    }, [isHydrated, key]);

    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(`Error setting localStorage key “${key}”:`, error);
            }
        }
    }, [key, state, isHydrated]);

    return [state, setState];
}

function PosProviderInternal({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast: shadcnToast } = useShadcnToast();
  const pageTypeToResetRef = useRef<string | null>(null);

  // Settings States
  const [dunningLogs, setDunningLogs] = usePersistentState<DunningLog[]>('data.dunningLogs', []);
  const [cheques, setCheques] = usePersistentState<Cheque[]>('data.cheques', []);
  const [paiementsPartiels, setPaiementsPartiels] = usePersistentState<PaiementPartiel[]>('data.paiementsPartiels', []);
  const [remises, setRemises] = usePersistentState<RemiseCheque[]>('data.remises', []);
  const [emailModalWidth, setEmailModalWidth] = usePersistentState('settings.emailModalWidth', 0);
  const [emailModalHeight, setEmailModalHeight] = usePersistentState('settings.emailModalHeight', 0);
  const [emailModalPosition, setEmailModalPosition] = usePersistentState('settings.emailModalPosition', { x: 0, y: 0 });
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
  const [requirePinForAdmin, setRequirePinForAdmin] = usePersistentState('settings.requirePinForAdmin', false);
  const [directSaleBackgroundColor, setDirectSaleBackgroundColor] = usePersistentState('settings.directSaleBgColor', '#ffffff');
  const [restaurantModeBackgroundColor, setRestaurantModeBackgroundColor] = usePersistentState('settings.restaurantModeBgColor', '#eff6ff');
  const [directSaleBgOpacity, setDirectSaleBgOpacity] = usePersistentState('settings.directSaleBgOpacity', 15);
  const [restaurantModeBgOpacity, setRestaurantModeBgOpacity] = usePersistentState('settings.restaurantModeBgOpacity', 15);
  const [dashboardBgType, setDashboardBgType] = usePersistentState<'color' | 'image'>('settings.dashboardBgType', 'color');
  const [dashboardBackgroundColor, setDashboardBackgroundColor] = usePersistentState('settings.dashboardBgColor', '#f8fafc');
  const [dashboardBackgroundImage, setDashboardBackgroundImage] = usePersistentState('settings.dashboardBgImage', '');
  const [dashboardBgOpacity, setDashboardBgOpacity] = usePersistentState('settings.dashboardBgOpacity', 100);
  const [dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor] = usePersistentState('settings.dashboardButtonBgColor', '#ffffff');
  const [dashboardButtonTextColor, setDashboardButtonTextColor] = usePersistentState('settings.dashboardButtonTextColor', '#000000');
  const [dashboardButtonOpacity, setDashboardButtonOpacity] = usePersistentState('settings.dashboardButtonOpacity', 100);
  const [dashboardButtonShowBorder, setDashboardButtonShowBorder] = usePersistentState('settings.dashboardButtonShowBorder', true);
  const [dashboardButtonBorderColor, setDashboardButtonBorderColor] = usePersistentState('settings.dashboardButtonBorderColor', '#e2e8f0');
  const [invoiceBgColor, setInvoiceBgColor] = usePersistentState('settings.invoiceBgColor', '#ffffff');
  const [invoiceBgOpacity, setInvoiceBgOpacity] = usePersistentState('settings.invoiceBgOpacity', 100);
  const [quoteBgColor, setQuoteBgColor] = usePersistentState('settings.quoteBgColor', '#ffffff');
  const [quoteBgOpacity, setQuoteBgOpacity] = usePersistentState('settings.quoteBgOpacity', 100);
  const [deliveryNoteBgColor, setDeliveryNoteBgColor] = usePersistentState('settings.deliveryNoteBgColor', '#ffffff');
  const [deliveryNoteBgOpacity, setDeliveryNoteBgOpacity] = usePersistentState('settings.deliveryNoteBgOpacity', 100);
  const [supplierOrderBgColor, setSupplierOrderBgColor] = usePersistentState('settings.supplierOrderBgColor', '#ffffff');
  const [supplierOrderBgOpacity, setSupplierOrderBgOpacity] = usePersistentState('settings.supplierOrderBgOpacity', 100);
  const [creditNoteBgColor, setCreditNoteBgColor] = usePersistentState('settings.creditNoteBgColor', '#ffffff');
  const [creditNoteBgOpacity, setCreditNoteBgOpacity] = usePersistentState('settings.creditNoteBgOpacity', 100);
  const [commercialViewLevel, setCommercialViewLevel] = usePersistentState('settings.commercialViewLevel', 0);
  const [smtpConfig, setSmtpConfig] = usePersistentState<SmtpConfig>('settings.smtpConfig', {});
  const [ftpConfig, setFtpConfig] = usePersistentState<FtpConfig>('settings.ftpConfig', {});
  const [twilioConfig, setTwilioConfig] = usePersistentState<TwilioConfig>('settings.twilioConfig', {});
  const [sendEmailOnSale, setSendEmailOnSale] = usePersistentState('settings.sendEmailOnSale', false);
  const [lastSelectedSaleId, setLastSelectedSaleId] = usePersistentState<string | null>('state.lastSelectedSaleId', null);
  const [lastReportsUrl, setLastReportsUrl] = usePersistentState<string | null>('state.lastReportsUrl', '/reports');
  const [itemsPerPage, setItemsPerPage] = usePersistentState('settings.itemsPerPage', 15);
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
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  const [items, setItems] = usePersistentState<Item[]>('data.items', []);
  const [categories, setCategories] = usePersistentState<Category[]>('data.categories', []);
  const [customers, setCustomers] = usePersistentState<Customer[]>('data.customers', []);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('data.suppliers', []);
  const [tablesData, setTablesData] = usePersistentState<Table[]>('data.tables', []);
  const [sales, setSales] = usePersistentState<Sale[]>('data.sales', []);
  const [paymentMethods, setPaymentMethods] = usePersistentState<PaymentMethod[]>('data.paymentMethods', []);
  const [vatRates, setVatRates] = usePersistentState<VatRate[]>('data.vatRates', []);
  const [heldOrders, setHeldOrders] = usePersistentState<HeldOrder[]>('data.heldOrders', []);
  const [auditLogs, setAuditLogs] = usePersistentState<AuditLog[]>('data.auditLogs', []);
  const [companyInfo, setCompanyInfo] = usePersistentState<CompanyInfo | null>('data.companyInfo', null);
  const [users, setUsers] = usePersistentState<User[]>('data.users', []);

  const isLoading = userLoading;
  
  const toast = useCallback((props: Parameters<typeof useShadcnToast>[0]) => {
    if (showNotifications) {
      shadcnToast({
        ...props,
        duration: props?.duration || notificationDuration,
      });
    }
  }, [showNotifications, notificationDuration, shadcnToast]);
  
  const addDunningLog = useCallback(async (logData: Omit<DunningLog, 'id' | 'date'>) => {
    const newLog: DunningLog = {
      id: uuidv4(),
      date: new Date(),
      ...logData
    };
    setDunningLogs(prev => [newLog, ...prev]);
  }, [setDunningLogs]);
  
  const addAuditLog = useCallback((logData: Omit<AuditLog, 'id' | 'date'>) => {
    const newLog: AuditLog = {
      id: uuidv4(),
      date: new Date(),
      ...logData
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [setAuditLogs]);

  const addCheque = useCallback(async (cheque: Omit<Cheque, 'id'|'createdAt'|'updatedAt'>): Promise<Cheque | null> => {
    const newCheque = { ...cheque, id: uuidv4(), createdAt: new Date() };
    setCheques(prev => [...prev, newCheque]);
    return newCheque;
  }, [setCheques]);

  const updateCheque = useCallback((cheque: Cheque) => {
    setCheques(prev => prev.map(c => c.id === cheque.id ? { ...cheque, updatedAt: new Date() } : c));
  }, [setCheques]);

  const deleteCheque = useCallback((chequeId: string) => {
    setCheques(prev => prev.filter(c => c.id !== chequeId));
  }, [setCheques]);

  const addPaiementPartiel = useCallback(async (paiement: Omit<PaiementPartiel, 'id'>): Promise<PaiementPartiel | null> => {
    const newPaiement = { ...paiement, id: uuidv4() };
    setPaiementsPartiels(prev => [...prev, newPaiement]);

    const cheque = cheques.find(c => c.id === paiement.chequeId);
    if (!cheque) return newPaiement;

    const sale = sales.find(s => s.id === cheque.factureId);
    const paymentMethod = paymentMethods.find(pm => pm.name === paiement.moyenDePaiement);
    
    if (sale && paymentMethod) {
        const salePayment: Payment = {
            method: paymentMethod,
            amount: paiement.montant,
            date: newPaiement.datePaiement,
        };
        const updatedSale: Sale = { ...sale, payments: [...(sale.payments || []), salePayment], modifiedAt: new Date() };
        
        const totalPaid = updatedSale.payments.reduce((acc, p) => acc + p.amount, 0);
        if (totalPaid >= sale.total - 0.01) {
            updatedSale.status = 'paid';
        }
        setSales(prevSales => prevSales.map(s => s.id === updatedSale.id ? updatedSale : s));

        const allPaiementsForCheque = [...paiementsPartiels, newPaiement];
        const totalSettlements = allPaiementsForCheque.filter(p => p.chequeId === cheque.id).reduce((sum, p) => sum + p.montant, 0);
        
        if (totalSettlements >= cheque.montant - 0.01) {
            if (isSameDay(new Date(sale.date as any), new Date(newPaiement.datePaiement))) {
                const checkPaymentIndex = updatedSale.payments.findIndex(p => p.method.name.toLowerCase() === 'chèque' && Math.abs(p.amount - cheque.montant) < 0.01);
                if (checkPaymentIndex > -1) {
                    updatedSale.payments.splice(checkPaymentIndex, 1);
                    setSales(prevSales => prevSales.map(s => s.id === updatedSale.id ? updatedSale : s));
                    updateCheque({ ...cheque, statut: 'annule' });
                } else {
                    updateCheque({ ...cheque, statut: 'encaisse' });
                }
            } else {
                 updateCheque({ ...cheque, statut: 'encaisse' });
            }
        }
    }
    return newPaiement;
}, [cheques, sales, paymentMethods, paiementsPartiels, setPaiementsPartiels, setSales, updateCheque]);

  const addRemise = useCallback(async (remise: Omit<RemiseCheque, 'id' | 'createdAt'>): Promise<RemiseCheque | null> => {
    const newRemise = { ...remise, id: uuidv4(), createdAt: new Date() };
    setRemises(prev => [...prev, newRemise]);
    return newRemise;
  }, [setRemises]);

  const clearOrder = useCallback(() => {
    setOrder([]);
    setDynamicBgImage(null);
    if (readOnlyOrder) setReadOnlyOrder(null);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
  }, [readOnlyOrder]);
  
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

  const showNavConfirm = (url: string) => {
    setNextUrl(url);
    setNavConfirmOpen(true);
  };
  
  const prevPathnameRef = useRef(pathname);

    useEffect(() => {
        const prevPath = prevPathnameRef.current;
        const salesModes = ['/pos', '/supermarket', '/restaurant'];
        const commercialModes = ['/commercial'];

        const isLeavingSales = salesModes.some(p => prevPath.startsWith(p)) && !salesModes.some(p => pathname.startsWith(p));
        const isLeavingCommercial = commercialModes.some(p => prevPath.startsWith(p)) && !commercialModes.some(p => pathname.startsWith(p));

        if ((isLeavingSales || isLeavingCommercial) && !currentSaleContext?.fromConversion) {
            clearOrder();
        }

        prevPathnameRef.current = pathname;
    }, [pathname, clearOrder, currentSaleContext?.fromConversion]);

  const resetCommercialPage = useCallback((pageType: 'invoice' | 'quote' | 'delivery_note' | 'supplier_order' | 'credit_note') => {
    clearOrder();
    setCurrentSaleId(null);
    setCurrentSaleContext({ documentType: pageType });
    pageTypeToResetRef.current = pageType;
  }, [clearOrder]);

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
    
    setCategories(prev => [...prev, ...newCategories]);
    setItems(prev => [...prev, ...newItems]);
    toast({ title: 'Données de démo importées !' });
  }, [vatRates, toast, setCategories, setItems]);

  const importDemoCustomers = useCallback(async () => {
    const demoCustomers: Customer[] = Array.from({ length: 10 }).map((_, i) => ({
        id: uuidv4(),
        name: `Client Démo ${i + 1}`,
        email: `client${i+1}@demo.com`,
        createdAt: new Date(),
    }));
    setCustomers(prev => [...prev, ...demoCustomers]);
    toast({ title: 'Clients de démo importés !' });
  }, [setCustomers, toast]);
    
  const importDemoSuppliers = useCallback(async () => {
    const demoSuppliers: Supplier[] = Array.from({ length: 5 }).map((_, i) => ({
        id: uuidv4(),
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
    setAuditLogs([]);
    setDunningLogs([]);
    setCheques([]);
    setRemises([]);
    setPaiementsPartiels([]);
    setCompanyInfo(null);
    localStorage.removeItem('data.seeded');
    toast({ title: 'Application réinitialisée', description: 'Toutes les données ont été effacées.' });
    setTimeout(() => {
      seedInitialData();
      importDemoData();
      importDemoCustomers();
      importDemoSuppliers();
      localStorage.setItem('data.seeded', 'true');
    }, 100);
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales, setPaymentMethods, setVatRates, setCompanyInfo, setAuditLogs, setDunningLogs, setCheques, setRemises, setPaiementsPartiels, toast, seedInitialData, importDemoData, importDemoCustomers, importDemoSuppliers, setHeldOrders]);
  
  const selectivelyResetData = useCallback(async (dataToReset: Record<DeletableDataKeys, boolean>) => {
    toast({ title: 'Suppression en cours...' });
    if (dataToReset.items) setItems([]);
    if (dataToReset.categories) setCategories([]);
    if (dataToReset.customers) setCustomers([]);
    if (dataToReset.suppliers) setSuppliers([]);
    if (dataToReset.tables) setTablesData([]);
    if (dataToReset.sales) setSales([]);
    if (dataToReset.paymentMethods) setPaymentMethods([]);
    if (dataToReset.vatRates) setVatRates([]);
    if (dataToReset.heldOrders) setHeldOrders([]);
    if (dataToReset.auditLogs) setAuditLogs([]);
    if (dataToReset.cheques) setCheques([]);
    if (dataToReset.remises) setRemises([]);
    if (dataToReset.paiementsPartiels) setPaiementsPartiels([]);
    if (dataToReset.dunningLogs) setDunningLogs([]);
    toast({ title: 'Données sélectionnées supprimées !' });
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales, setPaymentMethods, setVatRates, setHeldOrders, setAuditLogs, setCheques, setRemises, setPaiementsPartiels, setDunningLogs, toast]);
  
  useEffect(() => {
    if(!isLoading) {
        const isSeeded = localStorage.getItem('data.seeded');
        if (!isSeeded) {
          seedInitialData();
          importDemoData();
          importDemoCustomers();
          importDemoSuppliers();
          localStorage.setItem('data.seeded', 'true');
        }
    }
  }, [isLoading, seedInitialData, importDemoData, importDemoCustomers, importDemoSuppliers]);


  const memoizedValue = useMemo(() => ({
    //... all your other state and functions
  }), [/*... all your dependencies ...*/]);

  return (
    <PosContext.Provider value={memoizedValue}>
      {children}
    </PosContext.Provider>
  );
}

export function PosProvider({ children }: { children: React.ReactNode }) {
    return (
        <PosProviderInternal>
          {children}
        </PosProviderInternal>
    );
}


export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
