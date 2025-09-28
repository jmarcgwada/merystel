

'use client';

import { useState, useRef } from 'react';
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
import { CreditCard, Wallet, Landmark, StickyNote, Upload, Link as LinkIcon } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

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
  const [icon, setIcon] = useState<PaymentMethod['icon']>('other');
  const [type, setType] = useState<PaymentMethod['type']>('direct');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleAddMethod = () => {
    if (!name || !icon || !type) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez renseigner le nom, l\'icône et le type.',
        });
        return;
    }
    
    addPaymentMethod({ 
      name, 
      icon, 
      type,
      isActive,
      image,
      value: type === 'indirect' && value ? parseFloat(value) : undefined
    });
    
    setName('');
    setIcon('other');
    setType('direct');
    setValue('');
    setIsActive(true);
    setImage('');
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
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct">Direct</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indirect" id="indirect" />
                  <Label htmlFor="indirect">Indirect</Label>
                </div>
              </RadioGroup>
          </div>
          {type === 'indirect' && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                Valeur (€)
                </Label>
                <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="ex: 8.50"
                className="col-span-3"
                onFocus={(e) => e.target.select()}
                />
            </div>
          )}
           <Separator />
            <div className="space-y-2">
              <Label>Image du moyen de paiement</Label>
              <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                  <Input 
                      id="image-url" 
                      value={image.startsWith('data:') ? '' : image} 
                      onChange={(e) => setImage(e.target.value)} 
                      placeholder="https://..." 
                      className="pl-9"
                  />
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Separator className="flex-1"/>
                <span className="text-xs text-muted-foreground">OU</span>
                <Separator className="flex-1"/>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Téléverser une image
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="active" className="text-base">Actif</Label>
              <p className="text-sm text-muted-foreground">
                Seuls les moyens de paiement actifs apparaissent à la caisse.
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
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

    