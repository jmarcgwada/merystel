
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePos } from '@/contexts/pos-context';
import type { Item } from '@/lib/types';

interface EditItemDialogProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditItemDialog({ item, isOpen, onClose }: EditItemDialogProps) {
  const { toast } = useToast();
  const { categories, updateItem } = usePos();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (item) {
        setName(item.name);
        setPrice(item.price.toString());
        setCategoryId(item.categoryId);
    }
  }, [item])

  const handleEditItem = () => {
    if (!name || !price || !categoryId) {
        toast({
            variant: 'destructive',
            title: 'Champs obligatoires',
            description: 'Veuillez remplir tous les champs.',
        });
        return;
    }
    if (item) {
        updateItem({
            ...item,
            name,
            price: parseFloat(price),
            categoryId,
        });
        toast({
          title: 'Article modifié',
          description: "L'article a été mis à jour avec succès.",
        });
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            Modifiez les détails du produit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Café glacé" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Prix
            </Label>
            <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="ex: 4.50" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Catégorie
            </Label>
            <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditItem}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
