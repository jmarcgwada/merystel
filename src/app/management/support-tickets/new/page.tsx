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
import type { Customer } from '@/lib/types';
import { ArrowLeft, Save, User, Euro } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  customerId: z.string().min(1, 'Un client est requis.'),
  customerName: z.string(),
  equipmentType: z.string().min(2, { message: 'Le type est requis.' }),
  equipmentBrand: z.string().min(1, { message: 'La marque est requise.' }),
  equipmentModel: z.string().min(1, { message: 'Le modèle est requis.' }),
  issueDescription: z.string().min(10, { message: 'Veuillez décrire la panne (min. 10 caractères).' }),
  notes: z.string().optional(),
  amount: z.coerce.number().min(0, { message: 'Le montant doit être positif.' }).optional(),
});

type SupportTicketFormValues = z.infer<typeof formSchema>;

function NewSupportTicketPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, addSupportTicket } = usePos();
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      equipmentType: '',
      equipmentBrand: '',
      equipmentModel: '',
      issueDescription: '',
      notes: '',
      amount: 0,
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
        <Button asChild variant="outline" className="btn-back">
          <Link href="/management/support-tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la Prise en Charge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="equipmentType" render={({ field }) => (<FormItem><FormLabel>Type de matériel *</FormLabel><FormControl><Input placeholder="ex: Ordinateur portable" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="equipmentBrand" render={({ field }) => (<FormItem><FormLabel>Marque *</FormLabel><FormControl><Input placeholder="ex: Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="equipmentModel" render={({ field }) => (<FormItem><FormLabel>Modèle *</FormLabel><FormControl><Input placeholder="ex: MacBook Pro 14" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <FormField control={form.control} name="issueDescription" render={({ field }) => (<FormItem><FormLabel>Description de la panne / Demande *</FormLabel><FormControl><Textarea placeholder="L'écran ne s'allume plus après une mise à jour..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Observations (interne)</FormLabel><FormControl><Textarea placeholder="Le client semble pressé. A noter, une rayure sur le capot." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
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
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer la prise en charge
            </Button>
          </div>
        </form>
      </Form>
      <CustomerSelectionDialog
        isOpen={isCustomerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onCustomerSelected={onCustomerSelected}
      />
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
