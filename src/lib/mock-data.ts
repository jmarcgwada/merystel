import type { Category, Item, Table } from './types';

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Main Courses', image: 'https://picsum.photos/seed/101/100/100' },
  { id: 'cat2', name: 'Appetizers', image: 'https://picsum.photos/seed/102/100/100' },
  { id: 'cat3', name: 'Desserts', image: 'https://picsum.photos/seed/103/100/100' },
  { id: 'cat4', name: 'Hot Drinks', image: 'https://picsum.photos/seed/104/100/100' },
  { id: 'cat5', name: 'Cold Drinks', image: 'https://picsum.photos/seed/105/100/100' },
];

export const mockItems: Item[] = [
  // Main Courses
  { id: 'item1', name: 'Steak Frites', price: 28.5, categoryId: 'cat1', image: 'https://picsum.photos/seed/201/150/150' },
  { id: 'item2', name: 'Roasted Chicken', price: 24.0, categoryId: 'cat1', image: 'https://picsum.photos/seed/202/150/150' },
  { id: 'item3', name: 'Salmon Fillet', price: 26.0, categoryId: 'cat1', image: 'https://picsum.photos/seed/203/150/150' },
  { id: 'item4', name: 'Pasta Carbonara', price: 19.5, categoryId: 'cat1', image: 'https://picsum.photos/seed/204/150/150' },
  
  // Appetizers
  { id: 'item5', name: 'French Onion Soup', price: 9.0, categoryId: 'cat2', image: 'https://picsum.photos/seed/205/150/150' },
  { id: 'item6', name: 'Calamari', price: 12.5, categoryId: 'cat2', image: 'https://picsum.photos/seed/206/150/150' },
  { id: 'item7', name: 'Bruschetta', price: 8.0, categoryId: 'cat2', image: 'https://picsum.photos/seed/207/150/150' },

  // Desserts
  { id: 'item8', name: 'Chocolate Lava Cake', price: 10.0, categoryId: 'cat3', image: 'https://picsum.photos/seed/208/150/150' },
  { id: 'item9', name: 'Crème Brûlée', price: 9.5, categoryId: 'cat3', image: 'https://picsum.photos/seed/209/150/150' },

  // Hot Drinks
  { id: 'item10', name: 'Espresso', price: 3.5, categoryId: 'cat4', image: 'https://picsum.photos/seed/210/150/150' },
  { id: 'item11', name: 'Latte', price: 5.0, categoryId: 'cat4', image: 'https://picsum.photos/seed/211/150/150' },
  { id: 'item12', name: 'Herbal Tea', price: 4.0, categoryId: 'cat4', image: 'https://picsum.photos/seed/212/150/150' },

  // Cold Drinks
  { id: 'item13', name: 'Iced Tea', price: 4.0, categoryId: 'cat5', image: 'https://picsum.photos/seed/213/150/150' },
  { id: 'item14', name: 'Sparkling Water', price: 3.0, categoryId: 'cat5', image: 'https://picsum.photos/seed/214/150/150' },
  { id: 'item15', name: 'Orange Juice', price: 5.5, categoryId: 'cat5', image: 'https://picsum.photos/seed/215/150/150' },
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
  { id: 't9', name: 'Take Away', status: 'available', order: [] },
];
