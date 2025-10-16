'use client';

import { PageHeader } from '@/components/page-header';
import { SupplierOrderForm } from '../components/supplier-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle, Lock, Save } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from '@/components/ui/alert-dialog';
import { CheckoutModal } from '@/app/pos/components/checkout-modal';

const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return `hsla(var(--background), ${opacity / 100})`;
};


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
      updateItemPrice,
      resetCommercialPage,
      loadSaleForEditing,
      currentSaleId,
      currentSaleContext,
      recordCommercialDocument,
      supplierOrderBgColor,
      supplierOrderBgOpacity,
      orderTotal,
      orderTax,
  } = usePos();
  
  const formRef = useRef<{ submit: (validate?: boolean) => void }>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isValidationConfirmOpen, setValidationConfirmOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const saleIdToEdit = searchParams.get('edit');
  const newItemId = searchParams.get('newItemId');

  const isEditing = !!currentSaleId;
  const isReadOnly = currentSaleContext?.isReadOnly ?? false;
  
   const [isClient, setIsClient] = useState(false);
   useEffect(() => { setIsClient(true); }, []);
   const backgroundColor = useMemo(() => isClient ? hexToRgba(supplierOrderBgColor, supplierOrderBgOpacity) : 'transparent', [isClient, supplierOrderBgColor, supplierOrderBgOpacity]);


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
        loadSaleForEditing(saleIdToEdit, 'supplier_order');
      }
    } else {
        if (!currentSaleId && !newItemId) {
             resetCommercialPage('supplier_order');
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);

  const handleSave = useCallback(async (andValidate = false) => {
    if (formRef.current) {
      formRef.current.submit(andValidate);
    }
  }, []);

  const handleValidation = () => {
    // This now just opens the checkout modal after confirmation
    if (order.length === 0) {
      toast({ variant: 'destructive', title: 'Commande vide', description: 'Ajoutez des articles avant de valider.' });
      return;
    }
    setValidationConfirmOpen(true);
  };
  
  const onValidationConfirm = () => {
    setValidationConfirmOpen(false);
    
    // Set context for checkout modal
    setCurrentSaleContext(prev => ({
        ...prev,
        items: order,
        total: orderTotal + orderTax,
        subtotal: orderTotal,
        tax: orderTax,
        documentType: 'supplier_order',
        status: 'pending',
    }));

    setCheckoutOpen(true);
  };


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

  return (
    <>
    <div className="h-full flex flex-col" style={{ backgroundColor }}>
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
             <Button size="lg" onClick={() => handleSave(false)} disabled={isReadOnly}>
                 <Save className="mr-2 h-4 w-4" />
                 {isEditing ? 'Sauvegarder' : 'Sauvegarder'}
            </Button>
            <Button size="lg" onClick={handleValidation} disabled={isReadOnly}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Valider la commande
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
                    updateItemPrice={updateItemPrice}
                />
            </div>
        </fieldset>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
    <AlertDialog open={isValidationConfirmOpen} onOpenChange={setValidationConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitleComponent>Confirmer la validation ?</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent>
                Cette action est irréversible. Le stock des articles concernés sera mis à jour après le paiement.
            </AlertDialogDescriptionComponent>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onValidationConfirm}>
                Continuer vers le paiement
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    {isCheckoutOpen && (
        <CheckoutModal 
            isOpen={isCheckoutOpen}
            onClose={() => setCheckoutOpen(false)}
            totalAmount={orderTotal + orderTax}
        />
    )}
    </>
  );
}

export default function SupplierOrdersPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SupplierOrdersPageContent/>
        </Suspense>
    )
}
