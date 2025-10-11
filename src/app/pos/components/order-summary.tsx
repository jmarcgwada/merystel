

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePos } from '@/contexts/pos-context';
import { useToast } from '@/hooks/use-toast';
import { X, Hand, Eraser, Delete, Check, Plus, Minus, ShoppingCart, Utensils, CreditCard, Save, ArrowLeft, ScanLine, Keyboard as KeyboardIcon, History, Printer, Edit, User as UserIcon, Calendar, Clock, Copy, ArrowRight, Eye, Pencil } from 'lucide-react';
import { CheckoutModal } from './checkout-modal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { OrderItem, Sale, Item } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useKeyboard } from '@/contexts/keyboard-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';
import { EditItemDialog } from '@/app/commercial/components/edit-item-dialog';


const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined, formatString: string}) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (!date) {
            setFormattedDate('Date non disponible');
            return;
        }
        
        let jsDate: Date;
        if (date instanceof Date) {
            jsDate = date;
        } else if (date && typeof (date as Timestamp)?.toDate === 'function') {
            jsDate = (date as Timestamp).toDate();
        } else {
            jsDate = new Date(date as any);
        }

        if (!isNaN(jsDate.getTime())) {
            setFormattedDate(format(jsDate, formatString, { locale: fr }));
        } else {
            setFormattedDate('Date invalide');
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}


const KeypadButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button variant="outline" className={cn("text-xl h-12", className)} onClick={onClick}>
        {children}
    </Button>
)

// Function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return hex; // Fallback to original color if format is wrong
};

export function OrderSummary() {
  const { 
    order, 
    setOrder,
    dynamicBgImage,
    enableDynamicBg,
    dynamicBgOpacity,
    readOnlyOrder, 
    setReadOnlyOrder,
    lastDirectSale,
    lastRestaurantSale,
    loadTicketForViewing,
    removeFromOrder, 
    clearOrder, 
    orderTotal, 
    orderTax,
    selectedTable, 
    holdOrder, 
    setSelectedTable,
    applyDiscount,
    updateQuantityFromKeypad,
    updateItemNote,
    setIsKeypadOpen,
    saveTableOrderAndExit,
    promoteTableToTicket,
    showTicketImages,
    descriptionDisplay,
    isKeypadOpen,
    currentSaleId,
    currentSaleContext,
    setCurrentSaleId,
    setCurrentSaleContext,
    directSaleBackgroundColor,
    restaurantModeBackgroundColor,
    directSaleBgOpacity,
    restaurantModeBgOpacity,
    enableSerialNumber,
    setSerialNumberItem,
    cameFromRestaurant,
    setCameFromRestaurant,
    sales,
    showNavConfirm,
    user,
    items: allItems,
    updateOrderItem,
  } = usePos();
  
  const { toast } = useToast();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [mode, setMode] = useState<'quantity' | 'discountPercent' | 'discountFixed' | 'note'>('quantity');
  const keypadInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldReplaceValue, setShouldReplaceValue] = useState(true);

  const { setTargetInput, inputValue, targetInput } = useKeyboard();
  const itemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const [isClient, setIsClient] = useState(false);

  // State for EditItemDialog
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (targetInput?.name === `item-note-${selectedItem?.id}` && selectedItem) {
        updateItemNote(selectedItem.id, inputValue);
        setKeypadValue(inputValue);
    }
  }, [inputValue, targetInput, selectedItem, updateItemNote]);

  const [isClosingTable, setIsClosingTable] = useState(false);
  useEffect(() => {
    // When the selected table ID changes, reset the "closing" state
    setIsClosingTable(false);
  }, [selectedTable?.id]);


  useEffect(() => {
    if (selectedItem && itemRefs.current[selectedItem.id] && scrollAreaRef.current) {
        const itemElement = itemRefs.current[selectedItem.id];
        if (itemElement) {
            const scrollArea = scrollAreaRef.current;
            const itemTop = itemElement.offsetTop;
            const itemBottom = itemTop + itemElement.offsetHeight;
            const scrollAreaTop = scrollArea.scrollTop;
            const scrollAreaBottom = scrollAreaTop + scrollArea.clientHeight;

            if (itemTop < scrollAreaTop) {
                scrollArea.scrollTop = itemTop;
            } else if (itemBottom > scrollAreaBottom) {
                scrollArea.scrollTop = itemBottom - scrollArea.clientHeight;
            }
        }
    }
  }, [selectedItem]);

  useEffect(() => {
    setIsKeypadOpen(!!selectedItem);
  }, [selectedItem, setIsKeypadOpen]);

  useEffect(() => {
    if (selectedItem) {
        if (mode === 'note') {
            noteInputRef.current?.focus();
            noteInputRef.current?.select();
        } else if (keypadInputRef.current) {
            keypadInputRef.current.focus();
            keypadInputRef.current.select();
        }
        setShouldReplaceValue(true);
    }
  }, [selectedItem, mode]);

  const handleItemSelect = (item: OrderItem) => {
    if (readOnlyOrder) return; // Disable interaction in read-only mode
    if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setKeypadValue('');
    } else {
        setSelectedItem(item);
        setMode('quantity');
        setKeypadValue(item.quantity.toString());
    }
  }

  const handleModeChange = (newMode: 'quantity' | 'discountPercent' | 'discountFixed' | 'note') => {
    setMode(newMode);
    if (newMode === 'quantity' && selectedItem) {
        setKeypadValue(selectedItem.quantity.toString());
    } else if (newMode === 'note' && selectedItem) {
        setKeypadValue(selectedItem.note || '');
    } else {
        setKeypadValue('');
    }
    setShouldReplaceValue(true);
  }

  const handleKeypadInput = (value: string) => {
    if (document.activeElement === keypadInputRef.current) {
        setShouldReplaceValue(false);
    }
    
    if (value === 'del') {
      setKeypadValue(prev => prev.slice(0, -1));
    } else if (value === 'C') {
        setKeypadValue('');
    } else {
      if (shouldReplaceValue) {
        setKeypadValue(value);
        setShouldReplaceValue(false);
      } else {
        setKeypadValue(prev => prev + value);
      }
    }
  }
  
  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeypadValue(e.target.value);
    if (shouldReplaceValue) {
      setShouldReplaceValue(false);
    }
  };

  const handleNoteInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeypadValue(e.target.value);
  }

  const handleOpenVirtualKeyboardForNote = () => {
    if(!selectedItem || !noteInputRef.current) return;
    setTargetInput({
        value: selectedItem.note || '',
        name: `item-note-${selectedItem.id}`,
        ref: noteInputRef,
    });
  }


  const handleApply = () => {
    if (!selectedItem) return;
    
    if (mode === 'note') {
        updateItemNote(selectedItem.id, keypadValue);
    } else {
        const value = parseFloat(keypadValue);
        if(isNaN(value)) return;
        
        if (mode === 'quantity') {
            updateQuantityFromKeypad(selectedItem.id, value);
        } else if (mode === 'discountPercent') {
            applyDiscount(selectedItem.id, value, 'percentage');
        } else if (mode === 'discountFixed') {
            applyDiscount(selectedItem.id, value, 'fixed');
        }
    }
    setSelectedItem(null);
    setKeypadValue('');
  }

  const handleIncrementDecrement = (amount: number) => {
    const currentValue = parseFloat(keypadValue) || 0;
    let newValue = currentValue + amount;
    if (mode === 'quantity' && newValue < 1) {
        newValue = 1;
    }
    setKeypadValue(newValue.toString());
    if (shouldReplaceValue) {
      setShouldReplaceValue(false);
    }
  }
  
  const handleCloseKeypad = () => {
    setSelectedItem(null);
    setKeypadValue('');
  }

  const getTitle = () => {
    const saleForTitle = readOnlyOrder?.[0]?.sourceSale || currentSaleContext;
    const pieceNumber = saleForTitle?.ticketNumber;
    const pieceTypeText =
      saleForTitle?.documentType === 'invoice'
        ? 'Facture'
        : saleForTitle?.documentType === 'quote'
        ? 'Devis'
        : saleForTitle?.documentType === 'delivery_note'
        ? 'Bon de livraison'
        : 'Ticket';

    if (readOnlyOrder && pieceNumber) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-600">
            <History />
            <span>Consultation {pieceTypeText}</span>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>#{pieceNumber}</span>
            {saleForTitle.tableName && <span className="flex items-center gap-1"><Utensils className="h-3 w-3" />{saleForTitle.tableName}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /><ClientFormattedDate date={saleForTitle.date} formatString="d MMM yyyy" /></span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /><ClientFormattedDate date={saleForTitle.date} formatString="HH:mm" /></span>
            {saleForTitle.userName && <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" />{saleForTitle.userName}</span>}
          </div>
        </div>
      );
    }

    if (currentSaleId && pieceNumber) {
        return (
            <div className="flex flex-col gap-1">
                <div className='flex items-center gap-2 text-orange-600'>
                    <Edit />
                    <span>Modification {pieceTypeText}</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>#{pieceNumber}</span>
                    {currentSaleContext?.tableName && <span className="flex items-center gap-1"><Utensils className="h-3 w-3"/>{currentSaleContext.tableName}</span>}
                </div>
            </div>
        )
    }

    if (currentSaleContext?.isTableSale) {
        return (
            <div className="flex flex-col gap-1">
                <div className='flex items-center gap-2'>
                    <Utensils/>
                    <span>Ticket: {currentSaleContext.tableName}</span>
                </div>
                 <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                     <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {format(new Date(), 'd MMMM yyyy', {locale: fr})}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {format(new Date(), 'HH:mm')}</span>
                 </div>
            </div>
        )
    }
    if (selectedTable) {
        return (
             <div className='flex items-center gap-2'>
                <Utensils/>
                <span>Commande: {selectedTable.name}</span>
            </div>
        )
    }
    return (
        <div className='flex items-center gap-2'>
            <ShoppingCart/>
            <span>Commande Actuelle</span>
        </div>
    );
  }
  
    const { previousSale, nextSale } = useMemo(() => {
        if (!readOnlyOrder || !readOnlyOrder[0]?.sourceSale || !sales || sales.length === 0) {
            return { previousSale: null, nextSale: null };
        }
        const sortedSales = [...sales].sort((a, b) => {
            const dateA = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
            const dateB = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });

        const currentIndex = sortedSales.findIndex(s => s.id === readOnlyOrder[0].sourceSale!.id);
        if (currentIndex === -1) {
            return { previousSale: null, nextSale: null };
        }

        return {
            previousSale: currentIndex < sortedSales.length - 1 ? sortedSales[currentIndex + 1] : null,
            nextSale: currentIndex > 0 ? sortedSales[currentIndex - 1] : null,
        };
    }, [readOnlyOrder, sales]);

  const HeaderAction = () => {
      if (readOnlyOrder) {
        return (
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" disabled={!nextSale} onClick={() => nextSale && loadTicketForViewing(nextSale)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={!previousSale} onClick={() => previousSale && loadTicketForViewing(previousSale)}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/reports/${readOnlyOrder[0].sourceSale?.id}?from=pos`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Détails
                    </Link>
                </Button>
            </div>
        );
    }

    if (selectedTable) {
      if (order.length > 0) {
        return (
          <Button variant="ghost" size="sm" onClick={() => setOrder([])} className="text-destructive hover:text-destructive">
            Tout effacer
          </Button>
        );
      }
      return (
        <Button variant="outline" size="sm" onClick={() => saveTableOrderAndExit(selectedTable.id, order)} className="btn-back">
          <ArrowLeft />
          Retour
        </Button>
      );
    }

    if (order.length > 0) {
      return (
        <Button variant="ghost" size="sm" onClick={clearOrder} className="text-destructive hover:text-destructive">
          Tout effacer
        </Button>
      );
    }
    
    if (order.length === 0 && !selectedTable) {
        if (cameFromRestaurant) {
            return (
                <Button asChild variant="outline" size="sm" className="btn-back" onClick={() => setCameFromRestaurant(false)}>
                    <Link href="/restaurant">
                        <ArrowLeft />
                        Retour au restaurant
                    </Link>
                </Button>
            )
        }
        return (
            <Button asChild variant="outline" size="sm" className="btn-back">
                <Link href="/dashboard">
                    <ArrowLeft />
                    Tableau de bord
                </Link>
            </Button>
        )
    }

    return null;
  }

  const handleCloturer = () => {
    if(selectedTable) {
        promoteTableToTicket(selectedTable.id, order);
        setIsClosingTable(true);
    }
  }

  const handleEditTicket = () => {
    if (readOnlyOrder && readOnlyOrder[0].sourceSale) {
        const sale = readOnlyOrder[0].sourceSale;
        const itemsToEdit = readOnlyOrder.map(item => {
            const { sourceSale, ...rest } = item;
            return rest;
        });
        setOrder(itemsToEdit);
        setCurrentSaleId(sale.id);
        setCurrentSaleContext({ 
            ticketNumber: sale.ticketNumber,
            date: sale.date,
            userName: sale.userName,
            isTableSale: !!sale.tableId,
            tableName: sale.tableName,
            tableId: sale.tableId,
            payments: sale.payments,
            originalTotal: sale.total,
            originalPayments: sale.payments,
            change: sale.change,
        });
        setReadOnlyOrder(null);
    }
  };

  const handlePrint = () => {
    window.print();
  }

    const handleDuplicateTicket = () => {
        if (readOnlyOrder) {
            const itemsToDuplicate = readOnlyOrder.map(item => {
                const { sourceSale, ...rest } = item;
                return rest;
            });
            setOrder(itemsToDuplicate);
            setReadOnlyOrder(null);
            setCurrentSaleId(null);
            setCurrentSaleContext(null);
            toast({ title: 'Ticket dupliqué', description: 'La commande est prête pour un nouvel encaissement.' });
        } else if (currentSaleId) { // Duplicating an order being edited
             setReadOnlyOrder(null);
             setCurrentSaleId(null);
             setCurrentSaleContext(null);
             toast({ title: 'Commande dupliquée', description: 'La commande est prête pour un nouvel encaissement.' });
        }
    };
    
    const handleEditItemClick = (e?: React.MouseEvent, item?: OrderItem) => {
        e?.stopPropagation();
        const itemToProcess = item || selectedItem;
        if(!itemToProcess) return;
        const fullItem = allItems.find(i => i.id === itemToProcess.itemId);
        if (fullItem) {
            setItemToEdit(fullItem);
            setIsEditItemOpen(true);
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: "Détails de l'article introuvables." });
        }
    }


  const renderOrderItem = (item: OrderItem, isSelected: boolean) => (
    <div 
        ref={el => itemRefs.current[item.id] = el}
        className={cn(
          "flex items-start gap-4 transition-colors duration-300 group",
          !readOnlyOrder && "cursor-pointer",
          isSelected ? 'bg-accent/50' : 'bg-transparent',
          !readOnlyOrder && !isSelected && "hover:bg-secondary/50",
          showTicketImages ? 'p-4' : 'p-2'
        )}
        onClick={() => handleItemSelect(item)}
    >
        {showTicketImages && (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
              <Image
              src={item.image || 'https://picsum.photos/seed/item/100/100'}
              alt={item.name}
              fill
              className="object-cover"
              data-ai-hint="product image"
              />
          </div>
        )}
        <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                <p className="font-semibold pr-1">{item.name}</p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">Qté: {item.quantity}</span>
            </div>
            {descriptionDisplay === 'first' && item.description && (
              <p className="text-xs text-muted-foreground mt-1 pr-2 whitespace-pre-wrap">{item.description}</p>
            )}
            {descriptionDisplay === 'both' && (
                <>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 pr-2 whitespace-pre-wrap">{item.description}</p>}
                    {item.description2 && <p className="text-xs text-muted-foreground mt-1 pr-2 whitespace-pre-wrap">{item.description2}</p>}
                </>
            )}
            {item.selectedVariants && (
              <p className="text-xs text-muted-foreground capitalize">
                {item.selectedVariants.map(v => `${v.name}: ${v.value}`).join(', ')}
              </p>
            )}
            {item.note && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1 pr-2 whitespace-pre-wrap">Note: {item.note}</p>
            )}
            {item.serialNumbers && item.serialNumbers.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                S/N: {item.serialNumbers.filter(sn => sn).join(', ')}
              </div>
            )}
            {item.discount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="text-destructive font-semibold">
                    (-{item.discount.toFixed(2)}€ {item.discountPercent ? `(${item.discountPercent}%)` : ''})
                </span>
              </div>
            )}
        </div>
        <div className="text-right">
            <p className="font-bold">{item.total.toFixed(2)}€</p>
        </div>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-muted-foreground hover:text-destructive shrink-0", readOnlyOrder && "hidden")} onClick={(e) => {e.stopPropagation(); removeFromOrder(item.id)}}>
            <X className="h-4 w-4" />
        </Button>
    </div>
  );
  
  const backgroundColor = selectedTable 
    ? hexToRgba(restaurantModeBackgroundColor, restaurantModeBgOpacity)
    : hexToRgba(directSaleBackgroundColor, directSaleBgOpacity);

  const currentOrder = readOnlyOrder || order;

  return (
    <>
      <div className="flex h-full flex-col relative bg-card print-area">
        {enableDynamicBg && dynamicBgImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500 z-0"
              style={{ backgroundImage: `url(${dynamicBgImage})` }}
            />
            <div 
              className="absolute inset-0 bg-black backdrop-blur-sm z-0" 
              style={{ opacity: dynamicBgOpacity / 100 }}
            />
          </>
        )}
        <div 
          className="absolute inset-0 z-0"
          style={{ backgroundColor: isClient && !dynamicBgImage ? backgroundColor : 'transparent' }}
        />

        <div className="relative z-10 flex items-center justify-between p-2 border-b h-[64px] bg-card/80 backdrop-blur-sm no-print">
          <div className="text-lg font-bold tracking-tight font-headline flex-1">
             {getTitle()}
          </div>
          <HeaderAction />
        </div>

        {isKeypadOpen && selectedItem && (
          <div className="relative z-20 bg-secondary/95 backdrop-blur-sm border-b shadow-lg no-print">
              <div className="bg-accent/50">
                {renderOrderItem(selectedItem, true)}
              </div>
              <div className="p-4 space-y-3">
                   <div className="grid grid-cols-5 gap-2">
                      <Button variant={mode === 'quantity' ? 'default' : 'outline'} onClick={() => handleModeChange('quantity')}>Qté</Button>
                      <Button variant={mode === 'discountPercent' ? 'default' : 'outline'} onClick={() => handleModeChange('discountPercent')}>Remise %</Button>
                      <Button variant={mode === 'discountFixed' ? 'default' : 'outline'} onClick={() => handleModeChange('discountFixed')}>Remise €</Button>
                      <Button variant={mode === 'note' ? 'default' : 'outline'} onClick={() => handleModeChange('note')}>Note</Button>
                       {user?.role === 'admin' && (
                           <Button variant="outline" onClick={(e) => handleEditItemClick(e)}>
                               <Pencil className="h-4 w-4" />
                           </Button>
                       )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mode === 'note' ? (
                       <div className="relative w-full">
                         <Textarea 
                            ref={noteInputRef}
                            value={keypadValue}
                            onChange={handleNoteInputChange}
                            onFocus={(e) => e.target.select()}
                            className="h-20 flex-1 px-4 py-2 text-base font-sans bg-background/50"
                            placeholder='Note pour la cuisine, etc...'
                        />
                         <Button variant="ghost" size="icon" onClick={handleOpenVirtualKeyboardForNote} className="absolute right-1 bottom-1 h-8 w-8">
                            <KeyboardIcon className="h-5 w-5" />
                        </Button>
                       </div>
                    ) : (
                      <>
                        <Input 
                            ref={keypadInputRef}
                            type="text"
                            value={keypadValue}
                            onChange={handleDirectInputChange}
                            onFocus={(e) => e.target.select()}
                            className="h-12 flex-1 text-right px-4 text-3xl font-mono bg-background/50"
                        />
                      </>
                    )}
                  </div>

                  {mode !== 'note' && (
                    <div className="grid grid-cols-4 gap-2">
                        <KeypadButton onClick={() => handleKeypadInput('7')}>7</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('8')}>8</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('9')}>9</KeypadButton>
                        <Button variant="destructive" className="h-12" onClick={() => {
                            if (selectedItem) {
                                applyDiscount(selectedItem.id, 0, 'fixed');
                            }
                            setKeypadValue('');
                        }}>
                            <Eraser/>
                        </Button>
                        
                        <KeypadButton onClick={() => handleKeypadInput('4')}>4</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('5')}>5</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('6')}>6</KeypadButton>
                        <KeypadButton onClick={() => handleIncrementDecrement(1)}><Plus /></KeypadButton>

                        <KeypadButton onClick={() => handleKeypadInput('1')}>1</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('2')}>2</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('3')}>3</KeypadButton>
                        <KeypadButton onClick={() => handleIncrementDecrement(-1)}><Minus /></KeypadButton>
                        
                        <KeypadButton onClick={() => handleKeypadInput('C')} className="h-auto"><small>C</small></KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('0')} className="">0</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('.')} >.</KeypadButton>
                        <KeypadButton onClick={() => handleKeypadInput('del')}><Delete /></KeypadButton>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                      <Button
                          variant="outline"
                          className="h-12 text-lg"
                          onClick={() => selectedItem && setSerialNumberItem({ item: selectedItem, quantity: selectedItem.quantity })}
                      >
                          <ScanLine />
                      </Button>
                      <Button className="h-12 text-lg col-span-2" onClick={handleApply}>
                        <Check className="mr-2" /> Valider
                      </Button>
                      <Button variant="ghost" className="h-12" onClick={handleCloseKeypad}>
                          <X />
                      </Button>
                  </div>
              </div>
          </div>
        )}

        <ScrollArea className="flex-1 relative z-10" viewportRef={scrollAreaRef}>
          {currentOrder.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center text-muted-foreground space-y-4 bg-background/70 p-6 rounded-lg backdrop-blur-sm">
                <p>Aucun article dans la commande.</p>
                <Separator />
                <p className="text-sm">Consulter un ticket récent :</p>
                <div className="flex flex-col gap-2">
                    {selectedTable || cameFromRestaurant ? (
                        lastRestaurantSale && (
                            <Button variant="outline" onClick={() => loadTicketForViewing(lastRestaurantSale)}>
                                Dernier ticket (Restaurant)
                            </Button>
                        )
                    ) : (
                        lastDirectSale && (
                            <Button variant="outline" onClick={() => loadTicketForViewing(lastDirectSale)}>
                                Dernier ticket (Vente directe)
                            </Button>
                        )
                    )}
                    {!selectedTable && !cameFromRestaurant && !lastDirectSale && <p className="text-xs text-muted-foreground">(Aucun ticket récent trouvé)</p>}
                    {(selectedTable || cameFromRestaurant) && !lastRestaurantSale && <p className="text-xs text-muted-foreground">(Aucun ticket récent trouvé)</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("divide-y", (enableDynamicBg && dynamicBgImage) && "text-white")}>
                {currentOrder.map((item) => (
                  <div key={item.id} className={cn("bg-background/10 backdrop-blur-sm", isKeypadOpen && selectedItem?.id === item.id && 'opacity-0 h-0 overflow-hidden')}>
                      {renderOrderItem(item, false)}
                  </div>
                ))}
              </div>
          )}
        </ScrollArea>

        <div className="relative z-10 mt-auto border-t p-4 bg-card/80 backdrop-blur-sm">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{orderTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                <span>TVA</span>
                <span>{orderTax.toFixed(2)}€</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                <span>Total (TTC)</span>
                <span>{(orderTotal + orderTax).toFixed(2)}€</span>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center gap-2 no-print">
              {readOnlyOrder ? (
                <>
                    {readOnlyOrder[0]?.sourceSale && !readOnlyOrder[0].sourceSale.modifiedAt ? (
                        <Button size="lg" className="flex-1" onClick={handleEditTicket}>
                            <Edit className="mr-2" />
                            Modifier
                        </Button>
                    ) : (
                        <Button size="lg" className="flex-1" onClick={handleDuplicateTicket}>
                            <Copy className="mr-2" />
                            Dupliquer
                        </Button>
                    )}
                    <Button size="lg" className="flex-1" onClick={handlePrint}>
                        <Printer className="mr-2" />
                        Imprimer
                    </Button>
                    <Button size="lg" className="flex-1" onClick={() => clearOrder()}>
                        Nouveau
                    </Button>
                </>
              ) : selectedTable && selectedTable.id !== 'takeaway' && !isClosingTable ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={() => saveTableOrderAndExit(selectedTable.id, order)}
                  >
                      <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={handleCloturer}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Clôturer
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={currentSaleId ? handleDuplicateTicket : holdOrder}
                  >
                    {currentSaleId ? (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Dupliquer
                        </>
                    ) : (
                        <>
                          <Hand className="mr-2 h-4 w-4" />
                          Mettre en attente
                        </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={order.length === 0 || isKeypadOpen}
                    onClick={() => setCheckoutOpen(true)}
                  >
                    Payer maintenant
                  </Button>
                </>
              )}
            </div>
        </div>
      </div>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalAmount={orderTotal + orderTax}
      />
      {isEditItemOpen && itemToEdit && (
        <EditItemDialog
            item={itemToEdit}
            isOpen={isEditItemOpen}
            onClose={() => {
                setIsEditItemOpen(false);
                setItemToEdit(null);
            }}
            onItemUpdated={(updatedItem) => {
                updateOrderItem(updatedItem);
            }}
        />
    )}
    </>
  );
}

