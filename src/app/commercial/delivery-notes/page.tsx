
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

function DeliveryNotesPageContent() {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote, 
      clearOrder,
      loadDeliveryNoteForEditing,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deliveryNoteIdToEdit = searchParams.get('edit');

  useEffect(() => {
    if (deliveryNoteIdToEdit) {
      loadDeliveryNoteForEditing(deliveryNoteIdToEdit);
    } else {
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryNoteIdToEdit]);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={deliveryNoteIdToEdit ? "Modifier le bon de livraison" : "Gestion des Bons de Livraison"}
            subtitle={deliveryNoteIdToEdit ? "Modifiez les articles et finalisez le bon." : "Créez un nouveau bon de livraison."}
        >
          <div className="flex items-center gap-2">
            {isReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>{deliveryNoteIdToEdit ? 'Mettre à jour le bon' : 'Sauvegarder le bon'}</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(deliveryNoteIdToEdit ? '/reports?filter=BL-' : '/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
            )}
          </div>
        </PageHeader>
        
        <div className="flex-1">
            <CommercialOrderForm
                documentType="delivery-note"
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

export default function DeliveryNotesPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <DeliveryNotesPageContent/>
        </Suspense>
    )
}
