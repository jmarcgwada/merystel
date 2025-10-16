
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
import { TrendingUp, Eye, RefreshCw, ArrowLeft, ArrowRight, LayoutDashboard, Calendar as CalendarIcon, DollarSign, User, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function AnalyticsPage() {
    const { 
        sales: allSales, 
        customers, 
        users, 
        items,
        isLoading, 
    } = usePos();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    
    // Filtering state
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterItem, setFilterItem] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);

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

    const flattenedItems = useMemo(() => {
        if (!allSales) return [];
        return allSales
            .filter(sale => sale.ticketNumber?.startsWith('Fact-') || sale.ticketNumber?.startsWith('Tick-'))
            .flatMap(sale => 
                sale.items.map(item => ({
                    ...item,
                    saleId: sale.id,
                    saleDate: getDateFromSale(sale),
                    ticketNumber: sale.ticketNumber,
                    customerId: sale.customerId,
                    customerName: getCustomerName(sale.customerId),
                    userId: sale.userId,
                    userName: getUserName(sale.userId, sale.userName),
                }))
            );
    }, [allSales, getCustomerName, getUserName]);


    const filteredItems = useMemo(() => {
        return flattenedItems.filter(item => {
            const customerMatch = !filterCustomer || item.customerName.toLowerCase().includes(filterCustomer.toLowerCase());
            const itemMatch = !filterItem || item.name.toLowerCase().includes(filterItem.toLowerCase()) || item.barcode.toLowerCase().includes(filterItem.toLowerCase());
            const sellerMatch = !filterSeller || item.userName.toLowerCase().includes(filterSeller.toLowerCase());

            let dateMatch = true;
            if (dateRange?.from) dateMatch = item.saleDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && item.saleDate <= endOfDay(dateRange.to);

            return customerMatch && itemMatch && sellerMatch && dateMatch;
        });
    }, [flattenedItems, filterCustomer, filterItem, filterSeller, dateRange]);
    

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
            topItems: Object.values(itemStats).sort((a,b) => b.revenue - a.revenue).slice(0, 5),
            topCustomers: Object.values(customerStats).sort((a,b) => b.revenue - a.revenue).slice(0, 5),
        };
    }, [filteredItems]);


    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const resetFilters = () => {
        setFilterCustomer('');
        setFilterItem('');
        setFilterSeller('');
        setDateRange(undefined);
        setCurrentPage(1);
    }
  
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Filtres</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RefreshCw className="mr-2 h-4 w-4"/>Réinitialiser
                </Button>
            </div>
          </CardHeader>
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
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader><CardTitle>Top 5 Articles</CardTitle></CardHeader>
                <CardContent><Table><TableHeader><TableRow><TableHead>Article</TableHead><TableHead className="text-right">Quantité</TableHead><TableHead className="text-right">Revenu</TableHead></TableRow></TableHeader><TableBody>{topItems.map(i => <TableRow key={i.name}><TableCell>{i.name}</TableCell><TableCell className="text-right">{i.quantity}</TableCell><TableCell className="text-right font-bold">{i.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Top 5 Clients</CardTitle></CardHeader>
                <CardContent><Table><TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Visites</TableHead><TableHead className="text-right">Panier Moyen</TableHead><TableHead className="text-right">Revenu</TableHead></TableRow></TableHeader><TableBody>{topCustomers.map(c => <TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell className="text-right">{c.visits}</TableCell><TableCell className="text-right">{c.basketTotal.toFixed(2)}€</TableCell><TableCell className="text-right font-bold">{c.revenue.toFixed(2)}€</TableCell></TableRow>)}</TableBody></Table></CardContent>
            </Card>
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
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Pièce</TableHead><TableHead>Article</TableHead><TableHead>Client</TableHead><TableHead>Vendeur</TableHead><TableHead className="text-right">Qté</TableHead><TableHead className="text-right">Total Ligne</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paginatedItems.map((item, index) => (
                                <TableRow key={item.id + index}>
                                    <TableCell className="text-xs">{format(item.saleDate, 'dd/MM/yy HH:mm')}</TableCell>
                                    <TableCell><Link href={`/reports/${item.saleId}`} className="text-blue-600 hover:underline"><Badge variant="secondary">{item.ticketNumber}</Badge></Link></TableCell>
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
