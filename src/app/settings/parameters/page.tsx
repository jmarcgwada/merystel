

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff, FileText, Upload, Download, ScanLine, ShoppingCart, Utensils, Lock } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRef, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';


export default function ParametersPage() {
  const { 
    showNotifications, 
    setShowNotifications, 
    notificationDuration, 
    setNotificationDuration,
    descriptionDisplay,
    setDescriptionDisplay,
    exportConfiguration,
    importConfiguration,
    enableSerialNumber,
    setEnableSerialNumber,
    defaultSalesMode,
    setDefaultSalesMode,
    isForcedMode,
    setIsForcedMode,
  } = usePos();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <PageHeader
        title="Paramétrage"
        subtitle="Configurez les paramètres fonctionnels de l'application."
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
            <CardTitle>Mode de vente par défaut</CardTitle>
            <CardDescription>
                Choisissez l'écran qui s'ouvrira lorsque vous cliquerez sur "Mode Caisse" depuis le tableau de bord (non applicable si un mode de vente est forcé pour un utilisateur).
            </CardDescription>
            </CardHeader>
            <CardContent>
                 {isClient ? (
                    <RadioGroup 
                        value={defaultSalesMode} 
                        onValueChange={(value) => setDefaultSalesMode(value as 'pos' | 'supermarket' | 'restaurant')}
                        className="grid sm:grid-cols-3 gap-4 pt-2"
                    >
                        <div className="flex items-center">
                            <RadioGroupItem value="pos" id="mode-pos" />
                            <Label htmlFor="mode-pos" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <p className="text-base font-semibold flex items-center gap-2"><ShoppingCart />Point de Vente</p>
                                <p className="text-xs text-muted-foreground mt-1">Interface standard avec grille d'articles.</p>
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem value="supermarket" id="mode-supermarket" />
                            <Label htmlFor="mode-supermarket" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <p className="text-base font-semibold flex items-center gap-2"><ScanLine />Mode Supermarché</p>
                                <p className="text-xs text-muted-foreground mt-1">Optimisé pour le scan rapide par code-barres.</p>
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem value="restaurant" id="mode-restaurant" />
                            <Label htmlFor="mode-restaurant" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <p className="text-base font-semibold flex items-center gap-2"><Utensils />Mode Restaurant</p>
                                <p className="text-xs text-muted-foreground mt-1">Gestion des commandes par table.</p>
                            </Label>
                        </div>
                    </RadioGroup>
                ) : (
                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Fonctionnalités</CardTitle>
            <CardDescription>
                Activez ou désactivez certaines fonctionnalités de l'application.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-serial-number" className="text-base flex items-center gap-2">
                            <ScanLine />
                            Activer la gestion des numéros de série
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Si activé, l'application demandera la saisie de numéros de série pour les articles concernés.
                        </p>
                    </div>
                    {isClient ? (
                        <Switch 
                            id="enable-serial-number"
                            checked={enableSerialNumber}
                            onCheckedChange={setEnableSerialNumber}
                        />
                    ) : (
                        <Skeleton className="h-6 w-11" />
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
                Gérez l'affichage des notifications et leur durée.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
            <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="show-notifications" className="text-base flex items-center gap-2">
                            {isClient ? (showNotifications ? <Bell className="text-primary"/> : <BellOff />) : <Skeleton className="h-5 w-5" />}
                            Afficher les notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Active ou désactive toutes les notifications de type "toast" dans l'application.
                        </p>
                    </div>
                    {isClient ? (
                        <Switch 
                            id="show-notifications" 
                            checked={showNotifications}
                            onCheckedChange={setShowNotifications}
                        />
                     ) : (
                        <Skeleton className="h-6 w-11" />
                    )}
                </div>
                <div className="grid gap-2 pt-4">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="notification-duration">Durée d'affichage des notifications</Label>
                        {isClient && <span className="text-sm font-bold text-primary">{(notificationDuration / 1000).toFixed(1)} secondes</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Réglez la durée pendant laquelle les notifications restent visibles à l'écran.
                    </p>
                     {isClient ? (
                        <Slider 
                            id="notification-duration"
                            value={[notificationDuration]} 
                            onValueChange={(value) => setNotificationDuration(value[0])}
                            min={1000}
                            max={10000} 
                            step={500}
                            disabled={!showNotifications}
                        />
                    ) : (
                         <Skeleton className="h-5 w-full" />
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Affichage</CardTitle>
                <CardDescription>
                    Gérez les options d'affichage de l'application.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2">
                            <FileText />
                            Affichage de la description dans la commande
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Choisissez si et comment les descriptions des articles apparaissent dans la commande.
                        </p>
                    </div>
                    {isClient ? (
                        <RadioGroup 
                            value={descriptionDisplay} 
                            onValueChange={(value) => setDescriptionDisplay(value as 'none' | 'first' | 'both')}
                            className="grid sm:grid-cols-3 gap-4 pt-2"
                        >
                           <div className="flex items-center">
                                <RadioGroupItem value="none" id="desc-none" />
                                <Label htmlFor="desc-none" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                  <p className="text-base font-semibold">Aucune</p>
                                  <p className="text-xs text-muted-foreground mt-1">Ne pas afficher de description.</p>
                                </Label>
                            </div>
                             <div className="flex items-center">
                                <RadioGroupItem value="first" id="desc-first" />
                                <Label htmlFor="desc-first" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                  <p className="text-base font-semibold">Description 1</p>
                                  <p className="text-xs text-muted-foreground mt-1">Afficher le premier champ descriptif.</p>
                                </Label>
                            </div>
                             <div className="flex items-center">
                                <RadioGroupItem value="both" id="desc-both" />
                                <Label htmlFor="desc-both" className="ml-2 cursor-pointer w-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                  <p className="text-base font-semibold">Les deux</p>
                                  <p className="text-xs text-muted-foreground mt-1">Afficher les deux descriptions.</p>
                                </Label>
                            </div>
                        </RadioGroup>
                     ) : (
                        <div className="grid sm:grid-cols-3 gap-4 pt-2">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
