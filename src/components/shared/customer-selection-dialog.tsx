

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(customer => {
        if(customer.isDisabled) return false;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            customer.name.toLowerCase().includes(lowerSearchTerm) ||
            customer.id.toLowerCase().includes(lowerSearchTerm) ||
            (customer.postalCode && customer.postalCode.toLowerCase().includes(lowerSearchTerm)) ||
            (customer.city && customer.city.toLowerCase().includes(lowerSearchTerm))
        );
    });
  }, [customers, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    setHighlightedIndex(filteredCustomers.length > 0 ? 0 : -1);
  }, [searchTerm, filteredCustomers.length]);
  
  useEffect(() => {
    if (highlightedIndex !== -1 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
        handleSelect(filteredCustomers[highlightedIndex]);
      }
    }
  };

  const handleSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    onClose();
  };

  const handleEdit = () => {
    if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
      setCustomerToEdit(filteredCustomers[highlightedIndex]);
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
             <DialogDescription>
                Recherchez par nom, code, code postal ou ville.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <Input
              ref={inputRef}
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full">
              {filteredCustomers.length === 0 ? (
                <div className="py-6 text-center text-sm">Aucun client trouvé.</div>
              ) : (
                <div className="space-y-1 py-2">
                  {filteredCustomers.map((customer, index) => (
                    <div
                      key={customer.id}
                      ref={(el) => (itemRefs.current[index] = el)}
                      onClick={() => handleSelect(customer)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md cursor-pointer",
                        index === highlightedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                    >
                      <p className="font-semibold">
                        {customer.name}
                        <span className="ml-4 text-xs text-muted-foreground font-normal">
                          {`(${customer.id.slice(0, 8)}...) | ${customer.postalCode || ''} ${customer.city || ''}`}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddCustomerOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
            <Button variant="secondary" onClick={handleEdit} disabled={highlightedIndex === -1}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button variant="ghost" onClick={onClose}>
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
