'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePos } from '@/contexts/pos-context';
import type { Sale, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from './invoice-print-template';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { X, Mail, Edit, Send, File, Upload, Trash2, Link as LinkIcon, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DocumentSelectionDialog } from './document-selection-dialog';


type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  encoding: 'base64';
}

interface EmailSenderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  dunningMode?: boolean;
  onSend?: (notes?: string) => void;
}

export function EmailSenderDialog({
  isOpen,
  onClose,
  sale,
  dunningMode = false,
  onSend,
}: EmailSenderDialogProps) {
  const { customers, companyInfo, smtpConfig, vatRates, updateSale } = usePos();
  const { toast } = useToast();
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailToSend, setEmailToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDocSelectionOpen, setIsDocSelectionOpen] = useState(false);

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const customer = useMemo(() => {
    if (!sale || !customers) return null;
    return customers.find(c => c.id === sale.customerId);
  }, [sale, customers]);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 600, height: 750 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, direction: '' as ResizeDirection });
  const modalRef = useRef<HTMLDivElement>(null);
  
  const pieceType = sale?.documentType === 'invoice' ? 'facture'
                  : sale?.documentType === 'quote' ? 'devis'
                  : sale?.documentType === 'delivery_note' ? 'bon de livraison'
                  : sale?.documentType === 'credit_note' ? 'avoir'
                  : 'document';
  
  const initializeModalState = useCallback(() => {
      const initialWidth = 600;
      const initialHeight = 750;
      setModalSize({ width: initialWidth, height: initialHeight });
      setModalPosition({ 
          x: (window.innerWidth - initialWidth) / 2,
          y: (window.innerHeight - initialHeight) / 2,
      });
  }, []);

  const generatePdfForEmail = useCallback(async (saleForPdf: Sale): Promise<Attachment | null> => {
    if (!printRef.current || !saleForPdf) {
      toast({ variant: 'destructive', title: "Erreur de génération PDF" });
      return null;
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printRef.current, {
      autoPaging: 'text',
      width: 210,
      windowWidth: printRef.current.scrollWidth,
    });
    const pdfDataString = pdf.output('datauristring');
    const filename = `${pieceType}-${saleForPdf.ticketNumber || 'document'}.pdf`.replace(/ /g, '_');
    return {
      content: pdfDataString.split(',')[1],
      filename: filename,
      encoding: 'base64',
    };
  }, [toast, pieceType]);
  
  const handleDocumentSelected = useCallback(async (selectedSale: Sale) => {
    setIsDocSelectionOpen(false);
    toast({ title: 'Génération du PDF en cours...'});

    const pdfAttachment = await generatePdfForEmail(selectedSale);
    if(pdfAttachment) {
        setAttachments(prev => [...prev, pdfAttachment]);
        toast({ title: 'Pièce jointe ajoutée !' });
    }
  }, [generatePdfForEmail, toast]);


  useEffect(() => {
    if (isOpen) {
        initializeModalState();
        if (sale) {
            generatePdfForEmail(sale).then(pdfAttachment => {
                if(pdfAttachment) {
                    setAttachments([pdfAttachment]);
                }
            });
        }
    } else {
        setAttachments([]); // Clear attachments when closing
    }
  }, [isOpen, initializeModalState, sale, generatePdfForEmail]);

  useEffect(() => {
    if (sale && customer) {
      setEmailToSend(customer.email || '');
      
      const totalDue = sale.total - (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const companySignature = `\n\nCordialement,\nL'équipe de ${companyInfo?.name || 'votre entreprise'}\n${companyInfo?.address || ''}\n${companyInfo?.postalCode || ''} ${companyInfo?.city || ''}\n${companyInfo?.phone || ''}\n${companyInfo?.email || ''}`;

      if (dunningMode) {
        setEmailSubject(`Rappel pour votre facture impayée #${sale.ticketNumber}`);
        setEmailBody(
          `Bonjour ${customer.name || 'client(e)'},\n\n` +
          `Sauf erreur de notre part, il semble que votre facture n°${sale.ticketNumber} d'un montant de ${totalDue.toFixed(2)}€, datée du ${new Date(sale.date as any).toLocaleDateString('fr-FR')}, soit toujours en attente de règlement.\n\n` +
          `Vous trouverez la facture en pièce jointe pour votre référence.\n\n` +
          `Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.` +
          companySignature
        );
      } else {
        setEmailSubject(`Votre ${pieceType} #${sale.ticketNumber}`);
        setEmailBody(
          `Bonjour ${customer.name || 'client(e)'},\n\n` +
          `Veuillez trouver ci-joint votre ${pieceType} n°${sale.ticketNumber}.` +
          companySignature
        );
      }
    }
  }, [sale, customer, dunningMode, companyInfo, pieceType]);

  
  const handleSendEmail = async () => {
    if (!sale || !smtpConfig?.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password || !smtpConfig.senderEmail) {
      toast({ 
        variant: 'destructive', 
        title: 'Configuration SMTP requise', 
        description: 'Veuillez configurer les paramètres SMTP avant d\'envoyer des e-mails.',
        action: <Button variant="secondary" size="sm" asChild><Link href="/settings/connectivity">Configurer</Link></Button>
      });
      return;
    }
    if (!emailToSend) {
      toast({ variant: 'destructive', title: 'Email manquant', description: 'Veuillez renseigner l\'adresse e-mail du client.' });
      return;
    }
    
    setIsSending(true);
    toast({ title: 'Envoi en cours...' });

    const emailResult = await sendEmail({
        smtpConfig: {
            host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure || false,
            auth: { user: smtpConfig.user, pass: smtpConfig.password },
            senderEmail: smtpConfig.senderEmail,
        },
        to: emailToSend,
        subject: emailSubject,
        text: emailBody,
        html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
        attachments: attachments,
    });

    toast({
        variant: emailResult.success ? 'default' : 'destructive',
        title: emailResult.success ? 'E-mail envoyé !' : "Échec de l'envoi",
        description: emailResult.message,
    });
    setIsSending(false);
    if (emailResult.success && onSend) {
      onSend(emailBody);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64Content = (loadEvent.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          content: base64Content,
          encoding: 'base64'
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const openEditCustomerModal = () => {
    if (customer) {
      setIsEditCustomerOpen(true);
    }
  };
  
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y,
        });
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: modalSize.width,
      height: modalSize.height,
      direction: direction,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
        setModalPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    } else if(isResizing) {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = modalPosition.x;
      let newY = modalPosition.y;

      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      
      if (resizeStart.direction.includes('e')) newWidth = resizeStart.width + dx;
      if (resizeStart.direction.includes('w')) {
          newWidth = resizeStart.width - dx;
          newX = modalPosition.x + dx;
      }
      if (resizeStart.direction.includes('s')) newHeight = resizeStart.height + dy;
      if (resizeStart.direction.includes('n')) {
          newHeight = resizeStart.height - dy;
          newY = modalPosition.y + dy;
      }

      if (newWidth < 400) newWidth = 400;
      if (newHeight < 300) newHeight = 300;

      setModalSize({ width: newWidth, height: newHeight });
       if (resizeStart.direction.includes('w') || resizeStart.direction.includes('n')) {
            setModalPosition({ x: newX, y: newY });
        }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, modalPosition.x, modalPosition.y]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleCloseAndReset = () => {
    onClose();
  };
  
   const handleClickOutside = useCallback((e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Do not close on outside click
    }
   }, []);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, handleClickOutside]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  const resizeHandles: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  const getResizeHandleClass = (dir: ResizeDirection) => {
    switch (dir) {
      case 'n': return 'cursor-n-resize top-0 h-2 inset-x-2';
      case 's': return 'cursor-s-resize bottom-0 h-2 inset-x-2';
      case 'e': return 'cursor-e-resize right-0 w-2 inset-y-2';
      case 'w': return 'cursor-w-resize left-0 w-2 inset-y-2';
      case 'ne': return 'cursor-ne-resize top-0 right-0 h-3 w-3';
      case 'nw': return 'cursor-nw-resize top-0 left-0 h-3 w-3';
      case 'se': return 'cursor-se-resize bottom-0 right-0 h-3 w-3';
      case 'sw': return 'cursor-sw-resize bottom-0 left-0 h-3 w-3';
    }
  };

  const [isVisible, setIsVisible] = useState(false);
   useEffect(() => {
    if(isOpen) {
        setIsVisible(true);
    } else {
        setIsVisible(false);
    }
  }, [isOpen]);
  
  if (!isOpen || !sale) return null;

  return (
    <>
       <div className="absolute -left-[9999px] -top-[9999px]">
        {sale && vatRates && <InvoicePrintTemplate ref={printRef} sale={sale} customer={customer} companyInfo={companyInfo} vatRates={vatRates} />}
      </div>
      <div className="fixed inset-0 z-50 bg-black/80">
          <div
            ref={modalRef}
            style={{
                width: `${modalSize.width}px`,
                height: `${modalSize.height}px`,
                top: `${modalPosition.y}px`,
                left: `${modalPosition.x}px`,
                position: 'fixed',
            }}
            className="z-50 flex flex-col rounded-lg border bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
                data-drag-handle
                onMouseDown={handleDragStart}
                className={cn(
                    "flex items-center justify-between p-4 bg-muted/50 border-b cursor-grab",
                    isDragging && "cursor-grabbing"
                )}
            >
                <h2 className="font-semibold leading-none tracking-tight">
                  Envoyer {pieceType} - {sale.ticketNumber}
                </h2>
                <button onClick={handleCloseAndReset} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fermer</span>
                </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                    <Label htmlFor="email-to">Destinataire</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                          id="email-to" 
                          value={emailToSend} 
                          onChange={(e) => setEmailToSend(e.target.value)}
                          placeholder={customer ? "Email manquant" : "Aucun client associé"}
                        />
                        {customer && (
                          <Button variant="outline" size="sm" onClick={openEditCustomerModal}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </Button>
                        )}
                   </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-subject">Sujet</Label>
                    <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="email-body">Message</Label>
                    <Textarea
                        id="email-body"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={8}
                        className="flex-1"
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Pièces jointes</Label>
                    <div className="space-y-2">
                        {attachments.map((att, index) => (
                           <Badge key={index} variant="secondary" className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                {att.filename}
                             </div>
                             <button onClick={() => removeAttachment(index)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                 <X className="h-3 w-3" />
                             </button>
                           </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Joindre un fichier local
                        </Button>
                         <Button variant="outline" size="sm" onClick={() => setIsDocSelectionOpen(true)}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Joindre une pièce de l'application
                        </Button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-muted/50">
              <Button variant="ghost" onClick={handleCloseAndReset}>Annuler</Button>
              <Button onClick={handleSendEmail} disabled={isSending}>
                <Send className="mr-2 h-4 w-4" /> {isSending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
            {resizeHandles.map(dir => (
              <div
                  key={dir}
                  data-resize-handle
                  onMouseDown={(e) => handleResizeStart(e, dir)}
                  className={cn('absolute z-10', getResizeHandleClass(dir))}
              />
            ))}
          </div>
      </div>
      <EditCustomerDialog 
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customer}
      />
      <DocumentSelectionDialog
        isOpen={isDocSelectionOpen}
        onClose={() => setIsDocSelectionOpen(false)}
        onDocumentSelected={handleDocumentSelected}
      />
    </>
  );
}
