
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
import { usePos } from '@/contexts/pos-context';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryDialog({ isOpen, onClose }: AddCategoryDialogProps) {
  const { toast } = useToast();
  const { addCategory } = usePos();
  const [name, setName] = useState('');

  const handleAddCategory = () => {
    if (!name) {
        toast({
            variant: 'destructive',
            title: 'Nom requis',
            description: 'Le nom de la catégorie est obligatoire.',
        });
        return;
    }
    addCategory({
        name,
        image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100/100`
    });
    toast({
      title: 'Catégorie ajoutée',
      description: 'La nouvelle catégorie a été créée avec succès.',
    });
    setName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Saisissez les détails de la nouvelle catégorie.
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
          <Button onClick={handleAddCategory}>Ajouter Catégorie</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
