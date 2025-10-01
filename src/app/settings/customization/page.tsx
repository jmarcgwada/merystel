

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function CustomizationPage() {
  const { 
    showTicketImages, 
    setShowTicketImages, 
    popularItemsCount, 
    setPopularItemsCount, 
    itemCardOpacity, 
    setItemCardOpacity, 
    enableRestaurantCategoryFilter, 
    setEnableRestaurantCategoryFilter,
    paymentMethodImageOpacity,
    setPaymentMethodImageOpacity,
    itemCardShowImageAsBackground,
    setItemCardShowImageAsBackground,
    itemCardShowPrice,
    setItemCardShowPrice,
   } = usePos();

  const [isClient, setIsClient] = useState(false);
  const [currentPopularItemsCount, setCurrentPopularItemsCount] = useState(popularItemsCount);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if(isClient) {
      setCurrentPopularItemsCount(popularItemsCount);
    }
  }, [popularItemsCount, isClient]);

  const handlePopularItemsChange = (value: number[]) => {
      setCurrentPopularItemsCount(value[0]);
  }

  const handlePopularItemsCommit = (value: number[]) => {
      setPopularItemsCount(value[0]);
  }

  return (
    <>
      <PageHeader
        title="Personnalisation de l'interface"
        subtitle="Personnalisez l'apparence de votre point de vente."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Visibilité des éléments</CardTitle>
            <CardDescription>
              Contrôlez l'affichage de certains éléments dans l'interface du point de vente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="ticket-images" className="text-base">Afficher les images dans la commande</Label>
                  <p className="text-sm text-muted-foreground">
                    Affiche ou masque les miniatures des articles dans la colonne de la commande actuelle.
                  </p>
                </div>
                {isClient ? (
                  <Switch 
                    id="ticket-images" 
                    checked={showTicketImages}
                    onCheckedChange={setShowTicketImages}
                  />
                ) : <Skeleton className="h-6 w-11" />}
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="item-card-show-price" className="text-base">Afficher le prix sur les articles</Label>
                  <p className="text-sm text-muted-foreground">
                    Affiche ou masque le prix sur les cartes des articles dans la grille.
                  </p>
                </div>
                {isClient ? (
                  <Switch 
                    id="item-card-show-price" 
                    checked={itemCardShowPrice}
                    onCheckedChange={setItemCardShowPrice}
                  />
                ) : <Skeleton className="h-6 w-11" />}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="item-card-bg-image" className="text-base">Image de l'article en fond</Label>
                  <p className="text-sm text-muted-foreground">
                    Utilise l'image de l'article comme arrière-plan complet de la carte.
                  </p>
                </div>
                {isClient ? (
                  <Switch 
                    id="item-card-bg-image" 
                    checked={itemCardShowImageAsBackground}
                    onCheckedChange={setItemCardShowImageAsBackground}
                  />
                ) : <Skeleton className="h-6 w-11" />}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="restaurant-filter" className="text-base">Filtrer les catégories en mode Restaurant</Label>
                  <p className="text-sm text-muted-foreground">
                    Si activé, seules les catégories dédiées au restaurant seront visibles lors d'une commande à table.
                  </p>
                </div>
                {isClient ? (
                  <Switch 
                    id="restaurant-filter" 
                    checked={enableRestaurantCategoryFilter}
                    onCheckedChange={setEnableRestaurantCategoryFilter}
                  />
                ) : <Skeleton className="h-6 w-11" />}
            </div>
             <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="item-card-opacity">Opacité du dégradé des articles</Label>
                     {isClient ? <span className="text-sm font-bold text-primary">{itemCardOpacity}%</span> : <Skeleton className="h-5 w-10" />}
                </div>
                <p className="text-sm text-muted-foreground">
                    Réglez l'opacité du dégradé de couleur sur les cartes d'articles.
                </p>
                {isClient ? (
                  <Slider 
                      id="item-card-opacity"
                      value={[itemCardOpacity]} 
                      onValueChange={(value) => setItemCardOpacity(value[0])}
                      min={0}
                      max={100} 
                      step={5} 
                  />
                ) : <Skeleton className="h-5 w-full" />}
             </div>
              <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="payment-method-image-opacity">Opacité de l'image des moyens de paiement</Label>
                     {isClient ? <span className="text-sm font-bold text-primary">{paymentMethodImageOpacity}%</span> : <Skeleton className="h-5 w-10" />}
                </div>
                <p className="text-sm text-muted-foreground">
                    Réglez l'opacité de l'image de fond sur les boutons de paiement.
                </p>
                {isClient ? (
                  <Slider 
                      id="payment-method-image-opacity"
                      value={[paymentMethodImageOpacity]} 
                      onValueChange={(value) => setPaymentMethodImageOpacity(value[0])}
                      min={0}
                      max={100} 
                      step={5} 
                  />
                ) : <Skeleton className="h-5 w-full" />}
             </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités & Données</CardTitle>
            <CardDescription>
              Ajustez les fonctionnalités et les données affichées dans l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
             <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="popular-items-count">Articles populaires</Label>
                    {isClient ? <span className="text-sm font-bold text-primary">{currentPopularItemsCount} articles</span> : <Skeleton className="h-5 w-20" />}
                </div>
                <p className="text-sm text-muted-foreground">
                    Définissez le nombre d'articles à afficher dans la catégorie "Populaire".
                </p>
                {isClient ? (
                  <Slider 
                      id="popular-items-count"
                      value={[currentPopularItemsCount]}
                      onValueChange={handlePopularItemsChange}
                      onValueCommit={handlePopularItemsCommit}
                      min={1}
                      max={50} 
                      step={1} 
                  />
                ) : <Skeleton className="h-5 w-full" />}
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
