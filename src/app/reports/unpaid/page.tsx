
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  History,
  Edit,
  Trash2,
  ArrowLeft,
  AlertCircle,
  FileCog,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
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
} from '@/components/ui/alert-dialog';
import type { Sale, Customer, DunningLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EmailSenderDialog } from '../components/email-sender-dialog';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogClose } from '@/components/ui/dialog';

function DunningActionDialog({
  isOpen,
  onClose,
  sale,
  actionType,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  actionType: 'phone' | 'whatsapp';
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const actionLabel = actionType === 'phone' ? 'téléphonique' : 'WhatsApp';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Enregistrer une relance {actionLabel}</AlertDialogTitle>
                <AlertDialogDescription>
                    Ajoutez une note pour consigner les détails de votre interaction avec le client pour la facture #{sale.ticketNumber}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="dunning-notes">Notes (optionnel)</Label>
                <Textarea
                    id="dunning-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={`Détails de l'appel, promesse de paiement...`}
                    className="mt-2"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onConfirm(notes)}>Enregistrer</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </Dialog>
  )
}

export default function UnpaidInvoicesPage() {
  const {
    sales,
    customers,
    isLoading,
    updateSale,
    dunningLogs,
    addDunningLog,
  } = usePos();
  const router = useRouter();
  const { toast } = useToast();

  const [dunningAction, setDunningAction] = useState<{
    sale: Sale;
    actionType: 'email' | 'phone' | 'whatsapp';
  } | null>(null);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const unpaidInvoices = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter((sale) => sale.status === 'pending' && sale.documentType === 'invoice')
      .sort(
        (a, b) =>
          new Date(a.date as any).getTime() - new Date(b.date as any).getTime()
      );
  }, [sales]);

  const getCustomerName = useCallback(
    (customerId?: string) => {
      if (!customerId || !customers) return 'N/A';
      return (
        customers.find((c) => c.id === customerId)?.name || 'Client supprimé'
      );
    },
    [customers]
  );

  const saleDunningLogs = useCallback(
    (saleId: string) => {
      return dunningLogs
        .filter((log) => log.saleId === saleId)
        .sort(
          (a, b) =>
            new Date(b.date as any).getTime() - new Date(a.date as any).getTime()
        );
    },
    [dunningLogs]
  );

  const handleDunningAction = async (
    sale: Sale,
    actionType: 'email' | 'phone' | 'whatsapp',
    notes?: string
  ) => {
    const updatedSale: Sale = {
      ...sale,
      dunningLevel: (sale.dunningLevel || 0) + 1,
      lastDunningDate: new Date(),
    };

    await updateSale(updatedSale);

    await addDunningLog({
      saleId: sale.id,
      actionType,
      notes: notes,
      status: 'completed',
    });

    toast({
      title: 'Relance enregistrée',
      description: `Une relance de type "${actionType}" a été enregistrée pour la facture #${sale.ticketNumber}.`,
    });

    setDunningAction(null);
  };


  const totalAmountDue = useMemo(() => {
    return unpaidInvoices.reduce((acc, sale) => {
      const totalPaid = (sale.payments || []).reduce(
        (sum, p) => sum + p.amount,
        0
      );
      return acc + (sale.total - totalPaid);
    }, 0);
  }, [unpaidInvoices]);

  const toggleDetails = (saleId: string) => {
    setOpenDetails((prev) => ({ ...prev, [saleId]: !prev[saleId] }));
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
              <p className="text-lg font-bold text-destructive">
                {totalAmountDue.toFixed(2)}€
              </p>
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
                    <TableHead className="w-12"></TableHead>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Montant Dû</TableHead>
                    <TableHead>Niveau de Relance</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="h-12" />
                      </TableRow>
                    ))}
                  {!isLoading &&
                    unpaidInvoices.map((sale) => {
                      const totalPaid = (sale.payments || []).reduce(
                        (sum, p) => sum + p.amount,
                        0
                      );
                      const amountDue = sale.total - totalPaid;
                      const logs = saleDunningLogs(sale.id);
                      return (
                        <React.Fragment key={sale.id}>
                          <TableRow>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleDetails(sale.id)}
                              >
                                {openDetails[sale.id] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/reports/${sale.id}?from=unpaid`}
                                className="font-medium text-primary hover:underline"
                              >
                                {sale.ticketNumber}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {getCustomerName(sale.customerId)}
                            </TableCell>
                            <TableCell>
                              <ClientFormattedDate
                                date={sale.date}
                                formatString="d MMMM yyyy"
                              />
                            </TableCell>
                            <TableCell className="font-semibold text-destructive">
                              {amountDue.toFixed(2)}€
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  sale.dunningLevel ? 'default' : 'outline'
                                }
                              >
                                Niveau {sale.dunningLevel || 0}
                              </Badge>
                              {sale.lastDunningDate && (
                                <p className="text-xs text-muted-foreground">
                                  <ClientFormattedDate
                                    date={sale.lastDunningDate}
                                    formatString="d MMM yy"
                                  />
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDunningAction({
                                        sale,
                                        actionType: 'email',
                                      })
                                    }
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Relance par Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDunningAction({
                                        sale,
                                        actionType: 'phone',
                                      })
                                    }
                                  >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Enregistrer un Appel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDunningAction({
                                        sale,
                                        actionType: 'whatsapp',
                                      })
                                    }
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Enregistrer un WhatsApp
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {openDetails[sale.id] && (
                            <TableRow>
                              <TableCell colSpan={7} className="p-0">
                                <div className="bg-muted/50 p-4">
                                  {logs.length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Note</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {logs.map((log) => (
                                          <TableRow key={log.id}>
                                            <TableCell className="text-xs">
                                              <ClientFormattedDate
                                                date={log.date}
                                                formatString="d MMM yy, HH:mm"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                variant="secondary"
                                                className="capitalize"
                                              >
                                                {log.actionType}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-pre-wrap">
                                              {log.notes || '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                      Aucune action de relance enregistrée pour
                                      cette facture.
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
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

      {dunningAction?.actionType === 'email' && (
        <EmailSenderDialog
          isOpen={true}
          onClose={() => setDunningAction(null)}
          sale={dunningAction.sale}
          dunningMode={true}
          onSend={(notes) => handleDunningAction(dunningAction.sale, 'email', notes)}
        />
      )}
      
       {(dunningAction?.actionType === 'phone' || dunningAction?.actionType === 'whatsapp') && (
        <DunningActionDialog
          isOpen={true}
          onClose={() => setDunningAction(null)}
          sale={dunningAction.sale}
          actionType={dunningAction.actionType}
          onConfirm={(notes) => handleDunningAction(dunningAction.sale, dunningAction.actionType, notes)}
        />
      )}
    </>
  );
}
