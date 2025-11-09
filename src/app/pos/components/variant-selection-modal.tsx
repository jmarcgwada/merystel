

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePos } from '@/contexts/pos-context';
import type { SelectedVariant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const CUSTOM_INPUT_SYMBOL = '*';

export function VariantSelectionModal() {
  const { variantItem, setVariantItem, addToOrder, setCustomVariantRequest } = usePos();
  const { toast } = useToast();
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);

  useEffect(() => {
    if (variantItem?.variantOptions) {
      const defaultSelections = variantItem.variantOptions.map(option => ({
        name: option.name,
        value: option.values.includes(CUSTOM_INPUT_SYMBOL) ? '' : option.values[0],
      }));
      setSelectedVariants(defaultSelections);
    } else {
      setSelectedVariants([]);
    }
  }, [variantItem]);
  
  const handleValueChange = (optionName: string, value: string) => {
    if (value === CUSTOM_INPUT_SYMBOL) {
      if (!variantItem) return;
      setCustomVariantRequest({ 
        item: variantItem, 
        optionName, 
        currentSelections: selectedVariants.filter(v => v.name !== optionName)
      });
      // We don't close this modal yet. It will close when the custom one is done.
      return;
    }
    
    setSelectedVariants(prev => {
      const otherVariants = prev.filter(v => v.name !== optionName);
      return [...otherVariants, { name: optionName, value }];
    });
  };

  const handleConfirm = () => {
    if (!variantItem) return;

    const allOptionsSelected = variantItem.variantOptions?.every(opt =>
      selectedVariants.some(sel => sel.name === opt.name && sel.value && sel.value.trim() !== '')
    );

    if (!allOptionsSelected) {
      toast({
        variant: 'destructive',
        title: 'Sélection incomplète',
        description: 'Veuillez sélectionner ou saisir une valeur pour chaque option.',
      });
      return;
    }
    
    addToOrder(variantItem.id, selectedVariants);
    handleClose();
  };

  const handleClose = () => {
    setVariantItem(null);
  };

  if (!variantItem) {
    return null;
  }

  return (
    <Dialog open={!!variantItem} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner les options</DialogTitle>
          <DialogDescription>
            Choisissez les déclinaisons pour l'article "{variantItem.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {variantItem.variantOptions?.map(option => {
            const currentValue = selectedVariants.find(v => v.name === option.name)?.value || '';

            return (
              <div key={option.name} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={option.name} className="text-right">
                  {option.name}
                </Label>
                <Select
                  onValueChange={(value) => handleValueChange(option.name, value)}
                  defaultValue={currentValue || option.values[0]}
                >
                  <SelectTrigger id={option.name} className="col-span-3">
                    <SelectValue placeholder={`Choisir ${option.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {option.values.map((value, index) => (
                      <SelectItem key={`${value}-${index}`} value={value}>
                        {value === CUSTOM_INPUT_SYMBOL ? 'Saisie manuelle...' : value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
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
