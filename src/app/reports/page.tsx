

'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import type { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKey = 'date' | 'total' | 'tableName';

const ClientFormattedDate = ({ date }: { date: Date | Timestamp }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) return;
        
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

    return <>{formattedDate}</>;
}


export default function ReportsPage() {
    const { sales: allSales, customers, isLoading } = usePos();
    const { user } = useUser();
    const isCashier = user?.role === 'cashier';
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    
    // Filtering state
    const [filterCustomer, setFilterCustomer] = useState('all');
    const [filterOrigin, setFilterOrigin] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isCustomerPopoverOpen, setCustomerPopoverOpen] = useState(false);

     useEffect(() => {
        setIsClient(true);
    }, []);

    const getCustomerName = (customerId?: string) => {
        if (!customerId || !customers) return 'N/A';
        return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
    }

    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];

        // Apply filters
        let filteredSales = allSales.filter(sale => {
            const customerMatch = filterCustomer === 'all' || sale.customerId === filterCustomer;
            const originMatch = !filterOrigin || (sale.tableName && sale.tableName.toLowerCase().includes(filterOrigin.toLowerCase()));
            const statusMatch = filterStatus === 'all' || (sale.status === filterStatus) || (!sale.payments || sale.payments.length === 0 && filterStatus === 'pending');
            return customerMatch && originMatch && statusMatch;
        });

        // Apply sorting
        if (sortConfig !== null) {
            filteredSales.sort((a, b) => {
                let aValue, bValue;
                
                if (sortConfig.key === 'date') {
                    const aDate = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
                    const bDate = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
                    aValue = aDate.getTime();
                    bValue = bDate.getTime();
                } else if (sortConfig.key === 'tableName') {
                    aValue = a.tableName || '';
                    bValue = b.tableName || '';
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
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
    }, [allSales, sortConfig, filterCustomer, filterOrigin, filterStatus]);

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
        setFilterCustomer('all');
        setFilterOrigin('');
        setFilterStatus('all');
    }

    const PaymentBadges = ({ payments }: { payments: Payment[] }) => (
      <div className="flex flex-wrap gap-1">
        {!payments || payments.length === 0 ? (
          <Badge variant="destructive" className="font-normal">En attente</Badge>
        ) : (
          payments.map((p, index) => (
            <Badge key={index} variant="outline" className="capitalize font-normal">
              {p.method.name}: <span className="font-semibold ml-1">{p.amount.toFixed(2)}€</span>
            </Badge>
          ))
        )}
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapports"
        subtitle={isClient && filteredAndSortedSales ? `Affichage de ${filteredAndSortedSales.length} ventes sur ${allSales?.length || 0} au total.` : "Analysez vos performances de vente."}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
        </Button>
        {!isCashier && (
            <Button asChild>
                <Link href="/reports/popular-items">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Voir les articles populaires
                </Link>
            </Button>
        )}
      </PageHeader>
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>Ventes Récentes</CardTitle>
                 <div className="pt-4 flex items-center gap-4">
                    <Popover open={isCustomerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCustomerPopoverOpen}
                            className="w-[200px] justify-between"
                        >
                            {filterCustomer === 'all'
                            ? "Tous les clients"
                            : customers?.find((cust) => cust.id === filterCustomer)?.name}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput placeholder="Rechercher un client..." />
                            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                            <CommandGroup>
                            <CommandItem
                                value="all"
                                onSelect={() => {
                                setFilterCustomer("all");
                                setCustomerPopoverOpen(false);
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    filterCustomer === "all" ? "opacity-100" : "opacity-0"
                                )}
                                />
                                Tous les clients
                            </CommandItem>
                            {customers && customers.map((cust) => (
                                <CommandItem
                                key={cust.id}
                                value={cust.name}
                                onSelect={() => {
                                    setFilterCustomer(cust.id === filterCustomer ? "all" : cust.id);
                                    setCustomerPopoverOpen(false);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    filterCustomer === cust.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {cust.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </Command>
                        </PopoverContent>
                    </Popover>

                    <Input
                        placeholder="Filtrer par origine..."
                        value={filterOrigin}
                        onChange={(e) => setFilterOrigin(e.target.value)}
                        className="max-w-sm"
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
                    <Button variant="ghost" onClick={resetFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Réinitialiser
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>
                               <Button variant="ghost" onClick={() => requestSort('date')}>
                                    Date {getSortIcon('date')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('tableName')}>
                                    Origine {getSortIcon('tableName')}
                                </Button>
                            </TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Articles</TableHead>
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
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && filteredAndSortedSales.map(sale => (
                            <TableRow key={sale.id}>
                                 <TableCell className="font-mono text-muted-foreground text-xs">
                                    {sale.ticketNumber}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">
                                    <ClientFormattedDate date={sale.date} />
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
                                     <PaymentBadges payments={sale.payments} />
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
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
