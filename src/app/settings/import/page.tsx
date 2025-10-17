
'use client';

import { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Item, Customer, Supplier } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle } from '@/components/ui/alert';


// Define available fields for each data type
const customerFields: (keyof Customer | 'ignore')[] = ['ignore', 'id', 'name', 'email', 'phone', 'phone2', 'address', 'postalCode', 'city', 'country', 'iban', 'notes', 'isDisabled'];
const itemFields: (keyof Item | 'ignore')[] = ['ignore', 'name', 'price', 'purchasePrice', 'categoryId', 'vatId', 'description', 'description2', 'barcode', 'marginPercentage', 'stock', 'lowStockThreshold', 'isDisabled'];
const supplierFields: (keyof Supplier | 'ignore')[] = ['ignore', 'id', 'name', 'contactName', 'email', 'phone', 'address', 'postalCode', 'city', 'country', 'siret', 'website', 'notes', 'iban', 'bic'];

const fieldLabels: Record<string, string> = {
  ignore: 'Ignorer cette colonne',
  id: 'ID / Code',
  name: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  phone2: 'Téléphone 2',
  address: 'Adresse',
  postalCode: 'Code Postal',
  city: 'Ville',
  country: 'Pays',
  iban: 'IBAN',
  notes: 'Notes',
  isDisabled: 'Désactivé (oui/non)',
  price: 'Prix de vente',
  purchasePrice: "Prix d'achat",
  categoryId: 'Nom de la Catégorie',
  vatId: 'Nom ou Taux de TVA',
  description: 'Description',
  description2: 'Description 2',
  barcode: 'Code-barres',
  marginPercentage: 'Marge (%)',
  stock: 'Stock actuel',
  lowStockThreshold: 'Seuil de stock bas',
  contactName: 'Nom du contact',
  siret: 'SIRET',
  website: 'Site Web',
  bic: 'BIC / SWIFT',
};


export default function ImportDataPage() {
  const { toast } = useToast();
  const { importDataFromJson } = usePos();
  const [activeTab, setActiveTab] = useState('file');
  const [dataType, setDataType] = useState('clients');
  const [separator, setSeparator] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mappings, setMappings] = useState<Record<number, string>>({});
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [isConfirmImportOpen, setConfirmImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
        setJsonData(null); 
        setActiveTab('file'); 
      };
      reader.readAsText(file);
    }
  };

  const parsedData = useMemo(() => {
    if (!fileContent) return [];
    const lines = fileContent.trim().split('\n');
    return lines.map(line => line.split(separator));
  }, [fileContent, separator]);

  const headerRow = useMemo(() => (hasHeader && parsedData.length > 0) ? parsedData[0] : (parsedData.length > 0 ? parsedData[0].map((_, i) => `Colonne ${i + 1}`) : []), [parsedData, hasHeader]);
  const dataRows = useMemo(() => hasHeader ? parsedData.slice(1) : parsedData, [parsedData, hasHeader]);
  
  const getAvailableFields = () => {
    switch (dataType) {
        case 'clients': return customerFields;
        case 'articles': return itemFields;
        case 'fournisseurs': return supplierFields;
        default: return [];
    }
  };

  const availableFields = getAvailableFields();

  const handleGenerateJson = () => {
    const requiredFields = dataType === 'clients' ? ['id', 'name']
                         : dataType === 'articles' ? ['name', 'price', 'categoryId', 'vatId', 'barcode']
                         : ['id', 'name'];

    const mappedFields = Object.values(mappings);
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: `Veuillez mapper les champs suivants: ${missingFields.join(', ')}`,
      });
      return;
    }

    const generated: any[] = [];
    dataRows.forEach(row => {
        const obj: any = {};
        headerRow.forEach((_, index) => {
            const field = mappings[index];
            if (field && field !== 'ignore') {
                let value: any = row[index] ? row[index].trim() : '';
                // Basic type conversion
                if (['price', 'purchasePrice', 'marginPercentage', 'stock', 'lowStockThreshold'].includes(field)) {
                    value = parseFloat(value.replace(',', '.')) || 0;
                } else if (['isDisabled'].includes(field)) {
                    value = ['true', 'oui', '1', 'yes'].includes(value.toLowerCase());
                }
                obj[field] = value;
            }
        });
        if (Object.keys(obj).length > 0) {
            generated.push(obj);
        }
    });
    setJsonData(generated);
    setActiveTab('json');
  };

  const handleImport = async () => {
    setConfirmImportOpen(false);
    if (!jsonData || jsonData.length === 0) {
        toast({ variant: 'destructive', title: 'Aucune donnée à importer' });
        return;
    }

    setIsImporting(true);
    toast({ title: 'Importation en cours...', description: 'Veuillez patienter.' });

    const { successCount, errorCount, errors } = await importDataFromJson(dataType, jsonData);

    setIsImporting(false);

    if (errorCount > 0) {
        toast({
            variant: 'destructive',
            title: `Importation terminée avec ${errorCount} erreur(s)`,
            description: `Détails : ${errors.join(', ')}`,
            duration: 10000,
        });
    } else {
        toast({
            title: 'Importation réussie !',
            description: `${successCount} élément(s) ont été importés avec succès.`,
        });
    }
  }

  return (
    <>
      <PageHeader
        title="Importation de Données"
        subtitle="Importez vos données depuis un fichier CSV ou texte."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Étape 1: Fichier & Format</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!fileContent}>Étape 2: Mappage</TabsTrigger>
            <TabsTrigger value="json" disabled={!jsonData}>Étape 3: JSON & Import</TabsTrigger>
        </TabsList>
        <TabsContent value="file">
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                    <CardTitle>Sélection & Format</CardTitle>
                    <CardDescription>
                        Choisissez le type de données et le format du fichier à importer.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="data-type">Type de données</Label>
                        <Select value={dataType} onValueChange={setDataType}>
                        <SelectTrigger id="data-type">
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clients">Clients</SelectItem>
                            <SelectItem value="articles">Articles</SelectItem>
                            <SelectItem value="fournisseurs">Fournisseurs</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                     <div className="space-y-2">
                        <Label htmlFor="separator">Séparateur</Label>
                        <Select value={separator} onValueChange={setSeparator}>
                            <SelectTrigger id="separator">
                                <SelectValue placeholder="Sélectionner un séparateur..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=",">Virgule (,)</SelectItem>
                                <SelectItem value=";">Point-virgule (;)</SelectItem>
                                <SelectItem value="|">Barre verticale (|)</SelectItem>
                                <SelectItem value="\t">Tabulation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>


                    <div className="flex items-center space-x-2">
                        <Checkbox
                        id="has-header"
                        checked={hasHeader}
                        onCheckedChange={(checked) => setHasHeader(checked as boolean)}
                        />
                        <label
                        htmlFor="has-header"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        La première ligne est un en-tête
                        </label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file-upload">Fichier (.csv, .txt)</Label>
                        <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            <span>{fileName || 'Choisir un fichier'}</span>
                        </Button>
                        <input 
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                        />
                    </div>
                    </CardContent>
                </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prévisualisation des données</CardTitle>
                            <CardDescription>
                                Vérifiez que vos données sont correctement séparées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                {headerRow.length > 0 && (
                                  <TableHeader>
                                    <TableRow>
                                      {headerRow.map((header, index) => (
                                        <TableHead key={index} className="whitespace-nowrap">{header}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                )}
                                <TableBody>
                                  {dataRows.slice(0, 10).map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                      {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex} className="text-xs whitespace-nowrap">{cell}</TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                             {parsedData.length === 0 && (
                              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                <p>Aucun fichier sélectionné ou fichier vide.</p>
                              </div>
                            )}
                          </ScrollArea>
                           <div className="mt-4 flex justify-end">
                                <Button onClick={() => setActiveTab('mapping')} disabled={!fileContent}>
                                    Étape suivante <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="mapping">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Étape 2: Mappage des Colonnes</CardTitle>
                    <CardDescription>
                        Faites correspondre chaque colonne de votre fichier à un champ de l'application. Les champs avec * sont obligatoires.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4 pr-6">
                      {headerRow.map((header, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 items-center p-2 border rounded-md">
                          <div className="font-semibold text-sm">
                              <p>{header}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                  Ex: "{dataRows[0] ? dataRows[0][index] : ''}"
                              </p>
                          </div>
                          <Select value={mappings[index] || 'ignore'} onValueChange={(value) => setMappings(prev => ({...prev, [index]: value}))}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Choisir un champ..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {availableFields.map(field => (
                                      <SelectItem key={field as string} value={field as string}>
                                          {fieldLabels[field as string] || field}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                   </ScrollArea>
                   <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={() => setActiveTab('file')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                        </Button>
                        <Button onClick={handleGenerateJson}>
                            Générer le JSON <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="json">
            <Card className="mt-4">
                 <CardHeader>
                    <CardTitle>Étape 3: JSON Généré & Importation</CardTitle>
                    <CardDescription>
                        Voici les données formatées en JSON. Vérifiez-les avant d'importer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] border rounded-md bg-muted/50 p-4">
                        <pre className="text-xs">{jsonData ? JSON.stringify(jsonData, null, 2) : "Aucune donnée générée."}</pre>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="justify-between">
                     <Button variant="outline" onClick={() => setActiveTab('mapping')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                    </Button>
                    <Button onClick={() => setConfirmImportOpen(true)} disabled={isImporting}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isImporting ? 'Importation en cours...' : 'Importer les Données'}
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog open={isConfirmImportOpen} onOpenChange={setConfirmImportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'importation ?</AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                  Vous êtes sur le point d'importer {jsonData?.length || 0} {dataType}.
                  Cette action est irréversible et ajoutera de nouvelles données à votre application.
              </p>
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <p>
                    Veuillez vous assurer que les identifiants (Code Client, Code Fournisseur) n'existent pas déjà.
                    Les doublons provoqueront des erreurs.
                </p>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              <Check className="mr-2 h-4 w-4" />
              Confirmer et Importer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

