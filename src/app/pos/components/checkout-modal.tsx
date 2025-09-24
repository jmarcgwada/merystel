
'use client';

import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod } from '@/lib/types';
import { CreditCard, Wallet, Landmark, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
}

const paymentOptions = [
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'cash', label: 'Espèces', icon: Wallet },
  { value: 'other', label: 'Autre', icon: Landmark },
] as const;

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, selectedTable, updateTableOrder, recordSale, order, orderTotal } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [amountPaid, setAmountPaid] = useState(totalAmount.toFixed(2));
  const [isPaid, setIsPaid] = useState(false);

  const changeDue = parseFloat(amountPaid) - totalAmount;
  
  const quickCashButtons = [
    totalAmount,
    Math.ceil(totalAmount / 5) * 5,
    Math.ceil(totalAmount / 10) * 10,
    Math.ceil(totalAmount / 50) * 50
  ].filter((value, index, self) => self.indexOf(value) === index && value > totalAmount).slice(0, 3);
  if (!quickCashButtons.includes(totalAmount)) {
    quickCashButtons.unshift(totalAmount);
  }


  const handlePayment = () => {
    // In a real app, this would process the payment.
    // For now, we'll just simulate a successful payment.
    setIsPaid(true);

    const sale = {
      id: `sale-${Date.now()}`,
      date: new Date(),
      items: order,
      subtotal: orderTotal,
      tax: orderTotal * 0.1,
      total: totalAmount,
      paymentMethod,
    };
    recordSale(sale);

    setTimeout(() => {
      toast({
        title: 'Paiement réussi',
        description: `Payé ${totalAmount.toFixed(2)}€ via ${paymentMethod}.`,
      });
      if (selectedTable) {
        updateTableOrder(selectedTable.id, []);
      }
      clearOrder();
      onClose();
      setIsPaid(false);
      
      if(selectedTable){
        router.push('/restaurant');
      }

    }, 2000);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state if dialog is closed without completing payment
      setTimeout(() => setIsPaid(false), 300);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {!isPaid ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Paiement</DialogTitle>
              <DialogDescription>
                Finalisez la transaction en sélectionnant un mode de paiement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total à payer</p>
                <p className="text-5xl font-bold text-primary">{totalAmount.toFixed(2)}€</p>
              </div>

              <RadioGroup
                defaultValue="card"
                className="grid grid-cols-3 gap-4"
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                value={paymentMethod}
              >
                {paymentOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <Label
                      htmlFor={option.value}
                      className={`flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                        paymentMethod === option.value ? 'border-primary' : ''
                      }`}
                    >
                      <option.icon className="mb-3 h-6 w-6" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {paymentMethod === 'cash' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount-paid">Montant payé</Label>
                      <Input
                        id="amount-paid"
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="text-lg text-center h-12 mt-1"
                      />
                    </div>
                     <div className="flex flex-col space-y-2">
                        <Label>Saisie rapide</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {quickCashButtons.map(amount => (
                            <Button 
                              key={amount} 
                              variant="outline"
                              onClick={() => setAmountPaid(amount.toFixed(2))}
                            >
                                {amount.toFixed(2)}€
                            </Button>
                          ))}
                        </div>
                    </div>
                  </div>
                  {changeDue >= 0 ? (
                     <p className="text-center text-muted-foreground">
                        Monnaie à rendre : <span className="font-bold text-primary">{changeDue.toFixed(2)}€</span>
                     </p>
                  ) : (
                    <p className="text-center text-destructive">
                        Montant insuffisant
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" onClick={handlePayment} className="w-full sm:w-auto" disabled={paymentMethod === 'cash' && changeDue < 0}>
                Confirmer le paiement
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
            <h2 className="text-2xl font-semibold">Paiement confirmé</h2>
            <p className="text-muted-foreground">Merci pour votre achat !</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

