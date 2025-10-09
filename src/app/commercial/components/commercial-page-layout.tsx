
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FilePlus, Sparkles } from 'lucide-react';
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
    saveButton: 'Sauvegarder la facture',
    updateButton: 'Mettre à jour la facture',
    filterPrefix: 'Fact-',
    showAcompte: true,
  },
  quote: {
    title: 'Gestion des Devis',
    subtitle: 'Créez un nouveau devis.',
    editTitle: 'Modifier le devis',
    editSubtitle: 'Modifiez les articles et finalisez le devis.',
    saveButton: 'Sauvegarder le devis',
    updateButton: 'Mettre à jour le devis',
    filterPrefix: 'Devis-',
    showAcompte: false,
  },
  delivery_note: {
    title: 'Gestion des Bons de Livraison',
    subtitle: 'Créez un nouveau bon de livraison.',
    editTitle: 'Modifier le bon de livraison',
    editSubtitle: 'Modifiez les articles et finalisez le bon.',
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
      clearOrder,
      loadSaleForEditing,
      recordCommercialDocument,
      orderTotal,
      orderTax,
      currentSaleContext,
      items,
      customers,
      setCurrentSaleContext,
  } = usePos();
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const saleIdToEdit = searchParams.get('edit');
  const initialFilter = searchParams.get('filter');
  const newItemId = searchParams.get('newItemId');

  const config = docTypeConfig[documentType];

  useEffect(() => {
    setCurrentSaleContext(prev => ({...prev, documentType: documentType}));
    if (newItemId) {
      addToOrder(newItemId);
      const newUrl = window.location.pathname + window.location.search.replace(`&newItemId=${newItemId}`, '').replace(`?newItemId=${newItemId}`, '');
      router.replace(newUrl, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saleIdToEdit) {
      loadSaleForEditing(saleIdToEdit, documentType);
    } else {
        // Only clear the order if we are NOT editing, to preserve state on component remount.
        if (order.length > 0 && !location.search.includes('edit')) {
             clearOrder();
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleIdToEdit, documentType]);
  
  const handleSave = useCallback(() => {
    if (!isReady || !currentSaleContext?.customerId) return;
    
    if (documentType === 'invoice') {
      if (submitHandler) {
        submitHandler(); // This will trigger the checkout modal from the form
      }
      return;
    }

    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
      items: order,
      subtotal: orderTotal,
      tax: orderTax,
      total: orderTotal + orderTax,
      status: documentType === 'quote' ? 'quote' : 'delivery_note',
      payments: [],
      customerId: currentSaleContext.customerId,
    };
    
    recordCommercialDocument(doc, documentType, saleIdToEdit || undefined);
    
  }, [isReady, currentSaleContext, documentType, order, orderTotal, orderTax, recordCommercialDocument, saleIdToEdit, submitHandler]);
  
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
    setCurrentSaleContext({ customerId: randomCustomer.id, documentType: documentType, isInvoice: documentType === 'invoice' });

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

    const saveButtonText = saleIdToEdit ? config.updateButton : config.saveButton;
    
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGenerateRandom} title={`Générer ${documentType} aléatoire`}>
              <Sparkles className="h-4 w-4" />
            </Button>
            {documentType === 'invoice' ? (
                 isReady && submitHandler ? (
                    <Button size="lg" onClick={submitHandler}>{saveButtonText}</Button>
                 ) : (
                    <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? `/reports?filter=${config.filterPrefix}` : '/dashboard')}>
                        <ArrowLeft />
                        Retour
                    </Button>
                )
            ) : (
                <>
                <Button size="lg" onClick={handleSave} disabled={!isReady}>{saveButtonText}</Button>
                 <Button size="lg" variant="outline" className="btn-back" onClick={() => router.push(saleIdToEdit ? `/reports?filter=${config.filterPrefix}` : '/dashboard')}>
                    <ArrowLeft />
                    Retour
                </Button>
                </>
            )}
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <PageHeader
            title={saleIdToEdit ? config.editTitle : config.title}
            subtitle={saleIdToEdit ? config.editSubtitle : config.subtitle}
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
                showAcompte={config.showAcompte}
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
