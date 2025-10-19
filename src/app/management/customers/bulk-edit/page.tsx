
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
import type { Customer } from '@/lib/types';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const fieldOptions: { value: keyof Customer; label: string; type: 'text' | 'boolean' }[] = [
  { value: 'city', label: 'Ville', type: 'text' },
  { value: 'country', label: 'Pays', type: 'text' },
  { value: 'postalCode', label: 'Code Postal', type: 'text' },
  { value: 'isDisabled', label: 'Désactivé', type: 'boolean' },
];

function BulkEditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, updateCustomer } = usePos();
  const { toast } = useToast();

  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [fieldToEdit, setFieldToEdit] = useState<keyof Customer>('city');
  const [newValue, setNewValue] = useState<any>('');

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',');
    if (ids && customers) {
      const filteredCustomers = customers.filter(customer => ids.includes(customer.id));
      setSelectedCustomers(filteredCustomers);
    }
  }, [searchParams, customers]);

  const currentField = useMemo(() => {
    return fieldOptions.find(f => f.value === fieldToEdit);
  }, [fieldToEdit]);

  const backLink = useMemo(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('ids');
      return `/management/customers?${params.toString()}`;
  }, [searchParams]);

  const handleApplyChanges = async () => {
    if (!currentField || newValue === '') {
      toast({ variant: 'destructive', title: 'Action invalide', description: 'Veuillez sélectionner un champ et une nouvelle valeur.' });
      return;
    }

    let parsedValue = newValue;
    if (currentField.type === 'boolean') {
      parsedValue = newValue === 'true';
    }

    const promises = selectedCustomers.map(customer => {
      const updatedCustomer = { ...customer, [fieldToEdit]: parsedValue };
      return updateCustomer(updatedCustomer);
    });

    await Promise.all(promises);

    toast({ title: 'Mise à jour réussie', description: `${selectedCustomers.length} client(s) ont été mis à jour.` });
    router.push(backLink);
  };

  return (
    <>
      <PageHeader
        title="Modification en masse des clients"
        subtitle={`Vous modifiez ${selectedCustomers.length} client(s).`}
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
                  setFieldToEdit(value as keyof Customer);
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
                  {currentField.type === 'boolean' ? (
                     <Select onValueChange={setNewValue} value={newValue}>
                      <SelectTrigger id="new-value">
                        <SelectValue placeholder="Sélectionner une valeur..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="new-value" type="text" value={newValue} onChange={e => setNewValue(e.target.value)} />
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleApplyChanges} className="w-full">
                <Save className="mr-2 h-4 w-4"/>
                Appliquer à {selectedCustomers.length} clients
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Clients sélectionnés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[60vh] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ville</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.city}</TableCell>
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

export default function BulkEditCustomersPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <BulkEditPageContent />
        </Suspense>
    )
}
