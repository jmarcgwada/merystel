
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePos } from '@/contexts/pos-context';
import type { Category } from '@/lib/types';

interface EditCategoryDialogProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCategoryDialog({ category, isOpen, onClose }: EditCategoryDialogProps) {
  const { toast } = useToast();
  const { updateCategory } = usePos();
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleEditCategory = () => {
    if (!name) {
        toast({
            variant: 'destructive',
            title: 'Nom requis',
            description: 'Le nom de la catégorie est obligatoire.',
        });
        return;
    }
    if (category) {
        updateCategory({
            ...category,
            name,
        });
        toast({
          title: 'Catégorie modifiée',
          description: 'La catégorie a été mise à jour avec succès.',
        });
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la catégorie</DialogTitle>
          <DialogDescription>
            Modifiez les détails de la catégorie.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Boissons" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditCategory}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
