
import type { Category, Item, Table, Customer, Sale, PaymentMethod, VatRate } from './types';
import { format } from 'date-fns';

export const mockPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Carte', icon: 'card', type: 'direct' },
    { id: 'pm2', name: 'Espèces', icon: 'cash', type: 'direct' },
    { id: 'pm3', name: 'Chèque', icon: 'check', type: 'direct' },
    { id: 'pm4', name: 'Ticket Restaurant', icon: 'other', type: 'indirect', value: 8.50 },
];

export const mockVatRates: VatRate[] = [
    { id: 'vat1', name: 'Taux Zéro', rate: 0 },
    { id: 'vat2', name: 'Taux Intermédiaire', rate: 8.5 },
    { id: 'vat3', name: 'Taux Normal', rate: 20 },
];

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Plats principaux', image: 'https://picsum.photos/seed/101/100/100', isFavorite: true },
  { id: 'cat2', name: 'Entrées', image: 'https://picsum.photos/seed/102/100/100' },
  { id: 'cat3', name: 'Desserts', image: 'https://picsum.photos/seed/103/100/100' },
  { id: 'cat4', name: 'Boissons chaudes', image: 'https://picsum.photos/seed/104/100/100', isFavorite: true },
  { id: 'cat5', name: 'Boissons froides', image: 'https://picsum.photos/seed/105/100/100' },
];

export const mockItems: Item[] = [
  // Plats principaux
  { id: 'item1', name: 'Steak Frites', price: 28.5, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/201/150/150', isFavorite: true },
  { id: 'item2', name: 'Poulet rôti', price: 24.0, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/202/150/150' },
  { id: 'item3', name: 'Filet de saumon', price: 26.0, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/203/150/150' },
  { id: 'item4', name: 'Pâtes Carbonara', price: 19.5, categoryId: 'cat1', vatId: 'vat2', image: 'https://picsum.photos/seed/204/150/150' },
  
  // Entrées
  { id: 'item5', name: 'Soupe à l\'oignon', price: 9.0, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/205/150/150' },
  { id: 'item6', name: 'Calamars frits', price: 12.5, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/206/150/150' },
  { id: 'item7', name: 'Bruschetta', price: 8.0, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/207/150/150' },

  // Desserts
  { id: 'item8', name: 'Mi-cuit au chocolat', price: 10.0, categoryId: 'cat3', vatId: 'vat2', image: 'https://picsum.photos/seed/208/150/150', isFavorite: true },
  { id: 'item9', name: 'Crème Brûlée', price: 9.5, categoryId: 'cat3', vatId: 'vat2', image: 'https://picsum.photos/seed/209/150/150' },

  // Boissons chaudes
  { id: 'item10', name: 'Espresso', price: 3.5, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/210/150/150', isFavorite: true },
  { id: 'item11', name: 'Latte', price: 5.0, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/211/150/150' },
  { id: 'item12', name: 'Tisane', price: 4.0, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/212/150/150' },

  // Boissons froides
  { id: 'item13', name: 'Thé glacé', price: 4.0, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/213/150/150', isFavorite: true },
  { id: 'item14', name: 'Eau pétillante', price: 3.0, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/214/150/150' },
  { id: 'item15', name: 'Jus d\'orange', price: 5.5, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/215/150/150' },
  { id: 'item16', name: 'Cola', price: 3.5, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/216/150/150' },
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

const generateMockSales = (): Sale[] => {
    const sales: Sale[] = [];
    const today = new Date('2025-09-24T16:00:00');

    const datePrefix = format(today, 'yyyyMMdd');

    // Sale 1
    const sale1Items = [mockItems[0], mockItems[13], mockItems[15]];
    const subtotal1 = sale1Items.reduce((acc, item) => acc + item.price, 0);
    const tax1 = (mockItems[0].price * (mockVatRates.find(v => v.id === mockItems[0].vatId)!.rate / 100)) + 
                 (mockItems[13].price * (mockVatRates.find(v => v.id === mockItems[13].vatId)!.rate / 100)) +
                 (mockItems[15].price * (mockVatRates.find(v => v.id === mockItems[15].vatId)!.rate / 100));
    const total1 = subtotal1 + tax1;
    sales.push({
        id: 'sale1',
        ticketNumber: `${datePrefix}-0001`,
        date: new Date(today.getTime() - 2 * 60 * 1000),
        items: [
            {...sale1Items[0], quantity: 1, total: sale1Items[0].price},
            {...sale1Items[1], quantity: 1, total: sale1Items[1].price},
            {...sale1Items[2], quantity: 1, total: sale1Items[2].price},
        ],
        subtotal: subtotal1,
        tax: tax1,
        total: total1,
        payments: [{ method: mockPaymentMethods[0], amount: total1 }],
        customerId: 'cust1',
    });

    // Sale 2
    const sale2Items = [mockItems[4], mockItems[8]];
    const subtotal2 = (sale2Items[0].price * 2) + (sale2Items[1].price * 2);
    const tax2 = ((sale2Items[0].price * 2) * (mockVatRates.find(v => v.id === sale2Items[0].vatId)!.rate / 100)) +
                 ((sale2Items[1].price * 2) * (mockVatRates.find(v => v.id === sale2Items[1].vatId)!.rate / 100));
    const total2 = subtotal2 + tax2;
     sales.push({
        id: 'sale2',
        ticketNumber: `${datePrefix}-0002`,
        date: new Date(today.getTime() - 15 * 60 * 1000),
        items: [
             {...sale2Items[0], quantity: 2, total: sale2Items[0].price * 2},
             {...sale2Items[1], quantity: 2, total: sale2Items[1].price * 2},
        ],
        subtotal: subtotal2,
        tax: tax2,
        total: total2,
        payments: [{ method: mockPaymentMethods[1], amount: total2 }]
    });

    // Sale 3
    const sale3Items = [mockItems[10], mockItems[11]];
    const subtotal3 = sale3Items[0].price + (sale3Items[1].price * 2);
    const tax3 = (sale3Items[0].price * (mockVatRates.find(v => v.id === sale3Items[0].vatId)!.rate / 100)) +
                 ((sale3Items[1].price * 2) * (mockVatRates.find(v => v.id === sale3Items[1].vatId)!.rate / 100));
    const total3 = subtotal3 + tax3;
     sales.push({
        id: 'sale3',
        ticketNumber: `${datePrefix}-0003`,
        date: new Date(today.getTime() - 35 * 60 * 1000),
        items: [
            {...sale3Items[0], quantity: 1, total: sale3Items[0].price},
            {...sale3Items[1], quantity: 2, total: sale3Items[1].price * 2},
        ],
        subtotal: subtotal3,
        tax: tax3,
        total: total3,
        payments: [{ method: mockPaymentMethods[1], amount: 20.00 }, { method: mockPaymentMethods[0], amount: total3 - 20.00 }],
        customerId: 'cust2',
    });
    
    return sales;
}


export const mockSales: Sale[] = generateMockSales();
