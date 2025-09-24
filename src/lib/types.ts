
export interface Category {
  id: string;
  name: string;
  color?: string;
  image?: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
}

export interface OrderItem extends Item {
  quantity: number;
  total: number;
}

export interface Table {
  id: string;
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

export type PaymentMethod = 'cash' | 'card' | 'other';

export interface Sale {
  id: string;
  date: Date;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
}
