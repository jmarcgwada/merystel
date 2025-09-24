import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompanyPage() {
  return (
    <>
      <PageHeader
        title="Détails de l'entreprise"
        subtitle="Gérez les informations de votre entreprise."
      />
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Informations sur l'entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input id="company-name" defaultValue="Zenith POS Inc." />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" defaultValue="123 Rue du Marché, Paris, FR" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contact@zenithpos.com" />
            </div>
            <div className="flex justify-end pt-4">
                <Button>Sauvegarder les modifications</Button>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
