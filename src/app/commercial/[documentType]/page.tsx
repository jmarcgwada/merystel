
'use client';

import { usePos } from '@/contexts/pos-context';
import { useSearchParams, useParams } from 'next/navigation';
import React, { useEffect, Suspense } from 'react';
import CommercialPageLayout from '../components/commercial-page-layout';

const typeMap: Record<string, 'invoice' | 'quote' | 'delivery_note'> = {
  invoices: 'invoice',
  quotes: 'quote',
  'delivery-notes': 'delivery_note',
};

function DocumentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const { loadSaleForEditing, resetCommercialPage } = usePos();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];
  
  const saleIdToEdit = searchParams.get('edit');
  const fromConversion = searchParams.get('fromConversion');

  useEffect(() => {
    // This effect runs only once when the page loads or when the key parameters change.
    // It decides whether to load an existing document for editing.
    // The reset is handled by the layout component when the docType changes.
    if (saleIdToEdit && !fromConversion) {
      loadSaleForEditing(saleIdToEdit, docType);
    }
    // The reset is now handled by the CommercialPageLayout component to avoid race conditions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, fromConversion, docType]); // Dependencies are stable URL params.


  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  return <CommercialPageLayout documentType={docType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
