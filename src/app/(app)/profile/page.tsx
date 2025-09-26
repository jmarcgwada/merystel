
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth, updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User } from 'lucide-react';

const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non trouvé.' });
      return;
    }
    setIsLoading(true);
    try {
      const auth = getAuth();
      if(auth.currentUser) {
        await updatePassword(auth.currentUser, data.newPassword);
        toast({ title: 'Succès', description: 'Votre mot de passe a été modifié.' });
        form.reset();
      } else {
         throw new Error("L'utilisateur actuel n'a pas été trouvé dans l'instance d'authentification.");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
       toast({
        variant: 'destructive',
        title: 'Échec de la modification',
        description: 'Une erreur est survenue. Veuillez vous déconnecter et vous reconnecter avant de réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

   if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Mon Profil"
          subtitle="Gérez les informations de votre compte."
        />
        <div className="mt-8 max-w-2xl mx-auto">
           <Alert>
              <User className="h-4 w-4" />
              <AlertTitle>Non connecté</AlertTitle>
              <AlertDescription>
                  Vous devez être connecté pour voir cette page.
              </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Mon Profil"
        subtitle={`Bienvenue, ${user.firstName}. Gérez les informations de votre compte ici.`}
      />
      <div className="mt-8 max-w-2xl mx-auto grid gap-8">
         <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Prénom:</span> {user.firstName}</div>
                <div><span className="font-semibold">Nom:</span> {user.lastName}</div>
            </div>
             <div><span className="font-semibold">Email:</span> {user.email}</div>
             <div><span className="font-semibold">Rôle:</span> <span className="capitalize">{user.role}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>
              Entrez un nouveau mot de passe pour votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
