
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
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const baseSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email({ message: "L'email n'est pas valide." }),
  role: z.enum(['admin', 'manager', 'cashier']),
});

const createUserSchema = baseSchema.extend({
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

const updateUserSchema = baseSchema.extend({
  password: z.string().optional(),
});


type UserFormValues = z.infer<typeof createUserSchema>;

function UserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { users, addUser, updateUser } = usePos();

  const userId = searchParams.get('id');
  const isEditMode = Boolean(userId);
  const userToEdit = isEditMode ? users.find(u => u.id === userId) : null;

  const formSchema = isEditMode ? updateUserSchema : createUserSchema;

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

  function onSubmit(data: UserFormValues) {
    if (isEditMode && userToEdit) {
      updateUser({ ...userToEdit, ...data });
      toast({ title: 'Utilisateur modifié', description: `L'utilisateur "${data.firstName} ${data.lastName}" a été mis à jour.` });
    } else {
      addUser(data);
      toast({ title: 'Utilisateur créé', description: `L'utilisateur "${data.firstName} ${data.lastName}" a été ajouté.` });
    }
    router.push('/management/users');
  }

  return (
    <>
      <PageHeader
        title={isEditMode ? "Modifier l'utilisateur" : 'Ajouter un nouvel utilisateur'}
        subtitle={isEditMode ? "Mettez à jour les détails de l'utilisateur." : "Remplissez le formulaire pour créer un utilisateur."}
      >
        <Button variant="outline" asChild>
          <Link href="/management/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </PageHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 max-w-2xl">
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
                      <Input type="email" placeholder="jean.dupont@example.com" {...field} />
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
                        <Input type="password" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-end">
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
