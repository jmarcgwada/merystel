

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
import { Switch } from '@/components/ui/switch';
import type { Category } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (category: Category) => void;
}

export function AddCategoryDialog({ isOpen, onClose, onCategoryAdded }: AddCategoryDialogProps) {
  const { toast } = useToast();
  const { addCategory, categories } = usePos();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#e2e8f0');
  const [isRestaurantOnly, setIsRestaurantOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const randomCode = `CAT-${uuidv4().substring(0, 4).toUpperCase()}`;
      setCode(randomCode);
    }
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (!name) {
        toast({
            variant: 'destructive',
            title: 'Nom requis',
            description: 'Le nom de la catégorie est obligatoire.',
        });
        return;
    }
     if (!code || categories.some(c => c.code === code)) {
      toast({
        variant: 'destructive',
        title: 'Code invalide',
        description: 'Le code de la catégorie est obligatoire et doit être unique.',
      });
      return;
    }

    const newCategory = await addCategory({
        name,
        code,
        image: `https://picsum.photos/seed/${new Date().getTime()}/100/100`,
        color: color,
        isRestaurantOnly,
    });
    
    if (newCategory) {
        toast({
          title: 'Catégorie ajoutée',
          description: 'La nouvelle catégorie a été créée avec succès.',
        });
        if (onCategoryAdded) {
            onCategoryAdded(newCategory);
        }
        setName('');
        setCode('');
        setColor('#e2e8f0');
        setIsRestaurantOnly(false);
        onClose();
    }
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Couleur
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="restaurant-only" className="text-base">Dédié au mode restaurant</Label>
              <p className="text-sm text-muted-foreground">
                Si activé, cette catégorie ne sera visible que lorsque vous prenez une commande pour une table.
              </p>
            </div>
            <Switch 
              id="restaurant-only"
              checked={isRestaurantOnly}
              onCheckedChange={setIsRestaurantOnly}
            />
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
