
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const initialCompanyInfo: CompanyInfo = {
    name: '',
    address: '',
    postalCode: '',
    city: '',
    region: '',
    country: '',
    email: '',
    phone: '',
    website: '',
    siret: '',
    legalForm: '',
    iban: '',
    bic: '',
    notes: '',
}

export default function CompanyPage() {
  const { companyInfo, setCompanyInfo, isLoading } = usePos();
  const { toast } = useToast();
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const router = useRouter();

  useEffect(() => {
    if (companyInfo) {
        setLocalInfo(companyInfo);
    }
  }, [companyInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocalInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    setCompanyInfo(localInfo);
    toast({
      title: 'Informations sauvegardées',
      description: 'Les détails de votre entreprise ont été mis à jour.',
    });
    router.push('/settings');
  };
  
  if (isLoading) {
      return (
        <>
            <PageHeader title="Détails de l'entreprise" subtitle="Gérez les informations légales et commerciales de votre entreprise."/>
            <div className="mt-8 space-y-8">
                <Skeleton className="w-full h-96" />
                <Skeleton className="w-full h-64" />
                <Skeleton className="w-full h-48" />
            </div>
        </>
      )
  }

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
      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
              <CardTitle>Informations générales et de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid gap-2">
                  <Label htmlFor="name">Nom de l'entreprise</Label>
                  <Input id="name" value={localInfo.name} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={localInfo.address} onChange={handleInputChange} placeholder="ex: 123 Rue du Commerce"/>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="postalCode">Code Postal</Label>
                    <Input id="postalCode" value={localInfo.postalCode} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={localInfo.city} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="region">Région / Département</Label>
                    <Input id="region" value={localInfo.region || ''} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input id="country" value={localInfo.country} onChange={handleInputChange} />
                </div>
              </div>
              <Separator/>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email de contact</Label>
                    <Input id="email" type="email" value={localInfo.email} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={localInfo.phone || ''} onChange={handleInputChange} />
                </div>
              </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
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
                        <Input id="legalForm" value={localInfo.legalForm || ''} onChange={handleInputChange} placeholder="ex: SARL, SAS..." />
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
                <div className="grid gap-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input id="iban" value={localInfo.iban || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="bic">BIC / SWIFT</Label>
                    <Input id="bic" value={localInfo.bic || ''} onChange={handleInputChange} />
                </div>
            </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
              <CardTitle>Notes / Observations</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid gap-2">
                  <Label htmlFor="notes">Informations diverses</Label>
                  <Textarea id="notes" value={localInfo.notes || ''} onChange={handleInputChange} placeholder="Consignez ici toute information supplémentaire concernant l'entreprise..." rows={4} />
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
