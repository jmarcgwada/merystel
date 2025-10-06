

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eraser, Users, RefreshCw, Lock, User as UserIcon, Clock } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';


const ClientFormattedDate = ({ date }: { date: Date | Timestamp | undefined}) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp)?.toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, "d MMM, HH:mm", { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date]);

    return <>{formattedDate}</>;
}


export default function TablesPage() {
  const { tables, deleteTable, forceFreeTable, isLoading, users } = usePos();
  const router = useRouter();
  const [tableToDelete, setTableToDelete] = useState<TableType | null>(null);
  const [tableToFree, setTableToFree] = useState<TableType | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  const tablesWithoutTakeaway = tables.filter(t => t.id !== 'takeaway');
  
  const getUserName = useCallback((userId?: string) => {
    if (!userId || !users) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Utilisateur inconnu';
  }, [users]);

  return (
    <>
      <PageHeader title="Gérer les tables" subtitle={isClient && tablesWithoutTakeaway ? `Vous avez ${tablesWithoutTakeaway.length} tables au total.` : "Ajoutez, modifiez ou supprimez des tables."}>
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => router.push('/management/tables/form')}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une table
        </Button>
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[100px]">Numéro</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead className="w-[120px]">Couverts</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Dernière activité</TableHead>
                          <TableHead className="w-[160px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(isLoading || !isClient) && Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                          </TableRow>
                      ))}
                      {isClient && !isLoading && tablesWithoutTakeaway.map(table => (
                          <TableRow key={table.id}>
                              <TableCell className="font-mono text-muted-foreground">{table.number}</TableCell>
                              <TableCell className="font-medium">{table.name}</TableCell>
                              <TableCell>
                                  {table.covers && (
                                      <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                          <span>{table.covers}</span>
                                      </div>
                                  )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{table.description || ''}</TableCell>
                              <TableCell>
                                  <Badge variant={table.status === 'available' ? 'secondary' : table.status === 'occupied' ? 'default' : 'outline'} className="capitalize">
                                      {table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Occupée' : 'Paiement'}
                                  </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {table.status === 'occupied' && table.occupiedAt && (
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3"/>{getUserName(table.occupiedByUserId)}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3"/><ClientFormattedDate date={table.occupiedAt} /></span>
                                  </div>
                                )}
                                {table.status === 'available' && table.closedAt && (
                                   <div className="flex flex-col">
                                    <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3"/>{getUserName(table.closedByUserId)}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3"/><ClientFormattedDate date={table.closedAt} /></span>
                                  </div>
                                )}
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
      </div>
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
