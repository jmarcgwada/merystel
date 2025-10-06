
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';


function CommercialPageContent() {
  const { addToOrder, order, setOrder, updateQuantity, removeFromOrder, updateItemNote, loadSaleForEditing, clearOrder } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isInvoiceReady, setIsInvoiceReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleIdToEdit = searchParams.get('edit');

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit);
    } else {
        // If we navigate to this page without an edit id, ensure the order is clear.
        // This handles the case where a user manually navigates here.
        if (order.length > 0 && !location.search) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, loadSaleForEditing]);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? "Modifier la facture" : "Gestion Commerciale"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez la facture." : "Créez une nouvelle commande ou une facture rapidement."}
        >
            {isInvoiceReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>{saleIdToEdit ? 'Mettre à jour la facture' : 'Sauvegarder la facture'}</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? '/reports?filter=Fact-' : '/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
            )}
        </PageHeader>
        
        <div className="flex-1">
            <CommercialOrderForm 
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                updateItemNote={updateItemNote}
                setIsInvoiceReady={setIsInvoiceReady}
            />
        </div>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}

export default function CommercialPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CommercialPageContent/>
        </Suspense>
    )
}
