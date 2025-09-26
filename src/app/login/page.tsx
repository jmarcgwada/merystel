
'use client';

import { useState, useEffect }from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { usePos } from '@/contexts/pos-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const adminSchema = z.object({
    firstName: z.string().min(1, 'Prénom requis.'),
    lastName: z.string().min(1, 'Nom requis.'),
    email: z.string().email('Email invalide.'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères.'),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { users, isLoading: posLoading, addUser } = usePos();
  const [isReady, setIsReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    if (!userLoading && !posLoading) {
      setIsReady(true);
      if (users && users.length === 0) {
        setIsFirstLaunch(true);
      }
    }
  }, [userLoading, posLoading, users]);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);
  
  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const handleCreateAdmin = async (data: AdminFormValues) => {
    setIsLoading(true);
    try {
        await addUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: 'admin',
        }, data.password);
        toast({
            title: 'Administrateur créé',
            description: 'Vous pouvez maintenant vous connecter avec ces identifiants.',
        });
        setIsFirstLaunch(false); // Switch to login form
    } catch (error) {
         // The error toast is already handled inside addUser
    } finally {
        setIsLoading(false);
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login Error:", error);
      let description = 'Vérifiez vos identifiants et réessayez.';
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
          description = 'L\'adresse e-mail ou le mot de passe est incorrect.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  if (userLoading || posLoading || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Initialisation de l'application...</p>
      </div>
    );
  }

  if (user) {
    return null; // Don't render anything, useEffect will redirect.
  }
  
  if (isFirstLaunch) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-muted/40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserPlus /> Bienvenue !
              </CardTitle>
              <CardDescription>
                Aucun utilisateur détecté. Veuillez créer le premier compte administrateur.
              </CardDescription>
            </CardHeader>
            <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(handleCreateAdmin)}>
                    <CardContent className="grid gap-4">
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={adminForm.control}
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
                                control={adminForm.control}
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
                            control={adminForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="admin@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={adminForm.control}
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
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? 'Création en cours...' : 'Créer le compte administrateur'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
          </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez votre email pour vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
