
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, ChevronDown, ChevronRight, Library } from 'lucide-react';
import Link from 'next/link';
import { usePos } from '@/contexts/pos-context';
import type { Cheque, RemiseCheque } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function RemisesPage() {
  const { remises, cheques, sales, customers, isLoading } = usePos();
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (remiseId: string) => {
    setOpenDetails((prev) => ({ ...prev, [remiseId]: !prev[remiseId] }));
  };
  
  const getChequesForRemise = (remise: RemiseCheque): Cheque[] => {
    return remise.chequeIds.map(id => cheques.find(c => c.id === id)).filter(Boolean) as Cheque[];
  };

  const sortedRemises = useMemo(() => {
    if (!remises) return [];
    return [...remises].sort((a, b) => new Date(b.dateRemise as any).getTime() - new Date(a.dateRemise as any).getTime());
  }, [remises]);

  const getCustomerName = useCallback((customerId?: string) => {
    if (!customerId || !customers) return 'N/A';
    return customers.find(c => c.id === customerId)?.name || 'Client inconnu';
  }, [customers]);

  return (
    <>
      <PageHeader
        title="Historique des Remises de Chèques"
        subtitle={`Vous avez ${sortedRemises.length} bordereaux de remise au total.`}
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="btn-back">
                <Link href="/management/checks">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux chèques
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
              <CardTitle>Liste des Bordereaux</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-12"></TableHead>
                   <TableHead>Date de Remise</TableHead>
                   <TableHead>Nombre de Chèques</TableHead>
                   <TableHead className="text-right">Montant Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && sortedRemises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Aucun bordereau de remise trouvé.</TableCell>
                  </TableRow>
                ) : (
                  sortedRemises.map((remise, index) => {
                    const relatedCheques = getChequesForRemise(remise);
                    return (
                    <React.Fragment key={`${remise.id}-${index}`}>
                    <TableRow>
                       <TableCell className="w-12">
                            <Button variant="ghost" size="icon" onClick={() => toggleDetails(remise.id)}>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openDetails[remise.id] ? 'rotate-180' : ''}`} />
                            </Button>
                        </TableCell>
                      <TableCell className="font-medium"><ClientFormattedDate date={remise.dateRemise} formatString="d MMMM yyyy" /></TableCell>
                      <TableCell><Badge variant="secondary">{remise.chequeIds.length} chèque(s)</Badge></TableCell>
                      <TableCell className="text-right font-bold">{remise.montantTotal.toFixed(2)}€</TableCell>
                    </TableRow>
                     {openDetails[remise.id] && (
                        <TableRow>
                            <TableCell colSpan={4} className="p-0">
                                <div className="bg-secondary/50 p-4">
                                <h4 className="font-semibold mb-2 ml-4">Détail des chèques remis</h4>
                                <Table>
                                  <TableHeader><TableRow>
                                    <TableHead>N° Pièce</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Numéro Chèque</TableHead>
                                    <TableHead>Banque</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                    {relatedCheques.map(cheque => {
                                      const sale = sales.find(s => s.id === cheque.factureId);
                                      return (
                                        <TableRow key={cheque.id}>
                                          <TableCell>
                                            <Link href={`/reports/${sale?.id}?from=remises`} className="text-primary hover:underline">
                                              {sale?.ticketNumber}
                                            </Link>
                                          </TableCell>
                                          <TableCell>{getCustomerName(cheque.clientId)}</TableCell>
                                          <TableCell>{cheque.numeroCheque}</TableCell>
                                          <TableCell>{cheque.banque}</TableCell>
                                          <TableCell className="text-right">{cheque.montant.toFixed(2)}€</TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
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
    </>
  );
}
