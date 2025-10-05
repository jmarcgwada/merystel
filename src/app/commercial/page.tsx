
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './components/commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../pos/components/variant-selection-modal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';


export default function CommercialPage() {
  const { addToOrder, order, setOrder, updateQuantity, removeFromOrder, updateItemNote } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  
  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title="Gestion Commerciale"
            subtitle="Créez une nouvelle commande ou une facture rapidement."
        >
            {submitHandler && (
                 <Button size="lg" onClick={submitHandler}>Générer la facture</Button>
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
            />
        </div>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}


