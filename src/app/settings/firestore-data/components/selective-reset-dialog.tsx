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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePos, type DeletableDataKeys } from '@/contexts/pos-context';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface SelectiveResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DATA_TYPES: { key: DeletableDataKeys; label: string }[] = [
  { key: 'items', label: 'Articles' },
  { key: 'categories', label: 'Catégories' },
  { key: 'customers', label: 'Clients' },
  { key: 'suppliers', label: 'Fournisseurs' },
  { key: 'tables', label: 'Tables' },
  { key: 'sales', label: 'Ventes' },
  { key: 'paymentMethods', label: 'Moyens de paiement' },
  { key: 'vatRates', label: 'TVA' },
  { key: 'heldOrders', label: 'Tickets en attente' },
  { key: 'auditLogs', label: 'Logs d\'audit' },
];

export function SelectiveResetDialog({ isOpen, onClose }: SelectiveResetDialogProps) {
  const { selectivelyResetData } = usePos();
  const [selections, setSelections] = useState<Record<DeletableDataKeys, boolean>>(
    DATA_TYPES.reduce((acc, { key }) => ({ ...acc, [key]: false }), {} as Record<DeletableDataKeys, boolean>)
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const handleToggleAll = (checked: boolean) => {
    const newSelections: Record<DeletableDataKeys, boolean> = { ...selections };
    DATA_TYPES.forEach(({ key }) => {
      newSelections[key] = checked;
    });
    setSelections(newSelections);
  };

  const isAllSelected = DATA_TYPES.every(({ key }) => selections[key]);
  const isSomeSelected = DATA_TYPES.some(({ key }) => selections[key]);

  const handleReset = async () => {
    await selectivelyResetData(selections);
    setIsConfirming(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialisation sélective</DialogTitle>
            <DialogDescription>
              Cochez les catégories de données que vous souhaitez supprimer définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleToggleAll}
              />
              <Label htmlFor="select-all" className="font-bold">
                Tout sélectionner / Tout désélectionner
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {DATA_TYPES.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selections[key]}
                    onCheckedChange={(checked) =>
                      setSelections((prev) => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key}>{label}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button variant="destructive" onClick={() => setIsConfirming(true)} disabled={!isSomeSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer la sélection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement les données sélectionnées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attention</AlertTitle>
            <p>La récupération des données sera impossible après cette action.</p>
          </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
