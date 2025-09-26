

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
  name: string;
  rate: number;
  code: number;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  vatId: string;
  image?: string;
  isFavorite?: boolean;
  description?: string;
  showImage?: boolean;
}

export interface OrderItem extends Item {
  quantity: number;
  total: number;
  discount: number;
  discountPercent?: number;
}

export interface Table {
  id:string;
  name: string;
  number: number;
  description?: string;
  status: 'available' | 'occupied' | 'paying';
  order: OrderItem[];
  covers?: number;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: 'card' | 'cash' | 'check' | 'other';
  type: 'direct' | 'indirect';
  value?: number;
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
  customerId?: string;
  tableId?: string;
  tableName?: string;
  status?: 'paid' | 'pending';
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
}
