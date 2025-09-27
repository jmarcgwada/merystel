

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Palette, Image as ImageIcon, Link as LinkIcon, Upload } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    setRestaurantModeBgOpacity,
    dashboardBgType,
    setDashboardBgType,
    dashboardBackgroundColor,
    setDashboardBackgroundColor,
    dashboardBackgroundImage,
    setDashboardBackgroundImage,
    dashboardBgOpacity,
    setDashboardBgOpacity,
  } = usePos();
  
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDashboardBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
            <CardTitle>Fond d'écran du Tableau de Bord</CardTitle>
            <CardDescription>
              Personnalisez l'arrière-plan de la page d'accueil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 rounded-lg border">
                  <Tabs value={dashboardBgType} onValueChange={(value) => setDashboardBgType(value as 'color' | 'image')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="color"><Palette className="mr-2 h-4 w-4"/>Couleur</TabsTrigger>
                        <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4"/>Image</TabsTrigger>
                    </TabsList>
                    <TabsContent value="color" className="pt-4 space-y-6">
                       <div className="grid gap-2">
                            <Label htmlFor="dashboard-bg-color">Couleur de fond</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="dashboard-bg-color"
                                    type="color"
                                    value={dashboardBackgroundColor}
                                    onChange={(e) => setDashboardBackgroundColor(e.target.value)}
                                    className="w-16 h-12 p-1"
                                />
                                {isClient && <span className="font-mono text-sm text-muted-foreground">{dashboardBackgroundColor}</span>}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="image" className="pt-4 space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="dashboard-bg-image-url">URL de l'image</Label>
                             <div className="flex items-center">
                                <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                                <Input 
                                    id="dashboard-bg-image-url"
                                    value={dashboardBackgroundImage.startsWith('data:') ? '' : dashboardBackgroundImage}
                                    onChange={(e) => setDashboardBackgroundImage(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Separator className="flex-1"/>
                            <span className="text-xs text-muted-foreground">OU</span>
                            <Separator className="flex-1"/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="dashboard-bg-image-file">Téléverser une image</Label>
                             <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Choisir un fichier
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
                        </div>
                    </TabsContent>
                  </Tabs>
                   <div className="grid gap-2 pt-6">
                      <div className="flex justify-between items-center">
                          <Label htmlFor="dashboard-opacity">Opacité du fond</Label>
                          {isClient && <span className="text-sm font-bold text-primary">{dashboardBgOpacity}%</span>}
                      </div>
                      {isClient ? (
                          <Slider 
                              id="dashboard-opacity"
                              value={[dashboardBgOpacity]} 
                              onValueChange={(value) => setDashboardBgOpacity(value[0])}
                              min={0}
                              max={100} 
                              step={5} 
                          />
                      ) : (
                          <Skeleton className="h-5 w-full" />
                      )}
                  </div>
                </div>
                 <div className="p-4 rounded-lg border bg-card flex items-center justify-center relative overflow-hidden">
                   <div 
                        className="absolute inset-0 bg-cover bg-center transition-all"
                        style={{
                            backgroundColor: dashboardBgType === 'color' ? dashboardBackgroundColor : 'transparent',
                            backgroundImage: dashboardBgType === 'image' ? `url(${dashboardBackgroundImage})` : 'none',
                            opacity: isClient ? dashboardBgOpacity / 100 : 1,
                        }}
                   />
                   <div className="relative z-10 p-4 rounded-md bg-background/50 backdrop-blur-sm border">
                     <p className="font-semibold text-muted-foreground">Aperçu Tableau de Bord</p>
                   </div>
                </div>
            </div>
          </CardContent>
        </Card>
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
