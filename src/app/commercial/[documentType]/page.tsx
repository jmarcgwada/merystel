'use client';

import CommercialPageLayout from '../components/commercial-page-layout';

type DocumentType = 'invoices' | 'quotes' | 'delivery-notes';

const typeMap: Record<DocumentType, 'invoice' | 'quote' | 'delivery_note'> = {
  invoices: 'invoice',
  quotes: 'quote',
  'delivery-notes': 'delivery_note',
};

export default function DocumentPage({ params }: { params: { documentType: DocumentType } }) {
  const docType = typeMap[params.documentType];

  if (!docType) {
    // Handle invalid document types, e.g., show a 404 page
    return <div>Type de document non valide</div>;
  }

  return <CommercialPageLayout documentType={docType} />;
}
