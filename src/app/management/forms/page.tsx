
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePos } from '@/contexts/pos-context';
import type { FormSubmission, Sale } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Eye, LayoutDashboard, RefreshCw, X, SlidersHorizontal, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormSubmissionDetailDialog } from './components/form-submission-detail-dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';

export default function FormSubmissionsPage() {
    const { formSubmissions, sales, items, customers, isLoading } = usePos();
    const router = useRouter();

    const [filterItemName, setFilterItemName] = useState('');
    const [filterCustomerName, setFilterCustomerName] = useState('');
    const [filterSaleId, setFilterSaleId] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const filteredSubmissions = useMemo(() => {
        return formSubmissions.filter(submission => {
            const sale = sales.find(s => s.items.some(i => i.formSubmissionId === submission.id));
            if (!sale) return false; // Should not happen

            const itemName = items.find(i => i.id === submission.orderItemId)?.name || '';
            const customerName = customers.find(c => c.id === sale.customerId)?.name || '';
            
            const itemMatch = !filterItemName || itemName.toLowerCase().includes(filterItemName.toLowerCase());
            const customerMatch = !filterCustomerName || customerName.toLowerCase().includes(filterCustomerName.toLowerCase());
            const saleMatch = !filterSaleId || sale.ticketNumber.toLowerCase().includes(filterSaleId.toLowerCase());

            let dateMatch = true;
            const subDate = new Date(submission.createdAt as any);
            if (dateRange?.from) dateMatch = subDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && subDate <= endOfDay(dateRange.to);

            return itemMatch && customerMatch && saleMatch && dateMatch;
        }).sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    }, [formSubmissions, sales, items, customers, filterItemName, filterCustomerName, filterSaleId, dateRange]);

    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const paginatedSubmissions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSubmissions, currentPage, itemsPerPage]);
    
    const handleViewDetails = (submission: FormSubmission) => {
        setSelectedSubmission(submission);
        setIsDetailOpen(true);
    };

    const resetFilters = () => {
        setFilterItemName('');
        setFilterCustomerName('');
        setFilterSaleId('');
        setDateRange(undefined);
    };

    return (
        <>
            <PageHeader title="Soumissions de Formulaires" subtitle={`Total de ${filteredSubmissions.length} formulaires trouvés`}>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="btn-back">
                        <Link href="/management/items">
                            <ArrowLeft />
                            Retour
                        </Link>
                    </Button>
                </div>
            </PageHeader>
            <div className="mt-8 space-y-4">
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
                    <Card>
                        <CardHeader className="p-4">
                             <div className="flex items-center justify-between">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
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
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="h-9 text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">
                                                    Page {currentPage} / {totalPages || 1}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="items-per-page-slider" className="text-sm">Lignes par page</Label>
                                                    <div className="flex justify-between items-center text-sm font-bold text-primary">
                                                        <span>{itemsPerPage}</span>
                                                    </div>
                                                    <Slider
                                                        id="items-per-page-slider"
                                                        value={[itemsPerPage]}
                                                        onValueChange={(v) => setItemsPerPage(v[0])}
                                                        min={5}
                                                        max={50}
                                                        step={5}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ArrowRight className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                             </div>
                        </CardHeader>
                        <CollapsibleContent>
                             <CardContent className="flex items-center gap-2 flex-wrap pt-0">
                                <Input placeholder="Filtrer par article..." value={filterItemName} onChange={e => setFilterItemName(e.target.value)} className="h-9 max-w-xs" />
                                <Input placeholder="Filtrer par client..." value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} className="h-9 max-w-xs" />
                                <Input placeholder="Filtrer par N° pièce..." value={filterSaleId} onChange={e => setFilterSaleId(e.target.value)} className="h-9 max-w-xs" />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
                                    <TableHead>Article</TableHead>
                                    <TableHead>Pièce</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                                    ))
                                ) : paginatedSubmissions.length > 0 ? (
                                    paginatedSubmissions.map(submission => {
                                        const sale = sales.find(s => s.items.some(i => i.formSubmissionId === submission.id));
                                        const item = items.find(i => i.id === submission.orderItemId);
                                        const customer = customers.find(c => c.id === sale?.customerId);
                                        return (
                                            <TableRow key={submission.id}>
                                                <TableCell><ClientFormattedDate date={submission.createdAt} formatString="d MMM yyyy, HH:mm"/></TableCell>
                                                <TableCell>{item?.name || 'Article supprimé'}</TableCell>
                                                <TableCell>
                                                    <Link href={`/reports/${sale?.id}?from=forms`} className="text-primary hover:underline">{sale?.ticketNumber || 'N/A'}</Link>
                                                </TableCell>
                                                <TableCell>{customer?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(submission)}>
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">Aucune soumission trouvée.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {selectedSubmission && (
                <FormSubmissionDetailDialog
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    submission={selectedSubmission}
                />
            )}
        </>
    );
}
