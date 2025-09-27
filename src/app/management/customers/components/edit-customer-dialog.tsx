
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [iban, setIban] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(customer) {
            setName(customer.name || '');
            setEmail(customer.email || '');
            setPhone(customer.phone || '');
            setAddress(customer.address || '');
            setPostalCode(customer.postalCode || '');
            setCity(customer.city || '');
            setCountry(customer.country || '');
            setIban(customer.iban || '');
            setNotes(customer.notes || '');
        }
    }, [customer]);

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
                address,
                postalCode,
                city,
                country,
                iban,
                notes
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client.
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
                        <Label htmlFor="edit-name">Nom complet *</Label>
                        <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@example.com" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-phone">Téléphone</Label>
                        <Input id="edit-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" onFocus={(e) => e.target.select()} />
                    </div>
                </TabsContent>
                <TabsContent value="address" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-address">Adresse</Label>
                        <Input id="edit-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Rue de la République" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-postalCode">Code Postal</Label>
                            <Input id="edit-postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="75001" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-city">Ville</Label>
                            <Input id="edit-city" value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-country">Pays</Label>
                        <Input id="edit-country" value={country} onChange={e => setCountry(e.target.value)} placeholder="France" />
                    </div>
                </TabsContent>
                <TabsContent value="other" className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="edit-iban">IBAN</Label>
                        <Input id="edit-iban" value={iban} onChange={e => setIban(e.target.value)} placeholder="FR76..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes / Observations</Label>
                        <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Client fidèle, préférences..." />
                    </div>
                </TabsContent>
            </div>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditCustomer}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
