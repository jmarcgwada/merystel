
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Wallet, Landmark, StickyNote } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';

interface AddPaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const icons = [
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'cash', label: 'Espèces', icon: Wallet },
  { value: 'check', label: 'Chèque', icon: StickyNote },
  { value: 'other', label: 'Autre', icon: Landmark },
];

export function AddPaymentMethodDialog({ isOpen, onClose }: AddPaymentMethodDialogProps) {
  const { toast } = useToast();
  const { addPaymentMethod } = usePos();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<'card' | 'cash' | 'check' | 'other' | ''>('');


  const handleAddMethod = () => {
    if (!name || !icon) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez renseigner le nom et sélectionner une icône.',
        });
        return;
    }
    
    addPaymentMethod({ name, icon });
    
    setName('');
    setIcon('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
          <DialogDescription>
            Saisissez les détails de la nouvelle méthode de paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Ticket Restaurant" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icône
            </Label>
             <Select onValueChange={(v) => setIcon(v as any)} value={icon}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionnez une icône" />
                </SelectTrigger>
                <SelectContent>
                    {icons.map(i => {
                        const IconComp = i.icon;
                        return (
                             <SelectItem key={i.value} value={i.value}>
                                <div className="flex items-center gap-2">
                                    <IconComp className="h-4 w-4" />
                                    <span>{i.label}</span>
                                </div>
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddMethod}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
