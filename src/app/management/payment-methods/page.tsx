
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Wallet, Landmark, Plus, StickyNote, Edit, Trash2, Icon } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AddPaymentMethodDialog } from './components/add-payment-method-dialog';
import { EditPaymentMethodDialog } from './components/edit-payment-method-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: { [key: string]: Icon } = {
  card: CreditCard,
  cash: Wallet,
  check: StickyNote,
  other: Landmark
};

export default function PaymentMethodsPage() {
  const { paymentMethods, deletePaymentMethod, isLoading } = usePos();
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [methodToEdit, setMethodToEdit] = useState<PaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    return Landmark;
  }

  const handleOpenEditDialog = (method: PaymentMethod) => {
    setMethodToEdit(method);
    setEditOpen(true);
  }

  const handleDeleteMethod = () => {
    if (methodToDelete) {
      deletePaymentMethod(methodToDelete.id);
      setMethodToDelete(null);
    }
  }

  return (
    <>
      <PageHeader title="Gérer les moyens de paiement" subtitle="Configurez les options de paiement disponibles lors de l'encaissement.">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un moyen de paiement
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(isLoading || !isClient) && Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {isClient && !isLoading && paymentMethods && paymentMethods.map((method: PaymentMethod) => {
                        const IconComponent = getIcon(method.icon);
                        return (
                            <TableRow key={method.id}>
                                <TableCell>
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                </TableCell>
                                <TableCell className="font-medium">{method.name}</TableCell>
                                <TableCell>
                                  <Badge variant={method.type === 'direct' ? 'default' : 'secondary'} className="capitalize">
                                    {method.type === 'direct' ? 'Direct' : `Indirect ${method.value ? `(${method.value.toFixed(2)}€)` : ''}`}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(method)}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setMethodToDelete(method)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      <AddPaymentMethodDialog isOpen={isAddOpen} onClose={() => setAddOpen(false)} />
      <EditPaymentMethodDialog isOpen={isEditOpen} onClose={() => setEditOpen(false)} paymentMethod={methodToEdit} />
      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La méthode de paiement "{methodToDelete?.name}" sera supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMethodToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMethod} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
