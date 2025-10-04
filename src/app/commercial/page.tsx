
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './components/commercial-order-form';

export default function CommercialPage() {

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 h-full flex flex-col">
      <PageHeader
        title="Gestion Commerciale"
        subtitle="Créez une nouvelle commande ou une facture rapidement."
      />
      
      <div className="mt-8 flex-1">
        <CommercialOrderForm />
      </div>
    </div>
  );
}
