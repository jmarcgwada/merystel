
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';


export default function CommercialPage() {
  const { addToOrder, order, setOrder, updateQuantity, removeFromOrder, updateItemNote } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isInvoiceReady, setIsInvoiceReady] = useState(false);
  const router = useRouter();
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title="Gestion Commerciale"
            subtitle="Créez une nouvelle commande ou une facture rapidement."
        >
            {isInvoiceReady && submitHandler ? (
                 <Button size="lg" onClick={submitHandler}>Sauvegarder la facture</Button>
            ) : (
                <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft />
                    Retour au tableau de bord
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



