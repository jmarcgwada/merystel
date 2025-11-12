
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import type { FormFieldDefinition, Item, OrderItem } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import isEqual from 'lodash.isequal';


const generateSchema = (fields: FormFieldDefinition[]) => {
  if (!fields) return z.object({});
  const shape: Record<string, z.ZodType<any, any>> = {};
  fields.forEach(field => {
    switch (field.type) {
      case 'number':
        let numSchema = z.coerce.number();
        if (field.required) {
          numSchema = numSchema.min(0, "Ce champ est requis.");
        } else {
          numSchema = numSchema.optional().or(z.literal(''));
        }
        shape[field.name] = numSchema;
        break;
      case 'checkbox':
        shape[field.name] = z.boolean().default(false);
        break;
      case 'date':
          let dateSchema = z.string();
           if (field.required) {
                dateSchema = dateSchema.min(1, "Ce champ est requis.");
            } else {
                dateSchema = dateSchema.optional();
            }
          shape[field.name] = dateSchema;
          break;
      default: // text, textarea
        let stringSchema = z.string();
        if (field.required) {
          stringSchema = stringSchema.min(1, "Ce champ est requis.");
        } else {
          stringSchema = stringSchema.optional();
        }
        shape[field.name] = stringSchema;
        break;
    }
  });
  return z.object(shape);
};


interface FormInputModalProps {
  item: Item | OrderItem | null;
  isEditing: boolean;
  isOpen: boolean;
  onClose: () => void;
}


export function FormInputModal({ item, isEditing, isOpen, onClose }: FormInputModalProps) {
  const { addFormItemToOrder, updateOrderItemFormData, formSubmissions, tempFormSubmissions } = usePos();
  
  const formFields = item?.formFields || [];
  
  const formSchema = useMemo(() => generateSchema(formFields), [formFields]);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  useEffect(() => {
    if (isOpen && item) {
        const orderItem = item as OrderItem;
        let existingData = {};
        
        const submissionId = orderItem.formSubmissionId;
        if (submissionId) {
            const submission = formSubmissions.find(sub => sub.id === submissionId) || tempFormSubmissions[submissionId];
            if (submission) {
                existingData = submission.formData;
            }
        }

        const newDefaultValues: Record<string, any> = {};
        (item.formFields || []).forEach(field => {
            const existingValue = (existingData as Record<string, any>)[field.name];
            if (existingValue !== undefined) {
                newDefaultValues[field.name] = existingValue;
            } else {
                 newDefaultValues[field.name] = field.type === 'checkbox' ? false : (field.type === 'date' ? new Date().toISOString().split('T')[0] : '');
            }
        });
        form.reset(newDefaultValues);
    }
  }, [isOpen, item, formSubmissions, tempFormSubmissions, form]);


  const handleConfirm = (data: Record<string, any>) => {
    if (!item) return;

    if (isEditing) {
        const orderItem = item as OrderItem;
        if(orderItem.formSubmissionId) {
            updateOrderItemFormData(orderItem.formSubmissionId, data, !orderItem.sourceSale);
        }
    } else {
        addFormItemToOrder(item, data);
    }
    onClose();
  };

  if (!isOpen || !item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Veuillez remplir les informations requises pour cet article.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleConfirm)}>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    {formFields.map(field => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={field.name}
                            render={({ field: controllerField }) => {
                                if(field.type === 'checkbox') {
                                    return (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={controllerField.value}
                                                    onCheckedChange={controllerField.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
                                            </div>
                                        </FormItem>
                                    )
                                }
                                return (
                                <FormItem>
                                    <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
                                    <FormControl>
                                        {field.type === 'textarea' ? (
                                            <Textarea {...controllerField} value={controllerField.value || ''}/>
                                        ) : (
                                            <Input type={field.type} {...controllerField} value={controllerField.value || ''} />
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}}
                        />
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">{isEditing ? 'Sauvegarder' : 'Ajouter à la commande'}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
