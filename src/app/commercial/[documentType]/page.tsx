
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
    // It decides whether to load an existing document for editing or reset for a new one.

    if (fromConversion === 'true') {
      // If we are converting (e.g., from a quote to an invoice),
      // the context is already prepared by the convertToInvoice function.
      // We do nothing here to preserve that state.
      return;
    }

    if (saleIdToEdit) {
      // If an 'edit' parameter is present in the URL, load the corresponding document.
      loadSaleForEditing(saleIdToEdit, docType);
    } else {
      // If no 'edit' or 'fromConversion' parameter is found, it's a new document.
      // Reset the commercial page context for the current document type.
      resetCommercialPage(docType);
    }
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
