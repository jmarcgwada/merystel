
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, User as UserIcon, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, Item, OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useKeyboard } from '@/contexts/keyboard-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';

const orderItemSchema = z.object({
  id: z.string(),
  itemId: z.string().min(1, 'Article requis.'),
  name: z.string(),
  quantity: z.coerce.number().min(1, 'Qté > 0.'),
  price: z.coerce.number(),
  remise: z.coerce.number().min(0).max(100).optional(),
});

const FormSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Ajoutez au moins un article.'),
  acompte: z.coerce.number().optional(),
});

type CommercialOrderFormValues = z.infer<typeof FormSchema>;

interface CommercialOrderFormProps {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromOrder: (itemId: string) => void;
  setSubmitHandler: (handler: (() => void) | null) => void;
}

const MAX_SEARCH_ITEMS = 100;

export function CommercialOrderForm({ order, setOrder, addToOrder, updateQuantity, removeFromOrder, setSubmitHandler }: CommercialOrderFormProps) {
  const { items: allItems, customers, isLoading, vatRates } = usePos();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  const { setTargetInput, inputValue, targetInput, isKeyboardOpen } = useKeyboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [listContent, setListContent] = useState<Item[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchType, setSearchType] = useState<'contains' | 'startsWith'>('contains');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const form = useForm<CommercialOrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: order.map(item => ({ ...item, remise: item.discountPercent || 0 })),
      acompte: 0,
    },
  });
  
  useEffect(() => {
    form.setValue('items', order.map(item => ({ ...item, remise: item.discountPercent || 0 })));
  }, [order, form]);
  
  const watchItems = form.watch('items');

  const onCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue('customerId', customer.id);
  }

  const handleAddItem = (item: Item) => {
    addToOrder(item.id);
  }

  // --- Search Logic from Supermarket ---
  const performSearch = useCallback((term: string, type: 'contains' | 'startsWith') => {
    if (!allItems) {
      setListContent([]);
      return;
    }
    const lowercasedTerm = term.toLowerCase();

    if (lowercasedTerm.length < 2) {
        setListContent([]);
        return;
    }

    const filtered = allItems.filter((item) => {
      const name = item.name.toLowerCase();
      const barcode = item.barcode ? item.barcode.toLowerCase() : '';
      if (type === 'startsWith') {
        return name.startsWith(lowercasedTerm) || barcode.startsWith(lowercasedTerm);
      }
      return name.includes(lowercasedTerm) || barcode.includes(lowercasedTerm);
    });
    setListContent(filtered.slice(0, MAX_SEARCH_ITEMS));
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [allItems]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < listContent.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listContent.length > 0 && highlightedIndex >= 0 && listContent[highlightedIndex]) {
        handleAddItem(listContent[highlightedIndex]);
        setSearchTerm('');
        setListContent([]);
      } else {
        performSearch(searchTerm, searchType);
      }
    }
  };
  
  useEffect(() => {
    if (highlightedIndex !== -1 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);
  
  const handleShowAll = () => {
    if (allItems) {
      setSearchTerm('');
      setListContent(allItems.slice(0, MAX_SEARCH_ITEMS));
      setHighlightedIndex(-1);
      searchInputRef.current?.focus();
    }
  };
  
  const handleChangeSearchType = () => {
    const newType = searchType === 'contains' ? 'startsWith' : 'contains';
    setSearchType(newType);
    performSearch(searchTerm, newType);
    searchInputRef.current?.focus();
  };
  // --- End of Search Logic ---
  
  const subTotalHT = useMemo(() => {
    if (!allItems || !vatRates) return 0;
    return watchItems.reduce((acc, item) => {
      const fullItem = allItems.find(i => i.id === item.itemId);
      if (!fullItem) return acc;
      
      const vatRate = vatRates.find(v => v.id === fullItem.vatId)?.rate || 0;
      const priceHT = item.price / (1 + vatRate / 100);
      const remise = item.remise || 0;
      const totalHT = priceHT * item.quantity * (1 - remise / 100);

      return acc + totalHT;
    }, 0);
  }, [watchItems, allItems, vatRates]);


  const totalHTAvecEscompte = subTotalHT;

  const vatBreakdown = useMemo(() => {
    if (!allItems || !vatRates) return {};
    const breakdown: { [key: string]: { rate: number; total: number, base: number } } = {};

    watchItems.forEach(item => {
      const fullItem = allItems.find(i => i.id === item.itemId);
      if (!fullItem) return;

      const vatInfo = vatRates.find(v => v.id === fullItem.vatId);
      if (vatInfo) {
        const priceHT = item.price / (1 + vatInfo.rate / 100);
        const remise = item.remise || 0;
        const totalItemHT = priceHT * item.quantity * (1 - remise / 100);
        const totalItemHTAvecEscompte = totalItemHT;
        const taxForItem = totalItemHTAvecEscompte * (vatInfo.rate / 100);

        if (breakdown[vatInfo.rate]) {
          breakdown[vatInfo.rate].total += taxForItem;
          breakdown[vatInfo.rate].base += totalItemHTAvecEscompte;
        } else {
          breakdown[vatInfo.rate] = { rate: vatInfo.rate, total: taxForItem, base: totalItemHTAvecEscompte };
        }
      }
    });

    return breakdown;
  }, [watchItems, allItems, vatRates]);
  
  const totalTVA = Object.values(vatBreakdown).reduce((acc, { total }) => acc + total, 0);
  const totalTTC = totalHTAvecEscompte + totalTVA;
  const acompte = form.watch('acompte') || 0;
  const netAPayer = totalTTC - acompte;

  const onSubmit = useCallback((data: CommercialOrderFormValues) => {
    console.log(data);
    toast({ title: 'Facture générée (simulation)' });
  }, [toast]);
  
  useEffect(() => {
    setSubmitHandler(() => form.handleSubmit(onSubmit));
    return () => setSubmitHandler(null);
  }, [form, onSubmit, setSubmitHandler]);


  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6 items-end mt-4">
        <div className="w-full lg:flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={searchInputRef}
                    placeholder="Rechercher ou scanner un article..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        performSearch(e.target.value, searchType);
                    }}
                    onKeyDown={handleKeyDown}
                    className="h-14 text-xl pl-12 pr-40"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                        variant="outline"
                        onClick={handleChangeSearchType}
                        className="h-12 text-xs w-28"
                    >
                        {searchType === 'contains' ? 'Contient' : 'Commence par'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12" onClick={handleShowAll}>
                        <List className="h-6 w-6" />
                    </Button>
                </div>
            </div>
            {listContent.length > 0 && (
                <Card className="mt-2 absolute z-10 w-full max-w-2xl">
                    <ScrollArea className="h-full max-h-80">
                         <div className="p-1 space-y-1">
                            {listContent.map((item, index) => (
                                <div
                                key={item.id}
                                ref={(el) => (itemRefs.current[index] = el)}
                                className={cn(
                                    "p-2 rounded-md cursor-pointer flex justify-between items-center",
                                    index === highlightedIndex && "bg-secondary"
                                )}
                                onClick={() => {
                                    handleAddItem(item);
                                    setSearchTerm('');
                                    setListContent([]);
                                }}
                                >
                                    <div>
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.barcode}</p>
                                    </div>
                                    <p className="text-sm font-bold">{item.price.toFixed(2)}€</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </div>
        <div className="w-full lg:w-1/3">
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Client</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setCustomerModalOpen(true)}>
                        <UserIcon className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {selectedCustomer ? (
                    <div className="text-sm">
                        <p className="font-bold">{selectedCustomer.name}</p>
                        <p className="text-muted-foreground">{selectedCustomer.address}</p>
                        <p className="text-muted-foreground">{selectedCustomer.postalCode} {selectedCustomer.city}</p>
                    </div>
                    ) : (
                    <div className="text-sm text-muted-foreground">
                        Aucun client sélectionné.
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

    <Card className="h-full flex flex-col mt-4">
      <CardContent className="p-6 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr_min-content] gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                  <span>Désignation</span>
                  <span className="text-right">Qté</span>
                  <span className="text-right">P.U. HT</span>
                  <span className="text-center">Code TVA</span>
                  <span className="text-right">Remise %</span>
                  <span className="text-right">Total HT</span>
                  <span></span>
                </div>
                <div className="space-y-2">
                {watchItems.map((field, index) => {
                  const fullItem = allItems.find(i => i.id === field.itemId);
                  const vatInfo = vatRates.find(v => v.id === fullItem?.vatId);
                  const priceHT = vatInfo ? field.price / (1 + vatInfo.rate / 100) : field.price;

                  return (
                  <div key={field.id} className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr_min-content] gap-4 items-start">
                    <Input readOnly value={field.name} className="bg-muted/50" />
                    <Input 
                        type="number" 
                        value={field.quantity}
                        onChange={e => updateQuantity(field.id, parseInt(e.target.value) || 1)}
                        min={1} 
                        className="text-right" 
                    />
                    <Input type="number" readOnly value={priceHT.toFixed(2)} className="text-right bg-muted/50" />
                    <Input type="text" readOnly value={vatInfo?.code || '-'} className="text-center bg-muted/50 font-mono" />
                     <Controller
                        control={form.control}
                        name={`items.${index}.remise`}
                        render={({ field: controllerField }) => (
                            <Input type="number" {...controllerField} value={controllerField.value ?? 0} onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)} min={0} max={100} className="text-right" />
                        )}
                    />
                  <div className="font-medium h-10 flex items-center justify-end px-3">
                    {(() => {
                        const item = watchItems[index];
                        if(!item || !item.itemId) return '0.00€';
                        const remise = item.remise || 0;
                        const total = priceHT * item.quantity * (1 - (remise || 0) / 100);
                        return `${total.toFixed(2)}€`
                    })()}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFromOrder(field.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )})}
              </div>
              {watchItems.length === 0 && (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                    Aucun article dans la commande.
                </div>
              )}
            </div>
            
            <Separator className="mb-6"/>
            <div className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-4">
                        <h4 className="font-semibold">Taux de TVA</h4>
                        <div className="grid grid-cols-3 gap-4 p-2 border rounded-md">
                           <div className="text-sm font-medium">Base HT</div>
                           <div className="text-sm font-medium">Taux</div>
                           <div className="text-sm font-medium">Montant TVA</div>
                            {Object.values(vatBreakdown).map(vat => (
                                <React.Fragment key={vat.rate}>
                                    <div className="text-sm">{vat.base.toFixed(2)}€</div>
                                    <div className="text-sm">{vat.rate.toFixed(2)}%</div>
                                    <div className="text-sm">{vat.total.toFixed(2)}€</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Total HT</Label>
                            <span className="font-medium">{totalHTAvecEscompte.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label>Cumul TVA</Label>
                            <span className="font-medium">{totalTVA.toFixed(2)}€</span>
                        </div>
                         <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total TTC</span>
                            <span>{totalTTC.toFixed(2)}€</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <Label htmlFor="acompte">Acompte (€)</Label>
                             <Controller control={form.control} name="acompte" render={({ field }) => (
                                <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min={0} className="max-w-[100px] text-right" placeholder="0.00"/>
                            )} />
                        </div>
                        <div className="flex justify-between items-center text-primary font-bold text-xl bg-primary/10 p-2 rounded-md">
                            <span>Net à Payer</span>
                            <span>{netAPayer.toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    <CustomerSelectionDialog
      isOpen={isCustomerModalOpen}
      onClose={() => setCustomerModalOpen(false)}
      onCustomerSelected={onCustomerSelected}
    />
    </>
  );
}
