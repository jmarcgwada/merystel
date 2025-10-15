

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Brush, Building, Database, ArrowLeft, Palette, UserCog, Settings, LayoutDashboard, FileSignature, History } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const settingsLinks = [
    {
        href: '/settings/customization',
        title: "Personnalisation de l'interface",
        description: 'Ajustez les options visuelles de votre point de vente.',
        icon: Brush,
    },
     {
        href: '/settings/appearance',
        title: "Apparence & Couleurs",
        description: "Changez les couleurs des différents modes de l'application.",
        icon: Palette,
    },
    {
        href: '/settings/document-colors',
        title: "Couleurs des Documents",
        description: "Attribuez une couleur de fond pour chaque type de document.",
        icon: FileSignature,
    },
    {
        href: '/settings/parameters',
        title: "Paramétrage",
        description: "Configurez les paramètres fonctionnels de l'application.",
        icon: Settings,
    },
    {
        href: '/settings/company',
        title: "Détails de l'entreprise",
        description: "Gérez le nom, l'adresse et les coordonnées de votre entreprise.",
        icon: Building,
    },
     {
        href: '/settings/users',
        title: "Gestion des utilisateurs",
        description: "Gérez les comptes et les autorisations des utilisateurs.",
        icon: UserCog,
    },
    {
        href: '/settings/audit-log',
        title: "Historique des opérations",
        description: "Consultez l'historique des créations et modifications de pièces.",
        icon: History,
    },
    {
        href: '/settings/firestore-data',
        title: 'Données Firestore',
        description: "Gérez les données brutes de l'application (import, export, réinitialisation).",
        icon: Database,
    }
  ]


  return (
    <>
      <div>
        <PageHeader
            title="Paramètres"
            subtitle="Configurez et personnalisez l'application selon vos besoins."
        >
            <div className="flex items-center gap-2">
                 <Button asChild variant="outline" size="icon" className="btn-back">
                    <Link href="/dashboard">
                        <LayoutDashboard />
                    </Link>
                </Button>
            </div>
        </PageHeader>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map(link => (
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
    </>
  );
}
