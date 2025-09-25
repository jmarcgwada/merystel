

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePos } from '@/contexts/pos-context';
import { X, Hand, Eraser, Badge, Delete, Check, Plus, Minus, Save, Ticket } from 'lucide-react';
import { CheckoutModal } from './checkout-modal';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/lib/types';
import { Input } from '@/components/ui/input';

const KeypadButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button variant="outline" className={cn("text-xl h-12", className)} onClick={onClick}>
        {children}
    </Button>
)

export function OrderSummary() {
  const { 
    order, 
    setOrder,
    removeFromOrder, 
    clearOrder, 
    orderTotal, 
    orderTax,
    selectedTable, 
    holdOrder, 
    setSelectedTable,
    applyDiscount,
    updateQuantityFromKeypad,
    setIsKeypadOpen,
    saveTableOrderAndExit,
    promoteTableToTicket,
    showTicketImages,
    isKeypadOpen,
    currentSaleContext
  } = usePos();
  
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [mode, setMode] = useState<'quantity' | 'discountPercent' | 'discountFixed'>('quantity');
  const keypadInputRef = useRef<HTMLInputElement>(null);
  const [shouldReplaceValue, setShouldReplaceValue] = useState(true);

  const itemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    setIsKeypadOpen(!!selectedItem);
  }, [selectedItem, setIsKeypadOpen]);

  useEffect(() => {
    if (selectedItem) {
        if (keypadInputRef.current) {
            keypadInputRef.current.focus();
            keypadInputRef.current.select();
        }
        setShouldReplaceValue(true);
    }
  }, [selectedItem, mode]);

  const handleItemSelect = (item: OrderItem) => {
    if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setKeypadValue('');
    } else {
        setSelectedItem(item);
        setMode('quantity');
        setKeypadValue(item.quantity.toString());

        const itemIndex = order.findIndex(o => o.id === item.id);
        if (itemIndex > 0) { // Only move if not already at top
            const newOrder = [...order];
            const [movedItem] = newOrder.splice(itemIndex, 1);
            setOrder([movedItem, ...newOrder]);
        }
    }
  }

  const handleModeChange = (newMode: 'quantity' | 'discountPercent' | 'discountFixed') => {
    setMode(newMode);
    if (newMode === 'quantity' && selectedItem) {
        setKeypadValue(selectedItem.quantity.toString());
    } else {
        setKeypadValue('');
    }
    setShouldReplaceValue(true);
  }

  const handleKeypadInput = (value: string) => {
    if (document.activeElement === keypadInputRef.current) {
        setShouldReplaceValue(false);
    }
    
    if (value === 'del') {
      setKeypadValue(prev => prev.slice(0, -1));
    } else if (value === 'C') {
        setKeypadValue('');
    } else {
      if (shouldReplaceValue) {
        setKeypadValue(value);
        setShouldReplaceValue(false);
      } else {
        setKeypadValue(prev => prev + value);
      }
    }
  }
  
  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeypadValue(e.target.value);
    if (shouldReplaceValue) {
      setShouldReplaceValue(false);
    }
  };


  const handleApply = () => {
    if (!selectedItem) return;
    const value = parseFloat(keypadValue);
    if(isNaN(value)) return;
    
    if (mode === 'quantity') {
        updateQuantityFromKeypad(selectedItem.id, value);
    } else if (mode === 'discountPercent') {
        applyDiscount(selectedItem.id, value, 'percentage');
    } else if (mode === 'discountFixed') {
        applyDiscount(selectedItem.id, value, 'fixed');
    }
    setSelectedItem(null);
    setKeypadValue('');
  }

  const handleIncrementDecrement = (amount: number) => {
    const currentValue = parseFloat(keypadValue) || 0;
    let newValue = currentValue + amount;
    if (mode === 'quantity' && newValue < 1) {
        newValue = 1;
    }
    setKeypadValue(newValue.toString());
    if (shouldReplaceValue) {
      setShouldReplaceValue(false);
    }
  }
  
  const handleCloseKeypad = () => {
    setSelectedItem(null);
    setKeypadValue('');
  }

  const handleClearOrder = () => {
    if(selectedTable) {
        clearOrder();
        setSelectedTable(null);
        router.push('/restaurant');
    } else {
        clearOrder();
    }
  }

  const handleSaveTable = () => {
    if (selectedTable) {
      saveTableOrderAndExit(selectedTable.id, order);
      router.push('/restaurant');
    }
  }

  const handlePromoteToTicket = () => {
    if (selectedTable) {
      promoteTableToTicket(selectedTable.id);
    }
  }
  
  const getTitle = () => {
    if (selectedTable) {
      return `Commande: ${selectedTable.name}`;
    }
    if (currentSaleContext?.tableName) {
      return `Ticket: ${currentSaleContext.tableName}`;
    }
    return 'Commande actuelle';
  }


  const keypadStyle = () => {
    if (!isKeypadOpen || !selectedItem || !itemRefs.current[selectedItem.id]) return {};
    const itemElement = itemRefs.current[selectedItem.id];
    if (itemElement) {
        const top = itemElement.offsetTop + itemElement.offsetHeight;
        return {
            top: `${top}px`
        }
    }
    return { top: '88px' }; // Fallback
  }

  return (
    <>
      <div className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold tracking-tight font-headline">
             {getTitle()}
          </h2>
          {order.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearOrder} className="text-destructive hover:text-destructive">
              {selectedTable ? 'Annuler' : 'Tout effacer'}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {order.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Aucun article dans la commande.</p>
            </div>
          ) : (
            <div className="divide-y">
                {order.map((item) => (
                  <div key={item.id} ref={el => itemRefs.current[item.id] = el}>
                      <div 
                          className={cn(
                            "flex items-center gap-4 cursor-pointer", 
                            selectedItem?.id === item.id && 'bg-secondary',
                            showTicketImages ? 'p-4' : 'p-2'
                          )}
                          onClick={() => handleItemSelect(item)}
                      >
                          {showTicketImages && (
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                                <Image
                                src={item.image || 'https://picsum.photos/seed/item/100/100'}
                                alt={item.name}
                                fill
                                className="object-cover"
                                data-ai-hint="product image"
                                />
                            </div>
                          )}
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="font-semibold pr-2">{item.name}</p>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Qté: {item.quantity}</span>
                              </div>
                              {item.discount > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-destructive font-semibold">
                                      (-{item.discount.toFixed(2)}€ {item.discountPercent ? `(${item.discountPercent}%)` : ''})
                                  </span>
                                </div>
                              )}
                          </div>
                          <div className="text-right">
                              <p className="font-bold">{item.total.toFixed(2)}€</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => {e.stopPropagation(); removeFromOrder(item.id)}}>
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                ))}
              </div>
          )}
          
           {isKeypadOpen && selectedItem && (
            <div style={keypadStyle()} className="absolute z-10 left-0 right-0 p-4 bg-secondary/95 backdrop-blur-sm border-t border-b shadow-lg">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button variant={mode === 'quantity' ? 'default' : 'outline'} onClick={() => handleModeChange('quantity')}>Qté</Button>
                    <Button variant={mode === 'discountPercent' ? 'default' : 'outline'} onClick={() => handleModeChange('discountPercent')}>Remise %</Button>
                    <Button variant={mode === 'discountFixed' ? 'default' : 'outline'} onClick={() => handleModeChange('discountFixed')}>Remise €</Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <Input 
                        ref={keypadInputRef}
                        type="text"
                        value={keypadValue}
                        onChange={handleDirectInputChange}
                        onFocus={(e) => e.target.select()}
                        className="col-span-4 h-12 text-right px-4 text-3xl font-mono bg-background/50"
                    />

                    <KeypadButton onClick={() => handleKeypadInput('7')}>7</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('8')}>8</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('9')}>9</KeypadButton>
                     <Button variant="destructive" className="h-12" onClick={() => {
                        if (selectedItem) {
                            applyDiscount(selectedItem.id, 0, 'fixed');
                        }
                        setKeypadValue('');
                    }}>
                        <Eraser/>
                    </Button>
                    
                    <KeypadButton onClick={() => handleKeypadInput('4')}>4</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('5')}>5</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('6')}>6</KeypadButton>
                    <KeypadButton onClick={() => handleIncrementDecrement(1)}><Plus /></KeypadButton>

                    <KeypadButton onClick={() => handleKeypadInput('1')}>1</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('2')}>2</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('3')}>3</KeypadButton>
                    <KeypadButton onClick={() => handleIncrementDecrement(-1)}><Minus /></KeypadButton>
                    
                    <KeypadButton onClick={() => handleKeypadInput('C')} className="h-auto"><small>C</small></KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('0')} className="">0</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('.')} >.</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('del')}><Delete /></KeypadButton>
                    
                    
                    <Button className="h-12 text-lg col-span-3" onClick={handleApply}>
                       <Check className="mr-2" /> Valider
                    </Button>
                     <Button variant="ghost" className="h-12" onClick={handleCloseKeypad}>
                        <X />
                    </Button>
                </div>
            </div>
          )}
        </ScrollArea>

        <div className="mt-auto border-t p-4">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{orderTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                <span>TVA</span>
                <span>{orderTax.toFixed(2)}€</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                <span>Total (TTC)</span>
                <span>{(orderTotal + orderTax).toFixed(2)}€</span>
                </div>
            </div>
            <div className="mt-4 flex gap-2">
              {selectedTable ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={handlePromoteToTicket}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Transformer en ticket
                  </Button>
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSaveTable}
                    disabled={order.length === 0 || isKeypadOpen}
                  >
                     <Save className="mr-2 h-4 w-4" />
                    Sauvegarder la table
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={holdOrder}
                  >
                    <Hand className="mr-2 h-4 w-4" />
                    Mettre en attente
                  </Button>
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={() => setCheckoutOpen(true)}
                  >
                    Payer maintenant
                  </Button>
                </>
              )}
            </div>
        </div>
      </div>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalAmount={orderTotal + orderTax}
      />
    </>
  );
}





