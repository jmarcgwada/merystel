
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Item } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SerialNumberModal() {
  const { serialNumberItem, setSerialNumberItem, addSerializedItemToOrder } = usePos();
  const { toast } = useToast();
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const quantity = useMemo(() => {
    if (!serialNumberItem) return 0;
    return serialNumberItem.quantity;
  }, [serialNumberItem]);

  useEffect(() => {
    if (serialNumberItem) {
      // Initialize with empty strings or existing serials if editing
      setSerialNumbers(serialNumberItem.item.serialNumbers || Array(quantity).fill(''));
      setError(null);
    } else {
        setSerialNumbers([]);
    }
  }, [serialNumberItem, quantity]);
  
  const handleSerialNumberChange = (index: number, value: string) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value;
    setSerialNumbers(newSerialNumbers);
    setError(null); // Clear error on change
  };

  const handleClose = () => {
    setSerialNumberItem(null);
  };

  const handleConfirm = () => {
    // Check for duplicates, ignoring empty strings
    const filledSerialNumbers = serialNumbers.filter(sn => sn.trim() !== '');
    const uniqueSerialNumbers = new Set(filledSerialNumbers);
    if (filledSerialNumbers.length !== uniqueSerialNumbers.size) {
      setError('Les numéros de série doivent être uniques.');
      toast({
        variant: 'destructive',
        title: 'Numéros de série dupliqués',
        description: 'Veuillez vous assurer que chaque numéro de série est unique.',
      });
      return;
    }

    if (serialNumberItem) {
        addSerializedItemToOrder(serialNumberItem.item, serialNumberItem.quantity, serialNumbers);
    }
    handleClose();
  };

  if (!serialNumberItem) {
    return null;
  }

  return (
    <Dialog open={!!serialNumberItem} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saisir les numéros de série</DialogTitle>
          <DialogDescription>
            Veuillez saisir les numéros de série pour l'article "{serialNumberItem.item.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-64 pr-6">
            <div className="grid gap-4">
                {[...Array(quantity)].map((_, index) => (
                    <div key={index} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`sn-${index}`} className="text-right">
                            S/N {index + 1}
                        </Label>
                        <Input
                            id={`sn-${index}`}
                            value={serialNumbers[index] || ''}
                            onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                            className="col-span-3"
                            autoFocus={index === 0}
                        />
                    </div>
                ))}
            </div>
          </ScrollArea>
           {error && <p className="text-sm font-medium text-destructive mt-4">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
