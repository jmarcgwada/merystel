

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Customer } from '@/lib/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Edit, UserPlus } from 'lucide-react';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer) => void;
}

export function CustomerSelectionDialog({ isOpen, onClose, onCustomerSelected }: CustomerSelectionDialogProps) {
  const { customers } = usePos();
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const handleSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    onClose();
  };

  const handleEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditCustomerOpen(true);
  }

  const handleCustomerAdded = (newCustomer: Customer) => {
    setAddCustomerOpen(false);
    onCustomerSelected(newCustomer);
    onClose();
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Choisir un client</DialogTitle>
          </DialogHeader>
          <Command className="flex-1 min-h-0 border-b">
             <CommandInput
                placeholder="Rechercher par nom, code, code postal ou ville..."
              />
              <CommandList>
                <ScrollArea className="h-[calc(60vh-120px)]">
                  <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                  <CommandGroup>
                    {customers && customers.map(customer => (
                      <CommandItem
                        key={customer.id}
                        onSelect={() => handleSelect(customer)}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.id} | {customer.postalCode} {customer.city}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(customer)}}>
                            <Edit className="h-4 w-4"/>
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
          </Command>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddCustomerOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={handleCustomerAdded} />
      <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customerToEdit} />
    </>
  );
}


