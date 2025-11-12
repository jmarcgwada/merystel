
'use client';

import { usePos } from '@/contexts/pos-context';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import React, { useEffect, Suspense, useState } from 'react';
import CommercialPageLayout from '../components/commercial-page-layout';
import { Skeleton } from '@/components/ui/skeleton';

const typeMap: Record<string, 'invoice' | 'quote' | 'delivery_note' | 'credit_note'> = {
  invoices: 'invoice',
  quotes: 'quote',
  'delivery-notes': 'delivery_note',
  'credit-notes': 'credit_note',
};

function DocumentPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = params.documentType as string;
  const saleIdToEdit = searchParams.get('edit');
  const fromConversion = searchParams.get('fromConversion');

  const {
    loadSaleForEditing,
    resetCommercialPage,
    currentSaleId,
    loadSaleForConversion,
    isLoading: isPosLoading,
    currentSaleContext
  } = usePos();
  
  const mappedDocType = typeMap[docType];
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (!mappedDocType || initialLoadComplete) return;

    const performLoad = async () => {
      if (saleIdToEdit) {
        if (currentSaleId !== saleIdToEdit) {
            await loadSaleForEditing(saleIdToEdit, mappedDocType);
        }
      } else if (fromConversion) {
        if (!currentSaleContext?.fromConversion) {
            await loadSaleForConversion(fromConversion);
             // Clean the URL to prevent re-triggering
            router.replace(`/commercial/${docType}`, { scroll: false });
        }
      } else {
         if (!currentSaleId) {
             resetCommercialPage(mappedDocType);
         }
      }
      setInitialLoadComplete(true);
    };

    performLoad();

  }, [
    mappedDocType, 
    saleIdToEdit, 
    fromConversion, 
    loadSaleForEditing, 
    loadSaleForConversion, 
    resetCommercialPage, 
    router, 
    docType,
    currentSaleId,
    currentSaleContext,
    initialLoadComplete
  ]);
  
  useEffect(() => {
    // This effect ensures that if the user navigates away and back, the state is correct.
    if (!saleIdToEdit && !fromConversion && currentSaleId) {
        if(mappedDocType !== currentSaleContext?.documentType) {
            resetCommercialPage(mappedDocType);
        }
    }
  }, [pathname, saleIdToEdit, fromConversion, currentSaleId, mappedDocType, resetCommercialPage, currentSaleContext]);


  if (isPosLoading && !initialLoadComplete) {
    return (
        <div className="p-8">
            <Skeleton className="h-16 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (!mappedDocType) {
    return <div className="p-8">Type de document non valide.</div>;
  }

  return <CommercialPageLayout documentType={mappedDocType} />;
}


export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
