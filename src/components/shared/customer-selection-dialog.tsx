
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
import { ChevronsUpDown, Check, UserPlus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { ScrollArea } from '../ui/scroll-area';

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
        <DialogContent className="sm:max-w-xl h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Choisir un client</DialogTitle>
          </DialogHeader>
            <div className="flex-1 relative mx-6 mb-6">
                 <Command>
                    <div className="flex items-center gap-2 mb-2">
                        <CommandInput placeholder="Rechercher un client..." className="h-11" />
                        <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setAddCustomerOpen(true)}>
                            <UserPlus className="h-5 w-5" />
                        </Button>
                         <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleEditCustomer} disabled={!selectedCustomer}>
                            <Edit className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative mt-2">
                        <ScrollArea className="h-[calc(60vh-80px)]">
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
                                        className="py-2"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{customer.name}</span>
                                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                <span className="font-mono bg-muted px-1 rounded-sm">{customer.id.substring(0,8)}</span>
                                                {(customer.postalCode || customer.city) && <span>|</span>}
                                                {customer.postalCode && <span>{customer.postalCode}</span>}
                                                {customer.city && <span>{customer.city}</span>}
                                            </div>
                                        </div>
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </ScrollArea>
                    </div>
                </Command>
            </div>
        </DialogContent>
      </Dialog>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerAdded} />
       <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={selectedCustomer} />
    </>
  );
}

