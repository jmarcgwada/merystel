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
import { Textarea } from '@/components/ui/textarea';
import type { Supplier } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded?: (supplier: Supplier) => void;
}

export function AddSupplierDialog({ isOpen, onClose, onSupplierAdded }: AddSupplierDialogProps) {
    const { toast } = useToast();
    const { addSupplier } = usePos();
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
    const [error, setError] = useState<string | null>(null);

    const generateRandomId = () => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `S-${randomPart}`;
    };

    useEffect(() => {
        if (isOpen) {
            setSupplierId(generateRandomId());
            setError(null);
        }
    }, [isOpen]);

    const handleAddSupplier = async () => {
        setError(null);
        if (!name || !supplierId) {
             toast({
                variant: 'destructive',
                title: 'Champs requis',
                description: 'Le nom et le code fournisseur sont obligatoires.',
            });
            return;
        }

        try {
            const newSupplier = await addSupplier({
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

            if (newSupplier) {
                toast({
                    title: 'Fournisseur ajouté',
                    description: 'Le nouveau fournisseur a été créé avec succès.',
                });

                if(onSupplierAdded) {
                    onSupplierAdded(newSupplier);
                }
                
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
                setIban('');
                setBic('');
                setSupplierId('');
                onClose();
            }
        } catch (e: any) {
            setError(e.message);
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
          <DialogDescription>
            Saisissez les informations du fournisseur. Un code unique est suggéré mais peut être modifié.
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
                            <Label htmlFor="supplierId">Code Fournisseur *</Label>
                            <Input id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Nom du contact</Label>
                            <Input id="contactName" value={contactName} onChange={e => setContactName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </TabsContent>
                    <TabsContent value="address" className="space-y-4 mt-0">
                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Code Postal</Label>
                                <Input id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Pays</Label>
                            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} />
                        </div>
                    </TabsContent>
                    <TabsContent value="other" className="space-y-4 mt-0">
                        <div className="space-y-2">
                            <Label htmlFor="siret">SIRET</Label>
                            <Input id="siret" value={siret} onChange={e => setSiret(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Site Web</Label>
                            <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="iban">IBAN</Label>
                            <Input id="iban" value={iban} onChange={e => setIban(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bic">BIC / SWIFT</Label>
                            <Input id="bic" value={bic} onChange={e => setBic(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
          </Tabs>
        </div>
        
         {error && (
            <div className="text-sm text-destructive font-medium flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4"/>
                {error}
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddSupplier}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
