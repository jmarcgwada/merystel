
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { collection, doc, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';


// The single, shared company ID for all users.
const SHARED_COMPANY_ID = 'main';
const ADMIN_EMAIL = 'admin@zenith.com';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useUser();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  const handleLogin = async () => {
    setIsLoading(true);
    try {
      initiateEmailSignIn(auth, loginEmail, loginPassword);
      // The useUser hook will handle redirection on successful login
    } catch (error: any) {
      // This catch block might not even be hit if the error is in the listener,
      // but it's good practice to keep it.
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message,
      });
    } finally {
      // We don't set isLoading to false immediately, 
      // as we wait for the auth state listener to complete the process.
      // If the login fails, the auth state won't change, and the user will stay on the page.
      // A more robust implementation might handle loading state based on the auth listener.
    }
  };

  const handleRegister = async () => {
    if(!registerFirstName || !registerLastName || !registerEmail || !registerPassword) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez remplir tous les champs.',
        });
        return;
    }
    setIsLoading(true);
    
    try {
        // We use the non-blocking version here.
        // The user creation will be handled by the onAuthStateChanged listener.
        initiateEmailSignUp(auth, registerEmail, registerPassword);
    } catch (error: any) {
        console.error("Registration error:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur d\'inscription',
            description: error.message,
        });
    } finally {
      // Similar to login, we let the auth state listener handle the UI changes.
    }
  };
  
   useEffect(() => {
    if (user && !user.firstName && firestore) {
      const userDocRef = doc(firestore, "companies", SHARED_COMPANY_ID, "users", user.uid);
      const role = user.email === ADMIN_EMAIL ? 'admin' : 'cashier';

      // This assumes we can get the first/last name from somewhere,
      // which we can't after the change. We'll set them as empty for now.
      // The user can update them in their profile.
      const userData = {
          id: user.uid,
          firstName: 'Nouvel', // Placeholder
          lastName: 'Utilisateur', // Placeholder
          email: user.email,
          role: role,
          companyId: SHARED_COMPANY_ID
      }
      setDoc(userDocRef, userData, { merge: true });
    }
  }, [user, firestore]);

  if (loading || (user && !user.isAnonymous)) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>
  }
  
  if (user && !user.isAnonymous) {
    return null;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-secondary">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Se connecter</TabsTrigger>
          <TabsTrigger value="register">S'inscrire</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Accédez à votre tableau de bord.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="m@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
              <CardDescription>
                Créez un nouveau compte pour commencer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-firstname">Prénom</Label>
                  <Input
                    id="register-firstname"
                    placeholder="Jean"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="register-lastname">Nom</Label>
                  <Input
                    id="register-lastname"
                    placeholder="Dupont"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="m@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Mot de passe</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRegister} disabled={isLoading} className="w-full">
                {isLoading ? 'Inscription...' : 'Créer un compte'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
