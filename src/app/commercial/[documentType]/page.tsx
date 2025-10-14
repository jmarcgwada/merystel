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

  const { loadSaleForEditing, resetCommercialPage, order, currentSaleId } = usePos();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];
  
  const saleIdToEdit = searchParams.get('edit');
  const fromConversion = searchParams.get('fromConversion');

  useEffect(() => {
    // This effect runs ONLY when the key parameters from the URL change.
    // It decides whether to load an existing sale or reset for a new one.
    if (fromConversion) {
      // The context is already prepared for conversion, so we do nothing.
      return;
    }

    if (saleIdToEdit) {
      // If we are editing, load the sale.
      loadSaleForEditing(saleIdToEdit, docType);
    } else {
      // Otherwise, it's a new document, so reset the page.
      resetCommercialPage(docType);
    }
  }, [saleIdToEdit, fromConversion, docType, loadSaleForEditing, resetCommercialPage]);


  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  // The layout component is now "dumb" and just displays what's in the context.
  return <CommercialPageLayout documentType={docType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
