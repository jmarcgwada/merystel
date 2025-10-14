
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

  const { loadSaleForEditing, resetCommercialPage, currentSaleId, loadSaleForConversion } = usePos();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];
  
  const saleIdToEdit = searchParams.get('edit');
  const saleIdToConvert = searchParams.get('fromConversion');

  useEffect(() => {
    // This effect is the SINGLE SOURCE OF TRUTH for loading or resetting a commercial document.
    // It runs only when essential URL parameters change.

    if (saleIdToConvert) {
      // If we are converting, load the source document into the new invoice context
      loadSaleForConversion(saleIdToConvert);
      return; // Stop further processing
    }
    
    if (saleIdToEdit) {
      // If an ID is present for editing, load it.
      // We also check if it's not already the one in context to prevent redundant loads.
      if (currentSaleId !== saleIdToEdit) {
        loadSaleForEditing(saleIdToEdit, docType);
      }
    } else {
      // If no ID is present, it's a new document. Reset everything for the current document type.
      resetCommercialPage(docType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, saleIdToConvert, docType]); // Use stable, primitive dependencies from URL.


  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  // CommercialPageLayout is now a "dumb" component that just displays the state from context.
  return <CommercialPageLayout documentType={docType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
