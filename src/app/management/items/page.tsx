
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, ArrowUpDown, RefreshCw, ArrowLeft, ArrowRight, Package, LayoutDashboard, SlidersHorizontal, EyeOff, Columns, X } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';


type SortKey = 'name' | 'price' | 'categoryId' | 'purchasePrice' | 'barcode' | 'stock';

export default function ItemsPage() {
  const { items, categories, vatRates, deleteItem, toggleItemFavorite, updateItem, isLoading, itemsPerPage } = usePos();
  const router = useRouter();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filterName, setFilterName] = useState('');
  const [filterCategoryName, setFilterCategoryName] = useState('');
  const [filterVatId, setFilterVatId] = useState('all');
  const [filterRequiresSerialNumber, setFilterRequiresSerialNumber] = useState('all');
  const [filterHasVariants, setFilterHasVariants] = useState('all');
  const [filterIsDisabled, setFilterIsDisabled] = useState<'no' | 'yes' | 'all'>('no');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

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
                stock: true,
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
        { id: 'stock', label: 'Stock' },
        { id: 'purchasePrice', label: 'Prix Achat' },
        { id: 'price', label: 'Prix Vente' },
    ];


  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'N/A';
  }

  const getVatRate = (vatId: string) => {
    const rate = vatRates?.find(v => v.id === vatId)?.rate;
    return rate !== undefined ? rate.toFixed(2) : 'N/A';
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
            } else {
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
  }, [items, filterName, filterCategoryName, filterVatId, filterRequiresSerialNumber, filterHasVariants, filterIsDisabled, sortConfig, categories]);

  const totalPages = Math.ceil(sortedAndFilteredItems.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredItems, currentPage, itemsPerPage]);


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
  
  const toggleItemDisabled = (item: Item) => {
    updateItem({ ...item, isDisabled: !item.isDisabled });
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


  return (
    <>
      <PageHeader 
        title="Gérer les articles" 
        subtitle={isClient && items ? `Page ${currentPage} sur ${totalPages} (${sortedAndFilteredItems.length} articles sur ${items.length} au total)` : "Ajoutez, modifiez ou supprimez des produits."}
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
             <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button onClick={() => router.push('/management/items/form')}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un article
            </Button>
        </div>
      </PageHeader>

      <div className="mt-8">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
            <Card className="mb-4">
                <CardHeader className="p-2">
                    <div className="flex items-center justify-between">
                         <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="justify-start px-2 text-lg font-semibold">
                                <SlidersHorizontal className="h-4 w-4 mr-2" />
                                Filtres
                            </Button>
                        </CollapsibleTrigger>
                         <div className="flex items-center gap-2 flex-wrap justify-end">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="icon">
                                              <Columns className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          {columnsConfig.map(column => (
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
                                </TooltipTrigger>
                                <TooltipContent><p>Affichage des colonnes</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

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
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={resetFilters}><X className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent><p>Réinitialiser les filtres</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[70px] text-center px-1">
                                    Page {currentPage} / {totalPages || 1}
                                </div>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                 <CollapsibleContent>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 pt-0">
                        <Input
                            placeholder="Filtrer par nom ou référence..."
                            value={filterName}
                            onChange={(e) => { setFilterName(e.target.value); setCurrentPage(1); }}
                            className="h-9"
                        />
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
                        <Select value={filterRequiresSerialNumber} onValueChange={(value) => { setFilterRequiresSerialNumber(value); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Numéro de série" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="yes">Avec N/S</SelectItem>
                                <SelectItem value="no">Sans N/S</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterHasVariants} onValueChange={(value) => { setFilterHasVariants(value); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Déclinaisons" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="yes">Avec déclinaisons</SelectItem>
                                <SelectItem value="no">Sans déclinaisons</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                 </CollapsibleContent>
            </Card>
        </Collapsible>

        <Card>
          <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
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
                     {visibleColumns.stock && <TableHead className="text-center">
                        <Button variant="ghost" onClick={() => requestSort('stock')}>
                            Stock {getSortIcon('stock')}
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
                  {(isLoading || !isClient) && Array.from({length: 10}).map((_, i) => (
                    <TableRow key={i}>
                      {Object.values(visibleColumns).map((isVisible, index) => isVisible ? <TableCell key={index}><Skeleton className="h-4 w-full" /></TableCell> : null)}
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {isClient && !isLoading && paginatedItems && paginatedItems.map(item => (
                    <TableRow key={item.id} className={cn(item.isDisabled && "bg-muted/50 text-muted-foreground")}>
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
                      {visibleColumns.name && <TableCell className="font-medium">{item.name}</TableCell>}
                      {visibleColumns.barcode && <TableCell className="font-mono text-xs">{item.barcode}</TableCell>}
                      {visibleColumns.category && <TableCell>
                          <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                      </TableCell>}
                      {visibleColumns.stock && <TableCell className="text-center">
                          <StockBadge item={item} />
                      </TableCell>}
                      {visibleColumns.purchasePrice && <TableCell className="text-right">{item.purchasePrice?.toFixed(2) || '0.00'}€</TableCell>}
                      {visibleColumns.price && <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => toggleItemFavorite(item.id)}>
                            <Star className={cn("h-4 w-4", item.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/management/items/form?id=${item.id}`)} >
                            <Edit className="h-4 w-4"/>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>

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

