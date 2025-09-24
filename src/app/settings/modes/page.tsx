import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ModesPage() {
  return (
    <>
      <PageHeader
        title="Modes Forcés"
        subtitle="Verrouillez l'application dans un mode spécifique pour certains utilisateurs."
      />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Configuration du mode</CardTitle>
          <CardDescription>
            Activez un mode pour verrouiller l'application. Une combinaison de touches spéciale sera requise pour déverrouiller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="touch-mode" className="text-base">Forcer le mode écran tactile</Label>
              <p className="text-sm text-muted-foreground">
                Verrouille l'application sur l'écran principal du point de vente.
              </p>
            </div>
            <Switch id="touch-mode" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="restaurant-mode" className="text-base">Forcer le mode restaurant</Label>
               <p className="text-sm text-muted-foreground">
                Verrouille l'application sur la vue de gestion des tables du restaurant.
              </p>
            </div>
            <Switch id="restaurant-mode" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
