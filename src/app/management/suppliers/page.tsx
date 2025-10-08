
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import type { Supplier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Input } from '@/components/ui/input';
import { AddSupplierDialog } from './components/add-supplier-dialog';
import { EditSupplierDialog } from './components/edit-supplier-dialog';

export default function SuppliersPage() {
  const [isAddSupplierOpen, setAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setEditSupplierOpen] = useState(false);
  const { suppliers, deleteSupplier, isLoading } = usePos();
  const { user } = useUser();
  const isCashier = user?.role === 'cashier';
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    }
  }

  const handleOpenEditDialog = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setEditSupplierOpen(true);
  }

  const filteredSuppliers = useMemo(() => 
    suppliers?.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase()) || 
        s.id.toLowerCase().includes(filter.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(filter.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(filter.toLowerCase()))
    ) || [],
  [suppliers, filter]);

  return (
    <>
      <PageHeader 
        title="Gérer les fournisseurs" 
        subtitle={isClient && suppliers ? `Vous avez ${suppliers.length} fournisseurs au total.` : "Affichez et gérez votre liste de fournisseurs."}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {!isCashier && (
            <Button onClick={() => setAddSupplierOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un fournisseur
            </Button>
        )}
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                  <Input 
                    placeholder="Rechercher par nom, code, contact ou email..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                  />
              </div>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(isLoading || !isClient) ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                      )) : filteredSuppliers.map(supplier => (
                          <TableRow key={supplier.id}>
                              <TableCell className="font-medium">{supplier.name} <span className="font-mono text-xs text-muted-foreground ml-2">({supplier.id.slice(0,8)}...)</span></TableCell>
                              <TableCell>{supplier.contactName}</TableCell>
                              <TableCell>{supplier.email}</TableCell>
                              <TableCell>{supplier.phone}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => !isCashier && handleOpenEditDialog(supplier)} disabled={isCashier}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => !isCashier && setSupplierToDelete(supplier)} disabled={isCashier}>
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
      <AddSupplierDialog isOpen={isAddSupplierOpen} onClose={() => setAddSupplierOpen(false)} />
      <EditSupplierDialog isOpen={isEditSupplierOpen} onClose={() => setEditSupplierOpen(false)} supplier={supplierToEdit} />
       <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fournisseur "{supplierToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
