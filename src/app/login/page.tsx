
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

  const seedDefaultData = async (companyDocRef) => {
      const batch = writeBatch(firestore);

      // Company document (to mark as seeded)
      batch.set(companyDocRef, {
        name: `Mon Entreprise`,
        email: registerEmail,
        address: '',
        postalCode: '',
        city: '',
        country: '',
      }, { merge: true });

      // Default VAT Rates
      const vatCollection = collection(firestore, 'companies', SHARED_COMPANY_ID, 'vatRates');
      batch.set(doc(vatCollection), { name: 'TVA 0%', rate: 0, code: 1 });
      batch.set(doc(vatCollection), { name: 'TVA Standard', rate: 20, code: 2 });
      batch.set(doc(vatCollection), { name: 'TVA Intermédiaire', rate: 8.5, code: 3 });

      // Default Payment Methods
      const paymentCollection = collection(firestore, 'companies', SHARED_COMPANY_ID, 'paymentMethods');
      batch.set(doc(paymentCollection), { name: 'Carte Bancaire', icon: 'card', type: 'direct' });
      batch.set(doc(paymentCollection), { name: 'Espèces', icon: 'cash', type: 'direct' });
      batch.set(doc(paymentCollection), { name: 'Chèque', icon: 'check', type: 'direct' });
      batch.set(doc(paymentCollection), { name: 'Autre', icon: 'other', type: 'direct' });

      // Default Customer
      const customerCollection = collection(firestore, 'companies', SHARED_COMPANY_ID, 'customers');
      batch.set(doc(customerCollection), { name: 'Client de passage', email: '', phone: '', isDefault: true });

      // Default Category & Item
      const categoryCollection = collection(firestore, 'companies', SHARED_COMPANY_ID, 'categories');
      const testCategoryRef = doc(categoryCollection);
      batch.set(testCategoryRef, { name: 'Catégorie de test', color: '#3b82f6', isRestaurantOnly: false, image: `https://picsum.photos/seed/testcat/100/100` });
      
      const itemCollection = collection(firestore, 'companies', SHARED_COMPANY_ID, 'items');
      const vatStandardQuery = await getDoc(doc(vatCollection));
      // This is a simplification; in a real app, you'd query for the correct VAT rate.
      // We assume the 20% VAT is one of the first documents. It's not robust but works for seeding.
      const vatId = vatStandardQuery.docs.find(d => d.data().rate === 20)?.id || vatStandardQuery.docs[0]?.id;

      if (vatId) {
        batch.set(doc(itemCollection), { name: 'Article de test', price: 9.99, categoryId: testCategoryRef.id, vatId, image: `https://picsum.photos/seed/testitem/200/150`, isFavorite: true });
      }

      await batch.commit();
      toast({ title: 'Données de démonstration créées !', description: "Votre application est prête à l'emploi." });
  }

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
        const companyDocRef = doc(firestore, "companies", SHARED_COMPANY_ID);
        const companyDoc = await getDoc(companyDocRef);
        const isFirstUser = !companyDoc.exists();

        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
        const newUser = userCredential.user;
        
        // 2. If it's the first user, seed the database with default data
        if (isFirstUser) {
            await seedDefaultData(companyDocRef);
        }

        // 3. Create the user profile in Firestore, linking to the shared companyId
        const userDocRef = doc(firestore, "users", newUser.uid);
        const userData = {
            id: newUser.uid,
            firstName: registerFirstName,
            lastName: registerLastName,
            email: registerEmail,
            role: isFirstUser ? 'admin' : 'cashier', // First user is admin, others are cashiers
            companyId: SHARED_COMPANY_ID
        }
        
        // This function is non-blocking and handles its own errors
        setDocumentNonBlocking(userDocRef, userData, { merge: true });

        toast({ title: 'Inscription réussie', description: "Vous êtes maintenant connecté." });
        // The useUser hook will handle redirection to /dashboard
    } catch (error: any) {
        // This catch block handles errors from createUserWithEmailAndPassword or the initial setDoc
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
  
  // This prevents the login page from flashing if the user is already authenticated
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
