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
  { value: 'card', label: 'Credit Card', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'other', label: 'Other', icon: Landmark },
] as const;

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, selectedTable, updateTableOrder } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [amountPaid, setAmountPaid] = useState(totalAmount.toFixed(2));
  const [isPaid, setIsPaid] = useState(false);

  const changeDue = parseFloat(amountPaid) - totalAmount;

  const handlePayment = () => {
    // In a real app, this would process the payment.
    // For now, we'll just simulate a successful payment.
    setIsPaid(true);

    setTimeout(() => {
      toast({
        title: 'Payment Successful',
        description: `Paid $${totalAmount.toFixed(2)} via ${paymentMethod}.`,
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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {!isPaid ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Checkout</DialogTitle>
              <DialogDescription>
                Complete the transaction by selecting a payment method.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-5xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
              </div>

              <RadioGroup
                defaultValue="card"
                className="grid grid-cols-3 gap-4"
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
              >
                {paymentOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <Label
                      htmlFor={option.value}
                      className={`flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${
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
                <div className="grid gap-2">
                  <Label htmlFor="amount-paid">Amount Paid</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="text-lg text-center h-12"
                  />
                  {changeDue >= 0 && (
                     <p className="text-center text-muted-foreground mt-2">
                        Change Due: <span className="font-bold text-primary">${changeDue.toFixed(2)}</span>
                     </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" onClick={handlePayment} className="w-full sm:w-auto" disabled={paymentMethod === 'cash' && changeDue < 0}>
                Confirm Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
            <h2 className="text-2xl font-semibold">Payment Confirmed</h2>
            <p className="text-muted-foreground">Thank you for your purchase!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
