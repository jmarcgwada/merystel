
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
        title: 'Table Added',
        description: `Table "${tableName}" has been successfully created.`,
      });
      setTableName('');
      onClose();
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid Name',
            description: 'Table name cannot be empty.'
        })
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Enter a name for the new table.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Table Name
            </Label>
            <Input 
              id="name" 
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. Patio 1" 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddTable}>Add Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
