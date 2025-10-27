
'use client';

import React, { useState, useMemo } from 'react';
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

interface DocumentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSelected: (sale: Sale) => void;
}

export function DocumentSelectionDialog({ isOpen, onClose, onDocumentSelected }: DocumentSelectionDialogProps) {
  const { sales, customers } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const customer = customers.find(c => c.id === sale.customerId);
      return (
        sale.ticketNumber?.toLowerCase().includes(lowerSearchTerm) ||
        (customer && customer.name.toLowerCase().includes(lowerSearchTerm))
      );
    });
  }, [sales, customers, searchTerm]);

  const handleSelect = () => {
    if (highlightedIndex >= 0 && filteredSales[highlightedIndex]) {
        onDocumentSelected(filteredSales[highlightedIndex]);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Sélectionner une pièce à joindre</DialogTitle>
          <DialogDescription>
            Recherchez par numéro de pièce ou nom de client.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
            <Input 
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full">
                 <div className="space-y-1 py-2">
                    {filteredSales.map((sale, index) => (
                        <div
                            key={sale.id}
                            onClick={() => onDocumentSelected(sale)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-md cursor-pointer",
                                index === highlightedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            )}
                        >
                            <div>
                                <div className="font-semibold flex items-center gap-2">
                                    <Badge variant="outline">{sale.documentType || 'TICKET'}</Badge>
                                    <span>{sale.ticketNumber}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    <ClientFormattedDate date={sale.date} formatString="d MMM yyyy" /> - {customers.find(c => c.id === sale.customerId)?.name || 'N/A'}
                                </p>
                            </div>
                            <span className="font-bold">{sale.total.toFixed(2)}€</span>
                        </div>
                    ))}
                 </div>
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
