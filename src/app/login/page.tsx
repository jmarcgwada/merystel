
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
  const { users, isLoading: posLoading } = usePos();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userLoading && !posLoading) {
      setIsReady(true);
    }
  }, [userLoading, posLoading]);

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
    return null; // Don't render anything, useEffect will redirect.
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
            {isReady && users && users.length === 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Premier Lancement</AlertTitle>
                    <AlertDescription>
                        Aucun utilisateur trouvé. Veuillez en créer un via la page de gestion des utilisateurs dans les paramètres de l'application après avoir contacté le support.
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

    