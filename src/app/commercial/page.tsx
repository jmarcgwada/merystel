
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommercialOrderForm } from './components/commercial-order-form';
import { OrderSummary } from '@/app/pos/components/order-summary';
import { usePos } from '@/contexts/pos-context';
import type { OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CommercialPage() {
    const { setOrder, clearOrder } = usePos();
    const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

    const handleOrderConfirm = (orderItems: OrderItem[]) => {
        setOrder(orderItems);
        setIsOrderConfirmed(true);
    };
    
    const handleNewOrder = () => {
        clearOrder();
        setIsOrderConfirmed(false);
    }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Gestion Commerciale"
        subtitle="Créez une nouvelle commande ou une facture rapidement."
      >
        {isOrderConfirmed && <Button variant="outline" onClick={handleNewOrder}><ArrowLeft className="mr-2 h-4 w-4" />Nouvelle Commande</Button>}
      </PageHeader>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {!isOrderConfirmed ? (
            <div className="md:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Nouvelle Commande</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CommercialOrderForm onOrderConfirm={handleOrderConfirm} />
                    </CardContent>
                </Card>
            </div>
        ) : (
            <>
                 <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commande confirmée</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>La commande a été transférée vers le module de paiement.</p>
                             <p className="text-muted-foreground text-sm mt-2">Vous pouvez maintenant procéder à l'encaissement à droite ou commencer une nouvelle commande.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <div className="sticky top-20">
                         <Card>
                            <OrderSummary />
                        </Card>
                    </div>
                </div>
            </>
        )}

      </div>
    </div>
  );
}
