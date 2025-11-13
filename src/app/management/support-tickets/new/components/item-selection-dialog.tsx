'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { Item } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItemSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (item: Item) => void;
}

export function ItemSelectionDialog({ isOpen, onClose, onItemSelected }: ItemSelectionDialogProps) {
  const { items } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(lowerSearchTerm) ||
            (item.barcode && item.barcode.toLowerCase().includes(lowerSearchTerm))
        );
    });
  }, [items, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [searchTerm, filteredItems.length]);
  
  useEffect(() => {
    if (highlightedIndex !== -1 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        handleSelect(filteredItems[highlightedIndex]);
      }
    }
  };

  const handleSelect = (item: Item) => {
    onItemSelected(item);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Sélectionner un Article</DialogTitle>
          <DialogDescription>
            Recherchez par nom ou par code-barres.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Input
            ref={inputRef}
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex-1 min-h-0 px-6">
          <ScrollArea className="h-full">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm">Aucun article trouvé.</div>
            ) : (
              <div className="space-y-1 py-2">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md cursor-pointer",
                      index === highlightedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <p className="font-semibold">
                      {item.name}
                      <span className="ml-4 text-xs text-muted-foreground font-normal">
                        ({item.barcode})
                      </span>
                    </p>
                    <span className="font-bold">{item.price.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => highlightedIndex >= 0 && handleSelect(filteredItems[highlightedIndex])} disabled={highlightedIndex === -1}>
            Sélectionner l'article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
