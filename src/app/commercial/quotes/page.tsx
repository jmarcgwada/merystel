
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from '../components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function QuotesPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote, 
      clearOrder,
      loadQuoteForEditing,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteIdToEdit = searchParams.get('edit');

  useEffect(() => {
    if (quoteIdToEdit) {
      loadQuoteForEditing(quoteIdToEdit);
    } else {
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteIdToEdit]);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={quoteIdToEdit ? "Modifier le devis" : "Gestion des Devis"}
            subtitle={quoteIdToEdit ? "Modifiez les articles et finalisez le devis." : "Créez un nouveau devis."}
        >
          <div className="flex items-center gap-2">
            {isReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>{quoteIdToEdit ? 'Mettre à jour le devis' : 'Sauvegarder le devis'}</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(quoteIdToEdit ? '/reports?filter=Devis-' : '/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
            )}
          </div>
        </PageHeader>
        
        <div className="flex-1">
            <CommercialOrderForm
                documentType="quote"
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                updateItemNote={updateItemNote}
                setIsReady={setIsReady}
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
