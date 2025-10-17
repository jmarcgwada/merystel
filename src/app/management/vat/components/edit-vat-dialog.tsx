

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
import type { VatRate, Timestamp } from '@/lib/types';
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
    const [code, setCode] = useState<number | ''>('');

    useEffect(() => {
        if(vatRate) {
            setName(vatRate.name);
            setRate(vatRate.rate.toString());
            setCode(vatRate.code);
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
            Modifiez les informations du taux. Le code n'est pas modifiable.
          </DialogDescription>
        </DialogHeader>
        {vatRate?.createdAt && (
            <div className="p-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />Créé le: <ClientFormattedDate date={vatRate.createdAt} formatString="d MMM yyyy, HH:mm" /></span>
                    {vatRate.updatedAt && (
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Modifié le: <ClientFormattedDate date={vatRate.updatedAt} formatString="d MMM yyyy, HH:mm" /></span>
                    )}
                </div>
            </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input id="code" type="number" value={code} readOnly disabled className="col-span-3" />
          </div>
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
