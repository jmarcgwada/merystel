

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Item } from '@/lib/types';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const fieldOptions: { value: keyof Item; label: string; type: 'text' | 'number' | 'boolean' | 'select'; options?: any[] }[] = [
  { value: 'price', label: 'Prix de vente TTC', type: 'number' },
  { value: 'purchasePrice', label: "Prix d'achat HT", type: 'number' },
  { value: 'categoryId', label: 'Catégorie', type: 'select', options: [] },
  { value: 'supplierId', label: 'Fournisseur', type: 'select', options: [] },
  { value: 'vatId', label: 'TVA', type: 'select', options: [] },
  { value: 'marginPercentage', label: 'Marge (%)', type: 'number' },
  { value: 'stock', label: 'Stock', type: 'number' },
  { value: 'lowStockThreshold', label: 'Seuil de stock bas', type: 'number' },
  { value: 'isFavorite', label: 'Favori', type: 'boolean' },
  { value: 'isDisabled', label: 'Désactivé', type: 'boolean' },
];

function BulkEditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, categories, suppliers, vatRates, updateItem } = usePos();
  const { toast } = useToast();

  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [fieldToEdit, setFieldToEdit] = useState<keyof Item>('categoryId');
  const [newValue, setNewValue] = useState<any>('');

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',');
    if (ids && items) {
      const filteredItems = items.filter(item => ids.includes(item.id));
      setSelectedItems(filteredItems);
    }
  }, [searchParams, items]);

  const currentField = useMemo(() => {
    const field = fieldOptions.find(f => f.value === fieldToEdit);
    if (field?.value === 'categoryId') {
        field.options = categories.map(c => ({ value: c.id, label: c.name }));
    }
     if (field?.value === 'supplierId') {
        field.options = suppliers.map(s => ({ value: s.id, label: s.name }));
    }
    if (field?.value === 'vatId') {
        field.options = vatRates.map(v => ({ value: v.id, label: v.name }));
    }
    return field;
  }, [fieldToEdit, categories, suppliers, vatRates]);
  
  const backLink = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('ids');
    return `/management/items?${params.toString()}`;
  }, [searchParams]);

  const handleApplyChanges = async () => {
    if (!currentField || newValue === '') {
      toast({ variant: 'destructive', title: 'Action invalide', description: 'Veuillez sélectionner un champ et une nouvelle valeur.' });
      return;
    }

    let parsedValue = newValue;
    if (currentField.type === 'number') {
      parsedValue = parseFloat(newValue);
      if (isNaN(parsedValue)) {
        toast({ variant: 'destructive', title: 'Valeur invalide', description: 'Veuillez entrer un nombre valide.' });
        return;
      }
    } else if (currentField.type === 'boolean') {
      parsedValue = newValue === 'true';
    }

    const promises = selectedItems.map(item => {
      let updatedItem = { ...item, [fieldToEdit]: parsedValue };
      
      const purchasePrice = fieldToEdit === 'purchasePrice' ? parsedValue : (item.purchasePrice || 0);
      const additionalCosts = item.additionalCosts || 0;
      const costPrice = purchasePrice * (1 + additionalCosts / 100);
      const marginPercentage = fieldToEdit === 'marginPercentage' ? parsedValue : (item.marginPercentage || 0);
      const newVatId = fieldToEdit === 'vatId' ? parsedValue : item.vatId;
      const vatRateInfo = vatRates.find(v => v.id === newVatId);
      const vatRate = vatRateInfo ? vatRateInfo.rate / 100 : 0;
      
      if (fieldToEdit === 'purchasePrice' || fieldToEdit === 'marginPercentage' || fieldToEdit === 'vatId') {
        // Recalculate selling price
        const sellingPriceHT = costPrice * (1 + marginPercentage / 100);
        const newSellingPriceTTC = sellingPriceHT * (1 + vatRate);
        updatedItem.price = parseFloat(newSellingPriceTTC.toFixed(2));
      } else if (fieldToEdit === 'price') {
        // Recalculate margin
        const newSellingPriceTTC = parsedValue;
        if(costPrice > 0) {
            const sellingPriceHT = newSellingPriceTTC / (1 + vatRate);
            const newMargin = ((sellingPriceHT / costPrice) - 1) * 100;
            updatedItem.marginPercentage = parseFloat(newMargin.toFixed(2));
        }
      }

      return updateItem(updatedItem);
    });

    await Promise.all(promises);

    toast({ title: 'Mise à jour réussie', description: `${selectedItems.length} article(s) ont été mis à jour.` });
    router.push(backLink);
  };
  
  const isPricingField = ['price', 'purchasePrice', 'vatId', 'marginPercentage'].includes(fieldToEdit);

  return (
    <>
      <PageHeader
        title="Modification en masse d'articles"
        subtitle={`Vous modifiez ${selectedItems.length} article(s).`}
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href={backLink}>
            <ArrowLeft />
            Annuler
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Action de modification</CardTitle>
              <CardDescription>Choisissez le champ à modifier et sa nouvelle valeur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="field-select">Champ à modifier</Label>
                <Select value={fieldToEdit} onValueChange={(value) => {
                  setFieldToEdit(value as keyof Item);
                  setNewValue('');
                }}>
                  <SelectTrigger id="field-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentField && (
                <div className="space-y-2">
                  <Label htmlFor="new-value">Nouvelle valeur</Label>
                  {currentField.type === 'select' && (
                    <Select onValueChange={setNewValue} value={newValue}>
                      <SelectTrigger id="new-value">
                        <SelectValue placeholder="Sélectionner une valeur..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentField.options?.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {currentField.type === 'boolean' && (
                     <Select onValueChange={setNewValue} value={newValue}>
                      <SelectTrigger id="new-value">
                        <SelectValue placeholder="Sélectionner une valeur..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {(currentField.type === 'text' || currentField.type === 'number') && (
                    <Input id="new-value" type={currentField.type} value={newValue} onChange={e => setNewValue(e.target.value)} />
                  )}
                </div>
              )}
              
               {isPricingField && (
                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900">
                  <AlertTitle>Calcul automatique</AlertTitle>
                  <AlertDescription>
                    La modification de ce champ entraînera un recalcul automatique des prix et des marges pour les articles sélectionnés.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleApplyChanges} className="w-full">
                <Save className="mr-2 h-4 w-4"/>
                Appliquer à {selectedItems.length} articles
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Articles sélectionnés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[60vh] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Code-barres</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{categories.find(c => c.id === item.categoryId)?.name}</TableCell>
                        <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function BulkEditPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <BulkEditPageContent />
        </Suspense>
    )
}
