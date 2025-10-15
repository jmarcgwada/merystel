
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, Server, TestTube2 } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { SmtpConfig, FtpConfig } from '@/lib/types';

export default function ConnectivityPage() {
    const { smtpConfig, setSmtpConfig, ftpConfig, setFtpConfig } = usePos();
    const { toast } = useToast();

    const [localSmtp, setLocalSmtp] = useState<SmtpConfig>({});
    const [localFtp, setLocalFtp] = useState<FtpConfig>({});

    useEffect(() => {
        setLocalSmtp(smtpConfig || {});
        setLocalFtp(ftpConfig || {});
    }, [smtpConfig, ftpConfig]);

    const handleSmtpChange = (field: keyof SmtpConfig, value: any) => {
        setLocalSmtp(prev => ({ ...prev, [field]: value }));
    };

    const handleFtpChange = (field: keyof FtpConfig, value: any) => {
        setLocalFtp(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSmtp = () => {
        setSmtpConfig(localSmtp);
        toast({
            title: 'Configuration SMTP sauvegardée',
        });
    };
    
    const handleSaveFtp = () => {
        setFtpConfig(localFtp);
        toast({
            title: 'Configuration FTP sauvegardée',
        });
    };
    
    const handleTestSmtp = () => {
        toast({
            title: 'Test de connexion SMTP...',
            description: 'La fonctionnalité de test est en cours de développement.'
        });
        // In a real scenario, you would call a server-side function here.
    };

    const handleTestFtp = () => {
        toast({
            title: 'Test de connexion FTP...',
            description: 'La fonctionnalité de test est en cours de développement.'
        });
        // In a real scenario, you would call a server-side function here.
    };

    return (
        <>
            <PageHeader
                title="Connectivité"
                subtitle="Configurez les serveurs SMTP et FTP pour les e-mails et les fichiers."
            >
                <Button asChild variant="outline" className="btn-back">
                    <Link href="/settings">
                        <ArrowLeft />
                        Retour aux paramètres
                    </Link>
                </Button>
            </PageHeader>
            <div className="mt-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail />Configuration SMTP</CardTitle>
                        <CardDescription>
                            Paramètres pour l'envoi d'e-mails (factures, devis, etc.) depuis l'application.
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
                                <p className="text-sm text-muted-foreground">Recommandé pour la plupart des serveurs SMTP modernes.</p>
                            </div>
                            <Switch id="smtp-secure" checked={localSmtp.secure || false} onCheckedChange={(checked) => handleSmtpChange('secure', checked)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleTestSmtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>
                            Tester la connexion
                        </Button>
                        <Button onClick={handleSaveSmtp}>Sauvegarder</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Server />Configuration FTP</CardTitle>
                        <CardDescription>
                            Paramètres pour l'échange de fichiers (exports comptables, sauvegardes, etc.).
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
                        <Button variant="outline" onClick={handleTestFtp}>
                            <TestTube2 className="mr-2 h-4 w-4"/>
                            Tester la connexion
                        </Button>
                        <Button onClick={handleSaveFtp}>Sauvegarder</Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
