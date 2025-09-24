
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
  const [currentAmount, setCurrentAmount] = useState(0);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const amountPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const balanceDue = useMemo(() => totalAmount - amountPaid, [totalAmount, amountPaid]);

  useEffect(() => {
    if (isOpen) {
        setCurrentAmount(balanceDue);
    }
  }, [isOpen, balanceDue]);

  useEffect(() => {
    if(isOpen && !isPaid) {
        setTimeout(() => {
            amountInputRef.current?.focus();
            amountInputRef.current?.select();
        }, 100);
    }
  }, [isOpen, isPaid]);

  const handleReset = () => {
    setPayments([]);
    setIsPaid(false);
    setCurrentAmount(0);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(handleReset, 300);
    }
  };

  const handleAddPayment = (method: PaymentMethod) => {
    const amountToAdd = currentAmount;
    if (amountToAdd <= 0) return;
    if (amountToAdd > balanceDue + 0.001) {
        toast({
            variant: 'destructive',
            title: 'Montant invalide',
            description: 'Le montant ne peut pas être supérieur au solde restant.',
        });
        return;
    }

    setPayments(prev => [...prev, { method, amount: amountToAdd }]);
  }
  
  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  }

  const handleFinalizeSale = () => {
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
      onClose();
    }, 2000);
  };
  
  const getIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    return Landmark;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {!isPaid ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Paiement</DialogTitle>
              <DialogDescription>
                Ajoutez un ou plusieurs paiements pour compléter la transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Left side: Payment input */}
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <div>
                            <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">Montant à payer</Label>
                            <div className="relative mt-1">
                                <Input
                                    id="amount-to-pay"
                                    ref={amountInputRef}
                                    type="number"
                                    value={currentAmount.toFixed(2)}
                                    onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                                    className="text-5xl font-bold h-auto text-center p-0 border-0 shadow-none focus-visible:ring-0"
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">€</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de la commande</p>
                            <p className="text-xl font-semibold text-foreground">{totalAmount.toFixed(2)}€</p>
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
                                disabled={balanceDue <= 0 || currentAmount <= 0}
                            >
                                <IconComponent className="h-5 w-5" />
                                <span className="text-sm">{method.name}</span>
                            </Button>
                          );
                      })}
                    </div>
                </div>

                {/* Right side: Payments list */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Paiements effectués</h3>
                  {payments.length === 0 ? (
                    <div className="flex items-center justify-center h-full rounded-lg border border-dashed py-12">
                      <p className="text-muted-foreground">Aucun paiement ajouté.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                        {payments.map((p, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">{p.method.name}</Badge>
                              <span className="font-semibold">{p.amount.toFixed(2)}€</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemovePayment(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                  <Separator />
                   <div className="flex justify-between font-bold text-lg">
                        <span>Total Payé</span>
                        <span>{amountPaid.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-primary">
                        <span>Solde Restant</span>
                        <span>{balanceDue.toFixed(2)}€</span>
                    </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
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
              <DialogTitle className="sr-only">Paiement confirmé</DialogTitle>
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
