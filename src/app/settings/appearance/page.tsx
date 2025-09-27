

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Palette, Image as ImageIcon, Link as LinkIcon, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
    return `hsla(var(--card), ${opacity/100})`;
};

// Function to check if a color is light or dark
const isColorLight = (hex: string) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        const r = (c >> 16) & 255;
        const g = (c >> 8) & 255;
        const b = c & 255;
        // Using the HSP (Highly Sensitive Poo) equation
        const hsp = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );
        return hsp > 127.5;
    }
    return true; // Default to light if color is invalid
}


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
    dashboardButtonBackgroundColor,
    setDashboardButtonBackgroundColor,
    dashboardButtonOpacity,
    setDashboardButtonOpacity,
    dashboardButtonShowBorder,
    setDashboardButtonShowBorder,
    dashboardButtonBorderColor,
    setDashboardButtonBorderColor,
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

  const handleHarmonize = () => {
    if (dashboardBgType === 'color') {
        if (isColorLight(dashboardBackgroundColor)) {
            setDashboardButtonBackgroundColor('#000000'); // Black for light backgrounds
        } else {
            setDashboardButtonBackgroundColor('#ffffff'); // White for dark backgrounds
        }
    } else {
        setDashboardButtonBackgroundColor('#ffffff'); // Default to white for image backgrounds
    }
    setDashboardButtonOpacity(70);
    setDashboardButtonShowBorder(false);
    setDashboardButtonBorderColor('#e2e8f0');
  }

  const previewButtonStyle = isClient ? {
      backgroundColor: hexToRgba(dashboardButtonBackgroundColor, dashboardButtonOpacity),
      borderColor: dashboardButtonShowBorder ? dashboardButtonBorderColor : 'transparent',
      borderWidth: dashboardButtonShowBorder ? '1px' : '0px',
  } : {};

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
            <CardTitle>Personnalisation du Tableau de Bord</CardTitle>
            <CardDescription>
              Modifiez l'arrière-plan et l'apparence des boutons de la page d'accueil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 rounded-lg border space-y-6">
                  {isClient ? (
                    <>
                      {/* Background Settings */}
                      <Tabs value={dashboardBgType} onValueChange={(value) => setDashboardBgType(value as 'color' | 'image')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="color"><Palette className="mr-2 h-4 w-4"/>Couleur de fond</TabsTrigger>
                            <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4"/>Image de fond</TabsTrigger>
                        </TabsList>
                        <TabsContent value="color" className="pt-4 space-y-6">
                           <div className="grid gap-2">
                                <Label htmlFor="dashboard-bg-color">Couleur</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="dashboard-bg-color"
                                        type="color"
                                        value={dashboardBackgroundColor}
                                        onChange={(e) => setDashboardBackgroundColor(e.target.value)}
                                        className="w-16 h-12 p-1"
                                    />
                                    <span className="font-mono text-sm text-muted-foreground">{dashboardBackgroundColor}</span>
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
                      <div className="grid gap-2 pt-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="dashboard-opacity">Opacité du fond</Label>
                            <span className="text-sm font-bold text-primary">{dashboardBgOpacity}%</span>
                        </div>
                        <Slider 
                            id="dashboard-opacity"
                            value={[dashboardBgOpacity]} 
                            onValueChange={(value) => setDashboardBgOpacity(value[0])}
                            min={0} max={100} step={5} 
                        />
                      </div>
                      
                      <Separator />

                      {/* Button Settings */}
                       <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">Boutons du tableau de bord</h3>
                             <Button onClick={handleHarmonize} size="sm" variant="ghost">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Harmoniser
                            </Button>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="dashboard-button-bg-color">Couleur de fond des boutons</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="dashboard-button-bg-color"
                                    type="color"
                                    value={dashboardButtonBackgroundColor}
                                    onChange={(e) => setDashboardButtonBackgroundColor(e.target.value)}
                                    className="w-16 h-12 p-1"
                                />
                                <span className="font-mono text-sm text-muted-foreground">{dashboardButtonBackgroundColor}</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="flex justify-between items-center">
                              <Label htmlFor="dashboard-button-opacity">Opacité du fond des boutons</Label>
                              <span className="text-sm font-bold text-primary">{dashboardButtonOpacity}%</span>
                          </div>
                          <Slider 
                              id="dashboard-button-opacity"
                              value={[dashboardButtonOpacity]} 
                              onValueChange={(value) => setDashboardButtonOpacity(value[0])}
                              min={0} max={100} step={5} 
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="show-border" className="text-base">Afficher la bordure</Label>
                            </div>
                            <Switch 
                                id="show-border" 
                                checked={dashboardButtonShowBorder}
                                onCheckedChange={setDashboardButtonShowBorder}
                            />
                        </div>
                        <div className="grid gap-2" style={{ opacity: dashboardButtonShowBorder ? 1 : 0.5 }}>
                            <Label htmlFor="dashboard-button-border-color">Couleur de la bordure</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="dashboard-button-border-color"
                                    type="color"
                                    value={dashboardButtonBorderColor}
                                    onChange={(e) => setDashboardButtonBorderColor(e.target.value)}
                                    className="w-16 h-12 p-1"
                                    disabled={!dashboardButtonShowBorder}
                                />
                                <span className="font-mono text-sm text-muted-foreground">{dashboardButtonBorderColor}</span>
                            </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Skeleton className="h-[280px] w-full" />
                  )}
                </div>
                 <div className="p-4 rounded-lg border bg-card flex items-center justify-center relative overflow-hidden">
                   <div 
                        className="absolute inset-0 bg-cover bg-center transition-all"
                        style={{
                            backgroundColor: isClient && dashboardBgType === 'color' ? dashboardBackgroundColor : 'transparent',
                            backgroundImage: isClient && dashboardBgType === 'image' ? `url(${dashboardBackgroundImage})` : 'none',
                            opacity: isClient ? dashboardBgOpacity / 100 : 1,
                        }}
                   />
                    <div className="relative z-10 w-full max-w-xs">
                       {isClient ? (
                         <Card style={previewButtonStyle}>
                             <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Palette className="h-8 w-8 text-primary mb-2" />
                                        <h3 className="text-lg font-semibold font-headline">Aperçu Bouton</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Ceci est un aperçu</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                       ) : (
                         <Skeleton className="h-32 w-full" />
                       )}
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
                                {isClient ? <span className="font-mono text-sm text-muted-foreground">{directSaleBackgroundColor}</span> : <Skeleton className="h-5 w-20" />}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="direct-sale-opacity">Opacité</Label>
                                {isClient ? <span className="text-sm font-bold text-primary">{directSaleBgOpacity}%</span> : <Skeleton className="h-5 w-10" />}
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
                            {isClient ? <span className="font-mono text-sm text-muted-foreground">{restaurantModeBackgroundColor}</span> : <Skeleton className="h-5 w-20" />}
                        </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="restaurant-mode-opacity">Opacité</Label>
                                {isClient ? <span className="text-sm font-bold text-primary">{restaurantModeBgOpacity}%</span> : <Skeleton className="h-5 w-10" />}
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

