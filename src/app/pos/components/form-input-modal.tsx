
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { OrderItem, Item } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export function FormInputModal() {
  const { formItemRequest, setFormItemRequest, addFormItemToOrder, updateOrderItemFormData, tempFormSubmissions } = usePos();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const item = formItemRequest?.item;
  const isEditing = formItemRequest?.isEditing;

  useEffect(() => {
    if (item) {
        if (isEditing && (item as OrderItem).formSubmissionId) {
            const submissionId = (item as OrderItem).formSubmissionId!;
            // For now, we only support editing temporary submissions before sale is final
            if (submissionId.startsWith('temp_') && tempFormSubmissions[submissionId]) {
                 setFormData(tempFormSubmissions[submissionId].formData);
            } else {
                 setFormData({}); // Or fetch from permanent storage if needed
            }
        } else {
             setFormData({});
        }
    }
  }, [item, isEditing, tempFormSubmissions]);
  
  const handleFieldChange = (field: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: type === 'checkbox' ? (value as unknown as boolean) : value,
    }));
  };

  const handleConfirm = () => {
    if (!item) return;

    if (isEditing && (item as OrderItem).formSubmissionId) {
        updateOrderItemFormData((item as OrderItem).formSubmissionId!, formData, (item as OrderItem).formSubmissionId!.startsWith('temp_'));
    } else {
        addFormItemToOrder(item, formData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormItemRequest(null);
    setFormData({});
  };

  if (!item) {
    return null;
  }

  const formDefinition = (item as any).formDefinition || [];

  return (
    <Dialog open={!!formItemRequest} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Informations pour : {item.name}</DialogTitle>
          <DialogDescription>
            Veuillez remplir les champs requis pour cet article.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                {formDefinition.map((field: any) => (
                    <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                        {field.label} {field.required && '*'}
                    </Label>
                    {field.type === 'text' && (
                        <Input
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder}
                        />
                    )}
                    {field.type === 'textarea' && (
                        <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder}
                        />
                    )}
                    {field.type === 'checkbox' && (
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id={field.name}
                            checked={!!formData[field.name]}
                            onCheckedChange={(checked) => handleFieldChange(field.name, checked, field.type)}
                        />
                         <label
                            htmlFor={field.name}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {field.label}
                        </label>
                        </div>
                    )}
                    {field.type === 'select' && (
                        <Select
                            value={formData[field.name] || ''}
                            onValueChange={(value) => handleFieldChange(field.name, value, field.type)}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    </div>
                ))}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>{isEditing ? 'Sauvegarder' : 'Ajouter à la commande'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
