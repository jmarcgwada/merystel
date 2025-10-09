
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, List, Search, Pencil, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Supplier, Item, OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useKeyboard } from '@/contexts/keyboard-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplierSelectionDialog } from '@/components/shared/supplier-selection-dialog';
import { useRouter } from 'next/navigation';

const orderItemSchema = z.object({
  id: z.string(),
  itemId: z.string().min(1, 'Article requis.'),
  name: z.string(),
  quantity: z.coerce.number().min(1, 'Qté > 0.'),
  price: z.coerce.number(), // This will be purchasePrice
});

const FormSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Ajoutez au moins un article.'),
});

type SupplierOrderFormValues = z.infer<typeof FormSchema>;

interface SupplierOrderFormProps {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromOrder: (itemId: string) => void;
  setSubmitHandler: (handler: (() => void) | null) => void;
  setIsReady: (isReady: boolean) => void;
}

const MAX_SEARCH_ITEMS = 100;
const MAX_INITIAL_ITEMS = 100;

export function SupplierOrderForm({ order, setOrder, addToOrder, updateQuantity, removeFromOrder, setSubmitHandler, setIsReady }: SupplierOrderFormProps) {
  const { items: allItems, suppliers, isLoading, vatRates, recordCommercialDocument, currentSaleContext, setCurrentSaleContext, orderTotal, orderTax } = usePos();
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const router = useRouter();

  const { setTargetInput, inputValue, targetInput, isKeyboardOpen } = useKeyboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [listContent, setListContent] = useState<Item[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchType, setSearchType] = useState<'contains' | 'startsWith'>('contains');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const form = useForm<SupplierOrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: order.map(item => ({ ...item, price: item.price })), // Ensure purchasePrice is mapped
    },
  });
  
  useEffect(() => {
    form.setValue('items', order.map(item => ({ ...item, price: item.price })));
  }, [order, form.setValue]);
  
  const watchItems = form.watch('items');
  
  useEffect(() => {
    const isReady = !!selectedSupplier && watchItems.length > 0;
    setIsReady(isReady);
  }, [selectedSupplier, watchItems, setIsReady]);

  const onSupplierSelected = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    form.setValue('supplierId', supplier.id);
    setCurrentSaleContext(prev => ({...prev, supplierId: supplier.id }));
    setSupplierSearchOpen(false);
  }

  const handleAddItem = (item: Item) => {
    if (typeof item.purchasePrice !== 'number') {
        toast({
            variant: 'destructive',
            title: 'Prix d\'achat manquant',
            description: `L'article "${item.name}" n'a pas de prix d'achat défini.`,
        });
        return;
    }
    // We add to order with purchase price, not sale price
    addToOrder(item.id);
  }

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
      setListContent(allItems.slice(0, MAX_INITIAL_ITEMS));
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
  
  const subTotalHT = useMemo(() => {
    return watchItems.reduce((acc, item) => {
      return acc + (item.price * item.quantity); // item.price is purchasePrice here
    }, 0);
  }, [watchItems]);

  const vatBreakdown = useMemo(() => {
    if (!allItems || !vatRates) return {};
    const breakdown: { [key: string]: { rate: number; total: number, base: number, code: number } } = {};

    watchItems.forEach(item => {
      const fullItem = allItems.find(i => i.id === item.itemId);
      if (!fullItem) return;

      const vatInfo = vatRates.find(v => v.id === fullItem.vatId);
      if (vatInfo) {
        const totalItemHT = item.price * item.quantity;
        const taxForItem = totalItemHT * (vatInfo.rate / 100);

        const vatKey = vatInfo.rate.toString();
        if (breakdown[vatKey]) {
          breakdown[vatKey].total += taxForItem;
          breakdown[vatKey].base += totalItemHT;
        } else {
          breakdown[vatKey] = { rate: vatInfo.rate, total: taxForItem, base: totalItemHT, code: vatInfo.code };
        }
      }
    });

    return breakdown;
  }, [watchItems, allItems, vatRates]);
  
  const totalTVA = Object.values(vatBreakdown).reduce((acc, { total }) => acc + total, 0);
  const totalTTC = subTotalHT + totalTVA;

  const onSubmit = useCallback(() => {
    if (order.length === 0 || !selectedSupplier) return;
    
     const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: orderTotal + orderTax,
      status: 'pending', 
      payments: [],
      supplierId: selectedSupplier.id,
    };
    
    recordCommercialDocument(doc, 'supplier_order');
    
    setOrder([]);
    setSelectedSupplier(null);
    form.reset();

  }, [order, selectedSupplier, toast, setOrder, form, recordCommercialDocument, orderTotal, orderTax]);
  
  useEffect(() => {
    const handler = () => form.handleSubmit(onSubmit)();
    setSubmitHandler(() => handler);
    return () => setSubmitHandler(null);
  }, [form, onSubmit, setSubmitHandler]);


  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6 items-start mt-4">
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
                         <div className="space-y-px p-1">
                            {listContent.map((item, index) => (
                                <div
                                key={item.id}
                                ref={(el) => (itemRefs.current[index] = el)}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer",
                                    index === highlightedIndex && "bg-secondary"
                                )}
                                onClick={() => {
                                    handleAddItem(item);
                                    setSearchTerm('');
                                    setListContent([]);
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">({item.barcode})</p>
                                    </div>
                                    <p className="text-sm font-bold">{item.purchasePrice?.toFixed(2) || 'N/A'}€</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </div>
        <div className="w-full lg:w-auto">
            <Card className="w-[350px]">
                <CardContent className="p-4 relative">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setSupplierSearchOpen(true)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {selectedSupplier ? (
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold text-base flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" />{selectedSupplier.name}</p>
                            <p className="text-muted-foreground pl-6">{selectedSupplier.address}</p>
                            <p className="text-muted-foreground pl-6">{selectedSupplier.postalCode} {selectedSupplier.city}</p>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-1">
                            <Label>Fournisseur</Label>
                            <p>Aucun fournisseur sélectionné.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

    <Card className="mt-4 flex-1 flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col flex-1">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Détails de la commande fournisseur</h3>
                  {order.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOrder([])}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Tout effacer
                    </Button>
                  )}
              </div>
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] gap-x-4 items-center font-semibold text-sm text-muted-foreground px-3 py-2 border-b">
                <span className="py-2">Désignation</span>
                <span className="text-right py-2">Qté</span>
                <span className="text-right py-2">P.A. HT</span>
                <span className="text-center py-2">Code TVA</span>
                <span className="text-right py-2">Total HT</span>
                <span className="py-2"></span>
              </div>
              <ScrollArea className="flex-1">
                  <div className="space-y-2">
                  {watchItems.map((field, index) => {
                    const fullItem = allItems?.find(i => i.id === field.itemId);
                    const vatInfo = vatRates?.find(v => v.id === fullItem?.vatId);
                    
                    return (
                    <div key={field.id} className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] gap-x-4 items-center py-2 border-b">
                        <div className="flex flex-col">
                            <span className="font-semibold">{field.name}</span>
                        </div>
                      <Input 
                          type="number" 
                          value={field.quantity}
                          onChange={e => updateQuantity(field.id, parseInt(e.target.value) || 1)}
                          min={1} 
                          className="text-right bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto" 
                      />
                      <Input type="number" readOnly value={field.price.toFixed(2)} className="text-right bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto" />
                      <Input type="text" readOnly value={vatInfo?.code || '-'} className="text-center bg-transparent font-mono border-none ring-0 focus-visible:ring-0 p-0 h-auto" />
                    <div className="font-medium h-full flex items-center justify-end">
                      {`${(field.price * field.quantity).toFixed(2)}€`}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFromOrder(field.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )})}
                </div>
              </ScrollArea>
              {watchItems.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                      Aucun article dans la commande.
                  </div>
                )}
            </div>
            
            <div className="mt-auto">
                <Separator className="my-6"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-4">
                        <h4 className="font-semibold">Taux de TVA</h4>
                        <div className="grid grid-cols-4 gap-4 p-2 border rounded-md">
                           <div className="text-sm font-medium">Code</div>
                           <div className="text-sm font-medium text-right">Taux</div>
                           <div className="text-sm font-medium text-right">Base HT</div>
                           <div className="text-sm font-medium text-right">Montant</div>
                            {Object.values(vatBreakdown).map(vat => (
                                <React.Fragment key={vat.rate}>
                                    <div className="text-sm font-mono">{vat.code}</div>
                                    <div className="text-sm text-right">{vat.rate.toFixed(2)}%</div>
                                    <div className="text-sm text-right">{vat.base.toFixed(2)}€</div>
                                    <div className="text-sm text-right">{vat.total.toFixed(2)}€</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2 max-w-sm ml-auto">
                            <div className="flex justify-between items-center">
                                <Label>Total HT</Label>
                                <span className="font-medium">{subTotalHT.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label>Cumul TVA</Label>
                                <span className="font-medium">{totalTVA.toFixed(2)}€</span>
                            </div>
                             <Separator />
                            <div className="flex justify-between items-center font-bold text-lg text-primary bg-primary/10 p-2 rounded-md">
                                <span>Total TTC</span>
                                <span>{totalTTC.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    <SupplierSelectionDialog isOpen={isSupplierSearchOpen} onClose={() => setSupplierSearchOpen(false)} onSupplierSelected={onSupplierSelected} />
    </>
  );
}
