
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePos } from '@/contexts/pos-context';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowUp, ArrowDown, Check, Edit, UserPlus } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CustomerSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer) => void;
}

export function CustomerSelectionDialog({ isOpen, onClose, onCustomerSelected }: CustomerSelectionDialogProps) {
  const { customers } = usePos();
  const { user } = useUser();
  const [customerSearch, setCustomerSearch] = useState('');
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const customerListRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isCashier = user?.role === 'cashier';


  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!customerSearch) return customers.slice(0, 50); // Show first 50 if no search term
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    if (isOpen) {
      setHighlightedCustomerIndex(0);
      setCustomerSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && filteredCustomers.length > 0 && customerListRef.current[highlightedCustomerIndex]) {
      customerListRef.current[highlightedCustomerIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedCustomerIndex, isOpen, filteredCustomers]);

  const handleSelectCustomer = () => {
    const customer = filteredCustomers[highlightedCustomerIndex];
    if (customer) {
      onCustomerSelected(customer);
      onClose();
    }
  };

  const handleEditCustomer = () => {
    const customer = filteredCustomers[highlightedCustomerIndex];
    if (customer) {
      setCustomerToEdit(customer);
      setEditCustomerOpen(true);
    }
  };

  const handleNavigation = (direction: 'up' | 'down') => {
    setHighlightedCustomerIndex(prevIndex => {
      const newIndex = direction === 'up' ? prevIndex - 1 : prevIndex + 1;
      if (newIndex >= 0 && newIndex < filteredCustomers.length) {
        return newIndex;
      }
      return prevIndex; // Stay at bounds
    });
  };

  const startScrolling = (direction: 'up' | 'down') => {
    stopScrolling();
    scrollIntervalRef.current = setInterval(() => {
      handleNavigation(direction);
    }, 100);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const onCustomerAdded = (newCustomer: Customer) => {
    onCustomerSelected(newCustomer);
    onClose();
  }

  useEffect(() => {
    // Cleanup interval on unmount
    return () => stopScrolling();
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-row items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl font-headline">Choisir un client</DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-12 gap-4 px-6 pb-4 min-h-0">
            <div className="col-span-8 flex flex-col space-y-4">
               <div className="flex items-center gap-2">
                <Input
                    placeholder="Rechercher par nom ou email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    autoFocus
                    className="max-w-xs"
                />
                 {!isCashier && (
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setAddCustomerOpen(true)}>
                                <UserPlus className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Ajouter un nouveau client</p>
                        </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" onClick={handleEditCustomer} disabled={filteredCustomers.length === 0}>
                                <Edit className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Modifier le client sélectionné</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
               </div>
              <div className="flex-1 relative">
                <ScrollArea className="absolute inset-0">
                  <div className="pr-2">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground p-4">Aucun client trouvé.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredCustomers.map((customer, index) => (
                          <div
                            key={customer.id}
                            ref={el => customerListRef.current[index] = el}
                            className={cn(
                              'w-full p-3 text-left border-2 border-transparent rounded-lg cursor-pointer flex items-center justify-between',
                              index === highlightedCustomerIndex && 'border-primary bg-primary/10'
                            )}
                            onClick={() => setHighlightedCustomerIndex(index)}
                            onDoubleClick={handleSelectCustomer}
                          >
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.id.substring(0, 8).toUpperCase()} | {customer.postalCode} {customer.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-2">
              <Button
                className="h-10 w-full"
                variant="outline"
                onMouseDown={() => startScrolling('up')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('up')}
                onTouchEnd={stopScrolling}
                onClick={() => handleNavigation('up')}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <Button
                className="h-10 w-full"
                variant="outline"
                onMouseDown={() => startScrolling('down')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('down')}
                onTouchEnd={stopScrolling}
                onClick={() => handleNavigation('down')}
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
              <Button
                className="h-14 text-xl mt-auto"
                onClick={handleSelectCustomer}
                disabled={filteredCustomers.length === 0}
              >
                <Check className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <DialogFooter className="justify-end items-center border-t p-4 mt-auto">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerAdded} />
      <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customerToEdit} />
    </>
  );
}
