
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertTriangle, Trash2, Database, FileCode, Upload, Download, FileJson, Users, History, Delete, Truck, LayoutDashboard, Send, Server, Lock } from 'lucide-react';
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
import { useMemo, useState, useRef, useEffect } from 'react';
import { PromptViewer } from '../components/prompt-viewer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadFileFtp } from '@/ai/flows/upload-file-ftp-flow';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

const PinKey = ({ value, onClick }: { value: string, onClick: (value: string) => void }) => (
    <Button
        type="button"
        variant="outline"
        className="h-14 w-14 text-2xl font-bold"
        onClick={() => onClick(value)}
    >
        {value}
    </Button>
);

export default function FirestoreDataPage() {
  const { user, loading: userLoading } = useUser();
  const { 
      resetAllData, 
      exportConfiguration, 
      importConfiguration, 
      importDemoData, 
      deleteAllSales,
      importDemoCustomers,
      importDemoSuppliers,
      ftpConfig,
      smtpConfig,
      requirePinForAdmin,
      setRequirePinForAdmin,
  } = usePos();
  
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isDeleteSalesDialogOpen, setDeleteSalesDialogOpen] = useState(false);
  const [isPromptViewerOpen, setPromptViewerOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingToFtp, setIsExportingToFtp] = useState(false);

  const [isPinDialogOpen, setPinDialogOpen] = useState(requirePinForAdmin);
  const [pin, setPin] = useState('');
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    if (!userLoading && user?.role !== 'admin') {
      toast({ title: "Accès non autorisé", variant: "destructive" });
      router.push('/settings');
    }
  }, [user, userLoading, router, toast]);

  const generateDynamicPin = () => {
    const now = new Date();
    const month = (now.getMonth() + 1);
    const day = now.getDate();
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const difference = Math.abs(day - month).toString();

    return `${monthStr}${dayStr}${difference}`;
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const correctPin = generateDynamicPin();
    if (pin === correctPin) {
      setPinDialogOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Code PIN incorrect',
        description: 'L\'accès à cette section est restreint.',
      });
      router.push('/settings');
    }
  };

  const handleCancelPin = () => {
      setPinDialogOpen(false);
      router.push('/settings');
  }

  const handlePinKeyPress = (key: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + key);
    }
  };
  
  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };


  const handleResetData = () => {
    resetAllData();
    setResetDialogOpen(false);
  }

  const handleDeleteSales = () => {
    deleteAllSales();
    setDeleteSalesDialogOpen(false);
  };

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
  
  const handleDownload = () => {
    const jsonString = exportConfiguration();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenith-pos-config-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exportation réussie' });
  };
  
  const handleExportToFtp = async () => {
    if (!ftpConfig?.host || !smtpConfig?.host) {
      toast({
        variant: 'destructive',
        title: 'Configuration requise',
        description: 'Veuillez configurer vos serveurs FTP et SMTP dans la page "Connectivité".',
      });
      return;
    }
    setIsExportingToFtp(true);
    toast({ title: 'Préparation de l\'exportation FTP...' });

    try {
      const jsonString = exportConfiguration();
      const fileContentBase64 = Buffer.from(jsonString).toString('base64');
      const fileName = `zenith-pos-config-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`;

      const ftpResult = await uploadFileFtp({
        ftpConfig: {
            host: ftpConfig.host,
            port: ftpConfig.port || 21,
            user: ftpConfig.user || '',
            password: ftpConfig.password || '',
            secure: ftpConfig.secure || false,
            path: ftpConfig.path || '/',
        },
        fileName: fileName,
        fileContent: fileContentBase64,
      });

      if (ftpResult.success) {
        toast({ title: 'Exportation FTP réussie', description: 'Le fichier de configuration a été envoyé.' });

        // Send email notification
        await sendEmail({
          smtpConfig: {
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure || false,
            auth: { user: smtpConfig.user || '', pass: smtpConfig.password || '' },
            senderEmail: smtpConfig.senderEmail || '',
          },
          to: 'datamonetik@gmail.com',
          subject: `Sauvegarde Zenith POS réussie - ${format(new Date(), 'd MMM yyyy HH:mm')}`,
          text: `La sauvegarde de la configuration de Zenith POS a été effectuée avec succès sur le serveur FTP.\nNom du fichier : ${fileName}`,
          html: `<p>La sauvegarde de la configuration de <b>Zenith POS</b> a été effectuée avec succès sur le serveur FTP.</p><p><b>Nom du fichier :</b> ${fileName}</p>`,
        });

      } else {
        toast({ variant: 'destructive', title: 'Échec de l\'exportation FTP', description: ftpResult.message });
      }
    } catch (error: any) {
      console.error("FTP/Email export error:", error);
      toast({ variant: 'destructive', title: 'Erreur critique', description: error.message || 'Une erreur inattendue est survenue.' });
    } finally {
      setIsExportingToFtp(false);
    }
  };
  
  if (userLoading || user?.role !== 'admin') {
      return (
          <div className="flex h-full items-center justify-center">
              <Skeleton className="h-64 w-full" />
          </div>
      );
  }
  
  if(isPinDialogOpen) {
      return (
        <AlertDialog open={isPinDialogOpen}>
            <AlertDialogContent className="sm:max-w-sm">
                <form onSubmit={handlePinSubmit}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Accès Sécurisé</AlertDialogTitle>
                        <AlertDialogDescription>
                            Veuillez entrer le code PIN dynamique pour continuer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                       <div className="flex justify-center items-center h-12 bg-muted rounded-md border">
                          <p className="text-3xl font-mono tracking-[0.5em]">
                            {pin.split('').map(() => '•').join('')}
                          </p>
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                            <PinKey value="1" onClick={handlePinKeyPress} />
                            <PinKey value="2" onClick={handlePinKeyPress} />
                            <PinKey value="3" onClick={handlePinKeyPress} />
                            <PinKey value="4" onClick={handlePinKeyPress} />
                            <PinKey value="5" onClick={handlePinKeyPress} />
                            <PinKey value="6" onClick={handlePinKeyPress} />
                            <PinKey value="7" onClick={handlePinKeyPress} />
                            <PinKey value="8" onClick={handlePinKeyPress} />
                            <PinKey value="9" onClick={handlePinKeyPress} />
                             <Button type="button" variant="outline" className="h-14 w-14" onClick={handlePinBackspace}>
                                <Delete className="h-6 w-6"/>
                             </Button>
                            <PinKey value="0" onClick={handlePinKeyPress} />
                       </div>
                    </div>
                    <AlertDialogFooter>
                        <Button type="button" variant="outline" onClick={handleCancelPin}>Annuler</Button>
                        <AlertDialogAction type="submit">
                            Valider
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
      )
  }


  return (
    <>
        <PageHeader
            title="Données Firestore"
            subtitle="Gérez les données brutes de votre application."
        >
            <div className="flex items-center gap-2">
                 <Button asChild variant="outline" className="btn-back">
                    <Link href="/settings">
                        <LayoutDashboard />
                    </Link>
                </Button>
            </div>
        </PageHeader>

        <div className="space-y-8 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Sécurité d'accès</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="require-pin-admin" className="text-base flex items-center gap-2">
                                    <Lock />
                                    Exiger le code PIN pour l'accès administrateur
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Si activé, un code PIN dynamique sera requis pour accéder à cette page.
                                </p>
                            </div>
                            <Switch 
                                id="require-pin-admin"
                                checked={requirePinForAdmin}
                                onCheckedChange={setRequirePinForAdmin}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-xl font-bold tracking-tight text-primary mb-4">Données de l'application</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Données de démonstration</CardTitle>
                            <CardDescription>
                                Peuplez l'application avec un jeu de données complet (articles, clients, fournisseurs etc.) pour des tests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Initialiser avec données de base
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Importer les données de démo ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action ajoutera des articles, catégories, clients et fournisseurs à vos données actuelles. Elle est recommandée pour une application vide.
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
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Gestion de la configuration</CardTitle>
                            <CardDescription>
                                Sauvegardez ou restaurez l'ensemble de votre configuration (articles, catégories, paramètres, etc.).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleDownload} variant="outline">
                                <Download className="mr-2" />
                                Exporter la configuration
                            </Button>
                             <Button onClick={handleExportToFtp} variant="secondary" disabled={isExportingToFtp}>
                                <Server className="mr-2 h-4 w-4"/>
                                {isExportingToFtp ? 'Export en cours...' : 'Exporter vers FTP'}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Upload className="mr-2" />
                                        Importer la configuration
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible. L'importation d'un nouveau fichier de configuration écrasera et remplacera TOUTES les données actuelles (articles, catégories, paramètres, etc.).
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
                    <Separator className="my-6" />
                     <div className="space-y-4">
                        <Button variant="secondary" onClick={() => setPromptViewerOpen(true)}>
                            <FileCode className="mr-2 h-4 w-4" />
                            Générer le Prompt Projet
                        </Button>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-destructive mb-4">Zone de danger</h2>
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle>Opérations Irréversibles</CardTitle>
                            <CardDescription>
                                Ces actions suppriment définitivement des données. Soyez certain avant de continuer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-4">
                            <AlertDialog open={isDeleteSalesDialogOpen} onOpenChange={setDeleteSalesDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700">
                                        <History className="mr-2 h-4 w-4" />
                                        Supprimer toutes les ventes
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Toutes vos pièces de vente seront supprimées. Le reste des données (articles, clients, etc.) sera conservé.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteSales} className="bg-destructive hover:bg-destructive/90">
                                            Oui, supprimer les ventes
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Réinitialiser l'application
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Toutes vos données (ventes, articles, clients, etc.) seront supprimées de la base de données.
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
       <PromptViewer isOpen={isPromptViewerOpen} onClose={() => setPromptViewerOpen(false)} />
    </>
  );
}
