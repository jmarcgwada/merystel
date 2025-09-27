

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface HeldOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date | Timestamp) => {
    let jsDate: Date;
    if (date instanceof Date) {
        jsDate = date;
    } else {
        jsDate = date.toDate();
    }
    return format(jsDate, "d MMM, HH:mm", { locale: fr });
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
            Rappelez une commande en attente pour la finaliser ou consultez son contenu.
          </SheetDescription>
        </SheetHeader>
        
        <Separator />

        {!heldOrders || heldOrders.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Aucun ticket en attente.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <Accordion type="multiple" className="w-full">
              {heldOrders.map((order) => {
                 return (
                <AccordionItem value={order.id} key={order.id}>
                   <div className="flex items-center pr-4">
                        <AccordionTrigger className="flex-1 p-4 text-left hover:no-underline">
                             <div className="flex justify-between items-start w-full">
                                <div className="flex items-center gap-4">
                                  <div>
                                  <p className="font-semibold">
                                      {order.tableName 
                                          ? `Ticket: ${order.tableName}`
                                          : `Ticket du ${formatDate(order.date)}`
                                      }
                                  </p>
                                  {order.tableName && (
                                      <p className="text-xs text-muted-foreground">
                                          Mis en attente le {formatDate(order.date)}
                                      </p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">
                                      {order.items.length} article{order.items.length > 1 ? 's' : ''}
                                  </p>
                                  <p className="font-bold text-primary mt-1">{order.total.toFixed(2)}€</p>
                                  </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8 shrink-0" onClick={() => deleteHeldOrder(order.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                   </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 border-l-2 border-dashed pl-4 ml-2 py-2">
                        {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <span className="font-medium">{item.quantity}x</span> {item.name}
                                </div>
                                <span>{item.total.toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>
                     <Button className="w-full mt-3" onClick={() => handleRecall(order.id)}>
                        Rappeler ce ticket
                    </Button>
                  </AccordionContent>
                </AccordionItem>
                 )
                })}
            </Accordion>
          </ScrollArea>
        )}
        
        <SheetFooter className="p-6 pt-4 mt-auto border-t">
            <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
