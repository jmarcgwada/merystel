'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, RefreshCw, LayoutDashboard } from 'lucide-react';
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
import type { VatRate } from '@/lib/types';
import { AddVatDialog } from './components/add-vat-dialog';
import { EditVatDialog } from './components/edit-vat-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function VatPage() {
  const [isAddVatOpen, setAddVatOpen] = useState(false);
  const [isEditVatOpen, setEditVatOpen] = useState(false);
  const { vatRates, deleteVatRate, isLoading } = usePos();
  const [vatToDelete, setVatToDelete] = useState<VatRate | null>(null);
  const [vatToEdit, setVatToEdit] = useState<VatRate | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleDeleteVat = () => {
    if (vatToDelete) {
      deleteVatRate(vatToDelete.id);
      setVatToDelete(null);
    }
  }

  const handleOpenEditDialog = (vat: VatRate) => {
    setVatToEdit(vat);
    setEditVatOpen(true);
  }

  return (
    <>
      <PageHeader title="Gérer la TVA" subtitle={isClient && vatRates ? `Vous avez ${vatRates.length} taux de TVA au total.` : "Configurez vos taux de TVA."}>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button onClick={() => setAddVatOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un taux de TVA
            </Button>
        </div>
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[100px]">Code</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead className="text-right">Taux (%)</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(isLoading || !isClient) && Array.from({length: 3}).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                          </TableRow>
                      ))}
                      {isClient && !isLoading && vatRates && vatRates.map(vat => (
                          <TableRow key={vat.id}>
                              <TableCell className="font-mono text-muted-foreground">{vat.code}</TableCell>
                              <TableCell className="font-medium">{vat.name}</TableCell>
                              <TableCell className="text-right">{vat.rate.toFixed(2)}%</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(vat)}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setVatToDelete(vat)}>
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
      <AddVatDialog isOpen={isAddVatOpen} onClose={() => setAddVatOpen(false)} />
      <EditVatDialog isOpen={isEditVatOpen} onClose={() => setEditVatOpen(false)} vatRate={vatToEdit} />
       <AlertDialog open={!!vatToDelete} onOpenChange={() => setVatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le taux de TVA "{vatToDelete?.name}" sera supprimé. Les articles utilisant ce taux devront être mis à jour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVatToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVat} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
