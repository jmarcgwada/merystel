
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
import { MoreHorizontal, ArrowLeft, Banknote, Landmark, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { usePos } from '@/contexts/pos-context';
import type { Cheque } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { isAfter, isBefore, startOfToday, endOfDay, addDays } from 'date-fns';

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
  const { cheques, customers, deleteCheque, updateCheque } = usePos();
  const [filterStatut, setFilterStatut] = useState<Cheque['statut'] | 'all'>('enPortefeuille');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [chequeToDelete, setChequeToDelete] = useState<Cheque | null>(null);

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
  };

  const isEcheanceProche = (dateEcheance: Cheque['dateEcheance']) => {
    const today = startOfToday();
    const échéance = new Date(dateEcheance as any);
    const dansSeptJours = endOfDay(addDays(today, 7));
    return isAfter(échéance, today) && isBefore(échéance, dansSeptJours);
  };

  return (
    <>
      <PageHeader
        title="Gestion du Portefeuille de Chèques"
        subtitle={`Suivi de ${filteredCheques.length} chèque(s) pour un total de ${totalAmount.toFixed(2)}€`}
      >
        <Button asChild variant="outline">
          <Link href="/management/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la gestion
          </Link>
        </Button>
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
                    <Select value={filterStatut} onValueChange={(v) => setFilterStatut(v as any)}>
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
                    <TableCell colSpan={6} className="text-center h-24">Aucun chèque trouvé pour ces filtres.</TableCell>
                  </TableRow>
                ) : (
                  filteredCheques.map(cheque => (
                    <TableRow key={cheque.id}>
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
