

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AuditLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { Timestamp } from 'firebase/firestore';

const ITEMS_PER_PAGE = 20;

const ClientFormattedDate = ({ date }: { date: Date | Timestamp | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp)?.toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, "d MMM yyyy, HH:mm:ss", { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date]);

    return <>{formattedDate}</>;
}

export default function AuditLogPage() {
    const router = useRouter();
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // This is a mock implementation. Replace with actual data fetching.
    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            const logs: AuditLog[] = [
                // Mock data - in a real app this would come from Firestore
            ];
            setAuditLogs(logs.sort((a,b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime()));
            setIsLoading(false);
        }, 1000);
    }, []);

    const totalPages = Math.ceil(auditLogs.length / ITEMS_PER_PAGE);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return auditLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [auditLogs, currentPage]);

    return (
        <>
            <PageHeader
                title="Historique des Opérations"
                subtitle="Journal des événements importants sur les pièces commerciales."
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => router.refresh()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" className="btn-back">
                        <Link href="/settings">
                            <ArrowLeft />
                            Retour aux paramètres
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            <div className="mt-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-end gap-2 mb-4">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                                Page {currentPage} / {totalPages || 1}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Pièce</TableHead>
                                    <TableHead>Détails</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                                    </TableRow>
                                )) : null}
                                {!isLoading && paginatedLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap"><ClientFormattedDate date={log.date} /></TableCell>
                                        <TableCell className="font-medium">{log.userName}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                log.action === 'create' ? 'default' :
                                                log.action === 'transform' ? 'secondary' :
                                                log.action === 'delete' ? 'destructive' :
                                                'outline'
                                            } className="capitalize">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/reports/${log.documentId}`} className="text-blue-600 hover:underline">
                                                {log.documentNumber}
                                            </Link>
                                            <span className="text-xs text-muted-foreground ml-2">({log.documentType})</span>
                                        </TableCell>
                                        <TableCell>{log.details}</TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && paginatedLogs.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Aucun historique à afficher pour le moment.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
