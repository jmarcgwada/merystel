
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import type { Payment, PaymentMethod } from '@/lib/types';
import { CreditCard, Wallet, Landmark, CheckCircle, Trash2, StickyNote, Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const { clearOrder, selectedTable, updateTableOrder, recordSale, order, orderTotal, paymentMethods } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number | string>('');

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
        if (!isPaid) {
            const newBalance = totalAmount - payments.reduce((acc, p) => acc + p.amount, 0);
            setCurrentAmount(newBalance > 0 ? newBalance.toFixed(2) : '');
            selectAndFocusInput();
        }
    } else {
        // Reset state when closing
        setTimeout(() => {
            setPayments([]);
            setIsPaid(false);
            setCurrentAmount('');
        }, 300); // Delay to allow animation to finish
    }
  }, [isOpen, isPaid, totalAmount]);


  const handleReset = () => {
    setPayments([]);
    setIsPaid(false);
    setCurrentAmount('');
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Use a timeout to avoid seeing the reset before the dialog closes
      setTimeout(handleReset, 300);
    }
  };
  
  const handleFinalizeSale = () => {
    // Prevent double execution
    if (isPaid) return;

    recordSale({
      items: order,
      subtotal: orderTotal,
      tax: orderTotal * 0.1,
      total: totalAmount,
      payments,
    });
    
    setIsPaid(true);

    setTimeout(() => {
      toast({
        title: 'Paiement réussi',
        description: `Vente de ${totalAmount.toFixed(2)}€ finalisée.`,
      });
      if (selectedTable) {
        updateTableOrder(selectedTable.id, []);
        router.push('/restaurant');
      }
      clearOrder();
      handleOpenChange(false); // This will call onClose and then handleReset
    }, 2000);
  };
  
  const handleAddPayment = (method: PaymentMethod) => {
    let amountToAdd = parseFloat(String(currentAmount));
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;
    
    // Do not cap the amount for cash payment to calculate change
    if (method.icon !== 'cash' && amountToAdd > balanceDue) {
      amountToAdd = balanceDue;
    }

    const newPayment: Payment = { method, amount: amountToAdd };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);
    
    const newAmountPaid = amountPaid + amountToAdd;
    const newBalance = totalAmount - newAmountPaid;

    if (newBalance <= 0.009) { // Using a small epsilon for float comparison
        setPayments(newPayments); // Ensure state is updated before finalizing
        setCurrentAmount(Math.abs(newBalance).toFixed(2)); // Show change
        // Don't auto-finalize, let user see the change and click finalize
    } else {
        setCurrentAmount(newBalance.toFixed(2));
        selectAndFocusInput();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {!isPaid ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Paiement</DialogTitle>
              <div className="absolute top-4 right-16 text-right">
                <p className="text-sm text-muted-foreground">Total de la commande</p>
                <p className="text-xl font-semibold text-foreground">{totalAmount.toFixed(2)}€</p>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Left side: Payment input */}
                <div className="space-y-6 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
                        <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">Montant à payer</Label>
                        <div className="relative mt-1 w-full">
                            <Input
                                id="amount-to-pay"
                                ref={amountInputRef}
                                type="text"
                                value={currentAmount}
                                onChange={handleAmountChange}
                                className="!text-6xl !font-bold h-auto text-center p-0 border-0 shadow-none focus-visible:ring-0 bg-transparent"
                                onFocus={(e) => e.target.select()}
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground">€</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {paymentMethods.map((method) => {
                          const IconComponent = getIcon(method.icon);
                          return (
                            <Button
                                key={method.id}
                                variant="outline"
                                className="h-16 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleAddPayment(method)}
                                disabled={balanceDue <= 0 || !currentAmount || parseFloat(String(currentAmount)) <= 0}
                            >
                                <IconComponent className="h-5 w-5" />
                                <span className="text-sm">{method.name}</span>
                            </Button>
                          );
                      })}
                    </div>
                </div>

                {/* Right side: Payments list */}
                <div className="space-y-4 rounded-lg border bg-secondary/50 p-4 flex flex-col">
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
              <Button 
                type="submit" 
                onClick={handleFinalizeSale} 
                className="w-full sm:w-auto" 
                disabled={balanceDue > 0.009 || payments.length === 0}
              >
                Finaliser la vente
              </Button>
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
  );
}
