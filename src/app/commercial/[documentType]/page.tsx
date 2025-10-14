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
    // This effect is the SINGLE SOURCE OF TRUTH for loading a document.
    // It runs only when essential URL parameters change.

    if (saleIdToConvert) {
      // If we are converting, load the source document into the new invoice context
      loadSaleForConversion(saleIdToConvert);
      // Remove query param to avoid re-triggering on refresh
      window.history.replaceState({}, '', window.location.pathname);
    } else if (saleIdToEdit) {
      // If an ID is present for editing, load it, only if it's not already the one in the context.
      if (currentSaleId !== saleIdToEdit) {
        loadSaleForEditing(saleIdToEdit, docType);
      }
    }
    // No 'else' block: The page will no longer reset itself automatically.
    // A new document is only created via an explicit user action (e.g., clicking a "New" button
    // which would call resetCommercialPage before navigating).
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, saleIdToConvert, docType]); // Use stable, primitive dependencies from URL.


  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  // CommercialPageLayout is a "dumb" component that just displays the state from context.
  return <CommercialPageLayout documentType={docType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
