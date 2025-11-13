'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';
import type { Customer, Item } from '@/lib/types';
import { ArrowLeft, Save, User, Euro, PackageSearch, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';
import { ItemSelectionDialog } from './components/item-selection-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { EditItemDialog } from '@/app/management/items/components/edit-item-dialog';

const formSchema = z.object({
  customerId: z.string().min(1, 'Un client est requis.'),
  customerName: z.string(),
  itemId: z.string().optional(),
  equipmentType: z.string().min(2, { message: 'Le type est requis.' }),
  equipmentBrand: z.string().min(1, { message: 'La marque est requise.' }),
  equipmentModel: z.string().min(1, { message: 'Le modèle est requis.' }),
  issueDescription: z.string().min(10, { message: 'Veuillez décrire la panne (min. 10 caractères).' }),
  notes: z.string().optional(),
  amount: z.coerce.number().min(0, { message: 'Le montant doit être positif.' }).optional(),
  clientNotes: z.string().optional(),
  equipmentNotes: z.string().optional(),
});

type SupportTicketFormValues = z.infer<typeof formSchema>;

function NewSupportTicketPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, items, addSupportTicket } = usePos();
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isItemSearchOpen, setItemSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const [isEditItemOpen, setEditItemOpen] = useState(false);


  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      itemId: '',
      equipmentType: '',
      equipmentBrand: '',
      equipmentModel: '',
      issueDescription: '',
      notes: '',
      amount: 0,
      clientNotes: '',
      equipmentNotes: '',
    },
  });

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId && customers) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        form.setValue('customerId', customer.id);
        form.setValue('customerName', customer.name);
      }
    }
  }, [searchParams, customers, form]);

  const onCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue('customerId', customer.id);
    form.setValue('customerName', customer.name);
    setCustomerSearchOpen(false);
  };
  
  const onItemSelect = (item: Item) => {
    setSelectedItem(item);
    form.setValue('itemId', item.id);
    form.setValue('equipmentType', item.name);
    // You might want to pre-fill brand/model if they exist on the Item type
    form.setValue('equipmentBrand', '');
    form.setValue('equipmentModel', '');
    setItemSearchOpen(false);
  };

  const onSubmit = async (data: SupportTicketFormValues) => {
    const newTicket = await addSupportTicket(data);
    if (newTicket) {
      router.push('/management/support-tickets');
    }
  };

  return (
    <>
      <PageHeader
        title="Nouvelle Prise en Charge"
        subtitle="Créez une nouvelle fiche pour un retour SAV ou une préparation."
      >
        <div className="flex items-center gap-2">
           <Button onClick={form.handleSubmit(onSubmit)} size="lg">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer la prise en charge
            </Button>
          <Button asChild variant="outline" className="btn-back">
            <Link href="/management/support-tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col flex-1 h-full">
           <Tabs defaultValue="customer" className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Client</TabsTrigger>
              <TabsTrigger value="equipment">Matériel</TabsTrigger>
              <TabsTrigger value="issue">Panne & Devis</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex-1">
                <TabsContent value="customer">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations du Client</CardTitle>
                       <CardDescription>Sélectionnez le client qui dépose le matériel.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client *</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full justify-start"
                                  onClick={() => setCustomerSearchOpen(true)}
                                >
                                  <User className="mr-2 h-4 w-4"/>
                                  {selectedCustomer ? selectedCustomer.name : 'Sélectionner un client'}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {selectedCustomer && (
                        <Card className="mt-4 bg-muted/50">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-base">Détails du client</CardTitle>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCustomerOpen(true)}>
                                  <Pencil className="h-4 w-4"/>
                              </Button>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {selectedCustomer.email || 'Non renseigné'}</p>
                              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> {selectedCustomer.phone || 'Non renseigné'}</p>
                              <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5"/> {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.postalCode} ${selectedCustomer.city}` : 'Adresse non renseignée'}</p>
                          </CardContent>
                        </Card>
                      )}
                      <FormField control={form.control} name="clientNotes" render={({ field }) => (<FormItem><FormLabel>Observations sur le client</FormLabel><FormControl><Textarea placeholder="ex: Client pressé, demande de devis avant réparation..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="equipment">
                  <Card>
                    <CardHeader>
                       <CardTitle>Informations sur le Matériel</CardTitle>
                       <CardDescription>Détaillez l'équipement pris en charge. Vous pouvez le lier à un article existant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-end">
                            <Button type="button" variant="secondary" onClick={() => setItemSearchOpen(true)}>
                                <PackageSearch className="mr-2 h-4 w-4" />
                                Lier à un article de la base
                            </Button>
                        </div>
                         {selectedItem && (
                          <Card className="bg-muted/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">Article lié</CardTitle>
                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItemOpen(true)}>
                                    <Pencil className="h-4 w-4"/>
                                </Button>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4">
                               {selectedItem.image && <Image src={selectedItem.image} alt={selectedItem.name} width={64} height={64} className="rounded-md object-cover" />}
                               <div className="space-y-1 text-sm">
                                   <p className="font-bold">{selectedItem.name}</p>
                                   <p className="text-muted-foreground">Réf: {selectedItem.barcode}</p>
                                   <p className="text-muted-foreground">Prix: {selectedItem.price.toFixed(2)}€</p>
                               </div>
                            </CardContent>
                          </Card>
                        )}
                        <FormField control={form.control} name="equipmentType" render={({ field }) => (<FormItem><FormLabel>Type de matériel *</FormLabel><FormControl><Input placeholder="ex: Ordinateur portable" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="equipmentBrand" render={({ field }) => (<FormItem><FormLabel>Marque *</FormLabel><FormControl><Input placeholder="ex: Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="equipmentModel" render={({ field }) => (<FormItem><FormLabel>Modèle *</FormLabel><FormControl><Input placeholder="ex: MacBook Pro 14" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="equipmentNotes" render={({ field }) => (<FormItem><FormLabel>Observations sur le matériel</FormLabel><FormControl><Textarea placeholder="ex: Rayure sur le capot, un port USB défectueux..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                  </Card>
                </TabsContent>
                 <TabsContent value="issue">
                  <Card>
                    <CardHeader>
                      <CardTitle>Description du Problème et Devis</CardTitle>
                      <CardDescription>Décrivez la panne constatée et le montant estimé de l'intervention.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <FormField control={form.control} name="issueDescription" render={({ field }) => (<FormItem><FormLabel>Description de la panne / Demande *</FormLabel><FormControl><Textarea placeholder="L'écran ne s'allume plus après une mise à jour..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes internes (technicien)</FormLabel><FormControl><Textarea placeholder="Diagnostique préliminaire : problème de carte mère probable." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Montant de la prestation (€)</FormLabel>
                               <div className="relative">
                                   <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                   <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} className="pl-8"/>
                                   </FormControl>
                               </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </CardContent>
                  </Card>
                </TabsContent>
            </div>
          </Tabs>
        </form>
      </Form>
      <CustomerSelectionDialog
        isOpen={isCustomerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onCustomerSelected={onCustomerSelected}
      />
      <ItemSelectionDialog 
        isOpen={isItemSearchOpen}
        onClose={() => setItemSearchOpen(false)}
        onItemSelected={onItemSelect}
      />
      {selectedCustomer && (
          <EditCustomerDialog 
            isOpen={isEditCustomerOpen} 
            onClose={() => setEditCustomerOpen(false)} 
            customer={selectedCustomer} 
          />
      )}
      {selectedItem && (
          <EditItemDialog 
            isOpen={isEditItemOpen}
            onClose={() => setEditItemOpen(false)}
            item={selectedItem}
            onItemSaved={() => {}} // A refresh might be needed if details change
          />
      )}
    </>
  );
}


export default function NewSupportTicketPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <NewSupportTicketPageContent />
        </Suspense>
    )
}
