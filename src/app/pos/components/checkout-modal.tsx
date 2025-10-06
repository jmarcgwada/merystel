

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Payment, PaymentMethod, Customer, Sale } from '@/lib/types';
import { CreditCard, Wallet, Landmark, CheckCircle, Trash2, StickyNote, Icon, User as UserIcon, XCircle, Calendar, Clock, ChevronRight, Delete, Calculator, Check, UserPlus, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';


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

const MAIN_PAYMENT_NAMES = ['Espèces', 'Carte Bancaire', 'Chèque'];

const KeypadButton = ({ children, onClick, className, flex = 1 }: { children: React.ReactNode, onClick: () => void, className?: string, flex?: number }) => (
    <Button variant="outline" className={cn("text-xl h-14", className)} onClick={onClick} style={{ flex }}>
        {children}
    </Button>
)

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, recordSale, order, orderTotal, orderTax, paymentMethods, customers, currentSaleId, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user, paymentMethodImageOpacity } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  
  const [view, setView] = useState<'payment' | 'advanced'>('payment');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number | string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);

  const autoFinalizeTimer = useRef<NodeJS.Timeout | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [shouldReplaceValue, setShouldReplaceValue] = useState(true);

  const previousPayments = useMemo(() => currentSaleContext?.originalPayments || [], [currentSaleContext]);
  const previousChange = useMemo(() => currentSaleContext?.change || 0, [currentSaleContext]);
  
  const amountPaidFromPrevious = useMemo(() => {
    const totalPaid = previousPayments.reduce((acc, p) => acc + p.amount, 0);
    // This is the amount the business effectively kept for the original sale.
    return totalPaid - previousChange;
  }, [previousPayments, previousChange]);

  const amountPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const totalAmountPaid = amountPaidFromPrevious + amountPaid;
  const balanceDue = useMemo(() => totalAmount - totalAmountPaid, [totalAmount, totalAmountPaid]);

  const isOverpaid = useMemo(() => balanceDue < -0.009, [balanceDue]);
  
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
  
 const handleFinalizeSale = useCallback((finalPayments: Payment[], isFullyPaid: boolean) => {
    if (isPaid && isFullyPaid) return; // Prevent re-finalizing a paid sale
    
    const allPayments = [...previousPayments, ...finalPayments];
    const totalPaidForSale = allPayments.reduce((acc, p) => acc + p.amount, 0);
    const change = totalPaidForSale > totalAmount ? totalPaidForSale - totalAmount : 0;
  
    const saleInfo: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: totalAmount,
      payments: allPayments,
      status: isFullyPaid ? 'paid' : 'pending',
      ...(change > 0.009 && { change: change }),
      ...(selectedCustomer?.id && { customerId: selectedCustomer.id }),
      ...(currentSaleContext?.originalTotal && { originalTotal: currentSaleContext.originalTotal }),
      ...(currentSaleContext?.originalPayments && { originalPayments: currentSaleContext.originalPayments }),
      ...(currentSaleContext?.tableId && {tableId: currentSaleContext.tableId}),
      ...(currentSaleContext?.tableName && {tableName: currentSaleContext.tableName}),
    };
  
    const isInvoice = currentSaleContext?.ticketNumber?.startsWith('Fact-') || currentSaleContext?.isInvoice || false;
    
    recordSale(saleInfo, currentSaleId ?? undefined);
    
    if (isFullyPaid) {
        setIsPaid(true);
        setTimeout(() => {
          toast({
            title: 'Paiement réussi',
            description: `${isInvoice ? 'Facture' : 'Vente'} de ${totalAmount.toFixed(2)}€ finalisée.`,
          });
          
          const isTableSale = currentSaleContext?.isTableSale;
      
          if (isTableSale || (cameFromRestaurant && selectedCustomer?.id !== 'takeaway')) {
              if(cameFromRestaurant) setCameFromRestaurant(false);
              router.push('/restaurant');
          } else if (isInvoice) {
              clearOrder({ clearCustomer: true });
              router.push('/reports?filter=Fact-');
          } else {
            clearOrder();
          }
      
          handleOpenChange(false);
        }, 500);
    } else {
        toast({
            title: 'Vente mise en attente',
            description: `La facture est en attente.`
        })
        clearOrder({ clearCustomer: true });
        handleOpenChange(false);
        router.push('/reports?filter=Fact-');
    }
  }, [isPaid, order, orderTotal, orderTax, totalAmount, recordSale, toast, router, clearOrder, selectedCustomer, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user, previousPayments, currentSaleId]);


  useEffect(() => {
    if (isOpen) {
        if (currentSaleContext?.customerId) {
            const customerFromContext = customers?.find(c => c.id === currentSaleContext.customerId);
            if (customerFromContext) {
                setSelectedCustomer(customerFromContext);
            }
        } else {
            const defaultCustomer = customers?.find(c => c.isDefault);
            if (defaultCustomer) {
                setSelectedCustomer(defaultCustomer);
            }
        }
        
        if (!isPaid) {
            const newBalance = totalAmount - amountPaidFromPrevious;
            setCurrentAmount(newBalance > 0 ? newBalance.toFixed(2) : '');
        }
    } else {
        setTimeout(() => {
            setPayments([]);
            setIsPaid(false);
            setCurrentAmount('');
            setSelectedCustomer(null);
            setView('payment');
            setShowCalculator(false);
        }, 300);
    }
  }, [isOpen, isPaid, totalAmount, customers, currentSaleContext, amountPaidFromPrevious]);


  const handleReset = () => {
    setPayments([]);
    setIsPaid(false);
    setCurrentAmount('');
    setSelectedCustomer(null);
    setView('payment');
    setShowCalculator(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const isInvoice = currentSaleContext?.isInvoice || false;
      if (payments.length > 0 && balanceDue > 0 && isInvoice) {
          handleFinalizeSale(payments, false); // Finalize as pending
      } else {
          onClose();
          setTimeout(handleReset, 300);
      }
    }
  };
  
  
  const handleAddPayment = (method: PaymentMethod) => {
    let amountToAdd : number;
    // Always use the entered amount from the input field
    amountToAdd = parseFloat(String(currentAmount));
    
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;
    
    if (method.type === 'direct' && method.icon !== 'cash' && amountToAdd > balanceDue + 0.009) {
        setShowOverpaymentAlert(true);
        return;
    }
  
    if (payments.length >= 4) {
      toast({
        variant: 'destructive',
        title: 'Limite atteinte',
        description: 'Vous ne pouvez pas utiliser plus de 4 moyens de paiement.'
      });
      return;
    }
  
    const newPayment: Payment = { method, amount: amountToAdd };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);
    
    const newTotalAmountPaid = totalAmountPaid + amountToAdd;
    const newBalance = totalAmount - newTotalAmountPaid;
    
    if (newBalance > 0.009) { // More to pay
        setCurrentAmount(newBalance.toFixed(2));
        setShowCalculator(true);
    } else { // Fully paid or overpaid
        setCurrentAmount(Math.abs(newBalance).toFixed(2));
        setShowCalculator(false);
        if (autoFinalizeTimer.current) clearTimeout(autoFinalizeTimer.current);
        if (Math.abs(newBalance) < 0.009) { // Exactly paid
            autoFinalizeTimer.current = setTimeout(() => {
                handleFinalizeSale(newPayments, true);
            }, 1000);
        }
    }
  }
  
  const handleRemovePayment = (index: number) => {
    if (autoFinalizeTimer.current) clearTimeout(autoFinalizeTimer.current);
    setPayments(prev => {
        const newPayments = prev.filter((_, i) => i !== index);
        const newAmountPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
        const newBalance = totalAmount - (amountPaidFromPrevious + newAmountPaid);
        setCurrentAmount(newBalance.toFixed(2));
        return newPayments;
    });
    setShowCalculator(true);
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
  
   const handleKeypadInput = (value: string) => {
    setShouldReplaceValue(false);
    if (value === 'del') {
      setCurrentAmount(prev => String(prev).slice(0, -1));
    } else {
      if (shouldReplaceValue) {
        setCurrentAmount(value);
      } else {
        setCurrentAmount(prev => String(prev) + value);
      }
    }
  }

  const isInvoiceMode = currentSaleContext?.isInvoice || false;
  const finalizeButtonDisabled = balanceDue > 0.009 && !isInvoiceMode;

    const handleAdvancedPaymentSelect = (method: PaymentMethod) => {
      // If the payment method has a fixed value (like a voucher), use that. Otherwise, use the entered amount.
      if (method.type === 'indirect' && method.value) {
        let amountToAdd = method.value > balanceDue ? balanceDue : method.value;
        setCurrentAmount(amountToAdd.toFixed(2));
      }
      handleAddPayment(method);
      setView('payment');
    };
    
    const renderCalculator = () => (
        <div className="md:col-span-1 space-y-2 rounded-lg border bg-secondary/50 p-4 flex flex-col">
            <h3 className="font-semibold text-secondary-foreground mb-2">Calculatrice</h3>
            <div className="flex-1 grid grid-rows-5 gap-2">
                <div className="flex gap-2">
                    <KeypadButton onClick={() => handleKeypadInput('7')}>7</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('8')}>8</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('9')}>9</KeypadButton>
                </div>
                <div className="flex gap-2">
                    <KeypadButton onClick={() => handleKeypadInput('4')}>4</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('5')}>5</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('6')}>6</KeypadButton>
                </div>
                 <div className="flex gap-2">
                    <KeypadButton onClick={() => handleKeypadInput('1')}>1</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('2')}>2</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('3')}>3</KeypadButton>
                </div>
                <div className="flex gap-2">
                    <KeypadButton onClick={() => handleKeypadInput('0')} flex={2}>0</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('.')}>.</KeypadButton>
                </div>
                 <div className="flex gap-2">
                    <Button variant="destructive" className="h-14 flex-1" onClick={() => setCurrentAmount('')}>
                       <Delete />
                    </Button>
                    <Button className="h-14 flex-1" onClick={() => setShowCalculator(false)}>
                        <Check />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderPaymentHistory = () => (
        <div className="md:col-span-1 space-y-4 rounded-lg border bg-secondary/50 p-4 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-secondary-foreground">Paiements effectués</h3>
             <Button variant="outline" size="sm" onClick={() => {setShowCalculator(true); selectAndFocusInput()}}>
                <Calculator className="h-4 w-4 mr-2" />
                Afficher
            </Button>
          </div>
          <div className="flex-1">
            {previousPayments.length === 0 && payments.length === 0 ? (
              <div className="flex items-center justify-center h-full rounded-lg border border-dashed border-muted-foreground/30">
                <p className="text-muted-foreground">Aucun paiement ajouté.</p>
              </div>
            ) : (
              <div className="space-y-4">
                  {previousPayments.length > 0 && (
                      <div>
                          <p className="text-xs text-muted-foreground mb-2 font-semibold">Paiements précédents</p>
                          <div className="space-y-2 opacity-70">
                            {previousPayments.map((p, index) => (
                                <div key={`prev-${index}`} className="flex items-center justify-between p-3 bg-card/50 rounded-md">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="capitalize">{p.method.name}</Badge>
                                    <span className="font-semibold">{p.amount.toFixed(2)}€</span>
                                </div>
                                </div>
                            ))}
                          </div>
                      </div>
                  )}
                  {payments.length > 0 && (
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
            )}
          </div>
          <div className="mt-auto">
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg">
                  <span className="text-secondary-foreground">Total Payé</span>
                  <span className="text-secondary-foreground">{totalAmountPaid.toFixed(2)}€</span>
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
    );
  
    const onCustomerSelected = (newCustomer: Customer) => {
        setSelectedCustomer(newCustomer);
        setCustomerSearchOpen(false);
    }

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
            <fieldset disabled={isInvoiceMode} className={cn(isInvoiceMode && "opacity-70 pointer-events-none")}>
                <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
                  <h3 className="font-semibold text-secondary-foreground">Client</h3>
                    <Button variant="outline" className="w-full justify-between" onClick={() => setCustomerSearchOpen(true)}>
                        {selectedCustomer ? selectedCustomer.name : 'Choisir un client...'}
                        <UserIcon className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </fieldset>
            
            <div className="space-y-2 flex-1">
                 <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">{balanceDue > 0 ? 'Montant à payer' : 'Rendu monnaie'}</Label>
                <div className="relative mt-1 w-full">
                    <Input
                        id="amount-to-pay"
                        ref={amountInputRef}
                        type="text"
                        value={currentAmount}
                        onChange={handleAmountChange}
                        onFocus={() => {
                            setShouldReplaceValue(true);
                        }}
                        readOnly={isOverpaid}
                        className="!text-5xl !font-bold h-auto text-center p-0 border-0 shadow-none focus-visible:ring-0 bg-transparent disabled:cursor-default"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground">€</span>
                </div>
            </div>

            <fieldset disabled={isOverpaid} className="space-y-2">
                 <div className="flex gap-2">
                    {mainPaymentMethods.map((method) => {
                        const IconComponent = getIcon(method.icon);
                        const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0)) || 
                                            (!currentAmount && !method.value) || 
                                            (parseFloat(String(currentAmount)) <= 0 && !method.value);

                        return (
                          <Button
                              key={method.id}
                              variant="outline"
                              className="h-24 flex-grow flex flex-col items-center justify-center gap-2 relative"
                              onClick={() => handleAddPayment(method)}
                              disabled={isDisabled || isOverpaid}
                          >
                              {method.image && <Image src={method.image} alt={method.name} fill className="object-cover rounded-md" style={{ opacity: paymentMethodImageOpacity / 100 }} />}
                              <IconComponent className="h-6 w-6 z-10" />
                              <span className="text-sm whitespace-normal text-center leading-tight z-10">{method.name}</span>
                          </Button>
                        );
                    })}
                </div>
                {otherPaymentMethod && (() => {
                    const isDisabled = (balanceDue <= 0 && otherPaymentMethod.type === 'direct' && !(parseFloat(String(currentAmount)) > 0)) || 
                                        (!currentAmount && !otherPaymentMethod.value) || 
                                        (parseFloat(String(currentAmount)) <= 0 && !otherPaymentMethod.value);
                    return (
                      <div className="flex items-center gap-2 border rounded-md p-2 bg-secondary/30 mt-2">
                        <Button
                            key={otherPaymentMethod.id}
                            variant="outline"
                            className="h-12 flex-1 flex items-center justify-center gap-2"
                            onClick={() => handleAddPayment(otherPaymentMethod)}
                            disabled={isDisabled || isOverpaid}
                        >
                            <Landmark className="h-5 w-5" />
                            <span className="text-sm">{otherPaymentMethod.name}</span>
                        </Button>
                         <Button
                            variant="secondary"
                            className="h-12"
                            onClick={() => setView('advanced')}
                            disabled={advancedPaymentMethods.length === 0 || isOverpaid}
                         >
                            Avancé <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    );
                })()}
            </fieldset>
        </div>
        {showCalculator ? renderCalculator() : renderPaymentHistory()}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
          {isInvoiceMode && balanceDue > 0 ? 'Enregistrer comme facture en attente' : 'Annuler'}
        </Button>
        {(balanceDue < 0.009 || isInvoiceMode) && (
          <Button onClick={() => handleFinalizeSale(payments, balanceDue < 0.009)} disabled={finalizeButtonDisabled} className="w-full sm:w-auto">
              Finaliser
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderAdvancedView = () => (
    <>
      <DialogHeader>
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
                            className="h-24 flex-col gap-2 relative"
                            onClick={() => handleAdvancedPaymentSelect(method)}
                            disabled={isDisabled || isOverpaid}
                        >
                            {method.image && <Image src={method.image} alt={method.name} fill className="object-cover rounded-md" style={{ opacity: paymentMethodImageOpacity / 100 }} />}
                            <IconComponent className="h-6 w-6 z-10"/>
                            <span className="text-sm whitespace-normal text-center z-10">{method.name}</span>
                        </Button>
                    );
                })}
            </div>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setView('payment')}>Retour</Button>
      </DialogFooter>
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
    <CustomerSelectionDialog isOpen={isCustomerSearchOpen} onClose={() => setCustomerSearchOpen(false)} onCustomerSelected={onCustomerSelected} />
    <AlertDialog open={showOverpaymentAlert} onOpenChange={setShowOverpaymentAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Paiement impossible</AlertDialogTitle>
                <AlertDialogDescription>
                    Le montant saisi est supérieur au solde restant. Les paiements par carte ou chèque ne peuvent pas excéder le montant dû.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => {
                setCurrentAmount(balanceDue.toFixed(2));
                selectAndFocusInput();
                setShowOverpaymentAlert(false);
            }}>
                J'ai compris
            </AlertDialogAction>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
