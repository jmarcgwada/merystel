
'use client';

import { useState } from 'react';
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

interface AddTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTableDialog({ isOpen, onClose }: AddTableDialogProps) {
  const { addTable } = usePos();
  const { toast } = useToast();
  const [tableName, setTableName] = useState('');

  const handleAddTable = () => {
    if (tableName.trim()) {
      addTable(tableName);
      toast({
        title: 'Table ajoutée',
        description: `La table "${tableName}" a été créée avec succès.`,
      });
      setTableName('');
      onClose();
    } else {
        toast({
            variant: 'destructive',
            title: 'Nom invalide',
            description: 'Le nom de la table ne peut pas être vide.'
        })
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle table</DialogTitle>
          <DialogDescription>
            Saisissez un nom pour la nouvelle table.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom de la table
            </Label>
            <Input 
              id="name" 
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="ex: Terrasse 1" 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleAddTable}>Ajouter une table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
