
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, Utensils } from 'lucide-react';
import { AddCategoryDialog } from './components/add-category-dialog';
import { EditCategoryDialog } from './components/edit-category-dialog';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


export default function CategoriesPage() {
  const [isAddCategoryOpen, setAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setEditCategoryOpen] = useState(false);
  const { categories, deleteCategory, toggleCategoryFavorite, isLoading } = usePos();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  }

  const handleOpenEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setEditCategoryOpen(true);
  }

  return (
    <>
      <PageHeader title="Gérer les catégories" subtitle="Organisez vos articles en catégories.">
        <Button onClick={() => setAddCategoryOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[100px]">Couleur</TableHead>
                <TableHead>Mode Restaurant</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || !isClient) && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {isClient && !isLoading && categories && categories.map(category => (
                <TableRow key={category.id}>
                   <TableCell>
                      <Image 
                        src={category.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                        alt={category.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                        data-ai-hint="category image"
                      />
                    </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: category.color || '#e2e8f0' }} />
                        <span className="text-xs text-muted-foreground">{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.isRestaurantOnly && (
                      <Badge variant="outline">
                        <Utensils className="mr-1 h-3 w-3" />
                        Dédié
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => toggleCategoryFavorite(category.id)}>
                        <Star className={cn("h-4 w-4", category.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCategoryDialog isOpen={isAddCategoryOpen} onClose={() => setAddCategoryOpen(false)} />
      <EditCategoryDialog isOpen={isEditCategoryOpen} onClose={() => setEditCategoryOpen(false)} category={categoryToEdit} />

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie "{categoryToDelete?.name}" et tous les articles associés seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
