
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eraser } from 'lucide-react';
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
import type { Table as TableType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';


export default function TablesPage() {
  const { tables, deleteTable, forceFreeTable } = usePos();
  const router = useRouter();
  const [tableToDelete, setTableToDelete] = useState<TableType | null>(null);
  const [tableToFree, setTableToFree] = useState<TableType | null>(null);

  const handleDeleteTable = () => {
    if (tableToDelete) {
      deleteTable(tableToDelete.id);
      setTableToDelete(null);
    }
  }

  const handleFreeTable = () => {
    if (tableToFree) {
        forceFreeTable(tableToFree.id);
        setTableToFree(null);
    }
  }

  return (
    <>
      <PageHeader title="Gérer les tables" subtitle="Ajoutez, modifiez ou supprimez des tables.">
        <Button onClick={() => router.push('/management/tables/form')}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une table
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Numéro</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tables.map(table => (
                        <TableRow key={table.id}>
                            <TableCell className="font-mono text-muted-foreground">{table.number}</TableCell>
                            <TableCell className="font-medium">{table.name}</TableCell>
                            <TableCell className="text-muted-foreground">{table.description || ''}</TableCell>
                             <TableCell>
                                <Badge variant={table.status === 'available' ? 'secondary' : table.status === 'occupied' ? 'default' : 'outline'} className="capitalize">
                                    {table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Occupée' : 'Paiement'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center">
                                    {table.status !== 'available' && (
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setTableToFree(table)}>
                                            <Eraser className="h-4 w-4"/>
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/management/tables/form?id=${table.id}`)}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setTableToDelete(table)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
       <AlertDialog open={!!tableToDelete} onOpenChange={() => setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La table "{tableToDelete?.name || ''}" sera supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTableToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!tableToFree} onOpenChange={() => setTableToFree(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Libérer la table "{tableToFree?.name || ''}" ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action effacera la commande en cours et le ticket en attente associé à cette table. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTableToFree(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFreeTable} className="bg-destructive hover:bg-destructive/90">Libérer la table</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
