
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { OrderItem, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function CommercialPageContent() {
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
      recordSale,
      generateRandomOrder,
      setCurrentSaleContext
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
        // If we navigate to this page without an edit id, ensure the order is clear.
        // This handles the case where a user manually navigates here.
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder({ clearCustomer: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit]);

  const handleGenerateRandomInvoice = () => {
    if (!items?.length || !customers?.length || !paymentMethods?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles, des clients et des méthodes de paiement pour générer une facture.',
      });
      return;
    }

    // 1. Select a random customer
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    setCurrentSaleContext({ customerId: randomCustomer.id, isInvoice: true });

    // 2. Generate a random order
    generateRandomOrder();
    
    // 3. Trigger checkout
     if (submitHandler) {
      // The submit handler is already configured to open the checkout modal
      submitHandler();
    }

    toast({
      title: 'Facture Aléatoire Générée',
      description: `Préparation de la facture pour ${randomCustomer.name}.`,
    });
  };
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? "Modifier la facture" : "Gestion Commerciale"}
            subtitle={saleIdToEdit ? "Modifiez les articles et finalisez la facture." : "Créez une nouvelle commande ou une facture rapidement."}
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
