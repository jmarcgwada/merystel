

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

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
    const [phone2, setPhone2] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [iban, setIban] = useState('');
    const [notes, setNotes] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const generateRandomId = () => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `C${randomPart}`;
    };

    useEffect(() => {
        if (isOpen) {
            setCustomerId(generateRandomId());
            setError(null);
        }
    }, [isOpen]);

    const handleAddCustomer = async () => {
        setError(null);
        if (!name || !customerId) {
             toast({
                variant: 'destructive',
                title: 'Champs requis',
                description: 'Le nom et le code client sont obligatoires.',
            });
            return;
        }

        try {
            const newCustomer = await addCustomer({
                id: customerId,
                name,
                email,
                phone,
                phone2,
                address,
                postalCode,
                city,
                country,
                iban,
                notes,
                isDisabled,
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
                setPhone2('');
                setAddress('');
                setPostalCode('');
                setCity('');
                setCountry('');
                setIban('');
                setNotes('');
                setCustomerId('');
                setIsDisabled(false);
                onClose();
            }
        } catch (e: any) {
            setError(e.message);
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Saisissez les informations du client. Un code client unique est suggéré mais peut être modifié.
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
                        <Label htmlFor="customerId">Code Client *</Label>
                        <Input id="customerId" value={customerId} onChange={e => setCustomerId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@example.com" onFocus={(e) => e.target.select()} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" onFocus={(e) => e.target.select()} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone2">Téléphone 2</Label>
                            <Input id="phone2" type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="07 87 65 43 21" onFocus={(e) => e.target.select()} />
                        </div>
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
                     <div className="flex items-center space-x-2 pt-2">
                        <Switch id="isDisabled" checked={isDisabled} onCheckedChange={setIsDisabled} />
                        <Label htmlFor="isDisabled" className="text-destructive">Désactiver ce client</Label>
                    </div>
                </TabsContent>
            </div>
        </Tabs>
        {error && (
            <div className="text-sm text-destructive font-medium flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4"/>
                {error}
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddCustomer}>Ajouter client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
