'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Item } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  price: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }).optional(),
  categoryId: z.string().min(1, { message: 'Veuillez sélectionner une catégorie.' }),
  vatId: z.string().min(1, { message: 'Veuillez sélectionner un taux de TVA.' }),
  description: z.string().optional(),
  description2: z.string().optional(),
  barcode: z.string().min(1, { message: 'Le code-barres est obligatoire.' }),
  marginPercentage: z.coerce.number().optional(),
  additionalCosts: z.coerce.number().optional(),
});

type ItemFormValues = z.infer<typeof formSchema>;

interface EditItemDialogProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updatedItem: Item) => void;
}

export function EditItemDialog({ item, isOpen, onClose, onItemUpdated }: EditItemDialogProps) {
  const { toast } = useToast();
  const { categories, vatRates, updateItem } = usePos();
  const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const { control, watch, setValue, reset } = form;

  const watchedPrice = watch('price');
  const watchedPurchasePrice = watch('purchasePrice');
  const watchedAdditionalCosts = watch('additionalCosts');
  const watchedMarginPercentage = watch('marginPercentage');
  const watchedVatId = watch('vatId');

  const vatRateInfo = useMemo(() => vatRates?.find(v => v.id === watchedVatId), [watchedVatId, vatRates]);
  const costPrice = useMemo(() => {
    const purchasePrice = watchedPurchasePrice || 0;
    const additionalCostsPercent = watchedAdditionalCosts || 0;
    return purchasePrice * (1 + additionalCostsPercent / 100);
  }, [watchedPurchasePrice, watchedAdditionalCosts]);

  useEffect(() => {
    if (isManualPriceEdit || !vatRateInfo || costPrice <= 0) return;
    const marginPercentage = watchedMarginPercentage || 0;
    const calculatedPriceHT = costPrice * (1 + marginPercentage / 100);
    const priceTTC = calculatedPriceHT * (1 + vatRateInfo.rate / 100);
    if (Number(watchedPrice || 0).toFixed(2) !== priceTTC.toFixed(2)) {
      setValue('price', parseFloat(priceTTC.toFixed(2)));
    }
  }, [costPrice, watchedMarginPercentage, vatRateInfo, setValue, isManualPriceEdit, watchedPrice]);

  useEffect(() => {
    if (!isManualPriceEdit || !vatRateInfo || costPrice <= 0) return;
    const price = watchedPrice || 0;
    const calculatedPriceHT = price / (1 + vatRateInfo.rate / 100);
    if (calculatedPriceHT < costPrice) {
      setValue('marginPercentage', 0);
    } else {
      const newMarginPercentage = ((calculatedPriceHT / costPrice) - 1) * 100;
      setValue('marginPercentage', parseFloat(newMarginPercentage.toFixed(2)));
    }
  }, [watchedPrice, costPrice, vatRateInfo, setValue, isManualPriceEdit]);

  const priceHT = useMemo(() => {
    if (!vatRateInfo) return 0;
    return (watchedPrice || 0) / (1 + vatRateInfo.rate / 100);
  }, [watchedPrice, vatRateInfo]);

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        price: item.price,
        purchasePrice: item.purchasePrice || 0,
        categoryId: item.categoryId,
        vatId: item.vatId,
        description: item.description || '',
        description2: item.description2 || '',
        barcode: item.barcode || '',
        marginPercentage: item.marginPercentage || 0,
        additionalCosts: item.additionalCosts || 0,
      });
    }
  }, [item, reset]);

  async function onSubmit(data: ItemFormValues) {
    if (!item) return;

    const updatedItem = {
      ...item,
      ...data,
    };
    await updateItem(updatedItem);
    onItemUpdated(updatedItem);
    toast({ title: 'Article modifié', description: `L'article "${data.name}" a été mis à jour.` });
    onClose();
  }

  if (!isOpen || !item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>Ajustez les détails de l'article.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              <TabsList>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="pricing">Prix</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="details" className="p-1">
                  <Card className="border-none shadow-none">
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={control} name="name" render={({ field }) => <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={control} name="barcode" render={({ field }) => <FormItem><FormLabel>Code-barres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={control} name="description2" render={({ field }) => <FormItem><FormLabel>Description 2</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
                      </div>
                      <FormField control={control} name="categoryId" render={({ field }) => <FormItem><FormLabel>Catégorie</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="pricing" className="p-1">
                  <Card className="border-none shadow-none">
                    <CardContent className="space-y-6 pt-6">
                      <FormField control={control} name="vatId" render={({ field }) => <FormItem><FormLabel>TVA</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{vatRates?.map(v => <SelectItem key={v.id} value={v.id}>[{v.code}] {v.name} ({v.rate}%)</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={control} name="purchasePrice" render={({ field }) => <FormItem><FormLabel>Prix d'achat (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={control} name="additionalCosts" render={({ field }) => <FormItem><FormLabel>Coûts additionnels (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                      </div>
                      <FormField control={control} name="marginPercentage" render={({ field }) => <FormItem><FormLabel>Marge %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                      <Separator />
                      <div className="grid grid-cols-2 gap-6 items-end">
                        <FormItem><FormLabel>Prix de vente HT (€)</FormLabel><FormControl><Input type="number" value={priceHT.toFixed(2)} readOnly className="bg-muted" /></FormControl></FormItem>
                        <FormField control={control} name="price" render={({ field }) => <FormItem><FormLabel>Prix de vente TTC (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={() => setIsManualPriceEdit(true)} onBlur={() => setIsManualPriceEdit(false)} className="bg-background text-base font-bold" /></FormControl><FormMessage /></FormItem>} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter className="mt-auto pt-4 border-t">
              <Button variant="outline" onClick={onClose} type="button">Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
