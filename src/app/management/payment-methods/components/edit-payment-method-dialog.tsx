

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Landmark, StickyNote } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

interface EditPaymentMethodDialogProps {
  paymentMethod: PaymentMethod | null;
  isOpen: boolean;
  onClose: () => void;
}

const icons = [
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'cash', label: 'Espèces', icon: Wallet },
  { value: 'check', label: 'Chèque', icon: StickyNote },
  { value: 'other', label: 'Autre', icon: Landmark },
];

export function EditPaymentMethodDialog({ paymentMethod, isOpen, onClose }: EditPaymentMethodDialogProps) {
  const { toast } = useToast();
  const { updatePaymentMethod } = usePos();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<PaymentMethod['icon']>('other');
  const [type, setType] = useState<PaymentMethod['type']>('direct');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (paymentMethod) {
        setName(paymentMethod.name);
        setIcon(paymentMethod.icon || 'other');
        setType(paymentMethod.type || 'direct');
        setValue(paymentMethod.value?.toString() || '');
        setIsActive(paymentMethod.isActive ?? true);
    }
  }, [paymentMethod]);


  const handleEditMethod = () => {
    if (!name || !icon || !type) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez renseigner le nom, l\'icône et le type.',
        });
        return;
    }
    
    if (paymentMethod) {
        updatePaymentMethod({ 
            ...paymentMethod, 
            name, 
            icon, 
            type,
            isActive,
            value: type === 'indirect' && value ? parseFloat(value) : undefined
        });
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le moyen de paiement</DialogTitle>
          <DialogDescription>
            Modifiez les détails de la méthode de paiement.
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
             <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as PaymentMethod['type'])}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="edit-direct" />
                  <Label htmlFor="edit-direct">Direct</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indirect" id="edit-indirect" />
                  <Label htmlFor="edit-indirect">Indirect</Label>
                </div>
              </RadioGroup>
          </div>
           {type === 'indirect' && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-value" className="text-right">
                Valeur (€)
                </Label>
                <Input
                id="edit-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="ex: 8.50"
                className="col-span-3"
                onFocus={(e) => e.target.select()}
                />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="active-edit" className="text-base">Actif</Label>
              <p className="text-sm text-muted-foreground">
                Seuls les moyens de paiement actifs apparaissent à la caisse.
              </p>
            </div>
            <Switch
              id="active-edit"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditMethod}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
