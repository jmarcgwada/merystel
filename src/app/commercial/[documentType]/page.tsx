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

  const { loadSaleForEditing, resetCommercialPage, currentSaleId } = usePos();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];
  
  const saleIdToEdit = searchParams.get('edit');
  const fromConversion = searchParams.get('fromConversion');

  useEffect(() => {
    // This effect runs only once when the page loads or when key parameters change.
    // It decides whether to load an existing document for editing or reset for a new one.
    // This is the SINGLE SOURCE OF TRUTH for loading/resetting.

    // If we just converted a document, the context is already set. Do nothing.
    if (fromConversion) {
      return;
    }
    
    if (saleIdToEdit) {
      // If an ID is present, it's an edit. Load it.
      // The check inside loadSaleForEditing will prevent re-loading if the context is already correct.
      if (currentSaleId !== saleIdToEdit) {
        loadSaleForEditing(saleIdToEdit, docType);
      }
    } else {
      // If no ID is present, it's a new document. Reset everything.
      resetCommercialPage(docType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, docType, fromConversion]); // Stable dependencies


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
