

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePos } from '@/contexts/pos-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, BarChart3, Image, Wallpaper } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

export default function CustomizationPage() {
  const { 
    showTicketImages, 
    setShowTicketImages, 
    showItemImagesInGrid,
    setShowItemImagesInGrid,
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
    itemCardImageOverlayOpacity,
    setItemCardImageOverlayOpacity,
    itemCardTextColor,
    setItemCardTextColor,
    itemCardShowPrice,
    setItemCardShowPrice,
    externalLinkModalEnabled,
    setExternalLinkModalEnabled,
    externalLinkUrl,
    setExternalLinkUrl,
    externalLinkTitle,
    setExternalLinkTitle,
    externalLinkModalWidth,
    setExternalLinkModalWidth,
    externalLinkModalHeight,
    setExternalLinkModalHeight,
    showDashboardStats,
    setShowDashboardStats,
    enableDynamicBg,
    setEnableDynamicBg,
    dynamicBgOpacity,
    setDynamicBgOpacity,
   } = usePos();

  const [isClient, setIsClient] = useState(false);
  const [currentPopularItemsCount, setCurrentPopularItemsCount] = useState(popularItemsCount);
  const [currentWidth, setCurrentWidth] = useState(externalLinkModalWidth);
  const [currentHeight, setCurrentHeight] = useState(externalLinkModalHeight);


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if(isClient) {
      setCurrentPopularItemsCount(popularItemsCount);
      setCurrentWidth(externalLinkModalWidth);
      setCurrentHeight(externalLinkModalHeight);
    }
  }, [popularItemsCount, externalLinkModalWidth, externalLinkModalHeight, isClient]);

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
            <CardTitle>Fenêtre Modale Externe</CardTitle>
            <CardDescription>
              Affichez un lien externe dans une fenêtre modale accessible depuis l'en-tête de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="external-link-enabled" className="text-base">Activer la modale de lien externe</Label>
                  <p className="text-sm text-muted-foreground">
                    Affiche un bouton dans l'en-tête pour ouvrir le lien dans une modale.
                  </p>
                </div>
                {isClient ? (
                  <Switch 
                    id="external-link-enabled" 
                    checked={externalLinkModalEnabled}
                    onCheckedChange={setExternalLinkModalEnabled}
                  />
                ) : <Skeleton className="h-6 w-11" />}
            </div>
            {isClient && (
              <div className="space-y-6 transition-opacity" style={{ opacity: externalLinkModalEnabled ? 1 : 0.5 }}>
                  <div className="grid gap-2">
                      <Label htmlFor="external-link-url">URL du lien</Label>
                      <div className="flex items-center">
                          <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                          <Input 
                              id="external-link-url"
                              value={externalLinkUrl}
                              onChange={(e) => setExternalLinkUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="pl-9"
                              disabled={!externalLinkModalEnabled}
                          />
                      </div>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="external-link-title">Titre de la fenêtre</Label>
                      <Input 
                          id="external-link-title"
                          value={externalLinkTitle}
                          onChange={(e) => setExternalLinkTitle(e.target.value)}
                          placeholder="Titre de la modale"
                          disabled={!externalLinkModalEnabled}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                      <div className="grid gap-2">
                          <div className="flex justify-between items-center">
                              <Label htmlFor="external-link-width">Largeur de la fenêtre (% de l'écran)</Label>
                              <span className="text-sm font-bold text-primary">{currentWidth}%</span>
                          </div>
                            <Slider 
                                id="external-link-width"
                                value={[currentWidth]} 
                                onValueChange={(v) => setCurrentWidth(v[0])}
                                onValueCommit={(v) => setExternalLinkModalWidth(v[0])}
                                min={10} max={100} step={5}
                                disabled={!externalLinkModalEnabled}
                            />
                      </div>
                      <div className="grid gap-2">
                          <div className="flex justify-between items-center">
                              <Label htmlFor="external-link-height">Hauteur de la fenêtre (% de l'écran)</Label>
                              <span className="text-sm font-bold text-primary">{currentHeight}%</span>
                          </div>
                            <Slider 
                                id="external-link-height"
                                value={[currentHeight]} 
                                onValueChange={(v) => setCurrentHeight(v[0])}
                                onValueCommit={(v) => setExternalLinkModalHeight(v[0])}
                                min={10} max={100} step={5} 
                                disabled={!externalLinkModalEnabled}
                            />
                      </div>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Apparence des Articles (POS)</CardTitle>
                <CardDescription>
                    Options visuelles pour les cartes des articles dans le point de vente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="item-card-bg-image" className="text-base">Image en fond de carte</Label>
                    </div>
                    {isClient ? <Switch id="item-card-bg-image" checked={itemCardShowImageAsBackground} onCheckedChange={setItemCardShowImageAsBackground} /> : <Skeleton className="h-6 w-11" />}
                </div>
                  <div className="grid gap-2 pt-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="item-card-image-overlay-opacity">Opacité du fond sur image</Label>
                        {isClient ? <span className="text-sm font-bold text-primary">{itemCardImageOverlayOpacity}%</span> : <Skeleton className="h-5 w-10" />}
                    </div>
                    {isClient ? <Slider id="item-card-image-overlay-opacity" value={[itemCardImageOverlayOpacity]} onValueChange={(v) => setItemCardImageOverlayOpacity(v[0])} min={0} max={100} step={5} /> : <Skeleton className="h-5 w-full" />}
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                    <Label className="text-base">Couleur du texte sur image</Label>
                    {isClient ? (
                        <RadioGroup value={itemCardTextColor} onValueChange={(value) => setItemCardTextColor(value as 'light' | 'dark')} className="grid sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <RadioGroupItem value="light" id="text-light" className="peer sr-only" />
                                <Label htmlFor="text-light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <p className="text-base font-semibold">Texte clair</p>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="dark" id="text-dark" className="peer sr-only" />
                                <Label htmlFor="text-dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <p className="text-base font-semibold">Texte foncé</p>
                                </Label>
                            </div>
                        </RadioGroup>
                    ) : (<div className="grid sm:grid-cols-2 gap-4 pt-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>)}
                </div>
                  <div className="grid gap-2 pt-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="item-card-opacity">Opacité du dégradé de catégorie</Label>
                        {isClient ? <span className="text-sm font-bold text-primary">{itemCardOpacity}%</span> : <Skeleton className="h-5 w-10" />}
                    </div>
                    {isClient ? <Slider id="item-card-opacity" value={[itemCardOpacity]} onValueChange={(value) => setItemCardOpacity(value[0])} min={0} max={100} step={5} /> : <Skeleton className="h-5 w-full" />}
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                <CardTitle>Visibilité des Éléments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="show-dashboard-stats" className="text-base flex items-center gap-2"><BarChart3/>Afficher les statistiques</Label>
                        </div>
                        {isClient ? <Switch id="show-dashboard-stats" checked={showDashboardStats} onCheckedChange={setShowDashboardStats} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="ticket-images" className="text-base">Images dans la commande</Label>
                        </div>
                        {isClient ? <Switch id="ticket-images" checked={showTicketImages} onCheckedChange={setShowTicketImages} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="item-images-grid" className="text-base flex items-center gap-2"><Image />Images des articles</Label>
                        </div>
                        {isClient ? <Switch id="item-images-grid" checked={showItemImagesInGrid} onCheckedChange={setShowItemImagesInGrid} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="item-card-show-price" className="text-base">Prix sur les articles</Label>
                        </div>
                        {isClient ? <Switch id="item-card-show-price" checked={itemCardShowPrice} onCheckedChange={setItemCardShowPrice} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="dynamic-bg" className="text-base flex items-center gap-2"><Wallpaper />Fond d'écran dynamique</Label>
                        </div>
                        {isClient ? <Switch id="dynamic-bg" checked={enableDynamicBg} onCheckedChange={setEnableDynamicBg} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                    {isClient && (
                        <div className="grid gap-2 pt-2 transition-opacity" style={{ opacity: enableDynamicBg ? 1 : 0.5 }}>
                            <div className="flex justify-between items-center"><Label htmlFor="dynamic-bg-opacity">Opacité du fond</Label><span className="text-sm font-bold text-primary">{dynamicBgOpacity}%</span></div>
                            <Slider id="dynamic-bg-opacity" value={[dynamicBgOpacity]} onValueChange={(v) => setDynamicBgOpacity(v[0])} min={0} max={100} step={5} disabled={!enableDynamicBg} />
                        </div>
                    )}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="restaurant-filter" className="text-base">Filtre restaurant</Label>
                        </div>
                        {isClient ? <Switch id="restaurant-filter" checked={enableRestaurantCategoryFilter} onCheckedChange={setEnableRestaurantCategoryFilter} /> : <Skeleton className="h-6 w-11" />}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fonctionnalités & Données</CardTitle>
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
                        {isClient ? <Slider id="popular-items-count" value={[currentPopularItemsCount]} onValueChange={handlePopularItemsChange} onValueCommit={handlePopularItemsCommit} min={1} max={50} step={1} /> : <Skeleton className="h-5 w-full" />}
                    </div>
                    <Separator/>
                     <div className="grid gap-2 pt-2">
                        <div className="flex justify-between items-center"><Label htmlFor="payment-method-image-opacity">Opacité image des paiements</Label>{isClient ? <span className="text-sm font-bold text-primary">{paymentMethodImageOpacity}%</span> : <Skeleton className="h-5 w-10" />}</div>
                        {isClient ? <Slider id="payment-method-image-opacity" value={[paymentMethodImageOpacity]} onValueChange={(value) => setPaymentMethodImageOpacity(value[0])} min={0} max={100} step={5} /> : <Skeleton className="h-5 w-full" />}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

