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
  const { loadSaleForEditing, resetCommercialPage } = usePos();
  const searchParams = useSearchParams();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];

  const saleIdToEdit = searchParams.get('edit');

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit, docType);
    } else {
      // Let the context handle the state if it's a conversion.
      // Otherwise, reset for a new document.
      const isConversion = searchParams.has('fromConversion');
      if (!isConversion) {
        resetCommercialPage(docType);
      }
    }
  }, [saleIdToEdit, docType, loadSaleForEditing, resetCommercialPage, searchParams]);

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
