'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
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
  const firstManualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (variantItem?.variantOptions) {
      const defaultSelections = variantItem.variantOptions.map(option => {
        const nonCustomValues = option.values.filter(v => v !== CUSTOM_INPUT_SYMBOL);
        const defaultValue = nonCustomValues[0] || '';
        return {
          name: option.name,
          value: defaultValue,
          isCustom: false,
        };
      });
      setSelectedVariants(defaultSelections);

      // Auto-focus logic
      const firstManualOnlyOption = variantItem.variantOptions.find(
        opt => opt.values.length === 1 && opt.values[0] === CUSTOM_INPUT_SYMBOL
      );
      if (firstManualOnlyOption) {
        setTimeout(() => {
          firstManualInputRef.current?.focus();
          firstManualInputRef.current?.select();
        }, 100);
      }
      
    } else {
      setSelectedVariants([]);
    }
  }, [variantItem]);
  
  const handleValueChange = useCallback((optionName: string, value: string, isCustom = false) => {
    if (value === CUSTOM_INPUT_SYMBOL) {
      handleOpenCustomInput(optionName);
      return;
    }
    setSelectedVariants(prev => {
      const otherVariants = prev.filter(v => v.name !== optionName);
      return [...otherVariants, { name: optionName, value, isCustom }];
    });
  }, []);

  const handleOpenCustomInput = useCallback((optionName: string) => {
    if (!variantItem) return;
    setCustomVariantRequest({ 
      item: variantItem, 
      optionName, 
      currentSelections: selectedVariants.filter(v => v.name !== optionName)
    });
  }, [variantItem, selectedVariants, setCustomVariantRequest]);
  
  const handleCustomValueConfirm = useCallback((optionName: string, customValue: string) => {
    setSelectedVariants(prev => {
      const otherVariants = prev.filter(v => v.name !== optionName);
      return [...otherVariants, { name: optionName, value: customValue.trim(), isCustom: true }];
    });
    setCustomVariantRequest(null);
  }, [setCustomVariantRequest]);

  const handleConfirm = useCallback(() => {
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
  }, [variantItem, selectedVariants, addToOrder, toast]);

  const handleClose = useCallback(() => {
    setVariantItem(null);
  }, [setVariantItem]);

  if (!variantItem) {
    return null;
  }

  let isFirstManualInputAssigned = false;

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
              const currentSelection = selectedVariants.find(v => v.name === option.name);
              const currentValue = currentSelection?.value || '';
              const isCustom = currentSelection?.isCustom || false;
              
              const hasCustomInputOption = option.values.includes(CUSTOM_INPUT_SYMBOL);
              const selectableValues = option.values.filter(v => v !== CUSTOM_INPUT_SYMBOL);
              const isManualOnly = selectableValues.length === 0 && hasCustomInputOption;

              let inputRefToUse = null;
              if (isManualOnly && !isFirstManualInputAssigned) {
                  inputRefToUse = firstManualInputRef;
                  isFirstManualInputAssigned = true;
              }

              return (
                <div key={option.name} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={option.name} className="text-right">
                    {option.name}
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    {isManualOnly ? (
                      <Input
                        ref={inputRefToUse}
                        id={option.name}
                        placeholder={`Saisir ${option.name}...`}
                        value={currentValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirm();
                            }
                        }}
                        onChange={(e) => handleValueChange(option.name, e.target.value, true)}
                      />
                    ) : (
                      <>
                        <Select
                          onValueChange={(value) => handleValueChange(option.name, value)}
                          value={isCustom ? '' : currentValue}
                        >
                          <SelectTrigger id={option.name}>
                            <SelectValue placeholder={isCustom ? currentValue : `Choisir ${option.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableValues.map((value, index) => (
                              <SelectItem key={`${value}-${index}`} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                            {hasCustomInputOption && selectableValues.length > 0 && <SelectSeparator />}
                            {hasCustomInputOption && (
                              <SelectItem value={CUSTOM_INPUT_SYMBOL}>
                                <span className="italic text-muted-foreground">Saisie manuelle...</span>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {hasCustomInputOption && (
                            <Button variant="outline" size="icon" onClick={() => handleOpenCustomInput(option.name)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                      </>
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
      <CustomVariantInputModal onConfirm={handleCustomValueConfirm}/>
    </>
  );
}
