'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, ChevronRight, Check, AlertCircle, Type, Save, Trash2, ChevronDown, X, CheckCircle, XCircle, HelpCircle, FileSignature, ArrowUpDown, Rows, Settings } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


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
    'vatCode',
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
    'saleDate', 
    'saleTime',
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
    'vatCode',
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
  pieceName: 'Nom de la pièce *',
  ticketNumber: 'Numéro de pièce *',
  date: 'Date (JJ/MM/AAAA HH:mm) *',
  saleDate: 'Date de la pièce (JJ/MM/AAAA) *',
  saleTime: 'Heure de la pièce (HH:mm)',
  customerCode: 'Code Client',
  customerName: 'Nom du Client',
  itemBarcode: "Code-barres de l'article *",
  itemName: "Désignation de l'article",
  quantity: 'Quantité *',
  unitPriceHT: "Prix Unitaire HT *",
  totalLineHT: 'Prix Total Ligne HT',
  vatCode: 'Code de TVA *',
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
    ventes_completes: ['pieceName', 'ticketNumber', 'saleDate', 'itemBarcode', 'itemName', 'quantity', 'unitPriceHT', 'vatCode'],
};

type MappingMode = 'column' | 'fixed';
type MappedColumnBehavior = 'disable' | 'hide';

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
          {(report.newSalesCount !== undefined || report.newCustomersCount !== undefined || report.newItemsCount !== undefined) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Créations automatiques</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-8">
                 {report.newSalesCount !== undefined && (
                  <div>
                    <div className="text-2xl font-bold">{report.newSalesCount}</div>
                    <p className="text-xs text-muted-foreground">Pièces de vente</p>
                  </div>
                )}
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
  const [mappedColumnBehavior, setMappedColumnBehavior] = usePersistentState<MappedColumnBehavior>('import.mappedColumnBehavior', 'disable');
  
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [isConfirmImportOpen, setConfirmImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [templateName, setTemplateName] = useState('');
  
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFormatSectionOpen, setIsFormatSectionOpen] = useState(true);

  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

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
        setSortConfig(null);
        setActiveTab('file'); 
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setFileName('');
    setFileContent('');
    setJsonData(null);
    setSortConfig(null);
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

  const sortedDataRows = useMemo(() => {
    if (!sortConfig) return dataRows;
    
    const sorted = [...dataRows].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      const isNumeric = !isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue));
      
      if (isNumeric) {
        return sortConfig.direction === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
    
    return sorted;
  }, [dataRows, sortConfig]);

  const requestSort = (key: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (columnIndex: number) => {
    if (!sortConfig || sortConfig.key !== columnIndex) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };
  
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

  const handleClearMapping = () => {
    setMappings({});
    setMappingModes({});
    setFixedValues({});
    toast({ title: 'Mappage réinitialisé' });
  };

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
              if (['price', 'purchasePrice', 'marginPercentage', 'stock', 'lowStockThreshold', 'unitPriceHT', 'quantity', 'totalLineHT', 'vatCode', 'vatAmount', 'discountAmount', 'totalTTC', 'paymentCash', 'paymentCard', 'paymentCheck', 'paymentOther', 'itemPurchasePrice'].includes(fieldName as string)) {
                  value = parseFloat(value.replace(',', '.')) as any || 0;
              } else if (['isDisabled'].includes(fieldName as string)) {
                  value = ['true', 'oui', '1', 'yes'].includes(value.toLowerCase()) as any;
              }
              obj[fieldName] = value;
          } else {
              const columnIndex = mappings[fieldName as string];
              if (columnIndex !== null && columnIndex !== undefined && columnIndex < row.length) {
                  let value: any = row[columnIndex] ? row[columnIndex].trim() : '';
                  if (['price', 'purchasePrice', 'marginPercentage', 'stock', 'lowStockThreshold', 'unitPriceHT', 'quantity', 'totalLineHT', 'vatCode', 'vatAmount', 'discountAmount', 'totalTTC', 'paymentCash', 'paymentCard', 'paymentCheck', 'paymentOther', 'itemPurchasePrice'].includes(fieldName as string)) {
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Étape 1: Fichier &amp; Format</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!fileContent}>Étape 2: Mappage</TabsTrigger>
            <TabsTrigger value="json" disabled={!jsonData}>Étape 3: JSON &amp; Import</TabsTrigger>
        </TabsList>
        <TabsContent value="file">
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                <Collapsible open={isFormatSectionOpen} onOpenChange={setIsFormatSectionOpen} asChild>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div className="space-y-1.5">
                                <CardTitle>Sélection &amp; Format</CardTitle>
                                <CardDescription>
                                    Choisissez le type de données et le format.
                                </CardDescription>
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", !isFormatSectionOpen && "-rotate-90")} />
                                </Button>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent className="space-y-6 pt-2">
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
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
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
                                       <TableHead className="w-12">#</TableHead>
                                      {headerRow.map((header, index) => (
                                        <TableHead key={index} className="whitespace-nowrap">
                                           <Button variant="ghost" onClick={() => requestSort(index)} className="px-2">
                                              {header}
                                              {getSortIcon(index)}
                                           </Button>
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                )}
                                <TableBody>
                                  {sortedDataRows.slice(0, 100).map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                      <TableCell className="text-xs text-muted-foreground">{rowIndex + 1}</TableCell>
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
                 <CardHeader className="pb-4 pt-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Étape 2: Mappage des Colonnes</CardTitle>
                            <CardDescription>
                                Faites correspondre chaque champ requis (*) à une colonne de votre fichier.
                            </CardDescription>
                        </div>
                         {fileName && (
                            <div className="text-sm text-muted-foreground text-right flex-shrink-0">
                                <p className="font-semibold">{fileName}</p>
                                <p>{parsedData.length} lignes détectées</p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-2 mb-4 p-2 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Modèles:</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                    Appliquer
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
                        </div>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Nom du modèle..." value={templateName} onChange={e => setTemplateName(e.target.value)} className="h-8 text-xs max-w-40" />
                            <Button onClick={handleSaveTemplate} size="sm" className="h-8"><Save className="mr-2 h-4 w-4" />Sauvegarder</Button>
                             {mappingTemplates.filter(t => t.dataType === dataType).length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
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
                        <div className="flex-grow"></div>
                        <div className="flex items-center gap-2">
                            {(dataType === 'ventes' || dataType === 'ventes_completes') && (
                                <Accordion type="single" collapsible className="w-auto">
                                    <AccordionItem value="help" className="border-b-0">
                                    <AccordionTrigger className="p-0 hover:no-underline">
                                        <div className="flex items-center gap-2 text-sm text-primary">
                                        <HelpCircle className="h-4 w-4" />
                                        Aide
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Card className="mt-2">
                                            <CardContent className="pt-4 text-xs">
                                                <div className="prose prose-sm max-w-none text-muted-foreground">
                                                    <p>L'importation des ventes se fait ligne par ligne, où chaque ligne de votre fichier CSV représente une ligne d'article dans une pièce (facture, ticket...).</p>
                                                    <ul>
                                                        <li>Utilisez le champ <strong>Numéro de pièce</strong> pour regrouper les lignes d'articles appartenant à la même transaction.</li>
                                                        <li>Les champs obligatoires sont marqués d'un astérisque (*).</li>
                                                        <li>Pour les paiements, vous pouvez utiliser une ou plusieurs colonnes (ex: `paymentCash`, `paymentCard`). Le système additionnera les montants.</li>
                                                        <li>Si une ligne ne contient pas de code-barres article, sa désignation est ajoutée comme une note à l'article de la ligne précédente.</li>
                                                    </ul>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}
                           <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Settings className="h-4 w-4"/></Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                     <div className="space-y-4">
                                        <Label>Comportement des colonnes mappées</Label>
                                        <RadioGroup value={mappedColumnBehavior} onValueChange={(v) => setMappedColumnBehavior(v as MappedColumnBehavior)}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="disable" id="bh-disable" />
                                                <Label htmlFor="bh-disable">Griser les colonnes utilisées</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="hide" id="bh-hide" />
                                                <Label htmlFor="bh-hide">Masquer les colonnes utilisées</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" size="sm" className="h-8" onClick={handleClearMapping}>Effacer</Button>
                        </div>
                    </div>

                  <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pr-6">
                      {availableFields.filter(f => f !== 'ignore').map((field) => {
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
                                          {headerRow.map((header, index) => {
                                              const isDisabled = mappedColumnBehavior === 'disable' && mappedColumnIndices.has(index) && mappings[field as string] !== index;
                                              const isHidden = mappedColumnBehavior === 'hide' && mappedColumnIndices.has(index) && mappings[field as string] !== index;
                                              if (isHidden) return null;
                                              return (
                                                <SelectItem key={index} value={String(index)} disabled={isDisabled}>
                                                  {header}
                                                </SelectItem>
                                              )
                                          })}
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
                    <CardTitle>Étape 3: JSON &amp; Importation</CardTitle>
                    <CardDescription>
                        Voici les données formatées en JSON. Vérifiez-les avant d'importer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="import-limit" className="whitespace-nowrap">Lignes à importer</Label>
                            <Input
                                id="import-limit"
                                type="number"
                                value={importLimit}
                                onChange={(e) => setImportLimit(Number(e.target.value))}
                                min={0}
                                className="w-32 h-9"
                                placeholder="Toutes"
                            />
                            <p className="text-sm text-muted-foreground">({jsonData?.length || 0} lignes au total)</p>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setActiveTab('mapping')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                            </Button>
                            <Button onClick={() => setConfirmImportOpen(true)} disabled={isImporting}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isImporting ? 'Importation...' : 'Importer les Données'}
                            </Button>
                        </div>
                    </div>
                     <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Vérification des doublons</AlertTitle>
                        <p>
                            Le système vérifiera les doublons pour les champs obligatoires (Code Client, Code Fournisseur, Code-barres article, Numéro de pièce). Les lignes avec des identifiants déjà existants seront ignorées.
                        </p>
                    </Alert>
                    
                    <ScrollArea className="h-[400px] border rounded-md bg-muted/50 p-4">
                        <pre className="text-xs">{jsonData ? JSON.stringify(jsonData.slice(0, importLimit || undefined), null, 2) : "Aucune donnée générée."}</pre>
                    </ScrollArea>
                </CardContent>
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
