
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import type { CompanyInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { user } = useUser();
  const isForbidden = user?.role === 'cashier' || user?.role === 'manager';
  const { toast } = useToast();
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const router = useRouter();

  useEffect(() => {
    if (companyInfo) {
        setLocalInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if(isForbidden) {
        router.push('/dashboard');
    }
  },[isForbidden, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocalInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (isForbidden) {
        toast({ variant: 'destructive', title: 'Accès refusé' });
        return;
    }
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

  if (isForbidden) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Accès non autorisé" />
        <Alert variant="destructive" className="mt-4">
          <Lock className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Détails de l'entreprise"
        subtitle="Gérez les informations légales et commerciales de votre entreprise."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
        
      <fieldset disabled={isForbidden} className="mt-4 space-y-8 group">
        <Card className="group-disabled:opacity-70">
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
            <Card className="group-disabled:opacity-70">
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
            
            <Card className="group-disabled:opacity-70">
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

        <Card className="group-disabled:opacity-70">
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

      </fieldset>
       {!isForbidden && (
            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} size="lg">Sauvegarder les modifications</Button>
            </div>
       )}
    </>
  );
}

    