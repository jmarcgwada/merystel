

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
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingCart, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, FileCog, ShoppingBag, Columns, LayoutDashboard, CreditCard, Scale, Truck, Send, Printer, SlidersHorizontal } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InvoicePrintTemplate } from './components/invoice-print-template';
import jsPDF from 'jspdf';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SaleDetailModal } from './components/sale-detail-modal';


type SortKey = 'date' | 'total' | 'tableName' | 'customerName' | 'itemCount' | 'userName' | 'ticketNumber' | 'subtotal' | 'tax';

const documentTypes = {
    ticket: { label: 'Ticket', type: 'in', path: '/pos' },
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
    { id: 'total', label: 'Total TTC' },
    { id: 'payment', label: 'Paiement' },
];


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
      setLastReportsUrl
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

  const { setTargetInput, inputValue, targetInput } = useKeyboard();
  const generalFilterRef = useRef<HTMLInputElement>(null);
  const customerNameFilterRef = useRef<HTMLInputElement>(null);
  const sellerNameFilterRef = useRef<HTMLInputElement>(null);
  const originFilterRef = useRef<HTMLInputElement>(null);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
  
    useEffect(() => {
        setItemsPerPageState(itemsPerPage);
    }, [itemsPerPage]);
    
    useEffect(() => {
        const storedColumns = localStorage.getItem('reportsVisibleColumns');
        if (storedColumns) {
            setVisibleColumns(JSON.parse(storedColumns));
        } else {
             setVisibleColumns({
                type: true, ticketNumber: true, date: true, userName: true, origin: false,
                customerName: true, itemCount: false, details: false, subtotal: false,
                tax: false, total: true, payment: true,
            });
        }
        setIsClient(true);
    }, []);

    useEffect(() => {
      const fullUrl = `${pathname}?${searchParams.toString()}`;
      setLastReportsUrl(fullUrl);
    }, [pathname, searchParams, setLastReportsUrl]);
    
    useEffect(() => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        if (generalFilter) params.set('q', generalFilter); else params.delete('q');
        if (filterCustomerName) params.set('customerName', filterCustomerName); else params.delete('customerName');
        if (filterSellerName) params.set('seller', filterSellerName); else params.delete('seller');
        if (filterOrigin) params.set('origin', filterOrigin); else params.delete('origin');
        if (filterStatus !== 'all') params.set('status', filterStatus); else params.delete('status');
        if (filterPaymentMethod !== 'all') params.set('paymentMethod', filterPaymentMethod); else params.delete('paymentMethod');
        if (dateRange?.from) params.set('dateFrom', format(dateRange.from, 'yyyy-MM-dd')); else params.delete('dateFrom');
        if (dateRange?.to) params.set('dateTo', format(dateRange.to, 'yyyy-MM-dd')); else params.delete('dateTo');
        if (sortConfig) {
          params.set('sortKey', sortConfig.key);
          params.set('sortDirection', sortConfig.direction);
        } else {
            params.delete('sortKey');
            params.delete('sortDirection');
        }
        if (currentPage > 1) params.set('page', String(currentPage)); else params.delete('page');
        
        router.replace(`${pathname}?${params.toString()}`);
    }, [generalFilter, filterCustomerName, filterSellerName, filterOrigin, filterStatus, filterPaymentMethod, dateRange, currentPage, sortConfig, router, pathname]);
    
    useEffect(() => {
        if (isCashier) {
            router.push('/dashboard');
        }
    }, [isCashier, router]);

    const isLoading = isPosLoading || !isClient;

    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newVisibility = { ...visibleColumns, [columnId]: isVisible };
        setVisibleColumns(newVisibility);
        localStorage.setItem('reportsVisibleColumns', JSON.stringify(newVisibility));
    };

    useEffect(() => {
        if (docTypeFilterParam) {
            setIsDocTypeFilterLocked(true);
            const newFilterDocTypes: Record<string, boolean> = {};
            Object.keys(documentTypes).forEach(key => {
                newFilterDocTypes[key] = key === docTypeFilterParam;
            });
            setFilterDocTypes(newFilterDocTypes);
        } else {
            setIsDocTypeFilterLocked(false);
        }
    }, [docTypeFilterParam, setFilterDocTypes]);
    

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

    const handleDocTypeChange = (typeKey: string, checked: boolean) => {
        const typeInfo = documentTypes[typeKey as keyof typeof documentTypes];
        if (!typeInfo) return;

        setFilterDocTypes(prev => {
            const newState = { ...prev, [typeKey]: checked };
            if (checked && typeInfo.type !== 'neutral') {
                for (const key in documentTypes) {
                    if (documentTypes[key as keyof typeof documentTypes].type !== 'neutral' && documentTypes[key as keyof typeof documentTypes].type !== typeInfo.type) {
                        newState[key] = false;
                    }
                }
            }
            return newState;
        });
    };

    const deselectAllDocTypes = () => {
        const newFilterDocTypes: Record<string, boolean> = {};
        Object.keys(documentTypes).forEach(key => {
            newFilterDocTypes[key] = false;
        });
        setFilterDocTypes(newFilterDocTypes);
    };

    useEffect(() => {
        if (inputValue && targetInput) {
            if (targetInput.name === 'reports-general-filter') setGeneralFilter(inputValue);
            if (targetInput.name === 'reports-customer-filter') setFilterCustomerName(inputValue);
            if (targetInput.name === 'reports-seller-filter') setFilterSellerName(inputValue);
            if (targetInput.name === 'reports-origin-filter') setFilterOrigin(inputValue);
        }
    }, [inputValue, targetInput]);

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

    const handleEdit = useCallback((sale: Sale) => {
      setLastSelectedSaleId(sale.id);
      const typeMap: Record<string, string> = {
          'quote': 'quotes', 'delivery_note': 'delivery-notes',
          'supplier_order': 'supplier-orders', 'invoice': 'invoices',
          'credit_note': 'credit-notes',
      };
      const docType = sale.documentType || (sale.ticketNumber?.startsWith('Fact-') ? 'invoice' : 'ticket');
      if(docType === 'ticket') {
          toast({ variant: 'destructive', title: 'Action non autorisée', description: 'Les tickets ne peuvent pas être modifiés, seulement dupliqués ou visualisés.'});
          return;
      }
      const pathSegment = typeMap[docType];
      if (!pathSegment) {
          toast({ variant: 'destructive', title: 'Type de document inconnu', description: "Impossible d'ouvrir ce type de pièce pour modification."});
          return;
      }
      router.push(`/commercial/${pathSegment}?edit=${sale.id}`);
    }, [router, toast, setLastSelectedSaleId]);

    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];
        const activeDocTypes = Object.entries(filterDocTypes).filter(([, isActive]) => isActive).map(([type]) => type);

        let filteredSales = allSales.filter(sale => {
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
            
            const generalMatch = !generalFilter || (
                (sale.ticketNumber && sale.ticketNumber.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (customerName && customerName.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (sale.total.toFixed(2).includes(generalFilter)) ||
                (sale.customerId && sale.customerId.toLowerCase().includes(generalFilter.toLowerCase())) ||
                (Array.isArray(sale.items) && sale.items.some(item => (item.name.toLowerCase().includes(generalFilter.toLowerCase()))))
            );

            return customerMatch && originMatch && statusMatch && dateMatch && sellerMatch && generalMatch && docTypeMatch && paymentMethodMatch;
        });

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
    }, [allSales, getCustomerName, getUserName, sortConfig, filterCustomerName, filterOrigin, filterStatus, filterPaymentMethod, dateRange, filterSellerName, generalFilter, filterDocTypes]);

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
        return { totalRevenue, totalCreditNotes, totalPurchases, netBalance };
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
    
    const setTodayFilter = () => {
        const today = new Date();
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
    };
    
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
    
  const getDetailLink = (saleId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      return `/reports/${saleId}?${params.toString()}`;
  }

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
    
  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader title="Rapports des pièces" subtitle="Chargement des données..."/>
            <div className="mt-8">
                <Skeleton className="h-[700px] w-full" />
            </div>
        </div>
    )
  }

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
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Rapports des pièces"
                subtitle={isClient && filteredAndSortedSales ? `Page ${currentPage} sur ${totalPages} (${filteredAndSortedSales.length} pièces sur ${allSales?.length || 0} au total)` : "Analysez vos performances."}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={setTodayFilter}>Aujourd'hui</Button>
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chiffre d'Affaires (Encaissements)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalRevenue.toFixed(2)}€</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Avoirs (Remboursements)</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{summaryStats.totalCreditNotes.toFixed(2)}€</div></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Achats (Fournisseurs)</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summaryStats.totalPurchases.toFixed(2)}€</div></CardContent></Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Balance Nette</CardTitle>
                                    <Scale className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className={cn("text-2xl font-bold", summaryStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600')}>{summaryStats.netBalance.toFixed(2)}€</div></CardContent>
                            </Card>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                
                <div className="flex flex-col gap-4">
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
                                        <Input ref={generalFilterRef} placeholder="Recherche générale..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="max-w-xs h-9" onFocus={() => setTargetInput({ value: generalFilter, name: 'reports-general-filter', ref: generalFilterRef })}/>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-auto sm:w-[220px] justify-between h-9" disabled={isDocTypeFilterLocked}>
                                                    {isDocTypeFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive"/>}
                                                    <span>Types de pièce</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={deselectAllDocTypes} className="text-destructive focus:text-destructive">
                                                    Tout désélectionner
                                                </DropdownMenuItem>
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
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={resetFilters} disabled={isDateFilterLocked && isDocTypeFilterLocked}><X className="h-4 w-4" /></Button></TooltipTrigger>
                                                <TooltipContent><p>Réinitialiser les filtres</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </CardHeader>
                            <CollapsibleContent>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-0">
                                    <Popover>
                                        <PopoverTrigger asChild disabled={isDateFilterLocked}>
                                            <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive" />}
                                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Choisir une période</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                                    </Popover>
                                    <Input ref={customerNameFilterRef} placeholder="Filtrer par client..." value={filterCustomerName} onChange={(e) => setFilterCustomerName(e.target.value)} className="h-9" onFocus={() => setTargetInput({ value: filterCustomerName, name: 'reports-customer-filter', ref: customerNameFilterRef })}/>
                                    <Input ref={sellerNameFilterRef} placeholder="Filtrer par vendeur..." value={filterSellerName} onChange={(e) => setFilterSellerName(e.target.value)} className="h-9" onFocus={() => setTargetInput({ value: filterSellerName, name: 'reports-seller-filter', ref: sellerNameFilterRef })}/>
                                    <Input ref={originFilterRef} placeholder="Filtrer par origine (table)..." value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} className="h-9" onFocus={() => setTargetInput({ value: filterOrigin, name: 'reports-origin-filter', ref: originFilterRef })}/>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full h-9"><SelectValue placeholder="Statut de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="paid">Payé</SelectItem><SelectItem value="invoiced">Facturé</SelectItem><SelectItem value="partial">Partiellement payé</SelectItem><SelectItem value="pending">En attente</SelectItem></SelectContent></Select>
                                    <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}><SelectTrigger className="w-full h-9"><SelectValue placeholder="Moyen de paiement" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les moyens</SelectItem>{paymentMethods.map(method => (<SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>))}</SelectContent></Select>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Détail des pièces</CardTitle>
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <Columns className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {columnsConfig.map(column => (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    checked={visibleColumns[column.id] ?? false}
                                                    onCheckedChange={(checked) => handleColumnVisibilityChange(column.id, checked)}
                                                >
                                                    {column.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                                                        min={5}
                                                        max={100}
                                                        step={5}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages <= 1}><ArrowRight className="h-4 w-4" /></Button>
                                    </div>
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
                                        {visibleColumns.total && <TableHead className="text-right w-[120px]"><Button variant="ghost" onClick={() => requestSort('total')} className="justify-end w-full">Total TTC {getSortIcon('total')}</Button></TableHead>}
                                        {visibleColumns.payment && <TableHead>Paiement</TableHead>}
                                        <TableHead className="w-[150px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? Array.from({length: 10}).map((_, i) => (
                                        <TableRow key={i}>
                                            {Object.values(visibleColumns).filter(v => v).map((_, index) => <TableCell key={index}><Skeleton className="h-4 w-full" /></TableCell>)}
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    )) : null}
                                    {!isLoading && paginatedSales && paginatedSales.map(sale => {
                                        const sellerName = getUserName(sale.userId, sale.userName);
                                        const docType = sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice');
                                        const pieceType = documentTypes[docType as keyof typeof documentTypes]?.label || docType;
                                        const canBeConverted = (sale.documentType === 'quote' || sale.documentType === 'delivery_note') && sale.status !== 'invoiced';
                                        
                                        const originalDoc = allSales?.find(s => s.id === sale.originalSaleId);
                                        const originText = originalDoc ? `${originalDoc.documentType === 'quote' ? 'Devis' : 'BL'} #${originalDoc.ticketNumber}` : 'Vente directe';

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
                                            >
                                                {visibleColumns.type && <TableCell>
                                                    <Badge variant={pieceType === 'Facture' ? 'outline' : pieceType === 'Ticket' ? 'secondary' : 'default'}>{pieceType}</Badge>
                                                </TableCell>}
                                                {visibleColumns.ticketNumber && <TableCell>
                                                  <Link href={getDetailLink(sale.id)} className="font-mono text-muted-foreground text-xs hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                                    {sale.ticketNumber}
                                                  </Link>
                                                </TableCell>}
                                                {visibleColumns.date && <TableCell className="font-medium text-xs"><ClientFormattedDate date={sale.date} showIcon={!!sale.modifiedAt} /></TableCell>}
                                                {visibleColumns.userName && <TableCell>{sellerName}</TableCell>}
                                                {visibleColumns.origin && <TableCell>{sale.tableName ? <Badge variant="outline">{sale.tableName}</Badge> : originText}</TableCell>}
                                                {visibleColumns.customerName && <TableCell>{getCustomerName(sale.customerId)}</TableCell>}
                                                {visibleColumns.itemCount && <TableCell className="text-center">{Array.isArray(sale.items) ? sale.items.reduce((acc, item) => acc + item.quantity, 0) : 0}</TableCell>}
                                                {visibleColumns.details && (
                                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                        {sale.items.map(item => {
                                                            const details = [];
                                                            if(item.selectedVariants && item.selectedVariants.length > 0) {
                                                                details.push(item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', '));
                                                            }
                                                            if(item.note) details.push(`Note: ${item.note}`);
                                                            if(item.serialNumbers && item.serialNumbers.length > 0) details.push(`N/S: ${item.serialNumbers.join(', ')}`);
                                                            return details.length > 0 ? `${item.name} (${details.join('; ')})` : item.name;
                                                        }).join(' | ')}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.subtotal && <TableCell className="text-right font-medium">{Math.abs(sale.subtotal || 0).toFixed(2)}€</TableCell>}
                                                {visibleColumns.tax && <TableCell className="text-right font-medium">{Math.abs(sale.tax || 0).toFixed(2)}€</TableCell>}
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
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(sale);}}>
                                                            <Eye className="h-4 w-4" />
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

