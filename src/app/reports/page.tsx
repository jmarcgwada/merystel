
'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, subWeeks, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment, Sale, User, Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingBag, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, FileCog, ShoppingBag as ShoppingBagIcon, Columns, LayoutDashboard, CreditCard, Scale, Truck, Send, Printer, SlidersHorizontal, HelpCircle, Delete } from 'lucide-react';
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
    ticket: { label: 'Ticket', type: 'in' },
    invoice: { label: 'Facture', type: 'in', path: '/commercial/invoices' },
    quote: { label: 'Devis', type: 'neutral', path: '/commercial/quotes' },
    delivery_note: { label: 'Bon de Livraison', type: 'neutral', path: '/commercial/delivery-notes' },
    supplier_order: { label: 'Cde Fournisseur', type: 'out', path: '/commercial/supplier-orders' },
    credit_note: { label: 'Avoir', type: 'out', path: '/commercial/credit-notes' },
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
        else jsDate = new Date(date as any);

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

const DocumentTypeWatermark = ({ docType }: { docType: string | null }) => {
  const { 
    invoiceBgColor, 
    quoteBgColor, 
    deliveryNoteBgColor, 
    supplierOrderBgColor,
    creditNoteBgColor,
  } = usePos();
  
  if (!docType) return null;

  const docInfo = documentTypes[docType as keyof typeof documentTypes];
  if (!docInfo) return null;

  let color = '#cccccc'; // default gray
  switch(docType) {
    case 'invoice': color = invoiceBgColor; break;
    case 'quote': color = quoteBgColor; break;
    case 'delivery_note': color = deliveryNoteBgColor; break;
    case 'supplier_order': color = supplierOrderBgColor; break;
    case 'credit_note': color = creditNoteBgColor; break;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <h1 className="text-[20vw] lg:text-[12rem] font-black uppercase opacity-5 select-none" style={{ color }}>
        {docInfo.label}
      </h1>
    </div>
  );
};


function ReportsPageContent() {
  const { 
      sales: allSales, 
      customers, 
      users, 
      isPosLoading, 
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

  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'this_week' | 'this_month' | 'none'>('none');
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        setItemsPerPageState(itemsPerPage);
    }, [itemsPerPage]);
    
    useEffect(() => {
        const url = `${pathname}?${searchParams.toString()}`;
        setLastReportsUrl(url);
    }, [searchParams, pathname, setLastReportsUrl]);

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

    const generateDynamicPin = useCallback(() => {
        const now = new Date();
        const month = (now.getMonth() + 1);
        const day = now.getDate();
        
        const monthStr = month.toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const difference = Math.abs(day - month).toString();
    
        return `${monthStr}${dayStr}${difference}`;
    }, []);

    const handlePinSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (pin === generateDynamicPin()) {
            handleColumnVisibilityChange('margin', true);
            setPinDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Code PIN incorrect' });
        }
        setPin('');
    }, [pin, generateDynamicPin, toast]);

    const triggerVisualFeedback = useCallback((key: string) => {
      setActiveKey(key);
      setTimeout(() => setActiveKey(null), 150);
    }, []);

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
  
    const handlePinKeyPress = (key: string) => {
      if (pin.length < 6) {
        setPin(prev => prev + key);
      }
    };
    
    const handlePinBackspace = () => {
      setPin(prev => prev.slice(0, -1));
    };
    
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
        if(lastSelectedSaleId && rowRefs.current[lastSelectedSaleId]) {
            setTimeout(() => {
                rowRefs.current[lastSelectedSaleId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [lastSelectedSaleId]);
    
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
        if (!dateRange || !dateRange.from) return 'Période';
        if (isSameDay(dateRange.from, new Date()) && !dateRange.to) return "Aujourd'hui";
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
    
    const handleInsertSyntax = (syntax: string) => {
      setGeneralFilter(prev => {
          if (syntax === '*') return '*';
          const newFilter = prev ? `${prev} ${syntax}` : syntax;
          return newFilter.replace(/ \/ $/, '/'); // Tidy up for separator
      });
      generalFilterRef.current?.focus();
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

    const totalPages = Math.ceil(filteredAndSortedSales.length / itemsPerPage);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedSales.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedSales, currentPage, itemsPerPage]);

    const summaryStats = useMemo(() => {
        const revenueSales = filteredAndSortedSales.filter(s => s.documentType === 'invoice' || s.documentType === 'ticket');
        const creditNotes = filteredAndSortedSales.filter(s => s.documentType === 'credit_note');
        const supplierOrders = filteredAndSortedSales.filter(s => s.documentType === 'supplier_order');
        
        const totalRevenue = revenueSales.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        const totalCreditNotes = creditNotes.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        const totalPurchases = supplierOrders.reduce((acc, sale) => acc + Math.abs(sale.total), 0);
        
        const netBalance = totalRevenue - totalCreditNotes - totalPurchases;
        const totalMargin = filteredAndSortedSales.reduce((acc, sale) => acc + (sale as Sale & { margin: number }).margin, 0);

        return { totalRevenue, totalCreditNotes, totalPurchases, netBalance, totalMargin };
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
        if (isDateFilterLocked) return;
        if(isDocTypeFilterLocked) {
            router.push('/reports');
            return;
        }
        setFilterCustomerName('');
        setFilterOrigin('');
        setFilterStatus('all');
        setFilterPaymentMethod('all');
        setDateRange(undefined);
        setFilterSellerName('');
        setGeneralFilter('');
        setFilterDocTypes({ ticket: true, invoice: true, quote: true, delivery_note: true, supplier_order: true, credit_note: true });
        setCurrentPage(1);
    }

    const PaymentBadges = ({ sale }: { sale: Sale }) => {
      const totalPaid = Math.abs((sale.payments || []).reduce((acc, p) => acc + p.amount, 0));
      const saleTotal = Math.abs(sale.total);

      if (sale.status === 'invoiced') {
          return <Badge variant="outline">Facturé</Badge>;
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
        setSelectedSaleForModal(sale);
        setIsDetailModalOpen(true);
    };
    
    const getRowStyle = (sale: Sale) => {
        const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
        let color = 'transparent';
        let opacity = 100;
        
        switch (docType) {
            case 'invoice': color = invoiceBgColor; opacity = invoiceBgOpacity; break;
            case 'quote': color = quoteBgColor; opacity = quoteBgOpacity; break;
            case 'delivery_note': color = deliveryNoteBgColor; opacity = deliveryNoteBgOpacity; break;
            case 'supplier_order': color = supplierOrderBgColor; opacity = supplierOrderBgOpacity; break;
            case 'credit_note': color = creditNoteBgColor; opacity = creditNoteBgOpacity; break;
        }
        return { backgroundColor: hexToRgba(color, opacity) };
    };

    const handleEdit = (sale: Sale) => {
        if(sale.documentType && documentTypes[sale.documentType as keyof typeof documentTypes]?.path) {
            setLastSelectedSaleId(sale.id);
            router.push(`${documentTypes[sale.documentType as keyof typeof documentTypes].path}?edit=${sale.id}`);
        } else {
             toast({ variant: 'destructive', title: 'Action impossible', description: "Le type de document n'est pas modifiable." });
        }
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
    
  if (isPosLoading) {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader title="Rapports des pièces" subtitle="Chargement des données..."/>
            <div className="mt-8">
                <Skeleton className="h-[700px] w-full" />
            </div>
        </div>
    )
  }

  const pageTitle = (
    <div className="flex items-center gap-4">
      <span>Pièces</span>
      <span className="text-base font-normal text-muted-foreground">
        ({filteredAndSortedSales.length} sur {allSales?.length || 0})
      </span>
    </div>
  );

  return (
    <>
      <div className="absolute -left-[9999px] -top-[9999px]">
        {saleToPrint && vatRates && companyInfo && (
          <InvoicePrintTemplate 
              ref={printRef} 
              sale={saleToPrint} 
              customer={customers.find(c => c.id === saleToPrint.customerId) || null} 
              companyInfo={companyInfo} 
              vatRates={vatRates} 
          />
        )}
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
       <AlertDialog open={isPinDialogOpen} onOpenChange={setPinDialogOpen}>
          <AlertDialogContent className="sm:max-w-sm">
            <form onSubmit={handlePinSubmit}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Accès sécurisé</AlertDialogTitle>
                    <AlertDialogDescription>Veuillez entrer le code PIN dynamique pour afficher cette colonne.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex justify-center items-center h-12 bg-muted rounded-md border"><p className="text-3xl font-mono tracking-[0.5em]">{pin.padEnd(6, '•').substring(0, 6)}</p></div>
                    <div className="grid grid-cols-3 gap-2">
                        <PinKey value="1" onClick={handlePinKeyPress} data-key="1" className={cn(activeKey === '1' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="2" onClick={handlePinKeyPress} data-key="2" className={cn(activeKey === '2' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="3" onClick={handlePinKeyPress} data-key="3" className={cn(activeKey === '3' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="4" onClick={handlePinKeyPress} data-key="4" className={cn(activeKey === '4' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="5" onClick={handlePinKeyPress} data-key="5" className={cn(activeKey === '5' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="6" onClick={handlePinKeyPress} data-key="6" className={cn(activeKey === '6' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="7" onClick={handlePinKeyPress} data-key="7" className={cn(activeKey === '7' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="8" onClick={handlePinKeyPress} data-key="8" className={cn(activeKey === '8' && 'bg-primary text-primary-foreground')} />
                        <PinKey value="9" onClick={handlePinKeyPress} data-key="9" className={cn(activeKey === '9' && 'bg-primary text-primary-foreground')} />
                        <Button type="button" variant="outline" className={cn("h-14 w-14", activeKey === 'Backspace' && 'bg-primary text-primary-foreground')} onClick={handlePinBackspace} data-key="Backspace"><Delete className="h-6 w-6"/></Button>
                        <PinKey value="0" onClick={handlePinKeyPress} data-key="0" className={cn(activeKey === '0' && 'bg-primary text-primary-foreground')} />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => { setPin(''); setPinDialogOpen(false); }}>Annuler</AlertDialogCancel>
                    <AlertDialogAction type="submit">Valider</AlertDialogAction>
                </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Rapports des pièces"
                subtitle={`Page ${currentPage} sur ${totalPages || 1}`}
            >
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateArrowClick('prev')} disabled={isDateFilterLocked || !dateRange?.from}><ArrowLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" onClick={handleSmartDateFilter} className="min-w-32">{getSmartDateButtonLabel()}</Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateArrowClick('next')} disabled={isDateFilterLocked || !dateRange?.from}><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                    <Button onClick={handleNewDocumentClick}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Nouvelle Pièce
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/reports/analytics">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Reporting Avancé
                        </Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => router.refresh()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
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
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenu Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalRevenue.toFixed(2)}€</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Avoirs</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{summaryStats.totalCreditNotes.toFixed(2)}€</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Achats</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summaryStats.totalPurchases.toFixed(2)}€</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Balance Nette</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={cn("text-2xl font-bold", summaryStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600')}>{summaryStats.netBalance.toFixed(2)}€</div></CardContent></Card>
                            {visibleColumns.margin && (
                                <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Marge Brute Réalisée</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent><div className="text-2xl font-bold text-emerald-600">{summaryStats.totalMargin.toFixed(2)}€</div></CardContent>
                                </Card>
                            )}
                        </div>
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
                                            <Input ref={generalFilterRef} placeholder="Recherche générale..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="max-w-xs h-9 pr-8" />
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
                                                <Button variant="outline" className="w-auto sm:w-[220px] justify-between h-9" disabled={isDocTypeFilterLocked}>
                                                    {isDocTypeFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive"/>}
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
                                                        onCheckedChange={(checked) => setFilterDocTypes(prev => ({...prev, [type]: checked}))}
                                                    >
                                                        {label}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={resetFilters} disabled={isDateFilterLocked && isDocTypeFilterLocked}><X className="mr-2 h-4 w-4"/>Réinitialiser</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CollapsibleContent>
                                <CardContent className="flex items-center gap-2 flex-wrap pt-0">
                                    <Popover>
                                        <PopoverTrigger asChild disabled={isDateFilterLocked}>
                                           <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive" />}
                                                {getSmartDateButtonLabel() !== 'Période' ? getSmartDateButtonLabel() : 
                                                  dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "d MMMM yyyy", { locale: fr })) : <span>Choisir une période</span>
                                                }
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                                    </Popover>
                                    <Input ref={customerNameFilterRef} placeholder="Filtrer par client..." value={filterCustomerName} onChange={(e) => setFilterCustomerName(e.target.value)} className="max-w-xs h-9" />
                                    <Input ref={sellerNameFilterRef} placeholder="Filtrer par vendeur..." value={filterSellerName} onChange={(e) => setFilterSellerName(e.target.value)} className="max-w-xs h-9" />
                                    <Input ref={originFilterRef} placeholder="Filtrer par origine (table)..." value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} className="max-w-xs h-9" />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Statut de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="paid">Payé</SelectItem><SelectItem value="invoiced">Facturé</SelectItem><SelectItem value="partial">Partiellement payé</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="quote">Devis</SelectItem><SelectItem value="delivery_note">Bon de livraison</SelectItem></SelectContent></Select>
                                    <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Moyen de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les moyens</SelectItem>{paymentMethods.map(method => (<SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>))}</SelectContent></Select>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                    <Card className="relative">
                        {docTypeFilterParam && <DocumentTypeWatermark docType={docTypeFilterParam}/>}
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                  {pageTitle}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Columns className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {columnsConfig.map(column => {
                                                const isMarginColumn = column.id === 'margin';
                                                return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    checked={visibleColumns[column.id] ?? false}
                                                    onCheckedChange={(checked) => {
                                                        if (isMarginColumn) {
                                                            handleMarginToggle(checked);
                                                        } else {
                                                            handleColumnVisibilityChange(column.id, checked)
                                                        }
                                                    }}
                                                    disabled={isMarginColumn && !!visibleColumns.margin && user?.role !== 'admin'}
                                                >
                                                    {isMarginColumn && <Lock className="mr-2 h-3 w-3" />}
                                                    {column.label}
                                                </DropdownMenuCheckboxItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9"
                                        onClick={() => handleMouseUp(() => setCurrentPage(p => Math.max(1, p - 1)))}
                                        onMouseDown={() => handleMouseDown(() => setCurrentPage(1))}
                                        onMouseLeave={handleMouseLeave}
                                        onTouchStart={() => handleMouseDown(() => setCurrentPage(1))}
                                        onTouchEnd={() => handleMouseUp(() => setCurrentPage(p => Math.max(1, p - 1)))}
                                        disabled={currentPage === 1}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
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
                                                    min={5}
                                                    max={50}
                                                    step={5}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9"
                                        onClick={() => handleMouseUp(() => setCurrentPage(p => Math.min(totalPages, p + 1)))}
                                        onMouseDown={() => handleMouseDown(() => setCurrentPage(totalPages))}
                                        onMouseLeave={handleMouseLeave}
                                        onTouchStart={() => handleMouseDown(() => setCurrentPage(totalPages))}
                                        onTouchEnd={() => handleMouseUp(() => setCurrentPage(p => Math.min(totalPages, p + 1)))}
                                        disabled={currentPage === totalPages || totalPages <= 1}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {visibleColumns.type && <TableHead className="w-[120px]"><Button variant="ghost" onClick={() => requestSort('ticketNumber')}>Type {getSortIcon('ticketNumber')}</Button></TableHead>}
                                        {visibleColumns.ticketNumber && <TableHead>Numéro</TableHead>}
                                        {visibleColumns.date && <TableHead><Button variant="ghost" onClick={() => requestSort('date')}>Date {getSortIcon('date')}</Button></TableHead>}
                                        {visibleColumns.userName && <TableHead><Button variant="ghost" onClick={() => requestSort('userName')}>Vendeur {getSortIcon('userName')}</Button></TableHead>}
                                        {visibleColumns.origin && <TableHead><Button variant="ghost" onClick={() => requestSort('tableName')}>Origine {getSortIcon('tableName')}</Button></TableHead>}
                                        {visibleColumns.customerName && <TableHead><Button variant="ghost" onClick={() => requestSort('customerName')}>Client {getSortIcon('customerName')}</Button></TableHead>}
                                        {visibleColumns.itemCount && <TableHead className="w-[80px] text-center"><Button variant="ghost" onClick={() => requestSort('itemCount')}>Articles {getSortIcon('itemCount')}</Button></TableHead>}
                                        {visibleColumns.details && <TableHead>Détails</TableHead>}
                                        {visibleColumns.subtotal && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('subtotal')} className="justify-end w-full">Total HT {getSortIcon('subtotal')}</Button></TableHead>}
                                        {visibleColumns.tax && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('tax')} className="justify-end w-full">Total TVA {getSortIcon('tax')}</Button></TableHead>}
                                        {visibleColumns.totalDiscount && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('totalDiscount')} className="justify-end w-full">Total Remise {getSortIcon('totalDiscount')}</Button></TableHead>}
                                        {visibleColumns.margin && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('margin')} className="justify-end w-full">Marge {getSortIcon('margin')}</Button></TableHead>}
                                        {visibleColumns.total && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('total')} className="justify-end w-full">Total TTC {getSortIcon('total')}</Button></TableHead>}
                                        {visibleColumns.payment && <TableHead>Paiement</TableHead>}
                                        <TableHead className="w-[150px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isPosLoading ? Array.from({length: 10}).map((_, i) => (
                                        <TableRow key={i}>
                                            {Object.values(visibleColumns).filter(v => v).map((_, index) => <TableCell key={index}><Skeleton className="h-4 w-full" /></TableCell>)}
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    )) : null}
                                    {!isPosLoading && paginatedSales.map(sale => {
                                        const sellerName = getUserName(sale.userId, sale.userName);
                                        const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
                                        const pieceType = documentTypes[docType as keyof typeof documentTypes]?.label || docType;
                                        const canBeConverted = (sale.documentType === 'quote' || sale.documentType === 'delivery_note') && sale.status !== 'invoiced';
                                        
                                        const originalDoc = allSales?.find(s => s.id === sale.originalSaleId);
                                        const originText = originalDoc ? `${originalDoc.documentType === 'quote' ? 'Devis' : 'BL'} #${originalDoc.ticketNumber}` : 'Vente directe';
                                        const totalDiscount = sale.items.reduce((sum, item) => sum + (item.discount || 0), 0);

                                        return (
                                            <TableRow 
                                            key={sale.id}
                                            ref={(el) => {if(el) rowRefs.current[sale.id] = el}}
                                            className={cn(
                                                'cursor-pointer',
                                                sale.id === lastSelectedSaleId
                                                ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900'
                                                : 'hover:bg-muted/50'
                                            )}
                                            style={getRowStyle(sale)}
                                            onClick={() => handleOpenDetailModal(sale)}
                                            >
                                                {visibleColumns.type && <TableCell>
                                                    <Badge variant={pieceType === 'Facture' ? 'outline' : pieceType === 'Ticket' ? 'secondary' : 'default'}>{pieceType}</Badge>
                                                </TableCell>}
                                                {visibleColumns.ticketNumber && <TableCell>
                                                  <Link href={`/reports/${sale.id}?${searchParams.toString()}`} className="font-mono text-muted-foreground text-xs hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                                    {sale.ticketNumber}
                                                  </Link>
                                                </TableCell>}
                                                {visibleColumns.date && <TableCell className="font-medium text-xs"><ClientFormattedDate date={sale.date} showIcon={!!sale.modifiedAt} /></TableCell>}
                                                {visibleColumns.userName && <TableCell>{sellerName}</TableCell>}
                                                {visibleColumns.origin && <TableCell>{sale.tableName ? <Badge variant="outline">{sale.tableName}</Badge> : originText}</TableCell>}
                                                {visibleColumns.customerName && <TableCell>{getCustomerName(sale.customerId)}</TableCell>}
                                                {visibleColumns.itemCount && <TableCell className="text-center">{Array.isArray(sale.items) ? sale.items.reduce((acc, item) => acc + item.quantity, 0) : 0}</TableCell>}
                                                {visibleColumns.details && <TableCell className="text-xs text-muted-foreground max-w-[200px] whitespace-pre-wrap">{sale.items.map(i => i.name).join(', ')}</TableCell>}
                                                {visibleColumns.subtotal && <TableCell className="text-right font-medium">{Math.abs(sale.subtotal || 0).toFixed(2)}€</TableCell>}
                                                {visibleColumns.tax && <TableCell className="text-right font-medium">{Math.abs(sale.tax || 0).toFixed(2)}€</TableCell>}
                                                {visibleColumns.totalDiscount && <TableCell className="text-right font-medium text-destructive">{totalDiscount > 0 ? `-${totalDiscount.toFixed(2)}€` : '-'}</TableCell>}
                                                {visibleColumns.margin && <TableCell className="text-right font-bold text-green-600">{(sale as Sale & { margin: number }).margin.toFixed(2)}€</TableCell>}
                                                {visibleColumns.total && <TableCell className="text-right font-bold">{Math.abs(sale.total || 0).toFixed(2)}€</TableCell>}
                                                {visibleColumns.payment && <TableCell><PaymentBadges sale={sale} /></TableCell>}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end">
                                                        <Button variant="ghost" size="icon" disabled={isPrinting && saleToPrint?.id === sale.id} onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}>
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        {canBeConverted && (
                                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSaleToConvert(sale); setConfirmOpen(true); }}>
                                                                <FileCog className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(sale);}}>
                                                            <Pencil className="h-4 w-4" />
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
      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSaleForModal}
      />
    </>
  );
}

export default function ReportsPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><p>Chargement des rapports...</p></div>}>
        <ReportsPageContent />
      </Suspense>
    )
}

