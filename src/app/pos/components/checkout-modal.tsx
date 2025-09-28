
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
import { CreditCard, Wallet, Landmark, CheckCircle, Trash2, StickyNote, Icon, UserPlus, XCircle, Calendar, Clock, User as UserIcon, ArrowLeft, ArrowUp, ArrowDown, Check, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddCustomerDialog } from '@/app/management/customers/components/add-customer-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

const MAIN_PAYMENT_NAMES = ['Espèces', 'Carte Bancaire'];

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, recordSale, order, orderTotal, orderTax, paymentMethods, customers, currentSaleId, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  
  const [view, setView] = useState<'payment' | 'customer' | 'advanced'>('payment');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number | string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const customerListRef = useRef<(HTMLDivElement | null)[]>([]);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const amountPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const balanceDue = useMemo(() => totalAmount - amountPaid, [totalAmount, amountPaid]);
  
  const mainPaymentMethods = useMemo(() => 
    paymentMethods?.filter(m => m.isActive && MAIN_PAYMENT_NAMES.includes(m.name)) || [],
    [paymentMethods]
  );
  const otherPaymentMethod = useMemo(() => 
    paymentMethods?.find(m => m.isActive && m.name === 'AUTRE'),
    [paymentMethods]
  );
  const advancedPaymentMethods = useMemo(() => 
    paymentMethods?.filter(m => m.isActive && !MAIN_PAYMENT_NAMES.includes(m.name) && m.name !== 'AUTRE') || [],
    [paymentMethods]
  );


  const selectAndFocusInput = () => {
    setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
    }, 100);
  }

  useEffect(() => {
    if (isOpen) {
        const defaultCustomer = customers?.find(c => c.isDefault);
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
        setTimeout(() => {
            setPayments([]);
            setIsPaid(false);
            setCurrentAmount('');
            setSelectedCustomer(null);
            setView('payment');
            setCustomerSearch('');
            setHighlightedCustomerIndex(0);
        }, 300);
    }
  }, [isOpen, isPaid, totalAmount, customers]);


  const handleReset = () => {
    setPayments([]);
    setIsPaid(false);
    setCurrentAmount('');
    setSelectedCustomer(null);
    setView('payment');
    setCustomerSearch('');
    setHighlightedCustomerIndex(0);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(handleReset, 300);
    }
  };
  
  const handleFinalizeSale = useCallback((finalPayments: Payment[]) => {
    if (isPaid) return;
    
    const saleInfo: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: totalAmount,
      payments: finalPayments,
      ...(selectedCustomer?.id && { customerId: selectedCustomer.id }),
      ...(user?.uid && { userId: user.uid }),
      ...(user?.firstName && user.lastName && { userName: `${user.firstName} ${user.lastName}` }),
    };

    recordSale(saleInfo);
    
    setIsPaid(true);

    setTimeout(() => {
      toast({
        title: 'Paiement réussi',
        description: `Vente de ${totalAmount.toFixed(2)}€ finalisée.`,
      });
      
      const isTableSale = currentSaleId && currentSaleId.startsWith('table-');

      if (isTableSale || cameFromRestaurant || currentSaleContext?.isTableSale) {
        if(cameFromRestaurant) setCameFromRestaurant(false);
        router.push('/restaurant');
      } else {
        clearOrder();
      }

      handleOpenChange(false);
    }, 2000);
  }, [isPaid, order, orderTotal, orderTax, totalAmount, recordSale, toast, router, clearOrder, handleOpenChange, selectedCustomer, currentSaleId, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user]);
  
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

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const onCustomerAdded = (newCustomer: Customer) => {
      setSelectedCustomer(newCustomer);
      setView('payment');
  }

    useEffect(() => {
        if (view === 'customer') {
            setHighlightedCustomerIndex(0);
        }
    }, [customerSearch, view]);

    useEffect(() => {
        customerListRef.current[highlightedCustomerIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }, [highlightedCustomerIndex]);

    const handleSelectCustomer = () => {
        const customer = filteredCustomers[highlightedCustomerIndex];
        if (customer) {
            setSelectedCustomer(customer);
            setView('payment');
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

    useEffect(() => {
        // Cleanup interval on unmount
        return () => stopScrolling();
    }, []);

    const handleAdvancedPaymentSelect = (method: PaymentMethod) => {
      if (method.type === 'direct') {
          handleAddPayment(method);
          setView('payment');
      } else {
          // For indirect, we go back to the main screen to let user see/edit the amount.
          // We can pre-fill the amount with the method's value if it exists.
          if(method.value) {
            setCurrentAmount(method.value.toString());
          }
          setView('payment');
          selectAndFocusInput();
      }
    };

  const renderPaymentView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline">Paiement</DialogTitle>
        {currentSaleContext?.tableName ? (
            <div className="text-sm text-muted-foreground pt-1">
                <p>Table: <span className="font-semibold text-foreground">{currentSaleContext.tableName}</span></p>
                <p className="flex items-center gap-2">
                    <span><Calendar className="h-3 w-3"/> {format(new Date(), 'd MMMM yyyy', {locale: fr})}</span>
                    <span><Clock className="h-3 w-3"/> {format(new Date(), 'HH:mm')}</span>
                </p>
            </div>
        ) : (
            <div className="absolute top-4 right-16 text-right">
                <p className="text-sm text-muted-foreground">Total de la commande</p>
                <p className="text-xl font-semibold text-foreground">{totalAmount.toFixed(2)}€</p>
            </div>
        )}
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
        <div className="md:col-span-1 space-y-6 flex flex-col">
            <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
              <h3 className="font-semibold text-secondary-foreground">Client</h3>
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                    <div onClick={() => setView('customer')} className="cursor-pointer flex-1">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                    <Button variant="destructive" onClick={() => setSelectedCustomer(null)}>
                        Effacer client
                    </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-start" onClick={() => setView('customer')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Associer un client
                </Button>
              )}
            </div>
            
            <div className="space-y-2 flex-1">
                 <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">{balanceDue > 0 ? 'Montant à payer' : 'Rendu monnaie'}</Label>
                <div className="relative mt-1 w-full">
                    <Input
                        id="amount-to-pay"
                        ref={amountInputRef}
                        type="text"
                        value={currentAmount}
                        onChange={handleAmountChange}
                        disabled={balanceDue <= 0}
                        className="!text-5xl !font-bold h-auto text-center p-0 border-0 shadow-none focus-visible:ring-0 bg-transparent disabled:cursor-default"
                        onFocus={(e) => e.target.select()}
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground">€</span>
                </div>
            </div>

            <div className="space-y-2">
                 <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2 pb-2">
                        {mainPaymentMethods.map((method) => {
                            const IconComponent = getIcon(method.icon);
                            const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0)) || 
                                                (!currentAmount && !method.value) || 
                                                (parseFloat(String(currentAmount)) <= 0 && !method.value);

                            return (
                              <Button
                                  key={method.id}
                                  variant="outline"
                                  className="h-20 w-24 flex-shrink-0 flex flex-col items-center justify-center gap-2"
                                  onClick={() => handleAddPayment(method)}
                                  disabled={isDisabled}
                              >
                                  <IconComponent className="h-5 w-5" />
                                  <span className="text-sm whitespace-normal text-center leading-tight">{method.name}</span>
                              </Button>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                {otherPaymentMethod && (() => {
                    const isDisabled = (balanceDue <= 0 && otherPaymentMethod.type === 'direct' && !(parseFloat(String(currentAmount)) > 0)) || 
                                        (!currentAmount && !otherPaymentMethod.value) || 
                                        (parseFloat(String(currentAmount)) <= 0 && !otherPaymentMethod.value);
                    return (
                      <div className="flex items-center gap-2 border rounded-md p-2 bg-secondary/30">
                        <Button
                            key={otherPaymentMethod.id}
                            variant="outline"
                            className="h-12 flex-1 flex items-center justify-center gap-2"
                            onClick={() => handleAddPayment(otherPaymentMethod)}
                            disabled={isDisabled}
                        >
                            <Landmark className="h-5 w-5" />
                            <span className="text-sm">{otherPaymentMethod.name}</span>
                        </Button>
                         <Button
                            variant="secondary"
                            className="h-12"
                            onClick={() => setView('advanced')}
                            disabled={advancedPaymentMethods.length === 0}
                         >
                            Avancé <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    );
                })()}
            </div>
        </div>
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
  );

  const renderCustomerView = () => (
    <>
      <DialogHeader className="flex-row items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setView('payment')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DialogTitle className="text-2xl font-headline">Choisir un client</DialogTitle>
      </DialogHeader>
      <div className="py-4 grid grid-cols-3 gap-4 h-[60vh]">
        <div className="col-span-2 flex flex-col space-y-4">
            <Input 
                placeholder="Rechercher par nom ou email..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
            />
            <div className="flex-1 relative">
                <ScrollArea className="absolute inset-0">
                    <div className="p-1 pr-2">
                        {filteredCustomers.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground p-4">Aucun client trouvé.</p>
                        ) : (
                            <div className="space-y-1">
                                {filteredCustomers.map((customer, index) => (
                                    <div
                                        key={customer.id}
                                        ref={el => customerListRef.current[index] = el}
                                        className={cn(
                                            'w-full justify-start h-auto p-3 text-left border-2 border-transparent rounded-lg cursor-pointer',
                                            index === highlightedCustomerIndex && 'border-primary bg-primary/10'
                                        )}
                                        onClick={() => setHighlightedCustomerIndex(index)}
                                    >
                                        <p className="font-semibold">{customer.name}</p>
                                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
         <div className="col-span-1 flex flex-col space-y-4">
             <Button 
                className="h-24 text-2xl" 
                variant="outline"
                onMouseDown={() => startScrolling('up')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('up')}
                onTouchEnd={stopScrolling}
                onClick={() => handleNavigation('up')}
             >
                <ArrowUp className="h-8 w-8" />
            </Button>
            <Button 
                className="h-24 text-2xl"
                variant="outline"
                onMouseDown={() => startScrolling('down')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('down')}
                onTouchEnd={stopScrolling}
                onClick={() => handleNavigation('down')}
            >
                <ArrowDown className="h-8 w-8" />
            </Button>
             <Button 
                className="h-24 text-2xl"
                onClick={handleSelectCustomer} 
                disabled={filteredCustomers.length === 0}
            >
                <Check className="h-8 w-8" />
            </Button>
        </div>
      </div>
      <DialogFooter className="justify-between items-center">
        <Button variant="outline" onClick={() => setAddCustomerOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Créer un nouveau client
        </Button>
        <Button variant="ghost" onClick={() => setView('payment')}>
            Annuler
        </Button>
      </DialogFooter>
    </>
  );

  const renderAdvancedView = () => (
    <>
       <DialogHeader className="flex-row items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setView('payment')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DialogTitle className="text-2xl font-headline">Paiements avancés</DialogTitle>
      </DialogHeader>
      <div className="py-4 h-[60vh]">
        <ScrollArea className="h-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-4">
                {advancedPaymentMethods?.map(method => {
                    const IconComponent = getIcon(method.icon);
                    const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0));
                    return (
                        <Button
                            key={method.id}
                            variant="outline"
                            className="h-24 flex-col gap-2"
                            onClick={() => handleAdvancedPaymentSelect(method)}
                            disabled={isDisabled}
                        >
                            <IconComponent className="h-6 w-6"/>
                            <span className="text-sm whitespace-normal text-center">{method.name}</span>
                        </Button>
                    );
                })}
            </div>
        </ScrollArea>
      </div>
    </>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        {!isPaid ? (
            (() => {
                switch(view) {
                    case 'payment':
                        return renderPaymentView();
                    case 'customer':
                        return renderCustomerView();
                    case 'advanced':
                        return renderAdvancedView();
                    default:
                        return renderPaymentView();
                }
            })()
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
     <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerAdded} />
    </>
  );
}

    