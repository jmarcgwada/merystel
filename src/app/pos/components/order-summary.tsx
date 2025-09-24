'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePos } from '@/contexts/pos-context';
import { X, Hand, Percent, Eraser, Euro } from 'lucide-react';
import { CheckoutModal } from './checkout-modal';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/lib/types';

const KeypadButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button variant="outline" className={cn("text-xl h-14", className)} onClick={onClick}>
        {children}
    </Button>
)

export function OrderSummary() {
  const { 
    order, 
    removeFromOrder, 
    clearOrder, 
    orderTotal, 
    orderTax, 
    selectedTable, 
    holdOrder, 
    setSelectedTable,
    applyDiscount,
    updateQuantityFromKeypad 
  } = usePos();
  
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [mode, setMode] = useState<'quantity' | 'discountPercent' | 'discountFixed'>('quantity');

  const handleItemSelect = (item: OrderItem) => {
    if (selectedItem?.id === item.id) {
        setSelectedItem(null); // Deselect if clicking the same item
        setKeypadValue('');
    } else {
        setSelectedItem(item);
        setMode('quantity');
        setKeypadValue(item.quantity.toString());
    }
  }

  const handleModeChange = (newMode: 'quantity' | 'discountPercent' | 'discountFixed') => {
    setMode(newMode);
    if (newMode === 'quantity' && selectedItem) {
        setKeypadValue(selectedItem.quantity.toString());
    } else {
        setKeypadValue('');
    }
  }

  const handleKeypadInput = (value: string) => {
    if (value === 'del') {
        setKeypadValue(prev => prev.slice(0, -1));
    } else if (value === '.') {
        if (!keypadValue.includes('.')) {
            setKeypadValue(prev => prev + '.');
        }
    } else {
        setKeypadValue(prev => prev + value);
    }
  }

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

  const handleClearOrder = () => {
    if(selectedTable) {
        clearOrder();
        setSelectedTable(null);
        router.push('/restaurant');
    } else {
        clearOrder();
    }
  }

  const keypadActive = selectedItem !== null;


  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold tracking-tight font-headline">
            {selectedTable ? `Commande: ${selectedTable.name}` : 'Commande actuelle'}
          </h2>
          {order.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearOrder} className="text-destructive hover:text-destructive">
              {selectedTable ? 'Annuler' : 'Tout effacer'}
            </Button>
          )}
        </div>

        {order.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Aucun article dans la commande.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {order.map((item) => (
                <div key={item.id}>
                    <div 
                        className={cn("flex items-center gap-4 p-4 cursor-pointer", selectedItem?.id === item.id && 'bg-secondary')}
                        onClick={() => handleItemSelect(item)}
                    >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                            src={item.image || 'https://picsum.photos/seed/item/100/100'}
                            alt={item.name}
                            fill
                            className="object-cover"
                            data-ai-hint="product image"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Qté: {item.quantity}</span>
                                {item.discount > 0 && (
                                     <span className="text-destructive font-semibold">
                                        (-{item.discount.toFixed(2)}€)
                                     </span>
                                )}
                            </div>
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
          </ScrollArea>
        )}

        <div className="mt-auto border-t">
          {keypadActive && selectedItem ? (
            <div className="p-4 bg-secondary/50">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button variant={mode === 'quantity' ? 'default' : 'outline'} onClick={() => handleModeChange('quantity')}>Qté</Button>
                    <Button variant={mode === 'discountPercent' ? 'default' : 'outline'} onClick={() => handleModeChange('discountPercent')}>Remise %</Button>
                    <Button variant={mode === 'discountFixed' ? 'default' : 'outline'} onClick={() => handleModeChange('discountFixed')}>Remise €</Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-4 rounded-md bg-background border h-14 flex items-center justify-end px-4 text-2xl font-mono">{keypadValue || '0'}</div>

                    <KeypadButton onClick={() => handleKeypadInput('7')}>7</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('8')}>8</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('9')}>9</KeypadButton>
                    <Button variant="destructive" className="h-14" onClick={() => applyDiscount(selectedItem.id, 0, 'fixed')}>
                        <Eraser/>
                    </Button>

                    <KeypadButton onClick={() => handleKeypadInput('4')}>4</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('5')}>5</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('6')}>6</KeypadButton>
                    <Button className="row-span-3 h-auto text-2xl" onClick={handleApply}>
                       Valider
                    </Button>

                    <KeypadButton onClick={() => handleKeypadInput('1')}>1</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('2')}>2</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('3')}>3</KeypadButton>
                    
                    <KeypadButton onClick={() => handleKeypadInput('0')} className="col-span-2">0</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('.')}>.</KeypadButton>
                    <KeypadButton onClick={() => handleKeypadInput('del')} className="col-start-4 row-start-2">←</KeypadButton>
                </div>
            </div>
          ) : (
            <div className="p-4">
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
                    <span>Total</span>
                    <span>{(orderTotal + orderTax).toFixed(2)}€</span>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={order.length === 0 || !!selectedTable}
                    onClick={holdOrder}
                    >
                    <Hand className="mr-2 h-4 w-4" />
                    Mettre en attente
                    </Button>
                    <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={order.length === 0}
                    onClick={() => setCheckoutOpen(true)}
                    >
                    Payer maintenant
                    </Button>
                </div>
            </div>
          )}
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
