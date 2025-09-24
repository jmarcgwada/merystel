
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

interface AddVatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVatDialog({ isOpen, onClose }: AddVatDialogProps) {
    const { toast } = useToast();
    const { addVatRate } = usePos();
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');
    
    const handleAddVat = () => {
        if (!name || !rate) {
             toast({
                variant: 'destructive',
                title: 'Champs requis',
                description: 'Le nom et le taux sont obligatoires.',
            });
            return;
        }

        addVatRate({
            name,
            rate: parseFloat(rate),
        });

        toast({
            title: 'Taux ajouté',
            description: 'Le nouveau taux de TVA a été créé avec succès.',
        });
        setName('');
        setRate('');
        onClose();
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un taux de TVA</DialogTitle>
          <DialogDescription>
            Saisissez les informations du nouveau taux. Le code sera généré automatiquement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Taux Normal" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Taux (%)
            </Label>
            <Input id="rate" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="ex: 20" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddVat}>Ajouter Taux</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
