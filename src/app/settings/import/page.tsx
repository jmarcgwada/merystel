
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, Sparkles, FileJson, Users, Truck } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { useRef, useState } from 'react';
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
} from "@/components/ui/alert-dialog";

export default function ImportPage() {
  const { importConfiguration, importDemoData, importDemoCustomers, importDemoSuppliers } = usePos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await importConfiguration(file);
    setIsImporting(false);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <PageHeader
        title="Importation de Données"
        subtitle="Importez votre configuration ou des jeux de données."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-8 grid md:grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson />
              Importer une Configuration Complète
            </CardTitle>
            <CardDescription>
              Restaurez l'application à partir d'un fichier de configuration (.json) exporté précédemment. Cette action écrasera toutes les données actuelles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Upload className="mr-2" />
                  Importer un Fichier de Configuration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. L'importation d'un nouveau fichier de configuration écrasera et remplacera TOUTES les données actuelles (articles, clients, paramètres, etc.).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImportClick} disabled={isImporting}>
                    {isImporting ? "Importation en cours..." : "Continuer et importer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles />
                Données de Démonstration
            </CardTitle>
            <CardDescription>
              Peuplez rapidement l'application avec des jeux de données pour tester les fonctionnalités. Recommandé pour une application vide.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Importer le jeu de démo complet
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Importer les données de démo ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ajoutera des articles, catégories, clients et fournisseurs à vos données actuelles.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={importDemoData}>
                            Confirmer et importer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-4">
                <Button variant="outline" className="w-full justify-start" onClick={importDemoCustomers}>
                    <Users className="mr-2 h-4 w-4" />
                    Importer clients de démo
                </Button>
                 <Button variant="outline" className="w-full justify-start" onClick={importDemoSuppliers}>
                    <Truck className="mr-2 h-4 w-4" />
                    Importer fournisseurs de démo
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
