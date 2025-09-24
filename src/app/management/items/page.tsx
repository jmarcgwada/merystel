
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, ArrowUpDown } from 'lucide-react';
import { AddItemDialog } from './components/add-item-dialog';
import { EditItemDialog } from './components/edit-item-dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKey = 'name' | 'price';

export default function ItemsPage() {
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isEditItemOpen, setEditItemOpen] = useState(false);
  const { items, categories, deleteItem, toggleItemFavorite } = usePos();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(filterName.toLowerCase());
      const categoryMatch = filterCategory === 'all' || item.categoryId === filterCategory;
      return nameMatch && categoryMatch;
    });

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    return filtered;
  }, [items, filterName, filterCategory, sortConfig]);

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

  const handleOpenEditDialog = (item: Item) => {
    setItemToEdit(item);
    setEditItemOpen(true);
  }

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  }

  return (
    <>
      <PageHeader title="Gérer les articles" subtitle="Ajoutez, modifiez ou supprimez des produits.">
        <Button onClick={() => setAddItemOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
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
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
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
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">
                     <Button variant="ghost" onClick={() => requestSort('price')} className="justify-end w-full">
                        Prix {getSortIcon('price')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredItems.map(item => (
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
                    <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => toggleItemFavorite(item.id)}>
                           <Star className={cn("h-4 w-4", item.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(item)}>
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
      <AddItemDialog isOpen={isAddItemOpen} onClose={() => setAddItemOpen(false)} />
      <EditItemDialog isOpen={isEditItemOpen} onClose={() => setEditItemOpen(false)} item={itemToEdit} />
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
