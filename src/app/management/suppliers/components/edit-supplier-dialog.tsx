

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
import type { Supplier } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSupplierDialog({ supplier, isOpen, onClose }: EditSupplierDialogProps) {
    const { toast } = useToast();
    const { updateSupplier } = usePos();
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

    useEffect(() => {
        if(supplier) {
            setName(supplier.name || '');
            setContactName(supplier.contactName || '');
            setEmail(supplier.email || '');
            setPhone(supplier.phone || '');
            setAddress(supplier.address || '');
            setPostalCode(supplier.postalCode || '');
            setCity(supplier.city || '');
            setCountry(supplier.country || '');
            setSiret(supplier.siret || '');
            setWebsite(supplier.website || '');
            setNotes(supplier.notes || '');
        }
    }, [supplier]);

    const handleEditSupplier = () => {
        if (!name) {
             toast({
                variant: 'destructive',
                title: 'Nom requis',
                description: 'Le nom du fournisseur est obligatoire.',
            });
            return;
        }
        if (supplier) {
            updateSupplier({
                ...supplier,
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
            toast({
                title: 'Fournisseur modifié',
                description: 'Les informations du fournisseur ont été mises à jour.',
            });
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le fournisseur</DialogTitle>
          <DialogDescription>
            Modifiez les informations du fournisseur.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">Nom *</Label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-contactName" className="text-right">Contact</Label>
                    <Input id="edit-contactName" value={contactName} onChange={e => setContactName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-email" className="text-right">Email</Label>
                    <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-phone" className="text-right">Téléphone</Label>
                    <Input id="edit-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-address" className="text-right">Adresse</Label>
                    <Input id="edit-address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-postalCode" className="text-right">C.P.</Label>
                    <Input id="edit-postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-city" className="text-right">Ville</Label>
                    <Input id="edit-city" value={city} onChange={e => setCity(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-country" className="text-right">Pays</Label>
                    <Input id="edit-country" value={country} onChange={e => setCountry(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-website" className="text-right">Site Web</Label>
                    <Input id="edit-website" value={website} onChange={e => setWebsite(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-siret" className="text-right">SIRET</Label>
                    <Input id="edit-siret" value={siret} onChange={e => setSiret(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="edit-notes" className="text-right pt-2">Notes</Label>
                    <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} className="col-span-3" />
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditSupplier}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
