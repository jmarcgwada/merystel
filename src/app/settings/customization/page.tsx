import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function CustomizationPage() {
  return (
    <>
      <PageHeader
        title="Personnalisation de l'interface"
        subtitle="Personnalisez l'apparence de votre point de vente."
      />
      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Couleurs</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-center text-muted-foreground py-12">
                <p>Les options de personnalisation des couleurs en direct seront disponibles ici.</p>
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
