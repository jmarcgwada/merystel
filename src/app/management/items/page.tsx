
'use client';

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, ArrowUpDown, RefreshCw, ArrowLeft, ArrowRight, Package, LayoutDashboard, SlidersHorizontal, EyeOff, Columns, X, FilePen, Truck, ChevronDown } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
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
import type { Item, Category, VatRate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { v4 as uuidv4 } from 'uuid';
import { EditItemDialog } from './components/edit-item-dialog';


type SortKey = 'name' | 'price' | 'categoryId' | 'purchasePrice' | 'barcode' | 'stock' | 'supplierId' | 'vatId';

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                setState(JSON.parse(storedValue));
            }
        } catch (error) {
            console.error("Error reading localStorage key " + key + ":", error);
        }
    }, [key]);

    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error("Error setting localStorage key " + key + ":", error);
            }
        }
    }, [key, state, isHydrated]);

    return [state, setState];
}

function ItemsPageContent() {
  const { items, categories, suppliers, vatRates, deleteItem, toggleItemFavorite, updateItem, isLoading, itemsPerPage, setItemsPerPage } = usePos();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [filterName, setFilterName] = useState(searchParams.get('name') || '');
  const [filterCategoryName, setFilterCategoryName] = useState(searchParams.get('categoryName') || '');
  const [filterVatId, setFilterVatId] = useState(searchParams.get('vatId') || 'all');
  const [filterRequiresSerialNumber, setFilterRequiresSerialNumber] = useState<'all' | 'yes'>(searchParams.get('requiresSerialNumber') === 'yes' ? 'yes' : 'all');
  const [filterHasVariants, setFilterHasVariants] = useState<'all' | 'yes'>(searchParams.get('hasVariants') === 'yes' ? 'yes' : 'all');
  const [filterIsDisabled, setFilterIsDisabled] = useState<'no' | 'yes' | 'all'>(searchParams.get('isDisabled') as any || 'no');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [showDescription, setShowDescription] = usePersistentState('management.items.showDescription', false);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (filterName) params.set('name', filterName); else params.delete('name');
    if (filterCategoryName) params.set('categoryName', filterCategoryName); else params.delete('categoryName');
    if (filterVatId !== 'all') params.set('vatId', filterVatId); else params.delete('vatId');
    if (filterRequiresSerialNumber !== 'all') params.set('requiresSerialNumber', filterRequiresSerialNumber); else params.delete('requiresSerialNumber');
    if (filterHasVariants !== 'all') params.set('hasVariants', filterHasVariants); else params.delete('hasVariants');
    if (filterIsDisabled !== 'no') params.set('isDisabled', filterIsDisabled); else params.delete('isDisabled');
    if (currentPage > 1) params.set('page', String(currentPage)); else params.delete('page');
    
    router.replace(`/management/items?${params.toString()}`);
  }, [filterName, filterCategoryName, filterVatId, filterRequiresSerialNumber, filterHasVariants, filterIsDisabled, currentPage, router]);

  useEffect(() => {
    setItemsPerPageState(itemsPerPage);
  }, [itemsPerPage]);

   useEffect(() => {
        const storedColumns = localStorage.getItem('itemsVisibleColumns');
        if (storedColumns) {
            setVisibleColumns(JSON.parse(storedColumns));
        } else {
             setVisibleColumns({
                image: true,
                name: true,
                barcode: true,
                category: true,
                supplier: true,
                stock: true,
                vat: true,
                purchasePrice: false,
                price: true,
            });
        }
    }, []);

    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newVisibility = { ...visibleColumns, [columnId]: isVisible };
        setVisibleColumns(newVisibility);
        localStorage.setItem('itemsVisibleColumns', JSON.stringify(newVisibility));
    };

    const columnsConfig = [
        { id: 'image', label: 'Image' },
        { id: 'name', label: 'Nom' },
        { id: 'barcode', label: 'Référence' },
        { id: 'category', label: 'Catégorie' },
        { id: 'supplier', label: 'Fournisseur' },
        { id: 'stock', label: 'Stock' },
        { id: 'vat', label: 'Code TVA' },
        { id: 'purchasePrice', label: 'Prix Achat' },
        { id: 'price', label: 'Prix Vente' },
    ];


  const getCategoryName = (categoryId?: string) => {
    if(!categoryId) return 'N/A';
    return categories?.find(c => c.id === categoryId)?.name || 'N/A';
  }

  const getSupplierName = (supplierId?: string) => {
    if(!supplierId) return 'N/A';
    return suppliers?.find(s => s.id === supplierId)?.name || 'N/A';
  }

  const sortedAndFilteredItems = useMemo(() => {
    if (!items || !categories) return [];

    let filtered = items.filter(item => {
      const nameOrBarcodeMatch = item.name.toLowerCase().includes(filterName.toLowerCase()) || (item.barcode && item.barcode.toLowerCase().includes(filterName.toLowerCase()));
      const categoryName = getCategoryName(item.categoryId).toLowerCase();
      const categoryMatch = categoryName.includes(filterCategoryName.toLowerCase());
      const vatMatch = filterVatId === 'all' || item.vatId === filterVatId;
      const serialMatch = filterRequiresSerialNumber === 'all' || (item.requiresSerialNumber ? 'yes' : 'no') === filterRequiresSerialNumber;
      const variantsMatch = filterHasVariants === 'all' || (item.hasVariants ? 'yes' : 'no') === filterHasVariants;
      const disabledMatch = filterIsDisabled === 'all' || (item.isDisabled ? 'yes' : 'no') === filterIsDisabled;
      
      return nameOrBarcodeMatch && categoryMatch && vatMatch && serialMatch && variantsMatch && disabledMatch;
    });

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            let aValue, bValue;
            if(sortConfig.key === 'categoryId') {
                aValue = getCategoryName(a.categoryId);
                bValue = getCategoryName(b.categoryId);
            } else if (sortConfig.key === 'supplierId') {
                aValue = getSupplierName(a.supplierId);
                bValue = getSupplierName(b.supplierId);
            }
            else {
                aValue = a[sortConfig.key as keyof Item] ?? 0;
                bValue = b[sortConfig.key as keyof Item] ?? 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            // Add secondary sort by id to stabilize
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });
    }

    return filtered;
  }, [items, filterName, filterCategoryName, filterVatId, filterRequiresSerialNumber, filterHasVariants, filterIsDisabled, sortConfig, categories, suppliers]);

  const totalPages = Math.ceil(sortedAndFilteredItems.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredItems, currentPage, itemsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(paginatedItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  };


  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const handleDeleteItem = () => {
    if(itemToDelete) {
      deleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  }

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  }

  const StockBadge = ({ item }: { item: Item }) => {
    if (!item.manageStock) {
        return <Badge variant="outline" className="font-normal text-muted-foreground">Non suivi</Badge>;
    }
    
    if (item.stock === undefined) {
        return <Badge variant="secondary">N/A</Badge>
    }

    let badgeClass = "bg-green-100 text-green-800";
    let tooltipContent = `Stock: ${item.stock}`;

    if (item.stock <= 0) {
        badgeClass = "bg-red-100 text-red-800";
        tooltipContent = "Rupture de stock";
    } else if (item.lowStockThreshold && item.stock <= item.lowStockThreshold) {
        badgeClass = "bg-yellow-100 text-yellow-800";
        tooltipContent = `Stock faible: ${item.stock} (seuil: ${item.lowStockThreshold})`;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Badge className={badgeClass}>{item.stock}</Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  };
  
  const resetFilters = () => {
    setFilterName('');
    setFilterCategoryName('');
    setFilterVatId('all');
    setFilterRequiresSerialNumber('all');
    setFilterHasVariants('all');
    setFilterIsDisabled('no');
    setCurrentPage(1);
  };

  const bulkEditLink = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ids', selectedItemIds.join(','));
    return `/management/items/bulk-edit?${params.toString()}`;
  }, [selectedItemIds, searchParams]);

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

  const openAddItemModal = () => {
      setItemToEdit(null);
      setIsEditModalOpen(true);
  }
  
  const openEditItemModal = (item: Item) => {
      setItemToEdit(item);
      setIsEditModalOpen(true);
  }

  const pageTitle = (
    <div className="flex items-center gap-4">
      <span>Articles</span>
      <span className="text-base font-normal text-muted-foreground">
          ({sortedAndFilteredItems.length} / {items?.length || 0})
      </span>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
    </div>
  );


  return (
    <>
      <PageHeader 
        title={pageTitle} 
        subtitle={isClient && items ? `Page ${currentPage} sur ${totalPages} (${sortedAndFilteredItems.length} articles sur ${items.length} au total)` : "Ajoutez, modifiez ou supprimez des produits."}
      >
        <div className="flex items-center gap-2">
            {selectedItemIds.length > 0 && (
                <Button asChild>
                    <Link href={bulkEditLink}>
                        <FilePen className="mr-2 h-4 w-4" />
                        Modifier la sélection ({selectedItemIds.length})
                    </Link>
                </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
             <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button onClick={openAddItemModal}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un article
            </Button>
        </div>
      </PageHeader>

      <div className="mt-8">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
            <Card className="mb-4">
                <CardHeader className="p-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="justify-start px-2 text-lg font-semibold">
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    Filtres
                                    <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isFiltersOpen && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>
                             <div className="relative">
                               <Input 
                                  placeholder="Filtrer par nom ou référence..."
                                  value={filterName}
                                  onChange={(e) => {
                                    setFilterName(e.target.value);
                                    setCurrentPage(1);
                                  }}
                                  className="h-9 w-full sm:w-auto"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                             <Select value={filterIsDisabled} onValueChange={(value) => { setFilterIsDisabled(value as any); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[220px] h-9">
                                    <SelectValue placeholder="Statut de l'article" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no">Articles activés</SelectItem>
                                    <SelectItem value="yes">Articles désactivés</SelectItem>
                                    <SelectItem value="all">Tous les articles</SelectItem>
                                </SelectContent>
                            </Select>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={resetFilters}><X className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent><p>Réinitialiser les filtres</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-1 shrink-0">
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
                                                max={100}
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
                    </div>
                </CardHeader>
                 <CollapsibleContent>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-0">
                        <Input
                            placeholder="Filtrer par catégorie..."
                            value={filterCategoryName}
                            onChange={(e) => { setFilterCategoryName(e.target.value); setCurrentPage(1); }}
                            className="h-9"
                        />
                        <Select value={filterVatId} onValueChange={(value) => { setFilterVatId(value); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Taux de TVA" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toute la TVA</SelectItem>
                                {vatRates.map(vat => (
                                    <SelectItem key={vat.id} value={vat.id}>
                                        {vat.name} ({vat.rate}%)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2 rounded-md border p-2 h-9">
                            <Switch id="serial-filter" checked={filterRequiresSerialNumber === 'yes'} onCheckedChange={(checked) => setFilterRequiresSerialNumber(checked ? 'yes' : 'all')} />
                            <Label htmlFor="serial-filter" className="text-sm">Avec N/S</Label>
                        </div>
                         <div className="flex items-center space-x-2 rounded-md border p-2 h-9">
                            <Switch id="variants-filter" checked={filterHasVariants === 'yes'} onCheckedChange={(checked) => setFilterHasVariants(checked ? 'yes' : 'all')} />
                            <Label htmlFor="variants-filter" className="text-sm">Avec déclinaisons</Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2 h-9">
                            <Switch id="description-filter" checked={showDescription} onCheckedChange={setShowDescription} />
                            <Label htmlFor="description-filter" className="text-sm">Afficher descriptions</Label>
                        </div>
                    </CardContent>
                 </CollapsibleContent>
            </Card>
        </Collapsible>

        <Card>
          <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItemIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    {visibleColumns.image && <TableHead className="w-[80px]">Image</TableHead>}
                    {visibleColumns.name && <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('name')}>
                          Nom {getSortIcon('name')}
                      </Button>
                    </TableHead>}
                    {visibleColumns.barcode && <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('barcode')}>
                          Référence {getSortIcon('barcode')}
                      </Button>
                    </TableHead>}
                    {visibleColumns.category && <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('categoryId')}>
                          Catégorie {getSortIcon('categoryId')}
                      </Button>
                    </TableHead>}
                    {visibleColumns.supplier && <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('supplierId')}>
                          Fournisseur {getSortIcon('supplierId')}
                      </Button>
                    </TableHead>}
                     {visibleColumns.stock && <TableHead className="text-center">
                        <Button variant="ghost" onClick={() => requestSort('stock')}>
                            Stock {getSortIcon('stock')}
                        </Button>
                    </TableHead>}
                     {visibleColumns.vat && <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('vatId')}>
                            TVA {getSortIcon('vatId')}
                        </Button>
                    </TableHead>}
                    {visibleColumns.purchasePrice && <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('purchasePrice')} className="justify-end w-full">
                            Prix Achat {getSortIcon('purchasePrice')}
                        </Button>
                    </TableHead>}
                    {visibleColumns.price && <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => requestSort('price')} className="justify-end w-full">
                          Prix Vente {getSortIcon('price')}
                      </Button>
                    </TableHead>}
                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isLoading || !isClient) && Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={uuidv4()}>
                      <TableCell><Skeleton className="h-4 w-4"/></TableCell>
                      {Object.values(visibleColumns).filter(v => v).map((isVisible, index) => isVisible ? <TableCell key={index}><Skeleton className="h-4 w-full" /></TableCell> : null)}
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {isClient && !isLoading && paginatedItems && paginatedItems.map((item, index) => {
                    const vatInfo = vatRates.find(v => v.id === item.vatId);
                    return (
                        <TableRow key={`${item.id}-${index}`} className={cn(item.isDisabled && "bg-muted/50 text-muted-foreground", selectedItemIds.includes(item.id) && "bg-blue-50 dark:bg-blue-900/30")}>
                        <TableCell>
                            <Checkbox
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            />
                        </TableCell>
                        {visibleColumns.image && <TableCell>
                            <Image 
                            src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            data-ai-hint="product image"
                            />
                        </TableCell>}
                        {visibleColumns.name && <TableCell className="font-medium">
                          {item.name}
                          {showDescription && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.description}</p>
                          )}
                        </TableCell>}
                        {visibleColumns.barcode && <TableCell className="font-mono text-xs">{item.barcode}</TableCell>}
                        {visibleColumns.category && <TableCell>
                            <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                        </TableCell>}
                        {visibleColumns.supplier && <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1.5"><Truck className="h-3 w-3"/>{getSupplierName(item.supplierId)}</Badge>
                        </TableCell>}
                        {visibleColumns.stock && <TableCell className="text-center">
                            <StockBadge item={item} />
                        </TableCell>}
                         {visibleColumns.vat && (
                            <TableCell>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline">{vatInfo?.code || '-'}</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Taux: {vatInfo?.rate.toFixed(2)}%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                         )}
                        {visibleColumns.purchasePrice && <TableCell className="text-right">{item.purchasePrice?.toFixed(2) || '0.00'}€</TableCell>}
                        {visibleColumns.price && <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>}
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon" onClick={() => toggleItemFavorite(item.id)}>
                                    <Star className={cn("h-4 w-4", item.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditItemModal(item)} >
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}>
                                    <Trash2 className="h-4 w-4"/>
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
      <EditItemDialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} item={itemToEdit} />
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article "{itemToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ItemsPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ItemsPageContent />
        </Suspense>
    )
}
    
