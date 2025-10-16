'use client';

import { usePos } from '@/contexts/pos-context';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import React, { useEffect, Suspense } from 'react';
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

  const { loadSaleForEditing, resetCommercialPage, currentSaleId, loadSaleForConversion, order, setOrder, setCurrentSaleContext, isLoading } = usePos();
  
  const documentType = params.documentType as string;
  const docType = typeMap[documentType];
  
  const saleIdToEdit = searchParams.get('edit');
  const saleIdToConvert = searchParams.get('fromConversion');
  const newItemId = searchParams.get('newItemId');
  const updatedItemId = searchParams.get('updatedItemId');

  useEffect(() => {
    // This effect handles the initial loading logic based on URL params.
    // It should run only once when the key parameters change.

    const performLoad = async () => {
        if (saleIdToEdit) {
            // If we are editing, this is the highest priority
            if (currentSaleId !== saleIdToEdit) {
                const success = await loadSaleForEditing(saleIdToEdit, docType);
                if (!success) {
                  // Handle case where sale is not found, maybe redirect or show error
                  router.push('/reports');
                }
            }
        } else if (saleIdToConvert) {
            // If converting, load the source sale data into a new context
            await loadSaleForConversion(saleIdToConvert);
            // Remove query param to avoid re-triggering on refresh
            window.history.replaceState({}, '', `/commercial/${documentType}`);
        } else if (!newItemId && !updatedItemId) {
            // Only reset if it's a truly new page, not a redirect from item creation/update
             if(currentSaleContext?.documentType !== docType) {
                resetCommercialPage(docType);
            }
        }
    };
    
    performLoad();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, saleIdToConvert, docType]); // Dependencies are stable identifiers from the URL

  useEffect(() => {
    // This effect handles item additions/updates from the item form page
    if (newItemId && !order.some(item => item.id === newItemId)) {
        // Handle adding the new item (logic might be needed in usePos)
        // For now, we assume addToOrder can be called if we have the full item data.
        // This part might need more context on how to get item details from just an ID.
        // A simple redirect cleanup for now:
        const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
        router.replace(newUrl, { scroll: false });

    } else if (updatedItemId) {
        // Handle updating the view if an item was edited
        const newUrl = window.location.pathname + window.location.search.replace(`&updatedItemId=${updatedItemId}`, '').replace(`?updatedItemId=${updatedItemId}`, '');
        router.replace(newUrl, { scroll: false });
    }
  }, [newItemId, updatedItemId, order, router]);


  if (isLoading && saleIdToEdit) {
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
