
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
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


export default function ItemsPage() {
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isEditItemOpen, setEditItemOpen] = useState(false);
  const { items, categories, deleteItem, toggleItemFavorite } = usePos();
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
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
