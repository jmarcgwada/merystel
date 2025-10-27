'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePos } from '@/contexts/pos-context';
import type { Sale } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';

interface DocumentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSelected: (sale: Sale) => void;
}

export function DocumentSelectionDialog({ isOpen, onClose, onDocumentSelected }: DocumentSelectionDialogProps) {
  const { sales, customers } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const customerMap = useMemo(() => {
    if (!customers) return new Map();
    return new Map(customers.map(c => [c.id, c.name]));
  }, [customers]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const customerName = customerMap.get(sale.customerId || '') || '';
      return (
        sale.ticketNumber?.toLowerCase().includes(lowerSearchTerm) ||
        customerName.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [sales, customerMap, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    setHighlightedIndex(filteredSales.length > 0 ? 0 : -1);
  }, [searchTerm, filteredSales.length]);

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
      setHighlightedIndex(prev => Math.min(prev + 1, filteredSales.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect();
    }
  };

  const handleSelect = () => {
    if (highlightedIndex >= 0 && filteredSales[highlightedIndex]) {
      onDocumentSelected(filteredSales[highlightedIndex]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Sélectionner une pièce à joindre</DialogTitle>
          <DialogDescription>
            Recherchez par numéro de pièce ou nom de client.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Input 
            ref={inputRef}
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex-1 min-h-0 px-6">
          <ScrollArea className="h-full border rounded-md">
            <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                        <TableHead>Pièce</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSales.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Aucune pièce trouvée.</TableCell>
                        </TableRow>
                    ) : (
                        filteredSales.map((sale, index) => (
                            <TableRow
                                key={sale.id}
                                ref={el => itemRefs.current[index] = el}
                                onClick={() => onDocumentSelected(sale)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={cn(
                                    "cursor-pointer",
                                    index === highlightedIndex && "bg-accent text-accent-foreground"
                                )}
                            >
                                <TableCell>
                                    <div className="font-semibold flex items-center gap-2">
                                        <Badge variant="outline">{sale.documentType || 'TICKET'}</Badge>
                                        <span>{sale.ticketNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{customerMap.get(sale.customerId || '') || 'N/A'}</TableCell>
                                <TableCell><ClientFormattedDate date={sale.date} formatString="d MMM yyyy" /></TableCell>
                                <TableCell className="text-right font-bold">{sale.total.toFixed(2)}€</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSelect} disabled={highlightedIndex === -1}>
            Joindre la pièce sélectionnée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
