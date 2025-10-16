
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, Server, TestTube2, MessageSquare } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { SmtpConfig, FtpConfig, TwilioConfig, CompanyInfo } from '@/lib/types';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { uploadFileFtp } from '@/ai/flows/upload-file-ftp-flow';
import { sendWhatsApp } from '@/ai/flows/send-whatsapp-flow';


export default function ConnectivityPage() {
    const { companyInfo, setCompanyInfo } = usePos();
    const { toast } = useToast();

    const [localSmtp, setLocalSmtp] = useState<SmtpConfig>(companyInfo?.smtpConfig || {});
    const [localFtp, setLocalFtp] = useState<FtpConfig>(companyInfo?.ftpConfig || {});
    const [localTwilio, setLocalTwilio] = useState<TwilioConfig>(companyInfo?.twilioConfig || {});

    const [isTestingSmtp, setIsTestingSmtp] = useState(false);
    const [isTestingFtp, setIsTestingFtp] = useState(false);
    const [isTestingTwilio, setIsTestingTwilio] = useState(false);
    const [twilioTestNumber, setTwilioTestNumber] = useState('');


    useEffect(() => {
        setLocalSmtp(companyInfo?.smtpConfig || {});
        setLocalFtp(companyInfo?.ftpConfig || {});
        setLocalTwilio(companyInfo?.twilioConfig || {});
    }, [companyInfo]);

    const handleSave = () => {
        if (!companyInfo) return;
        setCompanyInfo({
            ...companyInfo,
            smtpConfig: localSmtp,
            ftpConfig: localFtp,
            twilioConfig: localTwilio,
        });
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
                        <CardDescription>
                            Paramètres pour l'envoi d'e-mails (factures, devis, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="smtp-host">Hôte</Label>
                                <Input id="smtp-host" placeholder="smtp.example.com" value={localSmtp.host || ''} onChange={(e) => handleSmtpChange('host', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="smtp-port">Port</Label>
                                <Input id="smtp-port" type="number" placeholder="587" value={localSmtp.port || ''} onChange={(e) => handleSmtpChange('port', parseInt(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="smtp-user">Utilisateur</Label>
                                <Input id="smtp-user" placeholder="user@example.com" value={localSmtp.user || ''} onChange={(e) => handleSmtpChange('user', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="smtp-password">Mot de passe</Label>
                                <Input id="smtp-password" type="password" value={localSmtp.password || ''} onChange={(e) => handleSmtpChange('password', e.target.value)} />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="smtp-sender">Email de l'expéditeur</Label>
                            <Input id="smtp-sender" type="email" placeholder="noreply@example.com" value={localSmtp.senderEmail || ''} onChange={(e) => handleSmtpChange('senderEmail', e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="smtp-secure" className="text-base">Connexion sécurisée (TLS)</Label>
                                <p className="text-sm text-muted-foreground">Recommandé pour la plupart des serveurs.</p>
                            </div>
                            <Switch id="smtp-secure" checked={localSmtp.secure || false} onCheckedChange={(checked) => handleSmtpChange('secure', checked)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleTestSmtp} disabled={isTestingSmtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>
                            {isTestingSmtp ? 'Test en cours...' : 'Tester'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Server />Configuration FTP</CardTitle>
                        <CardDescription>
                            Paramètres pour l'échange de fichiers (exports comptables, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="ftp-host">Hôte</Label>
                                <Input id="ftp-host" placeholder="ftp.example.com" value={localFtp.host || ''} onChange={(e) => handleFtpChange('host', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ftp-port">Port</Label>
                                <Input id="ftp-port" type="number" placeholder="21" value={localFtp.port || ''} onChange={(e) => handleFtpChange('port', parseInt(e.target.value))} />
                            </div>
                        </div>
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="ftp-user">Utilisateur</Label>
                                <Input id="ftp-user" placeholder="ftpuser" value={localFtp.user || ''} onChange={(e) => handleFtpChange('user', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ftp-password">Mot de passe</Label>
                                <Input id="ftp-password" type="password" value={localFtp.password || ''} onChange={(e) => handleFtpChange('password', e.target.value)} />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="ftp-path">Chemin du dossier</Label>
                            <Input id="ftp-path" placeholder="/exports" value={localFtp.path || ''} onChange={(e) => handleFtpChange('path', e.target.value)} />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="ftp-secure" className="text-base">Connexion sécurisée (FTPS)</Label>
                                 <p className="text-sm text-muted-foreground">Utiliser le protocole FTP sur TLS.</p>
                            </div>
                            <Switch id="ftp-secure" checked={localFtp.secure || false} onCheckedChange={(checked) => handleFtpChange('secure', checked)} />
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleTestFtp} disabled={isTestingFtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>
                            {isTestingFtp ? 'Test en cours...' : 'Tester'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare />Configuration Twilio pour WhatsApp</CardTitle>
                        <CardDescription>
                            Paramètres pour l'envoi de messages via l'API Twilio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="twilio-sid">Account SID</Label>
                                <Input id="twilio-sid" placeholder="AC..." value={localTwilio.accountSid || ''} onChange={(e) => handleTwilioChange('accountSid', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="twilio-token">Auth Token</Label>
                                <Input id="twilio-token" type="password" value={localTwilio.authToken || ''} onChange={(e) => handleTwilioChange('authToken', e.target.value)} />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="twilio-from">Numéro d'expédition Twilio (WhatsApp)</Label>
                            <Input id="twilio-from" placeholder="+14155238886" value={localTwilio.from || ''} onChange={(e) => handleTwilioChange('from', e.target.value)} />
                        </div>
                        <div className="p-4 border-l-4 border-amber-400 bg-amber-50">
                            <p className="text-sm text-amber-800">Assurez-vous que votre numéro d'expéditeur est préfixé par "whatsapp:" lors de l'envoi (ex: <span className="font-mono">whatsapp:+14155238886</span>). Le numéro que vous enregistrez ici ne doit comporter que le signe + et les chiffres.</p>
                        </div>
                    </CardContent>
                     <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
                        <div className="flex-1 flex items-center gap-2">
                            <Input placeholder="Numéro de test (ex: +336...)" value={twilioTestNumber} onChange={e => setTwilioTestNumber(e.target.value)} />
                             <Button variant="outline" onClick={handleTestTwilio} disabled={isTestingTwilio}>
                                <TestTube2 className="mr-2 h-4 w-4"/>
                                {isTestingTwilio ? 'Test...' : 'Tester'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
