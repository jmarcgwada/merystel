'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import type { CompanyInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
        subtitle="Gérez les informations de votre entreprise."
      >
        <Button asChild variant="outline">
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Informations sur l'entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input id="name" value={localInfo.name} onChange={handleInputChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={localInfo.address} onChange={handleInputChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={localInfo.email} onChange={handleInputChange} />
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>Sauvegarder les modifications</Button>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
