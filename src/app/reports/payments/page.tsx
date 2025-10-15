'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingCart, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, CreditCard, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import type { Timestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useKeyboard } from '@/contexts/keyboard-context';

type SortKey = 'date' | 'amount' | 'customerName' | 'ticketNumber' | 'methodName' | 'userName';
const ITEMS_PER_PAGE = 20;

const ClientFormattedDate = ({ date, saleDate }: { date: Date | Timestamp | undefined, saleDate: Date | Timestamp | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');
    const [isDeferred, setIsDeferred] = useState(false);

    useEffect(() => {
        if (!date || !saleDate) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        const toJsDate = (d: Date | Timestamp | string): Date => {
            if (d instanceof Date) return d;
            if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as any).toDate === 'function') {
                return (d as Timestamp).toDate();
            }
            const parsedDate = new Date(d as string);
            return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
        };
        const paymentJsDate = toJsDate(date);
        const saleJsDate = toJsDate(saleDate);

        if (paymentJsDate && !isNaN(paymentJsDate.getTime())) {
            setFormattedDate(format(paymentJsDate, "d MMM yyyy, HH:mm", { locale: fr }));
            setIsDeferred(!isSameDay(paymentJsDate, saleJsDate));
        } else {
            setFormattedDate('Date invalide');
            setIsDeferred(false);
        }
    }, [date, saleDate]);

    return (
      <span className="flex items-center gap-1.5">
          {isDeferred && <CalendarIcon className="h-3 w-3 text-amber-600" />}
          {formattedDate}
      </span>
    );
}

export default function PaymentsReportPage() {
    const { sales: allSales, customers, users, isLoading: isPosLoading, paymentMethods } = usePos();
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateFilterParam = searchParams.get('date');
    const [isDateFilterLocked, setIsDateFilterLocked] = useState(!!dateFilterParam);


    const [isClient, setIsClient] = useState(false);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    
    // Filtering state
    const [filterCustomerName, setFilterCustomerName] = useState('');
    const [filterMethodName, setFilterMethodName] = useState('all');
    const [filterDocType, setFilterDocType] = useState('all');
    const [filterPaymentType, setFilterPaymentType] = useState<'all' | 'immediate' | 'deferred'>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (dateFilterParam) {
            const date = parseISO(dateFilterParam);
            return { from: date, to: date };
        }
        return undefined;
    });
    const [generalFilter, setGeneralFilter] = useState('');
    const [isFiltersOpen, setFiltersOpen] = useState(!!dateFilterParam);
    const [filterSellerName, setFilterSellerName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);
    const customerNameFilterRef = useRef<HTMLInputElement>(null);
    const sellerNameFilterRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const allPayments = useMemo(() => {
        if (!allSales) return [];
        return allSales.flatMap(sale => 
            (sale.payments || []).map(payment => ({
                ...payment,
                saleId: sale.id,
                saleTicketNumber: sale.ticketNumber,
                saleDate: sale.date,
                customerId: sale.customerId,
                userId: sale.userId,
                userName: sale.userName
            }))
        );
    }, [allSales]);
    
    const getCustomerName = useCallback((customerId?: string) => {
        if (!customerId || !customers) return 'Client au comptoir';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }, [customers]);
    
    const getUserName = useCallback((userId?: string, fallbackName?: string) => {
        if (!userId) return fallbackName || 'N/A';
        if (!users) return fallbackName || 'Chargement...';
        const saleUser = users.find(u => u.id === userId);
        return saleUser ? `${saleUser.firstName} ${saleUser.lastName.charAt(0)}.` : (fallbackName || 'Utilisateur supprimé');
    }, [users]);
    

    const filteredAndSortedPayments = useMemo(() => {
        if (!allPayments) return [];

        let filtered = allPayments.filter(payment => {
            const customerName = getCustomerName(payment.customerId);
            const customerMatch = !filterCustomerName || (customerName && customerName.toLowerCase().includes(filterCustomerName.toLowerCase()));
            const methodMatch = filterMethodName === 'all' || (payment.method.name.toLowerCase().includes(filterMethodName.toLowerCase()));
            const sellerName = getUserName(payment.userId, payment.userName);
            const sellerMatch = !filterSellerName || (sellerName && sellerName.toLowerCase().includes(filterSellerName.toLowerCase()));
            
            const toJsDate = (d: Date | Timestamp | undefined | string): Date => {
                if (!d) return new Date(0);
                if (d instanceof Date) return d;
                if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as any).toDate === 'function') {
                    return (d as Timestamp).toDate();
                }
                const parsedDate = new Date(d as string);
                return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
            };
            const paymentJsDate = toJsDate(payment.date);
            const saleJsDate = toJsDate(payment.saleDate);

            let dateMatch = true;
            if (dateRange?.from) {
                dateMatch = paymentJsDate >= startOfDay(dateRange.from);
            }
            if (dateRange?.to) {
                dateMatch = dateMatch && paymentJsDate <= endOfDay(dateRange.to);
            }
            
            let paymentTypeMatch = true;
            if (filterPaymentType === 'deferred') {
                paymentTypeMatch = !isSameDay(paymentJsDate, saleJsDate);
            } else if (filterPaymentType === 'immediate') {
                paymentTypeMatch = isSameDay(paymentJsDate, saleJsDate);
            }
            
            let docTypeMatch = true;
            if (filterDocType !== 'all') {
                const prefixes = {
                    ticket: 'Tick-',
                    invoice: 'Fact-',
                    quote: 'Devis-',
                    delivery_note: 'BL-',
                };
                docTypeMatch = payment.saleTicketNumber?.startsWith(prefixes[filterDocType as keyof typeof prefixes]) || false;
            }

            const generalMatch = !generalFilter || (
                (payment.saleTicketNumber && payment.saleTicketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (customerName && customerName.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (sellerName && sellerName.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (payment.method.name.toLowerCase().includes(generalFilter.toLowerCase()))
            );

            return customerMatch && methodMatch && dateMatch && sellerMatch && generalMatch && paymentTypeMatch && docTypeMatch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                 let aValue: string | number | Date, bValue: string | number | Date;
                const toJsDateSafe = (d: Date | Timestamp | undefined | string): Date => {
                    if (!d) return new Date(0);
                    if (d instanceof Date) return d;
                    if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as any).toDate === 'function') return (d as Timestamp).toDate();
                    const parsedDate = new Date(d as string);
                    return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
                };
                switch (sortConfig.key) {
                    case 'date': aValue = toJsDateSafe(a.date); bValue = toJsDateSafe(b.date); break;
                    case 'amount': aValue = a.amount; bValue = b.amount; break;
                    case 'customerName': aValue = getCustomerName(a.customerId); bValue = getCustomerName(b.customerId); break;
                    case 'ticketNumber': aValue = a.saleTicketNumber || ''; bValue = b.saleTicketNumber || ''; break;
                    case 'methodName': aValue = a.method.name; bValue = b.method.name; break;
                    case 'userName': aValue = getUserName(a.userId, a.userName); bValue = getUserName(b.userId, b.userName); break;
                    default: aValue = 0; bValue = 0; break;
                }
                
                if (aValue instanceof Date && bValue instanceof Date) {
                    return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [allPayments, sortConfig, filterCustomerName, filterMethodName, filterPaymentType, dateRange, filterSellerName, generalFilter, filterDocType, getCustomerName, getUserName]);

    const totalPages = Math.ceil(filteredAndSortedPayments.length / ITEMS_PER_PAGE);

    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedPayments, currentPage]);

     const summaryStats = useMemo(() => {
        const totalRevenue = filteredAndSortedPayments.reduce((acc, p) => acc + p.amount, 0);
        const totalPayments = filteredAndSortedPayments.length;
        const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        return { totalRevenue, totalPayments, averagePayment };
    }, [filteredAndSortedPayments]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    }

    const resetFilters = () => {
        if (isDateFilterLocked) return;
        setFilterCustomerName('');
        setFilterMethodName('all');
        setFilterPaymentType('all');
        setFilterDocType('all');
        setDateRange(undefined);
        setFilterSellerName('');
        setGeneralFilter('');
        setCurrentPage(1);
    }
  
  if (!isClient || isPosLoading) {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader title="Rapport des Paiements" subtitle="Chargement des données..."/>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapport des Paiements"
        subtitle={`Page ${currentPage} sur ${totalPages} (${filteredAndSortedPayments.length} paiements sur ${allPayments.length} au total)`}
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}><RefreshCw className="h-4 w-4" /></Button>
            <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button asChild><Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" />Pièces de vente</Link></Button>
        </div>
      </PageHeader>
      <div className="mt-8 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenu Total (Factures/Tickets)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalRevenue.toFixed(2)}€</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nombre de Paiements</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">+{summaryStats.totalPayments}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Paiement Moyen</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.averagePayment.toFixed(2)}€</div></CardContent></Card>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen} asChild>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                            <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isFiltersOpen && "-rotate-90")} />Filtres
                        </Button>
                    </CollapsibleTrigger>
                    <Button variant="ghost" size="sm" onClick={resetFilters} disabled={isDateFilterLocked}><X className="mr-2 h-4 w-4"/>Réinitialiser</Button>
                </CardHeader>
                <CollapsibleContent asChild>
                    <CardContent className="flex items-center gap-2 flex-wrap">
                        <Input ref={generalFilterRef} placeholder="Recherche générale..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="max-w-sm" onFocus={() => setTargetInput({ value: generalFilter, name: 'reports-general-filter', ref: generalFilterRef })} />
                        <Popover>
                            <PopoverTrigger asChild disabled={isDateFilterLocked}>
                                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive" />}
                                    {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                        <Input ref={customerNameFilterRef} placeholder="Filtrer par client..." value={filterCustomerName} onChange={(e) => setFilterCustomerName(e.target.value)} className="max-w-xs" onFocus={() => setTargetInput({ value: filterCustomerName, name: 'reports-customer-filter', ref: customerNameFilterRef })}/>
                        <Input ref={sellerNameFilterRef} placeholder="Filtrer par vendeur..." value={filterSellerName} onChange={(e) => setFilterSellerName(e.target.value)} className="max-w-xs" onFocus={() => setTargetInput({ value: filterSellerName, name: 'reports-seller-filter', ref: sellerNameFilterRef })}/>
                        <Select value={filterMethodName} onValueChange={setFilterMethodName}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Type de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem>{paymentMethods && paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}</SelectContent></Select>
                        <Select value={filterPaymentType} onValueChange={(v) => setFilterPaymentType(v as any)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut du paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="immediate">Immédiat</SelectItem><SelectItem value="deferred">Différé</SelectItem></SelectContent></Select>
                        <Select value={filterDocType} onValueChange={setFilterDocType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Type de pièce" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les pièces</SelectItem>
                                <SelectItem value="ticket">Ticket</SelectItem>
                                <SelectItem value="invoice">Facture</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
        
        <Card>
            <CardHeader><div className="flex items-center justify-end"><div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ArrowLeft className="h-4 w-4" /></Button><span className="text-sm font-medium">Page {currentPage} / {totalPages || 1}</span><Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}><ArrowRight className="h-4 w-4" /></Button></div></div></CardHeader>
            <CardContent className="pt-0">
                <Table>
                    <TableHeader><TableRow><TableHead><Button variant="ghost" onClick={() => requestSort('date')}>Date Paiement {getSortIcon('date')}</Button></TableHead><TableHead><Button variant="ghost" onClick={() => requestSort('ticketNumber')}>Pièce {getSortIcon('ticketNumber')}</Button></TableHead><TableHead><Button variant="ghost" onClick={() => requestSort('methodName')}>Type {getSortIcon('methodName')}</Button></TableHead><TableHead><Button variant="ghost" onClick={() => requestSort('customerName')}>Client {getSortIcon('customerName')}</Button></TableHead><TableHead><Button variant="ghost" onClick={() => requestSort('userName')}>Vendeur {getSortIcon('userName')}</Button></TableHead><TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('amount')} className="justify-end w-full">Montant {getSortIcon('amount')}</Button></TableHead><TableHead className="w-[80px] text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {!paginatedPayments.length && <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucun paiement trouvé pour cette sélection.</TableCell></TableRow>}
                        {paginatedPayments.map((payment, index) => {
                            const customerName = getCustomerName(payment.customerId);
                            const sellerName = getUserName(payment.userId, payment.userName);
                            return (
                                <TableRow key={`${payment.saleId}-${index}`}>
                                    <TableCell className="font-medium"><ClientFormattedDate date={payment.date} saleDate={payment.saleDate} /></TableCell>
                                    <TableCell><Badge variant="secondary">{payment.saleTicketNumber}</Badge></TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{payment.method.name}</Badge></TableCell>
                                    <TableCell>{customerName}</TableCell>
                                    <TableCell>{sellerName}</TableCell>
                                    <TableCell className="text-right font-bold">{payment.amount.toFixed(2)}€</TableCell>
                                    <TableCell className="text-right"><Button asChild variant="ghost" size="icon"><Link href={`/reports/${payment.saleId}`}><Eye className="h-4 w-4" /></Link></Button></TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
