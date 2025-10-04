
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Customer } from '@/lib/types';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';

interface CustomerSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer) => void;
}

export function CustomerSelectionDialog({ isOpen, onClose, onCustomerSelected }: CustomerSelectionDialogProps) {
  const { customers } = usePos();
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOpen(true);
    } else {
      setOpen(false);
      setSelectedCustomer(null); // Reset on close
    }
  }, [isOpen]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onCustomerSelected(customer);
    setOpen(false);
    onClose();
  };

  const onCustomerAdded = (newCustomer: Customer) => {
    handleSelectCustomer(newCustomer);
    setAddCustomerOpen(false);
  }
  
  const handleEditCustomer = () => {
    if(selectedCustomer) {
      setEditCustomerOpen(true);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir un client</DialogTitle>
          </DialogHeader>
            <div className="flex gap-2 items-center">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between flex-1"
                  >
                    {selectedCustomer
                      ? selectedCustomer.name
                      : "Sélectionner un client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un client..." />
                    <CommandList>
                      <CommandEmpty>
                         <Button className="w-full" variant="outline" onClick={() => { setOpen(false); setAddCustomerOpen(true);}}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Créer un nouveau client
                          </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {customers && customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => handleSelectCustomer(customer)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
        </DialogContent>
      </Dialog>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerAdded} />
       <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={selectedCustomer} />
    </>
  );
}
