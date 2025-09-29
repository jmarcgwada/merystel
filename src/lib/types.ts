

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
  barcode?: string;
  marginCoefficient?: number;
  requiresSerialNumber?: boolean;
  additionalCosts?: number;
  hasVariants?: boolean;
  variantOptions?: VariantOption[];
}

export interface OrderItem extends Item {
  quantity: number;
  total: number;
  discount: number;
  discountPercent?: number;
  serialNumbers?: string[];
  selectedVariants?: SelectedVariant[];
  note?: string;
  sourceSale?: Sale;
}

export interface Table {
  id:string;
  name: string;
  number: number;
  description?: string;
  status: 'available' | 'occupied' | 'paying';
  order: OrderItem[];
  covers?: number;
  lockedBy?: string;
  verrou?: boolean;
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
}

export interface Sale {
  id: string;
  ticketNumber: string;
  date: Date;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payments: Payment[];
  change?: number;
  customerId?: string;
  tableId?: string;
  tableName?: string;
  status?: 'paid' | 'pending';
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
}

    