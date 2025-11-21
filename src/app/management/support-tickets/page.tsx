'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ArrowLeft, ArrowUpDown, ChevronDown, MoreVertical, Edit, Trash2, FileCog, History, Printer, Eye, FileText, Send } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePos } from '@/contexts/pos-context';
import type { SupportTicket, Customer } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { TicketPrintTemplate } from './components/ticket-print-template';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { EmailSenderDialog } from '@/app/reports/components/email-sender-dialog';


type SortKey = 'ticketNumber' | 'customerName' | 'equipmentType' | 'createdAt' | 'status';

export default function SupportTicketsPage() {
  const { supportTickets, isLoading, deleteSupportTicket, recordCommercialDocument, items, vatRates, customers, companyInfo, updateSupportTicket, autoInvoiceOnSupportTicket } = usePos();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const router = useRouter();
  
  const [ticketToPrint, setTicketToPrint] = useState<SupportTicket | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [ticketForEmail, setTicketForEmail] = useState<SupportTicket | null>(null);


  const sortedTickets = useMemo(() => {
    if (!supportTickets) return [];
    const sortable = [...supportTickets];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(a[sortConfig.key] as any).getTime();
          bValue = new Date(b[sortConfig.key] as any).getTime();
        } else {
          aValue = a[sortConfig.key as keyof SupportTicket] || '';
          bValue = b[sortConfig.key as keyof SupportTicket] || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [supportTickets, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  }

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch(status) {
      case 'Ouvert': return <Badge variant="secondary">{status}</Badge>;
      case 'En cours': return <Badge className="bg-blue-500 text-white">{status}</Badge>;
      case 'En attente de pièces': return <Badge className="bg-yellow-500 text-white">{status}</Badge>;
      case 'Terminé': return <Badge className="bg-green-500 text-white">{status}</Badge>;
      case 'Facturé': return <Badge variant="outline">{status}</Badge>;
      case 'Annulé': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  const toggleDetails = (id: string) => {
    setOpenDetails(prev => ({...prev, [id]: !prev[id]}));
  };
  
  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      deleteSupportTicket(ticketToDelete.id);
      setTicketToDelete(null);
    }
  };

  const handleGenerateInvoice = async (ticket: SupportTicket) => {
    if (ticket.saleId) {
        toast({ variant: 'destructive', title: 'Déjà facturé', description: 'Cette prise en charge a déjà une facture associée.' });
        return;
    }
    
    let article = items.find(item => item.name.toLowerCase() === 'prise en charge');
    if (!article) {
        toast({ 
            variant: 'destructive', 
            title: "Article 'Prise en charge' manquant", 
            description: "Veuillez créer un article nommé 'Prise en charge' dans la gestion des articles pour pouvoir facturer.",
            duration: 7000
        });
        return;
    }

    const vatInfo = vatRates.find(v => v.id === article?.vatId);
    if (!vatInfo) {
        toast({ 
            variant: 'destructive', 
            title: "TVA manquante sur l'article", 
            description: "L'article 'Prise en charge' doit avoir un taux de TVA valide.",
            duration: 7000
        });
        return;
    }

    const amountTTC = ticket.amount || 0;
    const amountHT = amountTTC / (1 + vatInfo.rate / 100);
    const taxAmount = amountTTC - amountHT;
    
    const notes = `Acompte concernant la prise en charge #${ticket.ticketNumber}`;

    const itemDescription = [
        `Type: ${ticket.equipmentType}`,
        `Marque: ${ticket.equipmentBrand}`,
        `Modèle: ${ticket.equipmentModel}`,
        `Panne: ${ticket.issueDescription}`
    ].join('\n');

    const saleItem = {
      id: uuidv4(),
      itemId: article.id,
      name: `Prise en charge SAV #${ticket.ticketNumber}`,
      price: amountTTC,
      quantity: 1,
      total: amountTTC,
      vatId: article.vatId,
      discount: 0,
      barcode: article.barcode || '',
      description: itemDescription,
    };

    const newSale = await recordCommercialDocument({
        items: [saleItem],
        customerId: ticket.customerId,
        subtotal: amountHT,
        tax: taxAmount,
        total: amountTTC,
        status: 'pending',
        payments: [],
        notes: notes
    }, 'invoice');
    
    if (newSale) {
        await updateSupportTicket({ ...ticket, saleId: newSale.id, status: 'Facturé' });
        toast({ title: 'Facture générée', description: 'Une nouvelle facture a été créée pour cette prise en charge.' });
        if(autoInvoiceOnSupportTicket) {
             router.push(`/commercial/invoices?edit=${newSale.id}`);
        }
    }
  };

  const handlePrint = async (ticket: SupportTicket) => {
    setTicketToPrint(ticket);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Allow state to render

    if (!printRef.current) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de préparer l'impression." });
      return;
    }
    setIsPrinting(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printRef.current, {
      callback: function (pdf) {
        pdf.save(`prise-en-charge-${ticket.ticketNumber}.pdf`);
        setIsPrinting(false);
        setTicketToPrint(null);
      },
      x: 0,
      y: 0,
      width: 210,
      windowWidth: printRef.current.scrollWidth,
      autoPaging: 'text',
    });
  };

  return (
    <>
      <div className="absolute -left-[9999px] -top-[9999px]">
        {ticketToPrint && customers && companyInfo && (
          <TicketPrintTemplate
            ref={printRef}
            ticket={ticketToPrint}
            customer={customers.find(c => c.id === ticketToPrint.customerId) || null}
            companyInfo={companyInfo}
          />
        )}
      </div>
      <PageHeader
        title="Prises en Charge"
        subtitle="Consultez et gérez toutes les fiches de prise en charge."
      >
        <div className="flex items-center gap-2">
           <Button asChild>
            <Link href="/management/support-tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Prise en Charge
            </Link>
           </Button>
           <Button asChild variant="outline" className="btn-back">
            <Link href="/management/items">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Link>
           </Button>
        </div>
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Liste des Prises en Charge</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('ticketNumber')}>Numéro {getSortIcon('ticketNumber')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('customerName')}>Client {getSortIcon('customerName')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('equipmentType')}>Matériel {getSortIcon('equipmentType')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('createdAt')}>Date {getSortIcon('createdAt')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('status')}>Statut {getSortIcon('status')}</Button></TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                                <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                           </TableRow>
                        ))
                    ) : sortedTickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                Aucune prise en charge pour le moment.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedTickets.map(ticket => (
                           <React.Fragment key={ticket.id}>
                                <TableRow className="cursor-pointer" onClick={() => toggleDetails(ticket.id)}>
                                    <TableCell>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", openDetails[ticket.id] && 'rotate-180')}/>
                                    </TableCell>
                                    <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                                    <TableCell>{ticket.customerName}</TableCell>
                                    <TableCell>{ticket.equipmentBrand} {ticket.equipmentModel}</TableCell>
                                    <TableCell>
                                        <ClientFormattedDate date={ticket.createdAt} formatString="d MMM yyyy, HH:mm" />
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handlePrint(ticket)} disabled={isPrinting}>
                                                    <Printer className="mr-2 h-4 w-4" /> Imprimer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setTicketForEmail(ticket); setIsEmailDialogOpen(true); }}>
                                                    <Send className="mr-2 h-4 w-4" /> Envoyer par Email
                                                </DropdownMenuItem>
                                                 {ticket.saleId ? (
                                                  <DropdownMenuItem asChild>
                                                    <Link href={`/commercial/invoices?edit=${ticket.saleId}`}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Voir la facture</span>
                                                    </Link>
                                                  </DropdownMenuItem>
                                                ) : (
                                                  <DropdownMenuItem onClick={() => handleGenerateInvoice(ticket)}>
                                                      <FileCog className="mr-2 h-4 w-4" /> Facturer
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => router.push(`/management/support-tickets/${ticket.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setTicketToDelete(ticket)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                {openDetails[ticket.id] && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="bg-muted/50 p-6 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Panne & Devis</h4>
                                                        <p className="text-sm text-muted-foreground">{ticket.issueDescription}</p>
                                                        {ticket.amount && <p className="font-bold text-lg">{ticket.amount.toFixed(2)}€</p>}
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Observations client</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.clientNotes || 'Aucune.'}</p>
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Observations sur le matériel</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.equipmentNotes || 'Aucune.'}</p>
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Notes internes</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.notes || 'Aucune.'}</p>
                                                    </div>
                                                    <div className="space-y-2 xl:col-span-4">
                                                        <Separator />
                                                        <h4 className="font-semibold text-sm flex items-center gap-2 pt-2"><History/> Historique des actions</h4>
                                                        {ticket.repairActions && ticket.repairActions.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {ticket.repairActions.sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime()).map((action) => (
                                                                    <div key={action.id} className="text-sm p-2 rounded-md bg-background/50">
                                                                        <p className="font-semibold">{action.title}</p>
                                                                        <p className="text-xs text-muted-foreground"><ClientFormattedDate date={action.date} formatString="d MMM yy, HH:mm" /> par {action.userName}</p>
                                                                        <p className="mt-1 whitespace-pre-wrap">{action.details}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                           </React.Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La prise en charge n°{ticketToDelete?.ticketNumber} sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EmailSenderDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        ticket={ticketForEmail}
      />
    </>
  );
}
