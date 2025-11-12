
import type { Timestamp } from "firebase/firestore";

export type SpecialCategory = 'all' | 'popular';

export interface Category {
  id: string;
  name: string;
  code?: string;
  color?: string;
  image?: string;
  isFavorite?: boolean;
  isRestaurantOnly?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface VatRate {
  id: string;
  name:string;
  rate: number;
  code: number;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface SelectedVariant {
  name: string;
  value: string;
  isCustom?: boolean; // To flag custom values
}

export interface Item {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  categoryId?: string;
  supplierId?: string;
  vatId: string;
  image?: string;
  isFavorite?: boolean;
  description?: string;
  description2?: string;
  showImage?: boolean;
  barcode: string;
  marginPercentage?: number;
  requiresSerialNumber?: boolean;
  additionalCosts?: number; // As a percentage
  manageStock?: boolean;
  stock?: number;
  lowStockThreshold?: number;
  hasVariants?: boolean;
  variantOptions?: VariantOption[];
  isDisabled?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// OrderItem will no longer extend Item to reduce document size in Firestore
export interface OrderItem {
  id: string; // This can be the original item ID or a unique ID for variants
  itemId: string; // Always refers to the original Item ID
  name: string;
  price: number; // Price at the time of sale (or purchase price for supplier orders)
  quantity: number;
  total: number;
  vatId: string;
  image?: string; // Keep image for receipt/display purposes, but could be optimized further if needed
  discount: number;
  discountPercent?: number;
  serialNumbers?: string[];
  selectedVariants?: SelectedVariant[];
  note?: string;
  sourceSale?: Sale; // Used for viewing old sales, not stored in DB
  description?: string;
  description2?: string;
  barcode: string;
  formSubmissionId?: string;
}

export interface Table {
  id:string;
  name: string;
  number: number;
  description?: string;
  status: 'available' | 'occupied' | 'paying';
  order: OrderItem[];
  covers?: number;
  verrou?: boolean;
  occupiedByUserId?: string;
  occupiedAt?: Date | Timestamp;
  closedByUserId?: string;
  closedAt?: Date | Timestamp;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    phone2?: string;
    isDefault?: boolean;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    iban?: string;
    notes?: string;
    isDisabled?: boolean;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  siret?: string;
  notes?: string;
  website?: string;
  iban?: string;
  bic?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: 'card' | 'cash' | 'check' | 'other';
  type: 'direct' | 'indirect';
  value?: number;
  isActive?: boolean;
  image?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  date: Date | Timestamp;
  chequesCount?: number;
}

export interface VatBreakdown {
  [key: string]: {
    rate: number;
    total: number;
    base: number;
    code: number;
  };
}

export interface Sale {
  id: string;
  ticketNumber: string;
  date: Date | Timestamp;
  modifiedAt?: Date | Timestamp;
  originalTotal?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payments: Payment[];
  originalPayments?: Payment[];
  change?: number;
  vatBreakdown?: VatBreakdown;
  customerId?: string;
  supplierId?: string;
  tableId?: string;
  tableName?: string;
  status: 'paid' | 'pending' | 'quote' | 'delivery_note' | 'invoiced' | 'credit_note';
  documentType?: 'invoice' | 'quote' | 'delivery_note' | 'ticket' | 'supplier_order' | 'credit_note';
  userId?: string;
  userName?: string;
  originalSaleId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDueDate?: Date | Timestamp;
    lastGeneratedDate?: Date | Timestamp;
    isActive?: boolean;
  };
  dunningLevel?: number;
  lastDunningDate?: Date | Timestamp;
}

export interface HeldOrder {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  tableName?: string;
  tableId?: string;
}

export interface SmtpConfig {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    senderEmail?: string;
}

export interface FtpConfig {
    host?: string;
    port?: number;
    secure?: boolean | 'implicit';
    user?: string;
    password?: string;
    path?: string;
}

export interface TwilioConfig {
    accountSid?: string;
    authToken?: string;
    from?: string;
}

export interface CompanyInfo {
  id?: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  region?: string;
  country: string;
  email: string;
  phone?: string;
  website?: string;
  siret?: string;
  legalForm?: string;
  iban?: string;
  bic?: string;
  notes?: string; // For document footer
  internalNotes?: string; // For internal use
  communicationDoc?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: 'admin' | 'manager' | 'cashier';
  companyId: string;
  sessionToken?: string;
  isDisabled?: boolean;
  sessionDuration?: number; // in minutes, 0 for unlimited
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface AuditLog {
    id: string;
    date: Date | Timestamp;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'transform';
    documentType: string;
    documentId: string;
    documentNumber: string;
    details: string;
    richDetails?: Record<string, any>;
}

export interface DunningLog {
    id: string;
    date: Date | Timestamp;
    saleId: string;
    actionType: 'email' | 'phone' | 'whatsapp';
    notes?: string;
    status: 'sent' | 'completed' | 'failed';
}

export interface Cheque {
  id: string;
  numeroCheque: string;
  banque: string;
  montant: number;
  dateEcheance: Date | Timestamp;
  statut: 'enPortefeuille' | 'remisEnBanque' | 'encaisse' | 'impaye' | 'annule';
  factureId: string;
  clientId: string;
  scanUrl?: string;
  notes?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface PaiementPartiel {
  id: string;
  chequeId: string;
  montant: number;
  moyenDePaiement: string;
  datePaiement: Date | Timestamp;
}

export interface RemiseCheque {
  id: string;
  dateRemise: Date | Timestamp;
  chequeIds: string[];
  montantTotal: number;
  createdAt?: Date | Timestamp;
}

export interface MappingTemplate {
  name: string;
  dataType: string;
  mappings: Record<string, number | null>;
  mappingModes: Record<string, 'column' | 'fixed'>;
  fixedValues: Record<string, string>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  createdAt: Date | Timestamp;
  customerId: string;
  customerName: string;
  equipmentType: string;
  equipmentBrand: string;
  equipmentModel: string;
  issueDescription: string;
  notes?: string;
  status: 'Ouvert' | 'En cours' | 'En attente de pièces' | 'Terminé' | 'Facturé' | 'Annulé';
  updatedAt?: Date | Timestamp;
}
