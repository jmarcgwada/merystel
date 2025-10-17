

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
import type { Category, Timestamp } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';

const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined; formatString: string }) => {
  const [formatted, setFormatted] = useState('');
  useEffect(() => {
    if (date) {
      const jsDate = date instanceof Date ? date : (date as Timestamp).toDate();
      setFormatted(format(jsDate, formatString, { locale: fr }));
    }
  }, [date, formatString]);
  return <>{formatted}</>;
};

interface EditCategoryDialogProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCategoryDialog({ category, isOpen, onClose }: EditCategoryDialogProps) {
  const { toast } = useToast();
  const { updateCategory } = usePos();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#e2e8f0');
  const [isRestaurantOnly, setIsRestaurantOnly] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color || '#e2e8f0');
      setIsRestaurantOnly(category.isRestaurantOnly || false);
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
            color,
            isRestaurantOnly,
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
        {category?.createdAt && (
            <div className="p-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />Créé le: <ClientFormattedDate date={category.createdAt} formatString="d MMM yyyy, HH:mm" /></span>
                    {category.updatedAt && (
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Modifié le: <ClientFormattedDate date={category.updatedAt} formatString="d MMM yyyy, HH:mm" /></span>
                    )}
                </div>
            </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Boissons" className="col-span-3" onFocus={(e) => e.target.select()} />
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
              <Label htmlFor="restaurant-only-edit" className="text-base">Dédié au mode restaurant</Label>
              <p className="text-sm text-muted-foreground">
                Si activé, cette catégorie ne sera visible que pour une commande de table.
              </p>
            </div>
            <Switch 
              id="restaurant-only-edit"
              checked={isRestaurantOnly}
              onCheckedChange={setIsRestaurantOnly}
            />
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
