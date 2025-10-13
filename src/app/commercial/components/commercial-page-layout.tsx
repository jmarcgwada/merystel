
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FilePlus, Sparkles, FileCog } from 'lucide-react';
import type { OrderItem, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type DocumentType = 'invoice' | 'quote' | 'delivery_note';

interface CommercialPageLayoutProps {
  documentType: DocumentType;
}

const docTypeConfig = {
  invoice: {
    title: 'Gestion des Factures',
    subtitle: 'Créez une nouvelle facture ou éditez une facture existante.',
    editTitle: 'Modifier la facture',
    editSubtitle: 'Modifiez les articles et finalisez la facture.',
    saveButton: 'Encaisser la facture',
    updateButton: 'Encaisser la facture',
    filterPrefix: 'Fact-',
    showAcompte: true,
  },
  quote: {
    title: 'Gestion des Devis',
    subtitle: 'Créez un nouveau devis.',
    editTitle: 'Modifier le devis',
    editSubtitle: 'Modifiez les articles et finalisez le devis.',
    saveButton: 'Sauvegarder le devis',
    updateButton: 'Transformer en Facture',
    filterPrefix: 'Devis-',
    showAcompte: false,
  },
  delivery_note: {
    title: 'Gestion des BL',
    subtitle: 'Créez un nouveau bon de livraison.',
    editTitle: 'Modifier le BL',
    editSubtitle: 'Modifiez les articles et finalisez le bon.',
    saveButton: 'Sauvegarder le bon',
    updateButton: 'Transformer en Facture',
    filterPrefix: 'BL-',
    showAcompte: false,
  },
};

function CommercialPageContent({ documentType }: CommercialPageLayoutProps) {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote, 
      clearOrder,
      loadSaleForEditing,
      recordCommercialDocument,
      currentSaleContext,
      items,
      customers,
      setCurrentSaleContext,
      currentSaleId,
      updateItemQuantityInOrder,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const saleIdToEdit = searchParams.get('edit');
  const initialFilter = searchParams.get('filter');
  const newItemId = searchParams.get('newItemId');
  const updatedItemId = searchParams.get('updatedItemId');
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  const config = docTypeConfig[documentType];
  
  // Use a state to manage the current document type being edited, allowing transformation
  const [editingDocType, setEditingDocType] = useState<DocumentType>(documentType);

  const currentConfig = docTypeConfig[editingDocType];

  const pageTitle = saleIdToEdit
    ? `${currentConfig.editTitle} #${currentSaleContext?.ticketNumber || '...'}`
    : currentConfig.title;

  useEffect(() => {
    // This effect now runs only once on mount to set up the context.
    setCurrentSaleContext(prev => ({...prev, documentType: editingDocType}));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDocType]);

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit, documentType);
    } else if (!location.search.includes('edit=')) {
      // If we are not editing, and there's no "edit" in the url, clear the order.
      // This prevents order persistence when navigating between commercial doc types.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, documentType]);

  useEffect(() => {
    if (newItemId) {
      addToOrder(newItemId);
      const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
      router.replace(newUrl, { scroll: false });
    }
  }, [newItemId, addToOrder, router]);
  
  useEffect(() => {
    if (updatedItemId && items) {
      const updatedItem = items.find(i => i.id === updatedItemId);
      if (updatedItem) {
          setOrder(currentOrder => 
            currentOrder.map(orderItem => 
              orderItem.itemId === updatedItemId 
                ? { ...orderItem, name: updatedItem.name, price: updatedItem.price, description: updatedItem.description, description2: updatedItem.description2 }
                : orderItem
            )
          );
      }
      const newUrl = window.location.pathname + window.location.search.replace(`&updatedItemId=${updatedItemId}`, '').replace(`?updatedItemId=${updatedItemId}`, '');
      router.replace(newUrl, { scroll: false });
    }
  }, [updatedItemId, items, setOrder, router]);
  
  const handleTransformToInvoice = () => {
    if (!isReady || !currentSaleContext?.customerId) return;
    setEditingDocType('invoice');
    setCurrentSaleContext(prev => ({ ...prev, documentType: 'invoice', subtotal: totals.subtotal, tax: totals.tax, total: totals.total }));
    toast({ title: 'Transformation en facture', description: 'Le document est maintenant prêt à être encaissé.'});
  };

  const handleSave = async () => {
    if (!isReady || !currentSaleContext?.customerId) return;
    
    // For invoices (new, edited, or transformed) -> open checkout
    if (editingDocType === 'invoice') {
      if (submitHandler) {
        submitHandler(); 
      }
      return;
    }
    
    // For saving quotes or delivery notes
    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'> = {
      items: order,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      status: editingDocType, // status is now the same as documentType for quotes/delivery_notes
      payments: [],
      customerId: currentSaleContext.customerId,
    };
    
    await recordCommercialDocument(doc, editingDocType, currentSaleId || undefined);
  };
  
  const handleGenerateRandom = () => {
    if (!items?.length || !customers?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles et des clients pour générer un document.',
      });
      return;
    }

    clearOrder();

    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    setCurrentSaleContext({ customerId: randomCustomer.id, documentType: documentType });

    const numberOfItems = Math.floor(Math.random() * 4) + 2;
    const newOrder: OrderItem[] = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder) {
            newOrder.push({
                itemId: randomItem.id,
                id: randomItem.id,
                name: randomItem.name,
                price: randomItem.price,
                vatId: randomItem.vatId,
                quantity,
                total: randomItem.price * quantity,
                discount: 0,
                barcode: randomItem.barcode,
            });
        }
    }
    setOrder(newOrder);

    if (documentType === 'invoice') {
      setTimeout(() => {
        if (submitHandler) {
          submitHandler();
        }
      }, 500);
    }

    toast({
      title: 'Document Aléatoire Généré',
      description: `Préparation du document pour ${randomCustomer.name}.`,
    });
  };

  const renderHeaderActions = () => {
    if (initialFilter?.startsWith(config.filterPrefix)) {
        return (
            <Button onClick={() => router.push(`/commercial/${documentType}`)}>
                <FilePlus className="mr-2 h-4 w-4" />
                Nouveau
            </Button>
        )
    }

    if (!isReady) {
       return (
         <Button variant="outline" size="icon" onClick={handleGenerateRandom} title={`Générer ${documentType} aléatoire`} disabled={order.length > 0}>
           <Sparkles className="h-4 w-4" />
         </Button>
       )
    }

    const isQuoteOrDeliveryNote = editingDocType === 'quote' || editingDocType === 'delivery_note';

    return (
        <div className="flex items-center gap-2">
            {isQuoteOrDeliveryNote && (
              <>
                 <Button size="lg" variant="outline" onClick={handleSave}>
                     {saleIdToEdit ? 'Sauvegarder les modifications' : currentConfig.saveButton}
                 </Button>
                 {saleIdToEdit && (
                    <Button size="lg" onClick={handleTransformToInvoice} className="bg-green-600 hover:bg-green-700">
                        <FileCog className="mr-2 h-4 w-4" />
                        {currentConfig.updateButton}
                    </Button>
                 )}
              </>
            )}

            {editingDocType === 'invoice' && (
                 <Button size="lg" onClick={handleSave}>
                     {currentConfig.saveButton}
                 </Button>
            )}
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={pageTitle}
            subtitle={currentConfig.editSubtitle}
        >
          {renderHeaderActions()}
        </PageHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
            <CommercialOrderForm
                order={order} 
                setOrder={setOrder}
                addToOrder={addToOrder}
                updateQuantity={updateQuantity}
                removeFromOrder={removeFromOrder}
                setSubmitHandler={setSubmitHandler}
                updateItemNote={updateItemNote}
                setIsReady={setIsReady}
                showAcompte={currentConfig.showAcompte}
                onTotalsChange={setTotals}
                updateItemQuantityInOrder={updateItemQuantityInOrder}
            />
        </div>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
  );
}

export default function CommercialPageLayout({ documentType }: CommercialPageLayoutProps) {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CommercialPageContent documentType={documentType}/>
        </Suspense>
    )
}
