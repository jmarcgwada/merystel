'use client';

import React, { useState } from 'react';
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
import type { EquipmentType } from '@/lib/types';

interface AddEquipmentTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentTypeAdded?: (equipmentType: EquipmentType) => void;
}

export function AddEquipmentTypeDialog({ isOpen, onClose, onEquipmentTypeAdded }: AddEquipmentTypeDialogProps) {
  const { addEquipmentType } = usePos();
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');

  const handleSave = async () => {
    if (!equipmentName.trim() || !equipmentPrice) return;
    const price = parseFloat(equipmentPrice);
    if (isNaN(price)) return;

    const newEquipmentType = await addEquipmentType({ name: equipmentName, price });

    if (newEquipmentType) {
      if (onEquipmentTypeAdded) {
        onEquipmentTypeAdded(newEquipmentType);
      }
      setEquipmentName('');
      setEquipmentPrice('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau type de matériel</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="equipment-name-add">Nom du type de matériel</Label>
            <Input id="equipment-name-add" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="equipment-price-add">Tarif de prise en charge (€)</Label>
            <Input id="equipment-price-add" type="number" value={equipmentPrice} onChange={(e) => setEquipmentPrice(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}