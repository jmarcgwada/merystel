
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OrderSummary } from '@/app/pos/components/order-summary';
import { usePos } from '@/contexts/pos-context';
import { Input } from '@/components/ui/input';
import { ScanLine } from 'lucide-react';
import { HeldOrdersDrawer } from '@/app/pos/components/held-orders-drawer';
import { Button } from '@/components/ui/button';
import { Hand } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';

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

  useEffect(() => {
    // Auto-focus the input on page load
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = (term: string) => {
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
        // Fallback to name search if no exact barcode match
        const itemsByName = items.filter(item => item.name.toLowerCase().includes(lowercasedTerm));
        if (itemsByName.length === 1) {
            addToOrder(itemsByName[0].id);
            setSearchTerm('');
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-4 p-4">
        <div className="md:col-span-8 flex flex-col items-center justify-center border bg-card rounded-lg p-8">
            <div className="w-full max-w-2xl text-center">
                <ScanLine className="mx-auto h-16 w-16 text-primary" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                    Mode Supermarché
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Scannez un code-barres ou entrez une référence pour ajouter un article.
                </p>
                <div className="mt-8 relative">
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Scanner ou rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-16 text-2xl text-center"
                    />
                </div>
                 <div className="mt-8">
                    <Button 
                        variant="outline" 
                        onClick={() => setHeldOpen(true)}
                        disabled={order.length > 0}
                        className={cn(
                            "flex-shrink-0 text-lg py-6 px-8",
                            (heldOrders?.length || 0) > 0 && order.length === 0 && 'animate-pulse-button'
                        )}
                    >
                        <Hand className="mr-3 h-5 w-5"/>
                        Tickets en attente
                        <Badge variant="secondary" className="ml-3">{heldOrders?.length || 0}</Badge>
                    </Button>
                   </div>
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
