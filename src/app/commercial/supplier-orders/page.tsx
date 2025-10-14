'use client';

import { PageHeader } from '@/components/page-header';
import { SupplierOrderForm } from '../components/supplier-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle, Lock } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function SupplierOrdersPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      items,
      suppliers,
      setCurrentSaleContext,
      updateItemNote,
      updateItemQuantityInOrder,
      resetCommercialPage,
      loadSaleForEditing,
      currentSaleId,
      currentSaleContext,
  } = usePos();
  
  const formRef = useRef<{ submit: () => void }>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const saleIdToEdit = searchParams.get('edit');
  const newItemId = searchParams.get('newItemId');

  const isEditing = !!currentSaleId;
  const isReadOnly = currentSaleContext?.isReadOnly ?? false;

   useEffect(() => {
    if (newItemId) {
      addToOrder(newItemId);
      // Clean the URL
      const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
      router.replace(newUrl, { scroll: false });
    }
  }, [newItemId, addToOrder, router]);
  
  useEffect(() => {
    if (saleIdToEdit) {
      if (currentSaleId !== saleIdToEdit) {
        // Reset first to ensure a clean state, especially when switching between documents
        resetCommercialPage('supplier_order');
        loadSaleForEditing(saleIdToEdit, 'supplier_order');
      }
    } else {
        resetCommercialPage('supplier_order');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);

  const handleSave = useCallback(async () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);


  const handleGenerateRandomOrder = useCallback(() => {
    if (!items?.length || !suppliers?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles et des fournisseurs pour générer une commande.',
      });
      return;
    }

    resetCommercialPage('supplier_order');

    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    setCurrentSaleContext({ supplierId: randomSupplier.id, documentType: 'supplier_order' });

    const newOrder: OrderItem[] = [];
    let addedItems = 0;
    while(addedItems < 5 && newOrder.length < items.length) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder && typeof randomItem.purchasePrice === 'number' && randomItem.purchasePrice > 0) {
            newOrder.push({
                itemId: randomItem.id,
                id: randomItem.id,
                name: randomItem.name,
                price: randomItem.purchasePrice || 0, // Using purchase price
                vatId: randomItem.vatId,
                quantity,
                total: (randomItem.purchasePrice || 0) * quantity,
                discount: 0,
                barcode: randomItem.barcode,
            });
            addedItems++;
        }
    }
    setOrder(newOrder);

    toast({
      title: 'Commande Fournisseur Aléatoire Générée',
      description: `Préparation de la commande pour ${randomSupplier.name}.`,
    });
  }, [items, suppliers, resetCommercialPage, setCurrentSaleContext, setOrder, toast]);
  
  const getButtonLabel = () => {
    if (isEditing) {
        return isReadOnly ? 'Commande Validée' : 'Valider la commande';
    }
    return 'Valider la commande';
  }

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={isEditing ? "Modifier la commande fournisseur" : "Gestion des Commandes Fournisseur"}
            subtitle={isEditing ? "Modifiez les articles et finalisez la commande." : "Créez une nouvelle commande fournisseur."}
        >
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={handleGenerateRandomOrder} title="Générer une commande aléatoire" disabled={order.length > 0}>
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
             <Button size="lg" onClick={handleSave} disabled={isReadOnly}>
                 <CheckCircle className="mr-2 h-4 w-4" />
                {getButtonLabel()}
            </Button>
          </div>
        </PageHeader>

        {isReadOnly && (
            <Alert variant="default" className="mt-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <Lock className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">Commande Validée</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                    Cette commande a été validée et ne peut plus être modifiée.
                </AlertDescription>
            </Alert>
        )}
        
        <fieldset disabled={isReadOnly} className="flex-1 flex flex-col min-h-0 mt-4 group">
            <div className="flex-1 flex flex-col min-h-0 group-disabled:opacity-70">
                <SupplierOrderForm 
                    ref={formRef}
                    order={order} 
                    setOrder={setOrder}
                    addToOrder={addToOrder}
                    updateQuantity={updateQuantity}
                    removeFromOrder={removeFromOrder}
                    updateItemNote={updateItemNote}
                    updateItemQuantityInOrder={updateItemQuantityInOrder}
                />
            </div>
        </fieldset>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}

export default function SupplierOrdersPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SupplierOrdersPageContent/>
        </Suspense>
    )
}
