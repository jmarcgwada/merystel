'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingBag, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, CreditCard, LayoutDashboard, Scale, HelpCircle, SlidersHorizontal, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
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
import { useKeyboard } from '@/components/keyboard-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SaleDetailModal } from '../components/sale-detail-modal';


type SortKey = 'date' | 'amount' | 'customerName' | 'ticketNumber' | 'methodName' | 'userName';

const documentTypes = {
    ticket: { label: 'Ticket', type: 'in' },
    invoice: { label: 'Facture', type: 'in' },
    credit_note: { label: 'Avoir', type: 'out' },
    supplier_order: { label: 'Cde Fournisseur', type: 'out' },
};

const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return `hsla(var(--background), ${opacity/100})`;
};


const ClientFormattedDate = ({ date, saleDate }: { date: Date | Timestamp | undefined, saleDate: Date | Timestamp | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');
    const [isDeferred, setIsDeferred] = useState(false);

    useEffect(() => {
        if (!date || !saleDate) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        const toJsDate = (d: Date | Timestamp | undefined | string): Date => {
            if (!d) return new Date(0);
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

function PaymentsReportPageContent() {
    const { 
        sales: allSales, 
        customers, 
        users, 
        isLoading: isPosLoading, 
        paymentMethods,
        invoiceBgColor, 
        invoiceBgOpacity, 
        creditNoteBgColor,
        creditNoteBgOpacity,
        supplierOrderBgColor,
        supplierOrderBgOpacity,
        itemsPerPage,
        setItemsPerPage,
    } = usePos();
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
    const [filterDocTypes, setFilterDocTypes] = useState<Record<string, boolean>>({
        ticket: true,
        invoice: true,
        credit_note: false,
        supplier_order: false,
    });
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
    const [isSummaryOpen, setSummaryOpen] = useState(true);
    const [filterSellerName, setFilterSellerName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);
    const customerNameFilterRef = useRef<HTMLInputElement>(null);
    const sellerNameFilterRef = useRef<HTMLInputElement>(null);

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [periodFilter, setPeriodFilter] = useState<'today' | 'this_week' | 'this_month' | 'none'>('none');
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        setItemsPerPageState(itemsPerPage);
    }, [itemsPerPage]);

     const getRowStyle = (payment: any) => {
        const docType = payment.saleDocumentType || (payment.saleTicketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
        let color = 'transparent';
        let opacity = 100;
        
        switch (docType) {
            case 'invoice': color = invoiceBgColor; opacity = invoiceBgOpacity; break;
            case 'supplier_order': color = supplierOrderBgColor; opacity = supplierOrderBgOpacity; break;
            case 'credit_note': color = creditNoteBgColor; opacity = creditNoteBgOpacity; break;
        }
        return { backgroundColor: hexToRgba(color, opacity) };
    };
    
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
    
     const handleSmartDateFilter = () => {
        const periodCycle: ('today' | 'this_week' | 'this_month' | 'none')[] = ['today', 'this_week', 'this_month', 'none'];
        const currentIdx = periodCycle.indexOf(periodFilter);
        const nextPeriod = periodCycle[(currentIdx + 1) % periodCycle.length];
        
        setPeriodFilter(nextPeriod);
        
        const now = new Date();
        if (nextPeriod === 'today') {
            setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        } else if (nextPeriod === 'this_week') {
            setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) });
        } else if (nextPeriod === 'this_month') {
            setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        } else {
            setDateRange(undefined);
        }
    };
    
    const getSmartDateButtonLabel = () => {
        switch(periodFilter) {
            case 'today': return "Aujourd'hui";
            case 'this_week': return 'Semaine';
            case 'this_month': return 'Mois';
            default: return 'Période';
        }
    };


    const allPayments = useMemo(() => {
        if (!allSales) return [];
        return allSales.flatMap(sale => 
            (sale.payments || []).map(payment => ({
                ...payment,
                saleId: sale.id,
                saleTicketNumber: sale.ticketNumber,
                saleDocumentType: sale.documentType,
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
        if (generalFilter.trim() === '*') return allPayments;

        const activeDocTypes = Object.entries(filterDocTypes)
          .filter(([, isActive]) => isActive)
          .map(([type]) => type);

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
            if (dateRange?.from) dateMatch = paymentJsDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && paymentJsDate <= endOfDay(dateRange.to);
            
            let paymentTypeMatch = true;
            if (filterPaymentType === 'deferred') paymentTypeMatch = !isSameDay(paymentJsDate, saleJsDate);
            else if (filterPaymentType === 'immediate') paymentTypeMatch = isSameDay(paymentJsDate, saleJsDate);
            
            const docType = payment.saleDocumentType || (payment.saleTicketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
            const docTypeMatch = activeDocTypes.includes(docType);

            const searchTerms = generalFilter.toLowerCase().split('/').map(term => term.trim()).filter(Boolean);
            const generalMatch = searchTerms.length === 0 || searchTerms.every(term => {
                let currentTerm = term;
                let isNegation = false;
                let isStartsWith = false;

                if (currentTerm.startsWith('!')) {
                    isNegation = true;
                    currentTerm = currentTerm.substring(1);
                } else if (currentTerm.startsWith('^')) {
                    isStartsWith = true;
                    currentTerm = currentTerm.substring(1);
                }
                if (!currentTerm) return true;

                const searchableText = [payment.saleTicketNumber, customerName, sellerName, payment.method.name].filter(Boolean).join(' ').toLowerCase();
                let match = isStartsWith ? searchableText.startsWith(currentTerm) : searchableText.includes(currentTerm);
                return isNegation ? !match : match;
            });

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
    }, [allPayments, sortConfig, filterCustomerName, filterMethodName, filterPaymentType, dateRange, filterSellerName, generalFilter, filterDocTypes, getCustomerName, getUserName]);
    
    const { summaryTitle, totalRevenue, totalPayments, averagePayment, paymentMethodSummary, totalDeferred, totalUnpaid } = useMemo(() => {
        const paymentSummary = filteredAndSortedPayments.reduce((acc, p) => {
            const name = p.method.name;
            if (!acc[name]) {
                acc[name] = { count: 0, total: 0 };
            }
            acc[name].count += 1;
            acc[name].total += p.amount;
            return acc;
        }, {} as Record<string, { count: number; total: number }>);
        
        const totalRev = filteredAndSortedPayments.reduce((acc, p) => acc + p.amount, 0);
        const totalPay = filteredAndSortedPayments.length;
        const avgPay = totalPay > 0 ? totalRev / totalPay : 0;
        
        const deferredTotal = filteredAndSortedPayments.filter(p => {
             const toJsDate = (d: Date | Timestamp | undefined | string): Date => {
                if (!d) return new Date(0); if (d instanceof Date) return d;
                if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as any).toDate === 'function') return (d as Timestamp).toDate();
                const parsedDate = new Date(d as string);
                return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
            };
            const paymentJsDate = toJsDate(p.date);
            const saleJsDate = toJsDate(p.saleDate);
            return !isSameDay(paymentJsDate, saleJsDate);
        }).reduce((acc, p) => acc + p.amount, 0);
        
        const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => documentTypes[type as keyof typeof documentTypes]?.type);
        
        let title = "Total";
        const uniqueTypes = [...new Set(activeDocTypes)].filter(Boolean);

        if (uniqueTypes.length === 1) {
            const type = uniqueTypes[0];
            if (type === 'in') title = "Revenu Total";
            else if (type === 'out') title = "Total Dépensé";
        }
        
        const unpaidTotal = allSales
            .filter(sale => {
                const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => type);
                const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
                if (!activeDocTypes.includes(docType)) return false;
                
                const customerName = getCustomerName(sale.customerId);
                if (filterCustomerName && !customerName.toLowerCase().includes(filterCustomerName.toLowerCase())) return false;
                
                const sellerName = getUserName(sale.userId, sale.userName);
                if (filterSellerName && !sellerName.toLowerCase().includes(filterSellerName.toLowerCase())) return false;

                if (dateRange?.from || dateRange?.to) {
                    const hasMatchingPayment = sale.payments?.some(p => {
                        const paymentJsDate = new Date(p.date as any);
                         let dateMatch = true;
                        if (dateRange.from) dateMatch = paymentJsDate >= startOfDay(dateRange.from);
                        if (dateRange.to) dateMatch = dateMatch && paymentJsDate <= endOfDay(dateRange.to);
                        return dateMatch;
                    });
                    if (!hasMatchingPayment) return false;
                }

                if (filterMethodName !== 'all' && !sale.payments?.some(p => p.method.name === filterMethodName)) return false;

                const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                return sale.total > totalPaid;
            })
            .reduce((acc, sale) => {
                const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                return acc + (sale.total - totalPaid);
            }, 0);
        
        return { 
            summaryTitle: title, 
            totalRevenue: totalRev, 
            totalPayments: totalPay, 
            averagePayment: avgPay,
            paymentMethodSummary: paymentSummary,
            totalDeferred: deferredTotal,
            totalUnpaid: unpaidTotal,
        };
    }, [filteredAndSortedPayments, filterDocTypes, allSales, getCustomerName, getUserName, filterCustomerName, filterSellerName, dateRange, filterMethodName]);

    const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);

    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedPayments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedPayments, currentPage, itemsPerPage]);

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
        setFilterDocTypes({
            ticket: true,
            invoice: true,
            credit_note: false,
            supplier_order: false,
        });
        setDateRange(undefined);
        setFilterSellerName('');
        setGeneralFilter('');
        setCurrentPage(1);
    }
    
    const openSaleDetailModal = (saleId: string) => {
        const sale = allSales.find(s => s.id === saleId);
        if (sale) {
            setSelectedSale(sale);
            setIsDetailModalOpen(true);
        }
    };
  
  const handleInsertSyntax = (syntax: string) => {
    setGeneralFilter(prev => {
        if (syntax === '*') return '*';
        const newFilter = prev ? `${prev} ${syntax}` : syntax;
        return newFilter.replace(/ \/ $/, '/'); // Tidy up for separator
    });
    generalFilterRef.current?.focus();
  };
    
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

    const pageTitle = (
        <div className="flex items-center gap-4">
            <span>Liste des Paiements</span>
            <span className="text-base font-normal text-muted-foreground">({filteredAndSortedPayments.length} / {allPayments.length})</span>
        </div>
      );

  return (
    <>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Rapport des Paiements"
          subtitle={`Page ${currentPage} sur ${totalPages || 1}`}
        >
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSmartDateFilter}>{getSmartDateButtonLabel()}</Button>
              <Button asChild variant="secondary">
                  <Link href="/reports">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Pièces de vente
                  </Link>
              </Button>
              <Button variant="outline" size="icon" onClick={() => router.refresh()}><RefreshCw className="h-4 w-4" /></Button>
              <Button asChild variant="outline" size="icon" className="btn-back">
                  <Link href="/dashboard">
                      <LayoutDashboard />
                  </Link>
              </Button>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 pt-2">
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{summaryTitle}</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nombre de Paiements</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">+{totalPayments}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Paiement Moyen</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{averagePayment.toFixed(2)}€</div></CardContent></Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Différé</CardTitle><CalendarIcon className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-600">{totalDeferred.toFixed(2)}€</div></CardContent>
                      </Card>
                       <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Impayés</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-destructive">{totalUnpaid.toFixed(2)}€</div></CardContent>
                      </Card>
                  </div>
                  {Object.keys(paymentMethodSummary).length > 0 && (
                  <Card className="mt-4">
                      <CardHeader>
                      <CardTitle className="text-base">Synthèse par méthode de paiement</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(paymentMethodSummary).map(([method, data]) => (
                          <Card key={method}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{method}</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{data.total.toFixed(2)}€</div>
                              <p className="text-xs text-muted-foreground">{data.count} transaction{data.count > 1 ? 's' : ''}</p>
                          </CardContent>
                          </Card>
                      ))}
                      </CardContent>
                  </Card>
                  )}
              </CollapsibleContent>
          </Collapsible>
          
          <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen} asChild>
              <Card>
                <CardHeader className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="justify-start px-2 text-lg font-semibold -ml-2">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    Filtres
                                    <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isFiltersOpen && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>
                             <div className="relative">
                                <Input ref={generalFilterRef} placeholder="Recherche générale..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="max-w-xs h-9 pr-8" onFocus={() => setTargetInput({ value: generalFilter, name: 'analytics-general-filter', ref: generalFilterRef })} />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground">
                                            <HelpCircle className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="space-y-4 text-sm">
                                            <h4 className="font-semibold">Syntaxe de recherche</h4>
                                            {[
                                                { syntax: "texte", explanation: "Contient le texte" },
                                                { syntax: "/", explanation: "Sépare les termes (ET logique)" },
                                                { syntax: "!", explanation: "Ne contient pas le texte" },
                                                { syntax: "^", explanation: "Commence par le texte" },
                                                { syntax: "*", explanation: "Ignore tous les filtres" }
                                            ].map(({ syntax, explanation }) => (
                                                <div key={syntax} className="flex items-center justify-between">
                                                    <p><code className="font-mono bg-muted p-1 rounded mr-2">{syntax}</code>{explanation}</p>
                                                    <Button size="sm" variant="outline" className="px-2 h-7" onClick={() => handleInsertSyntax(syntax)}>Insérer</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-auto sm:w-[220px] justify-between h-9">
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
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={resetFilters} disabled={isDateFilterLocked}><X className="mr-2 h-4 w-4"/>Réinitialiser</Button>
                        </div>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="flex items-center gap-2 flex-wrap pt-0">
                        <Popover>
                            <PopoverTrigger asChild disabled={isDateFilterLocked}>
                                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive" />}
                                    {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                        <Input ref={customerNameFilterRef} placeholder="Filtrer par client..." value={filterCustomerName} onChange={(e) => setFilterCustomerName(e.target.value)} className="max-w-xs h-9" />
                        <Input ref={sellerNameFilterRef} placeholder="Filtrer par vendeur..." value={filterSellerName} onChange={(e) => setFilterSellerName(e.target.value)} className="max-w-xs h-9" />
                        <Select value={filterMethodName} onValueChange={setFilterMethodName}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Moyen de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les moyens</SelectItem>{paymentMethods.map(pm => (<SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>))}</SelectContent></Select>
                        <Select value={filterPaymentType} onValueChange={(v) => setFilterPaymentType(v as any)}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Statut du paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="immediate">Immédiat</SelectItem><SelectItem value="deferred">Différé</SelectItem></SelectContent></Select>
                    </CardContent>
                </CollapsibleContent>
              </Card>
          </Collapsible>
          
          <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{pageTitle}</CardTitle>
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
                                      <span>{itemsPerPageState}</span>
                                  </div>
                                  <Slider
                                      id="items-per-page-slider"
                                      value={[itemsPerPageState]}
                                      onValueChange={(value) => setItemsPerPageState(value[0])}
                                      onValueCommit={(value) => setItemsPerPage(value[0])}
                                      min={10}
                                      max={100}
                                      step={10}
                                  />
                              </div>
                          </PopoverContent>
                      </Popover>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="pt-0">
                  <Table>
                      <TableHeader><TableRow>
                          <TableHead><Button variant="ghost" onClick={() => requestSort('date')}>Date Paiement {getSortIcon('date')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => requestSort('ticketNumber')}>Pièce {getSortIcon('ticketNumber')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => requestSort('methodName')}>Type {getSortIcon('methodName')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => requestSort('customerName')}>Client {getSortIcon('customerName')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => requestSort('userName')}>Vendeur {getSortIcon('userName')}</Button></TableHead>
                          <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('amount')} className="justify-end w-full">Montant {getSortIcon('amount')}</Button></TableHead>
                          <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                          {!paginatedPayments.length && <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucun paiement trouvé pour cette sélection.</TableCell></TableRow>}
                          {paginatedPayments.map((payment, index) => {
                              const customerName = getCustomerName(payment.customerId);
                              const sellerName = getUserName(payment.userId, payment.userName);
                              return (
                                  <TableRow key={`${payment.saleId}-${index}`} style={getRowStyle(payment)}>
                                      <TableCell className="font-medium text-xs"><ClientFormattedDate date={payment.date} saleDate={payment.saleDate} /></TableCell>
                                      <TableCell>
                                          <button onClick={() => openSaleDetailModal(payment.saleId)} className="text-blue-600 hover:underline">
                                              <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground">
                                                {payment.saleTicketNumber}
                                              </Badge>
                                          </button>
                                      </TableCell>
                                      <TableCell><Badge variant="outline" className="capitalize">{payment.method.name}</Badge></TableCell>
                                      <TableCell>{customerName}</TableCell>
                                      <TableCell>{sellerName}</TableCell>
                                      <TableCell className="text-right font-bold">{payment.amount.toFixed(2)}€</TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" onClick={() => openSaleDetailModal(payment.saleId)}>
                                              <Eye className="h-4 w-4" />
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
      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSale}
      />
    </>
  );
}

export default function PaymentsPage() {
    return (
        <Suspense>
            <PaymentsReportPageContent/>
        </Suspense>
    )
}
