
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import type { Sale, Customer } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';


type DunningAction = {
  sale: Sale;
  actionType: 'email' | 'phone' | 'whatsapp';
}

export default function UnpaidInvoicesPage() {
  const { sales, customers, isLoading, updateSale } = usePos();
  const router = useRouter();
  const { toast } = useToast();

  const [dunningAction, setDunningAction] = useState<DunningAction | null>(null);
  const [dunningNotes, setDunningNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailToSend, setEmailToSend] = useState('');

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const unpaidInvoices = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter((sale) => sale.status === 'pending' && sale.documentType === 'invoice')
      .sort((a, b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime());
  }, [sales]);
  
  const customerForDunning = useMemo(() => {
    if (!dunningAction || !customers) return null;
    return customers.find(c => c.id === dunningAction.sale.customerId);
  }, [dunningAction, customers]);

  useEffect(() => {
    if (dunningAction?.actionType === 'email' && customerForDunning) {
        setEmailToSend(customerForDunning.email || '');
    }
  }, [dunningAction, customerForDunning]);
  
  useEffect(() => {
    if (dunningAction && dunningAction.actionType === 'email') {
        const sale = dunningAction.sale;
        const totalDue = sale.total - (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);

        setEmailToSend(customerForDunning?.email || '');
        setEmailSubject(`Rappel pour votre facture impayée #${sale.ticketNumber}`);
        setEmailBody(
`Bonjour ${customerForDunning?.name || 'client(e)'},

Sauf erreur de notre part, il semble que votre facture n°${sale.ticketNumber} d'un montant de ${totalDue.toFixed(2)}€, datée du ${new Date(sale.date as any).toLocaleDateString('fr-FR')}, soit toujours en attente de règlement.

Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.

Nous restons à votre disposition pour toute question.

Cordialement,
L'équipe de ${'votre entreprise'}`
        );
    }
  }, [dunningAction, customerForDunning]);

  const getCustomerName = useCallback(
    (customerId?: string) => {
      if (!customerId || !customers) return 'N/A';
      return customers.find((c) => c.id === customerId)?.name || 'Client supprimé';
    },
    [customers]
  );

  const handleDunningAction = async () => {
    if (!dunningAction) return;

    // Here you would implement the actual logic for sending email/whatsapp
    // For now, we just log it and update the sale.
    
    const updatedSale: Sale = {
      ...dunningAction.sale,
      dunningLevel: (dunningAction.sale.dunningLevel || 0) + 1,
      lastDunningDate: new Date(),
    };
    
    await updateSale(updatedSale);

    // Here you would also save the dunning log entry
    // addDunningLog({
    //   saleId: dunningAction.sale.id,
    //   actionType: dunningAction.actionType,
    //   notes: dunningNotes,
    //   status: 'sent',
    // });
    
    toast({
      title: 'Relance enregistrée',
      description: `Une relance de type "${dunningAction.actionType}" a été enregistrée pour la facture #${dunningAction.sale.ticketNumber}.`,
    });

    setDunningAction(null);
    setDunningNotes('');
  };


  const totalAmountDue = useMemo(() => {
    return unpaidInvoices.reduce((acc, sale) => {
        const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return acc + (sale.total - totalPaid);
    }, 0);
  }, [unpaidInvoices]);
  
  const openEditCustomerModal = () => {
    if (customerForDunning) {
      setCustomerToEdit(customerForDunning);
      setIsEditCustomerOpen(true);
    }
  };


  return (
    <>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Factures Impayées"
          subtitle={`Suivi de ${unpaidInvoices.length} factures en attente de paiement.`}
        >
          <div className="flex items-center gap-2">
              <Card className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">Montant total dû</p>
                  <p className="text-lg font-bold text-destructive">{totalAmountDue.toFixed(2)}€</p>
              </Card>
            <Button asChild variant="outline" className="btn-back">
              <Link href="/dashboard">
                <ArrowLeft />
                Retour
              </Link>
            </Button>
          </div>
        </PageHeader>
        <div className="mt-8">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Montant Dû</TableHead>
                    <TableHead>Niveau de Relance</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6} className="h-12" /></TableRow>
                  ))}
                  {!isLoading && unpaidInvoices.map((sale) => {
                      const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                      const amountDue = sale.total - totalPaid;
                      return (
                          <TableRow key={sale.id}>
                              <TableCell>
                                  <Link href={`/reports/${sale.id}?from=unpaid`} className="font-medium text-primary hover:underline">
                                      {sale.ticketNumber}
                                  </Link>
                              </TableCell>
                              <TableCell>{getCustomerName(sale.customerId)}</TableCell>
                              <TableCell>
                                  <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" />
                              </TableCell>
                              <TableCell className="font-semibold text-destructive">
                                  {amountDue.toFixed(2)}€
                              </TableCell>
                              <TableCell>
                                  <Badge variant={sale.dunningLevel ? "default" : "outline"}>
                                      Niveau {sale.dunningLevel || 0}
                                  </Badge>
                                  {sale.lastDunningDate && <p className="text-xs text-muted-foreground"><ClientFormattedDate date={sale.lastDunningDate} formatString="d MMM yy" /></p>}
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <MoreVertical className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'email' })}>
                                              <Mail className="mr-2 h-4 w-4" />
                                              Relance par Email
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'phone' })}>
                                              <Phone className="mr-2 h-4 w-4" />
                                              Enregistrer un Appel
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'whatsapp' })}>
                                              <MessageSquare className="mr-2 h-4 w-4" />
                                              Envoyer un WhatsApp
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      )
                  })}
                </TableBody>
              </Table>
              {!isLoading && unpaidInvoices.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                      <p>Aucune facture impayée pour le moment.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

       <AlertDialog open={!!dunningAction} onOpenChange={(open) => !open && setDunningAction(null)}>
        <AlertDialogContent className={dunningAction?.actionType === 'email' ? 'sm:max-w-xl' : 'sm:max-w-md'}>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer une action de relance</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'enregistrer une relance de type "{dunningAction?.actionType}" pour la facture #{dunningAction?.sale.ticketNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
              {dunningAction?.actionType === 'email' ? (
                  <div className="space-y-4">
                       <div className="space-y-2">
                           <Label htmlFor="email-to">Destinataire</Label>
                           <div className="flex items-center gap-2">
                                <Input 
                                  id="email-to" 
                                  value={emailToSend} 
                                  onChange={(e) => setEmailToSend(e.target.value)}
                                  placeholder={customerForDunning ? "Email manquant" : "Aucun client associé"}
                                />
                                {customerForDunning && (
                                  <Button variant="outline" size="sm" onClick={openEditCustomerModal}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier le client
                                  </Button>
                                )}
                           </div>
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="email-subject">Sujet</Label>
                           <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="email-body">Message</Label>
                           <Textarea
                                id="email-body"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={8}
                            />
                       </div>
                  </div>
              ) : (
                <div>
                    <Label htmlFor="dunning-notes">Notes (optionnel)</Label>
                    <Textarea
                        id="dunning-notes"
                        placeholder="Ex: Laissé un message vocal, email envoyé sans réponse..."
                        value={dunningNotes}
                        onChange={(e) => setDunningNotes(e.target.value)}
                        className="mt-2"
                    />
                </div>
              )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDunningAction(null); setDunningNotes(''); }}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDunningAction}>
              {dunningAction?.actionType === 'email' ? 'Envoyer la relance' : 'Enregistrer l\'action'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <EditCustomerDialog 
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customerToEdit}
      />
    </>
  );
}
