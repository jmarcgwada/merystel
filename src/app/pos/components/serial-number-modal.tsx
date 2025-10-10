
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import type { OrderItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SerialNumberModal() {
  const { serialNumberItem, setSerialNumberItem, addSerializedItemToOrder } = usePos();
  const { toast } = useToast();
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [initialSerials, setInitialSerials] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const quantity = useMemo(() => {
    if (!serialNumberItem) return 0;
    return serialNumberItem.quantity;
  }, [serialNumberItem]);

  useEffect(() => {
    if (serialNumberItem) {
      const numToFill = serialNumberItem.quantity;
      const existingSerials = (serialNumberItem.item as OrderItem).serialNumbers || [];
      const newSerials = Array(numToFill).fill('');
      
      for (let i = 0; i < Math.min(existingSerials.length, numToFill); i++) {
        newSerials[i] = existingSerials[i];
      }

      setSerialNumbers(newSerials);
      setInitialSerials(existingSerials); // Store the initial state
      setError(null);
      inputRefs.current = Array(numToFill).fill(null);
      
      setTimeout(() => {
        const firstEmptyIndex = newSerials.findIndex(sn => !sn);
        const focusIndex = firstEmptyIndex > -1 ? firstEmptyIndex : 0;
        if (inputRefs.current[focusIndex]) {
           inputRefs.current[focusIndex]?.focus();
           inputRefs.current[focusIndex]?.select();
        }
      }, 100);

    }
  }, [serialNumberItem]);
  
  const handleSerialNumberChange = (index: number, value: string) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value;
    setSerialNumbers(newSerialNumbers);
    setError(null);
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && index < quantity - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
    }
  }

  const handleClose = () => {
    setSerialNumberItem(null);
  };

  const handleConfirm = () => {
    const filledSerialNumbers = serialNumbers.map(sn => sn ? sn.trim() : '').filter(sn => sn !== '');
    
    if (filledSerialNumbers.length !== quantity) {
      setError(`Veuillez saisir les ${quantity} numéros de série.`);
      toast({
        variant: 'destructive',
        title: 'Saisie incomplète',
        description: `Il manque des numéros de série.`,
      });
      return;
    }

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
            Veuillez saisir les {quantity} numéros de série pour l'article "{serialNumberItem.item.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-64 pr-6">
            <div className="space-y-3">
                {[...Array(quantity)].map((_, index) => {
                    const isPreFilled = !!initialSerials[index];
                    return (
                        <div key={index} className="flex items-center gap-4">
                            <Label htmlFor={`sn-${index}`} className="w-12 text-right text-muted-foreground">
                                S/N {index + 1}
                            </Label>
                            <Input
                                id={`sn-${index}`}
                                ref={el => inputRefs.current[index] = el}
                                value={serialNumbers[index] || ''}
                                onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="flex-1"
                                disabled={isPreFilled}
                            />
                        </div>
                    )
                })}
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
