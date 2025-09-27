

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AppearancePage() {
  const { 
    directSaleBackgroundColor,
    setDirectSaleBackgroundColor,
    restaurantModeBackgroundColor,
    setRestaurantModeBackgroundColor
  } = usePos();

  return (
    <>
      <PageHeader
        title="Apparence & Couleurs"
        subtitle="Personnalisez les couleurs de l'application."
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
            <CardTitle>Couleurs des modes de vente</CardTitle>
            <CardDescription>
              Choisissez les couleurs de fond pour la section de la commande dans chaque mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="direct-sale-bg">Fond de la Vente Directe</Label>
                   <div className="flex items-center gap-2">
                     <Input
                        id="direct-sale-bg"
                        type="color"
                        value={directSaleBackgroundColor}
                        onChange={(e) => setDirectSaleBackgroundColor(e.target.value)}
                        className="w-12 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">{directSaleBackgroundColor}</span>
                   </div>
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="restaurant-mode-bg">Fond du Mode Restaurant</Label>
                   <div className="flex items-center gap-2">
                     <Input
                        id="restaurant-mode-bg"
                        type="color"
                        value={restaurantModeBackgroundColor}
                        onChange={(e) => setRestaurantModeBackgroundColor(e.target.value)}
                        className="w-12 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">{restaurantModeBackgroundColor}</span>
                   </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
