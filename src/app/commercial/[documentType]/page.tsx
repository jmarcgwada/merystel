
'use client';

import { usePos } from '@/contexts/pos-context';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import React, { useEffect, Suspense, useMemo } from 'react';
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

  const {
    loadSaleForEditing,
    resetCommercialPage,
    currentSaleId,
    loadSaleForConversion,
    order,
    currentSaleContext,
    isLoading: isPosLoading
  } = usePos();
  
  const documentType = params.documentType as string;
  const docType = useMemo(() => typeMap[documentType], [documentType]);
  
  const saleIdToEdit = searchParams.get('edit');
  const saleIdToConvert = searchParams.get('fromConversion');
  const newItemId = searchParams.get('newItemId');
  const updatedItemId = searchParams.get('updatedItemId');

  useEffect(() => {
    // This effect handles the initial loading logic based on URL params.
    const performLoad = async () => {
        if (saleIdToEdit) {
            // Highest priority: editing an existing sale
            if (currentSaleId !== saleIdToEdit) {
                const success = await loadSaleForEditing(saleIdToEdit, docType);
                if (!success) {
                  router.push('/reports');
                }
            }
        } else if (saleIdToConvert) {
            // Conversion logic
            await loadSaleForConversion(saleIdToConvert);
            const newUrl = window.location.pathname; // Remove query params
            router.replace(newUrl, { scroll: false });
        } else if (!newItemId && !updatedItemId) {
            // This is a new document page.
            // Reset only if the context is for a different doc type or doesn't exist
            if (!currentSaleContext || currentSaleContext.documentType !== docType) {
               resetCommercialPage(docType);
            }
        }
    };
    
    if (docType) {
      performLoad();
    }
    
    // We only want this to run when the main identifiers from the URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, saleIdToConvert, docType]); 

  useEffect(() => {
    // This effect handles item additions/updates from the item form page
    if (newItemId && !order.some(item => item.id === newItemId)) {
        // The item should have been added by the context already, so we just clean the URL
        const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
        router.replace(newUrl, { scroll: false });

    } else if (updatedItemId) {
        // The item should have been updated by the context. Clean the URL.
        const newUrl = window.location.pathname + window.location.search.replace(`&updatedItemId=${updatedItemId}`, '').replace(`?updatedItemId=${updatedItemId}`, '');
        router.replace(newUrl, { scroll: false });
    }
  }, [newItemId, updatedItemId, order, router]);


  if (isPosLoading && (saleIdToEdit || !currentSaleContext)) {
    return (
        <div className="p-8">
            <Skeleton className="h-16 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (!docType) {
    return <div className="p-8">Type de document non valide.</div>;
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
