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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSupplierDialog({ supplier, isOpen, onClose }: EditSupplierDialogProps) {
    const { toast } = useToast();
    const { updateSupplier } = usePos();
    const [supplierId, setSupplierId] = useState('');
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
    const [iban, setIban] = useState('');
    const [bic, setBic] = useState('');

    useEffect(() => {
        if(supplier) {
            setSupplierId(supplier.id);
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
            setIban(supplier.iban || '');
            setBic(supplier.bic || '');
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
                id: supplierId,
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
                iban,
                bic,
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
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Modifier le fournisseur</DialogTitle>
          <DialogDescription>
            Modifiez les informations du fournisseur.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="info" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Contact</TabsTrigger>
                  <TabsTrigger value="address">Adresse</TabsTrigger>
                  <TabsTrigger value="other">Autre</TabsTrigger>
              </TabsList>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full p-1">
                  <div className="py-4 px-2">
                    <TabsContent value="info" className="space-y-4 mt-0">
                        <div className="space-y-2">
                            <Label htmlFor="edit-supplierId">Code Fournisseur</Label>
                            <Input id="edit-supplierId" value={supplierId} readOnly disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom *</Label>
                            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-contactName">Nom du contact</Label>
                            <Input id="edit-contactName" value={contactName} onChange={e => setContactName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Téléphone</Label>
                            <Input id="edit-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </TabsContent>
                    <TabsContent value="address" className="space-y-4 mt-0">
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Adresse</Label>
                            <Input id="edit-address" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-postalCode">Code Postal</Label>
                                <Input id="edit-postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-city">Ville</Label>
                                <Input id="edit-city" value={city} onChange={e => setCity(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-country">Pays</Label>
                            <Input id="edit-country" value={country} onChange={e => setCountry(e.target.value)} />
                        </div>
                    </TabsContent>
                    <TabsContent value="other" className="space-y-4 mt-0">
                        <div className="space-y-2">
                            <Label htmlFor="edit-siret">SIRET</Label>
                            <Input id="edit-siret" value={siret} onChange={e => setSiret(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-website">Site Web</Label>
                            <Input id="edit-website" value={website} onChange={e => setWebsite(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-iban">IBAN</Label>
                            <Input id="edit-iban" value={iban} onChange={e => setIban(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-bic">BIC / SWIFT</Label>
                            <Input id="edit-bic" value={bic} onChange={e => setBic(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleEditSupplier}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
