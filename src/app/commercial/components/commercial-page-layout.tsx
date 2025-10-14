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
      transformToInvoice,
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
  const newItemId = searchParams.get('newItemId');
  const updatedItemId = searchParams.get('updatedItemId');
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  const config = docTypeConfig[documentType];
  
  const [editingDocType, setEditingDocType] = useState<DocumentType>(documentType);

  const currentConfig = docTypeConfig[editingDocType];

  const isEditingExistingDoc = !!saleIdToEdit;
  const isQuoteOrDeliveryNote = editingDocType === 'quote' || editingDocType === 'delivery_note';

  useEffect(() => {
    setCurrentSaleContext(prev => ({...prev, documentType: editingDocType}));
  }, [editingDocType, setCurrentSaleContext]);

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit, documentType);
    }
  }, [saleIdToEdit, documentType, loadSaleForEditing]);


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
    if (!currentSaleId || !currentSaleContext) return;
    
    const saleToTransform: Sale = {
        id: currentSaleId,
        ...currentSaleContext,
        items: order,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        payments: [],
        status: currentSaleContext.status || 'pending',
        ticketNumber: currentSaleContext.ticketNumber || '',
        date: currentSaleContext.date || new Date(),
    };
    transformToInvoice(saleToTransform);
};

  const handleSave = async () => {
    if (!isReady || !currentSaleContext?.customerId) return;
    
    if (editingDocType === 'invoice') {
      if (submitHandler) {
        submitHandler(); 
      }
      return;
    }
    
    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber' | 'userId' | 'userName'> = {
      items: order,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      status: editingDocType,
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

  const pageTitle = isEditingExistingDoc ? currentConfig.editTitle : currentConfig.title;

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
          title={
            <div className="flex items-center gap-4">
              <span>{pageTitle}</span>
              {isEditingExistingDoc && (
                <span className="font-mono text-muted-foreground text-xl">
                  #{currentSaleContext?.ticketNumber || '...'}
                </span>
              )}
            </div>
          }
          subtitle={isEditingExistingDoc ? currentConfig.editSubtitle : currentConfig.subtitle}
        >
          <div className="flex items-center gap-2">
            {isEditingExistingDoc && isQuoteOrDeliveryNote && (
              <Button
                size="lg"
                onClick={handleTransformToInvoice}
                disabled={!isReady}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileCog className="mr-2 h-4 w-4" />
                {currentConfig.updateButton}
              </Button>
            )}

            {!isEditingExistingDoc && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleGenerateRandom}
                title={`Générer ${documentType} aléatoire`}
                disabled={order.length > 0}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}

            <Button size="lg" onClick={handleSave} disabled={!isReady}>
              {isEditingExistingDoc
                ? (isQuoteOrDeliveryNote ? 'Sauvegarder les modifications' : currentConfig.updateButton)
                : currentConfig.saveButton}
            </Button>
          </div>
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
