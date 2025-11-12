
'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/pos-context';
import type { FormSubmission, Sale } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface FormSubmissionDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: FormSubmission | null;
}

export function FormSubmissionDetailDialog({ isOpen, onClose, submission }: FormSubmissionDetailDialogProps) {
    const { items, sales, customers } = usePos();

    const relatedData = useMemo(() => {
        if (!submission) return null;
        const item = items.find(i => i.id === submission.orderItemId);
        const sale = sales.find(s => s.items.some(i => i.formSubmissionId === submission.id));
        const customer = sale ? customers.find(c => c.id === sale.customerId) : null;
        return { item, sale, customer };
    }, [submission, items, sales, customers]);

    if (!isOpen || !submission || !relatedData) {
        return null;
    }

    const { item, sale, customer } = relatedData;
    const formFields = item?.formFields || [];

    const renderFieldValue = (field: any, value: any) => {
        if (field.type === 'checkbox') {
            return (
                <div className="flex items-center space-x-2">
                    <Checkbox checked={!!value} disabled />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {value ? 'Oui' : 'Non'}
                    </label>
                </div>
            );
        }
        if (field.type === 'textarea') {
            return <Textarea value={String(value)} readOnly className="h-24 bg-muted/50" />;
        }
         if (field.type === 'date') {
            return <Input value={value ? new Date(value).toLocaleDateString('fr-FR') : ''} readOnly className="bg-muted/50" />;
        }
        return <Input value={String(value)} readOnly className="bg-muted/50" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Détail de la Soumission</DialogTitle>
                    <DialogDescription>
                        Informations saisies pour l'article "{item?.name || 'Inconnu'}" le <ClientFormattedDate date={submission.createdAt} formatString="d MMM yyyy 'à' HH:mm"/>
                    </DialogDescription>
                     <div className="text-sm text-muted-foreground pt-2">
                        <p>Client: <span className="font-semibold text-foreground">{customer?.name || 'N/A'}</span></p>
                        <p>Pièce: <Link href={`/reports/${sale?.id}?from=forms`} className="font-semibold text-primary hover:underline">{sale?.ticketNumber || 'N/A'}</Link></p>
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4 overflow-y-auto flex-1 px-1">
                    {formFields.map(field => {
                        const value = submission.formData[field.name];
                        if (value === undefined || value === null || value === '') return null;
                        
                        return (
                            <div key={field.id} className="space-y-2">
                                <Label>{field.label}</Label>
                                {renderFieldValue(field, value)}
                            </div>
                        )
                    })}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
