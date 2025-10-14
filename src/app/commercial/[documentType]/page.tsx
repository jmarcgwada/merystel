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
  
  // Extraire les valeurs de l'URL une seule fois. Ce sont des dépendances stables.
  const saleIdToEdit = searchParams.get('edit');
  const fromConversion = searchParams.get('fromConversion');

  useEffect(() => {
    // Ce hook s'exécute uniquement si les paramètres de l'URL changent.
    if (fromConversion) {
      // Si on vient d'une conversion, le contexte est déjà prêt. On ne fait rien.
      return;
    }

    if (saleIdToEdit) {
      // Si on édite, on charge la pièce.
      loadSaleForEditing(saleIdToEdit, docType);
    } else {
      // Sinon (nouvelle pièce), on réinitialise.
      resetCommercialPage(docType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, fromConversion, docType]);


  if (!docType) {
    return <div>Type de document non valide</div>;
  }

  // Le layout est maintenant "passif" et ne fait qu'afficher ce qui est dans le contexte.
  return <CommercialPageLayout documentType={docType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
