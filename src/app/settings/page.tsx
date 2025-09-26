
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Brush, Building, Lock, Database, Sparkles, AlertTriangle } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { usePos } from '@/contexts/pos-context';
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
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';


export default function SettingsPage() {
  const { user } = useUser();
  const { seedInitialData, categories, vatRates, paymentMethods } = usePos();
  const [isSeedDialogOpen, setSeedDialogOpen] = useState(false);

  const canSeedData = useMemo(() => {
    return !categories || categories.length === 0 || !vatRates || vatRates.length === 0 || !paymentMethods || paymentMethods.length === 0;
  }, [categories, vatRates, paymentMethods]);

  const handleSeedData = () => {
    seedInitialData();
    setSeedDialogOpen(false);
  }

  const settingsLinks = [
    {
        href: '/settings/customization',
        title: "Personnalisation de l'interface",
        description: 'Ajustez les options visuelles de votre point de vente.',
        icon: Brush,
        adminOnly: false,
    },
    {
        href: '/settings/company',
        title: "Détails de l'entreprise",
        description: "Gérez le nom, l'adresse et les coordonnées de votre entreprise.",
        icon: Building,
        adminOnly: false,
    },
    {
        href: '/settings/modes',
        title: 'Modes Forcés',
        description: "Verrouillez l'application dans un mode spécifique.",
        icon: Lock,
        adminOnly: false,
    },
    {
        href: 'https://console.firebase.google.com/project/studio-2563067287-258f7/firestore/data/~2Fusers',
        title: 'Données Firestore',
        description: "Gérer les données brutes dans la console Firebase.",
        icon: Database,
        adminOnly: true,
    }
  ]


  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Configurez et personnalisez l'application selon vos besoins."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.filter(link => !link.adminOnly || user?.role === 'admin').map(link => (
            <Link href={link.href} key={link.href} className="group" target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <link.icon className="h-8 w-8 text-primary mb-2" />
                                <h3 className="text-lg font-semibold font-headline">{link.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
         <AlertDialog open={isSeedDialogOpen} onOpenChange={setSeedDialogOpen}>
            <AlertDialogTrigger asChild>
                 <Card className="group h-full transition-all hover:shadow-md hover:border-accent cursor-pointer">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <Sparkles className="h-8 w-8 text-accent mb-2" />
                                <h3 className="text-lg font-semibold font-headline">Initialiser les données</h3>
                                <p className="text-sm text-muted-foreground mt-1">Créez un jeu de données de démonstration (catégories, TVA...).</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </CardContent>
                </Card>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Initialiser les données de démonstration ?</AlertDialogTitle>
                    {canSeedData ? (
                        <AlertDialogDescription>
                            Cette action va créer un jeu de données de base (catégories, TVA, modes de paiement, etc.) pour vous aider à démarrer. Elle ne s'exécutera pas si des données existent déjà.
                        </AlertDialogDescription>
                    ) : (
                        <AlertDialogDescription className="text-destructive font-semibold flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4"/>
                            L'application contient déjà des données de configuration. L'initialisation ne peut pas continuer pour éviter d'écraser vos données.
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSeedData} disabled={!canSeedData}>
                        Confirmer et initialiser
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
