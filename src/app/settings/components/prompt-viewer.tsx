
'use client';

import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dbStructure from '../../../../docs/backend.json';
import { Copy, Download } from 'lucide-react';

interface PromptViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const projectPrompt = `
Vous êtes un expert en développement d'applications web avec Next.js, React, TypeScript, TailwindCSS, ShadCN et Firebase. Votre mission est de construire une application de point de vente (POS) complète et moderne nommée "Zenith POS".

**Objectif Général :**
Créer une application web réactive et performante pour la gestion des ventes, des articles, des clients et des tables pour des commerces de détail et des restaurants. L'application doit être intuitive, robuste et sécurisée.

**Stack Technique Imposée :**
- **Framework Frontend :** Next.js (avec App Router)
- **Librairie UI :** React
- **Langage :** TypeScript
- **Style :** TailwindCSS
- **Composants :** ShadCN/UI
- **Backend & Base de données :** Firebase (Firestore pour la base de données, Firebase Authentication pour l'authentification)

**Structure de la Base de Données (Firestore) :**
La structure de la base de données doit suivre scrupuleusement le schéma défini dans le fichier \`docs/backend.json\`. Toutes les entités (Users, Companies, Items, Sales, etc.) et leurs chemins de collection doivent être conformes à ce document. La collection principale est \`companies\`, et toutes les données spécifiques à une entreprise (articles, ventes, etc.) sont stockées dans des sous-collections de l'document de l'entreprise. L'ID de l'entreprise est unique pour toute l'application (ex: 'main').

**Fonctionnalités Principales :**

1.  **Authentification et Rôles Utilisateurs :**
    *   Système de connexion par email/mot de passe.
    *   Gestion de trois rôles : \`admin\`, \`manager\`, \`cashier\`.
    *   Les \`admin\` ont tous les droits.
    *   Les \`manager\` peuvent gérer les articles, clients, etc., mais pas les utilisateurs ni les paramètres avancés de l'entreprise.
    *   Les \`cashier\` ont un accès limité au POS, à la gestion des tables et à la consultation de certaines données (lecture seule).
    *   Gestion de session unique : si un utilisateur se connecte sur un nouvel appareil, l'ancienne session est invalidée (avec une option de "force login" via un code PIN dynamique si une commande est en cours sur le premier appareil).

2.  **Tableau de Bord (Dashboard) :**
    *   Page d'accueil après connexion.
    *   Affiche des statistiques clés : chiffre d'affaires total, nombre de ventes du jour, panier moyen.
    *   Liste des articles les plus populaires.
    *   Section "Accès Rapide" avec des cartes de navigation vers les sections principales (POS, Restaurant, Gestion, Rapports, Paramètres).
    *   Le fond du tableau de bord (couleur ou image) et l'apparence des boutons doivent être entièrement personnalisables via les paramètres.

3.  **Point de Vente (POS) - Mode Vente Directe :**
    *   Interface principale pour l'enregistrement des ventes.
    *   Layout en trois colonnes :
        *   **Gauche :** Liste des catégories d'articles. Inclut des catégories spéciales comme "Tout", "Favoris", "Populaires".
        *   **Centre :** Grille des articles filtrée par la catégorie sélectionnée. Chaque article est une carte cliquable affichant son nom, son image (optionnel) et son prix.
        *   **Droite :** Résumé de la commande en cours.
    *   **Gestion de la commande :**
        *   Ajouter des articles en cliquant sur leur carte.
        *   Modifier la quantité, appliquer des remises (en % ou en montant fixe) via un pavé numérique contextuel.
        *   Possibilité de mettre une commande "en attente" pour la rappeler plus tard.
        *   Finaliser la vente via une modale de paiement.
    *   **Paiement :**
        *   Modale de paiement affichant le total.
        *   Permet le multi-paiement (ex: une partie en espèces, une partie en carte).
        *   Calcul du rendu monnaie.
        *   Association de la vente à un client existant ou création d'un nouveau client à la volée.

4.  **Mode Restaurant :**
    *   Une page affichant un plan de salle avec des cartes représentant chaque table.
    *   Chaque table a un statut visuel : "Disponible", "Occupée", "En paiement".
    *   Cliquer sur une table "Disponible" ouvre l'interface du POS pour prendre une commande pour cette table.
    *   Cliquer sur une table "Occupée" permet de voir ou de modifier la commande en cours.
    *   Une option "Clôturer" sur la commande de la table la prépare pour le paiement et change le statut de la table.
    *   Une table "Vente à emporter" est toujours présente pour les commandes directes.

5.  **Gestion (Management) :**
    *   Section accessible via une navigation latérale.
    *   CRUD complet (Créer, Lire, Mettre à jour, Supprimer) pour les entités suivantes (avec restrictions basées sur le rôle) :
        *   **Articles :** Définir nom, prix, catégorie, TVA, image (avec option de génération par IA via Genkit), etc.
        *   **Catégories :** Définir nom, couleur, image, et un flag "Dédié au mode restaurant".
        *   **Clients :** Gérer les informations des clients.
        *   **Tables :** Gérer les tables du restaurant (nom, nombre de couverts).
        *   **Utilisateurs :** (Admin uniquement) Gérer les comptes utilisateurs et leurs rôles.
        *   **Moyens de paiement :** Configurer les méthodes de paiement.
        *   **Taux de TVA :** Configurer les différents taux de TVA.

6.  **Rapports (Reports) :**
    *   Liste de toutes les ventes passées, avec des filtres (par date, client, origine).
    *   Vue détaillée pour chaque vente, montrant les articles, les paiements, et le détail de la TVA.
    *   Page dédiée aux "Articles populaires" avec un classement des articles les plus vendus.

7.  **Paramètres (Settings) :**
    *   **Apparence :** Personnalisation des couleurs de l'application, du fond du tableau de bord, et de l'apparence des boutons.
    *   **Paramétrage :** Options fonctionnelles comme la durée des notifications, l'affichage des descriptions, etc.
    *   **Détails de l'entreprise :** Gérer les informations légales de l'entreprise.
    *   **Import/Export :** Fonctionnalité pour exporter et importer toute la configuration de l'application (articles, catégories, etc.) dans un fichier JSON.
    *   **Zone de Danger :** Options pour initialiser avec des données de démo ou pour réinitialiser complètement la base de données.

**Règles Techniques et de Qualité :**
- Utiliser les Server Components de Next.js par défaut.
- Utiliser TypeScript de manière stricte.
- Le code doit être propre, bien organisé et maintenable.
- Éviter les erreurs d'hydratation en différant le code côté client (ex: via \`useEffect\`).
- Assurer une expérience utilisateur fluide et réactive.
- Toutes les opérations d'écriture dans Firestore doivent être robustes et gérer les cas d'erreur.
- L'interface doit être esthétiquement plaisante et professionnelle.
`;

export function PromptViewer({ isOpen, onClose }: PromptViewerProps) {
    const { toast } = useToast();

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: 'Copié !',
                description: `Le ${type} a été copié dans le presse-papiers.`,
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de copier le texte.',
            });
        });
    };

    const handleDownload = () => {
        const combinedContent = `
=========================
PROJECT PROMPT
=========================

${projectPrompt}

=========================
DATABASE STRUCTURE (docs/backend.json)
=========================

${JSON.stringify(dbStructure, null, 2)}
        `;

        const blob = new Blob([combinedContent.trim()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'zenith-pos-project-prompt.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Téléchargement lancé', description: 'Le fichier zenith-pos-project-prompt.txt a été généré.' });
    };
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Générateur de Prompt Projet</DialogTitle>
          <DialogDescription>
            Utilisez ce prompt pour documenter ou recréer une copie conforme de ce projet dans un autre environnement Firebase Studio.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <Tabs defaultValue="prompt" className="h-full flex flex-col">
                <TabsList>
                    <TabsTrigger value="prompt">Prompt Projet</TabsTrigger>
                    <TabsTrigger value="db_structure">Structure de la Base de Données</TabsTrigger>
                </TabsList>
                <TabsContent value="prompt" className="flex-1 min-h-0 mt-4">
                    <div className="relative h-full">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => copyToClipboard(projectPrompt, 'prompt')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Textarea
                            readOnly
                            value={projectPrompt}
                            className="h-full resize-none"
                        />
                    </div>
                </TabsContent>
                <TabsContent value="db_structure" className="flex-1 min-h-0 mt-4">
                     <div className="relative h-full">
                         <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => copyToClipboard(JSON.stringify(dbStructure, null, 2), 'schéma de la base de données')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Textarea
                            readOnly
                            value={JSON.stringify(dbStructure, null, 2)}
                            className="h-full resize-none font-mono text-xs"
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger en .txt
          </Button>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
