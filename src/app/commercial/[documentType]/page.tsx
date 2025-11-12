
'use client';

import { usePos } from '@/contexts/pos-context';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import React, { useEffect, Suspense, useMemo, useState } from 'react';
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
  
  const docType = useMemo(() => typeMap[params.documentType as string], [params.documentType]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const saleIdToEdit = searchParams.get('edit');
    const saleIdToConvert = searchParams.get('fromConversion');

    const performLoad = async () => {
      if (saleIdToEdit) {
        if (currentSaleId !== saleIdToEdit) {
          const success = await loadSaleForEditing(saleIdToEdit, docType);
          if (!success) {
            router.push('/reports');
          }
        }
      } else if (saleIdToConvert) {
        await loadSaleForConversion(saleIdToConvert);
        const newUrl = window.location.pathname; // Remove query params
        router.replace(newUrl, { scroll: false });
      } else {
        if (!currentSaleId && (!currentSaleContext || currentSaleContext.documentType !== docType)) {
          resetCommercialPage(docType);
        }
      }
    };
    
    if (docType && !initialLoadDone) {
      performLoad();
      setInitialLoadDone(true);
    }
  }, [docType, searchParams, loadSaleForEditing, loadSaleForConversion, resetCommercialPage, router, currentSaleId, currentSaleContext, initialLoadDone]);

  useEffect(() => {
    const newItemId = searchParams.get('newItemId');
    const updatedItemId = searchParams.get('updatedItemId');
    if (newItemId && !order.some(item => item.id === newItemId)) {
        const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
        router.replace(newUrl, { scroll: false });
    } else if (updatedItemId) {
        const newUrl = window.location.pathname + window.location.search.replace(`&updatedItemId=${updatedItemId}`, '').replace(`?updatedItemId=${updatedItemId}`, '');
        router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, order, router]);


  if (isPosLoading && !currentSaleContext) {
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
