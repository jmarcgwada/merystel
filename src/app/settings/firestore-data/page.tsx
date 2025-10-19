
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertTriangle, Trash2, Database, FileCode, Upload, Download, FileJson, Users, History, Delete, Truck, Send, Server, Lock, Eraser } from 'lucide-react';
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
      exportConfiguration, 
      ftpConfig,
      smtpConfig,
      requirePinForAdmin,
      setRequirePinForAdmin,
      removeDuplicateItems,
  } = usePos();
  
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isPromptViewerOpen, setPromptViewerOpen] = useState(false);
  
  const [isExportingToFtp, setIsExportingToFtp] = useState(false);

  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const { toast } = useToast();
  const router = useRouter();


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

        // Send email notification only if SMTP is fully configured
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
                    <h2 className="text-xl font-bold tracking-tight text-primary mb-4">Gestion des Données</h2>
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Nettoyage des données</CardTitle>
                             <CardDescription>
                                Outils pour maintenir la propreté et la cohérence de votre base de données.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <AlertDialogTrigger asChild>
                                <Button variant="outline" onClick={() => removeDuplicateItems()}>
                                  <Eraser className="mr-2 h-4 w-4" />
                                  Supprimer les articles en double
                                </Button>
                           </AlertDialogTrigger>
                        </CardContent>
                    </Card>
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Exportation des données</CardTitle>
                            <CardDescription>
                                Sauvegardez l'ensemble de votre configuration (articles, catégories, paramètres, etc.).
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
                        <CardContent>
                          <Button variant="destructive" onClick={() => setResetDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Réinitialisation sélective
                          </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
       <PromptViewer isOpen={isPromptViewerOpen} onClose={() => setPromptViewerOpen(false)} />
       <SelectiveResetDialog isOpen={isResetDialogOpen} onClose={() => setResetDialogOpen(false)} />
    </>
  );
}
