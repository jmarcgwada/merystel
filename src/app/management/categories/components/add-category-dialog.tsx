
'use client';

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
import { useToast } from '@/hooks/use-toast';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryDialog({ isOpen, onClose }: AddCategoryDialogProps) {
  const { toast } = useToast();

  const handleAddCategory = () => {
    // In a real app, you'd handle form state and submission
    toast({
      title: 'Category Added',
      description: 'The new category has been successfully created.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Enter the details for the new category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" placeholder="e.g. Beverages" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddCategory}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

