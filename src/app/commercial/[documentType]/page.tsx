'use client';

import CommercialPageLayout from '../components/commercial-page-layout';
import React from 'react';

type DocumentType = 'invoices' | 'quotes' | 'delivery-notes';

const typeMap: Record<DocumentType, 'invoice' | 'quote' | 'delivery_note'> = {
  invoices: 'invoice',
  quotes: 'quote',
  'delivery-notes': 'delivery_note',
};

export default function DocumentPage({ params }: { params: { documentType: DocumentType } }) {
  const resolvedParams = React.use(params);
  const docType = typeMap[resolvedParams.documentType];

  if (!docType) {
    // Handle invalid document types, e.g., show a 404 page
    return <div>Type de document non valide</div>;
  }

  return <CommercialPageLayout documentType={docType} />;
}
