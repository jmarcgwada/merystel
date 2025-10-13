
'use client';

import { useState, useEffect }from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { usePos } from '@/contexts/pos-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, UserPlus, Eye, EyeOff, Delete } from 'lucide-react';
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


const adminSchema = z.object({
    firstName: z.string().min(1, 'Prénom requis.'),
    lastName: z.string().min(1, 'Nom requis.'),
    email: z.string().email('Email invalide.'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères.'),
});

type AdminFormValues = z.infer<typeof adminSchema>;

const PinKey = ({ value, onClick }: { value: string, onClick: (value: string) => void }) => (
    <Button
        type="button"
        variant="outline"
        className="h-14 w-14 text-2xl font-bold"
        onClick={() => onClick(value)}
    >
        {value}
    </Button>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
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
    // Mock user creation
    toast({
        title: 'Mode déconnecté',
        description: 'Fonctionnalité non disponible sans connexion à la base de données.',
    });
    setIsFirstLaunch(false);
    setIsLoading(false);
  }

  const performLogin = async (emailToLogin: string, passwordToLogin: string) => {
    toast({
        title: 'Mode déconnecté',
        description: 'La connexion est désactivée.',
    });
    router.push('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Bypass all firebase logic
    localStorage.setItem('lastLoginEmail', email);
    router.push('/dashboard');
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

  const handlePinSubmit = async (e?: React.FormEvent) => {
    // Disabled
  }

  const handlePinKeyPress = (key: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + key);
    }
  };
  
  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };


  const handlePasswordReset = async () => {
    // Disabled
  };


  if (userLoading || posLoading || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de l'application...</p>
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
                Créez un compte pour commencer.
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
                        {isLoading ? 'Création en cours...' : 'Créer le compte'}
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
                <div className="py-4 space-y-4">
                    <div className="flex justify-center items-center h-12 bg-muted rounded-md border">
                        <p className="text-3xl font-mono tracking-[0.5em]">
                        {pin.split('').map(() => '•').join('')}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <PinKey value="1" onClick={handlePinKeyPress} />
                        <PinKey value="2" onClick={handlePinKeyPress} />
                        <PinKey value="3" onClick={handlePinKeyPress} />
                        <PinKey value="4" onClick={handlePinKeyPress} />
                        <PinKey value="5" onClick={handlePinKeyPress} />
                        <PinKey value="6" onClick={handlePinKeyPress} />
                        <PinKey value="7" onClick={handlePinKeyPress} />
                        <PinKey value="8" onClick={handlePinKeyPress} />
                        <PinKey value="9" onClick={handlePinKeyPress} />
                        <Button type="button" variant="outline" className="h-14 w-14" onClick={handlePinBackspace}>
                            <Delete className="h-6 w-6"/>
                        </Button>
                        <PinKey value="0" onClick={handlePinKeyPress} />
                    </div>
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
