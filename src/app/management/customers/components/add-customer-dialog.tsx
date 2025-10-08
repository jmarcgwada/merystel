

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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface AddCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: (customer: Customer) => void;
}

export function AddCustomerDialog({ isOpen, onClose, onCustomerAdded }: AddCustomerDialogProps) {
    const { toast } = useToast();
    const { addCustomer } = usePos();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [iban, setIban] = useState('');
    const [notes, setNotes] = useState('');

    const handleAddCustomer = async () => {
        if (!name) {
             toast({
                variant: 'destructive',
                title: 'Nom requis',
                description: 'Le nom du client est obligatoire.',
            });
            return;
        }

        const newCustomer = await addCustomer({
            id: uuidv4(),
            name,
            email,
            phone,
            address,
            postalCode,
            city,
            country,
            iban,
            notes,
        });

        if (newCustomer) {
            toast({
                title: 'Client ajouté',
                description: 'Le nouveau client a été créé avec succès.',
            });

            if(onCustomerAdded) {
                onCustomerAdded(newCustomer);
            }
            
            // Reset form
            setName('');
            setEmail('');
            setPhone('');
            setAddress('');
            setPostalCode('');
            setCity('');
            setCountry('');
            setIban('');
            setNotes('');
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Saisissez les informations du client. Seul le nom est obligatoire.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Contact</TabsTrigger>
                <TabsTrigger value="address">Adresse</TabsTrigger>
                <TabsTrigger value="other">Autre</TabsTrigger>
            </TabsList>
            <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
                <TabsContent value="info" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@example.com" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" onFocus={(e) => e.target.select()} />
                    </div>
                </TabsContent>
                <TabsContent value="address" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Rue de la République" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="postalCode">Code Postal</Label>
                            <Input id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="75001" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="France" />
                    </div>
                </TabsContent>
                <TabsContent value="other" className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input id="iban" value={iban} onChange={e => setIban(e.target.value)} placeholder="FR76..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes / Observations</Label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Client fidèle, préférences..." />
                    </div>
                </TabsContent>
            </div>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddCustomer}>Ajouter client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
