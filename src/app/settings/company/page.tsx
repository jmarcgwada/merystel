
'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Lock, FileImage, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import type { CompanyInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
    internalNotes: '',
    communicationDoc: '',
}

export default function CompanyPage() {
  const { companyInfo, setCompanyInfo, isLoading } = usePos();
  const { toast } = useToast();
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const router = useRouter();

  const isInitialSetup = !companyInfo?.name;

  useEffect(() => {
    if (companyInfo) {
        setLocalInfo(companyInfo);
    }
  }, [companyInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocalInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalInfo(prev => ({ ...prev, communicationDoc: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!localInfo.name) {
      toast({
        title: "Nom de l'entreprise requis",
        description: 'Veuillez renseigner le nom de votre entreprise.',
        variant: 'destructive',
      });
      return;
    }
    setCompanyInfo(localInfo);
    toast({
      title: 'Informations sauvegardées',
      description: 'Les détails de votre entreprise ont été mis à jour.',
    });
    if (isInitialSetup) {
        router.push('/dashboard');
    }
  };
  
  if (isLoading) {
      return (
        <>
            <PageHeader title="Détails de l'entreprise" subtitle="Gérez les informations légales et commerciales de votre entreprise."/>
            <div className="mt-8 space-y-8">
                <Skeleton className="w-full h-96" />
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
        {!isInitialSetup && (
            <Button asChild variant="outline" className="btn-back">
            <Link href="/settings">
                <ArrowLeft />
                Retour aux paramètres
            </Link>
            </Button>
        )}
      </PageHeader>
        
      <div className="mt-4 space-y-8">
        {isInitialSetup && (
            <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Configuration requise</AlertTitle>
                <AlertDescription>
                    Veuillez renseigner au moins le nom de votre entreprise pour continuer.
                </AlertDescription>
            </Alert>
        )}
        
        <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="legal">Légal & Bancaire</TabsTrigger>
                <TabsTrigger value="docs">Communication</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
                 <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Informations générales et de contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom de l'entreprise *</Label>
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
                         <Separator/>
                        <div className="grid gap-2">
                            <Label htmlFor="internalNotes">Notes Internes</Label>
                            <Textarea id="internalNotes" value={localInfo.internalNotes || ''} onChange={handleInputChange} placeholder="Informations diverses sur l'entreprise..." rows={4} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="legal">
                 <Card className="mt-4">
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
                 <Card className="mt-8">
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
            </TabsContent>

            <TabsContent value="docs">
                 <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Document de Communication</CardTitle>
                        <CardDescription>Image ou PDF à afficher dans le cadre de communication sur vos documents imprimés.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="communicationDocUrl">Document de Communication</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center relative">
                                    <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                                    <Input 
                                        id="communicationDoc"
                                        value={(localInfo.communicationDoc || '').startsWith('data:') ? '' : (localInfo.communicationDoc || '')}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="pl-9"
                                    />
                                </div>
                                <Button variant="outline" onClick={() => document.getElementById('communicationDocFile')?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Téléverser
                                </Button>
                                <input type="file" id="communicationDocFile" onChange={handleImageUpload} className="hidden" accept="image/*,.pdf"/>
                                {localInfo.communicationDoc && (
                                    <Button variant="destructive" size="icon" onClick={() => setLocalInfo(prev => ({ ...prev, communicationDoc: '' }))}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {localInfo.communicationDoc && (
                        <div className="pt-4">
                            <Label>Aperçu</Label>
                            <div className="mt-2 border rounded-md p-2 flex justify-center items-center h-48">
                            {(localInfo.communicationDoc || '').startsWith('data:image') ? (
                                <img src={localInfo.communicationDoc} alt="Aperçu" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <FileImage className="w-16 h-16 text-muted-foreground" />
                            )}
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Pied de page des documents</CardTitle>
                        <CardDescription>Ce texte apparaîtra en bas de vos factures et devis (mentions légales, conditions de vente, etc.).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Textarea id="notes" value={localInfo.notes || ''} onChange={handleInputChange} placeholder="Ex: TVA non applicable, art. 293 B du CGI..." rows={4} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
       <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} size="lg">Sauvegarder les modifications</Button>
       </div>
    </>
  );
}
