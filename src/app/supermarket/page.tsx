

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OrderSummary } from '@/app/pos/components/order-summary';
import { usePos } from '@/contexts/pos-context';
import { Input } from '@/components/ui/input';
import { Hand, ScanLine, List, ArrowUp, ArrowDown } from 'lucide-react';
import { HeldOrdersDrawer } from '@/app/pos/components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { Item } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useKeyboard } from '@/contexts/keyboard-context';

const MAX_INITIAL_ITEMS = 100;

export default function SupermarketPage() {
  const { items, addToOrder, heldOrders, order, showItemImagesInGrid } = usePos();
  const { setTargetInput, inputValue, targetInput, isOpen: isKeyboardOpen } = useKeyboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [listContent, setListContent] = useState<Item[]>([]);
  const [isHeldOpen, setHeldOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [searchType, setSearchType] = useState<'contains' | 'startsWith'>('contains');

  const listScrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (targetInput?.name === 'supermarket-search') {
      setSearchTerm(inputValue);
       performSearch(inputValue);
    }
  }, [inputValue, targetInput]);
  
  useEffect(() => {
    if (!isKeyboardOpen && targetInput?.name === 'supermarket-search') {
      setSearchTerm('');
    }
  }, [isKeyboardOpen, targetInput]);

  const performSearch = useCallback((term: string) => {
    if (!items) {
      setListContent([]);
      return;
    }
    const lowercasedTerm = term.toLowerCase();
    
    // Exact barcode match for scanner
    const exactBarcodeMatch = items.find(item => item.barcode?.toLowerCase() === lowercasedTerm);
    if(exactBarcodeMatch) {
      addToOrder(exactBarcodeMatch.id);
      setSearchTerm('');
      setListContent([]);
      searchInputRef.current?.focus();
      return;
    }
    
    if (lowercasedTerm.length < 2 && !/\d{4,}/.test(term)) {
        setListContent([]);
        return;
    }

    const filtered = items.filter((item) => {
      const name = item.name.toLowerCase();
      const barcode = item.barcode ? item.barcode.toLowerCase() : '';
      if (searchType === 'startsWith') {
        return name.startsWith(lowercasedTerm) || barcode.startsWith(lowercasedTerm);
      }
      return name.includes(lowercasedTerm) || barcode.includes(lowercasedTerm);
    });
    setListContent(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [items, searchType, addToOrder]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < listContent.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listContent.length > 0 && highlightedIndex >= 0 && listContent[highlightedIndex]) {
        addToOrder(listContent[highlightedIndex].id);
        setSearchTerm('');
        setListContent([]);
      } else {
        performSearch(searchTerm);
      }
    }
  };

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

  const handleShowAll = () => {
    if (items) {
      setSearchTerm('');
      setListContent(items.slice(0, MAX_INITIAL_ITEMS));
      setHighlightedIndex(-1);
       searchInputRef.current?.focus();
    }
  };

  const handleSearchFocus = () => {
    setTargetInput({
      value: searchTerm,
      name: 'supermarket-search',
      ref: searchInputRef,
    });
  };

  useEffect(() => {
    const scrollArea = listScrollAreaRef.current;
    if (!scrollArea) return;

    const checkScrollability = () => {
      setCanScrollUp(scrollArea.scrollTop > 0);
      setCanScrollDown(scrollArea.scrollHeight > scrollArea.clientHeight + scrollArea.scrollTop);
    };

    checkScrollability();
    scrollArea.addEventListener('scroll', checkScrollability);
    
    const observer = new MutationObserver(checkScrollability);
    observer.observe(scrollArea, { childList: true, subtree: true });

    return () => {
      scrollArea.removeEventListener('scroll', checkScrollability);
      observer.disconnect();
    };
  }, [listContent]);

  const handleScroll = (direction: 'up' | 'down') => {
    const scrollArea = listScrollAreaRef.current;
    if (scrollArea) {
      const scrollAmount = scrollArea.clientHeight * 0.8;
      scrollArea.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const startScrolling = (direction: 'up' | 'down') => {
    stopScrolling();
    handleScroll(direction);
    scrollIntervalRef.current = setInterval(() => handleScroll(direction), 300);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
  };
  
  const handleChangeSearchType = () => {
    const newType = searchType === 'contains' ? 'startsWith' : 'contains';
    setSearchType(newType);
    // Directly call performSearch with the new type and current term
    // This is wrapped in a state update callback to ensure we use the 'newType' immediately
    setSearchType(prev => {
        const nextType = prev === 'contains' ? 'startsWith' : 'contains';
        performSearch(searchTerm, nextType);
        return nextType;
    });
    searchInputRef.current?.focus();
  };

   const performSearchWithNewType = useCallback((term: string, type: 'contains' | 'startsWith') => {
    if (!items) {
      setListContent([]);
      return;
    }
    const lowercasedTerm = term.toLowerCase();
    
    if (lowercasedTerm.length < 2 && !/\d{4,}/.test(term)) {
        setListContent([]);
        return;
    }

    const filtered = items.filter((item) => {
      const name = item.name.toLowerCase();
      const barcode = item.barcode ? item.barcode.toLowerCase() : '';
      if (type === 'startsWith') {
        return name.startsWith(lowercasedTerm) || barcode.startsWith(lowercasedTerm);
      }
      return name.includes(lowercasedTerm) || barcode.includes(lowercasedTerm);
    });
    setListContent(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [items]);


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 h-full">
        <div className="md:col-span-8 flex flex-col overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1 w-full space-y-2">
                <div className="relative">
                  <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                  <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Scanner ou rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={handleSearchFocus}
                      className="h-16 text-2xl pl-14 pr-40"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      variant="outline"
                      onClick={handleChangeSearchType}
                      className="h-12 text-xs w-28"
                    >
                      {searchType === 'contains' ? 'Contient' : 'Commence par'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => { handleShowAll(); searchInputRef.current?.focus(); }}>
                        <List className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <div className="flex items-center gap-1">
                <Button 
                    variant="outline" 
                    className="h-16 w-16"
                    onMouseDown={() => startScrolling('up')} 
                    onMouseUp={stopScrolling} 
                    onMouseLeave={stopScrolling}
                    onTouchStart={() => startScrolling('up')}
                    onTouchEnd={stopScrolling}
                    disabled={!canScrollUp}
                >
                    <ArrowUp className="h-8 w-8" />
                </Button>
                <Button 
                    variant="outline" 
                    className="h-16 w-16"
                    onMouseDown={() => startScrolling('down')} 
                    onMouseUp={stopScrolling} 
                    onMouseLeave={stopScrolling}
                    onTouchStart={() => startScrolling('down')}
                    onTouchEnd={stopScrolling}
                    disabled={!canScrollDown}
                >
                    <ArrowDown className="h-8 w-8" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setHeldOpen(true)}
                disabled={order.length > 0}
                className={cn(
                  "flex-1 text-lg py-6 px-8 h-16",
                  (heldOrders?.length || 0) > 0 && order.length === 0 && 'animate-pulse-button'
                )}
              >
                <Hand className="mr-3 h-5 w-5" />
                Tickets
                <Badge variant="secondary" className="ml-3">{heldOrders?.length || 0}</Badge>
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
            {listContent.length > 0 ? (
              <ScrollArea className="flex-1" viewportRef={listScrollAreaRef}>
                <div className="p-1 space-y-1">
                  {listContent.map((item, index) => (
                    <Card
                      key={item.id}
                      ref={(el) => (itemRefs.current[index] = el)}
                      className={cn(
                        "flex items-center p-1 cursor-pointer hover:bg-secondary",
                        index === highlightedIndex && "bg-secondary border-primary"
                      )}
                      onDoubleClick={() => addToOrder(item.id)}
                    >
                      {showItemImagesInGrid && (
                        <Image
                          src={item.image || 'https://picsum.photos/seed/placeholder/100/100'}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="rounded-md object-cover mr-3"
                          data-ai-hint="product image"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-sm">{item.name}</p>
                           {item.barcode && <p className="text-xs text-muted-foreground font-mono">({item.barcode})</p>}
                        </div>
                      </div>
                      <p className="text-base font-bold pr-2">{item.price.toFixed(2)}€</p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ScanLine className="mx-auto h-24 w-24 opacity-10" />
                  <p className="mt-4 text-lg">Le résumé de la commande s'affichera à droite.</p>
                  <p className="text-sm">Appuyez sur "Entrée" pour lancer la recherche.</p>
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

    