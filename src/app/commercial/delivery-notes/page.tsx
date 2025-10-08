

'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from '../components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FilePlus, Sparkles } from 'lucide-react';
import type { OrderItem, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function DeliveryNotesPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote, 
      clearOrder,
      loadSaleForEditing,
      recordCommercialDocument,
      orderTotal,
      orderTax,
      currentSaleContext,
      items,
      customers,
      setCurrentSaleContext,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const saleIdToEdit = searchParams.get('edit');
  const initialFilter = searchParams.get('filter');
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
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit, 'delivery_note');
    } else {
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);
  
  const handleSave = useCallback(() => {
    if (!isReady || !currentSaleContext?.customerId) return;

    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: orderTotal + orderTax,
      status: 'pending',
      payments: [],
      customerId: currentSaleContext.customerId,
    };
    
    recordCommercialDocument(doc, 'delivery_note', saleIdToEdit || undefined);
    
  }, [isReady, order, orderTotal, orderTax, currentSaleContext, recordCommercialDocument, saleIdToEdit]);

  const handleGenerateRandom = useCallback(() => {
    if (!items?.length || !customers?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles et des clients pour générer un document.',
      });
      return;
    }

    clearOrder({ clearCustomer: true });

    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    setCurrentSaleContext({ customerId: randomCustomer.id });

    const numberOfItems = Math.floor(Math.random() * 4) + 2;
    const newOrder: OrderItem[] = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder) {
            newOrder.push({
                itemId: randomItem.id,
                id: randomItem.id,
                name: randomItem.name,
                price: randomItem.price,
                vatId: randomItem.vatId,
                quantity,
                total: randomItem.price * quantity,
                discount: 0,
                barcode: randomItem.barcode,
            });
        }
    }
    setOrder(newOrder);

    toast({
      title: 'Document Aléatoire Généré',
      description: `Préparation du document pour ${randomCustomer.name}.`,
    });
  }, [items, customers, clearOrder, setCurrentSaleContext, setOrder, toast]);


  const renderHeaderActions = () => {
    if (initialFilter?.startsWith('BL-')) {
        return (
            <Button onClick={() => router.push('/commercial/delivery-notes')}>
                <FilePlus className="mr-2 h-4 w-4" />
                Nouveau bon
            </Button>
        )
    }
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGenerateRandom} title="Générer un bon de livraison aléatoire">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="lg" onClick={handleSave} disabled={!isReady}>{saleIdToEdit ? 'Mettre à jour le bon' : 'Sauvegarder le bon'}</Button>
             <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? '/reports?filter=BL-' : '/dashboard')}>
                <ArrowLeft />
                Retour
            </Button>
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? "Modifier le bon de livraison" : "Gestion des Bons de Livraison"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez le bon." : "Créez un nouveau bon de livraison."}
        >
          {renderHeaderActions()}
        </PageHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
            <CommercialOrderForm
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                updateItemNote={updateItemNote}
                setIsReady={setIsReady}
                showAcompte={false}
            />
        </div>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}

export default function DeliveryNotesPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <DeliveryNotesPageContent/>
        </Suspense>
    )
}
