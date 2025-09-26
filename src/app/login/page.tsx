
'use client';

import { useState, useEffect }from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from 'firebase/firestore';


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
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { users, isLoading: posLoading, addUser, findUserByEmail, handleSignOut } = usePos();
  const [isReady, setIsReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [loginCredentials, setLoginCredentials] = useState<{email: string, password: string} | null>(null);


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

  const performLogin = async (emailToLogin: string, passwordToLogin: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin);
        const newSessionToken = uuidv4();
        localStorage.setItem('sessionToken', newSessionToken);
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        await setDoc(userRef, { sessionToken: newSessionToken }, { merge: true });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Login Error:", error);
        let description = 'Vérifiez vos identifiants et réessayez.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            description = 'L\'adresse e-mail ou le mot de passe est incorrect.';
        }
        toast({ variant: 'destructive', title: 'Échec de la connexion', description });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    setIsLoading(true);
    
    const userToLogin = findUserByEmail(email);

    if (userToLogin && userToLogin.sessionToken && userToLogin.sessionToken.length > 0 && !force) {
        setLoginCredentials({email, password});
        setShowPinDialog(true);
        setIsLoading(false);
        return;
    }

    await performLogin(email, password);
  };
  
  const generateDynamicPin = () => {
    const now = new Date();
    const month = (now.getMonth() + 1);
    const day = now.getDate();
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const difference = Math.abs(day - month).toString();

    return `${monthStr}${dayStr}${difference}`;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const correctPin = generateDynamicPin();
        if (pin === correctPin) {
            setShowPinDialog(false);
            setPin('');
            if(loginCredentials) {
                await performLogin(loginCredentials.email, loginCredentials.password);
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Code PIN incorrect',
                description: 'La tentative de connexion a échoué.'
            });
            setShowPinDialog(false);
            setPin('');
             setIsLoading(false);
        }
  }

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
    <>
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
    <AlertDialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <AlertDialogContent>
            <form onSubmit={handlePinSubmit}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Conflit de session - Code: Date + Différence</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cet utilisateur est déjà connecté sur un autre appareil. Pour continuer, veuillez entrer le code PIN dynamique pour forcer la connexion et déconnecter l'autre session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="pin">Code PIN</Label>
                    <Input 
                        id="pin"
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="•••••"
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => { setPin(''); setShowPinDialog(false); setIsLoading(false);}}>Annuler</AlertDialogCancel>
                    <AlertDialogAction type="submit">
                        Forcer la connexion
                    </AlertDialogAction>
                </AlertDialogFooter>
            </form>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
