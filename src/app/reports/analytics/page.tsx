

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
import { TrendingUp, Eye, RefreshCw, ArrowLeft, ArrowRight, LayoutDashboard, Calendar as CalendarIcon, DollarSign, User, ShoppingBag, ChevronDown, Scale, X, ArrowUpDown, Columns, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useKeyboard } from '@/contexts/keyboard-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

type SalesLinesSortKey = 'saleDate' | 'ticketNumber' | 'name' | 'barcode' | 'customerName' | 'userName' | 'quantity' | 'total';
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
        categories,
        isLoading, 
    } = usePos();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isClient, setIsClient] = useState(false);
    
    // Filtering state
    const [generalFilter, setGeneralFilter] = useState('');
    const [topArticles, setTopArticles] = useState(10);
    const [topClients, setTopClients] = useState(10);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterItem, setFilterItem] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isTopItemsOpen, setIsTopItemsOpen] = useState(true);
    const [isTopCustomersOpen, setIsTopCustomersOpen] = useState(true);
    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    const [filterDocTypes, setFilterDocTypes] = useState<Record<string, boolean>>({
        ticket: true,
        invoice: true,
        credit_note: false,
        supplier_order: false,
    });
    
    const [salesLinesSortConfig, setSalesLinesSortConfig] = useState<{ key: SalesLinesSortKey, direction: 'asc' | 'desc' }>({ key: 'saleDate', direction: 'desc' });
    const [topItemsSortConfig, setTopItemsSortConfig] = useState<{ key: TopItemsSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
    const [topCustomersSortConfig, setTopCustomersSortConfig] = useState<{ key: TopCustomersSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });

    const [selectedTopItems, setSelectedTopItems] = useState<string[]>([]);
    const [selectedTopCustomers, setSelectedTopCustomers] = useState<string[]>([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

     useEffect(() => {
        if (targetInput?.name === 'analytics-general-filter') setGeneralFilter(inputValue);
    }, [inputValue, targetInput]);
    
     useEffect(() => {
        const storedColumns = localStorage.getItem('analyticsVisibleColumns');
        if (storedColumns) {
            setVisibleColumns(JSON.parse(storedColumns));
        } else {
             setVisibleColumns({
                saleDate: true,
                ticketNumber: true,
                name: true,
                barcode: true,
                customerName: true,
                userName: true,
                quantity: true,
                total: true,
            });
        }
    }, []);

    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newVisibility = { ...visibleColumns, [columnId]: isVisible };
        setVisibleColumns(newVisibility);
        localStorage.setItem('analyticsVisibleColumns', JSON.stringify(newVisibility));
    };

    const salesLinesColumns = [
        { id: 'saleDate', label: 'Date' },
        { id: 'ticketNumber', label: 'Pièce' },
        { id: 'name', label: 'Désignation' },
        { id: 'barcode', label: 'Référence' },
        { id: 'customerName', label: 'Client' },
        { id: 'userName', label: 'Vendeur' },
        { id: 'quantity', label: 'Qté' },
        { id: 'total', label: 'Total Ligne' },
    ];


    const getCustomerName = useCallback((customerId?: string) => {
        if (!customerId || !customers) return 'N/A';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }, [customers]);
    
    const getUserName = useCallback((userId?: string, fallbackName?: string) => {
        if (!userId) return fallbackName || 'N/A';
        if (!users) return fallbackName || 'Chargement...';
        const saleUser = users.find(u => u.id === userId);
        return saleUser ? `${'user.firstName'} ${'user.lastName.charAt(0)'}.` : (fallbackName || 'Utilisateur supprimé');
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
        if (!allSales || !items) return [];
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
                    categoryId: items.find(i => i.id === item.itemId)?.categoryId,
                }))
            );
    }, [allSales, getCustomerName, getUserName, items]);


    const filteredItems = useMemo(() => {
        const activeDocTypes = Object.entries(filterDocTypes)
            .filter(([, isActive]) => isActive)
            .map(([type]) => type);

        return flattenedItems.filter(item => {
            const customerMatch = !filterCustomer || item.customerName.toLowerCase().includes(filterCustomer.toLowerCase());
            const itemMatch = !filterItem || item.name.toLowerCase().includes(filterItem.toLowerCase()) || (item.barcode && item.barcode.toLowerCase().includes(filterItem.toLowerCase()));
            const sellerMatch = !filterSeller || item.userName.toLowerCase().includes(filterSeller.toLowerCase());
            const categoryMatch = filterCategory === 'all' || item.categoryId === filterCategory;

            let dateMatch = true;
            if (dateRange?.from) dateMatch = item.saleDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && item.saleDate <= endOfDay(dateRange.to);
            
            const docTypeMatch = activeDocTypes.includes(item.documentType);

             const generalMatch = !generalFilter || (
                (item.ticketNumber && item.ticketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
                item.name.toLowerCase().includes(generalFilter.toLowerCase()) ||
                (item.barcode && item.barcode.toLowerCase().includes(generalFilter.toLowerCase())) ||
                item.customerName.toLowerCase().includes(generalFilter.toLowerCase()) ||
                item.userName.toLowerCase().includes(generalFilter.toLowerCase()) ||
                (item.note && item.note.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (item.serialNumbers && item.serialNumbers.some(sn => sn.toLowerCase().includes(generalFilter.toLowerCase()))) ||
                (item.selectedVariants && item.selectedVariants.some(v => `${v.name}: ${v.value}`.toLowerCase().includes(generalFilter.toLowerCase())))
             );
             
            const selectedItemsMatch = selectedTopItems.length === 0 || selectedTopItems.includes(item.name);
            const selectedCustomersMatch = selectedTopCustomers.length === 0 || selectedTopCustomers.includes(item.customerName);

            return customerMatch && itemMatch && sellerMatch && dateMatch && docTypeMatch && generalMatch && categoryMatch && selectedItemsMatch && selectedCustomersMatch;
        });
    }, [flattenedItems, filterCustomer, filterItem, filterSeller, dateRange, filterDocTypes, generalFilter, filterCategory, selectedTopItems, selectedTopCustomers]);
    

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
        }).slice(0, topArticles);
    }, [topItems, topArticles, topItemsSortConfig]);

    const sortedTopCustomers = useMemo(() => {
        return [...topCustomers].sort((a, b) => {
            const { key, direction } = topCustomersSortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        }).slice(0, topClients);
    }, [topCustomers, topClients, topCustomersSortConfig]);
    
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
        setFilterCategory('all');
        setFilterCustomer('');
        setFilterItem('');
        setFilterSeller('');
        setDateRange(undefined);
        setGeneralFilter('');
        setSelectedTopItems([]);
        setSelectedTopCustomers([]);
        setCurrentPage(1);
    }

    const currentFilterParams = useMemo(() => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('dateFrom', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.set('dateTo', format(dateRange.to, 'yyyy-MM-dd'));
      if (filterCustomer) params.set('customer', filterCustomer);
      if (filterItem) params.set('item', filterItem);
      if (filterSeller) params.set('seller', filterSeller);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => type);
      if(activeDocTypes.length > 0) params.set('docTypes', activeDocTypes.join(','));
      return params.toString();
    }, [dateRange, filterCustomer, filterItem, filterSeller, filterDocTypes, filterCategory]);

    const handleTopItemSelect = (itemName: string, isSelected: boolean) => {
        setSelectedTopItems(prev => 
            isSelected ? [...prev, itemName] : prev.filter(name => name !== itemName)
        );
    };

    const handleTopCustomerSelect = (customerName: string, isSelected: boolean) => {
        setSelectedTopCustomers(prev => 
            isSelected ? [...prev, customerName] : prev.filter(name => name !== customerName)
        );
    };
  
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
                 <Input 
                    ref={generalFilterRef}
                    placeholder="Recherche générale..." 
                    value={generalFilter} 
                    onChange={(e) => setGeneralFilter(e.target.value)} 
                    className="max-w-xs"
                    onFocus={() => setTargetInput({ value: generalFilter, name: 'analytics-general-filter', ref: generalFilterRef })}
                />
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
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Filtrer par client..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="max-w-xs" />
                <Input placeholder="Filtrer par vendeur..." value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="max-w-xs" />
                <div className="grid gap-2 w-48">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="top-n-articles-slider">Top Articles</Label>
                        <span className="text-sm font-bold text-primary">{topArticles}</span>
                    </div>
                    <Slider 
                        id="top-n-articles-slider" 
                        value={[topArticles]} 
                        onValueChange={(value) => setTopArticles(value[0])}
                        min={1} 
                        max={100} 
                        step={1} 
                    />
                </div>
                 <div className="grid gap-2 w-48">
                     <div className="flex justify-between items-center">
                        <Label htmlFor="top-n-clients-slider">Top Clients</Label>
                        <span className="text-sm font-bold text-primary">{topClients}</span>
                    </div>
                     <Slider 
                        id="top-n-clients-slider" 
                        value={[topClients]} 
                        onValueChange={(value) => setTopClients(value[0])}
                        min={1} 
                        max={100} 
                        step={1} 
                    />
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
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" className="w-full justify-start px-0 text-lg font-semibold">
                                    <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isTopItemsOpen && "-rotate-90")} />
                                    Top {topArticles} Articles
                                </Button>
                                {selectedTopItems.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTopItems([]) }}>
                                        <X className="mr-2 h-4 w-4" /> Effacer
                                    </Button>
                                )}
                            </div>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent><Table><TableHeader><TableRow>
                            <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedTopItems(checked ? sortedTopItems.map(i => i.name) : [])} checked={selectedTopItems.length === sortedTopItems.length && sortedTopItems.length > 0} /></TableHead>
                            <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topItems')}>Article {getSortIcon('name', 'topItems')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'topItems')}>Quantité {getSortIcon('quantity', 'topItems')}</Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topItems')}>Revenu {getSortIcon('revenue', 'topItems')}</Button></TableHead>
                        </TableRow></TableHeader><TableBody>{sortedTopItems.map((i, index) => <TableRow key={`${i.name}-${index}`}><TableCell><Checkbox checked={selectedTopItems.includes(i.name)} onCheckedChange={(checked) => handleTopItemSelect(i.name, !!checked)} /></TableCell><TableCell>{i.name}</TableCell><TableCell className="text-right">{i.quantity}</TableCell><TableCell className="text-right font-bold">{i.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
            <Collapsible open={isTopCustomersOpen} onOpenChange={setIsTopCustomersOpen} asChild>
                <Card>
                    <CardHeader>
                         <CollapsibleTrigger asChild>
                             <div className="flex items-center justify-between">
                                <Button variant="ghost" className="w-full justify-start px-0 text-lg font-semibold">
                                    <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isTopCustomersOpen && "-rotate-90")} />
                                    Top {topClients} Clients
                                </Button>
                                 {selectedTopCustomers.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTopCustomers([]) }}>
                                        <X className="mr-2 h-4 w-4" /> Effacer
                                    </Button>
                                )}
                             </div>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                    <CardContent><Table><TableHeader><TableRow>
                        <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedTopCustomers(checked ? sortedTopCustomers.map(c => c.name) : [])} checked={selectedTopCustomers.length === sortedTopCustomers.length && sortedTopCustomers.length > 0} /></TableHead>
                        <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topCustomers')}>Client {getSortIcon('name', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('visits', 'topCustomers')}>Visites {getSortIcon('visits', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('basketTotal', 'topCustomers')}>Panier Moyen {getSortIcon('basketTotal', 'topCustomers')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topCustomers')}>Revenu {getSortIcon('revenue', 'topCustomers')}</Button></TableHead>
                    </TableRow></TableHeader><TableBody>{sortedTopCustomers.map((c, index) => <TableRow key={`${c.name}-${index}`}><TableCell><Checkbox checked={selectedTopCustomers.includes(c.name)} onCheckedChange={(checked) => handleTopCustomerSelect(c.name, !!checked)}/></TableCell><TableCell>{c.name}</TableCell><TableCell className="text-right">{c.visits}</TableCell><TableCell className="text-right">{c.basketTotal.toFixed(2)}€</TableCell><TableCell className="text-right font-bold">{c.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        Détail des Lignes de Vente ({filteredItems.length})
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {salesLinesColumns.map(column => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={visibleColumns[column.id] ?? true}
                                        onCheckedChange={(checked) => handleColumnVisibilityChange(column.id, checked)}
                                    >
                                        {column.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardTitle>
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
                            {visibleColumns.saleDate && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('saleDate', 'salesLines')}>Date {getSortIcon('saleDate', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.ticketNumber && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('ticketNumber', 'salesLines')}>Pièce {getSortIcon('ticketNumber', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.name && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'salesLines')}>Désignation {getSortIcon('name', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.barcode && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('barcode', 'salesLines')}>Référence {getSortIcon('barcode', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.customerName && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('customerName', 'salesLines')}>Client {getSortIcon('customerName', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.userName && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('userName', 'salesLines')}>Vendeur {getSortIcon('userName', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.quantity && <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'salesLines')}>Qté {getSortIcon('quantity', 'salesLines')}</Button></TableHead>}
                            {visibleColumns.total && <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('total', 'salesLines')}>Total Ligne {getSortIcon('total', 'salesLines')}</Button></TableHead>}
                        </TableRow></TableHeader>
                        <TableBody>
                            {sortedAndPaginatedSalesLines.map((item, index) => (
                                <TableRow key={item.id + index}>
                                    {visibleColumns.saleDate && <TableCell className="text-xs">{format(item.saleDate, 'dd/MM/yy HH:mm')}</TableCell>}
                                    {visibleColumns.ticketNumber && <TableCell>
                                        <Link href={`/reports/${item.saleId}?from=analytics&${currentFilterParams}`} className="text-blue-600 hover:underline">
                                            <Badge variant="secondary">{item.ticketNumber}</Badge>
                                        </Link>
                                    </TableCell>}
                                    {visibleColumns.name && <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                            </div>
                                        )}
                                        {item.note && (
                                            <div className="text-xs text-amber-600 mt-1 flex items-start gap-1.5">
                                                <Pencil className="h-3 w-3 mt-0.5 shrink-0"/>
                                                <span>{item.note}</span>
                                            </div>
                                        )}
                                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                <span className="font-semibold">N/S:</span> {item.serialNumbers.filter(sn => sn).join(', ')}
                                            </div>
                                        )}
                                    </TableCell>}
                                    {visibleColumns.barcode && <TableCell className="font-mono text-xs">{item.barcode}</TableCell>}
                                    {visibleColumns.customerName && <TableCell>{item.customerName}</TableCell>}
                                    {visibleColumns.userName && <TableCell>{item.userName}</TableCell>}
                                    {visibleColumns.quantity && <TableCell className="text-right">{item.quantity}</TableCell>}
                                    {visibleColumns.total && <TableCell className="text-right font-bold">{item.total.toFixed(2)}€</TableCell>}
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

