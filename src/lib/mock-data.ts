
import type { Category, Item, Table, Customer, Sale, PaymentMethod, VatRate } from './types';
import { format } from 'date-fns';

export const mockVatRates: VatRate[] = [
    { id: 'vat1', name: 'Taux Zéro', rate: 0, code: 1 },
    { id: 'vat2', name: 'Taux Réduit', rate: 2.2, code: 2 },
    { id: 'vat3', name: 'Taux Intermédiaire', rate: 8.5, code: 3 },
];

export const mockPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Carte', icon: 'card', type: 'direct' },
    { id: 'pm2', name: 'Espèces', icon: 'cash', type: 'direct' },
    { id: 'pm3', name: 'Chèque', icon: 'check', type: 'direct' },
    { id: 'pm4', name: 'Ticket Restaurant', icon: 'other', type: 'indirect', value: 8.50 },
];

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Plats principaux', image: 'https://picsum.photos/seed/101/100/100', color: '#f87171', isFavorite: true },
  { id: 'cat2', name: 'Entrées', image: 'https://picsum.photos/seed/102/100/100', color: '#fb923c' },
  { id: 'cat3', name: 'Desserts', image: 'https://picsum.photos/seed/103/100/100', color: '#d946ef' },
  { id: 'cat4', name: 'Boissons chaudes', image: 'https://picsum.photos/seed/104/100/100', color: '#a3a3a3', isFavorite: true },
  { id: 'cat5', name: 'Boissons froides', image: 'https://picsum.photos/seed/105/100/100', color: '#60a5fa' },
];

export const mockItems: Item[] = [
  // Plats principaux
  { id: 'item1', name: 'Steak Frites', price: 28.5, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/201/150/150', isFavorite: true, description: 'Un classique de la brasserie : un steak de bœuf grillé à la perfection, accompagné de frites maison croustillantes et d\'une sauce au poivre.', showImage: true },
  { id: 'item2', name: 'Poulet rôti', price: 24.0, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/202/150/150', description: 'Demi-poulet fermier rôti lentement, servi avec une purée de pommes de terre onctueuse et son jus de cuisson.', showImage: true },
  { id: 'item3', name: 'Filet de saumon', price: 26.0, categoryId: 'cat1', vatId: 'vat3', image: 'https://picsum.photos/seed/203/150/150', showImage: true },
  { id: 'item4', name: 'Pâtes Carbonara', price: 19.5, categoryId: 'cat1', vatId: 'vat2', image: 'https://picsum.photos/seed/204/150/150', showImage: true },
  
  // Entrées
  { id: 'item5', name: 'Soupe à l\'oignon', price: 9.0, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/205/150/150', showImage: true },
  { id: 'item6', name: 'Calamars frits', price: 12.5, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/206/150/150', showImage: false },
  { id: 'item7', name: 'Bruschetta', price: 8.0, categoryId: 'cat2', vatId: 'vat2', image: 'https://picsum.photos/seed/207/150/150', showImage: true },

  // Desserts
  { id: 'item8', name: 'Mi-cuit au chocolat', price: 10.0, categoryId: 'cat3', vatId: 'vat2', image: 'https://picsum.photos/seed/208/150/150', isFavorite: true, showImage: true },
  { id: 'item9', name: 'Crème Brûlée', price: 9.5, categoryId: 'cat3', vatId: 'vat2', image: 'https://picsum.photos/seed/209/150/150', showImage: true },

  // Boissons chaudes
  { id: 'item10', name: 'Espresso', price: 3.5, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/210/150/150', isFavorite: true, showImage: false },
  { id: 'item11', name: 'Latte', price: 5.0, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/211/150/150', showImage: false },
  { id: 'item12', name: 'Tisane', price: 4.0, categoryId: 'cat4', vatId: 'vat2', image: 'https://picsum.photos/seed/212/150/150', showImage: false },

  // Boissons froides
  { id: 'item13', name: 'Thé glacé', price: 4.0, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/213/150/150', isFavorite: true, showImage: true },
  { id: 'item14', name: 'Eau pétillante', price: 3.0, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/214/150/150', showImage: false },
  { id: 'item15', name: 'Jus d\'orange', price: 5.5, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/215/150/150', showImage: true },
  { id: 'item16', name: 'Cola', price: 3.5, categoryId: 'cat5', vatId: 'vat1', image: 'https://picsum.photos/seed/216/150/150', showImage: false },
];

export const mockTables: Table[] = [
    {
        id: 'takeaway',
        name: 'Vente à emporter',
        number: 0,
        description: 'Commandes à emporter traitées comme des ventes directes.',
        status: 'available',
        order: [],
    }
];

export const mockCustomers: Customer[] = [
  { id: 'cust1', name: 'Alice Martin', email: 'alice.m@email.com', phone: '0612345678' },
  { id: 'cust2', name: 'Bob Dubois', email: 'bob.d@email.com', phone: '0687654321' },
];

const generateMockSales = (): Sale[] => {
    const baseDate = new Date('2025-09-24T16:00:00Z');
    const datePrefix = format(baseDate, 'yyyyMMdd');
    const sales: Sale[] = [
        {
            id: 'sale1',
            ticketNumber: `${datePrefix}-0001`,
            date: new Date('2025-09-24T15:58:00Z'),
            items: [
                {...mockItems[0], quantity: 1, total: 28.5, discount: 0},
                {...mockItems[13], quantity: 1, total: 4.0, discount: 0},
                {...mockItems[15], quantity: 1, total: 5.5, discount: 0},
            ],
            subtotal: 38.0,
            tax: 2.4225,
            total: 40.4225,
            payments: [{ method: mockPaymentMethods[0], amount: 40.42 }],
            customerId: 'cust1',
            status: 'paid'
        },
        {
            id: 'sale2',
            ticketNumber: `${datePrefix}-0002`,
            date: new Date('2025-09-24T15:45:00Z'),
            items: [
                 {...mockItems[4], quantity: 2, total: 18.0, discount: 0},
                 {...mockItems[8], quantity: 2, total: 19.0, discount: 0},
            ],
            subtotal: 37.0,
            tax: 0.814 + 0.418,
            total: 38.232,
            payments: [{ method: mockPaymentMethods[1], amount: 38.23 }],
            status: 'paid'
        },
        {
            id: 'sale3',
            ticketNumber: `${datePrefix}-0003`,
            date: new Date('2025-09-24T15:25:00Z'),
            items: [
                {...mockItems[10], quantity: 1, total: 3.5, discount: 0},
                {...mockItems[11], quantity: 2, total: 10.0, discount: 0},
            ],
            subtotal: 13.5,
            tax: 0.077 + 0.22,
            total: 13.797,
            payments: [{ method: mockPaymentMethods[1], amount: 13.80 }],
            customerId: 'cust2',
            status: 'paid'
        }
    ];
    return sales;
}


export const mockSales: Sale[] = generateMockSales();
