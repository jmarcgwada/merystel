
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray, Control, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';
import type { Customer, Item, SupportTicket, RepairAction } from '@/lib/types';
import { ArrowLeft, Save, User, Euro, PackageSearch, Mail, Phone, MapPin, Pencil, Plus, Trash2, History, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ItemSelectionDialog } from '../new/components/item-selection-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { EditItemDialog } from '@/app/management/items/components/edit-item-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

const repairActionSchema = z.object({
    id: z.string(),
    date: z.union([z.date(), z.string()]), // Allow both Date objects and strings
    title: z.string().min(1, "Le titre de l'action est requis."),
    details: z.string().min(1, "Les détails sont requis."),
    userId: z.string(),
    userName: z.string(),
})

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
  status: z.string().min(1, 'Le statut est requis.'),
  repairActions: z.array(repairActionSchema).optional(),
});

type SupportTicketFormValues = z.infer<typeof formSchema>;

function RepairActionsForm({ control, setValue }: { control: Control<SupportTicketFormValues>, setValue: Function }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "repairActions"
    });
    const { user, repairActionPresets, addRepairActionPreset } = usePos();
    const { toast } = useToast();
    const [newActionTitle, setNewActionTitle] = useState('');
    const [newActionDetails, setNewActionDetails] = useState('');
    const [isActionSectionOpen, setIsActionSectionOpen] = useState(true);

    const handleAddAction = () => {
        if (!newActionTitle || !newActionDetails) return;
        
        const newAction: RepairAction = {
            id: uuidv4(),
            date: new Date(),
            title: newActionTitle,
            details: newActionDetails,
            userId: user?.id || 'system',
            userName: user ? `${user.firstName} ${user.lastName}` : 'System',
        };

        const currentActions = control._getWatch("repairActions") || [];
        setValue("repairActions", [...currentActions, newAction]);

        setNewActionTitle('');
        setNewActionDetails('');
    };
    
    const handleAddPreset = async () => {
        if (!newActionTitle.trim() || repairActionPresets.some(p => p.name.toLowerCase() === newActionTitle.trim().toLowerCase())) {
            toast({
                title: newActionTitle.trim() ? "Action déjà existante" : "Titre vide",
                variant: "destructive"
            });
            return;
        }
        await addRepairActionPreset({ name: newActionTitle.trim() });
        toast({ title: "Action rapide ajoutée" });
    };

    const sortedFields = useMemo(() => {
        return [...fields].sort((a, b) => new Date((b as any).date).getTime() - new Date((a as any).date).getTime());
    }, [fields]);

    return (
        <div className="space-y-6">
            <Collapsible open={isActionSectionOpen} onOpenChange={setIsActionSectionOpen}>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
                            <CardTitle>Nouvelle Action</CardTitle>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isActionSectionOpen && "rotate-180")} />
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="action-preset-select">Action prédéfinie (optionnel)</Label>
                                <Select onValueChange={setNewActionTitle}>
                                    <SelectTrigger id="action-preset-select">
                                        <SelectValue placeholder="Choisir une action rapide..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {repairActionPresets.map(preset => (
                                            <SelectItem key={preset.id} value={preset.name}>{preset.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-action-title">Titre de l'action</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="new-action-title" value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} placeholder="Ex: Diagnostic initial, Remplacement pièce..."/>
                                    <Button type="button" size="icon" variant="outline" onClick={handleAddPreset} disabled={!newActionTitle.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-action-details">Détails de l'intervention</Label>
                                <Textarea id="new-action-details" value={newActionDetails} onChange={e => setNewActionDetails(e.target.value)} placeholder="Décrivez l'opération effectuée..."/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="button" onClick={handleAddAction} disabled={!newActionTitle || !newActionDetails}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter au journal
                            </Button>
                        </CardFooter>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><History/> Historique des réparations</h3>
                 {sortedFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
                ) : (
                    <div className="space-y-4">
                        {sortedFields.map((field, index) => (
                            <Card key={field.id} className="relative">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{(field as any).title}</CardTitle>
                                    <CardDescription>
                                        <ClientFormattedDate date={(field as any).date} formatString="d MMMM yyyy, HH:mm" /> par {(field as any).userName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{(field as any).details}</p>
                                </CardContent>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EditSupportTicketPageContent() {
  const router = useRouter();
  const params = useParams();
  const { ticketId } = params;
  
  const { customers, items, supportTickets, updateSupportTicket, equipmentTypes } = usePos();
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isItemSearchOpen, setItemSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const [isEditItemOpen, setEditItemOpen] = useState(false);
  
  const ticketToEdit = useMemo(() => {
    return supportTickets.find(t => t.id === ticketId);
  }, [supportTickets, ticketId]);

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: 'Ouvert', repairActions: [] },
  });

  useEffect(() => {
    if (ticketToEdit) {
        form.reset({
            customerId: ticketToEdit.customerId,
            customerName: ticketToEdit.customerName,
            itemId: ticketToEdit.itemId,
            equipmentType: ticketToEdit.equipmentType,
            equipmentBrand: ticketToEdit.equipmentBrand,
            equipmentModel: ticketToEdit.equipmentModel,
            issueDescription: ticketToEdit.issueDescription,
            notes: ticketToEdit.notes,
            amount: ticketToEdit.amount || 0,
            clientNotes: ticketToEdit.clientNotes,
            equipmentNotes: ticketToEdit.equipmentNotes,
            status: ticketToEdit.status,
            repairActions: (ticketToEdit.repairActions || []).map(a => ({...a, date: new Date(a.date as any)})),
        });

        const customer = customers.find(c => c.id === ticketToEdit.customerId);
        if (customer) setSelectedCustomer(customer);
        
        if (ticketToEdit.itemId) {
            const item = items.find(i => i.id === ticketToEdit.itemId);
            if (item) setSelectedItem(item);
        }
    } else if (ticketId) {
        // Handle case where ticket is not found after loading
    }
  }, [ticketToEdit, customers, items, form]);

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
    form.setValue('equipmentBrand', '');
    form.setValue('equipmentModel', '');
    setItemSearchOpen(false);
  };

  const handleEquipmentTypeChange = (value: string) => {
    form.setValue('equipmentType', value);
    const selectedType = equipmentTypes.find(et => et.name === value);
    if(selectedType) {
        form.setValue('amount', selectedType.price);
    }
  }

  const onSubmit = async (data: SupportTicketFormValues) => {
    if (!ticketToEdit) return;
    
    await updateSupportTicket({
        ...ticketToEdit,
        ...data,
        status: data.status as SupportTicket['status'],
        repairActions: (data.repairActions || []).map(a => ({...a, date: a.date instanceof Date ? a.date.toISOString() as any : a.date })),
    });
    
    router.push('/management/support-tickets');
  };
  
  const isTicketInvoiced = !!ticketToEdit?.saleId;

  return (
    <>
      <PageHeader
        title={`Modifier la Prise en Charge #${ticketToEdit?.ticketNumber || ''}`}
        subtitle="Mettez à jour les informations de la fiche."
      >
        <div className="flex items-center gap-2">
            {isTicketInvoiced && ticketToEdit?.saleId && (
                <Button asChild>
                    <Link href={`/reports/${ticketToEdit.saleId}`}>
                        Voir la facture
                    </Link>
                </Button>
            )}
           <Button onClick={form.handleSubmit(onSubmit)} size="lg">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder les modifications
            </Button>
          <Button asChild variant="outline" className="btn-back">
            <Link href="/management/support-tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </PageHeader>
      
       {ticketToEdit?.createdAt && (
            <div className="p-2 my-4 text-xs text-muted-foreground bg-muted/50 rounded-md max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span>Créé le: <ClientFormattedDate date={ticketToEdit.createdAt} formatString="d MMM yyyy, HH:mm" /></span>
                    {ticketToEdit.updatedAt && (
                        <span>Modifié le: <ClientFormattedDate date={ticketToEdit.updatedAt} formatString="d MMM yyyy, HH:mm" /></span>
                    )}
                </div>
            </div>
        )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col flex-1 h-full">
           <Tabs defaultValue="customer" className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customer" disabled={isTicketInvoiced}>Client</TabsTrigger>
              <TabsTrigger value="equipment" disabled={isTicketInvoiced}>Matériel</TabsTrigger>
              <TabsTrigger value="issue">Panne & Devis</TabsTrigger>
              <TabsTrigger value="tracking">Suivi Réparation</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex-1">
                <TabsContent value="customer">
                  <fieldset disabled={isTicketInvoiced} className="group">
                    <Card className="group-disabled:opacity-70">
                      <CardHeader><CardTitle>Informations du Client</CardTitle><CardDescription>Sélectionnez le client qui dépose le matériel.</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <FormField control={form.control} name="customerId" render={() => (<FormItem><FormLabel>Client *</FormLabel><FormControl><div className="flex items-center gap-2"><Button variant="outline" type="button" className="w-full justify-start" onClick={() => setCustomerSearchOpen(true)} disabled={isTicketInvoiced}><User className="mr-2 h-4 w-4"/>{selectedCustomer ? selectedCustomer.name : 'Sélectionner un client'}</Button></div></FormControl><FormMessage /></FormItem>)} />
                        {selectedCustomer && (<Card className="mt-4 bg-muted/50"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-base">Détails du client</CardTitle><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCustomerOpen(true)} disabled={isTicketInvoiced}><Pencil className="h-4 w-4"/></Button></CardHeader><CardContent className="space-y-2 text-sm"><p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {selectedCustomer.email || 'Non renseigné'}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> {selectedCustomer.phone || 'Non renseigné'}</p><p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5"/> {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.postalCode} ${selectedCustomer.city}` : 'Adresse non renseignée'}</p></CardContent></Card>)}
                        <FormField control={form.control} name="clientNotes" render={({ field }) => (<FormItem><FormLabel>Observations sur le client</FormLabel><FormControl><Textarea placeholder="ex: Client pressé, demande de devis avant réparation..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                      </CardContent>
                    </Card>
                  </fieldset>
                </TabsContent>
                <TabsContent value="equipment">
                  <fieldset disabled={isTicketInvoiced} className="group">
                    <Card className="group-disabled:opacity-70">
                      <CardHeader><CardTitle>Informations sur le Matériel</CardTitle><CardDescription>Détaillez l'équipement pris en charge. Vous pouvez le lier à un article existant.</CardDescription></CardHeader>
                      <CardContent className="space-y-6">
                          <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setItemSearchOpen(true)} disabled={isTicketInvoiced}><PackageSearch className="mr-2 h-4 w-4" /> Lier à un article de la base</Button></div>
                           {selectedItem && (<Card className="bg-muted/50"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-base">Article lié</CardTitle><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItemOpen(true)} disabled={isTicketInvoiced}><Pencil className="h-4 w-4"/></Button></CardHeader><CardContent className="flex items-center gap-4">{selectedItem.image && <Image src={selectedItem.image} alt={selectedItem.name} width={64} height={64} className="rounded-md object-cover" />}<div className="space-y-1 text-sm"><p className="font-bold">{selectedItem.name}</p><p className="text-muted-foreground">Réf: {selectedItem.barcode}</p><p className="text-muted-foreground">Prix: {selectedItem.price.toFixed(2)}€</p></div></CardContent></Card>)}
                          <FormField
                            control={form.control}
                            name="equipmentType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Type de matériel *</FormLabel>
                                <Select onValueChange={handleEquipmentTypeChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner ou saisir un type..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {equipmentTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.name}>
                                                {type.name} ({type.price.toFixed(2)}€)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                          <FormField control={form.control} name="equipmentBrand" render={({ field }) => (<FormItem><FormLabel>Marque *</FormLabel><FormControl><Input placeholder="ex: Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="equipmentModel" render={({ field }) => (<FormItem><FormLabel>Modèle *</FormLabel><FormControl><Input placeholder="ex: MacBook Pro 14" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="equipmentNotes" render={({ field }) => (<FormItem><FormLabel>Observations sur le matériel</FormLabel><FormControl><Textarea placeholder="ex: Rayure sur le capot, un port USB défectueux..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                      </CardContent>
                    </Card>
                  </fieldset>
                </TabsContent>
                 <TabsContent value="issue">
                  <Card>
                    <CardHeader><CardTitle>Description du Problème et Devis</CardTitle><CardDescription>Décrivez la panne constatée et le montant estimé de l'intervention.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                       <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Statut *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Ouvert">Ouvert</SelectItem><SelectItem value="En cours">En cours</SelectItem><SelectItem value="En attente de pièces">En attente de pièces</SelectItem><SelectItem value="Terminé">Terminé</SelectItem><SelectItem value="Facturé">Facturé</SelectItem><SelectItem value="Annulé">Annulé</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="issueDescription" render={({ field }) => (<FormItem><FormLabel>Description de la panne / Demande *</FormLabel><FormControl><Textarea placeholder="L'écran ne s'allume plus après une mise à jour..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes internes (technicien)</FormLabel><FormControl><Textarea placeholder="Diagnostique préliminaire : problème de carte mère probable." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Montant de la prestation (€)</FormLabel><div className="relative"><Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="number" placeholder="0.00" {...field} className="pl-8"/></FormControl></div><FormMessage /></FormItem>)} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tracking">
                    <RepairActionsForm control={form.control} setValue={form.setValue} />
                </TabsContent>
            </div>
          </Tabs>
        </form>
      </Form>
      <CustomerSelectionDialog isOpen={isCustomerSearchOpen} onClose={() => setCustomerSearchOpen(false)} onCustomerSelected={onCustomerSelected} />
      <ItemSelectionDialog isOpen={isItemSearchOpen} onClose={() => setItemSearchOpen(false)} onItemSelected={onItemSelect} />
      {selectedCustomer && (<EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={selectedCustomer} />)}
      {selectedItem && (<EditItemDialog isOpen={isEditItemOpen} onClose={() => setEditItemOpen(false)} item={selectedItem} onItemSaved={() => {}}/>)}
    </>
  );
}

export default function EditSupportTicketPage() {
    return (
        <Suspense fallback={<div>Chargement du ticket...</div>}>
            <EditSupportTicketPageContent />
        </Suspense>
    )
}
