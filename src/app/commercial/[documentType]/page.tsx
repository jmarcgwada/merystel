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

// This component is now simplified and mainly acts as a wrapper.
// The core logic is moved to CommercialPageLayout to avoid effect conflicts.
export default function DocumentPage() {
  const params = useParams();
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];

  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CommercialPageLayout documentType={docType} />
    </Suspense>
  );
}
