

'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingCart, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useKeyboard } from '@/contexts/keyboard-context';
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

type SortKey = 'date' | 'total' | 'tableName' | 'customerName' | 'itemCount' | 'userName';
const ITEMS_PER_PAGE = 20;

const ClientFormattedDate = ({ date, showIcon }: { date: Date | Timestamp | undefined, showIcon?: boolean }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp).toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            // Attempt to parse if it's a string or number, though it shouldn't be
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, "d MMM yyyy 'à' HH:mm", { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date]);

    return (
        <span className="flex items-center gap-1.5">
            {showIcon && <Edit className="h-3 w-3 text-muted-foreground" />}
            {formattedDate}
        </span>
    );
}


export default function ReportsPage() {
    const { sales: allSales, customers, users, isLoading: isPosLoading, deleteAllSales } = usePos();
    const { user } = useUser();
    const isCashier = user?.role === 'cashier';
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (isCashier) {
            router.push('/dashboard');
        }
    }, [isCashier, router]);

    const isLoading = isPosLoading;

    const [isClient, setIsClient] = useState(false);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    
    // Filtering state
    const [filterCustomerName, setFilterCustomerName] = useState('');
    const [filterOrigin, setFilterOrigin] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [filterArticleRef, setFilterArticleRef] = useState('');
    const [generalFilter, setGeneralFilter] = useState(searchParams.get('filter') === 'Fact-' ? 'Fact-' : '');
    const [isSummaryOpen, setSummaryOpen] = useState(false);
    const [isFiltersOpen, setFiltersOpen] = useState(false);
    const [filterSellerName, setFilterSellerName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);
    const customerNameFilterRef = useRef<HTMLInputElement>(null);
    const sellerNameFilterRef = useRef<HTMLInputElement>(null);
    const originFilterRef = useRef<HTMLInputElement>(null);
    const articleRefFilterRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (targetInput?.name === 'reports-general-filter') setGeneralFilter(inputValue);
        if (targetInput?.name === 'reports-customer-filter') setFilterCustomerName(inputValue);
        if (targetInput?.name === 'reports-seller-filter') setFilterSellerName(inputValue);
        if (targetInput?.name === 'reports-origin-filter') setFilterOrigin(inputValue);
        if (targetInput?.name === 'reports-article-filter') setFilterArticleRef(inputValue);
    }, [inputValue, targetInput]);

    const getCustomerName = useCallback((customerId?: string) => {
        if (!customerId || !customers) return 'Client au comptoir';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }, [customers]);
    
    const getUserName = useCallback((userId?: string, fallbackName?: string) => {
        if (!userId) return fallbackName || 'N/A';
        if (!users) return fallbackName || 'Chargement...';
        const saleUser = users.find(u => u.id === userId);
        if (saleUser?.firstName && saleUser?.lastName) {
            return `${saleUser.firstName} ${saleUser.lastName.charAt(0)}.`;
        }
        return fallbackName || saleUser?.email || 'Utilisateur supprimé';
    }, [users]);


    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];

        // Apply filters
        let filteredSales = allSales.filter(sale => {
            const customerName = getCustomerName(sale.customerId);
            const customerMatch = !filterCustomerName || (customerName && customerName.toLowerCase().includes(filterCustomerName.toLowerCase()));
            const originMatch = !filterOrigin || (sale.tableName && sale.tableName.toLowerCase().includes(filterOrigin.toLowerCase()));
            const statusMatch = filterStatus === 'all' || (sale.status === filterStatus);
            const articleRefMatch = !filterArticleRef || sale.items.some(item => (item.name.toLowerCase().includes(filterArticleRef.toLowerCase())) || (item.barcode && item.barcode.toLowerCase().includes(filterArticleRef.toLowerCase())));
            
            const saleSellerName = getUserName(sale.userId, sale.userName);
            const sellerMatch = !filterSellerName || (saleSellerName && saleSellerName.toLowerCase().includes(filterSellerName.toLowerCase()));
            
            let dateMatch = true;
            if (dateRange?.from) {
                const saleDate = (sale.date as Timestamp)?.toDate ? (sale.date as Timestamp).toDate() : new Date(sale.date);
                dateMatch = saleDate >= startOfDay(dateRange.from);
            }
            if (dateRange?.to) {
                 const saleDate = (sale.date as Timestamp)?.toDate ? (sale.date as Timestamp).toDate() : new Date(sale.date);
                dateMatch = dateMatch && saleDate <= endOfDay(dateRange.to);
            }

            const generalMatch = !generalFilter || (
                (sale.ticketNumber && sale.ticketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
                sale.items.some(item => {
                    const lowerGeneralFilter = generalFilter.toLowerCase();
                    const nameMatch = item.name.toLowerCase().includes(lowerGeneralFilter);
                    const noteMatch = item.note?.toLowerCase().includes(lowerGeneralFilter);
                    const serialMatch = item.serialNumbers?.some(sn => sn.toLowerCase().includes(lowerGeneralFilter));
                    const variantMatch = item.selectedVariants?.some(v => `${v.name.toLowerCase()}: ${v.value.toLowerCase()}`.includes(lowerGeneralFilter));
                    return nameMatch || noteMatch || serialMatch || variantMatch;
                })
            );

            return customerMatch && originMatch && statusMatch && dateMatch && articleRefMatch && sellerMatch && generalMatch;
        });

        // Apply sorting
        if (sortConfig !== null) {
            filteredSales.sort((a, b) => {
                let aValue: string | number, bValue: string | number;
                
                switch (sortConfig.key) {
                    case 'date':
                        const aDate = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
                        const bDate = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
                        aValue = bDate.getTime(); // Invert for descending by default
                        bValue = aDate.getTime();
                        break;
                    case 'tableName':
                        aValue = a.tableName || '';
                        bValue = b.tableName || '';
                        break;
                    case 'customerName':
                        aValue = getCustomerName(a.customerId);
                        bValue = getCustomerName(b.customerId);
                        break;
                    case 'itemCount':
                        aValue = a.items.reduce((acc, item) => acc + item.quantity, 0);
                        bValue = b.items.reduce((acc, item) => acc + item.quantity, 0);
                        break;
                    case 'userName':
                        aValue = getUserName(a.userId, a.userName);
                        bValue = getUserName(b.userId, b.userName);
                        break;
                    default:
                        aValue = a[sortConfig.key as keyof Sale] || 0;
                        bValue = b[sortConfig.key as keyof Sale] || 0;
                        break;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredSales;
    }, [allSales, customers, users, sortConfig, filterCustomerName, filterOrigin, filterStatus, dateRange, filterArticleRef, filterSellerName, generalFilter, getCustomerName, getUserName]);

    const totalPages = Math.ceil(filteredAndSortedSales.length / ITEMS_PER_PAGE);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedSales, currentPage]);


     const summaryStats = useMemo(() => {
        const totalRevenue = filteredAndSortedSales.reduce((acc, sale) => acc + sale.total, 0);
        const totalSales = filteredAndSortedSales.length;
        const averageBasket = totalSales > 0 ? totalRevenue / totalSales : 0;
        const totalItemsSold = filteredAndSortedSales.reduce((acc, sale) => acc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);

        return {
            totalRevenue,
            totalSales,
            averageBasket,
            totalItemsSold
        }
    }, [filteredAndSortedSales]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            return setSortConfig({ key: 'date', direction: 'desc' }); // Default sort
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        }
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    }

    const resetFilters = () => {
        setFilterCustomerName('');
        setFilterOrigin('');
        setFilterStatus('all');
        setDateRange(undefined);
        setFilterArticleRef('');
        setFilterSellerName('');
        setGeneralFilter('');
        setCurrentPage(1);
    }

    const PaymentBadges = ({ sale }: { sale: Sale }) => (
        <div className="flex flex-wrap gap-1">
            {!sale.payments || sale.payments.length === 0 ? (
            <Badge variant="destructive" className="font-normal">En attente</Badge>
            ) : (
            <>
                {sale.payments.map((p, index) => (
                <Badge key={index} variant="outline" className="capitalize font-normal">
                    {p.method.name}: <span className="font-semibold ml-1">{p.amount.toFixed(2)}€</span>
                </Badge>
                ))}
                {sale.change && sale.change > 0 && (
                <Badge variant="secondary" className="font-normal bg-amber-200 text-amber-800">
                    Rendu: <span className="font-semibold ml-1">{sale.change.toFixed(2)}€</span>
                </Badge>
                )}
            </>
            )}
        </div>
    );

    if (isCashier) {
        return (
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader title="Accès non autorisé" />
                <Alert variant="destructive" className="mt-4">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports des pièces"
        subtitle={isClient && filteredAndSortedSales ? `Page ${currentPage} sur ${totalPages} (${filteredAndSortedSales.length} pièces sur ${allSales?.length || 0} au total)` : "Analysez vos performances."}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
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
              <AlertDialogAction onClick={deleteAllSales} className="bg-destructive hover:bg-destructive/90">
                Oui, supprimer les ventes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!isCashier && (
            <Button asChild>
                <Link href="/reports/popular-items">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Voir les articles populaires
                </Link>
            </Button>
        )}
      </PageHeader>
      <div className="mt-8 space-y-4">
        <Collapsible open={isSummaryOpen} onOpenChange={setSummaryOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2 mb-2 -ml-2 text-lg font-semibold">
                    <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isSummaryOpen && "-rotate-90")} />
                    Résumé de la sélection
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalRevenue.toFixed(2)}€</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nombre de pièces</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{summaryStats.totalSales}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                             <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.averageBasket.toFixed(2)}€</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Articles vendus</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalItemsSold}</div>
                        </CardContent>
                    </Card>
                </div>
            </CollapsibleContent>
        </Collapsible>
        
        <Card>
             <CardHeader>
                 <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                    <div className="relative">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isFiltersOpen && "-rotate-90")} />
                               Filtres
                            </Button>
                        </CollapsibleTrigger>
                         <div className="absolute top-0 right-0">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={resetFilters}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Réinitialiser les filtres</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <CollapsibleContent>
                        <div className="pt-4 pb-2 flex items-center gap-2 flex-wrap">
                            <Input
                                ref={generalFilterRef}
                                placeholder="Rechercher (N°, article, note...)"
                                value={generalFilter}
                                onChange={(e) => setGeneralFilter(e.target.value)}
                                className="max-w-sm"
                                onFocus={() => setTargetInput({ value: generalFilter, name: 'reports-general-filter', ref: generalFilterRef })}
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                        ) : (
                                        <span>Choisir une période</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Input
                                ref={customerNameFilterRef}
                                placeholder="Filtrer par client..."
                                value={filterCustomerName}
                                onChange={(e) => setFilterCustomerName(e.target.value)}
                                className="max-w-xs"
                                onFocus={() => setTargetInput({ value: filterCustomerName, name: 'reports-customer-filter', ref: customerNameFilterRef })}
                            />

                            <Input
                                ref={sellerNameFilterRef}
                                placeholder="Filtrer par vendeur..."
                                value={filterSellerName}
                                onChange={(e) => setFilterSellerName(e.target.value)}
                                className="max-w-xs"
                                onFocus={() => setTargetInput({ value: filterSellerName, name: 'reports-seller-filter', ref: sellerNameFilterRef })}
                            />

                            <Input
                                ref={originFilterRef}
                                placeholder="Filtrer par origine..."
                                value={filterOrigin}
                                onChange={(e) => setFilterOrigin(e.target.value)}
                                className="max-w-xs"
                                onFocus={() => setTargetInput({ value: filterOrigin, name: 'reports-origin-filter', ref: originFilterRef })}
                            />

                            <Input
                                ref={articleRefFilterRef}
                                placeholder="Rechercher par article/référence..."
                                value={filterArticleRef}
                                onChange={(e) => setFilterArticleRef(e.target.value)}
                                className="max-w-xs"
                                onFocus={() => setTargetInput({ value: filterArticleRef, name: 'reports-article-filter', ref: articleRefFilterRef })}
                            />

                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Statut de paiement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="paid">Payé</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
             </CardHeader>
            <CardContent>
                <div className="flex items-center justify-end gap-2 mb-4">
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} / {totalPages}
                    </span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>
                               <Button variant="ghost" onClick={() => requestSort('date')}>
                                    Date {getSortIcon('date')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('userName')}>
                                    Vendeur {getSortIcon('userName')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('tableName')}>
                                    Origine {getSortIcon('tableName')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('customerName')}>
                                    Client {getSortIcon('customerName')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('itemCount')}>
                                    Articles {getSortIcon('itemCount')}
                                </Button>
                            </TableHead>
                            <TableHead>Paiement</TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => requestSort('total')} className="justify-end w-full">
                                    Total (TTC) {getSortIcon('total')}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length: 10}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && paginatedSales && paginatedSales.map(sale => {
                            const sellerName = getUserName(sale.userId, sale.userName);
                            const pieceType = sale.ticketNumber?.startsWith('Fact-') ? 'Facture' : 'Ticket';
                            return (
                                <TableRow key={sale.id}>
                                     <TableCell className="font-mono text-muted-foreground text-xs">
                                        <Badge variant={pieceType === 'Facture' ? 'outline' : 'secondary'}>{sale.ticketNumber}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <ClientFormattedDate date={sale.date} showIcon={!!sale.modifiedAt} />
                                    </TableCell>
                                    <TableCell>
                                        {sellerName}
                                    </TableCell>
                                    <TableCell>
                                        {sale.tableName ? <Badge variant="outline">{sale.tableName}</Badge> : "Vente directe"}
                                    </TableCell>
                                    <TableCell>
                                        {getCustomerName(sale.customerId)}
                                    </TableCell>
                                    <TableCell>
                                        {sale.items.reduce((acc, item) => acc + item.quantity, 0)}
                                    </TableCell>
                                    <TableCell>
                                         <PaymentBadges sale={sale} />
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{sale.total.toFixed(2)}€</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/reports/${sale.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
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
