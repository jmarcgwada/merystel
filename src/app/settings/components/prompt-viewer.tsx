
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
import { Copy, Download, History } from 'lucide-react';

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
- **Backend & Base de données :** Stockage local persistant (localStorage) simulé via un Contexte React. La structure des données doit impérativement suivre le schéma défini dans \`docs/backend.json\`.
- **Génération d'images IA :** Genkit avec le modèle 'googleai/gemini-pro-vision'.

**Structure des Données :**
La structure de la base de données doit suivre scrupuleusement le schéma défini dans le fichier \`docs/backend.json\`. Toutes les entités (Users, Companies, Items, Sales, etc.) et leurs relations doivent être conformes à ce document. La collection principale est \`companies\`, et toutes les données spécifiques à une entreprise (articles, ventes, etc.) sont logiquement liées à un ID d'entreprise (ex: 'main').

**Fonctionnalités Principales :**

1.  **Authentification et Rôles Utilisateurs :**
    *   Système de connexion par email/mot de passe.
    *   Gestion de trois rôles : \`admin\`, \`manager\`, \`cashier\`.
    *   Les \`admin\` ont tous les droits, y compris la gestion des utilisateurs et les paramètres système.
    *   Les \`manager\` peuvent gérer les opérations quotidiennes (articles, clients, etc.) et voir les rapports, mais pas les utilisateurs ni les paramètres avancés de l'entreprise.
    *   Les \`cashier\` ont un accès limité aux modes de vente (POS, Supermarché, Restaurant) et à la consultation de certaines données (lecture seule).
    *   Gestion de session unique : si un utilisateur se connecte sur un nouvel appareil, l'ancienne session est invalidée (avec une option de "force login" via un code PIN dynamique).

2.  **Tableau de Bord (Dashboard) :**
    *   Page d'accueil après connexion.
    *   Affiche des statistiques clés : chiffre d'affaires total, nombre de ventes du jour, panier moyen (statistiques masquables via les paramètres).
    *   Liste des articles les plus populaires.
    *   Section "Accès Rapide" avec des cartes de navigation vers les sections principales (Mode Caisse, Commercial, Gestion, Rapports, Paramètres, Aide).
    *   Le fond du tableau de bord (couleur unie ou image) et l'apparence des boutons (couleur, opacité, bordure) sont entièrement personnalisables via les paramètres d'apparence.

3.  **Modes de Vente :**
    *   **Mode de vente par défaut configurable** via les paramètres.
    *   **Point de Vente (POS) :** Interface standard avec catégories à gauche, grille d'articles au centre, et résumé de commande à droite.
    *   **Mode Supermarché :** Interface optimisée pour la rapidité avec une grande barre de recherche centrale pour la saisie de codes-barres ou de noms d'articles.
    *   **Mode Restaurant :** Affiche un plan de salle avec des cartes représentant chaque table. Chaque table a un statut visuel ("Disponible", "Occupée", "Paiement").
        *   Cliquer sur une table ouvre l'interface du POS pour prendre ou modifier une commande.
        *   Une option "Clôturer" prépare la commande pour le paiement.
        *   Une table "Vente à emporter" est toujours disponible.
    *   **Fond d'écran dynamique** optionnel sur la colonne de commande, basé sur l'image du dernier article ajouté.

4.  **Gestion Commerciale (Facturation, Devis...) :**
    *   Page dédiée (\`/commercial\`) pour la création et la modification de factures, devis, bons de livraison, commandes fournisseur et avoirs.
    *   La sélection d'un client est obligatoire.
    *   Ajout d'articles via une barre de recherche ou un catalogue visuel.
    *   Modification des quantités, prix TTC, et application de remises en pourcentage.
    *   Saisie d'un acompte pour les factures. Le "Net à Payer" est calculé automatiquement.
    *   Les factures et avoirs sont finalisés via la modale de paiement.
    *   Bouton de duplication de pièce et de génération de pièce aléatoire pour les tests.

5.  **Gestion de Commande & Paiement :**
    *   La colonne de commande à droite affiche les articles, quantités, prix et remises.
    *   Pavé numérique tactile contextuel pour modifier la quantité ou appliquer une remise sur un article sélectionné.
    *   Possibilité de mettre une commande "en attente" pour la rappeler plus tard.
    *   **Modale de paiement :**
        *   Permet le multi-paiement (y compris chèques).
        *   Calcul automatique du rendu monnaie.
        *   Association de la vente à un client (recherche ou création à la volée).
        *   Affiche l'historique des paiements précédents pour les factures modifiées.
        *   Calculatrice intégrée.

6.  **Gestion (Management) :**
    *   Section accessible via une navigation latérale.
    *   CRUD complet pour : Articles, Catégories, Clients, Fournisseurs, Tables, Moyens de paiement, TVA.
    *   **Articles :** Gestion du nom, prix (vente et achat), catégorie, fournisseur, TVA, code-barres, image (génération IA possible), stock (avec seuil bas), numéros de série, et déclinaisons (ex: Taille, Couleur).
    *   **Catégories :** Gestion du nom, couleur, image, et un flag "Dédié au mode restaurant".
    *   **Portefeuille de chèques :** Suivi des chèques avec statuts (En portefeuille, Remis, Encaissé, Impayé...), création de bordereaux de remise, et gestion des règlements partiels pour les impayés.
    *   **Factures Récurrentes :** Configuration de la périodicité, suivi des échéances et génération en masse des factures.

7.  **Rapports (Reports) :**
    *   Liste de toutes les pièces de vente avec filtres avancés (date, client, statut, etc.).
    *   **Mémorisation de la navigation :** Revenir à la liste des rapports préserve les filtres précédemment appliqués.
    *   Vue détaillée pour chaque pièce.
    *   **Reporting avancé :** Analyse par ligne de vente avec des filtres complexes et des sections "Top" (articles, clients, catégories).

8.  **Paramètres (Settings) :**
    *   **Personnalisation :** Modale de lien externe, visibilité des statistiques, affichage des images, apparence des cartes d'articles.
    *   **Apparence :** Couleurs de fond pour les modes de vente, les documents, et personnalisation du tableau de bord.
    *   **Paramétrage :** Mode de vente par défaut, mode forcé, gestion des notifications, affichage des descriptions d'articles.
    *   **Connectivité :** Configuration SMTP, FTP et Twilio pour les notifications et relances.
    *   **Données (Admin) :** Zone sécurisée par code PIN pour initialiser, importer/exporter la configuration, et réinitialiser les données.

9.  **Ergonomie & Interface :**
    *   **Calculatrice déplaçable :** Une calculatrice avancée (standard, prix/marge, remise, TVA) est disponible depuis l'en-tête et peut être déplacée sur l'écran. L'arrière-plan de l'application est transparent lorsque la calculatrice est ouverte.
    *   Utilisation intensive de raccourcis clavier et navigation intuitive.

**Règles Techniques et de Qualité :**
- Utiliser les Server Components de Next.js par défaut.
- Utiliser TypeScript de manière stricte.
- Le code doit être propre, bien organisé et maintenable.
- Éviter les erreurs d'hydratation en différant le code côté client (ex: via \`useEffect\`).
- Assurer une expérience utilisateur fluide et réactive.
- Toutes les opérations de modification de données doivent être robustes et gérer les cas d'erreur.
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
