

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
import { useUser } from '@/firebase/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  price: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }).optional(),
  categoryId: z.string().min(1, { message: 'Veuillez sélectionner une catégorie.' }),
  vatId: z.string().min(1, { message: 'Veuillez sélectionner un taux de TVA.' }),
  description: z.string().optional(),
  description2: z.string().optional(),
  isFavorite: z.boolean().default(false),
  image: z.string().optional(),
  showImage: z.boolean().default(true),
  barcode: z.string().optional(),
  marginCoefficient: z.coerce.number().optional(),
  requiresSerialNumber: z.boolean().default(false),
});

type ItemFormValues = z.infer<typeof formSchema>;

function ItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { items, categories, vatRates, addItem, updateItem, isLoading } = usePos();
  const { user } = useUser();
  const isCashier = user?.role === 'cashier';
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
      purchasePrice: 0,
      categoryId: '',
      vatId: '',
      description: '',
      description2: '',
      isFavorite: false,
      image: '',
      showImage: true,
      barcode: '',
      marginCoefficient: 0,
      requiresSerialNumber: false,
    },
  });

  const { watch, setValue } = form;
  const watchedImage = watch('image');
  const watchedName = watch('name');
  const watchedPrice = watch('price');

  useEffect(() => {
    if(isCashier && !isEditMode) {
      router.push('/management/items');
    }
  }, [isCashier, isEditMode, router]);


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
        purchasePrice: itemToEdit.purchasePrice || 0,
        categoryId: itemToEdit.categoryId,
        vatId: itemToEdit.vatId,
        description: itemToEdit.description || '',
        description2: itemToEdit.description2 || '',
        isFavorite: itemToEdit.isFavorite || false,
        image: itemToEdit.image,
        showImage: itemToEdit.showImage ?? true,
        barcode: itemToEdit.barcode || '',
        marginCoefficient: itemToEdit.marginCoefficient || 0,
        requiresSerialNumber: itemToEdit.requiresSerialNumber || false,
      });
    } else if (!isEditMode) {
        form.reset({
          name: '',
          price: 0,
          purchasePrice: 0,
          categoryId: '',
          vatId: '',
          description: '',
          description2: '',
          isFavorite: false,
          image: '', // Leave empty initially
          showImage: true,
          barcode: '',
          marginCoefficient: 0,
          requiresSerialNumber: false,
        });
    }
  }, [isEditMode, itemToEdit, form]);

  useEffect(() => {
    if (!isEditMode && !form.getValues('image')) {
      // Set a client-side only default image for new items
      setValue('image', `https://picsum.photos/seed/${itemId || 'new'}/200/150`);
    }
  }, [isEditMode, form, itemId, setValue]);


  function onSubmit(data: ItemFormValues) {
    if (isCashier) {
        toast({ variant: 'destructive', title: 'Accès non autorisé' });
        return;
    }
    if (isEditMode && itemToEdit) {
      const updatedItem: Item = {
        ...itemToEdit,
        ...data,
        price: Number(data.price),
        purchasePrice: Number(data.purchasePrice) || undefined,
        marginCoefficient: Number(data.marginCoefficient) || undefined,
      };
      updateItem(updatedItem);
      toast({ title: 'Article modifié', description: `L'article "${data.name}" a été mis à jour.` });
    } else {
      addItem({ ...data, image: data.image || defaultImage });
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
          <div className="mt-8">
            <Skeleton className="h-[700px] w-full" />
          </div>
        </Suspense>
    )
  }

  if (isCashier && isEditMode) {
      return (
        <>
            <PageHeader
                title="Détails de l'article"
                subtitle="Affichage en lecture seule."
            >
                <Button variant="outline" asChild>
                <Link href="/management/items">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste
                </Link>
                </Button>
            </PageHeader>
            <div className="mt-8">
                 <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Mode lecture seule</AlertTitle>
                    <AlertDescription>
                        En tant que caissier, vous pouvez uniquement consulter les détails des articles.
                    </AlertDescription>
                </Alert>
            </div>
             <fieldset disabled className="mt-4 opacity-70">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                        <TabsTrigger value="details">Détails</TabsTrigger>
                        <TabsTrigger value="image">Image & Visibilité</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                        <Card>
                        <CardHeader>
                            <CardTitle>Détails de l'article</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p><span className="font-semibold">Nom:</span> {itemToEdit?.name}</p>
                            <p><span className="font-semibold">Prix:</span> {itemToEdit?.price.toFixed(2)}€</p>
                            <p><span className="font-semibold">Catégorie:</span> {categories?.find(c => c.id === itemToEdit?.categoryId)?.name}</p>
                            <p><span className="font-semibold">TVA:</span> {vatRates?.find(v => v.id === itemToEdit?.vatId)?.rate}%</p>
                            <p><span className="font-semibold">Description 1:</span> {itemToEdit?.description || 'N/A'}</p>
                            <p><span className="font-semibold">Description 2:</span> {itemToEdit?.description2 || 'N/A'}</p>
                        </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="image">
                        <Card>
                        <CardHeader>
                            <CardTitle>Image</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Image
                                src={itemToEdit?.image || 'https://picsum.photos/seed/placeholder/200/150'}
                                alt={itemToEdit?.name || "Aperçu"}
                                width={200}
                                height={150}
                                className="object-cover rounded-md mx-auto"
                            />
                        </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </fieldset>
        </>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <Tabs defaultValue="details" className="w-full">
                <TabsList>
                    <TabsTrigger value="details">Détails de l'article</TabsTrigger>
                    <TabsTrigger value="image">Image & Visibilité</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                     <Card>
                        <CardHeader>
                            <CardTitle>Informations principales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                name="barcode"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Code-barres / Référence</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: 3037920162002" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                 <FormField
                                control={form.control}
                                name="description2"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description 2 (optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Autre description..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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
                                {!isCashier && (
                                <>
                                    <FormField
                                    control={form.control}
                                    name="purchasePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Prix d'achat (€)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="ex: 1.20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="marginCoefficient"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Coeff. Marge</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" placeholder="ex: 2.5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="image">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
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
                                     <FormField
                                        control={form.control}
                                        name="requiresSerialNumber"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Exiger un numéro de série</FormLabel>
                                                <FormDescription>
                                                Demander la saisie d'un numéro de série lors de la vente.
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
                        </div>
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Image de l'article</CardTitle>
                                    <CardDescription>Aperçu de la carte du POS.</CardDescription>
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
                    </div>
                </TabsContent>
            </Tabs>
          
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
