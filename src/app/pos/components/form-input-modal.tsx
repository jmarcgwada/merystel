
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


export function FormInputModal() {
  const { formItemRequest, setFormItemRequest, addFormItemToOrder, updateOrderItemFormData, formSubmissions } = usePos();

  const item = formItemRequest?.item;
  const isEditing = formItemRequest?.isEditing;
  const formFields = item?.formFields || [];
  
  const generateFormSchema = useCallback((fields: FormFieldDefinition[]) => generateSchema(fields), []);
  const formSchema = useMemo(() => generateFormSchema(formFields), [formFields, generateFormSchema]);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  useEffect(() => {
    if (!item) return;

    const orderItem = item as OrderItem;
    let existingData = {};

    if (isEditing && orderItem.formSubmissionId) {
        const submission = formSubmissions.find(sub => sub.id === orderItem.formSubmissionId);
        if (submission) {
            existingData = submission.formData;
        }
    }

    const newDefaultValues: Record<string, any> = {};
    (item.formFields || []).forEach(field => {
        if ((existingData as Record<string, any>).hasOwnProperty(field.name)) {
            newDefaultValues[field.name] = (existingData as Record<string, any>)[field.name];
        } else {
            if (field.type === 'checkbox') {
                newDefaultValues[field.name] = false;
            } else if (field.type === 'date') {
                newDefaultValues[field.name] = new Date().toISOString().split('T')[0];
            } else {
                newDefaultValues[field.name] = '';
            }
        }
    });

    if (!isEqual(form.getValues(), newDefaultValues)) {
        form.reset(newDefaultValues);
    }
  }, [item, isEditing, formSubmissions, form]);


  const handleConfirm = (data: Record<string, any>) => {
    if (!item) return;

    if (isEditing) {
        const orderItem = item as OrderItem;
        if(orderItem.formSubmissionId) {
            updateOrderItemFormData(orderItem.formSubmissionId, data);
        }
    } else {
        addFormItemToOrder(item, data);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormItemRequest(null);
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={!!item} onOpenChange={handleClose}>
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
                    <Button variant="outline" type="button" onClick={handleClose}>Annuler</Button>
                    <Button type="submit">{isEditing ? 'Sauvegarder' : 'Ajouter à la commande'}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
