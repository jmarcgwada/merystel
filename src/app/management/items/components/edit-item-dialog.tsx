
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useForm, Controller, useFieldArray, type Control } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Item, Category, Timestamp, Supplier } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, PlusCircle, Trash2, Upload, Link as LinkIcon, Plus } from 'lucide-react';
import { AddCategoryDialog } from '@/app/management/categories/components/add-category-dialog';
import { AddSupplierDialog } from '@/app/management/suppliers/components/add-supplier-dialog';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from '@/components/ui/checkbox';

const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | string | undefined; formatString: string }) => {
  const [formatted, setFormatted] = useState('');
  useEffect(() => {
    if (date) {
      let jsDate: Date;
      if (date instanceof Date) {
        jsDate = date;
      } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
        jsDate = (date as Timestamp).toDate();
      } else {
        jsDate = new Date(date as any);
      }
      
      if (!isNaN(jsDate.getTime())) {
        setFormatted(format(jsDate, formatString, { locale: fr }));
      }
    }
  }, [date, formatString]);
  return <>{formatted}</>;
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  price: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }).optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  vatId: z.string().min(1, { message: 'Veuillez sélectionner un taux de TVA.' }),
  description: z.string().optional(),
  description2: z.string().optional(),
  isFavorite: z.boolean().default(false),
  image: z.string().optional(),
  showImage: z.boolean().default(true),
  barcode: z.string().min(1, { message: 'Le code-barres est obligatoire.' }),
  marginPercentage: z.coerce.number().optional(),
  requiresSerialNumber: z.boolean().default(false),
  additionalCosts: z.coerce.number().optional(),
  manageStock: z.boolean().default(false),
  stock: z.coerce.number().optional(),
  lowStockThreshold: z.coerce.number().optional(),
  isDisabled: z.boolean().default(false),
  forceDescriptionDisplay: z.boolean().default(false),
  hasVariants: z.boolean().default(false),
  variantOptions: z.array(z.object({
    name: z.string().min(1, { message: "Le nom est requis." }),
    values: z.array(z.object({
        value: z.string().min(1, { message: "La valeur est requise." })
    })).min(1, { message: "Au moins une valeur est requise." })
  })).optional(),
});

type ItemFormValues = z.infer<typeof formSchema>;

interface EditItemDialogProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onItemSaved?: () => void;
}

const VariantValues = ({ control, optionIndex }: { control: Control<ItemFormValues>; optionIndex: number }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantOptions.${optionIndex}.values` as const,
  });

  return (
    <div className="space-y-2 pl-4 border-l-2">
      <FormLabel>Valeurs</FormLabel>
      <FormDescription>Utilisez '*' pour permettre une saisie manuelle.</FormDescription>
      {fields.map((field, valueIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`variantOptions.${optionIndex}.values.${valueIndex}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="ex: S, M, Rouge, Bleu... ou *" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(valueIndex)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Ajouter une valeur
      </Button>
    </div>
  );
};


export function EditItemDialog({ item, isOpen, onClose, onItemSaved }: EditItemDialogProps) {
  const { toast } = useToast();
  const { items, categories, suppliers, vatRates, addItem, updateItem } = usePos();
  const isEditMode = !!item;

  const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);
  const [isAddCategoryOpen, setAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setAddSupplierOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '', price: 0, purchasePrice: 0, categoryId: '', supplierId: '', vatId: '',
      description: '', description2: '', isFavorite: false, image: '', showImage: true,
      barcode: '', marginPercentage: 30, requiresSerialNumber: false, additionalCosts: 0,
      manageStock: false, stock: 0, lowStockThreshold: 0, isDisabled: false, forceDescriptionDisplay: false,
      hasVariants: false, variantOptions: [],
    },
  });

  const { control, watch, setValue, reset } = form;
  
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control, name: "variantOptions"
  });

  const watchedImage = watch('image');
  const watchedName = watch('name');
  const watchedPrice = watch('price');
  const watchedPurchasePrice = watch('purchasePrice');
  const watchedAdditionalCosts = watch('additionalCosts');
  const watchedMarginPercentage = watch('marginPercentage');
  const watchedVatId = watch('vatId');
  const watchedManageStock = watch('manageStock');
  const watchedHasVariants = watch('hasVariants');

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
    if(isOpen) {
        if (isEditMode && item) {
          reset({
            name: item.name, price: item.price, purchasePrice: item.purchasePrice || 0,
            categoryId: item.categoryId, supplierId: item.supplierId, vatId: item.vatId,
            description: item.description || '', description2: item.description2 || '',
            isFavorite: item.isFavorite || false, image: item.image, showImage: item.showImage ?? true,
            barcode: item.barcode || '', marginPercentage: item.marginPercentage || 0,
            requiresSerialNumber: item.requiresSerialNumber || false, additionalCosts: item.additionalCosts || 0,
            manageStock: item.manageStock || false, stock: item.stock || 0,
            lowStockThreshold: item.lowStockThreshold || 0, isDisabled: item.isDisabled || false,
            forceDescriptionDisplay: item.forceDescriptionDisplay || false,
            hasVariants: item.hasVariants || false,
            variantOptions: item.variantOptions?.map(opt => ({ name: opt.name, values: opt.values.map(val => ({ value: val }))})) || [],
          });
        } else {
          reset({
            name: '', price: 0, purchasePrice: 0, categoryId: '', supplierId: '', vatId: '',
            description: '', description2: '', isFavorite: false, image: `https://picsum.photos/seed/new/200/150`,
            showImage: true, barcode: '', marginPercentage: 30, requiresSerialNumber: false,
            additionalCosts: 0, manageStock: false, stock: 0, lowStockThreshold: 0,
            isDisabled: false, forceDescriptionDisplay: false, hasVariants: false, variantOptions: [],
          });
        }
    }
  }, [isOpen, isEditMode, item, reset]);

  async function onSubmit(data: ItemFormValues) {
    const barcodeExists = items.some(i => i.barcode === data.barcode && i.id !== item?.id);
    if (barcodeExists) {
        form.setError('barcode', { type: 'manual', message: 'Ce code-barres est déjà utilisé.' });
        toast({ variant: 'destructive', title: 'Code-barres dupliqué' });
        return;
    }
    
    const submissionData: Omit<Item, 'id'|'createdAt'|'updatedAt'> & {id?: string} = {
        ...data,
        supplierId: data.supplierId === 'none' ? undefined : data.supplierId,
        variantOptions: data.hasVariants ? data.variantOptions?.map(opt => ({
            name: opt.name,
            values: opt.values.map(val => val.value)
        })) : [],
    };

    if (isEditMode && item) {
      await updateItem({ ...item, ...submissionData });
      toast({ title: 'Article modifié', description: `L'article "${data.name}" a été mis à jour.` });
    } else {
      await addItem({ ...submissionData } as Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { barcode: string });
      toast({ title: 'Article créé', description: `L'article "${data.name}" a été ajouté.` });
    }
    if (onItemSaved) onItemSaved();
    onClose();
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('image', reader.result as string);
        toast({ title: 'Image téléversée avec succès !' });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{isEditMode ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
            {isEditMode && item?.createdAt && (
                <div className="pt-1 text-xs text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />Créé le: <ClientFormattedDate date={item.createdAt} formatString="d MMM yyyy, HH:mm" /></span>
                    {item.updatedAt && (
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Modifié le: <ClientFormattedDate date={item.updatedAt} formatString="d MMM yyyy, HH:mm" /></span>
                    )}
                </div>
            )}
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
              <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
                <div className="px-6">
                  <TabsList>
                      <TabsTrigger value="details">Détails</TabsTrigger>
                      <TabsTrigger value="pricing">Prix</TabsTrigger>
                      <TabsTrigger value="stock">Stock</TabsTrigger>
                      <TabsTrigger value="image">Image & Visibilité</TabsTrigger>
                      <TabsTrigger value="variants">Déclinaisons</TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto mt-2">
                    <TabsContent value="details" className="p-6 pt-2">
                        <Card className="border-none shadow-none -m-6">
                            <CardContent className="space-y-6 pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>Code-barres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="description2" render={({ field }) => (<FormItem><FormLabel>Description 2</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="categoryId" render={({ field }) => (
                                    <FormItem><FormLabel>Catégorie</FormLabel><div className="flex items-center gap-2">
                                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choisir..."/></SelectTrigger></FormControl><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                        <Button variant="outline" size="icon" type="button" onClick={() => setAddCategoryOpen(true)}><Plus className="h-4 w-4" /></Button>
                                    </div><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="supplierId" render={({ field }) => (
                                    <FormItem><FormLabel>Fournisseur</FormLabel><div className="flex items-center gap-2">
                                        <Select onValueChange={field.onChange} value={field.value || 'none'}><FormControl><SelectTrigger><SelectValue placeholder="Aucun"/></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Aucun</SelectItem>{suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                                        <Button variant="outline" size="icon" type="button" onClick={() => setAddSupplierOpen(true)}><Plus className="h-4 w-4" /></Button>
                                    </div><FormMessage /></FormItem>
                                )}/>
                              </div>
                                <FormField control={form.control} name="forceDescriptionDisplay" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Forcer l'affichage de la description</FormLabel><FormDescription>Si activé, la description sera toujours visible sur les documents.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="pricing" className="p-6 pt-2">
                        <Card className="border-none shadow-none -m-6">
                            <CardContent className="space-y-6 pt-6">
                              <FormField control={form.control} name="vatId" render={({ field }) => (<FormItem><FormLabel>TVA</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{vatRates?.map(v => <SelectItem key={v.id} value={v.id}>[{v.code}] {v.name} ({v.rate}%)</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                              <div className="grid grid-cols-2 gap-6">
                                <FormField control={form.control} name="purchasePrice" render={({ field }) => (<FormItem><FormLabel>Prix d'achat (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="additionalCosts" render={({ field }) => (<FormItem><FormLabel>Coûts additionnels (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              </div>
                              <FormField control={form.control} name="marginPercentage" render={({ field }) => (<FormItem><FormLabel>Marge %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <Separator />
                              <div className="grid grid-cols-2 gap-6 items-end">
                                <FormItem><FormLabel>Prix de vente HT (€)</FormLabel><FormControl><Input type="number" value={priceHT.toFixed(2)} readOnly className="bg-muted" /></FormControl></FormItem>
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Prix de vente TTC (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={() => setIsManualPriceEdit(true)} onBlur={() => setIsManualPriceEdit(false)} className="bg-background text-base font-bold" /></FormControl><FormMessage /></FormItem>)} />
                              </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="stock" className="p-6 pt-2">
                        <Card className="border-none shadow-none -m-6">
                            <CardContent className="space-y-6 pt-6">
                                <FormField control={form.control} name="manageStock" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Gérer le stock</FormLabel><FormDescription>Activer le suivi des quantités.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                {watchedManageStock && (
                                    <div className="space-y-6 pt-4 border-t">
                                        <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Quantité en stock</FormLabel><FormControl><Input type="number" placeholder="ex: 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (<FormItem><FormLabel>Seuil de stock bas</FormLabel><FormControl><Input type="number" placeholder="ex: 10" {...field} /></FormControl><FormDescription>Alerte visuelle lorsque le stock atteint ce seuil.</FormDescription><FormMessage /></FormItem>)} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="image" className="p-6 pt-2">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <FormField control={form.control} name="isDisabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Désactiver l'article</FormLabel><FormDescription>L'article ne pourra plus être vendu.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="isFavorite" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Favori</FormLabel><FormDescription>Accès rapide sur la page du POS.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="showImage" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Afficher l'image</FormLabel><FormDescription>Afficher l'image du produit dans le POS.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="requiresSerialNumber" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Exiger un numéro de série</FormLabel><FormDescription>Demander la saisie d'un N/S à la vente.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            </div>
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader><CardTitle>Image</CardTitle><CardDescription>Aperçu de la carte.</CardDescription></CardHeader>
                                    <CardContent className="flex flex-col items-center gap-4">
                                        <div className="w-full max-w-[200px]">
                                            <Card className="flex flex-col overflow-hidden"><div className="relative aspect-video w-full"><Image src={watchedImage || 'https://picsum.photos/seed/placeholder/200/150'} alt={watchedName || "Aperçu"} width={200} height={150} className="object-cover" /></div><div className="flex-1 p-3"><h3 className="font-semibold leading-tight truncate">{watchedName || "Nom"}</h3></div><div className="flex items-center justify-between p-3 pt-0"><span className="text-lg font-bold text-primary">{Number(watchedPrice || 0).toFixed(2)}€</span><PlusCircle className="w-6 h-6 text-muted-foreground" /></div></Card>
                                        </div>
                                        <div className="w-full space-y-4">
                                            <div className="grid gap-2"><Label htmlFor="item-image-url">URL de l'image</Label><div className="flex items-center"><LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" /><Input id="item-image-url" value={(watchedImage || '').startsWith('data:') ? '' : (watchedImage || '')} onChange={e => setValue('image', e.target.value)} placeholder="https://..." className="pl-9"/></div></div>
                                            <div className="flex items-center gap-2"><Separator className="flex-1"/><span className="text-xs text-muted-foreground">OU</span><Separator className="flex-1"/></div>
                                            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Téléverser</Button>
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="variants" className="p-6 pt-2">
                        <Card className="border-none shadow-none -m-6">
                            <CardHeader><CardTitle>Déclinaisons</CardTitle><CardDescription>Gérez les versions de cet article (tailles, couleurs...).</CardDescription></CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <FormField control={form.control} name="hasVariants" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Activer les déclinaisons</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                {watchedHasVariants && (
                                    <div className="space-y-4 pt-4 border-t">
                                        {variantFields.map((field, index) => (
                                            <Card key={field.id} className="p-4"><div className="flex items-center justify-between mb-4"><h4 className="font-semibold">Option #{index + 1}</h4><Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div><div className="grid grid-cols-1 gap-4"><FormField control={form.control} name={`variantOptions.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="ex: Taille, Couleur..." {...field} /></FormControl><FormMessage /></FormItem>)} /><VariantValues control={control} optionIndex={index} /></div></Card>
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => appendVariant({ name: '', values: [{ value: '' }] })}><PlusCircle className="mr-2 h-4 w-4" />Ajouter une option</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
              </Tabs>
              <DialogFooter className="p-6 border-t">
                <Button variant="outline" onClick={onClose} type="button">Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AddCategoryDialog isOpen={isAddCategoryOpen} onClose={() => setAddCategoryOpen(false)} onCategoryAdded={(c) => setValue('categoryId', c.id)} />
      <AddSupplierDialog isOpen={isAddSupplierOpen} onClose={() => setAddSupplierOpen(false)} onSupplierAdded={(s) => setValue('supplierId', s.id)} />
    </>
  );
}
