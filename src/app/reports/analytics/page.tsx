

'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowLeft, ArrowRight, LayoutDashboard, Calendar as CalendarIcon, DollarSign, User, ShoppingBag, ChevronDown, Scale, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';

type SalesLinesSortKey = 'saleDate' | 'ticketNumber' | 'name' | 'customerName' | 'userName' | 'quantity' | 'total';
type TopItemsSortKey = 'name' | 'quantity' | 'revenue';
type TopCustomersSortKey = 'name' | 'visits' | 'basketTotal' | 'revenue';

const ITEMS_PER_PAGE = 20;

const getDateFromSale = (sale: Sale): Date => {
    if (!sale.date) return new Date(0);
    if (sale.date instanceof Date) return sale.date;
    if (typeof (sale.date as Timestamp)?.toDate === 'function') {
        return (sale.date as Timestamp).toDate();
    }
    const d = new Date(sale.date as any);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

const documentTypes = {
    ticket: { label: 'Ticket', type: 'in' },
    invoice: { label: 'Facture', type: 'in' },
    credit_note: { label: 'Avoir', type: 'out' },
    supplier_order: { label: 'Cde Fournisseur', type: 'out' },
};


export default function AnalyticsPage() {
    const { 
        sales: allSales, 
        customers, 
        users, 
        items,
        isLoading, 
    } = usePos();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isClient, setIsClient] = useState(false);
    
    // Filtering state
    const [topN, setTopN] = useState(5);
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterItem, setFilterItem] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isTopItemsOpen, setIsTopItemsOpen] = useState(true);
    const [isTopCustomersOpen, setIsTopCustomersOpen] = useState(true);

    const [filterDocTypes, setFilterDocTypes] = useState<Record<string, boolean>>({
        ticket: true,
        invoice: true,
        credit_note: false,
        supplier_order: false,
    });
    
    const [salesLinesSortConfig, setSalesLinesSortConfig] = useState<{ key: SalesLinesSortKey, direction: 'asc' | 'desc' }>({ key: 'saleDate', direction: 'desc' });
    const [topItemsSortConfig, setTopItemsSortConfig] = useState<{ key: TopItemsSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
    const [topCustomersSortConfig, setTopCustomersSortConfig] = useState<{ key: TopCustomersSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const getCustomerName = useCallback((customerId?: string) => {
        if (!customerId || !customers) return 'N/A';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }, [customers]);
    
    const getUserName = useCallback((userId?: string, fallbackName?: string) => {
        if (!userId) return fallbackName || 'N/A';
        if (!users) return fallbackName || 'Chargement...';
        const saleUser = users.find(u => u.id === userId);
        return saleUser ? `${saleUser.firstName} ${saleUser.lastName.charAt(0)}.` : (fallbackName || 'Utilisateur supprimé');
    }, [users]);

    const handleDocTypeChange = (typeKey: string, checked: boolean) => {
        const typeInfo = documentTypes[typeKey as keyof typeof documentTypes];
        if (!typeInfo) return;

        setFilterDocTypes(prev => {
            const newState = { ...prev, [typeKey]: checked };
            if (checked && typeInfo.type) {
                for (const key in documentTypes) {
                    if (documentTypes[key as keyof typeof documentTypes].type && documentTypes[key as keyof typeof documentTypes].type !== typeInfo.type) {
                        newState[key] = false;
                    }
                }
            }
            return newState;
        });
    };

    const flattenedItems = useMemo(() => {
        if (!allSales) return [];
        return allSales
            .flatMap(sale => 
                sale.items.map(item => ({
                    ...item,
                    saleId: sale.id,
                    saleDate: getDateFromSale(sale),
                    ticketNumber: sale.ticketNumber,
                    documentType: sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice'),
                    customerId: sale.customerId,
                    customerName: getCustomerName(sale.customerId),
                    userId: sale.userId,
                    userName: getUserName(sale.userId, sale.userName),
                }))
            );
    }, [allSales, getCustomerName, getUserName]);


    const filteredItems = useMemo(() => {
        const activeDocTypes = Object.entries(filterDocTypes)
            .filter(([, isActive]) => isActive)
            .map(([type]) => type);

        return flattenedItems.filter(item => {
            const customerMatch = !filterCustomer || item.customerName.toLowerCase().includes(filterCustomer.toLowerCase());
            const itemMatch = !filterItem || item.name.toLowerCase().includes(filterItem.toLowerCase()) || (item.barcode && item.barcode.toLowerCase().includes(filterItem.toLowerCase()));
            const sellerMatch = !filterSeller || item.userName.toLowerCase().includes(filterSeller.toLowerCase());

            let dateMatch = true;
            if (dateRange?.from) dateMatch = item.saleDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && item.saleDate <= endOfDay(dateRange.to);
            
            const docTypeMatch = activeDocTypes.includes(item.documentType);

            return customerMatch && itemMatch && sellerMatch && dateMatch && docTypeMatch;
        });
    }, [flattenedItems, filterCustomer, filterItem, filterSeller, dateRange, filterDocTypes]);
    

    const { stats, topItems, topCustomers } = useMemo(() => {
        const revenue = filteredItems.reduce((acc, item) => acc + item.total, 0);
        const totalSold = filteredItems.reduce((acc, item) => acc + item.quantity, 0);
        const uniqueSales = new Set(filteredItems.map(item => item.saleId)).size;
        const averageBasket = uniqueSales > 0 ? revenue / uniqueSales : 0;
        
        const itemStats = filteredItems.reduce((acc, item) => {
            if(!acc[item.itemId]) {
                acc[item.itemId] = { name: item.name, quantity: 0, revenue: 0 };
            }
            acc[item.itemId].quantity += item.quantity;
            acc[item.itemId].revenue += item.total;
            return acc;
        }, {} as Record<string, {name: string, quantity: number, revenue: number}>);

        const customerStats = filteredItems.reduce((acc, item) => {
            const customerId = item.customerId || 'unknown';
             if(!acc[customerId]) {
                acc[customerId] = { name: item.customerName, sales: new Set(), revenue: 0, visits: 0, basketTotal: 0 };
            }
            acc[customerId].revenue += item.total;
            if (!acc[customerId].sales.has(item.saleId)) {
                acc[customerId].sales.add(item.saleId);
                acc[customerId].visits = acc[customerId].sales.size;
            }
            return acc;
        }, {} as Record<string, {name: string, sales: Set<string>, revenue: number, visits: number, basketTotal: number}>);

        Object.values(customerStats).forEach(cust => {
            cust.basketTotal = cust.visits > 0 ? cust.revenue / cust.visits : 0;
        });

        return {
            stats: { revenue, totalSold, uniqueSales, averageBasket },
            topItems: Object.values(itemStats),
            topCustomers: Object.values(customerStats),
        };
    }, [filteredItems]);


    const sortedAndPaginatedSalesLines = useMemo(() => {
        const sorted = [...filteredItems].sort((a, b) => {
            const { key, direction } = salesLinesSortConfig;
            const aValue = a[key];
            const bValue = b[key];
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage, salesLinesSortConfig]);

    const sortedTopItems = useMemo(() => {
        return [...topItems].sort((a, b) => {
            const { key, direction } = topItemsSortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        }).slice(0, topN);
    }, [topItems, topN, topItemsSortConfig]);

    const sortedTopCustomers = useMemo(() => {
        return [...topCustomers].sort((a, b) => {
            const { key, direction } = topCustomersSortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        }).slice(0, topN);
    }, [topCustomers, topN, topCustomersSortConfig]);
    
    const requestSort = (key: SalesLinesSortKey | TopItemsSortKey | TopCustomersSortKey, table: 'salesLines' | 'topItems' | 'topCustomers') => {
        let direction: 'asc' | 'desc' = 'asc';
        const sortConfig = table === 'salesLines' ? salesLinesSortConfig : table === 'topItems' ? topItemsSortConfig : topCustomersSortConfig;
        const setSortConfig = table === 'salesLines' ? setSalesLinesSortConfig : table === 'topItems' ? setTopItemsSortConfig : setTopCustomersSortConfig;

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction } as any);
    };

    const getSortIcon = (key: string, table: 'salesLines' | 'topItems' | 'topCustomers') => {
        const sortConfig = table === 'salesLines' ? salesLinesSortConfig : table === 'topItems' ? topItemsSortConfig : topCustomersSortConfig;
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        }
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    }


    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    const resetFilters = () => {
        setFilterCustomer('');
        setFilterItem('');
        setFilterSeller('');
        setDateRange(undefined);
        setCurrentPage(1);
    }

    const currentFilterParams = useMemo(() => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('dateFrom', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.set('dateTo', format(dateRange.to, 'yyyy-MM-dd'));
      if (filterCustomer) params.set('customer', filterCustomer);
      if (filterItem) params.set('item', filterItem);
      if (filterSeller) params.set('seller', filterSeller);
      const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => type);
      if(activeDocTypes.length > 0) params.set('docTypes', activeDocTypes.join(','));
      return params.toString();
    }, [dateRange, filterCustomer, filterItem, filterSeller, filterDocTypes]);
  
  if (!isClient || isLoading) {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader title="Reporting avancé" subtitle="Chargement des données..."/>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Reporting avancé"
        subtitle="Analysez chaque ligne de vente pour des informations détaillées."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}><RefreshCw className="h-4 w-4" /></Button>
            <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
        </div>
      </PageHeader>
      <div className="mt-8 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.revenue.toFixed(2)}€</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nb. de Pièces</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.uniqueSales}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nb. d'Articles Vendus</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalSold}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Panier Moyen</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.averageBasket.toFixed(2)}€</div></CardContent></Card>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                    <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isFiltersOpen && "-rotate-90")} />
                    Filtres
                  </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-[220px] justify-between">
                        <span>Types de pièce</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Filtrer par type de document</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(documentTypes).map(([type, { label }]) => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={filterDocTypes[type]}
                          onCheckedChange={(checked) => handleDocTypeChange(type, checked)}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" />Réinitialiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent asChild>
              <CardContent className="flex flex-wrap items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
                <Input placeholder="Filtrer par article..." value={filterItem} onChange={(e) => setFilterItem(e.target.value)} className="max-w-xs" />
                <Input placeholder="Filtrer par client..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="max-w-xs" />
                <Input placeholder="Filtrer par vendeur..." value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="max-w-xs" />
                <div className="flex items-center gap-2">
                    <Label htmlFor="top-n-input">Top</Label>
                    <Input id="top-n-input" type="number" value={topN} onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value)) || 1)} className="w-20" />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid lg:grid-cols-2 gap-4">
            <Collapsible open={isTopItemsOpen} onOpenChange={setIsTopItemsOpen} asChild>
                <Card>
                    <CardHeader>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-0 text-lg font-semibold">
                                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isTopItemsOpen && "-rotate-90")} />
                                Top {topN} Articles
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent><Table><TableHeader><TableRow>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topItems')}>Article {getSortIcon('name', 'topItems')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'topItems')}>Quantité {getSortIcon('quantity', 'topItems')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topItems')}>Revenu {getSortIcon('revenue', 'topItems')}</Button></TableHead>
                        </TableRow></TableHeader><TableBody>{sortedTopItems.map((i, index) => <TableRow key={`${i.name}-${index}`}><TableCell>{i.name}</TableCell><TableCell className="text-right">{i.quantity}</TableCell><TableCell className="text-right font-bold">{i.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
            <Collapsible open={isTopCustomersOpen} onOpenChange={setIsTopCustomersOpen} asChild>
                <Card>
                    <CardHeader>
                        <CollapsibleTrigger asChild>
                             <Button variant="ghost" className="w-full justify-start px-0 text-lg font-semibold">
                                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isTopCustomersOpen && "-rotate-90")} />
                                Top {topN} Clients
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                    <CardContent><Table><TableHeader><TableRow>
                        <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topCustomers')}>Client {getSortIcon('name', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('visits', 'topCustomers')}>Visites {getSortIcon('visits', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('basketTotal', 'topCustomers')}>Panier Moyen {getSortIcon('basketTotal', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topCustomers')}>Revenu {getSortIcon('revenue', 'topCustomers')}</Button></TableHead>
                    </TableRow></TableHeader><TableBody>{sortedTopCustomers.map((c, index) => <TableRow key={`${c.name}-${index}`}><TableCell>{c.name}</TableCell><TableCell className="text-right">{c.visits}</TableCell><TableCell className="text-right">{c.basketTotal.toFixed(2)}€</TableCell><TableCell className="text-right font-bold">{c.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Détail des Lignes de Vente ({filteredItems.length})</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ArrowLeft className="h-4 w-4" /></Button>
                        <span className="text-sm font-medium">Page {currentPage} / {totalPages || 1}</span>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('saleDate', 'salesLines')}>Date {getSortIcon('saleDate', 'salesLines')}</Button></TableHead>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('ticketNumber', 'salesLines')}>Pièce {getSortIcon('ticketNumber', 'salesLines')}</Button></TableHead>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'salesLines')}>Article {getSortIcon('name', 'salesLines')}</Button></TableHead>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('customerName', 'salesLines')}>Client {getSortIcon('customerName', 'salesLines')}</Button></TableHead>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('userName', 'salesLines')}>Vendeur {getSortIcon('userName', 'salesLines')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'salesLines')}>Qté {getSortIcon('quantity', 'salesLines')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('total', 'salesLines')}>Total Ligne {getSortIcon('total', 'salesLines')}</Button></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {sortedAndPaginatedSalesLines.map((item, index) => (
                                <TableRow key={item.id + index}>
                                    <TableCell className="text-xs">{format(item.saleDate, 'dd/MM/yy HH:mm')}</TableCell>
                                    <TableCell>
                                        <Link href={`/reports/${item.saleId}?from=analytics&${currentFilterParams}`} className="text-blue-600 hover:underline">
                                            <Badge variant="secondary">{item.ticketNumber}</Badge>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.customerName}</TableCell>
                                    <TableCell>{item.userName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-bold">{item.total.toFixed(2)}€</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
