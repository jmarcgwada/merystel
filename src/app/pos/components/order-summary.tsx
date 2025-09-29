

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePos } from '@/contexts/pos-context';
import { X, Hand, Eraser, Delete, Check, Plus, Minus, ShoppingCart, Utensils, CreditCard, Save, ArrowLeft, ScanLine, Keyboard as KeyboardIcon } from 'lucide-react';
import { CheckoutModal } from './checkout-modal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useKeyboard } from '@/contexts/keyboard-context';

const KeypadButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button variant="outline" className={cn("text-xl h-12", className)} onClick={onClick}>
        {children}
    </Button>
)

// Function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return hex; // Fallback to original color if format is wrong
};

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
    updateItemNote,
    setIsKeypadOpen,
    saveTableOrderAndExit,
    promoteTableToTicket,
    showTicketImages,
    descriptionDisplay,
    isKeypadOpen,
    currentSaleContext,
    recentlyAddedItemId,
    setRecentlyAddedItemId,
    directSaleBackgroundColor,
    restaurantModeBackgroundColor,
    directSaleBgOpacity,
    restaurantModeBgOpacity,
    enableSerialNumber,
    setSerialNumberItem
  } = usePos();
  
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [mode, setMode] = useState<'quantity' | 'discountPercent' | 'discountFixed' | 'note'>('quantity');
  const keypadInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldReplaceValue, setShouldReplaceValue] = useState(true);

  const { showKeyboard, setTargetInput, inputValue, targetInput } = useKeyboard();
  const itemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (targetInput?.name === `item-note-${selectedItem?.id}` && selectedItem) {
        updateItemNote(selectedItem.id, inputValue);
        setKeypadValue(inputValue);
    }
  }, [inputValue, targetInput, selectedItem, updateItemNote]);

  useEffect(() => {
    // When the selected table changes, reset the "closing" state
    setIsClosingTable(false);
  }, [selectedTable]);

  useEffect(() => {
    if (recentlyAddedItemId && itemRefs.current[recentlyAddedItemId] && scrollAreaRef.current) {
        const itemElement = itemRefs.current[recentlyAddedItemId];
        if (itemElement) {
            const scrollArea = scrollAreaRef.current;
            const itemTop = itemElement.offsetTop;
            const itemBottom = itemTop + itemElement.offsetHeight;
            const scrollAreaTop = scrollArea.scrollTop;
            const scrollAreaBottom = scrollAreaTop + scrollArea.clientHeight;

            if (itemTop < scrollAreaTop) {
                scrollArea.scrollTop = itemTop;
            } else if (itemBottom > scrollAreaBottom) {
                scrollArea.scrollTop = itemBottom - scrollArea.clientHeight;
            }
        }
    }
  }, [recentlyAddedItemId]);

  useEffect(() => {
    setIsKeypadOpen(!!selectedItem);
  }, [selectedItem, setIsKeypadOpen]);

  useEffect(() => {
    if (selectedItem) {
        if (mode === 'note') {
            noteInputRef.current?.focus();
            noteInputRef.current?.select();
        } else if (keypadInputRef.current) {
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
    }
  }

  const handleModeChange = (newMode: 'quantity' | 'discountPercent' | 'discountFixed' | 'note') => {
    setMode(newMode);
    if (newMode === 'quantity' && selectedItem) {
        setKeypadValue(selectedItem.quantity.toString());
    } else if (newMode === 'note' && selectedItem) {
        setKeypadValue(selectedItem.note || '');
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

  const handleNoteInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeypadValue(e.target.value);
  }

  const handleOpenVirtualKeyboardForNote = () => {
    if(!selectedItem) return;
    setTargetInput({
        value: selectedItem.note || '',
        name: `item-note-${selectedItem.id}`
    });
    showKeyboard();
  }


  const handleApply = () => {
    if (!selectedItem) return;
    
    if (mode === 'note') {
        updateItemNote(selectedItem.id, keypadValue);
    } else {
        const value = parseFloat(keypadValue);
        if(isNaN(value)) return;
        
        if (mode === 'quantity') {
            updateQuantityFromKeypad(selectedItem.id, value);
        } else if (mode === 'discountPercent') {
            applyDiscount(selectedItem.id, value, 'percentage');
        } else if (mode === 'discountFixed') {
            applyDiscount(selectedItem.id, value, 'fixed');
        }
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
  
  const getTitle = () => {
    if (currentSaleContext?.isTableSale) {
        return (
            <div className='flex items-center gap-2'>
                <Utensils/>
                <span>Ticket: {currentSaleContext.tableName}</span>
            </div>
        )
    }
    if (selectedTable) {
        return (
             <div className='flex items-center gap-2'>
                <Utensils/>
                <span>Commande: {selectedTable.name}</span>
            </div>
        )
    }
    return (
        <div className='flex items-center gap-2'>
            <ShoppingCart/>
            <span>Commande Actuelle</span>
        </div>
    );
  }

  const HeaderAction = () => {
    if (selectedTable) {
      if (order.length > 0) {
        return (
          <Button variant="ghost" size="sm" onClick={() => setOrder([])} className="text-destructive hover:text-destructive">
            Tout effacer
          </Button>
        );
      }
      return (
        <Button variant="outline" size="sm" onClick={() => saveTableOrderAndExit(selectedTable.id, order)} className="btn-back">
          <ArrowLeft />
          Retour
        </Button>
      );
    }

    if (order.length > 0) {
      return (
        <Button variant="ghost" size="sm" onClick={clearOrder} className="text-destructive hover:text-destructive">
          Tout effacer
        </Button>
      );
    }
    
    if (order.length === 0 && !selectedTable) {
        return (
            <Button asChild variant="outline" size="sm" className="btn-back">
                <Link href="/dashboard">
                    <ArrowLeft />
                    Tableau de bord
                </Link>
            </Button>
        )
    }

    return null;
  }

  const [isClosingTable, setIsClosingTable] = useState(false);

  const handleCloturer = () => {
    if(selectedTable) {
        promoteTableToTicket(selectedTable.id, order);
        setIsClosingTable(true);
    }
  }


  const renderOrderItem = (item: OrderItem, isSelected: boolean) => (
    <div 
        ref={el => itemRefs.current[item.id] = el}
        className={cn(
          "flex items-start gap-4 cursor-pointer transition-colors duration-300", 
          isSelected ? 'bg-accent/50' : 'bg-transparent hover:bg-secondary/50',
          recentlyAddedItemId === item.id && !isSelected && 'animate-pulse-bg',
          showTicketImages ? 'p-4' : 'p-2'
        )}
        onClick={() => handleItemSelect(item)}
        onAnimationEnd={() => { if(recentlyAddedItemId === item.id) setRecentlyAddedItemId(null) }}
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
              <div>
                <p className="font-semibold pr-2">{item.name}</p>
                {item.selectedVariants && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">Qté: {item.quantity}</span>
            </div>
            {item.note && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1 pr-2 whitespace-pre-wrap">Note: {item.note}</p>
            )}
            {descriptionDisplay !== 'none' && item.description && (
                <p className="text-xs text-muted-foreground mt-1 pr-2 whitespace-pre-wrap">{item.description}</p>
            )}
            {descriptionDisplay === 'both' && item.description2 && (
                <p className="text-xs text-muted-foreground mt-1 pr-2 whitespace-pre-wrap">{item.description2}</p>
            )}
             {item.serialNumbers && item.serialNumbers.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                S/N: {item.serialNumbers.filter(sn => sn).join(', ')}
              </div>
            )}
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
  );
  
  const backgroundColor = selectedTable 
    ? hexToRgba(restaurantModeBackgroundColor, restaurantModeBgOpacity)
    : hexToRgba(directSaleBackgroundColor, directSaleBgOpacity);

  return (
    <>
      <div className="flex h-full flex-col relative bg-card" style={{ backgroundColor: isClient ? backgroundColor : 'transparent' }}>
        <div className="flex items-center justify-between p-2 border-b h-[49px] bg-card">
          <h2 className="text-lg font-bold tracking-tight font-headline">
             {getTitle()}
          </h2>
          <HeaderAction />
        </div>

        {isKeypadOpen && selectedItem && (
          <div className="z-10 bg-secondary/95 backdrop-blur-sm border-b shadow-lg">
              <div className="bg-accent/50">
                {renderOrderItem(selectedItem, true)}
              </div>
              <div className="p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-8">
                      <div className="grid grid-cols-4 gap-2">
                          <Button variant={mode === 'quantity' ? 'default' : 'outline'} onClick={() => handleModeChange('quantity')}>Qté</Button>
                          <Button variant={mode === 'discountPercent' ? 'default' : 'outline'} onClick={() => handleModeChange('discountPercent')}>Remise %</Button>
                          <Button variant={mode === 'discountFixed' ? 'default' : 'outline'} onClick={() => handleModeChange('discountFixed')}>Remise €</Button>
                          <Button variant={mode === 'note' ? 'default' : 'outline'} onClick={() => handleModeChange('note')}>Note</Button>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <Button
                          variant="outline"
                          className="h-full w-full"
                          onClick={() => setSerialNumberItem({ item: selectedItem, quantity: selectedItem.quantity })}
                      >
                          <ScanLine className="mr-2 h-4 w-4" />
                          N° Série
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mode === 'note' ? (
                       <div className="relative w-full">
                         <Textarea 
                            ref={noteInputRef}
                            value={keypadValue}
                            onChange={handleNoteInputChange}
                            onFocus={(e) => e.target.select()}
                            className="h-20 flex-1 px-4 py-2 text-base font-sans bg-background/50"
                            placeholder='Note pour la cuisine, etc...'
                        />
                         <Button variant="ghost" size="icon" onClick={handleOpenVirtualKeyboardForNote} className="absolute right-1 bottom-1 h-8 w-8">
                            <KeyboardIcon className="h-5 w-5" />
                        </Button>
                       </div>
                    ) : (
                        <Input 
                            ref={keypadInputRef}
                            type="text"
                            value={keypadValue}
                            onChange={handleDirectInputChange}
                            onFocus={(e) => e.target.select()}
                            className="h-12 flex-1 text-right px-4 text-3xl font-mono bg-background/50"
                        />
                    )}
                  </div>

                  {mode !== 'note' && (
                    <div className="grid grid-cols-4 gap-2">
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
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                     <Button className="h-12 text-lg col-span-3" onClick={handleApply}>
                        <Check className="mr-2" /> Valider
                      </Button>
                      <Button variant="ghost" className="h-12" onClick={handleCloseKeypad}>
                          <X />
                      </Button>
                  </div>
              </div>
          </div>
        )}

        <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
          {order.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Aucun article dans la commande.</p>
            </div>
          ) : (
            <div className="divide-y">
                {order.map((item) => (
                  <div key={item.id} className={cn(isKeypadOpen && selectedItem?.id === item.id && 'opacity-0 h-0 overflow-hidden')}>
                      {renderOrderItem(item, false)}
                  </div>
                ))}
              </div>
          )}
        </ScrollArea>

        <div className="mt-auto border-t p-4 bg-card">
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
              {selectedTable && selectedTable.id !== 'takeaway' && !isClosingTable ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={() => saveTableOrderAndExit(selectedTable.id, order)}
                  >
                     <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                   <Button
                    size="lg"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={handleCloturer}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Clôturer
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
                    className="w-full"
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

