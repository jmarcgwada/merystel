
'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, subWeeks, addWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale, User, Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingBag, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, FileCog, ShoppingBag as ShoppingBagIcon, Columns, LayoutDashboard, CreditCard, Scale, Truck, Send, Printer, SlidersHorizontal, HelpCircle, Delete, ArrowUp, MoreVertical, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import type { Timestamp } from 'firebase/firestore';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InvoicePrintTemplate } from './components/invoice-print-template';
import jsPDF from 'jspdf';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SaleDetailModal } from './components/sale-detail-modal';


type SortKey = 'date' | 'total' | 'tableName' | 'customerName' | 'itemCount' | 'userName' | 'ticketNumber' | 'subtotal' | 'tax' | 'totalDiscount' | 'margin';

const documentTypes = {
    ticket: { label: 'Ticket', plural: 'Tickets', type: 'in' },
    invoice: { label: 'Facture', plural: 'Factures', type: 'in', path: '/commercial/invoices' },
    quote: { label: 'Devis', plural: 'Devis', type: 'neutral', path: '/commercial/quotes' },
    delivery_note: { label: 'Bon de Livraison', plural: 'Bons de Livraison', type: 'neutral', path: '/commercial/delivery-notes' },
    supplier_order: { label: 'Cde Fournisseur', plural: 'Cdes Fournisseur', type: 'out', path: '/commercial/supplier-orders' },
    credit_note: { label: 'Avoir', plural: 'Avoirs', type: 'out', path: '/commercial/credit-notes' },
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

const columnsConfig = [
    { id: 'type', label: 'Type' },
    { id: 'ticketNumber', label: 'Numéro' },
    { id: 'date', label: 'Date' },
    { id: 'userName', label: 'Vendeur' },
    { id: 'origin', label: 'Origine' },
    { id: 'customerName', label: 'Client' },
    { id: 'itemCount', label: 'Articles' },
    { id: 'details', label: 'Détails' },
    { id: 'subtotal', label: 'Total HT' },
    { id: 'tax', label: 'Total TVA' },
    { id: 'totalDiscount', label: 'Total Remise' },
    { id: 'margin', label: 'Marge' },
    { id: 'total', label: 'Total TTC' },
    { id: 'payment', label: 'Paiement' },
];

const PinKey = ({ value, onClick, 'data-key': dataKey, className }: { value: string, onClick: (value: string) => void, 'data-key'?: string, className?: string }) => (
    <Button
        type="button"
        variant="outline"
        className={cn("h-14 w-14 text-2xl font-bold", className)}
        onClick={() => onClick(value)}
        data-key={dataKey}
    >
        {value}
    </Button>
);


const ClientFormattedDate = ({ date, showIcon }: { date: Date | Timestamp | undefined, showIcon?: boolean }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) jsDate = date;
        else if (date && typeof (date as Timestamp)?.toDate === 'function') jsDate = (date as Timestamp).toDate();
        else if (date && typeof (date as any).seconds === 'number') {
            jsDate = new Date((date as any).seconds * 1000);
        } else {
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, "d MMM yyyy, HH:mm", { locale: fr }));
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

// Custom hook to manage persistent state
function usePersistentDocTypeFilter(key: string, defaultValue: Record<string, boolean>) {
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }, [key, state]);

    return [state, setState];
}


function ReportsPageContent() {
  const { 
      sales: allSales, 
      customers, 
      users, 
      isLoading: isPosLoading, 
      deleteAllSales, 
      convertToInvoice,
      paymentMethods,
      invoiceBgColor, 
      invoiceBgOpacity, 
      quoteBgColor, 
      quoteBgOpacity, 
      deliveryNoteBgColor, 
      deliveryNoteBgOpacity, 
      supplierOrderBgColor, 
      supplierOrderBgOpacity,
      creditNoteBgColor,
      creditNoteBgOpacity,
      smtpConfig,
      companyInfo,
      vatRates,
      lastSelectedSaleId,
      setLastSelectedSaleId,
      itemsPerPage,
      setItemsPerPage,
      lastReportsUrl,
      setLastReportsUrl,
      items: allItems,
  } = usePos();
  const { user } = useUser();
  const isCashier = user?.role === 'cashier';
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const docTypeFilterParam = searchParams.get('docType');
  const [isDocTypeFilterLocked, setIsDocTypeFilterLocked] = useState(!!docTypeFilterParam);
  const dateFilterParam = searchParams.get('date');
  const [isDateFilterLocked, setIsDateFilterLocked] = useState(!!dateFilterParam);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  const printRef = useRef<HTMLDivElement>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const [filterDocTypes, setFilterDocTypes] = usePersistentDocTypeFilter('reports.filterDocTypes', {
      ticket: true, invoice: true, quote: true, delivery_note: true, supplier_order: true, credit_note: true
  });
  
  const [isClient, setIsClient] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(() => {
    const key = searchParams.get('sortKey') as SortKey | null;
    const direction = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    return key && direction ? { key, direction } : { key: 'date', direction: 'desc' };
  });

  const [filterCustomerName, setFilterCustomerName] = useState(() => searchParams.get('customerName') || '');
  const [filterOrigin, setFilterOrigin] = useState(() => searchParams.get('origin') || '');
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || 'all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(() => searchParams.get('paymentMethod') || 'all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('dateFrom');
    const to = searchParams.get('dateTo');
    if (from) return { from: parseISO(from), to: to ? parseISO(to) : undefined };
    if (dateFilterParam) {
        const date = parseISO(dateFilterParam);
        return { from: date, to: date };
    }
    return undefined;
  });
  const [generalFilter, setGeneralFilter] = useState(() => searchParams.get('q') || '');
  const [isSummaryOpen, setSummaryOpen] = useState(true);
  const [isFiltersOpen, setFiltersOpen] = useState(!!dateFilterParam || !!searchParams.get('status') || !!docTypeFilterParam);
  const [filterSellerName, setFilterSellerName] = useState(() => searchParams.get('seller') || '');
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [saleToConvert, setSaleToConvert] = useState<Sale | null>(null);

  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const generalFilterRef = useRef<HTMLInputElement>(null);
  const customerNameFilterRef = useRef<HTMLInputElement>(null);
  const sellerNameFilterRef = useRef<HTMLInputElement>(null);
  const originFilterRef = useRef<HTMLInputElement>(null);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'this_week' | 'this_month' | 'none'>('none');
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        const mainEl = document.querySelector('main');
        if (!mainEl) return;
    
        const checkScroll = () => {
            if (mainEl.scrollTop > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };
    
        mainEl.addEventListener('scroll', checkScroll, { passive: true });
        return () => mainEl.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollToTop = () => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        setItemsPerPageState(itemsPerPage);
    }, [itemsPerPage]);

     useEffect(() => {
        const storedColumns = localStorage.getItem('reportsVisibleColumns');
        if (storedColumns) {
            setVisibleColumns(JSON.parse(storedColumns));
        } else {
             setVisibleColumns({
                type: true,
                ticketNumber: true,
                date: true,
                userName: true,
                origin: false,
                customerName: true,
                itemCount: false,
                details: true,
                subtotal: false,
                tax: false,
                totalDiscount: false,
                margin: false,
                total: true,
                payment: true,
            });
        }
    }, []);
    
    useEffect(() => {
        if (docTypeFilterParam) {
            const newFilterDocTypes: Record<string, boolean> = {};
            for (const key in documentTypes) {
                newFilterDocTypes[key] = key === docTypeFilterParam;
            }
            setFilterDocTypes(newFilterDocTypes as any);
        }
    }, [docTypeFilterParam, setFilterDocTypes]);
    
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

    const handlePinSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        const correctPin = generateDynamicPin();
        if (pin === correctPin) {
            handleColumnVisibilityChange('margin', true);
            setPinDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Code PIN incorrect' });
        }
        setPin('');
    }, [pin, toast]);

    const triggerVisualFeedback = useCallback((key: string) => {
      setActiveKey(key);
      setTimeout(() => setActiveKey(null), 150);
    }, []);
    
    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newVisibility = { ...visibleColumns, [columnId]: isVisible };
        setVisibleColumns(newVisibility);
        localStorage.setItem('reportsVisibleColumns', JSON.stringify(newVisibility));
    };

    const handleMarginToggle = (checked: boolean) => {
        if (checked) {
            setPinDialogOpen(true);
        } else {
            handleColumnVisibilityChange('margin', false);
        }
    };

    const generateDynamicPin = useCallback(() => {
        const now = new Date();
        const month = (now.getMonth() + 1);
        const day = now.getDate();
        
        const monthStr = month.toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const difference = Math.abs(day - month).toString();

        return `${monthStr}${dayStr}${difference}`;
    }, []);

    const handlePinKeyPress = (key: string) => {
      if (pin.length < 6) {
        setPin(prev => prev + key);
      }
    };
    
    const handlePinBackspace = () => {
      setPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (isPinDialogOpen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                const { key } = event;
                triggerVisualFeedback(key);
                if (key >= '0' && key <= '9') handlePinKeyPress(key);
                else if (key === 'Backspace') handlePinBackspace();
                else if (key === 'Enter') handlePinSubmit();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isPinDialogOpen, pin, handlePinSubmit, triggerVisualFeedback]);
    

    const filteredAndSortedSales = useMemo(() => {
        if (!allSales || !allItems) return [];

        let augmentedSales = allSales.map(sale => {
            const totalCost = sale.items.reduce((acc, orderItem) => {
                const itemDetail = allItems.find(i => i.id === orderItem.itemId);
                return acc + ((itemDetail?.purchasePrice || 0) * orderItem.quantity);
            }, 0);
            const margin = sale.total - totalCost;
            return { ...sale, margin };
        });

        let filteredSales = augmentedSales;
        if (generalFilter.trim() !== '*') {
          const searchTerms = generalFilter.toLowerCase().split('/').map(term => term.trim()).filter(term => term);
          const activeDocTypes = Object.entries(filterDocTypes).filter(([, isActive]) => isActive).map(([type]) => type);

          filteredSales = augmentedSales.filter(sale => {
              const customerName = getCustomerName(sale.customerId);
              const customerMatch = !filterCustomerName || (customerName && customerName.toLowerCase().includes(filterCustomerName.toLowerCase()));
              const originMatch = !filterOrigin || (sale.tableName && sale.tableName.toLowerCase().includes(filterOrigin.toLowerCase()));
              const totalPaid = Math.abs((sale.payments || []).reduce((acc, p) => acc + p.amount, 0));
              const saleTotal = Math.abs(sale.total);
              let statusMatch = true;
              if (filterStatus !== 'all') {
                  if (filterStatus === 'paid') statusMatch = sale.status === 'paid' || totalPaid >= saleTotal;
                  else if (filterStatus === 'pending') statusMatch = (sale.status === 'pending' || sale.status === 'quote' || sale.status === 'delivery_note') && totalPaid === 0;
                  else if (filterStatus === 'partial') statusMatch = sale.status === 'pending' && totalPaid > 0 && totalPaid < saleTotal;
                  else statusMatch = sale.status === filterStatus;
              }
              const saleSellerName = getUserName(sale.userId, sale.userName);
              const sellerMatch = !filterSellerName || (saleSellerName && saleSellerName.toLowerCase().includes(filterSellerName.toLowerCase()));
              let dateMatch = true;
              const saleDate = getDateFromSale(sale);
              if (dateRange?.from) dateMatch = saleDate >= startOfDay(dateRange.from);
              if (dateRange?.to) dateMatch = dateMatch && saleDate <= endOfDay(dateRange.to);
              const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
              const docTypeMatch = activeDocTypes.includes(docType);
              const paymentMethodMatch = filterPaymentMethod === 'all' || (sale.payments && sale.payments.some(p => p.method.name === filterPaymentMethod));
              
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

                  const searchableText = [
                      sale.ticketNumber,
                      customerName,
                      sale.total.toFixed(2),
                      sale.customerId,
                      ...sale.items.map(item => item.name)
                  ].join(' ').toLowerCase();

                  let match = false;
                  if (isStartsWith) {
                      match = (sale.ticketNumber && sale.ticketNumber.toLowerCase().startsWith(currentTerm)) ||
                            (customerName && customerName.toLowerCase().startsWith(currentTerm));
                  } else {
                      match = searchableText.includes(currentTerm);
                  }
                  
                  return isNegation ? !match : match;
              });

              return customerMatch && originMatch && statusMatch && dateMatch && sellerMatch && generalMatch && docTypeMatch && paymentMethodMatch;
          });
        }
        

        if (sortConfig !== null) {
            filteredSales.sort((a, b) => {
                let aValue: string | number | Date, bValue: string | number | Date;
                switch (sortConfig.key) {
                    case 'date': aValue = getDateFromSale(a); bValue = getDateFromSale(b); break;
                    case 'tableName': aValue = a.tableName || ''; bValue = b.tableName || ''; break;
                    case 'customerName': aValue = getCustomerName(a.customerId); bValue = getCustomerName(b.customerId); break;
                    case 'itemCount': aValue = Array.isArray(a.items) ? a.items.reduce((acc, item) => acc + item.quantity, 0) : 0; bValue = Array.isArray(b.items) ? b.items.reduce((acc, item) => acc + item.quantity, 0) : 0; break;
                    case 'userName': aValue = getUserName(a.userId, a.userName); bValue = getUserName(b.userId, b.userName); break;
                    case 'ticketNumber': aValue = a.ticketNumber || ''; bValue = b.ticketNumber || ''; break;
                    case 'subtotal': aValue = a.subtotal || 0; bValue = b.subtotal || 0; break;
                    case 'tax': aValue = a.tax || 0; bValue = b.tax || 0; break;
                    case 'totalDiscount':
                        aValue = a.items.reduce((sum, item) => sum + (item.discount || 0), 0);
                        bValue = b.items.reduce((sum, item) => sum + (item.discount || 0), 0);
                        break;
                    case 'margin':
                        aValue = (a as Sale & { margin: number }).margin;
                        bValue = (b as Sale & { margin: number }).margin;
                        break;
                    default: aValue = a[sortConfig.key as keyof Sale] as number || 0; bValue = b[sortConfig.key as keyof Sale] as number || 0; break;
                }
                if (aValue instanceof Date && bValue instanceof Date) {
                    return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
                }
                if(typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredSales;
    }, [allSales, getCustomerName, getUserName, sortConfig, filterCustomerName, filterOrigin, filterStatus, filterPaymentMethod, dateRange, filterSellerName, generalFilter, filterDocTypes, allItems]);
    
    useEffect(() => {
        const params = new URLSearchParams();
        if (generalFilter) params.set('q', generalFilter);
        if (sortConfig) {
            params.set('sortKey', sortConfig.key);
            params.set('sortDirection', sortConfig.direction);
        }
        if (currentPage > 1) params.set('page', String(currentPage));
        if (filterCustomerName) params.set('customerName', filterCustomerName);
        if (filterOrigin) params.set('origin', filterOrigin);
        if (filterSellerName) params.set('seller', filterSellerName);
        if (filterStatus !== 'all') params.set('status', filterStatus);
        if (filterPaymentMethod !== 'all') params.set('paymentMethod', filterPaymentMethod);
        if (dateRange?.from) params.set('dateFrom', dateRange.from.toISOString());
        if (dateRange?.to) params.set('dateTo', dateRange.to.toISOString());
        
        const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => type);
        if (activeDocTypes.length === 1 && docTypeFilterParam) {
            params.set('docType', activeDocTypes[0]);
        }
        
        router.replace(`${pathname}?${params.toString()}`);
        setLastReportsUrl(`${pathname}?${params.toString()}`);
    }, [generalFilter, sortConfig, currentPage, filterCustomerName, filterOrigin, filterSellerName, filterStatus, filterPaymentMethod, dateRange, router, pathname, setLastReportsUrl, filterDocTypes, docTypeFilterParam]);
    
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
        if (isDateFilterLocked && dateRange?.from) {
             return format(dateRange.from, "d MMMM yyyy", { locale: fr });
        }
        if (!dateRange || !dateRange.from) return 'Période';
        if (isSameDay(dateRange.from, new Date()) && (!dateRange.to || isSameDay(dateRange.to, new Date()))) return "Aujourd'hui";
        if (dateRange.from && dateRange.to && isSameDay(dateRange.from, startOfWeek(new Date(), {weekStartsOn: 1})) && isSameDay(dateRange.to, endOfWeek(new Date(), {weekStartsOn: 1}))) return "Cette semaine";
        if (dateRange.from && dateRange.to && isSameDay(dateRange.from, startOfMonth(new Date())) && isSameDay(dateRange.to, endOfMonth(new Date()))) return "Ce mois-ci";
        if (dateRange.from && !dateRange.to) return format(dateRange.from, "d MMMM yyyy", { locale: fr });
        if (dateRange.from && dateRange.to) {
            if (isSameDay(dateRange.from, dateRange.to)) {
                return format(dateRange.from, "d MMMM yyyy", { locale: fr });
            }
            return `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`;
        }
        return 'Période';
    };

    const handleDateArrowClick = (direction: 'prev' | 'next') => {
        if (isDateFilterLocked) return;
        
        let currentRangeType: 'day' | 'week' | 'month' | 'custom' = 'custom';
        let newFrom: Date, newTo: Date | undefined;

        if (dateRange?.from && dateRange.to) {
            if (isSameDay(dateRange.from, dateRange.to)) currentRangeType = 'day';
            else if (isSameDay(dateRange.from, startOfWeek(dateRange.from, { weekStartsOn: 1 })) && isSameDay(dateRange.to, endOfWeek(dateRange.from, { weekStartsOn: 1 }))) currentRangeType = 'week';
            else if (isSameDay(dateRange.from, startOfMonth(dateRange.from)) && isSameDay(dateRange.to, endOfMonth(dateRange.from))) currentRangeType = 'month';
        } else if (dateRange?.from) {
            currentRangeType = 'day';
        }

        const from = dateRange?.from || new Date();
        
        switch (currentRangeType) {
            case 'day':
                newFrom = direction === 'prev' ? subDays(from, 1) : addDays(from, 1);
                newTo = newFrom;
                break;
            case 'week':
                newFrom = direction === 'prev' ? subWeeks(from, 1) : addWeeks(from, 1);
                newTo = endOfWeek(newFrom, { weekStartsOn: 1 });
                break;
            case 'month':
                newFrom = direction === 'prev' ? subMonths(from, 1) : addMonths(from, 1);
                newTo = endOfMonth(newFrom);
                break;
            default: // custom range
                const diff = (dateRange?.to || from).getTime() - from.getTime();
                newFrom = new Date(from.getTime() + (direction === 'prev' ? -diff - (24*60*60*1000) : diff + (24*60*60*1000)));
                newTo = new Date(newFrom.getTime() + diff);
                break;
        }

        setDateRange({ from: newFrom, to: newTo });
    };
  
  const handleInsertSyntax = (syntax: string) => {
    setGeneralFilter(prev => {
        if (syntax === '*') return '*';
        const newFilter = prev ? `${prev} ${syntax}` : syntax;
        return newFilter.replace(/ \/ $/, '/'); // Tidy up for separator
    });
    generalFilterRef.current?.focus();
  };

    const totalPages = Math.ceil(filteredAndSortedSales.length / itemsPerPage);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedSales.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedSales, currentPage, itemsPerPage]);

    useEffect(() => {
        if(lastSelectedSaleId && rowRefs.current[lastSelectedSaleId]) {
            setTimeout(() => {
                rowRefs.current[lastSelectedSaleId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [lastSelectedSaleId, paginatedSales]);

    const summaryStats = useMemo(() => {
        const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => documentTypes[type as keyof typeof documentTypes]?.type);
        
        const revenueSales = filteredAndSortedSales.filter(s => {
            const docType = s.documentType || (s.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
            const typeInfo = documentTypes[docType as keyof typeof documentTypes];
            return typeInfo?.type === 'in';
        });
        const creditNotes = filteredAndSortedSales.filter(s => s.documentType === 'credit_note');
        const supplierOrders = filteredAndSortedSales.filter(s => s.documentType === 'supplier_order');
        
        const totalRevenue = revenueSales.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        const totalCreditNotes = creditNotes.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        const totalPurchases = supplierOrders.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        
        const netBalance = totalRevenue - totalCreditNotes - totalPurchases;
        const totalMargin = filteredAndSortedSales.reduce((acc, sale) => acc + (sale as Sale & { margin: number }).margin, 0);

        let summaryTitle = "Total";
        const uniqueTypes = [...new Set(activeDocTypes)].filter(Boolean);

        if (uniqueTypes.length === 1) {
            const type = uniqueTypes[0];
            if (type === 'in') summaryTitle = "Revenu Total";
            else if (type === 'out') summaryTitle = "Total Dépensé";
        }
        
        return { totalRevenue, totalCreditNotes, totalPurchases, netBalance, totalMargin, summaryTitle };
    }, [filteredAndSortedSales, filterDocTypes]);

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
        if (isDateFilterLocked) return;
        setFilterCustomerName('');
        setFilterOrigin('');
        setFilterStatus('all');
        setFilterPaymentMethod('all');
        setDateRange(undefined);
        setFilterSellerName('');
        setGeneralFilter('');
        if(!isDocTypeFilterLocked) setFilterDocTypes({ ticket: true, invoice: true, quote: true, delivery_note: true, supplier_order: true, credit_note: true });
        setCurrentPage(1);
    }

    const PaymentBadges = ({ sale }: { sale: Sale }) => {
      const totalPaid = Math.abs((sale.payments || []).reduce((acc, p) => acc + p.amount, 0));
      const saleTotal = Math.abs(sale.total);

      if (sale.status === 'invoiced') {
          return <Badge variant="outline">Convertie en Facture</Badge>;
      }
      if (sale.status === 'paid' || totalPaid >= saleTotal) {
          return (
              <div className="flex flex-wrap gap-1">
                  {sale.payments.map((p, index) => (
                      <Badge key={index} variant="outline" className="capitalize font-normal">
                          {p.method.name}: <span className="font-semibold ml-1">{Math.abs(p.amount).toFixed(2)}€</span>
                      </Badge>
                  ))}
                  {sale.change && sale.change > 0 && (
                      <Badge variant="secondary" className="font-normal bg-amber-200 text-amber-800">
                          Rendu: <span className="font-semibold ml-1">{Math.abs(sale.change).toFixed(2)}€</span>
                      </Badge>
                  )}
              </div>
          );
      }

      if (totalPaid > 0) {
          const remaining = saleTotal - totalPaid;
          return (
              <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="font-normal bg-orange-500 text-white">Partiel</Badge>
                  <span className="text-xs text-muted-foreground font-semibold">({remaining.toFixed(2)}€ restants)</span>
              </div>
          )
      }

      return <Badge variant="destructive" className="font-normal">En attente</Badge>;
  };

  const handlePrint = async (sale: Sale) => {
    setSaleToPrint(sale);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Allow state to render

    if (!printRef.current) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de préparer l'impression." });
      return;
    }
    setIsPrinting(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printRef.current, {
      callback: function (pdf) {
        pdf.save((sale.ticketNumber || 'document') + '.pdf');
        setIsPrinting(false);
        setSaleToPrint(null);
      },
      x: 0,
      y: 0,
      width: 210,
      windowWidth: printRef.current.scrollWidth,
      autoPaging: 'text',
    });
  };

    const handleNewDocumentClick = () => {
        const docType = searchParams.get('docType');
        let path = '/commercial/invoices'; // Default to invoice
        if (docType) {
            const typeInfo = documentTypes[docType as keyof typeof documentTypes];
            if (typeInfo && typeInfo.path) {
                path = typeInfo.path;
            }
        }
        router.push(path);
    };

    const handleOpenDetailModal = (sale: Sale) => {
        setLastSelectedSaleId(sale.id);
        setSelectedSaleForModal(sale);
        setIsDetailModalOpen(true);
    };
    
    const getRowStyle = (sale: Sale) => {
        const totalPaid = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const saleTotal = sale.total;
        const balance = saleTotal - totalPaid;
        
        const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
        const typeInfo = documentTypes[docType as keyof typeof documentTypes];

        if (typeInfo?.type === 'out') {
            return { backgroundColor: hexToRgba('#ef4444', 10) }
        }
        if (typeInfo?.type === 'neutral') {
             return { backgroundColor: hexToRgba('#3b82f6', 10) }; 
        }
        
        if (sale.status === 'paid' || balance <= 0.01) {
            return { backgroundColor: 'hsla(142, 71%, 94%, 0.5)' };
        }
        if (sale.status === 'pending') {
            if (totalPaid > 0) {
                 return { backgroundColor: 'hsla(39, 93%, 95%, 0.5)' };
            }
            return { backgroundColor: 'hsla(0, 84%, 97%, 0.5)' };
        }
        return {};
    };
    
    const handleEdit = (sale: Sale) => {
        const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
        if (docType && documentTypes[docType as keyof typeof documentTypes]?.path) {
            setLastSelectedSaleId(sale.id);
            router.push(`${documentTypes[docType as keyof typeof documentTypes].path}?edit=${sale.id}`);
        } else {
            toast({ variant: 'destructive', title: 'Action impossible', description: "Le type de document n'est pas modifiable." });
        }
    };
  
  const handleMouseDown = (action: () => void) => {
    const timer = setTimeout(() => {
        action();
        setLongPressTimer(null); // Prevent click
    }, 700); // 700ms for long press
    setLongPressTimer(timer);
  };
  
  const handleMouseUp = (clickAction: () => void) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        clickAction();
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
    }
  };
    
    if (isPosLoading) {
        return (
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader title="Rapports des pièces" subtitle="Chargement des données..."/>
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }
    
    const pageTitle = isDocTypeFilterLocked && docTypeFilterParam && documentTypes[docTypeFilterParam as keyof typeof documentTypes]
        ? `RAPPORT ${documentTypes[docTypeFilterParam as keyof typeof documentTypes].plural.toUpperCase()}`
        : "Rapports des pièces";

    const pageTitleComponent = (
        <div className="flex items-center gap-2">
            <span>{pageTitle}</span>
            <span className="text-base font-normal text-muted-foreground">
                ({filteredAndSortedSales.length} / {allSales?.length || 0})
            </span>
        </div>
      );

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
            title={pageTitleComponent}
            subtitle={`Page ${currentPage} sur ${totalPages || 1}`}
        >
            {/* PageHeader content... */}
        </PageHeader>
        {/* Rest of the page */}
    </div>
  );
}

const DocumentTypeWatermark = ({ docType }: { docType: string }) => {
    const typeLabel = documentTypes[docType as keyof typeof documentTypes]?.plural || docType;
    return (
        <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
            <h1 className="text-[12vw] font-black text-gray-200/50 dark:text-gray-800/50 select-none -rotate-12 whitespace-nowrap">
                {typeLabel.toUpperCase()}
            </h1>
        </div>
    )
}

export default function ReportsPage() {
    return (
      <Suspense>
        <ReportsPageContent />
      </Suspense>
    )
}

    