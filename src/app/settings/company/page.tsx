'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import type { CompanyInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function CompanyPage() {
  const { companyInfo, setCompanyInfo } = usePos();
  const { toast } = useToast();
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(companyInfo);

  useEffect(() => {
    setLocalInfo(companyInfo);
  }, [companyInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLocalInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    setCompanyInfo(localInfo);
    toast({
      title: 'Informations sauvegardées',
      description: 'Les détails de votre entreprise ont été mis à jour.',
    });
  };

  return (
    <>
      <PageHeader
        title="Détails de l'entreprise"
        subtitle="Gérez les informations légales et commerciales de votre entreprise."
      >
        <Button asChild variant="outline">
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8 grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
              <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nom de l'entreprise</Label>
                    <Input id="name" value={localInfo.name} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" value={localInfo.address} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={localInfo.email} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={localInfo.phone || ''} onChange={handleInputChange} />
                </div>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle>Informations légales et fiscales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="siret">Numéro de SIRET</Label>
                    <Input id="siret" value={localInfo.siret || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="legalForm">Forme juridique</Label>
                    <Input id="legalForm" value={localInfo.legalForm || ''} onChange={handleInputChange} placeholder="ex: SARL, SAS, Auto-entrepreneur..." />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="website">Site Web</Label>
                    <Input id="website" value={localInfo.website || ''} onChange={handleInputChange} placeholder="https://..." />
                </div>
              </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Coordonnées bancaires</CardTitle>
              <CardDescription>Ces informations apparaîtront sur vos factures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input id="iban" value={localInfo.iban || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="bic">BIC / SWIFT</Label>
                    <Input id="bic" value={localInfo.bic || ''} onChange={handleInputChange} />
                </div>
              </div>
          </CardContent>
        </Card>

      </div>
       <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} size="lg">Sauvegarder les modifications</Button>
        </div>
    </>
  );
}
