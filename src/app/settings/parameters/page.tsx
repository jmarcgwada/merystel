

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function ParametersPage() {
  const { 
    showNotifications, 
    setShowNotifications, 
    notificationDuration, 
    setNotificationDuration 
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
      <Card className="mt-8">
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
    </>
  );
}
