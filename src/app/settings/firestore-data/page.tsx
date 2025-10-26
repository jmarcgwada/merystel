
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertTriangle, Trash2, Database, FileCode, Upload, Download, FileJson, Users, History, Delete, Truck, Send, Server, Lock, Eraser, TestTube2 } from 'lucide-react';
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
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
import { SelectiveResetDialog } from './components/selective-reset-dialog';
import { cn } from '@/lib/utils';

const PinKey = ({ value, onClick, 'data-key': dataKey, className }: { value: string, onClick: (value: string) => void, 'data-key'?: string, className?: string }) => (
    <Button
        type="button"
        variant="outline"
        className={cn("h-14 w-14 text-2xl font-bold", className)}
        onClick={() => onClick(value)}
        data-key={dataKey}
    >
        {value}
    </Button>
);

export default function FirestoreDataPage() {
  const { user, loading: userLoading } = useUser();
  const { 
      exportConfiguration, 
      importConfiguration,
      resetAllData,
      seedInitialData,
      importDemoData,
      importDemoCustomers,
      importDemoSuppliers,
      ftpConfig,
      smtpConfig,
      requirePinForAdmin,
      setRequirePinForAdmin,
      generateRandomSales,
      customers,
      items,
      paymentMethods
  } = usePos();
  
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isSelectiveResetOpen, setSelectiveResetOpen] = useState(false);
  const [isPromptViewerOpen, setPromptViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExportingToFtp, setIsExportingToFtp] = useState(false);

  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const canGenerateSales = useMemo(() => {
    return (customers?.length || 0) > 0 && 
           (items?.length || 0) > 0 && 
           (paymentMethods?.length || 0) > 0;
  }, [customers, items, paymentMethods]);

  const missingDataForGeneration = useMemo(() => {
    const missing = [];
    if (!customers?.length) missing.push('clients');
    if (!items?.length) missing.push('articles');
    if (!paymentMethods?.length) missing.push('moyens de paiement');
    return missing.join(', ');
  }, [customers, items, paymentMethods]);


  useEffect(() => {
    if (!userLoading && user?.role !== 'admin') {
      toast({ title: "Accès non autorisé", variant: "destructive" });
      router.push('/settings');
    } else if (!userLoading && requirePinForAdmin) {
      setPinDialogOpen(true);
    }
  }, [user, userLoading, router, toast, requirePinForAdmin]);

  const generateDynamicPin = useCallback(() => {
    const now = new Date();
    const month = (now.getMonth() + 1);
    const day = now.getDate();
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const difference = Math.abs(day - month).toString();

    return `${monthStr}${dayStr}${difference}`;
  }, []);

  const handlePinSubmit = useCallback((e?: React.FormEvent) => {
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
  }, [pin, generateDynamicPin, router, toast]);

    useEffect(() => {
        if (pin.length === 6) {
            handlePinSubmit();
        }
    }, [pin, handlePinSubmit]);

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
  
  const triggerVisualFeedback = useCallback((key: string) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 150);
  }, []);

   useEffect(() => {
    if (!isPinDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
        const { key } = event;
        triggerVisualFeedback(key);

        if (key >= '0' && key <= '9') {
            handlePinKeyPress(key);
        } else if (key === 'Backspace') {
            handlePinBackspace();
        } else if (key === 'Enter') {
            handlePinSubmit();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinDialogOpen, handlePinKeyPress, handlePinBackspace, handlePinSubmit, triggerVisualFeedback]);


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
    if (!ftpConfig?.host) {
      toast({
        variant: 'destructive',
        title: 'Configuration FTP requise',
        description: 'Veuillez configurer votre serveur FTP dans la page "Connectivité".',
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

        const isSmtpConfigured = smtpConfig?.host && smtpConfig?.port && smtpConfig?.user && smtpConfig?.password && smtpConfig?.senderEmail;

        if (isSmtpConfigured) {
          await sendEmail({
            smtpConfig: {
              host: smtpConfig.host!,
              port: smtpConfig.port!,
              secure: smtpConfig.secure || false,
              auth: { user: smtpConfig.user!, pass: smtpConfig.password! },
              senderEmail: smtpConfig.senderEmail!,
            },
            to: 'datamonetik@gmail.com',
            subject: `Sauvegarde Zenith POS réussie - ${format(new Date(), 'd MMM yyyy HH:mm')}`,
            text: `La sauvegarde de la configuration de Zenith POS a été effectuée avec succès sur le serveur FTP.\nNom du fichier : ${fileName}`,
            html: `<p>La sauvegarde de la configuration de <b>Zenith POS</b> a été effectuée avec succès sur le serveur FTP.</p><p><b>Nom du fichier :</b> ${fileName}</p>`,
          });
        } else {
            toast({
                variant: 'default',
                title: 'Notification par e-mail ignorée',
                description: 'La configuration SMTP est incomplète, aucun e-mail n\'a été envoyé.'
            })
        }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importConfiguration(file);
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
                            {pin.padEnd(6, '•').substring(0, 6)}
                          </p>
                       </div>
                        <div className="grid grid-cols-3 gap-2">
                           <PinKey value="1" onClick={handlePinKeyPress} data-key="1" className={cn(activeKey === '1' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="2" onClick={handlePinKeyPress} data-key="2" className={cn(activeKey === '2' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="3" onClick={handlePinKeyPress} data-key="3" className={cn(activeKey === '3' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="4" onClick={handlePinKeyPress} data-key="4" className={cn(activeKey === '4' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="5" onClick={handlePinKeyPress} data-key="5" className={cn(activeKey === '5' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="6" onClick={handlePinKeyPress} data-key="6" className={cn(activeKey === '6' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="7" onClick={handlePinKeyPress} data-key="7" className={cn(activeKey === '7' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="8" onClick={handlePinKeyPress} data-key="8" className={cn(activeKey === '8' && 'bg-primary text-primary-foreground')} />
                            <PinKey value="9" onClick={handlePinKeyPress} data-key="9" className={cn(activeKey === '9' && 'bg-primary text-primary-foreground')} />
                            <Button type="button" variant="outline" className={cn("h-14 w-14", activeKey === 'Backspace' && 'bg-primary text-primary-foreground')} onClick={handlePinBackspace} data-key="Backspace">
                                <Delete className="h-6 w-6"/>
                             </Button>
                            <PinKey value="0" onClick={handlePinKeyPress} data-key="0" className={cn(activeKey === '0' && 'bg-primary text-primary-foreground')} />
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
                 <Button asChild className="btn-back">
                    <Link href="/settings">
                        <ArrowLeft />
                        Retour aux paramètres
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
                    <h2 className="text-xl font-bold tracking-tight text-primary mb-4">Sauvegarde et Restauration</h2>
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Sauvegarde du Code Projet</CardTitle>
                            <CardDescription>
                                La méthode la plus fiable pour sauvegarder votre projet est de générer un "Prompt Projet". Il contient la description complète de l'architecture et de la logique de l'application, vous permettant de la recréer à l'identique.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="default" onClick={() => setPromptViewerOpen(true)}>
                              <FileCode className="mr-2 h-4 w-4" />
                              Générer le Prompt Projet
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Sauvegarde des Données</CardTitle>
                            <CardDescription>
                                Exportez uniquement les données de configuration (articles, catégories, etc.) sous forme de fichier JSON. Utile pour les transferts ou comme sauvegarde simple.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleDownload} variant="outline">
                                <Download className="mr-2" />
                                Exporter la configuration
                            </Button>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                                <Upload className="mr-2" />
                                Importer depuis un fichier
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                             <Button onClick={handleExportToFtp} variant="secondary" disabled={isExportingToFtp}>
                                <Server className="mr-2 h-4 w-4"/>
                                {isExportingToFtp ? 'Export en cours...' : 'Exporter vers FTP'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-destructive mb-4">Zone de danger</h2>
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle>Opérations Irréversibles</CardTitle>
                            <CardDescription>
                                Ces actions suppriment ou ajoutent massivement des données. Soyez certain avant de continuer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                          <Button variant="outline" onClick={() => seedInitialData()}>
                            <Database className="mr-2" />
                            Initialiser les données
                          </Button>
                          <Button variant="outline" onClick={() => importDemoData()}>
                            <Sparkles className="mr-2" />
                            Importer articles de démo
                          </Button>
                          <Button variant="outline" onClick={() => importDemoCustomers()}>
                            <Users className="mr-2" />
                            Importer clients de démo
                          </Button>
                           <Button variant="outline" onClick={() => importDemoSuppliers()}>
                            <Truck className="mr-2" />
                            Importer fournisseurs de démo
                          </Button>
                          <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="bg-destructive/80 hover:bg-destructive" disabled={!canGenerateSales}>
                                        <TestTube2 className="mr-2 h-4 w-4" />
                                        Générer 100 pièces aléatoires
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer la génération ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action va créer 100 nouvelles pièces de vente avec des données aléatoires. Voulez-vous continuer ?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => generateRandomSales(100)}>
                                            Confirmer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             {!canGenerateSales && (
                                <p className="text-sm text-muted-foreground">
                                    (Données manquantes pour la génération : {missingDataForGeneration})
                                </p>
                            )}
                          <Separator className="my-4"/>
                           <Button variant="destructive" onClick={() => setSelectiveResetOpen(true)}>
                            <Eraser className="mr-2 h-4 w-4" />
                            Réinitialisation sélective
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2"/>
                                    Réinitialiser l'application
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Cette action est irréversible. Toutes les données seront supprimées et l'application sera remise à son état initial.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={resetAllData}>Confirmer la réinitialisation</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
       <PromptViewer isOpen={isPromptViewerOpen} onClose={() => setPromptViewerOpen(false)} />
       <SelectiveResetDialog isOpen={isSelectiveResetOpen} onClose={() => setSelectiveResetOpen(false)} />
    </>
  );
 