

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { Payment, PaymentMethod, Customer, Sale, Cheque } from '@/lib/types';
import { CreditCard, Wallet, Landmark, CheckCircle, Trash2, StickyNote, Icon, User as UserIcon, XCircle, Calendar, Clock, ChevronRight, Delete, Calculator, Check, UserPlus, Edit, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { CustomerSelectionDialog } from '@/components/shared/customer-selection-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import type { Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { bankList } from '@/lib/banks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const MAIN_PAYMENT_NAMES = ['Espèces', 'Carte Bancaire'];
const CHECK_PAYMENT_NAME = 'Chèque';

const KeypadButton = ({ children, onClick, className, flex = 1 }: { children: React.ReactNode, onClick: () => void, className?: string, flex?: number }) => (
    <Button variant="outline" className={cn("text-xl h-14", className)} onClick={onClick} style={{ flex }}>
        {children}
    </Button>
)

export function CheckoutModal({ isOpen, onClose, totalAmount }: CheckoutModalProps) {
  const { clearOrder, recordSale, order, orderTotal, orderTax, paymentMethods, customers, currentSaleId, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user, paymentMethodImageOpacity, resetCommercialPage, addCheque, updateSale } = usePos();
  const { toast } = useToast();
  const router = useRouter();
  
  const [view, setView] = useState<'payment' | 'advanced' | 'cheque'>('payment');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cheques, setCheques] = useState<Omit<Cheque, 'id' | 'factureId' | 'clientId'>[]>([]);
  const [chequeTotalToPay, setChequeTotalToPay] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);
  
  const isCreditNote = currentSaleContext?.documentType === 'credit_note';
  const displayTotalAmount = Math.abs(totalAmount);

  const autoFinalizeTimer = useRef<NodeJS.Timeout | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [shouldReplaceValue, setShouldReplaceValue] = useState(true);

  const previousPayments = useMemo(() => currentSaleContext?.originalPayments || [], [currentSaleContext]);
  const previousChange = useMemo(() => currentSaleContext?.change || 0, [currentSaleContext]);
  
  const amountPaidFromPrevious = useMemo(() => {
    const totalPaid = previousPayments.reduce((acc, p) => acc + p.amount, 0);
    return totalPaid - previousChange;
  }, [previousPayments, previousChange]);

  const amountPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const chequesTotal = useMemo(() => cheques.reduce((acc, c) => acc + c.montant, 0), [cheques]);
  const totalAmountPaid = Math.abs(amountPaidFromPrevious) + amountPaid;
  const balanceDue = useMemo(() => displayTotalAmount - totalAmountPaid, [displayTotalAmount, totalAmountPaid]);

  const isOverpaid = useMemo(() => balanceDue < -0.009, [balanceDue]);
  
  const mainPaymentMethods = useMemo(() => 
    paymentMethods?.filter(m => m.isActive && MAIN_PAYMENT_NAMES.includes(m.name)) || [],
    [paymentMethods]
  );
  const checkPaymentMethod = useMemo(() => paymentMethods?.find(m => m.isActive && m.name === CHECK_PAYMENT_NAME), [paymentMethods]);
  const otherPaymentMethod = useMemo(() => 
    paymentMethods?.find(m => m.isActive && m.name === 'AUTRE'),
    [paymentMethods]
  );
  const advancedPaymentMethods = useMemo(() => 
    paymentMethods?.filter(m => m.isActive && !MAIN_PAYMENT_NAMES.includes(m.name) && m.name !== 'AUTRE' && m.name !== CHECK_PAYMENT_NAME) || [],
    [paymentMethods]
  );

  const selectAndFocusInput = () => {
    setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
    }, 100);
  }
  
 const handleFinalizeSale = useCallback(async (finalPayments: Payment[], isFullyPaid: boolean) => {
    if (isPaid) return;
    
    const docType = currentSaleContext?.documentType;
    
    const allPayments = [...previousPayments, ...finalPayments];
    const totalPaidForSale = allPayments.reduce((acc, p) => acc + p.amount, 0);
    const change = totalPaidForSale > displayTotalAmount ? totalPaidForSale - displayTotalAmount : 0;
  
    const saleInfo: Omit<Sale, 'id' | 'ticketNumber' | 'date'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: totalAmount,
      payments: allPayments.map(p => ({ ...p, date: p.date || paymentDate as any })),
      status: isFullyPaid ? 'paid' : 'pending',
      ...(change > 0.009 && { change: change }),
      ...(selectedCustomer?.id && { customerId: selectedCustomer.id }),
      ...(currentSaleContext?.supplierId && { supplierId: currentSaleContext.supplierId }),
      ...(currentSaleContext?.originalTotal && { originalTotal: currentSaleContext.originalTotal }),
      ...(currentSaleContext?.originalSaleId && { originalSaleId: currentSaleContext.originalSaleId }),
      ...(currentSaleContext?.tableId && {tableId: currentSaleContext.tableId}),
      ...(currentSaleContext?.tableName && {tableName: currentSaleContext.tableName}),
      documentType: docType || 'ticket',
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
    };
  
    const recordedSale = await recordSale(saleInfo, currentSaleId ?? undefined);

    if (recordedSale && cheques.length > 0) {
      for (const cheque of cheques) {
        await addCheque({
          ...cheque,
          factureId: recordedSale.id,
          clientId: selectedCustomer?.id || '',
        });
      }
    }
    
    if (isFullyPaid) {
        setIsPaid(true);
        setTimeout(() => {
          toast({
            title: isCreditNote ? 'Remboursement réussi' : 'Paiement réussi',
            description: `Pièce de ${displayTotalAmount.toFixed(2)}€ finalisée.`,
          });
          
          if(docType === 'invoice' || docType === 'credit_note' || docType === 'quote' || docType === 'delivery_note' || docType === 'supplier_order') {
            resetCommercialPage(docType);
          }
          else if (currentSaleContext?.isTableSale || (cameFromRestaurant && selectedCustomer?.id !== 'takeaway')) {
              if(cameFromRestaurant) setCameFromRestaurant(false);
              router.push('/restaurant');
          } else {
            clearOrder();
          }
      
          onClose();
        }, 500);
    } else {
        toast({
            title: 'Pièce mise en attente',
            description: `La pièce est en attente de paiement.`
        })
        clearOrder();
        onClose();
        if (docType === 'invoice' || docType === 'credit_note') {
          router.push('/reports?docType=' + (docType === 'credit_note' ? 'credit_note' : 'invoice'));
        }
    }
  }, [isPaid, order, orderTotal, orderTax, totalAmount, recordSale, toast, router, clearOrder, onClose, selectedCustomer, cameFromRestaurant, setCameFromRestaurant, currentSaleContext, user, previousPayments, currentSaleId, paymentDate, isCreditNote, displayTotalAmount, resetCommercialPage, cheques, addCheque, updateSale]);


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
            const newBalance = displayTotalAmount - Math.abs(amountPaidFromPrevious);
            setCurrentAmount(newBalance !== 0 ? Math.abs(newBalance).toFixed(2) : '');
        }
        setPaymentDate(new Date());
    } else {
        setTimeout(() => {
            setPayments([]);
            setCheques([]);
            setIsPaid(false);
            setCurrentAmount('');
            setSelectedCustomer(null);
            setView('payment');
            setShowCalculator(false);
            setPaymentDate(new Date());
        }, 300);
    }
  }, [isOpen, isPaid, displayTotalAmount, customers, currentSaleContext, amountPaidFromPrevious]);


  const handleReset = () => {
    setPayments([]);
    setCheques([]);
    setIsPaid(false);
    setCurrentAmount('');
    setSelectedCustomer(null);
    setView('payment');
    setShowCalculator(false);
    setPaymentDate(new Date());
    onClose();
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleReset();
    }
  };
  
  
  const handleAddPayment = (method: PaymentMethod) => {
    let amountToAdd : number;
    amountToAdd = parseFloat(String(currentAmount));
    
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;
    
    if (method.type === 'direct' && method.icon !== 'cash' && amountToAdd > Math.abs(balanceDue) + 0.009) {
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
  
    const newPayment: Payment = { method, amount: amountToAdd, date: paymentDate as any };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);
    
    const newTotalAmountPaid = totalAmountPaid + amountToAdd;
    const newBalance = displayTotalAmount - newTotalAmountPaid;
    
    if (Math.abs(newBalance) > 0.009) {
        setCurrentAmount(Math.abs(newBalance).toFixed(2));
        setShowCalculator(true);
    } else { 
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
        const newBalance = displayTotalAmount - (Math.abs(amountPaidFromPrevious) + newAmountPaid);
        setCurrentAmount(Math.abs(newBalance).toFixed(2));
        return newPayments;
    });
    setShowCalculator(true);
  }

  const handleAddCheque = () => {
    setCheques(prev => {
        const remainingAmount = chequeTotalToPay - prev.reduce((sum, c) => sum + c.montant, 0);
        const lastBank = prev.length > 0 ? prev[prev.length - 1].banque : '';
        const newCheque = {
            numeroCheque: '',
            banque: lastBank,
            montant: parseFloat(remainingAmount.toFixed(2)) > 0 ? parseFloat(remainingAmount.toFixed(2)) : 0,
            dateEcheance: new Date(),
            statut: 'enPortefeuille' as const,
        };
        return [...prev, newCheque];
    });
  };
  
  const handleRemoveCheque = (index: number) => {
      setCheques(prev => {
        const newCheques = prev.filter((_, i) => i !== index);
        const newTotal = newCheques.reduce((sum, c) => sum + c.montant, 0);
        
        if (newCheques.length > 0) {
            const remainingToDistribute = chequeTotalToPay - newTotal;
            // Distribute the remaining amount among other cheques, for simplicity, add to the last one.
            const lastChequeIndex = newCheques.length - 1;
            newCheques[lastChequeIndex].montant = parseFloat((newCheques[lastChequeIndex].montant + remainingToDistribute).toFixed(2));
        }
        
        return newCheques;
      });
  };
  
  const handleChequeChange = (index: number, field: keyof Omit<Cheque, 'id' | 'factureId' | 'clientId'>, value: any) => {
      setCheques(prev => {
        const newCheques = [...prev];
        const currentCheque = { ...newCheques[index] };
        
        if (field === 'montant') {
            const newAmount = parseFloat(value) || 0;
            const currentTotalForOthers = newCheques.reduce((sum, c, i) => i === index ? sum : sum + c.montant, 0);
            const maxAllowedForThisCheque = chequeTotalToPay - currentTotalForOthers;
            currentCheque[field] = parseFloat(Math.max(0, Math.min(newAmount, maxAllowedForThisCheque)).toFixed(2));
        } else {
            currentCheque[field] = value;
        }
        
        newCheques[index] = currentCheque;
        return newCheques;
      });
  };
  
  const handleConfirmCheques = () => {
    const totalOfCheques = cheques.reduce((sum, c) => sum + c.montant, 0);
    
    if (Math.abs(totalOfCheques - chequeTotalToPay) > 0.01) {
        toast({ variant: 'destructive', title: 'Montant incorrect', description: `Le total des chèques (${totalOfCheques.toFixed(2)}€) doit correspondre au montant du paiement par chèque (${chequeTotalToPay.toFixed(2)}€).` });
        return;
    }

    const newPayment: Payment = { method: checkPaymentMethod!, amount: chequeTotalToPay, date: paymentDate as any, chequesCount: cheques.length };
    const newPayments = [...payments, newPayment];
    
    setPayments(newPayments);
    setView('payment');
    
    const newTotalPaid = totalAmountPaid + chequeTotalToPay;
    const newBalance = displayTotalAmount - newTotalPaid;
    
    if (Math.abs(newBalance) < 0.01) {
      if (autoFinalizeTimer.current) clearTimeout(autoFinalizeTimer.current);
      autoFinalizeTimer.current = setTimeout(() => {
          handleFinalizeSale(newPayments, true);
      }, 1000);
    } else {
        setCurrentAmount(newBalance.toFixed(2));
    }
  };
    
    const handleOpenChequeView = () => {
        const amount = parseFloat(String(currentAmount));
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Montant invalide', description: 'Veuillez saisir un montant pour le paiement par chèque.' });
            return;
        }
        const roundedAmount = parseFloat(amount.toFixed(2));
        setChequeTotalToPay(roundedAmount);
        setView('cheque');

        if (cheques.length === 0) {
            setCheques([{
                numeroCheque: '',
                banque: '',
                montant: roundedAmount,
                dateEcheance: new Date(),
                statut: 'enPortefeuille',
            }]);
        } else {
            const currentTotal = cheques.reduce((sum, c) => sum + c.montant, 0);
            if (Math.abs(currentTotal - roundedAmount) > 0.01) {
                 cheques[cheques.length -1].montant = parseFloat((cheques[cheques.length -1].montant + (roundedAmount - currentTotal)).toFixed(2));
                 setCheques([...cheques]);
            }
        }
    };
  
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

  const isInvoiceMode = currentSaleContext?.documentType === 'invoice';
  const finalizeButtonDisabled = balanceDue > 0.009 && !isInvoiceMode && !isCreditNote;

    const handleAdvancedPaymentSelect = (method: PaymentMethod) => {
      if (method.type === 'indirect' && method.value) {
        let amountToAdd = method.value > Math.abs(balanceDue) ? Math.abs(balanceDue) : method.value;
        setCurrentAmount(amountToAdd.toFixed(2));
      }
      handleAddPayment(method);
      setView('payment');
    };
    
    const handleSaveAsPending = () => {
      handleFinalizeSale(payments, false); 
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
                                    <span className="font-semibold">{Math.abs(p.amount).toFixed(2)}€</span>
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
                  <span className="text-secondary-foreground">Total {isCreditNote ? 'Remboursé' : 'Payé'}</span>
                  <span className="text-secondary-foreground">{totalAmountPaid.toFixed(2)}€</span>
              </div>
              <div className={cn(
                  "flex justify-between font-bold text-lg mt-2",
                  balanceDue > 0.009 ? "text-primary" : "text-green-600"
              )}>
                  <span>{balanceDue > 0.009 ? (isCreditNote ? 'À rembourser' : 'Solde Restant') : (balanceDue < -0.009 ? 'Rendu' : 'Soldé')}</span>
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
        <DialogTitle className="text-2xl font-headline">{isCreditNote ? 'Remboursement' : 'Paiement'}</DialogTitle>
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-x-4 gap-y-2">
            {currentSaleContext?.tableName ? (
                <div className="text-sm text-muted-foreground">
                    <p>Table: <span className="font-semibold text-foreground">{currentSaleContext.tableName}</span></p>
                    <p className="flex items-center gap-2">
                        <span><Clock className="h-3 w-3"/> {format(new Date(), 'HH:mm')}</span>
                    </p>
                </div>
            ) : (
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total de la commande</p>
                    <p className="text-xl font-semibold text-foreground">{displayTotalAmount.toFixed(2)}€</p>
                </div>
            )}
            <div className="flex flex-col items-end">
                <Label className="text-xs text-muted-foreground text-right mb-1">Date du paiement</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-normal text-xs h-9",
                        !paymentDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentDate ? format(paymentDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                        mode="single"
                        selected={paymentDate}
                        onSelect={(date) => date && setPaymentDate(date)}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
        <div className="md:col-span-1 space-y-6 flex flex-col">
            <fieldset disabled={isInvoiceMode || isCreditNote} className={cn((isInvoiceMode || isCreditNote) && "opacity-70 pointer-events-none")}>
                <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
                  <h3 className="font-semibold text-secondary-foreground">Client</h3>
                    <div className="flex gap-2">
                        <CustomerSelectionDialog isOpen={isCustomerSearchOpen} onClose={() => setCustomerSearchOpen(false)} onCustomerSelected={onCustomerSelected} />
                        <Button variant="outline" className="w-full justify-between" onClick={() => setCustomerSearchOpen(true)}>
                            {selectedCustomer ? selectedCustomer.name : 'Choisir un client...'}
                            <UserIcon className="h-4 w-4 ml-2" />
                        </Button>
                        <Button size="icon" onClick={() => setAddCustomerOpen(true)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </fieldset>
            
            <div className="space-y-2 flex-1">
                 <Label htmlFor="amount-to-pay" className="text-sm text-muted-foreground">{balanceDue !== 0 ? (isCreditNote ? 'Montant à rembourser' : 'Montant à payer') : 'Montant'}</Label>
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

            <fieldset disabled={isOverpaid && !isCreditNote} className="space-y-2">
                 <div className="flex gap-2">
                    {mainPaymentMethods.map((method) => {
                        const IconComponent = getIcon(method.icon);
                        const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0) && !isCreditNote) || 
                                            (!currentAmount && !method.value) || 
                                            (parseFloat(String(currentAmount)) <= 0 && !method.value);

                        return (
                          <Button
                              key={method.id}
                              variant="outline"
                              className="h-24 flex-grow flex flex-col items-center justify-center gap-2 relative"
                              onClick={() => handleAddPayment(method)}
                              disabled={isDisabled || (isOverpaid && !isCreditNote)}
                          >
                              {method.image && <Image src={method.image} alt={method.name} fill className="object-cover rounded-md" style={{ opacity: paymentMethodImageOpacity / 100 }} />}
                              <IconComponent className="h-6 w-6 z-10" />
                              <span className="text-sm whitespace-normal text-center leading-tight z-10">{method.name}</span>
                          </Button>
                        );
                    })}
                     {checkPaymentMethod && (
                      <Button
                        variant="outline"
                        className="h-24 flex-grow flex flex-col items-center justify-center gap-2 relative"
                        onClick={handleOpenChequeView}
                        disabled={(balanceDue <= 0 && !isCreditNote) || (isOverpaid && !isCreditNote) || !currentAmount || parseFloat(String(currentAmount)) <= 0}
                      >
                         <StickyNote className="h-6 w-6 z-10" />
                         <span className="text-sm whitespace-normal text-center leading-tight z-10">Chèque</span>
                      </Button>
                    )}
                </div>
                {otherPaymentMethod && (() => {
                    const isDisabled = (balanceDue <= 0 && otherPaymentMethod.type === 'direct' && !(parseFloat(String(currentAmount)) > 0) && !isCreditNote) || 
                                        (!currentAmount && !otherPaymentMethod.value) || 
                                        (parseFloat(String(currentAmount)) <= 0 && !otherPaymentMethod.value);
                    return (
                      <div className="flex items-center gap-2 border rounded-md p-2 bg-secondary/30 mt-2">
                        <Button
                            key={otherPaymentMethod.id}
                            variant="outline"
                            className="h-12 flex-1 flex items-center justify-center gap-2"
                            onClick={() => handleAddPayment(otherPaymentMethod)}
                            disabled={isDisabled || (isOverpaid && !isCreditNote)}
                        >
                            <Landmark className="h-5 w-5" />
                            <span className="text-sm">{otherPaymentMethod.name}</span>
                        </Button>
                         <Button
                            variant="secondary"
                            className="h-12"
                            onClick={() => setView('advanced')}
                            disabled={advancedPaymentMethods.length === 0 || (isOverpaid && !isCreditNote)}
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
         <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-full sm:w-auto"
          >
           Annuler
          </Button>
         
         {(isInvoiceMode || isCreditNote || currentSaleContext?.status === 'pending') && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveAsPending}
              className="w-full sm:w-auto"
            >
              {isCreditNote ? 'Enregistrer sans paiement' : 'Enregistrer en attente'}
            </Button>
         )}

        {(balanceDue < 0.009 || isInvoiceMode || isCreditNote) && (
          <Button onClick={() => handleFinalizeSale(payments, balanceDue < 0.009)} disabled={finalizeButtonDisabled} className="w-full sm:w-auto">
              {isCreditNote ? 'Confirmer le remboursement' : 'Finaliser'}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderAdvancedView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline">{isCreditNote ? 'Méthodes de remboursement avancées' : 'Paiements avancés'}</DialogTitle>
      </DialogHeader>
      <div className="py-4 h-[60vh]">
        <ScrollArea className="h-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-4">
                {advancedPaymentMethods?.map(method => {
                    const IconComponent = getIcon(method.icon);
                    const isDisabled = (balanceDue <= 0 && method.type === 'direct' && !(parseFloat(String(currentAmount)) > 0) && !isCreditNote);
                    return (
                        <Button
                            key={method.id}
                            variant="outline"
                            className="h-24 flex-col gap-2 relative"
                            onClick={() => handleAdvancedPaymentSelect(method)}
                            disabled={isDisabled || (isOverpaid && !isCreditNote)}
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

  const renderChequeView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline">Paiement par Chèque(s)</DialogTitle>
        <DialogDescription>Saisissez les informations pour chaque chèque. Le total doit correspondre au montant du paiement par chèque.</DialogDescription>
      </DialogHeader>
      <div className="py-4 h-[60vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">Montant du paiement : <span className="font-bold text-primary">{chequeTotalToPay.toFixed(2)}€</span></div>
          <div className="text-lg">Total Chèques : <span className={cn("font-bold", Math.abs(cheques.reduce((sum, c) => sum + c.montant, 0) - chequeTotalToPay) > 0.01 ? 'text-destructive' : 'text-green-600')}>{cheques.reduce((sum, c) => sum + c.montant, 0).toFixed(2)}€</span></div>
        </div>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {cheques.map((cheque, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Chèque #{index + 1}</h4>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveCheque(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1"><Label>Montant (€)</Label><Input type="number" value={cheque.montant} onChange={e => handleChequeChange(index, 'montant', e.target.value)} /></div>
                    <div className="space-y-1">
                        <Label>Banque</Label>
                        <Select onValueChange={(value) => handleChequeChange(index, 'banque', value)} value={cheque.banque}>
                          <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                          <SelectContent><ScrollArea className="h-60">{bankList.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}</ScrollArea></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1"><Label>Numéro</Label><Input value={cheque.numeroCheque} onChange={e => handleChequeChange(index, 'numeroCheque', e.target.value)} /></div>
                    <div className="space-y-1">
                        <Label>Date d'échéance</Label>
                        <Popover>
                          <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(cheque.dateEcheance as Date, "PPP", { locale: fr })}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={cheque.dateEcheance as Date} onSelect={date => date && handleChequeChange(index, 'dateEcheance', date)} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <Button variant="outline" onClick={handleAddCheque} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un autre chèque
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setView('payment')}>Retour</Button>
        <Button onClick={handleConfirmCheques}>Confirmer les chèques</Button>
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
                    case 'payment': return renderPaymentView();
                    case 'advanced': return renderAdvancedView();
                    case 'cheque': return renderChequeView();
                    default: return renderPaymentView();
                }
            })()
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">{isCreditNote ? 'Remboursement Confirmé' : 'Paiement Confirmé'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
              <h2 className="text-2xl font-semibold">{isCreditNote ? 'Remboursement confirmé' : 'Paiement confirmé'}</h2>
              <p className="text-muted-foreground">{isCreditNote ? 'Remboursement effectué avec succès.' : 'Merci pour votre achat !'}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} onCustomerAdded={onCustomerSelected} />
    <AlertDialog open={showOverpaymentAlert} onOpenChange={setShowOverpaymentAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitleComponent>Paiement impossible</AlertDialogTitleComponent>
                <AlertDialogDescriptionComponent>
                    Le montant saisi est supérieur au solde restant. Les paiements par carte ou chèque ne peuvent pas excéder le montant dû.
                </AlertDialogDescriptionComponent>
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
