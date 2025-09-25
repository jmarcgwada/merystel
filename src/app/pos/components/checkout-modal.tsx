

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Payment, PaymentMethod, Customer, Sale } from '@/lib/types';
import { CreditCard, Wallet, Landmark, CheckCircle, Trash2, StickyNote, Icon, UserPlus, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
}

const iconMap: { [key: string]: Icon } = {
  card: CreditCard,
  cash: Wallet,
  check: StickyNote,
  other: Landmark
};

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, recordSale, order, orderTotal, orderTax, paymentMethods, customers, currentSaleId, cameFromRestaurant, setCameFromRestaurant } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number | string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);


  const amountInputRef = useRef<HTMLInputElement>(null);

  const amountPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const balanceDue = useMemo(() => totalAmount - amountPaid, [totalAmount, amountPaid]);

  const selectAndFocusInput = () => {
    setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
    }, 100);
  }

  useEffect(() => {
    if (isOpen) {
        // Set default customer if available
        const defaultCustomer = customers.find(c => c.isDefault);
        if (defaultCustomer) {
            setSelectedCustomer(defaultCustomer);
        }

        if (!isPaid) {
            const newBalance = totalAmount - payments.reduce((acc, p) => acc + p.amount, 0);
            setCurrentAmount(newBalance > 0 ? newBalance.toFixed(2) : '');
            if (newBalance > 0) {
              selectAndFocusInput();
            }
        }
    } else {
        // Reset state when closing
        setTimeout(() => {
            setPayments([]);
            setIsPaid(false);
            setCurrentAmount('');
            setSelectedCustomer(null);
            setCameFromRestaurant(false); // Reset on close
        }, 300); // Delay to allow animation to finish
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPaid, totalAmount, customers]);


  const handleReset = () => {
    setPayments([]);
    setIsPaid(false);
    setCurrentAmount('');
    setSelectedCustomer(null);
    setCameFromRestaurant(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Use a timeout to avoid seeing the reset before the dialog closes
      setTimeout(handleReset, 300);
    }
  };
  
  const handleFinalizeSale = useCallback((finalPayments: Payment[]) => {
    if (isPaid) return;
    
    const saleInfo = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: totalAmount,
      payments: finalPayments,
      customerId: selectedCustomer?.id,
    };

    recordSale(saleInfo, currentSaleId ?? undefined);
    
    setIsPaid(true);

    setTimeout(() => {
      toast({
        title: 'Paiement réussi',
        description: `Vente de ${totalAmount.toFixed(2)}€ finalisée.`,
      });
      
      const isTableSale = currentSaleId && currentSaleId.startsWith('table-');

      if (isTableSale || cameFromRestaurant) {
        if(cameFromRestaurant) setCameFromRestaurant(false);
        router.push('/restaurant');
      } else {
        clearOrder();
      }

      handleOpenChange(false);
    }, 2000);
  }, [isPaid, order, orderTotal, orderTax, totalAmount, recordSale, toast, router, clearOrder, handleOpenChange, selectedCustomer, currentSaleId, cameFromRestaurant, setCameFromRestaurant]);
  
  const handleAddPayment = (method: PaymentMethod) => {
    if (payments.length >= 4) {
      toast({
        variant: 'destructive',
        title: 'Limite atteinte',
        description: 'Vous ne pouvez pas utiliser plus de 4 moyens de paiement.'
      });
      return;
    }
    
    let amountToAdd : number;
    if (method.type === 'indirect' && method.value) {
      amountToAdd = method.value > balanceDue ? balanceDue : method.value;
    } else {
      amountToAdd = parseFloat(String(currentAmount));
    }
    
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;
    
    const newPayment: Payment = { method, amount: amountToAdd };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);
    
    const newAmountPaid = amountPaid + amountToAdd;
    const newBalance = totalAmount - newAmountPaid;
    
    if (newBalance > 0.009) {
        setCurrentAmount(newBalance.toFixed(2));
        selectAndFocusInput();
    } else { 
        setCurrentAmount(Math.abs(newBalance).toFixed(2));
        if (newBalance > -0.009 && newBalance < 0.009) { // Exactly paid
            handleFinalizeSale(newPayments);
        }
    }
  }
  
  const handleRemovePayment = (index: number) => {
    setPayments(prev => {
        const newPayments = prev.filter((_, i) => i !== index);
        const newAmountPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
        const newBalance = totalAmount - newAmountPaid;
        setCurrentAmount(newBalance.toFixed(2));
        return newPayments;
    });
    selectAndFocusInput();
  }
  
  const getIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    return Landmark;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCurrentAmount(value);
    }
  };

  const finalizeButtonDisabled = balanceDue > 0.009;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        {!isPaid ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Paiement</DialogTitle>
              <div className="absolute top-4 right-16 text-right">
                <p className="text-sm text-muted-foreground">Total de la commande</p>
                <p className="text-xl font-semibold text-foreground">{totalAmount.toFixed(2)}€</p>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                {/* Left side: Payment input */}
                <div className="md:col-span-1 space-y-6 flex flex-col">
                   <div className="rounded-lg border bg-secondary/50 p-4">
                     <h3 className="font-semibold text-secondary-foreground mb-3">Client</h3>
                     {selectedCustomer ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{selectedCustomer.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                            </div>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setSelectedCustomer(null)}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                     ) : (
                        <div className="flex gap-2">
                             <Popover open={isCustomerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                                <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isCustomerSearchOpen} className="w-full justify-start">
                                    Rechercher un client
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher un client..." />
                                    <CommandList>
                                        <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                        <CommandGroup>
                                        {customers.map((customer) => (
                                            <CommandItem
                                            key={customer.id}
                                            onSelect={() => {
                                                setSelectedCustomer(customer);
                                                setCustomerSearchOpen(false);
                                            }}
                                            >
                                            {customer.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <Button size="icon" onClick={() => setAddCustomerOpen(true)}>
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </div>
                     )}
                   </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {paymentMethods.map((method) => {
                          const IconComponent = getIcon(method.icon);
                          const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0)) || 
                                             (!currentAmount && !method.value) || 
                                             (parseFloat(String(currentAmount)) <= 0 && !method.value);

                          return (
                            <Button
                                key={method.id}
                                variant="outline"
                                className="h-16 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleAddPayment(method)}
                                disabled={isDisabled}
                            >
                                <IconComponent className="h-5 w-5" />
                                <span className="text-sm">{method.name}</span>
                            </Button>
                          );
                      })}
                    </div>
                </div>

                <div className="md:col-span-1 text-center">
                    <div className="space-y-2">
                        <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">{balanceDue > 0 ? 'Montant à payer' : 'Rendu monnaie'}</Label>
                        <div className="relative mt-1 w-full">
                            <Input
                                id="amount-to-pay"
                                ref={amountInputRef}
                                type="text"
                                value={currentAmount}
                                onChange={handleAmountChange}
                                disabled={balanceDue <= 0}
                                className="!text-6xl !font-bold h-auto text-center p-0 border-0 shadow-none focus-visible:ring-0 bg-transparent disabled:cursor-default"
                                onFocus={(e) => e.target.select()}
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground">€</span>
                        </div>
                    </div>
                </div>

                {/* Right side: Payments list */}
                <div className="md:col-span-1 space-y-4 rounded-lg border bg-secondary/50 p-4 flex flex-col">
                  <h3 className="font-semibold text-secondary-foreground">Paiements effectués</h3>
                  <div className="flex-1">
                    {payments.length === 0 ? (
                      <div className="flex items-center justify-center h-full rounded-lg border border-dashed border-muted-foreground/30">
                        <p className="text-muted-foreground">Aucun paiement ajouté.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                          {payments.map((p, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-card rounded-md shadow-sm">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="capitalize">{p.method.name}</Badge>
                                <span className="font-semibold">{p.amount.toFixed(2)}€</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemovePayment(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold text-lg">
                          <span className="text-secondary-foreground">Total Payé</span>
                          <span className="text-secondary-foreground">{amountPaid.toFixed(2)}€</span>
                      </div>
                      <div className={cn(
                          "flex justify-between font-bold text-lg mt-2",
                          balanceDue > 0 ? "text-primary" : "text-green-600"
                      )}>
                          <span>{balanceDue > 0 ? 'Solde Restant' : 'Rendu'}</span>
                          <span>{Math.abs(balanceDue).toFixed(2)}€</span>
                      </div>
                  </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                Annuler
              </Button>
               {balanceDue < 0.009 && (
                 <Button onClick={() => handleFinalizeSale(payments)} disabled={finalizeButtonDisabled} className="w-full sm:w-auto">
                    Finaliser la vente
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Paiement Confirmé</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
              <h2 className="text-2xl font-semibold">Paiement confirmé</h2>
              <p className="text-muted-foreground">Merci pour votre achat !</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
     <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
    </>
  );
}

