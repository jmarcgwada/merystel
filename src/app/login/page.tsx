
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { usePos } from '@/contexts/pos-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { handleSuccessfulLogin, users, addUser, isLoading: posLoading } = usePos();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAdmin = async () => {
      if (!posLoading && users && users.length === 0) {
        try {
          await addUser({
            firstName: 'Admin',
            lastName: 'Zenith',
            email: 'admin@zenith.com',
            role: 'admin',
          });
        } catch (error) {
            // This might fail if the user already exists in auth but not in Firestore.
            // We can ignore this for the purpose of ensuring an admin exists.
            console.warn("Could not create default admin, it might already exist in auth.", error)
        }
      }
      setIsReady(true);
    };

    if (!userLoading && !posLoading) {
      initializeAdmin();
    }
  }, [userLoading, posLoading, users, addUser]);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  if (userLoading || posLoading || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Initialisation de l'application...</p>
      </div>
    );
  }

  if (user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Déjà connecté. Redirection...</p>
        </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential.user.uid);
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
      setIsLoading(false);
    }
  };

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
             {users && users.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Premier Lancement</AlertTitle>
                <AlertDescription>
                  Un compte administrateur a été créé pour vous : <br />
                  Email: <b>admin@zenith.com</b> <br />
                  Mot de passe: <b>password123</b>
                </AlertDescription>
              </Alert>
            )}
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
