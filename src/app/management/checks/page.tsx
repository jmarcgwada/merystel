
'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreVertical, ArrowLeft, Banknote, Landmark, CircleAlert, CheckCircle, Trash2, FileText, Check, Mail, Phone, MessageSquare, XCircle, ChevronDown, ChevronRight, Mic, MicOff, ArrowUpDown, Library, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { usePos } from '@/contexts/pos-context';
import type { Cheque, DunningLog, Sale, PaiementPartiel } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { isAfter, isBefore, startOfToday, endOfDay, addDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { EmailSenderDialog } from '@/app/reports/components/email-sender-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent as DialogContentComponent, DialogHeader as DialogHeaderComponent, DialogTitle as DialogTitleComponent, DialogDescription as DialogDescriptionComponent, DialogFooter as DialogFooterComponent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const DunningActionDialog = ({
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
}) => {
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen]);
  
  const toggleRecording = () => {};

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
        <div className="py-4 space-y-2">
          <Label htmlFor="dunning-notes">Notes</Label>
          <div className="relative">
            <Textarea
              id="dunning-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cliquez sur le micro pour dicter, ou tapez votre commentaire..."
              className="mt-2 pr-12"
              rows={4}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8 text-muted-foreground",
                isRecording && "bg-red-500/20 text-red-600 hover:bg-red-500/30 hover:text-red-700"
              )}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(notes)}>Enregistrer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const PartialPaymentDialog = ({
  isOpen,
  onClose,
  cheque,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  cheque: Cheque | null;
  onConfirm: (amount: number, method: string) => void;
}) => {
  const { paymentMethods, paiementsPartiels } = usePos();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');

  const totalPaid = useMemo(() => {
    if (!cheque) return 0;
    return paiementsPartiels
      .filter(p => p.chequeId === cheque.id)
      .reduce((sum, p) => sum + p.montant, 0);
  }, [paiementsPartiels, cheque]);

  if (!isOpen || !cheque) return null;

  const amountDue = cheque.montant - totalPaid;

  const handleConfirmClick = () => {
    const paymentAmount = parseFloat(amount);
    if (!amount || !method || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Veuillez saisir un montant valide et choisir un moyen de paiement.");
      return;
    }
    if (paymentAmount > amountDue) {
      alert("Le montant du règlement ne peut pas dépasser le solde restant du chèque.");
      return;
    }
    onConfirm(paymentAmount, method);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentComponent>
        <DialogHeaderComponent>
          <DialogTitleComponent>Enregistrer un Règlement</DialogTitleComponent>
          <DialogDescriptionComponent>
            Chèque n°{cheque.numeroCheque} - Montant dû: {amountDue.toFixed(2)}€
          </DialogDescriptionComponent>
        </DialogHeaderComponent>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="partial-amount">Montant</Label>
            <Input
              id="partial-amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={amountDue.toFixed(2)}
              max={amountDue}
            />
          </div>
          <div>
            <Label htmlFor="partial-method">Moyen de paiement</Label>
            <Select onValueChange={setMethod} value={method}>
              <SelectTrigger id="partial-method">
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods
                  .filter(pm => pm.name.toLowerCase() !== 'chèque')
                  .map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooterComponent>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConfirmClick} disabled={!amount || !method}>
            Enregistrer
          </Button>
        </DialogFooterComponent>
      </DialogContentComponent>
    </Dialog>
  );
};


const statutLabels: Record<Cheque['statut'], string> = {
  enPortefeuille: 'En Portefeuille',
  remisEnBanque: 'Remis en Banque',
  encaisse: 'Encaissé',
  impaye: 'Impayé',
  annule: 'Annulé',
};

const statutColors: Record<Cheque['statut'], string> = {
    enPortefeuille: 'bg-blue-100 text-blue-800',
    remisEnBanque: 'bg-purple-100 text-purple-800',
    encaisse: 'bg-green-100 text-green-800',
    impaye: 'bg-red-100 text-red-800',
    annule: 'bg-gray-100 text-gray-800',
};

export default function ChecksManagementPage() {
  const { cheques, customers, deleteCheque, updateCheque, addRemise, sales, dunningLogs, addDunningLog, paiementsPartiels, addPaiementPartiel } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  const [filterStatut, setFilterStatut] = useState<Cheque['statut'] | 'all'>('enPortefeuille');
  const [searchTerm, setSearchTerm] = useState('');
  const [chequeToDelete, setChequeToDelete] = useState<Cheque | null>(null);
  const [selectedChequeIds, setSelectedChequeIds] = useState<string[]>([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [saleForEmail, setSaleForEmail] = useState<Sale | null>(null);
  const [dunningActionState, setDunningActionState] = useState<{ sale: Sale | null; actionType: 'phone' | 'whatsapp' | null; }>({ sale: null, actionType: null });
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'dateEcheance', direction: 'asc' });
  const [chequeForPartialPayment, setChequeForPartialPayment] = useState<Cheque | null>(null);


  const getCustomerName = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Client inconnu';
  }, [customers]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const sortedCheques = useMemo(() => {
    let tempCheques = [...cheques];

    if (filterStatut !== 'all') {
      tempCheques = tempCheques.filter(c => c.statut === filterStatut);
    }
    
    if (searchTerm) {
        const lowerCaseFilter = searchTerm.toLowerCase();
        tempCheques = tempCheques.filter(c => {
          const sale = sales.find(s => s.id === c.factureId);
          return getCustomerName(c.clientId).toLowerCase().includes(lowerCaseFilter) ||
                 (sale?.ticketNumber && sale.ticketNumber.toLowerCase().includes(lowerCaseFilter)) ||
                 (c.banque && c.banque.toLowerCase().includes(lowerCaseFilter));
        });
    }
    
    if (sortConfig !== null) {
      tempCheques.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
            case 'client':
                aValue = getCustomerName(a.clientId);
                bValue = getCustomerName(b.clientId);
                break;
            case 'numeroPiece':
                aValue = sales.find(s => s.id === a.factureId)?.ticketNumber || '';
                bValue = sales.find(s => s.id === b.factureId)?.ticketNumber || '';
                break;
            case 'dateEcheance':
                aValue = new Date(a.dateEcheance as any).getTime();
                bValue = new Date(b.dateEcheance as any).getTime();
                break;
            default:
                aValue = a[sortConfig.key as keyof Cheque];
                bValue = b[sortConfig.key as keyof Cheque];
                break;
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

    return tempCheques;
  }, [cheques, filterStatut, searchTerm, getCustomerName, sortConfig, sales]);
  
  const totalAmount = useMemo(() => {
      return sortedCheques.reduce((sum, cheque) => sum + cheque.montant, 0);
  }, [sortedCheques]);

  const handleUpdateStatus = (cheque: Cheque, newStatus: Cheque['statut']) => {
    updateCheque({ ...cheque, statut: newStatus });
    toast({ title: 'Statut mis à jour', description: `Le chèque n°${cheque.numeroCheque} est maintenant "${statutLabels[newStatus]}".` });
  };

  const isEcheanceProche = (dateEcheance: Cheque['dateEcheance']) => {
    const today = startOfToday();
    const échéance = new Date(dateEcheance as any);
    const dansSeptJours = endOfDay(addDays(today, 7));
    return isAfter(échéance, today) && isBefore(échéance, dansSeptJours);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        const portefeuilleIds = sortedCheques
            .filter(c => c.statut === 'enPortefeuille' && !chequePaiementsPartiels(c.id).length)
            .map(c => c.id);
        setSelectedChequeIds(portefeuilleIds);
    } else {
        setSelectedChequeIds([]);
    }
  };

  const handleCreateRemise = async () => {
    if(selectedChequeIds.length === 0) return;

    const chequesToRemit = cheques.filter(c => selectedChequeIds.includes(c.id));
    const totalRemise = chequesToRemit.reduce((sum, c) => sum + c.montant, 0);

    const newRemise = await addRemise({
        dateRemise: new Date(),
        chequeIds: selectedChequeIds,
        montantTotal: totalRemise,
    });
    
    for (const cheque of chequesToRemit) {
        await updateCheque({ ...cheque, statut: 'remisEnBanque' });
    }

    toast({
        title: 'Bordereau créé',
        description: `${selectedChequeIds.length} chèque(s) marqué(s) comme "Remis en banque".`
    });
    setSelectedChequeIds([]);
    if (newRemise) {
        router.push('/management/remises');
    }
  }

  const handleOpenEmailDunning = (cheque: Cheque) => {
    const sale = sales.find(s => s.id === cheque.factureId);
    if (sale) {
        setSaleForEmail(sale);
        setIsEmailDialogOpen(true);
    }
  }

  const handleDunningAction = (sale: Sale, actionType: 'phone' | 'whatsapp') => {
    setDunningActionState({ sale, actionType });
  };

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
  
  const chequePaiementsPartiels = useCallback((chequeId: string) => {
    return paiementsPartiels.filter(p => p.chequeId === chequeId);
  }, [paiementsPartiels]);

  const getChequeBalance = useCallback((cheque: Cheque) => {
    const payments = chequePaiementsPartiels(cheque.id);
    const totalPaid = payments.reduce((sum, p) => sum + p.montant, 0);
    return cheque.montant - totalPaid;
  }, [chequePaiementsPartiels]);

  const handlePartialPaymentConfirm = async (amount: number, method: string) => {
    if (!chequeForPartialPayment) return;
    await addPaiementPartiel({
        chequeId: chequeForPartialPayment.id,
        montant: amount,
        moyenDePaiement: method,
        datePaiement: new Date()
    });
    setChequeForPartialPayment(null);
    toast({ title: 'Règlement enregistré' });
  };
  
  const toggleDetails = (chequeId: string) => {
    setOpenDetails((prev) => ({ ...prev, [chequeId]: !prev[chequeId] }));
  };

  return (
    <>
      <PageHeader
        title="Gestion du Portefeuille de Chèques"
        subtitle={`Suivi de ${sortedCheques.length} chèque(s) pour un total de ${totalAmount.toFixed(2)}€`}
      >
        <div className="flex items-center gap-2">
            {selectedChequeIds.length > 0 && (
                <Button onClick={handleCreateRemise}>
                    <FileText className="mr-2 h-4 w-4" />
                    Créer bordereau de remise ({selectedChequeIds.length})
                </Button>
            )}
             <Button asChild variant="outline">
                <Link href="/management/remises">
                    <Library className="mr-2 h-4 w-4" />
                    Voir les bordereaux
                </Link>
            </Button>
            <Button asChild variant="outline" className="btn-back">
                <Link href="/management/items">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la gestion
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Portefeuille de chèques</CardTitle>
                <div className="flex items-center gap-4">
                    <Input 
                        placeholder="Filtrer par client, n° pièce ou banque..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                    <Select value={filterStatut} onValueChange={(v) => {
                        setFilterStatut(v as any);
                        setSelectedChequeIds([]);
                    }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            {Object.entries(statutLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-12">
                       <Checkbox
                           checked={selectedChequeIds.length > 0 && selectedChequeIds.length === sortedCheques.filter(c => c.statut === 'enPortefeuille' && !chequePaiementsPartiels(c.id).length).length}
                           onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                           disabled={filterStatut !== 'enPortefeuille'}
                       />
                   </TableHead>
                   <TableHead className="w-12"></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('client')}>Client {getSortIcon('client')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('numeroPiece')}>N° Pièce {getSortIcon('numeroPiece')}</Button></TableHead>
                  <TableHead>N° Chèque / Banque</TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('montant')}>Montant {getSortIcon('montant')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('dateEcheance')}>Date d'échéance {getSortIcon('dateEcheance')}</Button></TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCheques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">Aucun chèque trouvé pour ces filtres.</TableCell>
                  </TableRow>
                ) : (
                  sortedCheques.map(cheque => {
                    const sale = sales.find(s => s.id === cheque.factureId);
                    const balance = getChequeBalance(cheque);
                    const hasPartialPayments = balance < cheque.montant;
                    const isSelectableForRemise = cheque.statut === 'enPortefeuille' && !hasPartialPayments;

                    return (
                    <React.Fragment key={cheque.id}>
                    <TableRow data-state={selectedChequeIds.includes(cheque.id) && 'selected'}>
                      <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={isSelectableForRemise ? undefined : 0}>
                                    <Checkbox
                                        checked={selectedChequeIds.includes(cheque.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedChequeIds(prev => 
                                                checked 
                                                ? [...prev, cheque.id] 
                                                : prev.filter(id => id !== cheque.id)
                                            )
                                        }}
                                        disabled={!isSelectableForRemise}
                                    />
                                  </span>
                                </TooltipTrigger>
                                {!isSelectableForRemise && (
                                  <TooltipContent>
                                    <p>
                                        {hasPartialPayments
                                          ? "Ne peut être remis, des règlements partiels existent."
                                          : "Seuls les chèques 'En Portefeuille' peuvent être remis."
                                        }
                                    </p>
                                  </TooltipContent>
                                )}
                            </Tooltip>
                          </TooltipProvider>
                      </TableCell>
                       <TableCell className="w-12">
                            <Button variant="ghost" size="icon" onClick={() => toggleDetails(cheque.id)}>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openDetails[cheque.id] ? 'rotate-180' : ''}`} />
                            </Button>
                        </TableCell>
                      <TableCell className="font-medium">{getCustomerName(cheque.clientId)}</TableCell>
                      <TableCell>
                        <Link href={`/reports/${cheque.factureId}`} className="text-primary hover:underline">
                            {sale?.ticketNumber || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span>{cheque.numeroCheque}</span>
                            <span className="text-xs text-muted-foreground">{cheque.banque}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-right">
                          <span className="font-bold">{cheque.montant.toFixed(2)}€</span>
                          {hasPartialPayments && (
                            <Badge variant="outline" className="mt-1 ml-auto font-normal text-amber-600 border-amber-400">
                                Restant: {balance.toFixed(2)}€
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <ClientFormattedDate date={cheque.dateEcheance} formatString="d MMMM yyyy" />
                           {isEcheanceProche(cheque.dateEcheance) && cheque.statut === 'enPortefeuille' && (
                                <Badge variant="destructive" className="animate-pulse">À remettre</Badge>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statutColors[cheque.statut]}>{statutLabels[cheque.statut]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                             <DropdownMenuItem onSelect={() => setChequeForPartialPayment(cheque)} disabled={cheque.statut === 'encaisse' || cheque.statut === 'annule' || balance <= 0}>
                                <WalletCards className="mr-2 h-4 w-4"/> Enregistrer un règlement
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            {cheque.statut === 'impaye' && sale && (
                                <>
                                 <DropdownMenuItem onSelect={() => handleOpenEmailDunning(cheque)}><Mail className="mr-2 h-4 w-4"/> Relance par Email</DropdownMenuItem>
                                 <DropdownMenuItem onSelect={() => handleDunningAction(sale, 'phone')}><Phone className="mr-2 h-4 w-4"/> Enregistrer un Appel</DropdownMenuItem>
                                 <DropdownMenuItem onSelect={() => handleDunningAction(sale, 'whatsapp')}><MessageSquare className="mr-2 h-4 w-4"/> Enregistrer un WhatsApp</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(cheque, 'remisEnBanque')} disabled={cheque.statut !== 'enPortefeuille' || hasPartialPayments}>
                                <Banknote className="mr-2 h-4 w-4"/> Marquer comme Remis en Banque
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(cheque, 'encaisse')} disabled={cheque.statut !== 'remisEnBanque'}>
                                <CheckCircle className="mr-2 h-4 w-4"/> Marquer comme Encaissé
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => handleUpdateStatus(cheque, 'impaye')} className="text-destructive" disabled={cheque.statut !== 'remisEnBanque'}>
                               <CircleAlert className="mr-2 h-4 w-4"/> Marquer comme Impayé
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(cheque, 'annule')} className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4"/> Marquer comme Annulé
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onSelect={() => setChequeToDelete(cheque)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                     {openDetails[cheque.id] && (
                        <TableRow>
                            <TableCell colSpan={9} className="p-0">
                                <div className="bg-secondary/50 p-4 grid grid-cols-2 gap-8">
                                  <div>
                                    <h4 className="font-semibold mb-2">Historique des relances</h4>
                                    {saleDunningLogs(cheque.factureId).length > 0 ? (
                                        <ul className="space-y-1 text-xs">
                                        {saleDunningLogs(cheque.factureId).map(log => (
                                            <li key={log.id} className="flex items-center gap-2">
                                            <ClientFormattedDate date={log.date} formatString="d MMM yy, HH:mm" />
                                            <Badge variant="outline" className="capitalize">{log.actionType}</Badge>
                                            <span className="text-muted-foreground italic">{log.notes || 'Aucune note'}</span>
                                            </li>
                                        ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Aucune relance enregistrée.</p>
                                    )}
                                  </div>
                                  <div>
                                     <h4 className="font-semibold mb-2">Historique des règlements partiels</h4>
                                      {chequePaiementsPartiels(cheque.id).length > 0 ? (
                                        <ul className="space-y-1 text-xs">
                                        {chequePaiementsPartiels(cheque.id).map(p => (
                                            <li key={p.id} className="flex justify-between">
                                              <span className="flex items-center gap-2">
                                                <ClientFormattedDate date={p.datePaiement} formatString="d MMM yy, HH:mm" />
                                                <Badge variant="outline">{p.moyenDePaiement}</Badge>
                                              </span>
                                              <span className="font-semibold">{p.montant.toFixed(2)}€</span>
                                            </li>
                                        ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Aucun règlement partiel enregistré.</p>
                                    )}
                                  </div>
                                </div>
                            </TableCell>
                        </TableRow>
                     )}
                    </React.Fragment>
                  )})
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <AlertDialog open={!!chequeToDelete} onOpenChange={() => setChequeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le chèque n°{chequeToDelete?.numeroCheque} sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChequeToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => chequeToDelete && deleteCheque(chequeToDelete.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       {isEmailDialogOpen && (
        <EmailSenderDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          sale={saleForEmail}
          dunningMode={true}
          onSend={(notes) => {
            if (saleForEmail) {
              addDunningLog({
                saleId: saleForEmail.id,
                actionType: 'email',
                notes: `Email de relance envoyé. Sujet: "Rappel pour votre facture impayée #${saleForEmail.ticketNumber}"`,
                status: 'sent',
              });
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
            addDunningLog({
                saleId: dunningActionState.sale.id,
                actionType: dunningActionState.actionType,
                notes: notes,
                status: 'completed',
            });
            setDunningActionState({ sale: null, actionType: null });
          }
        }}
      />
      <PartialPaymentDialog
        isOpen={!!chequeForPartialPayment}
        onClose={() => setChequeForPartialPayment(null)}
        cheque={chequeForPartialPayment}
        onConfirm={handlePartialPaymentConfirm}
      />
    </>
  );
}
