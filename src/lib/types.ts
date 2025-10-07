
import type { Timestamp } from "firebase/firestore";

export type SpecialCategory = 'all' | 'popular';

export interface Category {
  id: string;
  name: string;
  color?: string;
  image?: string;
  isFavorite?: boolean;
  isRestaurantOnly?: boolean;
}

export interface VatRate {
  id: string;
  name:string;
  rate: number;
  code: number;
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface SelectedVariant {
  name: string;
  value: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  categoryId: string;
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
}

// OrderItem will no longer extend Item to reduce document size in Firestore
export interface OrderItem {
  id: string; // This can be the original item ID or a unique ID for variants
  itemId: string; // Always refers to the original Item ID
  name: string;
  price: number; // Price at the time of sale
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
  occupiedAt?: Date;
  closedByUserId?: string;
  closedAt?: Date;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    isDefault?: boolean;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    iban?: string;
    notes?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: 'card' | 'cash' | 'check' | 'other';
  type: 'direct' | 'indirect';
  value?: number;
  isActive?: boolean;
  image?: string;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  date: Date | Timestamp;
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
  customerId?: string;
  tableId?: string;
  tableName?: string;
  status: 'paid' | 'pending' | 'quote' | 'delivery_note';
  documentType?: 'invoice' | 'quote' | 'delivery_note' | 'ticket';
  userId?: string;
  userName?: string;
}

export interface HeldOrder {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  tableName?: string;
  tableId?: string;
}

export interface CompanyInfo {
  id: string;
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
  notes?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  companyId: string;
  sessionToken?: string;
  isDisabled?: boolean;
  sessionDuration?: number; // in minutes, 0 for unlimited
}
