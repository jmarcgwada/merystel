
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface StorageInfo {
  key: string;
  size: number; // in bytes
  itemCount?: number;
}

const LOCAL_STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB in bytes

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const keyToFrench: { [key: string]: string } = {
    'data.items': 'Données : Articles',
    'data.categories': 'Données : Catégories',
    'data.customers': 'Données : Clients',
    'data.suppliers': 'Données : Fournisseurs',
    'data.tables': 'Données : Tables',
    'data.sales': 'Données : Ventes',
    'data.paymentMethods': 'Données : Moyens de paiement',
    'data.vatRates': 'Données : TVA',
    'data.heldOrders': 'Données : Tickets en attente',
    'data.auditLogs': "Données : Logs d'audit",
    'data.companyInfo': "Données : Infos entreprise",
    'data.users': 'Données : Utilisateurs',
    'settings.showTicketImages': 'Paramètre : Afficher images ticket',
    'settings.descriptionDisplay': 'Paramètre : Affichage description',
    'settings.popularItemsCount': 'Paramètre : Nombre d\'articles populaires',
    'settings.itemCardOpacity': 'Paramètre : Opacité carte article',
    'settings.paymentMethodImageOpacity': 'Paramètre : Opacité image paiement',
    'settings.itemDisplayMode': 'Paramètre : Mode d\'affichage des articles',
    'settings.itemCardShowImageAsBackground': 'Paramètre : Image en fond de carte',
    'settings.itemCardImageOverlayOpacity': 'Paramètre : Opacité superposition image',
    'settings.itemCardTextColor': 'Paramètre : Couleur texte sur image',
    'settings.itemCardShowPrice': 'Paramètre : Afficher prix sur carte',
    'settings.externalLinkModalEnabled': 'Paramètre : Activer modale externe',
    'settings.externalLinkUrl': 'Paramètre : URL modale externe',
    'settings.externalLinkTitle': 'Paramètre : Titre modale externe',
    'settings.externalLinkModalWidth': 'Paramètre : Largeur modale externe',
    'settings.externalLinkModalHeight': 'Paramètre : Hauteur modale externe',
    'settings.showDashboardStats': 'Paramètre : Afficher stats tableau de bord',
    'settings.enableRestaurantCategoryFilter': 'Paramètre : Filtre restaurant',
    'settings.showNotifications': 'Paramètre : Afficher notifications',
    'settings.notificationDuration': 'Paramètre : Durée notifications',
    'settings.enableSerialNumber': 'Paramètre : Activer numéros de série',
    'settings.defaultSalesMode': 'Paramètre : Mode de vente par défaut',
    'settings.isForcedMode': 'Paramètre : Activer mode forcé',
    'settings.directSaleBgColor': 'Paramètre : Couleur fond vente directe',
    'settings.restaurantModeBgColor': 'Paramètre : Couleur fond mode restaurant',
    'settings.directSaleBgOpacity': 'Paramètre : Opacité fond vente directe',
    'settings.restaurantModeBgOpacity': 'Paramètre : Opacité fond mode restaurant',
    'data.seeded': 'Indicateur : Données initiales créées',
    'settings.dashboardBgType': 'Paramètre : Type de fond du tableau de bord',
    'settings.dashboardBackgroundColor': 'Paramètre : Couleur de fond du tableau de bord',
    'settings.dashboardBackgroundImage': 'Paramètre : Image de fond du tableau de bord',
    'settings.dashboardBgOpacity': 'Paramètre : Opacité du fond du tableau de bord',
    'settings.dashboardButtonBackgroundColor': 'Paramètre : Couleur de fond des boutons',
    'settings.dashboardButtonOpacity': 'Paramètre : Opacité du fond des boutons',
    'settings.dashboardButtonShowBorder': 'Paramètre : Afficher la bordure des boutons',
    'settings.dashboardButtonBorderColor': 'Paramètre : Couleur de la bordure des boutons',
    'settings.invoiceBgColor': 'Paramètre : Couleur fond factures',
    'settings.invoiceBgOpacity': 'Paramètre : Opacité fond factures',
    'settings.quoteBgColor': 'Paramètre : Couleur fond devis',
    'settings.quoteBgOpacity': 'Paramètre : Opacité fond devis',
    'settings.deliveryNoteBgColor': 'Paramètre : Couleur fond BL',
    'settings.deliveryNoteBgOpacity': 'Paramètre : Opacité fond BL',
    'settings.supplierOrderBgColor': 'Paramètre : Couleur fond Cdes Fourn.',
    'settings.supplierOrderBgOpacity': 'Paramètre : Opacité fond Cdes Fourn.',
    'settings.creditNoteBgColor': 'Paramètre : Couleur fond Avoirs',
    'settings.creditNoteBgOpacity': 'Paramètre : Opacité fond Avoirs',
    'settings.commercialViewLevel': 'Paramètre : Niveau de vue commercial',
    'settings.requirePinForAdmin': 'Paramètre : Exiger PIN admin',
    'settings.smtpConfig': 'Paramètre : Configuration SMTP',
    'settings.ftpConfig': 'Paramètre : Configuration FTP',
    'settings.twilioConfig': 'Paramètre : Configuration Twilio',
    'settings.sendEmailOnSale': 'Paramètre : Email après vente',
    'settings.itemsPerPage': 'Paramètre : Éléments par page',
    'state.lastSelectedSaleId': 'État : Dernière vente sélectionnée',
    'settings.importLimit': 'Paramètre : Limite d\'importation',
    'settings.mappingTemplates': 'Paramètre : Modèles de mappage',
};


export default function StoragePage() {
  const [storageData, setStorageData] = useState<StorageInfo[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  const calculateStorage = () => {
    if (typeof window === 'undefined') return;

    let total = 0;
    const data: StorageInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          let itemCount: number | undefined = undefined;
          try {
            const parsedValue = JSON.parse(value);
            if (Array.isArray(parsedValue)) {
              itemCount = parsedValue.length;
            }
          } catch (e) {
            // Not a JSON array, so no item count
          }
          total += size;
          data.push({ key, size, itemCount });
        }
      }
    }
    setTotalSize(total);
    setStorageData(data.sort((a, b) => b.size - a.size));
  };

  useEffect(() => {
    calculateStorage();
  }, []);

  const usagePercentage = (totalSize / LOCAL_STORAGE_QUOTA) * 100;

  return (
    <>
      <PageHeader
        title="Gestion du Stockage Local"
        subtitle="Analysez l'espace de stockage utilisé par l'application dans votre navigateur."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={calculateStorage}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="btn-back">
            <Link href="/settings">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="mt-8 grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Utilisation Globale</CardTitle>
            <CardDescription>
              Espace total utilisé sur la limite estimée de 5 Mo de votre navigateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={usagePercentage} />
              <div className="flex justify-between text-sm font-medium">
                <span>{formatBytes(totalSize)} / {formatBytes(LOCAL_STORAGE_QUOTA)}</span>
                <span className="text-primary">{usagePercentage.toFixed(2)}%</span>
              </div>
            </div>
            {usagePercentage > 90 && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Attention</AlertTitle>
                    <p>L'espace de stockage est presque plein. Pensez à supprimer des données via la page "Données Firestore" pour éviter des problèmes de performance.</p>
                </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail par Fichier</CardTitle>
            <CardDescription>
              Taille de chaque ensemble de données stocké localement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier de données</TableHead>
                  <TableHead className="text-right">Taille</TableHead>
                  <TableHead className="text-right">Éléments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageData.map(({ key, size, itemCount }) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{keyToFrench[key] || key}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatBytes(size)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{itemCount ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
