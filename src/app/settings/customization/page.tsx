

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePos } from '@/contexts/pos-context';


export default function CustomizationPage() {
  const { showTicketImages, setShowTicketImages, popularItemsCount, setPopularItemsCount, itemCardOpacity, setItemCardOpacity, enableRestaurantCategoryFilter, setEnableRestaurantCategoryFilter } = usePos();

  return (
    <>
      <PageHeader
        title="Personnalisation de l'interface"
        subtitle="Personnalisez l'apparence de votre point de vente."
      />
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
                <Switch 
                  id="ticket-images" 
                  checked={showTicketImages}
                  onCheckedChange={setShowTicketImages}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="restaurant-filter" className="text-base">Filtrer les catégories en mode Restaurant</Label>
                  <p className="text-sm text-muted-foreground">
                    Si activé, seules les catégories dédiées au restaurant seront visibles lors d'une commande à table.
                  </p>
                </div>
                <Switch 
                  id="restaurant-filter" 
                  checked={enableRestaurantCategoryFilter}
                  onCheckedChange={setEnableRestaurantCategoryFilter}
                />
            </div>
             <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="item-card-opacity">Opacité du dégradé des articles</Label>
                    <span className="text-sm font-bold text-primary">{itemCardOpacity}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Réglez l'opacité du dégradé de couleur sur les cartes d'articles.
                </p>
                <Slider 
                    id="item-card-opacity"
                    value={[itemCardOpacity]} 
                    onValueChange={(value) => setItemCardOpacity(value[0])}
                    min={0}
                    max={100} 
                    step={5} 
                />
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
                    <span className="text-sm font-bold text-primary">{popularItemsCount} articles</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Définissez le nombre d'articles à afficher dans la catégorie "Populaire".
                </p>
                <Slider 
                    id="popular-items-count"
                    value={[popularItemsCount]} 
                    onValueChange={(value) => setPopularItemsCount(value[0])}
                    min={1}
                    max={50} 
                    step={1} 
                />
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
