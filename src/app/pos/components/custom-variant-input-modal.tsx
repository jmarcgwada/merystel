
'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface CustomVariantInputModalProps {
  onConfirm: (optionName: string, customValue: string) => void;
}

export function CustomVariantInputModal({ onConfirm }: CustomVariantInputModalProps) {
  const { customVariantRequest, setCustomVariantRequest } = usePos();
  const { toast } = useToast();
  const [customValue, setCustomValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customVariantRequest) {
      setCustomValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [customVariantRequest]);

  const handleConfirm = () => {
    if (!customVariantRequest) return;
    if (!customValue.trim()) {
      toast({
        variant: 'destructive',
        title: 'Valeur requise',
        description: 'Veuillez saisir une valeur personnalisée.',
      });
      return;
    }
    onConfirm(customVariantRequest.optionName, customValue);
  };

  const handleClose = () => {
    setCustomVariantRequest(null);
  };

  if (!customVariantRequest) {
    return null;
  }

  return (
    <Dialog open={!!customVariantRequest} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saisie manuelle : {customVariantRequest.optionName}</DialogTitle>
          <DialogDescription>
            Entrez la valeur personnalisée pour l'option "{customVariantRequest.optionName}" de l'article "{customVariantRequest.item.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="custom-value" className="sr-only">
            Valeur personnalisée
          </Label>
          <Input
            id="custom-value"
            ref={inputRef}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
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
