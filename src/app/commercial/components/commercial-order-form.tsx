

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, User as UserIcon, List, Search, Pencil, StickyNote, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, Item, OrderItem, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useKeyboard } from '@/contexts/keyboard-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckoutModal } from '@/app/pos/components/checkout-modal';
import { useRouter } from 'next/navigation';
import { EditItemDialog } from './edit-item-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';


const orderItemSchema = z.object({
  id: z.string(),
  itemId: z.string().min(1, 'Article requis.'),
  name: z.string(),
  quantity: z.coerce.number().min(1, 'Qté > 0.'),
  price: z.coerce.number(),
  remise: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
  description2: z.string().optional(),
  note: z.string().optional(),
  barcode: z.string().optional(),
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
  updateItemNote: (itemId: string, note: string) => void;
  updateItemPrice: (itemId: string, newPriceTTC: number) => void;
  showAcompte?: boolean;
  onTotalsChange: (totals: { subtotal: number, tax: number, total: number }) => void;
  updateItemQuantityInOrder: (itemId: string, quantity: number) => void;
  documentType: 'invoice' | 'quote' | 'delivery_note' | 'credit_note';
}

const MAX_SEARCH_ITEMS = 100;
const MAX_INITIAL_ITEMS = 100;

function NoteEditor({ orderItem, onSave, onCancel }: { orderItem: OrderItem; onSave: (note: string) => void; onCancel: () => void; }) {
  const [note, setNote] = useState(orderItem.note || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
    }, 100)
  }, []);

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ajouter une note pour cette ligne..."
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
        <Button size="sm" onClick={() => onSave(note)}>Enregistrer</Button>
      </div>
    </div>
  );
}


export const CommercialOrderForm = forwardRef<
  { submit: () => void },
  CommercialOrderFormProps
>(({ order, setOrder, addToOrder, updateQuantity, removeFromOrder, updateItemNote, updateItemPrice, showAcompte = false, onTotalsChange, updateItemQuantityInOrder, documentType }, ref) => {
  const { items: allItems, customers, isLoading, vatRates, descriptionDisplay, recordSale, currentSaleContext, setCurrentSaleContext, showNavConfirm, recordCommercialDocument, currentSaleId, applyDiscount } = usePos();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const router = useRouter();

  const { setTargetInput, inputValue, targetInput, isKeyboardOpen } = useKeyboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [listContent, setListContent] = useState<Item[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchType, setSearchType] = useState<'contains' | 'startsWith'>('contains');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [priceDisplayType, setPriceDisplayType] = useState<'ht' | 'ttc'>('ttc');


    useEffect(() => {
        const storedColumns = localStorage.getItem('commercialOrderVisibleColumns');
        const storedPriceType = localStorage.getItem('commercialOrderPriceType');
        
        if (storedColumns) {
            setVisibleColumns(JSON.parse(storedColumns));
        } else {
             setVisibleColumns({
                reference: false,
                designation: true,
                quantity: true,
                vat_code: true,
                discount: true,
            });
        }
        
        if (storedPriceType) {
            setPriceDisplayType(storedPriceType as 'ht' | 'ttc');
        } else {
            setPriceDisplayType('ttc');
        }
    }, []);

    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newVisibility = { ...visibleColumns, [columnId]: isVisible };
        setVisibleColumns(newVisibility);
        localStorage.setItem('commercialOrderVisibleColumns', JSON.stringify(newVisibility));
    };
    
    const handlePriceDisplayChange = (value: string) => {
        const newType = value as 'ht' | 'ttc';
        setPriceDisplayType(newType);
        localStorage.setItem('commercialOrderPriceType', newType);
    };

    const columns = [
        { id: 'reference', label: 'Référence' },
        { id: 'designation', label: 'Désignation' },
        { id: 'quantity', label: 'Qté' },
    ];


  const form = useForm<CommercialOrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
      acompte: 0,
    },
  });
  
  useEffect(() => {
    form.setValue('items', order.map(item => ({ ...item, remise: item.discountPercent || 0 })));
    
     if (currentSaleContext?.acompte) {
        form.setValue('acompte', currentSaleContext.acompte);
    }
  }, [order, currentSaleContext, form]);
  
  const watchItems = form.watch('items');
  const watchAcompte = form.watch('acompte');
  
  useEffect(() => {
    if (currentSaleContext?.customerId && customers) {
        const customer = customers.find(c => c.id === currentSaleContext.customerId);
        if (customer) {
            setSelectedCustomer(customer);
            form.setValue('customerId', customer.id);
        }
    } else if (!currentSaleContext?.customerId && customers && customers.length > 0) {
      // Pre-select default customer if available and none is selected
      const defaultCustomer = customers.find(c => c.isDefault);
      if (defaultCustomer) {
        setSelectedCustomer(defaultCustomer);
        form.setValue('customerId', defaultCustomer.id);
      }
    }
  }, [currentSaleContext?.customerId, customers, form]);

  const onCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue('customerId', customer.id);
    setCurrentSaleContext(prev => ({ ...prev, customerId: customer.id }));
    setCustomerSearchOpen(false);
  }

  const handleAddItem = (item: Item) => {
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
      } else if (searchTerm.trim() !== '') {
        const trimmedSearch = searchTerm.trim();
        const isBarcodeFormat = /^\d{11,14}$/.test(trimmedSearch);
        const itemExists = allItems?.some(item => item.barcode === trimmedSearch);

        if (isBarcodeFormat && !itemExists) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/management/items/form?barcode=${trimmedSearch}&redirectUrl=${redirectUrl}`);
        } else {
            performSearch(searchTerm, searchType);
        }
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
  
  const calculationResult = useMemo(() => {
    if (!allItems || !vatRates) {
      return { subTotalHT: 0, vatBreakdown: {}, totalTVA: 0, totalTTC: 0 };
    }

    const totalTTC = watchItems.reduce((acc, item) => {
        const remisePercent = item.remise || 0;
        const itemTotal = item.price * item.quantity;
        return acc + (itemTotal * (1 - remisePercent / 100));
    }, 0);

    const vatBreakdown: { [key: string]: { rate: number; total: number; base: number; code: number } } = {};
    let totalTVA = 0;

    watchItems.forEach(item => {
        const fullItem = allItems.find(i => i.id === item.itemId);
        if (!fullItem) return;

        const vatInfo = vatRates.find(v => v.id === fullItem.vatId);
        if (!vatInfo || vatInfo.rate === 0) return;

        const itemTotalAfterRemise = item.price * item.quantity * (1 - (item.remise || 0) / 100);
        const itemTotalHT = itemTotalAfterRemise / (1 + vatInfo.rate / 100);
        const itemTax = itemTotalAfterRemise - itemTotalHT;

        const vatKey = vatInfo.rate.toString();
        if (vatBreakdown[vatKey]) {
            vatBreakdown[vatKey].base += itemTotalHT;
            vatBreakdown[vatKey].total += itemTax;
        } else {
            vatBreakdown[vatKey] = {
                rate: vatInfo.rate,
                total: itemTax,
                base: itemTotalHT,
                code: vatInfo.code,
            };
        }
    });

    Object.values(vatBreakdown).forEach(vat => {
        totalTVA += vat.total;
    });

    const subTotalHT = totalTTC - totalTVA;

    return { subTotalHT, vatBreakdown, totalTVA, totalTTC };

}, [watchItems, allItems, vatRates]);

  const { subTotalHT, vatBreakdown, totalTVA, totalTTC } = calculationResult;

  useEffect(() => {
    onTotalsChange({ subtotal: subTotalHT, tax: totalTVA, total: totalTTC });
  }, [subTotalHT, totalTVA, totalTTC, onTotalsChange]);


  const acompte = form.watch('acompte') || 0;
  const netAPayer = totalTTC - acompte;

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (order.length === 0) {
        toast({
          title: "Commande vide",
          description: "Veuillez ajouter au moins un article.",
          variant: "destructive"
        });
        return;
      }
      if (!selectedCustomer) {
        toast({
          title: "Client manquant",
          description: "Veuillez sélectionner un client.",
          variant: "destructive"
        });
        return;
      }

      if (documentType === 'invoice' || documentType === 'credit_note') {
        setCurrentSaleContext(prev => ({
          ...prev,
          isInvoice: true,
          customerId: selectedCustomer?.id,
          acompte,
          subtotal: subTotalHT,
          tax: totalTVA,
          total: totalTTC,
          documentType: documentType
        }));
        setCheckoutOpen(true);
      } else {
        const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
          items: order,
          subtotal: subTotalHT,
          tax: totalTVA,
          total: totalTTC,
          status: documentType,
          payments: [],
          customerId: selectedCustomer.id,
        };
        recordCommercialDocument(doc, documentType, currentSaleId || undefined);
      }
    }
  }));

  const handleEditItemClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const item = allItems.find(i => i.id === itemId);
    if (item) {
        setItemToEdit(item);
        setIsEditItemOpen(true);
    }
  }


  return (
    <div className="flex flex-col h-full">
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
                                      <p className="text-sm font-bold">{item.price.toFixed(2)}€</p>
                                  </div>
                              ))}
                          </div>
                      </ScrollArea>
                  </Card>
              )}
          </div>
          <div className="w-full lg:w-auto">
              <Card className="w-full lg:w-[350px]">
                  <CardContent className="p-4 relative">
                       <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setCustomerSearchOpen(true)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {selectedCustomer ? (
                          <div className="space-y-1 text-sm">
                              <button onClick={() => setEditCustomerOpen(true)} className="font-semibold text-base hover:underline text-left">{selectedCustomer.name}</button>
                              <p className="text-muted-foreground">{selectedCustomer.address}</p>
                              <p className="text-muted-foreground">{selectedCustomer.postalCode} {selectedCustomer.city}</p>
                          </div>
                      ) : (
                           <div className="text-center text-muted-foreground py-1">
                              {selectedCustomer === null && <Label>Client</Label>}
                              <p>Aucun client sélectionné.</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
        </div>

      <div className="flex justify-between items-center mt-4 mb-2">
          
        </div>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
           <div className="flex items-center gap-2">
                 <h3 className="text-lg font-semibold">Détails de la pièce</h3>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Columns className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {columns.map(column => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            checked={visibleColumns[column.id]}
                                            onCheckedChange={(checked) => handleColumnVisibilityChange(column.id, checked)}
                                        >
                                            {column.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.discount}
                                        onCheckedChange={(checked) => handleColumnVisibilityChange('discount', checked)}
                                    >
                                        Remise %
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Type de prix</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={priceDisplayType} onValueChange={handlePriceDisplayChange}>
                                    <DropdownMenuRadioItem value="ht">Hors Taxe (HT)</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="ttc">Toutes Taxes Comprises (TTC)</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Options d'affichage</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
            {order.length > 0 && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOrder([])}>
                <Trash2 className="mr-2 h-4 w-4" />
                Tout effacer
              </Button>
            )}
        </CardHeader>
        <CardContent className="p-0 sm:p-6 flex-1 flex flex-col">
          <Form {...form}>
            <form className="flex-1 flex flex-col h-full">
              <div className="flex-1 min-h-0 flex flex-col">
                  {watchItems.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                           <p>Aucun article dans la commande.</p>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="grid items-center font-semibold text-sm text-muted-foreground px-3 py-2 border-b gap-x-4"
                          style={{
                            gridTemplateColumns: `
                                ${visibleColumns.reference ? '1fr' : ''} 
                                ${visibleColumns.designation ? '3fr' : ''} 
                                ${visibleColumns.quantity ? '0.5fr' : ''} 
                                ${priceDisplayType === 'ht' ? '1fr' : ''} 
                                ${priceDisplayType === 'ttc' ? '1fr' : ''} 
                                ${visibleColumns.vat_code ? '0.7fr' : ''} 
                                ${visibleColumns.discount ? '0.7fr' : ''} 
                                ${priceDisplayType === 'ht' ? '1fr' : ''} 
                                ${priceDisplayType === 'ttc' ? '1fr' : ''}
                                min-content
                              `.replace(/\s+/g, ' ').trim()
                          }}
                        >
                          {visibleColumns.reference && <span>Réf.</span>}
                          {visibleColumns.designation && <span>Désignation</span>}
                          {visibleColumns.quantity && <span className="text-right">Qté</span>}
                          {priceDisplayType === 'ht' && <span className="text-right">P.U. HT</span>}
                          {priceDisplayType === 'ttc' && <span className="text-right">P.U. TTC</span>}
                          {visibleColumns.vat_code && <span className="text-center">TVA</span>}
                          {visibleColumns.discount && <span className="text-center">Rem. %</span>}
                          {priceDisplayType === 'ht' && <span className="text-right">Total HT</span>}
                          {priceDisplayType === 'ttc' && <span className="text-right">Total TTC</span>}
                          <span />
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="space-y-2">
                            {watchItems.map((field, index) => {
                              const fullItem = allItems?.find(i => i.id === field.itemId);
                              const vatInfo = vatRates?.find(v => v.id === fullItem?.vatId);
                              const priceHT = vatInfo ? field.price / (1 + vatInfo.rate / 100) : field.price;

                              return (
                              <div 
                                key={field.id} 
                                className="grid items-center py-2 border-b group gap-x-4"
                                style={{
                                    gridTemplateColumns: `
                                        ${visibleColumns.reference ? '1fr' : ''} 
                                        ${visibleColumns.designation ? '3fr' : ''} 
                                        ${visibleColumns.quantity ? '0.5fr' : ''} 
                                        ${priceDisplayType === 'ht' ? '1fr' : ''} 
                                        ${priceDisplayType === 'ttc' ? '1fr' : ''} 
                                        ${visibleColumns.vat_code ? '0.7fr' : ''} 
                                        ${visibleColumns.discount ? '0.7fr' : ''} 
                                        ${priceDisplayType === 'ht' ? '1fr' : ''} 
                                        ${priceDisplayType === 'ttc' ? '1fr' : ''}
                                        min-content
                                      `.replace(/\s+/g, ' ').trim()
                                  }}
                                >
                                  {visibleColumns.reference && <span className="text-xs text-muted-foreground font-mono">{field.barcode}</span>}
                                  {visibleColumns.designation && 
                                  <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold">{field.name}</span>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                                            onClick={(e) => handleEditItemClick(e, field.itemId)}
                                          >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                         <Popover open={editingNoteId === field.id} onOpenChange={(open) => !open && setEditingNoteId(null)}>
                                          <PopoverTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={() => setEditingNoteId(field.id)}
                                            >
                                              <StickyNote className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80" align="start">
                                            <NoteEditor 
                                              orderItem={field}
                                              onSave={(note) => {
                                                updateItemNote(field.id, note);
                                                setEditingNoteId(null);
                                              }}
                                              onCancel={() => setEditingNoteId(null)}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">
                                          {descriptionDisplay === 'first' && field.description}
                                          {descriptionDisplay === 'both' && (
                                              <>
                                                  {field.description}
                                                  {field.description && field.description2 && <br />}
                                                  {field.description2}
                                              </>
                                          )}
                                      </div>
                                      {field.selectedVariants && field.selectedVariants.length > 0 && (
                                          <p className="text-xs text-muted-foreground capitalize mt-1">
                                              {field.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                          </p>
                                      )}
                                      {field.note && <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1 pr-2 whitespace-pre-wrap italic">Note: {field.note}</p>}
                                      {field.serialNumbers && field.serialNumbers.length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <span className="font-semibold">N/S:</span> {field.serialNumbers.filter(sn => sn).join(', ')}
                                        </div>
                                      )}
                                  </div>
                                  }
                                {visibleColumns.quantity && <Controller control={form.control} name={`items.${index}.quantity`} render={({ field: controllerField }) => (<Input type="number" {...controllerField} value={controllerField.value || 1} onChange={e => { const newQty = parseInt(e.target.value, 10) || 1; controllerField.onChange(newQty); updateItemQuantityInOrder(field.id, newQty); }} onFocus={e => e.target.select()} min={1} className="text-right bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto no-spinner w-12 ml-auto block" />)} />}
                                
                                {priceDisplayType === 'ht' 
                                    ? <Controller control={form.control} name={`items.${index}.price`} render={({ field: { onChange, ...restField } }) => <Input type="number" {...restField} value={priceHT.toFixed(2)} onBlur={e => { const htValue = parseFloat(e.target.value) || 0; if (vatInfo) { const ttcValue = htValue * (1 + vatInfo.rate / 100); updateItemPrice(field.id, ttcValue); } }} onChange={() => {}} onFocus={e => e.target.select()} className="text-right bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto no-spinner" step="0.01" />} />
                                    : <Controller control={form.control} name={`items.${index}.price`} render={({ field: controllerField }) => <Input type="number" {...controllerField} value={Number(controllerField.value).toFixed(2)} onBlur={e => updateItemPrice(field.id, parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} className="text-right bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto font-medium no-spinner" step="0.01" />} />
                                }

                                {visibleColumns.vat_code && <div className="text-center font-mono">{vatInfo?.code || '-'}</div>}
                                
                                {visibleColumns.discount && <Controller control={form.control} name={`items.${index}.remise`} render={({ field: controllerField }) => (<Input type="number" {...controllerField} value={controllerField.value ?? 0} onBlur={e => { const discountValue = parseFloat(e.target.value) || 0; applyDiscount(field.id, discountValue, 'percentage'); }} onChange={(e) => controllerField.onChange(e.target.value)} onFocus={e => e.target.select()} min={0} max={100} className="text-center bg-transparent border-none ring-0 focus-visible:ring-0 p-0 h-auto no-spinner" step="0.01" />)}/>}
                                
                                {priceDisplayType === 'ht' && <div className="text-right">{(() => { const item = watchItems[index]; if(!item || !item.itemId) return '0.00€'; const remise = item.remise || 0; const total = priceHT * item.quantity * (1 - (remise || 0) / 100); return `${total.toFixed(2)}€` })()}</div>}
                                {priceDisplayType === 'ttc' && <div className="text-right font-bold">{(() => { const item = watchItems[index]; if(!item || !item.itemId) return '0.00€'; const remise = item.remise || 0; const total = item.price * item.quantity * (1 - (remise || 0) / 100); return `${total.toFixed(2)}€` })()}</div>}
                              
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeFromOrder(field.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )})}
                          </div>
                        </ScrollArea>
                      </>
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
                              <div className="flex justify-between items-center font-bold text-lg">
                                  <span>Total TTC</span>
                                  <span>{totalTTC.toFixed(2)}€</span>
                              </div>
                              {showAcompte && (
                                  <div className="flex justify-between items-center">
                                      <Label htmlFor="acompte">Acompte (€)</Label>
                                      <Controller control={form.control} name="acompte" render={({ field }) => (
                                          <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min={0} className="max-w-[100px] text-right" placeholder="0.00"/>
                                      )}/>
                                  </div>
                              )}
                               <div className="flex justify-between items-center text-primary font-bold text-xl bg-primary/10 p-2 rounded-md">
                                  <span>Net à Payer</span>
                                  <span>{netAPayer.toFixed(2)}€</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <CustomerSelectionDialog isOpen={isCustomerSearchOpen} onClose={() => setCustomerSearchOpen(false)} onCustomerSelected={onCustomerSelected} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} totalAmount={totalTTC} />
      <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={selectedCustomer} />
      {isEditItemOpen && itemToEdit && (
          <EditItemDialog
              item={itemToEdit}
              isOpen={isEditItemOpen}
              onClose={() => {
                  setIsEditItemOpen(false);
                  setItemToEdit(null);
              }}
              onItemUpdated={(updatedItem) => {
                   setOrder(currentOrder => 
                    currentOrder.map(orderItem => 
                      orderItem.itemId === updatedItem.id 
                        ? { ...orderItem, name: updatedItem.name, price: updatedItem.price, description: updatedItem.description, description2: updatedItem.description2, barcode: updatedItem.barcode }
                        : orderItem
                    )
                  );
              }}
          />
      )}
    </div>
  );
});

CommercialOrderForm.displayName = "CommercialOrderForm";
