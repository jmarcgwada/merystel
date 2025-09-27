

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff, FileText, Type } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function ParametersPage() {
  const { 
    showNotifications, 
    setShowNotifications, 
    notificationDuration, 
    setNotificationDuration,
    descriptionDisplay,
    setDescriptionDisplay
  } = usePos();

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
