
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
      recordSale
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

    // 2. Select 2 to 5 random items
    const numberOfItems = Math.floor(Math.random() * 4) + 2;
    const shuffledItems = [...items].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, numberOfItems);

    // 3. Create order items with random quantities
    const newOrder: OrderItem[] = selectedItems.map((item, index) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      return {
        id: `${item.id}-${index}`,
        itemId: item.id,
        name: item.name,
        price: item.price,
        vatId: item.vatId,
        image: item.image,
        quantity: quantity,
        total: item.price * quantity,
        discount: 0,
        barcode: item.barcode,
      };
    });

    // 4. Calculate total
    const subtotal = newOrder.reduce((acc, item) => acc + item.total, 0);
    // Note: This is a simplified tax calculation for demo purposes.
    const tax = subtotal * 0.2;
    const total = subtotal + tax;

    // 5. Create random payment
    const randomPaymentMethod = paymentMethods.filter(p => p.type === 'direct' && p.isActive)[Math.floor(Math.random() * paymentMethods.filter(p => p.type === 'direct' && p.isActive).length)];
    const payment: Payment = {
      method: randomPaymentMethod,
      amount: total,
    };

    // 6. Record the sale
    recordSale({
      items: newOrder,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payments: [payment],
      customerId: randomCustomer.id,
      status: 'paid',
    }, undefined, true); // The `true` flag marks it as an invoice

    toast({
      title: 'Facture Aléatoire Générée',
      description: `Facture de ${total.toFixed(2)}€ créée pour ${randomCustomer.name}.`,
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
