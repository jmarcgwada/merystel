
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useUser } from '@/firebase/auth/use-user';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis.'),
  lastName: z.string().min(1, 'Le nom de famille est requis.'),
  email: z.string().email(),
  role: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const roleTranslations: { [key: string]: string } = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    cashier: 'Caissier'
}

export default function ProfilePage() {
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'cashier',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userDocRef, {
      firstName: data.firstName,
      lastName: data.lastName,
    }, { merge: true });

    toast({
      title: 'Profil mis à jour',
      description: 'Vos informations ont été sauvegardées avec succès.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Mon Profil"
        subtitle="Gérez les informations de votre compte."
      />
      <div className="mt-8 max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>
                  Ces informations sont liées à votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                <>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                       <FormControl>
                        <Input {...field} disabled className="font-semibold capitalize" />
                      </FormControl>
                      <FormDescription>
                        Votre rôle définit vos permissions dans l'application. Il ne peut pas être modifié ici.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                       <FormDescription>
                        Vous ne pouvez pas modifier votre adresse e-mail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                  {form.formState.isSubmitting ? 'Sauvegarde...' : 'Sauvegarder les changements'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
