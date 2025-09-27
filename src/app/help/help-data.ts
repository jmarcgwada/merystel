
export interface HelpTopic {
  slug: string;
  title: string;
  content: string;
}

export interface HelpCategory {
  category: string;
  topics: HelpTopic[];
}

export const helpData: HelpCategory[] = [
  {
    category: "Concepts de Base",
    topics: [
      {
        slug: "dashboard",
        title: "Le Tableau de Bord",
        content: `
Le tableau de bord est votre page d'accueil. Il vous donne un aperçu rapide de l'activité de votre commerce.

**Composants du Tableau de Bord :**
- **Statistiques clés :** Chiffre d'affaires total, nombre de ventes du jour, et panier moyen.
- **Accès Rapide :** Des boutons pour naviguer vers les sections principales : Point de Vente, Mode Restaurant, Gestion, Rapports, etc.
- **Articles Populaires :** Une liste des articles les plus vendus pour identifier les tendances.
- **Personnalisation :** L'arrière-plan et l'apparence des boutons sont entièrement personnalisables dans les Paramètres d'Apparence.
        `,
      },
      {
        slug: "user-roles",
        title: "Rôles des Utilisateurs",
        content: `
L'application gère trois types de rôles avec des permissions différentes pour sécuriser l'accès aux fonctionnalités.

**Les Rôles :**
- **Administrateur (Admin) :** A un accès complet à toute l'application, y compris la gestion des utilisateurs et les paramètres de l'entreprise. C'est le rôle le plus élevé.
- **Manager :** Peut gérer les opérations quotidiennes : articles, catégories, clients, tables, et voir les rapports. Il ne peut pas gérer les utilisateurs ni les paramètres avancés de l'entreprise.
- **Caissier (Cashier) :** A un accès limité au Point de Vente et au Mode Restaurant. Il peut consulter certaines informations (comme la liste des articles) mais ne peut pas les modifier.
        `,
      },
    ],
  },
  {
    category: "Vente",
    topics: [
      {
        slug: "pos-direct-sale",
        title: "Point de Vente (Vente Directe)",
        content: `
L'interface de vente directe est conçue pour être rapide et intuitive.

**Fonctionnement :**
1.  **Sélectionnez une catégorie** dans la colonne de gauche.
2.  **Cliquez sur un article** dans la grille centrale pour l'ajouter à la commande sur la droite.
3.  **Ajustez la quantité ou appliquez une remise** en cliquant sur un article dans la commande pour ouvrir le pavé numérique.
4.  **Mettez en attente** la commande pour la sauvegarder et la rappeler plus tard.
5.  **Cliquez sur "Payer"** pour finaliser la vente.

La modale de paiement vous permet de gérer les paiements multiples et d'associer la vente à un client.
        `,
      },
      {
        slug: "restaurant-mode",
        title: "Mode Restaurant",
        content: `
Le mode restaurant est optimisé pour la gestion des commandes à table.

**Fonctionnement :**
1.  **Sélectionnez une table disponible** sur le plan de salle.
2.  Vous êtes redirigé vers l'interface du point de vente, mais la commande est maintenant associée à la table.
3.  Ajoutez des articles à la commande.
4.  Vous pouvez **"Sauvegarder"** la commande et revenir au plan de salle. La table passera au statut "Occupée".
5.  Pour encaisser, retournez sur la table et cliquez sur **"Clôturer"**. La table passe au statut "Paiement" et vous pouvez procéder à l'encaissement.

La table "Vente à emporter" fonctionne comme un point de vente direct mais depuis l'interface du restaurant.
        `,
      },
      {
        slug: "payment",
        title: "Processus de Paiement",
        content: `
La modale de paiement est le centre de l'encaissement.

**Fonctionnalités :**
- **Client :** Associez la vente à un client existant ou créez-en un nouveau rapidement.
- **Montant :** Le montant à payer est affiché. Vous pouvez le modifier pour les paiements partiels (ex: en espèces).
- **Méthodes de paiement :** Cliquez sur les boutons correspondants (Espèces, Carte, etc.) pour ajouter un paiement.
- **Multi-paiement :** Vous pouvez ajouter plusieurs paiements de différentes méthodes jusqu'à ce que le solde soit à zéro.
- **Rendu Monnaie :** Si le montant payé est supérieur au total, le rendu est calculé et affiché.
- **Finalisation :** Une fois le montant total atteint, la vente est finalisée et un reçu peut être généré.
        `,
      },
    ],
  },
  {
    category: "Gestion",
    topics: [
      {
        slug: "manage-items",
        title: "Gérer les Articles",
        content: `
La section de gestion des articles vous permet de contrôler votre catalogue de produits.

**Actions Possibles :**
- **Ajouter :** Créez un nouvel article en définissant son nom, prix, catégorie, taux de TVA, et son image (qui peut être générée par une IA).
- **Modifier :** Mettez à jour les informations de n'importe quel article.
- **Supprimer :** Retirez un article de votre catalogue.
- **Favoris :** Marquez un article comme "favori" pour qu'il apparaisse dans la catégorie spéciale du POS.
- **Filtres et Tri :** Utilisez les filtres pour retrouver facilement des articles par nom ou catégorie, et triez les colonnes.
        `,
      },
      {
        slug: "manage-categories",
        title: "Gérer les Catégories",
        content: `
Organisez vos articles en catégories pour une navigation plus facile dans le point de vente.

**Actions Possibles :**
- **Ajouter :** Créez une nouvelle catégorie avec un nom et une couleur personnalisée.
- **Modifier :** Changez le nom ou la couleur d'une catégorie existante.
- **Dédié au Restaurant :** Cochez l'option "Dédié au mode restaurant" pour qu'une catégorie (ex: "Entrées") n'apparaisse que lors d'une commande à table.
        `,
      },
      {
        slug: "manage-users",
        title: "Gérer les Utilisateurs",
        content: `
Cette section (réservée aux administrateurs) permet de gérer les accès à l'application.

**Actions Possibles :**
- **Ajouter :** Créez un nouveau compte utilisateur en définissant son nom, email, et son rôle (Admin, Manager, ou Caissier).
- **Modifier :** Changez le rôle ou les informations personnelles d'un utilisateur.
- **Réinitialiser le mot de passe :** Envoyez un email à l'utilisateur pour qu'il puisse définir un nouveau mot de passe.
- **Forcer la déconnexion :** Déconnectez un utilisateur de sa session active à distance.
- **Supprimer :** Supprimez un compte utilisateur.
        `,
      },
    ],
  },
];
