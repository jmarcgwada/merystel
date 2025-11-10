
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePos } from '@/contexts/pos-context';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Delete, Copy, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KeypadButton = ({ children, onClick, className, 'data-key': dataKey }: { children: React.ReactNode, onClick: () => void, className?: string, 'data-key'?: string }) => (
    <Button variant="outline" className={cn("text-xl h-14", className)} onClick={onClick} data-key={dataKey}>
        {children}
    </Button>
);

const StandardCalculator = () => {
    const [displayValue, setDisplayValue] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null);

    const handleDigitClick = useCallback((digit: string) => {
        if (waitingForSecondOperand) {
            setDisplayValue(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
        }
    }, [displayValue, waitingForSecondOperand]);

    const handleDecimalClick = useCallback(() => {
        if (!displayValue.includes('.')) {
            setDisplayValue(displayValue + '.');
        }
    }, [displayValue]);

    const calculate = useCallback((first: number, second: number, op: string): number => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': return second === 0 ? NaN : first / second; // Avoid division by zero
            default: return second;
        }
    }, []);

    const handleOperatorClick = useCallback((nextOperator: string) => {
        const inputValue = parseFloat(displayValue);

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            setDisplayValue(String(result));
            setFirstOperand(result);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    }, [displayValue, firstOperand, operator, calculate]);
    
    const handleEqualsClick = useCallback(() => {
        if (operator && firstOperand !== null) {
            const result = calculate(firstOperand, parseFloat(displayValue), operator);
            if(isNaN(result)) {
                setDisplayValue('Erreur');
            } else {
                setDisplayValue(String(result));
            }
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(false);
        }
    }, [operator, firstOperand, displayValue, calculate]);

    const handleClearClick = useCallback(() => {
        setDisplayValue('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    }, []);
    
    const handleBackspaceClick = useCallback(() => {
        setDisplayValue(displayValue.length > 1 ? displayValue.slice(0, -1) : '0');
    }, [displayValue]);

    const triggerVisualFeedback = useCallback((key: string) => {
        setActiveKey(key);
        setTimeout(() => setActiveKey(null), 150);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const { key } = event;
            triggerVisualFeedback(key);

            if (key >= '0' && key <= '9') {
                handleDigitClick(key);
            } else if (key === '.' || key === ',') {
                handleDecimalClick();
            } else if (key === '+' || key === '-' || key === '*' || key === '/') {
                handleOperatorClick(key);
            } else if (key === 'Enter' || key === '=') {
                event.preventDefault();
                handleEqualsClick();
            } else if (key === 'Backspace') {
                handleBackspaceClick();
            } else if (key === 'Escape' || key.toLowerCase() === 'c' || key === 'Delete') {
                handleClearClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleDigitClick, handleDecimalClick, handleOperatorClick, handleEqualsClick, handleBackspaceClick, handleClearClick, triggerVisualFeedback]);


     return (
        <div className="space-y-2">
            <Input
                type="text"
                value={displayValue}
                readOnly
                className="h-16 text-3xl text-right font-mono pr-4 bg-muted"
            />
            <div className="grid grid-cols-4 gap-2">
                <KeypadButton onClick={handleClearClick} className={cn("col-span-2 bg-destructive/20 text-destructive", (activeKey === 'Escape' || activeKey?.toLowerCase() === 'c' || activeKey === 'Delete') && 'bg-destructive text-destructive-foreground')} data-key="c">C</KeypadButton>
                <KeypadButton onClick={handleBackspaceClick} className={cn(activeKey === 'Backspace' && 'bg-primary text-primary-foreground')} data-key="Backspace"><Delete /></KeypadButton>
                <KeypadButton onClick={() => handleOperatorClick('/')} className={cn(activeKey === '/' && 'bg-primary text-primary-foreground')} data-key="/">÷</KeypadButton>

                <KeypadButton onClick={() => handleDigitClick('7')} className={cn(activeKey === '7' && 'bg-primary text-primary-foreground')} data-key="7">7</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('8')} className={cn(activeKey === '8' && 'bg-primary text-primary-foreground')} data-key="8">8</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('9')} className={cn(activeKey === '9' && 'bg-primary text-primary-foreground')} data-key="9">9</KeypadButton>
                <KeypadButton onClick={() => handleOperatorClick('*')} className={cn(activeKey === '*' && 'bg-primary text-primary-foreground')} data-key="*">×</KeypadButton>
                
                <KeypadButton onClick={() => handleDigitClick('4')} className={cn(activeKey === '4' && 'bg-primary text-primary-foreground')} data-key="4">4</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('5')} className={cn(activeKey === '5' && 'bg-primary text-primary-foreground')} data-key="5">5</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('6')} className={cn(activeKey === '6' && 'bg-primary text-primary-foreground')} data-key="6">6</KeypadButton>
                <KeypadButton onClick={() => handleOperatorClick('-')} className={cn(activeKey === '-' && 'bg-primary text-primary-foreground')} data-key="-">-</KeypadButton>

                <KeypadButton onClick={() => handleDigitClick('1')} className={cn(activeKey === '1' && 'bg-primary text-primary-foreground')} data-key="1">1</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('2')} className={cn(activeKey === '2' && 'bg-primary text-primary-foreground')} data-key="2">2</KeypadButton>
                <KeypadButton onClick={() => handleDigitClick('3')} className={cn(activeKey === '3' && 'bg-primary text-primary-foreground')} data-key="3">3</KeypadButton>
                <KeypadButton onClick={() => handleOperatorClick('+')} className={cn(activeKey === '+' && 'bg-primary text-primary-foreground')} data-key="+">+</KeypadButton>
                
                <KeypadButton onClick={() => handleDigitClick('0')} className={cn("col-span-2", activeKey === '0' && 'bg-primary text-primary-foreground')} data-key="0">0</KeypadButton>
                <KeypadButton onClick={handleDecimalClick} className={cn((activeKey === '.' || activeKey === ',') && 'bg-primary text-primary-foreground')} data-key=".">.</KeypadButton>
                <KeypadButton onClick={handleEqualsClick} className={cn("bg-primary/20 text-primary", (activeKey === 'Enter' || activeKey === '=') && 'bg-primary text-primary-foreground')} data-key="Enter">=</KeypadButton>
            </div>
        </div>
    );
};

const PricingCalculator = () => {
    const { toast } = useToast();
    const { vatRates } = usePos();
    const [purchasePrice, setPurchasePrice] = useState('');
    const [approachCosts, setApproachCosts] = useState('');
    const [margin, setMargin] = useState('');
    const [vat, setVat] = useState('20');
    const [sellingPrice, setSellingPrice] = useState('');
    const [lastChanged, setLastChanged] = useState<'margin' | 'price'>('margin');

    const purchasePriceNum = parseFloat(purchasePrice) || 0;
    const approachCostsNum = parseFloat(approachCosts) || 0;
    const marginNum = parseFloat(margin) || 0;
    const vatNum = parseFloat(vat) || 0;
    const sellingPriceNum = parseFloat(sellingPrice) || 0;

    const costPrice = useMemo(() => purchasePriceNum * (1 + approachCostsNum / 100), [purchasePriceNum, approachCostsNum]);
    
    useEffect(() => {
        if (lastChanged === 'margin' && purchasePriceNum > 0) {
            const sellingPriceHT = costPrice * (1 + marginNum / 100);
            const sellingPriceTTC = sellingPriceHT * (1 + vatNum / 100);
            setSellingPrice(sellingPriceTTC.toFixed(2));
        }
    }, [purchasePriceNum, approachCostsNum, marginNum, vatNum, lastChanged, costPrice]);
    
    useEffect(() => {
        if (lastChanged === 'price' && purchasePriceNum > 0 && costPrice > 0) {
            const sellingPriceHT = sellingPriceNum / (1 + vatNum / 100);
            if (sellingPriceHT >= costPrice) {
                const newMargin = ((sellingPriceHT / costPrice) - 1) * 100;
                setMargin(newMargin.toFixed(2));
            } else {
                 setMargin('0');
            }
        }
    }, [sellingPriceNum, purchasePriceNum, approachCostsNum, vatNum, lastChanged, costPrice]);

    const sellingPriceHT = useMemo(() => sellingPriceNum / (1 + vatNum / 100), [sellingPriceNum, vatNum]);

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        toast({ title: 'Copié !', description: `${value} a été copié dans le presse-papiers.` });
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="purchase-price">Prix d'achat HT (€)</Label><Input id="purchase-price" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} onFocus={() => setLastChanged('margin')} placeholder="100"/></div>
                <div><Label htmlFor="approach-costs">Frais d'approche (%)</Label><Input id="approach-costs" type="number" value={approachCosts} onChange={(e) => setApproachCosts(e.target.value)} onFocus={() => setLastChanged('margin')} placeholder="5"/></div>
            </div>
            <div><Label>Coût de revient HT (€)</Label><Input value={costPrice.toFixed(2)} readOnly className="bg-muted font-bold" /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="margin">Marge souhaitée (%)</Label><Input id="margin" type="number" value={margin} onChange={(e) => { setMargin(e.target.value); setLastChanged('margin'); }} placeholder="30"/></div>
                <div>
                  <Label htmlFor="vat">TVA (%)</Label>
                  <Select value={vat} onValueChange={setVat}>
                      <SelectTrigger id="vat">
                          <SelectValue placeholder="Sélectionnez un taux" />
                      </SelectTrigger>
                      <SelectContent>
                          {vatRates.map(rate => (
                              <SelectItem key={rate.id} value={String(rate.rate)}>
                                  {rate.name} ({rate.rate}%)
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
                <div><Label>Prix de vente HT (€)</Label><div className="flex items-center gap-2"><Input value={sellingPriceHT.toFixed(2)} readOnly className="bg-muted" /><Button variant="ghost" size="icon" onClick={() => handleCopy(sellingPriceHT.toFixed(2))}><Copy className="h-4 w-4"/></Button></div></div>
                <div><Label>Prix de vente TTC (€)</Label><div className="flex items-center gap-2"><Input id="selling-price" type="number" value={sellingPrice} onChange={(e) => { setSellingPrice(e.target.value); setLastChanged('price'); }} className="font-bold text-lg h-12" placeholder="162.00"/><Button variant="ghost" size="icon" onClick={() => handleCopy(sellingPrice)}><Copy className="h-4 w-4"/></Button></div></div>
            </div>
        </div>
    );
};

const DiscountCalculator = () => {
    const [initialPrice, setInitialPrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [finalPrice, setFinalPrice] = useState('');
    const [lastChanged, setLastChanged] = useState<'percent' | 'amount' | 'final'>('percent');

    const initialPriceNum = parseFloat(initialPrice) || 0;
    const discountPercentNum = parseFloat(discountPercent) || 0;
    const discountAmountNum = parseFloat(discountAmount) || 0;
    const finalPriceNum = parseFloat(finalPrice) || 0;

    useEffect(() => {
        if (!initialPriceNum) return;
        if (lastChanged === 'percent') {
            const reduction = initialPriceNum * (discountPercentNum / 100);
            setDiscountAmount(reduction.toFixed(2));
            setFinalPrice((initialPriceNum - reduction).toFixed(2));
        } else if (lastChanged === 'amount') {
            const newFinalPrice = initialPriceNum - discountAmountNum;
            setFinalPrice(newFinalPrice.toFixed(2));
            const newPercent = initialPriceNum > 0 ? (discountAmountNum / initialPriceNum) * 100 : 0;
            setDiscountPercent(newPercent.toFixed(2));
        } else if (lastChanged === 'final') {
            const reduction = initialPriceNum - finalPriceNum;
            setDiscountAmount(reduction.toFixed(2));
            const newPercent = initialPriceNum > 0 ? (reduction / initialPriceNum) * 100 : 0;
            setDiscountPercent(newPercent.toFixed(2));
        }
    }, [initialPriceNum, discountPercentNum, discountAmountNum, finalPriceNum, lastChanged]);


    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="initial-price">Prix initial (€)</Label>
                <Input id="initial-price" type="number" value={initialPrice} onChange={(e) => setInitialPrice(e.target.value)} placeholder="150.00" autoFocus/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="discount-percent">Remise (%)</Label>
                    <Input id="discount-percent" type="number" value={discountPercent} onFocus={() => setLastChanged('percent')} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="15"/>
                </div>
                <div>
                    <Label htmlFor="discount-amount">Remise (€)</Label>
                    <Input id="discount-amount" type="number" value={discountAmount} onFocus={() => setLastChanged('amount')} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="22.50"/>
                </div>
            </div>
             <div className="border-t pt-4 space-y-4">
                <div>
                    <Label>Prix Final (€)</Label>
                    <Input id="final-price" type="number" value={finalPrice} onFocus={() => setLastChanged('final')} onChange={(e) => setFinalPrice(e.target.value)} className="font-bold text-lg h-12" />
                </div>
            </div>
        </div>
    );
};

const VatCalculator = () => {
    const { vatRates } = usePos();
    const [htPrice, setHtPrice] = useState('');
    const [ttcPrice, setTtcPrice] = useState('');
    const [vatRate, setVatRate] = useState('20');
    const [lastChanged, setLastChanged] = useState<'ht' | 'ttc'>('ttc');

    const htPriceNum = parseFloat(htPrice) || 0;
    const ttcPriceNum = parseFloat(ttcPrice) || 0;
    const vatRateNum = parseFloat(vatRate) || 0;

    useEffect(() => {
        if (lastChanged === 'ttc') {
            const newHt = ttcPriceNum / (1 + vatRateNum / 100);
            setHtPrice(newHt > 0 ? newHt.toFixed(2) : '');
        }
    }, [ttcPriceNum, vatRateNum, lastChanged]);

    useEffect(() => {
        if (lastChanged === 'ht') {
            const newTtc = htPriceNum * (1 + vatRateNum / 100);
            setTtcPrice(newTtc > 0 ? newTtc.toFixed(2) : '');
        }
    }, [htPriceNum, vatRateNum, lastChanged]);

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="ttc-price">Prix TTC (€)</Label>
                <Input id="ttc-price" type="number" value={ttcPrice} onChange={(e) => setTtcPrice(e.target.value)} onFocus={() => setLastChanged('ttc')} placeholder="120.00" autoFocus />
            </div>
            <div>
                <Label htmlFor="vat-rate-calc">Taux de TVA (%)</Label>
                <Select value={vatRate} onValueChange={setVatRate}>
                    <SelectTrigger id="vat-rate-calc">
                        <SelectValue placeholder="Sélectionnez un taux" />
                    </SelectTrigger>
                    <SelectContent>
                        {vatRates.map(rate => (
                            <SelectItem key={rate.id} value={String(rate.rate)}>
                                {rate.name} ({rate.rate}%)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="border-t pt-4 space-y-4">
                <div>
                    <Label>Prix HT (€)</Label>
                    <Input id="ht-price" type="number" value={htPrice} onChange={(e) => setHtPrice(e.target.value)} onFocus={() => setLastChanged('ht')} className="font-bold text-lg h-12" />
                </div>
            </div>
        </div>
    );
};

export function CalculatorModal() {
    const { isCalculatorOpen, setIsCalculatorOpen } = usePos();
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
      if (isCalculatorOpen && !isInitialized && isClient) {
        setPosition({ 
            x: window.innerWidth / 2 - 208, // 208 is half of sm:max-w-sm (32rem/2 * 16px) 
            y: window.innerHeight / 2 - 350 // rough estimate
        });
        setIsInitialized(true);
      }
    }, [isCalculatorOpen, isInitialized, isClient]);

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);
    
    const dynamicStyle = isInitialized ? {
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: 'none',
    } : {};

    return (
        <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
            <DialogOverlay />
            <div ref={modalRef} style={dynamicStyle} className="fixed z-50">
                <DialogContent
                    className="sm:max-w-sm p-0 flex flex-col shadow-2xl relative"
                    hideCloseButton
                    onInteractOutside={(e) => {
                        if (e.target instanceof HTMLElement && e.target.closest('[data-drag-handle]')) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader 
                        data-drag-handle
                        onMouseDown={handleDragStart}
                        className={cn(
                            "p-4 pb-2 text-center bg-muted/50 rounded-t-lg relative",
                            isDragging ? "cursor-grabbing" : "cursor-grab"
                        )}
                    >
                        <DialogTitle className="text-base">Calculatrice Commerciale</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => setIsCalculatorOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                     <div className="px-4 pb-4">
                        <Tabs defaultValue="standard">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="standard">Standard</TabsTrigger>
                                <TabsTrigger value="pricing">Prix/Marge</TabsTrigger>
                                <TabsTrigger value="discount">Remise</TabsTrigger>
                                <TabsTrigger value="vat">TVA</TabsTrigger>
                            </TabsList>
                            <TabsContent value="standard" className="pt-4"><StandardCalculator /></TabsContent>
                            <TabsContent value="pricing" className="pt-4"><PricingCalculator /></TabsContent>
                            <TabsContent value="discount" className="pt-4"><DiscountCalculator /></TabsContent>
                            <TabsContent value="vat" className="pt-4"><VatCalculator /></TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    );
}
