
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, ArrowUpDown, Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem } from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';


type SortKey = 'name' | 'price' | 'categoryId';

export default function ItemsPage() {
  const { items, categories, vatRates, deleteItem, toggleItemFavorite, isLoading } = usePos();
  const { user } = useUser();
  const isCashier = user?.role === 'cashier';
  const router = useRouter();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

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
      const categoryMatch = filterCategory === 'all' || item.categoryId === filterCategory;
      return nameMatch && categoryMatch;
    });

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            let aValue, bValue;
            if(sortConfig.key === 'categoryId') {
                aValue = getCategoryName(a.categoryId);
                bValue = getCategoryName(b.categoryId);
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
            // Add secondary sort by id to stabilize
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });
    }

    return filtered;
  }, [items, filterName, filterCategory, sortConfig, categories]);

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

  return (
    <>
      <PageHeader title="Gérer les articles" subtitle={isClient && items ? `Vous avez ${items.length} articles au total.` : "Ajoutez, modifiez ou supprimez des produits."}>
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {!isCashier && (
            <Button onClick={() => router.push('/management/items/form')}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un article
            </Button>
        )}
      </PageHeader>

      <Card className="mt-8">
        <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Input
                placeholder="Filtrer par nom..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="max-w-sm"
              />
              <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryPopoverOpen}
                    className="w-[200px] justify-between"
                  >
                    {filterCategory === 'all'
                      ? "Toutes les catégories"
                      : categories?.find((cat) => cat.id === filterCategory)?.name}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher une catégorie..." />
                    <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFilterCategory("all");
                          setCategoryPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filterCategory === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Toutes les catégories
                      </CommandItem>
                      {categories && categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => {
                            setFilterCategory(cat.id === filterCategory ? "all" : cat.id);
                            setCategoryPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filterCategory === cat.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  <TableHead>TVA (%)</TableHead>
                  <TableHead className="text-right">
                     <Button variant="ghost" onClick={() => requestSort('price')} className="justify-end w-full">
                        Prix {getSortIcon('price')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || !isClient) && Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="w-10 h-10 rounded-md"/></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {isClient && !isLoading && sortedAndFilteredItems && sortedAndFilteredItems.map(item => (
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
                    <TableCell>{getVatRate(item.vatId)}%</TableCell>
                    <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => !isCashier && toggleItemFavorite(item.id)} disabled={isCashier}>
                           <Star className={cn("h-4 w-4", item.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => !isCashier && router.push(`/management/items/form?id=${item.id}`)} disabled={isCashier}>
                           <Edit className="h-4 w-4"/>
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => !isCashier && setItemToDelete(item)} disabled={isCashier}>
                           <Trash2 className="h-4 w-4"/>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

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
