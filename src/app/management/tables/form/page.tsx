

'use client';

import React, { useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft } from 'lucide-react';
import type { Table } from '@/lib/types';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  covers: z.coerce.number().min(0, { message: 'Le nombre de couverts doit être positif.' }).optional(),
  description: z.string().optional(),
});

type TableFormValues = z.infer<typeof formSchema>;

function TableForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { tables, addTable, updateTable } = usePos();

  const tableId = searchParams.get('id');
  const isEditMode = Boolean(tableId);
  const tableToEdit = isEditMode ? tables.find(t => t.id === tableId) : null;

  const form = useForm<TableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      covers: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (isEditMode && tableToEdit) {
      form.reset({
        name: tableToEdit.name,
        covers: tableToEdit.covers || 0,
        description: tableToEdit.description || '',
      });
    } else {
      form.reset({
        name: '',
        covers: 0,
        description: '',
      });
    }
  }, [isEditMode, tableToEdit, form]);

  function onSubmit(data: TableFormValues) {
    if (isEditMode && tableToEdit) {
      const updatedTable: Table = {
        ...tableToEdit,
        ...data,
      };
      updateTable(updatedTable);
      toast({ title: 'Table modifiée', description: `La table "${data.name}" a été mise à jour.` });
    } else {
      addTable(data);
      toast({ title: 'Table créée', description: `La table "${data.name}" a été ajoutée.` });
    }
    router.push('/management/tables');
  }

  return (
    <>
      <PageHeader
        title={isEditMode ? "Modifier la table" : 'Ajouter une nouvelle table'}
        subtitle={isEditMode ? "Mettez à jour les détails de la table." : "Remplissez le formulaire pour créer une table."}
      >
        <Button variant="outline" asChild className="btn-back">
          <Link href="/management/tables">
            <ArrowLeft />
            Retour à la liste
          </Link>
        </Button>
      </PageHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 max-w-xl space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Détails de la table</CardTitle>
              <CardDescription>
                {isEditMode ? `Modification de la table n°${tableToEdit?.number}` : "Fournissez les informations de la nouvelle table."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la table</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Terrasse 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="covers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de couverts</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="ex: Près de la fenêtre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
             <Button type="submit" size="lg">
                {isEditMode ? 'Sauvegarder' : 'Créer la table'}
            </Button>
          </div>

        </form>
      </Form>
    </>
  );
}

// Wrap the component in Suspense to handle the useSearchParams() hook.
export default function TableFormPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <TableForm />
        </Suspense>
    )
}
