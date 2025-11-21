
'use client';
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
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
  Payment,
  SupportTicket,
  RepairActionPreset,
  EquipmentType,
  FormSubmission,
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
  | 'dunningLogs'
  | 'supportTickets'
  | 'repairActionPresets'
  | 'equipmentTypes'
  | 'formSubmissions';

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
  recentlyAddedItemId: string | null;
  setRecentlyAddedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  readOnlyOrder: OrderItem[] | null;
  setReadOnlyOrder: React.Dispatch<React.SetStateAction<OrderItem[] | null>>;
  addToOrder: (itemId: string, selectedVariants?: SelectedVariant[]) => void;
  addFormItemToOrder: (item: Item | OrderItem, formData: Record<string, any>) => void;
  addSerializedItemToOrder: (item: Item | OrderItem, quantity: number, serialNumbers: string[]) => void;
  updateOrderItemFormData: (orderItemId: string, formData: Record<string, any>, isTemporary: boolean) => void;
  removeFromOrder: (itemId: OrderItem['id']) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemQuantityInOrder: (itemId: string, quantity: number) => void;
  updateQuantityFromKeypad: (itemId: OrderItem['id'], quantity: number) => void;
  updateItemNote: (itemId: OrderItem['id'], note: string) => void;
  updateItemPrice: (itemId: string, newPriceTTC: number) => void;
  updateOrderItem: (item: Item) => void;
  updateOrderItemField: <K extends keyof OrderItem>(orderItemId: string, field: K, value: OrderItem[K]) => void,
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
  customVariantRequest: { item: Item, optionName: string, currentSelections: SelectedVariant[] } | null;
  setCustomVariantRequest: React.Dispatch<React.SetStateAction<{ item: Item, optionName: string, currentSelections: SelectedVariant[] } | null>>;
  formItemRequest: { item: Item | OrderItem, isEditing: boolean } | null;
  setFormItemRequest: React.Dispatch<React.SetStateAction<{ item: Item | OrderItem, isEditing: boolean } | null>>;
  formSubmissions: FormSubmission[];
  tempFormSubmissions: Record<string, FormSubmission>;
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
  ) => Promise<Sale | null>,
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
  supportTickets: SupportTicket[];
  addSupportTicket: (ticket: Omit<SupportTicket, 'id'|'ticketNumber'|'createdAt'|'status'>) => Promise<SupportTicket | null>;
  updateSupportTicket: (ticket: SupportTicket) => Promise<void>;
  deleteSupportTicket: (ticketId: string) => Promise<void>;
  repairActionPresets: RepairActionPreset[];
  addRepairActionPreset: (preset: Omit<RepairActionPreset, 'id'|'createdAt'|'updatedAt'>) => Promise<RepairActionPreset | null>;
  updateRepairActionPreset: (preset: RepairActionPreset) => Promise<void>;
  deleteRepairActionPreset: (presetId: string) => Promise<void>;
  equipmentTypes: EquipmentType[];
  addEquipmentType: (equipmentType: Omit<EquipmentType, 'id'|'createdAt'|'updatedAt'>) => Promise<EquipmentType | null>;
  updateEquipmentType: (equipmentType: EquipmentType) => Promise<void>;
  deleteEquipmentType: (equipmentTypeId: string) => Promise<void>;
  isNavConfirmOpen: boolean;
  showNavConfirm: (url: string) => void;
  closeNavConfirm: () => void;
  confirmNavigation: () => void;
  seedInitialData: () => void;
  resetAllData: () => Promise<void>;
  selectivelyResetData: (dataToReset: Record<DeletableDataKeys, boolean>) => Promise<void>;
  exportConfiguration: () => string;
  importConfiguration: (file: File) => Promise<void>;
  exportFullData: () => string;
  importFullData: (file: File) => Promise<void>;
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
  isFullscreen: boolean;
  toggleFullscreen: () => void;
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
  autoInvoiceOnSupportTicket: boolean;
  setAutoInvoiceOnSupportTicket: React.Dispatch<React.SetStateAction<boolean>>;
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
  isCommercialNavVisible: boolean;
  setIsCommercialNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
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

// This context remains unchanged.
const PosContext = createContext<PosContextType | undefined>(undefined);

// This custom hook remains unchanged.
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

export function PosProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast: shadcnToast } = useShadcnToast();
  const pageTypeToResetRef = useRef<string | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);

  // All state declarations using usePersistentState remain the same.
  const [dunningLogs, setDunningLogs, rehydrateDunningLogs] = usePersistentState<DunningLog[]>('data.dunningLogs', []);
  const [cheques, setCheques, rehydrateCheques] = usePersistentState<Cheque[]>('data.cheques', []);
  const [paiementsPartiels, setPaiementsPartiels, rehydratePaiementsPartiels] = usePersistentState<PaiementPartiel[]>('data.paiementsPartiels', []);
  const [remises, setRemises, rehydrateRemises] = usePersistentState<RemiseCheque[]>('data.remises', []);
  const [supportTickets, setSupportTickets, rehydrateSupportTickets] = usePersistentState<SupportTicket[]>('data.supportTickets', []);
  const [repairActionPresets, setRepairActionPresets, rehydrateRepairActionPresets] = usePersistentState<RepairActionPreset[]>('data.repairActionPresets', []);
  const [equipmentTypes, setEquipmentTypes, rehydrateEquipmentTypes] = usePersistentState<EquipmentType[]>('data.equipmentTypes', []);
  const [formSubmissions, setFormSubmissions, rehydrateFormSubmissions] = usePersistentState<FormSubmission[]>('data.formSubmissions', []);
  const [tempFormSubmissions, setTempFormSubmissions, rehydrateTempFormSubmissions] = usePersistentState<Record<string, FormSubmission>>('data.tempFormSubmissions', {});
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
  const [autoInvoiceOnSupportTicket, setAutoInvoiceOnSupportTicket] = usePersistentState('settings.autoInvoiceOnSupportTicket', false);
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
  const [isCommercialNavVisible, setIsCommercialNavVisible] = usePersistentState('settings.isCommercialNavVisible', true);
  const [smtpConfig, setSmtpConfig] = usePersistentState<SmtpConfig>('settings.smtpConfig', {});
  const [ftpConfig, setFtpConfig] = usePersistentState<FtpConfig>('settings.ftpConfig', {});
  const [twilioConfig, setTwilioConfig] = usePersistentState<TwilioConfig>('settings.twilioConfig', {});
  const [sendEmailOnSale, setSendEmailOnSale] = usePersistentState('settings.sendEmailOnSale', false);
  const [lastSelectedSaleId, setLastSelectedSaleId] = usePersistentState<string | null>('state.lastSelectedSaleId', null);
  const [lastReportsUrl, setLastReportsUrl] = usePersistentState<string | null>('state.lastReportsUrl', '/reports');
  const [itemsPerPage, setItemsPerPage] = usePersistentState('settings.itemsPerPage', 15);
  const [importLimit, setImportLimit] = usePersistentState('settings.importLimit', 100);
  const [mappingTemplates, setMappingTemplates, rehydrateMappingTemplates] = usePersistentState<MappingTemplate[]>('settings.mappingTemplates', []);


  const [order, setOrder] = useState<OrderItem[]>([]);
  const [systemDate, setSystemDate] = useState(new Date());
  const [dynamicBgImage, setDynamicBgImage] = useState<string | null>(null);
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(null);
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
  const [customVariantRequest, setCustomVariantRequest] = useState<{ item: Item, optionName: string, currentSelections: SelectedVariant[] } | null>(null);
  const [formItemRequest, setFormItemRequest] = useState<{ item: Item | OrderItem, isEditing: boolean } | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
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
  
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(() => {
        if (typeof document === 'undefined') return;
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

  const toast = useCallback((props: Parameters<typeof useShadcnToast>[0]) => {
    if (showNotifications) {
      return shadcnToast({
        ...props,
        duration: props?.duration || notificationDuration,
      });
    }
    return { id: '', dismiss: () => {}, update: () => {} };
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

  const addSupportTicket = useCallback(async (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status'>): Promise<SupportTicket | null> => {
    const ticketNumber = `SAV-${format(new Date(), 'yyyyMMdd')}-${(supportTickets.length + 1).toString().padStart(3, '0')}`;
    const newTicket: SupportTicket = {
        id: uuidv4(),
        ticketNumber,
        createdAt: new Date(),
        status: 'Ouvert',
        ...ticketData,
    };
    
    setSupportTickets(prev => [newTicket, ...prev]);

    toast({ title: 'Prise en charge créée', description: `La fiche #${ticketNumber} a été enregistrée.` });
    return newTicket;
  }, [supportTickets, setSupportTickets, toast]);
  
  const updateSupportTicket = useCallback(async (ticketData: SupportTicket) => {
    setSupportTickets(prev => prev.map(t => t.id === ticketData.id ? { ...ticketData, updatedAt: new Date() } : t));
    toast({ title: 'Prise en charge mise à jour' });
  }, [setSupportTickets, toast]);

  const deleteSupportTicket = useCallback(async (ticketId: string) => {
    setSupportTickets(prev => prev.filter(t => t.id !== ticketId));
    toast({ title: 'Prise en charge supprimée' });
  }, [setSupportTickets, toast]);
  
  const addRepairActionPreset = useCallback(async (preset: Omit<RepairActionPreset, 'id'|'createdAt'|'updatedAt'>) => {
    const newPreset: RepairActionPreset = { id: uuidv4(), ...preset, createdAt: new Date() };
    setRepairActionPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, [setRepairActionPresets]);

  const updateRepairActionPreset = useCallback(async (preset: RepairActionPreset) => {
    setRepairActionPresets(prev => prev.map(p => p.id === preset.id ? { ...preset, updatedAt: new Date() } : p));
  }, [setRepairActionPresets]);
  
  const deleteRepairActionPreset = useCallback(async (presetId: string) => {
    setRepairActionPresets(prev => prev.filter(p => p.id !== presetId));
  }, [setRepairActionPresets]);

  const addEquipmentType = useCallback(async (equipmentType: Omit<EquipmentType, 'id'|'createdAt'|'updatedAt'>) => {
    const newType: EquipmentType = { id: uuidv4(), ...equipmentType, createdAt: new Date() };
    setEquipmentTypes(prev => [...prev, newType]);
    return newType;
  }, [setEquipmentTypes]);

  const updateEquipmentType = useCallback(async (equipmentType: EquipmentType) => {
    setEquipmentTypes(prev => prev.map(et => et.id === equipmentType.id ? { ...equipmentType, updatedAt: new Date() } : et));
  }, [setEquipmentTypes]);

  const deleteEquipmentType = useCallback(async (equipmentTypeId: string) => {
    setEquipmentTypes(prev => prev.filter(et => et.id !== equipmentTypeId));
  }, [setEquipmentTypes]);

  const clearOrder = useCallback(() => {
    setOrder([]);
    setDynamicBgImage(null);
    if (readOnlyOrder) setReadOnlyOrder(null);
    setCurrentSaleId(null);
    setCurrentSaleContext(null);
    setSelectedTable(null);
    setTempFormSubmissions({}); // Clear temporary form data
  }, [readOnlyOrder, setTempFormSubmissions]);
  
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
        { id: 'vat_0', name: 'EXO', rate: 0, code: 1, createdAt: new Date() },
        { id: 'vat_20', name: 'FRANCE', rate: 20, code: 2, createdAt: new Date() },
        { id: 'vat_8.5', name: 'ANTILLES', rate: 8.5, code: 3, createdAt: new Date() },
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
    setSupportTickets([]);
    setRepairActionPresets([]);
    setEquipmentTypes([]);
    setFormSubmissions([]);
    setTempFormSubmissions({});
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
  }, [
    setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales,
    setPaymentMethods, setVatRates, setCompanyInfo, setAuditLogs, setDunningLogs,
    setCheques, setRemises, setPaiementsPartiels, setSupportTickets, setRepairActionPresets, setEquipmentTypes,
    setFormSubmissions, setTempFormSubmissions,
    toast, seedInitialData, importDemoData, importDemoCustomers, importDemoSuppliers, setHeldOrders
  ]);
  
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
    if (dataToReset.supportTickets) setSupportTickets([]);
    if (dataToReset.repairActionPresets) setRepairActionPresets([]);
    if (dataToReset.equipmentTypes) setEquipmentTypes([]);
    if (dataToReset.formSubmissions) setFormSubmissions([]);
    toast({ title: 'Données sélectionnées supprimées !' });
  }, [
    setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales,
    setPaymentMethods, setVatRates, setHeldOrders, setAuditLogs, setCheques,
    setRemises, setPaiementsPartiels, setDunningLogs, setSupportTickets,
    setRepairActionPresets, setEquipmentTypes, setFormSubmissions, toast
  ]);
  
  useEffect(() => {
    if(isHydrated) {
        const isSeeded = localStorage.getItem('data.seeded');
        if (!isSeeded) {
          seedInitialData();
          importDemoData();
          importDemoCustomers();
          importDemoSuppliers();
          localStorage.setItem('data.seeded', 'true');
        }
    }
  }, [isHydrated, seedInitialData, importDemoData, importDemoCustomers, importDemoSuppliers]);


  useEffect(() => {
    const timer = setInterval(() => setSystemDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tables = useMemo(() => [TAKEAWAY_TABLE, ...tablesData.sort((a, b) => (a.number || 0) - (b.number || 0))], [tablesData]);
  
  const deleteAllSales = useCallback(async () => {
    setSales([]);
    setAuditLogs([]);
    setDunningLogs([]);
    setCheques([]);
    setRemises([]);
    setPaiementsPartiels([]);
    setFormSubmissions([]);
    toast({ title: 'Ventes et données liées supprimées' });
  }, [setSales, setAuditLogs, setDunningLogs, setCheques, setRemises, setPaiementsPartiels, setFormSubmissions, toast]);
  
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
        mappingTemplates
    };
    return JSON.stringify(config, null, 2);
  }, [items, categories, customers, suppliers, tablesData, paymentMethods, vatRates, companyInfo, users, mappingTemplates]);

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
            if (config.mappingTemplates) setMappingTemplates(config.mappingTemplates);
            toast({ title: 'Importation réussie!', description: 'La configuration a été restaurée.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur d\'importation' });
        }
    };
    reader.readAsText(file);
  }, [setItems, setCategories, setCustomers, setSuppliers, setTablesData, setPaymentMethods, setVatRates, setCompanyInfo, setUsers, setMappingTemplates, toast]);
  
    const exportFullData = useCallback(() => {
    const allData = {
        items, categories, customers, suppliers, tables: tablesData, sales, heldOrders,
        paymentMethods, vatRates, auditLogs, dunningLogs, cheques, paiementsPartiels, remises,
        supportTickets, repairActionPresets, equipmentTypes, formSubmissions,
        companyInfo, users, mappingTemplates
    };
    return JSON.stringify(allData, null, 2);
  }, [
      items, categories, customers, suppliers, tablesData, sales, heldOrders,
      paymentMethods, vatRates, auditLogs, dunningLogs, cheques, paiementsPartiels,
      remises, supportTickets, repairActionPresets, equipmentTypes, formSubmissions,
      companyInfo, users, mappingTemplates
  ]);

  const importFullData = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            const rehydrators = [
                rehydrateItems, rehydrateCategories, rehydrateCustomers, rehydrateSuppliers,
                rehydrateTables, rehydrateSales, rehydratePaymentMethods, rehydrateVatRates,
                rehydrateHeldOrders, rehydrateAuditLogs, rehydrateDunningLogs, rehydrateCheques,
                rehydratePaiementsPartiels, rehydrateRemises, rehydrateSupportTickets, rehydrateRepairActionPresets,
                rehydrateEquipmentTypes, rehydrateFormSubmissions, rehydrateCompanyInfo, rehydrateUsers,
                rehydrateMappingTemplates
            ];

            if (data.items) setItems(data.items);
            if (data.categories) setCategories(data.categories);
            if (data.customers) setCustomers(data.customers);
            if (data.suppliers) setSuppliers(data.suppliers);
            if (data.tables) setTablesData(data.tables);
            if (data.sales) setSales(data.sales);
            if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
            if (data.vatRates) setVatRates(data.vatRates);
            if (data.heldOrders) setHeldOrders(data.heldOrders);
            if (data.auditLogs) setAuditLogs(data.auditLogs);
            if (data.dunningLogs) setDunningLogs(data.dunningLogs);
            if (data.cheques) setCheques(data.cheques);
            if (data.paiementsPartiels) setPaiementsPartiels(data.paiementsPartiels);
            if (data.remises) setRemises(data.remises);
            if (data.supportTickets) setSupportTickets(data.supportTickets);
            if (data.repairActionPresets) setRepairActionPresets(data.repairActionPresets);
            if (data.equipmentTypes) setEquipmentTypes(data.equipmentTypes);
            if (data.formSubmissions) setFormSubmissions(data.formSubmissions);
            if (data.companyInfo) setCompanyInfo(data.companyInfo);
            if (data.users) setUsers(data.users);
            if (data.mappingTemplates) setMappingTemplates(data.mappingTemplates);
            
            rehydrators.forEach(rehydrate => rehydrate());
            
            toast({ title: 'Importation complète réussie!', description: 'Toutes les données ont été restaurées.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur d\'importation complète' });
        }
    };
    reader.readAsText(file);
  }, [
      setItems, setCategories, setCustomers, setSuppliers, setTablesData, setSales, setPaymentMethods,
      setVatRates, setHeldOrders, setAuditLogs, setDunningLogs, setCheques, setPaiementsPartiels, setRemises,
      setSupportTickets, setRepairActionPresets, setEquipmentTypes, setFormSubmissions,
      setCompanyInfo, setUsers, setMappingTemplates, toast,
      rehydrateItems, rehydrateCategories, rehydrateCustomers, rehydrateSuppliers, rehydrateTables, rehydrateSales,
      rehydratePaymentMethods, rehydrateVatRates, rehydrateHeldOrders, rehydrateAuditLogs, rehydrateDunningLogs,
      rehydrateCheques, rehydratePaiementsPartiels, rehydrateRemises, rehydrateSupportTickets, rehydrateRepairActionPresets,
      rehydrateEquipmentTypes, rehydrateFormSubmissions, rehydrateCompanyInfo, rehydrateUsers,
      rehydrateMappingTemplates
  ]);
  
  const removeFromOrder = useCallback((itemId: OrderItem['id']) => {
    const itemToRemove = order.find(item => item.id === itemId);
    if (itemToRemove && itemToRemove.formSubmissionId && itemToRemove.formSubmissionId.startsWith('temp_')) {
      setTempFormSubmissions(prev => {
        const newTemp = { ...prev };
        delete newTemp[itemToRemove.formSubmissionId!];
        return newTemp;
      });
    }
    setOrder((currentOrder) =>
      currentOrder.filter((item) => item.id !== itemId)
    );
  }, [order, setTempFormSubmissions]);
  
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
    toast({ title: item.name + ' ajouté/mis à jour dans la commande' });
  }, [toast]);
  
  const addFormItemToOrder = useCallback((item: Item | OrderItem, formData: Record<string, any>) => {
    const submissionId = `temp_${uuidv4()}`;
    const newSubmission: FormSubmission = {
      id: submissionId,
      orderItemId: '', // This will be set when the order item is created
      formData,
      createdAt: new Date()
    };
    
    setTempFormSubmissions(prev => ({ ...prev, [submissionId]: newSubmission }));

    const newOrderItem: OrderItem = {
      itemId: 'itemId' in item ? item.itemId : item.id,
      id: uuidv4(),
      name: item.name,
      price: item.price,
      vatId: item.vatId,
      image: item.image,
      quantity: 1,
      total: item.price,
      discount: 0,
      description: item.description,
      description2: item.description2,
      barcode: 'barcode' in item ? (item.barcode || '') : '',
      formSubmissionId: submissionId,
    };
    
    setOrder(prev => [newOrderItem, ...prev]);
    setRecentlyAddedItemId(newOrderItem.id);

    if ('image' in item && item.image) setDynamicBgImage(item.image);
    toast({ title: item.name + ' ajouté à la commande avec son formulaire.' });
  }, [toast, setTempFormSubmissions, setRecentlyAddedItemId]);
  
  const updateOrderItemFormData = useCallback((orderItemId: string, formData: Record<string, any>, isTemporary: boolean) => {
    if (isTemporary) {
      setTempFormSubmissions(prev => {
          if (prev[orderItemId]) {
              return { ...prev, [orderItemId]: { ...prev[orderItemId], formData } };
          }
          return prev;
      });
    } else {
        setFormSubmissions(prev => prev.map(sub => 
            sub.id === orderItemId ? { ...sub, formData } : sub
        ));
    }
    toast({ title: 'Données de formulaire mises à jour.' });
  }, [setFormSubmissions, setTempFormSubmissions, toast]);


  const addToOrder = useCallback(
    (itemId: string, selectedVariants?: SelectedVariant[]) => {
      if (!items) return;
      const itemToAdd = items.find((i) => i.id === itemId);
      if (!itemToAdd) return;
      
      if (itemToAdd.isDisabled) {
          toast({ variant: 'destructive', title: 'Article désactivé', description: "Cet article ne peut pas être vendu." });
          return;
      }
      if (itemToAdd.manageStock && (itemToAdd.stock || 0) <= 0) {
        toast({ variant: 'destructive', title: 'Rupture de stock', description: "L'article \"" + itemToAdd.name + "\" n'est plus en stock." });
        return;
      }
      
      const isSupplierOrder = currentSaleContext?.documentType === 'supplier_order';

      if (isSupplierOrder && (typeof itemToAdd.purchasePrice !== 'number' || itemToAdd.purchasePrice <= 0)) {
        toast({ variant: 'destructive', title: "Prix d'achat manquant ou nul", description: "L'article \"" + itemToAdd.name + "\" n'a pas de prix d'achat valide." });
        return;
    }

      if (itemToAdd.hasForm) {
        setFormItemRequest({ item: itemToAdd, isEditing: false });
        return;
      }
      
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

      const existingItemIndex = order.findIndex(
        (item) => item.itemId === itemId && isEqual(item.selectedVariants, selectedVariants) && !item.serialNumbers?.length && !item.formSubmissionId
      );

      setOrder((currentOrder) => {
        let newOrder = [...currentOrder];
        let newItemId = '';

        if (existingItemIndex > -1) {
          const newQuantity = newOrder[existingItemIndex].quantity + 1;
          newItemId = newOrder[existingItemIndex].id;
          newOrder[existingItemIndex] = {
            ...newOrder[existingItemIndex],
            quantity: newQuantity,
            total:
              newOrder[existingItemIndex].price * newQuantity - (newOrder[existingItemIndex].discount || 0),
          };
           const itemToMove = newOrder.splice(existingItemIndex, 1)[0];
          newOrder = [itemToMove, ...newOrder];
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
          newItemId = newItem.id;
          newOrder = [newItem, ...currentOrder];
        }

        setRecentlyAddedItemId(newItemId);
        return newOrder;
      });
    if(itemToAdd.image) setDynamicBgImage(itemToAdd.image);
    toast({ title: itemToAdd.name + ' ajouté à la commande' });
    },
    [items, order, toast, enableSerialNumber, currentSaleContext, setVariantItem, setSerialNumberItem, setFormItemRequest, pathname]
  );
  
  const updateItemQuantityInOrder = useCallback((itemId: string, quantity: number) => {
      setOrder(currentOrder => currentOrder.map(item => 
          item.id === itemId 
              ? { ...item, quantity: quantity, total: item.price * quantity - (item.discount || 0) } 
              : item
      ));
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

   const updateItemPrice = useCallback((itemId: string, newPriceTTC: number) => {
        setOrder(currentOrder =>
            currentOrder.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        price: newPriceTTC,
                        total: newPriceTTC * item.quantity - (item.discount || 0),
                      }
                    : item
            )
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
              description2: updatedItem.description2 
            }
          : orderItem
      )
    );
  }, []);
  
  const updateOrderItemField = useCallback(<K extends keyof OrderItem>(orderItemId: string, field: K, value: OrderItem[K]) => {
    setOrder(currentOrder => currentOrder.map(item =>
      item.id === orderItemId ? { ...item, [field]: value } : item
    ));
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

    const updateTableOrder = useCallback((tableId: string, orderData: OrderItem[]) => {
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, order: orderData, status: orderData.length > 0 ? 'occupied' : 'available'} : t));
    }, [setTablesData]);

    const saveTableOrderAndExit = useCallback((tableId: string, orderData: OrderItem[]) => {
      updateTableOrder(tableId, orderData);
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
      setTablesData(prev => prev.map(t => t.id === tableId ? {...t, status: 'available', order: [], verrou: false, lockedBy: undefined, occupiedAt: undefined, occupiedByUserId: undefined, closedAt: new Date(), closedByUserId: user?.id } : t));
      toast({ title: 'Table libérée' });
    }, [setTablesData, toast, user]);

    const addTable = useCallback((tableData: Omit<Table, 'id' | 'status' | 'order' | 'number' | 'createdAt' | 'updatedAt'>) => {
      const newTable: Table = {
        ...tableData,
        id: uuidv4(),
        number: (tablesData.length > 0 ? Math.max(...tablesData.map(t => t.number || 0)) : 0) + 1,
        status: 'available' as const,
        order: [],
        createdAt: new Date(),
      };
      setTablesData(prev => [...prev, newTable]);
    }, [tablesData, setTablesData]);

    const updateTable = useCallback((table: Table) => {
      setTablesData(prev => prev.map(t => t.id === table.id ? {...table, updatedAt: new Date()} : t));
    }, [setTablesData]);

    const deleteTable = useCallback((tableId: string) => {
      setTablesData(prev => prev.filter(t => t.id !== tableId));
    }, [setTablesData]);
  
    const recordSale = useCallback(async (saleData: Omit<Sale, 'id' | 'ticketNumber' | 'date'>, saleIdToUpdate?: string): Promise<Sale | null> => {
        let finalSale: Sale;
    
        if (saleIdToUpdate && !saleIdToUpdate.startsWith('table-')) {
            const existingSale = sales.find(s => s.id === saleIdToUpdate);
            if (!existingSale) return null;
            
            finalSale = {
                ...existingSale,
                ...saleData,
                date: existingSale.date, // Preserve original date on update
                modifiedAt: new Date(), 
            };
        } else {
            const today = new Date();
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
                date: saleData.date || new Date(),
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
        } else {
           setSales(prev => [finalSale, ...prev]);
        }
    
        return finalSale;
    }, [sales, user, currentSaleContext, currentSaleId, setTablesData, setHeldOrders, setSales]);

  const contextValue = {
    order, setOrder, systemDate, dynamicBgImage, recentlyAddedItemId, setRecentlyAddedItemId, readOnlyOrder, setReadOnlyOrder,
    addToOrder, addFormItemToOrder, addSerializedItemToOrder, updateOrderItemFormData, removeFromOrder, updateQuantity, updateItemQuantityInOrder, updateQuantityFromKeypad, updateItemNote, updateItemPrice, updateOrderItem, updateOrderItemField, applyDiscount,
    clearOrder, resetCommercialPage, orderTotal, orderTax, isKeypadOpen, setIsKeypadOpen, currentSaleId, setCurrentSaleId, currentSaleContext, setCurrentSaleContext, serialNumberItem, setSerialNumberItem,
    variantItem, setVariantItem, customVariantRequest, setCustomVariantRequest, formItemRequest, setFormItemRequest, formSubmissions, tempFormSubmissions,
    lastDirectSale, lastRestaurantSale, loadTicketForViewing, loadSaleForEditing, loadSaleForConversion, convertToInvoice, users, addUser, updateUser, deleteUser,
    sendPasswordResetEmailForUser, findUserByEmail, handleSignOut, forceSignOut, forceSignOutUser, sessionInvalidated, setSessionInvalidated,
    items, addItem, updateItem, deleteItem, toggleItemFavorite, toggleFavoriteForList, popularItems, categories, addCategory, updateCategory, deleteCategory, toggleCategoryFavorite,
    getCategoryColor, customers, addCustomer, updateCustomer, deleteCustomer, setDefaultCustomer, suppliers, addSupplier, updateSupplier, deleteSupplier,
    tables, addTable, updateTable, deleteTable, forceFreeTable, selectedTable, setSelectedTable, setSelectedTableById, updateTableOrder, saveTableOrderAndExit,
    promoteTableToTicket, sales, recordSale, recordCommercialDocument, deleteAllSales, paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    vatRates, addVatRate, updateVatRate, deleteVatRate, heldOrders, holdOrder, recallOrder, deleteHeldOrder,
    auditLogs, 
    dunningLogs, addDunningLog,
    cheques, addCheque, updateCheque, deleteCheque, 
    paiementsPartiels, addPaiementPartiel, 
    remises, addRemise,
    supportTickets, addSupportTicket, updateSupportTicket, deleteSupportTicket,
    repairActionPresets, addRepairActionPreset, updateRepairActionPreset, deleteRepairActionPreset,
    equipmentTypes, addEquipmentType, updateEquipmentType, deleteEquipmentType,
    isNavConfirmOpen, showNavConfirm, closeNavConfirm, confirmNavigation,
    seedInitialData, resetAllData, selectivelyResetData, exportConfiguration, importConfiguration, exportFullData, importFullData, importDemoData, importDemoCustomers, importDemoSuppliers,
    cameFromRestaurant, setCameFromRestaurant, isLoading, user, toast, 
    isCalculatorOpen, setIsCalculatorOpen, isFullscreen, toggleFullscreen,
    enableDynamicBg, setEnableDynamicBg, dynamicBgOpacity, setDynamicBgOpacity,
    showTicketImages, setShowTicketImages, showItemImagesInGrid, setShowItemImagesInGrid, descriptionDisplay, setDescriptionDisplay, popularItemsCount, setPopularItemsCount,
    itemCardOpacity, setItemCardOpacity, paymentMethodImageOpacity, setPaymentMethodImageOpacity, itemDisplayMode, setItemDisplayMode, itemCardShowImageAsBackground,
    setItemCardShowImageAsBackground, itemCardImageOverlayOpacity, setItemCardImageOverlayOpacity, itemCardTextColor, setItemCardTextColor, itemCardShowPrice,
    setItemCardShowPrice, externalLinkModalEnabled, setExternalLinkModalEnabled, externalLinkUrl, setExternalLinkUrl, externalLinkTitle, setExternalLinkTitle,
    externalLinkModalWidth, setExternalLinkModalWidth, externalLinkModalHeight, setExternalLinkModalHeight,
    showDashboardStats, setShowDashboardStats,
    enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter, showNotifications, setShowNotifications, notificationDuration, setNotificationDuration,
    enableSerialNumber, setEnableSerialNumber, defaultSalesMode, setDefaultSalesMode, isForcedMode, setIsForcedMode, requirePinForAdmin, setRequirePinForAdmin,
    autoInvoiceOnSupportTicket, setAutoInvoiceOnSupportTicket,
    directSaleBackgroundColor, setDirectSaleBackgroundColor,
    restaurantModeBackgroundColor, setRestaurantModeBackgroundColor, directSaleBgOpacity, setDirectSaleBgOpacity, restaurantModeBgOpacity, setRestaurantModeBgOpacity,
    dashboardBgType, setDashboardBgType, dashboardBackgroundColor, setDashboardBackgroundColor, dashboardBackgroundImage, setDashboardBackgroundImage, dashboardBgOpacity,
    setDashboardBgOpacity, dashboardButtonBackgroundColor, setDashboardButtonBackgroundColor, dashboardButtonTextColor, setDashboardButtonTextColor, dashboardButtonOpacity, setDashboardButtonOpacity,
    dashboardButtonShowBorder, setDashboardButtonShowBorder, dashboardButtonBorderColor, setDashboardButtonBorderColor, 
    invoiceBgColor, setInvoiceBgColor, invoiceBgOpacity, setInvoiceBgOpacity,
    quoteBgColor, setQuoteBgColor, quoteBgOpacity, setQuoteBgOpacity,
    deliveryNoteBgColor, setDeliveryNoteBgColor, deliveryNoteBgOpacity, setDeliveryNoteBgOpacity,
    supplierOrderBgColor, setSupplierOrderBgColor, supplierOrderBgOpacity, setSupplierOrderBgOpacity,
    creditNoteBgColor, setCreditNoteBgColor, creditNoteBgOpacity, setCreditNoteBgOpacity,
    isCommercialNavVisible, setIsCommercialNavVisible,
    smtpConfig, setSmtpConfig, ftpConfig, setFtpConfig, twilioConfig, setTwilioConfig, sendEmailOnSale, setSendEmailOnSale,
    lastSelectedSaleId, setLastSelectedSaleId, lastReportsUrl, setLastReportsUrl,
    itemsPerPage, setItemsPerPage, importLimit, setImportLimit, mappingTemplates,
    deleteMappingTemplate,
    generateRandomSales,
    importDataFromJson,
    updateSale,
    generateSingleRecurringInvoice,
    companyInfo,
    setCompanyInfo: setCompanyInfoCallback,
    addMappingTemplate,
  };
  
  return (
    <PosContext.Provider value={contextValue}>
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

    