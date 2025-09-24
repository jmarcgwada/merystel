
import type { Category, Item, Table, Customer } from './types';

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Plats principaux', image: 'https://picsum.photos/seed/101/100/100' },
  { id: 'cat2', name: 'Entrées', image: 'https://picsum.photos/seed/102/100/100' },
  { id: 'cat3', name: 'Desserts', image: 'https://picsum.photos/seed/103/100/100' },
  { id: 'cat4', name: 'Boissons chaudes', image: 'https://picsum.photos/seed/104/100/100' },
  { id: 'cat5', name: 'Boissons froides', image: 'https://picsum.photos/seed/105/100/100' },
];

export const mockItems: Item[] = [
  // Plats principaux
  { id: 'item1', name: 'Steak Frites', price: 28.5, categoryId: 'cat1', image: 'https://picsum.photos/seed/201/150/150' },
  { id: 'item2', name: 'Poulet rôti', price: 24.0, categoryId: 'cat1', image: 'https://picsum.photos/seed/202/150/150' },
  { id: 'item3', name: 'Filet de saumon', price: 26.0, categoryId: 'cat1', image: 'https://picsum.photos/seed/203/150/150' },
  { id: 'item4', name: 'Pâtes Carbonara', price: 19.5, categoryId: 'cat1', image: 'https://picsum.photos/seed/204/150/150' },
  
  // Entrées
  { id: 'item5', name: 'Soupe à l\'oignon', price: 9.0, categoryId: 'cat2', image: 'https://picsum.photos/seed/205/150/150' },
  { id: 'item6', name: 'Calamars frits', price: 12.5, categoryId: 'cat2', image: 'https://picsum.photos/seed/206/150/150' },
  { id: 'item7', name: 'Bruschetta', price: 8.0, categoryId: 'cat2', image: 'https://picsum.photos/seed/207/150/150' },

  // Desserts
  { id: 'item8', name: 'Mi-cuit au chocolat', price: 10.0, categoryId: 'cat3', image: 'https://picsum.photos/seed/208/150/150' },
  { id: 'item9', name: 'Crème Brûlée', price: 9.5, categoryId: 'cat3', image: 'https://picsum.photos/seed/209/150/150' },

  // Boissons chaudes
  { id: 'item10', name: 'Espresso', price: 3.5, categoryId: 'cat4', image: 'https://picsum.photos/seed/210/150/150' },
  { id: 'item11', name: 'Latte', price: 5.0, categoryId: 'cat4', image: 'https://picsum.photos/seed/211/150/150' },
  { id: 'item12', name: 'Tisane', price: 4.0, categoryId: 'cat4', image: 'https://picsum.photos/seed/212/150/150' },

  // Boissons froides
  { id: 'item13', name: 'Thé glacé', price: 4.0, categoryId: 'cat5', image: 'https://picsum.photos/seed/213/150/150' },
  { id: 'item14', name: 'Eau pétillante', price: 3.0, categoryId: 'cat5', image: 'https://picsum.photos/seed/214/150/150' },
  { id: 'item15', name: 'Jus d\'orange', price: 5.5, categoryId: 'cat5', image: 'https://picsum.photos/seed/215/150/150' },
  { id: 'item16', name: 'Cola', price: 3.5, categoryId: 'cat5', image: 'https://picsum.photos/seed/216/150/150' },
];

export const mockTables: Table[] = [
  { id: 't1', name: 'Table 1', status: 'available', order: [] },
  { id: 't2', name: 'Table 2', status: 'occupied', order: [{...mockItems[0], quantity: 2, total: 57.0}, {...mockItems[13], quantity: 2, total: 8.0}] },
  { id: 't3', name: 'Table 3', status: 'available', order: [] },
  { id: 't4', name: 'Table 4', status: 'paying', order: [{...mockItems[3], quantity: 1, total: 19.5}] },
  { id: 't5', name: 'Table 5', status: 'available', order: [] },
  { id: 't6', name: 'Table 6', status: 'available', order: [] },
  { id: 't7', name: 'Table 7', status: 'occupied', order: [{...mockItems[10], quantity: 1, total: 3.5}] },
  { id: 't8', name: 'Table 8', status: 'available', order: [] },
  { id: 't9', name: 'À emporter', status: 'available', order: [] },
];

export const mockCustomers: Customer[] = [
  { id: 'cust1', name: 'Alice Martin', email: 'alice.m@email.com', phone: '0612345678' },
  { id: 'cust2', name: 'Bob Dubois', email: 'bob.d@email.com', phone: '0687654321' },
];
