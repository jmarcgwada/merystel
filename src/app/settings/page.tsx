
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Brush, Building, Lock, Database, Sparkles, AlertTriangle, Trash2, Settings, ArrowLeft, Palette, FileCode } from 'lucide-react';
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
import { PromptViewer } from './components/prompt-viewer';
import { Separator } from '@/components/ui/separator';


export default function SettingsPage() {
  const { user, loading: isUserLoading } = useUser();
  const { seedInitialData, resetAllData, categories, vatRates, paymentMethods, isLoading } = usePos();
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [isPromptViewerOpen, setPromptViewerOpen] = useState(false);

  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
  };
  
  const showHiddenButtons = titleClickCount >= 5;

  const canSeedData = useMemo(() => {
    if (isLoading) return false;
    return !categories || categories.length === 0 || !vatRates || vatRates.length === 0 || !paymentMethods || paymentMethods.length === 0;
  }, [categories, vatRates, paymentMethods, isLoading]);

  const handleSeedData = () => {
    seedInitialData();
  }
  
  const handleResetData = () => {
    resetAllData();
    setResetDialogOpen(false);
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
        href: '/settings/appearance',
        title: "Apparence & Couleurs",
        description: "Changez les couleurs des différents modes de l'application.",
        icon: Palette,
        adminOnly: false,
    },
    {
        href: '/settings/parameters',
        title: "Paramétrage",
        description: "Configurez les paramètres fonctionnels de l'application.",
        icon: Settings,
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

  const showAdminSections = !isUserLoading && user?.role === 'admin';

  return (
    <>
      <div onClick={handleTitleClick}>
        <PageHeader
            title="Paramètres"
            subtitle="Configurez et personnalisez l'application selon vos besoins."
        >
            <div className="flex items-center gap-2">
                 <Button asChild variant="outline" className="btn-back">
                    <Link href="/dashboard">
                        <ArrowLeft />
                        Retour au tableau de bord
                    </Link>
                </Button>
                {showHiddenButtons && showAdminSections && (
                    <Button variant="secondary" onClick={() => setPromptViewerOpen(true)}>
                        <FileCode className="mr-2 h-4 w-4" />
                        Générer le Prompt Projet
                    </Button>
                )}
            </div>
        </PageHeader>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.filter(link => !link.adminOnly || showAdminSections).map(link => (
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
      </div>
      
       {showHiddenButtons && showAdminSections && (
        <>
            <Separator className="my-8"/>
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-primary mb-4">Données de l'application</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Initialiser l'application</CardTitle>
                            <CardDescription>
                                Créez un jeu de données de démonstration (catégories, TVA...). Cette option n'est disponible que si l'application est vide.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={!canSeedData}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Initialiser avec les données de démo
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Initialiser les données de démonstration ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action va créer un jeu de données de base. Elle ne s'exécutera pas si des données existent déjà.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSeedData}>
                                            Confirmer et initialiser
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            {!canSeedData && (
                                <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4"/> L'application contient déjà des données. L'initialisation est désactivée.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-destructive mb-4">Zone de danger</h2>
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle>Réinitialiser l'application</CardTitle>
                            <CardDescription>
                                Cette action est irréversible. Toutes les données, y compris les ventes, les articles, et les configurations seront supprimées définitivement.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Réinitialiser toutes les données
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Toutes vos données seront supprimées de la base de données.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">
                                            Oui, tout supprimer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
       )}
       <PromptViewer isOpen={isPromptViewerOpen} onClose={() => setPromptViewerOpen(false)} />
    </>
  );
}
