

'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, ArrowUpDown, RefreshCw, ArrowLeft, ArrowRight, Package } from 'lucide-react';
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
import type { Item } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ITEMS_PER_PAGE = 15;
type SortKey = 'name' | 'price' | 'categoryId' | 'purchasePrice' | 'barcode' | 'stock';

export default function ItemsPage() {
  const { items, categories, vatRates, deleteItem, toggleItemFavorite, isLoading } = usePos();
  const router = useRouter();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filterName, setFilterName] = useState('');
  const [filterCategoryName, setFilterCategoryName] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'N/A';
  }

  const getVatRate = (vatId: string) => {
    return vatRates?.find(v => v.id === vatId)?.rate.toFixed(2) || 'N/A';
  }

  const sortedAndFilteredItems = useMemo(() => {
    if (!items || !categories) return [];

    let filtered = items.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(filterName.toLowerCase());
      const categoryName = getCategoryName(item.categoryId).toLowerCase();
      const categoryMatch = categoryName.includes(filterCategoryName.toLowerCase());
      return nameMatch && categoryMatch;
    });

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            let aValue, bValue;
            if(sortConfig.key === 'categoryId') {
                aValue = getCategoryName(a.categoryId);
                bValue = getCategoryName(b.categoryId);
            } else {
                aValue = a[sortConfig.key] ?? 0;
                bValue = b[sortConfig.key] ?? 0;
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
  }, [items, filterName, filterCategoryName, sortConfig, categories]);

  const totalPages = Math.ceil(sortedAndFilteredItems.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredItems, currentPage]);


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


  return (
    <>
      <PageHeader 
        title="Gérer les articles" 
        subtitle={isClient && items ? `Page ${currentPage} sur ${totalPages} (${sortedAndFilteredItems.length} articles sur ${items.length} au total)` : "Ajoutez, modifiez ou supprimez des produits."}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => router.push('/management/items/form')}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
      </PageHeader>

      <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Filtrer par nom..."
                    value={filterName}
                    onChange={(e) => {
                      setFilterName(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-sm"
                  />
                  <Input
                    placeholder="Filtrer par catégorie..."
                    value={filterCategoryName}
                    onChange={(e) => {
                      setFilterCategoryName(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} / {totalPages}
                    </span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('name')}>
                          Nom {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('categoryId')}>
                          Catégorie {getSortIcon('categoryId')}
                      </Button>
                    </TableHead>
                     <TableHead className="text-center">
                        <Button variant="ghost" onClick={() => requestSort('stock')}>
                            Stock {getSortIcon('stock')}
                        </Button>
                    </TableHead>
                      <TableHead className="text-right">
                          <Button variant="ghost" onClick={() => requestSort('purchasePrice')} className="justify-end w-full">
                              Prix Achat {getSortIcon('purchasePrice')}
                          </Button>
                      </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => requestSort('price')} className="justify-end w-full">
                          Prix Vente {getSortIcon('price')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isLoading || !isClient) && Array.from({length: 10}).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-10 h-10 rounded-md"/></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {isClient && !isLoading && paginatedItems && paginatedItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Image 
                          src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          data-ai-hint="product image"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                          <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                          <StockBadge item={item} />
                      </TableCell>
                      <TableCell className="text-right">{item.purchasePrice?.toFixed(2) || '0.00'}€</TableCell>
                      <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
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

    