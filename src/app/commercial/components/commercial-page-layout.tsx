
'use client';

import { PageHeader } from '@/components/page-header';
import { CommercialOrderForm } from './commercial-order-form';
import { usePos } from '@/contexts/pos-context';
import { SerialNumberModal } from '../../pos/components/serial-number-modal';
import { VariantSelectionModal } from '../../pos/components/variant-selection-modal';
import { useState, Suspense, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Sparkles, FileCog, Lock, Copy, Trash2, BarChart3, ArrowLeft } from 'lucide-react';
import type { OrderItem, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DocumentType = 'invoice' | 'quote' | 'delivery_note' | 'credit_note';

interface CommercialPageLayoutProps {
  documentType: DocumentType;
  isNavVisible: boolean;
  setIsNavVisible: (visible: boolean) => void;
}

const docTypeConfig = {
  invoice: {
    title: 'Nouvelle Facture',
    editTitle: 'Modifier la facture',
    saveButton: 'Encaisser la facture',
    updateButton: 'Encaisser la facture',
    filterPrefix: 'Fact-',
    showAcompte: true,
  },
  quote: {
    title: 'Nouveau Devis',
    editTitle: 'Modifier le devis',
    saveButton: 'Sauvegarder le devis',
    updateButton: 'Mettre à jour le devis',
    filterPrefix: 'Devis-',
    showAcompte: false,
  },
  delivery_note: {
    title: 'Nouveau Bon de Livraison',
    editTitle: 'Modifier le BL',
    saveButton: 'Sauvegarder le bon',
    updateButton: 'Mettre à jour le bon',
    filterPrefix: 'BL-',
    showAcompte: false,
  },
  credit_note: {
    title: 'Nouvel Avoir',
    editTitle: "Modifier l'avoir",
    saveButton: "Générer l'avoir",
    updateButton: "Mettre à jour l'avoir",
    filterPrefix: 'Avoir-',
    showAcompte: false,
  }
};

const typeMap: Record<DocumentType, string> = {
  invoice: 'invoices',
  quote: 'quotes',
  delivery_note: 'delivery-notes',
  credit_note: 'credit-notes',
};


function CommercialPageContent({ documentType, isNavVisible, setIsNavVisible }: CommercialPageLayoutProps) {
  const { 
      addToOrder, 
      order, 
      setOrder, 
      updateQuantity, 
      removeFromOrder, 
      updateItemNote,
      currentSaleContext,
      items,
      customers,
      setCurrentSaleContext,
      currentSaleId,
      setCurrentSaleId,
      updateItemQuantityInOrder,
      updateItemPrice,
      convertToInvoice,
      clearOrder,
      lastReportsUrl,
      recordCommercialDocument,
      vatRates,
  } = usePos();
  
  const isEditing = !!currentSaleId;
  const isReadOnly = currentSaleContext?.isReadOnly ?? false;

  const formRef = useRef<{ submit: (notes?: string) => void }>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const config = docTypeConfig[documentType];
  const canBeConverted = isEditing && (documentType === 'quote' || documentType === 'delivery_note') && currentSaleContext?.status !== 'invoiced';

  const handleSave = useCallback(async () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  const handleConvertToInvoice = useCallback(async () => {
    if (!currentSaleId) return;
    convertToInvoice(currentSaleId);
  }, [currentSaleId, convertToInvoice]);

  const handleDuplicate = () => {
    if (!order || order.length === 0) {
        toast({ variant: "destructive", title: "Rien à dupliquer" });
        return;
    }
    const duplicatedItems = order.map(item => ({ ...item, id: uuidv4() }));
    const customerId = currentSaleContext?.customerId;
    const notes = currentSaleContext?.notes;
    const nextDocType = documentType;
    const pathSegment = typeMap[nextDocType] || `${nextDocType}s`;
    const nextPath = `/commercial/${pathSegment}`;
    const nextDocTypeName = docTypeConfig[nextDocType].title.toLowerCase() || 'document';
    
    // This is the correct logic:
    // 1. Clear current sale ID to exit edit mode.
    setCurrentSaleId(null); 
    // 2. Set the context for a NEW document, carrying over the customer.
    setCurrentSaleContext({ 
        documentType: nextDocType,
        customerId: customerId,
        notes: notes,
    });
    // 3. Set the order with newly identified items.
    setOrder(duplicatedItems);
    
    // 4. Navigate to the creation page.
    router.push(nextPath);
    toast({ title: 'Pièce dupliquée', description: `Une nouvelle ${nextDocTypeName} a été créée.` });
  };
  
const handleGenerateRandom = () => {
    if (!items?.length || !customers?.length || !vatRates?.length) {
      toast({
        variant: 'destructive',
        title: 'Données insuffisantes',
        description: 'Veuillez ajouter des articles, des clients et des taux de TVA pour générer un document.',
      });
      return;
    }

    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const numberOfItems = Math.floor(Math.random() * 4) + 2;
    const newOrder: OrderItem[] = [];
    
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        
        const existingInNewOrder = newOrder.find(item => item.itemId === randomItem.id);
        if(!existingInNewOrder) {
            newOrder.push({
                itemId: randomItem.id,
                id: uuidv4(),
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
    
    let subtotal = 0;
    let tax = 0;
    newOrder.forEach(item => {
        const vatInfo = vatRates.find(v => v.id === item.vatId);
        const rate = vatInfo ? vatInfo.rate / 100 : 0;
        const itemHT = item.total / (1 + rate);
        subtotal += itemHT;
        tax += item.total - itemHT;
    });

    const doc: Omit<Sale, 'id' | 'date' | 'ticketNumber'> = {
        items: newOrder,
        subtotal: subtotal,
        tax: tax,
        total: subtotal + tax,
        status: documentType, 
        payments: [],
        customerId: randomCustomer.id,
        documentType: documentType,
    };
    
    recordCommercialDocument(doc, documentType);

    toast({
      title: 'Pièce Aléatoire Générée',
      description: `Une nouvelle pièce a été créée pour ${randomCustomer.name}.`,
    });
  };

  const pageTitle = (
    <div className="flex items-center gap-4">
      <span>{isEditing ? config.editTitle : config.title}</span>
      {currentSaleContext?.ticketNumber && <Badge variant="secondary" className="text-lg font-mono">#{currentSaleContext.ticketNumber}</Badge>}
      {isReadOnly && <Badge variant="destructive" className="text-base font-semibold"><Lock className="mr-2 h-3 w-3" />Lecture Seule</Badge>}
    </div>
  );

  const pageSubtitle = isEditing
    ? (isReadOnly ? "Cette pièce est finalisée et ne peut plus être modifiée." : "Mise à jour du document.")
    : `Création d'une nouvelle pièce.`;

  return (
    <>
    <div className="h-full flex flex-col">
       <div className="container mx-auto px-4 pt-0 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
        >
            <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2">
                    {!isEditing && (
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
                        <Button variant="outline" onClick={() => setConfirmOpen(true)}>
                            <FileCog className="mr-2 h-4 w-4"/>
                            Transformer en Facture
                        </Button>
                    )}

                    {order.length > 0 && !isReadOnly && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOrder([])}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Tout effacer
                    </Button>
                    )}

                    {isReadOnly ? (
                        <Button size="lg" onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                        </Button>
                    ) : (
                        <Button size="lg" onClick={handleSave}>
                            {isEditing ? config.updateButton : config.saveButton}
                        </Button>
                    )}
                </div>
            </div>
        </PageHeader>
        
        <fieldset disabled={isReadOnly} className="flex-1 flex flex-col min-h-0 mt-4 group">
          <div className="flex-1 flex flex-col min-h-0 group-disabled:opacity-70">
              <CommercialOrderForm
                  ref={formRef}
                  order={order} 
                  setOrder={setOrder}
                  addToOrder={addToOrder}
                  updateQuantity={updateQuantity}
                  removeFromOrder={removeFromOrder}
                  updateItemNote={updateItemNote}
                  updateItemPrice={updateItemPrice}
                  showAcompte={config.showAcompte}
                  onTotalsChange={setTotals}
                  updateItemQuantityInOrder={updateItemQuantityInOrder}
                  documentType={documentType}
              />
          </div>
        </fieldset>
      </div>
      <SerialNumberModal />
      <VariantSelectionModal />
    </div>
    <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la transformation ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Voulez-vous vraiment transformer cette pièce en facture ? Une nouvelle facture sera créée.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    handleConvertToInvoice();
                    setConfirmOpen(false);
                }}>
                    Confirmer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function CommercialPageLayout({ documentType, isNavVisible, setIsNavVisible }: CommercialPageLayoutProps) {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CommercialPageContent documentType={documentType} isNavVisible={isNavVisible} setIsNavVisible={setIsNavVisible}/>
        </Suspense>
    )
}
