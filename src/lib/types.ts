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

export type PaymentMethod = 'cash' | 'card' | 'other';
