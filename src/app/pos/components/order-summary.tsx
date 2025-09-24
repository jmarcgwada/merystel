'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePos } from '@/contexts/pos-context';
import { X, Minus, Plus, Hand } from 'lucide-react';
import { CheckoutModal } from './checkout-modal';
import { useRouter } from 'next/navigation';

export function OrderSummary() {
  const { order, removeFromOrder, updateQuantity, clearOrder, orderTotal, selectedTable, holdOrder, setSelectedTable } = usePos();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const handleClearOrder = () => {
    if(selectedTable) {
        // If a table is selected, clearing the order should just empty it,
        // then navigate back to the restaurant view.
        clearOrder();
        setSelectedTable(null);
        router.push('/restaurant');
    } else {
        clearOrder();
    }
  }


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
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
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
                    <p className="text-sm text-muted-foreground">{item.price.toFixed(2)}€</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} className="h-6 w-12 text-center" onFocus={(e) => e.target.select()} />
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.total.toFixed(2)}€</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFromOrder(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-auto border-t p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{orderTotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (10%)</span>
              <span>{(orderTotal * 0.1).toFixed(2)}€</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{(orderTotal * 1.1).toFixed(2)}€</span>
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
      </div>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalAmount={orderTotal * 1.1}
      />
    </>
  );
}
