

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
import type { Supplier } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded?: (supplier: Supplier) => void;
}

export function AddSupplierDialog({ isOpen, onClose, onSupplierAdded }: AddSupplierDialogProps) {
    const { toast } = useToast();
    const { addSupplier } = usePos();
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [siret, setSiret] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');

    const handleAddSupplier = async () => {
        if (!name) {
             toast({
                variant: 'destructive',
                title: 'Nom requis',
                description: 'Le nom du fournisseur est obligatoire.',
            });
            return;
        }

        const newSupplier = await addSupplier({
            name,
            contactName,
            email,
            phone,
            address,
            postalCode,
            city,
            country,
            siret,
            website,
            notes,
        });

        if (newSupplier) {
            toast({
                title: 'Fournisseur ajouté',
                description: 'Le nouveau fournisseur a été créé avec succès.',
            });

            if(onSupplierAdded) {
                onSupplierAdded(newSupplier);
            }
            
            // Reset form
            setName('');
            setContactName('');
            setEmail('');
            setPhone('');
            setAddress('');
            setPostalCode('');
            setCity('');
            setCountry('');
            setSiret('');
            setWebsite('');
            setNotes('');
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
          <DialogDescription>
            Saisissez les informations du fournisseur.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nom *</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contactName" className="text-right">Contact</Label>
                    <Input id="contactName" value={contactName} onChange={e => setContactName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Téléphone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Adresse</Label>
                    <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="postalCode" className="text-right">C.P.</Label>
                    <Input id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">Ville</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="country" className="text-right">Pays</Label>
                    <Input id="country" value={country} onChange={e => setCountry(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right">Site Web</Label>
                    <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="siret" className="text-right">SIRET</Label>
                    <Input id="siret" value={siret} onChange={e => setSiret(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="col-span-3" />
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddSupplier}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
