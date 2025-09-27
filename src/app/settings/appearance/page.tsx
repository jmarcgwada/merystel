

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return hex; // Fallback to original color if format is wrong
};


export default function AppearancePage() {
  const { 
    directSaleBackgroundColor,
    setDirectSaleBackgroundColor,
    restaurantModeBackgroundColor,
    setRestaurantModeBackgroundColor,
    directSaleBgOpacity,
    setDirectSaleBgOpacity,
    restaurantModeBgOpacity,
    setRestaurantModeBgOpacity
  } = usePos();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
          <CardContent className="space-y-8 pt-4">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 rounded-lg border">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="direct-sale-bg">Fond de la Vente Directe</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="direct-sale-bg"
                                    type="color"
                                    value={directSaleBackgroundColor}
                                    onChange={(e) => setDirectSaleBackgroundColor(e.target.value)}
                                    className="w-16 h-12 p-1"
                                />
                                {isClient && <span className="font-mono text-sm text-muted-foreground">{directSaleBackgroundColor}</span>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="direct-sale-opacity">Opacité</Label>
                                {isClient && <span className="text-sm font-bold text-primary">{directSaleBgOpacity}%</span>}
                            </div>
                            {isClient ? (
                                <Slider 
                                    id="direct-sale-opacity"
                                    value={[directSaleBgOpacity]} 
                                    onValueChange={(value) => setDirectSaleBgOpacity(value[0])}
                                    min={0}
                                    max={100} 
                                    step={5} 
                                />
                            ) : (
                                <Skeleton className="h-5 w-full" />
                            )}
                        </div>
                    </div>
                </div>
                 <div 
                    className="p-4 rounded-lg border bg-card flex items-center justify-center"
                    style={{ backgroundColor: isClient ? hexToRgba(directSaleBackgroundColor, directSaleBgOpacity) : 'transparent' }}
                >
                    <p className="font-semibold text-muted-foreground">Aperçu Vente Directe</p>
                </div>
            </div>

            <Separator />

             <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 rounded-lg border">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                        <Label htmlFor="restaurant-mode-bg">Fond du Mode Restaurant</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="restaurant-mode-bg"
                                type="color"
                                value={restaurantModeBackgroundColor}
                                onChange={(e) => setRestaurantModeBackgroundColor(e.target.value)}
                                className="w-16 h-12 p-1"
                            />
                            {isClient && <span className="font-mono text-sm text-muted-foreground">{restaurantModeBackgroundColor}</span>}
                        </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="restaurant-mode-opacity">Opacité</Label>
                                {isClient && <span className="text-sm font-bold text-primary">{restaurantModeBgOpacity}%</span>}
                            </div>
                            {isClient ? (
                                <Slider 
                                    id="restaurant-mode-opacity"
                                    value={[restaurantModeBgOpacity]} 
                                    onValueChange={(value) => setRestaurantModeBgOpacity(value[0])}
                                    min={0}
                                    max={100} 
                                    step={5} 
                                />
                            ) : (
                                <Skeleton className="h-5 w-full" />
                            )}
                        </div>
                    </div>
                </div>
                <div 
                    className="p-4 rounded-lg border bg-card flex items-center justify-center"
                    style={{ backgroundColor: isClient ? hexToRgba(restaurantModeBackgroundColor, restaurantModeBgOpacity) : 'transparent' }}
                >
                     <p className="font-semibold text-muted-foreground">Aperçu Mode Restaurant</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
