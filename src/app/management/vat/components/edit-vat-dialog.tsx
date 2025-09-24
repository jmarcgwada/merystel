
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
import type { VatRate } from '@/lib/types';

interface EditVatDialogProps {
  vatRate: VatRate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditVatDialog({ vatRate, isOpen, onClose }: EditVatDialogProps) {
    const { toast } = useToast();
    const { updateVatRate } = usePos();
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');

    useEffect(() => {
        if(vatRate) {
            setName(vatRate.name);
            setRate(vatRate.rate.toString());
        }
    }, [vatRate])

    const handleEditVat = () => {
        if (!name || !rate) {
             toast({
                variant: 'destructive',
                title: 'Champs requis',
                description: 'Le nom et le taux sont obligatoires.',
            });
            return;
        }
        if (vatRate) {
            updateVatRate({
                ...vatRate,
                name,
                rate: parseFloat(rate),
            });
            toast({
                title: 'Taux modifié',
                description: 'Le taux de TVA a été mis à jour avec succès.',
            });
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le taux de TVA</DialogTitle>
          <DialogDescription>
            Modifiez les informations du taux.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Taux (%)
            </Label>
            <Input id="rate" type="number" value={rate} onChange={e => setRate(e.target.value)} className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditVat}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
