
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
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingCart, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, FileCog } from 'lucide-react';
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

type SortKey = 'date' | 'total' | 'tableName' | 'customerName' | 'itemCount' | 'userName' | 'ticketNumber';
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
        } else if (date && typeof (date as Timestamp)?.toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
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

const getDateFromSale = (sale: Sale): Date => {
    if (!sale.date) return new Date(0);
    if (sale.date instanceof Date) return sale.date;
    if (typeof (sale.date as Timestamp)?.toDate === 'function') {
        return (sale.date as Timestamp).toDate();
    }
    const d = new Date(sale.date as any);
    return isNaN(d.getTime()) ? new Date(0) : d;
};


export default function ReportsPage() {
    const { sales: allSales, customers, users, isLoading: isPosLoading, deleteAllSales, convertToInvoice } = usePos();
    const { user } = useUser();
    const isCashier = user?.role === 'cashier';
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const initialFilter = searchParams.get('filter');
    const initialStatusFilter = searchParams.get('filterStatus');
    const dateFilterParam = searchParams.get('date');


    const [isDateFilterLocked, setIsDateFilterLocked] = useState(!!dateFilterParam);

    useEffect(() => {
        if (isCashier) {
            router.push('/dashboard');
        }
    }, [isCashier, router]);

    const isLoading = isPosLoading;

    const [isClient, setIsClient] = useState(false);
    
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    
    const [filterCustomerName, setFilterCustomerName] = useState('');
    const [filterOrigin, setFilterOrigin] = useState('');
    const [filterStatus, setFilterStatus] = useState(initialStatusFilter || 'all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (dateFilterParam) {
            const date = parseISO(dateFilterParam);
            return { from: date, to: date };
        }
        return undefined;
    });
    const [filterArticleRef, setFilterArticleRef] = useState('');
    const [generalFilter, setGeneralFilter] = useState(initialFilter || '');
    const [isSummaryOpen, setSummaryOpen] = useState(false);
    const [isFiltersOpen, setFiltersOpen] = useState(!!dateFilterParam || !!initialStatusFilter);
    const [filterSellerName, setFilterSellerName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [saleToConvert, setSaleToConvert] = useState<Sale | null>(null);

    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);
    const customerNameFilterRef = useRef<HTMLInputElement>(null);
    const sellerNameFilterRef = useRef<HTMLInputElement>(null);
    const originFilterRef = useRef<HTMLInputElement>(null);
    const articleRefFilterRef = useRef<HTMLInputElement>(null);
    
    const isContextualFilterActive = !!initialFilter;

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

    const handleEdit = useCallback((sale: Sale) => {
      const typeMap: Record<string, string> = {
          'quote': 'quotes',
          'delivery_note': 'delivery-notes',
          'supplier_order': 'supplier-orders',
          'invoice': 'invoices',
      };
      
      const docType = sale.documentType || (sale.ticketNumber?.startsWith('Fact-') ? 'invoice' : 'ticket');
      const pathSegment = typeMap[docType] || 'invoices';
      
      if(docType === 'ticket') {
          // Cannot edit tickets directly, they must be recalled.
          toast({ variant: 'destructive', title: 'Action non autorisée', description: 'Les tickets ne peuvent pas être modifiés, seulement dupliqués ou visualisés.'});
          return;
      }
      
      router.push(`/commercial/${pathSegment}?edit=${sale.id}`);
    }, [router, toast]);


    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];

        // Apply filters
        let filteredSales = allSales.filter(sale => {
            const customerName = getCustomerName(sale.customerId);
            const customerMatch = !filterCustomerName || (customerName && customerName.toLowerCase().includes(filterCustomerName.toLowerCase()));
            const originMatch = !filterOrigin || (sale.tableName && sale.tableName.toLowerCase().includes(filterOrigin.toLowerCase()));
            
            const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
            
            let statusMatch = true;
            if (filterStatus !== 'all') {
                if (filterStatus === 'paid') statusMatch = sale.status === 'paid';
                else if (filterStatus === 'pending') statusMatch = sale.status === 'pending' && totalPaid === 0;
                else if (filterStatus === 'partial') statusMatch = sale.status === 'pending' && totalPaid > 0 && totalPaid < sale.total;
                else statusMatch = sale.status === filterStatus;
            }

            const articleRefMatch = !filterArticleRef || (Array.isArray(sale.items) && sale.items.some(item => (item.name.toLowerCase().includes(filterArticleRef.toLowerCase())) || (item.barcode && item.barcode.toLowerCase().includes(filterArticleRef.toLowerCase()))));
            
            const saleSellerName = getUserName(sale.userId, sale.userName);
            const sellerMatch = !filterSellerName || (saleSellerName && saleSellerName.toLowerCase().includes(filterSellerName.toLowerCase()));
            
            let dateMatch = true;
            if (dateRange?.from) {
                const saleDate = getDateFromSale(sale);
                dateMatch = saleDate >= startOfDay(dateRange.from);
            }
            if (dateRange?.to) {
                 const saleDate = getDateFromSale(sale);
                dateMatch = dateMatch && saleDate <= endOfDay(dateRange.to);
            }

            const generalMatch = !generalFilter || (
                (sale.ticketNumber && sale.ticketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (Array.isArray(sale.items) && sale.items.some(item => {
                    const lowerGeneralFilter = generalFilter.toLowerCase();
                    const nameMatch = item.name.toLowerCase().includes(lowerGeneralFilter);
                    const noteMatch = item.note?.toLowerCase().includes(lowerGeneralFilter);
                    const serialMatch = item.serialNumbers?.some(sn => sn.toLowerCase().includes(lowerGeneralFilter));
                    const variantMatch = item.selectedVariants?.some(v => `${v.name.toLowerCase()}: ${v.value.toLowerCase()}`.includes(lowerGeneralFilter));
                    return nameMatch || noteMatch || serialMatch || variantMatch;
                }))
            );

            return customerMatch && originMatch && statusMatch && dateMatch && articleRefMatch && sellerMatch && generalMatch;
        });

        // Apply sorting
        if (sortConfig !== null) {
            filteredSales.sort((a, b) => {
                let aValue: string | number | Date, bValue: string | number | Date;
                
                switch (sortConfig.key) {
                    case 'date':
                        aValue = getDateFromSale(a);
                        bValue = getDateFromSale(b);
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
                        aValue = Array.isArray(a.items) ? a.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                        bValue = Array.isArray(b.items) ? b.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                        break;
                    case 'userName':
                        aValue = getUserName(a.userId, a.userName);
                        bValue = getUserName(b.userId, b.userName);
                        break;
                    case 'ticketNumber':
                        aValue = a.ticketNumber || '';
                        bValue = b.ticketNumber || '';
                        break;
                    default:
                        aValue = a[sortConfig.key as keyof Sale] as number || 0;
                        bValue = b[sortConfig.key as keyof Sale] as number || 0;
                        break;
                }
                
                if (aValue instanceof Date && bValue instanceof Date) {
                    return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
                }

                if(typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
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
        const relevantSales = filteredAndSortedSales.filter(sale => sale.ticketNumber?.startsWith('Fact-') || sale.ticketNumber?.startsWith('Tick-'));
        const totalRevenue = relevantSales.reduce((acc, sale) => acc + sale.total, 0);
        const totalSales = relevantSales.length;
        const averageBasket = totalSales > 0 ? totalRevenue / totalSales : 0;
        const totalItemsSold = relevantSales.reduce((acc, sale) => acc + (Array.isArray(sale.items) ? sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0) : 0), 0);

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
        if (isContextualFilterActive || isDateFilterLocked) return;
        setFilterCustomerName('');
        setFilterOrigin('');
        setFilterStatus('all');
        setDateRange(undefined);
        setFilterArticleRef('');
        setFilterSellerName('');
        setGeneralFilter('');
        setCurrentPage(1);
    }
    
    const PaymentBadges = ({ sale }: { sale: Sale }) => {
        const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);

        if (sale.status === 'invoiced') {
            return <Badge variant="outline">Facturé</Badge>;
        }
        if (sale.status === 'paid') {
            return (
                <div className="flex flex-wrap gap-1">
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
                </div>
            );
        }

        if (totalPaid > 0) {
            const remaining = sale.total - totalPaid;
            return (
                <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="font-normal bg-orange-500 text-white">Partiel</Badge>
                    <span className="text-xs text-muted-foreground font-semibold">({remaining.toFixed(2)}€ restants)</span>
                </div>
            )
        }

        return <Badge variant="destructive" className="font-normal">En attente</Badge>;
    };

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
    
    const renderHeaderActions = () => {
      if (initialFilter?.startsWith('Fact-')) {
          return (
              <Button asChild>
                  <Link href="/commercial/invoices">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Nouvelle facture
                  </Link>
              </Button>
          )
      }
      if (initialFilter?.startsWith('Devis-')) {
          return (
               <Button asChild>
                  <Link href="/commercial/quotes">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Nouveau devis
                  </Link>
              </Button>
          )
      }
      if (initialFilter?.startsWith('BL-')) {
          return (
              <Button asChild>
                  <Link href="/commercial/delivery-notes">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Nouveau BL
                  </Link>
              </Button>
          )
      }
      return (
           <Button asChild>
              <Link href="/reports/popular-items">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Voir les articles populaires
              </Link>
          </Button>
      )
    }

  return (
    <>
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports des pièces"
        subtitle={isClient && filteredAndSortedSales ? `Page ${currentPage} sur ${totalPages} (${filteredAndSortedSales.length} pièces sur ${allSales?.length || 0} au total)` : "Analysez vos performances."}
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
                <RefreshCw className="h-4 w-4" />
            </Button>
            {!isCashier && renderHeaderActions()}
        </div>
      </PageHeader>
      <div className="mt-8 space-y-4">
        <Collapsible open={isSummaryOpen} onOpenChange={setSummaryOpen} className="mb-4">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                    <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isSummaryOpen && "-rotate-90")} />
                    Résumé de la sélection
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chiffre d'affaires (Factures/Tickets)</CardTitle>
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
        
        <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen} asChild>
            <Card>
                <CardHeader>
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
                                        <Button variant="ghost" size="sm" onClick={resetFilters} disabled={isContextualFilterActive || isDateFilterLocked}>
                                            <X className="mr-2 h-4 w-4"/>Réinitialiser
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Réinitialiser les filtres</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </CardHeader>
                <CollapsibleContent asChild>
                    <CardContent>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Input
                                ref={generalFilterRef}
                                placeholder="Rechercher (N°, article, note...)"
                                value={generalFilter}
                                onChange={(e) => setGeneralFilter(e.target.value)}
                                className="max-w-sm"
                                onFocus={() => setTargetInput({ value: generalFilter, name: 'reports-general-filter', ref: generalFilterRef })}
                                disabled={isContextualFilterActive}
                            />
                            <Popover>
                                <PopoverTrigger asChild disabled={isDateFilterLocked}>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive"/>}
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
                                    <SelectItem value="invoiced">Facturé</SelectItem>
                                    <SelectItem value="partial">Partiellement payé</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
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
                    </div>
                    <div className="flex items-center gap-2">
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
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">
                                <Button variant="ghost" onClick={() => requestSort('ticketNumber')}>
                                    Type {getSortIcon('ticketNumber')}
                                </Button>
                            </TableHead>
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
                            <TableHead className="w-[80px] text-center">
                                <Button variant="ghost" onClick={() => requestSort('itemCount')}>
                                    Articles {getSortIcon('itemCount')}
                                </Button>
                            </TableHead>
                            <TableHead>Paiement</TableHead>
                            <TableHead className="text-right w-[120px]">
                                <Button variant="ghost" onClick={() => requestSort('total')} className="justify-end w-full">
                                    Total {getSortIcon('total')}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[150px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isClient && isLoading ? Array.from({length: 10}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        )) : null}
                        {isClient && !isLoading && paginatedSales && paginatedSales.map(sale => {
                            const sellerName = getUserName(sale.userId, sale.userName);
                            const pieceType = sale.documentType === 'invoice' ? 'Facture'
                                            : sale.documentType === 'quote' ? 'Devis'
                                            : sale.documentType === 'delivery_note' ? 'BL'
                                            : sale.documentType === 'supplier_order' ? 'Cde Fournisseur'
                                            : 'Ticket';
                            const canBeConverted = (sale.documentType === 'quote' || sale.documentType === 'delivery_note') && sale.status !== 'invoiced';
                            
                            const originalDoc = sale.originalSaleId ? allSales.find(s => s.id === sale.originalSaleId) : null;
                            const originText = originalDoc ? `${originalDoc.documentType === 'quote' ? 'Devis' : 'BL'} #${originalDoc.ticketNumber}` : 'Vente directe';

                            return (
                                <TableRow key={sale.id}>
                                     <TableCell>
                                        <Badge variant={pieceType === 'Facture' ? 'outline' : pieceType === 'Ticket' ? 'secondary' : 'default'}>{pieceType}</Badge>
                                    </TableCell>
                                     <TableCell className="font-mono text-muted-foreground text-xs">
                                        {sale.ticketNumber}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <ClientFormattedDate date={sale.date} showIcon={!!sale.modifiedAt} />
                                    </TableCell>
                                    <TableCell>
                                        {sellerName}
                                    </TableCell>
                                    <TableCell>
                                        {sale.tableName ? <Badge variant="outline">{sale.tableName}</Badge> : originText}
                                    </TableCell>
                                    <TableCell>
                                        {getCustomerName(sale.customerId)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {Array.isArray(sale.items) ? sale.items.reduce((acc, item) => acc + item.quantity, 0) : 0}
                                    </TableCell>
                                    <TableCell>
                                         <PaymentBadges sale={sale} />
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{(sale.total || 0).toFixed(2)}€</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            {canBeConverted && (
                                                <Button variant="ghost" size="icon" onClick={() => { setSaleToConvert(sale); setConfirmOpen(true); }}>
                                                    <FileCog className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button asChild variant="ghost" size="icon">
                                                <Link href={`/reports/${sale.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
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
    <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la transformation ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Voulez-vous vraiment transformer cette pièce en facture ? Une nouvelle facture sera créée.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (saleToConvert) {
                        convertToInvoice(saleToConvert.id);
                    }
                    setConfirmOpen(false);
                }}>
                    Confirmer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
