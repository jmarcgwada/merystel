
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, PlusCircle, RefreshCw, Sparkles } from 'lucide-react';
import type { Item } from '@/lib/types';
import Link from 'next/link';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  price: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }),
  categoryId: z.string().min(1, { message: 'Veuillez sélectionner une catégorie.' }),
  vatId: z.string().min(1, { message: 'Veuillez sélectionner un taux de TVA.' }),
  description: z.string().optional(),
  isFavorite: z.boolean().default(false),
  image: z.string().optional(),
  showImage: z.boolean().default(true),
});

type ItemFormValues = z.infer<typeof formSchema>;

function ItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { items, categories, vatRates, addItem, updateItem, isLoading } = usePos();
  const [isGenerating, setIsGenerating] = useState(false);
  const [defaultImage, setDefaultImage] = useState('');
  const [isClient, setIsClient] = useState(false);

  const itemId = searchParams.get('id');
  const isEditMode = Boolean(itemId);
  const itemToEdit = isEditMode && items ? items.find(i => i.id === itemId) : null;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      categoryId: '',
      vatId: '',
      description: '',
      isFavorite: false,
      image: '',
      showImage: true,
    },
  });

  const { watch, setValue } = form;
  const watchedImage = watch('image');
  const watchedName = watch('name');
  const watchedPrice = watch('price');

  useEffect(() => {
    // This ensures the component has mounted on the client, avoiding hydration issues.
    setIsClient(true);
    // Generate a default image URL only on the client side to avoid hydration mismatch
    setDefaultImage(`https://picsum.photos/seed/${new Date().getTime()}/200/150`);
  }, []);

  useEffect(() => {
    if (isEditMode && itemToEdit) {
      form.reset({
        name: itemToEdit.name,
        price: itemToEdit.price,
        categoryId: itemToEdit.categoryId,
        vatId: itemToEdit.vatId,
        description: itemToEdit.description || '',
        isFavorite: itemToEdit.isFavorite || false,
        image: itemToEdit.image,
        showImage: itemToEdit.showImage ?? true,
      });
    } else if (!isEditMode) {
        form.reset({
          name: '',
          price: 0,
          categoryId: '',
          vatId: '',
          description: '',
          isFavorite: false,
          image: `https://picsum.photos/seed/${itemId || 'new'}/200/150`,
          showImage: true,
        });
    }
  }, [isEditMode, itemToEdit, form, itemId]);

  function onSubmit(data: ItemFormValues) {
    if (isEditMode && itemToEdit) {
      const updatedItem: Item = {
        ...itemToEdit,
        ...data,
        price: Number(data.price),
      };
      updateItem(updatedItem);
      toast({ title: 'Article modifié', description: `L'article "${data.name}" a été mis à jour.` });
    } else {
      addItem(data);
      toast({ title: 'Article créé', description: `L'article "${data.name}" a été ajouté.` });
    }
    router.push('/management/items');
  }

  const handleGenerateImage = async () => {
    const name = form.getValues('name');
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Nom requis',
        description: "Veuillez d'abord entrer un nom pour l'article.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImage(name);
      if (result) {
        setValue('image', result);
        toast({ title: 'Image générée avec succès !' });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur de génération',
        description: "Impossible de générer l'image. Veuillez réessayer.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoading || !isClient) {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
          <PageHeader
            title={isEditMode ? "Modifier l'article" : 'Ajouter un nouvel article'}
          >
            <Skeleton className="h-10 w-40" />
          </PageHeader>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-8">
                 <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </Suspense>
    )
  }

  return (
    <>
      <PageHeader
        title={isEditMode ? "Modifier l'article" : 'Ajouter un nouvel article'}
        subtitle={isEditMode ? "Mettez à jour les détails de l'article ci-dessous." : "Remplissez le formulaire pour créer un produit."}
      >
        <Button variant="outline" asChild>
          <Link href="/management/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </PageHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Détails de l'article</CardTitle>
                <CardDescription>Fournissez les informations principales de votre article.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'article</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Café Latte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Décrivez brièvement l'article..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories && categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux de TVA</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un taux" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vatRates && vatRates.map((vat) => (
                                <SelectItem key={vat.id} value={vat.id}>{vat.name} ({vat.rate}%)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de vente (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="ex: 4.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Statut & Visibilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="isFavorite"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Marquer comme favori</FormLabel>
                                <FormDescription>
                                Accès rapide sur la page du point de vente.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="showImage"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Afficher l'image</FormLabel>
                                <FormDescription>
                                Afficher l'image du produit dans le point de vente.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Image de l'article</CardTitle>
                <CardDescription>Aperçu de la carte telle qu'elle apparaîtra dans le point de vente.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="w-full max-w-[200px]">
                    <Card className="flex flex-col overflow-hidden">
                        <div className="relative aspect-video w-full">
                           {isGenerating ? (
                              <div className="w-full aspect-video flex items-center justify-center">
                                  <Skeleton className="w-full h-full" />
                              </div>
                            ) : (
                              <Image
                                src={watchedImage || defaultImage || 'https://picsum.photos/seed/placeholder/200/150'}
                                alt={watchedName || "Aperçu de l'article"}
                                fill
                                className="object-cover"
                              />
                            )}
                        </div>
                        <div className="flex-1 p-3">
                            <h3 className="font-semibold leading-tight truncate">{watchedName || "Nom de l'article"}</h3>
                        </div>
                        <div className="flex items-center justify-between p-3 pt-0">
                            <span className="text-lg font-bold text-primary">
                            {Number(watchedPrice || 0).toFixed(2)}€
                            </span>
                            <PlusCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                    </Card>
                </div>
                 <Button type="button" variant="outline" onClick={handleGenerateImage} disabled={isGenerating}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? "Génération en cours..." : "Générer une image IA"}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3 flex justify-end">
             <Button type="submit" size="lg" disabled={isGenerating}>
                {isEditMode ? 'Sauvegarder les modifications' : 'Créer l\'article'}
            </Button>
          </div>

        </form>
      </Form>
    </>
  );
}

// Wrap the component in Suspense to handle the useSearchParams() hook.
export default function ItemFormPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ItemForm />
        </Suspense>
    )
}
