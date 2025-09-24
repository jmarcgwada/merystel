
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
import type { Customer } from '@/lib/types';

interface EditCustomerDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCustomerDialog({ customer, isOpen, onClose }: EditCustomerDialogProps) {
    const { toast } = useToast();
    const { updateCustomer } = usePos();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if(customer) {
            setName(customer.name);
            setEmail(customer.email || '');
            setPhone(customer.phone || '');
        }
    }, [customer])

    const handleEditCustomer = () => {
        if (!name) {
             toast({
                variant: 'destructive',
                title: 'Nom requis',
                description: 'Le nom du client est obligatoire.',
            });
            return;
        }
        if (customer) {
            updateCustomer({
                ...customer,
                name,
                email,
                phone,
            });
            toast({
                title: 'Client modifié',
                description: 'Le client a été mis à jour avec succès.',
            });
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@example.com" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Téléphone
            </Label>
            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(123) 456-7890" className="col-span-3" onFocus={(e) => e.target.select()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditCustomer}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
