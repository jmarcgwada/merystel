'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, RefreshCw, KeyRound, LockOpen, LogOut, ArrowLeft, MoreVertical, ChevronRight, User as UserIcon, Clock } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

export default function UsersPage() {
  const { users, deleteUser, isLoading, sendPasswordResetEmailForUser, forceSignOutUser, updateUser } = usePos();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [userToSignOut, setUserToSignOut] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if(currentUser?.id === user.id) return; // Can't disable self
    updateUser({ ...user, isDisabled: !user.isDisabled });
  };
  
  const toggleDetails = (userId: string) => {
    setOpenDetails(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <>
      <PageHeader title="Gérer les utilisateurs" subtitle={isClient && users ? `Vous avez ${users.length} utilisateurs au total.` : "Ajoutez, modifiez ou supprimez des utilisateurs."}>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
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
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Statut session</TableHead>
                          <TableHead>Statut compte</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(isLoading || !isClient) && Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                      ))}
                      {isClient && !isLoading && users && users.map(u => {
                          const isUserConnected = u.sessionToken && u.sessionToken.length > 0;
                          return (
                          <React.Fragment key={u.id}>
                            <TableRow className="cursor-pointer" onClick={() => toggleDetails(u.id)}>
                                <TableCell>
                                    <ChevronRight className={`h-4 w-4 transition-transform ${openDetails[u.id] ? 'rotate-90' : ''}`} />
                                </TableCell>
                                <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{u.role || 'N/A'}</Badge></TableCell>
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
                                            disabled={!currentUser || currentUser.id === u.id}
                                        />
                                        <label htmlFor={`active-switch-${u.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {u.isDisabled ? "Inactif" : "Actif"}
                                        </label>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => router.push(`/settings/users/form?id=${u.id}`)}>
                                                <Edit className="mr-2 h-4 w-4"/> Modifier
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => setUserToReset(u)} disabled={!currentUser || currentUser.id === u.id}>
                                                <KeyRound className="mr-2 h-4 w-4"/> Réinitialiser MDP
                                            </DropdownMenuItem>
                                            {isUserConnected && (
                                                <DropdownMenuItem onClick={() => setUserToSignOut(u)} disabled={!currentUser || currentUser.id === u.id}>
                                                    <LogOut className="mr-2 h-4 w-4 text-destructive"/> Forcer la déconnexion
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setUserToDelete(u)} className="text-destructive" disabled={!currentUser || currentUser.id === u.id}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                             {openDetails[u.id] && (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-0">
                                        <div className="bg-secondary/50 p-4 pl-16">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Rôle:</span>
                                                    <span className="font-semibold capitalize">{u.role}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Durée de session:</span>
                                                    <span className="font-semibold">{u.sessionDuration === 0 ? 'Illimitée' : `${u.sessionDuration || 'N/A'} min`}</span>
                                                </div>
                                            </div>
                                        </div>
                                         <Separator />
                                    </TableCell>
                                </TableRow>
                            )}
                          </React.Fragment>
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
