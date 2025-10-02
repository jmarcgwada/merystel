

'use client';

import React, { useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email({ message: "L'email n'est pas valide." }),
  role: z.enum(['admin', 'manager', 'cashier']),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }).optional(),
}).refine(data => {
    // This logic is now client-side only, so window is safe to use.
    if (typeof window === 'undefined') return true; // Pass validation on server
    const searchParams = new URLSearchParams(window.location.search);
    const isEditMode = Boolean(searchParams.get('id'));
    // Password is required only if it's not edit mode.
    return isEditMode || (data.password && data.password.length > 0);
}, {
    message: "Le mot de passe est requis pour un nouvel utilisateur.",
    path: ["password"],
});


type UserFormValues = z.infer<typeof formSchema>;

function UserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const { users, addUser, updateUser } = usePos();

  const userId = searchParams.get('id');
  const isEditMode = Boolean(userId);
  const userToEdit = isEditMode ? users.find(u => u.id === userId) : null;
  
  const isForbidden = currentUser?.role === 'cashier' || currentUser?.role === 'manager';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'cashier',
      password: '',
    },
  });

  useEffect(() => {
    if (isForbidden) {
        router.push('/dashboard');
    }
  }, [isForbidden, router]);

  useEffect(() => {
    if (isEditMode && userToEdit) {
      form.reset({
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        role: userToEdit.role,
      });
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        role: 'cashier',
        password: '',
      });
    }
  }, [isEditMode, userToEdit, form]);

  async function onSubmit(data: UserFormValues) {
    if (isForbidden) {
        toast({ variant: 'destructive', title: 'Accès refusé' });
        return;
    }
    if (isEditMode && userToEdit) {
      const { password, ...updateData } = data;
      updateUser({ ...userToEdit, ...updateData });
       router.push('/settings/users');
    } else {
      if (data.password) {
        try {
            await addUser(data, data.password);
            router.push('/settings/users');
        } catch(e) {
            // Error is handled in context, do nothing here to keep user on page
        }
      }
    }
  }

  if (isForbidden) {
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
      <PageHeader
        title={isEditMode ? "Modifier l'utilisateur" : 'Ajouter un nouvel utilisateur'}
        subtitle={isEditMode ? "Mettez à jour les détails de l'utilisateur." : "Remplissez le formulaire pour créer un utilisateur."}
      >
        <Button variant="outline" asChild className="btn-back">
          <Link href="/settings/users">
            <ArrowLeft />
            Retour à la liste
          </Link>
        </Button>
      </PageHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 max-w-2xl space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Détails de l'utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse e-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jean.dupont@example.com" {...field} readOnly={isEditMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                )}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode && userToEdit?.id === currentUser?.uid}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="cashier">Caissier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isEditMode && (
                  <CardDescription>La modification de l'e-mail n'est pas disponible ici. Le mot de passe peut être réinitialisé depuis la liste des utilisateurs.</CardDescription>
                )}
              </CardContent>
            </Card>
          
            <div className="flex justify-end">
                <Button type="submit" size="lg">
                    {isEditMode ? 'Sauvegarder les modifications' : "Créer l'utilisateur"}
                </Button>
            </div>
        </form>
      </Form>
    </>
  );
}

export default function UserFormPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <UserForm />
        </Suspense>
    )
}

    
