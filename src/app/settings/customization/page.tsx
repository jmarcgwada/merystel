
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePos } from '@/contexts/pos-context';


export default function CustomizationPage() {
  const { showTicketImages, setShowTicketImages } = usePos();

  return (
    <>
      <PageHeader
        title="Personnalisation de l'interface"
        subtitle="Personnalisez l'apparence de votre point de vente."
      />
      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Visibilité</CardTitle>
            <CardDescription>
              Contrôlez l'affichage de certains éléments dans l'interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Taille & Opacité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid gap-2">
                <Label>Opacité du bouton de catégorie</Label>
                <Slider defaultValue={[80]} max={100} step={1} />
             </div>
              <div className="grid gap-2">
                <Label>Taille du bouton de table</Label>
                <Slider defaultValue={[50]} max={100} step={1} />
             </div>
             <div className="text-center text-muted-foreground py-8">
                <p>Plus de curseurs et d'aperçus en temps réel seront implémentés.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
