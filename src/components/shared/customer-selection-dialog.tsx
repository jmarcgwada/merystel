

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Edit, UserPlus } from 'lucide-react';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { cn } from '@/lib/utils';

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
  const [search, setSearch] = useState('');
  const [currentSelectedCustomer, setCurrentSelectedCustomer] = useState<Customer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.id.toLowerCase().includes(search.toLowerCase()) ||
      (customer.postalCode && customer.postalCode.toLowerCase().includes(search.toLowerCase())) ||
      (customer.city && customer.city.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);
  
  const handleSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    onClose();
  };

  const handleEdit = () => {
    if (currentSelectedCustomer) {
      setCustomerToEdit(currentSelectedCustomer);
      setEditCustomerOpen(true);
    }
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
          <div className="px-6 pb-4 border-b">
            <Command shouldFilter={false} className="bg-transparent">
              <CommandInput
                ref={inputRef}
                placeholder="Rechercher par nom, code, code postal ou ville..."
                value={search}
                onValueChange={setSearch}
              />
            </Command>
          </div>
          <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    onMouseEnter={() => setCurrentSelectedCustomer(customer)}
                    className="p-3 flex justify-between items-center rounded-md cursor-pointer hover:bg-secondary"
                  >
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.id} | {customer.postalCode} {customer.city}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </ScrollArea>
          </div>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddCustomerOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
            <Button onClick={handleEdit} disabled={!currentSelectedCustomer}>
                <Edit className="mr-2 h-4 w-4"/>
                Modifier le client sélectionné
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
