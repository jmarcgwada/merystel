
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { MoreHorizontal, ArrowLeft, Banknote, Landmark, CircleAlert, CheckCircle, Trash2, FileText, Check } from 'lucide-react';
import Link from 'next/link';
import { usePos } from '@/contexts/pos-context';
import type { Cheque } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { isAfter, isBefore, startOfToday, endOfDay, addDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

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
  const { cheques, customers, deleteCheque, updateCheque, addRemise } = usePos();
  const { toast } = useToast();
  const [filterStatut, setFilterStatut] = useState<Cheque['statut'] | 'all'>('enPortefeuille');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [chequeToDelete, setChequeToDelete] = useState<Cheque | null>(null);
  const [selectedChequeIds, setSelectedChequeIds] = useState<string[]>([]);

  const getCustomerName = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Client inconnu';
  }, [customers]);

  const filteredCheques = useMemo(() => {
    let tempCheques = [...cheques];

    if (filterStatut !== 'all') {
      tempCheques = tempCheques.filter(c => c.statut === filterStatut);
    }
    if (filterCustomer) {
        const lowerCaseFilter = filterCustomer.toLowerCase();
        tempCheques = tempCheques.filter(c => getCustomerName(c.clientId).toLowerCase().includes(lowerCaseFilter));
    }
    
    return tempCheques.sort((a,b) => new Date(a.dateEcheance as any).getTime() - new Date(b.dateEcheance as any).getTime());
  }, [cheques, filterStatut, filterCustomer, getCustomerName]);
  
  const totalAmount = useMemo(() => {
      return filteredCheques.reduce((sum, cheque) => sum + cheque.montant, 0);
  }, [filteredCheques]);

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
        const portefeuilleIds = filteredCheques
            .filter(c => c.statut === 'enPortefeuille')
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

    await addRemise({
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
  }

  return (
    <>
      <PageHeader
        title="Gestion du Portefeuille de Chèques"
        subtitle={`Suivi de ${filteredCheques.length} chèque(s) pour un total de ${totalAmount.toFixed(2)}€`}
      >
        <div className="flex items-center gap-2">
            {selectedChequeIds.length > 0 && (
                <Button onClick={handleCreateRemise}>
                    <FileText className="mr-2 h-4 w-4" />
                    Créer bordereau de remise ({selectedChequeIds.length})
                </Button>
            )}
            <Button asChild variant="outline">
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
                        placeholder="Filtrer par client..."
                        value={filterCustomer}
                        onChange={e => setFilterCustomer(e.target.value)}
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
                           checked={selectedChequeIds.length > 0 && selectedChequeIds.length === filteredCheques.filter(c => c.statut === 'enPortefeuille').length}
                           onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                           disabled={filterStatut !== 'enPortefeuille'}
                       />
                   </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>N° Chèque / Banque</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">Aucun chèque trouvé pour ces filtres.</TableCell>
                  </TableRow>
                ) : (
                  filteredCheques.map(cheque => (
                    <TableRow key={cheque.id} data-state={selectedChequeIds.includes(cheque.id) && 'selected'}>
                      <TableCell>
                          <Checkbox
                              checked={selectedChequeIds.includes(cheque.id)}
                              onCheckedChange={(checked) => {
                                  setSelectedChequeIds(prev => 
                                      checked 
                                      ? [...prev, cheque.id] 
                                      : prev.filter(id => id !== cheque.id)
                                  )
                              }}
                              disabled={cheque.statut !== 'enPortefeuille'}
                          />
                      </TableCell>
                      <TableCell className="font-medium">{getCustomerName(cheque.clientId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span>{cheque.numeroCheque}</span>
                            <span className="text-xs text-muted-foreground">{cheque.banque}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{cheque.montant.toFixed(2)}€</TableCell>
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
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(cheque, 'remisEnBanque')} disabled={cheque.statut !== 'enPortefeuille'}>
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
                            <DropdownMenuItem onSelect={() => setChequeToDelete(cheque)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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
    </>
  );
}
