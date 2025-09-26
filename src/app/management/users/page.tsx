
'use client';

import { useState, useEffect } from 'react';
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
} from "@/components/ui/alert-dialog"
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


export default function UsersPage() {
  const { users, deleteUser, isLoading } = usePos();
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  }

  return (
    <>
      <PageHeader title="Gérer les utilisateurs" subtitle={isClient && users ? `Vous avez ${users.length} utilisateurs au total.` : "Ajoutez, modifiez ou supprimez des utilisateurs."}>
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => router.push('/management/users/form')}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(isLoading || !isClient) && Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {isClient && !isLoading && users && users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/management/users/form?id=${u.id}`)}>
                                  <Edit className="h-4 w-4"/>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUserToDelete(u)}>
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur "{userToDelete?.firstName} {userToDelete?.lastName}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
