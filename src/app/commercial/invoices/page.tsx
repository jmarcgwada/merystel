

'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from '../components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { OrderItem, Payment, Item } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function InvoicesPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote, 
      loadSaleForEditing, 
      clearOrder,
      items,
      customers,
      paymentMethods,
      setCurrentSaleContext,
      setPayments,
      recordSale, 
      orderTotal,
      orderTax,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isInvoiceReady, setIsInvoiceReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const saleIdToEdit = searchParams.get('edit');

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit);
    } else {
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);

  const handleGenerateRandomInvoice = useCallback(() => {
    if (!items?.length || !customers?.length || !paymentMethods?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles, des clients et des méthodes de paiement pour générer une facture.',
      });
      return;
    }

    clearOrder({ clearCustomer: true });

    // 1. Select a random customer
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    setCurrentSaleContext({ customerId: randomCustomer.id, isInvoice: true });

    // 2. Generate a random order
    const numberOfItems = Math.floor(Math.random() * 4) + 2; // 2 to 5 items
    const newOrder: OrderItem[] = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 quantity
        
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

    // 3. Trigger checkout after a short delay
    setTimeout(() => {
      if (submitHandler) {
        submitHandler();
      }
    }, 500);

    toast({
      title: 'Facture Aléatoire Générée',
      description: `Préparation de la facture pour ${randomCustomer.name}.`,
    });
  }, [items, customers, paymentMethods, clearOrder, setCurrentSaleContext, setOrder, submitHandler, toast]);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? "Modifier la facture" : "Gestion des Factures"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez la facture." : "Créez une nouvelle facture ou éditez une facture existante."}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGenerateRandomInvoice} title="Générer une facture aléatoire">
              <Sparkles className="h-4 w-4" />
            </Button>
            {isInvoiceReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>{saleIdToEdit ? 'Mettre à jour la facture' : 'Sauvegarder la facture'}</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? '/reports?filter=Fact-' : '/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
            )}
          </div>
        </PageHeader>
        
        <div className="flex-1">
            <CommercialOrderForm 
                documentType="invoice"
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                updateItemNote={updateItemNote}
                setIsReady={setIsInvoiceReady}
            />
        </div>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}

export default function InvoicesPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <InvoicesPageContent/>
        </Suspense>
    )
}
