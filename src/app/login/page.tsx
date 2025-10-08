
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
import { Info, UserPlus, Eye, EyeOff } from 'lucide-react';
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
  AlertDialogTrigger,
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { users, isLoading: posLoading, addUser, findUserByEmail, handleSignOut, sendPasswordResetEmailForUser } = usePos();
  const [isReady, setIsReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [loginCredentials, setLoginCredentials] = useState<{email: string, password: string} | null>(null);

  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');


  useEffect(() => {
    if (!userLoading && !posLoading) {
      setIsReady(true);
      if (users && users.length === 0) {
        setIsFirstLaunch(true);
      }
    }
  }, [userLoading, posLoading, users]);
  
  useEffect(() => {
    // Set email from localStorage on initial client-side render
    const lastEmail = localStorage.getItem('lastLoginEmail');
    if (lastEmail) {
      setEmail(lastEmail);
    }
  }, []);


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
        const userToLogin = findUserByEmail(emailToLogin);
        if (userToLogin?.isDisabled) {
            toast({
                variant: 'destructive',
                title: 'Compte désactivé',
                description: 'Ce compte est désactivé. Veuillez contacter un administrateur.'
            });
            setIsLoading(false);
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin);
        const newSessionToken = uuidv4();
        localStorage.setItem('sessionToken', newSessionToken);
        localStorage.setItem('lastLoginEmail', emailToLogin); // Remember email on successful login
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        await setDoc(userRef, { sessionToken: newSessionToken }, { merge: true });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Login Error:", error);
        let description = 'Vérifiez vos identifiants et réessayez.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            description = 'L\'adresse e-mail ou le mot de passe est incorrect.';
        }
        toast({ variant: 'destructive', title: 'Échec de la connexion', description });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const userToLogin = findUserByEmail(email);

    if (userToLogin?.isDisabled) {
        toast({
            variant: 'destructive',
            title: 'Compte désactivé',
            description: 'Ce compte est désactivé. Veuillez contacter un administrateur.'
        });
        setIsLoading(false);
        return;
    }

    if (userToLogin && userToLogin.sessionToken && userToLogin.sessionToken.length > 0) {
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
                setIsLoading(true);
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

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email requis',
        description: 'Veuillez entrer une adresse e-mail.',
      });
      return;
    }
    await sendPasswordResetEmailForUser(resetEmail);
    setForgotPasswordOpen(false);
    setResetEmail('');
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
                <div className="flex items-center">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Button 
                        type="button"
                        variant="link"
                        className="ml-auto inline-block h-auto p-0 text-sm underline"
                        onClick={() => setForgotPasswordOpen(true)}
                    >
                        Mot de passe oublié ?
                    </Button>
                </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(prev => !prev)}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
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
                    <AlertDialogTitle>Conflit de session</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cet utilisateur est déjà connecté sur un autre appareil. Pour continuer, veuillez entrer le code PIN dynamique pour forcer la connexion et déconnecter l'autre session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="pin">Code PIN</Label>
                    <Input 
                        id="pin"
                        type="password"
                        autoComplete="one-time-code"
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
     <AlertDialog open={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Mot de passe oublié</AlertDialogTitle>
                <AlertDialogDescription>
                    Entrez votre adresse e-mail. Si un compte correspondant est trouvé, nous y enverrons un lien pour réinitialiser votre mot de passe.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="reset-email">Adresse e-mail</Label>
                <Input 
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="votre.email@example.com"
                    autoFocus
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel type="button" onClick={() => setResetEmail('')}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handlePasswordReset}>
                    Envoyer le lien
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
