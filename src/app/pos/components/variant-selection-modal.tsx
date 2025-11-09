
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
import { Pencil } from 'lucide-react';
import { CustomVariantInputModal } from './custom-variant-input-modal';

const CUSTOM_INPUT_SYMBOL = '*';

export function VariantSelectionModal() {
  const { variantItem, setVariantItem, addToOrder, setCustomVariantRequest } = usePos();
  const { toast } = useToast();
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);

  useEffect(() => {
    if (variantItem?.variantOptions) {
      const defaultSelections = variantItem.variantOptions.map(option => {
        const defaultValue = option.values.includes(CUSTOM_INPUT_SYMBOL)
          ? ''
          : option.values[0] || '';
        return {
          name: option.name,
          value: defaultValue,
        };
      });
      setSelectedVariants(defaultSelections);
    } else {
      setSelectedVariants([]);
    }
  }, [variantItem]);
  
  const handleValueChange = (optionName: string, value: string) => {
    setSelectedVariants(prev => {
      const otherVariants = prev.filter(v => v.name !== optionName);
      return [...otherVariants, { name: optionName, value }];
    });
  };

  const handleOpenCustomInput = (optionName: string) => {
    if (!variantItem) return;
    setCustomVariantRequest({ 
      item: variantItem, 
      optionName, 
      currentSelections: selectedVariants.filter(v => v.name !== optionName)
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
    <>
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
              const hasCustomInputOption = option.values.includes(CUSTOM_INPUT_SYMBOL);
              const selectableValues = option.values.filter(v => v !== CUSTOM_INPUT_SYMBOL);

              return (
                <div key={option.name} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={option.name} className="text-right">
                    {option.name}
                  </Label>
                  <div className="col-span-3 flex gap-2">
                      <Select
                        onValueChange={(value) => handleValueChange(option.name, value)}
                        defaultValue={currentValue || (selectableValues.length > 0 ? selectableValues[0] : '')}
                      >
                        <SelectTrigger id={option.name}>
                          <SelectValue placeholder={`Choisir ${option.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectableValues.map((value, index) => (
                            <SelectItem key={`${value}-${index}`} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasCustomInputOption && (
                          <Button variant="outline" size="icon" onClick={() => handleOpenCustomInput(option.name)}>
                              <Pencil className="h-4 w-4" />
                          </Button>
                      )}
                  </div>
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
      <CustomVariantInputModal />
    </>
  );
}
