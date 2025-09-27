

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff, FileText, Upload, Download, ScanLine } from 'lucide-react';
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
import { useRef, useState } from 'react';


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
  } = usePos();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await importConfiguration(file);
    setIsImporting(false);
    
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

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
                <CardTitle>Gestion de la configuration</CardTitle>
                <CardDescription>
                    Sauvegardez ou restaurez l'ensemble de votre configuration (articles, catégories, TVA, etc.).
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={exportConfiguration} variant="outline">
                    <Download className="mr-2" />
                    Exporter la configuration
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" onClick={handleImportClick}>
                            <Upload className="mr-2" />
                            Importer la configuration
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'importation d'un nouveau fichier de configuration écrasera et remplacera TOUTES les données actuelles (articles, catégories, paramètres, etc.).
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImportClick} disabled={isImporting}>
                            {isImporting ? "Importation en cours..." : "Continuer et importer"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                />
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
                    <Switch 
                        id="enable-serial-number"
                        checked={enableSerialNumber}
                        onCheckedChange={setEnableSerialNumber}
                    />
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
                        {showNotifications ? <Bell className="text-primary"/> : <BellOff />}
                        Afficher les notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Active ou désactive toutes les notifications de type "toast" dans l'application.
                    </p>
                    </div>
                    <Switch 
                    id="show-notifications" 
                    checked={showNotifications}
                    onCheckedChange={setShowNotifications}
                    />
                </div>
                <div className="grid gap-2 pt-4">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="notification-duration">Durée d'affichage des notifications</Label>
                        <span className="text-sm font-bold text-primary">{(notificationDuration / 1000).toFixed(1)} secondes</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Réglez la durée pendant laquelle les notifications restent visibles à l'écran.
                    </p>
                    <Slider 
                        id="notification-duration"
                        value={[notificationDuration]} 
                        onValueChange={(value) => setNotificationDuration(value[0])}
                        min={1000}
                        max={10000} 
                        step={500}
                        disabled={!showNotifications}
                    />
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
                    <RadioGroup 
                        value={descriptionDisplay} 
                        onValueChange={(value) => setDescriptionDisplay(value as 'none' | 'first' | 'both')}
                        className="grid sm:grid-cols-3 gap-4 pt-2"
                    >
                        <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="none" id="desc-none" className="sr-only" />
                            <p className="text-base font-semibold">Aucune</p>
                            <p className="text-xs text-muted-foreground text-center mt-1">Ne pas afficher de description.</p>
                        </Label>
                         <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="first" id="desc-first" className="sr-only" />
                            <p className="text-base font-semibold">Description 1</p>
                            <p className="text-xs text-muted-foreground text-center mt-1">Afficher le premier champ descriptif.</p>
                        </Label>
                         <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="both" id="desc-both" className="sr-only" />
                            <p className="text-base font-semibold">Les deux</p>
                            <p className="text-xs text-muted-foreground text-center mt-1">Afficher les deux descriptions.</p>
                        </Label>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
