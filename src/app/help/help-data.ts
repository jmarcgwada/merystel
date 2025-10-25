
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
- **Statistiques clés :** Chiffre d'affaires du jour, nombre de ventes et panier moyen. (Affichage optionnel via Paramètres)
- **Accès Rapide :** Des boutons pour naviguer vers les sections principales : Mode Caisse, Commercial, Gestion, Rapports, Paramètres, et Aide.
- **Top Articles du Jour :** Une liste des articles les plus vendus pour identifier rapidement les tendances.
- **Personnalisation :** L'arrière-plan et l'apparence des boutons sont entièrement personnalisables dans Paramètres > Apparence.
        `,
      },
      {
        slug: "user-roles",
        title: "Rôles des Utilisateurs",
        content: `
L'application gère trois types de rôles avec des permissions différentes pour sécuriser l'accès aux fonctionnalités.

**Les Rôles :**
- **Administrateur (Admin) :** A un accès complet à toute l'application, y compris la gestion des utilisateurs, les paramètres de l'entreprise et les opérations de base de données.
- **Manager :** Peut gérer les opérations quotidiennes : articles, catégories, clients, tables, et voir les rapports. Il ne peut pas gérer les utilisateurs ni les paramètres avancés de l'entreprise.
- **Caissier (Cashier) :** A un accès limité aux modes de vente (POS, Supermarché, Restaurant). Il peut consulter certaines informations mais ne peut pas les modifier.
        `,
      },
    ],
  },
  {
    category: "Vente",
    topics: [
       {
        slug: "sales-modes",
        title: "Les Modes de Vente",
        content: `
Zenith POS propose plusieurs modes de vente pour s'adapter à votre activité. Vous pouvez choisir votre mode par défaut dans **Paramètres > Paramétrage**.

**Modes Disponibles :**
- **Point de Vente (POS) :** L'interface standard. Rapide et visuelle, idéale pour les cafés, boulangeries et ventes au comptoir. Navigation par catégories et grille d'articles.
- **Mode Supermarché :** Une interface optimisée pour la rapidité et l'utilisation d'un scanner de codes-barres. Une grande barre de recherche est au centre de l'écran pour une saisie immédiate.
- **Mode Restaurant :** Conçu pour le service en salle. Il affiche un plan de tables avec leur statut (disponible, occupée, en paiement) et permet de gérer les commandes associées à chaque table.
        `,
      },
      {
        slug: "commercial-invoicing",
        title: "Gestion Commerciale (Facturation)",
        content: `
La section Commercial est dédiée à la création et à la gestion des factures.

**Fonctionnement :**
1.  **Sélectionnez un client** ou créez-en un nouveau. La sélection d'un client est obligatoire pour une facture.
2.  **Ajoutez des articles** à la commande en les recherchant ou en scannant leur code-barres.
3.  **Ajustez les détails :** modifiez les quantités, appliquez des remises en pourcentage ou en montant fixe sur chaque ligne.
4.  **Saisissez un acompte** si nécessaire. Le "Net à Payer" sera calculé automatiquement.
5.  **Sauvegardez la facture** pour l'encaisser. Vous serez redirigé vers la modale de paiement. Les factures peuvent aussi être enregistrées en attente de paiement.
        `,
      },
      {
        slug: "payment",
        title: "Processus de Paiement",
        content: `
La modale de paiement est le centre de l'encaissement.

**Fonctionnalités :**
- **Client :** Associez la vente à un client existant ou créez-en un nouveau rapidement.
- **Montant :** Le montant à payer est affiché. Vous pouvez utiliser la calculatrice intégrée pour entrer des montants spécifiques (paiements partiels, etc.).
- **Méthodes de paiement :** Cliquez sur les boutons correspondants (Espèces, Carte, Chèque, etc.) pour ajouter un paiement. Des méthodes de paiement avancées (comme les titres-restaurant) sont disponibles.
- **Multi-paiement :** Vous pouvez ajouter plusieurs paiements de différentes méthodes jusqu'à ce que le solde soit à zéro.
- **Rendu Monnaie :** Si le montant payé en espèces est supérieur au total, le rendu est calculé et affiché.
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
- **Ajouter/Modifier :** Créez ou modifiez un article en définissant son nom, prix de vente et d'achat, catégorie, TVA, code-barres, descriptions et son image (qui peut être générée par une IA).
- **Gestion de stock :** Activez le suivi du stock, définissez la quantité actuelle et un seuil d'alerte pour le stock bas.
- **Numéros de série :** Exigez la saisie d'un numéro de série à la vente pour certains articles.
- **Déclinaisons :** Créez des variantes pour un article (ex: Taille, Couleur) qui seront demandées lors de l'ajout à la commande.
- **Favoris :** Marquez un article comme "favori" pour qu'il apparaisse dans la catégorie spéciale du POS.
        `,
      },
      {
        slug: "manage-users",
        title: "Gérer les Utilisateurs",
        content: `
Cette section (réservée aux administrateurs) permet de gérer les accès à l'application.

**Actions Possibles :**
- **Ajouter/Modifier :** Créez ou modifiez un compte utilisateur (nom, email, rôle).
- **Activer/Désactiver :** Désactivez un compte pour bloquer temporairement son accès sans le supprimer.
- **Réinitialiser le mot de passe :** Envoyez un email à l'utilisateur pour qu'il puisse définir un nouveau mot de passe.
- **Forcer la déconnexion :** Déconnectez un utilisateur de sa session active à distance.
- **Supprimer :** Supprimez un compte utilisateur de manière permanente.
        `,
      },
    ],
  },
   {
    category: "Paramètres",
    topics: [
      {
        slug: "settings-customization",
        title: "Personnalisation",
        content: `
Cette section vous permet d'ajuster l'apparence et le comportement de l'interface pour qu'elle corresponde à vos préférences.

**Options Disponibles :**
- **Modale Externe :** Affichez un bouton dans l'en-tête pour ouvrir un site web (ex: votre site de réservation, une radio en ligne) dans une fenêtre modale.
- **Visibilité des éléments :** Masquez les statistiques du tableau de bord, les images dans le ticket, ou activez un fond d'écran dynamique basé sur le dernier article ajouté.
- **Affichage des articles :** Personnalisez l'apparence des cartes d'articles dans le POS (opacité, image en fond, couleur du texte, etc.).
- **Filtres :** Activez un filtre qui ne montre que les catégories "restaurant" lorsque vous êtes en mode restaurant.
        `,
      },
       {
        slug: "settings-parameters",
        title: "Paramétrage",
        content: `
Cette section contient les réglages fonctionnels de l'application.

**Options Disponibles :**
- **Mode de vente par défaut :** Choisissez quel écran (POS, Supermarché, Restaurant) est lancé lorsque vous cliquez sur "Mode Caisse".
- **Mode forcé :** Verrouillez l'application sur le mode de vente par défaut, idéal pour une caisse dédiée.
- **Numéros de série :** Activez ou désactivez globalement la fonctionnalité de saisie des numéros de série.
- **Notifications :** Activez/désactivez les notifications et ajustez leur durée d'affichage.
- **Description dans la commande :** Choisissez si et comment les descriptions d'articles sont affichées dans le ticket de commande.
        `,
      },
       {
        slug: "settings-firestore",
        title: "Données Firestore (Admin)",
        content: `
Cette section, réservée aux administrateurs et protégée par un code PIN, permet de réaliser des opérations sensibles sur la base de données.

**Actions Possibles :**
- **Initialiser l'application :** Crée un jeu de données de base (catégories, TVA) si l'application est vide.
- **Importer des données de démo :** Ajoute des articles et des clients fictifs pour tester l'application.
- **Exporter/Importer la configuration :** Sauvegardez ou restaurez toute votre configuration (articles, catégories, etc.) dans un fichier JSON.
- **Zone de danger :** Contient des options pour supprimer toutes les ventes ou réinitialiser complètement l'application.
- **Générer le Prompt Projet :** Crée un prompt détaillé pour recréer une copie de cette application dans un autre environnement Firebase Studio.
        `,
      },
      {
        slug: "import-data-advanced",
        title: "Importation de Données (Avancé)",
        content: "L'outil d'importation est une fonctionnalité puissante pour remplir rapidement votre base de données. Il se déroule en 3 étapes : Fichier, Mappage, et JSON/Import.\\n\\n**Étape 1 : Fichier & Format**\\n1. **Type de données :** Choisissez ce que vous importez (Clients, Articles, Ventes, etc.).\\n2. **Séparateur :** Indiquez le caractère qui sépare les colonnes dans votre fichier (point-virgule, virgule...).\\n3. **En-tête :** Cochez si la première ligne de votre fichier contient les noms des colonnes.\\n4. **Fichier :** Sélectionnez votre fichier CSV ou texte. Une prévisualisation s'affiche, vous permettant de vérifier que les données sont correctement lues et triables.\\n\\n**Étape 2 : Mappage**\\nC'est l'étape la plus importante. Vous devez faire correspondre chaque champ de l'application (ex: \\\"Nom du client\\\") à une colonne de votre fichier.\\n- Les champs marqués d'un astérisque (*) sont **obligatoires**.\\n- Vous pouvez sauvegarder vos configurations de mappage comme **modèles** pour les réutiliser.\\n- **Mode \\\"Valeur Fixe\\\" :** Au lieu de mapper une colonne, vous pouvez assigner une valeur fixe à un champ pour toutes les lignes importées.\\n\\n**Étape 3 : JSON & Import**\\n- Une prévisualisation des données formatées en JSON est affichée.\\n- Vous pouvez limiter le nombre de lignes à importer, utile pour les tests.\\n- Le bouton **\\\"Importer les Données\\\"** lance le processus. Un rapport s'affichera à la fin.\\n\\n**Règles pour \\\"Ventes Complètes\\\"**\\nCe type d'import est le plus complexe et puissant. Il peut créer des ventes, mais aussi des clients et des articles à la volée.\\n\\n**Code de Référence pour l'Importation des Ventes Complètes :**\\n```javascript\\n// Logique utilisée dans la fonction importDataFromJson du fichier pos-context.tsx\\ncase 'ventes_completes':\\n    // ... (Initialisation des variables) ...\\n\\n    // Regroupement des lignes par numéro de pièce\\n    for (const row of limitedJsonData) {\\n        const ticketNum = row.ticketNumber;\\n        if (!ticketNum) continue;\\n        if (!groupedRows[ticketNum]) groupedRows[ticketNum] = [];\\n        groupedRows[ticketNum].push(row);\\n    }\\n\\n    for (const ticketNumber in groupedRows) {\\n        const rows = groupedRows[ticketNumber];\\n        const firstRow = rows[0];\\n\\n        try {\\n            // Détermination du type de document\\n            const docName = firstRow.pieceName?.toLowerCase() || '';\\n            const documentType = docName.includes('facture') ? 'invoice'\\n                            : docName.includes('devis') ? 'quote'\\n                            // ... autres types\\n                            : 'ticket';\\n\\n            // Vérification de l'unicité du numéro de pièce\\n            if (existingSaleNumbers.has(finalTicketNumber)) continue;\\n\\n            // Gestion des lignes de notes (sans code-barres)\\n            if (!row.itemBarcode) { /* ... */ }\\n\\n            // Création ou recherche du client\\n            if (!customer && row.customerCode && row.customerName) { /* ... */ }\\n\\n            // Création ou recherche de l'article\\n            if (!item && row.itemBarcode && row.itemName) { /* ... */ }\\n\\n            // Création de l'entrée de vente si elle n'existe pas\\n            if (!saleEntry) {\\n                // ... (création de l'objet 'sale' avec date, client, vendeur, etc.) ...\\n            }\\n\\n            // Ajout de la ligne d'article à la vente\\n            saleEntry.sale.items.push(orderItem);\\n\\n            // Traitement des paiements\\n            processPayment(saleEntry, row);\\n\\n            salesMap.set(finalTicketNumber, saleEntry);\\n\\n        } catch (e) {\\n            // Gestion des erreurs\\n        }\\n    }\\n\\n    // Finalisation et enregistrement des ventes\\n    for (const { sale, paymentTotals } of salesMap.values()) {\\n        // ... (calcul des totaux, ajout des paiements) ...\\n        setSales(prev => [sale, ...prev]);\\n        successCount++;\\n    }\\n    break;\\n```",
      },
    ],
  },
];

    