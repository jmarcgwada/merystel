
'use client';

import { useState } from 'react';
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

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemDialog({ isOpen, onClose }: AddItemDialogProps) {
  const { toast } = useToast();
  const { categories, vatRates, addItem } = usePos();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vatId, setVatId] = useState('');

  const handleAddItem = () => {
    if (!name || !price || !categoryId || !vatId) {
        toast({
            variant: 'destructive',
            title: 'Champs obligatoires',
            description: 'Veuillez remplir tous les champs.',
        });
        return;
    }
    addItem({
        name,
        price: parseFloat(price),
        categoryId,
        vatId,
        image: `https://picsum.photos/seed/${Date.now()}/200/150`
    });
    toast({
      title: 'Article ajouté',
      description: 'Le nouvel article a été créé avec succès.',
    });
    setName('');
    setPrice('');
    setCategoryId('');
    setVatId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel article</DialogTitle>
          <DialogDescription>
            Remplissez les détails du nouveau produit.
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vat" className="text-right">
              TVA
            </Label>
            <Select onValueChange={setVatId} value={vatId}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionnez un taux de TVA" />
                </SelectTrigger>
                <SelectContent>
                    {vatRates.map(vat => (
                        <SelectItem key={vat.id} value={vat.id}>{vat.name} ({vat.rate}%)</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddItem}>Ajouter Article</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
