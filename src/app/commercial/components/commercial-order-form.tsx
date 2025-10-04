
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, Item } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

const orderItemSchema = z.object({
  itemId: z.string().min(1, 'Article requis.'),
  name: z.string(),
  quantity: z.coerce.number().min(1, 'Qté > 0.'),
  price: z.coerce.number(),
  remise: z.coerce.number().min(0).max(100).optional(),
});

const FormSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Ajoutez au moins un article.'),
  escompte: z.coerce.number().optional(),
  port: z.coerce.number().optional(),
  acompte: z.coerce.number().optional(),
});

type CommercialOrderFormValues = z.infer<typeof FormSchema>;

export function CommercialOrderForm() {
  const { items: allItems, customers, isLoading, vatRates, addCustomer } = usePos();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isItemSearchOpen, setItemSearchOpen] = useState(false);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);

  const form = useForm<CommercialOrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
      escompte: 0,
      port: 0,
      acompte: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchItems = form.watch('items');

  const onCustomerAdded = (newCustomer: Customer) => {
    setSelectedCustomer(newCustomer);
    form.setValue('customerId', newCustomer.id);
  }

  const handleAddItem = (item: Item) => {
    append({
        itemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        remise: 0
    });
    setItemSearchOpen(false);
  }
  
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

  const escompte = form.watch('escompte') || 0;
  const totalHTAvecEscompte = subTotalHT * (1 - escompte / 100);

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
        const totalItemHTAvecEscompte = totalItemHT * (1 - escompte / 100);
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
  }, [watchItems, allItems, vatRates, escompte]);
  
  const totalTVA = Object.values(vatBreakdown).reduce((acc, { total }) => acc + total, 0);
  const port = form.watch('port') || 0;
  const totalTTC = totalHTAvecEscompte + totalTVA + port;
  const acompte = form.watch('acompte') || 0;
  const netAPayer = totalTTC - acompte;

  function onSubmit(data: CommercialOrderFormValues) {
    console.log(data);
    toast({ title: 'Facture générée (simulation)' });
  }

  return (
    <>
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column for general info */}
              <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input readOnly value={format(new Date(), 'dd/MM/yyyy', {locale: fr})} />
                </div>
                <div className="space-y-2">
                    <Label>Numéro de Facture</Label>
                    <Input readOnly value="501304" />
                </div>
              </div>
              
              {/* Right Column for customer info */}
              <div className="space-y-2">
                <Label>Client</Label>
                <div className="flex gap-2">
                  <Popover open={isCustomerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={isCustomerSearchOpen} className="w-full justify-start">
                        {selectedCustomer ? selectedCustomer.name : "Rechercher un client..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher un client..." />
                        <CommandList>
                          <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                          <CommandGroup>
                            {customers && customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                onSelect={() => {
                                  setSelectedCustomer(customer);
                                  form.setValue('customerId', customer.id);
                                  setCustomerSearchOpen(false);
                                }}
                              >
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button type="button" size="icon" onClick={() => setAddCustomerOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCustomer && (
                  <div className="text-sm border p-2 rounded-md bg-muted/50 mt-2">
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    <p>{selectedCustomer.address}</p>
                    <p>{selectedCustomer.postalCode} {selectedCustomer.city}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />
            
            {/* Items */}
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label>Ajouter un article</Label>
                 <Popover open={isItemSearchOpen} onOpenChange={setItemSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isItemSearchOpen}
                        className="w-full justify-between"
                      >
                        Rechercher un article à ajouter...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher un article..." />
                        <CommandList>
                          <CommandEmpty>Aucun article trouvé.</CommandEmpty>
                          <CommandGroup>
                            {allItems?.map((item) => (
                              <CommandItem
                                key={item.id}
                                onSelect={() => handleAddItem(item)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    fields.some(f => f.itemId === item.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex-1 overflow-auto pr-4 -mr-4">
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                  <span>Désignation</span>
                  <span className="text-right">Qté</span>
                  <span className="text-right">P.U. TTC</span>
                  <span className="text-right">Remise %</span>
                  <span className="text-right">Total TTC</span>
                  <span></span>
                </div>
                <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] gap-4 items-start">
                    <Input readOnly value={field.name} className="bg-muted/50" />
                    <Controller
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field: controllerField }) => (
                            <Input type="number" {...controllerField} onChange={e => controllerField.onChange(parseInt(e.target.value) || 0)} min={1} className="text-right" />
                        )}
                    />
                    <Controller
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field: controllerField }) => (
                            <Input type="number" step="0.01" {...controllerField} onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)} className="text-right" />
                        )}
                    />
                     <Controller
                        control={form.control}
                        name={`items.${index}.remise`}
                        render={({ field: controllerField }) => (
                            <Input type="number" {...controllerField} onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)} min={0} max={100} className="text-right" />
                        )}
                    />
                  <div className="font-medium h-10 flex items-center justify-end px-3">
                    {(() => {
                        const item = watchItems[index];
                        if(!item || !item.itemId) return '0.00€';
                        const total = item.price * item.quantity * (1 - (item.remise || 0) / 100);
                        return `${total.toFixed(2)}€`
                    })()}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              </div>
              {fields.length === 0 && (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                    Aucun article dans la commande.
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Footer */}
            <div className="mt-auto pt-6">
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
                            <Label>Prix Total HT</Label>
                            <span className="font-medium">{subTotalHT.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="escompte">Escompte (%)</Label>
                            <Controller control={form.control} name="escompte" render={({ field }) => (
                                 <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min={0} max={100} className="max-w-[100px] text-right" placeholder="0"/>
                            )} />
                        </div>
                         <Separator />
                         <div className="flex justify-between items-center">
                            <Label>Total HT</Label>
                            <span className="font-medium">{totalHTAvecEscompte.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label>Cumul TVA</Label>
                            <span className="font-medium">{totalTVA.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="port">Port TTC (€)</Label>
                             <Controller control={form.control} name="port" render={({ field }) => (
                                 <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min={0} className="max-w-[100px] text-right" placeholder="0.00"/>
                            )} />
                        </div>
                         <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total TTC</span>
                            <span>{totalTTC.toFixed(2)}€</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <Label htmlFor="acompte">Acompte (€)</Label>
                             <Controller control={form.control} name="acompte" render={({ field }) => (
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min={0} className="max-w-[100px] text-right" placeholder="0.00"/>
                            )} />
                        </div>
                        <div className="flex justify-between items-center text-primary font-bold text-xl bg-primary/10 p-2 rounded-md">
                            <span>Net à Payer</span>
                            <span>{netAPayer.toFixed(2)}€</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <Button size="lg" type="submit">Générer la facture</Button>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerAdded} />
    </>
  );
}
