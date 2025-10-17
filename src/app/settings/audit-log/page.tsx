
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AuditLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ArrowRight, X, Calendar as CalendarIcon, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { Timestamp } from 'firebase/firestore';
import { usePos } from '@/contexts/pos-context';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

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
    const { auditLogs, isLoading } = usePos();
    
    const [filterUser, setFilterUser] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDocType, setFilterDocType] = useState('');
    const [filterDocNumber, setFilterDocNumber] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);

    const sortedLogs = useMemo(() => {
        if (!auditLogs || !Array.isArray(auditLogs)) {
            return [];
        }
        
        const filtered = auditLogs.filter(log => {
            const userMatch = !filterUser || log.userName.toLowerCase().includes(filterUser.toLowerCase());
            const actionMatch = filterAction === 'all' || log.action === filterAction;
            const docTypeMatch = !filterDocType || log.documentType.toLowerCase().includes(filterDocType.toLowerCase());
            const docNumberMatch = !filterDocNumber || log.documentNumber.toLowerCase().includes(filterDocNumber.toLowerCase());

            let dateMatch = true;
            const logDate = log.date instanceof Date ? log.date : (log.date as Timestamp).toDate();
            if (dateRange?.from) dateMatch = logDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && logDate <= endOfDay(dateRange.to);

            return userMatch && actionMatch && docTypeMatch && docNumberMatch && dateMatch;
        });

        return filtered.sort((a,b) => {
            const dateA = a.date instanceof Date ? a.date : (a.date as Timestamp).toDate();
            const dateB = b.date instanceof Date ? b.date : (b.date as Timestamp).toDate();
            return dateB.getTime() - dateA.getTime();
        });
    }, [auditLogs, filterUser, filterAction, filterDocType, filterDocNumber, dateRange]);
    
    const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedLogs, currentPage]);

    const resetFilters = () => {
        setFilterUser('');
        setFilterAction('all');
        setFilterDocType('');
        setFilterDocNumber('');
        setDateRange(undefined);
        setCurrentPage(1);
    }

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
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
                    <Card className="mb-4">
                        <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        Filtres
                                        <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isFiltersOpen && "rotate-180")} />
                                    </Button>
                                </CollapsibleTrigger>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                                        <X className="mr-2 h-4 w-4" />Réinitialiser
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ArrowLeft className="h-4 w-4" /></Button>
                                        <div className="text-xs font-medium text-muted-foreground min-w-[70px] text-center px-1">Page {currentPage} / {totalPages || 1}</div>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}><ArrowRight className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CollapsibleContent>
                             <CardContent className="flex items-center gap-2 flex-wrap pt-0">
                                <Input placeholder="Filtrer par utilisateur..." value={filterUser} onChange={e => setFilterUser(e.target.value)} className="max-w-xs h-9" />
                                <Select value={filterAction} onValueChange={setFilterAction}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les actions</SelectItem><SelectItem value="create">Création</SelectItem><SelectItem value="update">Mise à jour</SelectItem><SelectItem value="delete">Suppression</SelectItem><SelectItem value="transform">Transformation</SelectItem></SelectContent></Select>
                                <Input placeholder="Filtrer par type de pièce..." value={filterDocType} onChange={e => setFilterDocType(e.target.value)} className="max-w-xs h-9" />
                                <Input placeholder="Filtrer par numéro..." value={filterDocNumber} onChange={e => setFilterDocNumber(e.target.value)} className="max-w-xs h-9" />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                                </Popover>
                             </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
                <Card>
                    <CardContent className="pt-6">
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
                                            <Link href={`/reports/${log.documentId}?from=audit-log`} className="text-blue-600 hover:underline">
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
                                            Aucun historique à afficher pour les filtres sélectionnés.
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
