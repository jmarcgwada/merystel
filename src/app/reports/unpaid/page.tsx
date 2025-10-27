
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  SlidersHorizontal,
  X,
  Calendar as CalendarIcon
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
} from "@/components/ui/alert-dialog"
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
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';

function DunningActionDialog({
  isOpen,
  onClose,
  sale,
  actionType,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  actionType: 'phone' | 'whatsapp' | null;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen]);
  
  if (!isOpen || !sale || !actionType) return null;

  const actionLabel = actionType === 'phone' ? 'téléphonique' : 'WhatsApp';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
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
    </AlertDialog>
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
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [saleForEmail, setSaleForEmail] = useState<Sale | null>(null);

  const [dunningActionState, setDunningActionState] = useState<{
    sale: Sale | null;
    actionType: 'phone' | 'whatsapp' | null;
  }>({ sale: null, actionType: null });
  
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const getCustomerName = useCallback(
    (customerId?: string) => {
      if (!customerId || !customers) return 'N/A';
      return (
        customers.find((c) => c.id === customerId)?.name || 'Client supprimé'
      );
    },
    [customers]
  );
  
  const unpaidInvoices = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter((sale) => {
        const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
        const amountDue = sale.total - totalPaid;

        if (sale.documentType !== 'invoice' || amountDue <= 0.01) {
            return false;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchMatch = !searchTerm ||
            sale.ticketNumber?.toLowerCase().includes(lowerSearchTerm) ||
            getCustomerName(sale.customerId).toLowerCase().includes(lowerSearchTerm);

        let dateMatch = true;
        const saleDate = new Date(sale.date as any);
        if (dateRange?.from) dateMatch = saleDate >= startOfDay(dateRange.from);
        if (dateRange?.to) dateMatch = dateMatch && saleDate <= endOfDay(dateRange.to);
        
        return searchMatch && dateMatch;
      })
      .sort(
        (a, b) =>
          new Date(a.date as any).getTime() - new Date(b.date as any).getTime()
      );
  }, [sales, searchTerm, dateRange, getCustomerName]);

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

    setDunningActionState({ sale: null, actionType: null });
    setIsEmailDialogOpen(false);
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

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange(undefined);
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
        
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <CardTitle>Liste des impayés</CardTitle>
              <div className="flex gap-2 flex-wrap items-center">
                  <Input 
                      placeholder="Rechercher par n° ou client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 w-auto sm:w-64"
                  />
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                          <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                      </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" onClick={resetFilters}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
                                    onClick={() => {
                                      setSaleForEmail(sale);
                                      setIsEmailDialogOpen(true);
                                    }}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Relance par Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDunningActionState({
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
                                      setDunningActionState({
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
      
      {isEmailDialogOpen && (
        <EmailSenderDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          sale={saleForEmail}
          dunningMode={true}
          onSend={(notes) => {
            if (saleForEmail) {
              handleDunningAction(saleForEmail, 'email', notes);
            }
          }}
        />
      )}
      
      <DunningActionDialog
        isOpen={!!dunningActionState.actionType}
        onClose={() => setDunningActionState({ sale: null, actionType: null })}
        sale={dunningActionState.sale}
        actionType={dunningActionState.actionType}
        onConfirm={(notes) => {
          if (dunningActionState.sale && dunningActionState.actionType) {
            handleDunningAction(dunningActionState.sale, dunningActionState.actionType, notes);
          }
        }}
      />
    </>
  );
}
