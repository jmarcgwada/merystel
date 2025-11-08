

'use client';

import { PageHeader } from '@/components/page-header';
import { usePos } from '@/contexts/pos-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, subDays, addDays, subWeeks, addWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Eye, RefreshCw, ArrowUpDown, Check, X, Calendar as CalendarIcon, ChevronDown, DollarSign, ShoppingBag, Package, Edit, Lock, ArrowLeft, ArrowRight, Trash2, FilePlus, Pencil, FileCog, Columns, LayoutDashboard, CreditCard, Scale, Truck, Send, Printer, SlidersHorizontal, HelpCircle, FileSignature, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
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
import { useKeyboard } from '@/components/keyboard-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { SaleDetailModal } from '../components/sale-detail-modal';


type SalesLinesSortKey = 'saleDate' | 'ticketNumber' | 'name' | 'barcode' | 'customerName' | 'userName' | 'quantity' | 'total' | 'categoryName';
type TopItemsSortKey = 'name' | 'quantity' | 'revenue';
type TopCustomersSortKey = 'name' | 'visits' | 'basketTotal' | 'revenue';
type TopCategoriesSortKey = 'name' | 'quantity' | 'revenue';


const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | string | undefined; formatString: string }) => {
  const [formatted, setFormatted] = useState('');
  useEffect(() => {
    if (date) {
      let jsDate: Date;
      if (date instanceof Date) {
        jsDate = date;
      } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
        jsDate = (date as Timestamp).toDate();
      } else {
        jsDate = new Date(date as any);
      }
      
      if (!isNaN(jsDate.getTime())) {
        setFormatted(format(jsDate, formatString, { locale: fr }));
      }
    }
  }, [date, formatString]);
  return <>{formatted}</>;
};

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
    quote: { label: 'Devis', type: 'neutral' },
    delivery_note: { label: 'Bon de Livraison', type: 'neutral' },
    supplier_order: { label: 'Cde Fournisseur', type: 'out' },
    credit_note: { label: 'Avoir', type: 'out' },
};

const salesLinesColumns = [
    { id: 'saleDate', label: 'Date' },
    { id: 'ticketNumber', label: 'Pièce' },
    { id: 'name', label: 'Désignation' },
    { id: 'details', label: 'Détails' },
    { id: 'categoryName', label: 'Catégorie' },
    { id: 'barcode', label: 'Référence' },
    { id: 'customerName', label: 'Client' },
    { id: 'userName', label: 'Vendeur' },
    { id: 'quantity', label: 'Qté' },
    { id: 'total', label: 'Total Ligne' },
];


function AnalyticsPageContent() {
    const { 
        sales: allSales, 
        customers, 
        users, 
        items: allItems,
        categories,
        isLoading, 
        itemsPerPage,
        setItemsPerPage,
    } = usePos();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isClient, setIsClient] = useState(false);
    
    // Filtering state
    const [generalFilter, setGeneralFilter] = useState('');
    const [topArticles, setTopArticles] = useState(10);
    const [topClients, setTopClients] = useState(10);
    const [topCategoriesCount, setTopCategoriesCount] = useState(10);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterItem, setFilterItem] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    
    const dateFilterParam = searchParams.get('date');
    const [isDateFilterLocked, setIsDateFilterLocked] = useState(!!dateFilterParam);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (dateFilterParam) {
            const date = parseISO(dateFilterParam);
            return { from: date, to: date };
        }
        return undefined;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [isFiltersOpen, setFiltersOpen] = useState(false);
    const [isSummaryOpen, setSummaryOpen] = useState(true);
    const [isTopSectionsOpen, setIsTopSectionsOpen] = useState(false);
    const { setTargetInput, inputValue, targetInput } = useKeyboard();
    const generalFilterRef = useRef<HTMLInputElement>(null);
    const itemFilterRef = useRef<HTMLInputElement>(null);
    const customerNameFilterRef = useRef<HTMLInputElement>(null);
    const sellerNameFilterRef = useRef<HTMLInputElement>(null);


    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    const [filterDocTypes, setFilterDocTypes] = useState<Record<string, boolean>>({
        ticket: true,
        invoice: true,
        quote: false,
        delivery_note: false,
        supplier_order: false,
        credit_note: false,
    });
    
    const [salesLinesSortConfig, setSalesLinesSortConfig] = useState<{ key: SalesLinesSortKey, direction: 'asc' | 'desc' }>({ key: 'saleDate', direction: 'desc' });
    const [topItemsSortConfig, setTopItemsSortConfig] = useState<{ key: TopItemsSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
    const [topCustomersSortConfig, setTopCustomersSortConfig] = useState<{ key: TopCustomersSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
    const [topCategoriesSortConfig, setTopCategoriesSortConfig] = useState<{ key: TopCategoriesSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });


    const [selectedTopItems, setSelectedTopItems] = useState<string[]>([]);
    const [selectedTopCustomers, setSelectedTopCustomers] = useState<string[]>([]);
    const [selectedTopCategories, setSelectedTopCategories] = useState<string[]>([]);
    const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isMarginColumnVisible, setIsMarginColumnVisible] = useState(false);

    const [periodFilter, setPeriodFilter] = useState<'today' | 'this_week' | 'this_month' | 'none'>('none');
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    
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
        if (targetInput?.name === 'analytics-general-filter') setGeneralFilter(inputValue);
        if (targetInput?.name === 'analytics-item-filter') setFilterItem(inputValue);
    }, [inputValue, targetInput]);
    
     useEffect(() => {
        const storedSalesColumns = localStorage.getItem('reportsVisibleColumns');
        if(storedSalesColumns) {
            setIsMarginColumnVisible(JSON.parse(storedSalesColumns)['margin'] === true);
        }

        const storedAnalyticsColumns = localStorage.getItem('analyticsVisibleColumns');
        if (storedAnalyticsColumns) {
            setVisibleColumns(JSON.parse(storedAnalyticsColumns));
        } else {
             setVisibleColumns({
                saleDate: true,
                ticketNumber: true,
                name: true,
                details: true,
                categoryName: true,
                barcode: false,
                customerName: false,
                userName: true,
                quantity: true,
                total: true,
            });
        }
    }, []);
    
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
        localStorage.setItem('analyticsVisibleColumns', JSON.stringify(newVisibility));
    };

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

    const flattenedItems = useMemo(() => {
        if (!allSales || !allItems || !categories) return [];
        return allSales
            .flatMap(sale => 
                sale.items.map(item => {
                    const fullItem = allItems.find(i => i.id === item.itemId);
                    return {
                        ...item,
                        saleId: sale.id,
                        saleDate: getDateFromSale(sale),
                        ticketNumber: sale.ticketNumber,
                        documentType: sale.documentType || (sale.ticketNumber?.startsWith('Tick-') ? 'ticket' : 'invoice'),
                        customerId: sale.customerId,
                        customerName: getCustomerName(sale.customerId),
                        userId: sale.userId,
                        userName: getUserName(sale.userId, sale.userName),
                        categoryId: fullItem?.categoryId,
                        categoryName: categories.find(c => c.id === fullItem?.categoryId)?.name || 'Non Catégorisée',
                    }
                })
            );
    }, [allSales, getCustomerName, getUserName, allItems, categories]);


    const filteredItems = useMemo(() => {
        if (generalFilter.trim() === '*') {
            return flattenedItems;
        }
        const activeDocTypes = Object.entries(filterDocTypes)
            .filter(([, isActive]) => isActive)
            .map(([type]) => type);

        const searchTerms = generalFilter.toLowerCase().split('/').map(term => term.trim()).filter(Boolean);

        return flattenedItems.filter(item => {
            const customerMatch = !filterCustomer || item.customerName.toLowerCase().includes(filterCustomer.toLowerCase());
            const itemMatch = !filterItem || item.name.toLowerCase().includes(filterItem.toLowerCase()) || (item.barcode && item.barcode.toLowerCase().includes(filterItem.toLowerCase()));
            const sellerMatch = !filterSeller || item.userName.toLowerCase().includes(filterSeller.toLowerCase());
            const categoryMatch = filterCategory === 'all' || item.categoryId === filterCategory;

            let dateMatch = true;
            if (dateRange?.from) dateMatch = item.saleDate >= startOfDay(dateRange.from);
            if (dateRange?.to) dateMatch = dateMatch && item.saleDate <= endOfDay(dateRange.to);
            
            const docTypeMatch = activeDocTypes.includes(item.documentType);

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
                    item.ticketNumber,
                    item.name,
                    item.barcode,
                    item.customerName,
                    item.userName,
                    item.categoryName,
                    item.note,
                    ...(item.serialNumbers || []),
                    ...(item.selectedVariants?.map(v => `${v.name}: ${v.value}`) || [])
                ].filter(Boolean).join(' ').toLowerCase();
                
                let match = isStartsWith ? searchableText.startsWith(currentTerm) : searchableText.includes(currentTerm);
                return isNegation ? !match : match;
            });
             
            const selectedItemsMatch = selectedTopItems.length === 0 || selectedTopItems.includes(item.name);
            const selectedCustomersMatch = selectedTopCustomers.length === 0 || selectedTopCustomers.includes(item.customerName);
            const selectedCategoriesMatch = selectedTopCategories.length === 0 || selectedTopCategories.includes(item.categoryName);


            return customerMatch && itemMatch && sellerMatch && dateMatch && docTypeMatch && generalMatch && categoryMatch && selectedItemsMatch && selectedCustomersMatch && selectedCategoriesMatch;
        });
    }, [flattenedItems, filterCustomer, filterItem, filterSeller, dateRange, filterDocTypes, generalFilter, filterCategory, selectedTopItems, selectedTopCustomers, selectedTopCategories]);
    

    const { stats, topItems, topCustomers, topCategories } = useMemo(() => {
        const revenue = filteredItems.reduce((acc, item) => acc + item.total, 0);
        const totalSold = filteredItems.reduce((acc, item) => acc + item.quantity, 0);
        const uniqueSales = new Set(filteredItems.map(item => item.saleId)).size;
        const averageBasket = uniqueSales > 0 ? revenue / uniqueSales : 0;
        
        const totalMargin = filteredItems.reduce((acc, item) => {
            const catalogItem = allItems.find(i => i.id === item.itemId);
            const purchasePrice = catalogItem?.purchasePrice || 0;
            const lineMargin = (item.total - (purchasePrice * item.quantity));
            return acc + lineMargin;
        }, 0);

        const itemStats = filteredItems.reduce((acc, item) => {
            const catalogItem = allItems.find(i => i.id === item.itemId);
            const itemName = catalogItem?.name || item.name;
            if(!acc[itemName]) {
                acc[itemName] = { name: itemName, quantity: 0, revenue: 0 };
            }
            acc[itemName].quantity += item.quantity;
            acc[itemName].revenue += item.total;
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
        
        const categoryStats = filteredItems.reduce((acc, item) => {
            const categoryId = item.categoryId || 'uncategorized';
            const categoryName = item.categoryName || 'Non Catégorisée';

            if(!acc[categoryId]) {
                acc[categoryId] = { name: categoryName, quantity: 0, revenue: 0 };
            }
            acc[categoryId].quantity += item.quantity;
            acc[categoryId].revenue += item.total;
            return acc;
        }, {} as Record<string, {name: string, quantity: number, revenue: number}>);

        Object.values(customerStats).forEach(cust => {
            cust.basketTotal = cust.visits > 0 ? cust.revenue / cust.visits : 0;
        });

        const activeDocTypes = Object.entries(filterDocTypes).filter(([,isActive]) => isActive).map(([type]) => documentTypes[type as keyof typeof documentTypes]?.type);
        let summaryTitle = "Total";
        const uniqueTypes = [...new Set(activeDocTypes)].filter(Boolean);

        if (uniqueTypes.length === 1) {
            const type = uniqueTypes[0];
            if (type === 'in') summaryTitle = "Revenu Total";
            else if (type === 'out') summaryTitle = "Total Dépensé";
        }

        return {
            stats: { revenue, totalSold, uniqueSales, averageBasket, summaryTitle, totalMargin },
            topItems: Object.values(itemStats),
            topCustomers: Object.values(customerStats),
            topCategories: Object.values(categoryStats),
        };
    }, [filteredItems, filterDocTypes, allItems]);


    const sortedAndPaginatedSalesLines = useMemo(() => {
        const sorted = [...filteredItems].sort((a, b) => {
            const { key, direction } = salesLinesSortConfig;
            const aValue = a[key];
            const bValue = b[key];
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sorted.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, salesLinesSortConfig, itemsPerPage]);

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
    
    const sortedTopCategories = useMemo(() => {
        return [...topCategories].sort((a, b) => {
            const { key, direction } = topCategoriesSortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        }).slice(0, topCategoriesCount);
    }, [topCategories, topCategoriesCount, topCategoriesSortConfig]);
    
    const requestSort = (key: SalesLinesSortKey | TopItemsSortKey | TopCustomersSortKey | TopCategoriesSortKey, table: 'salesLines' | 'topItems' | 'topCustomers' | 'topCategories') => {
        let direction: 'asc' | 'desc' = 'asc';
        let sortConfig: any, setSortConfig: any;

        switch (table) {
            case 'salesLines': sortConfig = salesLinesSortConfig; setSortConfig = setSalesLinesSortConfig; break;
            case 'topItems': sortConfig = topItemsSortConfig; setSortConfig = setTopItemsSortConfig; break;
            case 'topCustomers': sortConfig = topCustomersSortConfig; setSortConfig = setTopCustomersSortConfig; break;
            case 'topCategories': sortConfig = topCategoriesSortConfig; setSortConfig = setTopCategoriesSortConfig; break;
        }

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction } as any);
    };

    const getSortIcon = (key: string, table: 'salesLines' | 'topItems' | 'topCustomers' | 'topCategories') => {
        const sortConfig = table === 'salesLines' ? salesLinesSortConfig : table === 'topItems' ? topItemsSortConfig : table === 'topCustomers' ? topCustomersSortConfig : topCategoriesSortConfig;
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        }
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    }


    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const resetFilters = () => {
        setFilterCategory('all');
        setFilterCustomer('');
        setFilterItem('');
        setFilterSeller('');
        setDateRange(undefined);
        setGeneralFilter('');
        setSelectedTopItems([]);
        setSelectedTopCustomers([]);
        setSelectedTopCategories([]);
        setCurrentPage(1);
    }
    
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

    const handleTopCategorySelect = (categoryName: string, isSelected: boolean) => {
        setSelectedTopCategories(prev => 
            isSelected ? [...prev, categoryName] : prev.filter(name => name !== categoryName)
        );
    };
    
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
    <>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Reporting avancé"
          subtitle="Analysez chaque ligne de vente pour des informations détaillées."
        >
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateArrowClick('prev')} disabled={isDateFilterLocked || !dateRange?.from}><ArrowLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={handleSmartDateFilter}>{getSmartDateButtonLabel()}</Button>
                   <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateArrowClick('next')} disabled={isDateFilterLocked || !dateRange?.from}><ArrowRight className="h-4 w-4" /></Button>
              </div>
              <Button asChild variant="secondary">
                  <Link href="/reports">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Rapport Simple
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
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{stats.summaryTitle}</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.revenue.toFixed(2)}€</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nb. de Pièces</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.uniqueSales}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nb. d'Articles Vendus</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalSold}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Panier Moyen</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.averageBasket.toFixed(2)}€</div></CardContent></Card>
                       {isMarginColumnVisible && (
                        <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Marge Brute Réalisée</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold text-emerald-600">{stats.totalMargin.toFixed(2)}€</div></CardContent>
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
                       <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {isDateFilterLocked && <Lock className="mr-2 h-4 w-4 text-destructive" />}
                            {getSmartDateButtonLabel() !== 'Période' ? getSmartDateButtonLabel() : 
                              dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}</> : format(dateRange.from, "d MMMM yyyy", { locale: fr })) : <span>Choisir une période</span>
                            }
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                  </Popover>
                  <Input ref={customerNameFilterRef} placeholder="Filtrer par client..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="max-w-xs h-9" />
                  <Input ref={itemFilterRef} placeholder="Filtrer par article..." value={filterItem} onChange={(e) => setFilterItem(e.target.value)} className="max-w-xs h-9" onFocus={() => setTargetInput({ value: filterItem, name: 'analytics-item-filter', ref: itemFilterRef })}/>
                  <Input ref={sellerNameFilterRef} placeholder="Filtrer par vendeur..." value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="max-w-xs h-9" />
                   <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value)}><SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Filtrer par catégorie" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les catégories</SelectItem>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select>
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
                   <div className="grid gap-2 w-48">
                       <div className="flex justify-between items-center">
                          <Label htmlFor="top-n-categories-slider">Top Catégories</Label>
                          <span className="text-sm font-bold text-primary">{topCategoriesCount}</span>
                      </div>
                       <Slider 
                          id="top-n-categories-slider" 
                          value={[topCategoriesCount]} 
                          onValueChange={(value) => setTopCategoriesCount(value[0])}
                          min={1} 
                          max={100} 
                          step={1} 
                      />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          
           <Collapsible open={isTopSectionsOpen} onOpenChange={setIsTopSectionsOpen} className="mb-4">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start px-0 -ml-2 text-lg font-semibold">
                        <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", !isTopSectionsOpen && "-rotate-90")} />
                        Sections "Top"
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="grid lg:grid-cols-3 gap-4 pt-2">
                        <Card>
                          <CardHeader>
                              <div className="flex items-center justify-between">
                                  <CardTitle>Top {topArticles} Articles</CardTitle>
                                  {selectedTopItems.length > 0 && (
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedTopItems([])}>
                                          <X className="mr-2 h-4 w-4" /> Effacer
                                      </Button>
                                  )}
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow>
                                      <TableHead className="w-10"></TableHead>
                                      <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topItems')}>Article {getSortIcon('name', 'topItems')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'topItems')}>Quantité {getSortIcon('quantity', 'topItems')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topItems')}>Revenu {getSortIcon('revenue', 'topItems')}</Button></TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                      {sortedTopItems.map((i, index) => <TableRow key={`${i.name}-${index}`}>
                                          <TableCell><Checkbox checked={selectedTopItems.includes(i.name)} onCheckedChange={(checked) => handleTopItemSelect(i.name, !!checked)} /></TableCell>
                                          <TableCell>{i.name}</TableCell>
                                          <TableCell className="text-right">{i.quantity}</TableCell>
                                          <TableCell className="text-right font-bold">{i.revenue.toFixed(2)}€</TableCell>
                                      </TableRow>)}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader>
                              <div className="flex items-center justify-between">
                                  <CardTitle>Top {topClients} Clients</CardTitle>
                                  {selectedTopCustomers.length > 0 && (
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedTopCustomers([])}>
                                          <X className="mr-2 h-4 w-4" /> Effacer
                                      </Button>
                                  )}
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow>
                                      <TableHead className="w-10"></TableHead>
                                      <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topCustomers')}>Client {getSortIcon('name', 'topCustomers')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('visits', 'topCustomers')}>Visites {getSortIcon('visits', 'topCustomers')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('basketTotal', 'topCustomers')}>Panier Moyen {getSortIcon('basketTotal', 'topCustomers')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topCustomers')}>Revenu {getSortIcon('revenue', 'topCustomers')}</Button></TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                      {sortedTopCustomers.map((c, index) => <TableRow key={`${c.name}-${index}`}>
                                          <TableCell><Checkbox checked={selectedTopCustomers.includes(c.name)} onCheckedChange={(checked) => handleTopCustomerSelect(c.name, !!checked)} /></TableCell>
                                          <TableCell>{c.name}</TableCell>
                                          <TableCell className="text-right">{c.visits}</TableCell>
                                          <TableCell className="text-right">{c.basketTotal.toFixed(2)}€</TableCell>
                                          <TableCell className="text-right font-bold">{c.revenue.toFixed(2)}€</TableCell>
                                      </TableRow>)}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                       <Card>
                          <CardHeader>
                              <div className="flex items-center justify-between">
                                  <CardTitle>Top {topCategoriesCount} Catégories</CardTitle>
                                  {selectedTopCategories.length > 0 && (
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedTopCategories([])}>
                                          <X className="mr-2 h-4 w-4" /> Effacer
                                      </Button>
                                  )}
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow>
                                      <TableHead className="w-10"></TableHead>
                                      <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'topCategories')}>Catégorie {getSortIcon('name', 'topCategories')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'topCategories')}>Quantité {getSortIcon('quantity', 'topCategories')}</Button></TableHead>
                                      <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('revenue', 'topCategories')}>Revenu {getSortIcon('revenue', 'topCategories')}</Button></TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                      {sortedTopCategories.map((c, index) => <TableRow key={`${c.name}-${index}`}>
                                          <TableCell><Checkbox checked={selectedTopCategories.includes(c.name)} onCheckedChange={(checked) => handleTopCategorySelect(c.name, !!checked)}/></TableCell>
                                          <TableCell>{c.name}</TableCell>
                                          <TableCell className="text-right">{c.quantity}</TableCell>
                                          <TableCell className="text-right font-bold">{c.revenue.toFixed(2)}€</TableCell>
                                      </TableRow>)}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                    </div>
                </CollapsibleContent>
           </Collapsible>
          
          <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                          Détail des Lignes de Vente ({filteredItems.length})
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <CardContent>
                  <ScrollArea className="h-[600px]">
                      <Table>
                          <TableHeader><TableRow>
                              {visibleColumns.saleDate && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('saleDate', 'salesLines')}>Date {getSortIcon('saleDate', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.ticketNumber && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('ticketNumber', 'salesLines')}>Pièce {getSortIcon('ticketNumber', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.name && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('name', 'salesLines')}>Désignation {getSortIcon('name', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.details && <TableHead>Détails</TableHead>}
                              {visibleColumns.categoryName && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('categoryName', 'salesLines')}>Catégorie {getSortIcon('categoryName', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.barcode && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('barcode', 'salesLines')}>Référence {getSortIcon('barcode', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.customerName && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('customerName', 'salesLines')}>Client {getSortIcon('customerName', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.userName && <TableHead><Button variant="ghost" className="px-0" onClick={() => requestSort('userName', 'salesLines')}>Vendeur {getSortIcon('userName', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.quantity && <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('quantity', 'salesLines')}>Qté {getSortIcon('quantity', 'salesLines')}</Button></TableHead>}
                              {visibleColumns.total && <TableHead className="text-right"><Button variant="ghost" className="px-0" onClick={() => requestSort('total', 'salesLines')}>Total Ligne {getSortIcon('total', 'salesLines')}</Button></TableHead>}
                          </TableRow></TableHeader>
                          <TableBody>
                              {sortedAndPaginatedSalesLines.map((item, index) => (
                                  <TableRow key={item.id + index}>
                                      {visibleColumns.saleDate && <TableCell className="text-xs"><ClientFormattedDate date={item.saleDate} formatString="dd/MM/yy HH:mm" /></TableCell>}
                                      {visibleColumns.ticketNumber && <TableCell>
                                          <button onClick={() => openSaleDetailModal(item.saleId)} className="text-blue-600 hover:underline">
                                              <Badge variant="secondary">{item.ticketNumber}</Badge>
                                          </button>
                                      </TableCell>}
                                      {visibleColumns.name && <TableCell>
                                          <div className="font-medium">{item.name}</div>
                                      </TableCell>}
                                      {visibleColumns.details && (
                                          <TableCell className="text-xs text-muted-foreground max-w-xs">
                                              {item.selectedVariants && item.selectedVariants.length > 0 && (
                                                  <div className="capitalize">
                                                      {item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                                  </div>
                                              )}
                                              {item.note && (
                                                  <div className="text-amber-600 mt-1 flex items-start gap-1.5">
                                                      <Pencil className="h-3 w-3 mt-0.5 shrink-0"/>
                                                      <span>{item.note}</span>
                                                  </div>
                                              )}
                                              {item.serialNumbers && item.serialNumbers.length > 0 && (
                                                  <div className="mt-1">
                                                      <span className="font-semibold">N/S:</span> {item.serialNumbers.filter(sn => sn).join(', ')}
                                                  </div>
                                              )}
                                          </TableCell>
                                      )}
                                      {visibleColumns.categoryName && <TableCell><Badge variant="outline">{item.categoryName}</Badge></TableCell>}
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
      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSale}
      />
       {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg"
            size="icon"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        )}
    </>
  );
}

export default function AnalyticsPage() {
    return (
        <Suspense>
            <AnalyticsPageContent />
        </Suspense>
    )
}

    
