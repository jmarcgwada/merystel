
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { notFound } from 'next/navigation';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { setDoc, doc } from 'firebase/firestore';
import { usePos } from '@/contexts/pos-context';


export default function UsersPage() {
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  const { companyInfo } = usePos();
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(() => (firestore && companyInfo) ? collection(firestore, 'companies', companyInfo.id, 'users') : null, [firestore, companyInfo]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const isLoading = userLoading || usersLoading;
  
  // Role translations for display
  const roleTranslations: { [key: string]: string } = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    cashier: 'Caissier'
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!firestore || !companyInfo) return;
    const userRef = doc(firestore, 'companies', companyInfo.id, 'users', userId);
    try {
      await setDoc(userRef, { role: newRole }, { merge: true });
      toast({
        title: 'Rôle mis à jour',
        description: 'Le rôle de l\'utilisateur a été modifié avec succès.',
      });
    } catch (error) {
      console.error("Error updating user role: ", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le rôle de l\'utilisateur.',
      });
    }
  };


  if (isLoading) {
      return (
        <>
            <PageHeader title="Gérer les utilisateurs" subtitle="Modifier les rôles et les permissions des utilisateurs." />
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
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
      )
  }

  if (currentUser?.role !== 'admin') {
      return notFound();
  }


  return (
    <>
      <PageHeader title="Gérer les utilisateurs" subtitle="Modifier les rôles et les permissions des utilisateurs." />
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[250px]">Rôle</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users && users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                               <Select 
                                 defaultValue={user.role} 
                                 onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                 disabled={user.id === currentUser.uid} // Admin can't change their own role
                                >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="manager">Gestionnaire</SelectItem>
                                    <SelectItem value="cashier">Caissier</SelectItem>
                                </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
