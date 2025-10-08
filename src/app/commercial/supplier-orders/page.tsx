

'use client';

import { PageHeader } from '@/components/page-header';
import { SupplierOrderForm } from '../components/supplier-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function SupplierOrdersPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      clearOrder,
      items,
      suppliers,
      setCurrentSaleContext,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const saleIdToEdit = searchParams.get('edit');
  const newItemId = searchParams.get('newItemId');

   useEffect(() => {
    if (newItemId) {
      addToOrder(newItemId);
      // Clean the URL
      const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
      router.replace(newUrl, { scroll: false });
    }
  }, [newItemId, addToOrder, router]);

  useEffect(() => {
    // For now, editing supplier orders is not implemented
    if (order.length > 0 && !location.search.includes('edit')) {
         clearOrder({ clearCustomer: true, clearSupplier: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);

  const handleGenerateRandomOrder = useCallback(() => {
    if (!items?.length || !suppliers?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles et des fournisseurs pour générer une commande.',
      });
      return;
    }

    clearOrder({ clearCustomer: true, clearSupplier: true });

    // 1. Select a random supplier
    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    setCurrentSaleContext({ customerId: randomSupplier.id }); // Using customerId for now, to be adapted

    // 2. Generate a random order
    const numberOfItems = Math.floor(Math.random() * 4) + 2; // 2 to 5 items
    const newOrder: OrderItem[] = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1 to 5 quantity
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder) {
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
        }
    }
    setOrder(newOrder);

    toast({
      title: 'Commande Fournisseur Aléatoire Générée',
      description: `Préparation de la commande pour ${randomSupplier.name}.`,
    });
  }, [items, suppliers, clearOrder, setCurrentSaleContext, setOrder, toast]);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? "Modifier la commande fournisseur" : "Gestion des Commandes Fournisseur"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez la commande." : "Créez une nouvelle commande fournisseur."}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGenerateRandomOrder} title="Générer une commande aléatoire">
              <Sparkles className="h-4 w-4" />
            </Button>
            {isReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>{saleIdToEdit ? 'Mettre à jour' : 'Sauvegarder la commande'}</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
            )}
          </div>
        </PageHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
            <SupplierOrderForm 
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                setIsReady={setIsReady}
            />
        </div>
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
