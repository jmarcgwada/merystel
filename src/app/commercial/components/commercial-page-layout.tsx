
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, FileCog } from 'lucide-react';
import type { OrderItem, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type DocumentType = 'invoice' | 'quote' | 'delivery_note';

interface CommercialPageLayoutProps {
  documentType: DocumentType;
}

const docTypeConfig = {
  invoice: {
    title: 'Gestion des Factures',
    subtitle: 'Créez une nouvelle facture ou éditez une facture existante.',
    editTitle: 'Modifier la facture',
    saveButton: 'Encaisser la facture',
    updateButton: 'Encaisser la facture',
    filterPrefix: 'Fact-',
    showAcompte: true,
  },
  quote: {
    title: 'Gestion des Devis',
    subtitle: "Créez un nouveau devis.",
    editTitle: 'Modifier le devis',
    saveButton: 'Sauvegarder le devis',
    updateButton: 'Mettre à jour le devis',
    filterPrefix: 'Devis-',
    showAcompte: false,
  },
  delivery_note: {
    title: 'Gestion des BL',
    subtitle: 'Créez un nouveau bon de livraison.',
    editTitle: 'Modifier le BL',
    saveButton: 'Sauvegarder le bon',
    updateButton: 'Mettre à jour le bon',
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
      recordCommercialDocument,
      currentSaleContext,
      items,
      customers,
      setCurrentSaleContext,
      currentSaleId,
      updateItemQuantityInOrder,
      resetCommercialPage,
      convertToInvoice,
      loadSaleForEditing,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const saleIdToEdit = searchParams.get('edit');

  const isEditingExistingDoc = !!currentSaleId && saleIdToEdit === currentSaleId;
  const config = docTypeConfig[documentType];
  const canBeConverted = isEditingExistingDoc && (documentType === 'quote' || documentType === 'delivery_note') && currentSaleContext?.status !== 'invoiced';

  
  useEffect(() => {
    const saleId = searchParams.get('edit');
    if (currentSaleContext?.fromConversion) {
      // This is a conversion, do not reset the page.
      // The context has been prepared by `convertToInvoice`.
      // We need to clean up the flag so subsequent navigations work correctly.
      setCurrentSaleContext(prev => ({...prev, fromConversion: false}));
    } else if (saleId) {
      loadSaleForEditing(saleId, documentType);
    } else {
      resetCommercialPage(documentType);
    }
  }, [documentType, searchParams, loadSaleForEditing, resetCommercialPage, currentSaleContext?.fromConversion, setCurrentSaleContext]);


  const handleSave = useCallback(async () => {
    if (!isReady || !currentSaleContext?.customerId) return;
    
    if (documentType === 'invoice') {
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
      status: documentType,
      payments: [],
      customerId: currentSaleContext.customerId,
    };
    
    await recordCommercialDocument(doc, documentType, currentSaleId || undefined);
  }, [isReady, currentSaleContext, documentType, submitHandler, order, totals, recordCommercialDocument, currentSaleId]);

  const handleConvertToInvoice = useCallback(async () => {
    if (!currentSaleId) return;
    convertToInvoice(currentSaleId);
    router.push(`/commercial/invoices`);
  }, [currentSaleId, convertToInvoice, router]);
  
  const handleGenerateRandom = () => {
    if (!items?.length || !customers?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles et des clients pour générer un document.',
      });
      return;
    }

    resetCommercialPage(documentType);

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

  const pageTitle = (
    <div className="flex items-center gap-4">
      <span>{isEditingExistingDoc ? config.editTitle : config.title}</span>
      {isEditingExistingDoc && currentSaleContext?.ticketNumber && <Badge variant="secondary" className="text-lg">#{currentSaleContext.ticketNumber}</Badge>}
    </div>
  );

  const pageSubtitle = isEditingExistingDoc
    ? `Mise à jour du document.`
    : config.subtitle;

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
        >
          <div className="flex items-center gap-2">
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

            {canBeConverted && (
                <Button variant="outline" onClick={handleConvertToInvoice}>
                    <FileCog className="mr-2 h-4 w-4"/>
                    Transformer en Facture
                </Button>
            )}

            <Button size="lg" onClick={handleSave} disabled={!isReady}>
              {isEditingExistingDoc
                ? config.updateButton
                : config.saveButton}
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
                showAcompte={config.showAcompte}
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
