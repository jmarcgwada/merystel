
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OrderSummary } from '@/app/pos/components/order-summary';
import { usePos } from '@/contexts/pos-context';
import { Input } from '@/components/ui/input';
import { Hand, ScanLine } from 'lucide-react';
import { HeldOrdersDrawer } from '@/app/pos/components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { Item } from '@/lib/types';
import {
  Card,
} from '@/components/ui/card';

export default function SupermarketPage() {
  const { 
    items,
    addToOrder, 
    heldOrders,
    order
  } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [isHeldOpen, setHeldOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredItems = useMemo(() => {
    if (searchTerm.length < 3 || !items) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowercasedTerm) ||
        (item.barcode && item.barcode.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, items]);

  useEffect(() => {
    // Reset highlight when search term changes
    setHighlightedIndex(-1);
  }, [searchTerm]);

  useEffect(() => {
    // Auto-focus the input on page load
    searchInputRef.current?.focus();
  }, []);

  const handleSearchAndAdd = (term: string) => {
    if (!term || !items) return;

    const lowercasedTerm = term.toLowerCase();
    
    // Prioritize barcode match
    const foundItem = items.find(
      (item) => item.barcode && item.barcode.toLowerCase() === lowercasedTerm
    );

    if (foundItem) {
        addToOrder(foundItem.id);
        setSearchTerm(''); // Clear after adding
    } else {
        // Fallback to name search if no exact barcode match and only one result
        const itemsByName = items.filter(item => item.name.toLowerCase().includes(lowercasedTerm));
        if (itemsByName.length === 1) {
            addToOrder(itemsByName[0].id);
            setSearchTerm('');
        }
    }
  };
  
  const handleItemClick = (item: Item) => {
    addToOrder(item.id);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        handleItemClick(filteredItems[highlightedIndex]);
      } else {
        handleSearchAndAdd(searchTerm);
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-4 p-4">
        <div className="md:col-span-8 flex flex-col border bg-card rounded-lg p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <div className="relative flex-1 w-full">
                     <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Scanner ou rechercher un article..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-16 text-2xl pl-14"
                    />
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => setHeldOpen(true)}
                    disabled={order.length > 0}
                    className={cn(
                        "flex-shrink-0 text-lg py-6 px-8 w-full sm:w-auto h-16",
                        (heldOrders?.length || 0) > 0 && order.length === 0 && 'animate-pulse-button'
                    )}
                >
                    <Hand className="mr-3 h-5 w-5"/>
                    Tickets
                    <Badge variant="secondary" className="ml-3">{heldOrders?.length || 0}</Badge>
                </Button>
            </div>
             <div className="flex-1 flex flex-col overflow-hidden">
                {searchTerm.length >= 3 ? (
                  <ScrollArea className="flex-1">
                      <div className="pr-4 space-y-2">
                        {filteredItems.length > 0 ? (
                           filteredItems.map((item, index) => (
                             <Card
                                key={item.id}
                                className={cn(
                                  "flex items-center p-3 cursor-pointer hover:bg-secondary",
                                  index === highlightedIndex && "bg-secondary border-primary"
                                )}
                                onClick={() => handleItemClick(item)}
                              >
                                <Image
                                    src={item.image || 'https://picsum.photos/seed/placeholder/100/100'}
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover mr-4"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{item.barcode}</p>
                                </div>
                                <p className="text-lg font-bold">{item.price.toFixed(2)}€</p>
                              </Card>
                           ))
                        ) : (
                          <div className="text-center text-muted-foreground pt-10">
                            <p>Aucun article trouvé pour "{searchTerm}"</p>
                          </div>
                        )}
                      </div>
                  </ScrollArea>
                ) : (
                   <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                          <ScanLine className="mx-auto h-24 w-24 opacity-10" />
                          <p className="mt-4 text-lg">Le résumé de la commande s'affichera à droite.</p>
                          <p className="text-sm">Commencez à saisir au moins 3 caractères pour rechercher un article.</p>
                      </div>
                  </div>
                )}
            </div>
        </div>
        <div className="md:col-span-4 border flex flex-col overflow-hidden rounded-lg">
          <OrderSummary />
        </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
      <SerialNumberModal />
      <VariantSelectionModal />
    </>
  );
}
