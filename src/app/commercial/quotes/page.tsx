

'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from '../components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FilePlus } from 'lucide-react';
import type { OrderItem, Sale } from '@/lib/types';


function QuotesPageContent() {
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
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
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
      loadSaleForEditing(saleIdToEdit, 'quote');
    } else {
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);
  
  const handleSave = useCallback(() => {
    if (!isReady) return;

    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: orderTotal + orderTax,
      status: 'pending',
      payments: [],
      customerId: currentSaleContext?.customerId,
    };
    
    recordCommercialDocument(doc, 'quote', saleIdToEdit || undefined);
    
  }, [isReady, order, orderTotal, orderTax, currentSaleContext, recordCommercialDocument, saleIdToEdit]);

  const renderHeaderActions = () => {
    if (initialFilter?.startsWith('Devis-')) {
        return (
            <Button onClick={() => router.push('/commercial/quotes')}>
                <FilePlus className="mr-2 h-4 w-4" />
                Nouveau devis
            </Button>
        )
    }
    return (
        <div className="flex items-center gap-2">
            <Button size="lg" onClick={handleSave} disabled={!isReady}>{saleIdToEdit ? 'Mettre à jour le devis' : 'Sauvegarder le devis'}</Button>
             <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? '/reports?filter=Devis-' : '/dashboard')}>
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
            title={saleIdToEdit ? "Modifier le devis" : "Gestion des Devis"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez le devis." : "Créez un nouveau devis."}
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

export default function QuotesPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <QuotesPageContent/>
        </Suspense>
    )
}
