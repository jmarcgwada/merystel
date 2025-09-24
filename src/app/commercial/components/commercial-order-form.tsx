
'use client';

import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1, { message: 'Article requis' }),
    quantity: z.number().min(1, { message: 'Qté > 0' }),
  })).min(1, 'Ajoutez au moins un article.'),
});

type CommercialOrderFormValues = z.infer<typeof FormSchema>;

interface CommercialOrderFormProps {
  onOrderConfirm: (orderItems: OrderItem[]) => void;
}

export function CommercialOrderForm({ onOrderConfirm }: CommercialOrderFormProps) {
  const { items: allItems } = usePos();
  const { toast } = useToast();

  const form = useForm<CommercialOrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [{ itemId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  function onSubmit(data: CommercialOrderFormValues) {
    const orderItems: OrderItem[] = data.items.map(item => {
        const product = allItems.find(p => p.id === item.itemId);
        if (!product) throw new Error('Produit non trouvé');
        return {
            ...product,
            quantity: item.quantity,
            total: product.price * item.quantity,
        };
    });
    onOrderConfirm(orderItems);
    toast({ title: 'Commande prête pour le paiement.' });
  }

  const watchItems = form.watch('items');
  const selectedItemIds = watchItems.map(item => item.itemId);

  const availableItems = allItems.filter(item => !selectedItemIds.includes(item.id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => {
            const currentItemId = watchItems[index]?.itemId;
            const currentItem = allItems.find(i => i.id === currentItemId);

            return (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className={cn(index !== 0 && "sr-only")}>Article</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un article" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentItem && <SelectItem value={currentItem.id}>{currentItem.name}</SelectItem>}
                          {availableItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                       <FormLabel className={cn(index !== 0 && "sr-only")}>Quantité</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            min={1}
                            onFocus={(e) => e.target.select()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-3">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>Prix Total</FormLabel>
                    <div className="font-medium h-10 flex items-center px-3">
                        {currentItem ? `${(currentItem.price * (watchItems[index]?.quantity || 0)).toFixed(2)}€` : '0.00€'}
                    </div>
                </div>

                <div className={cn("col-span-1", index === 0 && "pt-8")}>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
            <Button
                type="button"
                variant="outline"
                onClick={() => append({ itemId: '', quantity: 1 })}
            >
                Ajouter une ligne
            </Button>
            <Button type="submit">Confirmer la commande</Button>
        </div>
      </form>
    </Form>
  );
}
