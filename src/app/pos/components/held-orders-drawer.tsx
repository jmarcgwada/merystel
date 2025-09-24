

'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';

interface HeldOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeldOrdersDrawer({ isOpen, onClose }: HeldOrdersDrawerProps) {
  const { heldOrders, recallOrder, deleteHeldOrder } = usePos();

  const handleRecall = (orderId: string) => {
    recallOrder(orderId);
    onClose();
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Tickets en attente</SheetTitle>
          <SheetDescription>
            Rappelez une commande en attente pour la finaliser.
          </SheetDescription>
        </SheetHeader>
        
        <Separator />

        {heldOrders.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Aucun ticket en attente.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {heldOrders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        Ticket du {format(order.date, "d MMM, HH:mm", { locale: fr })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </p>
                       <p className="font-bold text-primary mt-1">{order.total.toFixed(2)}€</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => deleteHeldOrder(order.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="w-full mt-3" onClick={() => handleRecall(order.id)}>
                    Rappeler ce ticket
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <SheetFooter className="p-6 pt-4 mt-auto border-t">
            <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
