

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, RefreshCw, KeyRound, Lock, LogOut, ArrowLeft } from 'lucide-react';
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
import { useUser } from '@/firebase/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';


export default function UsersPage() {
  const { users, deleteUser, isLoading, sendPasswordResetEmailForUser, forceSignOutUser, updateUser } = usePos();
  const { user: currentUser } = useUser();
  const isManager = currentUser?.role === 'manager';
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [userToSignOut, setUserToSignOut] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (currentUser?.role === 'cashier' || currentUser?.role === 'manager') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  }

  const handleResetPassword = () => {
    if (userToReset) {
      sendPasswordResetEmailForUser(userToReset.email);
      setUserToReset(null);
    }
  }

  const handleForceSignOut = () => {
    if (userToSignOut) {
      forceSignOutUser(userToSignOut.id);
      setUserToSignOut(null);
    }
  }

  const toggleUserDisabled = (user: User) => {
    if(currentUser?.uid === user.id) return; // Can't disable self
    updateUser({ ...user, isDisabled: !user.isDisabled });
  };

  if (currentUser?.role === 'cashier' || currentUser?.role === 'manager') {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader title="Accès non autorisé" />
            <Alert variant="destructive" className="mt-4">
                <Lock className="h-4 w-4" />
                <AlertTitle>Accès refusé</AlertTitle>
                <AlertDescription>
                    Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <>
      <PageHeader title="Gérer les utilisateurs" subtitle={isClient && users ? `Vous avez ${users.length} utilisateurs au total.` : "Ajoutez, modifiez ou supprimez des utilisateurs."}>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="btn-back">
                <Link href="/settings">
                    <ArrowLeft />
                    Retour aux paramètres
                </Link>
            </Button>
            <Button onClick={() => router.push('/settings/users/form')}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
            </Button>
        </div>
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Statut session</TableHead>
                          <TableHead>Statut compte</TableHead>
                          {!isManager && <TableHead className="w-[180px] text-right">Actions</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(isLoading || !isClient) && Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                              {!isManager && <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>}
                          </TableRow>
                      ))}
                      {isClient && !isLoading && users && users.map(u => {
                          const isUserConnected = u.sessionToken && u.sessionToken.length > 0;
                          return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                            </TableCell>
                            <TableCell>
                              {isUserConnected ? (
                                  <Badge className="bg-green-500 hover:bg-green-600">Connecté</Badge>
                              ) : (
                                  <Badge variant="outline">Déconnecté</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`active-switch-${u.id}`}
                                        checked={!u.isDisabled}
                                        onCheckedChange={() => toggleUserDisabled(u)}
                                        disabled={!currentUser || currentUser.uid === u.id || isManager}
                                    />
                                    <label htmlFor={`active-switch-${u.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {u.isDisabled ? "Inactif" : "Actif"}
                                    </label>
                                </div>
                            </TableCell>
                            {!isManager && (
                              <TableCell className="text-right">
                                  {currentUser?.role === 'admin' && currentUser.uid !== u.id && isUserConnected && (
                                      <Button variant="ghost" size="icon" title="Déconnecter l'utilisateur" onClick={() => setUserToSignOut(u)}>
                                          <LogOut className="h-4 w-4 text-destructive"/>
                                      </Button>
                                  )}
                                  {currentUser?.role === 'admin' && currentUser.uid !== u.id && (
                                      <Button variant="ghost" size="icon" title="Réinitialiser le mot de passe" onClick={() => setUserToReset(u)}>
                                          <KeyRound className="h-4 w-4"/>
                                      </Button>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={() => router.push(`/settings/users/form?id=${u.id}`)} disabled={isManager}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUserToDelete(u)} disabled={!currentUser || currentUser.uid === u.id}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </TableCell>
                            )}
                          </TableRow>
                      )})}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
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
      <AlertDialog open={!!userToReset} onOpenChange={() => setUserToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un e-mail sera envoyé à "{userToReset?.email}" pour lui permettre de définir un nouveau mot de passe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Envoyer l'e-mail</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!userToSignOut} onOpenChange={() => setUserToSignOut(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de forcer la déconnexion de l'utilisateur "{userToSignOut?.firstName} {userToSignOut?.lastName}". Il sera déconnecté de sa session active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceSignOut} className="bg-destructive hover:bg-destructive/90">Déconnecter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
