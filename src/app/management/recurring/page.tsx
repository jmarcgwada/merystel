
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { History, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import type { Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function RecurringInvoicesPage() {
  const { sales, customers, isLoading, updateSale } = usePos();
  const router = useRouter();

  const [saleToModify, setSaleToModify] = useState<Sale | null>(null);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const recurringSales = useMemo(() => {
    return sales?.filter(s => s.isRecurring).sort((a,b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime()) || [];
  }, [sales]);

  const getCustomerName = useCallback((customerId?: string) => {
    if (!customerId || !customers) return 'N/A';
    return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
  }, [customers]);

  const handleToggleActive = (sale: Sale) => {
    if (!sale.recurrence) return;
    updateSale({
      ...sale,
      recurrence: {
        ...sale.recurrence,
        isActive: !sale.recurrence.isActive,
      }
    });
  };
  
  const handleDeleteRecurrence = () => {
    if(!saleToModify) return;
    updateSale({
      ...saleToModify,
      isRecurring: false,
      recurrence: undefined,
    });
    setConfirmDeleteOpen(false);
    setSaleToModify(null);
  }

  const handleEdit = (sale: Sale) => {
    router.push(`/reports/${sale.id}?from=recurring`);
  }

  return (
    <>
      <PageHeader
        title="Factures Récurrentes"
        subtitle={`Vous avez ${recurringSales.length} factures récurrentes configurées.`}
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="btn-back">
                <Link href="/management/items">
                    <ArrowLeft />
                    Retour à la gestion
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
                          <TableHead>Client</TableHead>
                          <TableHead>Pièce d'origine</TableHead>
                          <TableHead>Fréquence</TableHead>
                          <TableHead>Prochaine Échéance</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading && Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                      ))}
                      {!isLoading && recurringSales.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Aucune facture récurrente configurée.</TableCell>
                          </TableRow>
                      )}
                      {!isLoading && recurringSales.map(sale => (
                          <TableRow key={sale.id}>
                              <TableCell className="font-medium">{getCustomerName(sale.customerId)}</TableCell>
                              <TableCell>
                                <Link href={`/reports/${sale.id}?from=recurring`} className="text-blue-600 hover:underline">
                                    {sale.ticketNumber}
                                </Link>
                              </TableCell>
                              <TableCell className="capitalize">{sale.recurrence?.frequency}</TableCell>
                              <TableCell>
                                {sale.recurrence?.nextDueDate ? <ClientFormattedDate date={sale.recurrence.nextDueDate} formatString="d MMMM yyyy" /> : '-'}
                              </TableCell>
                               <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={sale.recurrence?.isActive ?? false}
                                    onCheckedChange={() => handleToggleActive(sale)}
                                  />
                                  <Badge variant={sale.recurrence?.isActive ? 'default' : 'outline'}>
                                    {sale.recurrence?.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setSaleToModify(sale); setConfirmDeleteOpen(true); }}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la configuration de récurrence pour la pièce "{saleToModify?.ticketNumber}", mais ne supprimera pas la pièce elle-même.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToModify(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecurrence} className="bg-destructive hover:bg-destructive/90">Supprimer la récurrence</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
