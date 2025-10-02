
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { OrderSummary } from '@/app/pos/components/order-summary';
import { usePos } from '@/contexts/pos-context';
import { Input } from '@/components/ui/input';
import { Hand, ScanLine, List } from 'lucide-react';
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
  const [listContent, setListContent] = useState<Item[]>([]);
  const [isHeldOpen, setHeldOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listPersistenceTimer = useRef<NodeJS.Timeout | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (searchTerm.length < 3) {
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
    if (searchTerm.length >= 3) {
      setListContent(filteredItems);
    } else {
      if (!listPersistenceTimer.current) {
        setListContent([]);
      }
    }
  }, [searchTerm, filteredItems]);

  useEffect(() => {
    return () => {
      if (listPersistenceTimer.current) {
        clearTimeout(listPersistenceTimer.current);
      }
    };
  }, []);

  const clearSearchWithDelay = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
    if (listPersistenceTimer.current) {
      clearTimeout(listPersistenceTimer.current);
    }
    listPersistenceTimer.current = setTimeout(() => {
      setListContent([]);
      listPersistenceTimer.current = null;
    }, 3000);
  }, []);
  
  useEffect(() => {
    if (highlightedIndex !== -1 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleItemClick = (item: Item) => {
    addToOrder(item.id);
    clearSearchWithDelay();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (listPersistenceTimer.current) {
      clearTimeout(listPersistenceTimer.current);
      listPersistenceTimer.current = null;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < listContent.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && listContent[highlightedIndex]) {
        handleItemClick(listContent[highlightedIndex]);
      } else {
        const foundItem = items?.find(
          (item) => item.barcode && item.barcode.toLowerCase() === searchTerm.toLowerCase()
        );
        if (foundItem) {
          handleItemClick(foundItem);
        }
      }
    }
  };

  const handleShowAll = () => {
    if (items) {
        setSearchTerm(''); 
        setListContent(items);
        if (listPersistenceTimer.current) {
            clearTimeout(listPersistenceTimer.current);
            listPersistenceTimer.current = null;
        }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 h-full">
        <div className="md:col-span-8 flex flex-col overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
              <div className="relative flex-1 w-full">
                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Scanner ou rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-16 text-2xl pl-14 pr-14"
                />
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12" onClick={handleShowAll}>
                  <List className="h-6 w-6" />
                </Button>
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
            
            <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
                {listContent.length > 0 ? (
                    <ScrollArea className="flex-1">
                        <div className="p-1 space-y-2">
                        {listContent.map((item, index) => (
                            <Card
                                key={item.id}
                                ref={(el) => (itemRefs.current[index] = el)}
                                className={cn(
                                    "flex items-center p-3 cursor-pointer hover:bg-secondary",
                                    index === highlightedIndex && "bg-secondary border-primary"
                                )}
                                onDoubleClick={() => handleItemClick(item)}
                            >
                            <Image
                                src={item.image || 'https://picsum.photos/seed/placeholder/100/100'}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded-md object-cover mr-4"
                                data-ai-hint="product image"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{item.barcode}</p>
                            </div>
                            <p className="text-lg font-bold">{item.price.toFixed(2)}€</p>
                            </Card>
                        ))
                        }
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <ScanLine className="mx-auto h-24 w-24 opacity-10" />
                            <p className="mt-4 text-lg">Le résumé de la commande s'affichera à droite.</p>
                            {searchTerm.length < 3 && <p className="text-sm">Commencez à saisir pour rechercher un article.</p>}
                            {searchTerm.length >= 3 && <p className="text-sm">Aucun article trouvé pour "{searchTerm}".</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className="md:col-span-4 border-l flex flex-col overflow-hidden">
          <OrderSummary />
        </div>
      </div>
      <HeldOrdersDrawer isOpen={isHeldOpen} onClose={() => setHeldOpen(false)} />
      <SerialNumberModal />
      <VariantSelectionModal />
    </>
  );
}
