
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Bienvenue sur Zenith POS"
        subtitle="Votre solution de point de vente moderne, puissante et intuitive."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/login">
            <ArrowLeft />
            Retour à l'authentification
          </Link>
        </Button>
      </PageHeader>
      
      <div className="mt-8 max-w-4xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Une application conçue pour votre commerce</CardTitle>
                <CardDescription>
                    Zenith POS est un système de point de vente complet conçu pour s'adapter aux besoins des commerces de détail, des cafés et des restaurants. Notre objectif est de simplifier vos opérations quotidiennes grâce à une interface rapide, fiable et agréable à utiliser.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="font-semibold text-lg">Fonctionnalités clés :</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                        <strong>Modes de Vente Adaptatifs :</strong> Basculez facilement entre un mode de vente directe rapide, un mode supermarché optimisé pour le scan, et un mode restaurant complet avec gestion de plan de salle.
                    </li>
                    <li>
                        <strong>Gestion Complète :</strong> Gérez vos articles, catégories, clients, et tables depuis une interface centralisée et simple d'accès.
                    </li>
                    <li>
                        <strong>Paiement Flexible :</strong> Acceptez les paiements multiples, gérez les tickets restaurant, et associez les ventes à vos clients fidèles.
                    </li>
                     <li>
                        <strong>Personnalisation Poussée :</strong> Adaptez l'apparence de l'application à l'image de votre marque, des couleurs de fond aux images des articles.
                    </li>
                    <li>
                        <strong>Rapports Détaillés :</strong> Suivez vos performances de vente, identifiez vos articles les plus populaires et prenez des décisions éclairées grâce à des rapports clairs.
                    </li>
                </ul>
                <div className="pt-4 text-center">
                    <p>Prêt à transformer votre gestion ? Connectez-vous pour commencer.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
