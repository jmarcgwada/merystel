
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
import { X, Mail, Edit, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';


type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const customer = useMemo(() => {
    if (!sale || !customers) return null;
    return customers.find(c => c.id === sale.customerId);
  }, [sale, customers]);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 600, height: 650 });
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
      const initialHeight = 650;
      setModalSize({ width: initialWidth, height: initialHeight });
      setModalPosition({ 
          x: (window.innerWidth - initialWidth) / 2,
          y: (window.innerHeight - initialHeight) / 2,
      });
  }, []);

  useEffect(() => {
    if (isOpen) {
        initializeModalState();
    }
  }, [isOpen, initializeModalState]);

  useEffect(() => {
    if (sale && customer) {
      setEmailToSend(customer.email || '');
      
      const totalDue = sale.total - (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);

      if (dunningMode) {
        setEmailSubject(`Rappel pour votre facture impayée #${sale.ticketNumber}`);
        setEmailBody(
          `Bonjour ${customer.name || 'client(e)'},\n\n` +
          `Sauf erreur de notre part, il semble que votre facture n°${sale.ticketNumber} d'un montant de ${totalDue.toFixed(2)}€, datée du ${new Date(sale.date as any).toLocaleDateString('fr-FR')}, soit toujours en attente de règlement.\n\n` +
          `Vous trouverez la facture en pièce jointe pour votre référence.\n\n` +
          `Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.\n\n` +
          `Nous restons à votre disposition pour toute question.\n\n` +
          `Cordialement,\nL'équipe de ${companyInfo?.name || 'votre entreprise'}`
        );
      } else {
        setEmailSubject(`Votre ${pieceType} #${sale.ticketNumber}`);
        setEmailBody(
          `Bonjour ${customer.name || 'client(e)'},\n\n` +
          `Veuillez trouver ci-joint votre ${pieceType} n°${sale.ticketNumber}.\n\n` +
          `Nous restons à votre disposition pour toute question.\n\n` +
          `Cordialement,\nL'équipe de ${companyInfo?.name || 'votre entreprise'}`
        );
      }
    }
  }, [sale, customer, dunningMode, companyInfo, pieceType]);

  const generatePdfForEmail = useCallback(async (saleForPdf: Sale): Promise<{ content: string; filename: string } | null> => {
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
    return {
      content: pdfDataString.split(',')[1],
      filename: `${saleForPdf.documentType}-${saleForPdf.ticketNumber || 'document'}.pdf`,
    };
  }, [toast]);
  
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

    const pdfData = await generatePdfForEmail(sale);
    if (!pdfData) {
        setIsSending(false);
        return;
    }

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
        attachments: pdfData ? [{ filename: pdfData.filename, content: pdfData.content, encoding: 'base64' }] : undefined,
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

  const openEditCustomerModal = () => {
    if (customer) {
      setIsEditCustomerOpen(true);
    }
  };
  
    // Drag and Resize handlers
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
                <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
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
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-muted/50">
              <Button variant="ghost" onClick={onClose}>Annuler</Button>
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
    </>
  );
}
