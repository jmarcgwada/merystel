
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, Server, TestTube2, MessageSquare, Folder, File, Download, FolderUp, RefreshCw, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { SmtpConfig, FtpConfig, TwilioConfig } from '@/lib/types';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { uploadFileFtp } from '@/ai/flows/upload-file-ftp-flow';
import { sendWhatsApp } from '@/ai/flows/send-whatsapp-flow';
import { listFtpFiles } from '@/ai/flows/list-ftp-files-flow';
import { downloadFtpFile } from '@/ai/flows/download-ftp-file-flow';
import { deleteFtpFile } from '@/ai/flows/delete-ftp-file-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface FileInfo {
  name: string;
  type: number;
  size: number;
  modifiedAt: string;
}

export default function ConnectivityPage() {
    const { 
        companyInfo, setCompanyInfo, 
        smtpConfig, setSmtpConfig, 
        ftpConfig, setFtpConfig, 
        twilioConfig, setTwilioConfig,
        sendEmailOnSale, setSendEmailOnSale
    } = usePos();
    const { toast } = useToast();

    const [localSmtp, setLocalSmtp] = useState<SmtpConfig>(smtpConfig || {});
    const [localFtp, setLocalFtp] = useState<FtpConfig>(ftpConfig || {});
    const [localTwilio, setLocalTwilio] = useState<TwilioConfig>(twilioConfig || {});

    const [isTestingSmtp, setIsTestingSmtp] = useState(false);
    const [isTestingFtp, setIsTestingFtp] = useState(false);
    const [isTestingTwilio, setIsTestingTwilio] = useState(false);
    const [isExploringFtp, setIsExploringFtp] = useState(false);
    const [twilioTestNumber, setTwilioTestNumber] = useState('');

    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [ftpPath, setFtpPath] = useState(localFtp.path || '/');
    const [ftpFiles, setFtpFiles] = useState<FileInfo[]>([]);
    
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showFtpPassword, setShowFtpPassword] = useState(false);

    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    
    useEffect(() => {
        setLocalSmtp(smtpConfig || {});
        setLocalFtp(ftpConfig || {});
        setLocalTwilio(twilioConfig || {});
        setFtpPath(ftpConfig?.path || '/');
    }, [smtpConfig, ftpConfig, twilioConfig]);

    const handleSave = () => {
        setSmtpConfig(localSmtp);
        setFtpConfig(localFtp);
        setTwilioConfig(localTwilio);
        toast({ title: 'Configurations sauvegardées' });
    };

    const handleSmtpChange = (field: keyof SmtpConfig, value: any) => {
        setLocalSmtp(prev => ({ ...prev, [field]: value }));
    };

    const handleFtpChange = (field: keyof FtpConfig, value: any) => {
        setLocalFtp(prev => ({ ...prev, [field]: value }));
    };
    
    const handleTwilioChange = (field: keyof TwilioConfig, value: any) => {
        setLocalTwilio(prev => ({...prev, [field]: value }));
    }

    const handleTestSmtp = async () => {
        if (!localSmtp.host || !localSmtp.port || !localSmtp.user || !localSmtp.password || !localSmtp.senderEmail) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs SMTP.' });
            return;
        }
        setIsTestingSmtp(true);
        toast({ title: 'Test de connexion SMTP en cours...' });
        
        const result = await sendEmail({
            smtpConfig: {
                host: localSmtp.host,
                port: localSmtp.port,
                secure: localSmtp.secure || false,
                auth: { user: localSmtp.user, pass: localSmtp.password },
                senderEmail: localSmtp.senderEmail,
            },
            to: localSmtp.senderEmail,
            subject: 'Test de connexion SMTP - Zenith POS',
            text: 'Ceci est un e-mail de test envoyé depuis Zenith POS.',
            html: '<p>Ceci est un e-mail de test envoyé depuis <b>Zenith POS</b>.</p>',
        });

        toast({
            variant: result.success ? 'default' : 'destructive',
            title: result.success ? 'Test SMTP réussi !' : 'Échec du test SMTP',
            description: result.message,
        });
        setIsTestingSmtp(false);
    };

    const handleTestFtp = async () => {
        if (!localFtp.host || !localFtp.port || !localFtp.user || !localFtp.password || !localFtp.path) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs FTP.' });
            return;
        }
        setIsTestingFtp(true);
        toast({ title: 'Test de connexion FTP en cours...' });

        const testContent = `Fichier de test de connexion FTP depuis Zenith POS - ${new Date().toISOString()}`;
        const testContentBase64 = Buffer.from(testContent).toString('base64');
        
        const result = await uploadFileFtp({
            ftpConfig: {
                host: localFtp.host,
                port: localFtp.port,
                user: localFtp.user,
                password: localFtp.password,
                secure: localFtp.secure || false,
                path: localFtp.path,
            },
            fileName: 'zenith_pos_test.txt',
            fileContent: testContentBase64,
        });

        toast({
            variant: result.success ? 'default' : 'destructive',
            title: result.success ? 'Test FTP réussi !' : 'Échec du test FTP',
            description: result.message,
        });
        setIsTestingFtp(false);
    };
    
    const handleTestTwilio = async () => {
        if (!localTwilio.accountSid || !localTwilio.authToken || !localTwilio.from || !twilioTestNumber) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs Twilio et le numéro de test.' });
            return;
        }
        setIsTestingTwilio(true);
        toast({ title: 'Test d\'envoi WhatsApp en cours...' });
        
        const result = await sendWhatsApp({
            twilioConfig: {
                accountSid: localTwilio.accountSid,
                authToken: localTwilio.authToken,
                from: `whatsapp:${localTwilio.from}`,
            },
            to: `whatsapp:${twilioTestNumber}`,
            body: 'Ceci est un message de test envoyé depuis Zenith POS.',
        });

        toast({
            variant: result.success ? 'default' : 'destructive',
            title: result.success ? 'Test WhatsApp réussi !' : 'Échec du test WhatsApp',
            description: result.message,
        });
        setIsTestingTwilio(false);
    }
    
    const exploreFtpPath = async (pathToExplore: string) => {
        if (!localFtp.host || !localFtp.port || !localFtp.user || !localFtp.password) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs FTP.' });
            return;
        }
        setIsExploringFtp(true);
        try {
            const result = await listFtpFiles({
                ftpConfig: {
                    host: localFtp.host,
                    port: localFtp.port,
                    user: localFtp.user,
                    password: localFtp.password,
                    secure: localFtp.secure || false,
                },
                path: pathToExplore,
            });

            if (result.success && result.files) {
                const sortedFiles = result.files.sort((a, b) => {
                    if (a.type !== b.type) return a.type === 2 ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                setFtpFiles(sortedFiles);
                setFtpPath(pathToExplore);
                if (!isExplorerOpen) setIsExplorerOpen(true);
            } else {
                toast({ variant: 'destructive', title: 'Erreur FTP', description: result.message });
                if (!isExplorerOpen) setFtpFiles([]);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur critique', description: error.message });
        } finally {
            setIsExploringFtp(false);
        }
    };
    
    const handleDownloadClick = async (fileName: string) => {
        toast({ title: 'Téléchargement en cours...'});
        try {
            const result = await downloadFtpFile({
                 ftpConfig: {
                    host: localFtp.host, port: localFtp.port, user: localFtp.user,
                    password: localFtp.password, secure: localFtp.secure || false,
                },
                filePath: ftpPath.endsWith('/') ? `${ftpPath}${fileName}` : `${ftpPath}/${fileName}`,
            });

            if (result.success && result.content) {
                const byteCharacters = atob(result.content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/octet-stream' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: 'Téléchargement réussi !' });
            } else {
                 toast({ variant: 'destructive', title: 'Erreur de téléchargement', description: result.message });
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Erreur critique', description: error.message });
        }
    }

    const handleDeleteFile = async () => {
        if (!fileToDelete) return;
        toast({ title: 'Suppression en cours...' });
        try {
            const result = await deleteFtpFile({
                ftpConfig: {
                    host: localFtp.host!, port: localFtp.port!, user: localFtp.user!,
                    password: localFtp.password!, secure: localFtp.secure || false,
                },
                filePath: ftpPath.endsWith('/') ? `${ftpPath}${fileToDelete}` : `${ftpPath}/${fileToDelete}`,
            });

            if (result.success) {
                toast({ title: 'Fichier supprimé !' });
                exploreFtpPath(ftpPath); // Refresh file list
            } else {
                toast({ variant: 'destructive', title: 'Erreur de suppression', description: result.message });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur critique', description: error.message });
        } finally {
            setFileToDelete(null);
        }
    }

    const goUpFtp = () => {
        if (ftpPath === '/') return;
        const newPath = ftpPath.substring(0, ftpPath.lastIndexOf('/')) || '/';
        exploreFtpPath(newPath);
    };

    return (
        <>
            <PageHeader
                title="Connectivité"
                subtitle="Configurez les serveurs SMTP, FTP et les services de messagerie."
            >
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSave}>Sauvegarder les Configurations</Button>
                    <Button asChild variant="outline" className="btn-back">
                        <Link href="/settings">
                            <ArrowLeft />
                            Retour
                        </Link>
                    </Button>
                </div>
            </PageHeader>
            <div className="mt-8 grid md:grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail />Configuration SMTP</CardTitle>
                        <CardDescription>Paramètres pour l'envoi d'e-mails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2"><Label htmlFor="smtp-host">Hôte</Label><Input id="smtp-host" placeholder="smtp.example.com" value={localSmtp.host || ''} onChange={(e) => handleSmtpChange('host', e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="smtp-port">Port</Label><Input id="smtp-port" type="number" placeholder="587" value={localSmtp.port || ''} onChange={(e) => handleSmtpChange('port', parseInt(e.target.value))} /></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2"><Label htmlFor="smtp-user">Utilisateur</Label><Input id="smtp-user" placeholder="user@example.com" value={localSmtp.user || ''} onChange={(e) => handleSmtpChange('user', e.target.value)} /></div>
                            <div className="grid gap-2 relative">
                                <Label htmlFor="smtp-password">Mot de passe</Label>
                                <Input id="smtp-password" type={showSmtpPassword ? 'text' : 'password'} value={localSmtp.password || ''} onChange={(e) => handleSmtpChange('password', e.target.value)} />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-6 h-7 w-7 text-muted-foreground" onClick={() => setShowSmtpPassword(!showSmtpPassword)}>
                                    {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label htmlFor="smtp-sender">Email de l'expéditeur</Label><Input id="smtp-sender" type="email" placeholder="noreply@example.com" value={localSmtp.senderEmail || ''} onChange={(e) => handleSmtpChange('senderEmail', e.target.value)} /></div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><Label htmlFor="smtp-secure" className="text-base">Connexion sécurisée (TLS)</Label><p className="text-sm text-muted-foreground">Recommandé pour la plupart des serveurs.</p></div>
                            <Switch id="smtp-secure" checked={localSmtp.secure || false} onCheckedChange={(checked) => handleSmtpChange('secure', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><Label htmlFor="sendEmailOnSale" className="text-base">Notification par e-mail après chaque vente</Label><p className="text-sm text-muted-foreground">Envoie un e-mail de confirmation après chaque transaction finalisée.</p></div>
                            <Switch id="sendEmailOnSale" checked={sendEmailOnSale} onCheckedChange={setSendEmailOnSale} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleTestSmtp} disabled={isTestingSmtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>{isTestingSmtp ? 'Test en cours...' : 'Tester'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Server />Configuration FTP</CardTitle>
                        <CardDescription>Paramètres pour l'échange de fichiers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2"><Label htmlFor="ftp-host">Hôte</Label><Input id="ftp-host" placeholder="ftp.example.com" value={localFtp.host || ''} onChange={(e) => handleFtpChange('host', e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="ftp-port">Port</Label><Input id="ftp-port" type="number" placeholder="21" value={localFtp.port || ''} onChange={(e) => handleFtpChange('port', parseInt(e.target.value))} /></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2"><Label htmlFor="ftp-user">Utilisateur</Label><Input id="ftp-user" placeholder="ftpuser" value={localFtp.user || ''} onChange={(e) => handleFtpChange('user', e.target.value)} /></div>
                            <div className="grid gap-2 relative">
                                <Label htmlFor="ftp-password">Mot de passe</Label>
                                <Input id="ftp-password" type={showFtpPassword ? 'text' : 'password'} value={localFtp.password || ''} onChange={(e) => handleFtpChange('password', e.target.value)} />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-6 h-7 w-7 text-muted-foreground" onClick={() => setShowFtpPassword(!showFtpPassword)}>
                                    {showFtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label htmlFor="ftp-path">Chemin du dossier</Label><Input id="ftp-path" placeholder="/exports" value={localFtp.path || ''} onChange={(e) => handleFtpChange('path', e.target.value)} /></div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><Label htmlFor="ftp-secure" className="text-base">Connexion sécurisée (FTPS)</Label><p className="text-sm text-muted-foreground">Utiliser le protocole FTP sur TLS.</p></div>
                            <Switch id="ftp-secure" checked={localFtp.secure || false} onCheckedChange={(checked) => handleFtpChange('secure', checked)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleTestFtp} disabled={isTestingFtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>{isTestingFtp ? 'Test en cours...' : 'Tester'}
                        </Button>
                        <Button onClick={() => exploreFtpPath(localFtp.path || '/')} disabled={isExploringFtp}>
                            <FolderUp className="mr-2 h-4 w-4" />{isExploringFtp ? 'Chargement...' : 'Explorer'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare />Configuration Twilio pour WhatsApp</CardTitle>
                        <CardDescription>Paramètres pour l'envoi de messages via l'API Twilio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2"><Label htmlFor="twilio-sid">Account SID</Label><Input id="twilio-sid" placeholder="AC..." value={localTwilio.accountSid || ''} onChange={(e) => handleTwilioChange('accountSid', e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="twilio-token">Auth Token</Label><Input id="twilio-token" type="password" value={localTwilio.authToken || ''} onChange={(e) => handleTwilioChange('authToken', e.target.value)} /></div>
                        </div>
                        <div className="grid gap-2"><Label htmlFor="twilio-from">Numéro d'expédition Twilio (WhatsApp)</Label><Input id="twilio-from" placeholder="+14155238886" value={localTwilio.from || ''} onChange={(e) => handleTwilioChange('from', e.target.value)} /></div>
                        <div className="p-4 border-l-4 border-amber-400 bg-amber-50">
                            <p className="text-sm text-amber-800">Assurez-vous que votre numéro d'expéditeur est préfixé par "whatsapp:" lors de l'envoi. Le numéro que vous enregistrez ici ne doit comporter que le signe + et les chiffres.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
                        <div className="flex-1 flex items-center gap-2">
                            <Input placeholder="Numéro de test (ex: +336...)" value={twilioTestNumber} onChange={e => setTwilioTestNumber(e.target.value)} />
                             <Button variant="outline" onClick={handleTestTwilio} disabled={isTestingTwilio}>
                                <TestTube2 className="mr-2 h-4 w-4"/>{isTestingTwilio ? 'Test...' : 'Tester'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
            <Sheet open={isExplorerOpen} onOpenChange={setIsExplorerOpen}>
                <SheetContent className="sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>Explorateur FTP</SheetTitle>
                        <SheetDescription>Naviguez dans les fichiers de votre serveur.</SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Button onClick={() => exploreFtpPath(ftpPath)} disabled={isExploringFtp} size="sm">
                                <RefreshCw className={`mr-2 h-4 w-4 ${isExploringFtp ? 'animate-spin' : ''}`}/>Actualiser
                            </Button>
                            <Input value={ftpPath} readOnly className="font-mono bg-muted h-9" />
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={goUpFtp} disabled={ftpPath === '/' || isExploringFtp}><FolderUp className="h-4 w-4" /></Button>
                        </div>
                        <div className="h-[calc(100vh-14rem)] overflow-auto border rounded-md relative">
                            {isExploringFtp && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Dern. modif.</TableHead>
                                        <TableHead className="text-right">Taille</TableHead>
                                        <TableHead className="text-right w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ftpFiles.map(file => (
                                        <TableRow key={file.name} onDoubleClick={() => file.type === 2 && exploreFtpPath(`${ftpPath.endsWith('/') ? ftpPath : ftpPath + '/'}${file.name}`)} className={file.type === 2 ? 'cursor-pointer' : ''}>
                                            <TableCell>{file.type === 2 ? <Folder className="h-5 w-5 text-amber-500" /> : <File className="h-5 w-5 text-muted-foreground" />}</TableCell>
                                            <TableCell className="font-medium">{file.name}</TableCell>
                                            <TableCell>{format(new Date(file.modifiedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{file.type === 1 ? `${(file.size / 1024).toFixed(2)} Ko` : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {file.type === 1 && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleDownloadClick(file.name)}><Download className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setFileToDelete(file.name)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
            <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le fichier "{fileToDelete}" sera supprimé définitivement du serveur FTP.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFileToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFile} className="bg-destructive hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
