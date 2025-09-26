
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, RefreshCw } from 'lucide-react';
import { AddCustomerDialog } from './components/add-customer-dialog';
import { EditCustomerDialog } from './components/edit-customer-dialog';
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
import type { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';


export default function CustomersPage() {
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const { customers, deleteCustomer, setDefaultCustomer, isLoading } = usePos();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  }

  const handleOpenEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditCustomerOpen(true);
  }

  return (
    <>
      <PageHeader title="Gérer les clients" subtitle={isClient && customers ? `Vous avez ${customers.length} clients au total.` : "Affichez et gérez votre liste de clients."}>
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => setAddCustomerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(isLoading || !isClient) && Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {isClient && !isLoading && customers && customers.map(customer => (
                        <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setDefaultCustomer(customer.id)}>
                                    <Star className={cn("h-4 w-4", customer.isDefault ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setCustomerToDelete(customer)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
      <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customerToEdit} />
       <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client "{customerToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
