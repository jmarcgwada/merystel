
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, ChevronRight, Check, AlertCircle, Type, Save, Trash2, ChevronDown, X, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import type { Item, Customer, Supplier, MappingTemplate } from '@/lib/types';
import { usePos, type ImportReport } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Dialog, DialogClose, DialogFooter as ReportDialogFooter, DialogHeader as ReportDialogHeader, DialogTitle as ReportDialogTitle, DialogDescription as ReportDialogDescription, DialogContent as ReportDialogContent } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const customerFields: (keyof Customer | 'ignore')[] = ['ignore', 'id', 'name', 'email', 'phone', 'phone2', 'address', 'postalCode', 'city', 'country', 'iban', 'notes', 'isDisabled'];
const itemFields: (keyof Item | 'ignore')[] = ['ignore', 'name', 'price', 'purchasePrice', 'categoryId', 'supplierId', 'vatId', 'description', 'description2', 'barcode', 'marginPercentage', 'stock', 'lowStockThreshold', 'isDisabled'];
const supplierFields: (keyof Supplier | 'ignore')[] = ['ignore', 'id', 'name', 'contactName', 'email', 'phone', 'address', 'postalCode', 'city', 'country', 'siret', 'website', 'notes', 'iban', 'bic'];
const saleFields: string[] = [
    'ignore', 
    'pieceName',
    'ticketNumber', 
    'date', 
    'customerCode', 
    'customerName', 
    'itemBarcode', 
    'itemName', 
    'quantity', 
    'unitPriceHT',
    'totalLineHT',
    'vatRate',
    'vatAmount',
    'discountPercentage',
    'discountAmount',
    'totalTTC',
    'paymentCash',
    'paymentCard',
    'paymentCheck',
    'paymentOther',
    'sellerName',
];

const completeSaleFields: string[] = [
    'ignore', 
    'pieceName',
    'ticketNumber', 
    'date', 
    'customerCode', 
    'customerName', 
    'customerEmail',
    'customerPhone',
    'customerAddress',
    'customerPostalCode',
    'customerCity',
    'itemBarcode', 
    'itemName', 
    'itemCategory',
    'quantity', 
    'unitPriceHT',
    'itemPurchasePrice',
    'vatRate',
    'paymentCash',
    'paymentCard',
    'paymentCheck',
    'paymentOther',
    'sellerName',
];


const fieldLabels: Record<string, string> = {
  ignore: 'Ignorer cette colonne',
  id: 'ID / Code *',
  name: 'Nom *',
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
  price: 'Prix de vente *',
  purchasePrice: "Prix d'achat",
  categoryId: 'Nom de la Catégorie',
  supplierId: 'ID Fournisseur',
  vatId: 'Code de TVA *',
  description: 'Description',
  description2: 'Description 2',
  barcode: 'Code-barres *',
  marginPercentage: 'Marge (%)',
  stock: 'Stock actuel',
  lowStockThreshold: 'Seuil de stock bas',
  contactName: 'Nom du contact',
  siret: 'SIRET',
  website: 'Site Web',
  bic: 'BIC / SWIFT',
  pieceName: 'Nom de la pièce (Facture, Ticket...)',
  ticketNumber: 'Numéro de pièce *',
  date: 'Date (JJ/MM/AA HH:mm)',
  customerCode: 'Code Client',
  customerName: 'Nom du Client',
  itemBarcode: "Code-barres de l'article *",
  itemName: "Désignation de l'article",
  quantity: 'Quantité *',
  unitPriceHT: "Prix Unitaire HT *",
  totalLineHT: 'Prix Total Ligne HT',
  vatRate: 'Code de TVA appliqué',
  vatAmount: 'Montant TVA de la ligne',
  discountPercentage: 'Remise en %',
  discountAmount: 'Remise en montant',
  totalTTC: 'Total TTC de la ligne',
  paymentCash: 'Paiement en espèces',
  paymentCard: 'Paiement par carte',
  paymentCheck: 'Paiement par chèque',
  paymentOther: 'Autre paiement',
  sellerName: 'Nom du vendeur',
  customerEmail: 'Email Client',
  customerPhone: 'Tél. Client',
  customerAddress: 'Adresse Client',
  customerPostalCode: 'CP Client',
  customerCity: 'Ville Client',
  itemCategory: 'Catégorie Article',
  itemPurchasePrice: "Prix d'achat Article",
};

const requiredFieldsMap: Record<string, string[]> = {
    clients: ['id', 'name'],
    articles: ['name', 'price', 'vatId', 'barcode'],
    fournisseurs: ['id', 'name'],
    ventes: ['ticketNumber', 'itemBarcode', 'quantity', 'unitPriceHT'],
    ventes_completes: ['ticketNumber', 'itemBarcode', 'itemName', 'quantity', 'unitPriceHT', 'vatRate', 'customerName', 'customerCode'],
};

type MappingMode = 'column' | 'fixed';

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }, [key, state]);

    return [state, setState];
  }

function ImportReportDialog({ report, isOpen, onClose }: { report: ImportReport | null; isOpen: boolean; onClose: () => void; }) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ReportDialogContent className="max-w-2xl">
        <ReportDialogHeader>
          <ReportDialogTitle>Rapport d'Importation</ReportDialogTitle>
          <ReportDialogDescription>
            Résumé de l'opération d'importation des données.
          </ReportDialogDescription>
        </ReportDialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Succès</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.successCount}</div>
                <p className="text-xs text-muted-foreground">{report.successCount > 1 ? 'lignes importées' : 'ligne importée'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Échecs</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.errorCount}</div>
                 <p className="text-xs text-muted-foreground">{report.errorCount > 1 ? 'lignes ignorées' : 'ligne ignorée'}</p>
              </CardContent>
            </Card>
          </div>
          {(report.newCustomersCount !== undefined || report.newItemsCount !== undefined) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Créations automatiques</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-8">
                {report.newCustomersCount !== undefined && (
                  <div>
                    <div className="text-2xl font-bold">{report.newCustomersCount}</div>
                    <p className="text-xs text-muted-foreground">Nouveaux clients</p>
                  </div>
                )}
                {report.newItemsCount !== undefined && (
                  <div>
                    <div className="text-2xl font-bold">{report.newItemsCount}</div>
                    <p className="text-xs text-muted-foreground">Nouveaux articles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {report.errorCount > 0 && (
            <div>
              <Label>Détails des erreurs :</Label>
              <ScrollArea className="h-40 mt-2 rounded-md border p-2 bg-muted/50">
                <div className="text-sm space-y-1">
                  {report.errors.map((error, index) => (
                    <p key={index} className="text-destructive font-mono text-xs">{index + 1}: {error}</p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <ReportDialogFooter>
          <DialogClose asChild>
            <Button>Fermer</Button>
          </DialogClose>
        </ReportDialogFooter>
      </ReportDialogContent>
    </Dialog>
  );
}


export default function ImportDataPage() {
  const { toast } = useToast();
  const { importDataFromJson, importLimit, setImportLimit, mappingTemplates, addMappingTemplate, deleteMappingTemplate } = usePos();
  const [activeTab, setActiveTab] = useState('file');
  const [dataType, setDataType] = usePersistentState('import.dataType', 'clients');
  const [separator, setSeparator] = useState(';');
  const [hasHeader, setHasHeader] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mappings, setMappings] = useState<Record<string, number | null>>({});
  const [mappingModes, setMappingModes] = useState<Record<string, 'column' | 'fixed'>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [isConfirmImportOpen, setConfirmImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [templateName, setTemplateName] = useState('');
  
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
        setJsonData(null); 
        setMappings({});
        setMappingModes({});
        setFixedValues({});
        setActiveTab('file'); 
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setFileName('');
    setFileContent('');
    setJsonData(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const parsedData = useMemo(() => {
    if (!fileContent) return [];
    return fileContent.trim().split(/\r?\n/).map(line => line.split(separator));
  }, [fileContent, separator]);

  const headerRow = useMemo(() => (hasHeader && parsedData.length > 0) ? parsedData[0] : (parsedData.length > 0 ? parsedData[0].map((_, i) => `Colonne ${i + 1}`) : []), [parsedData, hasHeader]);
  const dataRows = useMemo(() => hasHeader ? parsedData.slice(1) : parsedData, [parsedData, hasHeader]);
  
  const getAvailableFields = () => {
    switch (dataType) {
        case 'clients': return customerFields;
        case 'articles': return itemFields;
        case 'fournisseurs': return supplierFields;
        case 'ventes': return saleFields;
        case 'ventes_completes': return completeSaleFields;
        default: return [];
    }
  };

  const availableFields = getAvailableFields();

  const handleGenerateJson = () => {
    const requiredForType = requiredFieldsMap[dataType] || [];
    
    const mappedFields = Object.keys(mappings).filter(key => mappings[key] !== null && mappings[key] !== undefined)
                           .concat(Object.keys(fixedValues).filter(key => fixedValues[key] !== ''));

    const missingFields = requiredForType.filter(field => !mappedFields.includes(field));

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: `Veuillez mapper les champs suivants: ${missingFields.map(f => fieldLabels[f] || f).join(', ')}`,
      });
      return;
    }

    const generated: any[] = [];
    const rowsToProcess = dataRows.slice(0, importLimit || undefined);

    rowsToProcess.forEach(row => {
        const obj: any = {};
        availableFields.forEach(fieldName => {
          if(fieldName === 'ignore') return;

          const mode = mappingModes[fieldName as string] || 'column';
          if (mode === 'fixed') {
              let value = fixedValues[fieldName as string] || '';
              if (['price', 'purchasePrice', 'marginPercentage', 'stock', 'lowStockThreshold', 'unitPriceHT', 'quantity', 'totalLineHT', 'vatRate', 'vatAmount', 'discountAmount', 'totalTTC', 'paymentCash', 'paymentCard', 'paymentCheck', 'paymentOther', 'itemPurchasePrice'].includes(fieldName as string)) {
                  value = parseFloat(value.replace(',', '.')) as any || 0;
              } else if (['isDisabled'].includes(fieldName as string)) {
                  value = ['true', 'oui', '1', 'yes'].includes(value.toLowerCase()) as any;
              }
              obj[fieldName] = value;
          } else {
              const columnIndex = mappings[fieldName as string];
              if (columnIndex !== null && columnIndex !== undefined && columnIndex < row.length) {
                  let value: any = row[columnIndex] ? row[columnIndex].trim() : '';
                  if (['price', 'purchasePrice', 'marginPercentage', 'stock', 'lowStockThreshold', 'unitPriceHT', 'quantity', 'totalLineHT', 'vatRate', 'vatAmount', 'discountAmount', 'totalTTC', 'paymentCash', 'paymentCard', 'paymentCheck', 'paymentOther', 'itemPurchasePrice'].includes(fieldName as string)) {
                      value = parseFloat(value.replace(',', '.')) || 0;
                  } else if (['isDisabled'].includes(fieldName as string)) {
                      value = ['true', 'oui', '1', 'yes'].includes(value.toLowerCase());
                  }
                  obj[fieldName] = value;
              }
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

    const dataToImport = jsonData.slice(0, importLimit || undefined);
    const report = await importDataFromJson(dataType, dataToImport);

    setIsImporting(false);
    setImportReport(report);
    setIsReportOpen(true);
  }

  const mappedColumnIndices = useMemo(() => new Set(Object.values(mappings)), [mappings]);

  const toggleMappingMode = (field: string) => {
    setMappingModes(prev => ({
      ...prev,
      [field]: (prev[field] === 'fixed' ? 'column' : 'fixed')
    }));
    // Clear mappings when switching modes to avoid conflicts
    setMappings(prev => ({ ...prev, [field]: null }));
    setFixedValues(prev => ({ ...prev, [field]: '' }));
  };
  
  const handleSaveTemplate = () => {
      if(!templateName) {
          toast({ variant: "destructive", title: "Nom du modèle requis" });
          return;
      }
      const newTemplate: MappingTemplate = {
          name: templateName,
          dataType,
          mappings,
          mappingModes,
          fixedValues,
      };
      addMappingTemplate(newTemplate);
      setTemplateName('');
  };

  const applyTemplate = (template: MappingTemplate) => {
      if(template.dataType !== dataType) {
          toast({ variant: 'destructive', title: 'Type de données incorrect', description: `Ce modèle est pour le type "${template.dataType}".`});
          return;
      }
      setMappings(template.mappings || {});
      setMappingModes(template.mappingModes || {});
      setFixedValues(template.fixedValues || {});
      setTemplateName(template.name);
      toast({ title: 'Modèle appliqué !'});
  };


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
                            <SelectItem value="ventes_completes">Ventes complètes (création auto)</SelectItem>
                            <SelectItem value="clients">Clients</SelectItem>
                            <SelectItem value="articles">Articles</SelectItem>
                            <SelectItem value="fournisseurs">Fournisseurs</SelectItem>
                            <SelectItem value="ventes">Pièces de Vente (standard)</SelectItem>
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
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>{fileName || 'Choisir un fichier'}</span>
                            </Button>
                            {fileName && (
                                <Button variant="ghost" size="icon" onClick={clearFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
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
                                  <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                      {headerRow.map((header, index) => (
                                        <TableHead key={index} className="whitespace-nowrap">{header}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                )}
                                <TableBody>
                                  {dataRows.slice(0, 100).map((row, rowIndex) => (
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
                              <ScrollBar orientation="horizontal" />
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Étape 2: Mappage des Colonnes</CardTitle>
                      <CardDescription>
                          Faites correspondre chaque champ de l'application à une colonne de votre fichier. Les champs avec * sont obligatoires.
                      </CardDescription>
                    </div>
                     {fileName && (
                        <div className="text-sm text-muted-foreground text-right flex-shrink-0 ml-4">
                            <p className="font-semibold">{fileName}</p>
                            <p>{parsedData.length} lignes détectées</p>
                        </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6 p-4 border rounded-lg">
                        <Label>Modèles</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-between">
                                Appliquer un modèle
                                <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {mappingTemplates.filter(t => t.dataType === dataType).length === 0 && <DropdownMenuItem disabled>Aucun modèle</DropdownMenuItem>}
                                {mappingTemplates.filter(t => t.dataType === dataType).map(template => (
                                    <DropdownMenuItem key={template.name} onSelect={() => applyTemplate(template)}>
                                        {template.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Nom du nouveau modèle..." value={templateName} onChange={e => setTemplateName(e.target.value)} />
                            <Button onClick={handleSaveTemplate}><Save className="mr-2 h-4 w-4" />Sauvegarder</Button>
                        </div>
                        {mappingTemplates.filter(t => t.dataType === dataType).length > 0 && (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <div className="flex flex-col text-sm">
                                        <div className="p-2 font-semibold border-b">Supprimer un modèle</div>
                                        {mappingTemplates.filter(t => t.dataType === dataType).map(template => (
                                            <Button key={template.name} variant="ghost" className="justify-start p-2" onClick={() => deleteMappingTemplate(template.name)}>
                                                {template.name}
                                            </Button>
                                        ))}
                                    </div>
                            </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {(dataType === 'ventes' || dataType === 'ventes_completes') && (
                        <Accordion type="single" collapsible className="mb-6">
                            <AccordionItem value="help">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-sm text-primary">
                                <HelpCircle className="h-4 w-4" />
                                Aide pour l'importation des ventes
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="prose prose-sm max-w-none text-muted-foreground p-4 bg-muted/50 rounded-md">
                                <p>L'importation des ventes se fait ligne par ligne, où chaque ligne de votre fichier CSV représente une ligne d'article dans une pièce (facture, ticket...).</p>
                                <ul>
                                    <li>Utilisez le champ <strong>Numéro de pièce</strong> pour regrouper les lignes d'articles appartenant à la même transaction.</li>
                                    <li>Les champs obligatoires sont marqués d'un astérisque (*). Assurez-vous qu'ils sont bien mappés.</li>
                                    <li>Pour les paiements, vous pouvez utiliser une ou plusieurs colonnes (ex: `paymentCash`, `paymentCard`). Le système additionnera les montants pour obtenir le paiement total.</li>
                                     <li>Si une ligne ne contient pas de numéro de pièce, son champ 'Désignation' sera ajouté aux notes de la pièce précédente.</li>
                                </ul>
                                </div>
                            </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                  <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4 pr-6">
                      {availableFields.filter(f => f !== 'ignore').map((field) => {
                        const required = requiredFieldsMap[dataType]?.includes(field as string);
                        const currentMode = mappingModes[field as string] || 'column';
                        return (
                            <div key={field as string} className={cn("grid grid-cols-2 gap-4 items-center p-2 border rounded-md transition-colors", currentMode === 'fixed' && "bg-blue-50 dark:bg-blue-900/20")}>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => toggleMappingMode(field as string)}>
                                    <Type className={cn("h-4 w-4 transition-colors", currentMode === 'fixed' && "text-blue-600")} />
                                  </Button>
                                  <Label className="font-semibold text-sm">
                                    {fieldLabels[field as string] || field}
                                  </Label>
                                </div>
                                {currentMode === 'column' ? (
                                  <Select
                                    value={String(mappings[field as string] ?? 'ignore')}
                                    onValueChange={(value) => setMappings(prev => ({
                                      ...prev, 
                                      [field as string]: value === 'ignore' ? null : Number(value)
                                    }))}
                                  >
                                      <SelectTrigger>
                                          <SelectValue placeholder="Choisir une colonne..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="ignore">Ignorer</SelectItem>
                                          {headerRow.map((header, index) => (
                                              <SelectItem 
                                                key={index} 
                                                value={String(index)} 
                                                disabled={mappedColumnIndices.has(index) && mappings[field as string] !== index}
                                              >
                                                {header}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                ) : (
                                  <Input 
                                    placeholder="Saisir la valeur fixe..."
                                    value={fixedValues[field as string] || ''}
                                    onChange={e => setFixedValues(prev => ({...prev, [field as string]: e.target.value}))}
                                    className="bg-background border-blue-300 focus-visible:ring-blue-400"
                                  />
                                )}
                            </div>
                        );
                      })}
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
                    <CardTitle>Étape 3: JSON & Importation</CardTitle>
                    <CardDescription>
                        Voici les données formatées en JSON. Vérifiez-les avant d'importer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Vérification des doublons</AlertTitle>
                        <p>
                            Le système vérifiera les doublons pour les champs obligatoires (Code Client, Code Fournisseur, Code-barres article, Numéro de pièce). Les lignes avec des identifiants déjà existants seront ignorées.
                        </p>
                    </Alert>
                    <div className="mb-4 space-y-2">
                        <Label htmlFor="import-limit">Nombre de lignes à importer (0 ou vide pour tout importer)</Label>
                        <Input 
                            id="import-limit" 
                            type="number" 
                            value={importLimit} 
                            onChange={(e) => setImportLimit(Number(e.target.value))} 
                            min={0} 
                            className="w-48"
                        />
                    </div>
                    <ScrollArea className="h-[400px] border rounded-md bg-muted/50 p-4">
                        <pre className="text-xs">{jsonData ? JSON.stringify(jsonData.slice(0, importLimit || undefined), null, 2) : "Aucune donnée générée."}</pre>
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
                Vous êtes sur le point d'importer {jsonData?.slice(0, importLimit || undefined).length || 0} {dataType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attention</AlertTitle>
              <p>
                  Veuillez vous assurer que les identifiants (Code Client, Code Fournisseur, Code-barres article, Numéro de pièce) n'existent pas déjà.
                  Les doublons provoqueront des erreurs.
              </p>
            </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              <Check className="mr-2 h-4 w-4" />
              Confirmer et Importer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImportReportDialog 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={importReport}
      />
    </>
  );
}
