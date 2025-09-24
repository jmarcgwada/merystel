

export interface Category {
  id: string;
  name: string;
  color?: string;
  image?: string;
  isFavorite?: boolean;
}

export interface VatRate {
  id: string;
  name: string;
  rate: number;
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
}

export interface Table {
  id:string;
  name: string;
  status: 'available' | 'occupied' | 'paying';
  order: OrderItem[];
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
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
}

export interface HeldOrder {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
}
