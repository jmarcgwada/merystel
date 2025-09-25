
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, doc, getDoc, writeBatch, setDoc } from 'firebase/firestore';
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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Connexion réussie' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
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
        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
        const newUser = userCredential.user;
        
        // 2. Determine user role. If it's the special admin email, set role to 'admin'.
        const role = registerEmail === ADMIN_EMAIL ? 'admin' : 'cashier';

        // 3. Create the user profile in Firestore
        const userDocRef = doc(firestore, "companies", SHARED_COMPANY_ID, "users", newUser.uid);
        const userData = {
            id: newUser.uid,
            firstName: registerFirstName,
            lastName: registerLastName,
            email: registerEmail,
            role: role,
            companyId: SHARED_COMPANY_ID
        }
        
        // Use a blocking setDoc here for the initial user registration to ensure the document exists.
        await setDoc(userDocRef, userData, { merge: true });

        // On first admin registration, create the company document
        if (role === 'admin') {
            const companyDocRef = doc(firestore, 'companies', SHARED_COMPANY_ID);
            const companyDoc = await getDoc(companyDocRef);
            if (!companyDoc.exists()) {
                await setDoc(companyDocRef, {
                    id: SHARED_COMPANY_ID,
                    name: `Mon Entreprise`,
                    email: 'contact@zenith.com',
                }, { merge: true });
            }
        }

        toast({ title: 'Inscription réussie', description: "Vous êtes maintenant connecté." });
        // The useUser hook will handle redirection to /dashboard
    } catch (error: any) {
        console.error("Registration error:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur d\'inscription',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (loading || user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>
  }
  
  if (user) {
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
