
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
import type { FormFieldDefinition } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const generateSchema = (fields: FormFieldDefinition[]) => {
  const shape: Record<string, z.ZodType<any, any>> = {};
  fields.forEach(field => {
    switch (field.type) {
      case 'number':
        let numSchema = z.coerce.number();
        if (field.required) {
          numSchema = numSchema.min(0, "Ce champ est requis.");
        } else {
          numSchema = numSchema.optional();
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
  const { formItemRequest, setFormItemRequest, addFormItemToOrder, updateOrderItemFormData } = usePos();

  const item = formItemRequest?.item;
  const isEditing = formItemRequest?.isEditing;
  const formFields = item?.formFields || [];

  const formSchema = useMemo(() => generateSchema(formFields), [formFields]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  useEffect(() => {
    if(item) {
        const defaultValues: Record<string, any> = {};
        const existingData = (item as any).formData || {};

        formFields.forEach(field => {
            if (isEditing && existingData.hasOwnProperty(field.name)) {
                defaultValues[field.name] = existingData[field.name];
            } else {
                if(field.type === 'checkbox') {
                    defaultValues[field.name] = false;
                } else if (field.type === 'date') {
                    defaultValues[field.name] = new Date().toISOString().split('T')[0];
                } else {
                    defaultValues[field.name] = '';
                }
            }
        });
        form.reset(defaultValues);
    }
  }, [item, isEditing, form, formFields]);


  const handleConfirm = (data: Record<string, any>) => {
    if (!item) return;

    if (isEditing) {
        updateOrderItemFormData(item.id, data);
    } else {
        addFormItemToOrder(item, data);
    }
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
                                            <Textarea {...controllerField} />
                                        ) : (
                                            <Input type={field.type} {...controllerField} />
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
